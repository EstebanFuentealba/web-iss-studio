export function word(rom, offset) {
  if (!Number.isInteger(offset) || offset < 0 || offset + 2 > rom.length) throw new Error('Dirección fuera de la ROM.');
  return rom[offset] | (rom[offset + 1] << 8);
}

export function loRom(address) {
  if ((address & 0xffff) < 0x8000) throw new Error('Dirección LoROM inválida.');
  return ((address >>> 16) & 0x7f) * 0x8000 + (address & 0x7fff);
}

export function openRom(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const headerSize = bytes.length % 0x8000 === 512 ? 512 : 0;
  const rom = Uint8Array.from(bytes.subarray(headerSize));
  const title = String.fromCharCode(...rom.slice(0x7fc0, 0x7fd5)).trim();
  let game, label, size;
  if (title === 'SUPERSTAR SOCCER 2') {
    game = 'issd'; label = 'International Superstar Soccer Deluxe (USA)'; size = 0x200000;
  } else if (title === 'Super Star Soccer') {
    game = 'iss'; label = 'International Superstar Soccer (USA)'; size = 0x100000;
  } else throw new Error('ROM no compatible. Abre ISS (USA) o ISS Deluxe (USA).');
  if (rom.length !== size || rom[0x7fd9] !== 1 || (rom[0x7fd5] & 0x0f) !== 0) {
    throw new Error('Tamaño, región o formato de ROM no compatible. Se requiere la versión USA LoROM.');
  }
  return { rom, game, label, title, headerSize };
}

// Konami's five command modes; see issd-native/ISSDNative/issd_decompress.c.
export function decompress(rom, offset) {
  const header = word(rom, offset);
  const end = offset + (header & 0x7fff);
  if (end > rom.length || end <= offset + 2) throw new Error('Bloque comprimido inválido.');
  const window = new Uint8Array(1024), output = [];
  let cursor = offset + 2, head = 0;
  const take = () => {
    if (cursor >= end) throw new Error('Bloque comprimido truncado.');
    return rom[cursor++];
  };
  const put = value => {
    if (output.length >= 65536) throw new Error('Bloque descomprimido demasiado grande.');
    output.push(value); window[head] = value; head = (head + 1) & 1023;
  };
  while (cursor < end) {
    const command = take(), mode = command >>> 5;
    const count = (command & 31) + 2;
    if (mode === 4) for (let n = 0; n < (command & 31); n++) put(take());
    else if (mode === 5) for (let n = 0; n < count; n++) { put(0); put(take()); }
    else if (mode === 6) { const value = take(); for (let n = 0; n < count; n++) put(value); }
    else if (mode === 7) { const length = command === 255 ? take() + 2 : count; for (let n = 0; n < length; n++) put(0); }
    else {
      let source = ((((command & 3) << 8) | take()) - 0x3df) & 1023;
      for (let n = 0; n < (command >>> 2) + 2; n++) { put(window[source]); source = (source + 1) & 1023; }
    }
  }
  const bytes = Uint8Array.from(output);
  if (header & 0x8000) {
    if (bytes.length % 16) throw new Error('Tiles entrelazados incompletos.');
    for (let start = 0; start < bytes.length; start += 16) {
      const pair = bytes.slice(start, start + 16);
      for (let row = 0; row < 8; row++) { bytes[start + row * 2] = pair[row]; bytes[start + row * 2 + 1] = pair[row + 8]; }
    }
  }
  return bytes;
}

export function tiles(bytes, bpp, columns) {
  const tileSize = bpp * 8;
  if (![2, 4, 8].includes(bpp) || bytes.length % tileSize || bytes.length / tileSize % columns) throw new Error('Dimensiones de tiles inválidas.');
  const rows = bytes.length / tileSize / columns;
  return Array.from({ length: rows * 8 }, (_, y) => Array.from({ length: columns * 8 }, (_, x) => {
    const tile = Math.floor(y / 8) * columns + Math.floor(x / 8);
    let color = 0;
    for (let plane = 0; plane < bpp; plane++) {
      const index = tile * tileSize + Math.floor(plane / 2) * 16 + (y % 8) * 2 + plane % 2;
      color |= ((bytes[index] >>> (7 - x % 8)) & 1) << plane;
    }
    return color;
  }));
}

export function palette(rom, offset, count) {
  return Array.from({ length: count }, (_, index) => {
    const value = word(rom, offset + index * 2);
    return '#' + [value & 31, (value >>> 5) & 31, (value >>> 10) & 31].map(c => Math.round(c * 255 / 31).toString(16).padStart(2, '0')).join('');
  });
}
