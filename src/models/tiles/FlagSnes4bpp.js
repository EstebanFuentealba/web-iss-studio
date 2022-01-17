//  https://sneslab.net/wiki/Graphics_Format
export default class FlagSnes4bpp {
    constructor(top, bottom) {
        this.top = top;
        this.bottom = bottom;
    }

    getTop() {
        return this.top;
    }

    getBottom() {
        return this.bottom;
    }
    getMatrix() {
        return this.getTop().concat(this.getBottom())
    }
}