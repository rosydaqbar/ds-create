import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { snapshotInputs } from './input-snapshot.mjs';
import { selectedInputSlug } from './input-identity.mjs';
import { validatePlan } from './foundation-validation.mjs';
import {contrastReport} from './foundation-contrast.mjs';
const contrastErrors=(plan,data)=>plan?.systemMode==='new'?contrastReport(data).filter(p=>!p.pass).map(p=>`Contrast: ${p.mode} ${p.foreground} on ${p.background} is ${p.ratio?.toFixed(2)||'unresolved'}; requires ${p.minimum}:1.`):[];
export async function checkPreparation(outputDir,workspace,setup){
  try{
    const [data,plan,ledger,answers,sources,report,snapshot]=await Promise.all([
      ...['foundations.json','foundation-plan.json','ds-create-ledger.json'].map(f=>readFile(path.join(outputDir,f),'utf8').then(JSON.parse)),
      readFile(path.join(workspace,'workspace/input',selectedInputSlug(setup,path.basename(outputDir)),'answers/01-init.md'),'utf8'),
      readFile(path.join(workspace,'workspace/input',selectedInputSlug(setup,path.basename(outputDir)),'sources.md'),'utf8'),
      readFile(path.join(outputDir,'reports/init.md'),'utf8'),snapshotInputs(workspace,selectedInputSlug(setup,path.basename(outputDir)))]);
    const result=validatePlan(plan,data,snapshot,setup?.inputRevision??1);
    if(result.valid)result.errors.push(...contrastErrors(plan,data));
    if(data.format!=='ds-create/foundations@1'||!Number.isInteger(data.revision)||data.revision<1)result.errors.push('Save a positive canonical draft revision.');
    if(!answers.trim()||!sources.trim()||!report.trim())result.errors.push('Save answers, sources and the init review report.');
    if(setup?.projectName && (ledger?.system!==setup.projectName || plan?.projectName!==setup.projectName))result.errors.push('The saved project name must match the chosen project name.');
    if(ledger?.scope?.productType!==plan?.product?.platform)result.errors.push('Ledger platform differs from the decision plan.');
    if(!Array.isArray(ledger?.sequence)||![1,2,3,4].every(n=>{const entries=ledger.sequence.filter(e=>Number(e?.step)===n);return entries.length===1&&entries[0].status===(n===1?'done':'todo');})||ledger?.foundationReview?.status!=='pending')result.errors.push('Local preparation must await review with steps 2–4 pending.');
    return {valid:!result.errors.length,errors:result.errors,inputHash:snapshot.hash,plan};
  }catch(e){return {valid:false,errors:[`Preparation evidence unavailable: ${e.message}`]};}
}
// Revalidate a previously prepared web draft without requiring the pre-publication ledger state.
export async function checkWebDraft(outputDir,workspace,setup){
  if(!setup)return {valid:true,errors:[]};
  try{
    const [data,plan,ledger,snapshot]=await Promise.all([
      ...['foundations.json','foundation-plan.json','ds-create-ledger.json'].map(f=>readFile(path.join(outputDir,f),'utf8').then(JSON.parse)),snapshotInputs(workspace,selectedInputSlug(setup,path.basename(outputDir)))]);
    const result=validatePlan(plan,data,snapshot,setup.inputRevision??1);
    if(result.valid)result.errors.push(...contrastErrors(plan,data));
    if(setup.projectName && (plan.projectName!==setup.projectName || ledger?.system!==setup.projectName))result.errors.push('The foundation plan belongs to a different project name.');
    return {...result,valid:!result.errors.length};
  }catch(e){return {valid:false,errors:[`Foundation evidence unavailable: ${e.message}`]};}
}
