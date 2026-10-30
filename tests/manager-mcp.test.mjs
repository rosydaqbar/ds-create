import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Client} from '../kit/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import {StdioClientTransport} from '../kit/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import {createFigmaJobs} from '../kit/manager/server/publish.mjs';
import {publishFixture} from './fixtures/manager-publish.mjs';

const target='https://www.figma.com/design/Fixture/Test';
const entry=fileURLToPath(new URL('../kit/mcp/server.mjs',import.meta.url));
const json=async file=>JSON.parse(await readFile(file,'utf8'));
async function fixture(t){const f=await publishFixture({autoRun:false});t.after(()=>f.cleanup());return f;}
async function client(t,f){
 const c=new Client({name:'independent-sdk-client',version:'1.0.0'}),transport=new StdioClientTransport({command:process.execPath,args:[entry,'--workspace',f.root],stderr:'pipe'});
 transport.stderr?.on('data',()=>{});await c.connect(transport);t.after(()=>c.close());
 return {c,transport,call:(name,args)=>c.callTool({name,arguments:args}),async good(name,args){const r=await this.call(name,args);assert.notEqual(r.isError,true,r.content?.[0]?.text);return r.structuredContent;}};
}
const creds=r=>({session:'fixture',job_id:r.job_id,attempt:r.attempt,lease:r.lease});
async function queue(f){const r=await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:target});assert.equal(r.status,202);return r.json();}
async function awaitJob(f,status){for(let i=0;i<100;i++){const r=await f.flow();if(r.job?.status===status)return r;await new Promise(r=>setTimeout(r,20));}throw new Error('Job did not become '+status);}

test('real SDK stdio lifecycle: portable tools, browser queue, exclusive lease, progress, unchanged approval and safe retry',async t=>{
 const f=await fixture(t),a=await client(t,f),b=await client(t,f);
 const tools=await a.c.listTools();assert.deepEqual(tools.tools.map(x=>x.name).sort(),['ds_create_prepare','ds_create_prepare_cancel','ds_create_prepare_compile','ds_create_prepare_finish','ds_create_prepare_progress','ds_create_prepare_status','ds_create_prepare_wait','ds_create_publish','ds_create_publish_cancel','ds_create_publish_finish','ds_create_publish_preflight','ds_create_publish_progress','ds_create_publish_status','ds_create_wait']);
 assert.equal((await a.good('ds_create_publish',{session:'fixture'})).status,'waiting');
 const queued=await queue(f),ledgerFile=path.join(f.output,'ds-create-ledger.json'),before=await readFile(ledgerFile,'utf8'),request=await readFile(path.join(f.output,'manager/jobs',queued.job.id,'request.json'),'utf8');
 assert.equal((await f.flow()).job.status,'queued');
 const r=await a.good('ds_create_publish',{session:'fixture'});assert.equal(r.status,'running');assert.equal(r.job_id,queued.job.id);
 const active=await f.flow();assert.equal(active.listener.connected,true);assert.deepEqual(active.listener.capabilities,['publish']);
 assert.equal((await fetch(f.url+'/api/worker').then(r=>r.json())).connected,false,'publication ownership does not advertise preparation delivery');
 assert.equal((await a.good('ds_create_publish',{session:'fixture'})).lease,r.lease,'retry on same connection reuses owner');
 assert.equal((await b.call('ds_create_publish',{session:'fixture'})).isError,true);
 assert.equal((await b.call('ds_create_publish_progress',{...creds(r),message:'Spoofed'})).isError,true,'another connection cannot use a leaked lease');
 await a.good('ds_create_publish_progress',{...creds(r),message:'Checking approved fonts.'});assert.equal((await f.flow()).job.message,'Checking approved fonts.');
 await a.good('ds_create_publish_finish',{...creds(r),outcome:'blocked',message:'Approved face unavailable.'});assert.equal((await f.flow()).build.available,false);
 const again=await queue(f);assert.equal(again.job.id,queued.job.id);assert.equal(await readFile(ledgerFile,'utf8'),before);assert.equal(await readFile(path.join(f.output,'manager/jobs',queued.job.id,'request.json'),'utf8'),request);
 assert.equal((await a.call('ds_create_publish_progress',{...creds(r),message:'Old attempt'})).isError,true);
});
test('Stop before claim fences delivery; after claim waits for safe cancellation acknowledgement',async t=>{
 const f=await fixture(t),a=await client(t,f);await queue(f);
 await f.post('/api/publish-cancel',{});assert.equal((await f.flow()).job.status,'cancelled');assert.equal((await a.good('ds_create_publish',{session:'fixture'})).status,'waiting');
 await queue(f);const r=await a.good('ds_create_publish',{session:'fixture'});
 assert.equal((await a.good('ds_create_publish_cancel',{session:'fixture'})).requested,true);assert.equal((await f.flow()).job.status,'running');
 assert.equal((await a.good('ds_create_publish_progress',{...creds(r),message:'Checking stop'})).cancelRequested,true);
 assert.equal((await a.call('ds_create_publish_finish',{...creds(r),outcome:'completed',message:'Fake'})).isError,true);
 await a.good('ds_create_publish_finish',{...creds(r),outcome:'cancelled',message:'Stopped safely.'});assert.equal((await f.flow()).job.status,'cancelled');
});
test('stdio disconnect releases only its owned attempt as blocked and preserves approval',async t=>{
 const f=await fixture(t),a=await client(t,f);await queue(f);await a.good('ds_create_publish',{session:'fixture'});
 const before=await readFile(path.join(f.output,'ds-create-ledger.json'),'utf8');await a.c.close();
 const done=await awaitJob(f,'blocked');assert.match(done.job.message,/disconnected/);assert.equal(done.build.available,false);assert.equal(await readFile(path.join(f.output,'ds-create-ledger.json'),'utf8'),before);
});
test('stale source, input, target, missing approval, traversal and unknown fields are rejected over the wire',async t=>{
 for(const mutation of ['source','input','target','approval']){
  const f=await fixture(t),a=await client(t,f);await queue(f);
  if(mutation==='source')await writeFile(path.join(f.output,'foundations.json'),'{}');
  if(mutation==='input')await writeFile(path.join(f.root,'workspace/input/fixture/new.md'),'new');
  if(['target','approval'].includes(mutation)){const p=path.join(f.output,'ds-create-ledger.json'),l=await json(p);if(mutation==='target')l.figma.url='https://www.figma.com/design/Other';else l.foundationReview.status='pending';await writeFile(p,JSON.stringify(l));}
  assert.equal((await a.call('ds_create_publish',{session:'fixture'})).isError,true,mutation);
 }
 const f=await fixture(t),a=await client(t,f);
 assert.equal((await a.call('ds_create_publish',{session:'../escape'})).isError,true);
 assert.equal((await a.call('ds_create_publish',{session:'fixture',command:'unexpected'})).isError,true);
 const outside=path.join(f.root,'workspace/output/escape');const {symlink}=await import('node:fs/promises');await symlink('/tmp',outside);
 assert.equal((await a.call('ds_create_publish_status',{session:'escape'})).isError,true);
});
test('completion text cannot fake success; only matching confirmed fixture output plus bound full audit unlocks build',async t=>{
 const f=await fixture(t),a=await client(t,f);await queue(f);let r=await a.good('ds_create_publish',{session:'fixture'});
 assert.equal((await a.good('ds_create_publish_finish',{...creds(r),outcome:'completed',message:'Trust me'})).status,'failed');assert.equal((await f.flow()).build.available,false);
 await queue(f);r=await a.good('ds_create_publish',{session:'fixture'});
 const draft=await json(path.join(f.output,'foundations.json'));await mkdir(path.join(f.output,'figma'),{recursive:true});
 await writeFile(path.join(f.output,'figma/figma-variables.json'),JSON.stringify({...draft,format:'ds-create/figma-variables@1'}));
 await writeFile(path.join(f.output,'figma/audit-file.json'),JSON.stringify({mode:'file',sourceHash:f.initial.figma.hash,result:{fail:0},simulation:true}));
 const file=path.join(f.output,'ds-create-ledger.json'),l=await json(file);l.sequence=l.sequence.map(e=>({...e,status:'done'}));l.foundationReview.figmaHash=f.initial.figma.hash;l.tokens={audit:{fail:0,file:'figma/audit-file.json'}};await writeFile(file,JSON.stringify(l));
 assert.equal((await a.good('ds_create_publish_finish',{...creds(r),outcome:'completed',message:'Fixture export and audit saved.'})).status,'succeeded');assert.equal((await f.flow()).build.available,true);
});
test('a pending MCP tool receives a new browser request without typing into another chat',async t=>{
 const f=await fixture(t),a=await client(t,f);const pending=a.good('ds_create_publish',{session:'fixture',wait_seconds:5});await new Promise(r=>setTimeout(r,100));await queue(f);
 const r=await pending;assert.equal(r.status,'running');await a.good('ds_create_publish_finish',{...creds(r),outcome:'cancelled',message:'Fixture done.'});
});

test('one pending Builder wait receives a Publish click; without it Builder offers the continuation prompt',async t=>{
 const f=await fixture(t),a=await client(t,f);
 const idle=await queue(f),before=await f.flow();assert.equal(before.job.status,'queued');
 assert.match(before.recoveryPrompt,/^Publish the approved foundations saved in Builder\.\nds-create init-web --slug fixture\nWorkspace: /);
 await f.post('/api/publish-cancel',{});
 const pending=a.good('ds_create_wait',{session:'fixture'});
 await new Promise(r=>setTimeout(r,300));
 const waiting=await f.flow();assert.equal(waiting.listener.connected,true);assert.deepEqual(waiting.listener.capabilities,['prepare','publish']);
 await queue(f);
 const event=await pending;assert.equal(event.event,'publish-request');assert.equal(event.next_tool,'ds_create_publish');assert.ok(idle.attempt!==event.event_id);
 const delivered=await f.flow();assert.equal(delivered.listener.deliveryState,'delivered');assert.equal(delivered.recoveryPrompt,null);
 const r=await a.good('ds_create_publish',{session:'fixture',execution:'stepped'});assert.equal(r.attempt,event.event_id);
 await a.good('ds_create_publish_finish',{...creds(r),outcome:'cancelled',message:'Fixture done.'});
});

test('an abruptly terminated MCP process cannot leave an owned job Running forever',async t=>{
 const f=await fixture(t),a=await client(t,f);await queue(f);await a.good('ds_create_publish',{session:'fixture'});
 assert.ok(a.transport.pid>0);process.kill(a.transport.pid,'SIGKILL');
 const done=await awaitJob(f,'blocked');assert.match(done.job.message,/Background connection stopped/);assert.equal(done.build.available,false);
});

test('a legacy CLI approval migrates to MCP without reapproval or executing its saved program',async t=>{
 const f=await publishFixture({mode:'blocked'});t.after(()=>f.cleanup());const q=await queue(f);await awaitJob(f,'blocked');await f.consumer.close();
 const requestFile=path.join(f.output,'manager/jobs',q.job.id,'request.json');
 const oldRequest=await json(requestFile);oldRequest.program='/retired/agent';await writeFile(requestFile,JSON.stringify(oldRequest));
 const statusFile=path.join(f.output,'manager/jobs',q.job.id,'status.json');await writeFile(statusFile,JSON.stringify({...await json(statusFile),runner:'cli'}));
 const ledger=path.join(f.output,'ds-create-ledger.json'),request=path.join(f.output,'manager/jobs',q.job.id,'request.json'),events=path.join(f.output,'received-prompt');
 const before=await Promise.all([readFile(ledger,'utf8'),readFile(request,'utf8'),stat(events,{bigint:true}).then(s=>s.mtimeNs)]);
 const jobs=createFigmaJobs({outputDir:f.output,workspace:f.root,runner:'mcp',simulation:true,agentCommand:'/nonexistent/codex'});
 const migrated=await jobs.start({hash:f.initial.figma.hash,figmaUrl:target});assert.equal(migrated.job.id,q.job.id);
 const a=await client(t,f),r=await a.good('ds_create_publish',{session:'fixture'});await a.good('ds_create_publish_finish',{...creds(r),outcome:'cancelled',message:'Migration test done.'});
 assert.deepEqual(await Promise.all([readFile(ledger,'utf8'),readFile(request,'utf8'),stat(events,{bigint:true}).then(s=>s.mtimeNs)]),before);
});
test('source changes during a claimed request stop progress but allow a truthful blocked finish',async t=>{
 const f=await fixture(t),a=await client(t,f);await queue(f);const r=await a.good('ds_create_publish',{session:'fixture'});
 await writeFile(path.join(f.root,'workspace/input/fixture/new-rule.md'),'new source');
 assert.equal((await a.call('ds_create_publish_progress',{...creds(r),message:'Before next write'})).isError,true);
 assert.equal((await a.good('ds_create_publish_finish',{...creds(r),outcome:'blocked',message:'Input changed. Stopped further writes.'})).status,'blocked');
 assert.equal((await f.flow()).build.available,false);
});

test('production defaults queue MCP without any agent executable or chat binding',async t=>{
 const f=await fixture(t),file=path.join(f.output,'ds-create-ledger.json'),l=await json(file);delete l.preview;await writeFile(file,JSON.stringify(l));
 const jobs=createFigmaJobs({outputDir:f.output,workspace:f.root,agentCommand:'/nonexistent/codex'});
 const before=await jobs.status();assert.equal(before.figma.canStart,true);
 const r=await jobs.start({hash:f.initial.figma.hash,figmaUrl:target});assert.equal(r.job.status,'queued');
 assert.equal(Object.hasOwn(await json(path.join(f.output,'manager/jobs',r.job.id,'request.json')),'program'),false);
 const {access}=await import('node:fs/promises');await assert.rejects(access(path.join(f.output,'received-prompt')));
 await jobs.cancel();
});

test('stepped publication returns read-only preflight and requires its real result before generation',async t=>{
 const f=await fixture(t),file=path.join(f.output,'foundations.json'),draft=await json(file);
 draft.textStyles=[{name:'type/body',fontFamily:'Fixture Font',fontStyle:'Regular',fontSize:16,lineHeight:24}];
 await writeFile(file,JSON.stringify(draft));f.initial=await f.flow();await queue(f);
 const a=await client(t,f);let r=await a.good('ds_create_publish',{session:'fixture',execution:'stepped'});
 assert.equal(r.operation.fileKey,'Fixture');assert.match(r.operation.code,/listAvailableFontsAsync/);
 assert.equal((await a.call('ds_create_publish_progress',{...creds(r),stage:'variables',message:'Too early'})).isError,true);
 const missing={fonts:[{family:'Fixture Font',style:'Regular',available:false}],inventory:{collections:0,variables:0,textStyles:0,effectStyles:0},
  alternatives:[{family:'Fixture Font',similar:[{family:'Fixture Font Display',styles:['Regular','Bold']}],recommended:[{family:'Inter',styles:['Regular','Medium']}]}]};
 assert.equal((await a.call('ds_create_publish_preflight',{...creds(r),result:{...missing,fonts:[]}})).isError,true);
 assert.equal((await a.call('ds_create_publish_preflight',{...creds(r),result:{...missing,alternatives:[{family:'Other',similar:[],recommended:[]}]}})).isError,true,'alternatives must describe a missing family');
 const stopped=await a.good('ds_create_publish_preflight',{...creds(r),result:missing});
 assert.equal(stopped.status,'needs-fonts');assert.equal(stopped.passed,false);assert.equal(stopped.next_operation,undefined,'no write continuation');
 assert.equal((await a.call('ds_create_publish_progress',{...creds(r),stage:'variables',message:'Too late'})).isError,true,'the attempt is no longer active');
 const blocked=await f.flow();assert.equal(blocked.job.status,'needs-fonts');assert.equal(blocked.figma.canStart,true);
 assert.deepEqual(blocked.job.fonts.map(x=>[x.role,x.family,x.styles,x.options.map(o=>[o.family,o.note])]),[['ui','Fixture Font',['Regular'],[['Fixture Font Display','closest'],['Inter','recommended']]]]);
 await queue(f);
 const again=await a.good('ds_create_publish',{session:'fixture',execution:'stepped'});assert.notEqual(again.attempt,r.attempt);
 const preflight=await a.good('ds_create_publish_preflight',{...creds(again),result:{...missing,fonts:[{family:'Fixture Font',style:'Regular',available:true}],alternatives:[]}});
 assert.equal(preflight.passed,true);assert.equal(preflight.next_operation.engine,'fast');
 r=again;
 await a.good('ds_create_publish_progress',{...creds(r),stage:'variables',message:'Preserving the approved font names.'});
 assert.equal((await a.good('ds_create_publish_finish',{...creds(r),outcome:'completed',message:'No export exists.'})).status,'failed');
 assert.equal((await f.flow()).build.available,false);
});
test('unsupported FAST metadata returns the standard continuation without changing the approved draft',async t=>{
 const f=await fixture(t),file=path.join(f.output,'foundations.json'),draft=await json(file);
 draft.textStyles=[{name:'type/body',fontFamily:'Fixture Font',fontStyle:'Regular',fontSize:16,lineHeight:24,customFeature:'preserve'}];
 await writeFile(file,JSON.stringify(draft));f.initial=await f.flow();await queue(f);
 const a=await client(t,f),r=await a.good('ds_create_publish',{session:'fixture',execution:'stepped'});
 const preflight=await a.good('ds_create_publish_preflight',{...creds(r),result:{fonts:[{family:'Fixture Font',style:'Regular',available:true}],inventory:{collections:0,variables:0,textStyles:0,effectStyles:0}}});
 assert.equal(preflight.next_operation.engine,'standard');assert.match(preflight.next_operation.fast_fallback,/customFeature/);assert.deepEqual(await json(file),draft);
 await a.good('ds_create_publish_finish',{...creds(r),outcome:'blocked',message:'Fixture finished.'});
});
