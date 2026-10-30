import {interfaceDetailsText, normalizeInterfaceDetails} from '../shared/interface.mjs';
import {appendFile, cp, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {observedSetup, publicMessage, readJSON} from './state.mjs';
import {PublishError, inputFreshness, listRootInputs, localDirectory, projectInputSlug, selectedInputSlug, sessionOutput, snapshotInputs, withJobLock, writeJSON} from './files.mjs';
import {checkPreparation,checkWebDraft} from './verify.mjs';
import {prepareSourcePack} from './sources.mjs';
import {compilePreparation} from './compile.mjs';
import {COMPILER_HASH, validateCoverage} from '../foundations/compiler.mjs';
import {foundationPackFiles, verifyFoundationPack} from '../foundations/pack.mjs';
import {seedFoundationInputs, templateHash} from '../foundations/templates.mjs';
import {fontRoles, latestPublish, validatePublishRequest} from './publish.mjs';
import {setTimeout as delay} from 'node:timers/promises';

export function createSetupJobs({ outputDir, workspace, timeoutMs = 30 * 60 * 1000, simulation = false, runner = 'mcp', preparationVersion = 2 }) {
  if(runner!=='mcp')throw new Error('Preparation uses DS Create MCP.');
  if(preparationVersion!==2&&!simulation)throw new Error('Legacy preparation is restricted to existing saved requests and simulation.');
  const file = path.join(outputDir, 'manager/setup.json'), slug = path.basename(outputDir);
  const readProgress = createSetupProgress();
  let busy = false;
  async function latest(checkQuestions = !busy) {
    let r = await latestMcpPreparation(outputDir);
    if (activeSetup(r) && r.runner!=='mcp') {
      let alive = false;
      if (r.pid) { try { process.kill(r.pid, 0); alive = true; } catch { /* stopped */ } }
      if (!alive) { r = {...r,status:'interrupted',message:'Preparation stopped. Your context and files are saved; retry to continue.'}; await writeJSON(file,r); }
    }
    if(r?.status==='ready'){const freshness=await inputFreshness(outputDir,r);if(!freshness.fresh){r={...r,status:'outdated',message:freshness.message};await writeJSON(file,r);}}
    if(checkQuestions&&r?.status==='questions'&&/^[0-9a-f-]{36}$/.test(r.jobId||'')){
      const request=await readJSON(path.join(outputDir,'manager/setup-jobs',r.jobId,'request.json'));
      if(request?.inputHash){const freshness=await inputFreshness(outputDir,{...r,status:'ready',readyInputHash:request.inputHash});if(!freshness.fresh){r={...r,status:'outdated',questions:[],message:'Context files changed. Prepare foundations again so the current inputs are read before asking questions.'};await writeJSON(file,r);}}
    }
    return r;
  }
  async function status() {
    const [r, ledger, rootInputs] = await Promise.all([latest(), readJSON(path.join(outputDir,'ds-create-ledger.json')), listRootInputs(workspace).then(files=>({files,error:null})).catch(e=>({files:[],error:e.message}))]);
    if (!r) return { enabled:false };
    const pointer=await readJSON(path.join(outputDir,'manager/figma-job.json'));
    const publishing=/^[0-9a-f-]{36}$/.test(pointer?.id||'') && activeSetup(await readJSON(path.join(outputDir,'manager/jobs',pointer.id,'status.json')));
    const progress=/^[0-9a-f-]{36}$/.test(r.jobId || '') ? await readProgress(path.join(outputDir,'manager/setup-jobs',r.jobId)) : null;
    return { enabled:true, simulation, status:r.status, jobId:r.jobId || null, message:r.message || '', context:r.context || '', projectName:r.projectName || ledger?.system || '', projectId:slug,
      files:r.files || [], rootFiles:rootInputs.files, rootFilesError:rootInputs.error, interfaceDetails:r.interfaceDetails||null, fastMode:true, inputRevision:r.inputRevision || 0, revisions:r.revisions || [], resumeCommand:`ds-create init-web --slug ${slug}`, canEdit:!activeSetup(r)&&!publishing, questions:r.questions || [], available:true, inputSlug:selectedInputSlug(r,slug), inputPath:`workspace/input/${selectedInputSlug(r,slug)}/`,
      cancelRequested:!!r.cancelRequested,cancelRequestedAt:r.cancelRequestedAt||null, canRetry:!activeSetup(r) && !['empty','questions','ready'].includes(r.status) && !!r.submitted,
      runner:r.runner||runner, progress, updatedAt:r.updated || null, canStop:activeSetup(r) && r.runner==='mcp' };
  }
  async function guard() {
    const r = await latest(true);
    if (!r) throw new PublishError('This workspace does not use web setup.',404);
    if (activeSetup(r)) throw new PublishError('Preparation is already running.');
    const p = await readJSON(path.join(outputDir,'manager/figma-job.json'));
    if (/^[0-9a-f-]{36}$/.test(p?.id || '') && activeSetup(await readJSON(path.join(outputDir,'manager/jobs',p.id,'status.json')))) throw new PublishError('Wait for the Figma job before changing setup.');
    return r;
  }
  async function launch(r, extra = {}) {
    if (r.preview && !simulation) {
      const blocked = {...r,status:'blocked',questions:[],message:'Preview workspace: preparation is disabled. Start ds-create init-web for your own system.'};
      await writeJSON(file,blocked); return {saved:true,status:'blocked'};
    }
    const id = randomUUID(), dir = await localDirectory(workspace,`workspace/output/${slug}/manager/setup-jobs/${id}`);
    const inputSlug=selectedInputSlug(r,slug),snapshot=await snapshotInputs(workspace,inputSlug),inputFiles=snapshot.files.map(f=>f.path);
    const request = {id,slug,inputSlug,preparationVersion,fastMode:true,interfaceDetails:r.interfaceDetails||null,projectName:r.projectName || null,workspace,outputDir,runner,timeoutMs,simulation,inputFiles,inputHash:snapshot.hash,inputSnapshot:snapshot.files,inputRevision:r.inputRevision || 1,activeFiles:r.files || [],contextFile:r.contextFile,submitted:r.submitted,...extra};
    await writeJSON(path.join(dir,'request.json'),request);
    await initPrepareDelivery(outputDir,id);
    await writeJSON(file,{...r,runner,status:'queued',cancelRequested:false,cancelRequestedAt:null,jobId:id,pid:undefined,readyInputHash:null,questions:[],message:'Your saved context is queued for your agent.'});
    return {saved:true,jobId:id,status:'queued'};
  }
  async function locked(fn) { if(busy) throw new PublishError('Setup is already being saved.');busy=true;try{return await fn();}finally{busy=false;} }
  async function reserveInputs(r,name) {
    if(r.inputSlug || r.submitted)return {inputSlug:selectedInputSlug(r,slug),created:false};
    let inputSlug;
    try{inputSlug=projectInputSlug(name);}catch(e){throw new PublishError(e.message,400);}
    const base=await localDirectory(workspace,'workspace/input'),target=path.join(base,inputSlug);
    // Validate the old selected tree before copying any manually supplied inputs.
    let before;
    try{before=await snapshotInputs(workspace,slug);}catch(e){throw new PublishError(e.message,412);}
    let created=false;
    try{await mkdir(target);created=true;}
    catch(e){
      if(e.code!=='EEXIST')throw e;
      const stat=await lstat(target);
      if(stat.isSymbolicLink() || !stat.isDirectory())throw new PublishError('Input storage must stay inside this workspace.',412);
      if(inputSlug!==slug)throw new PublishError(`Input folder ${inputSlug} already exists. Choose another project name to keep projects separate.`);
    }
    try{
      if(inputSlug!==slug){
        const old=path.join(base,slug),entries=await readdir(old).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
        for(const entry of entries)await cp(path.join(old,entry),path.join(target,entry),{recursive:true,force:false,errorOnExist:true});
        if((await snapshotInputs(workspace,inputSlug)).hash!==before.hash || (await snapshotInputs(workspace,slug)).hash!==before.hash)throw new PublishError('Inputs changed while assigning the project folder. Save the files and retry.');
      }
      return {inputSlug,created,target};
    }catch(e){if(created)await rm(target,{recursive:true,force:true});throw e;}
  }
  async function submit(form,revision=false) { return locked(async()=>{
    const r=await guard();
    if(!revision && r.submitted) throw new PublishError('Context is already saved. Answer the open questions or retry preparation.');
    const entries=[...form.entries()];
    if(entries.some(([key])=>!['projectName','context','files','inputRevision','interfaceDetails'].includes(key)) || form.getAll('context').length!==1) throw new PublishError('Submit the project name, context and context files only.',400);
    if(revision && (!r.submitted || form.getAll('inputRevision').length!==1 || Number(form.get('inputRevision'))!==(r.inputRevision||1)))throw new PublishError('Context changed in another tab. Reopen Context before saving a revision.');
    const projectName=form.get('projectName');
    if(form.getAll('projectName').length!==1 || typeof projectName!=='string' || !projectName.trim() || projectName.trim().length>uploadLimits.projectName || /[\x00-\x1f\x7f]/.test(projectName))throw new PublishError('Enter a project name of 1–100 characters on one line.',400);
    const name=projectName.trim();
    if(!r.inputSlug&&!r.submitted){try{projectInputSlug(name);}catch(e){throw new PublishError(e.message,400);}}
    let context;
    try { context=JSON.parse(form.get('context')); } catch { throw new PublishError('Context text could not be read. Retry this form.',400); }
    let interfaceDetails=r.interfaceDetails||null;
    if(form.has('interfaceDetails')){
      try{if(form.getAll('interfaceDetails').length!==1||typeof form.get('interfaceDetails')!=='string')throw new Error('Submit interface details once.');interfaceDetails=normalizeInterfaceDetails(JSON.parse(form.get('interfaceDetails')));if(!interfaceDetails)throw new Error('Choose your interface details.');}
      catch(e){throw new PublishError(e.message||'Interface details could not be read.',400);}
    }
    const files=form.getAll('files').filter(f=>typeof f!=='string' && f.name);
    let rootFiles;try{rootFiles=await listRootInputs(workspace);}catch(e){throw new PublishError(e.message,412);}
    if(typeof context!=='string' || context.length>uploadLimits.context || !context.trim() && !files.length && !rootFiles.length && !(revision&&r.files?.length)) throw new PublishError('Add context or at least one context file (context limit: 20,000 characters).',400);
    if(form.getAll('files').some(f=>typeof f==='string') || files.length>uploadLimits.files) throw new PublishError('Choose up to 10 files.',400);
    const names=new Set();let bytes=0;
    for(const f of files) {
      if(!f.name || f.name.length>180 || /[\x00-\x1f\x7f/\\]/.test(f.name) || f.name==='.' || f.name==='..' || names.has(f.name)) throw new PublishError('Use distinct filenames without folder paths.',400);
      names.add(f.name);bytes+=f.size;
      if(f.size>uploadLimits.fileBytes || bytes>uploadLimits.totalBytes) throw new PublishError('Use files up to 25 MB each and 50 MB total.',413);
    }
    const reserved=await reserveInputs(r,name),inputSlug=reserved.inputSlug;
    let committed=false;
    try{
      const batch=randomUUID();
      const uploadDir=await localDirectory(workspace,`workspace/input/${inputSlug}/uploads/${batch}`);
      const saved=[];
      for(const f of files) {
        await writeFile(path.join(uploadDir,f.name),Buffer.from(await f.arrayBuffer()),{flag:'wx'});
        saved.push({name:f.name,size:f.size,path:`uploads/${batch}/${f.name}`});
      }
      const chatDir=await localDirectory(workspace,`workspace/input/${inputSlug}/chat`);
      const contextFile=`chat/${new Date().toISOString().slice(0,10)}-${batch}.md`;
      await writeFile(path.join(chatDir,path.basename(contextFile)),`# Context from Builder\n\n## Project name\n${name}\n\n## Context / Instruction\n${context}\n\n${interfaceDetails?'## Interface details (user selections)\n'+interfaceDetailsText(interfaceDetails)+'\n\n':''}Meaning: User-provided context and instructions for local foundation preparation.\nApplies to: this system, init.\n`,{flag:'wx'});
      const now=new Date().toISOString(),inputRevision=(r.inputRevision||0)+1;
      const currentFiles=[...(r.files||[]).filter(f=>!names.has(f.name)),...saved];
      const next={...r,inputSlug,projectName:name,context,interfaceDetails,fastMode:true,files:currentFiles,contextFile,inputRevision,readyInputHash:null,
        revisions:[...(r.revisions||[]),{revision:inputRevision,projectName:name,interfaceDetails,contextFile,files:saved,date:now}],submitted:r.submitted||now,status:'saved'};
      if(revision){
        const ledgerFile=path.join(outputDir,'ds-create-ledger.json'),ledger=await readJSON(ledgerFile);
        if(ledger)await writeJSON(ledgerFile,{...ledger,foundationReview:{status:'pending'},sequence:(ledger.sequence||[]).map(e=>[2,3,4].includes(Number(e.step))?{...e,status:'todo'}:e)});
      }
      await writeJSON(file,next);committed=true;return launch(next);
    }finally{if(!committed && reserved.created)await rm(reserved.target,{recursive:true,force:true});}
  }); }
  async function answer(input) { return locked(async()=>{
    const r=await guard();
    if(!input || Object.keys(input).some(k=>!['jobId','answers'].includes(k)) || input.jobId!==r.jobId || r.status!=='questions') throw new PublishError('These questions changed. Reopen Context and answer the current questions.');
    const qs=setupQuestions(r.questions), a=input.answers;
    if(!qs || !Array.isArray(a) || a.length!==qs.length || new Set(a.map(x=>x?.id)).size!==qs.length || a.some(x=>!x || Object.keys(x).some(k=>!['id','value'].includes(k)) || !qs.some(q=>q.id===x.id) || typeof x.value!=='string' || !x.value.trim() || x.value.length>10000)) throw new PublishError('Answer every question before continuing.',400);
    const chatDir=await localDirectory(workspace,`workspace/input/${selectedInputSlug(r,slug)}/chat`), name=`${new Date().toISOString().slice(0,10)}-${randomUUID()}.md`;
    await writeFile(path.join(chatDir,name),'# Answers from Builder\n\n'+qs.map(q=>`## ${q.prompt}\n${a.find(x=>x.id===q.id).value}\n\nDecided by: user\nApplies to: init.\n`).join('\n'),{flag:'wx'});
    const next={...r,inputRevision:(r.inputRevision||1)+1,readyInputHash:null,answerFiles:[...(r.answerFiles || []),`chat/${name}`]};
    await writeJSON(file,next);return launch(next,{previousJobId:r.jobId,answerFile:`chat/${name}`});
  }); }
  async function retry(input) { return locked(async()=>{
    if(!input || Object.keys(input).length) throw new PublishError('Retry takes no parameters.',400);
    const r=await guard();if(!r.submitted || ['empty','questions','ready'].includes(r.status)) throw new PublishError('Provide context or answer the open questions first.');return launch(r);
  }); }
  // A replacement chosen from the Publish font check becomes a new, user-decided input revision.
  async function fontChoice(input) { return locked(async()=>{
    const r=await guard();
    if(r.status!=='ready')throw new PublishError('Font choices apply to prepared foundations. Finish preparation first.');
    const job=await latestPublish(outputDir);
    if(job?.status!=='needs-fonts')throw new PublishError('Run the Figma font check from Publish first.');
    const roles=(await readJSON(path.join(outputDir,'manager/jobs',job.id,'mcp-delivery.json')))?.preflight?.roles;
    if(!Array.isArray(roles)||!roles.length)throw new PublishError('The font check result is unavailable. Check fonts again.');
    if(!input||Object.keys(input).some(k=>k!=='choices')||!Array.isArray(input.choices)||input.choices.length!==roles.length)throw new PublishError('Choose an option for every font.',400);
    const sections=[];let replaced=0;
    for(const role of roles){
      const c=input.choices.find(x=>x?.role===role.role);
      if(!c||Object.keys(c).some(k=>!['role','family'].includes(k))||typeof c.family!=='string')throw new PublishError('Choose an option for every font.',400);
      if(c.family===role.family){sections.push(`## ${role.label} (font/family/${role.role})\nKeep "${role.family}" (${role.styles.join(', ')}). It must be made available in Figma before publishing.\n`);continue;}
      const option=role.options.find(o=>o.family===c.family);
      if(!option)throw new PublishError('Choose one of the listed fonts.',400);
      replaced++;
      sections.push(`## ${role.label} (font/family/${role.role})\nReplace "${role.family}" (${role.styles.join(', ')}) with "${option.family}". Faces available in Figma: ${option.styles.join(', ')}.\nUse the closest available face for each weight the system uses. The previous faces were not available to Figma's publishing tool.\n`);
    }
    if(!replaced)throw new PublishError('Keeping every font needs no new preparation. Make the fonts available in Figma, then check fonts again.',400);
    const chatDir=await localDirectory(workspace,`workspace/input/${selectedInputSlug(r,slug)}/chat`), name=`${new Date().toISOString().slice(0,10)}-${randomUUID()}.md`;
    await writeFile(path.join(chatDir,name),'# Font choices from Builder\n\n'+sections.join('\n')+'\nDecided by: user (Publish font check)\nApplies to: init, typography.\n',{flag:'wx'});
    const ledgerFile=path.join(outputDir,'ds-create-ledger.json'),ledger=await readJSON(ledgerFile);
    if(ledger)await writeJSON(ledgerFile,{...ledger,foundationReview:{status:'pending'},sequence:(ledger.sequence||[]).map(e=>[2,3,4].includes(Number(e.step))?{...e,status:'todo'}:e)});
    const next={...r,inputRevision:(r.inputRevision||1)+1,readyInputHash:null,answerFiles:[...(r.answerFiles || []),`chat/${name}`]};
    await writeJSON(file,next);return launch(next,{previousJobId:r.jobId,fontChoiceFile:`chat/${name}`});
  }); }
  async function cancel() {
    const r=await latest();if(!activeSetup(r))return {stopped:false};
    return cancelMcpPreparation(outputDir,r.jobId);
  }
  return {status,submit,revise:form=>submit(form,true),answer,retry,fontChoice,cancel};
}

export const uploadLimits = { files: 10, fileBytes: 25 * 1024 * 1024, totalBytes: 50 * 1024 * 1024, context: 20000, projectName: 100 };
export const activeSetup = record => ['queued', 'running'].includes(record?.status);
export function setupQuestions(value) {
  if (!Array.isArray(value) || !value.length || value.length > 12) return null;
  const ids = new Set();
  for (const q of value) {
    if (!q || typeof q.id !== 'string' || !/^[a-z0-9_-]{1,64}$/.test(q.id) || ids.has(q.id) || typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 2000 ||
      !Array.isArray(q.options) || q.options.length > 8 || q.options.some(o => typeof o !== 'string' || !o.trim() || o.length > 300)) return null;
    ids.add(q.id);
  }
  return value.map(({id,prompt,options}) => ({id,prompt,options}));
}

const idOK=v=>typeof v==='string'&&/^[0-9a-f-]{36}$/.test(v);
const digest=v=>createHash('sha256').update(v).digest('hex');
const stateFile=output=>path.join(output,'manager/setup.json');
async function files(output,id){
 if(!idOK(id))throw new Error('Invalid preparation job id.');
 const dir=path.join(output,'manager/setup-jobs',id);if(await realpath(dir)!==dir)throw new Error('Preparation path must not be a symlink.');
 return {dir,requestFile:path.join(dir,'request.json'),deliveryFile:path.join(dir,'mcp-delivery.json')};
}
async function event(dir,value){
 const file=path.join(dir,'events.jsonl'),s=await stat(file).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(s?.size>20*1024*1024)throw new Error('Preparation activity limit reached. Finish or stop this attempt.');
 await appendFile(file,JSON.stringify({...value,date:new Date().toISOString()})+'\n');
}
export async function validatePrepareRequest(output,workspace,id){
 const f=await files(output,id),r=await readJSON(f.requestFile),s=await readJSON(stateFile(output));
 if(r?.id!==id||r.workspace!==workspace||r.outputDir!==output||r.slug!==path.basename(output)||r.runner!=='mcp'||s?.jobId!==id||s.runner!=='mcp')throw new Error('This preparation request does not belong to the current session.');
 if(r.inputSlug!==selectedInputSlug(s,r.slug)||r.inputRevision!==s.inputRevision||r.projectName!==s.projectName)throw new Error('Preparation context identity changed. Prepare the current revision.');
 if(r.inputHash!==(await snapshotInputs(workspace,r.inputSlug)).hash)throw new Error('Context files changed. Prepare the current input before continuing.');
 if(s.preview&&!r.simulation)throw new Error('Sample preparation is disabled outside simulation.');
 return {...f,request:r,state:s};
}
export async function initPrepareDelivery(output,id){const f=await files(output,id);await writeJSON(f.deliveryFile,{attempt:randomUUID(),created:new Date().toISOString()});}
export async function latestMcpPreparation(output){
 return observedSetup(output);
}
export async function claimMcpPreparation({outputDir,workspace,id,owner,lease}){
 const f=await validatePrepareRequest(outputDir,workspace,id);
 if(!idOK(owner)||!idOK(lease))throw new Error('Invalid MCP connection lease.');
 return withJobLock(f.dir,'prepare',async()=>{
  const s=await readJSON(stateFile(outputDir)),d=await readJSON(f.deliveryFile);
  if(s.jobId!==id||!activeSetup(s)||!d||d.cancelRequested)throw new Error('This preparation is not available.');
  if(d.owner){if(d.owner===owner&&d.leaseHash===digest(lease))return {request:f.request,attempt:d.attempt,reused:true};throw new Error('Another MCP connection owns this preparation.');}
  if(s.status!=='queued')throw new Error('This preparation is not queued.');
  await writeJSON(f.deliveryFile,{...d,owner,pid:process.pid,leaseHash:digest(lease),claimedAt:new Date().toISOString()});
  await writeJSON(stateFile(outputDir),{...s,status:'running',message:'Your agent received the saved context.',updated:new Date().toISOString()});
  await event(f.dir,{type:'builder.stage',stage:'context'});
  if(f.request.preparationVersion===2){
   try{const {pack}=await prepareSourcePack(f.request,f.dir);await seedFoundationInputs(f.request,pack,f.dir);}
   catch(error){await writeJSON(stateFile(outputDir),{...s,status:'blocked',message:'Source extraction stopped: '+publicMessage(error.message),updated:new Date().toISOString()});throw error;}
  }
  return {request:f.request,attempt:d.attempt,reused:false};
 });
}
export async function mcpPrepareAction({outputDir,workspace,id,owner,lease,attempt,action,message,stage,outcome,questions=[],coverage}){
 const f=action==='finish'&&['blocked','failed','cancelled'].includes(outcome)?await files(outputDir,id):await validatePrepareRequest(outputDir,workspace,id);
 if(!idOK(owner)||!idOK(lease)||!idOK(attempt))throw new Error('Invalid MCP connection lease.');
 return withJobLock(f.dir,'prepare',async()=>{
  const s=await readJSON(stateFile(outputDir)),d=await readJSON(f.deliveryFile);
  if(s?.runner!=='mcp'||s.jobId!==id||!activeSetup(s)||d?.attempt!==attempt||d.owner!==owner||d.leaseHash!==digest(lease))throw new Error('This MCP client does not own the active preparation.');
  if(action==='progress'){
   if(d.cancelRequested)return {cancelRequested:true};
   if(stage&&!['context','decisions','foundation'].includes(stage))throw new Error('Invalid preparation stage.');
   if(stage)await event(f.dir,{type:'builder.stage',stage});
   await event(f.dir,{type:'builder.update',message:publicMessage(message)});
   await writeJSON(stateFile(outputDir),{...s,message:publicMessage(message),updated:new Date().toISOString()});return {updated:true,cancelRequested:false};
  }
  if(action==='compile'){
   if(d.cancelRequested)throw new Error('Cancellation requested; stop and acknowledge it.');
   if(f.request.preparationVersion!==2)throw new Error('This saved request uses the legacy preparation contract.');
   await event(f.dir,{type:'builder.stage',stage:'foundation'});
   const receipt=await compilePreparation(f.request,f.dir,{assertCurrent:async()=>{
    await validatePrepareRequest(outputDir,workspace,id);
    const latest=await readJSON(f.deliveryFile);if(latest.cancelRequested||latest.attempt!==attempt||latest.owner!==owner||latest.leaseHash!==digest(lease))throw new Error('Preparation was cancelled or its lease changed.');
   }});
   await event(f.dir,{type:'builder.update',message:`Compiled ${receipt.counts.variables} variables and ${receipt.counts.textStyles} text styles. Checking the local review handoff.`});
   return receipt;
  }
  if(action!=='finish'||!['questions','ready','blocked','failed','cancelled'].includes(outcome))throw new Error('Invalid preparation outcome.');
  if(d.cancelRequested&&!['cancelled','blocked'].includes(outcome))throw new Error('Acknowledge cancellation before finishing preparation.');
  let status=outcome,detail=publicMessage(message),qs=[];
  if(outcome==='questions'){
   qs=setupQuestions(questions);if(!qs)throw new Error('Return distinct valid questions or report blocked.');
   if(f.request.preparationVersion===2){validateCoverage(await readJSON(path.join(f.dir,'source-pack.json')),coverage,{allowUnreadable:true});await writeJSON(path.join(f.dir,'coverage.json'),coverage);}
  }
  if(outcome==='ready'){
   if(f.request.preparationVersion===2){
    const receipt=await readJSON(path.join(f.dir,'compile-receipt.json'));
    if(receipt?.inputHash!==f.request.inputHash||receipt.inputRevision!==f.request.inputRevision||receipt.compiler!==COMPILER_HASH)throw new Error('Compile the decision pack through ds_create_prepare_compile before reporting ready.');
    if(digest(await readFile(path.join(outputDir,'foundations.json')))!==receipt.draftHash||digest(JSON.stringify(await readJSON(path.join(f.dir,'decisions.json'))))!==receipt.decisionHash)throw new Error('Compiled draft or decisions changed. Compile the current decisions again.');
    const expected=[...['foundations.json','foundation-plan.json','ds-create-ledger.json','reports/init.md'].map(n=>`workspace/output/${f.request.slug}/${n}`),...['sources.md','answers/01-init.md'].map(n=>`workspace/input/${f.request.inputSlug}/${n}`)];
    if(receipt.foundationPack){if(receipt.foundationPack.templateHash!==templateHash||JSON.stringify([...receipt.foundationPack.files].sort())!==JSON.stringify([...foundationPackFiles].sort()))throw new Error('Foundation templates changed; compile the current bindings again.');expected.push(...foundationPackFiles.map(n=>`workspace/output/${f.request.slug}/${n}`));await verifyFoundationPack(outputDir,await readJSON(path.join(outputDir,'foundations.json')));}
    if(Object.keys(receipt.artifactHashes||{}).length!==expected.length)throw new Error('The compilation artifact receipt is incomplete. Compile again.');
    for(const name of expected)if(digest(await readFile(path.join(workspace,name)))!==receipt.artifactHashes[name])throw new Error('Compiled review artifacts changed. Compile the current decisions again.');
   }
   await event(f.dir,{type:'builder.stage',stage:'validation'});
   const check=await checkPreparation(outputDir,workspace,{inputSlug:s.inputSlug,inputRevision:s.inputRevision,projectName:s.projectName});
   if(check.valid&&check.plan?.systemMode==='new'&&check.plan.motionPolicy!=='basic-ui'){check.valid=false;check.errors.push('New-system preparation requires the basic UI motion policy.');}
   if(!check.valid){status='failed';detail='Foundation checks failed: '+check.errors.slice(0,5).join(' ').slice(0,1700);}
   else detail='Foundations are ready to review. Publish to Figma when you approve the saved draft.';
  }
  const now=new Date().toISOString(),next={...s,status,message:detail,questions:qs,readyInputHash:status==='ready'?f.request.inputHash:null,updated:now};
  await writeJSON(path.join(f.dir,'result.json'),{status,message:detail,questions:qs});await writeJSON(stateFile(outputDir),next);return {status,message:detail};
 });
}
export async function cancelMcpPreparation(output,id){
 const f=await files(output,id);return withJobLock(f.dir,'prepare',async()=>{
  const s=await readJSON(stateFile(output)),d=await readJSON(f.deliveryFile);if(s?.jobId!==id||s.runner!=='mcp'||!activeSetup(s))return {stopped:false};
  const now=new Date().toISOString(),cancelRequestedAt=d?.cancelRequestedAt||now;
  await writeJSON(f.deliveryFile,{...d,cancelRequested:true,cancelRequestedAt});
  if(!d.owner){await writeJSON(stateFile(output),{...s,status:'cancelled',readyInputHash:null,questions:[],updated:new Date().toISOString(),message:'Queued preparation cancelled before your agent received it. Your context is saved.'});return {stopped:true};}
  await writeJSON(stateFile(output),{...s,cancelRequested:true,cancelRequestedAt,updated:now,message:'Cancellation requested. Waiting for your agent to stop safely and acknowledge it.',updated:new Date().toISOString()});return {stopped:false,requested:true};
 });
}

const MAX_LINE = 1024 * 1024, MAX_LOG = 20 * 1024 * 1024;
const iso = ms => new Date(ms).toISOString();
const fileStat = file => stat(file).catch(e => { if (e.code === 'ENOENT') return null; throw e; });

// Only typed public Builder events affect activity; commands and provider logs are ignored.
export function createSetupProgress() {
  let cache, reading = Promise.resolve();
  async function read(dir) {
    const [request, events] = await Promise.all(['request.json', 'events.jsonl'].map(f => fileStat(path.join(dir, f))));
    if (!request) return null;
    if (!cache || cache.dir !== dir || events && (events.ino !== cache.ino || events.size < cache.offset)) {
      cache = {dir,ino:events?.ino,offset:0,pending:Buffer.alloc(0),discard:false,recent:[],phase:'Starting the local agent',stage:'context',activity:[]};
    }
    const activity = (kind,text) => {if(cache.activity.at(-1)?.text!==text)cache.activity=[...cache.activity.slice(-11),{kind,text}];};
    const consume = line => {
      let event;try { event = JSON.parse(line.toString('utf8')); } catch { return; }
      if(event.type==='builder.stage'&&['context','decisions','foundation','validation'].includes(event.stage)){cache.stage=event.stage;cache.phase={context:'Reading product context',decisions:'Resolving design decisions',foundation:'Preparing foundations',validation:'Checking the saved foundation draft'}[event.stage];return;}
      if(event.type==='builder.update'&&typeof event.message==='string'){const message=publicMessage(event.message,800);if(message){activity('message',message);if(cache.recent.at(-1)!==message)cache.recent=[...cache.recent.slice(-3),message];}return;}

    };
    if (events && events.size > cache.offset) {
      cache.ino = events.ino;
      const file = await open(path.join(dir, 'events.jsonl'), 'r');
      try {
        const end = Math.min(events.size, MAX_LOG), chunk = Buffer.alloc(64 * 1024);
        while (cache.offset < end) {
          const {bytesRead} = await file.read(chunk, 0, Math.min(chunk.length, end - cache.offset), cache.offset);
          if (!bytesRead) break;
          cache.offset += bytesRead;
          let data = Buffer.concat([cache.pending, chunk.subarray(0, bytesRead)]), from = 0, newline;
          while ((newline = data.indexOf(10, from)) !== -1) {
            if (!cache.discard && newline - from <= MAX_LINE) consume(data.subarray(from, newline));
            cache.discard = false;from = newline + 1;
          }
          cache.pending = Buffer.from(data.subarray(from));
          if (cache.discard || cache.pending.length > MAX_LINE) { cache.pending = Buffer.alloc(0);cache.discard = true; }
        }
      } finally { await file.close(); }
    }
    return {startedAt:iso(request.mtimeMs),lastActivityAt:iso(events?.mtimeMs || request.mtimeMs),phase:cache.phase,
      stage:cache.stage,activity:[...cache.activity],message:cache.recent.at(-1) || 'Waiting for the local agent to report its progress.',recent:[...cache.recent],connectionIssue:false};
  }
  return dir => {
    const result = reading.then(() => read(dir)).catch(() => null);
    reading = result;return result;
  };
}

// A pending tool call is the receiver. Node waits; returning the tool result resumes
// the caller. No callback, agent executable, vendor API or idle model is involved.
// One receiver serves both Builder events: Prepare foundations and Publish to Figma.

export async function preparationWaitStatus(output){
 const r=await readJSON(path.join(output,'manager/preparation-wait.json'));
 if(!Number.isInteger(r?.pid)||r.pid<=0||r.session!==path.basename(output)||r.mode!=='pending-tool'||!Number.isFinite(r.expiresAt)||r.expiresAt<=Date.now())return null;
 try{process.kill(r.pid,0);}catch(e){if(e.code==='ESRCH')return null;throw e;}
 return {connected:true,transportConnected:true,mode:'pending-tool',capabilities:['prepare','publish'],started:r.started,agentSeenAt:null,reason:null};
}

export const PREPARATION_WAIT_MS=5*60*1000;

// A queued, unclaimed publication with a valid approval, or null.
async function pendingPublish(output,workspace){
 const job=await latestPublish(output);
 if(job?.runner!=='mcp'||job.status!=='queued')return null;
 try{const f=await validatePublishRequest(output,workspace,job.id),delivery=await readJSON(f.deliveryFile);return {...f,job,delivery};}
 catch{return null;}
}

// A Publish click in Builder queues one ds-create build for the agent; it is delivered once per attempt.
async function pendingBuild(output){
 const dir=path.join(output,'manager/build'),requestFile=path.join(dir,'request.json'),request=await readJSON(requestFile);
 return request?.status==='queued'&&request.attempt?{dir,requestFile,request}:null;
}
export async function buildStatus(output){
 const build=await pendingBuild(output);if(!build)return {status:'none'};
 const receipt=await readJSON(path.join(build.dir,'prompt-delivery.json'));
 return {status:receipt?.event_id===build.request.attempt?'delivered':'waiting',attempt:build.request.attempt,created:build.request.created};
}
export async function requestBuild(output){
 const dir=path.join(output,'manager/build'),request={attempt:randomUUID(),status:'queued',created:new Date().toISOString(),command:'ds-create build'};
 await mkdir(dir,{recursive:true});const tmp=path.join(dir,`request.${request.attempt}.tmp`);await writeFile(tmp,JSON.stringify(request,null,2),{mode:0o600});await rename(tmp,path.join(dir,'request.json'));
 return request;
}
export async function waitForPreparation({workspace,session,signal,afterEvent,timeoutMs=PREPARATION_WAIT_MS}){
 signal?.throwIfAborted();
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>PREPARATION_WAIT_MS)throw Error('Builder wait must be between 1 and 300000 milliseconds.');
 const output=await sessionOutput(workspace,session),file=path.join(output,'manager/preparation-wait.json'),instance=randomUUID();
 const saveReceipt=async(f,receipt)=>{const dest=path.join(f.dir,'prompt-delivery.json'),tmp=dest+'.'+instance+'.tmp';await writeFile(tmp,JSON.stringify(receipt),{mode:0o600});await rename(tmp,dest);};
 if(afterEvent){
  const current=await latestMcpPreparation(output),publish=await pendingPublish(output,workspace);
  const prepare=current?.jobId?await validatePrepareRequest(output,workspace,current.jobId).catch(()=>null):null;
  const build=await pendingBuild(output);
  const target=publish?.delivery?.attempt===afterEvent?publish:build?.request.attempt===afterEvent?build:prepare&&(await readJSON(prepare.deliveryFile))?.attempt===afterEvent?prepare:null;
  if(!target)throw Error('The acknowledged event is not the current preparation or publication attempt.');
  await saveReceipt(target,{event_id:afterEvent,status:'accepted',transport:'pending-tool',updated:new Date().toISOString()});
 }
 let lock;
 try{lock=await open(file,'wx',0o600);}catch(e){
  if(e.code!=='EEXIST')throw e;
  const previous=await readFile(file,'utf8');
  if(!await readJSON(file)&&Date.now()-(await stat(file)).mtimeMs<15000)throw Error('This session already has a pending Builder wait.');
  if(await preparationWaitStatus(output))throw Error('This session already has a pending Builder wait.');
  if(await readFile(file,'utf8')!==previous)throw Error('Preparation receiver changed.');
  await unlink(file);lock=await open(file,'wx',0o600);
 }
 const identity={pid:process.pid,instance,session,mode:'pending-tool',started:new Date().toISOString()},deadline=Date.now()+timeoutMs;
 let expired=false;
 let refreshed=Date.now();
 try{
  await lock.writeFile(JSON.stringify({...identity,deadline,expiresAt:Math.min(deadline,Date.now()+15000)}));await lock.close();lock=null;
  for(;;){
   signal?.throwIfAborted();
   if(Date.now()>=deadline){expired=true;return {event:'wait-expired',session,workspace,status:'waiting',message:'The 5-minute wait ended. Resume from Builder when ready. Do not automatically wait again.'};}
   const current=await latestMcpPreparation(output);
   if(current?.runner==='mcp'&&current.status==='queued'){
    const f=await validatePrepareRequest(output,workspace,current.jobId),delivery=await readJSON(f.deliveryFile);
    const receipt=await readJSON(path.join(f.dir,'prompt-delivery.json'));
    if(delivery?.attempt&&!delivery.owner&&!delivery.cancelRequested&&!(receipt?.event_id===delivery.attempt&&receipt.status==='accepted')){
     signal?.throwIfAborted();
     await saveReceipt(f,{event_id:delivery.attempt,status:'handed-off',transport:'pending-tool',updated:new Date().toISOString()});
     return {event:'prepare-request',event_id:delivery.attempt,job_id:current.jobId,session,workspace,request_file:f.requestFile};
    }
   }
   const publish=await pendingPublish(output,workspace);
   if(publish?.delivery?.attempt&&!publish.delivery.owner&&!publish.delivery.cancelRequested){
    const receipt=await readJSON(path.join(publish.dir,'prompt-delivery.json'));
    if(!(receipt?.event_id===publish.delivery.attempt&&receipt.status==='accepted')){
     signal?.throwIfAborted();
     await saveReceipt(publish,{event_id:publish.delivery.attempt,status:'handed-off',transport:'pending-tool',updated:new Date().toISOString()});
     return {event:'publish-request',event_id:publish.delivery.attempt,job_id:publish.job.id,session,workspace,request_file:publish.requestFile};
    }
   }
   const build=await pendingBuild(output);
   if(build&&(await readJSON(path.join(build.dir,'prompt-delivery.json')))?.event_id!==build.request.attempt){
    signal?.throwIfAborted();
    await saveReceipt(build,{event_id:build.request.attempt,status:'handed-off',transport:'pending-tool',updated:new Date().toISOString()});
    return {event:'build-request',event_id:build.request.attempt,session,workspace,request_file:build.requestFile};
   }
   if(Date.now()-refreshed>=5000){
    const saved=await readJSON(file);if(saved?.instance!==instance)throw Error('Builder receiver changed.');
    const tmp=file+'.'+instance+'.tmp';await writeFile(tmp,JSON.stringify({...identity,deadline,expiresAt:Math.min(deadline,Date.now()+15000)}),{mode:0o600});await rename(tmp,file);refreshed=Date.now();
   }
   await delay(Math.min(250,Math.max(1,deadline-Date.now())),undefined,{signal});
  }
 }finally{
  await lock?.close();
  if((await readJSON(file))?.instance===instance){
   if(expired)await writeFile(file,JSON.stringify({...identity,deadline,expiresAt:deadline,expired:true}),{mode:0o600});
   else await unlink(file);
  }
 }
}

export async function preparationHandoffStatus(output){
 const setup=await readJSON(path.join(output,'manager/setup.json'));
 if(setup?.status!=='queued'||!/^[0-9a-f-]{36}$/.test(setup.jobId||''))return null;
 const dir=path.join(output,'manager/setup-jobs',setup.jobId),[receipt,delivery]=await Promise.all([readJSON(path.join(dir,'prompt-delivery.json')),readJSON(path.join(dir,'mcp-delivery.json'))]);
 const age=Date.now()-Date.parse(receipt?.updated);
 if(receipt?.transport!=='pending-tool'||receipt.status!=='handed-off'||receipt.event_id!==delivery?.attempt||delivery?.cancelRequested||delivery?.owner||!(age>=0&&age<15000))return null;
 return {connected:false,transportConnected:true,mode:'tool-handoff',capabilities:['prepare'],deliveryState:'delivered',reason:'Prepare request returned to the agent. Waiting for acknowledgement.'};
}
export async function publishHandoffStatus(output){
 const job=await latestPublish(output);
 if(job?.runner!=='mcp'||job.status!=='queued')return null;
 const dir=path.join(output,'manager/jobs',job.id),[receipt,delivery]=await Promise.all([readJSON(path.join(dir,'prompt-delivery.json')),readJSON(path.join(dir,'mcp-delivery.json'))]);
 const age=Date.now()-Date.parse(receipt?.updated);
 if(receipt?.transport!=='pending-tool'||receipt.status!=='handed-off'||receipt.event_id!==delivery?.attempt||delivery?.cancelRequested||delivery?.owner||!(age>=0&&age<15000))return null;
 return {connected:false,transportConnected:true,mode:'tool-handoff',capabilities:['publish'],deliveryState:'delivered',reason:'Publish request returned to the agent. Waiting for it to claim the job.'};
}

export async function listenerStatus(output,capability='prepare'){
 const pending=await preparationWaitStatus(output)||await (capability==='prepare'?preparationHandoffStatus:publishHandoffStatus)(output);
 if(pending)return pending;
 const prepare=capability==='prepare',record=await readJSON(path.join(output,'manager',prepare?'setup.json':'figma-job.json'));
 const id=prepare?record?.jobId:record?.id;
 if(/^[0-9a-f-]{36}$/.test(id||'')){
  const dir=path.join(output,'manager',prepare?'setup-jobs':'jobs',id);
  const status=prepare?record:await readJSON(path.join(dir,'status.json'));
  if(status?.runner==='mcp'&&status.status==='running'){
   const delivery=await readJSON(path.join(dir,'mcp-delivery.json'));
   if(delivery?.owner&&delivery.leaseHash&&Number.isInteger(delivery.pid)&&delivery.pid>0){
    try{
     process.kill(delivery.pid,0);
     return {connected:true,transportConnected:true,mode:'mcp',capabilities:[capability],started:delivery.claimedAt,agentSeenAt:null,reason:null};
    }catch(error){if(error.code!=='ESRCH')throw error;}
   }
  }
 }
 return {connected:false,transportConnected:false,mode:'mcp',capabilities:[],reason:prepare?'No pending preparation tool call or active MCP preparation.':'No MCP client owns a publication attempt.'};
}
export async function workerConnectionStatus(output,workspace){
 const listener=await listenerStatus(output),session=path.basename(output);
 const setup=await observedSetup(output);
 let preparationState=setup?.status||'empty',preparationMessage=setup?.message||'';
 if(preparationState==='ready'){
  const fresh=await inputFreshness(output,setup),proof=fresh.fresh?await checkWebDraft(output,workspace,setup):null;
  if(!fresh.fresh||!proof.valid){preparationState='outdated';preparationMessage=fresh.message||'The saved foundations need checking. Open Context to prepare them again.';}
 }
 const wait=await readJSON(path.join(output,'manager/preparation-wait.json'));
 const waitExpired=!listener.connected&&wait?.expired===true;
 const recoveryPrompt=listener.connected||listener.deliveryState==='delivered'||!['empty','queued'].includes(preparationState)?null:`Continue preparing foundations from the inputs saved in Builder.\nds-create init-web --slug ${session}\nWorkspace: ${workspace}`;
 return {connected:listener.connected,transportConnected:listener.transportConnected,mode:listener.mode,capabilities:listener.capabilities||[],reason:listener.reason||null,deliveryState:listener.deliveryState||null,lastSeenAt:listener.agentSeenAt||null,preparationState,preparationMessage,waitExpired,recoveryPrompt};
}

export function setupPrompt(request,requestFile){
 const input=`workspace/input/${request.inputSlug||request.slug}/`;
 return `Prepare LOCAL foundations for session ${request.slug} in ${request.workspace}. Mandatory --fast-mode; NO Figma read/write authorization.
Read ${requestFile} and skills/ds-create/reference/${request.preparationVersion===2?'manager-preparation.md (the complete local contract), plus the adjacent source-pack.json, foundation-inputs.json and template-catalog.json':'init.md (local stages only), init-web.md and workflow/MANAGER.md'}.
Inputs: ${input}; outputs: workspace/output/${request.slug}/. read EVERY file in the trusted snapshot before asking missing design questions. Listed ../filename entries are shared files directly in workspace/input/; other parent paths and other systems are outside scope. Inspect flagged originals; never execute or modify supplied sources. Earlier uploads are retained archives when superseded by activeFiles/latest context.
Project name: ${JSON.stringify(request.projectName)}. Interface choices: ${JSON.stringify(request.interfaceDetails||null)}. Preserve these locked choices and frozen values; do not ask a new system to choose naming rules. Use sources for product/font/color choices; ask unresolved questions in Builder unless explicit YOLO permits an inference. YOLO still requires a real product description. New systems include basic Standard/Reduced UI motion and Lucide utility icons.
${request.fontChoiceFile?`The user replaced fonts in Builder's Publish font check (${input}${request.fontChoiceFile}). Start from the previous decisions (workspace/output/${request.slug}/manager/setup-jobs/${request.previousJobId}/decisions.json) and change only the typography families and faces it names; keep every other decision and source.\n`:''}${request.preparationVersion===2?'Fill decisions.json with source coverage and template inputs, then invoke ds_create_prepare_compile. Correct its named errors; do not generate renderer code or hand-write canonical artifacts.':'Save the input-bound foundations.json, foundation-plan.json, answers/sources/report and pending-review ledger required by the local init contract.'}
Use the same MCP lease for progress before reads/writes and finish questions/ready/blocked/failed/cancelled. Revalidation errors or cancellation stop work. Ready requires saved proof and means awaiting review. No dependency installs, approval, Figma, build, repo edits or Builder restart. Keep the owning MCP connection open through finish.`;
}
