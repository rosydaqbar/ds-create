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
export function renderPublishProgress(root,flow){
 const job=flow.job,complete=flow.figma.complete&&!['running','queued'].includes(job?.status);
 root.hidden=!job&&!complete;if(root.hidden)return;
 const list=root.querySelector('ol'),signature=JSON.stringify([job?.id,job?.status,job?.progress,complete]);
 if(root.dataset.signature!==signature){
  root.dataset.signature=signature;list.replaceChildren();
  for(const [index,task]of publishTasks(job,complete).entries()){
   const item=document.createElement('li');item.dataset.taskStatus=task.state;
   const mark=document.createElement('span');mark.className='preparation-task-mark';mark.setAttribute('aria-hidden','true');
   if(task.state==='running'){const spinner=document.createElement('span');spinner.className='spinner';mark.append(spinner);}
   else if(task.state==='complete'){mark.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>';}
   else mark.textContent=String(index+1);
   const body=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p');title.textContent=task.title;description.textContent=task.description;body.append(title,description);
   const state=document.createElement('span');state.className='preparation-task-state';state.textContent=({complete:'Complete',running:'In progress',pending:'Waiting',attention:job?.status==='cancelled'?'Stopped':'Needs attention'})[task.state];item.append(mark,body,state);list.append(item);
  }
  const activity=root.querySelector('[data-publish-activity]'),events=job?.progress?.activity||[];activity.replaceChildren();
  root.querySelector('details').hidden=!events.length;
  for(const event of events.slice(-6)){const item=document.createElement('li'),message=document.createElement('span'),time=document.createElement('time');message.textContent=event.message;time.dateTime=event.time;time.textContent=new Date(event.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});item.append(message,time);activity.append(item);}
 }
 const now=Date.parse(job?.finished)||Date.now(),started=Date.parse(job?.started),elapsed=Number.isFinite(started)?Math.max(0,Math.floor((now-started)/1000)):0;
 root.querySelector('[data-publish-elapsed]').textContent=job?.status==='queued'?'Queued · waiting for background worker':`${elapsed<60?`${elapsed}s`:`${Math.floor(elapsed/60)}m ${elapsed%60}s`} elapsed`;
 root.querySelector('[data-publish-worker]').textContent=flow.listener?.connected?'Background listener connected':job?.status==='queued'?'Background listener disconnected. Your approved draft is saved.':'';
}
