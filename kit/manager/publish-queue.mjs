import {readFile,writeFile,rename,realpath,open,unlink} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import path from 'node:path';
import {snapshotInputs} from './input-snapshot.mjs';
import {checkWebDraft} from './foundation-proof.mjs';
import {getState,readJSON} from './state.mjs';
import {compareFoundations} from './foundation-compare.mjs';
import {evaluatePreflight} from './publish-preflight.mjs';
const idOK=id=>typeof id==='string'&&/^[0-9a-f-]{36}$/.test(id);
const digest=s=>createHash('sha256').update(s).digest('hex');
export const publishStages=['access','variables','styles','verification'];
export const activeMcpJob=job=>job?.runner==='mcp'&&['queued','running'].includes(job.status);
export const clean=s=>String(s||'').replace(/\b(?:sk-[\w-]{12,}|Bearer\s+[\w.=-]{12,})/gi,'[redacted]').slice(0,2000);
const atomic=async(file,data)=>{const tmp=file+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(data,null,2)+'\n');await rename(tmp,file);};
async function jobFiles(outputDir,id){
 if(!idOK(id))throw new Error('Invalid job id.');
 const dir=path.join(outputDir,'manager/jobs',id);if(await realpath(dir)!==dir)throw new Error('Job path must not be a symlink.');
 return {dir,requestFile:path.join(dir,'request.json'),statusFile:path.join(dir,'status.json'),deliveryFile:path.join(dir,'mcp-delivery.json')};
}
export async function validatePublishRequest(outputDir,workspace,id){
 const files=await jobFiles(outputDir,id),r=await readJSON(files.requestFile),ledger=await readJSON(path.join(outputDir,'ds-create-ledger.json'));
 if(r?.id!==id||r.workspace!==workspace||r.outputDir!==outputDir||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)||path.basename(outputDir)!==r.slug)throw new Error('Request does not belong to this workspace.');
 const approval=ledger?.foundationReview,expected=path.relative(workspace,files.requestFile);
 if(!['approved','synced'].includes(approval?.status)||approval.approvedBy!=='user'||approval.hash!==r.hash||approval.approvalSource!==expected)throw new Error('The saved request does not have the current user approval.');
 const target=new URL(r.figmaUrl),approvedTarget=new URL(ledger.figma?.url||'');
 if(!['www.figma.com','figma.com'].includes(target.hostname)||target.protocol!=='https:'||target.username||target.password||!/^\/(design|file)\/[a-zA-Z0-9_-]+(?:\/|$)/.test(target.pathname)||target.pathname.split('/')[2]!==approvedTarget.pathname.split('/')[2])throw new Error('Approved Figma target differs from this request.');
 const bytes=await readFile(path.join(outputDir,'foundations.json'));if(createHash('sha256').update(bytes).digest('hex')!==r.hash)throw new Error('Draft changed. Review the current revision.');
 if((await snapshotInputs(workspace,r.inputSlug||r.slug)).hash!==r.inputHash)throw new Error('Inputs changed. Prepare them again.');
 const setup=await readJSON(path.join(outputDir,'manager/setup.json'));if(setup&&setup.status!=='ready')throw new Error('Finish local preparation first.');
 const proof=await checkWebDraft(outputDir,workspace,setup);if(!proof.valid)throw new Error('Saved foundation checks failed: '+proof.errors.slice(0,2).join(' '));
 return {...files,request:r};
}

async function locked(dir,fn){
 const file=path.join(dir,'publish-action.lock');let lock;
 try{lock=await open(file,'wx');}catch(e){if(e.code==='EEXIST')throw new Error('Another publish action is being saved. Retry after it finishes.');throw e;}
 try{return await fn();}finally{await lock.close();await unlink(file);}
}
export async function sessionOutput(workspace,slug){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug||''))throw new Error('Provide the saved Builder session id.');
 const output=path.join(workspace,'workspace/output',slug);
 if(await realpath(output)!==output||await realpath(path.join(output,'manager'))!==path.join(output,'manager'))throw new Error('Session must stay inside this workspace.');
 return output;
}
export async function latestPublish(outputDir){
 const p=await readJSON(path.join(outputDir,'manager/figma-job.json'));
 if(!idOK(p?.id))return null;
 const f=await jobFiles(outputDir,p.id);let job=await readJSON(f.statusFile);
 if(job?.runner==='mcp'&&job.status==='running'){
  const d=await readJSON(f.deliveryFile);job={...job,cancelRequested:!!d?.cancelRequested,cancelRequestedAt:d?.cancelRequestedAt||null};let dead=false;
  if(Number.isInteger(d?.pid)&&d.pid>0)try{process.kill(d.pid,0);}catch(e){dead=e.code==='ESRCH';}
  if(dead)job=await locked(f.dir,async()=>{
   const current=await readJSON(f.statusFile),latest=await readJSON(f.deliveryFile);
   if(current?.runner==='mcp'&&current.status==='running'&&latest?.attempt===d.attempt&&latest.owner===d.owner){
    const blocked={...current,status:'blocked',message:'Background connection stopped before publication finished. Inspect any in-flight or partial Figma output before retrying.',finished:new Date().toISOString()};await atomic(f.statusFile,blocked);return blocked;
   }return current;
  });
 }return job;
}
export async function queueMcpJob({outputDir,workspace,id}){
 const f=await validatePublishRequest(outputDir,workspace,id);
 return locked(f.dir,async()=>{
  const old=await readJSON(f.statusFile);if(activeMcpJob(old))return {job:{id,status:old.status},reused:true};
  if(old?.status==='succeeded')throw new Error('This request already succeeded.');
  if(['queued','running'].includes(old?.status))throw new Error('Stop the earlier publication attempt before switching to MCP.');
  const attempt=randomUUID(),now=new Date().toISOString();
  await atomic(f.deliveryFile,{attempt,created:now});
  await atomic(f.statusFile,{id,hash:f.request.hash,figmaUrl:f.request.figmaUrl,runner:'mcp',status:'queued',started:now,progress:{completed:[],activity:[]},message:'Your approved foundations are queued for the background worker.'});
  return {job:{id,status:'queued'},attempt,reused:false};
 });
}
export async function claimMcpJob({outputDir,workspace,id,owner,lease,execution='legacy'}){
 const f=await validatePublishRequest(outputDir,workspace,id);
 if(!idOK(owner)||!idOK(lease))throw new Error('Invalid MCP connection lease.');
 return locked(f.dir,async()=>{
  const job=await readJSON(f.statusFile),d=await readJSON(f.deliveryFile);
  if(!activeMcpJob(job)||!d||d.cancelRequested)throw new Error('This publication is not available.');
  if(d.owner){if(d.owner===owner&&d.leaseHash===digest(lease))return {request:f.request,attempt:d.attempt,reused:true};throw new Error('Another MCP client owns this publication.');}
  if(job.status!=='queued')throw new Error('This publication is not queued.');
  await atomic(f.deliveryFile,{...d,owner,pid:process.pid,leaseHash:digest(lease),execution,claimedAt:new Date().toISOString()});
  await atomic(f.statusFile,{...job,status:'running',updated:new Date().toISOString(),progress:{completed:[],activity:[]},message:'The background worker received your approved foundations.'});
  return {request:f.request,attempt:d.attempt,reused:false};
 });
}
export async function mcpPublishAction({outputDir,workspace,id,attempt,owner,lease,action,message,outcome,stage,completed_stages,preflight}){
 const f=action==='finish'&&outcome!=='completed'?await jobFiles(outputDir,id):await validatePublishRequest(outputDir,workspace,id);
 if(!idOK(attempt)||!idOK(owner)||!idOK(lease))throw new Error('Invalid MCP connection lease.');
 return locked(f.dir,async()=>{
  const d=await readJSON(f.deliveryFile),job=await readJSON(f.statusFile);
  if(!activeMcpJob(job)||d?.attempt!==attempt||d.owner!==owner||d.leaseHash!==digest(lease))throw new Error('This MCP client does not own the active attempt.');
  if(action==='preflight'){
   if(d.cancelRequested)return {cancelRequested:true};
   const checked=evaluatePreflight(await readJSON(path.join(outputDir,'foundations.json')),preflight),now=new Date().toISOString();
   await atomic(f.deliveryFile,{...d,preflight:{...checked,sourceHash:f.request.hash,observedAt:now}});
   const detail=checked.passed?'Required font faces are available. Continue with edit-access and frozen-value checks before generation.':clean('Figma is missing the approved font faces: '+checked.missing.map(f=>f.family+' / '+f.style).join('; ')+'. Make these exact faces available in Figma, or revise the saved font choice and review it again. No foundation writes were started by this preflight.');
   const progress={stage:'access',completed:[],activity:[...(job.progress?.activity||[]),{message:detail,stage:'access',time:now}].slice(-12)};
   await atomic(f.statusFile,{...job,progress,status:checked.passed?'running':'blocked',message:detail,updated:now,...(!checked.passed?{finished:now}:{})});
   return {status:checked.passed?'running':'blocked',passed:checked.passed};
  }
  if(d.execution==='stepped'&&!d.preflight?.passed&&(action==='finish'&&outcome==='completed'||action==='progress'&&(stage&&stage!=='access'||completed_stages?.length)))throw new Error('Execute and submit the read-only Figma preflight before generation.');
  if(action==='progress'){
   if(d.cancelRequested)return {cancelRequested:true};
   if(stage&&!publishStages.includes(stage)||completed_stages?.some(s=>!publishStages.includes(s)))throw new Error('Invalid publication stage.');
   const now=new Date().toISOString(),previous=job.progress||{},completed=[...new Set([...(previous.completed||[]),...(completed_stages||[])])];
   const progress={stage:stage||previous.stage||null,completed,activity:[...(previous.activity||[]),{message:clean(message),stage:stage||previous.stage||null,time:now}].slice(-12)};
   await atomic(f.statusFile,{...job,progress,message:clean(message),updated:now});return {updated:true,cancelRequested:false};
  }
  if(action!=='finish'||!['completed','blocked','failed','cancelled'].includes(outcome))throw new Error('Invalid publication outcome.');
  if(d.cancelRequested&&!['cancelled','blocked'].includes(outcome))throw new Error('Acknowledge cancellation before finishing.');
  let status=outcome==='completed'?'succeeded':outcome,detail=clean(message);
  if(outcome==='completed'){
   const state=await getState(outputDir),[draft,actual,audit]=await Promise.all(['foundations.json','figma/figma-variables.json','figma/audit-file.json'].map(n=>readJSON(path.join(outputDir,n))));
   const diff=compareFoundations(draft,actual);await atomic(path.join(f.dir,'foundation-diff.json'),{...diff,sourceHash:f.request.hash});
   const targetKey=value=>{try{return new URL(value).pathname.split('/')[2];}catch{return null;}};
   if(state.status==='error'||!state.initDone||state.source.review!=='synced'||state.source.hash!==f.request.hash||state.summary.audit!=='Passed'||targetKey(state.figmaUrl)!==targetKey(f.request.figmaUrl)||!diff.match||audit?.mode!=='file'||audit.sourceHash!==f.request.hash||audit.result?.fail!==0){status='failed';detail='Completion rejected: matching confirmed Figma export and a passing source-bound full file audit are required.';}
  }
  await atomic(f.statusFile,{...job,status,message:detail,finished:new Date().toISOString()});return {status};
 });
}
export async function cancelMcpJob({outputDir,id}){
 const f=await jobFiles(outputDir,id);return locked(f.dir,async()=>{
  const d=await readJSON(f.deliveryFile),job=await readJSON(f.statusFile);if(!activeMcpJob(job))return {stopped:false};
  const now=new Date().toISOString(),cancelRequestedAt=d?.cancelRequestedAt||now;
  await atomic(f.deliveryFile,{...d,cancelRequested:true,cancelRequestedAt});
  if(!d.owner){await atomic(f.statusFile,{...job,status:'cancelled',message:'Queued request cancelled before the background worker received it.',finished:new Date().toISOString()});return {stopped:true};}
  await atomic(f.statusFile,{...job,cancelRequested:true,cancelRequestedAt,updated:now,message:'Cancellation requested. The background worker must stop safely and acknowledge it; existing Figma changes are preserved.'});return {stopped:false,requested:true};
 });
}
