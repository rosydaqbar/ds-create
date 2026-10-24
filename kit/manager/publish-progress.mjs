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
// DOM adaptation of BeautifulUI LoadingState, TaskRows and ToolChips.
// Original MIT components: https://github.com/slev12397/beautiful-ui
// See BEAUTIFUL_UI_LICENSE.txt. Demo timers are replaced with real job events.
const check='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const chevron='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const element=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;};
export function renderPublishProgress(root,flow){
 const job=flow.job,complete=flow.figma.complete&&!['running','queued'].includes(job?.status),live=job?.status==='running';
 root.hidden=!job&&!complete&&!flow.figma.reason;if(root.hidden)return;
 const tasks=publishTasks(job,complete),list=root.querySelector('.agentic-task-rows ol'),signature=JSON.stringify([job?.id,job?.status,job?.progress,complete]);
 if(root.dataset.signature!==signature){
  const opened=new Set([...list.querySelectorAll('details[open]')].map(e=>e.dataset.stage));
  root.dataset.signature=signature;list.replaceChildren();
  for(const [index,task]of tasks.entries()){
   const item=element('li');item.dataset.taskStatus=task.state;
   const details=element('details','agentic-task');details.dataset.stage=task.id;details.open=opened.has(task.id);
   const summary=element('summary'),mark=element('span','agentic-task-mark');mark.setAttribute('aria-hidden','true');
   if(task.state==='complete')mark.innerHTML=check;
   else if(task.state==='attention')mark.textContent='!';
   else {mark.textContent=String(index+1);if(task.state==='running')mark.classList.add('is-running');}
   const title=element('span','agentic-task-label',task.title),state=element('span','agentic-task-state',({complete:'Complete',running:'Running',pending:'Waiting',attention:job?.status==='cancelled'?'Stopped':'Blocked'})[task.state]),arrow=element('span','agentic-chevron');arrow.innerHTML=chevron;
   summary.append(mark,title,state,arrow);details.append(summary,element('p','agentic-task-detail',task.description));item.append(details);list.append(item);
  }
  const events=job?.progress?.activity||[],activity=root.querySelector('[data-publish-activity]');
  const openedTools=new Set([...activity.querySelectorAll('details[open]')].map(e=>e.dataset.event));activity.replaceChildren();
  root.querySelector('[data-publish-activity-details]').hidden=!events.length;
  root.querySelector('[data-publish-activity-count]').textContent=`${events.length} ${events.length===1?'update':'updates'}`;
  for(const event of events.slice(-6)){
   const item=element('li'),details=element('details','agentic-tool-row');details.dataset.event=event.time;details.open=openedTools.has(event.time);
   const summary=element('summary'),arrow=element('span','agentic-chevron');arrow.innerHTML=chevron;
   summary.append(arrow,element('span','agentic-tool-label',({access:'Check',variables:'Write',styles:'Style',verification:'Verify'})[event.stage]||'Update'),element('span','agentic-tool-chip',stages.find(s=>s[0]===event.stage)?.[1]||'Foundations'));
   details.append(summary,element('p','agentic-tool-detail',event.message));item.append(details);activity.append(item);
  }
 }
 root.querySelector('[data-publish-steps]').hidden=!job;
 root.querySelector('[data-publish-step-count]').textContent=`${tasks.filter(t=>t.state==='complete').length} of 4 steps complete`;
 const now=Date.parse(job?.finished)||Date.now(),started=Date.parse(job?.started),elapsed=Number.isFinite(started)?Math.max(0,Math.floor((now-started)/1000)):0;
 const age=Math.max(0,(Date.now()-(Date.parse(job?.updated)||started))/1000),quiet=live&&age>=90;
 root.dataset.running=String(live&&!quiet);
 const loader=root.querySelector('[data-publish-loader]');loader.hidden=!live||quiet;
 if(!loader.childElementCount)for(let i=0;i<9;i++){const cell=element('i');cell.style.animationDelay=`${(i%3+Math.abs(Math.floor(i/3)-1))*90}ms`;loader.append(cell);}
 root.querySelector('[data-publish-phase]').textContent=complete?'Published to Figma':quiet?'Waiting for an update':job?.status==='queued'?'Queued for publish':live?({access:'Checking Figma',variables:'Publishing variables',styles:'Publishing styles',verification:'Verifying the result'})[job.progress?.stage]||'Starting publish':job?.status==='cancelled'?'Publish stopped':'Publish needs attention';
 const timer=root.querySelector('[data-publish-elapsed]');timer.hidden=!Number.isFinite(started);timer.textContent=elapsed<60?`${elapsed}s`:`${Math.floor(elapsed/60)}m ${elapsed%60}s`;
 root.dataset.quiet=String(quiet);
}
