import {setupPrompt} from './setup-prompt.mjs';
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { readJSON } from './state.mjs';
import { checkPreparation } from './foundation-proof.mjs';
import { saveSetup, setupQuestions, inputDigest } from './setup-jobs.mjs';

const requestFile=process.argv[2], request=JSON.parse(await readFile(requestFile,'utf8'));
if(request.simulation!==true)throw new Error('AI subprocess workers are disabled in production. Use DS Create MCP.');
const inputSlug=request.inputSlug || request.slug;
const dir=path.dirname(requestFile), parent=process.ppid;
const file=path.join(request.outputDir,'manager/setup.json'), resultFile=path.join(dir,'result.json'), schemaFile=path.join(dir,'result.schema.json');
let agent,stopping=false;
async function save(status,message,questions=[]) {
  const r=await readJSON(file);if(r?.jobId!==request.id) throw new Error('Setup request changed.');
  await saveSetup(file,{...r,status,message,questions,pid:process.pid,...(status==='ready'?{readyInputHash:request.inputHash}:{}),updated:new Date().toISOString()});
}
function kill() {
  if(!agent?.pid)return;
  const pid=agent.pid;
  try{if(process.platform!=='win32')process.kill(-pid,'SIGTERM');else agent.kill('SIGTERM');}catch{}
  setTimeout(()=>{try{if(process.platform!=='win32')process.kill(-pid,'SIGKILL');else agent.kill('SIGKILL');}catch{}},1500).unref();
}
async function stop(status='cancelled',message='Preparation stopped. Your context and files are saved; retry to continue.') {
  if(stopping)return;stopping=true;kill();await save(status,message);setTimeout(()=>process.exit(0),1700);
}
process.on('SIGTERM',()=>{stop().catch(()=>process.exit(1));});process.on('SIGINT',()=>{stop().catch(()=>process.exit(1));});
const watchdog=setInterval(()=>{if(process.ppid!==parent)stop('interrupted','Builder stopped. Restart it and retry preparation.').catch(()=>process.exit(1));},1000);
const timeout=setTimeout(()=>{stop('failed','Preparation reached its time limit. Your input is saved; retry to continue.').catch(()=>process.exit(1));},request.timeoutMs);
try {
  if(await inputDigest(request.workspace,inputSlug)!==request.inputHash)throw new Error('Context files changed. Retry to read the latest input.');
  await save('running','Reading your context and preparing local foundations.');
  await writeFile(schemaFile,JSON.stringify({type:'object',additionalProperties:false,properties:{
    status:{type:'string',enum:['questions','ready','blocked','failed']},message:{type:'string'},
    questions:{type:'array',items:{type:'object',additionalProperties:false,properties:{id:{type:'string'},prompt:{type:'string'},options:{type:'array',items:{type:'string'}}},required:['id','prompt','options']}}
  },required:['status','message','questions']}));
  const prompt=setupPrompt(request,requestFile);
  agent=spawn(request.program,[...request.agentPrefixArgs,'exec','--json','--color','never','--skip-git-repo-check','-s','workspace-write','-c','approval_policy="never"','-C',request.workspace,'--output-schema',schemaFile,'--output-last-message',resultFile,'-'],{cwd:request.workspace,detached:process.platform!=='win32',shell:false,stdio:['pipe','pipe','pipe']});
  let bytes=0,logging=Promise.resolve();
  const log=(name,c)=>{bytes+=c.length;if(bytes>20*1024*1024){stop('failed','Agent output exceeded its limit. Check local job logs and retry.').catch(()=>{});return;}logging=logging.then(()=>appendFile(path.join(dir,name),c)).catch(()=>{});};
  agent.stdout.on('data',c=>log('events.jsonl',c));agent.stderr.on('data',c=>log('stderr.log',c));agent.stdin.on('error',()=>{});agent.stdin.end(prompt);
  const code=await new Promise((resolve,reject)=>{agent.once('error',reject);agent.once('close',resolve);});await logging;
  if(!stopping) {
    if(await inputDigest(request.workspace,inputSlug)!==request.inputHash)throw new Error('Context files changed during preparation. Retry to use the latest input.');
    const r=await readJSON(resultFile), questions=setupQuestions(r?.questions);
    if(code!==0)await save('failed','The local agent failed. Check Codex sign-in and local setup logs, then retry.');
    else if(r?.status==='ready'){
      await appendFile(path.join(dir,'events.jsonl'),JSON.stringify({type:'builder.stage',stage:'validation'})+'\n');
      const check=await checkPreparation(request.outputDir,request.workspace,{inputSlug,inputRevision:request.inputRevision,projectName:request.projectName});
      if(check.valid && check.plan?.systemMode==='new' && check.plan?.motionPolicy!=='basic-ui'){check.valid=false;check.errors.push('New-system preparation must include the basic UI motion policy and Standard/Reduced baseline.');}
      if(check.valid)await save('ready','Foundations are ready to review. Publish to Figma when you approve the saved draft.');
      else await save('failed','Foundation checks failed: '+check.errors.slice(0,5).join(' ').slice(0,1700));
    }
    else if(['questions','blocked'].includes(r?.status) && questions)await save('questions',String(r.message || 'A few details are needed before preparing foundations.').slice(0,2000),questions);
    else await save(r?.status==='blocked'?'blocked':'failed',r?.status==='blocked' && typeof r.message==='string'?r.message.slice(0,2000):'Preparation did not produce a valid saved draft. Your context is saved; retry or inspect the local job result.');
  }
}catch(e){if(!stopping)await save('failed',e.code==='ENOENT'?'Codex or an input file is unavailable. Restore it and retry.':e.message.slice(0,2000));}
finally{if(!stopping){clearInterval(watchdog);clearTimeout(timeout);}}
