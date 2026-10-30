import {PublishError, inputFreshness, selectedInputSlug, snapshotInputs, withJobLock, writeJSON} from './files.mjs';
import {access, mkdir, open, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {compareFoundations} from '../foundations/compare.mjs';
import {checkWebDraft} from './verify.mjs';
import {figmaLink, getPublishStatus, getState, publicMessage, readJSON} from './state.mjs';
import {listenerStatus} from './setup.mjs';

export function targetFile(value) {
  const link = figmaLink(value);
  if (!link) return null;
  const url = new URL(link);
  if (url.username || url.password) return null;
  const match = url.pathname.match(/^\/(?:design|file)\/([A-Za-z0-9_-]+)(?:\/|$)/);
  return match ? { url: url.href, key: match[1] } : null;
}
export function currentFigma(state, hash, target) {
  return state.initDone && state.status !== 'error' && state.summary.variables > 0 && !!targetFile(state.figmaUrl) &&
    (!hash || state.source.hash === hash && state.source.review === 'synced') &&
    (!target || targetFile(state.figmaUrl)?.key === targetFile(target)?.key);
}
export async function verifiedFigma(state, outputDir, hash, target) {
  const report = await readJSON(path.join(outputDir, 'figma/audit-file.json'));
  const [draft,actual]=await Promise.all(['foundations.json','figma/figma-variables.json'].map(f=>readJSON(path.join(outputDir,f))));
  return compareFoundations(draft,actual).match && currentFigma(state, hash, target) && report?.mode === 'file' && report.sourceHash === hash && report.result?.fail === 0;
}
const safeId = id => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id);
const running = job => ['queued', 'running'].includes(job?.status);
export function createFigmaJobs({ outputDir, workspace, timeoutMs = 30 * 60 * 1000, simulation = false, runner = 'mcp', setupGate = async () => null }) {
  if(runner !== 'mcp') throw new Error('Publication uses DS Create MCP.');
  const jobsDir = path.join(outputDir, 'manager/jobs');
  const pointer = path.join(outputDir, 'manager/figma-job.json');
  let busy = false;
  async function latest() {
    const p = await readJSON(pointer);
    if (!safeId(p?.id)) return null;
    const file = path.join(jobsDir, p.id, 'status.json');
    let job = await readJSON(file);
    if(job?.runner==='mcp')return latestPublish(outputDir);
    if (running(job) && job.pid) {
      try { process.kill(job.pid, 0); }
      catch { job = { ...job, status: 'interrupted', message: 'The local agent stopped. Check any partial Figma changes before trying again.' }; await writeJSON(file, job); }
    }
    return job;
  }
  async function status() {
    const [state, job, build] = await Promise.all([getState(outputDir), latest(), getPublishStatus(outputDir)]);
    const complete = currentFigma(state) && (!job || job.hash !== state.source.hash || await verifiedFigma(state, outputDir, job.hash, job.figmaUrl));
    const setup=await readJSON(path.join(outputDir,'manager/setup.json')),fresh=await inputFreshness(outputDir,setup);
    const proof=await checkWebDraft(outputDir,workspace,setup);
    let reason = await setupGate() || (!fresh.fresh?fresh.message:!proof.valid?'Foundation checks failed: '+(proof.errors?.slice(0,2).join(' ')||'Open Context and prepare again.'):null);
    if (reason) { /* local preparation must finish before approval/publication */ }
    else if (state.preview && !simulation) reason = 'Sample data cannot be published. Run ds-create init for your own system first.';
    else if (state.source.kind !== 'local' || !state.source.hash || state.source.review === 'invalid') reason = 'Ask your agent to prepare a valid local foundation draft with ds-create init.';
    let publicJob = job ? { id: job.id, status: job.status, message: job.message, started: job.started, finished: job.finished, updated:job.updated, progress:job.progress, cancelRequested:!!job.cancelRequested, cancelRequestedAt:job.cancelRequestedAt||null } : null;
    if (publicJob?.status === 'needs-fonts') publicJob.fonts = (await readJSON(path.join(jobsDir, job.id, 'mcp-delivery.json')))?.preflight?.roles || [];
    if (publicJob && job.hash !== state.source.hash && !running(job)) publicJob = { ...publicJob, status: 'outdated', fonts: undefined, message: 'The saved draft changed. Publish the current revision before building.' };
    const listener=await listenerStatus(outputDir,'publish'),wait=await readJSON(path.join(outputDir,'manager/preparation-wait.json'));
    // Same continuation as the agent status panel: a queued request nobody is waiting for.
    const recoveryPrompt=job?.status==='queued'&&!listener.connected&&listener.deliveryState!=='delivered'?publishRecoveryPrompt(path.basename(outputDir),workspace):null;
    return { simulation, listener, recoveryPrompt, waitExpired:!!recoveryPrompt&&wait?.expired===true,
      figma: { complete, canStart: !complete && !reason && !running(job) && !busy, reason, revision: state.source.revision || null, hash: state.source.hash || null, url: state.figmaUrl },
      build: { available: complete && !running(job), status: complete ? build.status : 'locked', command: 'ds-create build' }, job: publicJob };
  }
  async function start(input) {
    if (busy) throw new PublishError('A publish request is already being prepared.');
    busy = true;
    try {
      if (!input || typeof input !== 'object' || Object.keys(input).some(k => !['hash', 'figmaUrl'].includes(k))) throw new PublishError('Only the saved draft and Figma target can be submitted.', 400);
      const target = targetFile(input.figmaUrl);
      if (!target) throw new PublishError('Enter an editable Figma design file URL.', 400);
      const state = await getState(outputDir);
      const job = await latest();
      if (running(job)) return { job: { id: job.id, status: job.status }, reused: true };
      if (typeof input.hash !== 'string' || input.hash !== state.source.hash) throw new PublishError('The saved draft changed. Review the current revision and try again.');
      if (currentFigma(state, input.hash, target.url)) return { complete: true, reused: true };
      const gate = await status();
      if (gate.figma.reason) throw new PublishError(gate.figma.reason, 412);
      if (state.foundations.some(f => f.variables.some(v => Object.values(v.resolved).some(r => r.error)))) throw new PublishError('Resolve missing or circular token aliases with your agent before publishing.', 412);
      if(job?.hash === input.hash && targetFile(job.figmaUrl)?.key === target.key && ['blocked','failed','cancelled','interrupted','needs-fonts'].includes(job.status)) {
        try {return await queueMcpJob({outputDir,workspace,id:job.id});}catch(e){throw new PublishError(e.message,412);}
      }
      const slug = path.basename(outputDir), setup=await readJSON(path.join(outputDir,'manager/setup.json')), inputSlug=selectedInputSlug(setup,slug);
      const answersFile = path.join(workspace, 'workspace/input', inputSlug, 'answers/01-init.md');
      try { await access(answersFile); } catch { throw new PublishError('Init answers are missing. Continue ds-create init with your agent first.', 412); }
      if (!['Web', 'App', 'Web and App'].includes(state.product)) throw new PublishError('Settle Web, App, or Web and App through ds-create init first.', 412);
      const id = randomUUID(), dir = path.join(jobsDir, id);
      await mkdir(dir, { recursive: true });
      const request = { id, slug, inputSlug, hash: input.hash, revision: state.source.revision, figmaUrl: target.url, approvedAt: new Date().toISOString(),
        workspace, outputDir, timeoutMs, simulation, inputHash:(await snapshotInputs(workspace,inputSlug)).hash };
      const requestFile = path.join(dir, 'request.json');
      await writeJSON(requestFile, request);
      const ledgerFile = path.join(outputDir, 'ds-create-ledger.json');
      const ledger = await readJSON(ledgerFile);
      if (!ledger || !Array.isArray(ledger.sequence)) throw new PublishError('The init ledger is unavailable. Ask the agent to restore it.', 412);
      if ((await getState(outputDir)).source.hash !== input.hash) throw new PublishError('The saved draft changed before publishing. Review it again.');
      if((await snapshotInputs(workspace,inputSlug)).hash!==request.inputHash)throw new PublishError('Context changed before publishing. Prepare it again.');
      ledger.foundationReview = { status: 'approved', hash: input.hash, approvedBy: 'user', approvedAt: request.approvedAt, approvalSource: path.relative(workspace, requestFile) };
      ledger.figma = { ...ledger.figma, url: target.url };
      // An older generation is not evidence for the newly approved request/target.
      ledger.sequence = ledger.sequence.map(e => [2, 3, 4].includes(Number(e?.step)) ? { ...e, status: 'todo' } : e);
      await writeJSON(ledgerFile, ledger);
      await writeJSON(path.join(dir, 'status.json'), { id, hash: request.hash, figmaUrl: request.figmaUrl, status: 'prepared', started: request.approvedAt, message: 'Approved request saved; preparing MCP publication.' });
      await writeJSON(pointer, { id });
      try { return await queueMcpJob({outputDir,workspace,id}); }
      catch(e) { await writeJSON(path.join(dir,'status.json'),{id,hash:request.hash,figmaUrl:request.figmaUrl,status:'blocked',message:e.message});throw new PublishError(e.message,503); }
    } finally { busy = false; }
  }
  async function cancel() {
    const job = await latest();
    if (!running(job)) return { stopped: false };
    if (!activeMcpJob(job)) throw new PublishError('This saved job uses a retired runner. Inspect its partial output before retrying.');
    return cancelMcpJob({outputDir,workspace,id:job.id});
  }
  return { status, start, cancel };
}

const digest=s=>createHash('sha256').update(s).digest('hex');
export const publishStages=['access','variables','styles','verification'];
export const activeMcpJob=job=>job?.runner==='mcp'&&['queued','running'].includes(job.status);
async function jobFiles(outputDir,id){
 if(!safeId(id))throw new Error('Invalid job id.');
 const dir=path.join(outputDir,'manager/jobs',id);if(await realpath(dir)!==dir)throw new Error('Job path must not be a symlink.');
 return {dir,requestFile:path.join(dir,'request.json'),statusFile:path.join(dir,'status.json'),deliveryFile:path.join(dir,'mcp-delivery.json')};
}
export async function validatePublishRequest(outputDir,workspace,id){
 const files=await jobFiles(outputDir,id),r=await readJSON(files.requestFile),ledger=await readJSON(path.join(outputDir,'ds-create-ledger.json'));
 if(r?.id!==id||r.workspace!==workspace||r.outputDir!==outputDir||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)||path.basename(outputDir)!==r.slug)throw new Error('Request does not belong to this workspace.');
 const approval=ledger?.foundationReview,expected=path.relative(workspace,files.requestFile);
 if(!['approved','synced'].includes(approval?.status)||approval.approvedBy!=='user'||approval.hash!==r.hash||approval.approvalSource!==expected)throw new Error('The saved request does not have the current user approval.');
 const target=new URL(r.figmaUrl),approvedTarget=new URL(ledger.figma?.url||'');
 if(!['www.figma.com','figma.com'].includes(target.hostname)||target.protocol!=='https:'||target.username||target.password||!/^\/(design|file)\/[a-zA-Z0-9_-]+(?:\/|$)/.test(target.pathname)||target.pathname.split('/')[2]!==approvedTarget.pathname.split('/')[2])throw new Error('Approved Figma target differs from this request.');
 const bytes=await readFile(path.join(outputDir,'foundations.json'));if(createHash('sha256').update(bytes).digest('hex')!==r.hash)throw new Error('Draft changed. Review the current revision.');
 if((await snapshotInputs(workspace,r.inputSlug||r.slug)).hash!==r.inputHash)throw new Error('Inputs changed. Prepare them again.');
 const setup=await readJSON(path.join(outputDir,'manager/setup.json'));if(setup&&setup.status!=='ready')throw new Error('Finish local preparation first.');
 const proof=await checkWebDraft(outputDir,workspace,setup);if(!proof.valid)throw new Error('Saved foundation checks failed: '+proof.errors.slice(0,2).join(' '));
 return {...files,request:r};
}

export async function latestPublish(outputDir){
 const p=await readJSON(path.join(outputDir,'manager/figma-job.json'));
 if(!safeId(p?.id))return null;
 const f=await jobFiles(outputDir,p.id);let job=await readJSON(f.statusFile);
 if(job?.runner==='mcp'&&job.status==='running'){
  const d=await readJSON(f.deliveryFile);job={...job,cancelRequested:!!d?.cancelRequested,cancelRequestedAt:d?.cancelRequestedAt||null};let dead=false;
  if(Number.isInteger(d?.pid)&&d.pid>0)try{process.kill(d.pid,0);}catch(e){dead=e.code==='ESRCH';}
  if(dead)job=await withJobLock(f.dir,'publish',async()=>{
   const current=await readJSON(f.statusFile),latest=await readJSON(f.deliveryFile);
   if(current?.runner==='mcp'&&current.status==='running'&&latest?.attempt===d.attempt&&latest.owner===d.owner){
    const blocked={...current,status:'blocked',message:'Background connection stopped before publication finished. Inspect any in-flight or partial Figma output before retrying.',finished:new Date().toISOString()};await writeJSON(f.statusFile,blocked);return blocked;
   }return current;
  });
 }return job;
}
export async function queueMcpJob({outputDir,workspace,id}){
 const f=await validatePublishRequest(outputDir,workspace,id);
 return withJobLock(f.dir,'publish',async()=>{
  const old=await readJSON(f.statusFile);if(activeMcpJob(old))return {job:{id,status:old.status},reused:true};
  if(old?.status==='succeeded')throw new Error('This request already succeeded.');
  if(['queued','running'].includes(old?.status))throw new Error('Stop the earlier publication attempt before switching to MCP.');
  const attempt=randomUUID(),now=new Date().toISOString();
  await writeJSON(f.deliveryFile,{attempt,created:now});
  await writeJSON(f.statusFile,{id,hash:f.request.hash,figmaUrl:f.request.figmaUrl,runner:'mcp',status:'queued',started:now,progress:{completed:[],activity:[]},message:'Your approved foundations are queued for the background worker.'});
  return {job:{id,status:'queued'},attempt,reused:false};
 });
}
export async function claimMcpJob({outputDir,workspace,id,owner,lease,execution='legacy'}){
 const f=await validatePublishRequest(outputDir,workspace,id);
 if(!safeId(owner)||!safeId(lease))throw new Error('Invalid MCP connection lease.');
 return withJobLock(f.dir,'publish',async()=>{
  const job=await readJSON(f.statusFile),d=await readJSON(f.deliveryFile);
  if(!activeMcpJob(job)||!d||d.cancelRequested)throw new Error('This publication is not available.');
  if(d.owner){if(d.owner===owner&&d.leaseHash===digest(lease))return {request:f.request,attempt:d.attempt,reused:true};throw new Error('Another MCP client owns this publication.');}
  if(job.status!=='queued')throw new Error('This publication is not queued.');
  await writeJSON(f.deliveryFile,{...d,owner,pid:process.pid,leaseHash:digest(lease),execution,claimedAt:new Date().toISOString()});
  await writeJSON(f.statusFile,{...job,status:'running',updated:new Date().toISOString(),progress:{completed:[],activity:[]},message:'The background worker received your approved foundations.'});
  return {request:f.request,attempt:d.attempt,reused:false};
 });
}
export async function mcpPublishAction({outputDir,workspace,id,attempt,owner,lease,action,message,outcome,stage,completed_stages,preflight}){
 const f=action==='finish'&&outcome!=='completed'?await jobFiles(outputDir,id):await validatePublishRequest(outputDir,workspace,id);
 if(!safeId(attempt)||!safeId(owner)||!safeId(lease))throw new Error('Invalid MCP connection lease.');
 return withJobLock(f.dir,'publish',async()=>{
  const d=await readJSON(f.deliveryFile),job=await readJSON(f.statusFile);
  if(!activeMcpJob(job)||d?.attempt!==attempt||d.owner!==owner||d.leaseHash!==digest(lease))throw new Error('This MCP client does not own the active attempt.');
  if(action==='preflight'){
   if(d.cancelRequested)return {cancelRequested:true};
   const checked=evaluatePreflight(await readJSON(path.join(outputDir,'foundations.json')),preflight),now=new Date().toISOString();
   await writeJSON(f.deliveryFile,{...d,preflight:{...checked,sourceHash:f.request.hash,observedAt:now}});
   if(!checked.passed){
    const detail=publicMessage('Figma can’t load '+checked.missing.map(f=>f.family+' '+f.style).join(', ')+'. Nothing was written. Make the fonts available in Figma, or choose replacements, then check fonts again.');
    const progress={stage:'access',completed:[],activity:[...(job.progress?.activity||[]),{message:detail,stage:'access',time:now}].slice(-12)};
    await writeJSON(f.statusFile,{...job,progress,status:'needs-fonts',message:detail,updated:now,finished:now});
    return {status:'needs-fonts',passed:false,missing:checked.missing,roles:checked.roles};
   }
   const detail='Fonts and foundation inventory read. Continue with edit-access and frozen-value checks before generation.';
   const progress={stage:'access',completed:[],activity:[...(job.progress?.activity||[]),{message:detail,stage:'access',time:now}].slice(-12)};
   await writeJSON(f.statusFile,{...job,progress,status:'running',message:detail,updated:now});
   return {status:'running',passed:true,missing:[]};
  }
  if(d.execution==='stepped'&&!d.preflight?.passed&&(action==='finish'&&outcome==='completed'||action==='progress'&&(stage&&stage!=='access'||completed_stages?.length)))throw new Error('Execute and submit the read-only Figma preflight before generation.');
  if(action==='progress'){
   if(d.cancelRequested)return {cancelRequested:true};
   if(stage&&!publishStages.includes(stage)||completed_stages?.some(s=>!publishStages.includes(s)))throw new Error('Invalid publication stage.');
   const now=new Date().toISOString(),previous=job.progress||{},completed=[...new Set([...(previous.completed||[]),...(completed_stages||[])])];
   const progress={stage:stage||previous.stage||null,completed,activity:[...(previous.activity||[]),{message:publicMessage(message),stage:stage||previous.stage||null,time:now}].slice(-12)};
   await writeJSON(f.statusFile,{...job,progress,message:publicMessage(message),updated:now});return {updated:true,cancelRequested:false};
  }
  if(action!=='finish'||!['completed','blocked','failed','cancelled'].includes(outcome))throw new Error('Invalid publication outcome.');
  if(d.cancelRequested&&!['cancelled','blocked'].includes(outcome))throw new Error('Acknowledge cancellation before finishing.');
  let status=outcome==='completed'?'succeeded':outcome,detail=publicMessage(message);
  if(outcome==='completed'){
   const state=await getState(outputDir),[draft,actual,audit]=await Promise.all(['foundations.json','figma/figma-variables.json','figma/audit-file.json'].map(n=>readJSON(path.join(outputDir,n))));
   const diff=compareFoundations(draft,actual);await writeJSON(path.join(f.dir,'foundation-diff.json'),{...diff,sourceHash:f.request.hash});
   const targetKey=value=>{try{return new URL(value).pathname.split('/')[2];}catch{return null;}};
   if(state.status==='error'||!state.initDone||state.source.review!=='synced'||state.source.hash!==f.request.hash||state.summary.audit!=='Passed'||targetKey(state.figmaUrl)!==targetKey(f.request.figmaUrl)||!diff.match||audit?.mode!=='file'||audit.sourceHash!==f.request.hash||audit.result?.fail!==0){status='failed';detail='Completion rejected: matching confirmed Figma export and a passing source-bound full file audit are required.';}
  }
  await writeJSON(f.statusFile,{...job,status,message:detail,finished:new Date().toISOString()});return {status};
 });
}
export async function cancelMcpJob({outputDir,id}){
 const f=await jobFiles(outputDir,id);return withJobLock(f.dir,'publish',async()=>{
  const d=await readJSON(f.deliveryFile),job=await readJSON(f.statusFile);if(!activeMcpJob(job))return {stopped:false};
  const now=new Date().toISOString(),cancelRequestedAt=d?.cancelRequestedAt||now;
  await writeJSON(f.deliveryFile,{...d,cancelRequested:true,cancelRequestedAt});
  if(!d.owner){await writeJSON(f.statusFile,{...job,status:'cancelled',message:'Queued request cancelled before the background worker received it.',finished:new Date().toISOString()});return {stopped:true};}
  await writeJSON(f.statusFile,{...job,cancelRequested:true,cancelRequestedAt,updated:now,message:'Cancellation requested. The background worker must stop safely and acknowledge it; existing Figma changes are preserved.'});return {stopped:false,requested:true};
 });
}

// A concrete first operation for the executing agent, derived only from the approved source.
export function requiredFonts(draft){
 return [...new Map((draft.textStyles||[]).map(s=>{
  const font={family:s.fontFamily,style:s.fontStyle??'Regular'};
  if(typeof font.family!=='string'||!font.family||typeof font.style!=='string'||!font.style)throw new Error('Approved text style has no exact font family/style.');
  return [JSON.stringify(font),font];
 })).values()];
}
// Which semantic font role (font/family/{role}) uses each approved family, and with which faces.
export function fontRoles(draft){
 const roles=new Map();
 for(const s of draft.textStyles||[]){
  const role=String(s.bound?.fontFamily||'font/family/ui').split('/').at(-1),font=requiredFonts({textStyles:[s]})[0],key=role+'\n'+font.family;
  if(!roles.has(key))roles.set(key,{role,family:font.family,styles:[]});
  if(!roles.get(key).styles.includes(font.style))roles.get(key).styles.push(font.style);
 }
 return [...roles.values()];
}
export const recommendedFonts=['Inter','Geist','Plus Jakarta Sans'];
const roleLabels={ui:'UI and body text',display:'Display and headings',mono:'Code'};
export function preflightOperation(request,draft){
 const fonts=requiredFonts(draft);
 return {kind:'figma-preflight',readOnly:true,fileKey:new URL(request.figmaUrl).pathname.split('/')[2],sourceHash:request.hash,
  instructions:'Load the applicable Figma tool skill, then execute this read-only code using your existing connected Figma authoring tool on fileKey. Do not regenerate the draft or load generation specs first. Send its actual returned object through ds_create_publish_preflight on the same MCP connection. A tool error must finish blocked with its actual reason. No Figma writes are authorized by this operation. The preflight acknowledgement supplies the next operation or ends the job.',
  code:`const required = ${JSON.stringify(fonts)};
const recommended = ${JSON.stringify(recommendedFonts)};
const [available, collections, textStyles, effectStyles] = await Promise.all([figma.listAvailableFontsAsync(), figma.variables.getLocalVariableCollectionsAsync(), figma.getLocalTextStylesAsync(), figma.getLocalEffectStylesAsync()]);
const families = new Map();
for (const a of available) families.set(a.fontName.family, [...(families.get(a.fontName.family) || []), a.fontName.style]);
const words = s => s.toLowerCase().split(/\\s+/).filter(Boolean);
const option = family => ({family, styles: families.get(family).slice(0, 40)});
const similar = family => { const w = words(family), score = f => words(f).filter(x => w.includes(x)).length; return [...families.keys()].filter(f => f !== family && score(f) >= Math.min(2, w.length)).sort((a, b) => score(b) - score(a) || a.length - b.length).slice(0, 3); };
const missing = [...new Set(required.filter(f => !(families.get(f.family) || []).includes(f.style)).map(f => f.family))];
return {fonts: required.map(f => ({...f, available: (families.get(f.family) || []).includes(f.style)})), inventory: {collections: collections.length, variables: collections.reduce((n,c) => n + c.variableIds.length, 0), textStyles: textStyles.length, effectStyles: effectStyles.length},
  alternatives: missing.map(family => ({family, similar: similar(family).map(option), recommended: recommended.filter(f => f !== family && families.has(f)).map(option)}))};`};
}
const fontOption=o=>o&&typeof o.family==='string'&&o.family.trim()&&o.family.length<=200&&Array.isArray(o.styles)&&o.styles.length&&o.styles.length<=40&&o.styles.every(s=>typeof s==='string'&&s&&s.length<=100);
export function evaluatePreflight(draft,result){
 const expected=requiredFonts(draft),key=f=>JSON.stringify([f.family,f.style]);
 if(!result||!Array.isArray(result.fonts)||result.fonts.length!==expected.length)throw new Error('Return the actual result for every approved font.');
 const seen=new Map();
 for(const font of result.fonts){
  if(typeof font?.available!=='boolean'||seen.has(key(font))||!expected.some(f=>key(f)===key(font)))throw new Error('Preflight font result differs from the approved font set.');
  seen.set(key(font),font.available);
 }
 if(!result.inventory||!['collections','variables','textStyles','effectStyles'].every(k=>Number.isSafeInteger(result.inventory[k])&&result.inventory[k]>=0))throw new Error('Return the actual read-only file inventory.');
 const missing=expected.filter(f=>!seen.get(key(f)));
 const alternatives=result.alternatives===undefined?[]:result.alternatives;
 if(!Array.isArray(alternatives)||alternatives.length>20||alternatives.some(a=>!missing.some(f=>f.family===a?.family)||!['similar','recommended'].every(k=>Array.isArray(a[k])&&a[k].length<=10&&a[k].every(fontOption))))throw new Error('Return the font alternatives exactly as the preflight code produced them.');
 // Figma's publishing runtime can only write text styles whose faces it can load.
 // A missing face stops before any write; the user keeps, uploads or replaces it in Builder.
 const roles=fontRoles(draft).map(r=>({...r,styles:r.styles.filter(s=>missing.some(f=>f.family===r.family&&f.style===s))})).filter(r=>r.styles.length).map(r=>{
  const a=alternatives.find(x=>x.family===r.family),options=[];
  for(const [note,list] of [['closest',a?.similar||[]],['recommended',a?.recommended||[]]])for(const o of list)if(!options.some(x=>x.family===o.family))options.push({family:o.family,styles:o.styles,note});
  return {...r,label:roleLabels[r.role]||r.role,options};
 });
 return {passed:!missing.length,missing,roles,fonts:expected.map(f=>({...f,available:seen.get(key(f))})),inventory:result.inventory};
}
export function publishRecoveryPrompt(slug,workspace){
 return `Publish the approved foundations saved in Builder.\nds-create init-web --slug ${slug}\nWorkspace: ${workspace}`;
}

export function figmaPrompt(request,requestFile,fastPlan){
 return `Publish approved foundations for session ${request.slug} in ${request.workspace}.
Read ${requestFile}, skills/ds-create/reference/${fastPlan?'manager-fast.md':'publish-mcp.md and init.md (approved Figma continuation)'} and the applicable Figma tool skill. Inputs: workspace/input/${request.inputSlug||request.slug}/; outputs: workspace/output/${request.slug}/.
The user already approved revision ${request.revision}, SHA256 ${request.hash}, target ${request.figmaUrl}. Use that existing target and approval. Do not alter foundations.json. Preserve frozen values, names, metadata and exact font identities; every approved face must load in Figma (the stepped preflight checks this first), and actual write failures must be reported. No new client, file, font substitution/installation, components/docs, build, deployment or Builder restart.
${fastPlan?`Verify the compiled plan ${fastPlan.file}, its sourceHash and call hashes. Execute its ${fastPlan.calls.length} calls in order through the existing Figma authoring tool; retain actual results and errors. Do not regenerate the approved data or blindly retry ambiguous writes.`:'Follow the approved publication contract through the existing Figma tools: inventory/access, variables, styles, readback and full-file audit. Preserve partial output; continue independent work when one style fails.'}
Report progress and cancellation through ds_create_publish_progress with the same lease before every write. Export actual output losslessly to figma/figma-variables.json and save the real mode:file audit to figma/audit-file.json with sourceHash ${request.hash}. Matching approved output and a passing audit are required before marking the ledger synced. Finish completed/blocked/failed/cancelled through ds_create_publish_finish; a successful tool return or planned export alone is not completion. Keep the MCP connection open until finishing.`;
}
