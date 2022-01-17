import { chunk, ParsingUtils, toInt8 } from "../utils";
import TeamNameCharPart from "./TeamNameCharPart";

export default class TeamNameText {
  // private final Multimap<Byte, TeamNameCharPart> map = ArrayListMultimap.create();
  constructor() {
    this.map = new Map();
  }
  forText(text) {
    text = ParsingUtils.stripAccents(text)
      .toUpperCase()
      .replace(/[^A-Z0-9\\. ]/g, " ");
    let zeroMap = new Map();

    let currentPosition = 0;

    for (let i = 0; i < text.length; i++) {
      //whitespace
      if (text.charAt(i) == " ") {
        currentPosition += 3;
      } else {
        //two letters
        if (i + 1 < text.length) {
          let parts = TeamNameCharPart.forLetter(
            text.charAt(i) + text.charAt(i + 1)
          );
          if (parts.length > 0) {
            let basePart = parts[0];
            if (i > 0) currentPosition -= basePart.cutLeft();
            zeroMap.set(currentPosition, parts);
            currentPosition += basePart.getPreferredSize();
            i++;
            continue;
          }
        }
        //one letter
        let parts = TeamNameCharPart.forLetter(text.charAt(i));
        let basePart = parts[0];
        if (i > 0) currentPosition -= basePart.cutLeft();
        zeroMap.set(currentPosition, parts);
        currentPosition += basePart.getPreferredSize();
      }
    }
    let currentSize = currentPosition - 1;
    let maximumSize = 70;
    if (currentSize > maximumSize) {
      let deltaSize = currentSize - maximumSize;
      let numberOflettersToMove = zeroMap.keySet().size() - 1;
      let compressionRate = deltaSize / numberOflettersToMove;
      let remainder = deltaSize % numberOflettersToMove;
      //System.out.println("compressionRate " + compressionRate);
      zeroMap = compress(zeroMap, compressionRate, remainder);
      currentSize = maximumSize;
    }

    let positionDelta = currentSize / 2;

    let teamName = new TeamNameText();

    for (let zeroPosition in zeroMap.keys()) {
      let newPosition = zeroPosition - positionDelta;
      teamName.map.set(newPosition, zeroMap.get(zeroPosition));
    }

    return teamName;
  }

  compress(zeroMap, compression, remainder) {
    let map = new Map();
    let sorted = zeroMap.keys().sort();
    let i = 0;
    let displacement = 0;
    for (let zeroPosition in sorted) {
      if (i > 0) {
        displacement += compression;
        if (remainder > 0) {
          displacement++;
          remainder--;
        }
      }
      let newPosition = zeroPosition - displacement;
      map.set(newPosition, zeroMap.get(zeroPosition));
      i++;
    }
    return map;
  }

  getText() {
   
    let text = "";
    let lastPosition = 127;
    let lastLetterSize = 2147483647;
    
    Array.from(this.map.entries()).sort(([Aint8],[Bint8]) => {
        return toInt8(Aint8) - toInt8(Bint8)
    }).map(([key, position], i) => {
      let currentLetter = "";
      let part = this.map.get(key);
      currentLetter = part.getText();
      if (currentLetter != "") {
        //espaçamento maior que 10 considera um espaço
        if (position >= lastPosition + 10 * lastLetterSize) {
          text += " ";
        }
        text += currentLetter;
        lastPosition = position;
        lastLetterSize = currentLetter.length;
      }
    });
    return text;
  }

  getByteSize() {
    return this.map.size();
  }

  // public byte[] serialize() {
  //     List<Byte> bytes = new ArrayList<>();
  //     bytes.add(getByteSize());
  //     List<Byte> positions = map.keySet().stream().sorted(naturalOrder()).collect(toList());
  //     for (Byte position : positions) {
  //         for (TeamNameCharPart part : map.get(position)) {
  //             bytes.add(part.isBottom() ? (byte) 0xF9 : (byte) 0xF1);
  //             bytes.add(position);
  //             bytes.add(part.getB1());
  //             bytes.add(part.getB2());
  //         }
  //     }
  //     return Bytes.toArray(bytes);
  // }

  static deserialize(data) {
    let teamName = new TeamNameText();
    let parts = chunk(Array.from(data).slice(1), 4);
    let prevData = null;
    parts.forEach((partData) => {
      let part = TeamNameCharPart.deserialize(partData);
      if (part != null) teamName.map.set(partData[1], part);
      prevData = part;
    });
    return teamName;
  }

  toString() {
    return this.getText();
  }
}
