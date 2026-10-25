import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {normalizeInterfaceDetails} from '../manager/setup-options.mjs';
import {setupFixture} from './fixtures/manager-setup.mjs';
import {setupPrompt} from '../manager/setup-prompt.mjs';
const details={modes:['Light','Dark'],devices:['Responsive web','iOS'],tokenization:'keep'};
test('interface selections reject missing, unknown, duplicate and arbitrary fields',()=>{
 assert.equal(normalizeInterfaceDetails(null),null);
 assert.deepEqual(normalizeInterfaceDetails(details),details);
 for(const invalid of [{...details,modes:[]},{...details,modes:['Dark','Dark']},{...details,modes:['fake']},{...details,devices:[]},{...details,devices:['watch']},{...details,tokenization:'custom'},{...details,command:'run'}])assert.throws(()=>normalizeInterfaceDetails(invalid));
});
test('web selections round-trip in the saved source, flow and mandatory FAST request without altering context or original files',async t=>{
 const f=await setupFixture({runner:'mcp'});t.after(()=>f.cleanup());
 assert.equal((await fetch(f.url+'/setup-options.mjs')).status,200);
 const context='Our product context\nExact second line.',bytes=Buffer.from([0,255,17]);
 const form=f.form(context,[['Brand original.pdf',bytes]]);form.set('interfaceDetails',JSON.stringify(details));
 assert.equal((await f.post('/api/setup-submit',form)).status,202);
 const flow=await f.flow();assert.deepEqual(flow.interfaceDetails,details);assert.equal(flow.context,context);assert.equal(flow.fastMode,true);
 const input=path.join(f.root,'workspace/input',flow.inputSlug),record=JSON.parse(await readFile(path.join(f.output,'manager/setup.json')));
 assert.deepEqual(await readFile(path.join(input,flow.files[0].path)),bytes);
 const source=await readFile(path.join(input,record.contextFile),'utf8');assert.ok(source.includes(context));assert.match(source,/Modes: Light, Dark/);assert.match(source,/Keep existing naming/);
 const request=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',flow.jobId,'request.json')));
 assert.equal(request.fastMode,true);assert.deepEqual(request.interfaceDetails,details);
 const prompt=setupPrompt(request,'fixture-request.json');assert.match(prompt,/Mandatory --fast-mode/);assert.ok(prompt.includes(JSON.stringify(details)));
});
test('invalid details never create input files or queue work; browser cannot disable FAST',async t=>{
 const f=await setupFixture({runner:'mcp'});t.after(()=>f.cleanup());
 for(const value of ['not json','null',JSON.stringify({...details,modes:[]}),JSON.stringify({...details,tokenization:'evil'})]){
  const form=f.form();form.set('interfaceDetails',value);assert.equal((await f.post('/api/setup-submit',form)).status,400);assert.equal((await f.flow()).status,'empty');
 }
 const duplicate=f.form();duplicate.append('interfaceDetails',JSON.stringify(details));duplicate.append('interfaceDetails',JSON.stringify(details));assert.equal((await f.post('/api/setup-submit',duplicate)).status,400);
 const override=f.form();override.set('fastMode','false');assert.equal((await f.post('/api/setup-submit',override)).status,400);
});
test('revisions retain or replace interface choices while preserving original source revisions',async t=>{
 const f=await setupFixture();t.after(()=>f.cleanup());
 const form=f.form();form.set('interfaceDetails',JSON.stringify({...details,modes:['Light']}));await f.post('/api/setup-submit',form);
 let flow;for(let i=0;i<100;i++){flow=await f.flow();if(flow.status==='ready')break;await new Promise(r=>setTimeout(r,40));}assert.equal(flow.status,'ready');
 const saved=JSON.parse(await readFile(path.join(f.output,'manager/setup.json'))),oldSource=await readFile(path.join(f.root,'workspace/input',flow.inputSlug,saved.contextFile));
 const rev=f.form('Revised context');rev.set('inputRevision',String(flow.inputRevision));rev.set('interfaceDetails',JSON.stringify({...details,modes:['Dark'],tokenization:'normalize'}));assert.equal((await f.post('/api/setup-revise',rev)).status,202);
 const current=await f.flow();assert.deepEqual(current.interfaceDetails.modes,['Dark']);assert.equal(current.interfaceDetails.tokenization,'normalize');assert.equal(current.fastMode,true);
 const history=JSON.parse(await readFile(path.join(f.output,'manager/setup.json')));assert.deepEqual(history.revisions[0].interfaceDetails.modes,['Light']);
 assert.deepEqual(await readFile(path.join(f.root,'workspace/input',flow.inputSlug,saved.contextFile)),oldSource);
});

test('new intake needs no naming question and sends no invented naming decision',async t=>{
 const f=await setupFixture({runner:'mcp'});t.after(()=>f.cleanup());
 const choices={modes:['Light'],devices:['Responsive web']};assert.deepEqual(normalizeInterfaceDetails(choices),choices);
 const html=await fetch(f.url).then(r=>r.text());assert.ok(!html.includes('id="setup-tokenization"'));
 const form=f.form('A new product and new design system.');form.set('interfaceDetails',JSON.stringify(choices));assert.equal((await f.post('/api/setup-submit',form)).status,202);
 const flow=await f.flow();assert.deepEqual(flow.interfaceDetails,choices);
 const request=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',flow.jobId,'request.json')));assert.ok(!Object.hasOwn(request.interfaceDetails,'tokenization'));
 const prompt=setupPrompt(request,'fixture-request.json');assert.match(prompt,/do not ask a new system to choose naming rules/);
 const record=JSON.parse(await readFile(path.join(f.output,'manager/setup.json'))),source=await readFile(path.join(f.root,'workspace/input',flow.inputSlug,record.contextFile),'utf8');assert.ok(!source.includes('Keep existing naming'));
});

test('Web, App and both round-trip through real intake without invented device specifics',async()=>{
 for(const devices of [['Web'],['App'],['Web','App']]){
  const f=await setupFixture({runner:'mcp'});
  try{
   const html=await fetch(f.url).then(r=>r.text());
   const visible=[...html.matchAll(/<input\b[^>]*\bname="setup-devices"[^>]*>/g)].map(m=>m[0].match(/value="([^"]+)"/)[1]);
   assert.deepEqual(visible,['Web','App']);
   const selections={modes:['Light'],devices},form=f.form('Device specifics come from this project context.');
   form.set('interfaceDetails',JSON.stringify(selections));assert.equal((await f.post('/api/setup-submit',form)).status,202);
   const flow=await f.flow();assert.deepEqual(flow.interfaceDetails,selections);
   const request=JSON.parse(await readFile(path.join(f.output,'manager/setup-jobs',flow.jobId,'request.json')));
   assert.deepEqual(request.interfaceDetails,selections);assert.equal(request.fastMode,true);
  }finally{await f.cleanup();}
 }
});
