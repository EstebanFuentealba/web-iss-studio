export default class ColoredPart {
  constructor(...rgbs) {
    this.rgbs = rgbs;
  }

  getRgbs() {
    return this.rgbs;
  }
  toString() {
    return "ColoredPart{" + "rgbs=" + Arrays.toString(this.rgbs) + "}";
  }
}
