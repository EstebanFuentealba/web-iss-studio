/**
 * 将一个数组分割成大小的组。如果数组不能被平均分配，那么最后一块将是剩下的元素
 *
 * @param {Array} array 数组
 * @param {Number} size 每组大小
 * @return {Array}
 */
export function chunk(array, size) {
  var index;
  var result = [];
  var arrLen = size >> 0 || 1;
  if (Array.isArray(array)) {
    if (arrLen >= 0 && array.length > arrLen) {
      index = 0;
      while (index < array.length) {
        result.push(array.slice(index, index + arrLen));
        index += arrLen;
      }
    } else {
      result = array.length ? [array] : array;
    }
  }
  return result;
}

export function getShort(a, b) {
  return (a << 8) | (b << 0);
}
export function getInt(a, b, c, d) {
    return (d) | (c << 8) | (b << 16) | (a << 24); 
}
export const TEAM_NAME_TILES_DUMP_OFFSETS = [
    0x93C6,
    0x93CB,
    0x3A7EB,
    0x3A7F0,
    0x3A7F5,
    0x3A7FA,
    0x3A7FF,
    0x3A804,
    0x3A809,
    0x3A80E
];
export const P17000_INDEX_BYTE = 0x82;

export const PointerFormat = {
    P48000: 'P48000',
    P40000: 'P40000',
    P17000: 'P17000'
}

export function readPointer48(rom, pointerOffset) {
    return readPointer(rom, pointerOffset, PointerFormat.P48000);
}
export function readPointer17(rom, pointerOffset) {
    return readPointer(rom, pointerOffset, PointerFormat.P17000);
}

export function readPointer40(rom, pointerOffset) {
    return readPointer(rom, pointerOffset, PointerFormat.P40000);
}

export function readPointer(rom, pointerOffset, format) {
    let bytes = rom.slice(pointerOffset, pointerOffset + 2);
    return addressFromSnes(bytes[0], bytes[1], format);
}

export function addressFromSnes48(pointerByte1,  pointerByte2) {
    return getInt(0, 0x4, pointerByte2, pointerByte1);
}
export function addressFromSnes40(pointerByte1, pointerByte2) {
    return getInt(0, 0x4, pointerByte2 - 0x80, pointerByte1);
}
export function addressFromSnes17( pointerByte1,  pointerByte2) {
    return getInt(0, 0x1, pointerByte2 - 0x80, pointerByte1);
}
export function addressFromSnes(pointerByte1, pointerByte2, format) {
    switch (format) {
        case PointerFormat.P48000: return addressFromSnes48(pointerByte1, pointerByte2);
        case PointerFormat.P40000: return addressFromSnes40(pointerByte1, pointerByte2);
        case PointerFormat.P17000: return addressFromSnes17(pointerByte1, pointerByte2);
    }
    throw new Error("Pointer format" + format);
}
export function readByteAt(rom, offset)  {
    return rom.slice(offset, offset + 1)[0];
}
export function readTeamNameTilesPointerFormat(rom) {
    return readByteAt(rom, TEAM_NAME_TILES_DUMP_OFFSETS[0]) == P17000_INDEX_BYTE ? PointerFormat.P17000 : PointerFormat.P48000;
}
export function toInt8(value) {
    return new DataView(new Uint8Array([value]).buffer).getInt8()
}

export class ParsingUtils {
    static printPlayerNames(playerNames) {
        for(let i=0; i<playerNames.length; i++) {
            if(i%15 == 0) console.log("\n" + i/15);
            console.log(playerNames[i]);
        }
    }
    static bytes(input, offset, size) {
        return input.slice(offset, offset + size);
    }
    static stripAccents(s) {
        return s.normalize("NFD")/*.replace(/[\u0300-\u036f]/g, "")*/.replace(/\p{Diacritic}/gu, "")
    }
    static bytesString(bytes) {
        let sb = '';
        for (let b in bytes) {
            sb += `0x${(b).toString(16)} `;
        }
        return sb;
    }
    static issText(bytes) {
        let sb = [];
        for (let index in bytes) {
            let byte = bytes[index];
            let char =ParsingUtils.issChar(byte);
            sb.push(char);
        }
        return sb.join('');
    }
    static unsigned(b) {
        // return new DataView(new Uint8Array([b]).buffer).getUint8();
        return b & 0xFF;
    }
    static issChar(b) {
        if(ParsingUtils.unsigned(b) >= 0x6c && ParsingUtils.unsigned(b) <= 0x85) return String.fromCharCode( (ParsingUtils.unsigned(b) - 0x6c + 'A'.charCodeAt(0)) );
        if(ParsingUtils.unsigned(b) >= 0x86 && ParsingUtils.unsigned(b) <= 0x9f) return String.fromCharCode( (ParsingUtils.unsigned(b) - 0x86 + 'a'.charCodeAt(0)) );
        if(ParsingUtils.unsigned(b) >= 0x62 && ParsingUtils.unsigned(b) <= 0x6B) return String.fromCharCode( (ParsingUtils.unsigned(b) - 0x62 + '0'.charCodeAt(0)) );
        if(ParsingUtils.unsigned(b) == 0x00) return ' ';
        if(ParsingUtils.unsigned(b) == 0x54) return '.';
        if(ParsingUtils.unsigned(b) == 0x56) return '\"';
        if(ParsingUtils.unsigned(b) == 0x5C) return '\'';
        if(ParsingUtils.unsigned(b) == 0x5F) return '/';
        return  '#';
        /*
        [0, -126, -122, -116, -109, -118, -105, 0, 0, 120, -102, -111, -111, -118, -105, 0, 0, 118, -108, -111, -111, -118, 0, 0, 0, 126, -118, -116, -118, -111, 0, 0, 118, -111, -118, -114, -110, -122, -109, -109, 0, 118, -111, -122, -115, -108, -111, -119, 0, 114, -102, -109, -103, -115, -118, -105, 0, 0, 109, -108, -120, -112, 0, 0, 0, 126, -103, -105, -122, -109, -97, 0, 0, 118, -102, -115, -109, -118, -105, -103, 0, 126, -114, -118, -112, -118, 0, 0, 119, -122, -120, -115, -110, -122, -109, -109, 126, -120, -115, -114, -109, -119, -111, -118, 0, 125, -114, -103, -103, -118, -105, 0, 0, 125, -114, -111, -112, -118, 0, 0]
issChar 0 -- 0 -- -43 -- ?
issChar -126 -- 130 -- 87 -- W
issChar -122 -- 134 -- 91 -- [
issChar -116 -- 140 -- 97 -- a
issChar -109 -- 147 -- 104 -- h
issChar -118 -- 138 -- 95 -- _
issChar -105 -- 151 -- 108 -- l
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 120 -- 120 -- 77 -- M
issChar -102 -- 154 -- 111 -- o
issChar -111 -- 145 -- 102 -- f
issChar -111 -- 145 -- 102 -- f
issChar -118 -- 138 -- 95 -- _
issChar -105 -- 151 -- 108 -- l
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 118 -- 118 -- 75 -- K
issChar -108 -- 148 -- 105 -- i
issChar -111 -- 145 -- 102 -- f
issChar -111 -- 145 -- 102 -- f
issChar -118 -- 138 -- 95 -- _
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 126 -- 126 -- 83 -- S
issChar -118 -- 138 -- 95 -- _
issChar -116 -- 140 -- 97 -- a
issChar -118 -- 138 -- 95 -- _
issChar -111 -- 145 -- 102 -- f
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 118 -- 118 -- 75 -- K
issChar -111 -- 145 -- 102 -- f
issChar -118 -- 138 -- 95 -- _
issChar -114 -- 142 -- 99 -- c
issChar -110 -- 146 -- 103 -- g
issChar -122 -- 134 -- 91 -- [
issChar -109 -- 147 -- 104 -- h
issChar -109 -- 147 -- 104 -- h
issChar 0 -- 0 -- -43 -- ?
issChar 118 -- 118 -- 75 -- K
issChar -111 -- 145 -- 102 -- f
issChar -122 -- 134 -- 91 -- [
issChar -115 -- 141 -- 98 -- b
issChar -108 -- 148 -- 105 -- i
issChar -111 -- 145 -- 102 -- f
issChar -119 -- 137 -- 94 -- ^
issChar 0 -- 0 -- -43 -- ?
issChar 114 -- 114 -- 71 -- G
issChar -102 -- 154 -- 111 -- o
issChar -109 -- 147 -- 104 -- h
issChar -103 -- 153 -- 110 -- n
issChar -115 -- 141 -- 98 -- b
issChar -118 -- 138 -- 95 -- _
issChar -105 -- 151 -- 108 -- l
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 109 -- 109 -- 66 -- B
issChar -108 -- 148 -- 105 -- i
issChar -120 -- 136 -- 93 -- ]
issChar -112 -- 144 -- 101 -- e
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 126 -- 126 -- 83 -- S
issChar -103 -- 153 -- 110 -- n
issChar -105 -- 151 -- 108 -- l
issChar -122 -- 134 -- 91 -- [
issChar -109 -- 147 -- 104 -- h
issChar -97 -- 159 -- 116 -- t
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 118 -- 118 -- 75 -- K
issChar -102 -- 154 -- 111 -- o
issChar -115 -- 141 -- 98 -- b
issChar -109 -- 147 -- 104 -- h
issChar -118 -- 138 -- 95 -- _
issChar -105 -- 151 -- 108 -- l
issChar -103 -- 153 -- 110 -- n
issChar 0 -- 0 -- -43 -- ?
issChar 126 -- 126 -- 83 -- S
issChar -114 -- 142 -- 99 -- c
issChar -118 -- 138 -- 95 -- _
issChar -112 -- 144 -- 101 -- e
issChar -118 -- 138 -- 95 -- _
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 119 -- 119 -- 76 -- L
issChar -122 -- 134 -- 91 -- [
issChar -120 -- 136 -- 93 -- ]
issChar -115 -- 141 -- 98 -- b
issChar -110 -- 146 -- 103 -- g
issChar -122 -- 134 -- 91 -- [
issChar -109 -- 147 -- 104 -- h
issChar -109 -- 147 -- 104 -- h
issChar 126 -- 126 -- 83 -- S
issChar -120 -- 136 -- 93 -- ]
issChar -115 -- 141 -- 98 -- b
issChar -114 -- 142 -- 99 -- c
issChar -109 -- 147 -- 104 -- h
issChar -119 -- 137 -- 94 -- ^
issChar -111 -- 145 -- 102 -- f
issChar -118 -- 138 -- 95 -- _
issChar 0 -- 0 -- -43 -- ?
issChar 125 -- 125 -- 82 -- R
issChar -114 -- 142 -- 99 -- c
issChar -103 -- 153 -- 110 -- n
issChar -103 -- 153 -- 110 -- n
issChar -118 -- 138 -- 95 -- _
issChar -105 -- 151 -- 108 -- l
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
issChar 125 -- 125 -- 82 -- R
issChar -114 -- 142 -- 99 -- c
issChar -111 -- 145 -- 102 -- f
issChar -112 -- 144 -- 101 -- e
issChar -118 -- 138 -- 95 -- _
issChar 0 -- 0 -- -43 -- ?
issChar 0 -- 0 -- -43 -- ?
*/
    }
    static charToIss(c) {
        throw new Error("Not implemented")
    }
}
