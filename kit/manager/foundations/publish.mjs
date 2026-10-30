import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {validateFoundations} from './validate.mjs';
import {verifyFoundationPack} from './pack.mjs';
const unsupported=message=>Object.assign(new Error(message),{code:'MANAGER_FAST_UNSUPPORTED'});

// Fixed renderer + approved data, following FAST's batching pattern. No agent codegen.
// This function is serialized into Plugin API calls; keep it self-contained.
export async function renderFoundationBatch(figma,{phase,definitions}){
 const same=(a,b)=>{
  if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b)<1e-6;
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
  return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
 };
 const contains=(a,b)=>{
  if(!b||typeof b!=='object')return same(a,b);
  if(!a||typeof a!=='object'||Array.isArray(b)&&(!Array.isArray(a)||a.length!==b.length))return false;
  return Object.keys(b).every(k=>k in a&&contains(a[k],b[k]));
 };
 const color=value=>{
  if(typeof value!=='string')return {...value,a:value.a??1};
  let h=value.slice(1);if(h.length<=4)h=[...h].map(x=>x+x).join('');
  return {r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255,a:h.length===8?parseInt(h.slice(6,8),16)/255:1};
 };
 const unique=(items,label)=>{
  const map=new Map();for(const item of items){if(map.has(item.name))throw new Error('Ambiguous '+label+': '+item.name);map.set(item.name,item);}return map;
 };
 const createdVariableIds=[],createdStyleIds=[],createdCollectionIds=[],errors=[];
 let reused=0,verified=0;
 const collections=await figma.variables.getLocalVariableCollectionsAsync();
 const cols=unique(collections,'collection');
 if(phase==='collections'){
  for(const d of definitions){
   let c=cols.get(d.name);
   if(c){
    if(d.modes.some(m=>!c.modes.some(x=>x.name===m)))throw new Error('Existing collection modes conflict: '+d.name);
    for(const field of ['hiddenFromPublishing'])if(d[field]!==undefined&&!same(c[field],d[field]))throw new Error('Existing collection metadata conflicts: '+d.name);
    reused++;
   }else{
    c=figma.variables.createVariableCollection(d.name);createdCollectionIds.push(c.id);
    c.renameMode(c.modes[0].modeId,d.modes[0]);for(const mode of d.modes.slice(1))c.addMode(mode);
    if(d.hiddenFromPublishing!==undefined)c.hiddenFromPublishing=d.hiddenFromPublishing;
    cols.set(c.name,c);
   }
   verified++;
  }
 }else{
  const all=await figma.variables.getLocalVariablesAsync(),vars=unique(all,'variable'),byId=new Map(all.map(v=>[v.id,v]));
  const variable=name=>{const v=vars.get(name);if(!v)throw new Error('Missing alias/binding: '+name);return v;};
  const valueFor=(d,x)=>x&&typeof x==='object'&&x.alias?{type:'VARIABLE_ALIAS',id:variable(x.alias).id}:d.type==='COLOR'?color(x):x;
  if(phase==='variables'){
   for(const d of definitions){
    const c=cols.get(d.collection);if(!c)throw new Error('Missing collection: '+d.collection);
    let v=vars.get(d.name);
    const matches=()=>v.resolvedType===d.type&&v.variableCollectionId===c.id&&
     ['description','hiddenFromPublishing'].every(k=>d[k]===undefined||same(v[k],d[k]))&&
     (d.scopes===undefined||['TIMING','EASING'].includes(d.type)&&!d.scopes.length||same([...v.scopes].sort(),[...d.scopes].sort()))&&
     (d.codeSyntax===undefined||same({...v.codeSyntax},d.codeSyntax))&&
     Object.entries(d.values).every(([mode,x])=>same(v.valuesByMode[c.modes.find(m=>m.name===mode)?.modeId],valueFor(d,x)));
    if(v){if(!matches())throw new Error('Existing variable conflicts: '+d.name);reused++;}
    else{
     // Resolve all aliases before creating anything for this definition.
     const values=Object.entries(d.values).map(([mode,x])=>{
      const m=c.modes.find(m=>m.name===mode);if(!m)throw new Error('Missing mode: '+mode);return [m.modeId,valueFor(d,x)];
     });
     v=figma.variables.createVariable(d.name,c,d.type);createdVariableIds.push(v.id);
     if(d.description!==undefined)v.description=d.description;
     // Figma rejects scopes on TIMING and EASING variables; their definitions carry none.
     if(!['TIMING','EASING'].includes(d.type))v.scopes=d.scopes??[];
     if(d.hiddenFromPublishing!==undefined)v.hiddenFromPublishing=d.hiddenFromPublishing;
     for(const [platform,syntax] of Object.entries(d.codeSyntax??{}))v.setVariableCodeSyntax(platform,syntax);
     for(const [mode,x] of values)v.setValueForMode(mode,x);
     vars.set(d.name,v);byId.set(v.id,v);
     if(!matches())throw new Error('Variable readback differs: '+d.name);
    }
    verified++;
   }
  }else if(phase==='styles'){
   const [text,effects,grids]=await Promise.all([figma.getLocalTextStylesAsync(),figma.getLocalEffectStylesAsync(),figma.getLocalGridStylesAsync()]);
   const existing={textStyles:unique(text,'text style'),effectStyles:unique(effects,'effect style'),gridStyles:unique(grids,'grid style')};
   const fontFailures=new Map(),loaded=new Set();
   const measurement=(x,fallback)=>x==null?fallback:typeof x==='number'?{unit:'PIXELS',value:x}:x;
   const resolve=(v,seen=new Set())=>{
    if(seen.has(v.id))throw new Error('Circular effect alias');seen.add(v.id);
    const x=Object.values(v.valuesByMode)[0];return x?.type==='VARIABLE_ALIAS'?resolve(byId.get(x.id),seen):x;
   };
   const effectView=e=>{
    const result={type:e.type,visible:e.visible??true,radius:e.radius??0};
    if(e.type.includes('SHADOW')){
     result.offset={x:e.offset?.x??0,y:e.offset?.y??0};result.spread=e.spread??0;result.blendMode=e.blendMode??'NORMAL';
     // The binding is authoritative; its cached RGBA may reflect another editor mode.
     const ref=e.boundVariables?.color;
     result.color=ref?{alias:ref.id}:color(e.color);
     if(e.boundVariables)result.boundVariables=e.boundVariables;
    }
    return result;
   };
   for(const {kind,definition:d} of definitions){
    let s=existing[kind].get(d.name),created=false,fontLoadFailed=false;
    const fontKey=kind==='textStyles'?JSON.stringify([d.fontFamily,d.fontStyle??'Regular']):null;
    if(fontKey&&fontFailures.has(fontKey)){fontFailures.get(fontKey).styles.push(d.name);continue;}
    try{
     let fields;
     if(kind==='textStyles'){
      const fontName={family:d.fontFamily,style:d.fontStyle??'Regular'};
      if(!loaded.has(fontKey)){
       try{await figma.loadFontAsync(fontName);loaded.add(fontKey);}catch(error){fontLoadFailed=true;throw error;}
      }
      fields={fontName,fontSize:d.fontSize,lineHeight:measurement(d.lineHeight,{unit:'AUTO'}),letterSpacing:measurement(d.letterSpacing,{unit:'PIXELS',value:0})};
      for(const key of ['description','textCase','textDecoration','paragraphSpacing','paragraphIndent','listSpacing','hangingPunctuation','hangingList','leadingTrim'])if(d[key]!==undefined)fields[key]=d[key];
     }else if(kind==='effectStyles'){
      fields={effects:d.effects.map(e=>{
       let effect={type:e.type,visible:e.visible??true,radius:e.blur??e.radius??0};
       if(e.type.includes('SHADOW')){
        const ref=e.color?.alias?variable(e.color.alias):null;
        effect={...effect,blendMode:e.blendMode??'NORMAL',offset:{x:e.x??e.offset?.x??0,y:e.y??e.offset?.y??0},spread:e.spread??0,color:{...(ref?resolve(ref):color(e.color))}};
        effect.color.a=(effect.color.a??1)*(e.opacity??1);
        if(ref)effect=figma.variables.setBoundVariableForEffect(effect,'color',ref);
       }
       return effect;
      })};
      if(d.description!==undefined)fields.description=d.description;
     }else{fields={layoutGrids:d.grids};if(d.description!==undefined)fields.description=d.description;}
     const bindings=Object.entries(d.bound??{}).map(([field,name])=>[field,variable(name)]);
     const matches=()=>Object.entries(fields).every(([k,x])=>kind==='effectStyles'&&k==='effects'?contains(s.effects.map(effectView),x.map(effectView)):contains(s[k],x))&&bindings.every(([field,v])=>s.boundVariables?.[field]?.id===v.id);
     const mismatch=label=>{
      const paths=[];
      const inspect=(a,b,p)=>{if(paths.length>=6||contains(a,b))return;if(!a||!b||typeof a!=='object'||typeof b!=='object'){paths.push(p);return;}if(Array.isArray(b)&&a.length!==b.length)paths.push(p+'.length');for(const k of Object.keys(b))inspect(a[k],b[k],p+'.'+k);};
      for(const [k,wanted]of Object.entries(fields))inspect(kind==='effectStyles'&&k==='effects'?s.effects.map(effectView):s[k],kind==='effectStyles'&&k==='effects'?wanted.map(effectView):wanted,k);
      for(const [field,v]of bindings)if(s.boundVariables?.[field]?.id!==v.id)paths.push('boundVariables.'+field);
      return new Error(label+': '+d.name+(paths.length?' ['+paths.slice(0,6).join(', ')+']':''));
     };
     if(s){if(!matches())throw new Error('Existing style conflicts: '+d.name);reused++;}
     else{
      s=kind==='textStyles'?figma.createTextStyle():kind==='effectStyles'?figma.createEffectStyle():figma.createGridStyle();created=true;
      s.name=d.name;
      // Font inventory is advisory. Preserve the exact approved font identity;
      // actual assignment errors are recorded once per face, never substituted.
      for(const [key,value] of Object.entries(fields))s[key]=value;
      for(const [field,v] of bindings)s.setBoundVariable(field,v);
      if(!matches())throw mismatch('Style readback differs');
      createdStyleIds.push(s.id);existing[kind].set(d.name,s);
     }
     verified++;
    }catch(error){
     if(created)s.remove(); // Only the incomplete style created by this call.
     const item={kind,styles:[d.name],message:String(error).slice(0,600)};
     if(fontKey&&(fontLoadFailed||/font|unloaded/i.test(String(error)))&&!String(error).includes('Existing style conflicts'))fontFailures.set(fontKey,item);else errors.push(item);
    }
   }
   errors.push(...fontFailures.values());
  }else throw new Error('Unknown FAST phase');
 }
 return {phase,createdCollectionIds,createdVariableIds,createdStyleIds,reused,verified,errors};
}

export function compileFoundationCalls(draft,{maxChars=45000}={}){
 const check=validateFoundations(draft);if(!check.valid)throw new Error(check.errors.join(' '));
 const allowed={collection:['name','modes','hiddenFromPublishing'],variable:['name','collection','type','values','description','scopes','codeSyntax','hiddenFromPublishing'],textStyles:['name','fontFamily','fontStyle','fontSize','lineHeight','letterSpacing','description','textCase','textDecoration','paragraphSpacing','paragraphIndent','listSpacing','hangingPunctuation','hangingList','leadingTrim','bound'],effectStyles:['name','description','effects'],gridStyles:['name','description','grids']};
 const supported=(d,kind)=>{const unknown=Object.keys(d).filter(k=>!allowed[kind].includes(k));if(unknown.length)throw unsupported('FAST does not support '+kind+' metadata: '+unknown.join(', '));};
 draft.collections.forEach(d=>supported(d,'collection'));draft.variables.forEach(d=>supported(d,'variable'));
 const byName=new Map(draft.variables.map(v=>[v.name,v])),ordered=[],seen=new Set();
 const visit=v=>{if(seen.has(v.name))return;seen.add(v.name);for(const x of Object.values(v.values))if(x?.alias)visit(byName.get(x.alias));ordered.push(v);};
 draft.variables.forEach(visit);
 const styles=['effectStyles','gridStyles','textStyles'].flatMap(kind=>(draft[kind]??[]).map(definition=>{
  supported(definition,kind);
  if(kind==='effectStyles')for(const e of definition.effects){
   const unknown=Object.keys(e).filter(k=>!['type','visible','blendMode','offset','x','y','blur','radius','spread','color','opacity'].includes(k));
   if(unknown.length)throw unsupported('FAST does not support effect metadata: '+unknown.join(', '));
   if(e.color?.alias&&e.opacity!==undefined&&e.opacity!==1)throw unsupported('FAST cannot preserve an opacity multiplier on a bound effect color.');
  }
  return {kind,definition};
 }));
 const calls=[],code=(phase,definitions)=>`return await (${renderFoundationBatch.toString()})(figma,${JSON.stringify({phase,definitions})});`;
 for(const [phase,definitions] of [['collections',draft.collections],['variables',ordered],['styles',styles]]){
  let batch=[];
  for(const d of definitions){
   if(code(phase,[...batch,d]).length>maxChars){if(!batch.length)throw new Error('One FAST definition exceeds the call limit.');calls.push({phase,code:code(phase,batch),count:batch.length});batch=[];}
   batch.push(d);if(code(phase,batch).length>maxChars)throw new Error('One FAST definition exceeds the call limit.');
  }
  if(batch.length)calls.push({phase,code:code(phase,batch),count:batch.length});
 }
 return calls;
}

export async function writeFoundationFastPlan(request,requestFile){
 const bytes=await readFile(path.join(request.outputDir,'foundations.json'));
 if(createHash('sha256').update(bytes).digest('hex')!==request.hash)throw new Error('Draft changed before FAST compilation.');
 const draft=JSON.parse(bytes);await verifyFoundationPack(request.outputDir,draft);
 const calls=compileFoundationCalls(draft);
 const dir=path.join(path.dirname(requestFile),'fast');await mkdir(dir,{recursive:true});
 const entries=[];
 for(const [i,call] of calls.entries()){
  const name=String(i+1).padStart(2,'0')+'-'+call.phase+'.js',file=path.join(dir,name);
  await writeFile(file,call.code);entries.push({phase:call.phase,count:call.count,file,characters:call.code.length,sha256:createHash('sha256').update(call.code).digest('hex')});
 }
 const plan={format:'ds-create/manager-fast@1',sourceHash:request.hash,revision:request.revision,figmaUrl:request.figmaUrl,calls:entries};
 const file=path.join(dir,'plan.json');await writeFile(file,JSON.stringify(plan,null,2)+'\n');return {file,...plan};
}
