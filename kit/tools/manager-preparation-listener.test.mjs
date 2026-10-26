import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setupFixture} from './fixtures/manager-setup.mjs';
import {decisions} from './fixtures/preparation-decisions.mjs';
const json=async f=>JSON.parse(await readFile(f,'utf8'));

test('portable prestarted listener receives preparation, compiles and submits file handoff while preserving real native liveness',async t=>{
 const f=await setupFixture({runner:'mcp',preparationVersion:2}),child=spawn(process.execPath,[fileURLToPath(new URL('./manager-listen.mjs',import.meta.url)),'--workspace',f.root,'--slug','fixture'],{stdio:['pipe','pipe','pipe']});
 const lines=[],waiters=[];let errors='';child.stderr.on('data',b=>errors+=b);
 createInterface({input:child.stdout}).on('line',line=>{const event=JSON.parse(line);lines.push(event);for(const w of [...waiters])if(w.match(event)){waiters.splice(waiters.indexOf(w),1);clearTimeout(w.timer);w.resolve(event);}});
 const next=(match,after=0)=>{const existing=lines.slice(after).find(match);if(existing)return Promise.resolve(existing);return new Promise((resolve,reject)=>{const w={match,resolve,timer:setTimeout(()=>reject(new Error('No listener event: '+errors)),5000)};waiters.push(w);});};
 const send=command=>child.stdin.write(JSON.stringify(command)+'\n');
 t.after(async()=>{child.stdin.end();if(child.exitCode===null)await once(child,'exit');await f.cleanup();});
 const startup=await next(e=>e.event==='listening');assert.equal(startup.standby.zeroInferenceVerified,false);
 send({action:'heartbeat'});await next(e=>e.event==='ack'&&e.action==='heartbeat');
 const before=await json(path.join(f.output,'manager/listener.json'));await new Promise(r=>setTimeout(r,100));
 assert.equal((await json(path.join(f.output,'manager/listener.json'))).agentSeenAt,before.agentSeenAt,'Node polling does not renew native readiness');
 const form=f.form('A synthetic product; Inter; monochrome.');form.set('interfaceDetails',JSON.stringify({modes:['Light','Dark'],devices:['Web']}));
 assert.equal((await f.post('/api/setup-submit',form)).status,202);const job=await next(e=>e.event==='job');assert.equal(job.kind,'prepare');assert.equal(job.lease,undefined);
 const dir=path.join(f.output,'manager/setup-jobs',job.job_id),req=await json(path.join(dir,'request.json')),pack=await json(path.join(dir,'source-pack.json'));
 await writeFile(path.join(dir,'decisions.json'),JSON.stringify(decisions(req,pack)));
 send({action:'compile',job_id:job.job_id});const compiled=await next(e=>e.event==='ack'&&e.action==='compile');assert.ok(compiled.result.counts.variables>0);
 await writeFile(path.join(dir,'handoff.json'),JSON.stringify({outcome:'ready',message:'Local review prepared.',questions:[]}));
 send({action:'finish-file',job_id:job.job_id});const done=await next(e=>e.event==='ack'&&e.action==='finish');assert.equal(done.result.status,'ready');assert.equal((await f.flow()).status,'ready');
 const state=await fetch(f.url+'/api/state').then(r=>r.json());assert.equal(state.initDone,false);
 // Force a real check-in to flush accounting after the finish boundary; no timer masquerades as an agent.
 const index=lines.length;send({action:'heartbeat'});await next(e=>e.event==='ack'&&e.action==='heartbeat',index);
 const metrics=await json(path.join(f.output,'manager/listener-metrics.json'));assert.equal(metrics.jobs.prepare,1);assert.equal(metrics.jobs.publish,0);assert.equal(metrics.heartbeats,2);assert.ok(metrics.idleMs>0);assert.ok(metrics.activeMs>0);assert.equal(metrics.zeroInferenceVerified,false);
 assert.equal(lines.filter(e=>e.event==='job').length,1);
});
