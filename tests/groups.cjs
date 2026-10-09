const assert=require('assert/strict'),fs=require('fs');
global.crypto ||= require('crypto').webcrypto;
(async()=>{
 const {RomProject}=await import('../src/rom/project.mjs');
 const {loRom,word}=await import('../src/rom/binary.mjs');
 const {editableGroups,editGroupsPatches}=await import('../src/rom/group-editor.mjs');
 const {GROUP_EDITOR_RULES,GROUP_TEAM_TABLE,GROUP_PAGE_COUNTS,GROUP_PAGE_TITLES,groupSelectorPatches,readGroups,groupPages,validateGroups,groupColumns,groupPageTitles}=await import('../src/rom/groups.mjs');
 const {selectionGroupGraphics,graphicPatches}=await import('../src/rom/graphics.mjs');
 const {groupTextPatches,groupTexts}=await import('../src/rom/group-text.mjs');
 const file='roms/International Superstar Soccer Deluxe (USA).sfc';
 if(!fs.existsSync(file)){console.log('SKIP groups local ROM tests');return;}
 const original=new Uint8Array(fs.readFileSync(file)),project=await RomProject.create(original);
 const stock=editableGroups(original);assert.equal(stock.length,7);assert.ok(stock.every(g=>g.teams.length===6));
 const groups=[{name:'GRUPO 1',teams:[30,31,32,35]},{name:'GRUPO 2',teams:[0,1,2,3,4,5,6,7]},{name:'GRUPO 3',teams:[36,37,38,39,40,41]},{name:'VACIO',teams:[]}];
 project.transaction(editGroupsPatches(original,original,groups));
 const rom=project.bytes(),pages=groupPages(groups);
 assert.deepEqual(editableGroups(rom),groups);assert.deepEqual(pages.map(p=>p.teams.length),[4,6,2,6]);
 const countOffset=loRom(0x85a566);assert.equal(rom[countOffset+1],4);assert.equal(rom[countOffset+13],4);
 pages.forEach((p,i)=>{assert.equal(word(rom,loRom(GROUP_PAGE_COUNTS)+i*2),p.teams.length);assert.equal(word(rom,loRom(GROUP_PAGE_TITLES)+i*2),p.group);assert.deepEqual([...rom.slice(loRom(GROUP_TEAM_TABLE)+i*6,loRom(GROUP_TEAM_TABLE)+i*6+p.teams.length)],p.teams.map(t=>t*2));});
 // Execute the patched 65816 routines with the real ROM table loads and
 // memory-copy contract, rather than merely checking generated instruction bytes.
 function cpu(snapshot=rom){
  const ram=new Uint8Array(0x800000),vram=new Uint8Array(65536),stack=[],returns=[];let a=0,x=0,y=0,d=0x1900,pc=0,carry=0,z=false,n=false,done=false;
  const read8=p=>{if(p>=0x808000&&(p&65535)<32768)throw Error(`Bad ROM read ${p.toString(16)} at ${pc.toString(16)} A=${a.toString(16)} X=${x.toString(16)} Y=${y.toString(16)}`);return p>=0x808000?snapshot[loRom(p)]:ram[p];};const read=p=>read8(p)|read8(p+1)<<8,write=(p,v)=>{ram[p]=v&255;ram[p+1]=v>>>8;};
  const flags=v=>{v&=65535;z=v===0;n=!!(v&32768);return v;},cmp=(lhs,rhs)=>{carry=lhs>=rhs?1:0;flags(lhs-rhs);},byte=()=>read8(pc++),nextWord=()=>byte()|byte()<<8,long=()=>nextWord()|byte()<<16;
  const relative=condition=>{let offset=byte();if(condition)pc+=offset<128?offset:offset-256;};
  function run(start){pc=start;done=false;for(let steps=0;steps<50000&&!done;steps++){
   const at=pc,op=byte();switch(op){
    case 0x08:stack.push({carry,z,n});break;case 0x28:({carry,z,n}=stack.pop());break;
    case 0xc2:assert.equal(byte(),0x30);break;
    case 0x0b:stack.push(d);break;case 0x2b:d=stack.pop();break;case 0x5b:d=a;break;
    case 0x48:stack.push(a);break;case 0x68:a=flags(stack.pop());break;case 0xda:stack.push(x);break;case 0xfa:x=flags(stack.pop());break;case 0x5a:stack.push(y);break;case 0x7a:y=flags(stack.pop());break;
    case 0xa9:a=flags(nextWord());break;case 0xa2:x=flags(nextWord());break;case 0xa0:y=flags(nextWord());break;
    case 0xa5:a=flags(read(d+byte()));break;case 0xa6:x=flags(read(d+byte()));break;case 0xa4:y=flags(read(d+byte()));break;
    case 0xad:a=flags(read(nextWord()));break;case 0xbf:a=flags(read(long()+x));break;
    case 0x85:write(d+byte(),a);break;case 0x64:write(d+byte(),0);break;case 0x8d:write(nextWord(),a);break;case 0x99:write(nextWord()+y,a);break;case 0x9f:write(long()+x,a);break;
    case 0x8a:a=flags(x);break;case 0x98:a=flags(y);break;case 0xaa:x=flags(a);break;case 0xa8:y=flags(a);break;
    case 0x4a:carry=a&1;a=flags(a>>>1);break;case 0xeb:a=flags((a<<8|a>>>8)&65535);break;case 0x09:a=flags(a|nextWord());break;
    case 0x0a:carry=a>>>15;a=flags(a<<1);break;case 0x18:carry=0;break;case 0x38:carry=1;break;
    case 0x69:{const v=a+nextWord()+carry;carry=v>65535?1:0;a=flags(v);break;}case 0x65:{const v=a+read(d+byte())+carry;carry=v>65535?1:0;a=flags(v);break;}
    case 0xe9:{const v=a-nextWord()-(1-carry);carry=v>=0?1:0;a=flags(v);break;}
    case 0x29:a=flags(a&nextWord());break;case 0xc5:cmp(a,read(d+byte()));break;case 0xc9:cmp(a,nextWord());break;case 0xe0:cmp(x,nextWord());break;
    case 0xe8:x=flags(x+1);break;case 0xc8:y=flags(y+1);break;case 0x1a:a=flags(a+1);break;case 0x3a:a=flags(a-1);break;case 0xe6:{const p=d+byte();write(p,flags(read(p)+1));break;}
    case 0xea:break;case 0x80:relative(true);break;case 0xf0:relative(z);break;case 0xd0:relative(!z);break;case 0x90:relative(!carry);break;case 0xb0:relative(carry);break;
    case 0x4c:pc=(pc&0xff0000)|nextWord();break;
    case 0x20:{const target=(pc&0xff0000)|nextWord();returns.push(pc);pc=target;break;}
    case 0x22:{const target=long();if(target===0x808b4c){const dividend=a;a=flags(Math.floor(dividend/y));y=dividend%y;}
     else if(target===0x808e37){const source=(read(d)<<16)|a;for(let i=0;i<x;i++)vram[y*2+i]=read8(source+i);a=flags(read(d+0x48)+10);write(d+0x48,a);x=a-10;}
     else if(target!==0x85862e){returns.push(pc);pc=target;}break;}
    case 0x60:case 0x6b:if(returns.length)pc=returns.pop();else done=true;break;
    default:throw Error(`Opcode ${op.toString(16)} at ${at.toString(16)}`);
   }
  }assert.ok(done,'Routine must terminate');assert.deepEqual(stack,[]);assert.equal(returns.length,0);}
  return {ram,vram,read,write,run,get a(){return a;},get x(){return x;},get y(){return y;},get d(){return d;},set a(v){a=v;},set x(v){x=v;},set y(v){y=v;},set d(v){d=v;}};
 }
 const address=(id,snapshot=rom)=>{const [,offset]=GROUP_EDITOR_RULES.find(([name])=>name===`group-editor:${id}`);return snapshot[offset+1]|snapshot[offset+2]<<8|snapshot[offset+3]<<16;};
 for(let page=0;page<pages.length;page++){
  const teams=pages[page].teams,c=cpu();c.write(c.d+0x42,page);
  for(let slot=0;slot<6;slot++){
   c.write(c.d+0x44,slot);c.x=0x5678;c.run(address('select'));assert.equal(c.a,teams[slot<teams.length?slot:0]*2);assert.equal(c.x,0x5678);
  }
  for(let slot=0;slot<teams.length;slot++)for(const direction of ['left','right','vertical']){
   c.write(c.d+0x44,slot);c.x=0x6789;c.run(address(direction));const v=c.read(c.d+0x44);assert.ok(v>=0&&v<teams.length);assert.equal(c.x,0x6789);
   if(direction==='left')assert.equal(v,(slot+teams.length-1)%teams.length);if(direction==='right')assert.equal(v,(slot+1)%teams.length);
  }
  // Execute all stock flag and small-name upload loops, now using page counts.
  for(let team=0;team<42;team++){
   c.ram.fill(team+1,0x7f0000+team*64,0x7f0000+(team+1)*64);
   const source=word(rom,loRom(0x82f829)+team*2);c.ram.fill(team+1,0x7f0000+source,0x7f0000+source+192);
  }
  c.vram.fill(99);
  c.run(0x85aed7);assert.equal(c.d,0x1900);c.run(0x85af2f);assert.equal(c.d,0x1900);
  for(let slot=0;slot<6;slot++){
   const flag=2*word(rom,loRom(0x82f87d)+slot*2),name=2*word(rom,loRom(0x82f7f7)+slot*2);
   assert.equal(c.vram[flag],slot<teams.length?teams[slot]+1:0,`flag page ${page} slot ${slot}`);assert.equal(c.vram[name],slot<teams.length?teams[slot]+1:0,`name page ${page} slot ${slot}`);
  }
  c.y=page;c.run(0x85ae84);assert.equal(c.d,0x1900);
  assert.equal(c.read(0x1800),0x2a|teams.length<<8,'Palette script header must match the number of descriptors');
  assert.equal(c.read(0x1800+2+teams.length*4),0x12);
  for(let slot=0;slot<teams.length;slot++)assert.equal(c.read(0x1803+slot*4),word(rom,loRom(0x81e7d8)+teams[slot]*2));
 }
 // Repeated L/R page changes must not let opcode $2A interpret stale RAM
 // after the palette terminator. Model its real entry-count contract and
 // preserve every CGRAM byte outside the four flag-palette destinations.
 const twoGroups=[{name:'GRUPO 1',teams:[2,8,0,20]},{name:'GRUPO 2',teams:[9,1,3,5]}];
 const twoProject=await RomProject.create(original);twoProject.transaction(editGroupsPatches(original,original,twoGroups));
 const twoRom=twoProject.bytes(),switching=cpu(twoRom),cgram=new Uint8Array(512).fill(0x5a);
 function consumePaletteScript(c,snapshot){
  let cursor=0x1800;const header=c.read(cursor);assert.equal(header&255,0x2a);cursor+=2;
  for(let entry=0;entry<header>>>8;entry++,cursor+=4){
   const destination=c.ram[cursor]*2,source=c.read(cursor+1),bank=c.ram[cursor+3];
   assert.equal(bank,0x89,'Every consumed descriptor must be a palette, never the terminator or stale RAM');
   const size=word(snapshot,loRom(bank<<16|source));
   cgram.set(snapshot.slice(loRom(bank<<16|source)+2,loRom(bank<<16|source)+2+size+1),destination);
  }
  assert.equal(c.read(cursor),0x12,'Interpreter must stop exactly at the palette terminator');
 }
 for(let change=0;change<40;change++){
  const page=change%2;switching.y=page;switching.run(0x85ae84);consumePaletteScript(switching,twoRom);
  for(let slot=0;slot<4;slot++){
   const pointer=word(twoRom,loRom(0x81e7d8)+twoGroups[page].teams[slot]*2),source=loRom(0x890000|pointer),size=word(twoRom,source)+1;
   assert.deepEqual(cgram.slice((0x8c+slot*16)*2,(0x8c+slot*16)*2+size),twoRom.slice(source+2,source+2+size));
  }
  for(let offset=0;offset<cgram.length;offset++)if(!Array.from({length:4},(_,i)=>[(0x8c+i*16)*2,(0x8c+i*16)*2+8]).some(([start,end])=>offset>=start&&offset<end))assert.equal(cgram[offset],0x5a,'Background and UI palettes must remain unchanged');
 }
 // Prove the same consumer rejects the previous fixed-six header with only
 // four entries, even when the surrounding RAM still holds valid old data.
 const broken=twoRom.slice();groupSelectorPatches(original,twoGroups,{fixedPaletteHeader:true}).forEach(p=>broken.set(p.bytes,p.offset));
 const previous=cpu(broken);previous.y=0;previous.run(0x85ae84);assert.throws(()=>consumePaletteScript(previous,broken),/descriptor|terminator|palette/);
 for(const [i,page] of pages.entries())for(const [slot,team] of page.teams.entries()){
  const c=cpu();c.write(c.d+0x26,team*2);c.run(address('search'));const first=pages.findIndex(p=>p.teams.includes(team));assert.equal(c.a,first);assert.equal(c.y,pages[first].teams.indexOf(team));
 }
 const missing=cpu();missing.write(missing.d+0x26,29*2);missing.run(address('search'));assert.equal(missing.a,0);assert.equal(missing.y,0);
 // Configurable four-column native layout, including real helper execution.
 const fourProject=await RomProject.create(original);
 fourProject.transaction(editGroupsPatches(original,original,groups,4));
 const fourRom=fourProject.bytes(),fourPages=groupPages(groups,4);
 assert.equal(groupColumns(fourRom),4);assert.deepEqual(fourPages.map(p=>p.teams.length),[4,4,4,4,2]);
 assert.equal(fourRom[loRom(0x81d53d)],48,'Blue HDMA background ends 24 pixels earlier with the reduced border');
 assert.equal(original[loRom(0x81d53d)],72);
 assert.equal(fourRom[loRom(0x87ae82)],3,'Four flag objects, including the initial one');
 assert.deepEqual([...fourRom.slice(loRom(0x87ae59),loRom(0x87ae59)+5)],[0xa7,2,19,1,1]);
 for(let slot=0;slot<4;slot++){
  assert.equal(word(fourRom,loRom(0x879fa3)+slot*2),152<<8|60+slot*40);
  assert.equal(word(fourRom,loRom(0x879fbf)+slot*2),150<<8|59+slot*40);
  // Each label references the same four BG3 tiles written by that slot's DMA.
  const tile=word(fourRom,loRom(0x82f7f7)+slot*2)/8-0x800;
  for(let col=0;col<4;col++)assert.equal(word(fourRom,loRom(0x87c016)+fourRom[loRom(0x87c50c)+slot*5+col]*2),tile+col);
 }
 for(const [page,p] of fourPages.entries()){
  const c=cpu(fourRom);c.write(c.d+0x42,page);
  for(const [slot,team] of p.teams.entries()){
   c.write(c.d+0x44,slot);c.run(address('select',fourRom));assert.equal(c.a,team*2);
   c.run(address('vertical',fourRom));assert.equal(c.read(c.d+0x44),slot);
   c.run(address('right',fourRom));assert.equal(c.read(c.d+0x44),(slot+1)%p.teams.length);
   c.write(c.d+0x26,team*2);c.run(address('search',fourRom));assert.equal(c.a,page);assert.equal(c.y,slot);
  }
  for(let team=0;team<42;team++){
   c.ram.fill(team+1,0x7f0000+team*64,0x7f0000+(team+1)*64);
   const source=word(fourRom,loRom(0x82f829)+team*2);c.ram.fill(team+1,0x7f0000+source,0x7f0000+source+192);
  }
  c.run(0x85aed7);c.run(0x85af2f);
  for(let slot=0;slot<6;slot++){
   assert.equal(c.vram[2*word(fourRom,loRom(0x82f87d)+slot*2)],slot<p.teams.length?p.teams[slot]+1:0);
   assert.equal(c.vram[2*word(fourRom,loRom(0x82f7f7)+slot*2)],slot<p.teams.length?p.teams[slot]+1:0);
  }
  c.y=page;c.run(0x85ae84);assert.equal(c.read(0x1800),0x2a|p.teams.length<<8);
  assert.equal(word(fourRom,loRom(groupPageTitles(fourRom))+page*2),p.group);
 }
 assert.deepEqual((await RomProject.import(fourProject.record())).bytes(),fourRom);
 const oldFour=fourProject.record(),oldFourPatches=groupSelectorPatches(original,groups,{columns:4,fullHeightBackground:true}),oldFourIds=new Set(oldFourPatches.map(p=>p.id));
 oldFour.patches=[...oldFour.patches.filter(p=>!oldFourIds.has(p.id)),...oldFourPatches.map(p=>({...p,bytes:Buffer.from(p.bytes).toString('base64')}))];
 assert.deepEqual((await RomProject.import(oldFour)).bytes(),fourRom,'Existing four-column projects upgrade their background height');
 fourProject.transaction(editGroupsPatches(original,fourRom,groups,3));assert.deepEqual(fourProject.bytes(),rom);
 fourProject.undo();assert.deepEqual(fourProject.bytes(),fourRom);fourProject.redo();assert.deepEqual(fourProject.bytes(),rom);
 fourProject.undo();fourProject.restore('group-editor:data');for(const [,offset,size] of GROUP_EDITOR_RULES)assert.deepEqual(fourProject.bytes().slice(offset,offset+size),original.slice(offset,offset+size));
 const maximum=Array.from({length:16},(_,i)=>({name:`GRUPO ${i+1}`,teams:Array.from({length:42},(_,t)=>t)}));
 fourProject.transaction(editGroupsPatches(original,original,maximum,4));assert.equal(groupPages(maximum,4).length,176);fourProject.exportRom();
 const exported=project.exportRom();assert.equal(exported.length,original.length);assert.equal(word(exported,0x7fde),exported.reduce((s,b)=>(s+b)&65535,0));
 assert.deepEqual((await RomProject.import(project.record())).bytes(),rom);
 project.undo();assert.deepEqual(project.bytes(),original);project.redo();assert.deepEqual(project.bytes(),rom);
 project.transaction(groupTextPatches(original,rom,selectionGroupGraphics(rom)[1],'OTRO GRUPO'));assert.equal(groupTexts(project.bytes())[1],'OTRO GRUPO');
 const drawing=selectionGroupGraphics(project.bytes())[0].matrix.map(row=>row.slice());drawing[0][0]^=1;
 project.transaction(graphicPatches(original,project.bytes(),selectionGroupGraphics(project.bytes())[0],drawing));
 const reassigned=editableGroups(project.bytes());reassigned[0].teams=[0,1,2,3,4,5,6,7];
 project.transaction(editGroupsPatches(original,project.bytes(),reassigned));assert.deepEqual(selectionGroupGraphics(project.bytes())[0].matrix,drawing);
 reassigned.splice(1,1);project.transaction(editGroupsPatches(original,project.bytes(),reassigned));assert.deepEqual(selectionGroupGraphics(project.bytes())[0].matrix,drawing);
 project.restore('group-editor:data');assert.deepEqual(readGroups(project.bytes()),readGroups(original));
 project.reset();assert.deepEqual(project.exportRom(),original);
 const sixteen=Array.from({length:16},(_,i)=>({name:`GRUPO ${i+1}`,teams:[i,i+16]}));project.transaction(editGroupsPatches(original,original,sixteen));assert.equal(readGroups(project.bytes()).length,16);assert.equal(selectionGroupGraphics(project.bytes()).length,16);assert.deepEqual((await RomProject.import(project.record())).bytes(),project.bytes());
 for(const legacy of [{fixedPaletteHeader:true},{ramClear:true,fixedPaletteHeader:true},{ramClear:true,directRead:true,fixedPaletteHeader:true}]){
  const record=project.record(),patches=groupSelectorPatches(original,sixteen,legacy),ids=new Set(patches.map(p=>p.id));
  record.patches=[...record.patches.filter(p=>!ids.has(p.id)),...patches.map(p=>({...p,bytes:Buffer.from(p.bytes).toString('base64')}))];
  assert.deepEqual((await RomProject.import(record)).bytes(),project.bytes());
 }
 const bad=project.patches.find(p=>p.id==='group-editor:code');bad.bytes[0]^=1;assert.throws(()=>project.transaction([bad]),/no compatible/);
 const wrongRevision=original.slice();wrongRevision[loRom(0x85ae79)]^=1;assert.throws(()=>editGroupsPatches(wrongRevision,wrongRevision,groups),/no compatible/);
 assert.throws(()=>validateGroups([]),/1 y 16/);assert.throws(()=>validateGroups([{name:'VACIO',teams:[]}]),/al menos/);assert.throws(()=>validateGroups([{name:'UNO',teams:[0,0]}]),/inválidos/);assert.throws(()=>validateGroups([{name:'UNO',teams:[42]}]),/inválidos/);
 console.log('PASS groups: CRUD, configurable 3/4 columns, 176 pages, flag/cursor/name alignment, 4/8-team pages, 16 groups, real selector navigation, 40 repeated four-team palette switches, flag/name uploads, missing defaults, metadata, title edits, atomic history, validation and export');
})().catch(e=>{console.error(e);process.exitCode=1;});
