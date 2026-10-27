import test from 'node:test';
import assert from 'node:assert/strict';
import {access, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inputFreshness, listRootInputs, snapshotInputs} from '../kit/manager/server/files.mjs';
import {setupPrompt, validatePrepareRequest} from '../kit/manager/server/setup.mjs';
import {checkWebDraft} from '../kit/manager/server/verify.mjs';
import {setupFixture} from './fixtures/manager-setup.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function tree(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-root-inputs-'));
  const input = path.join(root, 'workspace/input');
  await mkdir(input, {recursive:true});
  t.after(() => rm(root, {recursive:true,force:true}));
  return {root,input};
}

test('root sources are hashed in place even before a selected folder exists, without walking other projects', async t => {
  const {root,input}=await tree(t),bytes=Buffer.from([0,255,1,10]);
  assert.equal((await snapshotInputs(root,'new-project')).hash,digest('[]'));
  await writeFile(path.join(input,'brand.html'),bytes);
  await writeFile(path.join(input,'README.md'),'Repository instructions, not a brand source.');
  await mkdir(path.join(input,'unrelated'),{recursive:true});
  await writeFile(path.join(input,'unrelated/private.md'),'Another project.');
  assert.deepEqual((await snapshotInputs(root,'new-project')).files,[{path:'../brand.html',size:bytes.length,hash:digest(bytes)}]);
  assert.deepEqual(await listRootInputs(root),[{name:'brand.html',path:'../brand.html',size:bytes.length}]);
  await mkdir(path.join(input,'new-project/answers'),{recursive:true});
  await writeFile(path.join(input,'new-project/brand.html'),'Selected brand, distinct from root.');
  await writeFile(path.join(input,'new-project/README.md'),'User-provided project brief.');
  await writeFile(path.join(input,'new-project/sources.md'),'Derived index.');
  await writeFile(path.join(input,'new-project/answers/01-init.md'),'Derived decisions.');
  const snapshot=await snapshotInputs(root,'new-project');
  assert.deepEqual(snapshot.files.map(f=>f.path),['../brand.html','brand.html','README.md']);
  assert.deepEqual(await readFile(path.join(input,'brand.html')),bytes);
  await writeFile(path.join(input,'unrelated/private.md'),'Unrelated edit must not invalidate selected inputs.');
  assert.equal((await snapshotInputs(root,'new-project')).hash,snapshot.hash);
});

test('root links are never followed and selected symlink trees remain rejected', async t => {
  const {root,input}=await tree(t),outside=path.join(root,'outside.md');
  await writeFile(outside,'Outside contents.');
  await symlink(outside,path.join(input,'linked.md'));
  assert.deepEqual((await snapshotInputs(root,'selected')).files,[]);
  assert.deepEqual(await listRootInputs(root),[]);
  await rm(path.join(input,'linked.md'));
  await symlink(root,path.join(input,'selected'));
  await assert.rejects(snapshotInputs(root,'selected'),/real workspace directories/);
});

test('root-only web intake lists the source and delivers its exact hash/path before missing questions', async t => {
  const f=await setupFixture({autoRun:false});t.after(()=>f.cleanup());
  const input=path.join(f.root,'workspace/input'),original=Buffer.from('<h1>Supplied product and brand</h1>');
  await mkdir(input,{recursive:true});await writeFile(path.join(input,'product.html'),original);
  assert.equal((await f.flow()).rootFiles[0].name,'product.html');
  assert.equal((await f.post('/api/setup-submit',f.form(''))).status,202);
  const flow=await f.flow(),file=path.join(f.output,'manager/setup-jobs',flow.jobId,'request.json');
  const request=JSON.parse(await readFile(file));
  assert.ok(request.inputFiles.includes('../product.html'));
  assert.deepEqual(request.inputSnapshot.find(f=>f.path==='../product.html'),{path:'../product.html',size:original.length,hash:digest(original)});
  assert.deepEqual(await readFile(path.join(input,'product.html')),original);
  await assert.rejects(access(path.join(input,flow.inputSlug,'product.html')), {code:'ENOENT'});
  assert.match(setupPrompt(request,file),/read EVERY file.*before asking missing design questions/);
  assert.match(setupPrompt(request,file),/shared files directly in workspace\/input/);
  await validatePrepareRequest(f.output,f.root,flow.jobId);
  await writeFile(path.join(input,'product.html'),'Revised source.');
  await assert.rejects(validatePrepareRequest(f.output,f.root,flow.jobId),/Context files changed/);
});

test('root changes invalidate ready draft proof and sources can reference exact root keys', async t => {
  const f=await setupFixture();t.after(()=>f.cleanup());
  const input=path.join(f.root,'workspace/input'),file=path.join(input,'brief.md');
  await mkdir(input,{recursive:true});await writeFile(file,'Source v1');
  assert.equal((await f.post('/api/setup-submit',f.form())).status,202);
  let flow;for(let i=0;i<100;i++){flow=await f.flow();if(flow.status==='ready')break;await new Promise(r=>setTimeout(r,25));}
  assert.equal(flow.status,'ready');
  const setup=JSON.parse(await readFile(path.join(f.output,'manager/setup.json')));
  const planFile=path.join(f.output,'foundation-plan.json'),plan=JSON.parse(await readFile(planFile));
  plan.decisions[0].source='../brief.md';await writeFile(planFile,JSON.stringify(plan));
  assert.equal((await checkWebDraft(f.output,f.root,setup)).valid,true);
  for(const change of ['edit','add','remove']){
    await writeFile(file,'Source v1');await rm(path.join(input,'new.md'),{force:true});
    if(change==='edit')await writeFile(file,'Source v2');
    if(change==='add')await writeFile(path.join(input,'new.md'),'New input');
    if(change==='remove')await rm(file);
    assert.equal((await inputFreshness(f.output,setup)).fresh,false,change);
    const proof=await checkWebDraft(f.output,f.root,setup);
    assert.equal(proof.valid,false,change);assert.ok(proof.errors.some(e=>/input snapshot/.test(e)));
  }
  assert.equal((await f.flow()).status,'outdated');
});

test('questions from a snapshot missing a new root file are retired before answers can override that source', async t => {
  const f=await setupFixture({mode:'questions'});t.after(()=>f.cleanup());
  await f.post('/api/setup-submit',f.form());
  let flow;for(let i=0;i<100;i++){flow=await f.flow();if(flow.status==='questions')break;await new Promise(r=>setTimeout(r,25));}
  assert.equal(flow.status,'questions');const previous=flow;
  await writeFile(path.join(f.root,'workspace/input/brand.md'),'The brand file already answers these questions.');
  const obsolete={jobId:previous.jobId,answers:previous.questions.map(q=>({id:q.id,value:'Do not override the new source.'}))};
  assert.equal((await f.post('/api/setup-answers',obsolete)).status,409);
  flow=await f.flow();assert.equal(flow.status,'outdated');assert.deepEqual(flow.questions,[]);assert.equal(flow.canRetry,true);
  assert.equal((await f.post('/api/setup-retry',{})).status,202);
  const current=await f.flow(),request=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',current.jobId,'request.json')));
  assert.ok(request.inputFiles.includes('../brand.md'));
});
