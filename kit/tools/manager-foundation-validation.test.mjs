import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFoundations, validatePlan } from '../manager/foundation-validation.mjs';
import { compareFoundations } from '../manager/foundation-compare.mjs';
import { setupDraft } from './fixtures/manager-setup.mjs';
const draft=()=>structuredClone(setupDraft);
test('typed values, complete declared modes, compatible/cycle-free aliases and usable styles are required',()=>{
 assert.equal(validateFoundations(draft()).valid,true);
 for(const mutate of [
  d=>d.collections.find(c=>c.name==='Color').modes.push('Dark'),
  d=>d.variables.find(v=>v.name==='scale/space/xs').values.Value='not-a-number',
  d=>d.variables.find(v=>v.name==='color/surface/base').values.Light={alias:'scale/space/xs'},
  d=>d.variables.find(v=>v.name==='palette/base/white').values.Value={alias:'color/surface/base'},
  d=>d.textStyles[0].fontSize=-16,
  d=>d.effectStyles[0].effects[0].radius=-3,
 ]){const d=draft();mutate(d);assert.equal(validateFoundations(d).valid,false);}
});
test('confirmed export must match all approved values, aliases and styles; equivalent serialization and extra content may stay',()=>{
 const expected=draft(),actual=draft();
 actual.variables.reverse();actual.collections.reverse();
 actual.variables.find(v=>v.name==='palette/base/white').values.Value={r:1,g:1,b:1,a:1};
 actual.textStyles[0].lineHeight=24;actual.textStyles[0].letterSpacing=0;actual.textStyles[0].id='transport-id';
 actual.effectStyles[0].effects=[{type:'DROP_SHADOW',color:'#0000001a',x:0,y:1,blur:3,spread:0}];
 actual.variables.push({name:'unrelated/kept',type:'STRING',collection:'Primitives',values:{Value:'kept'}});
 assert.deepEqual(compareFoundations(expected,actual).differences,[]);
 assert.equal(compareFoundations(expected,{collections:'malformed',variables:[]}).match,false);
 for(const mutate of [
  d=>d.variables.find(v=>v.name==='palette/base/white').values.Value='#ff0000',
  d=>d.variables.find(v=>v.name==='color/surface/base').values.Light='#fff',
  d=>d.textStyles[0].lineHeight=28,
  d=>d.textStyles[0].fontStyle='Bold',
  d=>d.textStyles[0].bound={fontSize:'scale/space/xs'},
  d=>d.effectStyles[0].effects[0].blur=12,
  d=>d.collections.find(c=>c.name==='Color').modes=[],
 ]){const d=structuredClone(actual);mutate(d);assert.equal(compareFoundations(expected,d).match,false);}
});
test('existing naming and explicit source-backed exclusions are accepted without a universal token-count requirement',()=>{
 const data={collections:[{name:'Legacy colors',modes:['Day']}],variables:[{name:'legacy/paper',type:'COLOR',collection:'Legacy colors',values:{Day:'#fff'}}],textStyles:[],effectStyles:[]};
 const snapshot={hash:'inputs',files:[{path:'chat/context.md'}]},source='chat/context.md';
 const plan={format:'ds-create/foundation-plan@1',inputHash:'inputs',inputRevision:2,product:{name:'Existing',description:'An existing scoped system',platform:'Web'},systemMode:'existing',naming:'keep',decisions:[{key:'scope',value:'Color only',decidedBy:'user',source}],domains:{color:{status:'included',variables:['legacy/paper'],styles:[]}}};
 for(const d of ['typography','space','shape','elevation','motion'])plan.domains[d]={status:'excluded',reason:'Existing system; user requested color-only scope.',source};
 assert.deepEqual(validatePlan(plan,data,snapshot,2).errors,[]);
 delete plan.domains.motion.reason;assert.equal(validatePlan(plan,data,snapshot,2).valid,false);
});

test('the full Figma exporter preserves approved metadata and equivalent style measurements',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {rgba}=await import('../manager/foundation-validation.mjs');
 const data=draft(),ids=new Map(data.variables.map((v,i)=>[v.name,'v'+i]));
 const channels=h=>{const [r,g,b,a]=rgba(h);return {r,g,b,a};};
 const cols=data.collections.map((c,i)=>({name:c.name,id:'c'+i,modes:c.modes.map(name=>({name,modeId:name}))}));
 const vars=data.variables.map(v=>({...v,id:ids.get(v.name),variableCollectionId:cols.find(c=>c.name===v.collection).id,resolvedType:v.type,
  hiddenFromPublishing:v.hiddenFromPublishing??false,valuesByMode:Object.fromEntries(Object.entries(v.values).map(([mode,value])=>[mode,value?.alias?{type:'VARIABLE_ALIAS',id:ids.get(value.alias)}:v.type==='COLOR'?channels(value):value]))}));
 const text=data.textStyles.map(s=>({...s,fontName:{family:s.fontFamily,style:s.fontStyle},lineHeight:{unit:'PERCENT',value:150},letterSpacing:{unit:'PIXELS',value:0},boundVariables:{},textCase:'ORIGINAL',textDecoration:'NONE',paragraphSpacing:0,paragraphIndent:0}));
 const effects=data.effectStyles.map(s=>({...s,effects:s.effects.map(e=>({...e,color:{...channels(e.color),a:e.opacity},visible:true,blendMode:'NORMAL'}))}));
 const figma={variables:{getLocalVariableCollectionsAsync:async()=>cols,getLocalVariablesAsync:async()=>vars},getLocalTextStylesAsync:async()=>text,getLocalEffectStylesAsync:async()=>effects,getLocalGridStylesAsync:async()=>[],root:{name:'Synthetic',children:[]}};
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const exported=await new AsyncFunction('figma',await readFile(new URL('../web/scripts/figma-export.js',import.meta.url),'utf8'))(figma);
 assert.deepEqual(compareFoundations(data,exported).differences,[]);
 assert.equal(exported.textStyles[0].lineHeight,24);
 const changed=structuredClone(exported);changed.variables.find(v=>v.collection==='Color').scopes=[];assert.equal(compareFoundations(data,changed).match,false);
});

test('new drafts require canonical naming, primitive links/visibility and explicit web metadata',()=>{
 const data=draft(),source='chat/context.md',snapshot={hash:'snapshot',files:[{path:source}]};
 const plan={format:'ds-create/foundation-plan@1',inputHash:'snapshot',inputRevision:1,product:{name:'Synthetic',description:'A test product',platform:'Web'},systemMode:'new',naming:'normalize',decisions:[{key:'platform',value:'Web',decidedBy:'user',source}],domains:{}};
 for(const [id,prefixes,styles]of [['color',['palette/','color/'],[]],['typography',['font/'],data.textStyles.map(s=>s.name)],['space',['space/'],[]],['shape',['radius/'],[]],['elevation',[],data.effectStyles.map(s=>s.name)],['motion',['motion/'],[]]])plan.domains[id]={status:'included',variables:data.variables.filter(v=>prefixes.some(p=>v.name.startsWith(p))).map(v=>v.name),styles};
 assert.deepEqual(validatePlan(plan,data,snapshot,1).errors,[]);
 for(const mutate of [
  d=>delete d.variables[0].hiddenFromPublishing,
  d=>delete d.variables.find(v=>v.collection==='Color').scopes,
  d=>d.variables.find(v=>v.collection==='Color').scopes='ALL_FILLS',
  d=>delete d.variables.find(v=>v.collection==='Color').codeSyntax,
  d=>d.variables.find(v=>v.collection==='Color').name='brand-name/paper',
  d=>d.effectStyles[0].effects=[null],
 ]){const changed=structuredClone(data);mutate(changed);assert.equal(validatePlan(plan,changed,snapshot,1).valid,false);}
});

test('basic UI motion policy cannot be satisfied by an illustrative-motion exclusion or incomplete baseline',()=>{
 const data=draft();data.collections.find(c=>c.name==='Motion').modes=['Standard','Reduced'];
 data.variables=data.variables.filter(v=>!v.name.startsWith('motion/'));
 for(const [name,value]of Object.entries({'duration/instant':0,'duration/fast':120,'duration/base':200,'duration/slow':300,'duration/loop':900,'easing/standard':'cubic-bezier(0.2, 0, 0, 1)','easing/enter':'cubic-bezier(0, 0, 0.2, 1)','easing/exit':'cubic-bezier(0.4, 0, 1, 1)','easing/linear':'linear','delay/tooltip':400,'delay/toast':5000,'delay/debounce':250}))data.variables.push({name:'motion/'+name,collection:'Motion',type:typeof value==='number'?'FLOAT':'STRING',values:{Standard:value,Reduced:['duration/base','duration/slow'].includes(name)?0:name==='duration/loop'?1800:value}});
 const snapshot={hash:'fixture',files:[{path:'brief.md'}]},plan={format:'ds-create/foundation-plan@1',inputHash:'fixture',inputRevision:1,motionPolicy:'basic-ui',product:{name:'Fixture',description:'Test product',platform:'App'},systemMode:'existing',naming:'keep',decisions:[{key:'motion',value:'Basic UI motion',decidedBy:'user',source:'brief.md'}],domains:Object.fromEntries(['color','typography','space','shape','elevation'].map(id=>[id,{status:'excluded',reason:'Test scope',source:'brief.md'}]))};
 plan.domains.motion={status:'included',variables:data.variables.filter(v=>v.name.startsWith('motion/')).map(v=>v.name),styles:[]};
 assert.deepEqual(validatePlan(plan,data,snapshot,1).errors,[]);
 const excluded=structuredClone(plan);excluded.domains.motion={status:'excluded',reason:'No animated illustration',source:'brief.md'};assert.equal(validatePlan(excluded,data,snapshot,1).valid,false);
 const missing=structuredClone(data);missing.variables=missing.variables.filter(v=>v.name!=='motion/delay/tooltip');assert.equal(validatePlan(plan,missing,snapshot,1).valid,false);
 const noReduced=structuredClone(data);noReduced.collections.find(c=>c.name==='Motion').modes=['Standard'];for(const v of noReduced.variables.filter(v=>v.collection==='Motion'))delete v.values.Reduced;assert.equal(validatePlan(plan,noReduced,snapshot,1).valid,false);
});
