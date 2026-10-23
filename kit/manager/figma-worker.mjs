import { figmaPrompt } from './figma-prompt.mjs';
import { readFile, writeFile, rename, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { getState, readJSON } from './state.mjs';
import { snapshotInputs } from './input-snapshot.mjs';
import { compareFoundations } from './foundation-compare.mjs';
import { verifiedFigma } from './figma-jobs.mjs';

const requestFile = process.argv[2];
const request = JSON.parse(await readFile(requestFile, 'utf8'));
if(request.simulation!==true)throw new Error('AI subprocess workers are disabled in production. Use DS Create MCP.');
const dir = path.dirname(requestFile), parent = process.ppid;
const statusFile = path.join(dir, 'status.json');
const resultFile = path.join(dir, 'result.json');
const schemaFile = path.join(dir, 'result.schema.json');
let agent, stopping = false;
const record = { id: request.id, hash: request.hash, figmaUrl: request.figmaUrl, pid: process.pid, started: request.approvedAt };
async function save(status, message) {
  const data = { ...record, status, message, ...(!['queued', 'running'].includes(status) ? { finished: new Date().toISOString() } : {}) };
  await writeFile(`${statusFile}.worker.tmp`, JSON.stringify(data, null, 2) + '\n');
  await rename(`${statusFile}.worker.tmp`, statusFile);
}
function killAgent() {
  if (!agent?.pid) return;
  try { if (process.platform !== 'win32') process.kill(-agent.pid, 'SIGTERM'); else agent.kill('SIGTERM'); } catch { /* exited */ }
  const pid = agent.pid;
  setTimeout(() => { try { if (process.platform !== 'win32') process.kill(-pid, 'SIGKILL'); else agent.kill('SIGKILL'); } catch { /* exited */ } }, 1500).unref();
}
async function stop(status = 'cancelled', message = 'Stopped. Any changes already written to Figma remain; inspect them before retrying.') {
  if (stopping) return;
  stopping = true; killAgent();
  await save(status, message);
  // Keep the watchdog alive long enough to terminate a non-responsive child group.
  setTimeout(() => process.exit(0), 1700);
}
process.on('SIGTERM', () => { stop().catch(() => process.exit(1)); });
process.on('SIGINT', () => { stop().catch(() => process.exit(1)); });
const watchdog = setInterval(() => { if (process.ppid !== parent) stop('interrupted', 'Builder stopped. Inspect any partial Figma changes before retrying.').catch(() => process.exit(1)); }, 1000);
const timeout = setTimeout(() => { stop('failed', 'The agent reached its time limit. Inspect partial Figma output and retry through the agent.').catch(() => process.exit(1)); }, request.timeoutMs);
const hash = async () => createHash('sha256').update(await readFile(path.join(request.outputDir, 'foundations.json'))).digest('hex');

try {
  if((await snapshotInputs(request.workspace,request.inputSlug || request.slug)).hash!==request.inputHash)throw new Error('Context changed before Figma generation. Prepare it again.');
  if (await hash() !== request.hash) throw new Error('The saved draft changed before the agent started. Review it and publish again.');
  await save('running', 'The local agent is checking Figma access, fonts, and the approved foundations.');
  await writeFile(schemaFile, JSON.stringify({ type: 'object', additionalProperties: false,
    properties: { status: { type: 'string', enum: ['completed', 'blocked', 'failed'] }, message: { type: 'string' } }, required: ['status', 'message'] }));
  const prompt = figmaPrompt(request, requestFile);
  agent = spawn(request.program, [...request.agentPrefixArgs, 'exec', '--json', '--color', 'never', '--skip-git-repo-check', '-s', 'workspace-write', '-c', 'approval_policy="never"', '-C', request.workspace,
    '--output-schema', schemaFile, '--output-last-message', resultFile, '-'], { cwd: request.workspace, detached: process.platform !== 'win32', shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
  let bytes = 0, logging = Promise.resolve();
  const log = (file, chunk) => {
    bytes += chunk.length;
    if (bytes > 20 * 1024 * 1024) { stop('failed', 'Agent output exceeded the local job limit. Check the saved job logs.').catch(() => {}); return; }
    logging = logging.then(() => appendFile(path.join(dir, file), chunk)).catch(() => {});
  };
  agent.stdout.on('data', chunk => log('events.jsonl', chunk));
  agent.stderr.on('data', chunk => log('stderr.log', chunk));
  agent.stdin.on('error', () => { /* spawn failure or early exit is handled below */ });
  agent.stdin.end(prompt);
  const code = await new Promise((resolve, reject) => { agent.once('error', reject); agent.once('close', resolve); });
  await logging;
  if (!stopping) {
    if((await snapshotInputs(request.workspace,request.inputSlug || request.slug)).hash!==request.inputHash)await save('blocked','Context changed during publication. Inspect partial Figma output and prepare the current input.');
    else if (await hash() !== request.hash) await save('blocked', 'The saved draft changed during generation. Inspect any partial Figma changes and review the new revision.');
    else {
      const result = await readJSON(resultFile);
      const state = await getState(request.outputDir);
      const [draft,confirmed]=await Promise.all(['foundations.json','figma/figma-variables.json'].map(f=>readJSON(path.join(request.outputDir,f))));
      await writeFile(path.join(dir,'foundation-diff.json'),JSON.stringify({...compareFoundations(draft,confirmed),sourceHash:request.hash},null,2)+'\n');
      if (code === 0 && result?.status === 'completed' && await verifiedFigma(state, request.outputDir, request.hash, request.figmaUrl) && state.summary.audit === 'Passed') {
        await save('succeeded', 'Foundations generated and audited in Figma. Continue with ds-create build.');
      } else if (code === 0 && result?.status === 'blocked') await save('blocked', typeof result.message === 'string' ? result.message.slice(0, 2000) : 'The agent needs input. Continue ds-create init in your agent.');
      else await save('failed', code === 0 ? 'The agent did not produce verified Figma foundations. Check the job result and continue init with your agent.' : 'The local agent failed. Check Codex sign-in, Figma MCP access and the saved job logs, then retry.');
    }
  }
} catch (e) {
  if (!stopping) await save('failed', e.code === 'ENOENT' ? 'Codex or the saved draft is unavailable. Restore local readiness and retry.' : e.message.slice(0, 2000));
} finally {
  if (!stopping) { clearInterval(watchdog); clearTimeout(timeout); }
}
