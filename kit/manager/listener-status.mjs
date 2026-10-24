import {readJSON} from './state.mjs';
import path from 'node:path';
import {AGENT_LEASE_MS} from './agent-lease.mjs';
export async function listenerStatus(output){
 const r=await readJSON(path.join(output,'manager/listener.json'));
 if(!Number.isInteger(r?.pid)||r.pid<=0)return {connected:false,transportConnected:false};
 try{process.kill(r.pid,0);}catch(e){if(e.code==='ESRCH')return {connected:false,transportConnected:false};throw e;}
 const seen=Date.parse(r.agentSeenAt),age=Date.now()-seen,fresh=Number.isFinite(seen)&&age>=0&&age<Math.min(AGENT_LEASE_MS,Number.isFinite(r.agentLeaseMs)&&r.agentLeaseMs>0?r.agentLeaseMs:AGENT_LEASE_MS);
 return {connected:fresh,transportConnected:true,started:r.started,agentSeenAt:r.agentSeenAt||null,reason:fresh?null:'The background agent has not checked in.'};
}
export async function workerConnectionStatus(output,workspace){
 const listener=await listenerStatus(output),session=path.basename(output);
 const recoveryPrompt=listener.connected?null:`In workspace ${JSON.stringify(workspace)}, resume DS Create Builder session ${JSON.stringify(session)}. Read skills/ds-create/reference/background-worker.md. Reuse its responsive native background subagent if one exists; otherwise spawn exactly ONE subagent using your own native background/subagent tool. Have it attach the portable listener, verify its actual heartbeat, and stay waiting for Builder preparation/Publish events. Do not launch another agent/IDE CLI, change permissions, configure a new Figma connection, or create a duplicate owner. Use your existing connected Figma tools only for queued Publish events. Do not retry a blocked/cancelled publication or run build automatically. Report the actual subagent name and readiness, then leave it waiting.`;
 return {connected:listener.connected,lastSeenAt:listener.agentSeenAt||null,recoveryPrompt};
}
