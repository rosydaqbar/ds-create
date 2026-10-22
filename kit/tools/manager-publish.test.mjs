import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createFigmaJobs, targetFile } from '../manager/figma-jobs.mjs';
import { publishFixture } from './fixtures/manager-publish.mjs';
import { getState } from '../manager/state.mjs';

async function settled(f) {
  for(let i=0;i<150;i++){const s=await f.flow();if(s.job&&!['queued','running'].includes(s.job.status))return s;await new Promise(r=>setTimeout(r,30));}
  throw new Error('Test job did not settle');
}
const target='https://www.figma.com/design/Fixture/Test';

test('Publish runs a local subprocess, approves only saved bytes, and unlocks build after verified output',async t=>{
  const f=await publishFixture();t.after(()=>f.cleanup());
  const before=await readFile(path.join(f.output,'foundations.json'),'utf8');
  assert.equal(f.initial.figma.canStart,true);assert.equal(f.initial.build.available,false);
  const response=await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:target});assert.equal(response.status,202);
  const done=await settled(f);assert.equal(done.job.status,'succeeded');assert.equal(done.figma.complete,true);assert.equal(done.build.available,true);assert.equal(done.build.status,'not-run');
  const ledger=JSON.parse(await readFile(path.join(f.output,'ds-create-ledger.json'),'utf8'));
  assert.equal(ledger.foundationReview.approvedBy,'user');assert.match(ledger.foundationReview.approvalSource,/manager\/jobs\//);
  assert.equal(ledger.foundationReview.hash,f.initial.figma.hash);assert.equal(ledger.foundationReview.figmaHash,f.initial.figma.hash);
  assert.equal(await readFile(path.join(f.output,'foundations.json'),'utf8'),before);
  assert.match(await readFile(path.join(f.output,'received-prompt'),'utf8'),/Do not alter foundations.json/);
  assert.equal((await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:target})).status,202,'complete request is idempotent');
});

test('no process exit or ledger-only audit can fake completed Figma output',async t=>{
  for(const mode of ['empty','no-audit','different-value','different-alias','fail','blocked']) {
    const f=await publishFixture({mode});t.after(()=>f.cleanup());
    await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:target});
    const result=await settled(f);assert.equal(result.figma.complete,false,mode);assert.equal(result.build.available,false,mode);
    assert.equal((await getState(f.output)).initDone,false, 'the CLI/build gate also requires saved audit evidence');
    assert.equal(result.job.status,mode==='blocked'?'blocked':'failed',mode);
    if(mode.startsWith('different-')){const diff=JSON.parse(await readFile(path.join(f.output,'manager/jobs',result.job.id,'foundation-diff.json')));assert.equal(diff.match,false);assert.ok(diff.differences.length);}
  }
});

test('mutations reject other origins, missing tokens, malformed payloads, stale drafts and arbitrary commands',async t=>{
  const f=await publishFixture();t.after(()=>f.cleanup());
  const input={hash:f.initial.figma.hash,figmaUrl:target};
  assert.equal((await f.post('/api/publish-figma',input,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await f.post('/api/publish-figma',input,{'X-DS-Create-Token':'bad'})).status,403);
  assert.equal((await f.post('/api/publish-figma',input,{'Content-Type':'text/plain'})).status,415);
  assert.equal((await f.post('/api/publish-figma',{...input,command:'touch unexpected'})).status,400);
  assert.equal((await f.post('/api/publish-figma',{...input,figmaUrl:'https://figma.com.evil.example/design/Fixture'})).status,400);
  assert.equal((await f.post('/api/publish-figma',{...input,hash:'old'})).status,409);
  assert.equal((await f.flow()).job,null);
  assert.equal((await fetch(f.url+'/api/state',{method:'POST'})).status,405);
});

test('duplicate requests stay single-flight; cancellation and time limits keep build locked',async t=>{
  const f=await publishFixture({mode:'hang'});t.after(()=>f.cleanup());
  const input={hash:f.initial.figma.hash,figmaUrl:target};
  const a=await (await f.post('/api/publish-figma',input)).json();
  const b=await (await f.post('/api/publish-figma',input)).json();assert.equal(a.job.id,b.job.id);assert.equal(b.reused,true);
  assert.equal((await f.post('/api/publish-cancel',{})).status,202);
  assert.equal((await settled(f)).build.available,false);
  const limited=await publishFixture({mode:'hang',timeoutMs:250});t.after(()=>limited.cleanup());
  await limited.post('/api/publish-figma',{hash:limited.initial.figma.hash,figmaUrl:target});
  const result=await settled(limited);assert.equal(result.job.status,'failed');assert.equal(result.build.available,false);
});

test('changing the draft during a job invalidates the completed old revision',async t=>{
  const f=await publishFixture({mode:'slow'});t.after(()=>f.cleanup());
  await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:target});
  for(let i=0;i<100;i++){try{await readFile(path.join(f.output,'received-prompt'));break;}catch{await new Promise(r=>setTimeout(r,20));}}
  const file=path.join(f.output,'foundations.json');
  const draft=JSON.parse(await readFile(file,'utf8'));draft.revision=2;await writeFile(file,JSON.stringify(draft));
  const result=await settled(f);assert.equal(result.build.available,false);assert.notEqual(result.figma.hash,f.initial.figma.hash);
});

test('sample data, invalid aliases, missing local agent and missing answers are explicit blockers',async t=>{
  const f=await publishFixture();t.after(()=>f.cleanup());
  const real=createFigmaJobs({outputDir:f.output,workspace:f.root});assert.match((await real.status()).figma.reason,/Sample data/);
  const absent=createFigmaJobs({outputDir:f.output,workspace:f.root,simulation:true,agentCommand:'/nonexistent/codex'});assert.match((await absent.status()).figma.reason,/CLI is unavailable/);
  const file=path.join(f.output,'foundations.json');const draft=JSON.parse(await readFile(file,'utf8'));draft.variables[1].values.Light={alias:'missing'};await writeFile(file,JSON.stringify(draft));
  let current=await f.flow();assert.equal((await f.post('/api/publish-figma',{hash:current.figma.hash,figmaUrl:target})).status,412);
  draft.variables[1].values.Light={alias:'palette/base/white'};await writeFile(file,JSON.stringify(draft));await rm(path.join(f.root,'workspace/input/fixture/answers/01-init.md'));
  current=await f.flow();assert.equal((await f.post('/api/publish-figma',{hash:current.figma.hash,figmaUrl:target})).status,412);
  assert.equal(targetFile('javascript:alert(1)'),null);
});

test('new context arriving during publication blocks completion despite matching draft and passing audit',async t=>{
 const f=await publishFixture({mode:'slow'});t.after(()=>f.cleanup());
 await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:target});
 for(let i=0;i<100;i++){try{await readFile(path.join(f.output,'received-prompt'));break;}catch{await new Promise(r=>setTimeout(r,20));}}
 await writeFile(path.join(f.root,'workspace/input/fixture/new-guideline.md'),'New rule from user');
 const result=await settled(f);assert.equal(result.job.status,'blocked');assert.equal(result.build.available,false);
});
