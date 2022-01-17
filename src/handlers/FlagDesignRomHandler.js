import FlagDesign, { Color } from "../models/tiles/FlagDesign";
import { chunk, readPointer48 } from "../utils";

export default class FlagDesignRomHandler {
    static POINTER_OFFSET = 0x941a;
    static POINTER_STEP = 4;
    constructor(rom, decompiler) {
        this.rom = rom;
        this.decompiler = decompiler;
        this.maximumAddress = 0x48A7F;//0x489CD;
    }
    async readFromRomAt(team) {
        let topOffset = this.readPointerAt(team);
        let bottomOffset = readPointer48(this.rom, this.pointerOffset(team) + 2);
        let flagTop = await this.readFlagPart(topOffset);
        let flagBottom = await this.readFlagPart(bottomOffset);
        return new FlagDesign(flagTop.concat(flagBottom));
    }
    readPointerAt(team) {
        return readPointer48(this.rom, this.pointerOffset(team));
    }
    pointerOffset(team) {
        
        return FlagDesignRomHandler.POINTER_OFFSET + FlagDesignRomHandler.POINTER_STEP * team.ordinal();
    }
    async readFlagPart(offset) {
        let bytes = await this.decompiler(`0x${(offset).toString(16)}`);
        let colors = this.bytesToMatrix(bytes);
        return colors;
    }
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
                tileData[k * 8 + l] = Color.forCode(
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
      }
}