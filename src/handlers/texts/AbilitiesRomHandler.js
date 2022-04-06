import { ParsingUtils } from "../../utils";

export default class AbilitiesRomHandler {
    static NUMBER_OF_PLAYERS = 15;
    static OFFSET_ORIGINAL = 0x387EC;
    static TEAM_LENGTH = 90;
    static PLAYER_LENGTH = 6;
  
    constructor(rom, offset = AbilitiesRomHandler.OFFSET_ORIGINAL) {
      this.rom = rom;
      this.offset = offset;
    }
    readFromRom() {
        let map = new Map();
        let data = this.rom.slice(this.offset, this.offset + AbilitiesRomHandler.TEAM_LENGTH * Team.getTeams().length)
        for (let i = 0; i < Team.getTeams().length; i++) {
           // System.out.println(i);
            let players = [];
            for (let j = 0; j < AbilitiesRomHandler.NUMBER_OF_PLAYERS; j++) {
                let b = ParsingUtils.bytes(data, i * AbilitiesRomHandler.TEAM_LENGTH + j * AbilitiesRomHandler.PLAYER_LENGTH, 1)[0];
                players.push(this.parsePlayerNumber(b));
            }
            map.set(Team.at(i), players);
        }
        return map;
    }
    readFromRomAt(team) {
        let players = [];
        let shootingValues = [1,3,5,7,9,11,13,15];
        let data = this.rom.slice(this.getOffset(team), this.getOffset(team) + AbilitiesRomHandler.TEAM_LENGTH);
        for (let i = 0; i < AbilitiesRomHandler.NUMBER_OF_PLAYERS; i++) {
            let dataPlayer = [...ParsingUtils.bytes(data, i * AbilitiesRomHandler.PLAYER_LENGTH, AbilitiesRomHandler.PLAYER_LENGTH)].map(byte => (byte).toString(16).padEnd(2, '0')).join('').split('');
            let shooting = shootingValues[ParsingUtils.unsigned(dataPlayer[2]) % 0x8];
            let stamina = ParsingUtils.unsigned(dataPlayer[4]) % 0x10 + 1;
            // let speed = 
            let technique = shootingValues[ParsingUtils.unsigned(dataPlayer[5]) % 0x8];
            //  TODO:
            //  console.log({ shooting, stamina, technique })
            //  0 =
            //  1 = 
            //      00 = 3
            //      10 = 3
            //      11 = 3
            //      1A = 8
            //      1B = 8
            //      1C = 9
            //      FC = 12      
            //  2 = Shooting (1-15 impares) [1,3,5,7,9,11,13,15] (0x0 & 0xff) % 0x8
            //      0 = 1
            //      1 = 3
            //      2 = 5
            //      3 = 7
            //      4 = 9
            //      5 = 11
            //      6 = 13
            //      7 = 15
            //      8 = 1
            //      9 = 3
            //      A = 5
            //      B = 7
            //      C = 9
            //      D = 11
            //      E = 13
            //      F = 15
            //  4 = stamina
            //      0 = 1
            //      1 = 2
            //      2 = 3
            //      3 = 4
            //      4 = 5
            //      5 = 6
            //      6 = 7
            //      7 = 8
            //      8 = 9
            //      9 = 10
            //      A = 11  
            //      B = 12
            //      C = 13
            //      D = 14
            //      E = 15
            //      F = 16

            //  5 = technique
            //      0 = 1
            //      1 = 3
            //      2 = 5
            //      3 = 7
            //      4 = 9
            //      5 = 11
            //      6 = 13
            //      7 = 15
            //      8 = 1
            //      9 = 3
            //      A = 5
            //      B = 7
            //      C = 9
            //      D = 11
            //      E = 13
            //      F = 15

            players.push(this.parsePlayerNumber(ParsingUtils.bytes(data, i * AbilitiesRomHandler.PLAYER_LENGTH, 1)[0]));
        }
        return players;
    }
    getOffset(team) {
        return this.offset + team.ordinal() * AbilitiesRomHandler.TEAM_LENGTH;
    }
    parsePlayerNumber(b) {
        return ParsingUtils.unsigned(b) % 0x10 + 1;
    }
}