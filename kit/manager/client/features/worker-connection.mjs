import { setDisclosure } from '../ui-motion.mjs';
import { builderSettings } from '../../shared/ui-settings.mjs';
export function setupWorkerConnection(){
 const $=id=>document.getElementById(id),root=$('worker-connection'),recovery=$('worker-recovery'),prompt=$('worker-spawn-prompt'),details=$('worker-details'),toggle=$('worker-details-toggle'),recheck=$('worker-recheck');
 $('worker-details-toggle').querySelector('[data-anatomy=label]').id='worker-details-toggle-label';
 let request,timer,closed=false,expanded=true,readyBefore=false;
 const text=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
 function draw(result){
  const ready=result?.preparationState==='ready',attention=['questions','outdated','blocked','failed','cancelled','interrupted'].includes(result?.preparationState);
  const connected=result?.connected===true,delivered=result?.deliveryState==='delivered',disconnected=!ready&&!attention&&!delivered&&result?.connected===false&&typeof result.recoveryPrompt==='string'&&!!result.recoveryPrompt;
  if(ready!==readyBefore){expanded=!ready;readyBefore=ready;}
  root.dataset.connection=ready?'idle':connected?'connected':disconnected?'disconnected':'unknown';
  root.dataset.state=ready?'ready':attention?'attention':connected?'connected':delivered?'delivered':disconnected?'disconnected':'unknown';
  $('worker-work-summary').hidden=!ready;
  const status=connected?'connected':delivered?'delivered':disconnected?'disconnected':result?.connected===false?'idle':'unknown';
  for(const name of ['connected','delivered','disconnected','idle','unknown'])$('worker-status-'+name).hidden=name!==status;
  text('worker-connection-detail',ready?'No preparation changes needed. Review your saved foundations, or edit Context to prepare a new revision.':attention?(result.preparationMessage||'Open Context to continue preparation.'):connected?'':delivered?'Your agent received the preparation request.':disconnected?(result.waitExpired?'The 5-minute wait ended. Copy the prompt below into your agent to continue from your saved inputs.':'Agent disconnected. Copy the prompt below into your agent to continue from your saved inputs.'):'Could not check the agent connection. Check again when Builder reconnects.');
  $('worker-connection-detail').hidden=connected&&!ready&&!attention;
  toggle.setAttribute('aria-expanded',String(expanded));
  text('worker-details-toggle-label',expanded?'Hide details':'Show details');
  setDisclosure(details, expanded);
  if(!disconnected&&recovery.contains(document.activeElement))toggle.focus({preventScroll:true});
  recovery.hidden=!disconnected;
  if(prompt.value!==(disconnected?result.recoveryPrompt:'')){prompt.value=disconnected?result.recoveryPrompt:'';prompt.scrollTop=0;}
  if(!disconnected)text('worker-copy-feedback','');
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
 toggle.addEventListener('click',()=>{
  expanded=!expanded;toggle.setAttribute('aria-expanded',String(expanded));
  text('worker-details-toggle-label',expanded?'Hide details':'Show details');
  setDisclosure(details, expanded, {animate:true});
 });
 recheck.addEventListener('click',check);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!closed)check();});
 window.addEventListener('pagehide',()=>{closed=true;clearTimeout(timer);request?.abort();});
 window.addEventListener('pageshow',()=>{if(closed){closed=false;check();}});
 check();
 return {check};
}
