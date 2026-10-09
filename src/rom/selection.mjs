import {hasCustomGroups,readGroups,groupPages,groupColumns} from './groups.mjs';
import {loRom} from './binary.mjs';

// CODE_85A534 initializes the number of selection pages. Both LDX
// operands must change: the second is reached after the cartridge unlock code.
export const SELECTION_RULES=[['selection:all-stars',loRom(0x85a566),15]];
const MODES={original:[6,7],visible:[7,7],hidden:[6,6]};
export function allStarsMode(rom){
  const offset=SELECTION_RULES[0][1];
  if(hasCustomGroups(rom))return 'groups';
  for(const [mode,counts] of Object.entries(MODES))if(rom[offset+1]===counts[0]&&rom[offset+13]===counts[1])return mode;
  throw new Error('Código de selección de equipos no compatible.');
}
export function validateSelection(rom,original){
  const offset=SELECTION_RULES[0][1];
  allStarsMode(rom);
  if(hasCustomGroups(rom)){const n=groupPages(readGroups(rom),groupColumns(rom)).length;if(rom[offset+1]!==n||rom[offset+13]!==n)throw new Error('Código de selección de equipos no compatible.');}
  for(let i=0;i<15;i++)if(i!==1&&i!==13&&rom[offset+i]!==original[offset+i])throw new Error('Código de selección de equipos no compatible.');
  // Do not patch a different ROM revision or an expanded selector as stock.
  if(rom[offset]!==0xa2||rom[offset+12]!==0xa2||rom[offset+2]!==0||rom[offset+14]!==0)throw new Error('Código de selección de equipos no compatible.');
}
export function allStarsPatch(original,mode){
  if(!Object.hasOwn(MODES,mode))throw new Error('Configuración de ALL STARS inválida.');
  validateSelection(original,original);
  const [id,offset,size]=SELECTION_RULES[0],bytes=original.slice(offset,offset+size);
  const counts=mode==='original'?[original[offset+1],original[offset+13]]:MODES[mode];
  bytes[1]=counts[0];bytes[13]=counts[1];
  return {id,offset,bytes,label:'Visibilidad de ALL STARS'};
}
