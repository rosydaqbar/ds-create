import { access, mkdir, writeFile, realpath, lstat, cp, rm, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readJSON } from './state.mjs';
import { PublishError } from './figma-jobs.mjs';
import { snapshotInputs, inputFreshness } from './input-snapshot.mjs';
import { projectInputSlug, selectedInputSlug } from './input-identity.mjs';
import { createSetupProgress } from './setup-progress.mjs';

import {uploadLimits,activeSetup,saveSetup,localDirectory,setupQuestions} from './setup-data.mjs';
export {uploadLimits,activeSetup,saveSetup,localDirectory,setupQuestions,draftReady,inputDigest} from './setup-data.mjs';
import {initPrepareDelivery,latestMcpPreparation,cancelMcpPreparation} from './setup-queue.mjs';
import {mcpConfiguration} from './mcp-config.mjs';
async function executable(program) {
  if(typeof program!=='string'||!program)return null;
  for (const candidate of program.includes(path.sep) ? [program] : (process.env.PATH || '').split(path.delimiter).filter(Boolean).map(p => path.join(p, program))) {
    try { await access(candidate, constants.X_OK); return await realpath(candidate); } catch { /* next */ }
  }
  return null;
}
export function createSetupJobs({ outputDir, workspace, agentCommand, agentPrefixArgs = [], timeoutMs = 30 * 60 * 1000, simulation = false, runner = simulation ? 'cli' : 'mcp' }) {
  if(runner!=='mcp'&&!simulation)throw new Error('Preparation subprocesses are restricted to isolated simulation fixtures.');
  const file = path.join(outputDir, 'manager/setup.json'), slug = path.basename(outputDir);
  const readProgress = createSetupProgress();
  let busy = false, child, childId;
  async function latest() {
    let r = await latestMcpPreparation(outputDir);
    if (activeSetup(r) && r.runner!=='mcp' && r.jobId !== childId) {
      let alive = false;
      if (r.pid) { try { process.kill(r.pid, 0); alive = true; } catch { /* stopped */ } }
      if (!alive) { r = {...r,status:'interrupted',message:'Preparation stopped. Your context and files are saved; retry to continue.'}; await saveSetup(file,r); }
    }
    if(r?.status==='ready'){const freshness=await inputFreshness(outputDir,r);if(!freshness.fresh){r={...r,status:'outdated',message:freshness.message};await saveSetup(file,r);}}
    return r;
  }
  async function status() {
    const [r, program, ledger] = await Promise.all([latest(), runner==='mcp'?true:executable(agentCommand), readJSON(path.join(outputDir,'ds-create-ledger.json'))]);
    if (!r) return { enabled:false };
    const pointer=await readJSON(path.join(outputDir,'manager/figma-job.json'));
    const publishing=/^[0-9a-f-]{36}$/.test(pointer?.id||'') && activeSetup(await readJSON(path.join(outputDir,'manager/jobs',pointer.id,'status.json')));
    const progress=/^[0-9a-f-]{36}$/.test(r.jobId || '') ? await readProgress(path.join(outputDir,'manager/setup-jobs',r.jobId)) : null;
    return { enabled:true, simulation, status:r.status, jobId:r.jobId || null, message:r.message || '', context:r.context || '', projectName:r.projectName || ledger?.system || '', projectId:slug,
      files:r.files || [], inputRevision:r.inputRevision || 0, revisions:r.revisions || [], resumeCommand:`ds-create init-web --slug ${slug}`, canEdit:!activeSetup(r)&&!publishing, questions:r.questions || [], available:!!program, inputSlug:selectedInputSlug(r,slug), inputPath:`workspace/input/${selectedInputSlug(r,slug)}/`,
      cancelRequested:!!r.cancelRequested,cancelRequestedAt:r.cancelRequestedAt||null, canRetry:!activeSetup(r) && !['empty','questions','ready'].includes(r.status) && !!r.submitted,
      integration:runner==='mcp'?mcpConfiguration(workspace,slug,'prepare'):null, runner:r.runner||runner, progress, updatedAt:r.updated || null, canStop:activeSetup(r) && (r.runner==='mcp'||!!child && childId === r.jobId) };
  }
  async function guard() {
    const r = await latest();
    if (!r) throw new PublishError('This workspace does not use web setup.',404);
    if (activeSetup(r)) throw new PublishError('Preparation is already running.');
    const p = await readJSON(path.join(outputDir,'manager/figma-job.json'));
    if (/^[0-9a-f-]{36}$/.test(p?.id || '') && activeSetup(await readJSON(path.join(outputDir,'manager/jobs',p.id,'status.json')))) throw new PublishError('Wait for the Figma job before changing setup.');
    return r;
  }
  async function launch(r, extra = {}) {
    const program = runner==='mcp'?true:await executable(agentCommand);
    if (!program || r.preview && !simulation) {
      const blocked = {...r,status:'blocked',questions:[],message:!program ? 'Simulation runner is unavailable. Configure the test executable before retrying.' : 'Preview workspace: preparation is disabled. Start ds-create init-web for your own system.'};
      await saveSetup(file,blocked); return {saved:true,status:'blocked'};
    }
    const id = randomUUID(), dir = await localDirectory(workspace,`workspace/output/${slug}/manager/setup-jobs/${id}`);
    const inputSlug=selectedInputSlug(r,slug),snapshot=await snapshotInputs(workspace,inputSlug),inputFiles=snapshot.files.map(f=>f.path);
    const request = {id,slug,inputSlug,projectName:r.projectName || null,workspace,outputDir,runner,program:runner==='mcp'?null:program,agentPrefixArgs,timeoutMs,simulation,inputFiles,inputHash:snapshot.hash,inputSnapshot:snapshot.files,inputRevision:r.inputRevision || 1,activeFiles:r.files || [],contextFile:r.contextFile,submitted:r.submitted,...extra};
    await saveSetup(path.join(dir,'request.json'),request);
    if(runner==='mcp')await initPrepareDelivery(outputDir,id);
    await saveSetup(file,{...r,runner,status:'queued',cancelRequested:false,cancelRequestedAt:null,jobId:id,pid:undefined,readyInputHash:null,questions:[],message:runner==='mcp'?'Your saved context is queued for the background worker.':'Starting the local agent…'});
    if(runner==='mcp')return {saved:true,jobId:id,status:'queued'};
    childId=id;
    child=spawn(process.execPath,[fileURLToPath(new URL('./setup-worker.mjs',import.meta.url)),path.join(dir,'request.json')],{cwd:workspace,stdio:'ignore',shell:false});
    const launched=child;
    try { await new Promise((resolve,reject)=>{launched.once('spawn',resolve);launched.once('error',reject);}); }
    catch { await saveSetup(file,{...r,status:'failed',jobId:id,message:'Could not start preparation. Your input is saved; retry.'});child=null;childId=null;throw new PublishError('Could not start the local agent.',503); }
    const queued=await readJSON(file);
    if(queued?.status==='queued' && queued.jobId===id) await saveSetup(file,{...queued,pid:launched.pid});
    launched.once('exit',()=>{if(child===launched){child=null;childId=null;}});
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
    if(entries.some(([key])=>!['projectName','context','files','inputRevision'].includes(key)) || form.getAll('context').length!==1) throw new PublishError('Submit the project name, context and context files only.',400);
    if(revision && (!r.submitted || form.getAll('inputRevision').length!==1 || Number(form.get('inputRevision'))!==(r.inputRevision||1)))throw new PublishError('Context changed in another tab. Reopen Context before saving a revision.');
    const projectName=form.get('projectName');
    if(form.getAll('projectName').length!==1 || typeof projectName!=='string' || !projectName.trim() || projectName.trim().length>uploadLimits.projectName || /[\x00-\x1f\x7f]/.test(projectName))throw new PublishError('Enter a project name of 1–100 characters on one line.',400);
    const name=projectName.trim();
    let context;
    try { context=JSON.parse(form.get('context')); } catch { throw new PublishError('Context text could not be read. Retry this form.',400); }
    const files=form.getAll('files').filter(f=>typeof f!=='string' && f.name);
    if(typeof context!=='string' || context.length>uploadLimits.context || !context.trim() && !files.length && !(revision&&r.files?.length)) throw new PublishError('Add context or at least one context file (context limit: 20,000 characters).',400);
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
      await writeFile(path.join(chatDir,path.basename(contextFile)),`# Context from Builder\n\n## Project name\n${name}\n\n## Context / Instruction\n${context}\n\nMeaning: User-provided context and instructions for local foundation preparation.\nApplies to: this system, init.\n`,{flag:'wx'});
      const now=new Date().toISOString(),inputRevision=(r.inputRevision||0)+1;
      const currentFiles=[...(r.files||[]).filter(f=>!names.has(f.name)),...saved];
      const next={...r,inputSlug,projectName:name,context,files:currentFiles,contextFile,inputRevision,readyInputHash:null,
        revisions:[...(r.revisions||[]),{revision:inputRevision,projectName:name,contextFile,files:saved,date:now}],submitted:r.submitted||now,status:'saved'};
      if(revision){
        const ledgerFile=path.join(outputDir,'ds-create-ledger.json'),ledger=await readJSON(ledgerFile);
        if(ledger)await saveSetup(ledgerFile,{...ledger,foundationReview:{status:'pending'},sequence:(ledger.sequence||[]).map(e=>[2,3,4].includes(Number(e.step))?{...e,status:'todo'}:e)});
      }
      await saveSetup(file,next);committed=true;return launch(next);
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
    await saveSetup(file,next);return launch(next,{previousJobId:r.jobId,answerFile:`chat/${name}`});
  }); }
  async function retry(input) { return locked(async()=>{
    if(!input || Object.keys(input).length) throw new PublishError('Retry takes no parameters.',400);
    const r=await guard();if(!r.submitted || ['empty','questions','ready'].includes(r.status)) throw new PublishError('Provide context or answer the open questions first.');return launch(r);
  }); }
  async function cancel() {
    const r=await latest();if(!activeSetup(r))return {stopped:false};
    if(r.runner==='mcp')return cancelMcpPreparation(outputDir,r.jobId);
    if(!child || r.jobId!==childId)throw new PublishError('Preparation belongs to an earlier Builder process. Wait for it to stop.');
    const proc=child;proc.kill('SIGTERM');await new Promise(resolve=>{proc.once('exit',resolve);setTimeout(resolve,3000).unref();});return {stopped:true};
  }
  async function shutdown(){const r=await latest();if(r?.runner!=='mcp')return cancel();}
  return {status,submit,revise:form=>submit(form,true),answer,retry,cancel,shutdown};
}
