export function setupWorkerConnection(){
 const $=id=>document.getElementById(id),root=$('worker-connection'),recovery=$('worker-recovery'),prompt=$('worker-spawn-prompt'),recheck=$('worker-recheck');
 let request,timer,closed=false;
 const text=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
 function draw(result){
  const connected=result?.connected===true,disconnected=result?.connected===false&&typeof result.recoveryPrompt==='string'&&!!result.recoveryPrompt;
  root.dataset.state=connected?'connected':disconnected?'disconnected':'unknown';
  text('worker-connection-label',connected?'Subagent connected':disconnected?'Subagent disconnected':'Subagent connection unavailable');
  text('worker-connection-detail',connected?'Connected to this Builder session.':'Builder is waiting for a native background subagent.');
  if(!connected&&!disconnected)text('worker-connection-detail','Could not check the subagent connection. Check again when Builder reconnects.');
  if(!disconnected&&recovery.contains(document.activeElement))recheck.focus({preventScroll:true});
  recovery.hidden=!disconnected;
  if(prompt.value!==(disconnected?result.recoveryPrompt:'')){prompt.value=disconnected?result.recoveryPrompt:'';prompt.scrollTop=0;}
  if(!disconnected)text('worker-copy-feedback','');
 }
 async function check(){
  clearTimeout(timer);request?.abort();const current=new AbortController();request=current;recheck.setAttribute('aria-busy','true');
  try{
   const response=await fetch('/api/worker',{cache:'no-store',signal:AbortSignal.any([current.signal,AbortSignal.timeout(4500)])});
   if(!response.ok)throw new Error('Status unavailable.');
   const result=await response.json();if(request===current&&!closed)draw(result);
  }catch{if(request===current&&!closed)draw(null);}
  finally{if(request===current&&!closed){recheck.setAttribute('aria-busy','false');timer=setTimeout(check,document.hidden?10000:3000);}}
 }
 $('worker-copy-prompt').addEventListener('click',async()=>{
  if(recovery.hidden||!prompt.value)return;
  try{await navigator.clipboard.writeText(prompt.value);text('worker-copy-feedback','Prompt copied. Paste it into your agent.');}
  catch{if(!recovery.hidden){prompt.focus();prompt.select();text('worker-copy-feedback','Copy the selected prompt manually.');}}
 });
 recheck.addEventListener('click',check);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!closed)check();});
 window.addEventListener('pagehide',()=>{closed=true;clearTimeout(timer);request?.abort();});
 window.addEventListener('pageshow',()=>{if(closed){closed=false;check();}});
 check();
 return {check};
}
