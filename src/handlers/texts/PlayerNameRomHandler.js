import Team from "../../models/Team";
import { chunk, ParsingUtils } from "../../utils";

export default class PlayerNameRomHandler {
    static OFFSET_ORIGINAL = 0x3b62c;
    static TEAM_COUNT = 27;
    static PLAYERS_BY_TEAM_COUNT = 15;
    static NAME_LENGTH = 8;
    static TEAM_LENGTH = PlayerNameRomHandler.PLAYERS_BY_TEAM_COUNT * PlayerNameRomHandler.NAME_LENGTH;
    static LENGTH = PlayerNameRomHandler.TEAM_COUNT * PlayerNameRomHandler.TEAM_LENGTH;

    constructor(rom, offset = PlayerNameRomHandler.OFFSET_ORIGINAL) {
        this.rom = rom;
        this.offset = offset;
        this.teamPositions = [
                Team.GERMANY, Team.ITALY, Team.HOLLAND, Team.SPAIN, Team.ENGLAND,
                Team.WALES, Team.FRANCE, Team.DENMARK, Team.SWEDEN, Team.NORWAY,
                Team.IRELAND, Team.BELGIUM, Team.AUSTRIA, Team.SWISS, Team.ROMANIA,
                Team.BULGARIA, Team.RUSSIA, Team.ARGENTINA, Team.BRAZIL, Team.COLOMBIA,
                Team.MEXICO, Team.USA, Team.NIGERIA, Team.CAMEROON, Team.SCOTLAND,
                Team.SKOREA, Team.SUPERSTAR];
    }
    readFromRom() {
        let bytes = this.rom.slice(this.offset, this.offset + LENGTH);
        let playerNames = ParsingUtils.issText(bytes).split("(?<=\\G........)");
        let teams = new Map();
        let teamPlayers = null;
        for (let i = 0; i < playerNames.length; i++) {
            if (i % PlayerNameRomHandler.PLAYERS_BY_TEAM_COUNT == 0) {
                teamPlayers = [];
                teams.set(teamPositions.get(i), teamPlayers);
            }
            teamPlayers.add(playerNames[i].trim());
        }

        return teams;
    }
    readFromRomAt(team) {
            
        let offsetStart = this.offset + this.positionOf(team) * PlayerNameRomHandler.TEAM_LENGTH;
        let bytes = this.rom.slice(offsetStart, offsetStart + PlayerNameRomHandler.TEAM_LENGTH);
       let playerNames = chunk(ParsingUtils.issText(bytes).split(''), 8);
      
        let playerNameList = [];
        for (let index in playerNames) {
            let playerName = playerNames[index].join('')
            playerNameList.push(playerName.trim());
        }
        return playerNameList;
    }
    positionOf(team) {
        return this.teamPositions.indexOf(team.name);
    }
}