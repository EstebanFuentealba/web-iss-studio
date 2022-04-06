<template>
  <div>
    <strong>Open ROM</strong><br /><br />
    <input type="file" id="rom" @change="onChangeFile" />
  </div>
  <br />
  <br />
  <div ref="preview">
    <button type="button" @click="prev">Prev</button>
    {{ teamName }} (<i>{{ team?.name }}</i
    >)
    <button type="button" @click="next">Next</button>
    <div v-if="rgbs.length > 0" class="flex flex-row">
      <div class="mr-4">
        <span class="font-bold">Team Data</span>
        <div class="flag flex flex-col">
          <div
            v-for="(row, index) in matrix"
            :key="`row-${index}`"
            class="flex flex-row"
          >
            <div
              v-for="(col, index) in row"
              :key="`col-${index}`"
              class="square"
              :style="{
                backgroundColor: rgbs[0][col]?.toHex(),
              }"
            ></div>
          </div>
        </div>
        <br /><br />
        <div class="flag flex flex-col">
          <div
            v-for="(row, index) in teamMatrix"
            :key="`row-${index}`"
            class="flex flex-row"
          >
            <div
              v-for="(col, index) in row"
              :key="`col-${index}`"
              class="square"
              :data-dev="col"
              :style="{
                backgroundColor: new TeamNameTilesColor(
                  TeamNameTilesColor.getColors()[col]
                ).toHex(),
              }"
            ></div>
          </div>
        </div>
        <br /><br />

        <div class="flex flex-row">
          <div
            v-for="(color, index) in Object.keys(rgbs[0])"
            :key="`color-${index}`"
            class="color-block"
            :style="{
              backgroundColor: rgbs[0][color]?.toHex(),
            }"
          >
            {{ color }}
          </div>
        </div>
      </div>
      <div class="ml-4">
        <span>Players</span>
        <pre>{{ JSON.stringify(players, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
<script>
import { chunk } from "../utils/index";
import Game from "../models/Game";
import Team from "../models/Team";
import FlagSnes4bpp from "../models/tiles/FlagSnes4bpp";
import FlagColorRomHandler from "../models/FlagColorRomHandler";
import FlagDesignRomHandler from "../handlers/FlagDesignRomHandler";
import { Color as FlagDesignColor } from "../models/tiles/FlagDesign";
import { Color as TeamNameTilesColor } from "../models/tiles/TeamNameTiles";
import TeamNameRomHandler from "../handlers/TeamNameRomHandler";
import TeamNameTextRomHandler from "../handlers/texts/TeamNameTextRomHandler";
import TeamNameTilesRomHandler from "../handlers/TeamNameTilesRomHandler";
import PlayerNameRomHandler from "../handlers/texts/PlayerNameRomHandler";
import PlayerNumberRomHandler from "../handlers/texts/PlayerNumberRomHandler";
import PlayerColorRomHandler from "../handlers/texts/PlayerColorRomHandler";
import HairStyleRomHandler from "../handlers/texts/HairStyleRomHandler";
import AbilitiesRomHandler from "../handlers/texts/AbilitiesRomHandler";
import Storage from "../utils/Storage";
import HairStyle from "../models/HairStyle";
export default {
  data() {
    return {
      TeamNameTilesColor,
      offsetTop: "0x483e4",
      offsetBottom: "0x4841a",
      rom: null,
      matrix: [],
      teamMatrix: [],
      players: [],
      teamName: "",
      rgbs: [],
      team: new Team(Team.GERMANY),
      storage: new Storage(),
    };
  },
  mounted() {
    setTimeout(() => {
      this.storage.init(() => {
        this.storage.get(async (rom) => {
          if (rom) {
            this.rom = await this.$core.f(rom);
            // this.findFlag();
            // return;
            this.renderFlag();
            this.renderTeamName();
            this.renderTeamPlayers();
          }
        });
      });
    }, 500);
  },
  methods: {
    async findFlag() {
      console.log("findFlag start");
      for (let offset = 0; offset < this.rom.length; offset++) {
        let bytes = await this.$core.d(`0x${offset.toString(16)}`);
        if (
          bytes.byteLength == 96 &&
          bytes.filter((byte) => byte == 0x00).length != 96
        ) {
          console.log("finded", `0x${offset.toString(16)}`, bytes);
        }
      }
    },
    prev() {
      this.team = this.team.previous();
      this.renderFlag();
      this.renderTeamName();
      this.renderTeamPlayers();
    },
    next() {
      this.team = this.team.next();
      this.renderFlag();
      this.renderTeamName();
      this.renderTeamPlayers();
    },
    async renderTeamPlayers() {
      let names = new PlayerNameRomHandler(this.rom).readFromRomAt(this.team);
      let numbers = new PlayerNumberRomHandler(this.rom).readFromRomAt(
        this.team
      );
      let colors = new PlayerColorRomHandler(this.rom).readFromRomAt(this.team);
      let hairs = new HairStyleRomHandler(this.rom).readFromRomAt(this.team);
      //  TODO:
      let abilities = new AbilitiesRomHandler(this.rom).readFromRomAt(
        this.team
      );
      this.players = names.reduce((acc, curr, index) => {
          if (hairs[index].text == HairStyle.DREADLOCKS) {
            alert("encontrado " + curr);
          }
          acc.push({
            name: curr,
            no: numbers[index],
            color: colors[index],
            hair: hairs[index].text,
          });
          return acc;
        }, []);
    },
    async renderTeamName() {
      let handler2 = new TeamNameTextRomHandler(this.rom);
      this.teamName = handler2.readFromRomAt(this.team).toString();
      let teamMatrix = await new TeamNameTilesRomHandler(
        this.rom,
        this.$core.d
      ).readFromRomAt(this.team);
      this.teamMatrix = teamMatrix.getMatrix();
    },
    async renderFlag() {
      this.rgbs = new FlagColorRomHandler(this.rom, Game.ISS)
        .readFromRomAt(this.team)
        .getRgbs();
      this.matrix = (
        await new FlagDesignRomHandler(this.rom, this.$core.d).readFromRomAt(
          this.team
        )
      ).getMatrix();
    },
    async onChangeFile({ target: { files } }) {
      this.rom = await this.$core.f(files[0]);
      this.storage.set(files[0]);
      this.renderFlag();
      this.renderTeamName();
    },
    readFlagPart(fileIn) {
      let colors = this.bytesToMatrix(fileIn);
      return colors;
    },
    bytesToMatrix(bytes) {
      let tileData = [];
      let tileInputArray = [];
      let matrix = new Array(8).fill(new Array());
      let binString = "";
      let byte1 = 0,
        byte2 = 0,
        byte17 = 0,
        byte18 = 0;

      for (let startBlock = 0; startBlock <= 64; startBlock += 32) {
        for (
          let start = startBlock, bytesRead = 0;
          start < startBlock + 32;
          start++, bytesRead++
        ) {
          tileInputArray[bytesRead] = bytes.slice(start, start + 1);
          for (let k = 0; k <= 7; k++) {
            byte1 = tileInputArray[k * 2];
            byte2 = tileInputArray[k * 2 + 1];
            byte17 = tileInputArray[k * 2 + 16];
            byte18 = tileInputArray[k * 2 + 17];

            for (let l = 0; l <= 7; l++) {
              binString = "";

              if ((new Uint8Array(byte18) & (1 << l)) != 0) {
                binString = binString + "1";
              } else {
                binString = binString + "0";
              }
              if ((new Uint8Array(byte17) & (1 << l)) != 0) {
                binString = binString + "1";
              } else {
                binString = binString + "0";
              }
              if ((new Uint8Array(byte2) & (1 << l)) != 0) {
                binString = binString + "1";
              } else {
                binString = binString + "0";
              }
              if ((new Uint8Array(byte1) & (1 << l)) != 0) {
                binString = binString + "1";
              } else {
                binString = binString + "0";
              }
              let outputBitString = parseInt(binString, 2);
              tileData[k * 8 + l] = FlagDesignColor.forCode(
                parseInt(outputBitString.toString(10))
              );
            }
          }
        }

        let chunks = chunk(tileData, 8);
        chunks.forEach((row, rowIndex) => {
          matrix[rowIndex] = row.concat(matrix[rowIndex]);
        });
      }

      return matrix.map((row) => {
        return row.reverse();
      });
    },
    async getFlagPart(offset) {
      let decompFile = await this.$core.d(offset);
      return {
        part: this.readFlagPart(decompFile),
        decompFile,
      };
    },
    async decompress() {
      let { part: flagTop } = await this.getFlagPart(this.offsetTop);
      let { part: flagBottom } = await this.getFlagPart(this.offsetBottom);
      let matrix = new FlagSnes4bpp(flagTop, flagBottom).getMatrix();
      let rgbs = new FlagColorRomHandler(this.rom, Game.ISS)
        .readFromRomAt(this.team)
        .getRgbs();

      this.$refs.preview.innerHTML = `<div class="flag flex flex-col">${matrix
        .map((row) => {
          return `<div class="flex flex-row">${row
            .map((col) => {
              let color = rgbs[0][col];
              if (color) {
                return `<div class="square" style="background-color: ${color.toHex()}"></div>`;
              }
              return `<div class="square"></div>`;
            })
            .join(" ")}</div>
            `;
        })
        .join("\n")}</div>
        <br /><br />
            <div class="flex flex-row">${Object.keys(rgbs[0])
              .map((key) => {
                return `<div class="color-block" style="background-color: ${rgbs[0][
                  key
                ].toHex()};">${key}</div>`;
              })
              .join("")}</div>`;
    },
  },
};
</script>
<style lang="css">
.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}
.flex-row {
  flex-direction: row;
}
.color-block {
  border: 1px solid #eee;
  margin-right: 5px;
  color: white;
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  font-size: 10px;
}
.square {
  width: 10px;
  height: 10px;
  font-size: 8px;
}
.flag {
  width: 240px;
  border: 1px solid #eee;
}
.ml-4 {
margin-left: 1rem;
}
.mr-4 {
margin-right: 1rem;
}
</style>
