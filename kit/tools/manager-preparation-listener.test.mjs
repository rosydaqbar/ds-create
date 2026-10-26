import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {setupFixture} from './fixtures/manager-setup.mjs';
import {decisions} from './fixtures/preparation-decisions.mjs';
import {createPreparationListener} from '../manager/preparation-listener.mjs';
const json=async f=>JSON.parse(await readFile(f,'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async fn=>{for(let i=0;i<150;i++){const value=await fn();if(value)return value;await sleep(20);}throw Error('Expected listener observation did not arrive.');};
async function fixture(t,options={}){
 const f=await setupFixture({runner:'mcp',preparationVersion:2}),packets=[];
 let listener=await createPreparationListener({workspace:f.root,session:'fixture',intervalMs:10,onPrompt:async e=>{packets.push(e);return {accepted:true,event_id:e.event_id};},...options});
 t.after(async()=>{await listener?.close();await f.cleanup();});
 const queue=async()=>{const form=f.form('A synthetic product; Inter; monochrome.');form.set('interfaceDetails',JSON.stringify({modes:['Light','Dark'],devices:['Web']}));assert.equal((await f.post('/api/setup-submit',form)).status,202);};
 return {...f,packets,queue,get listener(){return listener;},set listener(x){listener=x;}};
}
test('Node waits without agent heartbeats; one main consumer accepts, compiles and finishes then returns to idle',async t=>{
 const f=await fixture(t),consumer=randomUUID();
 await sleep(70);assert.equal(f.packets.length,1,'only the no-model readiness handshake occurs while idle');
 const idle=await f.listener.act({action:'status'});assert.equal(idle.receiverReady,true);assert.equal(idle.activeJob,null);
 assert.equal((await json(path.join(f.output,'manager/listener.json'))).agentSeenAt,null);
 await f.queue();const event=await until(()=>f.packets.find(e=>e.event==='prepare-request'));
 assert.equal((await f.flow()).status,'queued','delivery must not masquerade as execution');
 assert.equal((await f.listener.act({action:'next'})).event.event_id,event.event_id);
 const job=await f.listener.act({action:'claim',event_id:event.event_id,consumer_id:consumer});
 assert.equal(job.status,'running');assert.equal(job.lease,undefined);assert.equal(job.attempt,undefined);assert.match(job.instructions,/source-pack.json/);
 await assert.rejects(()=>f.listener.act({action:'claim',event_id:event.event_id,consumer_id:randomUUID()}),/Another main-agent consumer/);
 const dir=path.join(f.output,'manager/setup-jobs',job.job_id),req=await json(path.join(dir,'request.json')),pack=await json(path.join(dir,'source-pack.json'));
 await writeFile(path.join(dir,'decisions.json'),JSON.stringify(decisions(req,pack)));
 const credentials={job_id:job.job_id,consumer_id:consumer};
 await f.listener.act({action:'progress',...credentials,stage:'decisions',message:'Design decisions recorded from the saved sources.'});
 const compiled=await f.listener.act({action:'compile',...credentials});assert.ok(compiled.counts.variables>0);
 const done=await f.listener.act({action:'finish',...credentials,outcome:'ready',message:'Local review prepared.',questions:[]});assert.equal(done.status,'ready');
 assert.equal((await f.flow()).status,'ready');assert.equal((await fetch(f.url+'/api/state').then(r=>r.json())).initDone,false);
 assert.equal((await f.listener.act({action:'status'})).activeJob,null);await sleep(70);
 assert.equal(f.packets.filter(e=>e.event==='prepare-request').length,1);
 assert.equal(f.packets.some(e=>e.event==='publish'),false);
});
test('no host hook means unready transport and unclaimed queue; explicit main acceptance remains available',async t=>{
 const f=await fixture(t,{onPrompt:undefined});await f.queue();await sleep(60);
 const status=await fetch(f.url+'/api/worker').then(r=>r.json());assert.equal(status.connected,false);assert.equal(status.transportConnected,true);assert.equal(status.mode,'main-agent');assert.deepEqual(status.capabilities,['prepare']);
 assert.doesNotMatch(status.recoveryPrompt,/spawn exactly|native background\/subagent tool|orca-cli/);
 assert.equal((await f.flow()).status,'queued');const {event}=await f.listener.act({action:'next'});assert.ok(event);
 await f.post('/api/setup-cancel',{});
 await assert.rejects(()=>f.listener.act({action:'claim',event_id:event.event_id,consumer_id:randomUUID()}),/no longer current/);
 assert.equal((await f.flow()).status,'cancelled');
});
test('listener restart never redelivers an acknowledged attempt; source changes prevent a stale claim',async t=>{
 const f=await fixture(t);await f.queue();const event=await until(()=>f.packets.find(e=>e.event==='prepare-request'));
 await f.listener.close();f.listener=await createPreparationListener({workspace:f.root,session:'fixture',intervalMs:10,onPrompt:async e=>{f.packets.push(e);return {accepted:true,event_id:e.event_id};}});
 await sleep(70);assert.equal(f.packets.filter(e=>e.event==='prepare-request').length,1);
 const req=await json(event.request_file);await writeFile(path.join(f.root,'workspace/input',req.inputSlug,req.contextFile),'Changed input');
 await assert.rejects(()=>f.listener.act({action:'claim',event_id:event.event_id,consumer_id:randomUUID()}),/Context files changed/);
 assert.equal((await f.flow()).status,'queued');
});
test('active silence is fenced as blocked, while idle transport requires no AI check-in',async t=>{
 const f=await fixture(t,{activeTimeoutMs:100});await sleep(160);assert.equal((await f.listener.act({action:'status'})).receiverReady,true);
 await f.queue();const event=await until(()=>f.packets.find(e=>e.event==='prepare-request'));
 await f.listener.act({action:'claim',event_id:event.event_id,consumer_id:randomUUID()});
 await until(async()=> (await f.flow()).status==='blocked');assert.match((await f.flow()).message,/main agent stopped responding/);
});
test('failed host delivery is visible and does not claim or endlessly re-prompt queued work',async t=>{
 const packets=[],f=await fixture(t,{onPrompt:async e=>{packets.push(e);if(e.event==='prepare-request')throw Error('Receiver down');return {accepted:true,event_id:e.event_id};}});
 await f.queue();await until(()=>packets.some(e=>e.event==='prepare-request'));await sleep(60);
 const status=await f.listener.act({action:'status'});assert.equal(status.receiverReady,false);assert.match(status.lastError,/Host event delivery failed/);
 assert.equal(packets.filter(e=>e.event==='prepare-request').length,1);assert.equal((await f.flow()).status,'queued');
});
test('standalone Node daemon delivers an actual HTTP event, authenticates commands and stops cleanly',async t=>{
 const f=await setupFixture({runner:'mcp',preparationVersion:2}),events=[];
 const host=http.createServer(async(req,res)=>{let body='';for await(const b of req)body+=b;const e=JSON.parse(body);events.push(e);res.setHeader('content-type','application/json');res.end(JSON.stringify({accepted:true,event_id:e.event_id}));});
 await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
 const entry=fileURLToPath(new URL('./manager-prepare-listen.mjs',import.meta.url)),exec=promisify(execFile);
 const run=async(...args)=>JSON.parse((await exec(process.execPath,[entry,...args,'--workspace',f.root,'--slug','fixture'])).stdout);
 t.after(async()=>{await run('stop').catch(()=>{});await until(async()=>{try{await readFile(path.join(f.output,'manager/preparation-control.json'));return false;}catch{return true;}});await new Promise(resolve=>host.close(resolve));await f.cleanup();});
 const started=await run('start','--notify-url',`http://127.0.0.1:${host.address().port}/hook`);assert.equal(started.receiverReady,true);
 assert.equal((await run('start')).reused,true);
 const control=await json(path.join(f.output,'manager/preparation-control.json'));
 assert.equal((await fetch(control.url,{method:'POST',body:'{"action":"next"}'})).status,403);
 await f.post('/api/setup-submit',f.form());await until(()=>events.some(e=>e.event==='prepare-request'));
 assert.equal((await f.flow()).status,'queued');const {event}=await run('next'),consumer=randomUUID();
 const claimed=await run('claim','--event',event.event_id,'--consumer',consumer);assert.equal(claimed.status,'running');
 const command=path.join(f.root,'finish.json');await writeFile(command,JSON.stringify({job_id:event.job_id,consumer_id:consumer,outcome:'blocked',message:'Synthetic host integration check complete.'}));
 assert.equal((await run('finish','--data-file',command)).status,'blocked');
});
test('legacy native publication listener never claims local preparation',async t=>{
 const f=await setupFixture({runner:'mcp',preparationVersion:2}),child=spawn(process.execPath,[fileURLToPath(new URL('./manager-listen.mjs',import.meta.url)),'--workspace',f.root,'--slug','fixture'],{stdio:['pipe','ignore','pipe']});
 t.after(async()=>{child.stdin.end();if(child.exitCode===null)await once(child,'exit');await f.cleanup();});
 await until(async()=>{try{return !!(await json(path.join(f.output,'manager/listener.json'))).pid;}catch{return false;}});
 child.stdin.write('{"action":"heartbeat"}\n');await f.post('/api/setup-submit',f.form());await sleep(650);
 assert.equal((await f.flow()).status,'queued');
});

test('active cancellation reaches the main consumer; second listeners/consumers cannot own the same work',async t=>{
 const f=await fixture(t),consumer=randomUUID();
 await assert.rejects(()=>createPreparationListener({workspace:f.root,session:'fixture'}),/already has a listener/);
 await f.queue();const event=await until(()=>f.packets.find(e=>e.event==='prepare-request'));
 const job=await f.listener.act({action:'claim',event_id:event.event_id,consumer_id:consumer});
 await assert.rejects(()=>f.listener.act({action:'progress',job_id:job.job_id,consumer_id:randomUUID(),message:'Not the owner.'}),/does not own/);
 await f.post('/api/setup-cancel',{});await until(()=>f.packets.find(e=>e.event==='prepare-cancel'));
 const result=await f.listener.act({action:'finish',job_id:job.job_id,consumer_id:consumer,outcome:'cancelled',message:'Stopped safely.'});
 assert.equal(result.status,'cancelled');await sleep(50);assert.equal(f.packets.filter(e=>e.event==='prepare-cancel').length,1);
 assert.equal((await f.listener.act({action:'status'})).activeJob,null);
});
test('preparation-only host readiness never pretends a publication executor is attached',async t=>{
 const f=await fixture(t),{listenerStatus}=await import('../manager/listener-status.mjs');
 assert.equal((await listenerStatus(f.output)).connected,true);
 const publish=await listenerStatus(f.output,'publish');assert.equal(publish.connected,false);assert.match(publish.reason,/preparation only/);
});
test('shutdown blocks unfinished work and a host acknowledgement must echo the actual event identity',async t=>{
 const f=await fixture(t,{onPrompt:async()=>({accepted:true,event_id:randomUUID()})});
 assert.equal((await f.listener.act({action:'status'})).receiverReady,false);
 await f.queue();const event=await until(async()=>(await f.listener.act({action:'next'})).event);
 await f.listener.act({action:'claim',event_id:event.event_id,consumer_id:randomUUID()});
 await f.listener.close();assert.equal((await f.flow()).status,'blocked');
});
