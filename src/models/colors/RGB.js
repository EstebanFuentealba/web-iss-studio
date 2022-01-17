export default class RGB {
  constructor(red, green, blue) {
    this.red = red;
    this.green = green;
    this.blue = blue;
  }

  getRed() {
    return this.red;
  }

  getGreen() {
    return this.green;
  }

  getBlue() {
    return this.blue;
  }
  toHex() {
    let red = (this.getRed() * 255) / 31;
    let green = (this.getGreen() * 255) / 31;
    let blue = (this.getBlue() * 255) / 31;

    const rgb = (red << 16) | (green << 8) | (blue << 0);
    return "#" + (0x1000000 + rgb).toString(16).slice(1);
  }
  equals(r, g, b) {
    return this.red == r && this.green == g && this.blue == b;
  }
  toString() {
    return (
      "RGB{" +
      "red=" +
      this.red +
      ", green=" +
      this.green +
      ", blue=" +
      this.blue +
      "}"
    );
  }
}
