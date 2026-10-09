import {loRom,word,decompress,tiles,palette} from './binary.mjs';
import {compress} from './compression.mjs';
import {encodeTiles} from './graphics.mjs';

// Native boot DMA scripts. Only these scene-specific pointers are redirected;
// other uses of the Konami atlas (including OBJ) retain the original data.
// Pools are documented FREE_BYTES, separate from flags, labels and groups.
const SCREENS=[
 {id:'boot-konami',label:'Inicio · Logo de Konami',gfx:0xa8f4f5,map:0xa1f969,gfxLoader:0x8284fb,mapLoader:0x8284ec,pool:0xb0c2de,size:15650,mapPool:0x9bea6d,mapSize:2560,reserve:159,background:'#ffffff'},
 {id:'boot-intro',label:'Inicio · Pantalla posterior a Konami',gfx:0xa1e527,map:0xa1ed19,gfxLoader:0x829b6a,mapLoader:0x829b79,pool:0x86e5ab,size:5047,mapPool:0x9bf46d,mapSize:2560,reserve:144,background:'#000000'},
];
export const BOOT_SCREEN_RULES=SCREENS.flatMap(s=>[
 [`${s.id}:atlas`,loRom(s.pool),s.size],[`${s.id}:map`,loRom(s.mapPool),s.mapSize],
 [`${s.id}:atlas-pointer`,loRom(s.gfxLoader),3],[`${s.id}:map-pointer`,loRom(s.mapLoader),3],
]);
const pointer=(rom,address)=>{const o=loRom(address);return rom[o]|rom[o+1]<<8|rom[o+2]<<16;};
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function screenColors(rom,s){
 const colors=new Array(48).fill(s.background);
 if(s.id==='boot-konami'){
  [0x898046,0x898068,0x89808a].forEach((address,p)=>colors.splice(p*16,16,...palette(rom,loRom(address),16)));
 }else{
  // BG1 text is palette 2, the player image palette 1. Palette 0 is black.
  colors.splice(17,15,...palette(rom,loRom(0x89f592),15));
  colors.splice(33,4,...palette(rom,loRom(0x89f588),4));
 }
 for(let p=0;p<3;p++)colors[p*16]=s.background;
 return colors;
}
function data(rom,s){
 const g=pointer(rom,s.gfxLoader),m=pointer(rom,s.mapLoader);
 if(![s.gfx,s.pool].includes(g)||![s.map,s.mapPool].includes(m)||(g===s.pool)!==(m===s.mapPool))throw new Error('Cargador de pantalla inicial no compatible.');
 const atlas=decompress(rom,loRom(g)),map=decompress(rom,loRom(m));
 if(atlas.length%32||atlas.length>512*32||map.length!==2048)throw new Error('Gráficos de pantalla inicial inválidos.');
 return {atlas,map,custom:g===s.pool};
}
export function bootScreenResources(rom){
 return SCREENS.map(s=>{
  const {atlas,map}=data(rom,s),strip=tiles(atlas,4,1),colors=screenColors(rom,s);
  const matrix=Array.from({length:224},(_,y)=>Array.from({length:256},(_,x)=>{
   const entry=word(map,((y>>3)*32+(x>>3))*2),t=entry&1023,p=(entry>>10)&7;
   const pixel=strip[t*8+(entry&0x8000?7-y%8:y%8)]?.[entry&0x4000?7-x%8:x%8];
   if(pixel===undefined||p>2)throw new Error('Mapa de pantalla inicial inválido.');
   return pixel?p*16+pixel:0;
  }));
  return {id:s.id,label:s.label,kind:'boot-screen',bpp:8,columns:32,capacity:s.size+s.mapSize,matrix,colors};
 });
}

// Each SNES tile selects one 16-color palette. Choose the palette with the
// smallest total RGB error so an imported image cannot mix banks in one tile.
export function bootScreenPreview(resource,matrix){
 if(matrix.length!==224||matrix.some(r=>r.length!==256))throw new Error('La pantalla inicial debe medir 256 × 224.');
 if(matrix.some(r=>r.some(v=>!Number.isInteger(v)||v<0||v>=resource.colors.length)))throw new Error('Índice de paleta inválido.');
 const rgb=resource.colors.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
 const banks=[0,1,2];
 const nearest=rgb.map(c=>banks.map(bank=>{
  let best=0,error=Infinity;
  for(let i=0;i<16;i++){const index=i?bank*16+i:0,d=rgb[index].reduce((sum,v,k)=>sum+(v-c[k])**2,0);if(d<error){error=d;best=index;}}
  return {index:best,error};
 }));
 const result=matrix.map(r=>r.slice()),map=new Uint8Array(2048);
 for(let y=0;y<224;y+=8)for(let x=0;x<256;x+=8){
  let choice=0,error=Infinity;
  banks.forEach((bank,b)=>{let total=0;for(let j=0;j<8;j++)for(let i=0;i<8;i++)total+=nearest[matrix[y+j][x+i]][b].error;if(total<error){error=total;choice=b;}});
  const entry=banks[choice]<<10,o=((y/8)*32+x/8)*2;map[o]=entry&255;map[o+1]=entry>>8;
  for(let j=0;j<8;j++)for(let i=0;i<8;i++)result[y+j][x+i]=nearest[matrix[y+j][x+i]][choice].index;
 }
 return {matrix:result,map};
}
export function bootScreenPatches(original,current,id,matrix){
 const s=SCREENS.find(s=>s.id===id);if(!s)throw new Error('Pantalla inicial desconocida.');
 const initial=bootScreenResources(original).find(r=>r.id===id),resource=bootScreenResources(current).find(r=>r.id===id);
 const patches=BOOT_SCREEN_RULES.filter(([key])=>key.startsWith(id+':')).map(([id,offset,size])=>({id,offset,bytes:original.slice(offset,offset+size),label:s.label}));
 if(JSON.stringify(matrix)===JSON.stringify(initial.matrix))return patches;
 const baseline=data(original,s);
 if(!baseline.custom)for(const [address,size] of [[s.pool,s.size],[s.mapPool,s.mapSize]])if(!original.subarray(loRom(address),loRom(address)+size).every(b=>b===255))throw new Error('El espacio reservado para la pantalla inicial está ocupado.');
 const preview=bootScreenPreview(resource,matrix),atlas=new Uint8Array(512*32),native=decompress(original,loRom(s.gfx));atlas.set(native);
 // Retain the native prefix for the animated mask. Intro VRAM $3000..$30FF
 // (tiles 128..143) is overwritten by the TV-static DMA during this scene.
 let count=s.reserve;const seen=new Map();
 for(let t=0;t<Math.min(native.length/32,s.id==='boot-intro'?128:s.reserve);t++)seen.set(Array.from(atlas.subarray(t*32,t*32+32)).join(','),t);
 for(let y=0;y<224;y+=8)for(let x=0;x<256;x+=8){
  const tile=encodeTiles(preview.matrix.slice(y,y+8).map(row=>row.slice(x,x+8).map(v=>v%16)),4),key=Array.from(tile).join(',');
  let t=seen.get(key);if(t===undefined){if(count>=512)throw new Error('La imagen supera los tiles disponibles. Reduce el detalle o usa un fondo uniforme.');t=count++;seen.set(key,t);atlas.set(tile,t*32);}
  const o=((y/8)*32+x/8)*2,entry=word(preview.map,o)|t;preview.map[o]=entry&255;preview.map[o+1]=entry>>8;
 }
 for(const [suffix,bytes,address,size] of [['atlas',compress(atlas.subarray(0,count*32)),s.pool,s.size],['map',compress(preview.map),s.mapPool,s.mapSize]]){
  if(bytes.length>size)throw new Error('La imagen supera el espacio comprimido disponible. Reduce el detalle.');
  const patch=patches.find(p=>p.id===`${id}:${suffix}`);patch.bytes.fill(255);patch.bytes.set(bytes);
  patches.find(p=>p.id===`${id}:${suffix}-pointer`).bytes.set([address&255,address>>8&255,address>>16]);
 }
 return patches;
}
export function validateBootScreens(rom,original){
 for(const s of SCREENS){
  const d=data(rom,s);if(!d.custom)continue;
  for(const [address,size] of [[s.pool,s.size],[s.mapPool,s.mapSize]])if((word(rom,loRom(address))&0x7fff)>size)throw new Error('Pantalla inicial fuera de su espacio reservado.');
  const native=decompress(original,loRom(s.gfx));
  if(!equal(d.atlas.subarray(0,native.length),native))throw new Error('Los gráficos auxiliares de la introducción fueron alterados.');
  for(let i=0;i<d.map.length;i+=2){const e=word(d.map,i),t=e&1023,p=e>>10&7;if(t>=d.atlas.length/32||p>2||(s.id==='boot-intro'&&t>=128&&t<144))throw new Error('Referencia gráfica inválida en la pantalla inicial.');}
 }
 bootScreenResources(rom);
}
