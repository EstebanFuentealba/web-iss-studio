import { loRom, word, decompress, tiles, palette } from './binary.mjs';
import { encodeTiles, compress } from './graphics.mjs';

// The animation uploads 32 tiles each at $7800, $7A00 and $7C00.
// Notices live in $7340..$777F; preserve the native font at $7E00.
// Skip tiles $60/$61, the transparent bottom of the copyright's large sprite.
// $AFF000..$AFFFFF is FREE_BYTES, beyond the flag and team-label pools.
const POOL=loRom(0xaff000), SIZE=0x1000, LOADER=loRom(0x829998);
const LINES=[
  {id:'title-copyright',label:'Portada · 1995 KONAMI ALL RIGHTS RESERVED',map:loRom(0x88ee12),size:117,left:-110,y:81,width:240,tile:52,count:29},
  {id:'title-license',label:'Portada · LICENSED BY NINTENDO',map:loRom(0x88ee87),size:73,left:-75,y:90,width:160,tile:82,count:18},
];
export const TITLE_LEGAL_RULES=[['title-legal:atlas',POOL,SIZE],['title-legal:loader',LOADER,5],...LINES.map(l=>[`title-legal:${l.id}`,l.map,l.size])];
// Keep editor text after the compressed atlas, outside the bytes loaded by DMA.
// Older graphic-only edits have no footer and remain readable.
const TEXT_SIZE=128, TEXT_OFFSET=POOL+SIZE-TEXT_SIZE;
const DEFAULT_TEXT=['© 1995 KONAMI ALL RIGHTS RESERVED.','LICENSED BY NINTENDO'];
const TEXT_MAGIC=[84,76,84,88];
const hasText=rom=>TEXT_MAGIC.every((b,i)=>rom[TEXT_OFFSET+i]===b);
export function titleLegalTexts(rom){
  if(!relocated(rom))return DEFAULT_TEXT.slice();
  if(!hasText(rom))return ['', ''];
  return LINES.map((_,i)=>{const o=TEXT_OFFSET+4+i*62,n=rom[o];return n===255?'':String.fromCharCode(...rom.slice(o+1,o+1+n));});
}
export const legacyTitleLegal=rom=>word(rom,LOADER)===0x7800;
const relocated=rom=>legacyTitleLegal(rom)||word(rom,LOADER)===0x7340;
const fontOffset=rom=>legacyTitleLegal(rom)?3072:5504;
const tileAt=(line,index)=>line.tile+index+(line.id==='title-license'&&index>=14?2:0);
const atlas=rom=>decompress(rom,loRom(rom[LOADER+4]<<16|word(rom,LOADER+2)));

export function titleLegalResources(rom) {
  const strip=tiles(atlas(rom),4,1),base=legacyTitleLegal(rom)?128:relocated(rom)?52:224;
  const colors=palette(rom,loRom(0x89c2d6),16);colors[0]='transparent';
  const texts=titleLegalTexts(rom);
  return LINES.map((line,index)=>{
    const matrix=Array.from({length:8},()=>Array(line.width).fill(0));
    for(let i=rom[line.map]-1;i>=0;i--){
      const [sy,sx,tile,attr]=rom.subarray(line.map+1+i*4,line.map+5+i*4);
      const size=attr&16?16:8,shift=relocated(rom)&&!legacyTitleLegal(rom)&&size===16?4:0;
      const x=(sx>127?sx-256:sx)-line.left-shift,y=(sy>127?sy-256:sy)-line.y-shift;
      for(let j=0;j<size;j++)for(let k=0;k<size;k++){
        const px=x+k,py=y+j;if(px<0||px>=line.width||py<0||py>=8)continue;
        const fx=attr&64?size-1-k:k,fy=attr&128?size-1-j:j,t=tile-base+(fx>>3)+(fy>>3)*16;
        const pixel=strip[t*8+fy%8]?.[fx%8];if(pixel===undefined)throw new Error('Atlas de textos de portada inválido.');
        if(pixel)matrix[py][px]=pixel;
      }
    }
    return {id:line.id,label:line.label,kind:'title-legal',text:texts[index],maxLength:Math.floor(line.width/6),bpp:4,columns:line.width/8,capacity:SIZE,matrix,colors};
  });
}

function lineMap(line,legacy=false){
  const bytes=new Uint8Array(line.size);bytes[0]=line.count;
  let x=0;
  for(let i=0;i<line.count;i++){
    // Last sprite (last two for Nintendo) covers two horizontal tiles.
    const large=i>=2*line.count-line.width/8;
    // CODE_809093 anchors 8px sprites at -4 and 16px sprites at -8.
    const shift=large&&!legacy?4:0,tile=legacy?(line.id==='title-license'?184:128)+x/8:tileAt(line,x/8);
    bytes.set([line.y+shift,(line.left+x+shift)&255,tile,large?0x17:0x07],1+i*4);
    x+=large?16:8;
  }
  return bytes;
}

export function titleLegalPatches(original,current,id,matrix,text,force=false){
  const line=LINES.find(l=>l.id===id);if(!line)throw new Error('Texto de portada desconocido.');
  if(matrix.length!==8||matrix.some(r=>r.length!==line.width))throw new Error('La resolución debe conservarse.');
  const encoded=encodeTiles(matrix,4),resources=titleLegalResources(current),initial=titleLegalResources(original);
  const images=resources.map(r=>r.id===id?matrix:r.matrix);
  const patches=TITLE_LEGAL_RULES.map(([id,offset,size])=>({id,offset,label:'Textos de portada · gráficos independientes',bytes:original.slice(offset,offset+size)}));
  if(!force&&!legacyTitleLegal(original)&&images.every((m,i)=>JSON.stringify(m)===JSON.stringify(initial[i].matrix)))return patches;
  if(!relocated(original)&&!original.subarray(POOL,POOL+SIZE).every(b=>b===255))throw new Error('El espacio reservado para los textos de portada está ocupado.');
  const data=new Uint8Array(6528),font=atlas(current);data.set(relocated(current)?font.subarray(fontOffset(current)):font,5504);
  LINES.forEach((l,i)=>{const pixels=l.id===id?encoded:encodeTiles(images[i],4);
    for(let t=0;t<l.width/8;t++)data.set(pixels.subarray(t*32,(t+1)*32),(tileAt(l,t)-52)*32);
  });
  const texts=titleLegalTexts(current);
  texts[LINES.indexOf(line)]=text===undefined?(JSON.stringify(matrix)===JSON.stringify(initial[LINES.indexOf(line)].matrix)?titleLegalTexts(original)[LINES.indexOf(line)]:''):text;
  const storeText=texts.some(Boolean),packed=compress(data);if(packed.length>SIZE-(storeText?TEXT_SIZE:0))throw new Error('Los textos de portada exceden su espacio reservado.');
  patches[0].bytes.set(packed);
  if(storeText){
    const footer=new Uint8Array(TEXT_SIZE);footer.set(TEXT_MAGIC);
    texts.forEach((value,i)=>{const o=4+i*62;footer[o]=value?value.length:255;if(value)footer.set(Array.from(value,c=>c.charCodeAt(0)),o+1);});
    patches[0].bytes.set(footer,SIZE-TEXT_SIZE);
  }else if(packed.length<=SIZE-TEXT_SIZE)patches[0].bytes.fill(255,SIZE-TEXT_SIZE);
  patches[1].bytes.set([0x40,0x73,0,0xf0,0xaf]);
  LINES.forEach((l,i)=>patches[i+2].bytes.set(lineMap(l)));
  return patches;
}

export function validateTitleLegal(rom,original){
  const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
  if(!relocated(rom)){
    if(TITLE_LEGAL_RULES.some(([,o,n])=>!same(rom.subarray(o,o+n),original.subarray(o,o+n))))throw new Error('Almacenamiento de textos de portada incompleto.');
    return;
  }
  if(!same(rom.subarray(LOADER,LOADER+5),Uint8Array.of(...(legacyTitleLegal(rom)?[0,0x78]:[0x40,0x73]),0,0xf0,0xaf))||word(rom,POOL)&0x8000||(word(rom,POOL)&0x7fff)>SIZE)throw new Error('Cargador de textos de portada inválido.');
  const data=atlas(rom);if(data.length!==(legacyTitleLegal(rom)?4096:6528))throw new Error('Atlas de textos de portada inválido.');
  const font=atlas(original),expected=relocated(original)?font.subarray(fontOffset(original)):font;
  if(!same(data.subarray(fontOffset(rom),fontOffset(rom)+expected.length),expected))throw new Error('La fuente PRESS START debe conservarse.');
  const used=new Set(LINES.flatMap(l=>Array.from({length:l.width/8},(_,i)=>legacyTitleLegal(rom)?(l.id==='title-license'?184:128)+i-128:tileAt(l,i)-52)));
  for(let tile=0;tile<fontOffset(rom)/32;tile++)if(!used.has(tile)&&data.subarray(tile*32,(tile+1)*32).some(Boolean))throw new Error('Tiles fuera de los textos de portada.');
  if(hasText(rom)){
    if((word(rom,POOL)&0x7fff)>SIZE-TEXT_SIZE)throw new Error('Textos de portada inválidos.');
    const resources=titleLegalResources(rom);
    LINES.forEach((l,i)=>{const o=TEXT_OFFSET+4+i*62,n=rom[o];if(n===255)return;
      if(n>Math.floor(l.width/6)||rom.slice(o+1+n,o+62).some(Boolean))throw new Error('Textos de portada inválidos.');
      const preview=previewTitleLegalText(rom,l.id,titleLegalTexts(rom)[i]);
      if(!same(resources[i].matrix.flat(),preview.matrix.flat())&&
        !same(resources[i].matrix.flat(),renderTitleLegalText(rom,l.id,titleLegalTexts(rom)[i],true).matrix.flat())&&
        !(titleLegalTexts(rom)[i]===titleLegalTexts(original)[i]&&same(resources[i].matrix.flat(),titleLegalResources(original)[i].matrix.flat())))throw new Error('Textos de portada inválidos.');
    });
  }
  LINES.forEach(l=>{if(!same(rom.subarray(l.map,l.map+l.size),lineMap(l,legacyTitleLegal(rom))))throw new Error('Mapa de texto de portada inválido.');});
}

const EXTRA_GLYPHS={
  F:['1111111','1100000','1100000','1111110','1100000','1100000','1100000'],
  J:['0001111','0000011','0000011','0000011','1100011','1100011','0111110'],
  P:['1111110','1100011','1100011','1111110','1100000','1100000','1100000'],
  Q:['0111110','1100011','1100011','1100011','1101011','1100110','0111101'],
  U:['1100011','1100011','1100011','1100011','1100011','1100011','0111110'],
  W:['1100011','1100011','1100011','1101011','1111111','1110111','1100011'],
  X:['1100011','1100011','0110110','0011100','0110110','1100011','1100011'],
  Z:['1111111','0000011','0000110','0011100','0110000','1100000','1111111'],
  '0':['0111110','1100011','1100111','1101011','1110011','1100011','0111110'],
  '2':['0111110','1100011','0000011','0000110','0011000','0110000','1111111'],
  '3':['0111110','1100011','0000011','0011110','0000011','1100011','0111110'],
  '4':['0000110','0001110','0011110','0110110','1100110','1111111','0000110'],
  '6':['0011110','0110000','1100000','1111110','1100011','1100011','0111110'],
  '7':['1111111','0000011','0000110','0001100','0011000','0011000','0011000'],
  '8':['0111110','1100011','1100011','0111110','1100011','1100011','0111110'],
  '-':['0000000','0000000','0000000','0111110','0000000','0000000','0000000'],
};
export function previewTitleLegalText(rom,id,value){
  return renderTitleLegalText(rom,id,value);
}
function renderTitleLegalText(rom,id,value,legacyFlat=false){
  const line=LINES.find(l=>l.id===id);if(!line)throw new Error('Texto de portada desconocido.');
  const text=value.trim().toUpperCase(),max=Math.floor(line.width/6);
  if(text.length>max)throw new Error(`El texto de portada admite hasta ${max} caracteres.`);
  if(!/^[A-Z0-9 ©.\-]*$/.test(text))throw new Error('Usa letras A–Z, números, espacios, puntos, guiones o ©.');
  const data=atlas(rom),font=tiles(relocated(rom)?data.subarray(fontOffset(rom)):data,4,1);
  const characters='©195KONAMILRGHTSEVD.',glyphs={};
  Array.from(characters).forEach((c,i)=>glyphs[c]=font.slice(i*8,i*8+8));
  ['C','B','Y'].forEach((c,i)=>glyphs[c]=font.slice((28+i)*8,(29+i)*8));
  const ink=font[0].find(Boolean)||1;
  // K has ink on every letter row, preserving the native palette's gradient.
  // The flat variant is only used to validate notices saved by older editors.
  const rowInk=glyphs.K.map(row=>row.find(Boolean)||ink);
  for(const [c,rows] of Object.entries(EXTRA_GLYPHS))glyphs[c]=[...rows.map((row,y)=>[0,...Array.from(row,b=>b==='1'?(legacyFlat?ink:rowInk[y]):0)]),Array(8).fill(0)];
  glyphs[' ']=Array.from({length:8},()=>Array(8).fill(0));
  const advance=text.length?Math.min(8,Math.floor(line.width/text.length)):8,left=Math.floor((line.width-text.length*advance)/2);
  const matrix=Array.from({length:8},()=>Array(line.width).fill(0));
  Array.from(text).forEach((c,i)=>{for(let y=0;y<8;y++)for(let x=0;x<advance;x++)matrix[y][left+i*advance+x]=glyphs[c][y][Math.floor(x*8/advance)];});
  return {text,matrix};
}
export function titleLegalTextPatches(original,current,id,value){
  const preview=previewTitleLegalText(original,id,value);
  return titleLegalPatches(original,current,id,preview.matrix,preview.text);
}
