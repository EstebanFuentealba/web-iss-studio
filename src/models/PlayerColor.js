export default class PlayerColor {
    static NORMAL = "Normal";
    static SPECIAL = "Special";

    constructor( text) {
        this.text = text;
    }

    static getPlayerColors() {
        return {
            NORMAL: PlayerColor.NORMAL,
            SPECIAL: PlayerColor.SPECIAL
        }
    }
    static at(index) {
        return Object.keys(PlayerColor.getPlayerColors())[index];
      }

    toString() {
        return this.text;
    }
}
