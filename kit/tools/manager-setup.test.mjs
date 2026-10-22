import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm, symlink, readdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setupFixture } from './fixtures/manager-setup.mjs';
import { getState } from '../manager/state.mjs';
const exec=promisify(execFile);
async function until(f,predicate,ms=9000){const start=Date.now();let r;do{r=await f.flow();if(predicate(r))return r;await new Promise(resolve=>setTimeout(resolve,40));}while(Date.now()-start<ms);throw new Error(JSON.stringify(r));}
async function fixture(t,options){const f=await setupFixture(options);t.after(()=>f.cleanup());return f;}
const settled=r=>!['queued','running','empty'].includes(r.status);

test('init-web opens an empty detached Builder, no tokens or completed ledger; same slug reuses it',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'ds-bootstrap-'));
 const owned=[];
 t.after(async()=>{
  for(const instance of owned){
   try{await run('stop','--slug',path.basename(instance.outputDir));}catch{/* runtime may already be absent; only terminate our recorded child */}
   finally{try{process.kill(instance.pid,0);process.kill(instance.pid,'SIGTERM');}catch{}}
   for(let i=0;i<40;i++){try{process.kill(instance.pid,0);}catch{break;}await new Promise(resolve=>setTimeout(resolve,50));}
   assert.throws(()=>process.kill(instance.pid,0),/ESRCH/);
  }
  await rm(root,{recursive:true,force:true});
 });
 const cli=path.resolve('kit/tools/manager.mjs'),run=(cmd,...args)=>exec(process.execPath,[cli,cmd,'--workspace',root,...args]);
 const started=JSON.parse((await run('init-web')).stdout),slug=path.basename(started.outputDir);owned.push(started);
 assert.match(slug,/^session-/);assert.equal((await fetch(started.url+'/api/health')).status,200);
 const state=await fetch(started.url+'/api/state').then(r=>r.json());
 assert.equal(state.setup.status,'empty');assert.equal(state.initDone,false);assert.equal(state.summary.variables,0);
 await assert.rejects(readFile(path.join(started.outputDir,'ds-create-ledger.json')),{code:'ENOENT'});
 const listed=JSON.parse((await run('sessions')).stdout);assert.equal(listed.sessions.length,1);assert.match(listed.sessions[0].resumeCommand,new RegExp(slug));
 const choice=JSON.parse((await run('init-web')).stdout);assert.equal(choice.action,'choose-session');assert.equal(choice.sessions.length,1);
 const again=JSON.parse((await run('init-web','--slug',slug)).stdout);assert.equal(again.pid,started.pid);
 assert.match(await fetch(started.url).then(r=>r.text()),/Context \/ Instruction/);
 const fresh=JSON.parse((await run('init-web','--new')).stdout);owned.push(fresh);assert.notEqual(fresh.pid,started.pid);assert.notEqual(fresh.outputDir,started.outputDir);
 assert.equal(JSON.parse((await run('sessions')).stdout).sessions.length,2);
 await rm(path.join(started.outputDir,'manager/runtime.json')); // exercise exact-owned-PID cleanup fallback

});
test('context and binary original filenames persist, question answers resume a real fake subprocess into review',async t=>{
 const f=await fixture(t,{mode:'questions'}),bytes=Buffer.from([0,255,1,2,42]);
 assert.equal((await f.post('/api/setup-submit',f.form('Exact context\nIn Indonesian.',[['Brand guide.pdf',bytes]]))).status,202);
 const q=await until(f,r=>r.status==='questions');assert.equal(q.questions.length,2);
 const saved=path.join(f.root,'workspace/input/fixture',q.files[0].path);assert.deepEqual(await readFile(saved),bytes);
 const record=JSON.parse(await readFile(path.join(f.output,'manager/setup.json')));assert.match(await readFile(path.join(f.root,'workspace/input/fixture',record.contextFile),'utf8'),/Exact context\nIn Indonesian\./);
 assert.equal((await f.post('/api/setup-answers',{jobId:'old',answers:[]})).status,409);
 assert.equal((await f.post('/api/setup-answers',{jobId:q.jobId,answers:[{id:'platform',value:'Web'}]})).status,400);
 assert.equal((await f.post('/api/setup-answers',{jobId:q.jobId,answers:[{id:'platform',value:'Web'},{id:'font',value:'Inter'}]})).status,202);
 const ready=await until(f,r=>r.status==='ready');assert.notEqual(ready.jobId,q.jobId);
 const state=await getState(f.output);assert.equal(state.status,'review');assert.equal(state.initDone,false);assert.equal(state.source.review,'pending');assert.equal(state.summary.ready,6);
 const pub=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(pub.figma.canStart,true);assert.equal(pub.build.available,false);
 const ledger=JSON.parse(await readFile(path.join(f.output,'ds-create-ledger.json')));assert.equal(ledger.foundationReview.status,'pending');assert.equal(ledger.sequence[3].status,'todo');
 const prompt=await readFile(path.join(f.output,'received-prompt'),'utf8');assert.match(prompt,/NO Figma read\/write authorization/);
 const inputs=await readdir(path.join(f.root,'workspace/input/fixture/chat'));assert.equal(inputs.length,2);
 assert.equal((await f.post('/api/setup-submit',f.form())).status,409);
 const answered=JSON.parse(await readFile(path.join(f.output,'manager/setup.json'))),answerPath=answered.answerFiles[0],answerBytes=await readFile(path.join(f.root,'workspace/input/fixture',answerPath));
 await writeFile(path.join(f.output,'fake-mode'),'success');
 const revision=f.form('Keep the saved answers; revise the brief.');revision.set('inputRevision',String(ready.inputRevision));
 assert.equal((await f.post('/api/setup-revise',revision)).status,202);await until(f,r=>r.status==='ready');
 assert.deepEqual(await readFile(path.join(f.root,'workspace/input/fixture',answerPath)),answerBytes);
 assert.deepEqual(JSON.parse(await readFile(path.join(f.output,'manager/setup.json'))).answerFiles,answered.answerFiles);
});
test('fake success, invalid aliases, malformed questions, blocked and process failure never unlock Publish',async t=>{
 for(const mode of ['empty','alias','missing-dark','wrong-float','no-plan','bad-questions','blocked','fail']){
  const f=await fixture(t,{mode});await f.post('/api/setup-submit',f.form());const r=await until(f,settled);assert.notEqual(r.status,'ready',mode);
  assert.equal((await getState(f.output)).initDone,false);
  const p=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(p.figma.canStart,false);assert.equal(p.build.available,false);
  assert.equal((await f.post('/api/setup-retry',{command:'rm'})).status,400);
 }
});
test('upload endpoint rejects cross-site, nonce, extra fields, empty/duplicate/large files and symlink storage',async t=>{
 const f=await fixture(t);
 assert.equal((await f.post('/api/setup-submit',f.form(),{Origin:'https://evil.example'})).status,403);
 assert.equal((await f.post('/api/setup-submit',f.form(),{'X-DS-Create-Token':'bad'})).status,403);
 assert.equal((await f.post('/api/setup-submit',{})).status,415);
 const extra=f.form();extra.set('command','arbitrary');assert.equal((await f.post('/api/setup-submit',extra)).status,400);
 assert.equal((await f.post('/api/setup-submit',f.form(''))).status,400);
 assert.equal((await f.post('/api/setup-submit',f.form('x',[['same.txt','a'],['same.txt','b']]))).status,400);
 assert.equal((await f.post('/api/setup-submit',f.form('x',[['large.bin',Buffer.alloc(25*1024*1024+1)]]))).status,413);
 await mkdir(path.join(f.root,'workspace/input'),{recursive:true});const outside=await mkdtemp(path.join(tmpdir(),'ds-outside-'));t.after(()=>rm(outside,{recursive:true,force:true}));
 await symlink(outside,path.join(f.root,'workspace/input/fixture'));
 assert.equal((await f.post('/api/setup-submit',f.form('x',[['safe.txt','body']]))).status,412);assert.deepEqual(await readdir(outside),[]);
 for(const url of ['/uploads/safe.txt','/setup-jobs/request.json','/setup-worker.mjs'])assert.equal((await fetch(f.url+url)).status,404);
});
test('missing CLI still saves context and files durably, with retry guidance',async t=>{
 const f=await fixture(t,{agentCommand:'/nonexistent/codex'});assert.equal(f.initial.available,false);
 assert.equal((await f.post('/api/setup-submit',f.form('',[['context.md','A product brief']]))).status,202);
 const r=await f.flow();assert.equal(r.status,'blocked');assert.equal(r.canRetry,true);assert.match(r.message,/Install Codex/);
 assert.equal(await readFile(path.join(f.root,'workspace/input/fixture',r.files[0].path),'utf8'),'A product brief');
});
test('single-flight, stop, timeout and changed user inputs are recoverable without claiming ready',async t=>{
 const f=await fixture(t,{mode:'hang'});await f.post('/api/setup-submit',f.form());await until(f,r=>r.status==='running');
 assert.equal((await f.post('/api/setup-submit',f.form())).status,409);
 assert.equal((await f.post('/api/setup-cancel',{})).status,202);assert.equal((await f.flow()).status,'cancelled');
 await writeFile(path.join(f.output,'fake-mode'),'success');await f.post('/api/setup-retry',{});assert.equal((await until(f,r=>r.status==='ready')).status,'ready');
 const timed=await fixture(t,{mode:'hang',timeoutMs:250});await timed.post('/api/setup-submit',timed.form());assert.equal((await until(timed,settled)).status,'failed');
 const stale=await fixture(t,{mode:'slow'});await stale.post('/api/setup-submit',stale.form());await until(stale,r=>r.status==='running');
 for(let i=0;i<80;i++){try{await readFile(path.join(stale.output,'received-prompt'));break;}catch{await new Promise(resolve=>setTimeout(resolve,25));}}
 const r=JSON.parse(await readFile(path.join(stale.output,'manager/setup.json')));await writeFile(path.join(stale.root,'workspace/input/fixture',r.contextFile),'Changed product context');
 assert.match((await until(stale,settled)).message,/changed/);assert.equal((await getState(stale.output)).summary.ready,0);
});

test('revisions recover unreadable inputs, preserve originals/answers, and reject stale tabs',async t=>{
 const f=await fixture(t,{mode:'questions'});
 await f.post('/api/setup-submit',f.form('Read my guide.',[['guide.pdf','original unreadable bytes']]));
 const q=await until(f,r=>r.status==='questions'),original=q.files[0].path;
 const rev=f.form('Use the readable replacement. Web, Inter.',[['guide.pdf','readable replacement']]);rev.set('inputRevision',String(q.inputRevision));
 await writeFile(path.join(f.output,'fake-mode'),'success');
 assert.equal((await f.post('/api/setup-revise',rev)).status,202);
 let ready=await until(f,r=>r.status==='ready');assert.equal(ready.inputRevision,2);assert.notEqual(ready.files[0].path,original);
 assert.equal(await readFile(path.join(f.root,'workspace/input/fixture',original),'utf8'),'original unreadable bytes');
 assert.equal((await f.post('/api/setup-revise',rev)).status,409);
 const edit=f.form('New direction after review.');edit.set('inputRevision',String(ready.inputRevision));
 assert.equal((await f.post('/api/setup-revise',edit)).status,202);ready=await until(f,r=>r.status==='ready');assert.equal(ready.inputRevision,3);assert.equal(ready.files.length,1);
 const prompt=await readFile(path.join(f.output,'received-prompt'),'utf8');assert.match(prompt,/retained archives/);
});
test('new, modified and removed selected input dependencies invalidate readiness and publication',async t=>{
 const f=await fixture(t);await f.post('/api/setup-submit',f.form());await until(f,r=>r.status==='ready');
 const input=path.join(f.root,'workspace/input/fixture'),knowledge=path.join(input,'knowledge');await mkdir(knowledge);
 await writeFile(path.join(knowledge,'new-guideline.md'),'A newly supplied rule.');
 let pub=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(pub.figma.canStart,false);
 assert.equal((await getState(f.output)).initDone,false);assert.equal((await f.flow()).status,'outdated');
 await f.post('/api/setup-retry',{});await until(f,r=>r.status==='ready');
 await writeFile(path.join(knowledge,'new-guideline.md'),'Changed rule.');pub=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(pub.figma.canStart,false);
 await f.post('/api/setup-retry',{});await until(f,r=>r.status==='ready');await rm(path.join(knowledge,'new-guideline.md'));assert.equal((await f.flow()).status,'outdated');
});
