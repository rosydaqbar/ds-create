import test from 'node:test';
import assert from 'node:assert/strict';
import { itemHashes, localDiff, syncState, writeBaseline } from '../kit/manager/foundations/baseline.mjs';
import { applyOps } from '../kit/manager/foundations/ops.mjs';
import { createItemStore } from '../kit/manager/foundations/store.mjs';
import { writeFigmaSetting } from '../kit/manager/server/settings.mjs';
import { itemDraft, itemPlan, storeFixture } from './fixtures/item-store.mjs';

const F = { target: 'foundations' };
const edit = (...ops) => applyOps(itemDraft(), ops.map(op => ({ ...F, ...op })), { plan: itemPlan() }).draft;

test('hashes ignore key order', () => {
  const draft = itemDraft(), reordered = structuredClone(draft);
  const v = reordered.variables[0]; reordered.variables[0] = Object.fromEntries(Object.entries(v).reverse());
  assert.deepEqual(itemHashes(reordered), itemHashes(draft));
  assert.match(itemHashes(draft).items['variable:radius/control'], /^[0-9a-f]{16}$/);
  assert.ok(itemHashes(draft).groups.Shape);
});

test('diff lists a changed value', () => {
  const diff = localDiff(itemDraft(), edit({ op: 'set', name: 'radius/control', mode: 'Value', value: 12 }));
  const control = diff.changed.find(c => c.name === 'radius/control');
  assert.deepEqual(control.fields[0], { field: 'values.Value', from: { alias: 'scale/radius/8' }, to: { alias: 'scale/radius/12' } });
  assert.deepEqual(diff.added, [{ kind: 'variable', name: 'scale/radius/12' }]);
});

test('diff detects a rename', () => {
  const diff = localDiff(itemDraft(), edit({ op: 'rename', from: 'radius/sm', to: 'radius/small' }));
  assert.deepEqual(diff.renamed, [{ kind: 'variable', from: 'radius/sm', to: 'radius/small' }]);
  assert.deepEqual(diff.added, []);
  assert.deepEqual(diff.deleted, []);
});

test('state follows the baseline', async t => {
  const f = await storeFixture(); t.after(f.cleanup);
  assert.equal((await syncState(f.dir)).state, 'local');
  await writeBaseline(f.dir, itemDraft());
  const inSync = await syncState(f.dir);
  assert.equal(inSync.state, 'in-sync');
  assert.equal(inSync.baselineRevision, 1);
  await createItemStore({ outputDir: f.dir }).change({ expectedRevision: 1, ops: [{ ...F, op: 'set', name: 'scale/radius/8', mode: 'Value', value: 12 }], reason: 'Edit', author: 'mcp' });
  const changed = await syncState(f.dir);
  assert.equal(changed.state, 'local-changes');
  assert.equal(changed.changes, 1);
  assert.equal(changed.revision, 2);
  await writeFigmaSetting(f.dir, false);
  const off = await syncState(f.dir);
  assert.equal(off.state, 'local');
  assert.equal(off.changes, 0);
});
