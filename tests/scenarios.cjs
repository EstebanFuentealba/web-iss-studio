const assert=require('assert/strict'),fs=require('fs');
global.crypto ||= require('crypto').webcrypto;
(async()=>{
  const {readScenarios,scenarioPatch,SCENARIO_RULES,SCENARIO_OFFSET,validateScenarioBytes}=await import('../src/rom/scenarios.mjs');
  const synthetic=new Uint8Array(SCENARIO_OFFSET+180);
  synthetic.set([52,1,0x54,1,4,60,1,3,1,4,16,0,9,128,1],SCENARIO_OFFSET);
  assert.equal(readScenarios(synthetic)[0].seconds,54);
  for(const seconds of [0,9,10,20,42,54,59]){
    const p=scenarioPatch(synthetic,0,{seconds});synthetic.set(p.bytes,p.offset);
    assert.equal(readScenarios(synthetic)[0].seconds,seconds);
    assert.equal(p.bytes[2],Math.floor(seconds/10)*16+seconds%10);
  }
  for(const changes of [{seconds:60},{minutes:10},{playerTeam:42},{opponentTeam:1.5},{playerGoals:11},{weather:5},{stadium:8},{x:256},{y:-1},{start:NaN},{header:0}])assert.throws(()=>scenarioPatch(synthetic,0,changes));
  for(const index of [-1,12,0.5])assert.throws(()=>scenarioPatch(synthetic,index,{seconds:0}));
  const invalid=synthetic.slice(SCENARIO_OFFSET,SCENARIO_OFFSET+15);invalid[2]=0x1a;
  assert.throws(()=>validateScenarioBytes(invalid,synthetic.slice(SCENARIO_OFFSET,SCENARIO_OFFSET+15)));
  const file='roms/International Superstar Soccer Deluxe (USA).sfc';
  if(!fs.existsSync(file)){console.log('PASS scenario encoding and ranges; SKIP local ROM integration');return;}
  const {RomProject}=await import('../src/rom/project.mjs');
  const original=new Uint8Array(fs.readFileSync(file)),project=await RomProject.create(original),stock=readScenarios(original);
  assert.equal(stock.length,12);assert.equal(stock[2].seconds,54);assert.equal(stock[2].playerTeam,2);assert.equal(stock[2].opponentTeam,30);
  for(const [i,s] of stock.entries()){
    assert.deepEqual(scenarioPatch(original,i,{seconds:s.seconds}).bytes,s.bytes,'Opening/editing time must not corrupt BCD');
    assert.deepEqual(scenarioPatch(original,i,{playerTeam:s.playerTeam}).bytes,s.bytes);
  }
  const {scenarioDifficultyPatch,SCENARIO_DIFFICULTY_RULES,SCENARIO_DIFFICULTY_OFFSET}=await import('../src/rom/scenarios.mjs');
  assert.deepEqual(stock.map(s=>s.difficulty),[2,3,4,2,1,2,3,1,3,2,4,5]);
  const difficultyProject=await RomProject.create(original);
  for(let i=0;i<12;i++)difficultyProject.transaction([scenarioDifficultyPatch(i,5)]);
  assert.ok(readScenarios(difficultyProject.bytes()).every(s=>s.difficulty===5));
  const difficultyBytes=difficultyProject.bytes();for(let i=0;i<original.length;i++)if(i<SCENARIO_DIFFICULTY_OFFSET||i>=SCENARIO_DIFFICULTY_OFFSET+12)assert.equal(difficultyBytes[i],original[i]);
  difficultyProject.undo();assert.equal(readScenarios(difficultyProject.bytes())[10].difficulty,4);assert.equal(readScenarios(difficultyProject.bytes())[11].difficulty,5);
  // Scenario 12 already has five stars; no-op updates do not create history.
  difficultyProject.redo();
  assert.deepEqual((await RomProject.import(difficultyProject.record())).bytes(),difficultyProject.bytes());
  for(const value of [0,6,1.5,NaN])assert.throws(()=>scenarioDifficultyPatch(0,value));
  assert.throws(()=>difficultyProject.transaction([{...scenarioDifficultyPatch(0,1),bytes:Uint8Array.of(0)}]),/rango/);
  difficultyProject.transaction(SCENARIO_DIFFICULTY_RULES.flatMap(([id])=>difficultyProject.restorePatches(id)));assert.deepEqual(difficultyProject.bytes(),original);
  const difficultyHeader=await RomProject.create(new Uint8Array([...new Uint8Array(512).fill(0xa5),...original]));
  difficultyHeader.transaction([scenarioDifficultyPatch(0,4)]);assert.equal(difficultyHeader.exportRom()[512+SCENARIO_DIFFICULTY_OFFSET],4);
  const {scenarioPosition,scenarioPitchSize,scenarioPositionChanges,positionOnPitch}=await import('../src/rom/scenario-position.mjs');
  assert.deepEqual(scenarioPosition(stock[0]),{x:2304,y:64}); // Original corner lies beyond field length.
  assert.deepEqual(scenarioPosition(stock[4]),{x:1280,y:-1});
  assert.deepEqual(scenarioPosition(stock[7]),{x:-1,y:512});
  for(let stadium=0;stadium<8;stadium++){
    const size=scenarioPitchSize(stadium),address=0xec47+stadium*4;
    assert.equal(size.length,original[address]|original[address+1]<<8);
    assert.equal(size.width,original[address+2]|original[address+3]<<8);
    for(const [x,y] of [[0,0],[size.length,size.width],[size.length/2,size.width/2],[-1,-1]]){
      const changes=scenarioPositionChanges(x,y),p=scenarioPatch(original,0,changes),rom=original.slice();rom.set(p.bytes,p.offset);
      assert.deepEqual(scenarioPosition(readScenarios(rom)[0]),{x,y});
      assert.deepEqual(p.bytes.slice(0,11),stock[0].bytes.slice(0,11));
    }
    assert.deepEqual(positionOnPitch({x:2,y:-1},stadium),{x:size.length,y:0});
  }
  for(const [x,y] of [[32768,0],[0,-32769],[0.5,0],[NaN,0]])assert.throws(()=>scenarioPositionChanges(x,y));
  const positionProject=await RomProject.create(original);
  positionProject.transaction([scenarioPatch(original,0,scenarioPositionChanges(1920,320))]);
  assert.deepEqual(scenarioPosition(readScenarios(positionProject.exportRom())[0]),{x:1920,y:320});
  positionProject.undo();assert.deepEqual(positionProject.bytes(),original);positionProject.redo();
  assert.deepEqual(scenarioPosition(readScenarios((await RomProject.import(positionProject.record())).bytes())[0]),{x:1920,y:320});
  const {scenarioStartChanges,scenarioAutomaticPosition,scenarioRestart}=await import('../src/rom/scenario-position.mjs');
  const freeChanges=scenarioStartChanges(stock[0],{start:144});assert.deepEqual(scenarioPosition({...stock[0],...freeChanges}),{x:1912,y:4});assert.equal(scenarioAutomaticPosition({...stock[0],...freeChanges}),null);
  assert.equal(scenarioRestart(stock[4]),'throw');assert.equal(scenarioAutomaticPosition(stock[4]),null);
  assert.equal(scenarioRestart(stock[7]),'goal');
  assert.deepEqual(scenarioAutomaticPosition(stock[0]),{x:1912,y:4});
  assert.deepEqual(scenarioStartChanges(stock[0],{seconds:10}),{seconds:10},'Unrelated edits preserve original coordinates');
  for(let stadium=0;stadium<8;stadium++)for(const start of [8,16]){
    const changes=scenarioStartChanges(stock[1],{start,stadium}),p=scenarioPatch(original,1,changes),rom=original.slice();rom.set(p.bytes,p.offset);
    const s=readScenarios(rom)[1],position=scenarioAutomaticPosition(s),size=scenarioPitchSize(stadium);
    assert.equal(scenarioRestart(s),start===8?'goal':'corner');
    assert.deepEqual(position,start===8?{x:128,y:size.width/2-96}:{x:size.length-8,y:4});
    const newStadium=(stadium+1)%8,resized={...s,...scenarioStartChanges(s,{stadium:newStadium})},newSize=scenarioPitchSize(newStadium);
    assert.deepEqual(scenarioAutomaticPosition(resized),start===8?{x:128,y:newSize.width/2-96}:{x:newSize.length-8,y:4});
    const autoProject=await RomProject.create(original);autoProject.transaction([p]);
    assert.deepEqual(scenarioAutomaticPosition(readScenarios(autoProject.exportRom())[1]),position);
    autoProject.undo();assert.deepEqual(autoProject.bytes(),original);
    autoProject.redo();assert.deepEqual(scenarioAutomaticPosition(readScenarios(autoProject.bytes())[1]),position);
  }
  const {readScenarioSummary:readAutoSummary}=await import('../src/rom/scenario-summary.mjs');
  const autoProject=await RomProject.create(original);
  autoProject.transaction([scenarioPatch(original,7,scenarioStartChanges(stock[7],{start:16}))]);
  assert.match(readAutoSummary(autoProject.bytes(),7).lines[1],/C\.K\./,'Changing the native goal kick to a corner also changes its label');
  autoProject.undo();assert.deepEqual(autoProject.bytes(),original);
  console.log('PASS automatic restarts: fixed goal/corner positions, all stadiums, native throw-in preservation, labels, export and atomic history');
  console.log('PASS difficulty and pitch: native star table, isolated writes, validation, restoration, signed 16-bit positions, stadium dimensions, export and history');
  const changes={seconds:59,minutes:9,playerTeam:41,opponentTeam:31,playerGoals:10,opponentGoals:0,weather:8,stadium:7,start:134,x:255,y:0,ballX:128,ballY:64};
  const patch=scenarioPatch(original,2,changes);project.transaction([patch]);
  const current=readScenarios(project.bytes());for(const [key,value] of Object.entries(changes))assert.equal(current[2][key],value);
  assert.deepEqual([...current[2].bytes.slice(0,2)],[...stock[2].bytes.slice(0,2)]);
  for(let i=0;i<12;i++)if(i!==2)assert.deepEqual(current[i].bytes,stock[i].bytes);
  const edited=project.bytes(),ranges=project.patches.map(p=>[p.offset,p.offset+p.bytes.length]);for(let i=0;i<original.length;i++)if(original[i]!==edited[i])assert.ok(ranges.some(([a,b])=>i>=a&&i<b));
  project.undo();assert.deepEqual(project.bytes(),original);project.redo();assert.deepEqual(project.bytes(),edited);
  const imported=await RomProject.import(project.record());assert.deepEqual(imported.bytes(),edited);
  const output=project.exportRom();assert.equal(output.length,original.length);assert.equal(readScenarios(output)[2].seconds,59);
  const bad={...patch,bytes:patch.bytes.slice()};bad.bytes[0]^=1;assert.throws(()=>project.transaction([bad]),/Cabecera/);
  bad.bytes=patch.bytes.slice();bad.bytes[4]=3;assert.throws(()=>project.transaction([bad]),/rango/);
  const record=project.record();record.patches[0].bytes=Buffer.from(bad.bytes).toString('base64');await assert.rejects(()=>RomProject.import(record),/rango/);
  project.restore('scenario:2');assert.deepEqual(project.bytes(),original);
  project.transaction(stock.map((s,i)=>scenarioPatch(original,i,{playerGoals:10})));project.transaction(SCENARIO_RULES.flatMap(([id])=>project.restorePatches(id)));assert.equal(project.patches.length,0);
  const header=new Uint8Array(512).fill(0xa5),headered=new Uint8Array(original.length+512);headered.set(header);headered.set(original,512);
  const withHeader=await RomProject.create(headered);withHeader.transaction([patch]);const exported=withHeader.exportRom();assert.deepEqual(exported.slice(0,512),header);assert.deepEqual(readScenarios(exported.slice(512))[2].bytes,patch.bytes);
  const {readScenarioDescription,scenarioDescriptionPatch,SCENARIO_TEXT_RULES,scenarioDescriptionLines}=await import('../src/rom/scenario-text.mjs');
  for(let i=0;i<12;i++){
    const description=readScenarioDescription(original,i);
    assert.deepEqual(scenarioDescriptionPatch(original,i,description.text).bytes,description.bytes,'Original descriptions must round-trip exactly, including special spaces');
    assert.ok(description.text.split('\n').length<=6);
  }
  assert.match(readScenarioDescription(original,0).text,/ITALY against the talented\nCROATIA/);
  assert.match(readScenarioDescription(original,11).text,/Unbelievably,ENGLAND/);
  const text='Final minute!\nItaly must win 3-2.\nAttack now, take the lead.\nDon\'t give up.\nA-Z a-z 0-9: (yes)?\nVictory!';
  const textPatch=scenarioDescriptionPatch(original,0,text),textProject=await RomProject.create(original);
  textProject.transaction([textPatch]);
  assert.equal(readScenarioDescription(textProject.bytes(),0).text,text);
  assert.deepEqual(textProject.bytes().slice(0x3f113,0x3f12d),original.slice(0x3f113,0x3f12d),'Pointer table must stay intact');
  for(let i=1;i<12;i++)assert.deepEqual(readScenarioDescription(textProject.bytes(),i).bytes,readScenarioDescription(original,i).bytes);
  assert.deepEqual(readScenarios(textProject.bytes()).map(s=>s.bytes),stock.map(s=>s.bytes),'Description changes must not alter scenario conditions');
  // Emulate the real description renderer contract: 6x26 cells, native
  // DATA_87C016 glyph lookup, row stride $40, destination $0283.
  const cells=Array.from({length:6},(_,row)=>Array.from({length:26},(_,col)=>{
    const code=textProject.bytes()[textPatch.offset+row*26+col];
    const address=0x3c016+code*2,rom=textProject.bytes();
    return {destination:0x283+row*32+col,tile:(rom[address]|rom[address+1]<<8)|0x2000};
  }));
  assert.equal(cells[0][0].tile,0x2000|0xe5); // F
  assert.equal(cells[1][0].destination,0x2a3);
  assert.equal(cells.flat().length,156);
  const exportedText=textProject.exportRom();assert.equal(readScenarioDescription(exportedText,0).text,text);
  const importedText=await RomProject.import(textProject.record());assert.equal(readScenarioDescription(importedText.bytes(),0).text,text);
  textProject.undo();assert.deepEqual(textProject.bytes(),original);textProject.redo();assert.equal(readScenarioDescription(textProject.bytes(),0).text,text);
  const textBad={...textPatch,bytes:textPatch.bytes.slice()};textBad.bytes[0]=0xfb;
  assert.throws(()=>textProject.transaction([textBad]),/inválida/);
  const badTextRecord=textProject.record();badTextRecord.patches[0].bytes=Buffer.from(textBad.bytes).toString('base64');await assert.rejects(()=>RomProject.import(badTextRecord),/inválida/);
  for(const value of ['x'.repeat(27),Array(7).fill('x').join('\n'),'Gol de España','😀'])assert.throws(()=>scenarioDescriptionLines(value));
  assert.equal(scenarioDescriptionLines(Array(6).fill('x'.repeat(26)).join('\n')).join('').length,156);
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 :-!%.()+=<>$?*#~'/,";
  assert.doesNotThrow(()=>scenarioDescriptionLines(alphabet.match(/.{1,26}/g).join('\n')));
  const blank=scenarioDescriptionPatch(textProject.bytes(),0,'');assert.ok(blank.bytes.every(b=>b===0));
  textProject.restore('scenario-text:0');assert.deepEqual(textProject.bytes(),original);
  const headerText=await RomProject.create(headered);headerText.transaction([textPatch]);assert.equal(readScenarioDescription(headerText.exportRom().slice(512),0).text,text);
  assert.deepEqual(headerText.exportRom().slice(0,512),header);
  const {readScenarioSummary,scenarioSummaryPatch,SCENARIO_SUMMARY_RULES}=await import('../src/rom/scenario-summary.mjs');
  for(let i=0;i<12;i++)assert.deepEqual(scenarioSummaryPatch(original,original,i).bytes,readScenarioSummary(original,i).bytes);
  const regression=await RomProject.create(original);
  regression.transaction([scenarioPatch(original,0,{playerTeam:4,opponentTeam:15})]);
  assert.deepEqual(readScenarioSummary(regression.bytes(),0).lines,["NO.1  SPAIN 1-2 SWITZERLAND","      1:14 SPAIN'S C.K."]);
  assert.equal(readScenarios(regression.bytes())[0].playerTeam,4);assert.equal(readScenarios(regression.bytes())[0].opponentTeam,15);
  for(let i=1;i<12;i++)assert.deepEqual(readScenarioSummary(regression.bytes(),i).bytes,readScenarioSummary(original,i).bytes);
  assert.deepEqual(readScenarioDescription(regression.bytes(),0).bytes,readScenarioDescription(original,0).bytes);
  assert.deepEqual(regression.bytes().slice(0x3ee21,0x3ee3b),original.slice(0x3ee21,0x3ee3b),'Summary pointers stay intact');
  // Native TallMenuText decoder sees the actual exported header, not UI state.
  const decoded=b=>Array.from(b,v=>v===0?' ':v>=0x68&&v<=0x81?String.fromCharCode(65+v-0x68):v>=0x5e&&v<=0x67?String(v-0x5e):({0x54:'.',0x57:'-',0x5a:"'",0x5c:':'}[v]||'?')).join('');
  const summaryOffset=SCENARIO_SUMMARY_RULES[0][1];
  assert.equal(decoded(regression.exportRom().slice(summaryOffset,summaryOffset+28)).trimEnd(),'NO.1  SPAIN 1-2 SWITZERLAND');
  const oldRecord=regression.record();oldRecord.patches=oldRecord.patches.filter(p=>!p.id.startsWith('scenario-summary:'));
  const migrated=await RomProject.import(oldRecord);assert.deepEqual(readScenarioSummary(migrated.bytes(),0).lines,readScenarioSummary(regression.bytes(),0).lines);
  regression.undo();assert.deepEqual(regression.bytes(),original);regression.redo();assert.match(readScenarioSummary(regression.bytes(),0).lines[0],/SPAIN/);
  regression.transaction([scenarioPatch(regression.bytes(),0,{minutes:2,seconds:59,playerGoals:3,opponentGoals:0,start:134})]);
  assert.deepEqual(readScenarioSummary(regression.bytes(),0).lines,["NO.1  SPAIN 3-0 SWITZERLAND","      2:59 SWISS'S F.K."]);
  const headerSummary=await RomProject.create(headered);headerSummary.transaction([scenarioPatch(original,0,{playerTeam:4,opponentTeam:15})]);
  assert.equal(decoded(headerSummary.exportRom().slice(summaryOffset+512,summaryOffset+540)).trimEnd(),'NO.1  SPAIN 1-2 SWITZERLAND');
  regression.restore('scenario:0');assert.deepEqual(regression.bytes(),original);assert.equal(regression.patches.length,0);
  const special=await RomProject.create(original);special.transaction([scenarioPatch(original,4,{playerTeam:4})]);assert.match(readScenarioSummary(special.bytes(),4).lines[1],/SPAIN'S THROW IN/);
  for(let i=0;i<42;i++){const changedRom=original.slice(),p=scenarioPatch(original,11,{playerTeam:i,opponentTeam:41-i,playerGoals:10,opponentGoals:10});changedRom.set(p.bytes,p.offset);const summary=scenarioSummaryPatch(original,changedRom,11);assert.equal(summary.bytes.length,56);assert.ok(readScenarioSummary(original,11).bytes.length===summary.bytes.length);}
  console.log('PASS selector summaries: Spain/Switzerland regression, native tall-font text, time/score/start sync, independent labels, atomic undo/redo, old-project migration, restores and headered export');
  console.log('PASS descriptions: 12 original texts, 6x26 layout, native glyph mapping, special-space preservation, independent edits, limits, history, import/export and control-code rejection');
  console.log('PASS scenarios: 12 records, BCD time, all fields, boundaries, isolated writes, undo/redo, restore, project import, headered ROM export and tamper rejection');
})();
