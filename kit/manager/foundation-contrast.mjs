import {rgba} from './foundation-validation.mjs';
// Init subset of the full file audit's text pairs, plus focus and every solid tone.
export function contrastReport(draft){
 const byName=new Map(draft.variables.map(v=>[v.name,v]));
 function resolve(name,mode,seen=new Set()){if(seen.has(name))throw new Error('Circular color alias');seen.add(name);const v=byName.get(name),x=v?.values?.[mode]??(Object.keys(v?.values||{}).length===1?Object.values(v.values)[0]:undefined);return x?.alias?resolve(x.alias,mode,seen):rgba(x);}
 const luminance=rgb=>rgb.slice(0,3).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
 const over=(a,b)=>[...a.slice(0,3).map((c,i)=>c*a[3]+b[i]*(1-a[3])),1],pairs=[];
 for(const role of ['primary','secondary','tertiary','placeholder','brand','danger','warning','success','info'])for(const surface of ['base','raised','sunken','overlay'])pairs.push(['color/text/'+role,'color/surface/'+surface,4.5]);
 pairs.push(['color/border/focus','color/surface/base',3],['color/text/inverse','color/surface/inverse',4.5]);
 for(const v of draft.variables.filter(v=>/^color\/fill\/[^/]+\/solid(?:\/(hover|pressed|selected))?$/.test(v.name)))pairs.push([v.name.includes('/neutral/')?'color/text/inverse':'color/text/on-solid',v.name,4.5]);
 for(const tone of ['brand','danger','warning','success','info'])for(const state of ['', '/hover',...(['brand','danger'].includes(tone)?['/pressed','/selected']:[])])pairs.push(['color/text/'+tone,'color/fill/'+tone+'/subtle'+state,4.5]);
 for(const role of ['primary','secondary'])pairs.push(['color/text/'+role+'/on-brand','color/surface/brand-solid',4.5]);
 const results=[];
 for(const mode of draft.collections.find(c=>c.name==='Color')?.modes||[]){
  const base=resolve('color/surface/base',mode);
  for(const [foreground,background,minimum]of pairs){
   const a=resolve(foreground,mode),b=resolve(background,mode);if(!a||!b)continue;
   if((a[3]!==1||b[3]!==1)&&(!base||base[3]!==1)){results.push({foreground,background,mode,minimum,pass:false,reason:'Translucent contrast requires an opaque backing surface.'});continue;}
   const surface=b[3]===1?b:over(b,base),ink=a[3]===1?a:over(a,surface),x=luminance(ink),y=luminance(surface),ratio=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
   results.push({foreground,background,mode,minimum,ratio,pass:ratio>=minimum});
  }
 }
 return results;
}
