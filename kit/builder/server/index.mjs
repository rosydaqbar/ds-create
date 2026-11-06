import http from 'node:http';
import {mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes, randomUUID} from 'node:crypto';
import {getPublishStatus, getState, observedSetup, readJSON} from './state.mjs';
import {createFigmaJobs} from './publish.mjs';
import {PublishError, readBrandFile, writeJSON} from './files.mjs';
import {createSetupJobs, uploadLimits, workerConnectionStatus} from './setup.mjs';
import {createParts} from './parts.mjs';
import {stageOptions, stageStyles} from './stage.mjs';
import {readParts} from '../parts/files.mjs';
import {ItemError} from '../foundations/ops.mjs';
import {createChangeRequests} from './changes.mjs';
import {readFigmaSetting, writeFigmaSetting} from './settings.mjs';
import {createItemStore} from '../foundations/store.mjs';
import {syncState} from '../foundations/baseline.mjs';
import {preparedFonts} from '../client/assets/fonts/catalog.mjs';

export function createManagerServer({ outputDir, workspace = path.resolve(outputDir, '../../..'), jobsOptions = {}, setupOptions = {}, codeDir }) {
  const managerDir = codeDir || path.join(outputDir, 'manager');
  const instance = randomUUID(), csrfToken = randomBytes(24).toString('hex');
  const setup = createSetupJobs({ ...setupOptions, outputDir, workspace });
  const partJobs = createParts({ outputDir }), changeRequests = createChangeRequests({ outputDir });
  // Builder controls save through the same store as the MCP item tools. The user is making the change by hand, so no discussion step.
  const items = createItemStore({ outputDir });
  // Publish runs ds-create build. Each step needs at least one item, from Builder or from Figma.
  async function publishSteps(s, parts) {
    // Brand assets shows the user's Context files; it is not a foundation Builder prepares, so it never opens this step.
    const local = s.foundations.filter(f => f.status === 'ready' && f.id !== 'brand-assets').length, figma = s.source?.review === 'synced';
    // Each level counts its own templates: 19 Parts, 8 Components and 2 Sections today, more when templates are added.
    const level = name => { const list = parts.filter(p => (p.level || 'parts') === name), prepared = list.filter(p => ['review', 'synced'].includes(p.status)).length;
      return { ready: prepared > 0, prepared, inFigma: list.filter(p => p.status === 'synced').length, total: list.length }; };
    return { figma: await readFigmaSetting(outputDir), foundations: { ready: ['approved', 'synced'].includes(s.source?.review) || s.source?.kind !== 'local' && local > 0, local, total: s.foundations.length, figma }, parts: { ...level('parts'), prompt: `Prepare the Parts, Components and Sections saved in Builder.\nUse DS Create MCP to call ds_create_parts_prepare with session: "${path.basename(outputDir)}".\nds-create builder --slug ${path.basename(outputDir)}\nWorkspace: ${workspace}\n\nCheck that the foundations are approved in Builder first. If they are not, tell me and wait. Do not approve them yourself.` }, components: level('components'), sections: level('sections'), build: { prompt: `Run /ds-create build for the design system saved in Builder.\nds-create builder --slug ${path.basename(outputDir)}\nWorkspace: ${workspace}` } };
  }
  // The user approves the saved foundations in Builder; no Figma publish needed. An approval that a Figma
  // publish already confirmed is kept as it is.
  async function approveFoundations(input) {
    if (!input || Object.keys(input).join() !== 'hash' || typeof input.hash !== 'string') throw new PublishError('Send the hash of the revision you reviewed.', 400);
    const s = await getState(outputDir);
    if (s.source?.kind !== 'local' || s.source.hash !== input.hash) throw new PublishError('The foundations changed. Review the current revision before approving.', 409);
    if (['approved', 'synced'].includes(s.source.review)) return { approved: input.hash };
    // Builder can only show the approval when the draft is current and its checks pass; say why it can't.
    if (s.warnings?.length) throw new PublishError(s.warnings[0], 409);
    const file = path.join(outputDir, 'ds-create-ledger.json'), ledger = await readJSON(file) || {};
    await writeJSON(file, { ...ledger, foundationReview: { status: 'approved', hash: input.hash, approvedBy: 'user', approvedAt: new Date().toISOString(), approvalSource: 'builder:approve' } });
    return { approved: input.hash };
  }
  async function saveSettings(input) {
    if (!input || Object.keys(input).join() !== 'figma' || typeof input.figma !== 'boolean') throw new PublishError('Send {figma: true|false}.', 400);
    return { figma: await writeFigmaSetting(outputDir, input.figma) };
  }
  const jobs = createFigmaJobs({ ...jobsOptions, outputDir, workspace, setupGate: async () => { const flow = await setup.status(); return flow.enabled && flow.status !== 'ready' ? 'Finish preparing and reviewing local foundations before publishing to Figma.' : null; } });
  const routes = new Map([
    ['/', ['client/index.html', 'text/html; charset=utf-8']],
    ...[
      'client/app.js',
      'client/canvas.mjs',
      'client/ui-motion.mjs',
      'client/features/controls.js',
      'client/features/foundation-controls.mjs',
      'client/features/foundation-save.mjs',
      'client/features/iconography.mjs',
      'client/features/brand-assets.mjs',
      'client/features/parts.mjs',
      'client/features/items.mjs',
      'client/features/change-requests.mjs',
      'client/features/clipboard.mjs',
      'client/features/build.mjs',
      'client/features/motion.mjs',
      'client/features/spacing.mjs',
      'client/features/preparation.mjs',
      'client/features/setup.mjs',
      'client/features/publish.mjs',
      'client/features/publish-progress.mjs',
      'client/features/worker-connection.mjs',
      'shared/motion.mjs',
      'shared/ui-settings.mjs',
      'shared/interface.mjs',
      'client/assets/fonts/catalog.mjs',
      'client/assets/icons/catalog.mjs',
      'client/items/items.js',
    ].map(file => [`/${file}`, [file, 'text/javascript; charset=utf-8']]),
    ...['client/styles.css', 'client/items/items.css', 'docs-presentation.css', 'chrome.css'].map(file => [`/${file}`, [file, 'text/css; charset=utf-8']]),
    ['/client/assets/icons/LUCIDE-LICENSE.txt', ['client/assets/icons/LUCIDE-LICENSE.txt', 'text/plain; charset=utf-8']],
    ...preparedFonts.map(font => [`/client/assets/fonts/${font.file}`, [`client/assets/fonts/${font.file}`, 'font/ttf']]),
    ...['inter', 'geist', 'plus-jakarta-sans'].map(font => [`/client/assets/fonts/${font}-OFL.txt`, [`client/assets/fonts/${font}-OFL.txt`, 'text/plain; charset=utf-8']]),
  ]);
  let transitioning=false;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    const host = req.headers.host || '';
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) { res.writeHead(403).end('Localhost only'); return; }
    const json = (code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(value)); };
    try {
      const route = new URL(req.url, `http://${host}`).pathname;
      const mutations = ['/api/foundations', '/api/foundations-restore', '/api/foundations-approve', '/api/settings', '/api/publish-figma', '/api/publish-cancel', '/api/publish-fonts', '/api/parts-prepare', '/api/parts-update', '/api/change-requests', '/api/setup-submit', '/api/setup-revise', '/api/setup-answers', '/api/setup-retry', '/api/setup-cancel'];
      if (req.method === 'POST' && mutations.includes(route)) {
        if (req.headers.origin !== `http://${host}` || req.headers['x-ds-create-token'] !== csrfToken || req.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: 'Reopen this Builder tab before trying again.' }); return; }
        const upload = ['/api/setup-submit','/api/setup-revise'].includes(route), type = req.headers['content-type'] || '';
        if (upload ? !/^multipart\/form-data;\s*boundary=/i.test(type) : type.split(';')[0] !== 'application/json') { json(415, { error: upload ? 'Context upload requires form data.' : 'This action requires JSON.' }); return; }
        const limit = upload ? uploadLimits.totalBytes + 128 * 1024 : route === '/api/setup-answers' ? 128 * 1024 : route === '/api/change-requests' ? 16 * 1024 : route === '/api/foundations' ? 64 * 1024 : 4096;
        if (Number(req.headers['content-length']) > limit) throw new PublishError('Request is too large.', 413);
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > limit) throw new PublishError('Request is too large.', 413); chunks.push(chunk); }
        const raw = Buffer.concat(chunks);
        let input;
        try { input = upload ? await new Response(raw, { headers: { 'Content-Type': type } }).formData() : JSON.parse(raw.toString('utf8')); }
        catch { throw new PublishError('Could not read this request. Choose your files and retry.', 400); }
        if (['/api/publish-cancel','/api/setup-cancel'].includes(route) && (!input || Object.keys(input).length)) throw new PublishError('Stop takes no parameters.',400);
        if(transitioning)throw new PublishError('Another setup or publication action is being saved. Retry after it finishes.');
        transitioning=true;
        try {
        const result = route === '/api/foundations' ? await items.change({ expectedRevision: input?.expectedRevision, ops: input?.ops, reason: input?.reason, author: 'builder', confirmed: true }) : route === '/api/foundations-restore' ? await items.restore({ revision: input?.revision, expectedRevision: input?.expectedRevision, author: 'builder' }) : route === '/api/foundations-approve' ? await approveFoundations(input) : route === '/api/settings' ? await saveSettings(input) : route === '/api/publish-figma' ? await jobs.start(input) : route === '/api/publish-cancel' ? await jobs.cancel() : route === '/api/publish-fonts' ? await setup.fontChoice(input) : route === '/api/parts-prepare' ? await partJobs.prepare(input, await getState(outputDir)) : route === '/api/parts-update' ? await partJobs.update(input, await getState(outputDir)) : route === '/api/change-requests' ? await changeRequests.update(input) :
          route === '/api/setup-revise' ? await setup.revise(input) : route === '/api/setup-submit' ? await setup.submit(input) : route === '/api/setup-answers' ? await setup.answer(input) : route === '/api/setup-retry' ? await setup.retry(input) : await setup.cancel();
        json(202,result); return;
        } finally { transitioning=false; }
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
      if (route === '/api/worker') { json(200, await workerConnectionStatus(outputDir, workspace)); return; }
      if (['/api/state', '/api/health', '/api/publish-status', '/api/publish-flow', '/api/setup-flow'].includes(route)) {
        const body = route === '/api/setup-flow' ? { ...await setup.status(), figma: await readFigmaSetting(outputDir), csrfToken } : route === '/api/publish-flow' ? { ...await jobs.status(), csrfToken } : route === '/api/publish-status' ? await getPublishStatus(outputDir) : route === '/api/state' ? await (async () => { const s = await getState(outputDir); const requests = await changeRequests.list(), parts = await partJobs.status(s); const [last] = s.source?.kind === 'local' ? await items.history({ limit: 1 }) : []; return { ...s, source: { ...s.source, savedBy: ['mcp', 'builder'].includes(last?.author) ? last.author : null, canUndo: s.source?.kind === 'local' && await items.canUndo(s.source.revision) }, typeScale: await items.typeScale(), figma: await readFigmaSetting(outputDir), sync: await syncState(outputDir), parts, partOptions: await (async () => { const draft = await readJSON(path.join(outputDir, 'foundations.json')); return draft ? stageOptions(draft) : null; })(), publishSteps: await publishSteps(s, parts), changeRequests: requests, changePrompt: changeRequests.prompt(requests, { session: path.basename(outputDir), workspace }), csrfToken }; })() : { service: 'ds-create-manager', instance, pid: process.pid, outputDir };
        json(200, body); return;
      }
      // The system's tokens for Builder's Part drawings.
      if (route === '/api/stage.css') {
        const draft = await readJSON(path.join(outputDir, 'foundations.json'));
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' || !draft ? undefined : stageStyles(draft, await readParts(outputDir))); return;
      }
      // A logo from Context, for an <img> on the Brand assets page. Same origin only; an SVG never runs script here.
      if (route.startsWith('/api/brand-assets/')) {
        if (req.headers['sec-fetch-site'] === 'cross-site') { res.writeHead(403).end('Same origin only'); return; }
        let key; try { key = decodeURIComponent(route.slice('/api/brand-assets/'.length)); } catch { key = null; }
        const file = key && await readBrandFile(workspace, await observedSetup(outputDir), path.basename(outputDir), key);
        if (!file) { res.writeHead(404).end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': file.type, 'Content-Security-Policy': "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox", 'Cross-Origin-Resource-Policy': 'same-origin' });
        res.end(req.method === 'HEAD' ? undefined : file.bytes); return;
      }
      if (!routes.has(route)) { res.writeHead(404).end('Not found'); return; }
      const [file, type] = routes.get(route), body = await readFile(path.join(managerDir, file));
      res.writeHead(200, { 'Content-Type': type }); res.end(req.method === 'HEAD' ? undefined : body);
    } catch (e) {
      // Store and template refusals carry their own status and one-sentence reason.
      const known = e instanceof PublishError || e instanceof ItemError;
      if (!known) console.error(e);
      json(known ? e.status : 500, { error: known ? e.message : 'Could not read the current workspace. Retry after its files are saved.' });
    }
  });
  return { server, instance, jobs, setup };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // --output <dir>: Builder runs from where it is installed and keeps its runtime state in <dir>/manager/.
  // Without it, the folder is derived from this file's location (a session's copied manager/).
  const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), flag = process.argv.indexOf('--output');
  const outputArg = flag > 1 ? process.argv[flag + 1] : undefined;
  if (flag > 1 && !outputArg) { console.error('--output needs a folder.'); process.exit(1); }
  const outputDir = outputArg ? path.resolve(outputArg) : path.dirname(here), managerDir = path.join(outputDir, 'manager');
  await mkdir(managerDir, { recursive: true });
  const { server, instance } = createManagerServer({ outputDir, ...(outputArg ? { codeDir: here } : {}) });
  // A session keeps its address across restarts: the CLI asks for the last port and only a taken port falls back.
  const requested = Number(process.argv[2] || 0), prefer = process.argv[3] === 'prefer';
  let retried = false;
  server.on('error', e => { if (prefer && e.code === 'EADDRINUSE' && !retried) { retried = true; server.listen(0, '127.0.0.1'); return; } console.error(e.message); process.exitCode = 1; });
  server.on('listening', async () => {
    const port = server.address().port, runtime = { pid: process.pid, url: `http://127.0.0.1:${port}`, instance, outputDir, started: new Date().toISOString() };
    const file = path.join(managerDir, 'runtime.json');
    await writeFile(`${file}.tmp`, JSON.stringify(runtime, null, 2) + '\n'); await rename(`${file}.tmp`, file);
    await writeFile(path.join(managerDir, 'port.json'), JSON.stringify({ port }) + '\n');
    console.log(`DS Create Builder: ${runtime.url}`);
  });
  server.listen(requested, '127.0.0.1');
  let stopping = false;
  async function stop() {
    if (stopping) return; stopping = true;
    server.close();
    const file = path.join(managerDir, 'runtime.json');
    try { if (JSON.parse(await readFile(file, 'utf8')).instance === instance) await unlink(file); } catch { /* removed */ }
    process.exit(0);
  }
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
