import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile, spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {setupFixture} from './fixtures/manager-setup.mjs';
import {HOST_FILE} from '../kit/mcp/host-client.mjs';

const cli=fileURLToPath(new URL('../kit/manager/cli.mjs',import.meta.url));
const run=(f,...args)=>promisify(execFile)(process.execPath,[cli,...args,'--workspace',f.root]);
const tool=async(f,name,args)=>JSON.parse((await run(f,'mcp',name,'--json',JSON.stringify(args))).stdout);
const worker=f=>fetch(f.url+'/api/worker').then(r=>r.json());
async function until(check){for(let i=0;i<200;i++){if(await check())return;await new Promise(r=>setTimeout(r,25));}throw new Error('Condition not reached.');}
async function fixture(t){const f=await setupFixture({autoRun:false,preparationVersion:2});t.after(async()=>{await run(f,'mcp-host','stop').catch(()=>{});await f.cleanup();});return f;}
async function submit(f){const r=await f.post('/api/setup-submit',f.form('A synthetic product for test users.',[['brief.txt','original source']]));assert.equal(r.status,202);}

test('terminal host: CLI wait resumes on Builder submit and the claim keeps one owner across separate CLI calls',async t=>{
 const f=await fixture(t);
 const waiting=tool(f,'ds_create_prepare_wait',{session:'fixture'});
 await until(async()=>(await worker(f)).connected);
 await submit(f);const event=await waiting;
 assert.equal(event.status,'queued');assert.equal(event.next_tool,'ds_create_prepare');
 const claim=await tool(f,'ds_create_prepare',{session:'fixture'});assert.equal(claim.status,'running');assert.equal(claim.job_id,event.job_id);
 const again=await tool(f,'ds_create_prepare',{session:'fixture'});assert.equal(again.lease,claim.lease,'a later CLI call is the same connection');
 const creds={session:'fixture',job_id:claim.job_id,attempt:claim.attempt,lease:claim.lease};
 await tool(f,'ds_create_prepare_progress',{...creds,stage:'context',message:'Reading saved context.'});
 assert.equal((await f.flow()).status,'running');
 await run(f,'mcp-host','stop');
 await until(async()=>(await f.flow()).status==='blocked');
});

test('terminal host: killing the CLI cancels its pending wait; the host stays up and refuses calls without its token',async t=>{
 const f=await fixture(t);
 const child=spawn(process.execPath,[cli,'mcp','ds_create_prepare_wait','--json','{"session":"fixture"}','--workspace',f.root],{stdio:'ignore'});
 await until(async()=>(await worker(f)).connected);
 child.kill('SIGTERM');
 await until(async()=>!(await worker(f)).connected);
 assert.equal((await f.flow()).status,'empty');
 const host=JSON.parse(await readFile(path.join(f.root,HOST_FILE),'utf8'));
 assert.equal((await fetch(host.url+'/call',{method:'POST',body:'{}'})).status,403);
 assert.equal((await fetch(host.url+'/call',{method:'POST',body:'{}',headers:{'x-ds-create-host':host.token,origin:'http://evil.test'}})).status,403);
 assert.equal(JSON.parse((await run(f,'mcp-host','status')).stdout).running,true);
});
