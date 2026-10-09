import {decompress,loRom,word,tiles,palette} from './binary.mjs';
import {compress,graphicResources,graphicPatches,smallLabelPatches,smallLabelMatrix} from './graphics.mjs';
// COD_BigTeamAndStadiumNames, 42 frames / 411 sprites, loaded at $7E4F02.
// Each frame is a list of x/y/tile/attributes in four separate planes.
export const BIG_LABEL_ADDRESS=0x98a526;
export const BIG_LABEL_ID=`team-labels:${loRom(BIG_LABEL_ADDRESS)}`;
// Frame identities verified from the rendered glyphs (e.g. frame 14 = ITALY).
export const TEAM_LABEL_FRAMES=[14,15,16,0,2,3,4,6,12,5,8,10,7,11,9,13,1,36,18,20,21,22,37,32,19,17,33,24,23,25,34,29,30,27,26,31];
export function labelLayout(rom) {
  const data=decompress(rom,loRom(BIG_LABEL_ADDRESS)),count=data[0],sprites=word(data,1),base=3+count;
  if(count!==42||sprites!==411||data.length!==base+sprites*4)throw new Error('Formato de nombres grandes no compatible.');
  return {data,sprites,base};
}
export function labelFrame(layout,team) {
  const frame=TEAM_LABEL_FRAMES[team];if(frame===undefined)throw new Error('Equipo inválido.');
  let start=0;for(let i=0;i<frame;i++)start+=layout.data[3+i];
  return {frame,start,count:layout.data[3+frame]};
}
export function bigLabel(rom,team) {
  const layout=labelLayout(rom),frame=labelFrame(layout,team),font=tiles(decompress(rom,loRom(0x9de13c)),4,16);
  const matrix=Array.from({length:24},()=>new Array(80).fill(0));
  for(let i=0;i<frame.count;i++) {
    const p=layout.base+frame.start+i,x0=layout.data[p],y0=layout.data[p+layout.sprites],id=layout.data[p+layout.sprites*2],attr=layout.data[p+layout.sprites*3],size=attr&16?16:8;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const tile=id+Math.floor(x/8)+Math.floor(y/8)*16-128;
      if(tile<0||tile>=128||x0+x>=80||y0+y>=24)continue;
      const pixel=font[Math.floor(tile/16)*8+y%8][tile%16*8+x%8];
      if(pixel)matrix[y0+y][x0+x]=pixel;
    }
  }
  const colors=new Array(16).fill('transparent');colors.splice(1,11,...palette(rom,loRom(0x89e362),11));
  return {matrix,colors,maxLetters:Math.floor(frame.count/2)};
}
export function validateLabelLayout(bytes,original) {
  const baseline=labelLayout(original),n=baseline.sprites,base=baseline.base;
  if(bytes.length!==baseline.data.length||bytes.slice(0,base).some((b,i)=>b!==baseline.data[i]))throw new Error('No se puede cambiar la cantidad de sprites de los nombres grandes.');
  for(let i=base;i<bytes.length;i++) if(bytes[i]!==baseline.data[i]) {
    const index=(i-base)%n,x=bytes[base+index],y=bytes[base+n+index],tile=bytes[base+n*2+index],attr=bytes[base+n*3+index];
    const glyph=(tile>=128&&tile<=159)||(tile>=160&&tile<=185)||tile===170;
    if(x>72||![4,12].includes(y)||!glyph||attr!==10)throw new Error('Sprite de nombre grande inválido.');
  }
}
export function renameTeamPatches(original,current,team,name) {
  name=name.trim().toUpperCase();
  const layout=labelLayout(current),frame=labelFrame(layout,team),max=Math.floor(frame.count/2);
  if(!/^[A-Z]+(?: [A-Z]+)*$/.test(name)||name.length>max)throw new Error(`Este slot admite ${max} caracteres A–Z/espacios con los sprites existentes. No se expande la memoria del menú.`);
  const small=Array.from({length:8},()=>new Array(32).fill(0));
  const tileFor=c=>c===' '?170:(c.charCodeAt(0)-65<16?128+c.charCodeAt(0)-65:160+c.charCodeAt(0)-65-16);
  const left=Math.min(...Array.from({length:frame.count},(_,i)=>layout.data[layout.base+frame.start+i]));
  for(let i=0;i<frame.count;i++) {
    const char=max-1-Math.floor(i/2),bottom=i%2===0,tile=char<name.length?tileFor(name[char]):170;
    const offset=layout.base+frame.start+i;
    layout.data[offset]=left+char*8;
    layout.data[offset+layout.sprites]=bottom?12:4;
    layout.data[offset+layout.sprites*2]=tile===170?170:tile+bottom*16;
    layout.data[offset+layout.sprites*3]=10;
  }
  const compact=compactTeamName(original,name);
  compact.forEach((row,y)=>small[y]=row);
  const resource=graphicResources(current,team).find(r=>r.label==='Rótulo del equipo');
  const smallPatches=graphicPatches(original,current,resource,small),offset=loRom(BIG_LABEL_ADDRESS),capacity=word(original,offset)&0x7fff;
  validateLabelLayout(layout.data,original);
  const encoded=compress(layout.data),bytes=Uint8Array.from(original.subarray(offset,offset+capacity));
  if(encoded.length>capacity)throw new Error(`Los nombres grandes requieren ${encoded.length} bytes; hay ${capacity}. Prueba otro nombre.`);
  bytes.set(encoded);
  return [...smallPatches,{id:BIG_LABEL_ID,offset,label:`Nombre grande de selección · ${name}`,bytes}];
}
export function restoreTeamLabelPatches(original,current,team) {
  const layout=labelLayout(current),baseline=labelLayout(original),frame=labelFrame(layout,team);
  for(let p=0;p<4;p++)for(let i=0;i<frame.count;i++){const offset=layout.base+p*layout.sprites+frame.start+i;layout.data[offset]=baseline.data[offset];}
  const offset=loRom(BIG_LABEL_ADDRESS),capacity=word(original,offset)&0x7fff,bytes=Uint8Array.from(original.subarray(offset,offset+capacity));
  if(layout.data.some((b,i)=>b!==baseline.data[i])){const encoded=compress(layout.data);if(encoded.length>capacity)throw new Error('La restauración parcial supera el espacio del bloque de nombres.');bytes.set(encoded);}
  return [...smallLabelPatches(original,current,team,smallLabelMatrix(original,team)),{id:BIG_LABEL_ID,offset,bytes,label:'Restaurar nombre grande del equipo'}];
}

// Native compact glyphs, cropped from immutable country rasters. In particular,
// preserve gray edge pixels rather than subsampling the unrelated red font.
const COMPACT_GLYPHS={A:[1,18,3],B:[30,6,3],C:[9,21,3],D:[1,26,3],E:[2,2,3],F:[9,5,3],G:[2,10,3],H:[1,2,3],I:[0,8,1],J:[24,5,4],K:[25,9,3],L:[1,10,3],M:[7,14,3],N:[1,22,3],O:[1,6,3],P:[6,1,3],Q:[1,6,3],R:[9,9,3],S:[11,3,3],T:[0,10,3],U:[6,17,3],V:[6,17,3],W:[3,15,5],X:[33,13,3],Y:[0,21,3],Z:[30,18,3]};
export function compactTeamName(original,name){
  const glyphs=Array.from(name,c=>{
    if(c===' ')return Array.from({length:7},()=>[0,0]);
    const source=COMPACT_GLYPHS[c];
    const [team,x,width]=source,glyph=smallLabelMatrix(original,team).slice(0,7).map(row=>row.slice(x,x+width).map(p=>p===3?0:p));
    // Q and V are absent from country names. Adapt O/U strokes at this tiny
    // resolution instead of reducing the wide italic Layer 3 character set.
    if(c==='Q'){glyph[5][1]=1;glyph[6][2]=1;}
    if(c==='V'){glyph[5]=[1,0,1];glyph[6]=[0,1,0];}
    return glyph;
  });
  const width=glyphs.reduce((n,g)=>n+g[0].length,0)+glyphs.length-1;
  if(width>32)throw new Error('El nombre no cabe en el rótulo pequeño de 32 píxeles.');
  const result=Array.from({length:8},()=>Array(32).fill(0));let x=Math.floor((32-width)/2);
  for(const glyph of glyphs){glyph.forEach((row,y)=>row.forEach((p,i)=>result[y][x+i]=p));x+=glyph[0].length+1;}
  return result;
}
