import {lockedFacts} from '../kit/manager/shared/interface.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {snapshotInputs} from '../kit/manager/server/files.mjs';
import {extractSource, extractSourceBounded, prepareSourcePack} from '../kit/manager/server/sources.mjs';
import {assembleFoundations, compileDomain, contrastReport, paletteRamp, validateCoverage} from '../kit/manager/foundations/compiler.mjs';
import {compilePreparation} from '../kit/manager/server/compile.mjs';
import {generateDefaults} from '../kit/tools/maintain/foundations.mjs';
import {contrastReport as checkContrast} from '../kit/manager/foundations/validate.mjs';
import {checkPreparation, checkWebDraft} from '../kit/manager/server/verify.mjs';
import {normalizeFrozen} from '../kit/manager/foundations/frozen.mjs';
import {decisions, recipes} from './fixtures/preparation-decisions.mjs';

const json=async f=>JSON.parse(await readFile(f,'utf8'));

async function fixture(t){
 const workspace=await mkdtemp(path.join(tmpdir(),'ds-prepare-compile-')),slug='fixture',inputSlug='product',outputDir=path.join(workspace,'workspace/output',slug),id='11111111-1111-4111-8111-111111111111',dir=path.join(outputDir,'manager/setup-jobs',id);
 t.after(()=>rm(workspace,{recursive:true,force:true}));await mkdir(dir,{recursive:true});await mkdir(path.join(workspace,'workspace/input',inputSlug),{recursive:true});
 await writeFile(path.join(workspace,'workspace/input',inputSlug,'brief.md'),'A synthetic product; use Inter and a monochrome palette.');
 const snapshot=await snapshotInputs(workspace,inputSlug),request={id,workspace,slug,inputSlug,outputDir,inputHash:snapshot.hash,inputSnapshot:snapshot.files,inputRevision:1,projectName:'Fixture system',contextFile:'brief.md',interfaceDetails:{modes:['Light','Dark'],devices:['Web']}};
 const result=await prepareSourcePack(request,dir);return {workspace,request,dir,pack:result.pack};
}
test('versioned defaults match the actual authoritative specs',async()=>{
 assert.deepEqual(await generateDefaults(fileURLToPath(new URL('..',import.meta.url))),await json(new URL('../kit/manager/foundations/defaults.json',import.meta.url)));
});
test('HTML retains semantic text, CSS font/color facts and asset metadata with original offsets, omitting code/path payloads',()=>{
 const source='<style>:root{--paper:#faf7f0;font-family:Inter;display:grid}h1{color:#102030;font-size:60px}</style><script>SECRET_CODE</script><h1>Sand &amp; Teal</h1><img src="logo.png" alt="Brand mark"><svg aria-label="Logo"><path d="M123456789 0"/></svg>';
 const pack=extractSource(Buffer.from(source),'.html');assert.equal(pack.kind,'html');assert.ok(pack.blocks.some(b=>b.text==='Sand & Teal'));
 assert.ok(pack.css.some(f=>f.property==='--paper'&&f.value==='#faf7f0'));assert.ok(pack.css.some(f=>f.property==='font-family'&&f.value==='Inter'));
 assert.ok(pack.assets.some(a=>a.label==='Brand mark'&&a.src==='logo.png'));
 assert.ok(pack.blocks.every(b=>source.slice(b.offset).length>0));assert.doesNotMatch(JSON.stringify(pack),/SECRET_CODE|M123456789|display:grid/);
 assert.equal(extractSource(Buffer.from('<style>unfinished'),'.html').requiresInspection,true);
 assert.equal(extractSource(Buffer.from('<svg><path d="M1 2"/></svg>'),'.svg').requiresInspection,true);
});
test('root extraction cache is content/type/version bound and every unsupported source requires inspection',async t=>{
 const f=await fixture(t),root=path.join(f.workspace,'workspace/input');await writeFile(path.join(root,'brand.html'),'<h1>Brand source</h1>');await writeFile(path.join(root,'asset.png'),Buffer.from([0,255]));
 const next=await snapshotInputs(f.workspace,'product');f.request.inputHash=next.hash;f.request.inputSnapshot=next.files;
 let r=await prepareSourcePack(f.request,f.dir);assert.equal(r.metrics.cacheHits,1);assert.equal(r.metrics.extracted,2);
 assert.ok(r.pack.sources.some(s=>s.path==='../brand.html'));assert.equal(lockedFacts(f.request).platform,'Web');
 assert.throws(()=>validateCoverage(r.pack,r.pack.sources.map(s=>({path:s.path,hash:s.hash,status:'read'}))),/inspection/);
 r=await prepareSourcePack(f.request,f.dir);assert.equal(r.metrics.extracted,0);assert.equal(r.metrics.cacheHits,3);
 await writeFile(path.join(root,'brand.html'),'<h1>Changed source</h1>');await assert.rejects(prepareSourcePack(f.request,f.dir),/Context changed/);
 const changed=await snapshotInputs(f.workspace,'product');f.request.inputHash=changed.hash;f.request.inputSnapshot=changed.files;
 r=await prepareSourcePack(f.request,f.dir);assert.equal(r.metrics.cacheHits,2);assert.equal(r.metrics.extracted,1);
});
test('large embedded HTML assets finish within a bounded parser thread, keep node offsets and never leak encoded bytes',async()=>{
 const data='A'.repeat(700000),source='<meta name="theme-color" content="#123456"><h1>Foundation brief</h1><img src="data:image/png;base64,'+data+'" alt="Product logo"><p>Use the supplied UI typeface.</p>';
 const pack=await extractSourceBounded(Buffer.from(source),'.html',{timeoutMs:3000});
 assert.deepEqual(pack.blocks.map(b=>b.text),['Foundation brief','Use the supplied UI typeface.']);
 assert.equal(source.slice(pack.blocks[1].offset).startsWith('Use the supplied'),true);
 assert.equal(pack.assets[0].src,'[embedded asset]');assert.equal(pack.assets[0].label,'Product logo');assert.equal(pack.metadata[0].content,'#123456');
 assert.ok(JSON.stringify(pack).length<3000);assert.doesNotMatch(JSON.stringify(pack),/A{30}/);
 await assert.rejects(extractSourceBounded(Buffer.from(source),'.html',{timeoutMs:0}),/time limit/);
 const again=await extractSourceBounded(Buffer.from('<p>Parser still available</p>'),'.html');assert.equal(again.blocks[0].text,'Parser still available');
});
test('compiler preserves pinned anchors, generates canonical metadata/bindings and keeps Web free of App touch roles',async t=>{
 const f=await fixture(t),d=decisions(f.request,f.pack),parts=Object.fromEntries(Object.entries(recipes).map(([id,r])=>[id,compileDomain(id,r,{platform:'Web',modes:['Light','Dark']})]));
 const {draft,plan}=assembleFoundations(d,f.request,f.pack,parts);assert.equal(plan.motionPolicy,'basic-ui');assert.equal(draft.effectStyles.length,8);assert.equal(draft.textStyles.length,25);
 assert.equal(draft.variables.find(v=>v.name==='palette/brand/600').values.Value,'#333333');assert.equal(draft.variables.some(v=>v.name==='size/touch-min-android'),false);
 assert.equal(draft.variables.find(v=>v.name==='font/family/ui').codeSyntax.WEB,'var(--font-family-ui)');
 assert.ok(draft.variables.filter(v=>v.collection==='Primitives').every(v=>v.hiddenFromPublishing));assert.ok(draft.textStyles.every(s=>Object.keys(s.bound).length===5));
 assert.ok(contrastReport(draft).every(r=>r.pass));
 const standard=draft.variables.find(v=>v.name==='motion/easing/standard');assert.equal(standard.type,'EASING');assert.deepEqual(standard.values,{Standard:{alias:'scale/easing/standard'},Reduced:{alias:'scale/easing/standard'}});
 assert.deepEqual(draft.variables.find(v=>v.name==='scale/easing/standard').values.Value,{type:'CUSTOM_CUBIC_BEZIER',easingFunctionCubicBezier:{x1:0.2,y1:0,x2:0,y2:1}});assert.equal(draft.variables.find(v=>v.name==='motion/duration/base').type,'TIMING');assert.equal(draft.variables.find(v=>v.name==='motion/delay/tooltip').type,'TIMING');
 d.product.platform='App';assert.throws(()=>assembleFoundations(d,f.request,f.pack,parts),/already selected/);
 const ramp=paletteRamp({anchors:{50:'#f9f0e0',400:'#80a080',800:'#203030',950:'#081010'}});assert.equal(ramp[400],'#80a080');assert.equal(ramp[800],'#203030');assert.equal(ramp[50],'#f9f0e0');
 assert.throws(()=>paletteRamp({anchors:{500:'#333333'}}),/both ends/);
});
test('local contrast catches brand text on pressed subtle fill even when it passes on the base surface',()=>{
 const variables=[['palette/base/white','#ffffff'],['palette/brand/700','#747474'],['palette/brand/100','#f5f5f5']].map(([name,value])=>({name,collection:'Primitives',type:'COLOR',values:{Value:value}}));
 for(const [name,ref]of [['color/surface/base','palette/base/white'],['color/text/brand','palette/brand/700'],['color/fill/brand/subtle/pressed','palette/brand/100']])variables.push({name,collection:'Color',type:'COLOR',values:{Light:{alias:ref}}});
 const result=checkContrast({collections:[{name:'Primitives',modes:['Value']},{name:'Color',modes:['Light']}],variables});
 assert.equal(result.find(p=>p.background==='color/surface/base').pass,true);const pressed=result.find(p=>p.background==='color/fill/brand/subtle/pressed');assert.equal(pressed.pass,false);assert.ok(pressed.ratio<4.5);
});
test('a previously prepared new-system draft is rechecked for subtle-state contrast before Publish',async t=>{
 const f=await fixture(t);await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(decisions(f.request,f.pack)));await compilePreparation(f.request,f.dir);
 const file=path.join(f.request.outputDir,'foundations.json'),draft=await json(file);draft.revision++;
 draft.variables.find(v=>v.name==='color/fill/brand/subtle/pressed').values.Light={alias:'palette/neutral/500'};
 await writeFile(file,JSON.stringify(draft));const result=await checkWebDraft(f.request.outputDir,f.workspace,{inputSlug:'product',inputRevision:1,projectName:'Fixture system'});
 assert.equal(result.valid,false);assert.ok(result.errors.some(e=>e.includes('Contrast: Light color/text/brand on color/fill/brand/subtle/pressed')));
});
test('compact inventory is normalized mechanically and unknown metadata cannot be silently discarded',()=>{
 const source={format:'ds-create/token-plan@1',collections:{Primitives:['Value']},variables:[['scale/space/4','Primitives','FLOAT',[],'Spacing primitive',{Value:4}]],textStyles:[{name:'type/body/md/regular',family:'Fixture Sans',style:'Regular',fs:16,lh:24,ls:0,bind:{fontSize:'scale/space/4'}}],effectStyles:[]};
 const result=normalizeFrozen(source);assert.deepEqual(result.variables[0],{name:'scale/space/4',collection:'Primitives',type:'FLOAT',scopes:[],description:'Spacing primitive',values:{Value:4}});assert.equal(result.textStyles[0].fontFamily,'Fixture Sans');assert.equal(result.importedFormat,source.format);
 source.variables.push(['space/xs','Space','FLOAT',['GAP'],'Gap',{Value:{a:'scale/space/4'}}]);assert.deepEqual(normalizeFrozen(source).variables[1].values.Value,{alias:'scale/space/4'});
 source.textStyles[0].unknownFeature=true;assert.throws(()=>normalizeFrozen(source),/Unsupported compact text style metadata/);
});
test('owned compilation writes one consistent pending review and reuses independent domains',async t=>{
 const f=await fixture(t),d=decisions(f.request,f.pack);await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(d));
 let receipt=await compilePreparation(f.request,f.dir);assert.equal(receipt.compiled.length,6);
 assert.equal((await checkPreparation(f.request.outputDir,f.workspace,{inputSlug:'product',inputRevision:1,projectName:'Fixture system'})).valid,true);
 const ledger=await json(path.join(f.request.outputDir,'ds-create-ledger.json'));assert.equal(ledger.foundationReview.status,'pending');assert.deepEqual(ledger.sequence.map(s=>s.status),['done','todo','todo','todo']);
 receipt=await compilePreparation(f.request,f.dir);assert.equal(receipt.reused.length,6);assert.equal(receipt.revision,2);
 d.domains.shape.recipe.values={'radius/control':6};await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(d));receipt=await compilePreparation(f.request,f.dir);
 assert.deepEqual(receipt.compiled,['shape']);assert.equal(receipt.reused.length,5);
 const before=await readFile(path.join(f.request.outputDir,'foundations.json'));
 await assert.rejects(compilePreparation(f.request,f.dir,{assertCurrent:async()=>{throw new Error('cancelled');}}),/cancelled/);
 assert.deepEqual(await readFile(path.join(f.request.outputDir,'foundations.json')),before);
 d.domains.color.recipe.overrides={'color/text/primary':{Light:'palette/base/white'}};await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(d));
 await assert.rejects(compilePreparation(f.request,f.dir),/Contrast needs design resolution/);assert.deepEqual(await readFile(path.join(f.request.outputDir,'foundations.json')),before);
});
test('shape focus width invalidates dependent effects, unsupported fields fail, and frozen imports retain all definitions/metadata',async t=>{
 const f=await fixture(t),d=decisions(f.request,f.pack);await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(d));await compilePreparation(f.request,f.dir);
 d.domains.shape.recipe.values={'border/width/focus':3};await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(d));const receipt=await compilePreparation(f.request,f.dir);
 assert.deepEqual(receipt.compiled,['shape','elevation']);
 let draft=await json(path.join(f.request.outputDir,'foundations.json'));assert.equal(draft.effectStyles.find(s=>s.name==='focus/default').effects[1].spread,5);
 d.domains.typography.recipe.unknown='Never silently drop';await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(d));await assert.rejects(compilePreparation(f.request,f.dir),/Unsupported typography recipe/);delete d.domains.typography.recipe.unknown;
 draft.variables[0].customMetadata={retained:true};draft.textStyles[0].customFeature='retained';
 await writeFile(path.join(f.workspace,'workspace/input/product/frozen.json'),JSON.stringify(draft));
 const snapshot=await snapshotInputs(f.workspace,'product');f.request.inputHash=snapshot.hash;f.request.inputSnapshot=snapshot.files;f.request.inputRevision++;
 const {pack}=await prepareSourcePack(f.request,f.dir),frozen=decisions(f.request,pack),plan=await json(path.join(f.request.outputDir,'foundation-plan.json'));
 frozen.systemMode='existing';frozen.naming='keep';frozen.frozenSource='frozen.json';frozen.domains=structuredClone(plan.domains);
 for(const [id,scope]of Object.entries(frozen.domains))frozen.domains[id]={status:'included',names:{variables:scope.variables,styles:scope.styles}};
 frozen.coverage.find(r=>r.path==='frozen.json').status='imported';frozen.coverage.find(r=>r.path==='frozen.json').note='Lossless named-object frozen export imported by Node.';
 await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(frozen));await compilePreparation(f.request,f.dir);
 const imported=await json(path.join(f.request.outputDir,'foundations.json'));
 for(const key of ['variables','collections','textStyles','effectStyles','gridStyles'])assert.deepEqual(imported[key],draft[key],key);
});
