import {realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {getState, publicMessage, readJSON} from '../manager/server/state.mjs';
import {sessionOutput} from '../manager/server/files.mjs';
import {cancelMcpJob, claimMcpJob, figmaPrompt, latestPublish, mcpPublishAction, preflightOperation} from '../manager/server/publish.mjs';
import {cancelMcpPreparation, claimMcpPreparation, createSetupJobs, latestMcpPreparation, mcpPrepareAction, setupPrompt, waitForPreparation} from '../manager/server/setup.mjs';
import {writeFoundationFastPlan} from '../manager/foundations/publish.mjs';
import {createItemStore} from '../manager/foundations/store.mjs';
import {listItems, getItems} from '../manager/foundations/query.mjs';
import {syncState} from '../manager/foundations/baseline.mjs';
import {createChangeRequests} from '../manager/server/changes.mjs';

const session=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('Stable Builder session id, not the project display name or input folder.');
const uuid=z.string().uuid();
const result=data=>({content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data});
const publicJob=job=>job?Object.fromEntries(['id','runner','status','hash','figmaUrl','message','started','updated','finished','progress','cancelRequested','cancelRequestedAt'].filter(k=>job[k]!==undefined).map(k=>[k,job[k]])):null;

export function createDsCreateMcp(workspace){
 const server=new McpServer({name:'ds-create',version:'0.2.0'}, {instructions:'Operate only the selected local workspace. Item tools (ds_create_items_*) read and change the saved local foundations and never touch Figma; a wide change needs the user\'s agreement before you resend it with confirmed:true. Preparation claims saved context and stops at a validated local draft awaiting review; it has no Figma authorization. Publish claims an already approved Builder request; it does not write Figma itself. Use your configured Figma tools to carry out its exact instructions, report progress before writes and finish with real export/audit evidence. A queued job cannot wake an idle chat: hold ds_create_wait pending to receive Prepare and Publish clicks from Builder. Never change approvals or fabricate completed output.'});
 const owner=randomUUID(),owned=new Map(),inflight=new Set(),shutdown=new AbortController();let closing=false,closingPromise;
 const tool=(name,description,schema,handler,readOnly=false)=>server.registerTool(name,{description,inputSchema:z.object(schema).strict(),annotations:{readOnlyHint:readOnly,destructiveHint:false,openWorldHint:false}},async(args,extra)=>{
  if(closing)return {content:[{type:'text',text:'MCP connection is closing.'}],isError:true};
  const operation=Promise.resolve().then(()=>handler(args,extra));inflight.add(operation);
  try{return result(await operation);}catch(e){return {content:[{type:'text',text:publicMessage(e.message)}],isError:true};}finally{inflight.delete(operation);}
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
 const fontOption=z.object({family:z.string().min(1).max(200),styles:z.array(z.string().min(1).max(100)).min(1).max(40)}).strict();
 const fontAlternative=z.object({family:z.string().min(1).max(300),similar:z.array(fontOption).max(10),recommended:z.array(fontOption).max(10)}).strict();
 tool('ds_create_publish_preflight','Submit the actual read-only Figma font and inventory result, including its alternatives. If Figma cannot load an approved face, the attempt ends as needs-fonts with nothing written and the user resolves it in Builder. Otherwise returns the compiled continuation to publish the approved foundations; it does not prove edit access or complete publication.',{...credentials,result:z.object({fonts:z.array(fontResult).max(1000),inventory:z.object({collections:z.number().int().nonnegative(),variables:z.number().int().nonnegative(),textStyles:z.number().int().nonnegative(),effectStyles:z.number().int().nonnegative()}).strict(),alternatives:z.array(fontAlternative).max(20).optional()}).strict()},async args=>{
  const a=await actionArgs(args),r=await mcpPublishAction({...a,action:'preflight',preflight:args.result});
  if(['blocked','needs-fonts'].includes(r.status))owned.delete(a.outputDir+'/'+a.id);
  if(r.status==='needs-fonts')return {...r,instructions:'Stop: Figma cannot load these approved faces, and nothing was written. Builder now shows the missing fonts, how to make them available in Figma, and replacement choices. The user decides there. Do not substitute fonts or write Figma. Call ds_create_wait to receive the next Builder event (a font re-check or a new preparation), or end the turn.'};
  if(r.passed){
   const requestFile=path.join(a.outputDir,'manager/jobs',a.id,'request.json'),request=await readJSON(requestFile);
   try{const plan=await writeFoundationFastPlan(request,requestFile);return {...r,next_operation:{kind:'generate-foundations',engine:'fast',plan_file:plan.file,call_count:plan.calls.length,instructions:figmaPrompt(request,requestFile,plan)}};}
   catch(error){if(error.code!=='MANAGER_FAST_UNSUPPORTED')throw error;return {...r,next_operation:{kind:'generate-foundations',engine:'standard',fast_fallback:publicMessage(error.message),instructions:'FAST escape hatch: '+publicMessage(error.message)+'. Preserve this metadata through the standard continuation; do not drop it or change the source.\n'+figmaPrompt(request,requestFile)}};}
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
  const waitTool=async(args,extra)=>{
  const event=await waitForPreparation({workspace,session:args.session,signal:AbortSignal.any([extra.signal,shutdown.signal]),afterEvent:args.after_event});
  if(event.event==='wait-expired')return {...event,instructions:'End the turn. Do not rearm or poll. The user can copy the continuation prompt from Builder when ready.'};
  if(event.event==='build-request')return {...event,status:'queued',instructions:'This is a Publish click in Builder: run ds-create build for this same session in this main instance. Follow skills/ds-create/reference/build.md, starting from the foundations and Parts already prepared in Builder (Figma is optional). Ask before any Figma write.'};
  if(event.event==='publish-request')return {...event,status:'queued',next_tool:'ds_create_publish',instructions:'This is a queued Publish to Figma event, not a claim. Call ds_create_publish for this same session with execution "stepped", then follow reference/publish-mcp.md in this main instance. Its first operation is the read-only font and inventory check.'};
  return {...event,status:'queued',next_tool:'ds_create_prepare',instructions:'This is a queued event, not a claim or generation. Use ds_create_prepare for this same session, then follow its guarded local preparation instructions in this main instance. No subagent, Figma, or build.'};
 };
 const waitDescription='Wait up to 5 minutes for the next Builder event: Prepare foundations (prepare-request), Publish to Figma (publish-request) or Publish, which runs ds-create build (build-request). Node waits without model requests and the event resumes this same agent; claim it with the returned next_tool. On wait-expired, end the turn without automatically waiting again; Builder offers a continuation prompt. Host cancellation detaches without claiming or retrying work. after_event acknowledges a previously returned event.';
 tool('ds_create_wait',waitDescription,{session,after_event:uuid.optional()},waitTool);
 tool('ds_create_prepare_wait','Same as ds_create_wait (kept for existing prompts). '+waitDescription,{session,after_event:uuid.optional()},waitTool);
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
 tool('ds_create_prepare_compile','Compile this owned job’s decisions.json into local foundations and review artifacts. Revalidates source identity, locked form facts, coverage, aliases and contrast. No Figma or approval writes. Returns counts/cache evidence; resolve errors by editing only the decision pack.',{...credentials},async args=>mcpPrepareAction({...await actionArgs(args),action:'compile'}));
 const question=z.object({id:z.string().regex(/^[a-z0-9_-]{1,64}$/),prompt:z.string().trim().min(1).max(2000),options:z.array(z.string().trim().min(1).max(300)).max(8)}).strict();
 const coverage=z.array(z.object({path:z.string().min(1),hash:z.string().regex(/^[a-f0-9]{64}$/),status:z.enum(['read','inspected','imported','archived','unreadable']),note:z.string().optional()}).strict());
 tool('ds_create_prepare_finish','Finish local preparation as questions, ready, blocked, failed or cancelled. New ready results require the compiled decision pack and saved proof; questions require coverage of every source. Questions are shown and answered in Builder.',{...credentials,outcome:z.enum(['questions','ready','blocked','failed','cancelled']),message:z.string().trim().min(1).max(2000),questions:z.array(question).max(12).default([]),coverage:coverage.optional()},async args=>{
  const a=await actionArgs(args),finished=await mcpPrepareAction({...a,action:'finish',outcome:args.outcome,message:args.message,questions:args.questions,coverage:args.coverage});owned.delete(a.outputDir+'/'+a.id);
  return ['ready','questions'].includes(finished.status)?{...finished,next_tool:'ds_create_wait',instructions:'Call ds_create_wait for this session so the next Builder click (answers or Publish to Figma) reaches you. It waits at most 5 minutes.'}:finished;
 });
 tool('ds_create_prepare_cancel','Cancel queued preparation immediately or request that its owning MCP agent stop safely. Does not delete saved context or undo partial local output.',{session},async args=>{
  const outputDir=await sessionOutput(workspace,args.session),current=await latestMcpPreparation(outputDir);return current?.jobId?cancelMcpPreparation(outputDir,current.jobId):{stopped:false};
 });
 // Item tools: read and change foundation items in the saved local files. None of them reads or writes Figma.
 const store=async args=>createItemStore({outputDir:await sessionOutput(workspace,args.session)});
 const itemOp=z.object({op:z.enum(['set','add','rename','delete','apply']),target:z.string()}).passthrough();
 tool('ds_create_items_list','List foundation items (variables and styles) from the saved local draft with resolved values per mode. Filter by domain (color, typography, space, shape, elevation, motion), collection, kind, type, name prefix or text. Does not touch Figma.',{session,domain:z.string().optional(),collection:z.string().optional(),kind:z.enum(['variable','textStyle','effectStyle','gridStyle']).optional(),type:z.string().optional(),prefix:z.string().optional(),query:z.string().max(200).optional(),limit:z.number().int().min(1).max(200).optional(),cursor:z.number().int().min(0).optional()},async args=>{
  const {session:_,...filters}=args,{revision,draft}=await (await store(args)).read();return {revision,...listItems(draft,filters)};
 },true);
 tool('ds_create_items_get','Read named foundation items in full: definition, resolved value and alias chain per mode, and everything that uses them. The name "rules" returns the editable rules (discussion limits, palette ramps, contract names). Does not touch Figma.',{session,names:z.array(z.string().min(1)).min(1).max(50)},async args=>{
  const {revision,draft,rules}=await (await store(args)).read(),names=args.names.filter(n=>n!=='rules');
  const items=getItems(draft,names);return {revision,items:args.names.map(n=>n==='rules'?{kind:'rules',item:rules}:items[names.indexOf(n)])};
 },true);
 tool('ds_create_items_change','Change foundation items in the saved local draft as one new revision: ops set, add, rename, delete and apply (recipes radius-base, space-base, shadow-seed, type-family, type-scale, palette-ramp); set kind "rules" edits the rules. Send expectedRevision from your last read. Dry-run first. When the result has wide set (status needs-discussion), show the impact to the user and resend with confirmed:true only after they agree. Does not touch Figma.',{session,expectedRevision:z.number().int().min(1),ops:z.array(itemOp).min(1).max(200),reason:z.string().trim().min(1).max(200),dryRun:z.boolean().optional(),confirmed:z.boolean().optional()},async args=>{
  try{return {status:args.dryRun?'dry-run':'saved',...await (await store(args)).change({expectedRevision:args.expectedRevision,ops:args.ops,reason:args.reason,author:'mcp',dryRun:!!args.dryRun,confirmed:!!args.confirmed})};}
  catch(e){if(e.status===428)return {status:'needs-discussion',wide:e.wide,impact:e.impact,warnings:e.warnings,message:e.message};throw e;}
 });
 tool('ds_create_items_history','List recent revisions of the saved foundation draft with author, reason and op count, newest first. Does not touch Figma.',{session,limit:z.number().int().min(1).max(100).optional()},async args=>({revisions:await (await store(args)).history({limit:args.limit})}),true);
 tool('ds_create_items_restore','Restore an earlier revision of the foundation draft as a new revision; history is kept. Send expectedRevision from your last read. Does not touch Figma.',{session,revision:z.number().int().min(1),expectedRevision:z.number().int().min(1)},async args=>(await store(args)).restore({revision:args.revision,expectedRevision:args.expectedRevision,author:'mcp'}));
 tool('ds_create_items_diff','The sync state (local, in-sync, local-changes) and what changed locally since the last confirmed Figma publish: added, changed (old → new), renamed, deleted. Computed from local files; does not read Figma.',{session},async args=>syncState(await sessionOutput(workspace,args.session)),true);
 tool('ds_create_change_requests','List the change requests the user saved in Builder (item, where it sits, notes), or mark one done with the revision that applied it.',{session,action:z.enum(['list','done']).optional(),id:uuid.optional(),revision:z.number().int().min(1).optional()},async args=>{
  const changes=createChangeRequests({outputDir:await sessionOutput(workspace,args.session)});
  if(args.action==='done')return changes.update({action:'done',id:args.id,revision:args.revision});
  return {requests:await changes.list()};
 });
 async function cleanup(){
  if(closingPromise)return closingPromise;closing=true;shutdown.abort();
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

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);
  if(args.length!==0&&(args.length!==2||args[0]!=='--workspace'))throw new Error('Usage: node kit/mcp/server.mjs [--workspace /absolute/workspace]');
  if(Number(process.versions.node.split('.')[0])<20)throw new Error('DS Create MCP requires Node20+.');
  await runDsCreateMcp(await realpath(args[1]||fileURLToPath(new URL('../../',import.meta.url))));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
