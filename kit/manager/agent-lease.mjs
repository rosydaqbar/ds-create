export const AGENT_LEASE_MS=180000;
// Renewed only by commands actually received from the native agent, never by Node timers.
export function createAgentLease({now=Date.now,durationMs=AGENT_LEASE_MS}={}){
 if(!Number.isFinite(durationMs)||durationMs<=0)throw new Error('Invalid agent lease duration.');
 const started=now();let seen=null,expired=false;
 const inspect=()=>{expired ||= now()-(seen??started)>=durationMs;return {ready:seen!==null&&!expired,expired,seenAt:seen};};
 return {inspect,heartbeat(){if(inspect().expired)throw new Error('Agent lease expired; this connection cannot resume work.');seen=now();return inspect();}};
}
