import {readJSON} from './state.mjs';
import path from 'node:path';
import {AGENT_LEASE_MS} from './agent-lease.mjs';
export async function listenerStatus(output){
 const r=await readJSON(path.join(output,'manager/listener.json'));
 if(!Number.isInteger(r?.pid)||r.pid<=0)return {connected:false,transportConnected:false};
 try{process.kill(r.pid,0);}catch(e){if(e.code==='ESRCH')return {connected:false,transportConnected:false};throw e;}
 const seen=Date.parse(r.agentSeenAt),fresh=Number.isFinite(seen)&&Date.now()-seen<Math.min(AGENT_LEASE_MS,Number.isFinite(r.agentLeaseMs)&&r.agentLeaseMs>0?r.agentLeaseMs:AGENT_LEASE_MS);
 return {connected:fresh,transportConnected:true,started:r.started,agentSeenAt:r.agentSeenAt||null,reason:fresh?null:'The background agent has not checked in.'};
}
