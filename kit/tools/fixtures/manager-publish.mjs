import { mkdtemp, mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createManagerServer } from '../../manager/server.mjs';
import { colors, values, effects } from '../../web/scripts/chrome-fallbacks.mjs';

// A real subprocess with the Codex argv/stdin contract; never invokes Codex or Figma.
export const fakeAgent = `
const fs = require('node:fs/promises'), path = require('node:path');
(async () => {
  let prompt=''; for await (const c of process.stdin) prompt+=c;
  const result=process.argv[process.argv.indexOf('--output-last-message')+1];
  const r=JSON.parse(await fs.readFile(path.join(path.dirname(result),'request.json'),'utf8'));
  const mode=await fs.readFile(path.join(r.outputDir,'fake-mode'),'utf8').catch(()=> 'success');
  await fs.writeFile(path.join(r.outputDir,'received-prompt'),prompt);
  if(mode==='hang') { setInterval(()=>{},1000); return; }
  await new Promise(resolve=>setTimeout(resolve, mode==='slow' ? 2000 : 60));
  if(mode==='blocked') { await fs.writeFile(result,JSON.stringify({status:'blocked',message:'Connect the Figma authoring MCP in your local agent.'})); return; }
  if(mode==='fail') process.exit(2);
  if(mode!=='empty') {
    const draft=JSON.parse(await fs.readFile(path.join(r.outputDir,'foundations.json'),'utf8'));
    if(mode==='different-value')draft.variables[0].values.Value='#ff0000';
    if(mode==='different-alias')draft.variables[1].values.Light='#ffffff';
    await fs.mkdir(path.join(r.outputDir,'figma'),{recursive:true});
    await fs.writeFile(path.join(r.outputDir,'figma/figma-variables.json'),JSON.stringify({...draft,format:'ds-create/figma-variables@1'}));
    const l=JSON.parse(await fs.readFile(path.join(r.outputDir,'ds-create-ledger.json'),'utf8'));
    l.sequence=l.sequence.map(e=>({...e,status:'done'})); l.tokens={audit:{fail:0,file:'figma/audit-file.json'}};
    l.foundationReview.figmaHash=r.hash;
    await fs.writeFile(path.join(r.outputDir,'ds-create-ledger.json'),JSON.stringify(l));
    if(mode!=='no-audit') await fs.writeFile(path.join(r.outputDir,'figma/audit-file.json'),JSON.stringify({mode:'file',sourceHash:r.hash,result:{fail:0},simulation:true}));
  }
  await fs.writeFile(result,JSON.stringify({status:'completed',message:'Simulated foundation output.'}));
})();`;
export async function publishFixture({ mode = 'success', timeoutMs = 10000 } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-publish-test-'));
  const output = path.join(root, 'workspace/output/fixture');
  await mkdir(path.join(output, 'manager'), { recursive: true });
  await mkdir(path.join(root, 'workspace/input/fixture/answers'), { recursive: true });
  await writeFile(path.join(root, 'workspace/input/fixture/answers/01-init.md'), 'Synthetic test answers; Web.');
  await cp(fileURLToPath(new URL('../../manager/', import.meta.url)), path.join(output, 'manager'), { recursive: true });
  await cp(fileURLToPath(new URL('../../web/src/styles/docs-presentation.css', import.meta.url)), path.join(output, 'manager/docs-presentation.css'));
  await writeFile(path.join(output, 'manager/chrome.css'), ':root{'+[...colors,...values,...effects].map(([k,v])=>k+':'+v+';').join('')+'}');
  await writeFile(path.join(output, 'foundations.json'), JSON.stringify({ format:'ds-create/foundations@1',revision:1,collections:[{name:'Primitives',modes:['Value']},{name:'Color',modes:['Light']}],variables:[
    {name:'palette/base/white',collection:'Primitives',type:'COLOR',values:{Value:'#ffffff'}},
    {name:'color/surface/base',collection:'Color',type:'COLOR',values:{Light:{alias:'palette/base/white'}}}],textStyles:[],effectStyles:[] }));
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify({system:'Synthetic publish fixture',preview:true,scope:{productType:'Web'},sequence:[1,2,3,4].map(step=>({step,status:step===1?'done':'todo'})),foundationReview:{status:'pending'}}));
  const program=path.join(root,'fake-agent.cjs'); await writeFile(program,fakeAgent);
  await writeFile(path.join(output,'fake-mode'),mode);
  const jobsOptions={agentCommand:process.execPath,agentPrefixArgs:[program],simulation:true,timeoutMs};
  const { server, jobs }=createManagerServer({outputDir:output,workspace:root,jobsOptions});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const flow=()=>fetch(url+'/api/publish-flow').then(r=>r.json());
  const initial=await flow();
  const headers={'Content-Type':'application/json',Origin:url,'X-DS-Create-Token':initial.csrfToken};
  const post=(endpoint,body,override={})=>fetch(url+endpoint,{method:'POST',headers:{...headers,...override},body:JSON.stringify(body)});
  return {root,output,url,jobs,flow,post,initial,jobsOptions,async cleanup(){await jobs.shutdown().catch(()=>{});await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}};
}
