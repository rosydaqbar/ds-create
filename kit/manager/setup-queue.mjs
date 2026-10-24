import {realpath,open,unlink,appendFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {readJSON} from './state.mjs';
import {activeSetup,saveSetup,setupQuestions} from './setup-data.mjs';
import {snapshotInputs} from './input-snapshot.mjs';
import {selectedInputSlug} from './input-identity.mjs';
import {checkPreparation} from './foundation-proof.mjs';
import {clean} from './publish-queue.mjs';
const idOK=v=>typeof v==='string'&&/^[0-9a-f-]{36}$/.test(v);
const digest=v=>createHash('sha256').update(v).digest('hex');
const stateFile=output=>path.join(output,'manager/setup.json');
async function files(output,id){
 if(!idOK(id))throw new Error('Invalid preparation job id.');
 const dir=path.join(output,'manager/setup-jobs',id);if(await realpath(dir)!==dir)throw new Error('Preparation path must not be a symlink.');
 return {dir,requestFile:path.join(dir,'request.json'),deliveryFile:path.join(dir,'mcp-delivery.json')};
}
async function locked(dir,fn){
 const file=path.join(dir,'prepare-action.lock');let handle;
 try{handle=await open(file,'wx');}catch(e){if(e.code==='EEXIST')throw new Error('Another preparation action is being saved. Retry after it finishes.');throw e;}
 try{return await fn();}finally{await handle.close();await unlink(file);}
}
async function event(dir,value){
 const file=path.join(dir,'events.jsonl'),s=await stat(file).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(s?.size>20*1024*1024)throw new Error('Preparation activity limit reached. Finish or stop this attempt.');
 await appendFile(file,JSON.stringify({...value,date:new Date().toISOString()})+'\n');
}
export async function validatePrepareRequest(output,workspace,id){
 const f=await files(output,id),r=await readJSON(f.requestFile),s=await readJSON(stateFile(output));
 if(r?.id!==id||r.workspace!==workspace||r.outputDir!==output||r.slug!==path.basename(output)||r.runner!=='mcp'||s?.jobId!==id||s.runner!=='mcp')throw new Error('This preparation request does not belong to the current session.');
 if(r.inputSlug!==selectedInputSlug(s,r.slug)||r.inputRevision!==s.inputRevision||r.projectName!==s.projectName)throw new Error('Preparation context identity changed. Prepare the current revision.');
 if(r.inputHash!==(await snapshotInputs(workspace,r.inputSlug)).hash)throw new Error('Context files changed. Prepare the current input before continuing.');
 if(s.preview&&!r.simulation)throw new Error('Sample preparation is disabled outside simulation.');
 return {...f,request:r,state:s};
}
export async function initPrepareDelivery(output,id){const f=await files(output,id);await saveSetup(f.deliveryFile,{attempt:randomUUID(),created:new Date().toISOString()});}
export async function latestMcpPreparation(output){
 let s=await readJSON(stateFile(output));
 if(s?.runner!=='mcp'||!activeSetup(s))return s;
 const f=await files(output,s.jobId),d=await readJSON(f.deliveryFile);let dead=false;
 if(Number.isInteger(d?.pid)&&d.pid>0)try{process.kill(d.pid,0);}catch(e){dead=e.code==='ESRCH';}
 if(dead)s=await locked(f.dir,async()=>{
  const current=await readJSON(stateFile(output)),latest=await readJSON(f.deliveryFile);
  if(current.jobId===s.jobId&&activeSetup(current)&&latest?.attempt===d.attempt&&latest.owner===d.owner){const next={...current,status:'blocked',readyInputHash:null,questions:[],updated:new Date().toISOString(),message:'Background connection stopped before preparation finished. Context is saved; retry to continue.'};await saveSetup(stateFile(output),next);return next;}return current;
 });return s;
}
export async function claimMcpPreparation({outputDir,workspace,id,owner,lease}){
 const f=await validatePrepareRequest(outputDir,workspace,id);
 if(!idOK(owner)||!idOK(lease))throw new Error('Invalid MCP connection lease.');
 return locked(f.dir,async()=>{
  const s=await readJSON(stateFile(outputDir)),d=await readJSON(f.deliveryFile);
  if(s.jobId!==id||!activeSetup(s)||!d||d.cancelRequested)throw new Error('This preparation is not available.');
  if(d.owner){if(d.owner===owner&&d.leaseHash===digest(lease))return {request:f.request,attempt:d.attempt,reused:true};throw new Error('Another MCP connection owns this preparation.');}
  if(s.status!=='queued')throw new Error('This preparation is not queued.');
  await saveSetup(f.deliveryFile,{...d,owner,pid:process.pid,leaseHash:digest(lease),claimedAt:new Date().toISOString()});
  await saveSetup(stateFile(outputDir),{...s,status:'running',message:'The background worker received your saved context.',updated:new Date().toISOString()});
  await event(f.dir,{type:'builder.stage',stage:'context'});return {request:f.request,attempt:d.attempt,reused:false};
 });
}
export async function mcpPrepareAction({outputDir,workspace,id,owner,lease,attempt,action,message,stage,outcome,questions=[]}){
 const f=action==='finish'&&['blocked','failed','cancelled'].includes(outcome)?await files(outputDir,id):await validatePrepareRequest(outputDir,workspace,id);
 if(!idOK(owner)||!idOK(lease)||!idOK(attempt))throw new Error('Invalid MCP connection lease.');
 return locked(f.dir,async()=>{
  const s=await readJSON(stateFile(outputDir)),d=await readJSON(f.deliveryFile);
  if(s?.runner!=='mcp'||s.jobId!==id||!activeSetup(s)||d?.attempt!==attempt||d.owner!==owner||d.leaseHash!==digest(lease))throw new Error('This MCP client does not own the active preparation.');
  if(action==='progress'){
   if(d.cancelRequested)return {cancelRequested:true};
   if(stage&&!['context','decisions','foundation'].includes(stage))throw new Error('Invalid preparation stage.');
   if(stage)await event(f.dir,{type:'builder.stage',stage});
   await event(f.dir,{type:'builder.update',message:clean(message)});
   await saveSetup(stateFile(outputDir),{...s,message:clean(message),updated:new Date().toISOString()});return {updated:true,cancelRequested:false};
  }
  if(action!=='finish'||!['questions','ready','blocked','failed','cancelled'].includes(outcome))throw new Error('Invalid preparation outcome.');
  if(d.cancelRequested&&!['cancelled','blocked'].includes(outcome))throw new Error('Acknowledge cancellation before finishing preparation.');
  let status=outcome,detail=clean(message),qs=[];
  if(outcome==='questions'){qs=setupQuestions(questions);if(!qs)throw new Error('Return distinct valid questions or report blocked.');}
  if(outcome==='ready'){
   await event(f.dir,{type:'builder.stage',stage:'validation'});
   const check=await checkPreparation(outputDir,workspace,{inputSlug:s.inputSlug,inputRevision:s.inputRevision,projectName:s.projectName});
   if(check.valid&&check.plan?.systemMode==='new'&&check.plan.motionPolicy!=='basic-ui'){check.valid=false;check.errors.push('New-system preparation requires the basic UI motion policy.');}
   if(!check.valid){status='failed';detail='Foundation checks failed: '+check.errors.slice(0,5).join(' ').slice(0,1700);}
   else detail='Foundations are ready to review. Publish to Figma when you approve the saved draft.';
  }
  const now=new Date().toISOString(),next={...s,status,message:detail,questions:qs,readyInputHash:status==='ready'?f.request.inputHash:null,updated:now};
  await saveSetup(path.join(f.dir,'result.json'),{status,message:detail,questions:qs});await saveSetup(stateFile(outputDir),next);return {status,message:detail};
 });
}
export async function cancelMcpPreparation(output,id){
 const f=await files(output,id);return locked(f.dir,async()=>{
  const s=await readJSON(stateFile(output)),d=await readJSON(f.deliveryFile);if(s?.jobId!==id||s.runner!=='mcp'||!activeSetup(s))return {stopped:false};
  const now=new Date().toISOString(),cancelRequestedAt=d?.cancelRequestedAt||now;
  await saveSetup(f.deliveryFile,{...d,cancelRequested:true,cancelRequestedAt});
  if(!d.owner){await saveSetup(stateFile(output),{...s,status:'cancelled',readyInputHash:null,questions:[],updated:new Date().toISOString(),message:'Queued preparation cancelled before the background worker received it. Your context is saved.'});return {stopped:true};}
  await saveSetup(stateFile(output),{...s,cancelRequested:true,cancelRequestedAt,updated:now,message:'Cancellation requested. Waiting for the background worker to stop safely and acknowledge it.',updated:new Date().toISOString()});return {stopped:false,requested:true};
 });
}
