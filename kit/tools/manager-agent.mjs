#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {realpath} from 'node:fs/promises';
import {linkChat,queueChatJob,chatJobStatus,chatAction} from '../manager/agent-bridge.mjs';
import {figmaPrompt} from '../manager/figma-prompt.mjs';
const args=process.argv.slice(2),command=args[0];
const arg=k=>args.includes(k)?args[args.indexOf(k)+1]:undefined;
try {
 const workspace=await realpath(arg('--workspace')||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'));
 const slug=arg('--slug');if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug||''))throw new Error('Provide --slug {saved session id}.');
 const outputDir=path.join(workspace,'workspace/output',slug);
 if(await realpath(outputDir)!==outputDir||await realpath(path.join(outputDir,'manager'))!==path.join(outputDir,'manager'))throw new Error('Session must stay in its selected workspace.');
 const id=arg('--job');let result;
 if(command==='link')result=await linkChat({outputDir,workspace,terminal:arg('--terminal'),command:arg('--orca')||'orca'});
 else if(command==='status'){
  result=await chatJobStatus(outputDir,workspace,id);
  result.instructions=figmaPrompt(result.request,path.join(outputDir,'manager/jobs',id,'request.json'));
 }else if(command==='resume')result=await queueChatJob({outputDir,workspace,id});
 else if(['claim','update','report'].includes(command))result=await chatAction({outputDir,workspace,id,attempt:arg('--attempt'),actor:arg('--actor'),action:command,message:arg('--message'),outcome:arg('--outcome')});
 else throw new Error('Use link|status|resume|claim|update|report with --slug.');
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error('manager-agent: '+e.message);process.exitCode=1;}
