import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const read=async file=>{try{return JSON.parse(await readFile(file,'utf8'));}catch{return null;}};
// Observation never rewrites setup.json or touches an orphan's action lock. A new attempt
// uses a new directory; stale status readers therefore cannot overwrite its queued state.
export async function observedSetup(output){
 const s=await read(path.join(output,'manager/setup.json'));
 if(s?.runner!=='mcp'||!['queued','running'].includes(s.status)||!/^[0-9a-f-]{36}$/.test(s.jobId||''))return s;
 const dir=path.join(output,'manager/setup-jobs',s.jobId),delivery=await read(path.join(dir,'mcp-delivery.json'));
 if(!Number.isInteger(delivery?.pid)||delivery.pid<=0)return s;
 try{process.kill(delivery.pid,0);return s;}catch(error){if(error.code!=='ESRCH')return s;}
 const marker={format:'ds-create/preparation-interruption@1',jobId:s.jobId,attempt:delivery.attempt,owner:delivery.owner,pid:delivery.pid,updated:new Date().toISOString()};
 const file=path.join(dir,'interruption.json');let evidence;
 try{await writeFile(file,JSON.stringify(marker,null,2)+'\n',{flag:'wx'});evidence=marker;}
 catch(error){if(error.code!=='EEXIST')throw error;evidence=await read(file);}
 const matches=evidence?.jobId===s.jobId&&evidence.attempt===delivery.attempt&&evidence.owner===delivery.owner&&evidence.pid===delivery.pid;
 return {...s,status:'blocked',readyInputHash:null,questions:[],updated:matches?evidence.updated:s.updated,message:'Background connection stopped before preparation finished. Context is saved; retry to continue.'};
}
