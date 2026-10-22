import { access, mkdir, readFile, writeFile, rename, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { compareFoundations } from './foundation-compare.mjs';
import { inputFreshness, snapshotInputs } from './input-snapshot.mjs';
import { selectedInputSlug } from './input-identity.mjs';
import { checkWebDraft } from './foundation-proof.mjs';
import { getState, getPublishStatus, readJSON, figmaLink } from './state.mjs';

export class PublishError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}
export function targetFile(value) {
  const link = figmaLink(value);
  if (!link) return null;
  const url = new URL(link);
  if (url.username || url.password) return null;
  const match = url.pathname.match(/^\/(?:design|file)\/([A-Za-z0-9_-]+)(?:\/|$)/);
  return match ? { url: url.href, key: match[1] } : null;
}
export function currentFigma(state, hash, target) {
  return state.initDone && state.status !== 'error' && state.summary.variables > 0 && !!targetFile(state.figmaUrl) &&
    (!hash || state.source.hash === hash && state.source.review === 'synced') &&
    (!target || targetFile(state.figmaUrl)?.key === targetFile(target)?.key);
}
export async function verifiedFigma(state, outputDir, hash, target) {
  const report = await readJSON(path.join(outputDir, 'figma/audit-file.json'));
  const [draft,actual]=await Promise.all(['foundations.json','figma/figma-variables.json'].map(f=>readJSON(path.join(outputDir,f))));
  return compareFoundations(draft,actual).match && currentFigma(state, hash, target) && report?.mode === 'file' && report.sourceHash === hash && report.result?.fail === 0;
}
async function save(file, value) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + '\n');
  await rename(tmp, file);
}
async function executable(program) {
  const candidates = program.includes(path.sep) ? [program] : (process.env.PATH || '').split(path.delimiter).filter(Boolean).map(p => path.join(p, program));
  for (const candidate of candidates) { try { await access(candidate, constants.X_OK); return await realpath(candidate); } catch { /* next */ } }
  return null;
}
const safeId = id => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id);
const running = job => ['queued', 'running'].includes(job?.status);
export function createFigmaJobs({ outputDir, workspace, agentCommand = 'codex', agentPrefixArgs = [], timeoutMs = 30 * 60 * 1000, simulation = false, setupGate = async () => null }) {
  const jobsDir = path.join(outputDir, 'manager/jobs');
  const pointer = path.join(outputDir, 'manager/figma-job.json');
  let busy = false;
  let child;
  let childId;
  async function latest() {
    const p = await readJSON(pointer);
    if (!safeId(p?.id)) return null;
    const file = path.join(jobsDir, p.id, 'status.json');
    let job = await readJSON(file);
    if (running(job) && job.pid && job.id !== childId) {
      try { process.kill(job.pid, 0); }
      catch { job = { ...job, status: 'interrupted', message: 'The local agent stopped. Check any partial Figma changes before trying again.' }; await save(file, job); }
    }
    return job;
  }
  async function status() {
    const [state, job, program, build] = await Promise.all([getState(outputDir), latest(), executable(agentCommand), getPublishStatus(outputDir)]);
    const complete = currentFigma(state) && (!job || job.hash !== state.source.hash || await verifiedFigma(state, outputDir, job.hash, job.figmaUrl));
    const setup=await readJSON(path.join(outputDir,'manager/setup.json')),fresh=await inputFreshness(outputDir,setup);
    const proof=await checkWebDraft(outputDir,workspace,setup);
    let reason = await setupGate() || (!fresh.fresh?fresh.message:!proof.valid?'Foundation checks failed. Open Context and prepare again.':null);
    if (reason) { /* local preparation must finish before approval/publication */ }
    else if (state.preview && !simulation) reason = 'Sample data cannot be published. Run ds-create init for your own system first.';
    else if (state.source.kind !== 'local' || !state.source.hash || state.source.review === 'invalid') reason = 'Ask your agent to prepare a valid local foundation draft with ds-create init.';
    else if (!program) reason = 'Codex CLI is unavailable. Install it and sign in on this machine, then restart Builder.';
    let publicJob = job ? { id: job.id, status: job.status, message: job.message, started: job.started, finished: job.finished } : null;
    if (publicJob && job.hash !== state.source.hash && !running(job)) publicJob = { ...publicJob, status: 'outdated', message: 'The saved draft changed. Publish the current revision before building.' };
    return { simulation, agent: { name: simulation ? 'Simulation runner' : 'Codex CLI', available: !!program },
      figma: { complete, canStart: !complete && !reason && !running(job) && !busy, reason, revision: state.source.revision || null, hash: state.source.hash || null, url: state.figmaUrl },
      build: { available: complete && !running(job), status: complete ? build.status : 'locked', command: 'ds-create build' }, job: publicJob };
  }
  async function start(input) {
    if (busy) throw new PublishError('A publish request is already being prepared.');
    busy = true;
    try {
      if (!input || typeof input !== 'object' || Object.keys(input).some(k => !['hash', 'figmaUrl'].includes(k))) throw new PublishError('Only the saved draft and Figma target can be submitted.', 400);
      const target = targetFile(input.figmaUrl);
      if (!target) throw new PublishError('Enter an editable Figma design file URL.', 400);
      const state = await getState(outputDir);
      const job = await latest();
      if (running(job)) return { job: { id: job.id, status: job.status }, reused: true };
      if (typeof input.hash !== 'string' || input.hash !== state.source.hash) throw new PublishError('The saved draft changed. Review the current revision and try again.');
      if (currentFigma(state, input.hash, target.url)) return { complete: true, reused: true };
      const gate = await status();
      if (gate.figma.reason) throw new PublishError(gate.figma.reason, 412);
      if (state.foundations.some(f => f.variables.some(v => Object.values(v.resolved).some(r => r.error)))) throw new PublishError('Resolve missing or circular token aliases with your agent before publishing.', 412);
      const slug = path.basename(outputDir), setup=await readJSON(path.join(outputDir,'manager/setup.json')), inputSlug=selectedInputSlug(setup,slug);
      const answersFile = path.join(workspace, 'workspace/input', inputSlug, 'answers/01-init.md');
      try { await access(answersFile); } catch { throw new PublishError('Init answers are missing. Continue ds-create init with your agent first.', 412); }
      if (!['Web', 'App', 'Web and App'].includes(state.product)) throw new PublishError('Settle Web, App, or Web and App through ds-create init first.', 412);
      const program = await executable(agentCommand);
      const id = randomUUID(), dir = path.join(jobsDir, id);
      await mkdir(dir, { recursive: true });
      const request = { id, slug, inputSlug, hash: input.hash, revision: state.source.revision, figmaUrl: target.url, approvedAt: new Date().toISOString(),
        workspace, outputDir, program, agentPrefixArgs, timeoutMs, simulation, inputHash:(await snapshotInputs(workspace,inputSlug)).hash };
      const requestFile = path.join(dir, 'request.json');
      await save(requestFile, request);
      const ledgerFile = path.join(outputDir, 'ds-create-ledger.json');
      const ledger = await readJSON(ledgerFile);
      if (!ledger || !Array.isArray(ledger.sequence)) throw new PublishError('The init ledger is unavailable. Ask the agent to restore it.', 412);
      if ((await getState(outputDir)).source.hash !== input.hash) throw new PublishError('The saved draft changed before publishing. Review it again.');
      if((await snapshotInputs(workspace,inputSlug)).hash!==request.inputHash)throw new PublishError('Context changed before publishing. Prepare it again.');
      ledger.foundationReview = { status: 'approved', hash: input.hash, approvedBy: 'user', approvedAt: request.approvedAt, approvalSource: path.relative(workspace, requestFile) };
      ledger.figma = { ...ledger.figma, url: target.url };
      // An older generation is not evidence for the newly approved request/target.
      ledger.sequence = ledger.sequence.map(e => [2, 3, 4].includes(Number(e?.step)) ? { ...e, status: 'todo' } : e);
      await save(ledgerFile, ledger);
      await save(path.join(dir, 'status.json'), { id, hash: request.hash, figmaUrl: request.figmaUrl, status: 'queued', started: request.approvedAt, message: 'Starting the local agent…' });
      await save(pointer, { id });
      childId = id;
      child = spawn(process.execPath, [fileURLToPath(new URL('./figma-worker.mjs', import.meta.url)), requestFile], { cwd: workspace, stdio: 'ignore', shell: false });
      const launched = child;
      try { await new Promise((resolve, reject) => { launched.once('spawn', resolve); launched.once('error', reject); }); }
      catch { await save(path.join(dir, 'status.json'), { id, hash: request.hash, status: 'failed', started: request.approvedAt, message: 'Could not start the local agent worker.' }); child = null; childId = null; throw new PublishError('Could not start the local agent worker.', 503); }
      const queued = await readJSON(path.join(dir, 'status.json'));
      if (queued?.status === 'queued') await save(path.join(dir, 'status.json'), { ...queued, pid: launched.pid });
      launched.once('exit', () => { if (child === launched) { child = null; childId = null; } });
      return { job: { id, status: 'queued' }, reused: false };
    } finally { busy = false; }
  }
  async function cancel() {
    const job = await latest();
    if (!running(job)) return { stopped: false };
    if (job.id !== childId || !child) throw new PublishError('This job belongs to an earlier Builder process. Wait for it to stop before retrying.');
    const proc = child;
    proc.kill('SIGTERM');
    await new Promise(resolve => { proc.once('exit', resolve); setTimeout(resolve, 3000).unref(); });
    return { stopped: true };
  }
  return { status, start, cancel, shutdown: cancel };
}
