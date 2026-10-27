import {validEasing, validTiming} from '../shared/motion.mjs';

// Shared validation for preparation, review and publication. No Figma side effects.
const domains = ['color','typography','space','shape','elevation','motion'];
const named = x => typeof x === 'string' && x.trim().length > 0;
const finite = x => typeof x === 'number' && Number.isFinite(x);
export function rgba(value) {
  if (typeof value === 'string' && /^#[\da-f]{3,8}$/i.test(value)) {
    let h=value.slice(1); if(h.length===3 || h.length===4)h=[...h].map(x=>x+x).join('');
    if(h.length!==6 && h.length!==8)return null;
    return [0,2,4,6].map((n,i)=>i===3&&h.length===6?1:parseInt(h.slice(n,n+2),16)/255);
  }
  if(value && ['r','g','b'].every(k=>finite(value[k])&&value[k]>=0&&value[k]<=1) && (value.a===undefined||finite(value.a)&&value.a>=0&&value.a<=1))return [value.r,value.g,value.b,value.a??1];
  return null;
}
const literal = (type,v) => type==='COLOR'?!!rgba(v):type==='TIMING'?validTiming(v):type==='EASING'?validEasing(v):type==='FLOAT'?finite(v):type==='STRING'?typeof v==='string':type==='BOOLEAN'?typeof v==='boolean':false;
export function validateFoundations(data) {
  const errors=[], fail=message=>errors.push(message);
  if(!data || !Array.isArray(data.collections) || !Array.isArray(data.variables))return {valid:false,errors:['Collections and variables must be arrays.']};
  const cols=new Map(), vars=new Map();
  for(const c of data.collections){
    if(!named(c?.name)||cols.has(c.name)||!Array.isArray(c.modes)||!c.modes.length||c.modes.some(m=>!named(m))||new Set(c.modes).size!==c.modes.length)fail('Collection names and modes must be unique and nonempty.');
    else cols.set(c.name,c);
  }
  for(const v of data.variables){
    if(!named(v?.name)||vars.has(v.name)){fail('Variable names must be unique and nonempty.');continue;}
    vars.set(v.name,v);
    if(v.scopes!==undefined&&(!Array.isArray(v.scopes)||v.scopes.some(s=>!named(s))))fail(`${v.name}: invalid scopes.`);
    if(v.codeSyntax!==undefined&&(!v.codeSyntax||typeof v.codeSyntax!=='object'||Array.isArray(v.codeSyntax)||Object.values(v.codeSyntax).some(s=>!named(s))))fail(`${v.name}: invalid code syntax.`);
    if(v.hiddenFromPublishing!==undefined&&typeof v.hiddenFromPublishing!=='boolean')fail(`${v.name}: invalid publishing visibility.`);
    const c=cols.get(v.collection);
    if(!c || !['COLOR','FLOAT','STRING','BOOLEAN','TIMING','EASING'].includes(v.type)||!v.values||typeof v.values!=='object'||Array.isArray(v.values)){fail(`Invalid variable ${v.name}.`);continue;}
    if(Object.keys(v.values).length!==c.modes.length||c.modes.some(m=>!Object.hasOwn(v.values,m)))fail(`${v.name}: every declared mode needs a value.`);
    for(const [mode,value] of Object.entries(v.values))if(!c.modes.includes(mode)||!(value&&typeof value==='object'&&named(value.alias))&&!literal(v.type,value))fail(`${v.name}/${mode}: invalid ${v.type} value.`);
  }
  function resolve(v,mode,seen=new Set()){
    if(seen.has(v.name)){fail(`${v.name}: circular alias.`);return;}
    const value=v.values?.[mode] ?? (Object.keys(v.values||{}).length===1?Object.values(v.values)[0]:undefined);
    if(value&&typeof value==='object'&&Object.hasOwn(value,'alias')){
      const target=vars.get(value.alias);
      if(!target||target.type!==v.type){fail(`${v.name}: missing or incompatible alias ${value.alias}.`);return;}
      resolve(target,mode,new Set(seen).add(v.name));
    }else if(!literal(v.type,value))fail(`${v.name}: alias has no usable value for ${mode}.`);
  }
  for(const v of vars.values())for(const mode of Object.keys(v.values||{}))resolve(v,mode);
  for(const list of ['textStyles','effectStyles','gridStyles']){
    const rows=data[list]??[];if(!Array.isArray(rows)){fail(`${list} must be an array.`);continue;}
    const names=new Set();
    for(const s of rows){
      if(!named(s?.name)||names.has(s.name)){fail(`${list}: duplicate or missing style name.`);continue;}names.add(s.name);
      if(list==='textStyles'){
        const lh=s.lineHeight;
        if(!named(s.fontFamily)||!finite(s.fontSize)||s.fontSize<=0||!(lh===undefined||lh===null||finite(lh)&&lh>0||lh?.unit==='AUTO'||['PIXELS','PERCENT'].includes(lh?.unit)&&finite(lh.value)&&lh.value>0))fail(`${s.name}: invalid typography.`);
        if(s.letterSpacing!==undefined&&!(finite(s.letterSpacing)||['PIXELS','PERCENT'].includes(s.letterSpacing?.unit)&&finite(s.letterSpacing.value)))fail(`${s.name}: invalid letter spacing.`);
      }
      if(list==='effectStyles'){
        if(!Array.isArray(s.effects)||!s.effects.length){fail(`${s.name}: empty effects.`);continue;}
        for(const e of s.effects){
          if(!['DROP_SHADOW','INNER_SHADOW','LAYER_BLUR','BACKGROUND_BLUR'].includes(e?.type)||![e.x??e.offset?.x??0,e.y??e.offset?.y??0,e.blur??e.radius??0,e.spread??0].every(finite)||(e.blur??e.radius??0)<0||e.opacity!==undefined&&(!finite(e.opacity)||e.opacity<0||e.opacity>1))fail(`${s.name}: invalid effect geometry.`);
          if(e?.type?.includes('SHADOW')&&!rgba(e.color)&&!(named(e.color?.alias)&&vars.get(e.color.alias)?.type==='COLOR'))fail(`${s.name}: invalid shadow color.`);
        }
      }
      if(list==='gridStyles'&&(!Array.isArray(s.grids)||s.grids.some(g=>!['COLUMNS','ROWS','GRID'].includes(g.pattern))))fail(`${s.name}: invalid grid.`);
      for(const [key,ref] of Object.entries(s.bound||{}))if(!named(ref)||!vars.has(ref)||vars.get(ref).type!==(['fontFamily','fontStyle'].includes(key)?'STRING':'FLOAT'))fail(`${s.name}: invalid binding ${key}.`);
    }
  }
  return {valid:!errors.length,errors:[...new Set(errors)]};
}
export function validatePlan(plan,data,snapshot,revision) {
  const errors=[], fail=x=>errors.push(x), check=validateFoundations(data);if(!check.valid)return check;
  if(plan?.format!=='ds-create/foundation-plan@1'||plan.inputHash!==snapshot.hash||plan.inputRevision!==revision)fail('Foundation plan must match this input snapshot and revision.');
  if(!named(plan?.product?.name)||!named(plan?.product?.description)||!['Web','App','Web and App'].includes(plan?.product?.platform))fail('Record the product name, description and platform.');
  if(!['new','existing'].includes(plan?.systemMode)||!['keep','normalize'].includes(plan?.naming))fail('Record system and naming decisions.');
  const sources=new Set(snapshot.files.map(f=>f.path)), decisions=plan?.decisions;
  if(!Array.isArray(decisions)||!decisions.length||decisions.some(d=>!named(d?.key)||!named(d.value)||!['user','AI'].includes(d.decidedBy)||!sources.has(d.source)||d.decidedBy==='AI'&&!named(d.reason)))fail('Record source-backed decisions, including reasons for AI choices.');
  const vars=new Set((data?.variables||[]).map(v=>v.name));
  for(const domain of domains){
    const scope=plan?.domains?.[domain];
    if(scope?.status==='excluded'){
      if(!named(scope.reason)||!sources.has(scope.source))fail(`${domain}: exclusion needs a reason and source.`);
      continue;
    }
    if(scope?.status!=='included'||!Array.isArray(scope.variables)||!Array.isArray(scope.styles)){fail(`${domain}: record its included names or explicit exclusion.`);continue;}
    const styleList=domain==='typography'?'textStyles':domain==='elevation'?'effectStyles':domain==='space'?'gridStyles':null;
    const styles=new Set((data?.[styleList]||[]).map(s=>s.name));
    if(!scope.variables.length&&!scope.styles.length||scope.variables.some(n=>!vars.has(n))||scope.styles.some(n=>!styles.has(n)))fail(`${domain}: mapped foundation values/styles are missing.`);
    if(domain==='typography'&&!scope.styles.length||domain==='elevation'&&!scope.styles.length)fail(`${domain}: usable styles are required when included.`);
  }
  if(!domains.some(d=>plan?.domains?.[d]?.status==='included')||!(data?.variables?.length||data?.textStyles?.length||data?.effectStyles?.length))fail('Include at least one usable foundation in the approved scope.');
  if(plan?.motionPolicy==='basic-ui'){
    const scope=plan.domains?.motion,collection=data.collections.find(c=>c.name==='Motion');
    const required=['duration/instant','duration/fast','duration/base','duration/slow','duration/loop','easing/standard','easing/enter','easing/exit','easing/linear','delay/tooltip','delay/toast','delay/debounce'].map(n=>'motion/'+n);
    if(scope?.status!=='included'||required.some(n=>!scope.variables?.includes(n)))fail('Basic UI motion requires duration, easing and delay tokens; illustrative-motion exclusions do not remove the UI baseline.');
    if(!collection||!['Standard','Reduced'].every(m=>collection.modes.includes(m)))fail('Basic UI motion requires Standard and Reduced modes.');
    for(const name of required){
      const v=data.variables.find(v=>v.name===name),easing=name.startsWith('motion/easing/'),nativeType=easing?'EASING':'TIMING';
      const allowed=plan.systemMode==='existing'?[nativeType,easing?'STRING':'FLOAT']:[nativeType];
      if(!v||v.collection!=='Motion'||!allowed.includes(v.type))fail(name+': missing or incompatible basic motion token; new systems require '+(easing?'EASING objects.':'TIMING seconds.'));
    }
  }
  if(plan?.systemMode==='new'){
    const grammar=new Map(Object.entries({Primitives:/^(palette|scale)\/[a-z0-9-]+\/[a-z0-9/-]+$/,Color:/^color\/[a-z0-9-]+\/[a-z0-9/-]+$/,Typography:/^font\/(family|weight|size|line-height|letter-spacing)\/[a-z0-9-]+$/,Space:/^space\/[a-z0-9-]+$/,Size:/^size\/[a-z0-9/-]+$/,Shape:/^(radius\/[a-z0-9-]+|border\/width\/[a-z0-9-]+)$/,Motion:/^motion\/(duration|easing|delay)\/[a-z0-9-]+$/}));
    for(const c of data?.collections||[])if(!grammar.has(c.name))fail(`${c.name}: use the foundation collection contract for a new system.`);
    for(const v of data?.variables||[]){
      if(!grammar.get(v.collection)?.test(v.name))fail(`${v.name}: name does not match its collection.`);
      if(!Array.isArray(v.scopes)||v.scopes.some(s=>!named(s))||new Set(v.scopes).size!==v.scopes.length)fail(`${v.name}: record explicit picker scopes (empty for hidden primitives/motion).`);
      if(plan?.product?.platform?.includes('Web')&&v.codeSyntax?.WEB!==`var(--${v.name.replaceAll('/','-')})`)fail(`${v.name}: record matching WEB code syntax.`);
      if(v.collection==='Primitives'&&(v.hiddenFromPublishing!==true||Object.values(v.values||{}).some(x=>x&&typeof x==='object'&&Object.hasOwn(x,'alias'))))fail(`${v.name}: primitives hold raw values and are hidden from publishing.`);
      if(v.collection!=='Primitives'&&Object.values(v.values||{}).some(x=>!named(x?.alias)||(data.variables.find(target=>target.name===x.alias)?.collection!=='Primitives')))fail(`${v.name}: semantic values must alias primitives.`);
      if(v.collection!=='Primitives'&&!named(v.description))fail(`${v.name}: describe its UI purpose.`);
    }
    for(const s of data?.textStyles||[])if(!/^type\/(display|heading|body|label|link|overline|code)\/[^/]+\/[^/]+$/.test(s.name))fail(`${s.name}: use the text style naming contract.`);
  }
  return {valid:!errors.length,errors:[...new Set(errors)]};
}

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
