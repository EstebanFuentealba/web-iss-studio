const assert=require('assert/strict'),fs=require('fs'),path=require('path');
global.crypto ||= require('crypto').webcrypto;
(async()=>{
 const {RomProject}=await import('../src/rom/project.mjs');
 const {allStarsMode,allStarsPatch,SELECTION_RULES}=await import('../src/rom/selection.mjs');
 const {selectionGroupGraphics,graphicPatches,GROUP_RULES}=await import('../src/rom/graphics.mjs');
 const {groupTextPatches,groupTexts,previewGroupText,restoreGroupTextPatches}=await import('../src/rom/group-text.mjs');
 const {word}=await import('../src/rom/binary.mjs');
 const file=path.join(__dirname,'../roms/International Superstar Soccer Deluxe (USA).sfc');
 if(!fs.existsSync(file)){console.log('SKIP selection local ROM tests');return;}
 const original=new Uint8Array(fs.readFileSync(file)),project=await RomProject.create(original);
 assert.equal(allStarsMode(original),'original');
 for(const mode of ['visible','hidden']){
   project.transaction([allStarsPatch(original,mode)]);
   const bytes=project.bytes(),offset=SELECTION_RULES[0][1],count=mode==='visible'?7:6;
   assert.equal(allStarsMode(bytes),mode);assert.equal(bytes[offset+1],count);assert.equal(bytes[offset+13],count);
   for(let i=0;i<original.length;i++)if(i!==offset+1&&i!==offset+13)assert.equal(bytes[i],original[i]);
   const exported=project.exportRom();assert.equal(word(exported,0x7fde),exported.reduce((s,v)=>(s+v)&65535,0));
   assert.deepEqual((await RomProject.import(JSON.parse(JSON.stringify(project.record())))).bytes(),bytes);
   project.undo();assert.deepEqual(project.bytes(),original);project.redo();assert.equal(allStarsMode(project.bytes()),mode);
   project.restore('selection:all-stars');assert.deepEqual(project.bytes(),original);
 }
 const forged=allStarsPatch(original,'visible');forged.bytes[3]=0xea;
 assert.throws(()=>project.transaction([forged]),/no compatible/);
 const forgedCount=allStarsPatch(original,'visible');forgedCount.bytes[1]=12;
 assert.throws(()=>project.transaction([forgedCount]),/no compatible/);
 assert.throws(()=>allStarsPatch(original,'invalid'),/inválida/);
 const labels=selectionGroupGraphics(original);
 assert.deepEqual(labels.map(r=>r.label),['EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA-AFRICA','N.S.AMERICA','ALL STARS']);
 assert.ok(labels.every(r=>r.matrix.length===16&&r.matrix[0].length===64&&r.editable.flat().some(Boolean)));
 const edit=(index,x,y)=>{
   const resource=selectionGroupGraphics(project.bytes())[index],matrix=resource.matrix.map(row=>row.slice());
   matrix[y][x]=(matrix[y][x]+1)%4;
   project.transaction(graphicPatches(original,project.bytes(),resource,matrix));
   assert.deepEqual(selectionGroupGraphics(project.bytes())[index].matrix,matrix);
 };
 edit(5,0,0); // N.S.AMERICA has independent tiles.
 const after=selectionGroupGraphics(project.bytes());
 for(let i=0;i<7;i++)if(i!==5)assert.deepEqual(after[i].matrix,labels[i].matrix);
 const restore=()=>project.transaction(GROUP_RULES.map(([id])=>project.restorePatches(id)).flat());restore();assert.deepEqual(project.bytes(),original);
 edit(0,8,0); // Every group owns its letters and number.
 const shared=selectionGroupGraphics(project.bytes());assert.notDeepEqual(shared[0].matrix,labels[0].matrix);
 for(let i=1;i<7;i++)assert.deepEqual(shared[i].matrix,labels[i].matrix);
 restore();edit(0,48,0);
 const number=selectionGroupGraphics(project.bytes());for(let i=1;i<7;i++)assert.deepEqual(number[i].matrix,labels[i].matrix);
 assert.deepEqual((await RomProject.import(JSON.parse(JSON.stringify(project.record())))).bytes(),project.bytes());
 restore();assert.deepEqual(project.exportRom(),original);
 const textResource=selectionGroupGraphics(project.bytes())[5];
 const preview=previewGroupText(original,textResource,'GRUPO 1');
 project.transaction(groupTextPatches(original,project.bytes(),textResource,'GRUPO 1'));
 assert.equal(groupTexts(project.bytes())[5],'GRUPO 1');assert.deepEqual(selectionGroupGraphics(project.bytes())[5].matrix,preview.matrix);
 assert.equal(groupTexts((await RomProject.import(project.record())).bytes())[5],'GRUPO 1');
 project.transaction(restoreGroupTextPatches(original,project.bytes(),selectionGroupGraphics(project.bytes())[5],labels[5].matrix));assert.deepEqual(project.exportRom(),original);
 const styled=previewGroupText(original,textResource,'EUROPEXX').matrix;
 assert.deepEqual([...new Set(styled.flat())].sort(),[0,1,2,3]);
 for(let i=0;i<labels.length;i++)assert.deepEqual(previewGroupText(original,labels[i],labels[i].label).matrix,labels[i].matrix);
 for(let i=0;i<4;i++){
  const numeral=previewGroupText(original,textResource,String(i+1)).matrix;
  assert.deepEqual(numeral.map(row=>row.slice(28,36)),labels[i].matrix.map(row=>row.slice(48,56)));
 }
 const europe=previewGroupText(original,textResource,'EUROPE').matrix;
 assert.equal(europe[4][50],0); // No outline borrowed from the following U.
 // The native O has square sides and keeps its exact highlights, rather than
 // the rounded menu-font O used before. Compare its middle five columns.
 assert.deepEqual(europe.map(row=>row.slice(33,38)),labels[0].matrix.map(row=>row.slice(28,33)));
 project.transaction(groupTextPatches(original,project.bytes(),textResource,'EUROPEXX'));
 assert.deepEqual(selectionGroupGraphics(project.bytes())[5].matrix,styled);
 project.transaction(restoreGroupTextPatches(original,project.bytes(),selectionGroupGraphics(project.bytes())[5],labels[5].matrix));
 assert.deepEqual(project.exportRom(),original);
 const withDigit=previewGroupText(original,textResource,'5Z').matrix,withLetter=previewGroupText(original,textResource,'AZ').matrix;
 assert.deepEqual(withDigit.map(row=>row.slice(32,40)),withLetter.map(row=>row.slice(32,40)));
 assert.throws(()=>previewGroupText(original,textResource,'Ñ'),/admite/);
 console.log('PASS selection: group graphics, independent letters and numbers, ALL STARS modes, unlock branch, validation, history, import and export');
})().catch(e=>{console.error(e);process.exitCode=1;});
