import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import {StdioClientTransport} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import {setupFixture,preparedSetupDraft} from './fixtures/manager-setup.mjs';
import {createSetupJobs} from '../manager/setup-jobs.mjs';
import {preparationTasks} from '../manager/preparation.mjs';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
async function fixture(t){const f=await setupFixture({runner:'mcp'});t.after(()=>f.cleanup());return f;}
async function client(t,f){
 const c=new Client({name:'generic-mcp-client',version:'1.0.0'}),transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./ds-create-mcp.mjs',import.meta.url)),'--workspace',f.root]});await c.connect(transport);t.after(()=>c.close());
 return {c,transport,call:(name,args)=>c.callTool({name,arguments:args}),async good(name,args){const r=await this.call(name,args);assert.notEqual(r.isError,true,r.content?.[0]?.text);return r.structuredContent;}};
}
const creds=r=>({session:'fixture',job_id:r.job_id,attempt:r.attempt,lease:r.lease});
async function submit(f){const r=await f.post('/api/setup-submit',f.form('A synthetic product for test users.',[['brief.txt','original source']]));assert.equal(r.status,202);return r.json();}
async function until(f,status){for(let i=0;i<100;i++){const r=await f.flow();if(r.status===status)return r;await new Promise(r=>setTimeout(r,20));}throw new Error('Preparation did not become '+status);}
async function artifacts(f,r,mutation){
 const req=await json(path.join(f.output,'manager/setup-jobs',r.job_id,'request.json')),input=path.join(f.root,'workspace/input',req.inputSlug),draft=structuredClone(preparedSetupDraft);
 await mkdir(path.join(input,'answers'),{recursive:true});await mkdir(path.join(f.output,'reports'),{recursive:true});
 await writeFile(path.join(input,'answers/01-init.md'),'Synthetic decisions: Web, user-selected fixture choices.');await writeFile(path.join(input,'sources.md'),req.inputFiles.join('\n'));
 await writeFile(path.join(f.output,'reports/init.md'),'Synthetic preparation fixture; pending user review and Figma.');
 const domains={};for(const [id,prefixes,styles]of [['color',['palette/','color/'],[]],['typography',['font/'],draft.textStyles.map(s=>s.name)],['space',['space/'],[]],['shape',['radius/'],[]],['elevation',[],draft.effectStyles.map(s=>s.name)],['motion',['motion/'],[]]])domains[id]={status:'included',variables:draft.variables.filter(v=>prefixes.some(p=>v.name.startsWith(p))).map(v=>v.name),styles};
 const plan={format:'ds-create/foundation-plan@1',motionPolicy:'basic-ui',projectName:req.projectName,inputHash:req.inputHash,inputRevision:req.inputRevision,product:{name:'Synthetic product',description:'A synthetic product for test users',platform:'Web'},systemMode:'new',naming:'normalize',domains,decisions:[{key:'platform',value:'Web',decidedBy:'user',source:req.contextFile}]};
 if(mutation==='alias')draft.variables.find(v=>v.name==='color/surface/base').values.Light={alias:'missing'};
 if(mutation==='motion')delete plan.motionPolicy;
 await writeFile(path.join(f.output,'foundations.json'),JSON.stringify(draft));await writeFile(path.join(f.output,'foundation-plan.json'),JSON.stringify(plan));
 await writeFile(path.join(f.output,'ds-create-ledger.json'),JSON.stringify({system:req.projectName,preview:true,scope:{productType:'Web'},sequence:[1,2,3,4].map(step=>({step,status:step===1?'done':'todo'})),foundationReview:{status:'pending'}}));
 return req;
}

test('default preparation queues without any executable, stays Waiting, saves original uploads and can stop before claim',async t=>{
 const f=await fixture(t),setup=createSetupJobs({outputDir:f.output,workspace:f.root,agentCommand:'/no/agent-installed'});
 const r=await setup.submit(f.form('A synthetic product.',[['brief.txt','original source']]));assert.equal(r.status,'queued');
 const status=await setup.status();assert.equal(status.runner,'mcp');assert.equal(status.available,true);assert.equal(status.canStop,true);assert.ok(preparationTasks(status).every(t=>t.status==='waiting'));
 const req=await json(path.join(f.output,'manager/setup-jobs',r.jobId,'request.json'));assert.equal(req.program,null);assert.equal(req.runner,'mcp');
 assert.equal(await readFile(path.join(f.root,'workspace/input',status.inputSlug,status.files[0].path),'utf8'),'original source');await assert.rejects(access(path.join(f.output,'received-prompt')));
 assert.equal((await setup.cancel()).stopped,true);assert.equal((await setup.status()).status,'cancelled');
});
test('generic wire workflow: exclusive claim, public progress, durable questions/answers, validated draft and no Figma completion',async t=>{
 const f=await fixture(t),a=await client(t,f),b=await client(t,f);await submit(f);
 const r=await a.good('ds_create_prepare',{session:'fixture'});assert.equal(r.status,'running');assert.equal((await a.good('ds_create_prepare',{session:'fixture'})).lease,r.lease);
 assert.equal((await b.call('ds_create_prepare',{session:'fixture'})).isError,true);assert.equal((await b.call('ds_create_prepare_progress',{...creds(r),message:'Spoof'})).isError,true);
 await a.good('ds_create_prepare_progress',{...creds(r),stage:'decisions',message:'The product context is saved; the platform needs a choice.'});
 let flow=await f.flow();assert.equal(flow.progress.stage,'decisions');assert.ok(flow.progress.activity.some(a=>a.text.includes('platform needs')));
 await f.setup.shutdown();assert.equal((await f.flow()).status,'running','viewer shutdown leaves MCP connection alone');
 await a.good('ds_create_prepare_finish',{...creds(r),outcome:'questions',message:'Choose platform.',questions:[{id:'platform',prompt:'Which platform?',options:['Web','App']}]});
 flow=await f.flow();assert.equal(flow.status,'questions');assert.equal(flow.questions[0].id,'platform');assert.equal((await fetch(f.url+'/api/publish-flow').then(r=>r.json())).figma.canStart,false);
 assert.equal((await f.post('/api/setup-answers',{jobId:r.job_id,answers:[{id:'platform',value:'Web'}]})).status,202);
 flow=await f.flow();assert.equal(flow.status,'queued');assert.notEqual(flow.jobId,r.job_id);assert.equal(flow.inputRevision,2);
 assert.equal((await a.call('ds_create_prepare_progress',{...creds(r),message:'Old attempt'})).isError,true);
 const next=await b.good('ds_create_prepare',{session:'fixture'}),req=await artifacts(f,next);
 assert.match(await readFile(path.join(f.root,'workspace/input',req.inputSlug,req.answerFile),'utf8'),/Web/);
 assert.equal((await b.good('ds_create_prepare_finish',{...creds(next),outcome:'ready',message:'Fixture ready.'})).status,'ready');
 assert.equal((await f.flow()).status,'ready');const state=await fetch(f.url+'/api/state').then(r=>r.json());assert.equal(state.initDone,false);assert.equal(state.source.review,'pending');assert.equal((await fetch(f.url+'/api/publish-flow').then(r=>r.json())).figma.canStart,true);
});
test('ready text, invalid aliases and omitted mandatory motion cannot fake preparation readiness',async t=>{
 for(const mutation of ['missing','alias','motion']){const f=await fixture(t),a=await client(t,f);await submit(f);const r=await a.good('ds_create_prepare',{session:'fixture'});if(mutation!=='missing')await artifacts(f,r,mutation);
  assert.equal((await a.good('ds_create_prepare_finish',{...creds(r),outcome:'ready',message:'Ready'})).status,'failed',mutation);assert.equal((await f.flow()).status,'failed');assert.equal((await fetch(f.url+'/api/publish-flow').then(r=>r.json())).figma.canStart,false);
 }
});
test('claimed cancellation requires owner acknowledgement and old lease cannot affect retry',async t=>{
 const f=await fixture(t),a=await client(t,f);await submit(f);const r=await a.good('ds_create_prepare',{session:'fixture'});
 assert.equal((await a.good('ds_create_prepare_cancel',{session:'fixture'})).requested,true);assert.equal((await f.flow()).status,'running');assert.equal((await a.good('ds_create_prepare_progress',{...creds(r),message:'Check stop'})).cancelRequested,true);
 assert.equal((await a.call('ds_create_prepare_finish',{...creds(r),outcome:'ready',message:'Fake'})).isError,true);
 await a.good('ds_create_prepare_finish',{...creds(r),outcome:'cancelled',message:'Stopped local work.'});assert.equal((await f.flow()).status,'cancelled');
 await f.post('/api/setup-retry',{});assert.equal((await a.call('ds_create_prepare_progress',{...creds(r),message:'Stale'})).isError,true);
});
test('disconnect and abrupt process termination mark only owned preparation blocked without losing context',async t=>{
 for(const abrupt of [false,true]){const f=await fixture(t),a=await client(t,f);await submit(f);await a.good('ds_create_prepare',{session:'fixture'});const before=(await f.flow()).context;
  if(abrupt)process.kill(a.transport.pid,'SIGKILL');else await a.c.close();const r=await until(f,'blocked');assert.equal(r.context,before);assert.equal(r.canRetry,true);assert.equal(r.canStop,false);
 }
});
test('input changes, traversal, extra vendor fields and malformed questions are rejected without marking ready',async t=>{
 const f=await fixture(t),a=await client(t,f);await submit(f);
 assert.equal((await a.call('ds_create_prepare',{session:'../escape'})).isError,true);assert.equal((await a.call('ds_create_prepare',{session:'fixture',agent:'vendor-name'})).isError,true);
 const r=await a.good('ds_create_prepare',{session:'fixture'});
 assert.equal((await a.call('ds_create_prepare_finish',{...creds(r),outcome:'questions',message:'Bad',questions:[{id:'same',prompt:'One',options:[]},{id:'same',prompt:'Two',options:[]}]})).isError,true);
 const flow=await f.flow();await writeFile(path.join(f.root,'workspace/input',flow.inputSlug,'new-rule.md'),'new input');
 assert.equal((await a.call('ds_create_prepare_progress',{...creds(r),message:'Before writing'})).isError,true);
 assert.equal((await a.good('ds_create_prepare_finish',{...creds(r),outcome:'blocked',message:'Context changed; no further writes.'})).status,'blocked');
});
