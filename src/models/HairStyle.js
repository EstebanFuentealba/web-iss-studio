export default class HairStyle {
  static SHORT = "Short hair";
  static CURLY = "Curly hair";
  static LONG_CURLY = "Long curly";
  static LONG_WITH_BEARD = "Long with beard";
  static LONG_STRAIGHT = "Long straight";
  static DREADLOCKS = "Dreadlocks";
  static AFRO = "Afro";
  static PONYTAIL = "Ponytail";
  static BALD = "Bald";
  static MID_LENGTH = "Mid length";
  static LONG_WITH_RIBBON = "Long with ribbon";

  constructor(text) {
    this.text = text;
  }
  static getHairStyles() {
    return {
      SHORT: HairStyle.SHORT,
      CURLY: HairStyle.CURLY,
      LONG_CURLY: HairStyle.LONG_CURLY.LONG_CURLY,
      LONG_WITH_BEARD: HairStyle.LONG_WITH_BEARD,
      LONG_STRAIGHT: HairStyle.LONG_STRAIGHT,
      DREADLOCKS: HairStyle.DREADLOCKS,
      AFRO: HairStyle.AFRO,
      PONYTAIL: HairStyle.PONYTAIL,
      BALD: HairStyle.BALD,
      MID_LENGTH: HairStyle.MID_LENGTH,
      LONG_WITH_RIBBON: HairStyle.LONG_WITH_RIBBON,
    };
  }

  static fromByte(code) {
      console.log('fromByte', code)
    let ordinal = code % 0x10;
    for (let index in HairStyle.getHairStyles()) {
      let style = new HairStyle(HairStyle.getHairStyles()[index]);
      if (style.ordinal() == ordinal) {
        return style;
      }
    }
    throw new IllegalArgumentException("Hair style code = " + code);
  }
  ordinal() {
    return Object.values(HairStyle.getHairStyles()).indexOf(this.text);
  }
  toString() {
    return this.text;
  }
}
