import {decompress} from './binary.mjs';

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

