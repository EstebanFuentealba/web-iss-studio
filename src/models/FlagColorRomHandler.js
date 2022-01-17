import { getShort } from "../utils";
import ColoredPart from "./colors/ColoredPart";
import Game from "./Game";
import RGB from "./colors/RGB";
import Team from "./Team";
import { Color } from "./tiles/FlagDesign";

export default class FlagColorRomHandler {
  static COLOR_BYTE_COUNT = 2;
  static COLOR_COUNT = 4;
  static RANGE1_ISS_OFFSET = 0x2dd91;
  static RANGE2_ISS_OFFSET = 0x2de4f;
  static RANGE1_ISSD_OFFSET = 0x2dda5;
  static RANGE2_ISSD_OFFSET = 0x2ecbb;
  static STEP = 10;

  constructor(rom, game) {
    this.game = game;
    this.rom = rom;
    if (this.game == Game.ISS) {
      //  ISS
      this.range1 = [
        //  ISS
        Team.GERMANY,
        Team.ENGLAND,
        Team.ITALY,
        Team.HOLLAND,
        Team.FRANCE,
        Team.SPAIN,
        Team.BELGIUM,
        Team.IRELAND,
        Team.COLOMBIA,
        Team.BRAZIL,
        Team.ARGENTINA,
        Team.MEXICO,
        Team.NIGERIA,
        Team.CAMEROON,
        Team.USA,
        Team.BULGARIA,
        Team.ROMANIA,
        Team.SWEDEN,
      ];

      this.range2 = [
        Team.SCOTLAND,
        Team.SKOREA,
        Team.SUPERSTAR,
        Team.RUSSIA,
        Team.SWISS,
        Team.DENMARK,
        Team.AUSTRIA,
        Team.WALES,
        Team.NORWAY,
      ];
    } else if (this.game == Game.ISSD) {
      this.range1 = [
        Team.ITALY,
        Team.HOLLAND,
        Team.ENGLAND,
        Team.NORWAY,
        Team.SPAIN,
        Team.IRELAND,
        Team.PORTUGAL,
        Team.DENMARK,
        Team.GERMANY,
        Team.FRANCE,
        Team.BELGIUM,
        Team.SWEDEN,
        Team.ROMANIA,
        Team.BULGARIA,
        Team.RUSSIA,
        Team.SWISS,
        Team.GREECE,
        Team.CROATIA,
        Team.AUSTRIA,
        Team.WALES,
        Team.SCOTLAND,
        Team.IRELANDN,
        Team.CZECH,
        Team.POLAND,
        Team.JAPAN,
        Team.SKOREA,
        Team.TURKEY,
        Team.NIGERIA,
        Team.CAMEROON,
        Team.MOROCCO,
        Team.BRAZIL,
        Team.ARGENTINA,
        Team.COLOMBIA,
        Team.MEXICO,
        Team.USA,
        Team.URUGUAY,
      ];

      // this.range2 = [
      //     Team.SCOTLAND, Team.SKOREA,  Team.SUPERSTAR, Team.RUSSIA, Team.SWITZ,
      //     Team.DENMARK, Team.AUSTRIA,Team.WALES, Team.NORWAY
      // ];
    }
  }
  readFromRomAt(team) {
    console.log("Reading colors of flag ", team);
    let offset = this.getOffset(team);
    let bytes = this.rom.slice(offset, offset + FlagColorRomHandler.STEP);
    return this.parseColors(bytes, 0);
  }
  parseRGB(b1, b2) {
    let number = getShort(b2, b1);
    let red = parseInt(number % 0x20);
    let green = parseInt((number % 0x400) / 0x20);
    let blue = parseInt((number % 0x8000) / 0x400);
    return new RGB(red, green, blue);
  }
  parseColors(bytes, offset) {
    let partColors = {};
    for (let i = 0; i < FlagColorRomHandler.COLOR_COUNT; i++) {
      partColors[Color.at(i)] = this.parseRGB(
        bytes[offset + i * 2],
        bytes[offset + i * 2 + 1]
      );
    }
    return new ColoredPart(partColors);
  }
  getOffset(team) {
    let position =  this.range1.indexOf(team.name);
    if (this.game == Game.ISS) {
      return position >= 0
        ? FlagColorRomHandler.RANGE1_ISS_OFFSET +
            position * FlagColorRomHandler.STEP
        : FlagColorRomHandler.RANGE2_ISS_OFFSET +
            this.range2.indexOf(team.name) * FlagColorRomHandler.STEP;
    } else {
      return position >= 0
        ? FlagColorRomHandler.RANGE1_ISSD_OFFSET +
            position * FlagColorRomHandler.STEP
        : null;
    }
  }
}
