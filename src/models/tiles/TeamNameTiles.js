export class Color {
  static COLOR_1 = 0b01; // 12
  static COLOR_2 = 0b10; // 13
  static COLOR_3 = 0b11; // 14
  static TRANSPARENT = 0b00; // 00

  constructor(code, name) {
    this.code = code;
    this.name = name;
  }
  static forCode(code) {
    return Object.keys(Color.getColors()).filter(
      (key) => Color.getColors()[key] == code
    )[0];
  }
  getCode() {
    return this.code;
  }
  getName() {
    return this.name;
  }
  static getColors() {
    return {
      COLOR_1: Color.COLOR_1,
      COLOR_2: Color.COLOR_2,
      COLOR_3: Color.COLOR_3,
      TRANSPARENT: Color.TRANSPARENT,
    };
  }
  static at(colorIndex) {
    return Object.keys(Color.getColors())[colorIndex];
  }
  ordinal() {
    return Object.values(Color.getColors()).indexOf(this.name);
  }
  toString() {
    if (this.ordinal() == 0) return "§";
    if (this.ordinal() == 1) return "~";
    if (this.ordinal() == 2) return " ";
    if (this.ordinal() == 3) return ".";
    // return "" + this.ordinal();
  }
  static serialize(c) {
    let kk = Color.getColors()[c];
    if (kk == Color.COLOR_1) return "§";
    if (kk == Color.COLOR_2) return "~";
    if (kk == Color.COLOR_3) return " ";
    if (kk == Color.TRANSPARENT) return ".";
    // return "" + this.ordinal();
    return '';
  }
  static deserialize(c) {
    if (c == "§") return Color.COLOR_1;
    if (c == "~") return Color.COLOR_2;
    if (c == " ") return Color.COLOR_3;
    if (c == ".") return Color.TRANSPARENT;
    throw new Error("Invalid color for char: " + c);
  }
  toHex() {
      if(this.code == Color.COLOR_1) {
          return '#f7fff7';
      } else if(this.code == Color.COLOR_2) {
        return '#84a6ef';
      } else if(this.code == Color.COLOR_3) {
        return '#0051f7'
      } else {
        return '#94ae5a';
      }
  }
}
export default class TeamNameTiles {
  static ROWS = 8;
  static COLS = 32;
  constructor(matrix) {
    this.matrix = matrix;
  }
  getMatrix() {
    return this.matrix;
  }
  toString() {
    let out = "";
    for (let colors in this.matrix) {
      for (let color in this.matrix[colors]) {
        out += this.matrix[colors][color] + "";
      }
      out += "\n";
    }
    return out.toString();
  }
}
