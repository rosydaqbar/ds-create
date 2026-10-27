import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import * as color from './templates/01-color.js';
import * as typography from './templates/02-typography.js';
import * as space from './templates/03-spacing.js';
import * as shape from './templates/04-radius.js';
import * as elevation from './templates/05-shadow.js';
import * as motion from './templates/06-motion.js';
export const foundationTemplates=[color,typography,space,shape,elevation,motion];
export const templateHash=createHash('sha256').update(foundationTemplates.map(t=>['js','md'].map(ext=>readFileSync(new URL(`./templates/${t.name}.${ext}`,import.meta.url),'utf8')).join('\n')).join('\n')).digest('hex');
export const templateFor=id=>{const t=foundationTemplates.find(t=>t.id===id);if(!t)throw new Error('Unknown foundation template: '+id);return t;};
export function resolveTemplateDecisions(raw){
 const decision=structuredClone(raw);
 for(const [id,scope]of Object.entries(decision.domains||{})){
  if(!scope||scope.status!=='included'||scope.template===undefined&&scope.inputs===undefined)continue;
  const t=templateFor(id);
  if(scope.template!==t.name||Object.keys(scope).some(k=>!['status','template','inputs','names'].includes(k))||!scope.inputs||typeof scope.inputs!=='object'||Array.isArray(scope.inputs)||Object.keys(scope.inputs).some(k=>!t.fields.includes(k)))throw new Error('Use '+t.name+' with its declared input fields only; do not mix inputs and recipe.');
  decision.domains[id]={status:'included',...(scope.names?{names:scope.names}:{}),recipe:{...structuredClone(t.defaults),...scope.inputs}};
 }
 return decision;
}
export function templateCatalog(){return foundationTemplates.map(t=>({id:t.id,template:t.name,inputs:t.fields,defaults:t.defaults,memory:`kit/manager/foundations/templates/${t.name}.md`}));}

export async function seedFoundationInputs(request,pack,jobDir){
 const platform=pack.locked?.platform||null;
 const seed={format:'ds-create/foundation-decisions@1',inputHash:request.inputHash,inputRevision:request.inputRevision,product:{name:null,description:null,platform},systemMode:null,naming:null,coverage:pack.sources.map(s=>({path:s.path,hash:s.hash,status:null})),decisions:[],domains:Object.fromEntries(foundationTemplates.map(t=>[t.id,{status:'included',template:t.name,inputs:structuredClone(t.defaults)}]))};
 await writeFile(path.join(jobDir,'foundation-inputs.json'),JSON.stringify(seed,null,2)+'\n',{flag:'wx'});
 await writeFile(path.join(jobDir,'template-catalog.json'),JSON.stringify({format:'ds-create/foundation-template-catalog@1',templateHash,templates:templateCatalog()},null,2)+'\n',{flag:'wx'});
}
