#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile, rename, open, unlink, realpath, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { colors, values, effects } from '../web/scripts/chrome-fallbacks.mjs';
import { foundations, getState, readJSON } from '../manager/state.mjs';
import { observedSetup } from '../manager/setup-observation.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = k => args.includes(k) ? args[args.indexOf(k) + 1] : undefined;
const command = args[0];
let slug = arg('--slug');
const workspace = path.resolve(arg('--workspace') || ROOT);
const usage = 'node kit/tools/manager.mjs init-web|sessions|start|status|stop|progress [--slug {slug}] [--foundation color --status generating --message "…"]';

async function activeRuntime(dir) {
  const runtime = await readJSON(path.join(dir, 'runtime.json'));
  if (!runtime || !/^http:\/\/127\.0\.0\.1:\d+$/.test(runtime.url)) return null;
  try {
    const r = await fetch(`${runtime.url}/api/health`, { signal: AbortSignal.timeout(800) });
    const health = await r.json();
    return health.service === 'ds-create-manager' && health.instance === runtime.instance && health.pid === runtime.pid && health.outputDir === path.dirname(dir) ? runtime : null;
  } catch { return null; }
}

async function main() {
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('DS Create Builder requires Node 20 or later.');
  if(command==='sessions'||command==='init-web'&&!slug&&!args.includes('--new')){
    const sessions=[];
    for(const entry of await readdir(path.join(workspace,'workspace/output'),{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;})){
      if(!entry.isDirectory()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name))continue;
      const output=path.join(workspace,'workspace/output',entry.name),setup=await observedSetup(output);
      const ledger=await readJSON(path.join(output,'ds-create-ledger.json'));
      if(!setup&&!ledger)continue;
      sessions.push({slug:entry.name,name:setup?.projectName||ledger?.system||entry.name,status:setup?.status||'initialized',resumeCommand:`ds-create init-web --slug ${entry.name}`});
    }
    sessions.sort((a,b)=>a.slug.localeCompare(b.slug));
    if(command==='sessions'||sessions.length){console.log(JSON.stringify({action:command==='sessions'?'list':'choose-session',sessions,newCommand:'ds-create init-web --new'},null,2));return;}
  }
  if(command==='init-web'&&!slug)slug=`session-${randomUUID()}`;
  if (!['init-web', 'start', 'status', 'stop', 'progress'].includes(command) || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(usage);
  let output = path.join(workspace, 'workspace/output', slug);
  let dir = path.join(output, 'manager');
  const writes = ['init-web', 'start', 'progress'].includes(command);
  if (writes) await mkdir(output, { recursive: true });
  // Keep each selected output isolated, including workspaces that contain symlinks.
  try {
    const base = await realpath(path.join(workspace, 'workspace/output'));
    output = await realpath(output);
    if (output !== path.join(base, slug)) throw new Error('Manager output must stay inside the selected system folder.');
    dir = path.join(output, 'manager');
    if (writes) await mkdir(dir, { recursive: true });
    if (await realpath(dir) !== path.join(base, slug, 'manager')) throw new Error('Manager output must stay inside the selected system folder.');
  } catch (e) { if (e.code !== 'ENOENT' || writes) throw e; }
  if (command === 'progress') {
    const id = arg('--foundation');
    const status = arg('--status');
    if (!foundations.some(f => f.id === id) || !['pending', 'generating', 'ready', 'error', 'skipped'].includes(status)) throw new Error('Provide a foundation id and pending|generating|ready|error|skipped.');
    const progressFile = path.join(dir, 'progress.json');
    const progress = await readJSON(progressFile) || { foundations: {} };
    progress.foundations ||= {};
    progress.foundations[id] = { status, message: arg('--message') || '', updated: new Date().toISOString() };
    await writeFile(`${progressFile}.tmp`, JSON.stringify(progress, null, 2) + '\n');
    await rename(`${progressFile}.tmp`, progressFile);
    console.log(`${id}: ${status}`);
    return;
  }
  if (command === 'init-web' && !await readJSON(path.join(dir, 'setup.json')) && !await readJSON(path.join(output, 'ds-create-ledger.json'))) {
    try { await accessDraft(); } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      await writeFile(path.join(dir, 'setup.json'), JSON.stringify({ format: 'ds-create/setup@1', status: 'empty', fastMode: true, created: new Date().toISOString() }, null, 2) + '\n', { flag: 'wx' });
    }
  }
  async function accessDraft() { await readFile(path.join(output, 'foundations.json')); }
  const active = await activeRuntime(dir);
  if (command === 'status') {
    const state = await getState(output);
    const pointer = await readJSON(path.join(dir, 'figma-job.json'));
    const job = /^[0-9a-f-]{36}$/.test(pointer?.id || '') ? await readJSON(path.join(dir, 'jobs', pointer.id, 'status.json')) : null;
    console.log(JSON.stringify({ running: !!active, url: active?.url || null, status: state.status, initDone: state.initDone, source: state.source, setup: state.setup,
      publishJob: job ? { id: job.id, status: job.status, message: job.message } : null, ...state.summary }, null, 2));
    return;
  }
  if (command === 'stop') {
    if (active) {
      process.kill(active.pid, 'SIGTERM');
      for (let i = 0; i < 30 && await activeRuntime(dir); i++) await new Promise(r => setTimeout(r, 100));
      if (await activeRuntime(dir)) throw new Error('Manager has not stopped yet. Retry stop.');
    }
    console.log('DS Create Builder stopped.');
    return;
  }
  if (active) { console.log(JSON.stringify({ ...active, reused: true })); return; }
  const port = Number(arg('--port') || 0);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer from 0 to 65535.');
  await cp(path.join(ROOT, 'kit/manager'), dir, { recursive: true });
  await cp(path.join(ROOT, 'kit/web/src/styles/docs-presentation.css'), path.join(dir, 'docs-presentation.css'));
  // The same chrome defaults as web docs; these are viewer styles, never brand token data.
  const declarations = [...colors, ...values, ...effects].map(([name, value]) => `  ${name}: ${value};`).join('\n');
  await writeFile(path.join(dir, 'chrome.css'), `/* Generated from kit/web/scripts/chrome-fallbacks.mjs. */\n:root {\n${declarations}\n}\n`);
  try { await unlink(path.join(dir, 'runtime.json')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const log = await open(path.join(dir, 'server.log'), 'a');
  const child = spawn(process.execPath, [path.join(dir, 'server.mjs'), String(port)], { detached: true, stdio: ['ignore', log.fd, log.fd] });
  await log.close();
  let spawnError;
  let exited = false;
  child.on('error', e => { spawnError = e; });
  child.on('exit', () => { exited = true; });
  child.unref();
  for (let i = 0; i < 50; i++) {
    if (spawnError) throw spawnError;
    if (exited) throw new Error(`Manager did not start. Check ${path.join(dir, 'server.log')}.`);
    const runtime = await activeRuntime(dir);
    if (runtime?.pid === child.pid) { console.log(JSON.stringify({ ...runtime, reused: false })); return; }
    await new Promise(r => setTimeout(r, 100));
  }
  if (child.pid) { try { process.kill(child.pid, 'SIGTERM'); } catch { /* child already exited */ } }
  throw new Error(`Manager did not start. Check ${path.join(dir, 'server.log')}.`);
}
main().catch(e => { console.error(`manager: ${e.message}`); process.exitCode = 1; });
