#!/usr/bin/env node
// Generic tool-host transport: HTTP events -> JSON stdout; JSON stdin -> delivery receipts.
// Host orchestration code consumes events; no model/agent executable or provider SDK runs here.
import http from 'node:http';
import {createInterface} from 'node:readline';
import {randomBytes,randomUUID} from 'node:crypto';
import {writeFile,readFile,unlink} from 'node:fs/promises';
const recordIndex=process.argv.indexOf('--identity-file'),recordFile=recordIndex>=0?process.argv[recordIndex+1]:null;
const token=randomBytes(24).toString('hex'),instance=randomUUID(),pending=new Map(),accepted=new Set();
let attached=false,lastSeen=0,closing=false;
const emit=event=>process.stdout.write(JSON.stringify(event)+'\n');
const ready=()=>attached&&Date.now()-lastSeen<70000;
const server=http.createServer(async(req,res)=>{
 res.setHeader('content-type','application/json');res.setHeader('cache-control','no-store');
 if(req.headers.origin||req.url!=='/'+token){res.writeHead(403);res.end(JSON.stringify({error:'Forbidden'}));return;}
 if(req.method==='GET'){res.end(JSON.stringify({ready:ready(),instance}));return;}
 if(req.method!=='POST'){res.writeHead(405);res.end('{}');return;}
 try{
  const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>65536)throw Error('Event too large.');chunks.push(chunk);}
  const packet=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!packet||typeof packet.event_id!=='string'||!['listener-ready','prepare-request','prepare-cancel','delivery-probe'].includes(packet.event))throw Error('Unsupported relay event.');
  if(!ready()){res.writeHead(503);res.end(JSON.stringify({accepted:false,event_id:packet.event_id}));return;}
  if(packet.event==='listener-ready'||accepted.has(packet.event_id)){res.end(JSON.stringify({accepted:true,event_id:packet.event_id,...(packet.event==='listener-ready'?{health_supported:true}:{})}));return;}
  if(pending.has(packet.event_id)){res.writeHead(409);res.end(JSON.stringify({accepted:false,event_id:packet.event_id}));return;}
  const timer=setTimeout(()=>{if(pending.delete(packet.event_id)){res.writeHead(504);res.end(JSON.stringify({accepted:false,event_id:packet.event_id}));}},12000);
  pending.set(packet.event_id,{res,timer});emit({event:'host-prompt',packet});
 }catch(error){res.writeHead(400);res.end(JSON.stringify({error:error.message}));}
});
const input=createInterface({input:process.stdin,crlfDelay:Infinity});
input.on('line',line=>{
 try{
  const command=JSON.parse(line);
  if(command.action==='attach'||command.action==='ping'){attached=true;lastSeen=Date.now();emit({event:'host-ack',action:command.action,ready:true});return;}
  if(command.action==='receipt'){
   const waiting=pending.get(command.event_id);if(!waiting)throw Error('No pending event with that identity.');
   pending.delete(command.event_id);clearTimeout(waiting.timer);lastSeen=Date.now();
   if(command.accepted===true)accepted.add(command.event_id);
   waiting.res.end(JSON.stringify({accepted:command.accepted===true,event_id:command.event_id}));
   emit({event:'delivery-ack',event_id:command.event_id,accepted:command.accepted===true});return;
  }
  if(command.action==='stop'){void close();return;}
  throw Error('Use attach, ping, receipt or stop.');
 }catch(error){emit({event:'relay-error',message:error.message});}
});
async function close(){if(closing)return;closing=true;attached=false;input.close();for(const [id,{res,timer}]of pending){clearTimeout(timer);res.end(JSON.stringify({accepted:false,event_id:id}));}pending.clear();await new Promise(resolve=>server.close(resolve));if(recordFile){const saved=await readFile(recordFile,'utf8').then(JSON.parse).catch(()=>null);if(saved?.instance===instance)await unlink(recordFile);}}
input.once('close',()=>{void close();});process.once('SIGTERM',()=>{void close();});process.once('SIGINT',()=>{void close();});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const receipt={event:'relay-ready',pid:process.pid,instance,url:'http://127.0.0.1:'+server.address().port+'/'+token};
if(recordFile)await writeFile(recordFile,JSON.stringify(receipt)+'\n',{mode:0o600,flag:'wx'});
emit(receipt);
