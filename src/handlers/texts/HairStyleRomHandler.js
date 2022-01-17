import HairStyle from "../../models/HairStyle";
import { ParsingUtils } from "../../utils";

export default class HairStyleRomHandler {
  static NUMBER_OF_PLAYERS = 15;
  static OFFSET_ORIGINAL = 0x387f1;
  static TEAM_LENGTH = 90;
  static PLAYER_LENGTH = 6;

  constructor(rom, offset = HairStyleRomHandler.OFFSET_ORIGINAL) {
    this.rom = rom;
    this.offset = offset;
  }
  readFromRomAt(team) {
    let players = [];
    let data = this.rom.slice(
      this.getOffset(team),
      this.getOffset(team) + HairStyleRomHandler.TEAM_LENGTH
    );
    for (let i = 0; i < 15; i++) {
      players.push(
        HairStyleRomHandler.parseHairStyle(
          ParsingUtils.bytes(data, i * HairStyleRomHandler.PLAYER_LENGTH, 1)[0]
        )
      );
    }
    return players;
  }

  getOffset(team) {
    return this.offset + team.ordinal() * HairStyleRomHandler.TEAM_LENGTH;
  }

  static parseHairStyle(b) {
    return HairStyle.fromByte(b);
  }
}
