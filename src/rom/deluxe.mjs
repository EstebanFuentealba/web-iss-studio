import { word, loRom, decompress, tiles, palette } from './binary.mjs';
import { flagBank, labelBank } from './graphics.mjs';
import { deluxeAppearance } from './appearance.mjs';

// Native team order verified by issd-native/ISSDNative/issd_mod_rom.c.
export const DELUXE_TEAMS = ['Italy', 'Holland', 'England', 'Norway', 'Spain', 'Ireland', 'Portugal', 'Denmark', 'Germany', 'France', 'Belgium', 'Sweden', 'Romania', 'Bulgaria', 'Russia', 'Swiss', 'Greece', 'Croatia', 'Austria', 'Wales', 'Scotland', 'N.Ireland', 'Czech Rep.', 'Poland', 'Japan', 'S.Korea', 'Turkey', 'Nigeria', 'Cameroon', 'Morocco', 'Brazil', 'Argentina', 'Colombia', 'Mexico', 'U.S.A.', 'Uruguay'];

export function deluxeText(bytes) {
  return Array.from(bytes, byte => {
    if (byte >= 0x68 && byte <= 0x81) return String.fromCharCode(65 + byte - 0x68);
    if (byte >= 0x82 && byte <= 0x9b) return String.fromCharCode(97 + byte - 0x82);
    return ({ 0: ' ', 0x54: '.', 0x56: '"', 0x5a: "'", 0x5c: "'", 0x5f: '/' })[byte] ?? '�';
  }).join('').trim();
}

export function deluxeAttributes(bytes) {
  const fields = ['acceleration', 'speed', 'shotPower', 'curl', 'balance', 'intelligence', 'dribbling', 'jump', 'position', 'energy'];
  const result = {};
  fields.forEach((key, index) => {
    const nibble = index % 2 ? bytes[index >>> 1] & 15 : bytes[index >>> 1] >>> 4;
    result[key] = nibble + (key === 'position' ? 0 : 1);
  });
  return { ...result, no: bytes[5] + 1, skin: bytes[6] >>> 4, hair: bytes[6] & 15 };
}

export function readDeluxeTeam(rom, index) {
  if (!Number.isInteger(index) || index < 0 || index >= DELUXE_TEAMS.length) throw new Error('Equipo inválido.');
  const names = loRom(0x870000 | word(rom, 0x38138 + index * 2));
  const players = Array.from({ length: 20 }, (_, player) => {
    const nameOffset = names + player * 8, attributeOffset = 0x50000 + index * 140 + player * 7;
    const attributes = deluxeAttributes(rom.slice(attributeOffset, attributeOffset + 7));
    return { name: deluxeText(rom.slice(nameOffset, nameOffset + 8)), ...attributes, ...deluxeAppearance(rom, index, attributes) };
  });
  // Original pointer tables in Routine_Macros_ISSD.asm: DATA_81E730,
  // DATA_81E7D8 and DATA_81E6C1. Palette record starts with a size word.
  const flag = [0, 2].flatMap(part => {
    const address = flagBank(rom)<<16 | word(rom, 0xe730 + index * 4 + part);
    return tiles(decompress(rom, loRom(address)), 4, 3);
  });
  const colors = new Array(16).fill('transparent');
  colors.splice(12, 4, ...palette(rom, loRom(0x890000 | word(rom, 0xe7d8 + index * 2)) + 2, 4));
  const nameAddress = labelBank(rom)<<16 | word(rom, 0xe6c1 + index * 2);
  const teamMatrix = tiles(decompress(rom, loRom(nameAddress)), 2, 4);
  return { name: DELUXE_TEAMS[index], players, flag, colors, teamMatrix, teamColors: ['transparent', '#ffffff', '#b8b8b8', '#555555'] };
}
