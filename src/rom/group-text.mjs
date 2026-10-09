import {hasCustomGroups,readGroups,groupDataPatch} from './groups.mjs';
import {graphicPatches,selectionGroupGraphics} from './graphics.mjs';
import {previewBigTeamText} from './team-labels.mjs';
import {loRom} from './binary.mjs';
export const GROUP_TEXT_RULES=[['groups:text',loRom(0xaee900),116]];
export const GROUP_NAMES=['EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA-AFRICA','N.S.AMERICA','ALL STARS'];
export function groupTexts(rom){
 if(hasCustomGroups(rom))return readGroups(rom).map(g=>g.name);
 const offset=GROUP_TEXT_RULES[0][1];
 if(String.fromCharCode(...rom.slice(offset,offset+4))!=='GRPT')return GROUP_NAMES.slice();
 return GROUP_NAMES.map((name,i)=>String.fromCharCode(...rom.slice(offset+4+i*16,offset+20+i*16)).replace(/\0.*$/s,'')||name);
}
export function validateGroupTexts(rom,original){
 const [id,offset,size]=GROUP_TEXT_RULES[0];
 if(rom.slice(offset,offset+size).every((b,i)=>b===original[offset+i]))return;
 if(String.fromCharCode(...rom.slice(offset,offset+4))!=='GRPT')throw new Error('Textos de grupos inválidos.');
 for(let i=0;i<7;i++){
  const bytes=rom.slice(offset+4+i*16,offset+20+i*16),end=bytes.indexOf(0);
  if(end<0||bytes.slice(end).some(Boolean)||!/^([A-Z0-9 .-]{1,15})?$/.test(String.fromCharCode(...bytes.slice(0,end))))throw new Error('Textos de grupos inválidos.');
 }
}
export function previewGroupText(rom,resource,text){
 text=text.trim().toUpperCase();
 if(!/^[A-Z0-9][A-Z0-9 .-]{0,14}$/.test(text))throw new Error('El grupo admite hasta 15 letras A–Z, números, espacios, puntos o guiones.');
 const headers=selectionGroupGraphics(rom,true);
 const index=Number(resource.id.split(':')[1]);
 // Re-entering an original title restores its exact raster, including the
 // original kerning, highlights and numeral. The native atlas remains intact
 // when edited group titles are relocated to independent storage.
 if(index<7&&text===GROUP_NAMES[index])return {text,matrix:headers[index].matrix.map(row=>row.slice())};
 const native={};
 const take=(c,group,left,width,advance)=>{
  const raster=headers[group].matrix;
  const matrix=raster.map((row,y)=>[0,...row.slice(left,left+width).map((pixel,x)=>{
   if(pixel===1)return pixel;
   // Native letters overlap an outline column. Do not borrow an adjacent
   // letter's outline where this glyph has no stroke of its own.
   const touchesStroke=[-1,0,1].some(dy=>[-1,0,1].some(dx=>x+dx>=1&&x+dx<width-1&&raster[y+dy]?.[left+x+dx]===1));
   return touchesStroke?pixel:0;
  })]);
  native[c]={matrix,advance};
 };
 for(const [c,left] of [['E',9],['U',15],['R',21],['O',27],['P',33]])take(c,0,left,7,6);
 for(const [c,left,width,advance] of [['A',2,7,6],['S',8,7,6],['I',14,5,4],['-',25,3,4],['F',34,7,6],['C',50,7,6]])take(c,4,left,width,advance);
 take('N',5,0,7,6);take('M',5,28,7,6);take('.',5,7,3,4);take('L',6,17,6,5);take('T',6,34,7,6);
 for(let i=0;i<4;i++)native[String(i+1)]={matrix:headers[i].matrix.map(row=>row.slice(48,56)),advance:8};
 const paletteMap={8:2,9:3,10:1};
 const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
 const glyphs=Array.from(text,c=>{
  if(native[c])return native[c];
  if(c===' ')return {matrix:Array.from({length:16},()=>Array(4).fill(0)),advance:4};
  const letter=/[A-Z]/.test(c)?previewBigTeamText(rom,c).matrix:null;
  const glyph=Array.from({length:16},()=>Array(8).fill(0));
  for(let y=0;y<16;y++)for(let x=1;x<8;x++){
   // Letters absent from the continent atlas use the menu's letter, condensed
   // to the same five-pixel stroke width while preserving both outer edges.
   if(letter)glyph[y][x]=paletteMap[letter[y+3]?.[36+Math.round((x-1)*7/6)]]||0;
   else {const xx=Math.floor((x-1)/2),yy=Math.floor((y-3)/2);glyph[y][x]=xx<3&&yy>=0&&yy<5&&digits[Number(c)][yy*3+xx]==='1'?1:0;}
  }
  if(!letter){
   const stroke=glyph.map(row=>row.slice());
   for(let y=0;y<16;y++)for(let x=0;x<8;x++)if(!stroke[y][x]&&[-1,0,1].some(dy=>[-1,0,1].some(dx=>stroke[y+dy]?.[x+dx]===1)))glyph[y][x]=3;
  }
  return {matrix:glyph,advance:6};
 });
 const nativeWidth=glyphs.slice(0,-1).reduce((n,g)=>n+g.advance,0)+glyphs.at(-1).matrix[0].length;
 const source=Array.from({length:16},()=>Array(nativeWidth).fill(0));let cursor=0;
 // Adjacent native glyphs share their outline column. Transparent padding
 // must not erase the preceding stroke or highlight in that shared column.
 const priority={0:0,3:1,1:2,2:3};
 for(const glyph of glyphs){
  for(let y=0;y<16;y++)for(let x=0;x<glyph.matrix[y].length;x++)if(priority[glyph.matrix[y][x]]>priority[source[y][cursor+x]])source[y][cursor+x]=glyph.matrix[y][x];
  cursor+=glyph.advance;
 }
 const targetWidth=Math.min(64,nativeWidth),left=Math.floor((64-targetWidth)/2);
 const matrix=Array.from({length:16},(_,y)=>Array.from({length:64},(_,x)=>x>=left&&x<left+targetWidth?source[y][Math.floor((x-left)*nativeWidth/targetWidth)]:0));
 return {text,matrix};
}
export function groupTextPatches(original,current,resource,text){
 const preview=previewGroupText(original,resource,text),patches=graphicPatches(original,current,resource,preview.matrix);
 if(hasCustomGroups(current)){const groups=readGroups(current);groups[Number(resource.id.split(':')[1])].name=preview.text;patches.push(groupDataPatch(groups));return patches;}
 const [id,offset,size]=GROUP_TEXT_RULES[0];if(!original.slice(offset,offset+size).every(b=>b===255)&&String.fromCharCode(...original.slice(offset,offset+4))!=='GRPT')throw new Error('El espacio reservado para los grupos está ocupado.');const names=groupTexts(current),bytes=new Uint8Array(size);bytes.set([71,82,80,84]);names[Number(resource.id.split(':')[1])]=preview.text;
 names.forEach((name,i)=>bytes.set(Array.from(name,c=>c.charCodeAt(0)),4+i*16));
 patches.push({id,offset,bytes,label:'Textos de grupos'});return patches;
}
export function restoreGroupTextPatches(original,current,resource,matrix){
 if(hasCustomGroups(current)){const groups=readGroups(current),index=Number(resource.id.split(':')[1]);groups[index].name=groupTexts(original)[index]||`GRUPO ${index+1}`;return groupTextPatches(original,current,resource,groups[index].name);}
 const patches=graphicPatches(original,current,resource,matrix),[id,offset,size]=GROUP_TEXT_RULES[0],names=groupTexts(current),baseline=groupTexts(original);
 names[Number(resource.id.split(':')[1])]=baseline[Number(resource.id.split(':')[1])];
 const bytes=new Uint8Array(size);bytes.set([71,82,80,84]);names.forEach((name,i)=>bytes.set(Array.from(name,c=>c.charCodeAt(0)),4+i*16));
 patches.push({id,offset,bytes:names.every((n,i)=>n===baseline[i])?original.slice(offset,offset+size):bytes,label:'Textos de grupos'});return patches;
}
