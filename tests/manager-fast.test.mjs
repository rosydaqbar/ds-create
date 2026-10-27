import test from 'node:test';
import assert from 'node:assert/strict';
import {compileFoundationCalls} from '../kit/manager/foundations/publish.mjs';

const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
function mockFigma({rejectFonts=false,rejectLoads=false,normalizedEffects=false}={}){
 const collections=[],variables=[],text=[],effects=[],grids=[],fontLoads=[],fontAssignments=[],loaded=new Set();let seq=0;
 const id=()=>String(++seq),createStyle=list=>{const s={id:id(),name:'',boundVariables:{},setBoundVariable(k,v){this.boundVariables[k]={type:'VARIABLE_ALIAS',id:v.id};},remove(){list.splice(list.indexOf(this),1);}};list.push(s);return s;};
 return {collections,variableRecords:variables,text,effects,grids,fontLoads,fontAssignments,
  listAvailableFontsAsync:async()=>[],loadFontAsync:async f=>{fontLoads.push(f);if(rejectLoads)throw new Error('Requested face cannot be resolved');loaded.add(JSON.stringify(f));},
  getLocalTextStylesAsync:async()=>text,getLocalEffectStylesAsync:async()=>effects,getLocalGridStylesAsync:async()=>grids,
  createTextStyle(){const s=createStyle(text);let font;
   Object.defineProperty(s,'fontName',{get:()=>font,set:v=>{fontAssignments.push(v);if(!loaded.has(JSON.stringify(v)))throw new Error('Cannot use unloaded font');if(rejectFonts)throw new Error('Font unavailable in this tool');font=v;},enumerable:true});return s;},
  createEffectStyle(){const s=createStyle(effects);if(normalizedEffects){let saved=[];Object.defineProperty(s,'effects',{get:()=>saved.map(e=>{const item=structuredClone(e);if(item.boundVariables?.color)item.color={r:0,g:0,b:0,a:1};if(item.radius===0)delete item.radius;if(item.visible===true)delete item.visible;if(item.blendMode==='NORMAL')delete item.blendMode;return Object.create(item);}),set:items=>{saved=structuredClone(items);},enumerable:true});}return s;},createGridStyle:()=>createStyle(grids),
  variables:{getLocalVariableCollectionsAsync:async()=>collections,getLocalVariablesAsync:async()=>variables,
   createVariableCollection(name){const c={id:id(),name,modes:[{modeId:id(),name:'Mode 1'}],renameMode(id,name){this.modes.find(m=>m.modeId===id).name=name;},addMode(name){const m={modeId:id(),name};this.modes.push(m);return m.modeId;}};collections.push(c);return c;},
   createVariable(name,c,type){const v={id:id(),name,variableCollectionId:c.id,resolvedType:type,scopes:[],description:'',codeSyntax:{},hiddenFromPublishing:false,valuesByMode:{},setValueForMode(m,x){this.valuesByMode[m]=x;},setVariableCodeSyntax(k,x){this.codeSyntax[k]=x;}};variables.push(v);return v;},
   setBoundVariableForEffect:(effect,key,v)=>({...effect,boundVariables:{[key]:{type:'VARIABLE_ALIAS',id:v.id}}})}
 };
}
const draft=()=>({collections:[{name:'Primitives',modes:['Value']},{name:'Color',modes:['Light','Dark']}],variables:[
 {name:'color/surface/base',collection:'Color',type:'COLOR',values:{Light:{alias:'palette/base/white'},Dark:{alias:'palette/base/white'}},description:'Surface',scopes:['FRAME_FILL'],codeSyntax:{WEB:'var(--color-surface-base)'}},
 {name:'palette/base/white',collection:'Primitives',type:'COLOR',values:{Value:'#fff'},scopes:[],hiddenFromPublishing:true},
 {name:'font/family/ui',collection:'Primitives',type:'STRING',values:{Value:'Local Font'}}],
 effectStyles:[{name:'focus/default',effects:[{type:'DROP_SHADOW',spread:2,blur:0,color:{alias:'color/surface/base'}}]}],
 textStyles:[0,1,2].map(n=>({name:'type/body/'+n,fontFamily:'Local Font',fontStyle:'Regular',fontSize:16,lineHeight:24,bound:{fontFamily:'font/family/ui'}}))});
async function execute(figma,calls){const returns=[];for(const call of calls)returns.push(await new AsyncFunction('figma',call.code)(figma));return returns;}
test('FAST executes approved data: aliases across modes, style bindings, exact names and idempotent resume',async()=>{
 const f=mockFigma(),calls=compileFoundationCalls(draft()),results=await execute(f,calls);
 assert.equal(calls.length,3);assert.equal(f.variableRecords.length,3);assert.equal(f.effects.length,1);assert.equal(f.text.length,3);
 const semantic=f.variableRecords.find(v=>v.name==='color/surface/base'),primitive=f.variableRecords.find(v=>v.name==='palette/base/white');
 assert.ok(Object.values(semantic.valuesByMode).every(v=>v.type==='VARIABLE_ALIAS'&&v.id===primitive.id));
 assert.deepEqual(f.text[0].fontName,{family:'Local Font',style:'Regular'});assert.deepEqual(f.fontLoads,[{family:'Local Font',style:'Regular'}],'the exact unlisted face is loaded once before assignment');
 assert.equal(f.effects[0].effects[0].boundVariables.color.id,semantic.id);
 const repeated=await execute(f,calls);assert.ok(repeated.every(r=>r.createdVariableIds.length===0&&r.createdStyleIds.length===0&&r.createdCollectionIds.length===0));assert.ok(results.every(r=>r.errors.length===0));
});
test('an unlisted face load failure is attempted once and never causes a substitution or repeated style writes',async()=>{
 const f=mockFigma({rejectLoads:true}),result=(await execute(f,compileFoundationCalls(draft()))).at(-1);
 assert.equal(f.fontLoads.length,1);assert.equal(f.fontAssignments.length,0);assert.equal(result.errors.length,1);assert.equal(result.errors[0].styles.length,3);assert.equal(f.text.length,0);assert.equal(f.effects.length,1);
});
test('effect verification uses exact binding/geometry and canonical defaults across mode snapshots and API getters',async()=>{
 const f=mockFigma({normalizedEffects:true}),calls=compileFoundationCalls(draft()),result=await execute(f,calls);
 assert.equal(result.at(-1).errors.length,0);assert.equal(f.effects.length,1);assert.equal(f.effects[0].effects[0].color.r,0,'cached RGBA differs but the exact semantic binding remains');
 assert.ok((await execute(f,calls)).every(r=>r.errors.length===0),'normalized readback is idempotent');
 const variable=f.variableRecords.find(v=>v.name==='color/surface/base');
 const effect={type:'DROP_SHADOW',offset:{x:0,y:0},radius:0,spread:9,color:{r:1,g:1,b:1,a:1},boundVariables:{color:{type:'VARIABLE_ALIAS',id:variable.id}}};
 f.effects[0].effects=[effect];let failed=(await execute(f,calls)).at(-1);assert.match(failed.errors[0].message,/Existing style conflicts/);assert.equal(f.effects.length,1);
 f.effects[0].effects=[{...effect,spread:2,boundVariables:{color:{type:'VARIABLE_ALIAS',id:'wrong-id'}}}];failed=(await execute(f,calls)).at(-1);assert.match(failed.errors[0].message,/Existing style conflicts/);
 const unsupported=draft();unsupported.effectStyles[0].effects[0].opacity=0.5;assert.throws(()=>compileFoundationCalls(unsupported),/opacity multiplier/);
});
test('a font assignment failure is tried once per face, preserves independent effects/variables and cleans only its own failed style',async()=>{
 const f=mockFigma({rejectFonts:true}),results=await execute(f,compileFoundationCalls(draft()));
 const final=results.at(-1);assert.equal(f.variableRecords.length,3);assert.equal(f.effects.length,1);assert.equal(f.text.length,0);assert.equal(final.errors.length,1);assert.equal(final.errors[0].styles.length,3);
 assert.deepEqual(final.createdStyleIds,[f.effects[0].id]);
 assert.equal(f.fontAssignments.length,1,'one actual failed assignment for the shared face, not three');
});
test('FAST refuses conflicting frozen definitions without overwriting them',async()=>{
 const f=mockFigma(),calls=compileFoundationCalls(draft());await execute(f,calls);
 const v=f.variableRecords.find(v=>v.name==='palette/base/white'),mode=Object.keys(v.valuesByMode)[0];v.valuesByMode[mode]={r:0,g:0,b:0,a:1};
 await assert.rejects(()=>execute(f,calls),/Existing variable conflicts/);assert.deepEqual(v.valuesByMode[mode],{r:0,g:0,b:0,a:1});
});
test('batches respect transport size, topological ordering and literal data; unsupported metadata is explicit',async()=>{
 const d=draft();d.variables.push(...Array.from({length:70},(_,i)=>({name:'message/'+i,collection:'Primitives',type:'STRING',values:{Value:'literal ` ${notCode} '+String(i)+'x'.repeat(700)}})));
 const calls=compileFoundationCalls(d,{maxChars:20000});assert.ok(calls.length>3);assert.ok(calls.every(c=>c.code.length<=20000));
 const f=mockFigma();await execute(f,calls);assert.equal(f.variableRecords.length,73);assert.match(f.variableRecords.find(v=>v.name==='message/1').valuesByMode[Object.keys(f.variableRecords.find(v=>v.name==='message/1').valuesByMode)[0]],/literal ` \$\{notCode\}/);
 d.effectStyles[0].effects[0].unsupported='retain me';assert.throws(()=>compileFoundationCalls(d),/effect metadata/);delete d.effectStyles[0].effects[0].unsupported;
 d.variables[0].unsupported='retain me';assert.throws(()=>compileFoundationCalls(d),/does not support/);
});

test('native motion survives compiled Figma writes, full export and readback without changing published types',async()=>{
 const {compileDomain}=await import('../kit/manager/foundations/compiler.mjs');
 const {compareFoundations}=await import('../kit/manager/foundations/compare.mjs');
 const {readFile}=await import('node:fs/promises');
 const data=compileDomain('motion',{}, {platform:'Web',modes:['Light'],dependencies:{}});
 const f=mockFigma();f.root={name:'Native motion fixture',children:[]};
 const calls=compileFoundationCalls(data);await execute(f,calls);
 const byName=new Map(f.variableRecords.map(v=>[v.name,v]));
 const timing=byName.get('motion/duration/base');assert.equal(timing.resolvedType,'TIMING');
 const baseRef=Object.values(timing.valuesByMode)[0],base=f.variableRecords.find(v=>v.id===baseRef.id);
 assert.equal(Object.values(base.valuesByMode)[0],.2);
 assert.equal(byName.get('motion/easing/standard').resolvedType,'EASING');
 const exported=await new AsyncFunction('figma',await readFile(new URL('../kit/web/scripts/figma-export.js',import.meta.url),'utf8'))(f);
 assert.deepEqual(compareFoundations(data,exported).differences,[]);
 const repeated=await execute(f,calls);assert.ok(repeated.every(r=>!r.createdVariableIds.length));
 timing.resolvedType='FLOAT';const before=structuredClone(timing.valuesByMode),count=f.variableRecords.length;
 await assert.rejects(()=>execute(f,calls),/Existing variable conflicts/);
 assert.equal(f.variableRecords.length,count);assert.deepEqual(timing.valuesByMode,before);
});
