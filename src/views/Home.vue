<template>
  <div>
    <strong>Decompress</strong>
    <input type="file" id="rom" @change="onChangeFile" />
    <input
      v-model="offsetTop"
      type="text"
      id="offsetTop"
      placeholder="Top Offset"
    />
    <input
      v-model="offsetBottom"
      type="text"
      id="offsetBottom"
      placeholder="Bottom Offset"
    />

    <button id="decompressBtn" @click="decompress">Decompress</button>
    <button type="button" id="download" disabled>Download</button>
    <div id="preview"></div>
  </div>
  <br /><br />
  <div>
    <strong>Compress</strong>
    <input type="file" id="fileCompress" />
    <button id="compressBtn">Compress</button>
  </div>
  <br />
  <div ref="preview">
    <button type="button" @click="prev">Prev</button>
    {{ teamName }} (<i>{{ team?.name }}</i
    >)
    <button type="button" @click="next">Next</button>
    <div v-if="rgbs.length > 0">
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
import PlayerColorRomHandler from '../handlers/texts/PlayerColorRomHandler'
import HairStyleRomHandler from '../handlers/texts/HairStyleRomHandler'
import Storage from "../utils/Storage";
export default {
  data() {
    return {
      TeamNameTilesColor,
      offsetTop: "0x483e4",
      offsetBottom: "0x4841a",
      rom: null,
      matrix: [],
      teamMatrix: [],
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
            this.renderFlag();
            this.renderTeamName();
            this.renderTeamPlayers();
          }
        });
      });
    }, 500);
  },
  methods: {
    prev() {
      this.team = this.team.previous();
      this.renderFlag();
      this.renderTeamName();
    },
    next() {
      this.team = this.team.next();
      this.renderFlag();
      this.renderTeamName();
    },
    async renderTeamPlayers() {
      // new PlayerBasicRomHandler(new PlayerNameRomHandler(rom), new PlayerNumberRomHandler(rom), new PlayerColorRomHandler(rom), new HairStyleRomHandler(rom));
      let handler = new PlayerNameRomHandler(this.rom);
      console.log(
        handler.readFromRomAt(this.team),
        new PlayerNumberRomHandler(this.rom).readFromRomAt(this.team),
        new PlayerColorRomHandler(this.rom).readFromRomAt(this.team),
        new HairStyleRomHandler(this.rom).readFromRomAt(this.team)
      );
    },
    async renderTeamName() {
      //   let handler = new TeamNameTilesRomHandler(this.rom, this.$core.d);
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
      console.log("rom", this.rom);
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
      console.log({ rgbs });

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
      //   if (result == 0) {
      //     console.log("OK");
      //     downloads.push(
      //       URL.createObjectURL(new Blob([FS.readFile("decomp.bin")]))
      //     );
      //     flagTop = readFlagPart(FS.readFile("decomp.bin"));
      //   }
      //   result = decompress(document.getElementById("offsetBottom").value);
      //   if (result == 0) {
      //     downloads.push(
      //       URL.createObjectURL(new Blob([FS.readFile("decomp.bin")]))
      //     );
      //     flagBottom = readFlagPart(FS.readFile("decomp.bin"));
      //   }
      //   document.getElementById("download").removeAttribute("disabled");
      //   let matrix = flagTop.concat(flagBottom);

      //   let rgbs = new FlagColorRomHandler(rom, Game.ISS)
      //     .readFromRomAt(Team.ITALY)
      //     .getRgbs();
    },
  },
};

/*
C:\Users\KoalaWin\Downloads\rodmguerra-iss-studio-1.6-beta-jarfile>java -jar rodmguerra-iss-studio-1.6-beta.jar
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48000 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4800f 1
Reading colors of flag 01. Germany
[01. Germany, 03. Holland, 14. Austria, 18. Russia]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x483e4 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4841a 1
Reading colors of flag 02. Italy
[02. Italy, 13. Belgium]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48000 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4800f 1
Reading colors of flag 03. Holland
[01. Germany, 03. Holland, 14. Austria, 18. Russia]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4803f 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4805c 1
Reading colors of flag 04. Spain
[04. Spain]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48075 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4808b 1
Reading colors of flag 05. England
[05. England, 09. Denmark, 10. Sweden, 11. Norway]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x481f6 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4822b 1
Reading colors of flag 06. Scotland
[06. Scotland]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48387 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x483b6 1
Reading colors of flag 07. Wales
[07. Wales]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4801b 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4802d 1
Reading colors of flag 08. France
[08. France, 12. Ireland]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48075 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4808b 1
Reading colors of flag 09. Denmark
[05. England, 09. Denmark, 10. Sweden, 11. Norway]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48075 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4808b 1
Reading colors of flag 10. Sweden
[05. England, 09. Denmark, 10. Sweden, 11. Norway]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48075 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4808b 1
Reading colors of flag 11. Norway
[05. England, 09. Denmark, 10. Sweden, 11. Norway]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4801b 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4802d 1
Reading colors of flag 12. Ireland
[08. France, 12. Ireland]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x483e4 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4841a 1
Reading colors of flag 13. Belgium
[02. Italy, 13. Belgium]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48000 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4800f 1
Reading colors of flag 14. Austria
[01. Germany, 03. Holland, 14. Austria, 18. Russia]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48316 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48339 1
Reading colors of flag 15. Switz
[15. Switz]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4835d 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48371 1
Reading colors of flag 16. Romania
[16. Romania]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x481cf 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x481e6 1
Reading colors of flag 17. Bulgaria
[17. Bulgaria]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48000 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4800f 1
Reading colors of flag 18. Russia
[01. Germany, 03. Holland, 14. Austria, 18. Russia]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48108 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4811d 1
Reading colors of flag 19. Argentina
[19. Argentina]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x480ba 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x480e1 1
Reading colors of flag 20. Brazil
[20. Brazil]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4809e 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x480aa 1
Reading colors of flag 21. Colombia
[21. Colombia]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48131 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48145 1
Reading colors of flag 22. Mexico
[22. Mexico]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48188 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x481a2 1
Reading colors of flag 23. U.S.A.
[23. U.S.A.]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x481af 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x481bf 1
Reading colors of flag 24. Nigeria
[24. Nigeria]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4815a 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x4816f 1
Reading colors of flag 25. Cameroon
[25. Cameroon]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48261 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x48285 1
Reading colors of flag 26. S.Korea
[26. S.Korea]
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x482ad 1
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x482e2 1
Reading colors of flag 27. Super Star
  */

/*

C:\Users\KoalaWin\Downloads\rodmguerra-iss-studio-1.6-beta-jarfile>java -jar rodmguerra-iss-studio-1.6-beta.jar
44027
01. Germany name text on address 44027
0E F9 14 F8 06 F1 14 E8 06 F9 0C DD 06 F1 0C CD 06 F9 04 D0 06 F1 04 C0 06 F9 FD DC 06 F1 FD CC 06 F9 F4 F1 06 F1 F4 E1 06 F9 EC D4 06 F1 EC C4 06 F9 E4 D6 06 F1 E4 C6 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17680 1
44060
02. Italy name text on address 44060
0B F9 E6 D2 06 F1 E6 C2 06 F9 ED FA 06 F9 F7 D2 06 F1 F7 C2 06 F9 00 DE 06 F1 00 CE 06 F9 09 DB 06 F1 09 CB 06 F9 12 DE 06 F1 12 CE 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x176c0 1
4408d
03. Holland name text on address 4408d
0E F9 14 D3 06 F1 14 C3 06 F9 0C DD 06 F1 0C CD 06 F9 04 D0 06 F1 04 C0 06 F9 FC DB 06 F1 FC CB 06 F9 F4 DB 06 F1 F4 CB 06 F9 EC DE 06 F1 EC CE 06 F9 E4 D7 06 F1 E4 C7 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17704 1
440c6
04. Spain name text on address 440c6
0A F9 0C DD 06 F1 0C CD 06 F9 05 D8 06 F1 05 C8 06 F9 FD D0 06 F1 FD C0 06 F9 F5 DF 06 F1 F5 CF 06 F9 EC F2 06 F1 EC E2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17740 1
441b7
05. England name text on address 441b7
0E F9 14 D3 06 F1 14 C3 06 F9 0D DD 06 F1 0D CD 06 F9 05 D0 06 F1 05 C0 06 F9 FD DB 06 F1 FD CB 06 F9 F4 D6 06 F1 F4 C6 06 F9 EC DD 06 F1 EC CD 06 F9 E4 D4 06 F1 E4 C4 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17775 1
43fe6
06. Scotland name text on address 43fe6
10 F9 18 D3 06 F1 18 C3 06 F9 10 DD 06 F1 10 CD 06 F9 08 D0 06 F1 08 C0 06 F9 00 DB 06 F1 00 CB 06 F9 F8 F3 06 F1 F8 E3 06 F9 F0 DE 06 F1 F0 CE 06 F9 E8 D2 06 F1 E8 C2 06 F9 E0 F2 06 F1 E0 E2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x177b5 1
43f4b
07. Wales name text on address 43f4b
0A F9 0C F2 06 F1 0C E2 06 F9 04 D4 06 F1 04 C4 06 F9 FC DB 06 F1 FC CB 06 F9 F4 D0 06 F1 F4 C0 06 F9 EC F6 06 F1 EC E6 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x177f4 1
441f0
08. France name text on address 441f0
0C F9 10 D4 06 F1 10 C4 06 F9 08 D2 06 F1 08 C2 06 F9 00 DD 06 F1 00 CD 06 F9 F8 D0 06 F1 F8 C0 06 F9 F0 F1 06 F1 F0 E1 06 F9 E8 D5 06 F1 E8 C5 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17837 1
43f74
09. Denmark name text on address 43f74
0E F9 14 DA 06 F1 14 CA 06 F9 0C F1 06 F1 0C E1 06 F9 04 D0 06 F1 04 C0 06 F9 FC DC 06 F1 FC CC 06 F9 F4 DD 06 F1 F4 CD 06 F9 EC D4 06 F1 EC C4 06 F9 E4 D3 06 F1 E4 C3 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17878 1
44159
10. Sweden name text on address 44159
09 F9 10 DD 06 F1 10 CD 06 F1 00 C3 16 F9 F8 D4 06 F1 F8 C4 06 F9 F0 F6 06 F1 F0 E6 06 F9 E8 F2 06 F1 E8 E2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x178b9 1
4440e
11. Norway name text on address 4440e
09 F9 10 F8 06 F1 10 E8 06 F9 08 D0 06 F1 08 C0 06 F9 01 F6 06 F1 01 E6 06 F9 F9 F1 06 F1 F9 E1 06 F1 E8 CD 16
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x178fa 1
4417e
12. Ireland name text on address 4417e
0E F9 14 D3 06 F1 14 C3 06 F9 0C DD 06 F1 0C CD 06 F9 04 D0 06 F1 04 C0 06 F9 FC DB 06 F1 FC CB 06 F9 F4 D4 06 F1 F4 C4 06 F9 EB F1 06 F1 EB E1 06 F9 E4 D8 06 F1 E4 C8 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17938 1
440ef
13. Belgium name text on address 440ef
0E F9 14 DC 06 F1 14 CC 06 F9 0B F4 06 F1 0B E4 06 F9 04 D8 06 F1 04 C8 06 F9 FC D6 06 F1 FC C6 06 F9 F4 DB 06 F1 F4 CB 06 F9 EC D4 06 F1 EC C4 06 F9 E4 D1 06 F1 E4 C1 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17974 1
43fad
14. Austria name text on address 43fad
0E F9 14 D0 06 F1 14 C0 06 F9 0C D8 06 F1 0C C8 06 F9 04 F1 06 F1 04 E1 06 F9 FC F3 06 F1 FC E3 06 F9 F4 F2 06 F1 F4 E2 06 F9 EC F4 06 F1 EC E4 06 F9 E4 D0 06 F1 E4 C0 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x179b5 1
443e5
15. Switz name text on address 443e5
0A F9 0C F9 06 F1 0C E9 06 F9 04 F3 06 F1 04 E3 06 F9 FD D8 06 F1 FD C8 06 F9 F6 F6 06 F1 F6 E6 06 F9 EE F2 06 F1 EE E2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x179f5 1
442dc
16. Romania name text on address 442dc
0E F9 14 D0 06 F1 14 C0 06 F9 0E D8 06 F1 0E C8 06 F9 07 DD 06 F1 07 CD 06 F9 FE D0 06 F1 FE C0 06 F9 F6 DC 06 F1 F6 CC 06 F9 ED DE 06 F1 ED CE 06 F9 E4 F1 06 F1 E4 E1 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17a36 1
43ed5
17. Bulgaria name text on address 43ed5
10 F9 18 D0 06 F1 18 C0 06 F9 12 D8 06 F1 12 C8 06 F9 0A F1 06 F1 0A E1 06 F9 02 D0 06 F1 02 C0 06 F9 FA D6 06 F1 FA C6 06 F9 F2 DB 06 F1 F2 CB 06 F9 E9 F4 06 F1 E9 E4 06 F9 E0 D1 06 F1 E0 C1 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17a74 1
44128
18. Russia name text on address 44128
0C F9 10 D0 06 F1 10 C0 06 F9 0A D8 06 F1 0A C8 06 F9 02 F2 06 F1 02 E2 06 F9 F9 F2 06 F1 F9 E2 06 F9 F0 F4 06 F1 F0 E4 06 F9 E8 F1 06 F1 E8 E1 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17ab3 1
44293
19. Argentina name text on address 44293
12 F9 1A D0 06 F1 1A C0 06 F9 13 DD 06 F1 13 CD 06 F9 0C D8 06 F1 0C C8 06 F9 05 F3 06 F1 05 E3 06 F9 FD DD 06 F1 FD CD 06 F9 F5 D4 06 F1 F5 C4 06 F9 ED D6 06 F1 ED C6 06 F9 E5 F1 06 F1 E5 E1 06 F9 DD D0 06 F1 DD C0 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17af2 1
44262
20. Brazil name text on address 44262
0C F9 10 DB 06 F1 10 CB 06 F9 09 D8 06 F1 09 C8 06 F9 01 F9 06 F1 01 E9 06 F9 F8 D0 06 F1 F8 C0 06 F9 F0 F1 06 F1 F0 E1 06 F9 E8 D1 06 F1 E8 C1 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17b2e 1
44221
21. Colombia name text on address 44221
10 F9 18 D0 06 F1 18 C0 06 F9 12 D8 06 F1 12 C8 06 F9 0B D1 06 F1 0B C1 06 F9 03 DC 06 F1 03 CC 06 F9 FA DE 06 F1 FA CE 06 F1 F2 CB 06 F9 F2 DB 06 F9 E9 DE 06 F1 E9 CE 06 F9 E0 D2 06 F1 E0 C2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17b6a 1
44315
22. Mexico name text on address 44315
0C F9 10 DE 06 F1 10 CE 06 F9 07 D2 06 F1 07 C2 06 F9 00 D8 06 F1 00 C8 06 F9 F9 F7 06 F1 F9 E7 06 F9 F0 D4 06 F1 F0 C4 06 F9 E8 DC 06 F1 E8 CC 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17ba8 1
443c0
23. U.S.A. name text on address 443c0
09 F9 10 FA 06 F9 08 D0 06 F1 08 C0 06 F9 00 FA 06 F9 F8 F2 06 F1 F8 E2 06 F9 F0 FA 06 F9 E8 F4 06 F1 E8 E4 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17be6 1
44346
24. Nigeria name text on address 44346
0E F9 14 D0 06 F1 14 C0 06 F9 0D D8 06 F1 0D C8 06 F9 05 F1 06 F1 05 E1 06 F9 FC D4 06 F1 FC C4 06 F9 F3 D6 06 F1 F3 C6 06 F9 EC D8 06 F1 EC C8 06 F9 E4 DD 06 F1 E4 CD 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17c15 1
4437f
25. Cameroon name text on address 4437f
10 F9 18 DD 06 F1 18 CD 06 F9 10 DE 06 F1 10 CE 06 F9 08 DE 06 F1 08 CE 06 F9 00 F1 06 F1 00 E1 06 F9 F8 D4 06 F1 F8 C4 06 F9 F0 DC 06 F1 F0 CC 06 F9 E8 D0 06 F1 E8 C0 06 F9 E0 D2 06 F1 E0 C2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17c55 1
43f16
26. S.Korea name text on address 43f16
0D F9 14 D0 06 F1 14 C0 06 F9 0C D4 06 F1 0C C4 06 F9 04 F1 06 F1 04 E1 06 F9 FC DE 06 F1 FC CE 06 F9 F4 DA 06 F1 F4 CA 06 F9 EC FA 06 F9 E4 F2 06 F1 E4 E2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17c98 1
44433
27. Super Star name text on address 44433
12 F9 FC F1 06 F1 FC E1 06 F9 F4 D4 06 F1 F4 C4 06 F9 18 D0 06 F1 18 C0 06 F9 10 F3 06 F1 10 E3 06 F9 08 F2 06 F1 08 E2 06 F9 20 F1 06 F1 20 E1 06 F9 EC DF 06 F1 EC CF 06 F9 E4 F4 06 F1 E4 E4 06 F9 DC F2 06 F1 DC E2 06
konami\konami_d "C:\Users\KoalaWin\Downloads\International Superstar Soccer (USA)\International Superstar Soccer (USA).sfc" 0x17cd9 1
*/
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
</style>
