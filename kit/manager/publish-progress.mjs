const stages=[
 ['access','Check file and fonts','Verify the selected file and the fonts used by your foundations.'],
 ['variables','Publish variables','Create primitives and semantic tokens with their modes and aliases.'],
 ['styles','Publish styles','Apply the saved typography and effect styles.'],
 ['verification','Verify Figma output','Compare the exported foundations and run the token audit.'],
];
export function publishTasks(job,complete=false){
 const done=new Set(job?.progress?.completed||[]),current=job?.progress?.stage;
 return stages.map(([id,title,description])=>({id,title,description,state:complete?'complete':id===current&&['failed','blocked','cancelled','interrupted'].includes(job?.status)?'attention':id!=='verification'&&done.has(id)?'complete':id===current&&job?.status==='running'?'running':'pending'}));
}
export function publicationLiveness(flow,now=Date.now()){
 const job=flow.job,live=job?.status==='running',stopping=live&&job.cancelRequested;
 const updated=Date.parse(job?.progress?.activity?.at(-1)?.time||job?.updated||job?.started),age=now-updated;
 if(stopping){const cancelAge=now-Date.parse(job.cancelRequestedAt||job.updated||job.started);return {animate:false,phase:'Waiting for cancellation acknowledgement',notice:cancelAge>=60000?'The agent has not acknowledged cancellation. No completed result is confirmed; any in-flight Figma changes must be inspected.':null};}
 if(job?.status==='queued')return {animate:false,phase:flow.listener?.connected?'Queued':'Waiting for a worker',notice:flow.listener?.connected?null:'Waiting for a background agent to connect. Your approved request is saved.'};
 if(live&&age>=90000)return {animate:false,phase:'Waiting for an agent update',notice:`No progress has been reported since ${new Date(updated).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}. The agent has not confirmed a new result.`};
 return {animate:live,phase:({access:'Checking Figma',variables:'Publishing variables',styles:'Publishing styles',verification:'Verifying the result'})[job?.progress?.stage]||'Getting started',notice:null};
}
// Adapted from BeautifulUI IceCreamHarness thread/UserBubble + LoadingState/ToolChips.
// MIT: see BEAUTIFUL_UI_LICENSE.txt. Only actual publication events create turns.
const element=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;};
const views=new WeakMap();
export function renderPublishProgress(root,flow){
 let view=views.get(root);if(!view){view={attempts:new Map(),greeting:null};views.set(root,view);}
 const feed=root.querySelector('[data-publish-messages]'),job=flow.job,complete=flow.figma.complete&&!['running','queued'].includes(job?.status),nearBottom=root.scrollHeight-root.scrollTop-root.clientHeight<72;
 let added=false;
 const append=(className,text,chip)=>{const turn=element('article',className);if(chip)turn.append(element('span','agent-event-chip',chip));turn.append(element('p','',text));feed.append(turn);added=true;return turn;};
 if(!job&&!view.greeting)view.greeting=append('agent-turn agent-assistant','Choose the Figma file below. I’ll check its fonts, publish this saved revision, then verify the result.');
 if(job){
  const key=job.id+':'+job.started;let attempt=view.attempts.get(key);
  if(!attempt){
   view.greeting?.remove();view.greeting=null;
   const turn=append('agent-turn agent-user',`Publish foundations${flow.figma.revision?` · Revision ${flow.figma.revision}`:''} to Figma.`);
   if(flow.figma.url){const file=element('a','agent-file-chip','Figma file');file.href=flow.figma.url;file.target='_blank';file.rel='noopener noreferrer';turn.append(file);}
   attempt={events:new Set(),states:new Set(),outcome:null};view.attempts.set(key,attempt);
  }
  for(const event of job.progress?.activity||[]){
   const id=event.time+':'+event.message;if(attempt.events.has(id))continue;attempt.events.add(id);
   append('agent-turn agent-assistant agent-tool-event',event.message,stages.find(s=>s[0]===event.stage)?.[1]||'Update');
  }
  const statusMessage=publicationLiveness(flow).notice||job.message;
  if(['running','queued'].includes(job.status)&&statusMessage&&!attempt.states.has(statusMessage)&&!(job.progress?.activity||[]).some(e=>e.message===statusMessage)){attempt.states.add(statusMessage);append('agent-turn agent-assistant',statusMessage);}
  if(!['running','queued'].includes(job.status)){
   const message=complete?'Your foundations are published and verified. You can open the Figma file or continue with ds-create build.':job.message||'The publication stopped. Your saved foundations are retained.';
   if(!attempt.outcome){attempt.outcome=append('agent-turn agent-assistant agent-outcome',message);attempt.outcome.dataset.status=complete?'complete':job.status;}
   else if(attempt.outcome.querySelector('p').textContent!==message){attempt.outcome.querySelector('p').textContent=message;attempt.outcome.dataset.status=complete?'complete':job.status;}
  }
 }
 if(flow.notice&&view.notice!==flow.notice)append('agent-turn agent-assistant agent-outcome',flow.notice);view.notice=flow.notice;
 const state=publicationLiveness(flow),started=Date.parse(job?.started),now=Date.parse(job?.finished)||Date.now(),elapsed=Number.isFinite(started)?Math.max(0,Math.floor((now-started)/1000)):0;
 const tail=root.querySelector('.agent-thread-loading');tail.hidden=!['running','queued'].includes(job?.status);root.dataset.running=String(state.animate);
 const loader=root.querySelector('[data-publish-loader]');loader.hidden=!state.animate;
 if(!loader.childElementCount)for(let i=0;i<9;i++){const cell=element('i');cell.style.animationDelay=`${(i%3+Math.abs(Math.floor(i/3)-1))*90}ms`;loader.append(cell);}
 root.querySelector('[data-publish-phase]').textContent=state.phase;
 root.querySelector('[data-publish-elapsed]').textContent=elapsed<60?`${elapsed}s`:`${Math.floor(elapsed/60)}m ${elapsed%60}s`;
 if(added&&nearBottom)root.scrollTop=root.scrollHeight;
}
