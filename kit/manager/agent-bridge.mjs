import {readFile,writeFile,rename,realpath,mkdir,open,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID,createHash} from 'node:crypto';
import path from 'node:path';
import {snapshotInputs} from './input-snapshot.mjs';
import {checkWebDraft} from './foundation-proof.mjs';
import {getState,readJSON} from './state.mjs';
import {compareFoundations} from './foundation-compare.mjs';
const exec=promisify(execFile),idOK=id=>typeof id==='string'&&/^[0-9a-f-]{36}$/.test(id);
export const activeChatJob=job=>job?.runner==='chat'&&['queued','running'].includes(job.status);
const atomic=async(file,data)=>{const tmp=file+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(data,null,2)+'\n');await rename(tmp,file);};
const clean=s=>String(s||'').replace(/\b(?:sk-[\w-]{12,}|Bearer\s+[\w.=-]{12,})/gi,'[redacted]').slice(0,2000);
async function run(command,args,workspace){
 let r;try{r=await exec(command,args,{cwd:workspace,timeout:12000,maxBuffer:1024*1024});}
 catch(e){let reply;try{reply=JSON.parse(e.stdout);}catch{/* ambiguous transport failure */}throw new Error(reply?.error?.message||'Orca delivery failed without a confirmed receipt. Inspect the linked chat before retrying.');}
 const data=JSON.parse(r.stdout);if(!data.ok)throw new Error(data.error?.message||'Orca did not accept the operation.');return data;
}
export async function chatBinding(outputDir){const b=await readJSON(path.join(outputDir,'manager/agent-bridge.json'));return b?.format==='ds-create/agent-bridge@1'&&/^term_[a-z0-9-]+$/.test(b.terminal)&&typeof b.command==='string'&&b.workspace===path.resolve(outputDir,'../../..')?b:null;}
export async function target(b,workspace){
 const r=await run(b.command,['terminal','show','--terminal',b.terminal,'--json'],workspace),t=r.result?.terminal;
 if(!t?.connected||!t.writable||t.agentIdentity!=='codex'||typeof t.incarnationId!=='string'||(b.incarnationId&&b.incarnationId!==t.incarnationId)||await realpath(t.worktreePath)!==await realpath(workspace))throw new Error('The linked Codex chat is stale or belongs to another workspace. Link this active chat again.');
 return t;
}
export async function linkChat({outputDir,workspace,terminal,command='orca'}){
 if(!/^term_[a-z0-9-]+$/.test(terminal||''))throw new Error('Provide the exact active terminal handle.');
 const b={format:'ds-create/agent-bridge@1',terminal,command,workspace:await realpath(workspace)};const t=await target(b,workspace);b.incarnationId=t.incarnationId;
 await mkdir(path.join(outputDir,'manager'),{recursive:true});await atomic(path.join(outputDir,'manager/agent-bridge.json'),b);return {linked:true,terminal,workspace:b.workspace};
}
async function jobFiles(outputDir,id){
 if(!idOK(id))throw new Error('Invalid job id.');
 const dir=path.join(outputDir,'manager/jobs',id);if(await realpath(dir)!==dir)throw new Error('Job path must not be a symlink.');
 return {dir,requestFile:path.join(dir,'request.json'),statusFile:path.join(dir,'status.json'),deliveryFile:path.join(dir,'chat-delivery.json')};
}
export async function validateChatRequest(outputDir,workspace,id){
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
async function locked(dir,fn){const file=path.join(dir,'chat-action.lock');let lock;try{lock=await open(file,'wx');}catch(e){if(e.code==='EEXIST')throw new Error('Another chat action is being saved. Retry after it finishes.');throw e;}try{return await fn();}finally{await lock.close();await unlink(file);}}
export async function queueChatJob({outputDir,workspace,id}){
 const files=await validateChatRequest(outputDir,workspace,id),b=await chatBinding(outputDir);if(!b)throw new Error('Link the active agent chat with manager-agent.mjs link before publishing.');await target(b,workspace);
 const prepared=await locked(files.dir,async()=>{
  const old=await readJSON(files.statusFile);if(activeChatJob(old))return {job:{id,status:old.status},reused:true};
  if(old?.status==='succeeded')throw new Error('This request already succeeded.');
  if(old&&['queued','running'].includes(old.status))throw new Error('An earlier CLI attempt is still running.');
  const attempt=randomUUID(),now=new Date().toISOString();
  await atomic(files.deliveryFile,{attempt,terminal:b.terminal,state:'sending',created:now});
  await atomic(files.statusFile,{id,hash:files.request.hash,figmaUrl:files.request.figmaUrl,runner:'chat',status:'queued',started:now,message:'Sending request to the linked chat. No background worker has claimed it yet.'});
  return {attempt};
 });
 if(prepared.reused)return prepared;
 const {attempt}=prepared;
 const message=`DS_CREATE_AGENT_REQUEST v1\nBuilder Publish request: ${id}\nAttempt: ${attempt}\nWorkspace: ${workspace}\nSession: ${files.request.slug}\nRead skills/ds-create/reference/agent-bridge.md. Verify this request with node kit/tools/manager-agent.mjs status --slug ${files.request.slug} --job ${id} before acting. The existing Publish approval is recorded; do not ask for foundation approval again. Spawn a visible native background subagent for this approved Figma continuation, then have that worker claim this attempt before any Figma call. Do not launch codex exec, change permission policies, create another Figma file, or run build. A duplicate message must not create a second owner. Request file: ${files.requestFile}`;
 let receipt,error;
 try {receipt=(await run(b.command,['terminal','send','--terminal',b.terminal,'--text',message,'--enter','--wait-submit','1','--json'],workspace)).result;
  if(receipt?.send?.accepted!==true)throw new Error('Orca did not confirm input acceptance.');
 }catch(e){error=clean(e.message);}
 return locked(files.dir,async()=>{
  const delivery=await readJSON(files.deliveryFile),job=await readJSON(files.statusFile);
  if(delivery?.attempt!==attempt)throw new Error('Delivery attempt changed.');
  await atomic(files.deliveryFile,{...delivery,state:error?'unconfirmed':'accepted',...(error?{error}:{receipt})});
  if(job.status==='queued'&&!delivery.actor)await atomic(files.statusFile,{...job,message:error?'Chat delivery is unconfirmed. Inspect the linked chat before sending again; no worker is confirmed yet.':'Request accepted by the linked chat. Waiting for a visible background worker to claim it.'});
  return {job:{id,status:job.status},delivery:error?'unconfirmed':'accepted',reused:false};
 });
}

export async function chatJobStatus(outputDir,workspace,id){const f=await validateChatRequest(outputDir,workspace,id);return {request:f.request,status:await readJSON(f.statusFile),delivery:await readJSON(f.deliveryFile)};}
export async function chatAction({outputDir,workspace,id,attempt,actor,action,message,outcome}){
 const f=action==='report'&&outcome!=='completed'?await jobFiles(outputDir,id):await validateChatRequest(outputDir,workspace,id);if(!idOK(attempt)||!/^[-a-zA-Z0-9_:]{1,100}$/.test(actor||''))throw new Error('Provide the exact attempt and unique worker actor.');
 return locked(f.dir,async()=>{
  const delivery=await readJSON(f.deliveryFile),job=await readJSON(f.statusFile);
  if(delivery?.attempt!==attempt||!activeChatJob(job))throw new Error('This attempt is no longer active.');
  if(action==='claim'){
   if(delivery.actor)throw new Error('A worker already claimed this attempt. Do not start duplicate work.');
   if(delivery.cancelRequested)throw new Error('Cancellation was requested.');
   await atomic(f.deliveryFile,{...delivery,actor,claimedAt:new Date().toISOString()});await atomic(f.statusFile,{...job,status:'running',message:'Visible background agent claimed the approved request and is checking Figma.'});return {claimed:true,actor};
  }
  if(delivery.actor!==actor)throw new Error('This worker does not own the attempt.');
  if(action==='update'){
   if(delivery.cancelRequested)return {cancelRequested:true};
   await atomic(f.statusFile,{...job,message:clean(message),updated:new Date().toISOString()});return {updated:true,cancelRequested:false};
  }
  if(action!=='report'||!['completed','blocked','failed','cancelled'].includes(outcome))throw new Error('Invalid report outcome.');
  if(delivery.cancelRequested&&outcome!=='cancelled'&&outcome!=='blocked')throw new Error('Resolve the cancellation before reporting completion.');
  let status=outcome==='completed'?'succeeded':outcome,detail=clean(message);
  if(outcome==='completed'){
   const state=await getState(outputDir),[draft,actual,audit]=await Promise.all(['foundations.json','figma/figma-variables.json','figma/audit-file.json'].map(n=>readJSON(path.join(outputDir,n))));
   await atomic(path.join(f.dir,'foundation-diff.json'),{...compareFoundations(draft,actual),sourceHash:f.request.hash});
   if(state.status==='error'||!state.initDone||state.source.review!=='synced'||state.source.hash!==f.request.hash||state.summary.audit!=='Passed'||!compareFoundations(draft,actual).match||audit?.mode!=='file'||audit.sourceHash!==f.request.hash||audit.result?.fail!==0){status='failed';detail='Worker reported completion without matching confirmed Figma output and a passing file audit.';}
  }
  await atomic(f.statusFile,{...job,status,message:detail,finished:new Date().toISOString()});return {status};
 });
}
export async function cancelChatJob({outputDir,workspace,id}){
 const f=await jobFiles(outputDir,id);return locked(f.dir,async()=>{
  const delivery=await readJSON(f.deliveryFile),job=await readJSON(f.statusFile);if(!activeChatJob(job))return {stopped:false};
  await atomic(f.deliveryFile,{...delivery,cancelRequested:true});
  if(!delivery.actor){await atomic(f.statusFile,{...job,status:'cancelled',message:'Queued request cancelled before a worker claimed it.',finished:new Date().toISOString()});return {stopped:true};}
  await atomic(f.statusFile,{...job,message:'Stop requested. Waiting for the background worker to confirm it has stopped.'});
  const b=await chatBinding(outputDir);if(b)try{await target(b,workspace);await run(b.command,['terminal','send','--terminal',b.terminal,'--text',`DS_CREATE_AGENT_CANCEL request ${id}, attempt ${delivery.attempt}, actor ${delivery.actor}. Stop only this request's visible background worker, preserve any existing Figma writes, and report cancelled through manager-agent.mjs. Do not interrupt or close the whole parent chat.`,'--enter','--wait-submit','1','--json'],workspace);}catch{/* keep cancellation pending, never claim it stopped */}
  return {stopped:false,requested:true};
 });
}
