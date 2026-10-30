// CLI side of the terminal host (host.mjs). Dependency-free, so it can install kit/mcp's packages first.
import {spawn, spawnSync} from 'node:child_process';
import {access, open, readFile, unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const HOST_FILE = 'workspace/output/.mcp-host.json';
export const HOST_HEADER = 'x-ds-create-host';
// Longer than the 5-minute ds_create_prepare_wait so the server, not the host, ends a pending wait.
export const CALL_TIMEOUT_MS = 6 * 60 * 1000;
// With no call for this long the agent has gone; closing blocks its unfinished attempts, as a disconnect would.
export const IDLE_EXIT_MS = 2 * 60 * 60 * 1000;
export const MAX_BODY = 4 * 1024 * 1024;
const START_TIMEOUT_MS = 15 * 1000;
const POLL_MS = 100;
const MCP_DIR = fileURLToPath(new URL('./', import.meta.url));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// A fresh clone has no node_modules (git-ignored); install the locked versions once, quietly to stderr.
export async function ensureDependencies() {
  try { await access(path.join(MCP_DIR, 'node_modules/@modelcontextprotocol/sdk/package.json')); return; } catch { /* install below */ }
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npm, ['ci', '--prefix', MCP_DIR, '--no-audit', '--no-fund'], { stdio: ['ignore', process.stderr, process.stderr] });
  if (r.status !== 0) throw new Error(`Could not install DS Create MCP dependencies. Run: npm ci --prefix ${MCP_DIR}`);
}

export async function hostRecord(workspace) {
  let record;
  try { record = JSON.parse(await readFile(path.join(workspace, HOST_FILE), 'utf8')); } catch { return null; }
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(record?.url || '')) return null;
  try {
    const health = await fetch(`${record.url}/health`, { signal: AbortSignal.timeout(800) }).then(r => r.json());
    return health.service === 'ds-create-mcp-host' && health.instance === record.instance && health.pid === record.pid ? record : null;
  } catch { return null; }
}

export async function startHost(workspace) {
  const running = await hostRecord(workspace);
  if (running) return { ...running, token: undefined, reused: true };
  await ensureDependencies();
  // One host per workspace: the lock holds the starting process's pid, and a dead holder is cleared.
  const lock = path.join(workspace, `${HOST_FILE}.lock`);
  let handle;
  for (let i = 0; !handle; i++) {
    try { handle = await open(lock, 'wx'); await handle.write(String(process.pid)); }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const holder = Number(await readFile(lock, 'utf8').catch(() => ''));
      if (!alive(holder)) { await unlink(lock).catch(() => {}); continue; }
      const started = await hostRecord(workspace);
      if (started) return { ...started, token: undefined, reused: true };
      if (i * POLL_MS > START_TIMEOUT_MS) throw new Error(`Another process is starting the DS Create MCP host. Retry, or remove ${lock}.`);
      await sleep(POLL_MS);
    }
  }
  try {
    const log = await open(path.join(workspace, 'workspace/output/.mcp-host.log'), 'a');
    const child = spawn(process.execPath, [path.join(MCP_DIR, 'host.mjs'), '--workspace', workspace], { detached: true, stdio: ['ignore', log.fd, log.fd] });
    await log.close(); child.unref();
    let exited = false; child.on('exit', () => { exited = true; });
    for (let waited = 0; waited < START_TIMEOUT_MS; waited += POLL_MS) {
      if (exited) break;
      const record = await hostRecord(workspace);
      if (record?.pid === child.pid) return { ...record, token: undefined, reused: false };
      await sleep(POLL_MS);
    }
    throw new Error(`DS Create MCP host did not start. Check ${path.join(workspace, 'workspace/output/.mcp-host.log')}.`);
  } finally { await handle.close(); await unlink(lock).catch(() => {}); }
}

export async function stopHost(workspace) {
  const record = await hostRecord(workspace);
  if (!record) return { stopped: false, running: false };
  await fetch(`${record.url}/stop`, { method: 'POST', headers: { [HOST_HEADER]: record.token } });
  for (let waited = 0; waited < START_TIMEOUT_MS && await hostRecord(workspace); waited += POLL_MS) await sleep(POLL_MS);
  return { stopped: true, running: false };
}

// Starts the host on first use. A killed CLI aborts the request, which cancels the tool call on the host.
export async function callHost(workspace, route, body, signal) {
  await startHost(workspace);
  const record = await hostRecord(workspace);
  if (!record) throw new Error('DS Create MCP host is not running.');
  const r = await fetch(`${record.url}${route}`, { method: body === undefined ? 'GET' : 'POST', signal,
    headers: { [HOST_HEADER]: record.token, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `DS Create MCP host returned ${r.status}.`);
  return data;
}
