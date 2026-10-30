import {readFileSync} from 'node:fs';
import {rgba, validatePlan} from './validate.mjs';
import {nativeEasing, validTiming} from '../shared/motion.mjs';
import {createHash} from 'node:crypto';
import {lockedFacts} from '../shared/interface.mjs';
const digest=value=>createHash('sha256').update(value).digest('hex');

// Deterministic LOCAL foundation expansion. No Figma calls and no brand-specific fixtures.

export {contrastReport} from './validate.mjs';
const defaults=JSON.parse(readFileSync(new URL('./defaults.json',import.meta.url),'utf8'));
export const COMPILER_HASH=digest(readFileSync(new URL(import.meta.url))+readFileSync(new URL('../shared/motion.mjs',import.meta.url))+JSON.stringify(defaults));
export const domainNames=['color','typography','space','shape','elevation','motion'];
const named=x=>typeof x==='string'&&x.trim().length>0;
const strict=(obj,keys,label)=>{if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).some(k=>!keys.includes(k)))throw new Error('Unsupported '+label+' fields; preserve them through explicit definitions instead of dropping metadata.');};
const alias=name=>({alias:name});
const safe=value=>typeof value==='number'?String(value).replace(/^-/,'minus-').replaceAll('.','p'):String(value).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');
const roles={color:['Color'],typography:['Typography'],space:['Space','Size'],shape:['Shape'],motion:['Motion'],elevation:[]};
const styles={typography:'textStyles',space:'gridStyles',elevation:'effectStyles'};

// Interpolate in OKLab between caller-pinned anchors. Endpoints and brand anchors are never inferred.
function lab(hex){const [r,g,b]=rgba(hex).slice(0,3).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];}
function hex([L,a,b]){const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;return '#'+[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].map(c=>c<=.0031308?12.92*c:1.055*Math.max(0,c)**(1/2.4)-.055).map(c=>Math.round(Math.max(0,Math.min(1,c))*255).toString(16).padStart(2,'0')).join('');}
export function paletteRamp({anchors,steps=[50,100,200,300,400,500,600,700,800,900,950]}){
 if(!anchors||Object.entries(anchors).some(([k,v])=>!/^\d+$/.test(k)||!rgba(v)||rgba(v)[3]!==1))throw new Error('Palette anchors need opaque colors and numeric steps.');
 const pins=Object.keys(anchors).map(Number).sort((a,b)=>a-b);
 if(!pins.length||!Array.isArray(steps)||!steps.length||steps.some(n=>!Number.isFinite(n)||n<pins[0]||n>pins.at(-1)))throw new Error('Pin both ends of each palette; no extrapolation.');
 return Object.fromEntries([...new Set([...steps,...pins])].sort((a,b)=>a-b).map(step=>{
  if(Object.hasOwn(anchors,String(step)))return [step,anchors[step]];
  const hi=pins.find(n=>n>step),lo=pins[pins.indexOf(hi)-1],t=(step-lo)/(hi-lo),a=lab(anchors[lo]),b=lab(anchors[hi]);return [step,hex(a.map((x,i)=>x+(b[i]-x)*t))];
 }));
}
function builder(platform){
 const data={collections:[],variables:[],textStyles:[],effectStyles:[],gridStyles:[]},map=new Map();
 const collection=(name,modes=['Value'])=>{if(!data.collections.some(c=>c.name===name))data.collections.push({name,modes});};
 function add(name,type,value,description,scopes=[]){
  const prior=map.get(name);if(prior){if(prior.type!==type||JSON.stringify(prior.values)!==JSON.stringify({Value:value}))throw new Error('Conflicting primitive '+name);return name;}
  collection('Primitives');const v={name,collection:'Primitives',type,values:{Value:value},scopes:[],hiddenFromPublishing:true};metadata(v);data.variables.push(v);map.set(name,v);return name;
 }
 function metadata(v){if(platform.includes('Web'))v.codeSyntax={WEB:'var(--'+v.name.replaceAll('/','-')+')'};}
 function semantic(name,col,type,values,description,scopes){collection(col,Object.keys(values));const v={name,collection:col,type,values,description,scopes};metadata(v);data.variables.push(v);}
 function scalar(name,col,value,description,dimension,scopes,modeValues={Value:value},nativeType){
  const type=nativeType||(typeof value==='number'?'FLOAT':typeof value==='boolean'?'BOOLEAN':'STRING'),values={};
  for(const [mode,x]of Object.entries(modeValues)){
   const key=dimension==='easing'?name.split('/').at(-1)+(JSON.stringify(x)!==JSON.stringify(value)?'-'+safe(mode):''):safe(x);
   const p='scale/'+dimension+'/'+key;values[mode]=alias(add(p,type,x));
  }
  semantic(name,col,type,values,description,scopes);return name;
 }
 return {data,add,semantic,scalar,collection};
}
function colorRecipe(b,r,modes){
 strict(r,['palettes','tones','categories','overrides','extra'],'color recipe');
 const palettes={};
 for(const [family,p]of Object.entries(r.palettes||{})){if(!/^[a-z0-9-]+$/.test(family)||!named(p.purpose))throw new Error('Every palette needs a canonical family and product purpose.');strict(p,['anchors','steps','purpose'],'palette');palettes[family]=paletteRamp(p);for(const [step,value]of Object.entries(palettes[family]))b.add('palette/'+family+'/'+step,'COLOR',value);}
 for(const [key,value]of Object.entries({white:'#ffffff',black:'#000000',transparent:'#00000000'}))b.add('palette/base/'+key,'COLOR',value);
 for(const family of ['black','white'])for(const n of [5,10,20,40,60,80])b.add('palette/alpha-'+family+'/'+n,'COLOR',family==='black'?{r:0,g:0,b:0,a:n/100}:{r:1,g:1,b:1,a:n/100});
 const tones={neutral:'neutral',brand:'brand',...(r.tones||{})},rows=[];
 for(const row of defaults.colors){
  if(row.name.includes('{tone}')){for(const [tone,hue]of Object.entries(tones))if(tone!=='neutral')rows.push({...row,name:row.name.replace('{tone}',tone),Light:row.Light.replaceAll('{hue}',hue),Dark:row.Dark.replaceAll('{hue}',hue),description:row.description.replaceAll('tone',tone)});}
  else{
   const feedback=row.name.match(/\/(danger|warning|success|info)(\/|$)/)?.[1];if(feedback&&!tones[feedback])continue;
   if(row.name==='color/shadow/edge'||row.name==='color/shadow/highlight')continue;
   rows.push({...row,...(feedback?Object.fromEntries(['Light','Dark'].map(m=>[m,row[m].replace(/^(red|amber|green|blue)\//,tones[feedback]+'/')])):{})});
   if(tones.accent&&/^color\/(text|icon|border)\/brand(?:\/|$)/.test(row.name))rows.push({...row,name:row.name.replace('/brand','/accent'),Light:row.Light.replace(/^brand\//,tones.accent+'/'),Dark:row.Dark.replace(/^brand\//,tones.accent+'/'),description:row.description.replace(/Brand|brand/g,'Accent')});
  }
 }
 for(const emphasis of ['solid','subtle'])for(const state of ['','hover','pressed','selected','disabled']){
  const i=['','hover','pressed','selected','disabled'].indexOf(state),pair=emphasis==='solid'?[[900,50],[800,100],[700,200],[800,100],[100,800]][i]:[[50,900],[100,800],[200,700],[100,800],[50,900]][i];
  rows.push({name:'color/fill/neutral/'+emphasis+(state?'/'+state:''),Light:'neutral/'+pair[0],Dark:'neutral/'+pair[1],description:'Neutral '+emphasis+' '+(state||'rest')+' fill for controls and selectable items.'});
 }
 for(const family of r.categories||[])for(const [role,l,d]of [['subtle',50,950],['solid',500,500],['text',700,300],['border',200,800]])rows.push({name:'color/category/'+family+'/'+role,Light:family+'/'+l,Dark:family+'/'+d,description:role+' treatment for categorical tags, badges and chart series.'});
 const overrides=r.overrides||{};
 for(const row of rows){
  const name=row.name,override=overrides[name];if(override&&Object.keys(override).some(m=>!modes.includes(m)))throw new Error(name+': override has an unselected mode.');
  const values=Object.fromEntries(modes.map(mode=>[mode,alias(override?.[mode]||'palette/'+row[mode])]));
  b.semantic(name,'Color','COLOR',values,row.description,name.startsWith('color/text/')?['TEXT_FILL']:['FRAME_FILL','SHAPE_FILL','STROKE_COLOR']);
 }
 if(Object.keys(overrides).some(name=>!rows.some(r=>r.name===name)))throw new Error('Unknown color override; use explicit extra definitions for new roles.');
}
function typographyRecipe(b,r){
 strict(r,['families','faces','display','code','rows','weights','extra'],'typography recipe');
 if(!named(r.families?.ui))throw new Error('Select a source-backed UI font.');
 if(r.faces!==undefined){strict(r.faces,Object.keys(r.families),'family face');for(const face of Object.values(r.faces))strict(face,['regular','medium','semibold','bold'],'font face');}
 for(const [role,family]of Object.entries(r.families))b.scalar('font/family/'+role,'Typography',family,'Typeface for '+role+' content.','font-family',['FONT_FAMILY']);
 const weightValues={regular:400,medium:500,semibold:600,bold:700},weightNames={regular:'Regular',medium:'Medium',semibold:'Semi Bold',bold:'Bold',...(r.weights||{})};
 const rows=r.rows||defaults.typography.filter(row=>(row.role!=='display'||r.display===true)&&(row.role!=='code'||r.code===true));
 for(const row of rows){
  strict(row,['role','size','fontSize','lineHeight','letterSpacing','weights','family'],'type scale row');
  const key=row.role+'-'+row.size,familyRole=row.family||((row.role==='display'||row.role==='heading'&&r.faces?.display)&&r.families.display?'display':row.role==='code'?'mono':'ui'),family=r.families[familyRole];
  if(!named(family))throw new Error('Missing family for '+row.role);
  b.scalar('font/size/'+key,'Typography',row.fontSize,'Text size for '+row.role+' '+row.size+'.','font-size',['FONT_SIZE']);
  b.scalar('font/line-height/'+key,'Typography',row.lineHeight,'Line height for '+row.role+' '+row.size+'.','line-height',['LINE_HEIGHT']);
  // Figma binds letter spacing in pixels, so percent tracking is converted per size.
  const tracking='font/letter-spacing/'+key,trackingPx=Math.round((row.letterSpacing||0)*row.fontSize)/100||0;
  b.scalar(tracking,'Typography',trackingPx,'Tracking in pixels for '+row.role+' '+row.size+' ('+(row.letterSpacing||0)+'% of '+row.fontSize+'px).','letter-spacing',['LETTER_SPACING']);
  const faces=r.faces?.[familyRole];
  if(faces&&(!Object.keys(faces).length||Object.entries(faces).some(([weight,style])=>!weightValues[weight]||!named(style))))throw new Error('Record exact supported faces for '+familyRole);
  const available=faces?Object.keys(faces):Object.keys(weightNames);
  const weights=r.rows?row.weights:[...new Set(row.weights.map(weight=>faces&&!faces[weight]?available.reduce((a,b)=>Math.abs(weightValues[b]-weightValues[weight])<Math.abs(weightValues[a]-weightValues[weight])?b:a):weight))];
  for(const weight of weights){
   if(faces&&!faces[weight])throw new Error('The supplied type row requests an undeclared face: '+familyRole+'/'+weight);
   if(!weightValues[weight])throw new Error('Unsupported numeric weight: provide explicit typography definitions.');
   if(!b.data.variables.some(v=>v.name==='font/weight/'+weight))b.scalar('font/weight/'+weight,'Typography',weightValues[weight],'Weight for '+weight+' interface text.','font-weight',['FONT_WEIGHT']);
   b.data.textStyles.push({name:'type/'+row.role+'/'+row.size+'/'+weight,fontFamily:family,fontStyle:faces?.[weight]??weightNames[weight],fontSize:row.fontSize,lineHeight:{unit:'PIXELS',value:row.lineHeight},letterSpacing:{unit:'PIXELS',value:trackingPx},bound:{fontFamily:'font/family/'+familyRole,fontSize:'font/size/'+key,lineHeight:'font/line-height/'+key,letterSpacing:tracking,fontWeight:'font/weight/'+weight}});
  }
 }
 b.scalar('font/size/input-min','Typography',16,'Minimum mobile input value text size to prevent focus zoom.','font-size',['FONT_SIZE']);
}
const sizes={control:{xs:32,sm:36,md:40,lg:44,xl:48},icon:{xs:12,sm:16,md:20,lg:24,xl:32},avatar:{'2xs':16,xs:24,sm:32,md:40,lg:48,xl:56,'2xl':64},indicator:{xs:6,sm:8,md:10,lg:12},track:{sm:4,md:6,lg:8},width:{xxs:320,xs:384,sm:480,md:560,lg:640,xl:768,'2xl':1024,'3xl':1280,'4xl':1440,'5xl':1600,'6xl':1920},container:{max:1280,'margin-mobile':16,'margin-desktop':32},measure:{reading:640}};
function spaceRecipe(b,r,platform){
 strict(r,['base','values','sizes','grids','extra'],'space recipe');const base=r.base??4;if(!Number.isFinite(base)||base<=0)throw new Error('Invalid spacing base.');
 for(const [name,value]of Object.entries({...Object.fromEntries(Object.entries(defaults.space).map(([k,v])=>[k,v*base/4])),...(r.values||{})}))b.scalar(name,'Space',value,'Gap or padding at the '+name.split('/').at(-1)+' step of the spacing scale.','space',['GAP']);
 const entries={'size/touch-min':44,...(platform.includes('App')?{'size/touch-min-android':48}:{}),...Object.fromEntries(Object.entries(sizes).flatMap(([group,steps])=>Object.entries(steps).map(([step,v])=>['size/'+group+'/'+step,v]))),...(r.sizes||{})};
 for(const [name,value]of Object.entries(entries))b.scalar(name,'Size',value,'Shared '+name.slice(5).replaceAll('/',' ')+' dimension for interface layouts.','size',['WIDTH_HEIGHT']);
 b.data.gridStyles.push(...(r.grids||[]));
}
function elevationRecipe(b,r,{focusWidth=2,hasDanger=true}={}){
 strict(r,['treatment','styles','extra'],'elevation recipe');if(r.styles){b.data.effectStyles.push(...r.styles);return;}
 if(!['layered','flat','none'].includes(r.treatment))throw new Error('Choose layered/flat depth or provide explicit effect styles.');
 const shadow=(y,blur,spread,color)=>({type:'DROP_SHADOW',offset:{x:0,y},radius:blur,spread,color:alias('color/'+color)});
 const control=r.treatment!=='layered'?[]:[shadow(1,2,0,'shadow/ambient')];
 for(const [name,effects]of Object.entries(r.treatment==='none'?{}:{control,raised:r.treatment==='flat'?[]:[...control,shadow(1,3,0,'shadow/key')],overlay:r.treatment==='flat'?[shadow(4,8,0,'shadow/ambient')]:[shadow(12,16,-4,'shadow/key'),shadow(4,6,-2,'shadow/ambient')],modal:r.treatment==='flat'?[shadow(8,24,0,'shadow/ambient')]:[shadow(20,24,-4,'shadow/key'),shadow(8,8,-4,'shadow/ambient')]}))if(effects.length)b.data.effectStyles.push({name:'elevation/'+name,effects});
 for(const tone of ['default',...(hasDanger?['danger']:[])]){
  const effects=[shadow(0,0,2,'surface/base'),shadow(0,0,2+focusWidth,tone==='default'?'border/focus':'border/danger')];
  b.data.effectStyles.push({name:'focus/'+tone,effects},{name:'focus/'+tone+'/control',effects:[...effects,...control]});
 }
}
export function compileDomain(domain,recipe,{platform,modes,dependencies}){
 const b=builder(platform);
 if(domain==='color')colorRecipe(b,recipe,modes);
 if(domain==='typography')typographyRecipe(b,recipe);
 if(domain==='space')spaceRecipe(b,recipe,platform);
 if(domain==='shape'){
  strict(recipe,['preset','values','extra'],'shape recipe');
  if(recipe.preset&&!['square','soft'].includes(recipe.preset))throw new Error('Use square or soft radius preset.');
  for(const [name,row]of Object.entries(defaults.shape))b.scalar(name,'Shape',recipe.values?.[name]??(recipe.preset==='square'&&name.startsWith('radius/')&&name!=='radius/full'?0:row.value),row.description,name.startsWith('radius/')?'radius':'border-width',name.startsWith('radius/')?['CORNER_RADIUS']:['STROKE_FLOAT']);
  if(Object.keys(recipe.values||{}).some(n=>!defaults.shape[n]))throw new Error('Unknown shape role; use extra definitions.');
 }
 if(domain==='motion'){
  strict(recipe,['values','extra'],'motion recipe');
  for(const [name,row]of Object.entries(defaults.motion)){
   const raw=recipe.values?.[name]||{Standard:row.Standard,Reduced:row.Reduced},dimension=name.split('/')[1],type=dimension==='easing'?'EASING':'TIMING';
   if(!raw||Object.keys(raw).length!==2||!Object.hasOwn(raw,'Standard')||!Object.hasOwn(raw,'Reduced'))throw new Error(name+': provide Standard and Reduced recipe values.');
   const values=Object.fromEntries(Object.entries(raw).map(([mode,value])=>{
    if(type==='EASING')return [mode,nativeEasing(value)];
    if(!validTiming(value))throw new Error(name+': timing recipe needs nonnegative milliseconds.');
    return [mode,value/1000];
   }));
   b.scalar(name,'Motion',values.Standard,row.description,dimension,[],values,type);
  }
  if(Object.keys(recipe.values||{}).some(n=>!defaults.motion[n]))throw new Error('Unknown motion role; use extra definitions.');
 }
 if(domain==='elevation')elevationRecipe(b,recipe,dependencies);
 if(recipe.extra){strict(recipe.extra,['collections','variables','textStyles','effectStyles','gridStyles'],'extra definitions');for(const key of Object.keys(b.data))b.data[key].push(...(recipe.extra[key]||[]));}
 return b.data;
}
export function validateCoverage(pack,coverage,{allowUnreadable=false}={}){
 if(!Array.isArray(coverage)||coverage.length!==pack.sources.length||new Set(coverage.map(r=>r.path)).size!==coverage.length)throw new Error('Account for every source exactly once before questions or compilation.');
 for(const source of pack.sources){const receipt=coverage.find(r=>r.path===source.path);if(receipt?.hash!==source.hash||!['read','inspected','imported','archived',...(allowUnreadable?['unreadable']:[])].includes(receipt.status)||source.extraction.requiresInspection&&receipt.status==='read'||receipt.status==='archived'&&!source.archive||source.extraction.requiresInspection&&!named(receipt.note))throw new Error(source.path+': missing extraction/inspection/import receipt.');}
}
export function validateDecisionPack(decision,request,pack){
 strict(decision,['format','inputHash','inputRevision','product','systemMode','naming','decisions','coverage','domains','frozenSource','modes'],'decision pack');
 if(decision.format!=='ds-create/foundation-decisions@1'||decision.inputHash!==request.inputHash||decision.inputRevision!==request.inputRevision)throw new Error('Decision pack does not match this request.');
 validateCoverage(pack,decision.coverage);
 const locked=lockedFacts(request);
 if(locked.platform&&decision.product?.platform!==locked.platform)throw new Error('Platform is already selected in Builder. Resolve any source conflict through questions.');
 if(!['new','existing'].includes(decision.systemMode)||!['keep','normalize'].includes(decision.naming))throw new Error('Record system and naming decisions.');
 if(decision.systemMode==='new'&&decision.frozenSource)throw new Error('Frozen imports require an existing system.');
 if(!Array.isArray(decision.decisions)||!decision.decisions.length)throw new Error('Record source-backed design decisions.');
 strict(decision.domains,domainNames,'domain');
 for(const domain of domainNames){const entry=decision.domains?.[domain];if(!entry||!['included','excluded'].includes(entry.status))throw new Error('Account for '+domain);strict(entry,entry.status==='included'?['status','recipe','names']:['status','reason','source'],'domain scope');if(entry.status==='excluded'&&(!named(entry.reason)||!request.inputSnapshot.some(s=>s.path===entry.source)))throw new Error('Exclusion needs a source and reason.');}
 return locked;
}
export function assembleFoundations(decision,request,pack,parts,frozen=null,revision=1){
 const locked=validateDecisionPack(decision,request,pack),draft={...(frozen||{}),format:'ds-create/foundations@1',revision};
 for(const list of ['collections','variables','textStyles','effectStyles','gridStyles']){
  const found=new Map((frozen?.[list]||[]).map(x=>[x.name,x]));
  for(const part of Object.values(parts))for(const item of part[list]||[]){const old=found.get(item.name);if(old&&JSON.stringify(old)!==JSON.stringify(item))throw new Error('Conflicting or frozen definition '+item.name);found.set(item.name,item);}
  draft[list]=[...found.values()];
 }
 const domains={};for(const id of domainNames){const scope=decision.domains[id];domains[id]=scope.status==='excluded'?scope:{status:'included',variables:draft.variables.filter(v=>roles[id].includes(v.collection)||id==='color'&&v.type==='COLOR'&&v.collection==='Primitives').map(v=>v.name),styles:(draft[styles[id]]||[]).map(s=>s.name)};
  if(frozen&&scope.names)domains[id]={status:'included',variables:scope.names.variables,styles:scope.names.styles};
 }
 const decisions=[...decision.decisions];
 if(locked.source){for(const [key,value]of [['projectName',locked.projectName],['platform',locked.platform],['modes',locked.modes?.join(', ')]])if(value)decisions.push({key,value,decidedBy:'user',source:locked.source});}
 if(decision.systemMode==='new')decisions.push({key:'iconography',value:'Lucide',decidedBy:'AI',source:request.contextFile||request.inputSnapshot[0]?.path,reason:'Canonical new-system UI icon baseline.'});
 const plan={format:'ds-create/foundation-plan@1',inputHash:request.inputHash,inputRevision:request.inputRevision,projectName:request.projectName,product:decision.product,systemMode:decision.systemMode,naming:decision.naming,decisions,domains,...(decision.systemMode==='new'?{motionPolicy:'basic-ui'}:{})};
 const check=validatePlan(plan,draft,{hash:request.inputHash,files:request.inputSnapshot},request.inputRevision);
 if(locked.modes&&draft.collections.some(c=>c.name==='Color'&&JSON.stringify(c.modes)!==JSON.stringify(locked.modes)))check.errors.push('Color modes differ from Builder selections.');
 if(check.errors.length)throw new Error(check.errors.slice(0,30).join('\n'));
 return {draft,plan};
}
