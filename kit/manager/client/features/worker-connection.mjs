import { builderSettings } from '../../shared/ui-settings.mjs';
export function setupWorkerConnection(){
 const $=id=>document.getElementById(id),root=$('worker-connection'),recovery=$('worker-recovery'),prompt=$('worker-spawn-prompt'),recheck=$('worker-recheck');
 let request,timer,closed=false;
 const text=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
 function draw(result){
  const ready=result?.preparationState==='ready',attention=['questions','outdated','blocked','failed','cancelled','interrupted'].includes(result?.preparationState);
  const connected=result?.connected===true,delivered=result?.deliveryState==='delivered',disconnected=!ready&&!attention&&!delivered&&result?.connected===false&&typeof result.recoveryPrompt==='string'&&!!result.recoveryPrompt;
  root.dataset.connection=ready?'idle':connected?'connected':disconnected?'disconnected':'unknown';
  root.dataset.state=ready?'ready':attention?'attention':connected?'connected':delivered?'delivered':disconnected?'disconnected':'unknown';
  const status=connected?'connected':delivered?'delivered':disconnected?'disconnected':result?.connected===false?'idle':'unknown';
  for(const name of ['connected','delivered','disconnected','idle','unknown'])$('worker-status-'+name).hidden=name!==status;
  text('worker-connection-detail',ready?'Your agent connects when you click Prepare or Publish.':attention?(result.preparationMessage||'Open Context to continue preparation.'):connected?'Your agent is connected and will pick up Prepare and Publish clicks.':delivered?'Your agent received the preparation request.':disconnected?(result.waitExpired?'The 5-minute wait ended. Copy the prompt below into your agent to continue from your saved inputs.':'Agent disconnected. Copy the prompt below into your agent to continue from your saved inputs.'):'Could not check the agent connection. Check again when Builder reconnects.');
  if(!disconnected&&recovery.contains(document.activeElement))recheck.focus({preventScroll:true});
  recovery.hidden=!disconnected;
  if(prompt.value!==(disconnected?result.recoveryPrompt:'')){prompt.value=disconnected?result.recoveryPrompt:'';prompt.scrollTop=0;}
  if(!disconnected)text('worker-copy-feedback','');
  // One box for the current job: an empty state when nothing is running, otherwise what the job is doing.
  const jobs={running:'Preparing foundations',queued:'Waiting for your agent',questions:'Waiting for your answers',outdated:'Needs a new revision',blocked:'Blocked',failed:'Preparation failed',cancelled:'Preparation cancelled',interrupted:'Preparation interrupted'};
  const job=delivered?'Request delivered':jobs[result?.preparationState];
  $('worker-job').dataset.active=String(!!job);
  text('worker-job-title',job||'No active job');
  text('worker-job-text',job?(result?.preparationMessage||'Open Overview to follow this job.'):'Prepare and Publish requests from Builder show up here.');
 }
 async function check(){
  clearTimeout(timer);request?.abort();const current=new AbortController();request=current;
  try{
   const response=await fetch('/api/worker',{cache:'no-store',signal:AbortSignal.any([current.signal,AbortSignal.timeout(builderSettings.network.readTimeoutMs)])});
   if(!response.ok)throw new Error('Status unavailable.');
   const result=await response.json();if(request===current&&!closed)draw(result);
  }catch{if(request===current&&!closed)draw(null);}
  finally{if(request===current&&!closed){timer=setTimeout(check,document.hidden?builderSettings.network.workerPollHiddenMs:builderSettings.network.workerPollVisibleMs);}}
 }
 $('worker-copy-prompt').addEventListener('click',async()=>{
  if(recovery.hidden||!prompt.value)return;
  try{await navigator.clipboard.writeText(prompt.value);text('worker-copy-feedback','Copied. Paste into your agent to continue.');}
  catch{if(!recovery.hidden){prompt.focus();prompt.select();text('worker-copy-feedback','Copy the selected prompt manually.');}}
 });
 recheck.addEventListener('click',check);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!closed)check();});
 window.addEventListener('pagehide',()=>{closed=true;clearTimeout(timer);request?.abort();});
 window.addEventListener('pageshow',()=>{if(closed){closed=false;check();}});
 check();
 return {check};
}
