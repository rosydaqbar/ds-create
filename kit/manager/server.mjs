import http from 'node:http';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import { getState, getPublishStatus } from './state.mjs';
import { createFigmaJobs, PublishError } from './figma-jobs.mjs';
import { createSetupJobs, uploadLimits } from './setup-jobs.mjs';
import { preparedFonts } from './fonts/catalog.mjs';
import { workerConnectionStatus } from './listener-status.mjs';

export function createManagerServer({ outputDir, workspace = path.resolve(outputDir, '../../..'), jobsOptions = {}, setupOptions = {} }) {
  const managerDir = path.join(outputDir, 'manager');
  const instance = randomUUID(), csrfToken = randomBytes(24).toString('hex');
  const setup = createSetupJobs({ ...setupOptions, outputDir, workspace });
  const jobs = createFigmaJobs({ ...jobsOptions, outputDir, workspace, setupGate: async () => { const flow = await setup.status(); return flow.enabled && flow.status !== 'ready' ? 'Finish preparing and reviewing local foundations before publishing to Figma.' : null; } });
  const routes = new Map([
    ['/', ['index.html', 'text/html; charset=utf-8']],
    ...['app.js', 'controls.js'].map(file => [`/${file}`, [file, 'text/javascript; charset=utf-8']]),
    ...['canvas.mjs', 'spacing.mjs', 'motion.mjs', 'foundation-controls.mjs', 'publish.mjs', 'publish-progress.mjs', 'setup.mjs', 'setup-options.mjs', 'preparation.mjs', 'worker-connection.mjs', 'iconography.mjs', 'icons/catalog.mjs', 'ui-motion.mjs', 'fonts/catalog.mjs'].map(file => [`/${file}`, [file, 'text/javascript; charset=utf-8']]),
    ...['styles.css', 'docs-presentation.css', 'chrome.css'].map(file => [`/${file}`, [file, 'text/css; charset=utf-8']]),
    ['/icons/LUCIDE-LICENSE.txt', ['icons/LUCIDE-LICENSE.txt', 'text/plain; charset=utf-8']],
    ...preparedFonts.map(font => [`/fonts/${font.file}`, [`fonts/${font.file}`, 'font/ttf']]),
    ...['inter', 'geist', 'plus-jakarta-sans'].map(font => [`/fonts/${font}-OFL.txt`, [`fonts/${font}-OFL.txt`, 'text/plain; charset=utf-8']]),
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
      const mutations = ['/api/publish-figma', '/api/publish-cancel', '/api/setup-submit', '/api/setup-revise', '/api/setup-answers', '/api/setup-retry', '/api/setup-cancel'];
      if (req.method === 'POST' && mutations.includes(route)) {
        if (req.headers.origin !== `http://${host}` || req.headers['x-ds-create-token'] !== csrfToken || req.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: 'Reopen this Builder tab before trying again.' }); return; }
        const upload = ['/api/setup-submit','/api/setup-revise'].includes(route), type = req.headers['content-type'] || '';
        if (upload ? !/^multipart\/form-data;\s*boundary=/i.test(type) : type.split(';')[0] !== 'application/json') { json(415, { error: upload ? 'Context upload requires form data.' : 'This action requires JSON.' }); return; }
        const limit = upload ? uploadLimits.totalBytes + 128 * 1024 : route === '/api/setup-answers' ? 128 * 1024 : 4096;
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
        const result = route === '/api/publish-figma' ? await jobs.start(input) : route === '/api/publish-cancel' ? await jobs.cancel() :
          route === '/api/setup-revise' ? await setup.revise(input) : route === '/api/setup-submit' ? await setup.submit(input) : route === '/api/setup-answers' ? await setup.answer(input) : route === '/api/setup-retry' ? await setup.retry(input) : await setup.cancel();
        json(202,result); return;
        } finally { transitioning=false; }
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
      if (route === '/api/worker') { json(200, await workerConnectionStatus(outputDir, workspace)); return; }
      if (['/api/state', '/api/health', '/api/publish-status', '/api/publish-flow', '/api/setup-flow'].includes(route)) {
        const body = route === '/api/setup-flow' ? { ...await setup.status(), csrfToken } : route === '/api/publish-flow' ? { ...await jobs.status(), csrfToken } : route === '/api/publish-status' ? await getPublishStatus(outputDir) : route === '/api/state' ? await getState(outputDir) : { service: 'ds-create-manager', instance, pid: process.pid, outputDir };
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
  const managerDir = path.dirname(fileURLToPath(import.meta.url)), outputDir = path.dirname(managerDir);
  const { server, instance, jobs, setup } = createManagerServer({ outputDir });
  server.on('error', e => { console.error(e.message); process.exitCode = 1; });
  server.listen(Number(process.argv[2] || 0), '127.0.0.1', async () => {
    const runtime = { pid: process.pid, url: `http://127.0.0.1:${server.address().port}`, instance, outputDir, started: new Date().toISOString() };
    const file = path.join(managerDir, 'runtime.json');
    await writeFile(`${file}.tmp`, JSON.stringify(runtime, null, 2) + '\n'); await rename(`${file}.tmp`, file);
    console.log(`DS Create Builder: ${runtime.url}`);
  });
  let stopping = false;
  async function stop() {
    if (stopping) return; stopping = true;
    await Promise.allSettled([jobs.shutdown(), setup.shutdown()]);
    server.close();
    const file = path.join(managerDir, 'runtime.json');
    try { if (JSON.parse(await readFile(file, 'utf8')).instance === instance) await unlink(file); } catch { /* removed */ }
    process.exit(0);
  }
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
