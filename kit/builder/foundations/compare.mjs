import { rgba, validateFoundations } from './validate.mjs';
import { canonicalAngle } from './gradient.mjs';
// Compare the approved subset. Unrelated existing Figma content may remain.
const measurement=(v,size,fallback=null)=>v===undefined?fallback:typeof v==='number'?v:v?.unit==='PIXELS'?v.value:v?.unit==='PERCENT'?v.value*size/100:v?.unit==='AUTO'?null:v;
const color=v=>rgba(v)||v;
const metadata=(value,omit)=>Object.fromEntries(Object.entries(value).filter(([k])=>!['id','key','remote','subscribed_id',...omit].includes(k)));
function effect(e){
  const c=color(e.color), opacity=e.opacity??1;
  return {...metadata(e,['type','offset','x','y','blur','radius','spread','color','opacity','visible','blendMode']),...(c?.alias?{opacity}:{}),type:e.type,x:e.x??e.offset?.x??0,y:e.y??e.offset?.y??0,blur:e.blur??e.radius??0,spread:e.spread??0,
    color:Array.isArray(c)?[...c.slice(0,3),c[3]*opacity].map(x=>Math.round(x*255)):c,visible:e.visible??true,blendMode:e.blendMode??'NORMAL'};
}
// Both sides carry the CSS angle; a readback converts Figma's gradientTransform before it gets here. Both are
// canonicalised the way the exporter rounds, so 360 matches 0 and 12.34567 matches 12.346.
function paint(p){
  return {...metadata(p,['type','angle','gradientTransform','stops','visible','blendMode','opacity']),type:p.type,angle:typeof p.angle==='number'?canonicalAngle(p.angle):p.angle,
    stops:(p.stops||[]).map(x=>({position:x.position,color:x.color?.alias?{alias:x.color.alias}:(c=>Array.isArray(c)?c.map(n=>Math.round(n*255)):c)(color(x.color))})),visible:p.visible??true,blendMode:p.blendMode??'NORMAL',opacity:p.opacity??1};
}
function style(s,kind){
  if(kind==='textStyles')return {...metadata(s,['name','fontFamily','fontStyle','fontSize','lineHeight','letterSpacing','bound']),fontFamily:s.fontFamily,fontStyle:s.fontStyle??'Regular',fontSize:s.fontSize,
    lineHeight:measurement(s.lineHeight,s.fontSize),letterSpacing:measurement(s.letterSpacing,s.fontSize,0),bound:s.bound??{}};
  if(kind==='effectStyles')return {...metadata(s,['name','effects']),effects:s.effects.map(effect)};
  if(kind==='paintStyles')return {...metadata(s,['name','paints']),paints:s.paints.map(paint)};
  return metadata(s,['name']);
}
// A gradient stop that differs is named: which stop, and which variable it is bound to (bindings, never cached RGBA).
function stopDifferences(name,wanted,got){
  const out=[],rest=v=>({...v,paints:v.paints.map(p=>({...p,stops:p.stops.length}))});
  wanted.paints.forEach((p,i)=>{const q=got.paints?.[i];if(!q||q.stops.length!==p.stops.length)return;
    p.stops.forEach((x,n)=>{const y=q.stops[n];if(equal(x,y))return;
      const label=`Style: paintStyles/${name}${wanted.paints.length>1?` paint ${i+1}`:''} stop ${n+1}`;
      out.push(x.color?.alias&&equal(x.position,y.position)?y.color?.alias?`${label} is bound to ${y.color.alias}, expected ${x.color.alias}.`:`${label} is not bound, expected ${x.color.alias}.`:`${label} differs.`);});});
  const [w,g]=[rest(wanted),rest(got)];if(!out.length||Object.keys(w).some(k=>!equal(w[k],g[k])))out.push(`Style: paintStyles/${name}`);
  return out;
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
  for(const kind of ['textStyles','effectStyles','gridStyles','paintStyles']){
    const byName=new Map((actual?.[kind]||[]).map(s=>[s.name,s]));
    for(const s of expected?.[kind]||[]){
      const other=byName.get(s.name);
      if(!other){differences.push(`Missing style: ${kind}/${s.name}`);continue;}
      const wanted=style(s,kind),got=style(other,kind);
      if(Object.keys(wanted).some(k=>!equal(wanted[k],got[k])))differences.push(...kind==='paintStyles'&&Array.isArray(got.paints)?stopDifferences(s.name,wanted,got):[`Style: ${kind}/${s.name}`]);
    }
  }
  return {format:'ds-create/foundation-diff@1',match:!differences.length,differences};
}
