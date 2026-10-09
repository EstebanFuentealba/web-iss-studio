const assert=require('assert/strict'),fs=require('fs'),path=require('path');
global.crypto ||= require('crypto').webcrypto;global.Blob ||= require('buffer').Blob;global.btoa ||= s=>Buffer.from(s,'binary').toString('base64');global.atob ||= s=>Buffer.from(s,'base64').toString('binary');
(async()=>{
 const {readFormation,formationPatch}=await import('../src/rom/formations.mjs');
 const {RomProject}=await import('../src/rom/project.mjs');
 const {word,loRom,tiles,decompress}=await import('../src/rom/binary.mjs');
 const {encodeTiles,compress,graphicResources,graphicPatch,graphicPatches,flagPatches,flagMatrix,FLAG_POOL,FLAG_POOL_SIZE,FLAG_TEMPLATE,FLAG_TABLE,smallLabelPatches,smallLabelMatrix,LABEL_TEMPLATE,flagPalettePatches,rgb555}=await import('../src/rom/graphics.mjs');
 const {imagePalette}=await import('../src/rom/image-import.mjs');
 const rgba=Uint8Array.from([255,0,0,255,0,0,255,255,255,255,255,255,255,255,0,255,0,255,0,0]);assert.deepEqual(new Set(imagePalette(rgba)),new Set(['#ff0000','#0000ff','#ffffff','#ffff00']));
 const {playerPatches,encodeName}=await import('../src/rom/players.mjs');
 const {readDeluxeTeam,deluxeText}=await import('../src/rom/deluxe.mjs');
 const {encodeBrr,parseWav,resample,pitchRate,audioRegion,replacementAudio}=await import('../src/rom/audio-edit.mjs');
 const {decodeBrr,wavBlob,AUDIO_SAMPLES}=await import('../src/rom/audio.mjs');
 for(const bpp of [2,4,8]) {const matrix=Array.from({length:16},(_,y)=>Array.from({length:24},(_,x)=>(x+y*7)%(2**bpp)));assert.deepEqual(tiles(encodeTiles(matrix,bpp),bpp,3),matrix);}
 for(const input of [new Uint8Array(768),Uint8Array.from({length:2048},(_,i)=>(i*13)%256),Uint8Array.from({length:256},(_,i)=>i%3?0:82),Uint8Array.from({length:160},(_,i)=>i%8)])for(const interleaved of [false,true])assert.deepEqual(decompress(compress(input,interleaved),0),input);
 assert.deepEqual([...rgb555('#ffffff')],[255,127]);assert.throws(()=>rgb555('bad'));assert.equal(deluxeText(encodeName('A.b/c')), 'A.b/c');assert.throws(()=>encodeName('Álvarez'));assert.throws(()=>encodeName('123456789'));
 const input=Int16Array.from({length:160},(_,i)=>Math.round(Math.sin(i/10)*12000)),brr=encodeBrr(input,90),pcm=decodeBrr(brr);assert.equal(pcm.length,160);assert.ok(pcm.reduce((sum,v,i)=>sum+(v-input[i])**2,0)/160<1000000);assert.equal(pitchRate(1300),10156.25);assert.equal(resample(input,8000,12000).length,240);assert.throws(()=>encodeBrr(input,9),/capacidad/);
 const wav=await wavBlob(input,12000).arrayBuffer();assert.deepEqual(parseWav(wav).samples,input);assert.equal(parseWav(wav).sampleRate,12000);assert.throws(()=>parseWav(new ArrayBuffer(44)));assert.throws(()=>parseWav(wav.slice(0,-1)),/truncado/);
 const file=path.resolve(__dirname,'../roms/International Superstar Soccer Deluxe (USA).sfc');
 if(!fs.existsSync(file)){console.log('SKIP editor local ROM tests');return;}
 const original=new Uint8Array(fs.readFileSync(file)),project=await RomProject.create(original);
 assert.deepEqual(project.exportRom(),original);
 const headered=new Uint8Array(original.length+512);headered.set(Uint8Array.from({length:512},(_,i)=>i&255));headered.set(original,512);const smc=await RomProject.create(headered);assert.deepEqual(smc.exportRom(),headered);
 const conflictRom=original.slice();const italyNames=word(conflictRom,0x38138);conflictRom[0x3813a]=(italyNames+1)&255;conflictRom[0x3813b]=(italyNames+1)>>>8;const conflict=await RomProject.create(conflictRom);assert.throws(()=>conflict.transaction([...playerPatches(conflict.bytes(),0,0,{name:'Test'}),...playerPatches(conflict.bytes(),1,0,{name:'Other'})]),/Conflicto/);
 const before=readDeluxeTeam(original,0).players[0];project.transaction(playerPatches(project.bytes(),0,0,{name:'Codex',no:2,hair:13,speed:5}));const after=readDeluxeTeam(project.bytes(),0).players[0];assert.equal(after.name,'Codex');assert.equal(after.hair,13);assert.equal(after.speed,5);assert.equal(after.no,2);assert.equal(after.energy,before.energy);assert.equal(after.position,before.position);const detached=project.original;detached.fill(0);assert.deepEqual(project.original,original);
 project.undo();assert.deepEqual(project.exportRom(),original);project.redo();assert.equal(readDeluxeTeam(project.bytes(),0).players[0].name,'Codex');
 assert.throws(()=>project.transaction([{id:'evil',offset:0,bytes:Uint8Array.of(1)}]),/permitido/);
 assert.throws(()=>project.transaction([{id:'evil',offset:0,bytes:original.slice(0,1)}]),/permitido/);
 assert.throws(()=>project.transaction(playerPatches(project.bytes(),0,0,{position:7})),/inválido/);
 const invalid=playerPatches(project.bytes(),0,1,{speed:3})[0];invalid.bytes[0]=255;assert.throws(()=>project.transaction([invalid]),/rango/);
 const invalidOffset=playerPatches(project.bytes(),0,1,{speed:3})[0];invalidOffset.offset++;assert.throws(()=>project.transaction([invalidOffset]),/permitido/);
 for(let i=0;i<36;i++){const f=readFormation(original,i);assert.equal(f.bytes.length,31);assert.ok(f.label);assert.ok(f.slots.every(s=>[1,2,3,5,6].includes(s.role)));}
 project.transaction([formationPatch(original,0,8)]);assert.deepEqual(readFormation(project.bytes(),0).bytes,readFormation(original,8).bytes);
 const numberProject=await RomProject.create(original);numberProject.transaction(playerPatches(numberProject.bytes(),0,0,{no:2}));assert.equal(new Set(readDeluxeTeam(numberProject.bytes(),0).players.map(p=>p.no)).size,20);numberProject.restore(`attributes:${0x50000}`);assert.deepEqual(numberProject.exportRom(),original);
 const edited=project.exportRom();assert.equal(word(edited,0x7fde),edited.reduce((sum,b)=>(sum+b)&65535,0));assert.equal(word(edited,0x7fdc)^word(edited,0x7fde),65535);
 const editedRanges=project.patches.map(p=>[p.offset,p.offset+p.bytes.length]);for(let i=0;i<original.length;i++)if(!editedRanges.some(([a,b])=>i>=a&&i<b)&&!(i>=0x7fdc&&i<0x7fe0))assert.equal(edited[i],original[i],`Unrelated byte ${i}`);
 const record=project.record(),restored=await RomProject.import(JSON.parse(JSON.stringify(record)));assert.deepEqual(restored.exportRom(),edited);const corrupt={...record,hash:'bad'};await assert.rejects(()=>RomProject.import(corrupt),/hash/);await assert.rejects(()=>RomProject.import({...record,patches:[...record.patches,record.patches[0]]}),/duplicada/);
 for(let team=0;team<36;team++)for(const resource of graphicResources(original,team)) {
   assert.deepEqual(tiles(encodeTiles(resource.matrix,resource.bpp),resource.bpp,resource.columns),resource.matrix);
   if(resource.compressed) {const bytes=encodeTiles(resource.matrix,resource.bpp),packed=compress(bytes,resource.interleaved);assert.deepEqual(decompress(packed,0),bytes);assert.ok(packed.length<=resource.capacity,`${resource.label} ${team}: ${packed.length}/${resource.capacity}`);}
 }
 const resource=graphicResources(original,0).find(r=>r.label.startsWith('Pelo 1 ')),matrix=resource.matrix.map(r=>r.slice());matrix[0][0]=(matrix[0][0]+1)%16;
 project.transaction([graphicPatch(original,resource,matrix)]);assert.deepEqual(graphicResources(project.bytes(),0).find(r=>r.id===resource.id).matrix,matrix);
 // Every country can edit both halves independently, even when the source
 // stripe pattern was shared. Exercise the loader/pointer relocation as exported.
 const flags=await RomProject.create(original),beforeFlags=Array.from({length:36},(_,i)=>flagMatrix(original,i));
 for(let team=0;team<36;team++) {
   const matrix=flagMatrix(flags.bytes(),team).map(row=>row.slice());matrix[0][0]=12+(team%4);matrix[15][23]=12+((team+1)%4);
   if(JSON.stringify(matrix)===JSON.stringify(beforeFlags[team]))matrix[0][1]=12+((team+2)%4);
   flags.transaction(flagPatches(flags.original,flags.bytes(),team,matrix));
   assert.deepEqual(flagMatrix(flags.bytes(),team),matrix);
   for(let other=team+1;other<36;other++)assert.deepEqual(flagMatrix(flags.bytes(),other),beforeFlags[other]);
 }
 assert.equal(flags.bytes()[0xe715+6],0xaf);for(let i=36;i<42;i++)assert.deepEqual(flagMatrix(flags.bytes(),i),flagMatrix(original,i));
 assert.equal(flags.bytes()[FLAG_TEMPLATE+6],0xaf);assert.equal(new Set(Array.from({length:72},(_,i)=>word(flags.bytes(),FLAG_TABLE+i*2))).size,72);
 const paletteProject=await RomProject.create(original),flagResource=graphicResources(original,0)[0],newColors=flagResource.colors.slice();newColors.splice(12,4,...imagePalette(rgba));
 paletteProject.transaction(flagPalettePatches(paletteProject.bytes(),0,newColors));assert.deepEqual(graphicResources(paletteProject.bytes(),0)[0].colors,newColors);
 for(let i=1;i<36;i++)assert.deepEqual(graphicResources(paletteProject.bytes(),i)[0].colors,graphicResources(original,i)[0].colors);
 assert.deepEqual((await RomProject.import(paletteProject.record())).exportRom(),paletteProject.exportRom());paletteProject.transaction(flagPalettePatches(paletteProject.bytes(),0,flagResource.colors));assert.deepEqual(paletteProject.exportRom(),original);
 // Follow the game's menu script into WRAM, then its country DMA table.
 const selectionRom=flags.bytes(),script=loRom(0x820000|word(selectionRom,loRom(0x87ad9a))),wram=new Uint8Array(65536);
 assert.equal(word(selectionRom,script),1);for(let entry=script+2;word(selectionRom,entry)!==65535;entry+=6){const dest=word(selectionRom,entry),address=word(selectionRom,entry+3)|(selectionRom[entry+5]<<16);assert.equal(selectionRom[entry+2],0x7f);wram.set(decompress(selectionRom,loRom(address)),dest);}
 for(let i=0;i<42;i++){const dest=word(selectionRom,loRom(0x82f829)+i*2);assert.deepEqual(tiles(wram.slice(dest,dest+192),4,3),flagMatrix(selectionRom,i));assert.ok(dest+192<=0x2280||dest>=0x3400&&dest+192<=0x3b80);}
 const previous=flags.record();previous.patches=previous.patches.filter(p=>!['flags:single-loader','flags:select-script','flags:select-entry','flags:select-map'].includes(p.id));assert.deepEqual((await RomProject.import(previous)).exportRom(),flags.exportRom());
 const restoredFlags=await RomProject.import(flags.record());assert.deepEqual(restoredFlags.exportRom(),flags.exportRom());
 const oldRecord=flags.record();oldRecord.patches=oldRecord.patches.filter(p=>['flags:pool','flags:pointers','flags:loader'].includes(p.id)).map(p=>({...p,bytes:Buffer.from(p.bytes,'base64').subarray(0,p.id==='flags:pool'?7344:p.id==='flags:pointers'?144:Infinity).toString('base64')}));const upgraded=await RomProject.import(oldRecord);assert.deepEqual(upgraded.exportRom(),flags.exportRom());
 const reopen=await RomProject.create(flags.exportRom()),reedit=flagMatrix(reopen.bytes(),0).map(r=>r.slice());reedit[7][12]=13;reopen.transaction(flagPatches(reopen.original,reopen.bytes(),0,reedit));assert.deepEqual(flagMatrix(reopen.bytes(),0),reedit);
 const badLoader=flags.patches.find(p=>p.id==='flags:loader');badLoader.bytes[6]=0x90;assert.throws(()=>flags.transaction([badLoader]),/Banco|cargador/i);
 for(let team=0;team<36;team++)flags.transaction(flagPatches(flags.original,flags.bytes(),team,beforeFlags[team]));assert.deepEqual(flags.exportRom(),original);
 const labels=await RomProject.create(original),randomLabel=Array.from({length:8},(_,y)=>Array.from({length:32},(_,x)=>(x*17+y*13+(x*y)%7)%4));
 labels.transaction(smallLabelPatches(original,labels.bytes(),0,randomLabel));assert.deepEqual(smallLabelMatrix(labels.bytes(),0),randomLabel);assert.equal(labels.bytes()[LABEL_TEMPLATE+6],0xaf);
 for(let i=1;i<42;i++)assert.deepEqual(smallLabelMatrix(labels.bytes(),i),smallLabelMatrix(original,i));
 const labelRom=labels.bytes();for(let i=0;i<42;i++){const entry=loRom(0x828f21)+2+i*6;assert.equal(word(labelRom,entry),i*64);assert.equal(labelRom[entry+2],0x7f);assert.deepEqual(tiles(decompress(labelRom,loRom(word(labelRom,entry+3)|labelRom[entry+5]<<16)),2,4),smallLabelMatrix(labelRom,i));}
 const priorLabels=labels.record();priorLabels.patches=priorLabels.patches.filter(p=>p.id!=='labels:select-loader');assert.deepEqual((await RomProject.import(priorLabels)).exportRom(),labels.exportRom());
 assert.deepEqual((await RomProject.import(labels.record())).exportRom(),labels.exportRom());
 const reopenedLabels=await RomProject.create(labels.exportRom());assert.deepEqual(smallLabelMatrix(reopenedLabels.bytes(),0),randomLabel);
 labels.transaction(smallLabelPatches(original,labels.bytes(),0,smallLabelMatrix(original,0)));assert.deepEqual(labels.exportRom(),original);
 const sprites=await RomProject.create(original);
 for(const resource of graphicResources(original,0).filter(r=>r.kind==='sprite')) {
   assert.equal(resource.matrix.length,48);assert.equal(resource.matrix[0].length,24);
   sprites.transaction(graphicPatches(original,sprites.bytes(),resource,resource.matrix));assert.deepEqual(sprites.exportRom(),original);
   const matrix=resource.matrix.map(row=>row.slice());let done=false;
   for(let y=0;y<matrix.length&&!done;y++)for(let x=0;x<matrix[0].length&&!done;x++)if(matrix[y][x]&&resource.editable[y][x]){matrix[y][x]=matrix[y][x]%15+1;done=true;}
   sprites.transaction(graphicPatches(original,sprites.bytes(),resource,matrix));assert.notDeepEqual(graphicResources(sprites.bytes(),0).find(r=>r.id===resource.id).matrix,resource.matrix);
   sprites.transaction(resource.parts.flatMap((p,i)=>resource.editableParts.includes(i)?sprites.restorePatches(p.id):[]));assert.deepEqual(sprites.exportRom(),original);
 }
 const {renameTeamPatches,restoreTeamLabelPatches,bigLabel,labelLayout,labelFrame,compactTeamName}=await import('../src/rom/team-labels.mjs');
 const named=await RomProject.create(original),otherNames=Array.from({length:36},(_,i)=>bigLabel(original,i).matrix);
 const chile=compactTeamName(original,'CHILE');assert.deepEqual(chile.slice(0,7).map(row=>row.slice(11,14)),smallLabelMatrix(original,1).slice(0,7).map(row=>row.slice(2,5).map(p=>p===3?0:p)));
 named.transaction(renameTeamPatches(named.original,named.bytes(),0,'CHILE'));assert.notDeepEqual(bigLabel(named.bytes(),0).matrix,otherNames[0]);assert.deepEqual(smallLabelMatrix(named.bytes(),0),chile);
 for(let i=1;i<36;i++)assert.deepEqual(bigLabel(named.bytes(),i).matrix,otherNames[i]);
 assert.throws(()=>renameTeamPatches(named.original,named.bytes(),0,'TOOLONG'),/admite/);
 const fonts=loRom(0x9de13c);assert.deepEqual(named.bytes().slice(fonts,fonts+word(original,fonts)),original.slice(fonts,fonts+word(original,fonts)));
 named.transaction(restoreTeamLabelPatches(named.original,named.bytes(),0));assert.deepEqual(named.exportRom(),original);
 const logoProject=await RomProject.create(original),logo=graphicResources(original,0).find(r=>r.kind==='composite');
 assert.equal(logo.matrix[0].length,256);assert.equal(logo.matrix.length,128);assert.equal(logo.colors.length,48);
 logoProject.transaction(graphicPatches(original,original,logo,logo.matrix));assert.deepEqual(logoProject.exportRom(),original);
 for(let part=0;part<2;part++) {
   const current=graphicResources(logoProject.bytes(),0).find(r=>r.kind==='composite'),matrix=current.matrix.map(row=>row.slice());let done=false;
   for(let y=0;y<matrix.length&&!done;y++)for(let x=0;x<matrix[0].length&&!done;x++){
     const owner=current.owners[y][x];if(!owner||owner.part!==part||matrix[y][x]===0)continue;
     matrix[y][x]=owner.paletteBase+matrix[y][x]%15+1;done=true;
   }
   const beforeOther=Uint8Array.from(logoProject.bytes().subarray(current.parts[1-part].offset,current.parts[1-part].offset+current.parts[1-part].capacity));
   logoProject.transaction(graphicPatches(original,logoProject.bytes(),current,matrix));assert.notDeepEqual(graphicResources(logoProject.bytes(),0).find(r=>r.kind==='composite').matrix,current.matrix);
   assert.deepEqual(logoProject.bytes().slice(current.parts[1-part].offset,current.parts[1-part].offset+current.parts[1-part].capacity),beforeOther);
 }
 logoProject.transaction(logo.parts.flatMap(p=>logoProject.restorePatches(p.id)));assert.deepEqual(logoProject.exportRom(),original);
 const legacy=await RomProject.create(original),legacyOffset=loRom(0x98c5d4),legacyBytes=original.slice(legacyOffset,legacyOffset+8192);legacyBytes[300]^=1;
 legacy.transaction([{id:`graphic:${legacyOffset}`,offset:legacyOffset,bytes:legacyBytes}]);
 const detail=graphicResources(legacy.bytes(),0).find(r=>r.editableParts?.length===1),detailMatrix=detail.matrix.map(row=>row.slice());let painted=false;
 for(let y=0;y<detailMatrix.length&&!painted;y++)for(let x=0;x<detailMatrix[0].length&&!painted;x++)if(detail.editable[y][x]){detailMatrix[y][x]=detailMatrix[y][x]%15+1;painted=true;}
 legacy.transaction(graphicPatches(original,legacy.bytes(),detail,detailMatrix));assert.equal(legacy.patches.length,1);assert.equal(legacy.patches[0].id,`graphic:${legacyOffset}`);
 legacy.restore(`graphic:${legacyOffset}`);assert.deepEqual(legacy.exportRom(),original);
 const paletteOffset=loRom(0x890000|word(original,0x1027a))+2+8;project.transaction([{id:`palette:${paletteOffset}`,offset:paletteOffset,label:'Piel',bytes:rgb555('#ff0000')}]);assert.equal(readDeluxeTeam(project.bytes(),0).players[1].skinColor,'#ff0000');
 const eligible=AUDIO_SAMPLES.filter(s=>!audioRegion(original,s).reason);assert.ok(eligible.length);const sample=eligible[0],region=audioRegion(original,sample),replacement=replacementAudio(original,sample,{samples:input,sampleRate:12000},1300);project.transaction([replacement.patch]);assert.equal(project.bytes()[region.offset],replacement.patch.bytes[0]);assert.throws(()=>replacementAudio(original,AUDIO_SAMPLES.find(s=>s.name==='TitleScreenNameDrop'),{samples:input,sampleRate:12000},1300),/fragmentos/);
 smc.transaction(playerPatches(smc.bytes(),0,0,{name:'Test'}));assert.deepEqual(smc.exportRom().slice(0,512),headered.slice(0,512));
 for(let i=0;i<36;i++)assert.equal(readDeluxeTeam(project.exportRom(),i).players.length,20);
 project.reset();assert.deepEqual(project.exportRom(),original);
 console.log(`PASS editor: tiles/compression, ${36} team graphic round-trips, players, immutable ROM, SHA-256 project recovery, checksum, SMC header, BRR/WAV and ${eligible.length} replaceable samples`);
})().catch(e=>{console.error(e);process.exitCode=1;});
