import TeamNameTiles, { Color } from "../models/tiles/TeamNameTiles";
import { chunk, readPointer, readTeamNameTilesPointerFormat } from "../utils";

export default class TeamNameTilesRomHandler {
  static POINTER_OFFSET = 0x93cd;
  static POINTER_STEP = 2;

  constructor(rom, decompiler) {
    this.rom = rom;
    this.decompiler = decompiler;
    this.maximumAddress48 = 0x48a7f; //0x489CD;
    this.maximumAddress17 = 0x17fff; //0x483FD;
    this._pointerFormat = null;
  }
  async readFromRomAt(team) {
    let offset = this.readPointerAt(team);
    let matrix = await this.readMatrix(offset);
    return new TeamNameTiles(matrix);
  }

  pointerFormat() {
    if (pointerFormat == null) {
      pointerFormat = readTeamNameTilesPointerFormat(this.rom);
    }
    return pointerFormat;
  }

  readPointerAt(team) {
    return readPointer(this.rom, this.pointerOffset(team), this.pointerFormat());
  }
  pointerOffset(team) {
    return (
      TeamNameTilesRomHandler.POINTER_OFFSET +
      TeamNameTilesRomHandler.POINTER_STEP * team.ordinal()
    );
  }
  pointerFormat() {
    if (this._pointerFormat == null) {
      this._pointerFormat = readTeamNameTilesPointerFormat(this.rom);
    }
    return this._pointerFormat;
  }
  async readMatrix(offset) {
    let bytes = await this.decompiler(`0x${offset.toString(16)}`);
    let colors = this.bytesToMatrix(bytes);
    return colors;
  }
  bytesToMatrix(bytes) {
    let tileData = [];
    let tileInputArray = [];
    let matrix = new Array(8);
    let binString = "";
    let byte1 = 0,
      byte2 = 0;

    for (let startBlock = 0; startBlock <= 24*2; startBlock += bytes.byteLength/4) {
      for (
        let start = startBlock, bytesRead = 0;
        bytesRead < 24;
        start++, bytesRead++
      ) {
        tileInputArray[bytesRead] = bytes.slice(start, start + 1);
        for (let k = 0; k < 8; k++) {
          byte1 = tileInputArray[k * 2];
          byte2 = tileInputArray[k * 2 + 1];

          for (let l = 0; l < 8; l++) {
            binString = "";

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
            tileData[k * 8 + l] = Color.forCode(parseInt(outputBitString.toString(10)));
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
  }
}
