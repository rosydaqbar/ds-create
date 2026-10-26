#!/usr/bin/env node
// Run inside the launching agent's native background worker. No AI CLI or host config.
import {Client} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import {StdioClientTransport} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import {open,readFile,writeFile,rename,unlink,realpath,lstat} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

import {createAgentLease,AGENT_LEASE_MS} from '../manager/agent-lease.mjs';

export async function runListener({workspace:workspacePath,session,leaseMs=AGENT_LEASE_MS,cancelAckMs=60000}){
const workspace=await realpath(workspacePath);
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(session))throw new Error('Invalid session.');
const agentLease=createAgentLease({durationMs:leaseMs});
const output=path.join(workspace,'workspace/output',session),dir=path.join(output,'manager');
if(await realpath(dir)!==dir)throw new Error('Session must stay inside this workspace.');
const runtimeFile=path.join(dir,'listener.json'),instance=randomUUID();
const viewerFile=path.join(dir,'runtime.json'),boundViewer=await readFile(viewerFile,'utf8').then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;});
const emit=data=>process.stdout.write(JSON.stringify(data)+'\n');
let lock;
try{lock=await open(runtimeFile,'wx');}
catch(e){
 if(e.code!=='EEXIST')throw e;
 const previous=JSON.parse(await readFile(runtimeFile,'utf8'));let alive=true;
 try{process.kill(previous.pid,0);}catch(error){if(error.code==='ESRCH')alive=false;else throw error;}
 if(alive)throw new Error('This session already has a background listener. Reuse its native worker.');
 if((await readFile(runtimeFile,'utf8'))!==JSON.stringify(previous)+'\n')throw new Error('Listener identity changed. Retry discovery.');
 await unlink(runtimeFile);lock=await open(runtimeFile,'wx');
}
const identity={pid:process.pid,instance,session,started:new Date().toISOString(),agentSeenAt:null,agentLeaseMs:leaseMs};
async function saveAgentSeen(){const next={...identity,agentSeenAt:new Date(agentLease.inspect().seenAt).toISOString()};const tmp=runtimeFile+'.'+instance+'.tmp';await writeFile(tmp,JSON.stringify(next)+'\n');await rename(tmp,runtimeFile);}
await lock.writeFile(JSON.stringify(identity)+'\n');await lock.close();
const client=new Client({name:'ds-create-background-worker',version:'1.0.0'});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./ds-create-mcp.mjs',import.meta.url)),'--workspace',workspace],stderr:'pipe'});
transport.stderr?.on('data',()=>{});
let current=null,closing=false,commands=Promise.resolve(),cleanupPromise,lastViewerCheck=0,lastCancelCheck=0,cancelNotified=false,cancelSince=null;
const metrics={format:'ds-create/listener-metrics@1',instance,standby:'native-check-in',zeroInferenceVerified:false,heartbeats:0,jobs:{prepare:0,publish:0},idleMs:0,activeMs:0};
let segmentStarted=Date.now(),segmentActive=false;
let metricsWrites=Promise.resolve();
function saveMetrics(nextActive=segmentActive){const now=Date.now();metrics[segmentActive?'activeMs':'idleMs']+=now-segmentStarted;segmentStarted=now;segmentActive=nextActive;const body=JSON.stringify({...metrics,updated:new Date(now).toISOString()})+'\n';metricsWrites=metricsWrites.then(async()=>{const file=path.join(dir,'listener-metrics.json'),tmp=file+'.'+instance+'.tmp';await writeFile(tmp,body);await rename(tmp,file);});return metricsWrites;}
const input=createInterface({input:process.stdin,crlfDelay:Infinity});
const call=async(name,fields)=>{const r=await client.callTool({name,arguments:{session,...fields}});if(r.isError)throw new Error(r.content?.[0]?.text||'Worker action failed.');return r.structuredContent;};
async function cleanup(){
 if(cleanupPromise)return cleanupPromise;closing=true;
 cleanupPromise=(async()=>{input.close();await client.close().catch(()=>{});await saveMetrics();try{const r=JSON.parse(await readFile(runtimeFile,'utf8'));if(r.instance===instance)await unlink(runtimeFile);}catch(e){if(e.code!=='ENOENT')throw e;}})();return cleanupPromise;
}
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{void cleanup().then(()=>process.exit(0));});
input.on('close',()=>{if(!closing)void cleanup();});
input.on('line',line=>{commands=commands.then(async()=>{
 let command;
 try{
  command=JSON.parse(line);if(!command||!['heartbeat','progress','preflight','compile','finish','finish-file','stop'].includes(command.action))throw new Error('Use heartbeat, progress, preflight, compile, finish, finish-file or stop.');
  if(command.action==='stop'){await cleanup();return;}
  if(command.action==='heartbeat'){if(Object.keys(command).some(k=>k!=='action'))throw new Error('Heartbeat takes no fields.');agentLease.heartbeat();metrics.heartbeats++;await saveAgentSeen();await saveMetrics();emit({event:'ack',action:'heartbeat',ready:true});return;}
  if(agentLease.inspect().expired)throw new Error('Agent lease expired; stop this connection.');
  if(!current||command.job_id!==current.job_id)throw new Error('This command does not match the active job.');
  if(command.action==='finish-file'){
   if(current.kind!=='prepare'||Object.keys(command).some(k=>!['action','job_id'].includes(k)))throw new Error('Finish-file belongs only to preparation and takes no path.');
   const file=path.join(dir,'setup-jobs',current.job_id,'handoff.json');
   if(await realpath(path.dirname(file))!==path.dirname(file))throw new Error('Handoff directory must be local.');
   const info=await lstat(file);if(info.isSymbolicLink()||!info.isFile()||info.size>2*1024*1024)throw new Error('Use a regular handoff.json up to 2 MB.');
   command={...JSON.parse(await readFile(file,'utf8')),action:'finish',job_id:current.job_id};
  }
  const {action,job_id,...fields}=command;
  if(action==='preflight'&&current.kind!=='publish')throw new Error('Preflight belongs only to publication.');
  if(action==='compile'&&current.kind!=='prepare')throw new Error('Compile belongs only to preparation.');
  const allowed=action==='progress'?['message','stage','completed_stages']:action==='preflight'?['result']:action==='compile'?[]:['outcome','message','questions','coverage'];
  if(Object.keys(fields).some(key=>!allowed.includes(key)))throw new Error('Unexpected worker action fields.');
  agentLease.heartbeat();await saveAgentSeen();
  const result=await call(`ds_create_${current.kind}_${action}`,{job_id,attempt:current.attempt,lease:current.lease,...fields});
  emit({event:'ack',action,job_id,result});
  if(action==='finish'||action==='preflight'&&result.status==='blocked'){current=null;await saveMetrics(false);}
 }catch(error){emit({event:'error',job_id:command?.job_id,message:error.message});}
 });});
try{
 await client.connect(transport);emit({event:'listening',session,pid:process.pid,requiresHeartbeat:true,agentLeaseMs:leaseMs,standby:{mode:metrics.standby,zeroInferenceVerified:false}});
 while(!closing){
  if(agentLease.inspect().expired){
   emit({event:'worker-expired',message:'The native agent stopped checking in.'});
   if(current)await call(`ds_create_${current.kind}_finish`,{job_id:current.job_id,attempt:current.attempt,lease:current.lease,outcome:'blocked',message:'The background agent stopped checking in. This attempt is blocked; completion or cancellation has not been verified. Inspect any in-flight or partial Figma changes before retrying.'});
   break;
  }
  if(current&&Date.now()-lastCancelCheck>1000){
   lastCancelCheck=Date.now();const status=await call(`ds_create_${current.kind}_status`,{});
   if(status.job?.cancelRequested||status.cancelRequested){
    cancelSince ||= Date.parse(status.job?.cancelRequestedAt||status.cancelRequestedAt)||Date.now();
    if(!cancelNotified){cancelNotified=true;emit({event:'cancel-requested',job_id:current.job_id});}
    if(Date.now()-cancelSince>=cancelAckMs){await call(`ds_create_${current.kind}_finish`,{job_id:current.job_id,attempt:current.attempt,lease:current.lease,outcome:'blocked',message:'The background agent did not acknowledge cancellation in time. Further work is fenced; cancellation of any in-flight Figma call is unverified. Inspect partial output before retrying.'});emit({event:'worker-expired',message:'Cancellation was not acknowledged.'});break;}
   }
  }
  if(boundViewer&&Date.now()-lastViewerCheck>2000){
   lastViewerCheck=Date.now();
   const viewer=await readFile(viewerFile,'utf8').then(JSON.parse,e=>{if(e.code==='ENOENT')return null;throw e;});
   if(!viewer){emit({event:'stopped',reason:'Builder stopped.'});break;}
   if(!Number.isInteger(viewer.pid)||viewer.pid<=0)throw new Error('Builder process identity is unavailable.');
   try{process.kill(viewer.pid,0);}catch(e){if(e.code!=='ESRCH')throw e;emit({event:'stopped',reason:'Builder process stopped.'});break;}
  }
  if(!current&&agentLease.inspect().ready){
   for(const kind of ['publish','prepare']){
    const result=await call(`ds_create_${kind}`,{wait_seconds:0,...(kind==='publish'?{execution:'stepped'}:{})});
    if(result.status==='running'){
     current={...result,kind};cancelNotified=false;cancelSince=null;const {lease,attempt,...publicJob}=current;
     metrics.jobs[kind]++;await saveMetrics(true);
     publicJob.instructions+='\nListener transport: the ds_create tools mentioned above are invoked internally for you. Send progress, preflight and finish JSON lines to this same persistent process stdin, with action, job_id and typed fields. For preflight send {action:"preflight",job_id,result:THE_ACTUAL_RETURNED_OBJECT}. On preflight ack status blocked, this job has ended: return to waiting without another finish. On passed:true, immediately execute result.next_operation.instructions on this same job; do not wait for another click or claim. Do not register tools in the host. Acknowledge cancellation through finish cancelled; after a finish ack, keep waiting for the next job.';
     emit({event:'job',...publicJob});break;
    }
   }
  }
  await delay(500);
 }
 await commands;
}catch(error){emit({event:'listener-error',message:error.message});process.exitCode=1;}
finally{await cleanup();}

}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];if(args.length!==4||!args.includes('--workspace')||!args.includes('--slug'))throw new Error('Use --workspace /absolute/workspace --slug saved-session.');await runListener({workspace:arg('--workspace'),session:arg('--slug')});}
 catch(error){console.error(error.message);process.exitCode=1;}
}
