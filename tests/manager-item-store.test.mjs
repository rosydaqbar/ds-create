import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, rm, writeFile, utimes, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { createItemStore } from '../kit/manager/foundations/store.mjs';
import { verifyFoundationPack } from '../kit/manager/foundations/pack.mjs';
import { storeFixture, itemPlan } from './fixtures/item-store.mjs';

const F = { target: 'foundations' };
const setRadius = value => [{ ...F, op: 'set', name: 'scale/radius/8', mode: 'Value', value }];
const json = async (dir, file) => JSON.parse(await readFile(path.join(dir, file), 'utf8'));
async function fixture(t, options) { const f = await storeFixture(options); t.after(f.cleanup); return { ...f, store: createItemStore({ outputDir: f.dir }) }; }
async function snapshot(dir) {
  const files = {};
  async function walk(rel) { for (const e of await readdir(path.join(dir, rel), { withFileTypes: true })) { const r = path.join(rel, e.name); if (e.isDirectory()) await walk(r); else files[r] = await readFile(path.join(dir, r), 'utf8'); } }
  await walk('.'); return files;
}
function holdLock(file, ms) {
  const child = spawn(process.execPath, ['-e', 'const fs=require("fs/promises");(async()=>{const h=await fs.open(process.argv[1],"wx");setTimeout(async()=>{await h.close();await fs.unlink(process.argv[1]);process.exit(0);},Number(process.argv[2]));})()', file, String(ms)]);
  return { child, done: new Promise(resolve => child.on('exit', resolve)) };
}
async function until(check) { for (let i = 0; i < 200; i++) { if (await check()) return; await new Promise(r => setTimeout(r, 10)); } throw new Error('Timed out'); }

test('change writes a new revision and resets review', async t => {
  const { dir, store } = await fixture(t);
  const r = await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'Bigger control corners', author: 'mcp' });
  assert.equal(r.revision, 2);
  assert.equal((await json(dir, 'foundations.json')).revision, 2);
  const ledger = await json(dir, 'ds-create-ledger.json');
  assert.deepEqual(ledger.foundationReview, { status: 'pending' });
  assert.equal(ledger.flags.guidelines, false);
});

test('stale revision is refused', async t => {
  const { dir, store } = await fixture(t);
  await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'First', author: 'mcp' });
  const before = await snapshot(dir);
  await assert.rejects(store.change({ expectedRevision: 1, ops: setRadius(16), reason: 'Second', author: 'builder' }), e => e.status === 409 && e.message === 'Foundations changed to revision 2. Reload and try again.');
  assert.deepEqual(await snapshot(dir), before);
});

test('dry run writes nothing', async t => {
  const { dir, store } = await fixture(t);
  const before = await snapshot(dir);
  const r = await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'Try it', author: 'mcp', dryRun: true });
  assert.equal(r.dryRun, true);
  assert.deepEqual(r.changes, [{ kind: 'variable', name: 'scale/radius/8', action: 'set' }]);
  assert.deepEqual(await snapshot(dir), before);
});

test('pack is regenerated', async t => {
  const { dir, store } = await fixture(t);
  await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'Pack', author: 'mcp' });
  await verifyFoundationPack(dir, await json(dir, 'foundations.json'));
});

test('saves without a plan', async t => {
  const { dir, store } = await fixture(t, { plan: false });
  const r = await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'No plan', author: 'mcp' });
  assert.equal(r.revision, 2);
  await assert.rejects(stat(path.join(dir, 'foundations')), { code: 'ENOENT' });
});

test('history and restore copies forward', async t => {
  const { dir, store } = await fixture(t);
  const original = await json(dir, 'foundations.json');
  await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'Two', author: 'mcp' });
  await store.change({ expectedRevision: 2, ops: setRadius(16), reason: 'Three', author: 'builder' });
  assert.deepEqual((await store.history()).map(h => h.revision), [3, 2, 1]);
  assert.equal((await store.history())[0].reason, 'Three');
  const r = await store.restore({ revision: 1, expectedRevision: 3, author: 'mcp' });
  assert.equal(r.revision, 4);
  const restored = await json(dir, 'foundations.json');
  assert.deepEqual({ ...restored, revision: 1 }, original);
  assert.equal((await store.history())[0].reason, 'Restore revision 1');
});

test('two processes contend for the lock', async t => {
  const { dir, store } = await fixture(t), lock = path.join(dir, 'foundations.lock');
  const short = holdLock(lock, 500);
  await until(() => stat(lock).then(() => true, () => false));
  assert.equal((await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'Waits', author: 'mcp' })).revision, 2);
  await short.done;
  const long = holdLock(lock, 3000); t.after(() => long.child.kill());
  await until(() => stat(lock).then(() => true, () => false));
  await assert.rejects(store.change({ expectedRevision: 2, ops: setRadius(16), reason: 'Gives up', author: 'mcp' }), { message: 'Foundations are being saved by another process. Try again.' });
  long.child.kill(); await long.done; await rm(lock, { force: true });
  await writeFile(lock, ''); const old = new Date(Date.now() - 31000); await utimes(lock, old, old);
  assert.equal((await store.change({ expectedRevision: 2, ops: setRadius(16), reason: 'Stale lock', author: 'mcp' })).revision, 3);
});

test('failed save leaves files unchanged', async t => {
  const { dir, store } = await fixture(t);
  const before = await snapshot(dir);
  await assert.rejects(store.change({ expectedRevision: 1, ops: [{ ...F, op: 'delete', name: 'scale/radius/8' }], reason: 'Bad', author: 'mcp' }), { status: 400 });
  assert.deepEqual(await snapshot(dir), before);
});

test('rules are seeded from the decision file', async t => {
  const decisions = { domains: { color: { inputs: { palettes: { brand: { anchors: { 50: '#FCF3F2', 500: '#C33734', 950: '#2E0D0C' } } } } } } };
  const { dir, store } = await fixture(t, { decisions });
  await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'Seed', author: 'mcp' });
  const rules = await json(dir, 'foundation-rules.json');
  assert.deepEqual(rules.palettes.brand.anchors, { 50: '#FCF3F2', 500: '#C33734', 950: '#2E0D0C' });
  assert.equal(rules.palettes.brand.rule, 'ramp');
  const plan = itemPlan(), names = Object.values(plan.domains).flatMap(d => [...(d.variables || []), ...(d.styles || [])]);
  assert.deepEqual([...rules.contract].sort(), [...names].sort());
});

test('wide change needs confirmation', async t => {
  const { store } = await fixture(t);
  const ops = [{ ...F, op: 'rename', from: 'radius/sm', to: 'radius/small' }];
  await assert.rejects(store.change({ expectedRevision: 1, ops, reason: 'Rename', author: 'mcp' }), e => e.status === 428 && /contract/.test(e.message) && e.impact && /Discuss it with the user/.test(e.message));
  const dry = await store.change({ expectedRevision: 1, ops, reason: 'Rename', author: 'mcp', dryRun: true });
  assert.match(dry.wide, /contract/);
  assert.equal((await store.change({ expectedRevision: 1, ops, reason: 'Rename', author: 'mcp', confirmed: true })).revision, 2);
});

// Final review fixes.
test('a change that changes nothing saves nothing', async t => {
  const { dir, store } = await fixture(t);
  const before = await snapshot(dir);
  const r = await store.change({ expectedRevision: 1, ops: [{ ...F, op: 'apply', recipe: 'radius-base', rem: 0.5 }], reason: 'Same base', author: 'builder', confirmed: true });
  assert.equal(r.unchanged, true);
  assert.equal(r.revision, 1);
  assert.deepEqual(await snapshot(dir), before);
});

test('saves wait while a publish or a preparation runs', async t => {
  const { dir, store } = await fixture(t), id = '11111111-1111-4111-8111-111111111111';
  const { mkdir } = await import('node:fs/promises');
  await mkdir(path.join(dir, 'manager/jobs', id), { recursive: true });
  await writeFile(path.join(dir, 'manager/figma-job.json'), JSON.stringify({ id }));
  await writeFile(path.join(dir, 'manager/jobs', id, 'status.json'), JSON.stringify({ id, runner: 'mcp', status: 'queued' }));
  await assert.rejects(store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'During publish', author: 'mcp' }), e => e.status === 409 && /publish is running/.test(e.message));
  await writeFile(path.join(dir, 'manager/jobs', id, 'status.json'), JSON.stringify({ id, runner: 'mcp', status: 'succeeded' }));
  const setup = await json(dir, 'manager/setup.json');
  await writeFile(path.join(dir, 'manager/setup.json'), JSON.stringify({ ...setup, status: 'running' }));
  await assert.rejects(store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'During preparation', author: 'mcp' }), e => e.status === 409 && /Preparation is running/.test(e.message));
});

test('rules are reseeded after a new preparation and keep the discussion limits', async t => {
  const decisions = { domains: { color: { inputs: { palettes: { brand: { anchors: { 50: '#FCF3F2', 500: '#C33734', 950: '#2E0D0C' } } } } } } };
  const { dir, store } = await fixture(t, { decisions });
  await store.change({ expectedRevision: 1, ops: [{ ...F, op: 'set', kind: 'rules', fields: { discuss: { maxSemantics: 20 } } }], reason: 'Limits', author: 'mcp', confirmed: true });
  const plan = await json(dir, 'foundation-plan.json');
  await writeFile(path.join(dir, 'foundation-plan.json'), JSON.stringify({ ...plan, inputHash: 'new-hash' }));
  await writeFile(path.join(dir, 'manager/setup-jobs/job-1/decisions.json'), JSON.stringify({ domains: { color: { inputs: { palettes: { brand: { anchors: { 50: '#EFF6FF', 500: '#2563EB', 950: '#172554' } } } } } } }));
  const { rules } = await store.read();
  assert.equal(rules.palettes.brand.anchors[500], '#2563EB');
  assert.equal(rules.discuss.maxSemantics, 20);
  assert.equal(rules.inputHash, 'new-hash');
});

test('restore takes whole revision numbers only, and undo needs a saved previous revision', async t => {
  const { store } = await fixture(t);
  assert.equal(await store.canUndo(1), false);
  await assert.rejects(store.restore({ revision: '../../figma/synced', expectedRevision: 1, author: 'builder' }), { status: 400 });
  await store.change({ expectedRevision: 1, ops: setRadius(12), reason: 'Two', author: 'builder' });
  assert.equal(await store.canUndo(2), true);
});
