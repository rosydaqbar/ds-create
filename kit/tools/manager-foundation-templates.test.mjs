import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {snapshotInputs} from '../manager/input-snapshot.mjs';
import {prepareSourcePack} from '../manager/source-pack.mjs';
import {compilePreparation} from '../manager/preparation-compiler.mjs';
import {templateFor,resolveTemplateDecisions,seedFoundationInputs,templateHash} from '../manager/foundation-templates.mjs';
import {verifyFoundationPack,foundationPackFiles} from '../manager/foundation-pack.mjs';
import {writeFoundationFastPlan} from '../manager/foundation-fast.mjs';
import {decisions} from './fixtures/preparation-decisions.mjs';
const json=async f=>JSON.parse(await readFile(f,'utf8'));
async function fixture(t){
 const workspace=await mkdtemp(path.join(tmpdir(),'ds-premade-')),slug='fixture',inputSlug='product',outputDir=path.join(workspace,'workspace/output',slug),id='11111111-1111-4111-8111-111111111111',dir=path.join(outputDir,'manager/setup-jobs',id);
 t.after(()=>rm(workspace,{recursive:true,force:true}));await mkdir(dir,{recursive:true});await mkdir(path.join(workspace,'workspace/input',inputSlug),{recursive:true});
 await writeFile(path.join(workspace,'workspace/input',inputSlug,'brief.md'),'A synthetic product; Fixture Sans Regular/Medium, Fixture Display Roman; no depth, square controls.');
 const s=await snapshotInputs(workspace,inputSlug),request={id,workspace,slug,inputSlug,outputDir,inputHash:s.hash,inputSnapshot:s.files,inputRevision:1,projectName:'Fixture system',contextFile:'brief.md',interfaceDetails:{modes:['Light','Dark'],devices:['Web']}};
 const {pack}=await prepareSourcePack(request,dir);return {request,pack,dir,output:outputDir};
}
test('source parsing fills fixed templates; Node handles family-specific faces, square corners and no-depth focus',()=>{
 const context={platform:'Web',modes:['Light','Dark'],dependencies:{hasDanger:true,focusWidth:2}};
 const type=templateFor('typography').compile({families:{ui:'Fixture Sans',display:'Fixture Display'},faces:{ui:{regular:'Regular',medium:'Medium'},display:{regular:'Roman'}},display:true},context);
 assert.ok(type.textStyles.some(s=>s.fontFamily==='Fixture Display'&&s.fontStyle==='Roman'));
 assert.ok(type.textStyles.filter(s=>s.fontFamily==='Fixture Display').every(s=>s.fontStyle==='Roman'));
 assert.ok(type.textStyles.filter(s=>s.fontFamily==='Fixture Sans').every(s=>['Regular','Medium'].includes(s.fontStyle)));
 const shape=templateFor('shape').compile({preset:'square'},context),map=new Map(shape.variables.map(v=>[v.name,v]));
 for(const v of shape.variables.filter(v=>v.collection==='Shape'&&v.name.startsWith('radius/')&&v.name!=='radius/full'))assert.equal(map.get(v.values.Value.alias).values.Value,0);
 assert.equal(map.get(map.get('radius/full').values.Value.alias).values.Value,9999);
 const shadows=templateFor('elevation').compile({treatment:'none'},context);assert.equal(shadows.effectStyles.length,4);assert.ok(shadows.effectStyles.every(s=>s.name.startsWith('focus/')&&s.effects.every(e=>e.radius===0)));
 assert.throws(()=>templateFor('typography').compile({families:{ui:'A'},faces:{ui:{regular:'Regular'}},rows:[{role:'body',size:'md',fontSize:16,lineHeight:24,weights:['bold']}]},context),/undeclared face/);
});
test('paired modules/memory are generated in the real artifact receipt and match the saved source; tampering is rejected',async t=>{
 const f=await fixture(t),d=decisions(f.request,f.pack);await seedFoundationInputs(f.request,f.pack,f.dir);
 const seed=await json(path.join(f.dir,'foundation-inputs.json'));assert.equal(seed.product.platform,'Web');assert.equal(seed.product.description,null);assert.equal(seed.inputHash,f.request.inputHash);
 for(const [id,scope]of Object.entries(d.domains))d.domains[id]={status:scope.status,template:templateFor(id).name,inputs:scope.recipe};
 d.domains.shape.inputs={preset:'square'};d.domains.elevation.inputs={treatment:'none'};
 await writeFile(path.join(f.dir,'decisions.json'),JSON.stringify(d));const result=await compilePreparation(f.request,f.dir);
 assert.equal(result.foundationPack.templateHash,templateHash);assert.equal(result.foundationPack.files.length,foundationPackFiles.length);assert.equal(Object.keys(result.artifactHashes).length,6+foundationPackFiles.length);
 const draft=await json(path.join(f.output,'foundations.json'));assert.equal((await verifyFoundationPack(f.output,draft)).present,true);
 for(const stem of ['01-color','02-typography','03-spacing','04-radius','05-shadow','06-motion']){
  const mod=await import(pathToFileURL(path.join(f.output,'foundations',stem+'.js')).href);assert.equal(mod.default.inputHash,f.request.inputHash);assert.equal(mod.default.revision,draft.revision);
  const memory=await readFile(path.join(f.output,'foundations',stem+'.md'),'utf8');assert.ok(memory.includes(f.request.inputHash));assert.ok(!/\{\{\w+\}\}/.test(memory));
 }
 const motion=(await import(pathToFileURL(path.join(f.output,'foundations/06-motion.js')).href)).default;assert.ok(motion.data.variables.some(v=>v.type==='TIMING'));assert.ok(motion.data.variables.some(v=>v.type==='EASING'));
 const file=path.join(f.output,'foundations/01-color.md'),before=await readFile(file);await writeFile(file,'Changed memory');await assert.rejects(verifyFoundationPack(f.output,draft),/artifact changed/);await assert.rejects(writeFoundationFastPlan({outputDir:f.output,hash:result.draftHash,revision:draft.revision},path.join(f.dir,'request.json')),/artifact changed/);await writeFile(file,before);
 const stale=structuredClone(draft);stale.revision++;await assert.rejects(verifyFoundationPack(f.output,stale),/stale/);
});
test('template input validation preserves old recipes and rejects mixed or unrecognized bindings',()=>{
 const old={domains:{shape:{status:'included',recipe:{}}}};assert.deepEqual(resolveTemplateDecisions(old),old);
 assert.throws(()=>resolveTemplateDecisions({domains:{shape:{status:'included',template:'01-color',inputs:{}}}}),/declared input/);
 assert.throws(()=>resolveTemplateDecisions({domains:{shape:{status:'included',template:'04-radius',inputs:{preset:'square'},recipe:{}}}}),/do not mix/);
});
