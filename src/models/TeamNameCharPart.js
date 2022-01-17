export default class TeamNameCharPart {
  static bottomOrder = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    ".",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];
  static topAndBottomOrder = [
    "HI",
    "BC",
    "89",
    "45",
    "67",
    "01",
    "23",
    "DE",
    "FG",
    "JK",
    "LM",
    "NO",
    "RS",
    "TU",
    "VW",
    "XY",
    "GH",
    "AB",
    "56",
    "78",
    "12",
    "34",
    "CD",
    "EF",
    "IJ",
    "KL",
    "MN",
    "OP",
    "QR",
    "ST",
    "UV",
    "WX",
    "YZ",
    "PA",
  ];
  static topOrder = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];
  static bottoms = new Map()
    .set("A", new TeamNameCharPart('A', true, 0xd0, 0x06))
    .set("B", new TeamNameCharPart('B', true, 0xd1, 0x06))
    .set("C", new TeamNameCharPart('C', true, 0xd2, 0x06))
    .set("D", new TeamNameCharPart('D', true, 0xd3, 0x06))
    .set("E", new TeamNameCharPart('E', true, 0xd4, 0x06))
    .set("F", new TeamNameCharPart('F', true, 0xd5, 0x06))
    .set("G", new TeamNameCharPart('G', true, 0xd6, 0x06))
    .set("H", new TeamNameCharPart('H', true, 0xd7, 0x06))
    .set("I", new TeamNameCharPart('I', true, 0xd8, 0x06, 7))
    .set("J", new TeamNameCharPart('J', true, 0xd9, 0x06))
    .set("K", new TeamNameCharPart('K', true, 0xda, 0x06))
    .set("L", new TeamNameCharPart('L', true, 0xdb, 0x06))
    .set("M", new TeamNameCharPart('M', true, 0xdc, 0x06, 8))
    .set("N", new TeamNameCharPart('N', true, 0xdd, 0x06, 8))
    .set("O", new TeamNameCharPart('O', true, 0xde, 0x06))
    .set("P", new TeamNameCharPart('P', true, 0xdf, 0x06))
    .set("Q", new TeamNameCharPart('Q', true, 0xf0, 0x06))
    .set("R", new TeamNameCharPart('R', true, 0xf1, 0x06))
    .set("S", new TeamNameCharPart('S', true, 0xf2, 0x06))
    .set("T", new TeamNameCharPart('T', true, 0xf3, 0x06, 8))
    .set("U", new TeamNameCharPart('U', true, 0xf4, 0x06))
    .set("V", new TeamNameCharPart('V', true, 0xf5, 0x06))
    .set("W", new TeamNameCharPart('W', true, 0xf6, 0x06, 8))
    .set("X", new TeamNameCharPart('X', true, 0xf7, 0x06))
    .set("Y", new TeamNameCharPart('Y', true, 0xf8, 0x06))
    .set("Z", new TeamNameCharPart('Z', true, 0xf9, 0x06))
    .set(".", new TeamNameCharPart('.', true, 0xfa, 0x06, 7))
    .set("0", new TeamNameCharPart('0', true, 0xb0, 0x06))
    .set("1", new TeamNameCharPart('1', true, 0xb1, 0x06))
    .set("2", new TeamNameCharPart('2', true, 0xb2, 0x06))
    .set("3", new TeamNameCharPart('3',true, 0xb3, 0x06))
    .set("4", new TeamNameCharPart('4', true, 0xb4, 0x06))
    .set("5", new TeamNameCharPart('5', true, 0xb5, 0x06))
    .set("6", new TeamNameCharPart('6', true, 0xb6, 0x06))
    .set("7", new TeamNameCharPart('7', true, 0xb7, 0x06))
    .set("8", new TeamNameCharPart('8', true, 0xb8, 0x06))
    .set("9", new TeamNameCharPart('9', true, 0xb9, 0x06));

  static _topAndBottoms = null;

  static tops = new Map()
    .set("A", new TeamNameCharPart('A', false, 0xc0, 0x06))
    .set("B", new TeamNameCharPart('B', false, 0xc1, 0x06))
    .set("C", new TeamNameCharPart('C', false, 0xc2, 0x06))
    .set("D", new TeamNameCharPart('D', false, 0xc3, 0x06))
    .set("E", new TeamNameCharPart('E', false, 0xc4, 0x06))
    .set("F", new TeamNameCharPart('F', false, 0xc5, 0x06))
    .set("G", new TeamNameCharPart('G', false, 0xc6, 0x06))
    .set("H", new TeamNameCharPart('H', false, 0xc7, 0x06))
    .set("I", new TeamNameCharPart('I', false, 0xc8, 0x06, 7))
    .set("J", new TeamNameCharPart('J', false, 0xc9, 0x06))
    .set("K", new TeamNameCharPart('K', false, 0xca, 0x06))
    .set("L", new TeamNameCharPart('L', false, 0xcb, 0x06))
    .set("M", new TeamNameCharPart('M', false, 0xcc, 0x06, 8))
    .set("N", new TeamNameCharPart('N', false, 0xcd, 0x06, 8))
    .set("O", new TeamNameCharPart('O', false, 0xce, 0x06))
    .set("P", new TeamNameCharPart('P', false, 0xcf, 0x06))
    .set("Q", new TeamNameCharPart('Q', false, 0xe0, 0x06))
    .set("R", new TeamNameCharPart('R', false, 0xe1, 0x06))
    .set("S", new TeamNameCharPart('S', false, 0xe2, 0x06))
    .set("T", new TeamNameCharPart('T', false, 0xe3, 0x06, 8))
    .set("U", new TeamNameCharPart('U', false, 0xe4, 0x06))
    .set("V", new TeamNameCharPart('V', false, 0xe5, 0x06))
    .set("W", new TeamNameCharPart('W', false, 0xe6, 0x06, 8))
    .set("X", new TeamNameCharPart('X', false, 0xe7, 0x06))
    .set("Y", new TeamNameCharPart('Y', false, 0xe8, 0x06))
    .set("Z", new TeamNameCharPart('Z', false, 0xe9, 0x06))
    .set("0", new TeamNameCharPart('0', false, 0xa0, 0x06))
    .set("1", new TeamNameCharPart('1', false, 0xa1, 0x06))
    .set("2", new TeamNameCharPart('2', false, 0xa2, 0x06))
    .set("3", new TeamNameCharPart('3', false, 0xa3, 0x06))
    .set("4", new TeamNameCharPart('4', false, 0xa4, 0x06))
    .set("5", new TeamNameCharPart('5', false, 0xa5, 0x06))
    .set("6", new TeamNameCharPart('6', false, 0xa6, 0x06))
    .set("7", new TeamNameCharPart('7', false, 0xa7, 0x06))
    .set("8", new TeamNameCharPart('8', false, 0xa8, 0x06))
    .set("9", new TeamNameCharPart('9', false, 0xa9, 0x06));

  constructor(letter, bottom, b1, b2, preferredSize = 9) {
      this.letter = letter;
    this.bottom = bottom;
    this.b1 = b1;
    this.b2 = b2;
    this.preferredSize = preferredSize;
  }
  cutLeft() {
    if (this.getText().startsWith("I")) return 1;
    if (this.getText().startsWith(".")) return 2;
    return 0;
  }
  static topAndBottoms() {
    if (TeamNameCharPart._topAndBottoms == null) {
      let map = new Map();
      for (let key in [...TeamNameCharPart.tops.keys()]) {
        let letter = [...TeamNameCharPart.tops.keys()][key];
        if (letter == "Z" || letter == "9") continue;
        let part = TeamNameCharPart.tops.get(letter);

        let nextChar = String.fromCharCode(letter.charCodeAt(0) + 1);
        map.set(
          letter + nextChar,
          new TeamNameCharPart(
            letter + nextChar,
            part.isBottom(),
            part.getB1(),
            0x16,
            part.getPreferredSize() +
              TeamNameCharPart.tops.get(nextChar).getPreferredSize() -
              2
          )
        );
      }
      let part = map.get("PQ");
      map.delete("PQ");
      map.set("PA", part);

      TeamNameCharPart._topAndBottoms = map;
    }
    return TeamNameCharPart._topAndBottoms;
  }
  hashCode() {
    let result = bottom ? 1 : 0;
    result = 31 * result + b1;
    result = 31 * result + b2;
    return result;
  }

  getPreferredSize() {
    return this.preferredSize;
  }
  forLetter(letter) {
    let parts = [];
    let topAndBottom = TeamNameCharPart.topAndBottoms().get(letter);
    if (topAndBottom != undefined) {
      parts.push(topAndBottom);
      return parts;
    }

    let bottom = TeamNameCharPart.bottoms.get(letter);
    if (bottom != undefined) parts.push(bottom);
    let top = TeamNameCharPart.tops.get(letter);
    if (top != undefined) parts.push(top);
    return parts;
  }
  equals(a, o) {
    if (a == o) return true;
    if (o == null || o == undefined) return false;

    let that = o;

    if (a.b1 != that.b1) return false;
    if (a.b2 != that.b2) return false;
    if (a.bottom != that.bottom) return false;
    return true;
  }
  getText() {
    return this.getLetter();
  }
  getLetter() {
      return this.letter
  }
  isBottom() {
    return this.bottom;
  }

  getB1() {
    return this.b1;
  }

  getB2() {
    return this.b2;
  }
  static deserialize(partData, prevData) {
    if (partData[0] == 0xf9) {
        for (let i = 0; i < TeamNameCharPart.bottomOrder.length; i++) {
            let partLetter = TeamNameCharPart.bottomOrder[i];
            
            let bottom = TeamNameCharPart.bottoms.get(partLetter);
            if (bottom.b1 == partData[2] && bottom.b2 == partData[3]) {
                return bottom;
            }
        }
    } else {
        for (let i = 0; i < TeamNameCharPart.topAndBottomOrder.length; i++) {
            let partLetter = TeamNameCharPart.topAndBottomOrder[i];
            let topAndBottom = TeamNameCharPart.topAndBottoms().get(partLetter);
            if (
              topAndBottom.getB1() == partData[2] &&
              topAndBottom.getB2() == partData[3]
            ) {
              return topAndBottom;
            }
          }
    for (let i = 0; i < TeamNameCharPart.topOrder.length; i++) {
        let partLetter = TeamNameCharPart.topOrder[i];
        let top = TeamNameCharPart.tops.get(partLetter);
        if (top.getB1() == partData[2] && top.getB2() == partData[3]) {
          if(prevData && (prevData.getLetter() == partLetter && prevData.getBottom() != partLetter.getBottom())) return null;
          // if()
          return top;
        }
      }
    }
    return null;
    //throw new IllegalArgumentException(ParsingUtils.bytesString(partData));
  }
  toString() {
    let topAndBottomString = TeamNameCharPart.topAndBottoms().get(this);
    if (topAndBottomString != null) {
      return topAndBottomString + " (top and bottom)";
    }

    let topString = TeamNameCharPart.tops.get(this);
    if (topString != null) {
      return topString + " (top)";
    }

    let bottomString = TeamNameCharPart.bottoms.get(this);
    if (bottomString != null) {
      return bottomString + " (bottom)";
    }

    return "";
  }
}
