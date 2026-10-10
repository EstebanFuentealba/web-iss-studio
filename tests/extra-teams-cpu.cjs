const assert=require('assert/strict'),fs=require('fs'),path=require('path');
global.crypto ||= require('crypto').webcrypto;
(async()=>{
 const {RomProject}=await import('../src/rom/project.mjs');
 const {TEAM_PHOTO_TABLES}=await import("../src/rom/extra-teams.mjs");
 const {loRom,word}=await import('../src/rom/binary.mjs');
 const {attributeOffset,teamPointer}=await import('../src/rom/team-count.mjs');
 const filename=path.join(__dirname,'../roms/International Superstar Soccer Deluxe (USA).sfc');
 if(!fs.existsSync(filename)){console.log('SKIP extra team CPU: local USA ROM unavailable');return;}
 const original=new Uint8Array(fs.readFileSync(filename)),p=await RomProject.create(original);p.addTeam('CHILE');const rom=p.bytes();
 function cpu(){
  const ram=new Uint8Array(0x20000),stack=[],returns=[];let a=0,x=0,y=0,pc=0,carry=0,bank=0;
  const read8=addr=>addr>>>16===0x7e||addr<0x10000?ram[addr&0xffff]:rom[loRom(addr)];
  const write=(addr,v)=>{ram[addr&0xffff]=v&255;ram[(addr+1)&0xffff]=v>>>8;};
  const read=addr=>read8(addr)|read8(addr+1)<<8;
  const byte=()=>read8(pc++),nextWord=()=>byte()|byte()<<8,long=()=>nextWord()|byte()<<16;
  const branch=take=>{const n=byte();if(take)pc+=n<128?n:n-256;};
  function run(start,stop){pc=start;for(let steps=0;steps<1000;steps++){
   if(pc===stop)return;const at=pc,op=byte();switch(op){
    case 0xc9:carry=a>=nextWord()?1:0;break;case 0x90:branch(!carry);break;case 0xb0:branch(carry);break;case 0x80:branch(true);break;
    case 0x18:carry=0;break;case 0x38:carry=1;break;
    case 0x69:{const n=a+nextWord()+carry;a=n&65535;carry=n>65535?1:0;break;}
    case 0xe9:{const n=a-nextWord()-(1-carry);a=n&65535;carry=n>=0?1:0;break;}
    case 0x22:{const target=long();returns.push(pc);pc=target;break;}
    case 0x5c:pc=long();break;
    case 0x6b:if(returns.length)pc=returns.pop();else{assert.equal(stack.length,0);return;}break;
    case 0x85:write(byte(),a);break;case 0x84:write(byte(),y);break;case 0x8d:write(nextWord(),a);break;
    case 0xad:a=read(nextWord());break;case 0xa9:a=nextWord();break;case 0xaa:x=a;break;case 0xbf:a=read(long()+x);break;
    case 0x8b:stack.push(bank);break;case 0xab:bank=stack.pop();break;
    case 0x54:{const dest=byte(),source=byte(),n=a+1;for(let i=0;i<n;i++)ram[(y+i)&65535]=read8(source<<16|(x+i)&65535);x=(x+n)&65535;y=(y+n)&65535;a=65535;bank=dest;break;}
    case 0xea:break;default:throw Error(`Unexpected opcode ${op.toString(16)} at ${at.toString(16)}`);
   }
  }throw Error('Routine did not terminate');}
  return {ram,read,run,get a(){return a;},set a(v){a=v;},get x(){return x;},set x(v){x=v;},get y(){return y;},set y(v){y=v;},get bank(){return bank;}};
 }
 const hook=a=>rom[loRom(a)+1]|rom[loRom(a)+2]<<8|rom[loRom(a)+3]<<16;
 for(let team=0;team<48;team++){
  const c=cpu();c.a=(team+1)*140;c.run(hook(0x83c6bd));assert.equal(c.read(0),attributeOffset(rom,team)-0x50000+0x8000);assert.equal(c.a,c.read(0));
  for(let player=0;player<20;player++){const d=cpu();d.a=0x8000+team*140+player*7;d.run(hook(0x98f82a));assert.equal(d.read(0x0d38),attributeOffset(rom,team,player)-0x50000+0x8000);assert.equal(d.a,0x8a);}
 }
 // Execute the native photograph table reads for every original/new ID.
 // In particular, the skin pair's second read uses the table + 1 operand.
 for(const [old,next,stride,reads] of TEAM_PHOTO_TABLES)for(let team=0;team<48;team++)for(const [entry,delta] of reads){const c=cpu();c.x=team*stride;c.run(entry,entry+4);const expectedOffset=loRom(old)+(team<42?team:0)*stride+delta;const mask=stride===1||old===0x82f95f?255:65535;assert.equal(c.a&mask,word(original,expectedOffset)&mask);assert.equal(word(rom,loRom(entry)+1)|rom[loRom(entry)+3]<<16,next+delta);}
 // All five native UI routines must address the relocated small frames,
 // rather than interpreting an added team name as the 1P/banner object.
 for(const entry of [0x86c64e,0x86c66d,0x86c68c,0x86c6ab,0x8bcdad]){const c=cpu();c.run(entry);assert.equal(c.read(0),word(original,loRom(entry)+1)+0xf8);}
 // The moved Challenge ID still resolves to its original attributes.
 const challenge=cpu();challenge.a=49*140;challenge.run(hook(0x83c6bd));assert.equal(challenge.read(0),0x96f8);
 for(let team=42;team<48;team++)for(const dest of [0xd478,0xd518]){
  const c=cpu();c.a=team*2;c.y=dest;c.run(hook(0xa49c89));const source=loRom(0x870000|teamPointer(rom,0x38138,team));assert.deepEqual(c.ram.slice(dest,dest+160),rom.slice(source,source+160));assert.equal(c.bank,0);assert.equal(c.y,dest+160);
 }
 for(let team=36;team<42;team++){const c=cpu();c.a=team*2;c.y=0xd478;c.run(hook(0xa49c89),0xa49c8f);assert.equal(c.a,(team-36)*2);assert.equal(c.read(0x12),0xd478);}
 const challengeNames=cpu();challengeNames.a=96;challengeNames.y=0xd478;challengeNames.run(hook(0xa49c89),0xa49c8f);assert.equal(challengeNames.a,12);
 for(let team=0;team<49;team++)for(const entry of [0xa4bfc8,0xa4bff6]){const c=cpu();c.ram[0xda0]=team*2;c.run(hook(entry));assert.equal(c.a,team<42?team*2:team<48?0:84);}
 // Home + 98 bytes reaches the relocated away table, including the last
 // added team; native code previously used +86 for the 43-entry tables.
 for(let team=0;team<48;team++)assert.equal(word(rom,loRom(0xb0c5ea)+98+team*2),teamPointer(rom,0x102d0,team));
 console.log('PASS extra team CPU: 960 preview players, all 48 match pointers, both roster destinations, native All-Star fallback, moved Challenge ID, native photograph reads and all five relocated UI frames');
})().catch(e=>{console.error(e);process.exitCode=1;});
