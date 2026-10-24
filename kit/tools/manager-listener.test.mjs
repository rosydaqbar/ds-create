import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {publishFixture} from './fixtures/manager-publish.mjs';
import {createAgentLease} from '../manager/agent-lease.mjs';
import {publicationLiveness,publishTasks} from '../manager/publish-progress.mjs';
import {preflightOperation,evaluatePreflight,requiredFonts} from '../manager/publish-preflight.mjs';
const entry=fileURLToPath(new URL('./manager-listen.mjs',import.meta.url));
async function start(t,{heartbeat=true,leaseMs,cancelAckMs}={}){
 const f=await publishFixture({runner:'mcp'}),child=spawn(process.execPath,['--input-type=module','-e',`import {runListener} from ${JSON.stringify(new URL('./manager-listen.mjs',import.meta.url).href)};await runListener(${JSON.stringify({workspace:f.root,session:'fixture',leaseMs,cancelAckMs})});`],{stdio:['pipe','pipe','pipe']});
 let errors='';child.stderr.on('data',b=>errors+=b);const lines=[],pending=[];
 createInterface({input:child.stdout}).on('line',line=>{const data=JSON.parse(line);lines.push(data);for(const p of [...pending])if(p.match(data)){pending.splice(pending.indexOf(p),1);clearTimeout(p.timer);p.resolve(data);}});
 const next=(match,after=0)=>{const old=lines.slice(after).find(match);if(old)return Promise.resolve(old);return new Promise((resolve,reject)=>{const p={match,resolve,timer:setTimeout(()=>reject(new Error('No worker event: '+errors)),5000)};pending.push(p);});};
 t.after(async()=>{child.stdin.end();if(child.exitCode===null)await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,2000))]);if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}await f.cleanup();});
 await next(e=>e.event==='listening');if(heartbeat){child.stdin.write(JSON.stringify({action:'heartbeat'})+'\n');await next(e=>e.event==='ack'&&e.action==='heartbeat');}return {...f,child,lines,next,send:value=>child.stdin.write(JSON.stringify(value)+'\n')};
}
async function queue(f){const r=await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:'https://www.figma.com/design/Fixture/Test'});assert.equal(r.status,202);return r.json();}
test('prestarted background listener automatically receives a Publish click, reports stages and safely blocks',async t=>{
 const f=await start(t);assert.equal((await f.flow()).listener.connected,true);assert.equal(f.lines.some(e=>e.event==='job'),false);
 const q=await queue(f),job=await f.next(e=>e.event==='job');assert.equal(job.kind,'publish');assert.equal(job.job_id,q.job.id);assert.equal(job.lease,undefined);assert.equal(job.operation.kind,'figma-preflight');assert.equal(job.operation.readOnly,true);
 f.send({action:'preflight',job_id:job.job_id,result:{fonts:[],inventory:{collections:0,variables:0,textStyles:0,effectStyles:0}}});const checked=await f.next(e=>e.event==='ack'&&e.action==='preflight');assert.equal(checked.result.passed,true);assert.equal(checked.result.next_operation.kind,'generate-foundations');
 f.send({action:'progress',job_id:job.job_id,stage:'variables',completed_stages:['access'],message:'Fonts verified. Creating the approved variable modes.'});await f.next(e=>e.event==='ack'&&e.action==='progress');
 const flow=await f.flow();assert.deepEqual(publishTasks(flow.job).map(t=>t.state),['complete','running','pending','pending']);assert.equal(flow.job.progress.activity.length,2);assert.equal(flow.build.available,false);
 f.send({action:'finish',job_id:job.job_id,outcome:'blocked',message:'Synthetic permission blocker.'});await f.next(e=>e.event==='ack'&&e.action==='finish');assert.equal((await f.flow()).job.status,'blocked');
});
test('one listener per session; cancelling a claimed job reaches its owner and never unlocks build',async t=>{
 const f=await start(t),duplicate=spawn(process.execPath,[entry,'--workspace',f.root,'--slug','fixture'],{stdio:['ignore','ignore','pipe']});let err='';duplicate.stderr.on('data',v=>err+=v);assert.notEqual((await once(duplicate,'exit'))[0],0);assert.match(err,/already has a background listener/);
 await queue(f);const job=await f.next(e=>e.event==='job');await f.post('/api/publish-cancel',{});
 f.send({action:'progress',job_id:job.job_id,message:'Checking for cancellation.'});const ack=await f.next(e=>e.event==='ack'&&e.action==='progress');assert.equal(ack.result.cancelRequested,true);
 f.send({action:'finish',job_id:job.job_id,outcome:'cancelled',message:'Stopped safely.'});await f.next(e=>e.event==='ack'&&e.action==='finish');assert.equal((await f.flow()).job.status,'cancelled');assert.equal((await f.flow()).build.available,false);
});
test('malformed/stale actions cannot finish a job; closing the native worker blocks its unfinished attempt',async t=>{
 const f=await start(t);await queue(f);const job=await f.next(e=>e.event==='job');
 f.send({action:'finish',job_id:'stale',outcome:'completed',message:'Invalid'});await f.next(e=>e.event==='error'&&e.job_id==='stale');assert.equal((await f.flow()).job.status,'running');
 f.child.stdin.end();await once(f.child,'exit');
 for(let i=0;i<30;i++){const flow=await f.flow();if(flow.job.status==='blocked'){assert.equal(flow.listener.connected,false);assert.equal(flow.build.available,false);return;}await new Promise(r=>setTimeout(r,30));}
 assert.fail('Disconnected worker left job running');
});
test('task display never treats prose, an earlier phase or elapsed time as completed Figma publication',()=>{
 assert.deepEqual(publishTasks({status:'queued',message:'Everything done'}).map(t=>t.state),['pending','pending','pending','pending']);
 assert.deepEqual(publishTasks({status:'running',progress:{stage:'verification',completed:['access','variables','styles']}}).map(t=>t.state),['complete','complete','complete','running']);
 assert.deepEqual(publishTasks({status:'running',progress:{stage:'verification',completed:['access','variables','styles','verification']}}).map(t=>t.state),['complete','complete','complete','running']);
 assert.deepEqual(publishTasks({status:'failed',progress:{stage:'verification',completed:['access','variables','styles']}}).map(t=>t.state),['complete','complete','complete','attention']);
});
test('an alive Node listener cannot claim queued work before an actual agent heartbeat',async t=>{
 const f=await start(t,{heartbeat:false});await queue(f);await new Promise(r=>setTimeout(r,600));
 const before=await f.flow();assert.equal(before.job.status,'queued');assert.equal(before.listener.transportConnected,true);assert.equal(before.listener.connected,false);assert.equal(f.lines.some(e=>e.event==='job'),false);
 f.send({action:'heartbeat'});await f.next(e=>e.event==='ack'&&e.action==='heartbeat');const job=await f.next(e=>e.event==='job');assert.equal((await f.flow()).listener.connected,true);
 const original=(await f.flow()).job,index=f.lines.length;f.send({action:'heartbeat'});await f.next(e=>e.event==='ack'&&e.action==='heartbeat',index);const after=(await f.flow()).job;
 assert.equal(after.updated,original.updated);assert.deepEqual(after.progress,original.progress,'connection heartbeats never simulate progress');
 f.send({action:'finish',job_id:job.job_id,outcome:'blocked',message:'Fixture finished.'});await f.next(e=>e.event==='ack'&&e.action==='finish');
});
test('missing native heartbeat fences a live-process owned job as blocked, never cancelled or successful',async t=>{
 const f=await start(t,{leaseMs:1400});await queue(f);await f.next(e=>e.event==='job');await f.next(e=>e.event==='worker-expired');if(f.child.exitCode===null)await once(f.child,'exit');
 const flow=await f.flow();assert.equal(flow.job.status,'blocked');assert.match(flow.job.message,/stopped checking in/);assert.equal(flow.listener.connected,false);assert.equal(flow.build.available,false);
});
test('cancellation has a bounded acknowledgement deadline even while its transport remains alive',async t=>{
 const f=await start(t,{leaseMs:10000,cancelAckMs:100});await queue(f);await f.next(e=>e.event==='job');await f.post('/api/publish-cancel',{});
 assert.equal((await f.flow()).job.cancelRequested,true);assert.ok((await f.flow()).job.cancelRequestedAt);
 await f.next(e=>e.event==='cancel-requested');await f.next(e=>e.event==='worker-expired');if(f.child.exitCode===null)await once(f.child,'exit');
 const flow=await f.flow();assert.equal(flow.job.status,'blocked');assert.match(flow.job.message,/did not acknowledge cancellation/);assert.equal(flow.build.available,false);
});
test('agent lease expires irreversibly; UI exposes stopping and quiet progress without inventing activity',()=>{
 let now=0;const lease=createAgentLease({now:()=>now,durationMs:1000});assert.equal(lease.inspect().ready,false);lease.heartbeat();assert.equal(lease.inspect().ready,true);now=999;assert.equal(lease.inspect().expired,false);now=1000;assert.equal(lease.inspect().ready,false);assert.throws(()=>lease.heartbeat(),/expired/);
 const at='2026-10-24T10:00:00Z',job={status:'running',started:at,updated:at,progress:{stage:'access',activity:[{time:at,message:'Reading fonts'}]}};
 assert.equal(publicationLiveness({job},Date.parse(at)+1000).animate,true);
 assert.equal(publicationLiveness({job},Date.parse(at)+91000).animate,false);
 assert.match(publicationLiveness({job},Date.parse(at)+91000).notice,/No progress/);
 const stopping=publicationLiveness({job:{...job,cancelRequested:true,cancelRequestedAt:at}},Date.parse(at)+61000);assert.equal(stopping.animate,false);assert.match(stopping.notice,/has not acknowledged cancellation/);
});

test('native preflight result controls execution: generation refused before check and missing font ends job immediately',async t=>{
 const f=await start(t);const {readFile,writeFile}=await import('node:fs/promises');const path=await import('node:path');
 const file=path.join(f.output,'foundations.json'),draft=JSON.parse(await readFile(file,'utf8'));
 draft.textStyles=[{name:'type/body',fontFamily:'Fixture Font',fontStyle:'Regular',fontSize:16,lineHeight:24}];
 await writeFile(file,JSON.stringify(draft));f.initial=await f.flow();
 await queue(f);const job=await f.next(e=>e.event==='job');
 f.send({action:'progress',job_id:job.job_id,stage:'variables',message:'Cannot start writing yet.'});await f.next(e=>e.event==='error'&&e.message.includes('preflight'));
 assert.equal((await f.flow()).job.progress.activity.length,0);
 f.send({action:'preflight',job_id:job.job_id,result:{fonts:[{family:'Other Font',style:'Regular',available:true}],inventory:{collections:0,variables:0,textStyles:0,effectStyles:0}}});await f.next(e=>e.event==='error'&&e.message.includes('approved font set'));
 assert.equal((await f.flow()).job.status,'running');
 f.send({action:'preflight',job_id:job.job_id,result:{fonts:[{family:'Fixture Font',style:'Regular',available:false}],inventory:{collections:0,variables:0,textStyles:0,effectStyles:0}}});
 const blocked=await f.next(e=>e.event==='ack'&&e.action==='preflight');assert.equal(blocked.result.status,'blocked');assert.equal(blocked.result.next_operation,undefined);
 const flow=await f.flow();assert.equal(flow.job.status,'blocked');assert.match(flow.job.message,/Fixture Font \/ Regular/);assert.equal(flow.build.available,false);
 const receipt=JSON.parse(await readFile(path.join(f.output,'manager/jobs',job.job_id,'mcp-delivery.json'),'utf8'));assert.equal(receipt.preflight.passed,false);assert.equal(receipt.preflight.sourceHash,job.source_hash);
 const index=f.lines.length;await queue(f);const retry=await f.next(e=>e.event==='job',index);assert.equal(retry.job_id,job.job_id,'same saved approval, new attempt');
 f.send({action:'finish',job_id:retry.job_id,outcome:'blocked',message:'Fixture cleanup.'});await f.next(e=>e.event==='ack'&&e.action==='finish',index);
});
test('source-derived preflight executes read-only and requires every exact font result',async()=>{
 assert.deepEqual(requiredFonts({textStyles:[{fontFamily:'Fixture Font'}]}),[{family:'Fixture Font',style:'Regular'}],'existing canonical default remains supported');
 const draft={textStyles:[{fontFamily:'Fixture Font',fontStyle:'Regular'},{fontFamily:'Fixture Font',fontStyle:'Medium'},{fontFamily:'Fixture Font',fontStyle:'Regular'}]};
 const operation=preflightOperation({figmaUrl:'https://www.figma.com/design/Selected/File',hash:'approved'},draft);
 const mock={listAvailableFontsAsync:async()=>[{fontName:{family:'Fixture Font',style:'Regular'}},{fontName:{family:'Fixture Font Pro',style:'Medium'}}],variables:{getLocalVariableCollectionsAsync:async()=>[{variableIds:['a','b']}]},getLocalTextStylesAsync:async()=>[],getLocalEffectStylesAsync:async()=>[]};
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const actual=await new AsyncFunction('figma',operation.code)(mock);
 assert.equal(operation.fileKey,'Selected');assert.deepEqual(actual.inventory,{collections:1,variables:2,textStyles:0,effectStyles:0});
 assert.deepEqual(evaluatePreflight(draft,actual).missing,[{family:'Fixture Font',style:'Medium'}],'similar family is not an approved substitution');
 assert.throws(()=>evaluatePreflight(draft,{...actual,fonts:actual.fonts.slice(1)}),/every approved font/);
});
test('web worker check offers the scoped spawn prompt only without an actual native check-in',async t=>{
 const f=await start(t,{heartbeat:false}),{readFile}=await import('node:fs/promises'),path=await import('node:path');
 const ledgerFile=path.join(f.output,'ds-create-ledger.json'),before=await readFile(ledgerFile,'utf8');
 const disconnected=await fetch(f.url+'/api/worker').then(r=>r.json());assert.equal(disconnected.connected,false);assert.ok(disconnected.recoveryPrompt.includes(JSON.stringify(f.root)));assert.match(disconnected.recoveryPrompt,/session "fixture"/);assert.match(disconnected.recoveryPrompt,/native background\/subagent tool/);
 assert.equal(disconnected.lastSeenAt,null,'live Node PID alone is not an agent check-in');
 f.send({action:'heartbeat'});await f.next(e=>e.event==='ack'&&e.action==='heartbeat');
 const connected=await fetch(f.url+'/api/worker').then(r=>r.json());assert.equal(connected.connected,true);assert.equal(connected.recoveryPrompt,null);assert.ok(connected.lastSeenAt);assert.equal(await readFile(ledgerFile,'utf8'),before,'read-only checks cannot approve or queue anything');assert.equal((await f.flow()).job,null);
});
test('stale or future check-in never hides the web recovery prompt, and a new native check-in clears it',async t=>{
 const f=await start(t),{readFile,writeFile}=await import('node:fs/promises'),path=await import('node:path');const file=path.join(f.output,'manager/listener.json'),identity=JSON.parse(await readFile(file,'utf8'));
 for(const offset of [-200000,200000]){
  await writeFile(file,JSON.stringify({...identity,agentSeenAt:new Date(Date.now()+offset).toISOString()}));
  const stale=await fetch(f.url+'/api/worker').then(r=>r.json());assert.equal(stale.connected,false);assert.ok(stale.recoveryPrompt);
 }
 const after=f.lines.length;f.send({action:'heartbeat'});await f.next(e=>e.event==='ack'&&e.action==='heartbeat',after);
 const current=await fetch(f.url+'/api/worker').then(r=>r.json());assert.equal(current.connected,true);assert.equal(current.recoveryPrompt,null);
});
