import {readJSON} from './state.mjs';
import path from 'node:path';
export async function listenerStatus(output){
 const r=await readJSON(path.join(output,'manager/listener.json'));
 if(!Number.isInteger(r?.pid)||r.pid<=0)return {connected:false};
 try{process.kill(r.pid,0);return {connected:true,started:r.started};}
 catch(e){if(e.code==='ESRCH')return {connected:false};throw e;}
}
