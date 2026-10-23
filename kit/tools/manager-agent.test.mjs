import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,readFile,chmod,access} from 'node:fs/promises';
import path from 'node:path';
import {publishFixture} from './fixtures/manager-publish.mjs';
import {getState} from '../manager/state.mjs';
import {publishReady} from '../manager/publish.mjs';
import {createFigmaJobs} from '../manager/figma-jobs.mjs';
import {linkChat,queueChatJob,chatJobStatus,chatAction,cancelChatJob} from '../manager/agent-bridge.mjs';
const target='https://www.figma.com/design/Fixture/Test';
const json=async f=>JSON.parse(await readFile(f,'utf8'));
async function fixture(t,mode='accepted'){
 const f=await publishFixture({mode:'blocked'});t.after(()=>f.cleanup());
 // Use the HTTP approval path once, then retry exactly this saved approved request.
 const {job}=await (await f.post('/api/publish-figma',{hash:f.initial.figma.hash,figmaUrl:target})).json();
 for(let i=0;i<100;i++){if((await f.flow()).job.status==='blocked')break;await new Promise(r=>setTimeout(r,20));}
 const base={outputDir:f.output,workspace:f.root,id:job.id};
 const script=path.join(f.root,'orca-fixture.cjs');
 await writeFile(path.join(f.root,'bridge-mode'),mode);
 await writeFile(script,`#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),root=${JSON.stringify(f.root)};
const mode=fs.readFileSync(path.join(root,'bridge-mode'),'utf8'),args=process.argv.slice(2);
if(args[1]==='show')console.log(JSON.stringify({ok:true,result:{terminal:{connected:true,writable:true,agentIdentity:'codex',incarnationId:mode==='replaced'?'other':'fixture-process',worktreePath:mode==='stale'?'/tmp':root}}}));
else {fs.appendFileSync(path.join(root,'sent.jsonl'),JSON.stringify(args)+'\\n'); if(mode==='lost'){process.stderr.write('receipt lost');process.exit(1);}console.log(JSON.stringify({ok:true,result:{send:{accepted:mode!=='refused',prompt:{requestId:'fixture-delivery',stages:['input_accepted']}}}}));}
`);await chmod(script,0o755);
 await linkChat({...base,terminal:'term_fixture',command:script});
 const action=(action,extra={})=>chatAction({...base,attempt:extra.attempt||f.attempt,actor:'worker-one',action,...extra});
 return Object.assign(f,{base,action,script,jobId:job.id,async queue(){const r=await queueChatJob(base);f.attempt=(await chatJobStatus(f.output,f.root,job.id)).delivery.attempt;return r;},state:()=>chatJobStatus(f.output,f.root,job.id),sent:async()=>readFile(path.join(f.root,'sent.jsonl'),'utf8')});
}
test('approved retry delivers once, exclusive worker claims, real progress, unchanged approval and cancellation',async t=>{
 const f=await fixture(t),before=await readFile(path.join(f.output,'ds-create-ledger.json'),'utf8');
 const request=await readFile(path.join(f.output,'manager/jobs',f.jobId,'request.json'),'utf8');
 assert.equal((await f.queue()).delivery,'accepted');assert.equal((await f.state()).status.status,'queued');
 assert.equal((await f.queue()).reused,true);assert.equal((await f.sent()).trim().split('\n').length,1);
 const argv=JSON.parse((await f.sent()).trim().split('\n')[0]);assert.equal(argv[argv.indexOf('--wait-submit')+1],'1');
 assert.match(await f.sent(),/DS_CREATE_AGENT_REQUEST/);assert.doesNotMatch(await f.sent(),/approval_policy/);
 assert.equal((await f.action('claim')).claimed,true);
 await assert.rejects(f.action('claim',{actor:'worker-two'}),/already claimed/);
 await f.action('update',{message:'Checking fonts.'});assert.equal((await f.state()).status.message,'Checking fonts.');
 const jobs=createFigmaJobs({...f.base,simulation:true,runner:'chat'});await jobs.shutdown();assert.equal((await f.state()).status.status,'running','viewer shutdown never cancels native work');
 assert.equal((await jobs.cancel()).requested,true);assert.equal((await f.state()).status.status,'running');
 assert.equal((await f.action('update',{message:'Working'})).cancelRequested,true);
 await assert.rejects(f.action('report',{outcome:'completed'}),/cancellation/);
 assert.equal((await f.action('report',{outcome:'cancelled',message:'Stopped safely.'})).status,'cancelled');
 assert.equal(await readFile(path.join(f.output,'ds-create-ledger.json'),'utf8'),before);
 assert.equal(await readFile(path.join(f.output,'manager/jobs',f.jobId,'request.json'),'utf8'),request);
 assert.equal((await jobs.status()).build.available,false);
 const retry=await jobs.start({hash:f.initial.figma.hash,figmaUrl:target});assert.equal(retry.job.id,f.jobId);
 assert.equal(await readFile(path.join(f.output,'ds-create-ledger.json'),'utf8'),before);await jobs.cancel();
});
test('cancel before claim fences queued delivery; old attempt cannot own a resumed job',async t=>{
 const f=await fixture(t);await f.queue();const old=f.attempt;
 assert.equal((await cancelChatJob(f.base)).stopped,true);await assert.rejects(f.action('claim'),/no longer active/);
 await f.queue();assert.notEqual(f.attempt,old);await assert.rejects(f.action('claim',{attempt:old}),/no longer active/);
 await f.action('claim');await f.action('report',{outcome:'blocked',message:'Tool requires permission.'});
});
test('ambiguous/refused delivery stays unconfirmed and is never automatically resent',async t=>{
 for(const mode of ['lost','refused']){
  const f=await fixture(t,mode);assert.equal((await f.queue()).delivery,'unconfirmed');
  assert.equal((await f.queue()).reused,true);assert.equal((await f.sent()).trim().split('\n').length,1);
  assert.equal((await f.state()).delivery.actor,undefined);assert.equal((await f.state()).status.status,'queued');
 }
});
test('stale chat, changed draft/context/target or absent approval blocks work',async t=>{
 for(const mutate of ['stale','replaced','draft','input','target','approval']){
  const f=await fixture(t);
  if(['stale','replaced'].includes(mutate))await writeFile(path.join(f.root,'bridge-mode'),mutate);
  if(mutate==='draft')await writeFile(path.join(f.output,'foundations.json'),'{}');
  if(mutate==='input')await writeFile(path.join(f.root,'workspace/input/fixture/new.md'),'changed');
  if(['target','approval'].includes(mutate)){const file=path.join(f.output,'ds-create-ledger.json'),l=await json(file);if(mutate==='target')l.figma.url='https://www.figma.com/design/Other';else l.foundationReview.status='pending';await writeFile(file,JSON.stringify(l));}
  await assert.rejects(f.queue());await assert.rejects(access(path.join(f.root,'sent.jsonl')));
 }
});
test('worker text cannot fake completion; cancellation/blocked reports can settle a changed input',async t=>{
 const f=await fixture(t);await f.queue();await f.action('claim');
 assert.equal((await f.action('report',{outcome:'completed',message:'Done'})).status,'failed');
 await f.queue();await f.action('claim');await writeFile(path.join(f.root,'workspace/input/fixture/new.md'),'new rule');
 await assert.rejects(f.action('update',{message:'Still working'}),/Inputs changed/);
 assert.equal((await f.action('report',{outcome:'blocked',message:'Inputs changed; stopped further writes.'})).status,'blocked');
});
test('production Publish uses linked chat and never a detached CLI; browser cannot select bridge',async t=>{
 const f=await publishFixture();t.after(()=>f.cleanup());
 const file=path.join(f.output,'ds-create-ledger.json'),l=await json(file);delete l.preview;await writeFile(file,JSON.stringify(l));
 const jobs=createFigmaJobs({outputDir:f.output,workspace:f.root,agentCommand:'/does-not-exist'});
 assert.match((await jobs.status()).figma.reason,/Link the active/);
 await assert.rejects(jobs.start({hash:f.initial.figma.hash,figmaUrl:target,terminal:'term_other'}),/Only the saved/);
 assert.throws(()=>createFigmaJobs({outputDir:f.output,workspace:f.root,runner:'cli'}),/restricted/);
});

test('fresh production approval starts only a chat request and exposes queued/running state',async t=>{
 const f=await fixture(t),file=path.join(f.output,'ds-create-ledger.json'),l=await json(file);delete l.preview;await writeFile(file,JSON.stringify(l));
 const jobs=createFigmaJobs({outputDir:f.output,workspace:f.root,agentCommand:'/nonexistent/codex'});
 const freshTarget='https://www.figma.com/design/Fresh/Test';
 const r=await jobs.start({hash:f.initial.figma.hash,figmaUrl:freshTarget});assert.notEqual(r.job.id,f.jobId);assert.equal(r.delivery,'accepted');
 const j=await chatJobStatus(f.output,f.root,r.job.id);assert.equal(j.status.runner,'chat');assert.equal(j.status.pid,undefined);
 assert.equal(j.delivery.receipt.send.prompt.requestId,'fixture-delivery');assert.equal((await jobs.status()).agent.name,'Active chat · visible background agent');
 await assert.rejects(access(path.join(f.output,'manager/jobs',r.job.id,'result.json')));
 assert.equal((await jobs.start({hash:f.initial.figma.hash,figmaUrl:freshTarget})).reused,true);
 await jobs.cancel();
});

test('verified exported fixture and bound full audit permit completion, never a new resume',async t=>{
 const f=await fixture(t);await f.queue();await f.action('claim');
 const {mkdir}=await import('node:fs/promises');await mkdir(path.join(f.output,'figma'),{recursive:true});
 const draft=await json(path.join(f.output,'foundations.json'));
 await writeFile(path.join(f.output,'figma/figma-variables.json'),JSON.stringify({...draft,format:'ds-create/figma-variables@1'}));
 await writeFile(path.join(f.output,'figma/audit-file.json'),JSON.stringify({mode:'file',sourceHash:f.initial.figma.hash,result:{fail:0},simulation:true}));
 const file=path.join(f.output,'ds-create-ledger.json'),l=await json(file);l.sequence=l.sequence.map(e=>({...e,status:'done'}));l.foundationReview.figmaHash=f.initial.figma.hash;l.tokens={audit:{fail:0,file:'figma/audit-file.json'}};
 await writeFile(file,JSON.stringify(l));assert.equal((await f.action('report',{outcome:'completed'})).status,'succeeded');
 await assert.rejects(f.queue(),/already succeeded/);
});

test('a verified native worker failure settles Running without replacing approval; valid local draft remains retryable',async t=>{
 const f=await fixture(t),file=path.join(f.output,'ds-create-ledger.json'),l=await json(file);
 l.sequence.find(e=>e.step===2).status='error';await writeFile(file,JSON.stringify(l));
 const before=await readFile(file,'utf8'),state=await getState(f.output);assert.equal(state.status,'error');assert.equal(publishReady(state),true);
 await f.queue();await f.action('claim');assert.equal((await f.state()).status.status,'running');
 const message='Native worker stopped: account usage limit. Inspect partial Figma output on retry.';
 await f.action('report',{outcome:'blocked',message});assert.equal((await f.state()).status.status,'blocked');
 assert.equal((await f.state()).status.message,message);assert.equal(await readFile(file,'utf8'),before);
 assert.equal((await getState(f.output)).initDone,false);assert.equal(publishReady(await getState(f.output)),true);
 const draft=path.join(f.output,'foundations.json');await writeFile(draft,'{}');assert.equal(publishReady(await getState(f.output)),false);
});
