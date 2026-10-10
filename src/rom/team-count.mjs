import {loRom,word} from './binary.mjs';

export const MAX_TEAMS=48,TEAM_METADATA=loRom(0xb0fe00);
export function hasExtraTeams(rom){return rom?.[TEAM_METADATA]===84&&rom[TEAM_METADATA+1]===69&&rom[TEAM_METADATA+2]===65&&rom[TEAM_METADATA+3]===77;}
export function teamCount(rom){if(!hasExtraTeams(rom))return 42;const count=rom[TEAM_METADATA+5];if(count<43||count>MAX_TEAMS)throw new Error('Cantidad de equipos inválida.');return count;}
// Native tables have different strides; each relocated table reserves 49
// entries so the Challenge-mode pseudo-team can move from ID 42 to ID 48.
export const TEAM_TABLES={
  0xce8a:0xb0c400,0xe6c1:0xb0c462,0xe730:0xb0c4c4,0xe7d8:0xb0c588,
  0x1027a:0xb0c5ea,0x102d0:0xb0c64c,0x10326:0xb0c6ae,0x1037c:0xb0c710,
  0x103d2:0xb0c772,0x1042e:0xb0c7d4,0x10459:0xb0c806,
  0x104af:0xb0c868,0x1759a:0xb0c89a,0x17829:0xb0c8fc,
  0x38138:0xb0c95e,0x5ef48:0xb0c9c0,
};
export function teamTable(rom,table){return hasExtraTeams(rom)&&TEAM_TABLES[table]?loRom(TEAM_TABLES[table]):table;}
export function teamPointer(rom,table,team,stride=2){return word(rom,teamTable(rom,table)+(hasExtraTeams(rom)||team<42?team:0)*stride);}
export function attributeOffset(rom,team,player=0){return (team>=42&&hasExtraTeams(rom)?loRom(0x8af558)+(team-42)*140:0x50000+(team>=42?0:team)*140)+player*7;}
export const EXTRA_BIG_LABEL_ADDRESS=0xb0f080,EXTRA_BIG_LABEL_CAPACITY=3000;
