import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {PREPARATION_WAIT_MS, preparationWaitStatus, waitForPreparation} from '../kit/manager/server/setup.mjs';
import {setupFixture} from './fixtures/manager-setup.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<150;i++){const value=await fn();if(value)return value;await sleep(20);}throw Error('Expected pending tool observation missing.');}
async function fixture(t){const f=await setupFixture({autoRun:false,preparationVersion:2});t.after(()=>f.cleanup());return f;}

test('one pending tool waits in Node and returns the submitted event without claiming or compiling',async t=>{
 const f=await fixture(t),controller=new AbortController();let resolved=false;
 const waiting=waitForPreparation({workspace:f.root,session:'fixture',signal:controller.signal}).then(e=>{resolved=true;return e;});
 t.after(()=>controller.abort());
 await until(()=>preparationWaitStatus(f.output));await sleep(80);assert.equal(resolved,false);
 assert.equal((await fetch(f.url+'/api/worker').then(r=>r.json())).mode,'pending-tool');
 await assert.rejects(()=>waitForPreparation({workspace:f.root,session:'fixture'}),/already has a pending/);
 const submitted=await f.post('/api/setup-submit',f.form('A synthetic product for event testing.'));assert.equal(submitted.status,202);
 const event=await waiting,flow=await f.flow();assert.equal(event.job_id,flow.jobId);assert.equal(event.event,'prepare-request');assert.equal(flow.status,'queued');
 const delivery=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',flow.jobId,'mcp-delivery.json')));assert.equal(event.event_id,delivery.attempt);assert.equal(delivery.owner,undefined);
 assert.equal(await preparationWaitStatus(f.output),null);
 await assert.rejects(readFile(path.join(f.output,'foundations.json')),{code:'ENOENT'});
});
test('tool cancellation removes delivery readiness and preserves an empty session',async t=>{
 const f=await fixture(t),controller=new AbortController();
 const waiting=waitForPreparation({workspace:f.root,session:'fixture',signal:controller.signal});const rejected=assert.rejects(waiting,/abort/i);
 await until(()=>preparationWaitStatus(f.output));controller.abort();await rejected;
 assert.equal(await preparationWaitStatus(f.output),null);assert.equal((await f.flow()).status,'empty');
});
test('a cancelled request never wakes or gets retried by the pending tool',async t=>{
 const f=await fixture(t);await f.post('/api/setup-submit',f.form());await f.post('/api/setup-cancel',{});
 const controller=new AbortController();let resolved=false;
 const waiting=waitForPreparation({workspace:f.root,session:'fixture',signal:controller.signal}).then(e=>{resolved=true;return e;});const rejected=assert.rejects(waiting,/abort/i);
 await until(()=>preparationWaitStatus(f.output));await sleep(100);assert.equal(resolved,false);assert.equal((await f.flow()).status,'cancelled');
 controller.abort();await rejected;
});
test('terminal tool uses the same portable Node wait and detaches on termination',async t=>{
 const f=await fixture(t),child=spawn(process.execPath,[fileURLToPath(new URL('../kit/manager/cli.mjs',import.meta.url)),'wait','--workspace',f.root,'--slug','fixture'],{stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',chunk=>{output+=chunk;});
 t.after(async()=>{if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}});
 await until(()=>preparationWaitStatus(f.output));assert.equal(output,'');
 await f.post('/api/setup-submit',f.form('Synthetic terminal delivery test.'));await once(child,'exit');
 assert.equal(child.exitCode,0);assert.equal(JSON.parse(output).job_id,(await f.flow()).jobId);assert.equal((await f.flow()).status,'queued');assert.equal(await preparationWaitStatus(f.output),null);
});
test('handoff is delivered, then acknowledgement rearms one waiter without replay or claim',async t=>{
 const f=await fixture(t);await f.post('/api/setup-submit',f.form('Synthetic acknowledgement test.'));
 const event=await waitForPreparation({workspace:f.root,session:'fixture'});
 let connection=await fetch(f.url+'/api/worker').then(r=>r.json());
 assert.equal(connection.deliveryState,'delivered');assert.equal(connection.connected,false);assert.equal(connection.recoveryPrompt,null,'a delivered event is not a connection failure');
 const controller=new AbortController();let returned=false;
 const waiting=waitForPreparation({workspace:f.root,session:'fixture',afterEvent:event.event_id,signal:controller.signal}).then(e=>{returned=true;return e;});const rejected=assert.rejects(waiting,/abort/i);
 await until(()=>preparationWaitStatus(f.output));await sleep(100);assert.equal(returned,false,'the acknowledged queued attempt must not be redelivered');
 connection=await fetch(f.url+'/api/worker').then(r=>r.json());assert.equal(connection.connected,true);assert.equal(connection.mode,'pending-tool');
 assert.equal((await f.flow()).status,'queued');
 const delivery=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',event.job_id,'mcp-delivery.json')));assert.equal(delivery.owner,undefined);
 controller.abort();await rejected;
});

test('retired listener PID files cannot advertise readiness or mutate saved work',async t=>{
 const f=await fixture(t),{writeFile}=await import('node:fs/promises');
 const before=await readFile(path.join(f.output,'manager/setup.json'),'utf8');
 for(const record of [{pid:process.pid,mode:'main-agent',receiverReady:true},{pid:process.pid,agentSeenAt:new Date().toISOString()}]){
  await writeFile(path.join(f.output,'manager/listener.json'),JSON.stringify(record));
  const status=await fetch(f.url+'/api/worker').then(r=>r.json());
  assert.equal(status.connected,false);assert.equal(status.transportConnected,false);assert.equal(status.lastSeenAt,null);assert.match(status.recoveryPrompt,/Continue preparing foundations/);assert.match(status.recoveryPrompt,/--slug fixture/);assert.ok(status.recoveryPrompt.includes(f.root));
 }
 assert.equal(await readFile(path.join(f.output,'manager/setup.json'),'utf8'),before);assert.equal((await f.flow()).status,'empty');
});

 test('wait expiration disconnects without claiming work and user continuation reconnects',async t=>{
  assert.equal(PREPARATION_WAIT_MS,300000);
  const f=await fixture(t),before=await readFile(path.join(f.output,'manager/setup.json'),'utf8');
  const expired=await waitForPreparation({workspace:f.root,session:'fixture',timeoutMs:70});
  assert.equal(expired.event,'wait-expired');assert.equal(await preparationWaitStatus(f.output),null);
  const status=await fetch(f.url+'/api/worker').then(r=>r.json());
  assert.equal(status.connected,false);assert.equal(status.waitExpired,true);
  assert.ok(status.recoveryPrompt.length<300);assert.match(status.recoveryPrompt,/--slug fixture/);
  assert.equal(await readFile(path.join(f.output,'manager/setup.json'),'utf8'),before);
  await f.post('/api/setup-submit',f.form('Saved input survives the expired wait.'));
  assert.equal((await f.flow()).status,'queued');
  const event=await waitForPreparation({workspace:f.root,session:'fixture'});
  assert.equal(event.event,'prepare-request');assert.equal((await f.flow()).status,'queued');
  assert.equal((await fetch(f.url+'/api/worker').then(r=>r.json())).waitExpired,false);
 });
