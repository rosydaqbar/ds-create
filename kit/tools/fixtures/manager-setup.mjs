import { mkdtemp, mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createManagerServer } from '../../manager/server.mjs';
import { colors, values, effects } from '../../web/scripts/chrome-fallbacks.mjs';

// Small synthetic data to exercise the handoff; not a design-system generator.
export const setupDraft = {format:'ds-create/foundations@1',revision:1,collections:[{name:'Primitives',modes:['Value']},{name:'Color',modes:['Light']},...['Typography','Space','Shape','Motion'].map(name=>({name,modes:['Value']}))],variables:[
  {name:'palette/base/white',collection:'Primitives',type:'COLOR',values:{Value:'#ffffff'}},
  {name:'color/surface/base',collection:'Color',type:'COLOR',values:{Light:{alias:'palette/base/white'}}},
  {name:'font/family/ui',collection:'Typography',type:'STRING',values:{Value:'Inter'}},
  {name:'space/xs',collection:'Space',type:'FLOAT',values:{Value:4}},
  {name:'radius/control',collection:'Shape',type:'FLOAT',values:{Value:8}},
  {name:'motion/duration/base',collection:'Motion',type:'FLOAT',values:{Value:200}},
  {name:'motion/easing/standard',collection:'Motion',type:'STRING',values:{Value:'cubic-bezier(0.2, 0, 0, 1)'}}
],textStyles:[{name:'body/md',fontFamily:'Inter',fontStyle:'Regular',fontSize:16,lineHeight:{unit:'PIXELS',value:24}}],effectStyles:[{name:'elevation/sm',effects:[{type:'DROP_SHADOW',color:'#000000',opacity:0.1,offset:{x:0,y:1},radius:3,spread:0}]}]};
// A deliberately small but structurally real new-system fixture: every semantic is aliased.
for(const v of [...setupDraft.variables])if(v.collection!=='Primitives' && v.name!=='color/surface/base'){
 const name='scale/'+v.name;
 setupDraft.variables.unshift({name,collection:'Primitives',type:v.type,values:{Value:v.values.Value}});
 v.values={Value:{alias:name}};
}
for(const v of setupDraft.variables){
 if(v.collection!=='Primitives')v.description='Synthetic UI purpose for '+v.name;
 else v.hiddenFromPublishing=true;
 v.scopes=v.collection==='Color'?['FRAME_FILL','SHAPE_FILL']:v.collection==='Typography'?['FONT_FAMILY']:v.collection==='Space'?['GAP']:v.collection==='Shape'?['CORNER_RADIUS']:[];
 v.codeSyntax={WEB:`var(--${v.name.replaceAll('/','-')})`};
}
setupDraft.textStyles[0].name='type/body/md/regular';
// Realistic synthetic baseline for the process contract; the small setupDraft above remains useful for unit tests.
const preparedSetupDraft=structuredClone(setupDraft);
preparedSetupDraft.collections.find(c=>c.name==='Motion').modes=['Standard','Reduced'];
preparedSetupDraft.variables=preparedSetupDraft.variables.filter(v=>!v.name.startsWith('motion/'));
for(const [name,value]of Object.entries({'duration/instant':0,'duration/fast':120,'duration/base':200,'duration/slow':300,'duration/loop':900,'easing/standard':'cubic-bezier(0.2, 0, 0, 1)','easing/enter':'cubic-bezier(0, 0, 0.2, 1)','easing/exit':'cubic-bezier(0.4, 0, 1, 1)','easing/linear':'linear','delay/tooltip':400,'delay/toast':5000,'delay/debounce':250})){
 const type=typeof value==='number'?'FLOAT':'STRING', reduced=['duration/base','duration/slow'].includes(name)?0:name==='duration/loop'?1800:value, refs={};
 for(const [mode,val]of Object.entries({Standard:value,Reduced:reduced})){
  const primitive='scale/motion/'+name.replaceAll('/','-')+'-'+mode.toLowerCase();refs[mode]={alias:primitive};
  preparedSetupDraft.variables.push({name:primitive,collection:'Primitives',type,values:{Value:val},hiddenFromPublishing:true,scopes:[],codeSyntax:{WEB:'var(--'+primitive.replaceAll('/','-')+')'}});
 }
 const token='motion/'+name;preparedSetupDraft.variables.push({name:token,collection:'Motion',type,values:refs,description:'Synthetic UI motion purpose for '+name,scopes:[],codeSyntax:{WEB:'var(--'+token.replaceAll('/','-')+')'}});
}
export const setupAgent = `
const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 let prompt='';for await(const c of process.stdin)prompt+=c;
 const result=process.argv[process.argv.indexOf('--output-last-message')+1];
 const r=JSON.parse(await fs.readFile(path.join(path.dirname(result),'request.json'),'utf8'));
 const mode=await fs.readFile(path.join(r.outputDir,'fake-mode'),'utf8').catch(()=>'success');
 await fs.writeFile(path.join(r.outputDir,'received-prompt'),prompt);
 if(mode.startsWith('progress')){
  console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'DS_CREATE_STAGE: foundation'}}));
  console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'Reading your saved brand brief and context.'}}));
  console.log(JSON.stringify({type:'item.completed',item:{type:'command_execution',command:'cat private/source.txt',status:'completed',exit_code:0,aggregated_output:'PRIVATE RAW OUTPUT'}}));
  console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'The supplied palette and typography choices are recorded. Preparing the local draft.'}}));
  if(mode==='progress-hang'){setInterval(()=>{},1000);return;}
 }
 if(mode==='hang'){setInterval(()=>{},1000);return;}
 await new Promise(resolve=>setTimeout(resolve,['slow','progress'].includes(mode)?2000:80));
 if(mode==='fail')process.exit(2);
 if(mode==='blocked'){await fs.writeFile(result,JSON.stringify({status:'blocked',message:'Sign in to your local Codex CLI, then retry.',questions:[]}));return;}
 if(mode==='questions'&&!r.answerFile){await fs.writeFile(result,JSON.stringify({status:'questions',message:'Choose the product platform and UI font.',questions:[{id:'platform',prompt:'Which platforms should this system support?',options:['Web','App','Web and App']},{id:'font',prompt:'Which UI font should we use?',options:['Inter','Geist','Plus Jakarta Sans']}]}));return;}
 if(mode==='bad-questions'){await fs.writeFile(result,JSON.stringify({status:'questions',message:'Question',questions:[{id:'same',prompt:'One',options:[]},{id:'same',prompt:'Two',options:[]}]}));return;}
 if(mode!=='empty'){
  const input=path.join(r.workspace,'workspace/input',r.inputSlug || r.slug);
  await fs.mkdir(path.join(input,'answers'),{recursive:true});await fs.mkdir(path.join(r.outputDir,'reports'),{recursive:true});
  await fs.writeFile(path.join(input,'answers/01-init.md'),'Synthetic answers; Web; Inter, chosen by user.');
  await fs.writeFile(path.join(input,'sources.md'),'Synthetic input manifest '+r.inputFiles.join(', '));
  await fs.writeFile(path.join(r.outputDir,'reports/init.md'),'Simulation: awaiting review. Figma not generated.');
  const draft=${JSON.stringify(preparedSetupDraft)};
  if(mode==='alias')draft.variables[1].values.Light.alias='missing/primitive';
  if(mode==='missing-dark'){draft.collections.find(c=>c.name==='Color').modes.push('Dark');}
  if(mode==='wrong-float'){draft.variables.find(v=>v.name==='scale/space/xs').values.Value='not-a-number';}
  await fs.writeFile(path.join(r.outputDir,'foundations.json'),JSON.stringify(draft));
  const domains={};
  for(const [id,prefixes,styles] of [['color',['palette/','color/'],[]],['typography',['font/'],draft.textStyles.map(s=>s.name)],['space',['space/'],[]],['shape',['radius/'],[]],['elevation',[],draft.effectStyles.map(s=>s.name)],['motion',['motion/'],[]]])domains[id]={status:'included',variables:draft.variables.filter(v=>prefixes.some(p=>v.name.startsWith(p))).map(v=>v.name),styles};
  if(mode!=='no-plan')await fs.writeFile(path.join(r.outputDir,'foundation-plan.json'),JSON.stringify({format:'ds-create/foundation-plan@1',...(mode==='no-motion-policy'?{}:{motionPolicy:'basic-ui'}),projectName:mode==='wrong-name'?'Different project':r.projectName,inputHash:r.inputHash,inputRevision:r.inputRevision,product:{name:'Synthetic setup fixture',description:'A synthetic test product',platform:'Web'},systemMode:'new',naming:'normalize',domains,decisions:[{key:'platform',value:'Web',decidedBy:'user',source:r.contextFile}]}));
  await fs.writeFile(path.join(r.outputDir,'ds-create-ledger.json'),JSON.stringify({system:mode==='wrong-name'?'Different project':r.projectName,preview:true,scope:{productType:'Web'},sequence:[1,2,3,4].map(step=>({step,status:step===1?'done':'todo'})),foundationReview:{status:'pending'}}));
 }
 await fs.writeFile(result,JSON.stringify({status:'ready',message:'Simulated local draft.',questions:[]}));
})();`;
export async function setupFixture({mode='success',timeoutMs=10000,agentCommand,port=0}={}) {
 const root=await mkdtemp(path.join(tmpdir(),'ds-setup-test-')),output=path.join(root,'workspace/output/fixture');
 await mkdir(path.join(output,'manager'),{recursive:true});
 await cp(fileURLToPath(new URL('../../manager/',import.meta.url)),path.join(output,'manager'),{recursive:true});
 await cp(fileURLToPath(new URL('../../web/src/styles/docs-presentation.css',import.meta.url)),path.join(output,'manager/docs-presentation.css'));
 await writeFile(path.join(output,'manager/chrome.css'),':root{'+[...colors,...values,...effects].map(([k,v])=>k+':'+v+';').join('')+'}');
 await writeFile(path.join(output,'manager/setup.json'),JSON.stringify({format:'ds-create/setup@1',status:'empty'}));
 await writeFile(path.join(output,'fake-mode'),mode);
 const program=path.join(root,'fake-agent.cjs');await writeFile(program,setupAgent);
 const setupOptions={agentCommand:agentCommand || process.execPath,agentPrefixArgs:[program],simulation:true,timeoutMs};
 const {server,setup,jobs}=createManagerServer({outputDir:output,workspace:root,setupOptions,jobsOptions:{agentCommand:process.execPath,simulation:true}});
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port,flow=()=>fetch(url+'/api/setup-flow').then(r=>r.json()),initial=await flow();
 const headers={Origin:url,'X-DS-Create-Token':initial.csrfToken};
 const post=(endpoint,body,override={})=>fetch(url+endpoint,{method:'POST',headers:{...headers,...(body instanceof FormData?{}:{'Content-Type':'application/json'}),...override},body:body instanceof FormData?body:JSON.stringify(body)});
 const form=(context='A synthetic product brief.',files=[],projectName='Synthetic setup fixture')=>{const f=new FormData();f.set('projectName',projectName);f.set('context',JSON.stringify(context));for(const [name,bytes]of files)f.append('files',new Blob([bytes]),name);return f;};
 return {root,output,url,setup,jobs,flow,post,form,initial,setupOptions,async cleanup(){await Promise.allSettled([setup.shutdown(),jobs.shutdown()]);await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}};
}
