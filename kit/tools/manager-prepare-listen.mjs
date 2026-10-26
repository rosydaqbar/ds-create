#!/usr/bin/env node
// Portable local Node daemon + authenticated JSON control. Never launches an AI/IDE CLI.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {readFile,writeFile,open,unlink,realpath,rename} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createPreparationListener} from '../manager/preparation-listener.mjs';
const args=process.argv.slice(2),command=args[0],get=k=>args.includes(k)?args[args.indexOf(k)+1]:undefined;
const root=path.resolve(get('--workspace')||fileURLToPath(new URL('../../',import.meta.url))),session=get('--slug');
const usage='Use start|status|next|claim|progress|compile|finish|stop --workspace /absolute/workspace --slug saved-session. Claim: --event UUID --consumer UUID. Progress/finish: --data-file JSON. Start: optional --notify-url http://127.0.0.1:port/host-hook.';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const json=async file=>JSON.parse(await readFile(file,'utf8'));
function callback(value){
 if(!value)return null;
 const url=new URL(value);
 if(url.protocol!=='http:'||!['127.0.0.1','[::1]','localhost'].includes(url.hostname)||url.username||url.password||url.hash)throw new Error('Host notification URL must be local HTTP without embedded credentials.');
 return async event=>{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(event),redirect:'error',signal:AbortSignal.timeout(4000)});if(!r.ok)throw new Error('Host delivery failed.');return r.json();};
}
async function main(){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(session||''))throw new Error(usage);
 const workspace=await realpath(root),dir=path.join(workspace,'workspace/output',session,'manager');
 if(await realpath(dir)!==dir)throw new Error('Listener path must stay inside this workspace.');
 const control=path.join(dir,'preparation-control.json');
 const request=async data=>{const r=await json(control);if(!Number.isInteger(r.pid)||r.pid<=0||!/^http:\/\/127\.0\.0\.1:\d+$/.test(r.url))throw new Error('Invalid listener identity.');
  const response=await fetch(r.url,{method:'POST',headers:{authorization:'Bearer '+r.token,'content-type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(data.action==='compile'?120000:15000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Listener command failed.');if(data.action==='status'&&result.instance!==r.instance)throw new Error('Listener identity changed.');return result;
 };
 if(command==='serve'){
  const notify=callback(get('--notify-url')),listener=await createPreparationListener({workspace,session,onPrompt:notify}),token=randomBytes(32).toString('hex');
  const server=http.createServer(async(req,res)=>{
   res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
   if(req.method!=='POST'||req.url!=='/'||req.headers.origin||req.headers.authorization!=='Bearer '+token){res.writeHead(403);res.end(JSON.stringify({error:'Forbidden'}));return;}
   try{
    const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>2*1024*1024)throw new Error('Command too large.');chunks.push(chunk);}
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Use a JSON command.');
    if(data.action==='stop'){res.end(JSON.stringify({stopped:true}));setImmediate(()=>{void close();});return;}
    res.end(JSON.stringify(await listener.act(data)));
   }catch(error){res.writeHead(409);res.end(JSON.stringify({error:error.message}));}
  });
  let closing=false;
  async function close(){if(closing)return;closing=true;await listener.close();await new Promise(resolve=>server.close(resolve));const saved=await json(control).catch(()=>null);if(saved?.instance===listener.instance)await unlink(control);}
  process.once('SIGTERM',()=>{void close();});process.once('SIGINT',()=>{void close();});
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const temp=control+'.'+listener.instance+'.tmp';await writeFile(temp,JSON.stringify({pid:process.pid,instance:listener.instance,url:'http://127.0.0.1:'+server.address().port,token})+'\n',{mode:0o600,flag:'wx'});await rename(temp,control);}
  catch(error){await close();throw error;}
  return;
 }
 if(command==='start'){
  callback(get('--notify-url')); // Validate before spawning, with no host selection or executable hook.
  const prior=await request({action:'status'}).catch(()=>null);if(prior){console.log(JSON.stringify({...prior,reused:true}));return;}
  const log=await open(path.join(dir,'preparation-listener.log'),'a',0o600),child=spawn(process.execPath,[fileURLToPath(import.meta.url),'serve','--workspace',workspace,'--slug',session,...(get('--notify-url')?['--notify-url',get('--notify-url')]:[])],{cwd:workspace,detached:true,stdio:['ignore',log.fd,log.fd],shell:false});
  await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();await log.close();
  for(let i=0;i<65;i++){const result=await request({action:'status'}).catch(()=>null);if(result){console.log(JSON.stringify({...result,reused:false}));return;}await sleep(100);}
  throw new Error('Listener did not become ready. Inspect manager/preparation-listener.log.');
 }
 let data={action:command};
 if(command==='claim')data={...data,event_id:get('--event'),consumer_id:get('--consumer')};
 else if(['progress','compile','finish'].includes(command)){
  data=get('--data-file')?await json(path.resolve(get('--data-file'))):{job_id:get('--job'),consumer_id:get('--consumer')};
  if(data.action&&data.action!==command)throw new Error('Command file action does not match.');data.action=command;
 }
 if(!['status','next','claim','progress','compile','finish','stop'].includes(command))throw new Error(usage);
 const result=await request(data);if(command==='stop'){for(let i=0;i<50;i++){try{await readFile(control);await sleep(40);}catch(error){if(error.code==='ENOENT'){console.log(JSON.stringify(result));return;}throw error;}}throw new Error('Listener shutdown is not yet verified.');}console.log(JSON.stringify(result));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
