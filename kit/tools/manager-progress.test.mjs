import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, appendFile, readFile, readdir, rm, utimes } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createSetupProgress } from '../manager/setup-progress.mjs';
import { preparationTasks } from '../manager/preparation.mjs';
import { setupFixture } from './fixtures/manager-setup.mjs';

const event = text => JSON.stringify({type:'item.completed',item:{type:'agent_message',text}})+'\n';
async function fixture(t) {
  const dir=await mkdtemp(path.join(tmpdir(),'ds-progress-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  await writeFile(path.join(dir,'request.json'),'{}');
  return {dir,events:path.join(dir,'events.jsonl'),read:createSetupProgress()};
}
test('incremental progress handles partial UTF-8/JSONL without exposing commands, output or result JSON',async t=>{
  const f=await fixture(t);assert.equal((await f.read(f.dir)).phase,'Starting the local agent');
  const bytes=Buffer.from(event('Reading café context.')),split=bytes.indexOf(Buffer.from('é'))+1;
  await writeFile(f.events,bytes.subarray(0,split));assert.deepEqual((await f.read(f.dir)).recent,[]);
  await appendFile(f.events,bytes.subarray(split));assert.equal((await f.read(f.dir)).message,'Reading café context.');
  await appendFile(f.events,'broken JSON\n'+JSON.stringify({type:'item.completed',item:{type:'command_execution',command:'cat PRIVATE COMMAND',aggregated_output:'PRIVATE OUTPUT'}})+'\n'+event('{"status":"ready","message":"Final result"}'));
  const progress=await f.read(f.dir);assert.equal(progress.phase,'Reading project files');assert.equal(progress.recent.length,1);
  assert.doesNotMatch(JSON.stringify(progress),/PRIVATE|Final result/);
  assert.equal(await readFile(path.join(f.dir,'request.json'),'utf8'),'{}');assert.deepEqual((await readdir(f.dir)).sort(),['events.jsonl','request.json']);
});
test('oversize and malformed rows are skipped; recent messages are bounded and credentials redacted',async t=>{
  const f=await fixture(t);
  await writeFile(f.events,'x'.repeat(1024*1024+80)+'\n'+event('Starting'));
  for(let i=0;i<6;i++)await appendFile(f.events,event('Update '+i));
  await appendFile(f.events,event('api_key=sk-not-a-real-secret-123456789 Bearer abcdefghijklmnop password=hunter2'));
  const p=await f.read(f.dir);assert.equal(p.recent.length,4);assert.equal(p.recent[0],'Update 3');
  assert.doesNotMatch(JSON.stringify(p),/not-a-real-secret|abcdefghijklmnop|hunter2/);assert.match(p.message,/redacted/);
});
test('log truncation, rotation and new jobs reset stale progress; connection notices recover with fresh activity',async t=>{
  const f=await fixture(t);await writeFile(f.events,event('Original update'));
  await f.read(f.dir);await writeFile(f.events,event('New'));assert.equal((await f.read(f.dir)).message,'New');
  await rm(f.events);await writeFile(f.events,event('Rotated file'));assert.equal((await f.read(f.dir)).message,'Rotated file');
  const stderr=path.join(f.dir,'stderr.log');await writeFile(stderr,'ERROR failed to connect to websocket\n');
  await utimes(f.events,new Date(100000),new Date(100000));await utimes(stderr,new Date(200000),new Date(200000));
  assert.equal((await f.read(f.dir)).connectionIssue,true);
  await appendFile(f.events,event('Connection recovered; reading the brief.'));await utimes(f.events,new Date(300000),new Date(300000));
  assert.equal((await f.read(f.dir)).connectionIssue,false);
  const other=path.join(f.dir,'next-job');await mkdir(other);await writeFile(path.join(other,'request.json'),'{}');
  assert.deepEqual((await f.read(other)).recent,[]);
});
test('setup-flow exposes real fake-process progress before completion, preserving terminal readiness checks',async t=>{
  const f=await setupFixture({mode:'progress'});t.after(()=>f.cleanup());
  await f.post('/api/setup-submit',f.form());
  let active;
  for(let i=0;i<80;i++){active=await f.flow();if(active.progress?.recent.length===2)break;await new Promise(resolve=>setTimeout(resolve,20));}
  assert.equal(active.status,'running');assert.equal(active.progress.recent.length,2);assert.match(active.progress.message,/Preparing the local draft/);
  assert.ok(Number.isFinite(Date.parse(active.progress.startedAt)));assert.ok(Number.isFinite(Date.parse(active.progress.lastActivityAt)));
  assert.doesNotMatch(JSON.stringify(active.progress),/PRIVATE RAW OUTPUT|private\/source/);
  let done;
  for(let i=0;i<160;i++){done=await f.flow();if(done.status==='ready')break;await new Promise(resolve=>setTimeout(resolve,25));}
  assert.equal(done.status,'ready');assert.equal(done.canStop,false);
});

test('stage markers and safe action chips never treat prose or tool names as verified completion',async t=>{
  const f=await fixture(t);
  await writeFile(f.events,event('DS_CREATE_STAGE: decisions')+event('All done, validation passed, READY!'));
  const p=await f.read(f.dir);assert.equal(p.stage,'decisions');assert.equal(p.activity.length,1);
  assert.ok(preparationTasks({status:'running',progress:p}).every(t=>t.status!=='complete'));
  await appendFile(f.events,event('DS_CREATE_STAGE: ready')+JSON.stringify({type:'item.completed',item:{type:'reasoning',text:'PRIVATE REASONING'}})+'\n');
  assert.equal((await f.read(f.dir)).stage,'decisions');assert.doesNotMatch(JSON.stringify(await f.read(f.dir)),/PRIVATE REASONING/);
  await appendFile(f.events,JSON.stringify({type:'builder.stage',stage:'validation'})+'\n');
  assert.equal((await f.read(f.dir)).stage,'validation');
  for(const status of ['running','questions','failed','blocked','cancelled','interrupted','outdated'])assert.ok(preparationTasks({status,progress:p}).every(t=>t.status!=='complete'));
  assert.equal(preparationTasks({status:'questions',progress:p})[1].status,'input');
  assert.ok(preparationTasks({status:'ready',progress:p}).every(t=>t.status==='complete'));
});
