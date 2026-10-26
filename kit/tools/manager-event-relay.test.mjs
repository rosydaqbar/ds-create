import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function relay(t){
 const child=spawn(process.execPath,[fileURLToPath(new URL('./manager-event-relay.mjs',import.meta.url))],{stdio:['pipe','pipe','pipe']}),events=[];
 createInterface({input:child.stdout}).on('line',line=>events.push(JSON.parse(line)));
 const next=async predicate=>{for(let i=0;i<150;i++){const e=events.find(predicate);if(e)return e;await sleep(10);}throw Error('Relay receipt missing.');};
 t.after(async()=>{child.stdin.end();if(child.exitCode===null)await once(child,'exit');});
 const ready=await next(e=>e.event==='relay-ready'),send=command=>child.stdin.write(JSON.stringify(command)+'\n');
 const post=packet=>fetch(ready.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(packet)});
 return {child,events,next,ready,send,post};
}
test('generic relay requires an attached tool runtime and a real enqueue acknowledgement',async t=>{
 const r=await relay(t),packet={event:'delivery-probe',event_id:'test-event',prompt:'Diagnostic only'};
 assert.equal((await fetch(r.ready.url).then(r=>r.json())).ready,false);
 assert.equal((await r.post(packet)).status,503);
 r.send({action:'attach'});await r.next(e=>e.event==='host-ack');
 assert.equal((await fetch(r.ready.url).then(r=>r.json())).ready,true);
 const handshake=await r.post({event:'listener-ready',event_id:'readiness'}).then(r=>r.json());assert.equal(handshake.health_supported,true);
 const pending=r.post(packet);await r.next(e=>e.event==='host-prompt'&&e.packet.event_id===packet.event_id);
 assert.equal(r.events.filter(e=>e.event==='delivery-ack').length,0);
 r.send({action:'receipt',event_id:packet.event_id,accepted:true});assert.deepEqual(await (await pending).json(),{accepted:true,event_id:packet.event_id});
 assert.equal((await r.post(packet)).status,200);await sleep(30);
 assert.equal(r.events.filter(e=>e.event==='host-prompt').length,1,'accepted identity is never enqueued twice');
});
test('host disconnect rejects pending delivery rather than fabricating readiness or ownership',async t=>{
 const r=await relay(t);r.send({action:'attach'});await r.next(e=>e.event==='host-ack');
 const pending=r.post({event:'delivery-probe',event_id:'disconnect',prompt:'Diagnostic only'});
 await r.next(e=>e.event==='host-prompt');r.child.stdin.end();
 assert.equal((await (await pending).json()).accepted,false);
});
