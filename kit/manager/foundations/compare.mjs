import { rgba, validateFoundations } from './validate.mjs';
// Compare the approved subset. Unrelated existing Figma content may remain.
const measurement=(v,size,fallback=null)=>v===undefined?fallback:typeof v==='number'?v:v?.unit==='PIXELS'?v.value:v?.unit==='PERCENT'?v.value*size/100:v?.unit==='AUTO'?null:v;
const color=v=>rgba(v)||v;
const metadata=(value,omit)=>Object.fromEntries(Object.entries(value).filter(([k])=>!['id','key','remote','subscribed_id',...omit].includes(k)));
function effect(e){
  const c=color(e.color), opacity=e.opacity??1;
  return {...metadata(e,['type','offset','x','y','blur','radius','spread','color','opacity','visible','blendMode']),...(c?.alias?{opacity}:{}),type:e.type,x:e.x??e.offset?.x??0,y:e.y??e.offset?.y??0,blur:e.blur??e.radius??0,spread:e.spread??0,
    color:Array.isArray(c)?[...c.slice(0,3),c[3]*opacity].map(x=>Math.round(x*255)):c,visible:e.visible??true,blendMode:e.blendMode??'NORMAL'};
}
function style(s,kind){
  if(kind==='textStyles')return {...metadata(s,['name','fontFamily','fontStyle','fontSize','lineHeight','letterSpacing','bound']),fontFamily:s.fontFamily,fontStyle:s.fontStyle??'Regular',fontSize:s.fontSize,
    lineHeight:measurement(s.lineHeight,s.fontSize),letterSpacing:measurement(s.letterSpacing,s.fontSize,0),bound:s.bound??{}};
  if(kind==='effectStyles')return {...metadata(s,['name','effects']),effects:s.effects.map(effect)};
  return metadata(s,['name']);
}
function equal(a,b){
  if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b)<=1e-6;
  if(a===b)return true;
  if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
  if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equal(v,b[i]));
  return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
}
export function compareFoundations(expected,actual){
  const differences=[];
  for(const [label,data]of [['draft',expected],['export',actual]])for(const error of validateFoundations(data).errors)differences.push(`${label}: ${error}`);
  if(differences.length)return {format:'ds-create/foundation-diff@1',match:false,differences};
  const cols=new Map((actual?.collections||[]).map(c=>[c.name,c]));
  for(const c of expected?.collections||[]){
    const other=cols.get(c.name);
    if(!other||c.modes.some(m=>!other.modes.includes(m)))differences.push(`Missing collection/mode: ${c.name}`);
    else for(const [k,value]of Object.entries(metadata(c,['name','modes'])))if(!equal(value,other[k]))differences.push(`Collection ${k}: ${c.name}`);
  }
  const vars=new Map((actual?.variables||[]).map(v=>[v.name,v]));
  for(const v of expected?.variables||[]){
    const a=vars.get(v.name);
    if(!a||a.type!==v.type||a.collection!==v.collection){differences.push(`Variable identity: ${v.name}`);continue;}
    for(const [mode,value]of Object.entries(v.values)){
      const other=a.values?.[mode];
      // The exporter quantizes Figma colors to 8-bit channels.
      const left=v.type==='COLOR'&&rgba(value)?rgba(value).map(x=>Math.round(x*255)):value;
      const right=v.type==='COLOR'&&rgba(other)?rgba(other).map(x=>Math.round(x*255)):other;
      if(!equal(left,right))differences.push(`Value: ${v.name}/${mode}`);
    }
    // Figma gives TIMING and EASING variables ALL_SCOPES and rejects setting them; unscoped definitions match that default.
    for(const [k,value] of Object.entries(metadata(v,['name','collection','type','values'])))if(!(k==='scopes'&&['TIMING','EASING'].includes(v.type)&&!value.length&&(!a[k]?.length||equal(a[k],['ALL_SCOPES'])))&&!equal(k==='scopes'?[...value].sort():value,k==='scopes'&&Array.isArray(a[k])?[...a[k]].sort():a[k]))differences.push(`Variable ${k}: ${v.name}`);
  }
  for(const kind of ['textStyles','effectStyles','gridStyles']){
    const byName=new Map((actual?.[kind]||[]).map(s=>[s.name,s]));
    for(const s of expected?.[kind]||[]){
      const other=byName.get(s.name);
      if(!other){differences.push(`Missing style: ${kind}/${s.name}`);continue;}
      const wanted=style(s,kind),got=style(other,kind);
      if(Object.keys(wanted).some(k=>!equal(wanted[k],got[k])))differences.push(`Style: ${kind}/${s.name}`);
    }
  }
  return {format:'ds-create/foundation-diff@1',match:!differences.length,differences};
}
