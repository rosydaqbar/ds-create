import {lstat, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {digest, sourceBytes} from './sources.mjs';
import {COMPILER_HASH, assembleFoundations, contrastReport, domainNames, validateDecisionPack} from '../foundations/compiler.mjs';
import {localDirectory, snapshotInputs, writeJSON} from './files.mjs';
import {readJSON} from './state.mjs';
import {validateFoundations} from '../foundations/validate.mjs';
import {normalizeFrozen} from '../foundations/frozen.mjs';
import {resolveTemplateDecisions, templateFor, templateHash} from '../foundations/templates.mjs';
import {createFoundationPack} from '../foundations/pack.mjs';

async function regular(file){try{const s=await lstat(file);if(!s.isFile()||s.isSymbolicLink())throw new Error('Preparation artifacts must be regular files.');}catch(e){if(e.code!=='ENOENT')throw e;}}
export async function compilePreparation(request,jobDir,{assertCurrent=async()=>{}}={}){
 const started=Date.now();
 await assertCurrent();
 const decisionFile=path.join(jobDir,'decisions.json');await regular(decisionFile);
 const rawDecision=JSON.parse(await readFile(decisionFile,'utf8')),decision=resolveTemplateDecisions(rawDecision),pack=JSON.parse(await readFile(path.join(jobDir,'source-pack.json'),'utf8'));
 if(pack.inputHash!==request.inputHash)throw new Error('Source pack belongs to another revision.');
 const locked=validateDecisionPack(decision,request,pack);
 let frozen=null;
 if(decision.frozenSource){
  frozen=normalizeFrozen(JSON.parse((await sourceBytes(request,decision.frozenSource)).toString('utf8')));
  const check=validateFoundations(frozen);if(!check.valid)throw new Error('Invalid frozen export ('+check.errors.length+' issues): '+check.errors.slice(0,10).join('; '));
 }
 const platform=locked.platform||decision.product?.platform,modes=locked.modes||decision.modes||frozen?.collections.find(c=>c.name==='Color')?.modes;
 if(!['Web','App','Web and App'].includes(platform)||!Array.isArray(modes)||!modes.length)throw new Error('Settle platform and appearance modes before compilation.');
 const cache=await localDirectory(request.workspace,`workspace/output/${request.slug}/manager/preparation-cache/domains`),parts={},compiled=[],reused=[];
 for(const domain of domainNames){
  const scope=decision.domains[domain];if(scope.status==='excluded'||!scope.recipe)continue;
  let dependencies;
  if(domain==='elevation'){
   const variables=[...(parts.shape?.variables||[]),...(frozen?.variables||[])],v=variables.find(v=>v.name==='border/width/focus'),ref=v?.values.Value?.alias,primitive=variables.find(v=>v.name===ref);
   dependencies={focusWidth:primitive?.values.Value??v?.values.Value??2,hasDanger:[...(parts.color?.variables||[]),...(frozen?.variables||[])].some(v=>v.name==='color/border/danger')};
  }
  const key=digest(JSON.stringify({compiler:COMPILER_HASH,templates:templateHash,domain,recipe:scope.recipe,platform,modes:domain==='color'?modes:null,dependencies}));
  const file=path.join(cache,key+'.json');await regular(file);
  const stored=await readJSON(file);let part=stored?.key===key&&digest(JSON.stringify(stored.data))===stored.hash?stored.data:null;
  if(part)reused.push(domain);
  else{part=templateFor(domain).compile(scope.recipe,{platform,modes,dependencies});await writeJSON(file,{key,hash:digest(JSON.stringify(part)),data:part});compiled.push(domain);}
  parts[domain]=part;
 }
 const draftFile=path.join(request.outputDir,'foundations.json');await regular(draftFile);
 const previous=await readJSON(draftFile),revision=(Number.isInteger(previous?.revision)?previous.revision:0)+1;
 const {draft,plan}=assembleFoundations(decision,request,pack,parts,frozen,revision);
 const contrast=contrastReport(draft),failures=contrast.filter(r=>!r.pass);
 await writeJSON(path.join(jobDir,'contrast.json'),{format:'ds-create/contrast@1',results:contrast});
 if(failures.length&&(!frozen||Object.keys(parts).length))throw new Error('Contrast needs design resolution: '+failures.slice(0,12).map(r=>`${r.mode} ${r.foreground} on ${r.background}: ${r.ratio?.toFixed(2)||r.reason} (needs ${r.minimum})`).join('; '));
 if((await snapshotInputs(request.workspace,request.inputSlug||request.slug)).hash!==request.inputHash)throw new Error('Inputs changed before artifact writing.');
 await assertCurrent();
 const ledgerFile=path.join(request.outputDir,'ds-create-ledger.json');await regular(ledgerFile);
 const existing=await readJSON(ledgerFile)||{},now=new Date().toISOString();
 const ledger={...existing,system:request.projectName,scope:{...existing.scope,productType:plan.product.platform},answers:{...existing.answers,init:`workspace/input/${request.inputSlug||request.slug}/answers/01-init.md`},sequence:[...(existing.sequence||[]).filter(e=>![1,2,3,4].includes(Number(e.step))),...[1,2,3,4].map(step=>({...existing.sequence?.find(e=>Number(e.step)===step),step,status:step===1?'done':'todo'}))].sort((a,b)=>Number(a.step)-Number(b.step)),foundationReview:{status:'pending'}};
 const input=`workspace/input/${request.inputSlug||request.slug}`;
 await localDirectory(request.workspace,input+'/answers');await localDirectory(request.workspace,`workspace/output/${request.slug}/reports`);
 const sources='# Preparation sources\n\n'+pack.sources.map(s=>`- ${s.path} → ${path.resolve(request.workspace,input,s.path)} · sha256 ${s.hash} · ${s.archive?'archive':'active'} · ${decision.coverage.find(r=>r.path===s.path).status}`).join('\n')+'\n';
 const answers='# Init decisions\n\n'+plan.decisions.map((d,i)=>`## ${i+1} · ${d.key}\nAnswer: ${d.value}\nDecided by: ${d.decidedBy} (${d.source})${d.reason?' — '+d.reason:''}\nGates: local foundation preparation; Figma pending.\n`).join('\n');
 const report=`# Local foundation preparation\n\n${request.projectName} · revision ${revision}\nInput hash: ${request.inputHash}\nCompiler: ${COMPILER_HASH}\n\nAwaiting Builder review. Figma readiness, publication and audit remain pending; init is incomplete.\n\n## Design decisions\n\n`+plan.decisions.map(d=>`- ${d.key}: ${d.value} (${d.source})${d.reason?' — '+d.reason:''}`).join('\n')+'\n\n## Scope\n\n'+domainNames.map(id=>`- ${id}: ${plan.domains[id].status}${plan.domains[id].reason?' — '+plan.domains[id].reason:''}`).join('\n')+`\n\nContrast: ${contrast.length} tested pairs; ${failures.length} failures. Transparent pairs require explicit backing-surface resolution. Preview controller edits are not saved by this operation.\n`;
 const artifacts=[['foundation-plan.json',JSON.stringify(plan,null,2)+'\n'],['ds-create-ledger.json',JSON.stringify(ledger,null,2)+'\n'],['reports/init.md',report],['foundations.json',JSON.stringify(draft,null,2)+'\n']].map(([name,body])=>[path.join(request.outputDir,name),body]);
 const foundationPack=createFoundationPack({draft,plan,decision:rawDecision,request});
 await localDirectory(request.workspace,`workspace/output/${request.slug}/foundations`);
 artifacts.push(...foundationPack.files.map(([name,body])=>[path.join(request.outputDir,name),body]));
 artifacts.unshift([path.join(request.workspace,input,'sources.md'),sources],[path.join(request.workspace,input,'answers/01-init.md'),answers]);
 // Stage the whole set before changing canonical files. Individual renames are atomic;
 // the owned setup remains running until the normal proof checks accept the complete set.
 const staging=await localDirectory(request.workspace,`workspace/output/${request.slug}/manager/setup-jobs/${request.id}/artifacts`);
 for(const [i,[target,body]]of artifacts.entries()){await regular(target);await writeFile(path.join(staging,i+'.tmp'),body);}
 await assertCurrent();
 if((await snapshotInputs(request.workspace,request.inputSlug||request.slug)).hash!==request.inputHash)throw new Error('Inputs changed before committing artifacts.');
 for(const [i,[target]]of artifacts.entries())await rename(path.join(staging,i+'.tmp'),target);
 const receipt={format:'ds-create/preparation-compile@1',inputHash:request.inputHash,inputRevision:request.inputRevision,compiler:COMPILER_HASH,decisionHash:digest(JSON.stringify(rawDecision)),foundationPack:{format:foundationPack.manifest.format,templateHash,files:foundationPack.files.map(([name])=>name)},draftHash:digest(JSON.stringify(draft,null,2)+'\n'),artifactHashes:Object.fromEntries(artifacts.map(([target,body])=>[path.relative(request.workspace,target).split(path.sep).join('/'),digest(body)])),revision,compiled,reused,counts:{variables:draft.variables.length,textStyles:draft.textStyles.length,effectStyles:draft.effectStyles.length},contrastPairs:contrast.length,contrastWarnings:failures.length,elapsedMs:Date.now()-started,created:now};
 await writeJSON(path.join(jobDir,'compile-receipt.json'),receipt);
 return receipt;
}
