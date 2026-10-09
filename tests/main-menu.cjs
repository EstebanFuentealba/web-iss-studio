const assert=require('assert/strict'),fs=require('fs'),path=require('path');
global.crypto ||= require('crypto').webcrypto;
(async()=>{
 const {RomProject}=await import('../src/rom/project.mjs');
 const {MENU_BUTTONS,MAIN_MENU_RULES,menuButtonLines,mainMenuTextPatches,restoreMenuButtonPatches,mainMenuPreview,mainMenuGraphics,validateMainMenu}=await import('../src/rom/main-menu.mjs');
 const {graphicPatch,graphicPatches}=await import('../src/rom/graphics.mjs');
 const {decompress,loRom,word}=await import('../src/rom/binary.mjs');
 const file=path.join(__dirname,'../roms/International Superstar Soccer Deluxe (USA).sfc');
 if(!fs.existsSync(file)){console.log('SKIP main menu local ROM tests');return;}
 const original=new Uint8Array(fs.readFileSync(file)),project=await RomProject.create(original);
 assert.deepEqual(MENU_BUTTONS.map((_,i)=>menuButtonLines(original,i)),[['OPEN','GAME'],['SCENARIO',''],['INTER-','NATIONAL'],['PENALTY','KICK'],['WORLD','SERIES'],['TRAINING',''],['PASS','WORD'],['OPTIONS','']]);
 assert.deepEqual(project.exportRom(),original);
 const nativeLayout=decompress(original,loRom(0x989fb8)),nativeFrameAddresses=Array.from({length:8},(_,frame)=>0x4000+nativeLayout.slice(3,3+frame).reduce((sum,n)=>sum+n,0)*2);
 const navigationFrames=Array.from({length:8},(_,i)=>nativeFrameAddresses.indexOf(word(original,loRom(0x82f3aa)+i*4)));assert.deepEqual(navigationFrames,[0,1,3,7,4,2,6,5]);
 project.transaction(mainMenuTextPatches(original,project.bytes(),0,['GAME','MODE']));
 assert.deepEqual(menuButtonLines(project.bytes(),0),['GAME','MODE']);
 for(let i=1;i<8;i++)assert.deepEqual(menuButtonLines(project.bytes(),i),menuButtonLines(original,i));
 project.transaction(mainMenuTextPatches(original,project.bytes(),7,['MODE','']));
 assert.deepEqual(menuButtonLines(project.bytes(),0),['GAME','MODE']);
 assert.deepEqual(menuButtonLines(project.bytes(),7),['MODE','']);
 project.transaction(mainMenuTextPatches(original,project.bytes(),5,['WIN','']));assert.deepEqual(menuButtonLines(project.bytes(),5),['WIN','']);
 const preview=mainMenuPreview(project.bytes(),0);assert.equal(preview.matrix.length,224);assert.equal(preview.matrix[0].length,256);
 assert.ok(preview.matrix.flat().every(p=>Number.isInteger(p)&&preview.colors[p]));
 const record=project.record();assert.deepEqual((await RomProject.import(record)).exportRom(),project.exportRom());
 project.undo();assert.deepEqual(menuButtonLines(project.bytes(),5),['TRAINING','']);project.redo();assert.deepEqual(menuButtonLines(project.bytes(),5),['WIN','']);
 project.transaction(mainMenuTextPatches(original,project.bytes(),0,['INICIAR','JUEGO']));
 const expanded=project.bytes(),table=loRom(0x82f3aa),layoutBytes=decompress(expanded,MAIN_MENU_RULES[0][1]);
 assert.equal(word(layoutBytes,1),256);assert.deepEqual(Array.from(layoutBytes.slice(3,11)),Array(8).fill(32));
 for(let i=0;i<8;i++)assert.equal(word(expanded,table+i*4),0x4000+navigationFrames[i]*64);
 // The loader excludes y >= $F0. Padding must be clipped before OAM emission,
 // otherwise eight 32-slot frames would exhaust the SNES's 128 OAM entries.
 let emitted=0;for(let i=0;i<256;i++){const y=layoutBytes[11+256+i],attr=layoutBytes[11+768+i],top=(y>127?y-256:y)+120-(attr&16?8:4);if(top<240&&top>=-16)emitted++;}assert.equal(emitted,12+9+17+13+14+5+10+4);assert.ok(emitted<=128);
assert.deepEqual(menuButtonLines(project.bytes(),0),['INICIAR','JUEGO']);
 const extFont=mainMenuGraphics(project.bytes())[0],emptyFont=extFont.matrix.map(row=>row.map(()=>0));project.transaction([graphicPatch(original,extFont,emptyFont)]);assert.deepEqual(menuButtonLines(project.bytes(),0),['INICIAR','JUEGO']);assert.ok(mainMenuPreview(project.bytes()).matrix.flat().every(p=>p<48));project.undo();
 const recovered=await RomProject.import(project.record());assert.deepEqual(menuButtonLines(recovered.bytes(),0),['INICIAR','JUEGO']);assert.deepEqual(recovered.exportRom(),project.exportRom());
 const before=project.exportRom();assert.throws(()=>project.transaction(mainMenuTextPatches(original,project.bytes(),0,['FÚTBOL',''])),/letras A–Z/);
 assert.throws(()=>mainMenuTextPatches(original,project.bytes(),0,['WWWWWWWW','']),/112/);
 assert.throws(()=>mainMenuTextPatches(original,project.bytes(),0,['IIIIIIIIIIIIIII','']),/112/);
 assert.deepEqual(project.exportRom(),before);
 const altered=project.bytes();altered[MAIN_MENU_RULES[1][1]]=1;assert.throws(()=>validateMainMenu(altered,original));
 project.transaction(restoreMenuButtonPatches(original,project.bytes(),0));assert.deepEqual(menuButtonLines(project.bytes(),0),['OPEN','GAME']);assert.deepEqual(menuButtonLines(project.bytes(),7),['MODE','']);
 for(const index of [5,7])project.transaction(restoreMenuButtonPatches(original,project.bytes(),index));assert.deepEqual(project.exportRom(),original);
 const legacy=await RomProject.create(original);const oldModulePool=MAIN_MENU_RULES[0][1];const {compress}=await import('../src/rom/compression.mjs');const oldBytes=new Uint8Array(1024).fill(255);oldBytes.set(compress(decompress(original,loRom(0x989fb8))));legacy.transaction([{id:'main-menu:layout',offset:oldModulePool,bytes:oldBytes},{id:'main-menu:loader',offset:MAIN_MENU_RULES[1][1],bytes:Uint8Array.of(0,0xe5,0xae)}]);assert.deepEqual(menuButtonLines((await RomProject.import(legacy.record())).bytes(),0),['OPEN','GAME']);legacy.transaction(mainMenuTextPatches(original,legacy.bytes(),0,['INICIAR','JUEGO']));assert.deepEqual(menuButtonLines(legacy.bytes(),0),['INICIAR','JUEGO']);
 for(const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){const check=await RomProject.create(original);check.transaction(mainMenuTextPatches(original,check.bytes(),0,[c,'' ]));assert.deepEqual(menuButtonLines(check.bytes(),0),[c,'']);}
 const nationalProject=await RomProject.create(original);nationalProject.transaction(mainMenuTextPatches(original,nationalProject.bytes(),2,['INTER-','NACIONAL']));assert.deepEqual(menuButtonLines(nationalProject.bytes(),2),['INTER-','NACIONAL']);
 const nationalPreview=mainMenuPreview(nationalProject.bytes(),2);for(let y=72;y<120;y++)for(let x=0;x<256;x++)if(nationalPreview.matrix[y][x]>=48&&nationalPreview.matrix[y][x]<64)assert.ok(x>=8&&x<120,'NACIONAL pixels leave the panel');
 assert.deepEqual((await RomProject.import(nationalProject.record())).exportRom(),nationalProject.exportRom());nationalProject.undo();assert.deepEqual(nationalProject.exportRom(),original);nationalProject.redo();assert.deepEqual(menuButtonLines(nationalProject.bytes(),2),['INTER-','NACIONAL']);
 for(let i=0;i<8;i++){const stockLabelProject=await RomProject.create(original);stockLabelProject.transaction(mainMenuTextPatches(original,original,i,menuButtonLines(original,i)));assert.deepEqual(menuButtonLines(stockLabelProject.bytes(),i),menuButtonLines(original,i));}
 const limitProject=await RomProject.create(original),dense=['I'.repeat(14),'I'.repeat(14)];limitProject.transaction(mainMenuTextPatches(original,limitProject.bytes(),0,dense));limitProject.transaction(mainMenuTextPatches(original,limitProject.bytes(),1,dense));assert.throws(()=>mainMenuTextPatches(original,limitProject.bytes(),2,dense),/128 sprites/);
 const font=mainMenuGraphics(project.bytes())[0],blank=font.matrix.map(row=>row.map(()=>0));project.transaction([graphicPatch(original,font,blank)]);assert.ok(mainMenuPreview(project.bytes()).matrix.flat().every(p=>p<48));project.restore(font.id);assert.deepEqual(project.exportRom(),original);
 // Editing the assembled image must round-trip through its tilemap, retain
 // shared/unused pixels, propagate reused tiles and preserve other resources.
 for(const index of [1,2]){
  const layerProject=await RomProject.create(original),layer=mainMenuGraphics(original)[index];assert.equal(layer.matrix[0].length,index===1?128:256);assert.equal(layer.matrix.length,index===1?48:224);
  layerProject.transaction(graphicPatches(original,original,layer,layer.matrix));assert.deepEqual(layerProject.exportRom(),original);
  let point;for(let y=0;y<layer.matrix.length&&!point;y++)for(let x=0;x<layer.matrix[y].length;x++)if(layer.owners[y][x]){point={x,y,owner:layer.owners[y][x]};break;}
  const matrix=layer.matrix.map(row=>row.slice()),value=(matrix[point.y][point.x]+1)%16;matrix[point.y][point.x]=value;
  layerProject.transaction(graphicPatches(original,original,layer,matrix));const composed=mainMenuGraphics(layerProject.bytes())[index];
  for(let y=0;y<composed.matrix.length;y++)for(let x=0;x<composed.matrix[y].length;x++){const o=composed.owners[y][x],same=o&&o.x===point.owner.x&&o.y===point.owner.y;assert.equal(composed.matrix[y][x],same?value:layer.matrix[y][x]);}
  const other=mainMenuGraphics(layerProject.bytes())[index===1?2:1];assert.deepEqual(other.matrix,mainMenuGraphics(original)[index===1?2:1].matrix);
  assert.deepEqual((await RomProject.import(layerProject.record())).exportRom(),layerProject.exportRom());layerProject.restore(layer.id);assert.deepEqual(layerProject.exportRom(),original);
  if(index===1){const protectedMatrix=layer.matrix.map(row=>row.slice());protectedMatrix[0][0]=(protectedMatrix[0][0]+1)%16;assert.throws(()=>graphicPatches(original,original,layer,protectedMatrix),/zona editable/);}
 }
 const {GROUP_EDITOR_RULES}=await import('../src/rom/groups.mjs'),{GROUP_RULES}=await import('../src/rom/graphics.mjs'),{TITLE_LEGAL_RULES}=await import('../src/rom/title-legal.mjs'),{GROUP_TEXT_RULES}=await import('../src/rom/group-text.mjs');
 for(const [id,a,n] of MAIN_MENU_RULES)for(const [other,b,m] of [...GROUP_EDITOR_RULES,...GROUP_RULES,...TITLE_LEGAL_RULES,...GROUP_TEXT_RULES,...(await import('../src/rom/boot-screens.mjs')).BOOT_SCREEN_RULES])assert.ok(a+n<=b||b+m<=a,`${id} overlaps ${other}`);
 const header=new Uint8Array(original.length+512);header.fill(42,0,512);header.set(original,512);const withHeader=await RomProject.create(header);withHeader.transaction(mainMenuTextPatches(withHeader.original,withHeader.bytes(),7,['MODE','']));assert.equal(withHeader.exportRom().length,header.length);assert.deepEqual(withHeader.exportRom().slice(0,512),header.slice(0,512));
 console.log('PASS main menu: native labels, independent edits, expanded alphabet and frame pointers, preview, invalid input, undo/redo, restore, whitelist, project import, checksum export, SMC header and pool isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
