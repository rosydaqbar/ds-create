import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {Client} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import {StdioClientTransport} from '../mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import {fileURLToPath} from 'node:url';
import {setupFixture} from './fixtures/manager-setup.mjs';
const json=async file=>JSON.parse(await readFile(file,'utf8'));

test('a killed owner leaving an action lock cannot strand status or retry; live locks remain exclusive',async t=>{
 const f=await setupFixture({runner:'mcp',preparationVersion:2});t.after(()=>f.cleanup());
 const client=new Client({name:'interrupted-client',version:'1'}),transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./ds-create-mcp.mjs',import.meta.url)),'--workspace',f.root]});
 await client.connect(transport);t.after(()=>client.close());
 const form=f.form('A real synthetic product using Inter.');form.set('interfaceDetails',JSON.stringify({modes:['Light','Dark'],devices:['Web']}));assert.equal((await f.post('/api/setup-submit',form)).status,202);
 const claimed=await client.callTool({name:'ds_create_prepare',arguments:{session:'fixture'}});assert.notEqual(claimed.isError,true);const job=claimed.structuredContent,dir=path.join(f.output,'manager/setup-jobs',job.job_id),lock=path.join(dir,'prepare-action.lock');
 await writeFile(lock,'');
 const credentials={session:'fixture',job_id:job.job_id,attempt:job.attempt,lease:job.lease};
 assert.equal((await client.callTool({name:'ds_create_prepare_progress',arguments:{...credentials,message:'Cannot bypass a live action lock.'}})).isError,true);
 assert.equal((await f.flow()).status,'running');
 const setupBefore=await readFile(path.join(f.output,'manager/setup.json'));
 const ownerPid=transport.pid;process.kill(ownerPid,'SIGKILL');
 for(let n=0;n<100;n++){try{process.kill(ownerPid,0);await new Promise(r=>setTimeout(r,20));}catch(e){if(e.code==='ESRCH')break;throw e;}}
 const response=await fetch(f.url+'/api/setup-flow');assert.equal(response.status,200);const flow=await response.json();assert.equal(flow.status,'blocked');assert.equal(flow.canRetry,true);assert.equal(flow.canStop,false);
 const state=await fetch(f.url+'/api/state').then(r=>r.json());assert.equal(state.setup.status,'blocked');assert.equal(state.status,'incomplete');
 assert.deepEqual(await readFile(path.join(f.output,'manager/setup.json')),setupBefore,'observation never rewrites a newer root setup');assert.equal(await readFile(lock,'utf8'),'','orphan lock retained as evidence');
 const evidence=await json(path.join(dir,'interruption.json'));assert.equal(evidence.pid,ownerPid);
 await Promise.all([f.flow(),f.flow(),f.flow()]);assert.deepEqual(await json(path.join(dir,'interruption.json')),evidence,'failure observation does not simulate ongoing activity');
 assert.equal((await f.post('/api/setup-retry',{})).status,202);const retry=await f.flow();assert.equal(retry.status,'queued');assert.notEqual(retry.jobId,job.job_id);assert.equal(retry.context,flow.context);
 await access(path.join(f.output,'manager/setup-jobs',retry.jobId,'request.json'));await assert.rejects(access(path.join(f.output,'manager/setup-jobs',retry.jobId,'prepare-action.lock')));
 const later=await f.flow();assert.equal(later.status,'queued');assert.equal(later.jobId,retry.jobId,'old interruption does not revert a fresh attempt');
});
