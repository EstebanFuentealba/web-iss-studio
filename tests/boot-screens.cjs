const assert=require('assert/strict'),fs=require('fs'),path=require('path');
global.crypto ||= require('crypto').webcrypto;
(async()=>{
 const {RomProject}=await import('../src/rom/project.mjs');
 const {graphicResources,graphicPatches,FLAG_RULES,LABEL_RULES,GROUP_RULES}=await import('../src/rom/graphics.mjs');
 const {BOOT_SCREEN_RULES,bootScreenResources,bootScreenPreview}=await import('../src/rom/boot-screens.mjs');
 const {GROUP_EDITOR_RULES}=await import('../src/rom/groups.mjs');
 const {GROUP_TEXT_RULES}=await import('../src/rom/group-text.mjs');
 const {MAIN_MENU_RULES}=await import('../src/rom/main-menu.mjs');
 const {TITLE_LEGAL_RULES}=await import('../src/rom/title-legal.mjs');
 const {loRom,word,decompress}=await import('../src/rom/binary.mjs');
 const ranges=[...BOOT_SCREEN_RULES,...FLAG_RULES,...LABEL_RULES,...GROUP_RULES,...GROUP_TEXT_RULES,...GROUP_EDITOR_RULES,...TITLE_LEGAL_RULES,...MAIN_MENU_RULES];
 for(const [id,a,n] of BOOT_SCREEN_RULES)for(const [other,b,m] of ranges)if(id!==other)assert.ok(a+n<=b||b+m<=a,`${id} overlaps ${other}`);
 const file=path.join(__dirname,'../roms/International Superstar Soccer Deluxe (USA).sfc');
 if(!fs.existsSync(file)){console.log('SKIP boot screen local ROM tests');return;}
 const original=new Uint8Array(fs.readFileSync(file)),project=await RomProject.create(original),initial=bootScreenResources(original);
 assert.deepEqual(initial.map(r=>r.id),['boot-konami','boot-intro']);
 for(const r of initial){assert.equal(r.matrix.length,224);assert.equal(r.matrix[0].length,256);assert.deepEqual(graphicResources(original,0).find(g=>g.id===r.id).matrix,r.matrix);}
 for(const resource of initial){
  const matrix=resource.matrix.map(r=>r.slice());
  // Two independent edits to pixels using the same original blank tile.
  matrix[8][8]=resource.id==='boot-konami'?22:17;matrix[16][16]=resource.id==='boot-konami'?38:33;
  project.transaction(graphicPatches(original,project.bytes(),resource,matrix));
  const after=bootScreenResources(project.bytes()).find(r=>r.id===resource.id);
  assert.deepEqual(after.matrix,bootScreenPreview(resource,matrix).matrix);
  assert.equal(after.matrix[0][0],0);assert.notEqual(after.matrix[8][8],0);assert.notEqual(after.matrix[16][16],0);
 }
 const both=project.exportRom(),saved=await RomProject.import(JSON.parse(JSON.stringify(project.record())));
 assert.deepEqual(saved.exportRom(),both);
 const reopened=await RomProject.create(both);assert.deepEqual(bootScreenResources(reopened.bytes()),bootScreenResources(project.bytes()));
 const intro=bootScreenResources(project.bytes())[1];
 project.restore('boot-konami:atlas');assert.deepEqual(bootScreenResources(project.bytes())[0],initial[0]);assert.deepEqual(bootScreenResources(project.bytes())[1],intro);
 project.undo();assert.deepEqual(project.exportRom(),both);project.redo();
 project.restore('boot-intro:atlas');assert.deepEqual(project.exportRom(),original);
 // Capacity and corrupted pointer failures must leave the project unchanged.
 const busy=original.slice();busy[loRom(0xb0c2de)]=0;const occupied=await RomProject.create(busy),edit=initial[0].matrix.map(r=>r.slice());edit[0][0]=22;
 assert.throws(()=>graphicPatches(busy,busy,initial[0],edit),/ocupado/);
 const bad=BOOT_SCREEN_RULES.find(([id])=>id==='boot-konami:atlas-pointer');assert.throws(()=>project.transaction([{id:bad[0],offset:bad[1],bytes:Uint8Array.of(0,128,128)}]),/compatible/);assert.deepEqual(project.exportRom(),original);
 const huge=initial[0].matrix.map(r=>r.slice());let seed=123;
 for(let y=0;y<224;y++)for(let x=0;x<256;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;huge[y][x]=1+seed%15;}
 assert.throws(()=>graphicPatches(original,original,initial[0],huge),/tiles disponibles/);
 // Native data used by masks and other scenes remains byte-for-byte intact.
 for(const address of [0xa8f4f5,0xa1f969,0xa1e527,0xa1ed19]){const o=loRom(address),n=word(original,o)&32767;assert.deepEqual(both.slice(o,o+n),original.slice(o,o+n));}
 const corrupt=graphicPatches(original,original,initial[0],edit);corrupt.find(p=>p.id==='boot-konami:atlas').bytes[2]=128;
 assert.throws(()=>project.transaction(corrupt));assert.deepEqual(project.exportRom(),original);
 console.log('PASS boot screens: independent pixels, both replacements, palette conversion, native animation data, storage isolation, ROM/project recovery, undo/redo, independent restore and invalid edits');
})().catch(e=>{console.error(e);process.exitCode=1;});
