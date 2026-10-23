import { revealInteraction } from './ui-motion.mjs';
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const duration = seconds => seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}m ${seconds%60}s`;
const mark = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const stageNames = ['Read context','Resolve design decisions','Prepare foundations','Validate saved draft'];
const descriptions = ['Review the product brief, guidelines, and existing design rules.','Confirm the platform, visual direction, and any missing choices.','Create shared rules for color, type, spacing, shape, elevation, and motion.','Check the saved foundations, aliases, and source-backed decisions.'];
export function preparationTasks(flow) {
  const queued=flow?.runner==='mcp'&&flow?.status==='queued',live=!queued&&['queued','running'].includes(flow?.status),ready=flow?.status==='ready',questions=flow?.status==='questions';
  const current=flow?.progress?.stage||'context',index=questions?1:Math.max(0,['context','decisions','foundation','validation'].indexOf(current));
  return stageNames.map((name,i)=>({name,description:descriptions[i],status:ready?'complete':questions&&i===1?'input':i<index?'review':live&&i===index?'running':!live&&!queued&&flow?.status!=='empty'&&i===index?'paused':'waiting'}));
}
export function preparationView({post,edit,openContext}) {
  const root=document.getElementById('preparation-view');
  root.innerHTML=`<article class="docs-reading-card preparation-card"><header class="docs-page-header"><div class="page-title-row"><h1 id="preparation-title">Prepare foundations</h1><span class="status" id="preparation-status" role="status"></span></div><p>From your product context to a saved foundation draft, ready for your review.</p><p id="preparation-simulation" class="notice" hidden>Simulation · no real agent or Figma calls.</p><button type="button" class="button button-primary" id="preparation-reply">Answer questions</button></header><section class="section preparation-tasks" aria-label="Preparation tasks"><ol id="preparation-tasks"></ol><div class="preparation-current"><div class="preparation-state"><span id="preparation-dots" class="preparation-dots" aria-hidden="true"><i></i><i></i><i></i></span><strong id="preparation-phase"></strong></div><p id="preparation-message" role="status" aria-live="polite"></p><p id="preparation-timing"></p><p id="preparation-note"></p><div class="preparation-actions"><button type="button" class="button" id="preparation-connect">Connect your agent</button><button type="button" class="button" id="preparation-stop">Cancel preparation</button><button type="button" class="button button-primary" id="preparation-retry">Retry preparation</button><button type="button" class="button" id="preparation-edit">Edit context</button><button type="button" class="button button-primary" id="preparation-start">Add context</button><button type="button" class="button button-primary" id="preparation-review">Review foundations</button></div></div></section><section id="preparation-approval" class="section" hidden><div class="section-intro"><h2>Your input is needed</h2><p>Choose a suggestion or write your own answer. Your answers are saved with the project when you continue.</p></div><form id="preparation-answers"><div id="preparation-questions"></div><div class="preparation-actions"><button class="button button-primary" type="submit">Save answers & continue</button><span id="preparation-answer-note">Draft answers stay in this browser tab.</span></div></form></section><section class="section preparation-details"><details id="preparation-activity"><summary>Activity <span id="preparation-activity-count"></span></summary><p>Public agent updates and local actions. Task completion is confirmed by the saved-draft checks.</p><ol id="preparation-updates"></ol><p id="preparation-no-activity">Waiting for the first agent update.</p></details><details id="preparation-context"><summary>Saved context <span id="preparation-file-count"></span></summary><p id="preparation-context-text"></p><ul id="preparation-sources"></ul><p id="preparation-storage"></p></details></section><p id="preparation-error" class="notice error-notice" role="alert" hidden></p><footer class="docs-page-footer"><span>Local preparation</span><span id="preparation-revision"></span></footer></article>`;
  const $=id=>document.getElementById(`preparation-${id}`);
  let flow,history=false,previousStatus,key='',taskKey='',activityKey='',sourceKey='',connected=true;
  const active=()=>['queued','running'].includes(flow?.status);
  function visibility(){
    const overview=!location.hash||location.hash==='#overview';
    const show=!!flow?.enabled&&overview&&(flow.status!=='ready'||history);
    root.hidden=!show;document.getElementById('main').classList.toggle('has-preparation',show);
    const link=document.getElementById('preparation-history-link');if(link)link.hidden=!flow?.enabled||flow.status!=='ready';
  }
  function clock(){
    const p=flow?.progress,live=active();
    if(!p){$('timing').textContent='';$('note').textContent=connected?'':'Connection to Builder lost. Reconnecting automatically.';$('note').hidden=connected;return;}
    const now=live?Date.now():Date.parse(flow.updatedAt||p.lastActivityAt),elapsed=Math.max(0,Math.floor((now-Date.parse(p.startedAt))/1000)),age=Math.max(0,Math.floor((Date.now()-Date.parse(p.lastActivityAt))/1000));
    $('timing').textContent=`${duration(elapsed)} ${live?'elapsed':'in this run'}${live?` · Last activity ${age<2?'just now':duration(age)+' ago'}`:''}`;
    $('note').textContent=!connected?'Connection to Builder lost. Your entries are kept here. Reconnecting automatically.':live&&p.connectionIssue?'The agent reported a connection issue. Waiting for it to reconnect.':live&&age>=90?'No recent activity reported. The agent may still be working. You can stop it and retry.':'';
    $('note').hidden=!$('note').textContent;
  }
  function sync(next,busy=false){
    flow=next;connected=true;if(!flow?.enabled){visibility();return;}
    const queued=flow.runner==='mcp'&&flow.status==='queued',live=active(),ready=flow.status==='ready',questions=flow.status==='questions';
    const label=queued?'Waiting for agent':live?(flow.progress?.connectionIssue?'Connection issue':'Running'):({empty:'Not started',questions:'Needs input',ready:'Ready for review',failed:'Failed',cancelled:'Cancelled',interrupted:'Interrupted',blocked:'Blocked',outdated:'Context changed'}[flow.status]||'Needs attention');
    $('title').textContent=flow.projectName||'Prepare foundations';if($('status').textContent!==label)$('status').textContent=label;$('status').dataset.status=ready?'ready':questions?'review':queued?'pending':live?'generating':flow.status==='empty'?'pending':'error';
    $('phase').textContent=queued?'Waiting for an MCP agent':ready?'Saved draft is ready':questions?'Waiting for your design choices':live?(flow.progress?.phase||'Starting the local agent'):label;
    $('dots').hidden=!live||queued;$('simulation').hidden=!flow.simulation;
    $('reply').hidden=!questions;$('reply').textContent=`Answer ${flow.questions?.length||0} questions`;
    const message=queued?flow.message:live?flow.progress?.message||flow.message:flow.message||'Describe your product and add briefs, guidelines, or existing tokens to begin.';
    if($('message').textContent!==message)$('message').textContent=message;
    const tasks=preparationTasks(flow);
    const tk=JSON.stringify(tasks);if(tk!==taskKey){taskKey=tk;$('tasks').innerHTML=tasks.map((t,i)=>`<li data-task-status="${t.status}"><span class="preparation-task-mark">${t.status==='complete'?mark:t.status==='running'?'<span class="spinner" aria-hidden="true"></span>':`<span>${i+1}</span>`}</span><div><strong>${t.name}</strong><p>${t.description}</p></div><span class="preparation-task-state">${{complete:'Complete',input:'Needs input',review:'Awaiting checks',running:'In progress',paused:'Paused',waiting:'Waiting'}[t.status]}</span></li>`).join('');}
    $('connect').hidden=!flow.integration||ready; $('stop').hidden=!flow.canStop;$('retry').hidden=!flow.canRetry;$('edit').hidden=!flow.canEdit||flow.status==='empty';$('start').hidden=flow.status!=='empty';$('review').hidden=!ready;
    $('answers').setAttribute('aria-busy',String(busy));
    for(const control of root.querySelectorAll('button,textarea'))control.disabled=busy;
    $('approval').hidden=!questions;
    const questionKey=questions?`${flow.projectId}:${flow.jobId}:${JSON.stringify(flow.questions)}`:'';
    if(key!==questionKey){key=questionKey;
      $('questions').innerHTML=questions?flow.questions.map((q,i)=>`<div class="preparation-question"><label class="setup-field" for="preparation-answer-${i}"><span>${escape(q.prompt)}</span><textarea id="preparation-answer-${i}" name="${escape(q.id)}" rows="2" required maxlength="10000" placeholder="Your answer"></textarea></label>${q.options.length?`<div class="preparation-options" role="group" aria-label="Suggestions for ${escape(q.prompt)}">${q.options.map((o,n)=>`<button type="button" class="button" data-answer="${i}" data-option="${n}">${escape(o)}</button>`).join('')}</div>`:''}</div>`).join(''):'';
      if(questions){try{const saved=JSON.parse(sessionStorage.getItem('ds-preparation:'+key)||'{}');flow.questions.forEach((q,i)=>{if(typeof saved[q.id]==='string')document.getElementById(`preparation-answer-${i}`).value=saved[q.id];});}catch{}}
    }
    // Keep in-progress answers, focus, disclosures, and scroll intact on polling.
    for(const button of root.querySelectorAll('[data-answer]'))button.setAttribute('aria-pressed',String(document.getElementById(`preparation-answer-${button.dataset.answer}`).value===flow.questions[button.dataset.answer].options[button.dataset.option]));
    const activity=flow.progress?.activity||flow.progress?.recent?.map(text=>({kind:'message',text}))||[],ak=JSON.stringify(activity);
    if(ak!==activityKey){activityKey=ak;$('updates').innerHTML=activity.map(a=>`<li class="preparation-${a.kind==='tool'?'tool':'update'}">${a.kind==='tool'?`<span class="preparation-tool-chip">${escape(a.text)}</span>`:`<p>${escape(a.text)}</p>`}</li>`).join('');}
    $('activity-count').textContent=activity.length?String(activity.length):'';$('no-activity').hidden=!!activity.length;
    const sk=JSON.stringify([flow.context,flow.files,flow.inputPath]);if(sk!==sourceKey){sourceKey=sk;$('context-text').textContent=flow.context||'Context provided in files.';$('sources').innerHTML=(flow.files||[]).map(f=>`<li><strong>${escape(f.name)}</strong><span>Saved context file</span></li>`).join('');$('storage').textContent=`Saved locally in ${flow.inputPath}`;}
    $('file-count').textContent=flow.files?.length?`${flow.files.length} ${flow.files.length===1?'file':'files'}`:'';$('revision').textContent=`Input revision ${flow.inputRevision}`;
    clock();visibility();
    if(previousStatus&&previousStatus!==flow.status&&!root.hidden){revealInteraction(questions?$('approval'):$('status'),'step');document.getElementById('announcer').textContent=`Preparation: ${label}`;}
    previousStatus=flow.status;
  }
  function saveDraft(){if(!key)return;try{sessionStorage.setItem('ds-preparation:'+key,JSON.stringify(Object.fromEntries(flow.questions.map((q,i)=>[q.id,document.getElementById(`preparation-answer-${i}`).value]))));}catch{}}
  root.addEventListener('input',()=>{saveDraft();for(const b of root.querySelectorAll('[data-answer]'))b.setAttribute('aria-pressed',String(document.getElementById(`preparation-answer-${b.dataset.answer}`).value===flow.questions[b.dataset.answer].options[b.dataset.option]));});
  root.addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(b){const input=document.getElementById(`preparation-answer-${b.dataset.answer}`);input.value=flow.questions[b.dataset.answer].options[b.dataset.option];input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});}});
  $('answers').addEventListener('submit',e=>{e.preventDefault();post('/api/setup-answers',{jobId:flow.jobId,answers:flow.questions.map((q,i)=>({id:q.id,value:document.getElementById(`preparation-answer-${i}`).value}))});});
  $('reply').addEventListener('click',()=>document.getElementById('preparation-answer-0')?.focus());
  $('connect').addEventListener('click',openContext);
  $('stop').addEventListener('click',()=>post('/api/setup-cancel',{}));$('retry').addEventListener('click',()=>post('/api/setup-retry',{}));$('edit').addEventListener('click',edit);$('start').addEventListener('click',openContext);
  $('review').addEventListener('click',()=>{history=false;visibility();document.getElementById('canvas-viewport').focus();});
  document.addEventListener('click',e=>{if(e.target.closest('[data-show-preparation]')){history=true;location.hash='overview';visibility();root.focus();}});
  window.addEventListener('hashchange',visibility);
  return {sync,visibility,reply(){visibility();document.getElementById('preparation-answer-0')?.focus();},error(message){$('error').hidden=!message;$('error').textContent=message||'';},disconnected(){connected=false;clock();}};
}
