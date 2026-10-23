import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {getState} from '../manager/state.mjs';
import {sessionOutput,latestPublish,claimMcpJob,mcpPublishAction,cancelMcpJob,clean} from '../manager/publish-queue.mjs';
import {figmaPrompt} from '../manager/figma-prompt.mjs';

const session=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('Stable Builder session id, not the project display name or input folder.');
const uuid=z.string().uuid();
const result=data=>({content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data});
const publicJob=job=>job?Object.fromEntries(['id','runner','status','hash','figmaUrl','message','started','updated','finished'].filter(k=>job[k]!==undefined).map(k=>[k,job[k]])):null;

export function createPublishMcp(workspace){
 const server=new McpServer({name:'ds-create-publish',version:'0.1.0'}, {instructions:'Operate only the selected local workspace. Publish claims an already approved Builder request; it does not write Figma itself. Use your configured Figma tools to carry out its exact instructions, report progress before writes and finish with real export/audit evidence. A queued job cannot wake an idle chat. Never change approvals or fabricate completed output.'});
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
 tool('ds_create_publish','Claim one user-approved publication queued in Builder. Returns a lease and exact Figma continuation instructions, not completed publication. Use the host agent\'s configured Figma tools; no AI subprocess is launched. Optional bounded wait supports an active agent waiting for the user in Builder.',{session,wait_seconds:z.number().int().min(0).max(20).default(0)},async(args,extra)=>{
  const outputDir=await sessionOutput(workspace,args.session),deadline=Date.now()+args.wait_seconds*1000;
  for(;;){
   if(closing||extra.signal.aborted)throw new Error('Publication wait cancelled.');
   const job=await latestPublish(outputDir);
   if(job?.runner==='mcp'&&['queued','running'].includes(job.status)){
    const key=outputDir+'/'+job.id,previous=owned.get(key),lease=previous?.lease||randomUUID();
    const claimed=await claimMcpJob({outputDir,workspace,id:job.id,owner,lease});
    const record={outputDir,workspace,id:job.id,attempt:claimed.attempt,owner,lease};owned.set(key,record);
    if(closing||extra.signal.aborted){await mcpPublishAction({...record,action:'finish',outcome:'blocked',message:'MCP client disconnected during handoff. Inspect partial output before retrying.'});owned.delete(key);throw new Error('MCP connection closed during handoff.');}
    const r=claimed.request;
    return {status:'running',session:args.session,job_id:job.id,attempt:claimed.attempt,lease,revision:r.revision,source_hash:r.hash,figma_url:r.figmaUrl,reused:claimed.reused,
     instructions:figmaPrompt(r,path.join(outputDir,'manager/jobs',job.id,'request.json'))+'\nMCP protocol: use ds_create_publish_progress with this session/job_id/attempt/lease before each Figma write and at meaningful stages. A cancellation result means stop and finish cancelled. Finish through ds_create_publish_finish with the same lease; completion requires the real confirmed export and source-bound audit. Keep this MCP connection open until finishing. Do not use the retired manager-agent CLI or depend on native subagents.'};
   }
   if(Date.now()>=deadline)return {status:'waiting',job:publicJob(job),message:'No MCP publication is queued. Click Publish to Figma in Builder. An idle agent must be explicitly resumed; MCP does not start a new chat.'};
   await delay(Math.min(250,deadline-Date.now()),undefined,{signal:extra.signal});
  }
 });
 const credentials={session,job_id:uuid,attempt:uuid,lease:uuid};
 const actionArgs=async args=>({outputDir:await sessionOutput(workspace,args.session),workspace,id:args.job_id,attempt:args.attempt,lease:args.lease,owner});
 tool('ds_create_publish_progress','Validate current source/input/approval and the owned lease, then save public progress. Call before Figma writes. cancelRequested:true means stop and acknowledge cancellation.',{...credentials,message:z.string().trim().min(1).max(2000)},async args=>mcpPublishAction({...await actionArgs(args),action:'progress',message:args.message}));
 tool('ds_create_publish_finish','Finish the owned attempt as completed, blocked, failed or cancelled. Completed independently requires real matching confirmed Figma output, current approval and a passing full file audit; a message alone cannot unlock build.',{...credentials,outcome:z.enum(['completed','blocked','failed','cancelled']),message:z.string().trim().min(1).max(2000)},async args=>{
  const a=await actionArgs(args),finished=await mcpPublishAction({...a,action:'finish',outcome:args.outcome,message:args.message});owned.delete(a.outputDir+'/'+a.id);return finished;
 });
 tool('ds_create_publish_cancel','Request cancellation of the current MCP publication. Unclaimed work stops immediately; claimed work stays active until its owner acknowledges. Does not roll back existing Figma output.',{session},async args=>{
  const outputDir=await sessionOutput(workspace,args.session),job=await latestPublish(outputDir);return job?cancelMcpJob({outputDir,id:job.id}):{stopped:false};
 });
 async function cleanup(){
  if(closingPromise)return closingPromise;closing=true;
  closingPromise=(async()=>{
   await Promise.allSettled([...inflight]);
   await Promise.allSettled([...owned.values()].map(record=>mcpPublishAction({...record,action:'finish',outcome:'blocked',message:'MCP client disconnected before publication finished. Inspect any partial Figma output, then retry the approved request.'})));
   owned.clear();
  })();return closingPromise;
 }
 const previousClose=server.server.onclose;server.server.onclose=()=>{previousClose?.();void cleanup();};
 return {server,cleanup};
}
export async function runPublishMcp(workspace){
 const {server,cleanup}=createPublishMcp(workspace);
 await server.connect(new StdioServerTransport());
 process.stdin.once('end',()=>{void cleanup();});
 const stop=async()=>{await server.close();await cleanup();process.exit(0);};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
}
