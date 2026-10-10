import {SCENARIO_SUMMARY_RULES,scenarioSummaryPatch,validateScenarioSummary} from './scenario-summary.mjs';
import {hasExtraTeams,teamCount,teamPointer,teamTable,attributeOffset} from './team-count.mjs';
import {EXTRA_TEAM_RULES,extraTeamResources,addTeamPatches,validateExtraTeams,upgradeExtraTeamSelector} from './extra-teams.mjs';
import {SCENARIO_TEXT_RULES,validateScenarioDescription} from './scenario-text.mjs';
import {SCENARIO_RULES,validateScenarioBytes,SCENARIO_DIFFICULTY_RULES,validateScenarioDifficulty} from './scenarios.mjs';
import {BOOT_SCREEN_RULES,validateBootScreens} from './boot-screens.mjs';
import {MAIN_MENU_RULES,validateMainMenu} from './main-menu.mjs';
import {GROUP_EDITOR_RULES,validateGroupEditor,upgradeGroupSelector} from './groups.mjs';
import {GROUP_TEXT_RULES,validateGroupTexts} from './group-text.mjs';
import {SELECTION_RULES,validateSelection} from './selection.mjs';
import { openRom, word, loRom, decompress } from './binary.mjs';
import { TITLE_LEGAL_RULES, validateTitleLegal, legacyTitleLegal, titleLegalResources, titleLegalPatches } from './title-legal.mjs';
import { playerOffsets, playerPatches } from './players.mjs';
import { deluxeAttributes, deluxeText, readDeluxeTeam } from './deluxe.mjs';
import { GROUP_RULES,validateGroupStorage,graphicResources, FLAG_RULES, validateFlagStorage, flagBank, LABEL_RULES, labelBank, validateSmallLabelStorage, flagPatches, flagMatrix, smallLabelPatches, smallLabelMatrix } from './graphics.mjs';
import { AUDIO_SAMPLES, decodeBrr } from './audio.mjs';
import { readFormation } from './formations.mjs';
import { audioRegion } from './audio-edit.mjs';
import {BIG_LABEL_ADDRESS,BIG_LABEL_ID,validateLabelLayout,bigTeamNamePatches,teamNameTexts,CZECH_FONT_ADDRESS,validateCzechFont} from './team-labels.mjs';
const internals=new WeakMap();
const copyPatch=p=>({...p,bytes:Uint8Array.from(p.bytes)});
const equal=(a,b)=>a.length===b.length && a.every((byte,i)=>byte===b[i]);
const base64=bytes=> {let text='';for(let i=0;i<bytes.length;i+=8192) text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);};
const unbase64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
export async function romHash(bytes) {
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
function allowedResources(rom) {
  const registry=new Map();
  const add=(id,offset,size,type,extra={})=>registry.set(id,{offset,size,type,...extra});
  for(let team=0;team<teamCount(rom);team++) {
    const formation=readFormation(rom,team);add(formation.id,formation.offset,31,'formation');
    for(let i=0;i<20;i++) {
      const p=playerOffsets(rom,team,i);
      add(`name:${p.name}`,p.name,8,'name');add(`attributes:${p.attributes}`,p.attributes,7,'attributes');
    }
    for(const [table,count] of [[0x1027a,16],[0x102d0,16],[0x10326,11],[0x1037c,5],[0x103d2,1],[0xe7d8,4]]) {
      const pointer=teamPointer(rom,table,team);if(!pointer)continue;
      const offset=loRom(0x890000|pointer)+2;
      for(let i=0;i<count;i++) add(`palette:${offset+i*2}`,offset+i*2,2,'palette');
    }
    for(const resource of graphicResources(rom,team).filter(r=>r.parts))for(const part of resource.parts)add(part.id,part.offset,part.capacity,part.compressed?'compressed':'raw',{decodedSize:part.decodedSize});
    for(const [table,bank,parts] of [[0xe730,flagBank(rom)<<16,2],[0xe6c1,labelBank(rom)<<16,1]]) for(let part=0;part<parts;part++) {
      const offset=loRom(bank|word(rom,teamTable(rom,table)+team*parts*2+part*2));
      add(`graphic:${offset}`,offset,word(rom,offset)&0x7fff,'compressed',{decodedSize:decompress(rom,offset).length});
    }
  }
  for(const resource of graphicResources(rom,0)) if(resource.shared || resource.label.includes('portada')) for(const part of resource.parts||[resource]) add(part.id,part.offset,part.capacity,part.compressed?'compressed':'raw',{decodedSize:part.decodedSize});
  for(const [id,offset,size] of [...FLAG_RULES,...LABEL_RULES,...SELECTION_RULES,...GROUP_RULES,...GROUP_TEXT_RULES,...GROUP_EDITOR_RULES,...TITLE_LEGAL_RULES,...MAIN_MENU_RULES,...BOOT_SCREEN_RULES,...EXTRA_TEAM_RULES])add(id,offset,size,'relocated-storage');
  for(const [id,offset,size,type] of extraTeamResources())add(id,offset,size,type);
  add(`czech-font:${loRom(CZECH_FONT_ADDRESS)}`,loRom(CZECH_FONT_ADDRESS),word(rom,loRom(CZECH_FONT_ADDRESS))&0x7fff,'czech-font');
  add(BIG_LABEL_ID,loRom(BIG_LABEL_ADDRESS),word(rom,loRom(BIG_LABEL_ADDRESS))&0x7fff,'team-labels');
  // Keep previously saved atlas/goalie projects readable after composing the UI.
  for(const [address,size] of [[0x98c5d4,8192],[0x8cfb57,256],[0x8cfc59,256]]){const offset=loRom(address);add(`graphic:${offset}`,offset,size,'raw');}
  for(const sample of AUDIO_SAMPLES) {
    const region=audioRegion(rom,sample);
    if(!region.reason) add(`audio:${region.offset}`,region.offset,region.capacity,region.segmented?'segmented-audio':'audio');
  }
  for(const [id,offset,size] of SCENARIO_DIFFICULTY_RULES)add(id,offset,size,'scenario-difficulty');
  for(const [id,offset,size] of SCENARIO_RULES)add(id,offset,size,'scenario');
  for(const [id,offset,size] of SCENARIO_TEXT_RULES)add(id,offset,size,'scenario-text');
  for(const [id,offset,size] of SCENARIO_SUMMARY_RULES)add(id,offset,size,'scenario-summary');
  return registry;
}
export class RomProject {
  constructor(input) {
    const bytes=Uint8Array.from(input),session=openRom(bytes);
    if(session.game!=='issd') throw new Error('La edición binaria está disponible para ISS Deluxe USA.');
    validateExtraTeams(session.rom,session.rom);
    internals.set(this,{original:session.rom,header:bytes.slice(0,session.headerSize),registry:allowedResources(session.rom),patches:new Map(),undo:[],redo:[]});
    this.hash='';this.updatedAt=null;
  }
  get original() {return internals.get(this).original.slice();}
  get patches() {return Array.from(internals.get(this).patches.values(),copyPatch);}
  get canUndo() {return !!internals.get(this).undo.length;}
  get canRedo() {return !!internals.get(this).redo.length;}
  get headerSize() {return internals.get(this).header.length;}
  validate(patches) {
    const {original,registry}=internals.get(this),used=[];
    for(const patch of patches) {
      const rule=registry.get(patch.id);
      if(!rule || patch.offset!==rule.offset || !(patch.bytes instanceof Uint8Array) || patch.bytes.length!==rule.size || patch.offset<0 || patch.offset+patch.bytes.length>original.length) throw new Error(`Recurso o tamaño no permitido: ${patch.id}.`);
      const overlap=used.find(p=>patch.offset<p.offset+p.bytes.length && p.offset<patch.offset+patch.bytes.length);
      if(overlap) throw new Error(`Conflicto entre ${patch.id} y ${overlap.id}.`);
      used.push(patch);
      if(rule.type==='scenario-difficulty')validateScenarioDifficulty(patch.bytes);
      if(rule.type==='scenario-summary')validateScenarioSummary(patch.bytes);
      if(rule.type==='scenario-text')validateScenarioDescription(patch.bytes,original.slice(rule.offset,rule.offset+rule.size));
      if(rule.type==='scenario')validateScenarioBytes(patch.bytes,original.slice(rule.offset,rule.offset+rule.size));
      if(rule.type==='name' && (deluxeText(patch.bytes).includes('�')||!deluxeText(patch.bytes))) throw new Error('Nombre con codificación inválida.');
      if(rule.type==='attributes') {
        const p=deluxeAttributes(patch.bytes);
        if(p.no<1||p.no>20||p.position<1||p.position>6||p.hair>13||p.skin>1||Object.entries(p).some(([k,v])=>!['no','position','hair','skin'].includes(k)&&v>10)) throw new Error('Atributos fuera del rango del juego.');
      }
      if(rule.type==='formation') {
        const originalFormations=Array.from({length:42},(_,i)=>readFormation(original,i).bytes);
        if(!originalFormations.some(bytes=>equal(bytes,patch.bytes))) throw new Error('Solo se permiten formaciones originales verificadas.');
      }
      if(rule.type==='palette' && patch.bytes[1]&0x80) throw new Error('Paleta BGR555 inválida.');
      if(rule.type==='compressed' && decompress(patch.bytes,0).length!==rule.decodedSize) throw new Error('Resolución gráfica inválida.');
      if(rule.type==='czech-font')validateCzechFont(patch.bytes,original);
      if(patch.id==='teams:big-labels')validateLabelLayout(decompress(patch.bytes,0),original);
      if(rule.type==='team-labels')validateLabelLayout(decompress(patch.bytes,0),original);
      if(rule.type==='segmented-audio') {
        for(let i=0;i<patch.bytes.length;i+=9)if((patch.bytes[i]&3)!==(original[patch.offset+i]&3))throw new Error('Marcas BRR de los fragmentos alteradas.');
        decodeBrr(patch.bytes,true);
      }
      if(rule.type==='audio') {decodeBrr(patch.bytes);if(Array.from({length:patch.bytes.length/9},(_,i)=>patch.bytes[i*9]).some((h,i)=>(h&2)||(i<patch.bytes.length/9-1 && (h&1))) || !(patch.bytes.at(-9)&1)) throw new Error('Final BRR inválido.');}
    }
  }
  transaction(changes) {
    const s=internals.get(this),next=new Map(s.patches);
    this.validate(changes.map(copyPatch));
    if(changes.some(p=>p.id==='teams:metadata')&&!hasExtraTeams(s.original)){for(const id of ['labels:pool','labels:pointers','labels:select-loader','flags:pool','flags:pointers','flags:select-map'])next.delete(id);}
    for(const change of changes) {
      const p=copyPatch(change);
      const legacy=p.id.startsWith('detail:')&&next.get(`graphic:${loRom(0x98c5d4)}`);
      if(legacy&&p.offset>=legacy.offset&&p.offset+p.bytes.length<=legacy.offset+legacy.bytes.length){const merged=copyPatch(legacy);merged.bytes.set(p.bytes,p.offset-merged.offset);if(equal(merged.bytes,s.original.slice(merged.offset,merged.offset+merged.bytes.length)))next.delete(merged.id);else next.set(merged.id,merged);next.delete(p.id);continue;}
      if(equal(p.bytes,s.original.slice(p.offset,p.offset+p.bytes.length))) next.delete(p.id);else next.set(p.id,p);
    }
    this.validate([...next.values()]);
    const candidate=s.original.slice();for(const patch of next.values())candidate.set(patch.bytes,patch.offset);
    // The selector labels are literal strings, separate from match data.
    // Include their updates in the same history entry, also upgrading older
    // saved projects that only contain scenario condition patches.
    const scenarioIndexes=new Set(changes.filter(p=>p.id.startsWith('scenario:')||p.id.startsWith('scenario-summary:')).map(p=>Number(p.id.split(':')[1])));
    for(const index of scenarioIndexes){
      const p=scenarioSummaryPatch(s.original,candidate,index);
      candidate.set(p.bytes,p.offset);
      if(equal(p.bytes,s.original.slice(p.offset,p.offset+p.bytes.length)))next.delete(p.id);else next.set(p.id,p);
    }
    if(scenarioIndexes.size)this.validate([...next.values()]);
    if(changes.some(p=>p.id.startsWith('main-menu:')))validateMainMenu(candidate,s.original);
    if(changes.some(p=>p.id.startsWith('flags:')))validateFlagStorage(candidate,s.original);
    if(changes.some(p=>p.id.startsWith('labels:')))validateSmallLabelStorage(candidate,s.original);
    if(changes.some(p=>p.id.startsWith('title-legal:')))validateTitleLegal(candidate,s.original);
    if(changes.some(p=>p.id.startsWith('boot-')))validateBootScreens(candidate,s.original);
    if(changes.some(p=>p.id.startsWith('group-editor:')||p.id.startsWith('selection:')))validateGroupEditor(candidate,s.original);
    if(changes.some(p=>p.id.startsWith('selection:')))validateSelection(candidate,s.original);
    if(changes.some(p=>p.id.startsWith('groups:')||p.id.startsWith('group-editor:')))validateGroupStorage(candidate,s.original);
    if(changes.some(p=>p.id==='groups:text'))validateGroupTexts(candidate,s.original);
    validateExtraTeams(candidate,s.original);
    for(let team=0;team<teamCount(candidate);team++)if(new Set(Array.from({length:20},(_,i)=>candidate[attributeOffset(candidate,team,i)+5])).size!==20)throw new Error('Los identificadores/dorsales de cada equipo deben ser únicos.');
    if(JSON.stringify([...next])===JSON.stringify([...s.patches])) return false;
    s.undo.push(s.patches);s.undo=s.undo.slice(-100);s.redo=[];s.patches=next;this.updatedAt=new Date().toISOString();return true;
  }
  addTeam(name){return this.transaction(addTeamPatches(this.original,this.bytes(),name));}
  restorePatches(id) {
    const s=internals.get(this),rule=s.registry.get(id);if(!rule)throw new Error('Recurso desconocido.');
    if(id.startsWith('group-editor:')||(id==='selection:all-stars'||id.startsWith('groups:'))&&this.patches.some(p=>p.id.startsWith('group-editor:')))return [...GROUP_EDITOR_RULES,...SELECTION_RULES,...GROUP_RULES,...GROUP_TEXT_RULES].map(([id,offset,size])=>({id,offset,bytes:s.original.slice(offset,offset+size),label:'Restaurar grupos'}));
    if(id.startsWith('main-menu:'))return MAIN_MENU_RULES.map(([id,offset,size])=>({id,offset,bytes:s.original.slice(offset,offset+size),label:'Restaurar menú principal'}));
    if(id.startsWith('title-legal:')&&legacyTitleLegal(s.original)){const notice=titleLegalResources(s.original)[0];return titleLegalPatches(s.original,s.original,notice.id,notice.matrix,notice.text,true);}
    if(id.startsWith('boot-'))return BOOT_SCREEN_RULES.filter(([key])=>key.split(':')[0]===id.split(':')[0]).map(([id,offset,size])=>({id,offset,bytes:s.original.slice(offset,offset+size),label:'Restaurar pantalla inicial'}));
    if(id.startsWith('title-legal:'))return TITLE_LEGAL_RULES.map(([id,offset,size])=>({id,offset,bytes:s.original.slice(offset,offset+size),label:'Textos de portada · gráficos independientes'}));
    if(rule.type==='name'&&!hasExtraTeams(s.original)&&rule.offset>=loRom(0x87fac8)&&rule.offset<loRom(0x87fac8)+960){const i=Math.floor((rule.offset-loRom(0x87fac8))%160/8),source=playerOffsets(s.original,0,i).name;return [{id,offset:rule.offset,bytes:s.original.slice(source,source+8),label:'Restaurar jugador'}];}
    if(rule.type==='formation'&&!hasExtraTeams(s.original)&&rule.offset>=loRom(0x8bfdd0)&&rule.offset<loRom(0x8bfdd0)+186)return [{id,offset:rule.offset,bytes:readFormation(s.original,0).bytes,label:'Restaurar formación'}];
    if(rule.type==='palette'&&!hasExtraTeams(s.original)&&rule.offset>=loRom(0x89fa42)&&rule.offset<loRom(0x89fa42)+768){let p=loRom(0x89fa42)+Math.floor((rule.offset-loRom(0x89fa42))/128)*128;for(const [table,count] of [[0x1027a,16],[0x102d0,16],[0x10326,11],[0x1037c,5],[0x103d2,1],[0xe7d8,4]]){if(rule.offset>=p+2&&rule.offset<p+2+count*2){const pointer=teamPointer(s.original,table,0),source=pointer?loRom(0x890000|pointer)+rule.offset-p:0;return [{id,offset:rule.offset,bytes:pointer?s.original.slice(source,source+2):new Uint8Array(2),label:'Restaurar paleta'}];}p+=2+count*2;}}
    if(rule.type==='attributes') {
      const extra=rule.offset>=loRom(0x8af558)&&rule.offset<loRom(0x8af558)+840;
      const relative=rule.offset-(extra?loRom(0x8af558):0x50000),team=Math.floor(relative/140)+(extra?42:0),index=(relative%140)/7;
      if(extra&&!hasExtraTeams(s.original))return playerPatches(this.bytes(),team,index,deluxeAttributes(s.original.slice(attributeOffset(s.original,0,index),attributeOffset(s.original,0,index)+7)));
      return playerPatches(this.bytes(),team,index,deluxeAttributes(s.original.slice(rule.offset,rule.offset+7)));
    }
    return [{id,offset:rule.offset,bytes:s.original.slice(rule.offset,rule.offset+rule.size),label:id}];
  }
  restore(id) {return this.transaction(this.restorePatches(id));}
  reset() {const s=internals.get(this);if(!s.patches.size)return;s.undo.push(s.patches);s.redo=[];s.patches=new Map();this.updatedAt=new Date().toISOString();}
  undo() {const s=internals.get(this);if(!s.undo.length)return;s.redo.push(s.patches);s.patches=s.undo.pop();this.updatedAt=new Date().toISOString();}
  redo() {const s=internals.get(this);if(!s.redo.length)return;s.undo.push(s.patches);s.patches=s.redo.pop();this.updatedAt=new Date().toISOString();}
  bytes() {const s=internals.get(this),bytes=s.original.slice();this.validate(this.patches);for(const p of s.patches.values()) bytes.set(p.bytes,p.offset);return bytes;}
  exportRom() {
    const s=internals.get(this),rom=this.bytes();
    if(this.patches.some(p=>p.id.startsWith('group-editor:')))validateGroupEditor(rom,s.original);
    if(this.patches.some(p=>p.id.startsWith('title-legal:')))validateTitleLegal(rom,s.original);
    if(this.patches.some(p=>p.id.startsWith('boot-')))validateBootScreens(rom,s.original);
    if(this.patches.some(p=>p.id.startsWith('main-menu:')))validateMainMenu(rom,s.original);
    // The checksum and its complement contribute a constant 510 to the sum.
    if(s.patches.size) {
      rom.set([255,255,0,0],0x7fdc);
      const checksum=rom.reduce((sum,byte)=>(sum+byte)&0xffff,0),complement=checksum^0xffff;
      rom.set([complement&255,complement>>>8,checksum&255,checksum>>>8],0x7fdc);
      openRom(rom);
      validateExtraTeams(rom,s.original);
      for(let team=0;team<teamCount(rom);team++) readDeluxeTeam(rom,team);
    }
    const file=new Uint8Array(s.header.length+rom.length);file.set(s.header);file.set(rom,s.header.length);return file;
  }
  record() {
    const s=internals.get(this);
    return {format:'issd-studio-project',version:1,hash:this.hash,updatedAt:this.updatedAt,original:base64(this.exportOriginal()),patches:this.patches.map(p=>({...p,bytes:base64(p.bytes)}))};
  }
  exportOriginal() {const s=internals.get(this),bytes=new Uint8Array(s.header.length+s.original.length);bytes.set(s.header);bytes.set(s.original,s.header.length);return bytes;}
  static async create(bytes) {const project=new RomProject(bytes);project.hash=await romHash(project.exportOriginal());
    // Repair added-team anchors when opening a ROM exported by an earlier build.
    if(hasExtraTeams(project.original)){
      const current=project.bytes();let changes=[];
      for(let t=42;t<teamCount(current);t++){
        const text=teamNameTexts(project.original,current,t).large;
        if(!text)throw new Error('Rótulo de equipo adicional inválido.');
        changes=bigTeamNamePatches(project.original,current,t,text);
        for(const p of changes)current.set(p.bytes,p.offset);
      }
      if(changes.some(p=>!equal(p.bytes,project.original.slice(p.offset,p.offset+p.bytes.length)))){project.transaction(changes);internals.get(project).undo=[];}
    }

    if(legacyTitleLegal(project.original)){validateTitleLegal(project.original,project.original);const notice=titleLegalResources(project.original)[0];project.transaction(titleLegalPatches(project.original,project.original,notice.id,notice.matrix,notice.text,true));internals.get(project).undo=[];}
    return project;}
  static async import(record) {
    if(record.format!=='issd-studio-project'||record.version!==1||typeof record.original!=='string'||record.original.length>3000000||!Array.isArray(record.patches)||record.patches.length>5000) throw new Error('Proyecto no compatible.');
    const project=await RomProject.create(unbase64(record.original));
    if(project.hash!==record.hash)throw new Error('El hash no coincide con la ROM original del proyecto.');
    const seen=new Set();
    for(const p of record.patches) {if(seen.has(p.id)||typeof p.bytes!=='string')throw new Error('Modificación duplicada o inválida.');seen.add(p.id);}
    let patches=record.patches.map(p=>({...p,bytes:unbase64(p.bytes)}));
    const oldPool=patches.find(p=>p.id==='flags:pool');
    if(oldPool?.bytes.length===72*102){
      const oldRules=FLAG_RULES.slice(0,3).map(([id,offset,size],i)=>[id,offset,i===0?72*102:i===1?144:size]);
      const candidate=project.original;
      for(const [id,offset,size] of oldRules){const patch=patches.find(p=>p.id===id);if(!patch||patch.offset!==offset||patch.bytes.length!==size)throw new Error('Banderas antiguas inválidas.');candidate.set(patch.bytes,offset);}
      if(patches.some(p=>p.id==='flags:match-loader'))throw new Error('Cargador antiguo inesperado.');
      const original=project.original,loader=oldRules[2][1];
      for(let i=0;i<23;i++)if(candidate[loader+i]!==([6,11,16,21].includes(i)?0xaf:original[loader+i]))throw new Error('Cargador antiguo inválido.');
      for(let i=0;i<72;i++){const pointer=word(candidate,0xe730+i*2);if(pointer!==0xbd1e+i*102||(word(candidate,loRom(0xaf0000|pointer))&0x7fff)>102)throw new Error('Puntero antiguo inválido.');}
      const upgraded=flagPatches(original,candidate,0,flagMatrix(candidate,0),true);
      patches=[...patches.filter(p=>!oldRules.some(([id])=>id===p.id)),...upgraded];
    }
    if(patches.some(p=>p.id.startsWith('flags:'))&&!patches.some(p=>p.id==='flags:select-script')){
      project.validate(patches);const candidate=project.original;for(const p of patches)candidate.set(p.bytes,p.offset);
      patches=[...patches.filter(p=>!p.id.startsWith('flags:')),...flagPatches(project.original,candidate,0,flagMatrix(candidate,0))];
    }
    if(patches.some(p=>p.id.startsWith('labels:'))&&!patches.some(p=>p.id==='labels:select-loader')&&!patches.some(p=>p.id==='teams:metadata')){
      project.validate(patches);const candidate=project.original;for(const p of patches)candidate.set(p.bytes,p.offset);
      patches=[...patches.filter(p=>!p.id.startsWith('labels:')),...smallLabelPatches(project.original,candidate,0,smallLabelMatrix(candidate,0))];
    }
    if(patches.some(p=>p.id.startsWith('title-legal:'))){
      project.validate(patches);const candidate=project.original;for(const p of patches)candidate.set(p.bytes,p.offset);
      if(legacyTitleLegal(candidate)){validateTitleLegal(candidate,project.original);const notice=titleLegalResources(candidate)[0];patches=[...patches.filter(p=>!p.id.startsWith('title-legal:')),...titleLegalPatches(project.original,candidate,notice.id,notice.matrix,notice.text,true)];}
    }
    patches=upgradeGroupSelector(project.original,patches);
    patches=upgradeExtraTeamSelector(project.original,patches);
    project.transaction(patches);
    internals.get(project).undo=[];project.updatedAt=record.updatedAt;return project;
  }
}
