import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {iconLibrary, libraryIcons} from '../kit/manager/client/assets/icons/catalog.mjs';
import {iconographyContent} from '../kit/manager/client/features/iconography.mjs';
import {setupFixture} from './fixtures/manager-setup.mjs';

test('bundled official icon catalog matches the docs registry, license, and safe vector grammar',async()=>{
 const registry=await readFile(new URL('../kit/web/src/icons/index.tsx',import.meta.url),'utf8'),block=registry.match(/export const icons = \{([\s\S]*?)\n\}/)[1];
 const entries=[...block.matchAll(/'([a-z0-9-]+\/[a-z0-9-]+)':\s*([A-Za-z0-9]+)/g)].map(m=>[m[1],m[2]]);
 assert.deepEqual(libraryIcons.map(i=>[i.name,i.component]),entries);
 assert.equal(iconLibrary.registryHash,createHash('sha256').update(block).digest('hex'));
 assert.equal(iconLibrary.license,'ISC');assert.match(await readFile(new URL('../kit/manager/client/assets/icons/LUCIDE-LICENSE.txt',import.meta.url),'utf8'),/ISC/);
 assert.equal(new Set(libraryIcons.map(i=>i.name)).size,libraryIcons.length);
 for(const i of libraryIcons){assert.ok(i.nodes.length);for(const [tag,attrs]of i.nodes){assert.ok(['path','circle','rect','ellipse','line','polyline','polygon'].includes(tag));assert.ok(Object.keys(attrs).every(k=>['d','cx','cy','r','rx','ry','x','y','x1','y1','x2','y2','width','height','points','fill'].includes(k)));}}
});
test('icon search uses the real catalog and has a recoverable empty state',()=>{
 const render=query=>iconographyContent({query,escape:s=>String(s||''),previewCard:(t,b)=>t+b});
 assert.match(render('search'),/general\/search/);assert.doesNotMatch(render('search'),/general\/home/);
 assert.match(render('no-match-zzz'),/No icons match your filter/);
});
test('new local system exposes Lucide as a reference without inventing Figma components',async t=>{
 const f=await setupFixture();t.after(()=>f.cleanup());await f.post('/api/setup-submit',f.form());
 let flow;for(let i=0;i<100;i++){flow=await f.flow();if(flow.status==='ready')break;await new Promise(r=>setTimeout(r,20));}
 assert.equal(flow.status,'ready');const state=await fetch(f.url+'/api/state').then(r=>r.json()),icons=state.foundations.find(f=>f.id==='iconography');
 assert.equal(icons.status,'ready');assert.equal(icons.library.name,'Lucide');assert.equal(icons.count,libraryIcons.length);assert.deepEqual(icons.variables,[]);assert.deepEqual(icons.styles,[]);assert.match(icons.message,/reference/);assert.equal(state.initDone,false);
 const plan=JSON.parse(await readFile(f.output+'/foundation-plan.json','utf8'));plan.systemMode='existing';await writeFile(f.output+'/foundation-plan.json',JSON.stringify(plan));
 const existing=await fetch(f.url+'/api/state').then(r=>r.json());assert.equal(existing.foundations.find(f=>f.id==='iconography').status,'pending');assert.equal(existing.foundations.find(f=>f.id==='iconography').library,undefined);
 assert.equal((await fetch(f.url+'/client/assets/icons/catalog.mjs')).status,200);assert.equal((await fetch(f.url+'/client/assets/icons/LUCIDE-LICENSE.txt')).status,200);
});
