import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '../kit/web/node_modules/playwright/index.mjs';
import {Client} from '../kit/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import {StdioClientTransport} from '../kit/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import {setupFixture} from './fixtures/manager-setup.mjs';
import {decisions} from './fixtures/preparation-decisions.mjs';

// Requirement -> execution -> observable evidence:
// A real Prepare foundations click queues the saved input; an already pending
// main-client tool receives that event; the SAME client claims, compiles and
// finishes a validated local draft. A queued state alone must never pass.
// The browser and MCP client are controlled fixtures. This does not certify
// that an ended chat can be woken by Node in a particular model host.
const chrome=process.env.DS_CREATE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
test('browser Prepare foundations click reaches the same MCP client and produces a reviewable draft',
 {skip:!existsSync(chrome)&&!existsSync(chromium.executablePath())?'No Chromium executable is available':false},async t=>{
  const f=await setupFixture({autoRun:false,preparationVersion:2});
  t.after(()=>f.cleanup());
  const browser=await chromium.launch({executablePath:existsSync(chrome)?chrome:chromium.executablePath(),headless:true});
  t.after(()=>browser.close());
  const agent=new Client({name:'same-main-agent-fixture',version:'1.0.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../kit/mcp/server.mjs',import.meta.url)),'--workspace',f.root]});
  await agent.connect(transport);
  t.after(()=>agent.close());
  const call=async(name,args)=>{
   const result=await agent.callTool({name,arguments:args});
   assert.notEqual(result.isError,true,result.content?.[0]?.text);
   return result.structuredContent;
  };
  const page=await browser.newPage(),failedResources=[],pageErrors=[];
  page.on('response',response=>{if(response.url().startsWith(f.url)&&response.status()>=400&&!response.url().endsWith('/favicon.ico'))failedResources.push(response.url());});
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(f.url);
  const pending=call('ds_create_prepare_wait',{session:'fixture'});
  await page.locator('#worker-connection[data-state="connected"]').waitFor({timeout:10000});
  assert.equal(await page.locator('#worker-connection-label').innerText(),'Connected');
  assert.match(await page.locator('#worker-status-connected').getAttribute('class'),/bg-fill-success-subtle/);

  await page.locator('#setup-project-name').fill('Browser Click Design System');
  await page.locator('#setup-context').fill('A synthetic web product with Inter, product actions, and a neutral palette.');
  await page.locator('#setup-next').click();
  await page.locator('#setup-modes input[value="Light"]').check();
  await page.locator('#setup-devices input[value="Web"]').check();
  const request=page.waitForResponse(r=>r.url().endsWith('/api/setup-submit')&&r.request().method()==='POST');
  await page.locator('#setup-submit').click();
  assert.equal((await request).status(),202);
  const event=await pending,queued=await f.flow();
  assert.equal(event.job_id,queued.jobId);
  assert.equal(queued.status,'queued','click alone does not complete preparation');
  assert.equal(queued.projectName,'Browser Click Design System');
  await page.locator('#preparation-status').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.getElementById('preparation-status')?.textContent==='Queued');
  assert.equal(await page.locator('#preparation-status').innerText(),'Queued');

  const claim=await call('ds_create_prepare',{session:'fixture'});
  assert.equal(claim.job_id,event.job_id);
  assert.equal(claim.attempt,event.event_id);
  await call('ds_create_prepare_progress',{session:'fixture',job_id:claim.job_id,attempt:claim.attempt,lease:claim.lease,stage:'decisions',message:'Reading saved browser context.'});
  const dir=path.join(f.output,'manager/setup-jobs',claim.job_id);
  const [req,pack]=await Promise.all(['request.json','source-pack.json'].map(async name=>JSON.parse(await readFile(path.join(dir,name),'utf8'))));
  assert.match(pack.sources.map(s=>s.path).join(' '),/browser-click-design-system|chat\//);
  await writeFile(path.join(dir,'decisions.json'),JSON.stringify(decisions(req,pack)));
  const credentials={session:'fixture',job_id:claim.job_id,attempt:claim.attempt,lease:claim.lease};
  const compiled=await call('ds_create_prepare_compile',credentials);
  assert.ok(compiled.counts.variables>0);
  const result=await call('ds_create_prepare_finish',{...credentials,outcome:'ready',message:'Foundation draft prepared for review.'});
  assert.equal(result.status,'ready');
  await page.waitForFunction(()=>document.getElementById('preparation-status')?.textContent==='Ready for review',null,{timeout:10000});
  await page.locator('[data-show-preparation]').first().click();
  await page.locator('#preparation-status').waitFor({state:'visible'});
  assert.equal(await page.locator('#preparation-status').innerText(),'Ready for review');
  assert.equal(await page.locator('#preparation-tasks li[data-task-status="complete"]').count(),4);
  assert.equal((await f.flow()).status,'ready');
  await page.locator('#worker-connection[data-state="ready"]').waitFor({timeout:10000});
  assert.equal(await page.locator('#worker-work-summary').innerText(),'No changes needed');
  assert.equal(await page.getByRole('region',{name:'Agent status'}).locator('strong').first().innerText(),'Agent status');
  assert.equal(await page.locator('#worker-recheck').isVisible(),true);
  assert.equal(await page.locator('#worker-connection-label').innerText(),'Not connected');
  assert.equal(await page.locator('#worker-status-idle [data-anatomy=label]').innerText(),'Not connected');
  assert.match(await page.locator('#worker-status-idle').getAttribute('class'),/bg-fill-neutral-subtle/);
  assert.match(await page.locator('#worker-work-summary').getAttribute('class'),/bg-fill-neutral-subtle/);
  assert.equal(await page.locator('#worker-connection').getAttribute('data-connection'),'idle');
  assert.equal(await page.locator('#worker-details').isVisible(),false);
  assert.equal(await page.locator('#worker-recovery').isVisible(),false);
  assert.equal(await page.locator('#worker-spawn-prompt').inputValue(),'');
  await page.locator('#worker-details-toggle').click();
  await page.locator('#worker-details').waitFor({state:'visible'});
  const motion = await page.evaluate(() => {
    const details = document.getElementById('worker-details');
    const animation = details.getAnimations()[0];
    if (!animation) return null;
    animation.pause();
    const duration = animation.effect.getTiming().duration;
    animation.currentTime = duration / 2;
    return { duration, height: details.getBoundingClientRect().height, fullHeight: details.scrollHeight };
  });
  assert.ok(motion?.duration > 0 && motion.height > 0 && motion.height < motion.fullHeight, 'details visibly expands over time');
  await page.screenshot({path:'/tmp/ds-create-details-motion.png'});
  await page.evaluate(() => document.getElementById('worker-details').getAnimations().forEach(a => a.finish()));
  assert.match(await page.locator('#worker-connection-detail').innerText(),/No preparation changes needed/);
  assert.equal(await page.locator('#worker-tasks').count(),0,'connection panel must not duplicate preparation progress');
  assert.equal(await page.locator('#worker-details').isVisible(),true,'status checks preserve the user disclosure choice');
  await page.locator('#worker-details-toggle').click();
  assert.equal(await page.evaluate(() => document.getElementById('worker-details').getAnimations().length > 0),true,'details animates closed');
  await page.locator('#worker-details').waitFor({state:'hidden'});
  const rapid = await page.evaluate(() => {
    const toggle = document.getElementById('worker-details-toggle'), details = document.getElementById('worker-details');
    toggle.click(); toggle.click(); toggle.click();
    details.getAnimations().forEach(a => a.finish());
    return toggle.getAttribute('aria-expanded');
  });
  assert.equal(rapid,'true','rapid toggles keep the latest state');
  await page.locator('#worker-details').waitFor({state:'visible'});
  await page.locator('#worker-details-toggle').click();
  await page.locator('#worker-details').waitFor({state:'hidden'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#worker-details-toggle').click();
  assert.equal(await page.evaluate(() => document.getElementById('worker-details').getAnimations().length),0,'reduced motion opens immediately');
  assert.equal(await page.locator('#worker-details').isVisible(),true);
  await page.locator('#worker-details-toggle').click();
  assert.equal(await page.locator('#worker-details').isVisible(),false,'reduced motion closes immediately');
  await page.emulateMedia({reducedMotion:'no-preference'});
  const readyStatus = await fetch(f.url+'/api/worker').then(r=>r.json());
  await page.route('**/api/worker', route => route.fulfill({json:{...readyStatus, connected:true, recoveryPrompt:null}}));
  await page.locator('#worker-details-toggle').click();
  await page.locator('#worker-recheck').click();
  await page.waitForFunction(()=>!document.getElementById('worker-status-connected').hidden,null,{timeout:10000});
  assert.equal(await page.locator('#worker-work-summary').innerText(),'No changes needed');
  assert.equal(await page.locator('#worker-recovery').isVisible(),false);
  await page.unroute('**/api/worker');
  await page.locator('#worker-details-toggle').click();
  await page.locator('#worker-details').waitFor({state:'hidden'});
  await page.screenshot({path:'/tmp/ds-create-completed-collapsed.png',animations:'disabled'});
  if(process.env.DS_CREATE_BROWSER_SCREENSHOT){
   await page.screenshot({path:process.env.DS_CREATE_BROWSER_SCREENSHOT,fullPage:true});
  }
  const ledger=JSON.parse(await readFile(path.join(f.output,'ds-create-ledger.json'),'utf8'));
  assert.equal(ledger.foundationReview.status,'pending');
  assert.ok((await readFile(path.join(f.output,'foundations.json'),'utf8')).length>100);
  assert.equal((await fetch(f.url+'/api/state').then(r=>r.json())).initDone,false);
  assert.deepEqual(pageErrors,[],'client modules load without errors');
  assert.deepEqual(failedResources,[],'client/shared modules, styles and assets stay publicly loadable');
  const worker=()=>fetch(f.url+'/api/worker').then(r=>r.json());
  assert.equal((await worker()).preparationState,'ready');
  assert.equal((await worker()).recoveryPrompt,null);
  const draftPath=path.join(f.output,'foundations.json'),saved=await readFile(draftPath,'utf8');
  await writeFile(draftPath,'{}');
  assert.equal((await worker()).preparationState,'outdated','corrupt saved evidence cannot claim up to date');
  await writeFile(draftPath,saved);
  const sourcePath=path.join(f.root,'workspace/input',req.inputSlug,req.contextFile);
  await writeFile(sourcePath,(await readFile(sourcePath,'utf8'))+'\nChanged brief.');
  assert.equal((await worker()).preparationState,'outdated','changed sources must reopen attention');
  await page.locator('#worker-connection[data-state="attention"]').waitFor();
  assert.equal(await page.locator('#worker-details').isVisible(),true);
  assert.equal(await page.locator('#worker-recovery').isVisible(),false,'changed sources require Context, not a reconnect loop');
 });

test('expired receiver shows a prominent continuation panel, while a connected receiver stays compact',
 {skip:!existsSync(chrome)&&!existsSync(chromium.executablePath())?'No Chromium executable is available':false},async t=>{
  const {waitForPreparation}=await import('../kit/manager/server/setup.mjs');
  const f=await setupFixture({autoRun:false,preparationVersion:2});t.after(()=>f.cleanup());
  const browser=await chromium.launch({executablePath:existsSync(chrome)?chrome:chromium.executablePath(),headless:true});t.after(()=>browser.close());
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await waitForPreparation({workspace:f.root,session:'fixture',timeoutMs:70})).event,'wait-expired');
  await page.goto(f.url);await page.locator('#setup-explore').click();
  await page.waitForFunction(()=>document.getElementById('worker-connection-detail').textContent.includes('5-minute wait ended'));
  const panel=page.locator('#worker-connection'),prompt=page.locator('#worker-spawn-prompt');
  assert.equal(await panel.getAttribute('data-state'),'disconnected');
  assert.equal(await page.locator('#worker-status-disconnected').isVisible(),true);
  assert.match(await page.locator('#worker-status-disconnected').getAttribute('class'),/bg-fill-warning-subtle/);
  assert.equal(await page.locator('#worker-copy-prompt').isVisible(),true);
  await page.locator('#worker-copy-prompt').click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await prompt.inputValue());
  assert.match(await prompt.inputValue(),/Continue preparing foundations/);
  assert.match(await prompt.inputValue(),/--slug fixture/);
  for(const [name,width,height,theme] of [['light-desktop',1280,900,'light'],['dark-desktop',1280,900,'dark'],['light-mobile',390,844,'light'],['dark-mobile',390,844,'dark']]){
   await page.setViewportSize({width,height});
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   const visual=await panel.evaluate(el=>{
    const s=getComputedStyle(el),r=el.getBoundingClientRect(),body=getComputedStyle(document.getElementById('worker-connection-detail'));
    return {border:s.borderTopColor,warning:s.getPropertyValue('--manager-warning').trim(),fontSize:body.fontSize,x:r.x,right:r.right,width:innerWidth};
   });
   assert.equal(visual.fontSize,'14px');assert.ok(visual.x>=0&&visual.right<=visual.width);
   await page.mouse.move(0,0);
   await page.screenshot({path:`/tmp/ds-create-recovery-${name}.png`,animations:'disabled'});
  }
  await page.setViewportSize({width:1280,height:900});
  const controller=new AbortController(),waiting=waitForPreparation({workspace:f.root,session:'fixture',signal:controller.signal});
  const cancelled=assert.rejects(waiting,/abort/i);t.after(()=>controller.abort());
  await new Promise(resolve=>setTimeout(resolve,60));
  await page.locator('#worker-connection[data-state="connected"]').waitFor();
  assert.equal(await page.locator('#worker-connection-label').innerText(),'Connected');
  assert.match(await page.locator('#worker-status-connected').getAttribute('class'),/bg-fill-success-subtle/);
  assert.equal(await page.locator('#worker-recovery').isVisible(),false);
  assert.equal(await page.locator('#worker-connection-detail').isVisible(),false);
  await page.screenshot({path:'/tmp/ds-create-recovery-connected.png',animations:'disabled'});
  controller.abort();await cancelled;
  assert.deepEqual(errors,[]);
 });
