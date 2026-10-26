// Both artifacts are deterministic views of one saved source. Markdown is memory, never authority.
import {readFile,readdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {foundationTemplates,templateHash} from './foundation-templates.mjs';
const hash=body=>createHash('sha256').update(body).digest('hex');
const lists=['variables','textStyles','effectStyles','gridStyles'];
const prefix='// Generated from the saved Builder foundation. Do not edit.\nexport const foundation = ';
const suffix=';\nexport default foundation;\n';
export const foundationPackFiles=['manifest.json','package.json',...foundationTemplates.flatMap(t=>[t.name+'.js',t.name+'.md'])].map(file=>'foundations/'+file);
function subset(draft,plan,id){
 const scope=plan.domains[id],names=new Set(scope.variables||[]),vars=new Map(draft.variables.map(v=>[v.name,v]));
 const styles=new Set(scope.styles||[]),result={collections:[],variables:[],textStyles:[],effectStyles:[],gridStyles:[]};
 function include(name){if(names.has(name)&&result.variables.some(v=>v.name===name))return;const v=vars.get(name);if(!v)throw new Error('Missing foundation dependency '+name);names.add(name);if(result.variables.some(v=>v.name===name))return;result.variables.push(v);for(const value of Object.values(v.values))if(value?.alias)include(value.alias);}
 for(const name of names)include(name);
 for(const list of ['textStyles','effectStyles','gridStyles'])for(const style of draft[list]||[])if(styles.has(style.name)){
  result[list].push(style);for(const ref of Object.values(style.bound||{}))include(ref);for(const effect of style.effects||[])if(effect.color?.alias)include(effect.color.alias);
 }
 const cols=new Set(result.variables.map(v=>v.collection));result.collections=draft.collections.filter(c=>cols.has(c.name));
 return result;
}
function table(rows){return rows.map(row=>'| '+row.map(x=>String(x??'').replaceAll('|','\\|').replaceAll('\n',' ')).join(' | ')+' |').join('\n');}
const code=value=>'\n    '+JSON.stringify(value,null,2).replaceAll('\n','\n    ')+'\n';
const decisionKeys={color:/color|colour|palette|contrast|brand/,typography:/font|type|weight|tracking/,space:/spac|density|grid|layout/,shape:/radius|corner|shape|border/,elevation:/shadow|elevation|depth|focus/,motion:/motion|animation|timing|easing/};
function inputNotes(scope){
 const input=structuredClone(scope.inputs||scope.recipe||scope);
 for(const key of ['extra'])if(input[key])input[key]=Object.fromEntries(Object.entries(input[key]).map(([kind,rows])=>[kind,rows.map(row=>row.name)]));
 if(input.styles)input.styles=input.styles.map(s=>({name:s.name,layers:s.effects?.length}));
 const lines=Object.entries(input).map(([key,value])=>'- '+key+': '+JSON.stringify(value));
 const text=lines.join('\n');return text.length>2500?text.slice(0,2500)+'\n…Full parsed inputs remain in the source decision file linked below.':text||'Premade defaults; no source exceptions.';
}
function styleNote(s){
 if(s.fontFamily)return `${s.fontFamily} / ${s.fontStyle||'Regular'} · ${s.fontSize}px / ${JSON.stringify(s.lineHeight)}`;
 if(s.effects)return s.effects.map(e=>`${e.type}: offset ${e.offset?.x??e.x??0},${e.offset?.y??e.y??0}; blur ${e.radius??e.blur??0}; spread ${e.spread??0}; color ${e.color?.alias||JSON.stringify(e.color)}`).join('; ');
 return `${s.grids?.length||0} saved grids`;
}
export function createFoundationPack({draft,plan,decision,request}){
 const draftHash=hash(JSON.stringify(draft,null,2)+'\n'),files=[['foundations/package.json','{"type":"module","private":true}\n']],entries=[];
 for(const t of foundationTemplates){
  const scope=plan.domains[t.id],data=scope.status==='included'?subset(draft,plan,t.id):{collections:[],variables:[],textStyles:[],effectStyles:[],gridStyles:[]};
  const payload={format:'ds-create/foundation-module@1',domain:t.id,template:t.name,status:scope.status,inputHash:plan.inputHash,revision:draft.revision,data};
  const js=prefix+JSON.stringify(payload,null,2)+suffix;
  const summary=scope.status==='excluded'?scope.reason:table([['Variable / style','Type','Saved modes / values'],['---','---','---'],...data.variables.filter(v=>v.collection!=='Primitives'&&(scope.variables||[]).includes(v.name)).slice(0,12).map(v=>[v.name,v.type,JSON.stringify(v.values)]),...['textStyles','effectStyles','gridStyles'].flatMap(kind=>data[kind].map(s=>[s.name,kind,styleNote(s)]))]);
  const details=scope.status==='included'?summary+`\n\nComplete definitions and primitive dependencies: ${t.name}.js (${data.variables.length} variables). This note shows up to12 semantic roles; generated defaults are not copied in full.`:summary;
  const slots={project:request.projectName,inputRevision:plan.inputRevision,revision:draft.revision,inputHash:plan.inputHash,draftHash,builder:code({platform:plan.product.platform,modes:request.interfaceDetails?.modes||draft.collections.find(c=>c.name==='Color')?.modes,projectName:request.projectName}),inputs:inputNotes(decision.domains?.[t.id]||scope),decisions:plan.decisions.filter(d=>decisionKeys[t.id].test(d.key)).map(d=>`- ${d.key}: ${d.value} · ${d.decidedBy} · ${d.source}${d.reason?' · '+d.reason:''}`).join('\n'),summary:details,sources:[...new Set(plan.decisions.map(d=>d.source))].map(name=>'- '+name).join('\n')+`\n- Complete decisions: manager/setup-jobs/${request.id||'current-job'}/decisions.json\n- Full decision rationale: reports/init.md`};
  const md=readFileSync(new URL(`./foundation-templates/${t.name}.md`,import.meta.url),'utf8').replace(/\{\{(\w+)\}\}/g,(_,key)=>slots[key]??'');
  files.push(['foundations/'+t.name+'.js',js],['foundations/'+t.name+'.md',md]);
  entries.push({domain:t.id,template:t.name,status:scope.status,files:Object.fromEntries(['js','md'].map(ext=>{const name='foundations/'+t.name+'.'+ext;return [ext,{file:name,sha256:hash(files.find(([f])=>f===name)[1])}];})),counts:Object.fromEntries(lists.map(k=>[k,data[k].length]))});
 }
 const manifest={format:'ds-create/foundation-pack@1',inputHash:plan.inputHash,inputRevision:plan.inputRevision,revision:draft.revision,draftHash,templateHash,entries};
 files.push(['foundations/manifest.json',JSON.stringify(manifest,null,2)+'\n']);return {manifest,files};
}
export async function verifyFoundationPack(outputDir,draft){
 let manifest;
 try{manifest=JSON.parse(await readFile(path.join(outputDir,'foundations/manifest.json'),'utf8'));}catch(e){if(e.code==='ENOENT'){const files=await readdir(path.join(outputDir,'foundations')).catch(error=>{if(error.code==='ENOENT')return [];throw error;});if(files.some(file=>foundationTemplates.some(t=>file===t.name+'.js'||file===t.name+'.md')))throw new Error('Foundation pack manifest is missing; regenerate the paired artifacts.');return {present:false};}throw e;}
 if(manifest.format!=='ds-create/foundation-pack@1'||manifest.draftHash!==hash(JSON.stringify(draft,null,2)+'\n')||manifest.revision!==draft.revision||manifest.entries?.length!==foundationTemplates.length)throw new Error('Foundation pack is stale; regenerate it from the current saved draft.');
 if(await readFile(path.join(outputDir,'foundations/package.json'),'utf8')!=='{"type":"module","private":true}\n')throw new Error('Foundation module metadata changed.');
 const plan=JSON.parse(await readFile(path.join(outputDir,'foundation-plan.json'),'utf8'));
 if(plan.inputHash!==manifest.inputHash||plan.inputRevision!==manifest.inputRevision)throw new Error('Foundation memory belongs to another source revision.');
 for(const t of foundationTemplates){
  const entry=manifest.entries.find(e=>e.domain===t.id);if(entry?.template!==t.name)throw new Error('Foundation pack is incomplete.');
  for(const ext of ['js','md']){
   const name='foundations/'+t.name+'.'+ext,record=entry.files?.[ext];if(record?.file!==name)throw new Error('Invalid foundation artifact path.');
   const body=await readFile(path.join(outputDir,name),'utf8');if(hash(body)!==record.sha256)throw new Error('Foundation artifact changed: '+name);
   if(ext==='js'){
    if(!body.startsWith(prefix)||!body.endsWith(suffix))throw new Error('Use the premade foundation module format.');
    const payload=JSON.parse(body.slice(prefix.length,-suffix.length)),expected=plan.domains[t.id].status==='included'?subset(draft,plan,t.id):{collections:[],variables:[],textStyles:[],effectStyles:[],gridStyles:[]};
    if(payload.format!=='ds-create/foundation-module@1'||payload.template!==t.name||payload.status!==plan.domains[t.id].status||payload.domain!==t.id||payload.inputHash!==plan.inputHash||payload.revision!==draft.revision||JSON.stringify(payload.data)!==JSON.stringify(expected))throw new Error('Foundation module differs from the saved draft: '+name);
   }
  }
 }
 return {present:true,manifest};
}
