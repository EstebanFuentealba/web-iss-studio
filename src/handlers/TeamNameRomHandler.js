import TeamName from "../models/TeamName";

export default class TeamNameRomHandler {

    constructor(menuHandler, gameHandler) {
        this.menuHandler = menuHandler;
        this.gameHandler = gameHandler;
    }

    readFromRomAt(team) {
        return new TeamName(this.menuHandler.readFromRomAt(team), this.gameHandler.readFromRomAt(team));
    }
    writeToRomAt(team, input) {
        this.gameHandler.writeToRomAt(team, input.getInGame());
        this.menuHandler.writeToRomAt(team, input.getInMenu());
    }
}