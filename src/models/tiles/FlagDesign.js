
export class Color {
    static COLOR_1 = 0b1100; // 12
    static COLOR_2 = 0b1101; // 13
    static COLOR_3 = 0b1110; // 14
    static COLOR_4 = 0b1111;  // 15
    static TRANSPARENT = 0b0000; // 00
  
    constructor(code, name) {
      this.code = code;
      this.name = name;
    }
    static forCode(code) {
      return Object.keys(Color.getColors()).filter(
        (key) => Color[key] == code
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
        COLOR_4: Color.COLOR_4,
        TRANSPARENT: Color.TRANSPARENT,
      };
    }
    static at(colorIndex) {
      return Object.keys(Color.getColors())[colorIndex];
    }
  }
  
export default class FlagDesign {
    constructor(matrix) {
        this.matrix = matrix;
    }
    // toString() {
    //     StringBuilder out = new StringBuilder();
    //     for (Color[] colors : this.matrix) {
    //         for (Color color : colors) {
    //             out.append(color).append(" ");
    //         }
    //         out.append("\n");
    //     }
    //     return out.toString();
    // }

    getMatrix() {
        return this.matrix;
    }
}