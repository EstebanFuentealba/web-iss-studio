import {word,loRom} from './binary.mjs';
// CODE_8AA5A3 loads DATA_87F113 and calls CODE_858DA4 with $061A:
// six rows of 26 glyphs using tables/fonts/SmallMenuText.txt.
export const SCENARIO_TEXT_COLUMNS=26;
export const SCENARIO_TEXT_ROWS=6;
const TABLE=loRom(0x87f113),BASE=loRom(0x87f12d),SIZE=SCENARIO_TEXT_COLUMNS*SCENARIO_TEXT_ROWS;
export const SCENARIO_TEXT_RULES=Array.from({length:12},(_,i)=>[`scenario-text:${i}`,BASE+i*SIZE,SIZE]);
const characters=' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-!%.abcdefghijklmnopqrstuvwxyz()';
const glyphs=new Map(Array.from(characters,(c,i)=>[c,i]));
for(const [c,id] of [['+',0x47],['=',0x48],['<',0x49],['>',0x4a],['$',0x4b],['?',0x4c],['*',0x4d],['#',0x4e],['~',0x4f],["'",0x50],['/',0x51],[',',0x52]])glyphs.set(c,id);
const letters=new Map([...glyphs].map(([c,id])=>[id,c]));
// Original scenario 3 uses tile $80 ($54) as a space. Preserve it in place.
letters.set(0x54,' ');
function ruleFor(rom,index){
  if(!Number.isInteger(index)||index<0||index>=12)throw new Error('Escenario inválido.');
  const rule=SCENARIO_TEXT_RULES[index];
  if(word(rom,TABLE+index*2)!==(0xf12d+index*SIZE)||rule[1]+SIZE>rom.length)throw new Error('Tabla de descripciones no compatible.');
  return rule;
}
export function readScenarioDescription(rom,index){
  const [id,offset]=ruleFor(rom,index),bytes=rom.slice(offset,offset+SIZE),lines=[];
  for(let row=0;row<SCENARIO_TEXT_ROWS;row++)lines.push(Array.from(bytes.slice(row*26,(row+1)*26),b=>letters.get(b)??'�').join('').trimEnd());
  while(lines.length&&lines.at(-1)==='')lines.pop();
  return {id,offset,bytes,text:lines.join('\n')};
}
export function scenarioDescriptionLines(text){
  if(typeof text!=='string')throw new Error('Descripción de escenario inválida.');
  const lines=text.replace(/\r\n?/g,'\n').split('\n');
  if(lines.length>6||lines.some(line=>line.length>26))throw new Error('La descripción admite 6 líneas de hasta 26 caracteres.');
  if(Array.from(lines.join('')).some(c=>!glyphs.has(c)))throw new Error('Usa letras A–Z y a–z sin tildes, números, espacios y puntuación compatible.');
  return Array.from({length:6},(_,i)=>(lines[i]||'').padEnd(26,' '));
}
export function scenarioDescriptionPatch(rom,index,text){
  const current=readScenarioDescription(rom,index),lines=scenarioDescriptionLines(text);
  const bytes=Uint8Array.from(Array.from(lines.join(''),(c,i)=>letters.get(current.bytes[i])===c?current.bytes[i]:glyphs.get(c)));
  return {id:current.id,offset:current.offset,bytes,label:`Descripción SCENARIO ${index+1}`};
}
export function validateScenarioDescription(bytes,original){
  if(bytes.length!==SIZE||Array.from(bytes).some((b,i)=>!letters.has(b)||(b===0x54&&b!==original[i])))throw new Error('Descripción de escenario inválida.');
}
