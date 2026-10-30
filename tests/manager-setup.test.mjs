import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {setupFixture} from './fixtures/manager-setup.mjs';
import {publishReady} from '../kit/manager/client/features/publish.mjs';
import {getState} from '../kit/manager/server/state.mjs';
import {createSetupJobs} from '../kit/manager/server/setup.mjs';
import {createFigmaJobs} from '../kit/manager/server/publish.mjs';
import {snapshotInputs} from '../kit/manager/server/files.mjs';
import {publishFixtureOutput} from './fixtures/manager-publish.mjs';
import {fixtureConsumer} from './fixtures/consumer.mjs';

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
 const cli=path.resolve('kit/manager/cli.mjs'),run=(cmd,...args)=>exec(process.execPath,[cli,cmd,'--workspace',root,...args]);
 const started=JSON.parse((await run('init-web')).stdout),slug=path.basename(started.outputDir);owned.push(started);
 assert.match(slug,/^session-/);assert.equal((await fetch(started.url+'/api/health')).status,200);
 const state=await fetch(started.url+'/api/state').then(r=>r.json());
 assert.equal(publishReady(state),false);
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
test('context and binary original filenames persist, question answers resume the guarded queue into review',async t=>{
 const f=await fixture(t,{mode:'questions'}),bytes=Buffer.from([0,255,1,2,42]);
 assert.equal((await f.post('/api/setup-submit',f.form('Exact context\nIn Indonesian.',[['Brand guide.pdf',bytes]]))).status,202);
 const q=await until(f,r=>r.status==='questions');assert.equal(q.questions.length,2);assert.equal(publishReady(await getState(f.output)),false);
 const saved=path.join(f.root,'workspace/input/synthetic-setup-fixture',q.files[0].path);assert.deepEqual(await readFile(saved),bytes);
 const record=JSON.parse(await readFile(path.join(f.output,'manager/setup.json')));assert.match(await readFile(path.join(f.root,'workspace/input/synthetic-setup-fixture',record.contextFile),'utf8'),/Exact context\nIn Indonesian\./);
 assert.equal((await f.post('/api/setup-answers',{jobId:'old',answers:[]})).status,409);
 assert.equal((await f.post('/api/setup-answers',{jobId:q.jobId,answers:[{id:'platform',value:'Web'}]})).status,400);
 assert.equal((await f.post('/api/setup-answers',{jobId:q.jobId,answers:[{id:'platform',value:'Web'},{id:'font',value:'Inter'}]})).status,202);
 const ready=await until(f,r=>r.status==='ready');assert.notEqual(ready.jobId,q.jobId);
 assert.equal(ready.inputSlug,'synthetic-setup-fixture');assert.equal(ready.inputPath,'workspace/input/synthetic-setup-fixture/');
 const state=await getState(f.output);assert.equal(publishReady(state),true);assert.equal(state.status,'review');assert.equal(state.initDone,false);assert.equal(state.source.review,'pending');assert.equal(state.summary.ready,7);
 const pub=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(pub.figma.canStart,true);assert.equal(pub.build.available,false);
 const ledger=JSON.parse(await readFile(path.join(f.output,'ds-create-ledger.json')));assert.equal(ledger.foundationReview.status,'pending');assert.equal(ledger.sequence[3].status,'todo');
 const prompt=await readFile(path.join(f.output,'received-prompt'),'utf8');assert.match(prompt,/NO Figma read\/write authorization/);
 const inputs=await readdir(path.join(f.root,'workspace/input/synthetic-setup-fixture/chat'));assert.equal(inputs.length,2);
 assert.equal((await f.post('/api/setup-submit',f.form())).status,409);
 const answered=JSON.parse(await readFile(path.join(f.output,'manager/setup.json'))),answerPath=answered.answerFiles[0],answerBytes=await readFile(path.join(f.root,'workspace/input/synthetic-setup-fixture',answerPath));
 await writeFile(path.join(f.output,'fake-mode'),'success');
 const revision=f.form('Keep the saved answers; revise the brief.');revision.set('inputRevision',String(ready.inputRevision));
 assert.equal((await f.post('/api/setup-revise',revision)).status,202);await until(f,r=>r.status==='ready');
 assert.deepEqual(await readFile(path.join(f.root,'workspace/input/synthetic-setup-fixture',answerPath)),answerBytes);
 assert.deepEqual(JSON.parse(await readFile(path.join(f.output,'manager/setup.json'))).answerFiles,answered.answerFiles);
});
test('fake success, invalid aliases, malformed questions, blocked and process failure never unlock Publish',async t=>{
 for(const mode of ['empty','alias','missing-dark','wrong-float','no-plan','wrong-name','bad-questions','blocked','fail']){
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
 await symlink(outside,path.join(f.root,'workspace/input/synthetic-setup-fixture'));
 assert.equal((await f.post('/api/setup-submit',f.form('x',[['safe.txt','body']]))).status,412);assert.deepEqual(await readdir(outside),[]);
 for(const url of ['/uploads/safe.txt','/setup-jobs/request.json','/setup-jobs.mjs'])assert.equal((await fetch(f.url+url)).status,404);
});
test('without an agent receiver, context and files remain durably queued and cancellable',async t=>{
 const f=await fixture(t,{autoRun:false});assert.equal(f.initial.available,true);
 assert.equal((await f.post('/api/setup-submit',f.form('',[['context.md','A product brief']]))).status,202);
 const r=await f.flow();assert.equal(r.status,'queued');assert.equal(r.canStop,true);assert.equal(r.canRetry,false);
 assert.equal(await readFile(path.join(f.root,'workspace/input/synthetic-setup-fixture',r.files[0].path),'utf8'),'A product brief');
});
test('single-flight, stop, timeout and changed user inputs are recoverable without claiming ready',async t=>{
 const f=await fixture(t,{mode:'hang'});await f.post('/api/setup-submit',f.form());await until(f,r=>r.status==='running');
 assert.equal((await f.post('/api/setup-submit',f.form())).status,409);
 assert.equal((await f.post('/api/setup-cancel',{})).status,202);assert.equal((await until(f,r=>r.status==='cancelled')).status,'cancelled');
 await writeFile(path.join(f.output,'fake-mode'),'success');await f.post('/api/setup-retry',{});assert.equal((await until(f,r=>r.status==='ready')).status,'ready');
 const timed=await fixture(t,{mode:'hang',timeoutMs:250});await timed.post('/api/setup-submit',timed.form());assert.equal((await until(timed,settled)).status,'failed');
 const stale=await fixture(t,{mode:'slow'});await stale.post('/api/setup-submit',stale.form());await until(stale,r=>r.status==='running');
 for(let i=0;i<80;i++){try{await readFile(path.join(stale.output,'received-prompt'));break;}catch{await new Promise(resolve=>setTimeout(resolve,25));}}
 const r=JSON.parse(await readFile(path.join(stale.output,'manager/setup.json')));await writeFile(path.join(stale.root,'workspace/input/synthetic-setup-fixture',r.contextFile),'Changed product context');
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
 assert.equal(await readFile(path.join(f.root,'workspace/input/synthetic-setup-fixture',original),'utf8'),'original unreadable bytes');
 assert.equal((await f.post('/api/setup-revise',rev)).status,409);
 const edit=f.form('New direction after review.',[],'Renamed synthetic project');edit.set('inputRevision',String(ready.inputRevision));
 assert.equal((await f.post('/api/setup-revise',edit)).status,202);ready=await until(f,r=>r.status==='ready');assert.equal(ready.inputRevision,3);assert.equal(ready.files.length,1);assert.equal(ready.projectName,'Renamed synthetic project');assert.equal((await getState(f.output)).system,'Renamed synthetic project');assert.equal(ready.projectId,'fixture');assert.equal(ready.resumeCommand,'ds-create init-web --slug fixture');
 const history=JSON.parse(await readFile(path.join(f.output,'manager/setup.json')));assert.equal(history.revisions[0].projectName,'Synthetic setup fixture');
 assert.equal(ready.inputSlug,'synthetic-setup-fixture');assert.equal(history.inputSlug,'synthetic-setup-fixture');
 const prompt=await readFile(path.join(f.output,'received-prompt'),'utf8');assert.match(prompt,/retained archives/);
});
test('new, modified and removed selected input dependencies invalidate readiness and publication',async t=>{
 const f=await fixture(t);await f.post('/api/setup-submit',f.form());await until(f,r=>r.status==='ready');
 const input=path.join(f.root,'workspace/input/synthetic-setup-fixture'),knowledge=path.join(input,'knowledge');await mkdir(knowledge);
 await writeFile(path.join(knowledge,'new-guideline.md'),'A newly supplied rule.');
 let pub=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(pub.figma.canStart,false);
 assert.equal((await getState(f.output)).initDone,false);assert.equal((await f.flow()).status,'outdated');assert.equal(publishReady(await getState(f.output)),false);
 await f.post('/api/setup-retry',{});await until(f,r=>r.status==='ready');
 await writeFile(path.join(knowledge,'new-guideline.md'),'Changed rule.');pub=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(pub.figma.canStart,false);
 await f.post('/api/setup-retry',{});await until(f,r=>r.status==='ready');await rm(path.join(knowledge,'new-guideline.md'));assert.equal((await f.flow()).status,'outdated');assert.equal(publishReady(await getState(f.output)),false);
});

test('project names are required, persist with Unicode/spaces, and never rename the stable session',async t=>{
 const f=await fixture(t,{autoRun:false});
 const missing=f.form();missing.delete('projectName');assert.equal((await f.post('/api/setup-submit',missing)).status,400);
 for(const name of ['', '   ', 'x'.repeat(101), 'Two\nlines'])assert.equal((await f.post('/api/setup-submit',f.form('A product brief.',[],name))).status,400);
 const duplicate=f.form();duplicate.append('projectName','Other');assert.equal((await f.post('/api/setup-submit',duplicate)).status,400);
 await assert.rejects(readdir(path.join(f.root,'workspace/input/synthetic-setup-fixture')),{code:'ENOENT'});
 const name='Ruang & Rasa — Sistem Desain';
 assert.equal((await f.post('/api/setup-submit',f.form('Actual context.',[],`  ${name}  `))).status,202);
 const saved=await f.flow(),record=JSON.parse(await readFile(path.join(f.output,'manager/setup.json')));
 assert.equal(saved.projectName,name);assert.equal(saved.projectId,'fixture');assert.equal((await getState(f.output)).system,name);
 assert.equal(saved.resumeCommand,'ds-create init-web --slug fixture');
 assert.equal(saved.inputSlug,'ruang-rasa-sistem-desain');assert.equal(record.inputSlug,saved.inputSlug);
 assert.ok((await readFile(path.join(f.root,saved.inputPath,record.contextFile),'utf8')).includes(name));
 const listed=JSON.parse((await exec(process.execPath,[path.resolve('kit/manager/cli.mjs'),'sessions','--workspace',f.root])).stdout);
 assert.equal(listed.sessions[0].name,name);assert.equal(listed.sessions[0].slug,'fixture');
});

test('the initial project name selects the input folder and preserves manually supplied session files',async t=>{
 const f=await fixture(t),old=path.join(f.root,'workspace/input/fixture');
 await mkdir(path.join(old,'brand'),{recursive:true});
 const bytes=Buffer.from([0,12,255,100]);await writeFile(path.join(old,'brand/original.pdf'),bytes);
 assert.equal((await f.post('/api/setup-submit',f.form('An actual synthetic brief.',[['guide.txt','New upload']],'  Café / Design System!  '))).status,202);
 const ready=await until(f,r=>r.status==='ready');assert.equal(ready.inputSlug,'cafe-design-system');
 assert.equal(ready.inputPath,'workspace/input/cafe-design-system/');assert.equal((await getState(f.output)).inputSlug,'cafe-design-system');assert.equal((await getState(f.output)).slug,'fixture');
 for(const input of [old,path.join(f.root,ready.inputPath)])assert.deepEqual(await readFile(path.join(input,'brand/original.pdf')),bytes);
 const request=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',ready.jobId,'request.json')));
 assert.equal(request.slug,'fixture');assert.equal(request.inputSlug,'cafe-design-system');assert.ok(request.inputFiles.includes('brand/original.pdf'));
 assert.ok((await readFile(path.join(f.output,'received-prompt'),'utf8')).includes('workspace/input/cafe-design-system/'));
 // A change to the inactive original tree does not invalidate the selected named tree.
 await writeFile(path.join(old,'brand/original.pdf'),'Old archived tree changed');assert.equal((await f.flow()).status,'ready');
});

test('occupied, symlinked and punctuation-only destinations never overwrite another input tree',async t=>{
 const f=await fixture(t,{autoRun:false}),input=path.join(f.root,'workspace/input');
 const occupied=path.join(input,'acme-design-system');await mkdir(occupied,{recursive:true});await writeFile(path.join(occupied,'guide.txt'),'Do not touch');
 const conflict=await f.post('/api/setup-submit',f.form('My brief',[],'Acme Design System'));
 assert.equal(conflict.status,409);assert.match((await conflict.json()).error,/already exists/);
 assert.equal(await readFile(path.join(occupied,'guide.txt'),'utf8'),'Do not touch');assert.deepEqual(await readdir(occupied),['guide.txt']);
 await symlink(occupied,path.join(input,'other-name'));
 assert.equal((await f.post('/api/setup-submit',f.form('My brief',[],'Other Name'))).status,412);
 assert.equal((await f.post('/api/setup-submit',f.form('My brief',[],'✨ — /'))).status,400);
 assert.equal((await f.flow()).status,'empty');assert.equal((await f.flow()).inputRevision,0);
 assert.equal((await f.post('/api/setup-submit',f.form('My brief',[],'Desain 日本語'))).status,202);
 assert.equal((await f.flow()).inputSlug,'desain-日本語');
 assert.ok((await snapshotInputs(f.root,'desain-日本語')).files.length);
});

test('two sessions cannot claim the same named input folder, even on concurrent saves',async t=>{
 const f=await fixture(t,{autoRun:false}),otherOutput=path.join(f.root,'workspace/output/other-session');
 await mkdir(path.join(otherOutput,'manager'),{recursive:true});await writeFile(path.join(otherOutput,'manager/setup.json'),JSON.stringify({status:'empty'}));
 const other=createSetupJobs({outputDir:otherOutput,workspace:f.root,agentCommand:'/nonexistent/codex'});
 const results=await Promise.allSettled([f.setup.submit(f.form('First source',[],'Shared Project')),other.submit(f.form('Second source',[],'Shared Project'))]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
 assert.match(results.find(r=>r.status==='rejected').reason.message,/already exists/);
 const files=(await snapshotInputs(f.root,'shared-project')).files;assert.equal(files.filter(f=>f.path.startsWith('chat/')).length,1);
});

test('legacy submitted sessions retain their input folder on preparation',async t=>{
 const f=await fixture(t),input=path.join(f.root,'workspace/input/fixture');await mkdir(path.join(input,'chat'),{recursive:true});
 await writeFile(path.join(input,'chat/legacy.md'),'An existing brief');
 await writeFile(path.join(f.output,'manager/setup.json'),JSON.stringify({format:'ds-create/setup@1',status:'failed',submitted:new Date().toISOString(),projectName:'Legacy Name',inputRevision:1,contextFile:'chat/legacy.md'}));
 assert.equal((await f.post('/api/setup-retry',{})).status,202);const ready=await until(f,r=>r.status==='ready');assert.equal(ready.inputSlug,'fixture');
 assert.equal(ready.inputPath,'workspace/input/fixture/');assert.ok((await getState(f.output)).summary.variables);
});

test('fake Figma continuation reads named input answers and binds approval to the selected tree',async t=>{
 const f=await fixture(t);await f.post('/api/setup-submit',f.form('Test brief',[],'Acme Design System'));const ready=await until(f,r=>r.status==='ready');
 const jobs=createFigmaJobs({outputDir:f.output,workspace:f.root,simulation:true});
 const consumer=fixtureConsumer({output:f.output,workspace:f.root,kind:'publish',execute:publishFixtureOutput});
 const cleanup=f.cleanup;f.cleanup=async()=>{await consumer.close();await cleanup();};
 const before=await jobs.status();assert.equal(before.figma.canStart,true);
 await jobs.start({hash:before.figma.hash,figmaUrl:'https://www.figma.com/design/Fixture/Test'});
 let done;
 for(let i=0;i<180;i++){done=await jobs.status();if(done.job && !['queued','running'].includes(done.job.status))break;await new Promise(resolve=>setTimeout(resolve,30));}
 assert.equal(done.job.status,'succeeded');assert.equal(done.figma.complete,true);assert.equal(done.build.available,true);
 const request=JSON.parse(await readFile(path.join(f.output,'manager/jobs',done.job.id,'request.json')));
 assert.equal(request.inputSlug,ready.inputSlug);assert.equal(request.inputHash,(await snapshotInputs(f.root,ready.inputSlug)).hash);
 assert.match(await readFile(path.join(f.output,'received-prompt'),'utf8'),/workspace\/input\/acme-design-system\//);
 assert.equal(await readFile(path.join(f.output,'received-answers'),'utf8'),await readFile(path.join(f.root,ready.inputPath,'answers/01-init.md'),'utf8'));
 await writeFile(path.join(f.root,ready.inputPath,'new-rule.md'),'New user rule');
 assert.equal((await getState(f.output)).initDone,false);assert.equal((await jobs.status()).build.available,false);
});
test('a project name mismatch in saved generation evidence blocks Publish after readiness',async t=>{
 const f=await fixture(t);await f.post('/api/setup-submit',f.form());await until(f,r=>r.status==='ready');
 const file=path.join(f.output,'foundation-plan.json'),plan=JSON.parse(await readFile(file));plan.projectName='A different project';await writeFile(file,JSON.stringify(plan));
 const pub=await fetch(f.url+'/api/publish-flow').then(r=>r.json());assert.equal(pub.figma.canStart,false);assert.equal(publishReady(await getState(f.output)),false);
});

test('a new-system agent result cannot silently omit the basic UI motion policy',async t=>{
 const f=await setupFixture({mode:'no-motion-policy'});t.after(()=>f.cleanup());await f.post('/api/setup-submit',f.form());
 const r=await until(f,settled);assert.equal(r.status,'failed');assert.match(r.message,/basic UI motion/);
});
test('a replacement chosen in the Publish font check becomes a user-decided input revision; keeping every font does not',async t=>{
 const f=await fixture(t);await f.post('/api/setup-submit',f.form('Test brief',[],'Acme Design System'));const ready=await until(f,r=>r.status==='ready');
 const jobs=createFigmaJobs({outputDir:f.output,workspace:f.root,simulation:true}),before=await jobs.status();
 assert.equal((await f.post('/api/publish-fonts',{choices:[]})).status,409,'no font check has run');
 const {job}=await jobs.start({hash:before.figma.hash,figmaUrl:'https://www.figma.com/design/Fixture/Test'}),dir=path.join(f.output,'manager/jobs',job.id);
 const status=JSON.parse(await readFile(path.join(dir,'status.json'))),delivery=JSON.parse(await readFile(path.join(dir,'mcp-delivery.json')));
 const roles=[{role:'ui',family:'Brand Sans',styles:['Regular','Medium'],label:'UI and body text',options:[{family:'Brand Sans Display',styles:['Regular','Medium','Bold'],note:'closest'},{family:'Inter',styles:['Regular','Medium','Bold'],note:'recommended'}]},
  {role:'display',family:'Brand Serif',styles:['Bold'],label:'Display and headings',options:[{family:'Inter',styles:['Bold'],note:'recommended'}]}];
 await writeFile(path.join(dir,'mcp-delivery.json'),JSON.stringify({...delivery,preflight:{passed:false,roles}}));await writeFile(path.join(dir,'status.json'),JSON.stringify({...status,status:'needs-fonts'}));
 const flow=await jobs.status();assert.equal(flow.job.status,'needs-fonts');assert.deepEqual(flow.job.fonts,roles);assert.equal(flow.figma.canStart,true);assert.equal(flow.recoveryPrompt,null);
 assert.equal((await f.post('/api/publish-fonts',{choices:[{role:'ui',family:'Brand Sans'},{role:'display',family:'Brand Serif'}]})).status,400,'keeping every font needs a re-check, not preparation');
 assert.equal((await f.post('/api/publish-fonts',{choices:[{role:'ui',family:'Comic Sans'},{role:'display',family:'Brand Serif'}]})).status,400,'only listed fonts');
 assert.equal((await f.post('/api/publish-fonts',{choices:[{role:'ui',family:'Inter'},{role:'display',family:'Brand Serif'}]})).status,202);
 const saved=JSON.parse(await readFile(path.join(f.output,'manager/setup.json'))),choice=saved.answerFiles.at(-1);
 assert.equal(saved.inputRevision,ready.inputRevision+1);
 const text=await readFile(path.join(f.root,ready.inputPath,choice),'utf8');
 assert.match(text,/Replace "Brand Sans" \(Regular, Medium\) with "Inter"/);assert.match(text,/Keep "Brand Serif"/);assert.match(text,/Decided by: user \(Publish font check\)/);
 const request=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',saved.jobId,'request.json')));assert.equal(request.fontChoiceFile,choice);assert.equal(request.previousJobId,ready.jobId);
 assert.equal(JSON.parse(await readFile(path.join(f.output,'ds-create-ledger.json'))).foundationReview.status,'pending');
});
