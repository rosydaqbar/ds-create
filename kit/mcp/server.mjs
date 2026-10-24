import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {getState,readJSON} from '../manager/state.mjs';
import {sessionOutput,latestPublish,claimMcpJob,mcpPublishAction,cancelMcpJob,clean} from '../manager/publish-queue.mjs';
import {createSetupJobs} from '../manager/setup-jobs.mjs';
import {latestMcpPreparation,claimMcpPreparation,mcpPrepareAction,cancelMcpPreparation} from '../manager/setup-queue.mjs';
import {setupPrompt} from '../manager/setup-prompt.mjs';
import {figmaPrompt} from '../manager/figma-prompt.mjs';
import {preflightOperation} from '../manager/publish-preflight.mjs';
import {writeFoundationFastPlan} from '../manager/foundation-fast.mjs';

const session=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('Stable Builder session id, not the project display name or input folder.');
const uuid=z.string().uuid();
const result=data=>({content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data});
const publicJob=job=>job?Object.fromEntries(['id','runner','status','hash','figmaUrl','message','started','updated','finished','progress','cancelRequested','cancelRequestedAt'].filter(k=>job[k]!==undefined).map(k=>[k,job[k]])):null;

export function createDsCreateMcp(workspace){
 const server=new McpServer({name:'ds-create',version:'0.2.0'}, {instructions:'Operate only the selected local workspace. Preparation claims saved context and stops at a validated local draft awaiting review; it has no Figma authorization. Publish claims an already approved Builder request; it does not write Figma itself. Use your configured Figma tools to carry out its exact instructions, report progress before writes and finish with real export/audit evidence. A queued job cannot wake an idle chat. Never change approvals or fabricate completed output.'});
 const owner=randomUUID(),owned=new Map(),inflight=new Set();let closing=false,closingPromise;
 const tool=(name,description,schema,handler,readOnly=false)=>server.registerTool(name,{description,inputSchema:z.object(schema).strict(),annotations:{readOnlyHint:readOnly,destructiveHint:false,openWorldHint:false}},async(args,extra)=>{
  if(closing)return {content:[{type:'text',text:'MCP connection is closing.'}],isError:true};
  const operation=Promise.resolve().then(()=>handler(args,extra));inflight.add(operation);
  try{return result(await operation);}catch(e){return {content:[{type:'text',text:clean(e.message)}],isError:true};}finally{inflight.delete(operation);}
 });
 tool('ds_create_publish_status','Read the selected Builder source and current publication status. Does not approve, queue, claim or write Figma.',{session},async args=>{
  const outputDir=await sessionOutput(workspace,args.session),[state,job]=await Promise.all([getState(outputDir),latestPublish(outputDir)]);
  return {session:args.session,source:state.source,initDone:state.initDone,job:publicJob(job),nextAction:'Queue an approved revision and Figma target in Builder, then call ds_create_publish.'};
 },true);
 tool('ds_create_publish','Claim one user-approved publication queued in Builder. Stepped execution returns a concrete read-only Figma preflight first; submit its result to receive the continuation. Uses the host agent\'s configured Figma tools, with no AI subprocess.',{session,wait_seconds:z.number().int().min(0).max(20).default(0),execution:z.enum(['legacy','stepped']).default('legacy')},async(args,extra)=>{
  const outputDir=await sessionOutput(workspace,args.session),deadline=Date.now()+args.wait_seconds*1000;
  for(;;){
   if(closing||extra.signal.aborted)throw new Error('Publication wait cancelled.');
   const job=await latestPublish(outputDir);
   if(job?.runner==='mcp'&&['queued','running'].includes(job.status)){
    const key=outputDir+'/'+job.id,previous=owned.get(key),lease=previous?.lease||randomUUID();
    const claimed=await claimMcpJob({outputDir,workspace,id:job.id,owner,lease,execution:args.execution});
    const record={kind:'publish',outputDir,workspace,id:job.id,attempt:claimed.attempt,owner,lease};owned.set(key,record);
    if(closing||extra.signal.aborted){await mcpPublishAction({...record,action:'finish',outcome:'blocked',message:'Background worker disconnected during handoff. Inspect partial output before retrying.'});owned.delete(key);throw new Error('MCP connection closed during handoff.');}
    const r=claimed.request;
    if(args.execution==='stepped')return {status:'running',session:args.session,job_id:job.id,attempt:claimed.attempt,lease,revision:r.revision,source_hash:r.hash,figma_url:r.figmaUrl,reused:claimed.reused,
     operation:preflightOperation(r,await readJSON(path.join(outputDir,'foundations.json'))),instructions:'Execute the returned read-only operation first using the already-connected Figma tool. Send its actual result through ds_create_publish_preflight. Do not write Figma or load the full generation workflow until its result returns the continuation. Existing approval is retained.'};
    return {status:'running',session:args.session,job_id:job.id,attempt:claimed.attempt,lease,revision:r.revision,source_hash:r.hash,figma_url:r.figmaUrl,reused:claimed.reused,
     instructions:figmaPrompt(r,path.join(outputDir,'manager/jobs',job.id,'request.json'))+'\nMCP protocol: use ds_create_publish_progress with this session/job_id/attempt/lease before each Figma write and at meaningful stages. A cancellation result means stop and finish cancelled. Finish through ds_create_publish_finish with the same lease; completion requires the real confirmed export and source-bound audit. Keep this MCP connection open until finishing. Do not use the retired manager-agent CLI or depend on native subagents.'};
   }
   if(Date.now()>=deadline)return {status:'waiting',job:publicJob(job),message:'No MCP publication is queued. Click Publish to Figma in Builder. An idle agent must be explicitly resumed; MCP does not start a new chat.'};
   await delay(Math.min(250,deadline-Date.now()),undefined,{signal:extra.signal});
  }
 });
 const credentials={session,job_id:uuid,attempt:uuid,lease:uuid};
 const actionArgs=async args=>({outputDir:await sessionOutput(workspace,args.session),workspace,id:args.job_id,attempt:args.attempt,lease:args.lease,owner});
 const fontResult=z.object({family:z.string().min(1).max(300),style:z.string().min(1).max(300),available:z.boolean()}).strict();
 tool('ds_create_publish_preflight','Submit the actual read-only Figma inventory. Unlisted fonts are advisory and do not block generation. Returns instructions to publish the approved foundations; it does not prove edit access or complete publication.',{...credentials,result:z.object({fonts:z.array(fontResult).max(1000),inventory:z.object({collections:z.number().int().nonnegative(),variables:z.number().int().nonnegative(),textStyles:z.number().int().nonnegative(),effectStyles:z.number().int().nonnegative()}).strict()}).strict()},async args=>{
  const a=await actionArgs(args),r=await mcpPublishAction({...a,action:'preflight',preflight:args.result});
  if(r.status==='blocked')owned.delete(a.outputDir+'/'+a.id);
  if(r.passed){
   const requestFile=path.join(a.outputDir,'manager/jobs',a.id,'request.json'),request=await readJSON(requestFile);
   try{const plan=await writeFoundationFastPlan(request,requestFile);return {...r,next_operation:{kind:'generate-foundations',engine:'fast',plan_file:plan.file,call_count:plan.calls.length,instructions:figmaPrompt(request,requestFile,plan)}};}
   catch(error){if(error.code!=='MANAGER_FAST_UNSUPPORTED')throw error;return {...r,next_operation:{kind:'generate-foundations',engine:'standard',fast_fallback:clean(error.message),instructions:'FAST escape hatch: '+clean(error.message)+'. Preserve this metadata through the standard continuation; do not drop it or change the source.\n'+figmaPrompt(request,requestFile)}};}
  }
  return r;
 });
 tool('ds_create_publish_progress','Validate source/input/approval and lease, then report public progress before Figma writes. Explicit stage and completed_stages drive task rows; completed publication still requires export/audit verification. cancelRequested:true means stop safely.',{...credentials,message:z.string().trim().min(1).max(2000),stage:z.enum(['access','variables','styles','verification']).optional(),completed_stages:z.array(z.enum(['access','variables','styles','verification'])).max(4).optional()},async args=>mcpPublishAction({...await actionArgs(args),action:'progress',message:args.message,stage:args.stage,completed_stages:args.completed_stages}));
 tool('ds_create_publish_finish','Finish the owned attempt as completed, blocked, failed or cancelled. Completed independently requires real matching confirmed Figma output, current approval and a passing full file audit; a message alone cannot unlock build.',{...credentials,outcome:z.enum(['completed','blocked','failed','cancelled']),message:z.string().trim().min(1).max(2000)},async args=>{
  const a=await actionArgs(args),finished=await mcpPublishAction({...a,action:'finish',outcome:args.outcome,message:args.message});owned.delete(a.outputDir+'/'+a.id);return finished;
 });
 tool('ds_create_publish_cancel','Request cancellation of the current MCP publication. Unclaimed work stops immediately; claimed work stays active until its owner acknowledges. Does not roll back existing Figma output.',{session},async args=>{
  const outputDir=await sessionOutput(workspace,args.session),job=await latestPublish(outputDir);return job?cancelMcpJob({outputDir,id:job.id}):{stopped:false};
 });
 tool('ds_create_prepare_status','Read saved context, preparation status and open questions for a Builder session. Does not create, approve or execute any request.',{session},async args=>{
  const outputDir=await sessionOutput(workspace,args.session),flow=await createSetupJobs({outputDir,workspace}).status();
  return {session:args.session,...flow,nextAction:'Save context or answers in Builder, then call ds_create_prepare to take its queued preparation.'};
 },true);
 tool('ds_create_prepare','Claim one queued local preparation requested in Builder. Uses this MCP client and its agent, with no selected vendor or external AI process. Returns the exact snapshot/scope and lease; the agent prepares local artifacts and reports through MCP. This does not authorize any Figma call.',{session,wait_seconds:z.number().int().min(0).max(20).default(0)},async(args,extra)=>{
  const outputDir=await sessionOutput(workspace,args.session),deadline=Date.now()+args.wait_seconds*1000;
  for(;;){
   if(closing||extra.signal.aborted)throw new Error('Preparation wait cancelled.');
   const current=await latestMcpPreparation(outputDir);
   if(current?.runner==='mcp'&&['queued','running'].includes(current.status)){
    const key=outputDir+'/'+current.jobId,previous=owned.get(key),lease=previous?.lease||randomUUID();
    const claimed=await claimMcpPreparation({outputDir,workspace,id:current.jobId,owner,lease});
    const record={kind:'prepare',outputDir,workspace,id:current.jobId,attempt:claimed.attempt,owner,lease};owned.set(key,record);
    if(closing||extra.signal.aborted){await mcpPrepareAction({...record,action:'finish',outcome:'blocked',message:'Background connection closed during preparation handoff. Context is saved.'});owned.delete(key);throw new Error('MCP connection closed during handoff.');}
    return {status:'running',session:args.session,job_id:current.jobId,attempt:claimed.attempt,lease,reused:claimed.reused,
      input_hash:claimed.request.inputHash,input_revision:claimed.request.inputRevision,input_slug:claimed.request.inputSlug,
      instructions:setupPrompt(claimed.request,path.join(outputDir,'manager/setup-jobs',current.jobId,'request.json'))+'\nMCP continuation: report public stages/updates through ds_create_prepare_progress using this session/job_id/attempt/lease. Before source reads/output writes, revalidate through progress and obey cancellation. Do not rely on any vendor log format or private reasoning messages. Return questions/ready/blocked/failed/cancelled through ds_create_prepare_finish; its checks decide readiness. Keep this MCP connection open until finishing. All questions are answered in Builder; never overwrite manager-owned setup state. No Figma tools are authorized.'};
   }
   if(Date.now()>=deadline)return {status:'waiting',preparationStatus:current?.status||'unavailable',message:'No preparation is queued. Save context or answer the open questions in Builder, then resume this agent.'};
   await delay(Math.min(250,deadline-Date.now()),undefined,{signal:extra.signal});
  }
 });
 tool('ds_create_prepare_progress','Revalidate the selected input and owned preparation lease, then publish a human progress update. Optional stage describes observable work only, not completion. cancelRequested:true means stop and acknowledge cancellation.',{...credentials,message:z.string().trim().min(1).max(2000),stage:z.enum(['context','decisions','foundation']).optional()},async args=>mcpPrepareAction({...await actionArgs(args),action:'progress',message:args.message,stage:args.stage}));
 const question=z.object({id:z.string().regex(/^[a-z0-9_-]{1,64}$/),prompt:z.string().trim().min(1).max(2000),options:z.array(z.string().trim().min(1).max(300)).max(8)}).strict();
 tool('ds_create_prepare_finish','Finish local preparation as questions, ready, blocked, failed or cancelled. Ready requires the saved input-bound draft/plan, answers, sources, report, pending approval and all mandatory foundation checks; a message alone cannot mark it ready. Questions are shown and answered in Builder.',{...credentials,outcome:z.enum(['questions','ready','blocked','failed','cancelled']),message:z.string().trim().min(1).max(2000),questions:z.array(question).max(12).default([])},async args=>{
  const a=await actionArgs(args),finished=await mcpPrepareAction({...a,action:'finish',outcome:args.outcome,message:args.message,questions:args.questions});owned.delete(a.outputDir+'/'+a.id);return finished;
 });
 tool('ds_create_prepare_cancel','Cancel queued preparation immediately or request that its owning MCP agent stop safely. Does not delete saved context or undo partial local output.',{session},async args=>{
  const outputDir=await sessionOutput(workspace,args.session),current=await latestMcpPreparation(outputDir);return current?.jobId?cancelMcpPreparation(outputDir,current.jobId):{stopped:false};
 });
 async function cleanup(){
  if(closingPromise)return closingPromise;closing=true;
  closingPromise=(async()=>{
   await Promise.allSettled([...inflight]);
   await Promise.allSettled([...owned.values()].map(record=>(record.kind==='prepare'?mcpPrepareAction:mcpPublishAction)({...record,action:'finish',outcome:'blocked',message:record.kind==='prepare'?'Background worker disconnected before preparation finished. Context is saved; retry to continue.':'Background worker disconnected before publication finished. Inspect any partial Figma output, then retry the approved request.'})));
   owned.clear();
  })();return closingPromise;
 }
 const previousClose=server.server.onclose;server.server.onclose=()=>{previousClose?.();void cleanup();};
 return {server,cleanup};
}
export async function runDsCreateMcp(workspace){
 const {server,cleanup}=createDsCreateMcp(workspace);
 await server.connect(new StdioServerTransport());
 process.stdin.once('end',()=>{void cleanup();});
 const stop=async()=>{await server.close();await cleanup();process.exit(0);};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
}

export const createPublishMcp=createDsCreateMcp,runPublishMcp=runDsCreateMcp;
