const stages=[
 ['access','Check Figma file','Confirm the selected file and read its existing foundations.'],
 ['variables','Publish variables','Publish primitives, semantic tokens, modes, and aliases.'],
 ['styles','Publish styles','Save the selected typography and effect styles.'],
 ['verification','Verify output','Compare the saved Figma output with the approved draft.'],
];
export function publishTasks(job,complete=false){
 const done=new Set(job?.progress?.completed||[]),current=job?.progress?.stage,index=stages.findIndex(s=>s[0]===current),terminal=['blocked','failed','interrupted','needs-fonts'].includes(job?.status);
 return stages.map(([id,title,description],i)=>({id,title,description,state:complete?'complete':['queued','outdated'].includes(job?.status)?'pending':id!=='verification'&&done.has(id)?'complete':job?.status==='cancelled'&&id===current?'cancelled':terminal&&i<=index?'attention':id===current&&job?.status==='running'?'running':job?.status==='running'&&i<index?'unconfirmed':'pending'}));
}
export function publicationLiveness(flow,now=Date.now()){
 const job=flow.job,live=job?.status==='running',stopping=live&&job.cancelRequested;
 const updated=Date.parse(job?.progress?.activity?.at(-1)?.time||job?.updated||job?.started),age=now-updated;
 if(stopping){const cancelAge=now-Date.parse(job.cancelRequestedAt||job.updated||job.started);return {animate:false,phase:'Stopping safely',notice:cancelAge>=60000?'The agent has not acknowledged cancellation. In-flight changes have not been confirmed.':null};}
 if(job?.status==='queued')return {animate:false,phase:flow.listener?.connected?'Queued for the agent':flow.listener?.deliveryState==='delivered'?'Delivered to your agent':'Waiting for an agent',notice:flow.listener?.connected||flow.listener?.deliveryState==='delivered'?null:'Your request is saved. Reconnect the background agent to continue.'};
 if(live&&age>=90000)return {animate:false,phase:'Waiting for an agent update',notice:`No progress has been reported since ${new Date(updated).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}. No new result has been confirmed.`};
 return {animate:live,phase:({access:'Checking the Figma file',variables:'Publishing variables',styles:'Publishing styles',verification:'Verifying the output'})[job?.progress?.stage]||'Starting the agent',notice:null};
}
export function publicationPresentation(flow){
 const job=flow.job,active=['queued','running'].includes(job?.status),complete=!!flow.figma?.complete&&!active&&!flow.notice;
 const tasks=publishTasks(flow.notice?{status:'outdated'}:job,complete),confirmed=tasks.filter(t=>t.state==='complete').length,liveness=publicationLiveness(flow);
 let tone='neutral',label='Ready to publish',title='Publish your foundations',message='Choose the Figma file. I’ll publish the saved draft and check the result.';
 if(complete){tone='success';label='Published';title='Your foundations are in Figma';message='All foundation steps are verified. You can continue with components and documentation.';}
 else if(flow.notice||job?.status==='outdated'){tone='warning';label='Review needed';title='Review the current draft';message=flow.notice||'The draft changed after this attempt. Review it before publishing again.';}
 else if(job?.cancelRequested&&active){tone='warning';label='Stopping';title='Waiting for the agent to stop';message='Existing changes are retained. Cancellation is complete only after the agent acknowledges it.';}
 else if(job?.status==='queued'){label='Queued';const delivered=flow.listener?.deliveryState==='delivered';title=flow.listener?.connected?'Your request is queued':delivered?'Your agent received the request':'Waiting for an agent';message=flow.listener?.connected?'The saved revision is ready for the background agent.':delivered?'Waiting for your agent to start the font check.':flow.recoveryPrompt?'No agent is waiting. Copy the continuation prompt below into your agent. Your request and approval are saved.':'Reconnect the background agent. Your request and approval are saved.';}
 else if(job?.status==='needs-fonts'){tone='warning';label='Fonts needed';title='Some fonts aren’t available in Figma';message='The font check ran before any writes, so the file is unchanged. Choose what to do with each font below.';}
 else if(job?.status==='running'){tone=liveness.notice?'warning':'active';label=liveness.notice?'Waiting for update':'Working';title=liveness.phase;message=liveness.notice||stages.find(s=>s[0]===job.progress?.stage)?.[2]||'The agent received your request. Confirmed results will appear here.';}
 else if(['blocked','failed','interrupted'].includes(job?.status)){
  tone=confirmed?'warning':'error';label=confirmed?'Partial result':job.status==='failed'?'Failed':'Needs attention';title=confirmed?'Some foundations are still incomplete':'Publication needs attention';
  message=confirmed?tasks.some(t=>t.id==='variables'&&t.state==='complete')&&tasks.some(t=>t.id==='styles'&&t.state==='attention')?'Variables are published. Styles still need attention.':'Completed steps are saved. Review the incomplete tool results before retrying.':'The agent could not complete this attempt. Open the failed tool to see what happened.';
 }else if(job?.status==='cancelled'){label='Cancelled';title='Publication stopped';message='Any completed work is retained. You can review it before retrying.';}
 return {tone,label,title,message,tasks,confirmed,complete,active};
}
const element=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;};
const glyphs={complete:'<path d="m5 12 4 4L19 6"/>',attention:'<path d="m7 7 10 10M17 7 7 17"/>',pending:'<circle cx="12" cy="12" r="7"/>',running:'<path d="M20 12a8 8 0 1 1-8-8"/>',unconfirmed:'<path d="M12 8v5m0 3h.01"/><path d="M12 3 2 21h20Z"/>',cancelled:'<path d="M8 6v12m8-12v12"/>'};
const marks={complete:'Published',attention:'Incomplete',running:'Working',pending:'Not started',unconfirmed:'Not confirmed',cancelled:'Stopped'};
function icon(state){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.innerHTML=glyphs[state]||glyphs.pending;return s;}
const views=new WeakMap();
// Adapted from BeautifulUI Tool Chips (MIT). Job events supply actual state;
// the gallery's animation timers, task rows and harness layout are not used.
export function renderPublishProgress(root,flow,force=false){
 let view=views.get(root);
 if(!view){view={key:null,signature:'',selected:null,flow};views.set(root,view);
  const close=()=>{const previous=view.selected;view.selected=null;renderPublishProgress(root,view.flow,true);root.querySelector(`[data-agent-tool="${previous}"]`)?.focus({preventScroll:true});};
  root.addEventListener('click',event=>{
   const tool=event.target.closest('[data-agent-tool]');
   if(event.target.closest('[data-agent-close]'))close();
   else if(tool){view.selected=view.selected===tool.dataset.agentTool?null:tool.dataset.agentTool;renderPublishProgress(root,view.flow,true);}
  });
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&view.selected){event.preventDefault();event.stopPropagation();close();}});
 }
 view.flow=flow;
 const job=flow.job,model=publicationPresentation(flow),key=job?job.id+':'+job.started:'draft';
 if(view.key!==key){view.key=key;view.selected=null;}
 const signature=JSON.stringify([model,key,job?.message,job?.progress?.activity,flow.figma?.url,view.selected]);
 if(force||signature!==view.signature){
  view.signature=signature;root.dataset.tone=model.tone;
  const focusedTool=root.contains(document.activeElement)?document.activeElement.closest('[data-agent-tool]')?.dataset.agentTool:null;
  const feed=root.querySelector('[data-publish-messages]');feed.replaceChildren();
  const reply=element('article','agent-assistant');
  reply.append(element('h3',null,model.title),element('p','publish-saved',model.message));feed.append(reply);
  const tools=root.querySelector('[data-publish-tools]');tools.replaceChildren();
  for(const tool of model.tasks.filter(t=>t.state!=='pending')){
   const button=element('button','button agent-tool-chip');button.type='button';button.dataset.agentTool=tool.id;button.dataset.state=tool.state;
   const status=tool.id==='access'&&tool.state==='complete'?'Checked':tool.id==='verification'&&tool.state==='complete'?'Verified':marks[tool.state];
   button.setAttribute('aria-label',`${tool.title}: ${status}`);button.setAttribute('aria-expanded',String(view.selected===tool.id));button.setAttribute('aria-controls','publish-tool-result');
   button.append(icon(tool.state),element('span',null,({access:'Figma file',variables:'Variables',styles:'Styles',verification:'Verification'})[tool.id]),element('span','agent-tool-status',status));tools.append(button);
  }
  if(focusedTool)root.querySelector(`[data-agent-tool="${focusedTool}"]`)?.focus({preventScroll:true});
  const link=root.querySelector('[data-publish-output]');link.hidden=!flow.figma?.url;
  if(flow.figma?.url){link.href=flow.figma.url;root.querySelector('[data-publish-output-name]').textContent=model.complete?'Open published foundations':job?'Open Figma output':'Open selected Figma file';}
  const detail=root.querySelector('[data-publish-detail]'),tool=model.tasks.find(t=>t.id===view.selected);detail.hidden=!tool;
  if(tool){detail.dataset.state=tool.state;root.querySelector('[data-publish-detail-title]').textContent=tool.title;
   const activity=(job?.progress?.activity||[]).filter(e=>e.stage===tool.id).at(-1);
   root.querySelector('[data-publish-detail-message]').textContent=tool.state==='attention'?job?.message||'This operation did not complete. Existing output is retained.':tool.state==='complete'?tool.id==='verification'?'The saved output matches the approved draft.':`${tool.title} completed and confirmed.`:activity?.message||tool.description;
  }
 }
 const live=publicationLiveness(flow),tail=root.querySelector('.agent-thread-loading');tail.hidden=!model.active;root.dataset.running=String(live.animate);
 const loader=root.querySelector('[data-publish-loader]');loader.hidden=!live.animate;
 root.querySelector('[data-publish-phase]').textContent=live.phase;
 const start=Date.parse(job?.started),end=Date.parse(job?.finished)||Date.now(),elapsed=Number.isFinite(start)?Math.max(0,Math.floor((end-start)/1000)):0;
 root.querySelector('[data-publish-elapsed]').textContent=elapsed<60?`${elapsed}s`:`${Math.floor(elapsed/60)}m ${elapsed%60}s`;
}
