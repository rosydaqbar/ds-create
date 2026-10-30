#!/usr/bin/env node
// Terminal host for DS Create MCP: one real stdio connection to server.mjs, held open for agents whose
// session has no ds_create_* tools loaded. The CLI forwards tool calls to it, so leases and
// disconnect-blocks-unfinished-work behave exactly as with a native MCP client.
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFile, realpath, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

import {CALL_TIMEOUT_MS, HOST_FILE, HOST_HEADER, IDLE_EXIT_MS, MAX_BODY} from './host-client.mjs';

async function main(workspace) {
  const file = path.join(workspace, HOST_FILE), token = randomUUID(), instance = randomUUID();
  const client = new Client({ name: 'ds-create-terminal-host', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('./server.mjs', import.meta.url)), '--workspace', workspace], stderr: 'inherit' });
  await client.connect(transport);
  let inflight = 0, idle, closing = false;
  const touch = () => { clearTimeout(idle); if (!inflight) idle = setTimeout(() => void stop(), IDLE_EXIT_MS); };
  async function stop() {
    if (closing) return; closing = true; clearTimeout(idle);
    try { if (JSON.parse(await readFile(file, 'utf8')).instance === instance) await unlink(file); } catch { /* already gone */ }
    await client.close().catch(() => {});
    server.close(); process.exit(0);
  }
  transport.onclose = () => void stop();
  const send = (res, status, data) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') return send(res, 200, { service: 'ds-create-mcp-host', instance, pid: process.pid, workspace });
    // Browser pages carry an Origin; only the local CLI with the host file's token may call tools.
    if (req.headers.origin || req.headers[HOST_HEADER] !== token) return send(res, 403, { error: 'Forbidden.' });
    if (closing) return send(res, 503, { error: 'Host is stopping.' });
    inflight++; touch();
    const abort = new AbortController();
    res.on('close', () => { if (!res.writableEnded) abort.abort(); });
    try {
      if (req.url === '/stop' && req.method === 'POST') { send(res, 200, { stopped: true }); setImmediate(() => void stop()); return; }
      if (req.url === '/tools' && req.method === 'GET') return send(res, 200, await client.listTools());
      if (req.url !== '/call' || req.method !== 'POST') return send(res, 404, { error: 'Not found.' });
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > MAX_BODY) return send(res, 413, { error: 'Request too large.' }); }
      const { name, arguments: args } = JSON.parse(body || '{}');
      if (typeof name !== 'string') return send(res, 400, { error: 'Provide a tool name.' });
      send(res, 200, await client.callTool({ name, arguments: args || {} }, undefined, { signal: abort.signal, timeout: CALL_TIMEOUT_MS }));
    } catch (error) {
      if (!res.headersSent) send(res, abort.signal.aborted ? 499 : 500, { error: error.message });
    } finally { inflight--; touch(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const record = { pid: process.pid, instance, token, url: `http://127.0.0.1:${server.address().port}`, workspace, started: new Date().toISOString() };
  await writeFile(`${file}.tmp`, JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
  await rename(`${file}.tmp`, file);
  process.once('SIGTERM', () => void stop()); process.once('SIGINT', () => void stop());
  touch();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--workspace') { console.error('Usage: node kit/mcp/host.mjs --workspace /absolute/workspace'); process.exitCode = 1; }
  else main(await realpath(args[1])).catch(error => { console.error(error.message); process.exit(1); });
}
