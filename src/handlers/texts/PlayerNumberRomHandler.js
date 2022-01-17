import Team from "../../models/Team";
import { ParsingUtils } from "../../utils";

export default class PlayerNumberRomHandler {
    static NUMBER_OF_PLAYERS = 15;

    static OFFSET_ORIGINAL = 0x387EF;
    static TEAM_LENGTH = 90;
    static PLAYER_LENGTH = 6;
    constructor(rom, offset = PlayerNumberRomHandler.OFFSET_ORIGINAL) {
        this.rom = rom;
        this.offset = offset;
    }
    readFromRom() {
        let map = new Map();
        let data = this.rom.slice(this.offset, this.offset + PlayerNumberRomHandler.TEAM_LENGTH * Team.getTeams().length)
        for (let i = 0; i < Team.getTeams().length; i++) {
           // System.out.println(i);
            let players = [];
            for (let j = 0; j < PlayerNumberRomHandler.NUMBER_OF_PLAYERS; j++) {
                let b = ParsingUtils.bytes(data, i * PlayerNumberRomHandler.TEAM_LENGTH + j * PlayerNumberRomHandler.PLAYER_LENGTH, 1)[0];
                players.push(this.parsePlayerNumber(b));
            }
            map.set(Team.at(i), players);
        }
        return map;
    }
    readFromRomAt(team) {
        let players = [];
        let data = this.rom.slice(this.getOffset(team), this.getOffset(team) + PlayerNumberRomHandler.TEAM_LENGTH);
        for (let i = 0; i < 15; i++) {
            players.push(this.parsePlayerNumber(ParsingUtils.bytes(data, i * PlayerNumberRomHandler.PLAYER_LENGTH, 1)[0]));
        }
        return players;
    }
    getOffset(team) {
        return this.offset + team.ordinal() * PlayerNumberRomHandler.TEAM_LENGTH;
    }
    parsePlayerNumber(b) {
        return ParsingUtils.unsigned(b) % 0x10 + 1;
    }
}