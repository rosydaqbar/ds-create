import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {claimMcpPreparation, latestMcpPreparation, mcpPrepareAction} from '../../kit/manager/server/setup.mjs';
import {claimMcpJob, latestPublish, mcpPublishAction} from '../../kit/manager/server/publish.mjs';

// Test-only simulated agent. All claims and outcomes use the production queue guards.

export function fixtureConsumer({output,workspace,kind,execute,timeoutMs=10000}){
 const prepare=kind==='prepare',latest=prepare?latestMcpPreparation:latestPublish;
 const claim=prepare?claimMcpPreparation:claimMcpJob,action=prepare?mcpPrepareAction:mcpPublishAction;
 const owner=randomUUID();let closing=false,controller;
 const done=(async()=>{
  while(!closing){
   const current=await latest(output),id=prepare?current?.jobId:current?.id;
   if(current?.runner!=='mcp'||current.status!=='queued'){await delay(15);continue;}
   const credentials={workspace,outputDir:output,id,owner,lease:randomUUID()};
   let claimed;
   try{claimed=await claim(credentials);}catch(error){if(/Another|not (?:available|queued)/.test(error.message)){await delay(15);continue;}throw error;}
   credentials.attempt=claimed.attempt;
   const dir=path.join(output,'manager',prepare?'setup-jobs':'jobs',id);
   controller=new AbortController();let outcome;
   const task=execute(claimed.request,dir,controller.signal).then(result=>{outcome={result};},error=>{outcome={error};});
   const deadline=Date.now()+timeoutMs;
   let cancelled=false,timedOut=false;
   while(!outcome&&!closing){
    const delivery=JSON.parse(await readFile(path.join(dir,'mcp-delivery.json'),'utf8'));
    cancelled=!!delivery.cancelRequested;timedOut=Date.now()>=deadline;
    if(cancelled||timedOut)break;
    await delay(15);
   }
   if(!outcome){controller.abort();await task;}
   try{
    if(closing)await action({...credentials,action:'finish',outcome:'blocked',message:'Fixture consumer disconnected.'});
    else if(cancelled)await action({...credentials,action:'finish',outcome:'cancelled',message:'Fixture acknowledged cancellation.'});
    else if(timedOut)await action({...credentials,action:'finish',outcome:'failed',message:'Fixture execution reached its time limit.'});
    else if(outcome.error)throw outcome.error;
    else await action({...credentials,action:'finish',outcome:outcome.result.status,message:outcome.result.message,questions:outcome.result.questions});
   }catch(error){
    await action({...credentials,action:'finish',outcome:/changed/i.test(error.message)?'blocked':'failed',message:error.message});
   }
   controller=null;
  }
 })();
 // Retain failures for cleanup without producing an unhandled rejection mid-test.
 let failure;const settled=done.catch(error=>{failure=error;});
 return {async close(){closing=true;controller?.abort();await settled;if(failure)throw failure;}};
}
