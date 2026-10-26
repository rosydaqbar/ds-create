// Node owns idle waiting; only the receiving MAIN agent may accept and execute a job.
import {open,readFile,writeFile,rename,unlink,realpath} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readJSON} from './state.mjs';
import {latestMcpPreparation,validatePrepareRequest,claimMcpPreparation,mcpPrepareAction} from './setup-queue.mjs';
import {setupPrompt} from './setup-prompt.mjs';
const uuid=x=>typeof x==='string'&&/^[0-9a-f-]{36}$/.test(x);
export async function createPreparationListener({workspace:root,session,onPrompt,intervalMs=500,activeTimeoutMs=180000,cancelAckMs=60000}){
 const workspace=await realpath(root);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(session))throw new Error('Invalid session.');
 const output=path.join(workspace,'workspace/output',session),dir=path.join(output,'manager');
 if(await realpath(dir)!==dir)throw new Error('Listener must stay inside the selected session.');
 const file=path.join(dir,'listener.json'),instance=randomUUID(),owner=randomUUID();
 let lock;
 try{lock=await open(file,'wx',0o600);}catch(error){
  if(error.code!=='EEXIST')throw error;
  const prior=await readFile(file,'utf8'),record=JSON.parse(prior);
  try{process.kill(record.pid,0);throw new Error('This session already has a listener.');}catch(e){if(e.code!=='ESRCH')throw e;}
  if(await readFile(file,'utf8')!==prior)throw new Error('Listener identity changed.');
  await unlink(file);lock=await open(file,'wx',0o600);
 }
 let pending=null,current=null,closed=false,timer,chain=Promise.resolve(),receiverReady=false,lastError=null,binding=randomUUID(),lastHealthCheck=0;
 const identity={pid:process.pid,instance,session,mode:'main-agent',capabilities:['prepare'],started:new Date().toISOString(),agentSeenAt:null};
 const save=async()=>{const tmp=file+'.'+instance+'.tmp';await writeFile(tmp,JSON.stringify({...identity,receiverReady,lastError,binding})+'\n',{mode:0o600});await rename(tmp,file);};
 await lock.writeFile(JSON.stringify(identity)+'\n');await lock.close();
 const serial=fn=>{const next=chain.then(fn);chain=next.catch(()=>{});return next;};
 async function deliver(packet){
  if(!onPrompt)return false;
  try{const ack=await onPrompt(packet);receiverReady=ack?.accepted===true&&ack.event_id===packet.event_id;lastError=receiverReady?null:'Host did not acknowledge this event.';}
  catch{receiverReady=false;lastError='Host event delivery failed. The job remains queued.';}
  await save();return receiverReady;
 }
 async function discover(){
  const s=await latestMcpPreparation(output);
  if(s?.runner!=='mcp'||s.status!=='queued'){pending=null;return null;}
  if(!uuid(s.jobId))throw new Error('Invalid queued job identity.');
  const delivery=await readJSON(path.join(dir,'setup-jobs',s.jobId,'mcp-delivery.json'));
  if(!uuid(delivery?.attempt)||delivery.owner||delivery.cancelRequested){pending=null;return null;}
  if(pending?.event_id===delivery.attempt)return pending;
  const f=await validatePrepareRequest(output,workspace,s.jobId);
  pending={event:'prepare-request',event_id:delivery.attempt,job_id:s.jobId,session,workspace,request_file:f.requestFile,
   prompt:`Prepare foundations in THIS main agent instance. Do not spawn a subagent, another chat or an agent/IDE CLI. Claim event ${delivery.attempt} for session ${session} using the Node preparation listener, then follow its returned instructions. This is local preparation only; no Figma, approval or build. Workspace: ${workspace}.`};
  return pending;
 }
 async function tick(){
  if(closed)return;
  if(onPrompt?.health&&Date.now()-lastHealthCheck>5000){
   lastHealthCheck=Date.now();const healthy=await onPrompt.health();
   if(healthy===false&&receiverReady){receiverReady=false;lastError='The event transport stopped. Reconnect the main-instance event handler.';await save();}
  }
  if(current){
   const s=await latestMcpPreparation(output);
   if(s?.jobId!==current.id||s.status!=='running'){current=null;return;}
   if(s.cancelRequested&&!current.cancelAt){current.cancelAt=Date.parse(s.cancelRequestedAt)||Date.now();await deliver({event:'prepare-cancel',event_id:randomUUID(),job_id:current.id,session,prompt:'Stop this preparation safely and acknowledge cancellation through the same Node listener. No further source/output work.'});}
   if(Date.now()-current.lastActionAt>=activeTimeoutMs||current.cancelAt&&Date.now()-current.cancelAt>=cancelAckMs){
    await mcpPrepareAction({...current,action:'finish',outcome:'blocked',message:'The main agent stopped responding during preparation. Partial output is unverified; review before retrying.'});current=null;
   }
   return;
  }
  const event=await discover();if(!event)return;
  const receiptFile=path.join(dir,'setup-jobs',event.job_id,'prompt-delivery.json'),receipt=await readJSON(receiptFile);
  // One notification per saved attempt, including across restarts. Reading/recovery never auto-retries work.
  if(receipt?.event_id===event.event_id&&(receipt.status==='accepted'||receipt.instance===instance&&receipt.binding===binding))return;
  await writeFile(receiptFile,JSON.stringify({event_id:event.event_id,instance,binding,status:'pending'})+'\n',{mode:0o600});
  const accepted=await deliver(event);
  await writeFile(receiptFile,JSON.stringify({event_id:event.event_id,instance,binding,status:accepted?'accepted':'undelivered',updated:new Date().toISOString()})+'\n',{mode:0o600});
 }
 async function act(command){return serial(async()=>{
  if(closed)throw new Error('Listener stopped.');
  const {action}=command||{};
  if(action==='status')return {mode:'main-agent',session,instance,listening:true,receiverReady,lastError,activeJob:current?.id||null};
  if(action==='next')return {event:await discover()};
  if(action==='claim'){
   if(Object.keys(command).some(k=>!['action','event_id','consumer_id'].includes(k))||!uuid(command.consumer_id))throw new Error('Claim requires the event and main-agent consumer UUID.');
   if(current){if(current.event_id!==command.event_id||current.consumer_id!==command.consumer_id)throw new Error('Another main-agent consumer owns this attempt.');return {...current.public,reused:true};}
   const event=await discover();if(!event||event.event_id!==command.event_id)throw new Error('This queued event is no longer current.');
   const lease=randomUUID(),claimed=await claimMcpPreparation({outputDir:output,workspace,id:event.job_id,owner,lease});
   current={outputDir:output,workspace,id:event.job_id,owner,lease,attempt:claimed.attempt,event_id:event.event_id,consumer_id:command.consumer_id,lastActionAt:Date.now()};
   identity.agentSeenAt=new Date().toISOString();await save();
   current.public={status:'running',job_id:event.job_id,event_id:event.event_id,request_file:event.request_file,instructions:setupPrompt(claimed.request,event.request_file)+'\nMain-agent transport: execute in this instance, not a subagent. Use Node listener actions progress, compile and finish with this job_id and consumer_id. These invoke the existing preparation protocol internally; do not claim through another MCP client. After finish, leave Node waiting and end the agent turn. Do not poll while idle.'};
   return current.public;
  }
  const allowed={progress:['message','stage'],compile:[],finish:['outcome','message','questions','coverage']};
  if(!Object.hasOwn(allowed,action)||Object.keys(command).some(k=>!['action','job_id','consumer_id',...allowed[action]].includes(k)))throw new Error('Use status, next, claim, progress, compile or finish.');
  if(!current||command.job_id!==current.id||command.consumer_id!==current.consumer_id)throw new Error('This main-agent consumer does not own the active job.');
  const fields=Object.fromEntries(allowed[action].filter(k=>Object.hasOwn(command,k)).map(k=>[k,command[k]]));
  if(action==='progress'&&(typeof fields.message!=='string'||!fields.message.trim()||fields.message.length>2000))throw new Error('Progress requires a concise public message.');
  if(action==='finish'&&(typeof fields.message!=='string'||!fields.message.trim()||fields.message.length>2000))throw new Error('Finish requires a concise public message.');
  const result=await mcpPrepareAction({...current,...fields,action});
  identity.agentSeenAt=new Date().toISOString();current.lastActionAt=Date.now();await save();
  if(action==='finish')current=null;
  return result;
 });}
 async function close(){if(closed)return;closed=true;clearTimeout(timer);await chain;
  try{if(current)await mcpPrepareAction({...current,action:'finish',outcome:'blocked',message:'Preparation listener stopped. Context is saved; incomplete output has not been verified.'});}
  finally{const saved=await readJSON(file);if(saved?.instance===instance)await unlink(file);}
 }
 async function loop(){try{await serial(tick);}catch(error){lastError=error.message;await save();}finally{if(!closed)timer=setTimeout(loop,intervalMs);}}
 try{await deliver({event:'listener-ready',event_id:instance,session,capabilities:['prepare']});}catch(error){await close();throw error;}
 timer=setTimeout(loop,0);
 async function connect(receiver){return serial(async()=>{
  if(closed)throw new Error('Listener stopped.');
  if(typeof receiver!=='function')throw new Error('Connect an actual event receiver.');
  onPrompt=receiver;binding=randomUUID();receiverReady=false;lastHealthCheck=Date.now();
  await deliver({event:'listener-ready',event_id:instance,session,capabilities:['prepare']});
  return {connected:receiverReady,instance,activeJob:current?.id||null};
 });}
 return {act,close,connect,instance};
}
