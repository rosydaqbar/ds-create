import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Client } from '../kit/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StdioClientTransport } from '../kit/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import { createChangeRequests } from '../kit/manager/server/changes.mjs';
import { storeFixture } from './fixtures/item-store.mjs';

const entry = fileURLToPath(new URL('../kit/mcp/server.mjs', import.meta.url));
const session = 'fixture', F = { target: 'foundations' };
async function setup(t) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'ds-mcp-items-'))); t.after(() => rm(root, { recursive: true, force: true }));
  const output = path.join(root, 'workspace/output', session);
  await mkdir(output, { recursive: true });
  await storeFixture({ dir: output });
  const c = new Client({ name: 'items-test', version: '1.0.0' }), transport = new StdioClientTransport({ command: process.execPath, args: [entry, '--workspace', root], stderr: 'pipe' });
  transport.stderr?.on('data', () => {}); await c.connect(transport); t.after(() => c.close());
  const call = (name, args) => c.callTool({ name, arguments: { session, ...args } });
  const good = async (name, args) => { const r = await call(name, args); assert.notEqual(r.isError, true, r.content?.[0]?.text); return r.structuredContent; };
  return { output, call, good };
}

test('agents list, read, change, review history and restore items over MCP', async t => {
  const { good } = await setup(t);
  const list = await good('ds_create_items_list', { domain: 'shape' });
  assert.equal(list.revision, 1);
  assert.ok(list.items.some(i => i.name === 'radius/control'));
  const get = await good('ds_create_items_get', { names: ['radius/control', 'rules'] });
  assert.deepEqual(get.items[0].aliasChain, { Value: ['radius/control', 'scale/radius/8'] });
  assert.equal(get.items[1].kind, 'rules');
  assert.equal(get.items[1].item.discuss.maxSemantics, 10);
  const ops = [{ ...F, op: 'set', name: 'radius/control', mode: 'Value', value: 12 }];
  const dry = await good('ds_create_items_change', { expectedRevision: 1, ops, reason: 'Rounder buttons', dryRun: true });
  assert.equal(dry.dryRun, true);
  assert.equal(dry.wide, null);
  assert.equal((await good('ds_create_items_change', { expectedRevision: 1, ops, reason: 'Rounder buttons' })).revision, 2);
  const history = await good('ds_create_items_history', {});
  assert.deepEqual(history.revisions.map(h => h.revision), [2, 1]);
  assert.equal(history.revisions[0].author, 'mcp');
  assert.equal((await good('ds_create_items_restore', { revision: 1, expectedRevision: 2 })).revision, 3);
});

test('a wide change asks for discussion and a stale revision is an error', async t => {
  const { good, call } = await setup(t);
  const wide = await good('ds_create_items_change', { expectedRevision: 1, ops: [{ ...F, op: 'rename', from: 'radius/sm', to: 'radius/small' }], reason: 'Rename' });
  assert.equal(wide.status, 'needs-discussion');
  assert.match(wide.wide, /contract/);
  assert.ok(wide.impact);
  const stale = await call('ds_create_items_change', { expectedRevision: 7, ops: [{ ...F, op: 'set', name: 'radius/sm', mode: 'Value', value: 6 }], reason: 'Old' });
  assert.equal(stale.isError, true);
  assert.match(stale.content[0].text, /Foundations changed to revision 1\. Reload and try again\./);
});

test('agents read change requests and mark them done', async t => {
  const { output, good } = await setup(t);
  const { id } = await createChangeRequests({ outputDir: output }).update({ action: 'add', route: 'shape', key: 'radius/control', context: { page: 'Shape', item: 'radius/control' } });
  assert.equal((await good('ds_create_change_requests', {})).requests.length, 1);
  const done = await good('ds_create_change_requests', { action: 'done', id, revision: 2 });
  assert.equal(done.requests[0].status, 'done');
});
