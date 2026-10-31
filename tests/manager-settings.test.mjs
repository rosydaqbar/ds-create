import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readFigmaSetting, writeFigmaSetting } from '../kit/manager/server/settings.mjs';
import { publishFixture } from './fixtures/manager-publish.mjs';

async function temp(t) { const dir = await mkdtemp(path.join(tmpdir(), 'ds-settings-')); t.after(() => rm(dir, { recursive: true, force: true })); return dir; }
const ledger = async dir => JSON.parse(await readFile(path.join(dir, 'ds-create-ledger.json'), 'utf8'));

test('Figma is on by default', async t => {
  assert.equal(await readFigmaSetting(await temp(t)), true);
});

test('turning Figma off keeps the rest of the ledger', async t => {
  const dir = await temp(t);
  await writeFile(path.join(dir, 'ds-create-ledger.json'), JSON.stringify({ system: 'X', sequence: [{ step: 1, status: 'done' }], foundationReview: { status: 'pending' }, flags: { guidelines: false } }));
  assert.equal(await writeFigmaSetting(dir, false), false);
  const saved = await ledger(dir);
  assert.deepEqual(saved.flags, { guidelines: false, figma: false });
  assert.deepEqual(saved.foundationReview, { status: 'pending' });
  assert.deepEqual(saved.sequence, [{ step: 1, status: 'done' }]);
  assert.equal(await readFigmaSetting(dir), false);
});

test('a missing ledger is created with only the flag', async t => {
  const dir = await temp(t);
  await writeFigmaSetting(dir, false);
  assert.deepEqual(await ledger(dir), { flags: { figma: false } });
});

test('Builder saves the setting and reports it in state', async t => {
  const f = await publishFixture({ autoRun: false }); t.after(() => f.cleanup());
  const state = () => fetch(f.url + '/api/state').then(r => r.json());
  assert.equal((await state()).figma, true);
  const bad = await f.post('/api/settings', { figma: 'no' });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, 'Send {figma: true|false}.');
  assert.equal((await f.post('/api/settings', { figma: false })).status, 202);
  const off = await state();
  assert.equal(off.figma, false);
  assert.equal(off.publishSteps.figma, false);
});
