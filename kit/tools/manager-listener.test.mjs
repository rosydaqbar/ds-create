import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {publishFixture} from './fixtures/manager-publish.mjs';
import {publishTasks} from '../manager/publish-progress.mjs';
const entry=fileURLToPath(new URL('./manager-listen.mjs',import.meta.url));
async function start(t){
 const f=await publishFixture({runner:'mcp'}),child=spawn(process.execPath,[entry,'--workspace',f.root,'--slug','fixture'],{stdio:['pipe','pipe','pipe']});
 let errors='';child.stderr.on('data',b=>errors+=b);const lines=[],pending=[];
 createInterface({input:child.stdout}).on('line',line=>{const data=JSON.parse(line);lines.push(data);for(const p of [...pending])if(p.match(data)){pending.splice(pending.indexOf(p),1);clearTimeout(p.timer);p.resolve(data);}});
 const next=match=>{const old=lines.find(match);if(old)return Promise.resolve(old);return new Promise((resolve,reject)=>{const p={match,resolve,timer:setTimeout(()=>reject(new Error('No worker event: '+errors)),5000)};pending.push(p);});};
 t.after(async()=>{child.stdin.end();if(child.exitCode===null)await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,2000))]);if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}await f.cleanup();});
 await next(e=>e.event==='listening');return {...f,child,lines,next,send:value=>child.stdin.write(JSON.stringify(value)+'\n')};
}
async function queue(f){const r=await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:'https://www.figma.com/design/Fixture/Test'});assert.equal(r.status,202);return r.json();}
test('prestarted background listener automatically receives a Publish click, reports stages and safely blocks',async t=>{
 const f=await start(t);assert.equal((await f.flow()).listener.connected,true);assert.equal(f.lines.some(e=>e.event==='job'),false);
 const q=await queue(f),job=await f.next(e=>e.event==='job');assert.equal(job.kind,'publish');assert.equal(job.job_id,q.job.id);assert.equal(job.lease,undefined);assert.match(job.instructions,/already has its Figma connection/);
 f.send({action:'progress',job_id:job.job_id,stage:'variables',completed_stages:['access'],message:'Fonts verified. Creating the approved variable modes.'});await f.next(e=>e.event==='ack'&&e.action==='progress');
 const flow=await f.flow();assert.deepEqual(publishTasks(flow.job).map(t=>t.state),['complete','running','pending','pending']);assert.equal(flow.job.progress.activity.length,1);assert.equal(flow.build.available,false);
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
