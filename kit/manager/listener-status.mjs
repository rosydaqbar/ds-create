import {readJSON} from './state.mjs';
import path from 'node:path';
import {AGENT_LEASE_MS} from './agent-lease.mjs';
export async function listenerStatus(output,capability){
 const r=await readJSON(path.join(output,'manager/listener.json'));
 if(!Number.isInteger(r?.pid)||r.pid<=0)return {connected:false,transportConnected:false};
 try{process.kill(r.pid,0);}catch(e){if(e.code==='ESRCH')return {connected:false,transportConnected:false};throw e;}
 if(r.mode==='main-agent')return {connected:r.receiverReady===true&&capability!=='publish',transportConnected:true,mode:'main-agent',capabilities:['prepare'],started:r.started,agentSeenAt:r.agentSeenAt||null,reason:capability==='publish'?'This Node listener handles preparation only.':r.receiverReady?null:'Node is waiting; main-agent event delivery is not connected.'};
 const seen=Date.parse(r.agentSeenAt),age=Date.now()-seen,fresh=Number.isFinite(seen)&&age>=0&&age<Math.min(AGENT_LEASE_MS,Number.isFinite(r.agentLeaseMs)&&r.agentLeaseMs>0?r.agentLeaseMs:AGENT_LEASE_MS);
 return {connected:fresh,transportConnected:true,started:r.started,agentSeenAt:r.agentSeenAt||null,reason:fresh?null:'The background agent has not checked in.'};
}
export async function workerConnectionStatus(output,workspace){
 const listener=await listenerStatus(output),session=path.basename(output);
 const recoveryPrompt=listener.connected?null:`In workspace ${JSON.stringify(workspace)}, connect DS Create Builder session ${JSON.stringify(session)} to this MAIN agent instance. Read skills/ds-create/reference/background-worker.md. Start or reuse the Node preparation listener and attach an actually supported host event hook to this same chat. Do not spawn subagents, another chat, an agent/IDE CLI, or a host-specific bridge. A Node PID alone is not delivery readiness. If this host cannot wake its existing chat from events, report that capability as unavailable. Do not retry blocked/cancelled publication or run build.`;
 return {connected:listener.connected,transportConnected:listener.transportConnected,mode:listener.mode||'legacy',capabilities:listener.capabilities||[],reason:listener.reason||null,lastSeenAt:listener.agentSeenAt||null,recoveryPrompt};
}
