import { preparationView } from './preparation.mjs';
import { openDialog, closeDialog } from './ui-motion.mjs';
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const size = bytes => bytes < 1024 ? `${bytes} B` : bytes < 1024*1024 ? `${Math.ceil(bytes/1024)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;
export function setupWeb({ onChange = () => {} } = {}) {
  const dialog=$('setup-dialog');
  let flow,signature='',pending=[],busy=false,opened=false,returnFocus,editing=false,editRevision,nameHydrated=false,networkFailed=false;
  const preparation=preparationView({post,edit:editContext,openContext:open});
  function files() {
    $('setup-file-list').innerHTML=pending.map((f,i)=>`<li><span>${escape(f.name)}<small>${size(f.size)}</small></span><button class="icon-button" type="button" data-remove-file="${i}" aria-label="Remove ${escape(f.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></li>`).join('');
  }
  function paint() {
    $('setup-open').hidden=!flow?.enabled;
    preparation.sync(flow,busy);
    $('setup-mcp-help').hidden=!flow?.integration;
    if(flow?.integration){const {command,args,agentInstruction}=flow.integration;const config=JSON.stringify({transport:'stdio',command,args},null,2);if($('setup-mcp-config').value!==config)$('setup-mcp-config').value=config;if($('setup-agent-instruction').value!==agentInstruction)$('setup-agent-instruction').value=agentInstruction;}
    if(!flow?.enabled)return;
    if(!nameHydrated){if(!$('setup-project-name').value)$('setup-project-name').value=flow.projectName||'';nameHydrated=true;}
    const initial=flow.status==='empty',ready=flow.status==='ready',questions=flow.status==='questions';
    $('setup-open').textContent=questions?'Answer questions':'Context';
    $('setup-title').textContent=initial?'Set up your design system':'Project context';
    $('setup-description').textContent=initial?'Describe your product and the design system you need. Add any briefs, brand guidelines, or existing tokens.':'Review the saved project context here. Preparation updates and questions are in Overview.';
    $('setup-initial').hidden=!(initial||editing);
    $('setup-edit').hidden=initial||editing||!flow.canEdit;
    $('setup-edit').disabled=busy;
    $('setup-edit-cancel').hidden=!editing;
    $('setup-edit-cancel').disabled=busy;
    $('setup-revision-note').textContent=`Input revision ${flow.inputRevision}. Replacing a filename keeps its original version. Saved answers stay available.`;
    $('setup-resume-project').textContent=flow.projectName||'Not named yet';
    $('setup-saved-project').textContent=flow.projectName||'Not named yet';
    $('setup-resume-command').textContent=flow.resumeCommand||'';
    $('setup-resume').hidden=!flow.resumeCommand;
    if(editing){$('setup-title').textContent='Revise your context';$('setup-description').textContent='Update instructions or add a readable replacement file. Saving starts preparation again; review the new draft before publishing.';}
    $('setup-saved').hidden=initial;
    $('setup-simulation').hidden=!flow.simulation;
    $('setup-state').textContent=flow.message||'';
    $('setup-state').hidden=initial;
    $('setup-storage').textContent=`Saved locally in ${flow.inputPath}`;
    $('setup-saved-context').textContent=flow.context || 'Context provided in files.';
    $('setup-saved-files').innerHTML=(flow.files || []).map(f=>`<li><span>${escape(f.name)}</span><span>${size(f.size)}</span></li>`).join('');
    $('setup-submit').hidden=!(initial||editing);
    $('setup-submit').disabled=busy;
    $('setup-submit').textContent=busy?'Saving context…':editing?'Save & prepare again':flow.available?'Prepare foundations':'Save context';
    $('setup-retry').hidden=!flow.canRetry||editing;
    $('setup-retry').disabled=busy;
    $('setup-stop').hidden=!flow.canStop;
    $('setup-stop').disabled=busy;
    $('setup-review').hidden=!ready||editing;
    $('setup-explore').textContent=ready?'Close':'Back to Overview';
    $('setup-agent-note').hidden=!initial || flow.available;
    if(!opened && initial){
      opened=true;
      let dismissed=false;try{dismissed=sessionStorage.getItem('ds-setup-dismissed')===location.host;}catch{}
      if(!dismissed && !document.querySelector('dialog[open]'))open();
    }
  }
  async function refresh() {
    try {
      const r=await fetch('/api/setup-flow',{cache:'no-store',signal:AbortSignal.timeout(4500)});if(!r.ok)throw new Error();
      if(networkFailed){networkFailed=false;error('');}
      const next=await r.json(),s=JSON.stringify(next),previous=flow?.status;flow=next;
      if(s!==signature){signature=s;paint();onChange();if(dialog.open && previous!==next.status && next.status==='ready')$('setup-review').focus();}
      else preparation.sync(flow,busy);
    }catch{networkFailed=true;preparation.disconnected();if(dialog.open)error('Connection lost. Your entries remain here. Reopen Context when Builder reconnects.');}
  }
  function open(){returnFocus=document.activeElement;openDialog(dialog);dialog.scrollTop=0;}
  function close(){const done=closeDialog(dialog);try{sessionStorage.setItem('ds-setup-dismissed',location.host);}catch{}done.then(closed=>{if(closed)(returnFocus?.isConnected?returnFocus:$('setup-open')).focus({preventScroll:true});});}
  function error(message){preparation.error(message);$('setup-error').hidden=!message;$('setup-error').textContent=message || '';}
  async function post(route,body,upload=false) {
    if(busy)return;busy=true;error('');paint();
    try {
      const r=await fetch(route,{method:'POST',headers:{'X-DS-Create-Token':flow.csrfToken,...(upload?{}:{'Content-Type':'application/json'})},body:upload?body:JSON.stringify(body)});
      const result=await r.json();if(!r.ok)throw new Error(result.error || 'Could not save setup. Retry.');
      if(upload){editing=false;pending=[];files();$('setup-files').value='';}
      await refresh();
      if(upload){close();location.hash='overview';}
    }catch(e){error(e.message);}
    finally{busy=false;paint();}
  }
  function addFiles(chosen){
    const all=[...pending,...chosen];
    if(all.length>10 || all.some(f=>f.size>25*1024*1024) || all.reduce((n,f)=>n+f.size,0)>50*1024*1024){error('Choose up to 10 files, 25 MB each and 50 MB total.');return;}
    if(new Set(all.map(f=>f.name)).size!==all.length){error('Choose files with distinct names.');return;}
    error('');pending=all;files();
  }
  function editContext(){if(!flow?.canEdit)return;if(!dialog.open)open();editing=true;editRevision=flow.inputRevision;$('setup-project-name').value=flow.projectName||'';$('setup-context').value=flow.context||'';error('');paint();$('setup-project-name').focus();}
  for(const [button,field,feedback] of [['setup-mcp-copy','setup-mcp-config','setup-mcp-feedback'],['setup-agent-copy','setup-agent-instruction','setup-agent-feedback']])$(button).addEventListener('click',async()=>{try{await navigator.clipboard.writeText($(field).value);$(feedback).textContent='Copied.';}catch{$(field).focus();$(field).select();$(feedback).textContent='Copy the selected text manually.';}});
  $('setup-edit').addEventListener('click',editContext);
  $('setup-edit-cancel').addEventListener('click',()=>{editing=false;pending=[];files();error('');paint();$('setup-edit').focus();});
  $('setup-copy-resume').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(flow.resumeCommand);$('setup-copy-resume').textContent='Copied';setTimeout(()=>{$('setup-copy-resume').textContent='Copy resume command';},1500);}catch{error('Copy failed. Select the resume command above and copy it.');}});
  $('setup-open').addEventListener('click',async()=>{await refresh();if(flow?.status==='questions'){location.hash='overview';preparation.reply();}else if(!dialog.open)open();});
  $('setup-close').addEventListener('click',close);$('setup-explore').addEventListener('click',()=>{close();location.hash='overview';});$('setup-review').addEventListener('click',()=>{close();location.hash='overview';});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  $('setup-files').addEventListener('change',e=>{addFiles(e.target.files);e.target.value='';});
  $('setup-file-list').addEventListener('click',e=>{const b=e.target.closest('[data-remove-file]');if(b){pending.splice(Number(b.dataset.removeFile),1);files();$('setup-add-files').focus();}});
  $('setup-add-files').addEventListener('click',()=>$('setup-files').click());
  const drop=$('setup-drop');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('is-dragging');});drop.addEventListener('dragleave',()=>drop.classList.remove('is-dragging'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('is-dragging');addFiles(e.dataTransfer.files);});
  $('setup-initial').addEventListener('submit',e=>{
    e.preventDefault();const context=$('setup-context').value,projectName=$('setup-project-name').value.trim();
    if(!projectName || projectName.length>100 || /[\x00-\x1f\x7f]/.test(projectName)){error('Enter a project name of 1–100 characters on one line.');$('setup-project-name').focus();return;}
    if(!context.trim() && !pending.length && !(editing&&flow.files?.length)){error('Describe your product or add a context file to get started.');$('setup-context').focus();return;}
    const form=new FormData();form.set('projectName',projectName);form.set('context',JSON.stringify(context));pending.forEach(f=>form.append('files',f,f.name));if(editing)form.set('inputRevision',String(editRevision));post(editing?'/api/setup-revise':'/api/setup-submit',form,true);
  });
  $('setup-stop').addEventListener('click',()=>post('/api/setup-cancel',{}));$('setup-retry').addEventListener('click',()=>post('/api/setup-retry',{}));
  document.addEventListener('click',e=>{if(e.target.closest('[data-open-setup]')){if(!dialog.open)open();}});
  async function poll(){await refresh();setTimeout(poll,document.hidden?5000:1500);}poll();
  return {refresh,visibility:preparation.visibility};
}
