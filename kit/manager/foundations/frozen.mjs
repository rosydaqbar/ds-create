// Named-object exports retain all metadata. Compact plans have an explicit, lossless field map.
const keys=(value,allowed,label)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw new Error('Unsupported compact '+label+' metadata. Provide the named-object export to retain it.');};
export function normalizeFrozen(source){
 if(Array.isArray(source?.collections)&&Array.isArray(source?.variables)&&source.variables.every(v=>v&&!Array.isArray(v)))return structuredClone(source);
 keys(source,['format','generated','collections','variables','textStyles','effectStyles','gridStyles'],'plan');
 if(!source.collections||Array.isArray(source.collections)||!Array.isArray(source.variables)||source.variables.some(v=>!Array.isArray(v)||v.length!==6))throw new Error('Frozen import needs a named-object export or six-field compact variable rows.');
 const normalizeValue=value=>value&&typeof value==='object'&&Object.keys(value).length===1&&typeof value.a==='string'?{alias:value.a}:value;
 const out={...source,importedFormat:source.format,collections:Object.entries(source.collections).map(([name,modes])=>({name,modes})),variables:source.variables.map(([name,collection,type,scopes,description,values])=>({name,collection,type,scopes,description,values:Object.fromEntries(Object.entries(values).map(([mode,value])=>[mode,normalizeValue(value)]))}))};
 out.textStyles=(source.textStyles||[]).map(s=>{keys(s,['name','family','style','fs','lh','ls','bind'],'text style');return {name:s.name,fontFamily:s.family,fontStyle:s.style,fontSize:s.fs,lineHeight:s.lh,letterSpacing:s.ls,...(s.bind?{bound:s.bind}:{})};});
 out.effectStyles=(source.effectStyles||[]).map(s=>{keys(s,['name','desc','fx'],'effect style');if(!Array.isArray(s.fx))throw new Error('Compact effect layers must be an array.');return {name:s.name,description:s.desc,effects:s.fx.map(e=>{keys(e,['x','y','b','s','c','type'],'effect layer');return {type:e.type||'DROP_SHADOW',offset:{x:e.x,y:e.y},radius:e.b,spread:e.s,color:typeof e.c==='string'&&!e.c.startsWith('#')?{alias:e.c}:e.c};})};});
 return out;
}
