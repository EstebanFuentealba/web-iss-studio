export function encodeTiles(matrix, bpp) {
  const height = matrix.length, width = matrix[0]?.length;
  if (![2,4,8].includes(bpp) || !height || height % 8 || !width || width % 8 || matrix.some(row => row.length !== width)) throw new Error('Dimensiones de tiles inválidas.');
  const bytes = new Uint8Array(width * height * bpp / 8);
  matrix.forEach((row,y) => row.forEach((pixel,x) => {
    if (!Number.isInteger(pixel) || pixel < 0 || pixel >= 2 ** bpp) throw new Error('Índice de paleta inválido.');
    const base = (Math.floor(y/8) * (width/8) + Math.floor(x/8)) * bpp * 8;
    for (let p=0;p<bpp;p++) bytes[base + Math.floor(p/2)*16 + y%8*2 + p%2] |= ((pixel >>> p)&1) << (7-x%8);
  }));
  return bytes;
}

