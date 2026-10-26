#!/usr/bin/env node
// Materialize paired foundation artifacts from a saved, validated Builder revision. No regeneration.
import {readFile,writeFile,rename} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {localDirectory} from '../manager/setup-data.mjs';
import {snapshotInputs} from '../manager/input-snapshot.mjs';
import {validatePlan} from '../manager/foundation-validation.mjs';
import {createFoundationPack,verifyFoundationPack} from '../manager/foundation-pack.mjs';
const started=performance.now();
const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1],slug=args.includes('--slug')?get('--slug'):null;
const workspace=path.resolve(args.includes('--workspace')?get('--workspace'):fileURLToPath(new URL('../../',import.meta.url)));
const json=async file=>JSON.parse(await readFile(file,'utf8'));
try{
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug||''))throw new Error('Use --slug saved-session, optionally --workspace /absolute/workspace.');
 const output=await localDirectory(workspace,'workspace/output/'+slug),setup=await json(path.join(output,'manager/setup.json'));
 if(['queued','running'].includes(setup.status))throw new Error('Wait for active preparation before exporting memory artifacts.');
 const bytes=await readFile(path.join(output,'foundations.json')),plan=await json(path.join(output,'foundation-plan.json')),draft=JSON.parse(bytes);
 const snapshot=await snapshotInputs(workspace,setup.inputSlug||slug),check=validatePlan(plan,draft,snapshot,setup.inputRevision||1);if(!check.valid)throw new Error(check.errors.join('\n'));
 let decision={domains:plan.domains};
 if(/^[0-9a-f-]{36}$/.test(setup.jobId||''))decision=await json(path.join(output,'manager/setup-jobs',setup.jobId,'decisions.json'));
 const {manifest,files}=createFoundationPack({draft,plan,decision,request:{id:setup.jobId,projectName:setup.projectName,inputRevision:setup.inputRevision,interfaceDetails:setup.interfaceDetails}});
 const staging=await localDirectory(workspace,`workspace/output/${slug}/manager/pack-staging/${randomUUID()}`);await localDirectory(workspace,`workspace/output/${slug}/foundations`);
 for(const [i,[,body]]of files.entries())await writeFile(path.join(staging,i+'.tmp'),body);
 if(!bytes.equals(await readFile(path.join(output,'foundations.json')))||(await snapshotInputs(workspace,setup.inputSlug||slug)).hash!==snapshot.hash)throw new Error('Source changed while staging foundation artifacts.');
 for(const [i,[name]]of files.entries())await rename(path.join(staging,i+'.tmp'),path.join(output,name));
 await verifyFoundationPack(output,draft);
 console.log(JSON.stringify({sourceUnchanged:true,draftHash:createHash('sha256').update(bytes).digest('hex'),revision:draft.revision,pairs:manifest.entries.length,files:files.length,elapsedMs:Math.round(performance.now()-started)}));
}catch(error){console.error(error.message);process.exitCode=1;}
