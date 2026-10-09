const assert=require('assert/strict'),fs=require('fs');
global.crypto ||= require('crypto').webcrypto;
(async()=>{
 const file='roms/International Superstar Soccer Deluxe (USA).sfc';if(!fs.existsSync(file)){console.log('SKIP group renderer local ROM test');return;}
 const {RomProject}=await import('../src/rom/project.mjs');
 const {selectionGroupGraphics,graphicPatches,GROUP_RULES}=await import('../src/rom/graphics.mjs');
 const rom=new Uint8Array(fs.readFileSync(file)),p=await RomProject.create(rom),r=selectionGroupGraphics(rom)[0],m=r.matrix.map(row=>row.slice());m[0][8]^=2;
 p.transaction(graphicPatches(rom,rom,r,m));
 const [,offset,size]=GROUP_RULES.find(([id])=>id==='groups:renderer'),code=p.bytes().slice(offset,offset+size);
 // Execute the selection-only 65816 routine with 16-bit A/X/Y and a nonzero
 // sprite direct page. The external call models the game's DMA queue contract.
 for(let group=0;group<7;group++)for(const inhibited of [false,true]){
  let a=0,x=0,y=0,d=0x1900,pc=0,carry=0,z=false;const stack=[],memory=new Uint8Array(0x800000),uploads=[];
  const read=address=>memory[address]|memory[address+1]<<8;
  const write=(address,value)=>{memory[address]=value&255;memory[address+1]=value>>>8;};
  write(d+0x42,group);write(0x1406,inhibited?0x100:0);write(0x1eb0,0x54);
  const byte=()=>code[pc++],word=()=>byte()|byte()<<8,flags=value=>{z=(value&65535)===0;return value&65535;};
  let complete=false;
  for(let steps=0;steps<500&&!complete;steps++)switch(byte()){
   case 0x0b:stack.push(d);break;
   case 0xa5:a=flags(read(d+byte()));break;
   case 0x0a:carry=a>>>15;a=flags(a<<1);break;
   case 0x18:carry=0;break;
   case 0x69:{const sum=a+word()+carry;carry=sum>65535?1:0;a=flags(sum);break;}
   case 0x48:stack.push(a);break;
   case 0xa9:a=flags(word());break;
   case 0x5b:d=a;break;
   case 0x68:a=flags(stack.pop());break;
   case 0xa2:x=flags(word());break;
   case 0xa0:y=flags(word());break;
   case 0x9f:{const address=word()|byte()<<16;write(address+x,a);break;}
   case 0x1a:a=flags(a+1);break;
   case 0xe8:x=flags(x+1);break;
   case 0x88:y=flags(y-1);break;
   case 0xd0:{const delta=byte();if(!z)pc+=delta<128?delta:delta-256;break;}
   case 0x8a:a=flags(x);break;
   case 0xaa:x=flags(a);break;
   case 0xad:a=flags(read(word()));break;
   case 0x89:z=(a&word())===0;break;
   case 0x85:write(d+byte(),a);break;
   case 0x29:a=flags(a&word());break;
   case 0xeb:a=(a<<8|a>>>8)&65535;break;
   case 0xa8:y=flags(a);break;
   case 0x22:assert.equal(word()|byte()<<16,0x808e37);uploads.push({source:read(d)<<16|a,size:x,destination:y});break;
   case 0x2b:d=stack.pop();break;
   case 0x6b:complete=true;break;
   default:throw Error(`Unexpected opcode at ${pc-1}`);
  }
  assert.ok(complete);assert.equal(d,0x1900);assert.deepEqual(stack,[]);
  for(let i=0;i<16;i++)assert.equal(read(0x7fe40c+(i%8)*2+(i>>3)*64),0x21c0+group*16+i);
  assert.deepEqual(uploads,inhibited?[]:[{source:0x7fe40c,size:128,destination:0x5606}]);
 }
 console.log('PASS group renderer: seven independent titles, sprite direct page, tilemap rows, DMA contract and inhibited uploads');
})().catch(e=>{console.error(e);process.exitCode=1;});
