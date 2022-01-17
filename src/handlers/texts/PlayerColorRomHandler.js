import PlayerColor from "../../models/PlayerColor";
import Team from "../../models/Team";
import { ParsingUtils } from "../../utils";

export default class PlayerColorRomHandler {
  static NUMBER_OF_PLAYERS = 15;

  static OFFSET_ORIGINAL = 0x387f1;
  static TEAM_LENGTH = 90;
  static PLAYER_LENGTH = 6;

  constructor(rom, offset = PlayerColorRomHandler.OFFSET_ORIGINAL) {
    this.rom = rom;
    this.offset = offset;
  }
  readFromRom() {
    let map = new Map();
    let data = this.rom.slice(
      this.offset,
      this.offset + PlayerColorRomHandler.TEAM_LENGTH * Team.getTeams().length
    );

    for (let i = 0; i < Team.getTeams().length; i++) {
      // System.out.println(i);
      let players = [];
      for (let j = 0; j < PlayerColorRomHandler.NUMBER_OF_PLAYERS; j++) {
        let b = ParsingUtils.bytes(
          data,
          i * PlayerColorRomHandler.TEAM_LENGTH +
            j * PlayerColorRomHandler.PLAYER_LENGTH,
          1
        )[0];
        players.push(PlayerColorRomHandler.parsePlayerColor(b));
      }
      map.set(Team.at(i), players);
    }
    return map;
  }

  readFromRomAt(team) {
    let players = [];
    let data = this.rom.slice(
      this.getOffset(team),
      this.getOffset(team) + PlayerColorRomHandler.TEAM_LENGTH
    );

    for (let i = 0; i < 15; i++) {
      players.push(
        PlayerColorRomHandler.parsePlayerColor(
          ParsingUtils.bytes(data, i * PlayerColorRomHandler.PLAYER_LENGTH, 1)[0]
        )
      );
    }
    return players;
  }

  getOffset(team) {
    return this.offset + team.ordinal() * PlayerColorRomHandler.TEAM_LENGTH;
  }
  static parsePlayerColor(b) {
    return b / 0x40 > 0 ? PlayerColor.SPECIAL : PlayerColor.NORMAL;
  }
}
