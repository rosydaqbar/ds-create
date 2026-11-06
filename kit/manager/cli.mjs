#!/usr/bin/env node
import {cp, mkdir, open, readFile, readdir, realpath, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {colors, effects, values} from '../web/scripts/chrome-fallbacks.mjs';
import {foundations, getState, observedSetup, readJSON} from './server/state.mjs';
import {writeFigmaSetting} from './server/settings.mjs';


const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const arg = k => args.includes(k) ? args[args.indexOf(k) + 1] : undefined;
const command = args[0];
let slug = arg('--slug');
const workspace = path.resolve(arg('--workspace') || ROOT);
const usage = 'node kit/manager/cli.mjs init-web|sessions|start|status|stop|progress|wait|publish|retry|fonts|parts|tokens|approve|compare|check-site [--slug {slug}] [--site path] [--out path] [--foundation color --status generating --message "…"] [--figma URL] [--choice role=Family] [--no-figma]\n       node kit/manager/cli.mjs mcp tools|{tool} [--json \'{…}\' | --json-file args.json]\n       node kit/manager/cli.mjs mcp-host start|status|stop';

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
  // Same DS Create MCP tools for agents whose session has no ds_create_* tools loaded (kit/mcp/host.mjs).
  if (command === 'mcp' || command === 'mcp-host') {
    const host = await import('../mcp/host-client.mjs');
    const sub = args[1];
    if (command === 'mcp-host') {
      if (!['start', 'status', 'stop'].includes(sub)) throw new Error(usage);
      const record = sub === 'status' ? await host.hostRecord(workspace) : null;
      console.log(JSON.stringify(sub === 'start' ? await host.startHost(workspace) : sub === 'stop' ? await host.stopHost(workspace) : { running: !!record, url: record?.url || null, pid: record?.pid || null }));
      return;
    }
    if (!sub) throw new Error(usage);
    const controller = new AbortController(), stop = () => controller.abort();
    process.once('SIGTERM', stop); process.once('SIGINT', stop);
    if (sub === 'tools') { console.log(JSON.stringify((await host.callHost(workspace, '/tools', undefined, controller.signal)).tools, null, 2)); return; }
    const file = arg('--json-file');
    const input = file ? await readFile(file, 'utf8') : arg('--json') || '{}';
    let toolArgs;
    try { toolArgs = JSON.parse(input); } catch { throw new Error('--json / --json-file must hold one JSON object of tool arguments.'); }
    const r = await host.callHost(workspace, '/call', { name: sub, arguments: toolArgs }, controller.signal);
    const text = r.content?.map(c => c.text).filter(Boolean).join('\n') || '';
    if (r.isError) { console.error(text || 'Tool call failed.'); process.exitCode = 1; return; }
    console.log(r.structuredContent ? JSON.stringify(r.structuredContent, null, 2) : text);
    return;
  }
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
  if (!['init-web', 'start', 'status', 'stop', 'progress', 'wait', 'publish', 'retry', 'fonts', 'parts', 'tokens', 'approve', 'compare', 'check-site'].includes(command) || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(usage);
  if (command === 'wait') {
    const { waitForPreparation } = await import('./server/setup.mjs');
    const controller = new AbortController(), stop = () => controller.abort();
    process.once('SIGTERM', stop); process.once('SIGINT', stop);
    try { console.log(JSON.stringify(await waitForPreparation({workspace,session:slug,signal:controller.signal,afterEvent:arg('--after-event')}))); }
    finally { process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop); }
    return;
  }
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
  // The site's token file from the local files; works without a running Builder. Figma page ids come along when
  // a Figma export exists, so "Open in Figma" links work.
  if (command === 'tokens') {
    const out = arg('--out');
    if (!out) throw new Error('Give the file to write with --out path.');
    const { toTokenExport } = await import('./foundations/export.mjs');
    const { readParts, PART_FORMAT } = await import('./parts/files.mjs');
    const draft = await readJSON(path.join(output, 'foundations.json'));
    if (!draft) throw new Error(`No saved foundations for ${slug}.`);
    const { partStatus } = await import('./parts/files.mjs');
    const saved = await readParts(output), stale = Object.values(saved).find(p => partStatus(p, draft, saved) !== 'ready');
    // A Part built on older foundations could point at names that are gone; prepare it first.
    if (stale) throw new Error(`${stale.name} is outdated; prepare it again before writing tokens.`);
    const parts = Object.fromEntries(Object.entries(saved).filter(([, p]) => p.format === PART_FORMAT));
    const figma = await readJSON(path.join(output, 'figma/figma-variables.json'));
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await writeFile(path.resolve(out), JSON.stringify(toTokenExport(draft, parts, { pages: figma?.pages }), null, 2) + '\n');
    console.log(JSON.stringify({ written: path.resolve(out), parts: Object.keys(parts) }));
    return;
  }
  // Is Figma behind the local files? Compares the saved Figma export with foundations.json plus the Part tokens.
  // Exit 1 when it differs or there is no export to compare.
  if (command === 'compare') {
    const { compareFoundations } = await import('./foundations/compare.mjs');
    const { withParts } = await import('./foundations/baseline.mjs');
    const { readParts } = await import('./parts/files.mjs');
    const draft = await readJSON(path.join(output, 'foundations.json')), figma = await readJSON(path.join(output, 'figma/figma-variables.json'));
    if (!draft) throw new Error(`No saved foundations for ${slug}.`);
    if (!figma) { console.log(JSON.stringify({ match: null, reason: 'No Figma export yet: figma/figma-variables.json is missing.' })); process.exitCode = 1; return; }
    const local = withParts(draft, await readParts(output)), { differences } = compareFoundations(local, figma);
    // Figma keeps Part tokens the files dropped (a removed size, a deleted Part); those are differences too.
    const names = new Set(local.variables.map(v => v.name));
    for (const v of figma.variables || []) if (v.collection === 'Components' && !names.has(v.name)) differences.push(`Extra in Figma: ${v.name}`);
    const match = !differences.length;
    console.log(JSON.stringify({ match, differences }));
    if (!match) process.exitCode = 1;
    return;
  }
  // What the docs site's components still have to change to match the part files (workflow/WEB.md W4).
  // Exit 1 when a page needs changes.
  if (command === 'check-site') {
    const { checkSite } = await import('./parts/site-check.mjs');
    const { readParts, PART_FORMAT } = await import('./parts/files.mjs');
    const site = path.resolve(arg('--site') || path.join(output, 'web')), dir = path.join(site, 'src/components');
    const files = await readdir(dir, { recursive: true }).catch(e => { if (e.code === 'ENOENT') throw new Error(`No site components at ${dir}. Copy kit/web first (workflow/WEB.md W1).`); throw e; });
    const sources = await Promise.all(files.filter(f => f.endsWith('.tsx')).map(async f => ({ file: f, text: await readFile(path.join(dir, f), 'utf8') })));
    const parts = Object.fromEntries(Object.entries(await readParts(output)).filter(([, p]) => p.format === PART_FORMAT));
    const pages = checkSite(parts, sources);
    console.log(JSON.stringify({ ok: !pages.length, pages }, null, 2));
    if (pages.length) process.exitCode = 1;
    return;
  }
  // --no-figma keeps this session out of Figma (ledger flags.figma); Builder's Use Figma switch can turn it back on.
  if (command === 'init-web' && args.includes('--no-figma')) await writeFigmaSetting(output, false);
  // The user decides; the agent carries out the matching Builder action through the running Builder.
  if (['publish', 'retry', 'fonts', 'parts', 'approve'].includes(command)) {
    const runtime = await activeRuntime(dir);
    if (!runtime) throw new Error('DS Create Builder is not running for this session. Run init-web --slug first.');
    const get = async route => { const r = await fetch(runtime.url + route, { cache: 'no-store' }); if (!r.ok) throw new Error(`${route}: ${r.status}`); return r.json(); };
    const post = async (route, body, token) => {
      const r = await fetch(runtime.url + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: runtime.url, 'X-DS-Create-Token': token }, body: JSON.stringify(body) });
      const result = await r.json().catch(() => ({})); if (!r.ok) throw new Error(result.error || `${route}: ${r.status}`); return result;
    };
    if (command === 'publish') {
      // Queues the reviewed revision exactly like Publish to Figma; run it only after the user approved that revision and file.
      const flow = await get('/api/publish-flow'), figmaUrl = arg('--figma') || flow.figma.url;
      if (!figmaUrl) throw new Error('Give the approved Figma file with --figma URL.');
      if (flow.figma.reason) throw new Error(flow.figma.reason);
      console.log(JSON.stringify(await post('/api/publish-figma', { hash: flow.figma.hash, figmaUrl }, flow.csrfToken)));
    } else if (command === 'approve') {
      // Approves the saved foundations exactly as Builder's button does; run it only after the user approved them.
      const s = await get('/api/state');
      console.log(JSON.stringify(await post('/api/foundations-approve', { hash: s.source?.hash }, s.csrfToken)));
    } else if (command === 'parts') {
      const s = await get('/api/state');
      console.log(JSON.stringify(await post('/api/parts-prepare', { ids: arg('--ids') ? arg('--ids').split(',') : (s.parts || []).map(p => p.id) }, s.csrfToken)));
    } else if (command === 'retry') {
      const flow = await get('/api/setup-flow');
      console.log(JSON.stringify(await post('/api/setup-retry', {}, flow.csrfToken)));
    } else {
      const flow = await get('/api/publish-flow'), roles = flow.job?.status === 'needs-fonts' ? flow.job.fonts || [] : [];
      if (!roles.length) throw new Error('No font check is waiting for a choice.');
      const picked = Object.fromEntries(args.flatMap((a, i) => a === '--choice' ? [args[i + 1].split('=')] : []).map(([role, ...family]) => [role, family.join('=')]));
      console.log(JSON.stringify(await post('/api/publish-fonts', { choices: roles.map(r => ({ role: r.role, family: picked[r.role] || r.family })) }, flow.csrfToken)));
    }
    return;
  }
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
    console.log(JSON.stringify({ running: !!active, url: active?.url || null, status: state.status, initDone: state.initDone, source: state.source, buildGate: state.buildGate, setup: state.setup,
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
  // Reuse the session's last port so the Builder link stays the same across restarts.
  const saved = Number((await readJSON(path.join(dir, 'port.json')))?.port) || 0, port = Number(arg('--port') || saved);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer from 0 to 65535.');
  await cp(path.join(ROOT, 'kit/manager'), dir, { recursive: true, filter: source => !['cli.mjs', 'README.md'].includes(path.relative(path.join(ROOT, 'kit/manager'), source)) });
  await cp(path.join(ROOT, 'kit/web/src/styles/docs-presentation.css'), path.join(dir, 'docs-presentation.css'));
  // Builder draws Parts with the site's own token rules (server/stage.mjs).
  await mkdir(path.join(dir, 'web/scripts'), { recursive: true });
  for (const file of ['token-model.mjs', 'chrome-fallbacks.mjs']) await cp(path.join(ROOT, 'kit/web/scripts', file), path.join(dir, 'web/scripts', file));
  // The same chrome defaults as web docs; these are viewer styles, never brand token data.
  const declarations = [...colors, ...values, ...effects].map(([name, value]) => `  ${name}: ${value};`).join('\n');
  await writeFile(path.join(dir, 'chrome.css'), `/* Generated from kit/web/scripts/chrome-fallbacks.mjs. */\n:root {\n${declarations}\n}\n`);
  try { await unlink(path.join(dir, 'runtime.json')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const log = await open(path.join(dir, 'server.log'), 'a');
  const child = spawn(process.execPath, [path.join(dir, 'server/index.mjs'), String(port), ...(arg('--port') ? [] : ['prefer'])], { detached: true, stdio: ['ignore', log.fd, log.fd] });
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
