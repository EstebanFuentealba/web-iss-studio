import {decompress,loRom,tiles} from './binary.mjs';
import {encodeTiles} from './encode-tiles.mjs';

// New glyphs use the native font's yellow face, white highlight and red edge.
// Original tiles 0..69 stay byte-identical, including the wide W/Y fragments.
export const EXTRA_MENU_GLYPHS={B:80,F:82,H:84,J:86,Q:88,U:90,V:92,X:94,Z:112,I:114};
const shapes={
 B:['111110','110011','110011','111110','110011','110011','111110'],
 F:['111111','110000','110000','111110','110000','110000','110000'],
 H:['110011','110011','110011','111111','110011','110011','110011'],
 J:['001111','000110','000110','000110','110110','110110','011100'],
 Q:['011110','110011','110011','110011','110111','011110','000011'],
 U:['110011','110011','110011','110011','110011','110011','011110'],
 V:['110011','110011','110011','110011','010010','011110','001100'],
 X:['110011','110011','011110','001100','011110','110011','110011'],
 Z:['111111','000011','000110','001100','011000','110000','111111'],
};
export function expandedMenuFont(rom){
 const stock=decompress(rom,loRom(0x9e8000)),bytes=new Uint8Array(144*32);bytes.set(stock);
 const strip=tiles(bytes,4,1);
 const put=(tile,glyph)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)strip[(tile+(x>>3)+(y>>3)*16)*8+y%8][x%8]=glyph[y][x];};
 for(const [c,shape] of Object.entries(shapes)){
  const mask=Array.from({length:16},(_,y)=>Array.from({length:16},(_,x)=>x>=2&&x<14&&y>=1&&y<15&&shape[(y-1)>>1][(x-2)>>1]==='1'));
  const glyph=mask.map((row,y)=>row.map((on,x)=>{
   if(on)return y===0||!mask[y-1][x]?8:1;
   if([-1,0,1].some(dy=>[-1,0,1].some(dx=>mask[y+dy]?.[x+dx])))return y<14?4:5;
   return 0;
  }));put(EXTRA_MENU_GLYPHS[c],glyph);
 }
 const narrow=Array.from({length:16},(_,y)=>Array.from({length:16},(_,x)=>x<8?strip[(64+(y>>3))*8+y%8][x]:0));put(EXTRA_MENU_GLYPHS.I,narrow);
 return encodeTiles(strip,4);
}
