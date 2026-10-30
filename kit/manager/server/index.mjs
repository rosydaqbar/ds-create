import http from 'node:http';
import {readFile, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes, randomUUID} from 'node:crypto';
import {getPublishStatus, getState} from './state.mjs';
import {createFigmaJobs} from './publish.mjs';
import {PublishError} from './files.mjs';
import {buildStatus, createSetupJobs, requestBuild, uploadLimits, workerConnectionStatus} from './setup.mjs';
import {createParts} from './parts.mjs';
import {createChangeRequests} from './changes.mjs';
import {preparedFonts} from '../client/assets/fonts/catalog.mjs';

export function createManagerServer({ outputDir, workspace = path.resolve(outputDir, '../../..'), jobsOptions = {}, setupOptions = {} }) {
  const managerDir = path.join(outputDir, 'manager');
  const instance = randomUUID(), csrfToken = randomBytes(24).toString('hex');
  const setup = createSetupJobs({ ...setupOptions, outputDir, workspace });
  const partJobs = createParts({ outputDir }), changeRequests = createChangeRequests({ outputDir });
  // Publish runs ds-create build. Each step needs at least one item, from Builder or from Figma.
  async function publishSteps(s, parts) {
    const local = s.foundations.filter(f => f.status === 'ready').length, figma = s.source?.review === 'synced';
    const prepared = parts.filter(p => ['review', 'synced'].includes(p.status)).length, inFigma = parts.filter(p => p.status === 'synced').length;
    return { foundations: { ready: local > 0 || figma, local, total: s.foundations.length, figma }, parts: { ready: prepared > 0, prepared, inFigma, total: 19 }, components: { ready: false, built: 0, total: 8 }, build: { ...await buildStatus(outputDir), prompt: `Run ds-create build for the design system saved in Builder.\nds-create build --slug ${path.basename(outputDir)}\nWorkspace: ${workspace}` } };
  }
  async function queueBuild() {
    const s = await getState(outputDir), steps = await publishSteps(s, await partJobs.status(s));
    if (!steps.foundations.ready) throw new PublishError('Prepare your foundations, in Builder or in Figma, before publishing.', 412);
    if (!steps.parts.ready) throw new PublishError('Prepare at least one Part before publishing.', 412);
    return { queued: await requestBuild(outputDir) };
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
      'client/features/iconography.mjs',
      'client/features/parts.mjs',
      'client/features/change-requests.mjs',
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
    ].map(file => [`/${file}`, [file, 'text/javascript; charset=utf-8']]),
    ...['client/styles.css', 'docs-presentation.css', 'chrome.css'].map(file => [`/${file}`, [file, 'text/css; charset=utf-8']]),
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
      const mutations = ['/api/publish-figma', '/api/publish-cancel', '/api/publish-fonts', '/api/parts-prepare', '/api/parts-update', '/api/change-requests', '/api/build-request', '/api/setup-submit', '/api/setup-revise', '/api/setup-answers', '/api/setup-retry', '/api/setup-cancel'];
      if (req.method === 'POST' && mutations.includes(route)) {
        if (req.headers.origin !== `http://${host}` || req.headers['x-ds-create-token'] !== csrfToken || req.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: 'Reopen this Builder tab before trying again.' }); return; }
        const upload = ['/api/setup-submit','/api/setup-revise'].includes(route), type = req.headers['content-type'] || '';
        if (upload ? !/^multipart\/form-data;\s*boundary=/i.test(type) : type.split(';')[0] !== 'application/json') { json(415, { error: upload ? 'Context upload requires form data.' : 'This action requires JSON.' }); return; }
        const limit = upload ? uploadLimits.totalBytes + 128 * 1024 : route === '/api/setup-answers' ? 128 * 1024 : route === '/api/change-requests' ? 16 * 1024 : 4096;
        if (Number(req.headers['content-length']) > limit) throw new PublishError('Request is too large.', 413);
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > limit) throw new PublishError('Request is too large.', 413); chunks.push(chunk); }
        const raw = Buffer.concat(chunks);
        let input;
        try { input = upload ? await new Response(raw, { headers: { 'Content-Type': type } }).formData() : JSON.parse(raw.toString('utf8')); }
        catch { throw new PublishError('Could not read this request. Choose your files and retry.', 400); }
        if (['/api/publish-cancel','/api/setup-cancel','/api/build-request'].includes(route) && (!input || Object.keys(input).length)) throw new PublishError(route === '/api/build-request' ? 'Publish takes no parameters.' : 'Stop takes no parameters.',400);
        if(transitioning)throw new PublishError('Another setup or publication action is being saved. Retry after it finishes.');
        transitioning=true;
        try {
        const result = route === '/api/publish-figma' ? await jobs.start(input) : route === '/api/publish-cancel' ? await jobs.cancel() : route === '/api/publish-fonts' ? await setup.fontChoice(input) : route === '/api/parts-prepare' ? await partJobs.prepare(input, await getState(outputDir)) : route === '/api/parts-update' ? await partJobs.update(input, await getState(outputDir)) : route === '/api/change-requests' ? await changeRequests.update(input) : route === '/api/build-request' ? await queueBuild() :
          route === '/api/setup-revise' ? await setup.revise(input) : route === '/api/setup-submit' ? await setup.submit(input) : route === '/api/setup-answers' ? await setup.answer(input) : route === '/api/setup-retry' ? await setup.retry(input) : await setup.cancel();
        json(202,result); return;
        } finally { transitioning=false; }
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
      if (route === '/api/worker') { json(200, await workerConnectionStatus(outputDir, workspace)); return; }
      if (['/api/state', '/api/health', '/api/publish-status', '/api/publish-flow', '/api/setup-flow'].includes(route)) {
        const body = route === '/api/setup-flow' ? { ...await setup.status(), csrfToken } : route === '/api/publish-flow' ? { ...await jobs.status(), csrfToken } : route === '/api/publish-status' ? await getPublishStatus(outputDir) : route === '/api/state' ? await (async () => { const s = await getState(outputDir); const requests = await changeRequests.list(), parts = await partJobs.status(s); return { ...s, parts, publishSteps: await publishSteps(s, parts), changeRequests: requests, changePrompt: changeRequests.prompt(requests, { session: path.basename(outputDir), workspace }), csrfToken }; })() : { service: 'ds-create-manager', instance, pid: process.pid, outputDir };
        json(200, body); return;
      }
      if (!routes.has(route)) { res.writeHead(404).end('Not found'); return; }
      const [file, type] = routes.get(route), body = await readFile(path.join(managerDir, file));
      res.writeHead(200, { 'Content-Type': type }); res.end(req.method === 'HEAD' ? undefined : body);
    } catch (e) {
      if (!(e instanceof PublishError)) console.error(e);
      json(e instanceof PublishError ? e.status : 500, { error: e instanceof PublishError ? e.message : 'Could not read the current workspace. Retry after its files are saved.' });
    }
  });
  return { server, instance, jobs, setup };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const managerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), outputDir = path.dirname(managerDir);
  const { server, instance } = createManagerServer({ outputDir });
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
