import { loRom } from './binary.mjs';
import { decodeBrr } from './audio.mjs';
export const STREAMED=['TitleScreenNameDrop','VictoryMusic','UnknownShout','UnknownIntroSample'];
export function audioRegion(rom,sample) {
  const offset=loRom(sample.start),span=loRom(sample.end)-offset,capacity=Math.floor(span/9)*9;
  const bytes=rom.slice(offset,offset+capacity);
  const headers=Array.from({length:capacity/9},(_,i)=>bytes[i*9]);
  const reason=STREAMED.includes(sample.name)?'Recurso transmitido por fragmentos: necesita conservar el protocolo SPC700.':headers.some(h=>h&2)?'Contiene loop BRR: falta verificar el punto de bucle del directorio SPC700.':headers.slice(0,-1).some(h=>h&1)?'Tiene finales intermedios: estructura de reproducción pendiente.':!(headers.at(-1)&1)?'Final BRR no verificado.':'';
  return {offset,capacity,bytes,reason};
}
export function pitchRate(pitch) {
  if(!Number.isInteger(pitch)||pitch<1||pitch>0x3fff) throw new Error('El pitch DSP debe estar entre 1 y 16383.');
  return 32000*pitch/4096;
}
export function parseWav(buffer) {
  const view=new DataView(buffer),tag=o=>String.fromCharCode(...new Uint8Array(buffer,o,4));
  if(buffer.byteLength<44||tag(0)!=='RIFF'||tag(8)!=='WAVE')throw new Error('Se requiere un archivo WAV RIFF PCM.');
  const end=view.getUint32(4,true)+8;if(end>buffer.byteLength)throw new Error('WAV truncado.');
  let format,region;
  for(let cursor=12;cursor+8<=end;) {
    const size=view.getUint32(cursor+4,true),start=cursor+8;
    if(start+size>end)throw new Error('Chunk WAV truncado.');
    if(tag(cursor)==='fmt ') {
      if(size<16)throw new Error('Formato WAV truncado.');
      format={type:view.getUint16(start,true),channels:view.getUint16(start+2,true),rate:view.getUint32(start+4,true),align:view.getUint16(start+12,true),bits:view.getUint16(start+14,true)};
    }
    if(tag(cursor)==='data')region={start,size};cursor=start+size+(size%2);
  }
  if(!format||!region||format.type!==1||![1,2].includes(format.channels)||![8,16].includes(format.bits)||format.align!==format.channels*format.bits/8||format.rate<4000||format.rate>192000||region.size%format.align)throw new Error('WAV compatible: PCM de 8/16 bits, mono o estéreo, 4–192 kHz.');
  const count=region.size/format.align;
  if(count>10000000)throw new Error('El WAV supera el límite de 10 millones de muestras.');
  const samples=new Int16Array(count);
  for(let i=0;i<count;i++) {let sum=0;for(let c=0;c<format.channels;c++){const p=region.start+i*format.align+c*format.bits/8;sum+=format.bits===16?view.getInt16(p,true):(view.getUint8(p)-128)*256;}samples[i]=Math.round(sum/format.channels);}
  return {samples,sampleRate:format.rate};
}
export function resample(samples,from,to) {
  if(!Number.isFinite(to)||to<1||to>128000||!Number.isFinite(from)||from<1)throw new Error('Frecuencia inválida.');
  const size=Math.round(samples.length*to/from);if(size>10000000)throw new Error('Audio remuestreado demasiado grande.');
  return Int16Array.from({length:size},(_,i)=> {const x=i*from/to,a=Math.min(samples.length-1,Math.floor(x)),b=Math.min(samples.length-1,a+1);return Math.round(samples[a]*(1-(x-a))+samples[b]*(x-a));});
}
// Filter 0 makes independent blocks, preserving fixed allocation and providing
// deterministic quantization. It sacrifices compression quality, never memory safety.
export function encodeBrr(samples,capacity) {
  if(!Number.isInteger(capacity)||capacity<9||capacity%9||samples.length<1||samples.length>capacity/9*16)throw new Error(`El audio supera la capacidad de ${capacity/9*16} muestras.`);
  const bytes=new Uint8Array(capacity);
  for(let block=0;block<capacity/9;block++) {
    const input=Array.from({length:16},(_,i)=>samples[block*16+i]||0);let best;
    for(let shift=1;shift<=12;shift++) {
      const step=2**shift,nibbles=input.map(v=>Math.max(-8,Math.min(7,Math.round(v/step))));
      const error=nibbles.reduce((sum,v,i)=>sum+(input[i]-v*step)**2,0);
      if(!best||error<best.error)best={shift,nibbles,error};
    }
    bytes[block*9]=best.shift<<4;
    for(let i=0;i<8;i++)bytes[block*9+1+i]=((best.nibbles[i*2]&15)<<4)|(best.nibbles[i*2+1]&15);
  }
  bytes[capacity-9]|=1;decodeBrr(bytes);return bytes;
}
export function replacementAudio(rom,sample,wav,pitch) {
  const region=audioRegion(rom,sample);if(region.reason)throw new Error(region.reason);
  const rate=pitchRate(pitch),count=Math.round(wav.samples.length*rate/wav.sampleRate);
  if(count>region.capacity/9*16)throw new Error(`Duración máxima a este pitch: ${(region.capacity/9*16/rate).toFixed(3)} s. Elige un WAV más corto.`);
  const samples=resample(wav.samples,wav.sampleRate,rate),bytes=encodeBrr(samples,region.capacity);
  return {patch:{id:`audio:${region.offset}`,label:`Audio · ${sample.name}`,offset:region.offset,bytes},samples:decodeBrr(bytes),rate};
}
