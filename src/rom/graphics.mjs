import { decompress, tiles, word, loRom, palette } from './binary.mjs';

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

// Minimum-cost command selection, with bounded history search. The output is
// validated by the existing decoder before any ROM write is permitted.
export function compress(input, interleaved = false) {
  const data = Uint8Array.from(input);
  if (!data.length || data.length > 65536) throw new Error('Tamaño gráfico inválido.');
  if (interleaved) {
    if (data.length % 16) throw new Error('Tiles entrelazados incompletos.');
    for (let i=0;i<data.length;i+=16) {
      const group = data.slice(i,i+16);
      for(let y=0;y<8;y++) { data[i+y]=group[y*2]; data[i+y+8]=group[y*2+1]; }
    }
  }
  const candidates = [], history = new Map();
  for(let i=0;i<data.length;i++) {
    const key = data[i]*256 + (data[i+1] || 0), previous = history.get(key) || [];
    candidates[i] = previous.filter(p => i-p<=1024);
    previous.push(i); history.set(key,previous.filter(p=>i-p<=1024));
  }
  const cost = new Float64Array(data.length+1), command = new Array(data.length);
  for(let i=data.length-1;i>=0;i--) {
    cost[i]=Infinity;
    const offer = (length,bytes) => { const c=bytes.length+cost[i+length]; if(c<cost[i]) {cost[i]=c;command[i]={length,bytes};} };
    for(let n=1;n<=31 && i+n<=data.length;n++) offer(n,[0x80|n,...data.slice(i,i+n)]);
    let run=1; while(run<257 && i+run<data.length && data[i+run]===data[i]) run++;
    for(let n=2;n<=Math.min(run,33);n++) offer(n,[0xc0|(n-2),data[i]]);
    if(data[i]===0) for(let n=2;n<=run;n++) offer(n,n<=32?[0xe0|(n-2)]:[0xff,n-2]);
    let pairs=0; while(pairs<33 && i+pairs*2+1<data.length && data[i+pairs*2]===0) pairs++;
    for(let n=2;n<=pairs;n++) offer(n*2,[0xa0|(n-2),...Array.from({length:n},(_,p)=>data[i+p*2+1])]);
    for(const source of [...candidates[i], ...(i<1024?Array.from({length:33},(_,k)=>-k-1).filter(p=>p+1024>=i):[])]) {
      let n=0; while(n<33 && i+n<data.length && (source+n<0?0:data[source+n])===data[i+n]) n++;
      const address=(source+0x3df)&1023;
      for(let length=2;length<=n;length++) offer(length,[((length-2)<<2)|(address>>>8),address&255]);
    }
  }
  const output=[0,0]; for(let i=0;i<data.length;) {output.push(...command[i].bytes);i+=command[i].length;}
  if(output.length>0x7fff) throw new Error('Bloque comprimido demasiado grande.');
  output[0]=output.length&255; output[1]=(output.length>>>8)|(interleaved?0x80:0);
  const result=Uint8Array.from(output), decoded=decompress(result,0);
  if(decoded.length!==input.length || decoded.some((b,i)=>b!==input[i])) throw new Error('Falló la verificación de compresión.');
  return result;
}

export function rgb555(hex) {
  if(!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('Color inválido.');
  const values=[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*31/255));
  const value=values[0]|values[1]<<5|values[2]<<10;
  return Uint8Array.of(value&255,value>>>8);
}

export function graphicResources(rom, team) {
  const compressed=(label,address,bpp,columns,colors)=> {
    const offset=loRom(address), capacity=word(rom,offset)&0x7fff, data=decompress(rom,offset);
    return {id:`graphic:${offset}`,label,offset,capacity,bpp,columns,compressed:true,interleaved:!!(word(rom,offset)&0x8000),matrix:tiles(data,bpp,columns),colors,decodedSize:data.length};
  };
  const flagColors=new Array(16).fill('transparent');
  flagColors.splice(12,4,...palette(rom,loRom(0x890000|word(rom,0xe7d8+team*2))+2,4));
  const result=[{id:`flag:${team}`,label:'Bandera completa · independiente',kind:'flag',team,bpp:4,columns:3,capacity:204,colors:flagColors,matrix:flagMatrix(rom,team)}];
  result.push({id:`team-label:${team}`,kind:'label',team,label:'Rótulo del equipo',bpp:2,columns:4,capacity:69,matrix:smallLabelMatrix(rom,team),colors:['transparent','#ffffff','#b8b8b8','#555555']});
  const kit=palette(rom,loRom(0x890000|word(rom,0x1027a+team*2))+2,16);kit[0]='transparent';
  const raw=(label,start,end,columns,colors=kit)=> {
    const offset=loRom(start),capacity=loRom(end)-offset;
    return {id:`graphic:${offset}`,label,offset,capacity,bpp:4,columns,compressed:false,shared:true,matrix:tiles(rom.slice(offset,offset+capacity),4,columns),colors,decodedSize:capacity};
  };
  const detail=0x980000|word(rom,0xce8a+team*2);
  const playerRanges=[[0xa9a7c6,256],[0xa9a8c8,224],[detail,32]];
  result.push(spriteResource(rom,'Detalles de camiseta · vista frontal compartida',playerRanges,0x988472,112,kit,[2]));
  result.push(raw('Números de camisetas · atlas compartido',0x98e5d4,0x98f014,2));
  const goalie=palette(rom,loRom(0x890000|word(rom,0x10326+team*2))+2,11);
  goalie.unshift('transparent');
  while(goalie.length<16) goalie.push('transparent');goalie[0]='transparent';
  result.push(spriteResource(rom,'Portero completo · sprite compartido',[[0x90ccf2,224],[0x90cdd4,192]],0x988846,39,goalie));
  result.push(spriteResource(rom,'Jugador completo · sprite compartido',playerRanges,0x988472,112,kit,[0,1]));
  result.push(raw('Balón · atlas compartido',0x9a8000,0x9a8600,8));
  for(let hair=1;hair<=13;hair++) result.push(raw(`Pelo ${hair} · atlas compartido`,0x97cd58+(hair-1)*0x300,0x97cd58+hair*0x300,24));
  // Compressed tile atlases, not assembled screens. Sprite graphics use 4bpp;
  // player portraits are Mode 3 (8bpp); their tilemap/direct-color layout is separate.
  result.push(titleLogo(rom));
  return result;
}

export function graphicPatch(original, resource, matrix) {
  const bytes=encodeTiles(matrix,resource.bpp);
  if(bytes.length!==resource.decodedSize) throw new Error('La resolución debe conservarse.');
  const capacity=resource.compressed?word(original,resource.offset)&0x7fff:resource.capacity;
  const encoded=resource.compressed?compress(bytes,resource.interleaved):bytes;
  if(encoded.length>capacity) throw new Error(`El gráfico necesita ${encoded.length} bytes; solo hay ${capacity}. Reduce detalle o restaura píxeles.`);
  const padded=Uint8Array.from(original.subarray(resource.offset,resource.offset+capacity));padded.set(encoded);
  return {id:resource.id,label:resource.label,offset:resource.offset,bytes:padded};
}

// DATA_82F7A4 is referenced only by CODE_85A8FB, the national flag loader.
// Its four source banks are changed together. $AFBD1E..$AFFFFF is documented
// FREE_BYTES (17122 bytes); reserve 84 fixed slots, each fitting worst-case RAW.
export const FLAG_POOL=loRom(0xafbd1e), FLAG_SLOT=102, FLAG_POOL_SIZE=84*FLAG_SLOT;
export const FLAG_TEMPLATE=loRom(0x82f7a4), FLAG_TABLE=0xe730;
export const FLAG_RULES=[['flags:pool',FLAG_POOL,FLAG_POOL_SIZE],['flags:pointers',FLAG_TABLE,168],['flags:loader',FLAG_TEMPLATE,23],['flags:match-loader',0xe715,23],['flags:single-loader',0xeb80,13],['flags:select-script',loRom(0x82fb5d),508],['flags:select-entry',loRom(0x87ad9a),2],['flags:select-map',loRom(0x82f829),84]];
// Selection also keeps stadium tiles at $7F2280..$7F33BF. Retain the old
// flag buffer for 32 countries; extra countries use the menu's unused $3400 area.
export function selectionFlagAddress(team){return team<32?0xa80+team*192:0x3400+(team-32)*192;}
export function flagBank(rom) {return rom[FLAG_TEMPLATE+6];}
export function flagMatrix(rom,team) {
  const bank=flagBank(rom)===0xaf && rom[0xe715+6]!==0xaf && team>=36?0xa7:flagBank(rom);
  return [0,1].flatMap(part=>tiles(decompress(rom,loRom(bank<<16|word(rom,FLAG_TABLE+team*4+part*2))),4,3));
}
export function validateFlagStorage(rom,original) {
  const bank=flagBank(rom),relocated=bank===0xaf;
  if(bank!==flagBank(original)&&!relocated)throw new Error('Banco de banderas inválido.');
  for(const template of [FLAG_TEMPLATE,0xe715,0xeb80])for(let i=0;i<(template===0xeb80?13:23);i++)if(rom[template+i]!==((template===0xeb80?[6,11]:[6,11,16,21]).includes(i)&&relocated?0xaf:original[template+i]))throw new Error('Cargador de banderas inválido.');
  if(relocated){
    const script=loRom(0x82fb5d);if(word(rom,loRom(0x87ad9a))!==0xfb5d||word(rom,script)!==1||word(rom,script+506)!==65535)throw new Error('Precarga de banderas inválida.');
    for(let i=0;i<42;i++){const dest=selectionFlagAddress(i);if(word(rom,loRom(0x82f829)+i*2)!==dest)throw new Error('Mapa de banderas inválido.');for(let part=0;part<2;part++){const off=script+2+(i*2+part)*6;if(word(rom,off)!==dest+part*96||rom[off+2]!==0x7f||word(rom,off+3)!==0xbd1e+(i*2+part)*FLAG_SLOT||rom[off+5]!==0xaf)throw new Error('Fuente de precarga inválida.');}}
  }
  for(let i=0;i<84;i++) {
    const pointer=word(rom,FLAG_TABLE+i*2),expected=relocated?0xbd1e+i*FLAG_SLOT:word(original,FLAG_TABLE+i*2);
    if(pointer!==expected)throw new Error('Puntero de bandera inválido.');
    const offset=loRom(bank<<16|pointer),size=word(rom,offset)&0x7fff;
    if(relocated&&size>FLAG_SLOT)throw new Error('Bandera fuera de su espacio reservado.');
    const bytes=decompress(rom,offset);
    if(bytes.length!==96||tiles(bytes,4,3).flat().some(p=>p!==0&&p<12))throw new Error('Formato de bandera inválido.');
  }
}
export function flagPatches(original,current,team,matrix,legacy=false) {
  if(matrix.length!==16||matrix.some(row=>row.length!==24))throw new Error('La bandera debe medir 24 × 16.');
  const all=Array.from({length:42},(_,i)=>i===team?matrix:flagMatrix(legacy&&i>=36?original:current,i));
  if(all.some(m=>m.flat().some(p=>p!==0&&(!Number.isInteger(p)||p<12||p>15))))throw new Error('La bandera usa los colores 12–15 o transparencia.');
  const pristine=all.every((m,i)=>JSON.stringify(m)===JSON.stringify(flagMatrix(original,i)));
  const changes=FLAG_RULES.map(([id,offset,size])=>({id,offset,label:'Banderas independientes',bytes:Uint8Array.from(original.subarray(offset,offset+size))}));
  if(!pristine || (flagBank(original)===0xaf&&word(original,loRom(0x87ad9a))!==0xfb5d)) {
    if(!((flagBank(original)===0xa7&&original.subarray(FLAG_POOL,FLAG_POOL+FLAG_POOL_SIZE).every(b=>b===255))||flagBank(original)===0xaf))throw new Error('La ROM no tiene libre el espacio verificado para las banderas.');
    if(flagBank(original)===0xa7&&!original.subarray(loRom(0x82fb5d),loRom(0x82fb5d)+508).every(b=>b===255))throw new Error('El espacio de precarga de banderas está ocupado.');
    all.forEach((m,i)=>[0,1].forEach(part=>{
      const encoded=compress(encodeTiles(m.slice(part*8,part*8+8),4));
      if(encoded.length>FLAG_SLOT)throw new Error('La bandera excede su espacio reservado.');
      const slot=i*2+part,pointer=0xbd1e+slot*FLAG_SLOT;
      changes[0].bytes.set(encoded,slot*FLAG_SLOT);changes[1].bytes.set([pointer&255,pointer>>>8],slot*2);
    }));
    for(const change of changes.filter(p=>['flags:loader','flags:match-loader','flags:single-loader'].includes(p.id)))for(const i of (change.id==='flags:single-loader'?[6,11]:[6,11,16,21]))change.bytes[i]=0xaf;
    const script=changes.find(p=>p.id==='flags:select-script').bytes,map=changes.find(p=>p.id==='flags:select-map').bytes;
    script.set([1,0]);script.set([255,255],506);
    for(let i=0;i<42;i++){const dest=selectionFlagAddress(i);map.set([dest&255,dest>>>8],i*2);for(let part=0;part<2;part++){const p=0xbd1e+(i*2+part)*FLAG_SLOT,d=dest+part*96;script.set([d&255,d>>>8,0x7f,p&255,p>>>8,0xaf],2+(i*2+part)*6);}}
    changes.find(p=>p.id==='flags:select-entry').bytes.set([0x5d,0xfb]);
  }
  return changes;
}

// Dynamic DMA sends the first tile row to VRAM $6000 and the second to $6100.
// OAM records supply signed positions, 8/16 pixel sizes and horizontal flips.
// The cumulative sprite indices correspond to WRAM $40E0 and $4958.
function spriteResource(rom,label,ranges,address,start,colors,editableParts=[0,1]) {
  const parts=ranges.map(([address,size])=>{const offset=loRom(address);return {id:`${ranges.length>2&&address===ranges[2][0]?'detail':'graphic'}:${offset}`,offset,capacity:size,bpp:4,columns:size/32,decodedSize:size,compressed:false};});
  const strips=parts.map(p=>tiles(rom.subarray(p.offset,p.offset+p.capacity),4,p.columns));
  const data=decompress(rom,loRom(address)),count=word(data,1),base=3+data[0];
  let sum=0,frame=0;while(sum<start&&frame<data[0])sum+=data[3+frame++];
  if(sum!==start)throw new Error('Composición OAM no compatible.');
  const sprites=Array.from({length:data[3+frame]},(_,i)=>{
    const values=[0,1,2,3].map(p=>data[base+count*p+start+i]);
    return {x:values[0]>127?values[0]-256:values[0],y:values[1]>127?values[1]-256:values[1],tile:values[2],attr:values[3],size:values[3]&16?16:8};
  }).filter(s=>s.tile<parts[0].columns||(parts[2]&&s.tile===23)); // Render supplied pose tiles plus the jersey overlay.
  const left=Math.min(...sprites.map(s=>s.x)),top=Math.min(...sprites.map(s=>s.y)),width=Math.ceil((Math.max(...sprites.map(s=>s.x+s.size))-left)/8)*8,height=Math.ceil((Math.max(...sprites.map(s=>s.y+s.size))-top)/8)*8;
  const matrix=Array.from({length:height},()=>Array(width).fill(0)),owners=matrix.map(row=>row.map(()=>null));
  // The first OAM entry wins at overlapping opaque pixels, as on SNES.
  for(const s of [...sprites].reverse())for(let y=0;y<s.size;y++)for(let x=0;x<s.size;x++) {
    const fx=s.attr&64?s.size-1-x:x,fy=s.attr&128?s.size-1-y:y,tile=s.tile+Math.floor(fx/8)+Math.floor(fy/8)*16,part=parts[2]&&tile===23?2:tile>=16?1:0,t=part===2?0:tile%16;
    if(t>=parts[part].columns)continue;
    const sx=t*8+fx%8,sy=fy%8,px=s.x-left+x,py=s.y-top+y,pixel=strips[part][sy][sx];
    if(pixel||!owners[py][px]||part===2){if(pixel||!owners[py][px])matrix[py][px]=pixel;owners[py][px]={part,x:sx,y:sy};}
  }
  const editable=owners.map(row=>row.map(o=>!!o&&editableParts.includes(o.part)));
  return {id:editableParts.length===1?`detail-preview:${parts[2].offset}`:`sprite:${parts[0].offset}`,kind:'sprite',editableParts,editable,label,shared:true,bpp:4,columns:width/8,capacity:parts.reduce((n,p,i)=>n+(editableParts.includes(i)?p.capacity:0),0),parts,owners,matrix,colors};
}
export function graphicPatches(original,current,resource,matrix) {
  if(resource.kind==='flag')return flagPatches(original,current,resource.team,matrix);
  if(resource.kind==='label')return smallLabelPatches(original,current,resource.team,matrix);
  if(!['sprite','composite'].includes(resource.kind))return [graphicPatch(original,resource,matrix)];
  if(matrix.length!==resource.matrix.length||matrix.some(row=>row.length!==resource.matrix[0].length))throw new Error('La resolución debe conservarse.');
  const strips=resource.parts.map(p=>tiles(p.compressed?decompress(current,p.offset):current.subarray(p.offset,p.offset+p.capacity),4,p.columns)),changed=new Map();
  matrix.forEach((row,y)=>row.forEach((pixel,x)=>{
    if(!Number.isInteger(pixel)||pixel<0||pixel>=(resource.kind==='composite'?resource.colors.length:16))throw new Error('Índice de paleta inválido.');
    if(pixel===resource.matrix[y][x])return;
    const owner=resource.owners[y][x];if(!owner||resource.editable&&!resource.editable[y][x])throw new Error('Ese píxel queda fuera de la zona editable del recurso.');
    if(resource.kind==='composite')pixel=closestLayerColor(resource.colors,pixel,owner.paletteBase);
    const key=`${owner.part}:${owner.x}:${owner.y}`;
    if(changed.has(key)&&changed.get(key)!==pixel)throw new Error('El dibujo asigna colores distintos al mismo píxel reutilizado.');
    changed.set(key,pixel);strips[owner.part][owner.y][owner.x]=pixel;
  }));
  return resource.parts.flatMap((p,i)=>{
    if(resource.editableParts&&!resource.editableParts.includes(i))return [];
    const source=p.compressed?decompress(current,p.offset):current.subarray(p.offset,p.offset+p.capacity),encoded=encodeTiles(strips[i],p.bpp);
    if(encoded.length===source.length&&encoded.every((b,j)=>b===source[j]))return [{id:p.id,offset:p.offset,label:resource.label,bytes:Uint8Array.from(current.subarray(p.offset,p.offset+(p.compressed?word(original,p.offset)&0x7fff:p.capacity)))}];
    return [graphicPatch(original,p,strips[i])];
  });
}

function closestLayerColor(colors,pixel,base) {
  if(pixel===0||colors[pixel]==='transparent')return 0;
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),source=rgb(colors[pixel]);let best=1,distance=Infinity;
  for(let i=1;i<16;i++){const d=rgb(colors[base+i]).reduce((n,v,k)=>n+(v-source[k])**2,0);if(d<distance){distance=d;best=i;}}
  return best;
}
// Title: DATA_829975/829987, two BG tilemaps and direct OAM DATA_88ED58.
// DATA_81F5FF positions the text object at ($60,$40), palette E0.
function titleLogo(rom) {
  const parts=[0xaa8000,0xaa8f56].map(address=>{const offset=loRom(address),data=decompress(rom,offset);return {id:`graphic:${offset}`,offset,capacity:word(rom,offset)&0x7fff,bpp:4,columns:1,compressed:true,interleaved:!!(word(rom,offset)&0x8000),decodedSize:data.length};});
  const strips=parts.map(p=>tiles(decompress(rom,p.offset),4,1));
  const colors=[...palette(rom,loRom(0x89c292),16),...palette(rom,loRom(0x89c2b4),16),...palette(rom,loRom(0x89c318),16)];colors[0]='transparent';colors[16]=colors[32]='transparent';
  const matrix=Array.from({length:128},()=>Array(256).fill(1)),owners=matrix.map(row=>row.map(()=>null));
  for(const address of [0xaa8d0c,0xaa8e61]) {
    const map=decompress(rom,loRom(address));
    for(let y=0;y<128;y++)for(let x=0;x<256;x++) {
      const entry=word(map,((y>>3)*32+(x>>3))*2),tile=entry&1023,xx=entry&0x4000?7-x%8:x%8,yy=entry&0x8000?7-y%8:y%8,base=((entry>>10)&7)*16,pixel=strips[0][tile*8+yy][xx];
      if(pixel){matrix[y][x]=base+pixel;if(tile!==1)owners[y][x]={part:0,x:xx,y:tile*8+yy,paletteBase:base};}
      else if(tile!==1&&tile!==110&&!owners[y][x])owners[y][x]={part:0,x:xx,y:tile*8+yy,paletteBase:base};
    }
  }
  const offset=loRom(0x88ed58);
  for(let i=rom[offset]-1;i>=0;i--) {
    let [y,x,tile,attr]=rom.subarray(offset+1+i*4,offset+5+i*4);x=96+(x>127?x-256:x);y=64+(y>127?y-256:y);const size=attr&16?16:8;
    for(let j=0;j<size;j++)for(let k=0;k<size;k++) {
      const fx=attr&64?size-1-k:k,fy=attr&128?size-1-j:j,t=tile+(fx>>3)+(fy>>3)*16,sx=fx%8,sy=t*8+fy%8,pixel=strips[1][sy][sx];
      if(pixel||!owners[y+j][x+k]){if(pixel)matrix[y+j][x+k]=32+pixel;owners[y+j][x+k]={part:1,x:sx,y:sy,paletteBase:32};}
    }
  }
  return {id:'title-logo',kind:'composite',label:'Logo completo de portada',shared:true,bpp:8,columns:32,capacity:parts.reduce((n,p)=>n+p.capacity,0),parts,matrix,owners,editable:owners.map(row=>row.map(Boolean)),colors};
}

// Match labels: CODE_A49130 copies DATA_81E6B4, then reads DATA_81E6C1.
// Keep all 42 table entries usable, including the six hidden All-Star teams.
// $AFDF00 is inside documented FREE_BYTES and beyond the flag pool ending DE96.
export const LABEL_POOL=loRom(0xafdf00),LABEL_SLOT=69,LABEL_POOL_SIZE=42*LABEL_SLOT;
export const LABEL_TEMPLATE=0xe6b4,LABEL_TABLE=0xe6c1;
export const LABEL_RULES=[['labels:pool',LABEL_POOL,LABEL_POOL_SIZE],['labels:pointers',LABEL_TABLE,84],['labels:loader',LABEL_TEMPLATE,13],['labels:select-loader',loRom(0x828f21),256]];
export function labelBank(rom){return rom[LABEL_TEMPLATE+6];}
export function smallLabelMatrix(rom,team){return tiles(decompress(rom,loRom(labelBank(rom)<<16|word(rom,LABEL_TABLE+team*2))),2,4);}
export function validateSmallLabelStorage(rom,original){
  const relocated=labelBank(rom)===0xaf;
  if(labelBank(rom)!==labelBank(original)&&!relocated)throw new Error('Banco de rótulos inválido.');
  for(let i=0;i<13;i++)if(rom[LABEL_TEMPLATE+i]!==([6,11].includes(i)&&relocated?0xaf:original[LABEL_TEMPLATE+i]))throw new Error('Cargador de rótulos inválido.');
  if(relocated){const script=loRom(0x828f21);for(let i=0;i<256;i++){const entry=Math.floor((i-2)/6),field=(i-2)%6;let expected=original[script+i];if(i>=2&&i<254&&field>=3){const p=0xdf00+entry*LABEL_SLOT;expected=field===3?p&255:field===4?p>>>8:0xaf;}if(rom[script+i]!==expected)throw new Error('Precarga de rótulos inválida.');}}
  for(let i=0;i<42;i++){
    const pointer=word(rom,LABEL_TABLE+i*2);
    if(pointer!==(relocated?0xdf00+i*LABEL_SLOT:word(original,LABEL_TABLE+i*2)))throw new Error('Puntero de rótulo inválido.');
    const offset=loRom(labelBank(rom)<<16|pointer);
    if(relocated&&(word(rom,offset)&0x7fff)>LABEL_SLOT)throw new Error('Rótulo fuera de su espacio reservado.');
    if(decompress(rom,offset).length!==64)throw new Error('Resolución del rótulo inválida.');
  }
}
export function smallLabelPatches(original,current,team,matrix){
  if(!Number.isInteger(team)||team<0||team>=42||matrix.length!==8||matrix.some(row=>row.length!==32))throw new Error('El rótulo debe medir 32 × 8.');
  encodeTiles(matrix,2); // Validate every palette index before allocating.
  const all=Array.from({length:42},(_,i)=>i===team?matrix:smallLabelMatrix(current,i));
  const pristine=all.every((m,i)=>JSON.stringify(m)===JSON.stringify(smallLabelMatrix(original,i)));
  const changes=LABEL_RULES.map(([id,offset,size])=>({id,offset,label:'Rótulos de equipo independientes',bytes:Uint8Array.from(original.subarray(offset,offset+size))}));
  if(!pristine){
    if(!((labelBank(original)===0x9a&&original.subarray(LABEL_POOL,LABEL_POOL+LABEL_POOL_SIZE).every(b=>b===255))||labelBank(original)===0xaf))throw new Error('No está libre el espacio verificado para los rótulos.');
    all.forEach((m,i)=>{const encoded=compress(encodeTiles(m,2)),pointer=0xdf00+i*LABEL_SLOT;if(encoded.length>LABEL_SLOT)throw new Error('El rótulo excede su espacio reservado.');changes[0].bytes.set(encoded,i*LABEL_SLOT);changes[1].bytes.set([pointer&255,pointer>>>8],i*2);});
    for(const i of [6,11])changes[2].bytes[i]=0xaf;
    for(let i=0;i<42;i++){const pointer=0xdf00+i*LABEL_SLOT;changes[3].bytes.set([pointer&255,pointer>>>8,0xaf],5+i*6);}
  }
  return changes;
}

export function flagPalettePatches(rom,team,colors){
  if(!Number.isInteger(team)||team<0||team>=36||colors.length!==16)throw new Error('Paleta de bandera inválida.');
  const offset=loRom(0x890000|word(rom,0xe7d8+team*2))+2;
  for(let other=0;other<42;other++)if(other!==team){const start=loRom(0x890000|word(rom,0xe7d8+other*2))+2;if(start<offset+8&&offset<start+8)throw new Error('La paleta de esta bandera está compartida y requiere reubicación.');}
  return colors.slice(12,16).map((color,i)=>({id:`palette:${offset+i*2}`,offset:offset+i*2,label:'Paleta de bandera independiente',bytes:rgb555(color)}));
}
