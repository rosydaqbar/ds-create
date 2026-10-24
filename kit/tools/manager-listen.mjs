#!/usr/bin/env node
// Run inside the launching agent's native background worker. No AI CLI or host config.
import {Client} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import {StdioClientTransport} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import {open,readFile,unlink,realpath} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
if(args.length!==4||!args.includes('--workspace')||!args.includes('--slug'))throw new Error('Use --workspace /absolute/workspace --slug saved-session.');
const workspace=await realpath(arg('--workspace')),session=arg('--slug');
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(session))throw new Error('Invalid session.');
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
const identity={pid:process.pid,instance,session,started:new Date().toISOString()};
await lock.writeFile(JSON.stringify(identity)+'\n');await lock.close();
const client=new Client({name:'ds-create-background-worker',version:'1.0.0'});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./ds-create-mcp.mjs',import.meta.url)),'--workspace',workspace],stderr:'pipe'});
transport.stderr?.on('data',()=>{});
let current=null,closing=false,commands=Promise.resolve(),cleanupPromise,lastViewerCheck=0;
const input=createInterface({input:process.stdin,crlfDelay:Infinity});
const call=async(name,fields)=>{const r=await client.callTool({name,arguments:{session,...fields}});if(r.isError)throw new Error(r.content?.[0]?.text||'Worker action failed.');return r.structuredContent;};
async function cleanup(){
 if(cleanupPromise)return cleanupPromise;closing=true;
 cleanupPromise=(async()=>{input.close();await client.close().catch(()=>{});try{const r=JSON.parse(await readFile(runtimeFile,'utf8'));if(r.instance===instance)await unlink(runtimeFile);}catch(e){if(e.code!=='ENOENT')throw e;}})();return cleanupPromise;
}
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{void cleanup().then(()=>process.exit(0));});
input.on('close',()=>{if(!closing)void cleanup();});
input.on('line',line=>{commands=commands.then(async()=>{
 let command;
 try{
  command=JSON.parse(line);if(!command||!['progress','finish','stop'].includes(command.action))throw new Error('Use progress, finish or stop.');
  if(command.action==='stop'){await cleanup();return;}
  if(!current||command.job_id!==current.job_id)throw new Error('This command does not match the active job.');
  const {action,job_id,...fields}=command;
  const allowed=action==='progress'?['message','stage','completed_stages']:['outcome','message','questions'];
  if(Object.keys(fields).some(key=>!allowed.includes(key)))throw new Error('Unexpected worker action fields.');
  const result=await call(`ds_create_${current.kind}_${action}`,{job_id,attempt:current.attempt,lease:current.lease,...fields});
  emit({event:'ack',action,job_id,result});
  if(action==='finish')current=null;
 }catch(error){emit({event:'error',job_id:command?.job_id,message:error.message});}
 });});
try{
 await client.connect(transport);emit({event:'listening',session,pid:process.pid});
 while(!closing){
  if(boundViewer&&Date.now()-lastViewerCheck>2000){
   lastViewerCheck=Date.now();
   const viewer=await readFile(viewerFile,'utf8').then(JSON.parse,e=>{if(e.code==='ENOENT')return null;throw e;});
   if(!viewer){emit({event:'stopped',reason:'Builder stopped.'});break;}
   if(!Number.isInteger(viewer.pid)||viewer.pid<=0)throw new Error('Builder process identity is unavailable.');
   try{process.kill(viewer.pid,0);}catch(e){if(e.code!=='ESRCH')throw e;emit({event:'stopped',reason:'Builder process stopped.'});break;}
  }
  if(!current){
   for(const kind of ['publish','prepare']){
    const result=await call(`ds_create_${kind}`,{wait_seconds:0});
    if(result.status==='running'){
     current={...result,kind};const {lease,attempt,...publicJob}=current;
     publicJob.instructions+='\nListener transport: the ds_create tools mentioned above are invoked internally for you. Send progress and finish JSON lines to this same persistent process stdin, with action, job_id and typed fields. Do not claim again or register tools in the host. Acknowledge cancellation through finish cancelled; after a finish ack, keep waiting for the next job.';
     emit({event:'job',...publicJob});break;
    }
   }
  }
  await delay(500);
 }
 await commands;
}catch(error){emit({event:'listener-error',message:error.message});process.exitCode=1;}
finally{await cleanup();}
