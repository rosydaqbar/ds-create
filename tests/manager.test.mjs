import test from 'node:test';
import assert from 'node:assert/strict';
import {access, mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import http from 'node:http';
import {getPublishStatus, getState, publishStatus} from '../kit/manager/server/state.mjs';
import {preparedFonts} from '../kit/manager/client/assets/fonts/catalog.mjs';

const exec = promisify(execFile);
const CLI = fileURLToPath(new URL('../kit/manager/cli.mjs', import.meta.url));
const data = {
  format: 'ds-create/figma-variables@1',
  collections: [{ name: 'Primitives', modes: ['Value'] }, { name: 'Color', modes: ['Light', 'Dark'] }, { name: 'Typography', modes: ['Value'] }],
  variables: [
    { name: 'palette/neutral/900', collection: 'Primitives', type: 'COLOR', values: { Value: '#171717' } },
    { name: 'color/text/primary', collection: 'Color', type: 'COLOR', values: { Light: { alias: 'palette/neutral/900' }, Dark: '#fafafa' } },
    { name: 'font/family/ui', collection: 'Typography', type: 'STRING', values: { Value: 'System sans' } },
  ],
  textStyles: [{ name: 'type/body/md/regular', fontFamily: 'System sans', fontSize: 16, lineHeight: 24 }], effectStyles: [],
};
const ledger = { system: 'Fixture system', scope: { productType: 'Web' }, figma: { url: 'https://www.figma.com/design/test/File' },
  sequence: [1, 2, 3, 4].map(step => ({ step, phase: 'init', status: 'done' })) };
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-manager-test-'));
  await mkdir(path.join(root, 'workspace/output/fixture/figma'), { recursive: true });
  const output = await realpath(path.join(root, 'workspace/output/fixture'));
  await mkdir(path.join(output, 'manager'), { recursive: true });
  const run = (...args) => exec(process.execPath, [CLI, ...args, '--slug', 'fixture', '--workspace', root]);
  t.after(async () => { try { await run('stop'); } finally { await rm(root, { recursive: true, force: true }); } });
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify(ledger));
  await writeFile(path.join(output, 'figma/figma-variables.json'), JSON.stringify(data));
  return { root, output, run };
}

test('completed init resolves aliases across single-mode collections without inventing components', async t => {
  const { output } = await fixture(t);
  const state = await getState(output);
  assert.equal(state.status, 'ready');
  assert.equal(state.foundations[0].variables[1].resolved.Light.value, '#171717');
  assert.equal(state.foundations[0].variables[1].resolved.Dark.value, '#fafafa');
  assert.deepEqual(state.foundations[0].modes, ['Light', 'Dark']);
  assert.equal(state.foundations.find(f => f.id === 'typography').styles[0].fontSize, 16);
  assert.equal(state.foundations.find(f => f.id === 'iconography').status, 'pending');
  assert.equal(state.summary.audit, 'Not checked yet');
  assert.equal(state.figmaUrl, ledger.figma.url);
  assert.equal(state.summary.variables, 3);
});

test('publish requires an executed, completed build scope, never a planned or skipped build', () => {
  const withBuild = (...entries) => ({ ...ledger, sequence: [...ledger.sequence, ...entries.map(([step, status]) => ({ step, status }))] });
  for (const candidate of [ledger, withBuild([5, 'todo']), withBuild([5, 'skip'], [25, 'skip']), withBuild([26, 'done'])]) {
    assert.deepEqual(publishStatus(candidate), { status: 'not-run', eligible: false });
  }
  for (const status of ['building', 'qa']) assert.deepEqual(publishStatus(withBuild([5, status])), { status: 'building', eligible: false });
  assert.deepEqual(publishStatus(withBuild([5, 'error'])), { status: 'failed', eligible: false });
  assert.deepEqual(publishStatus(withBuild([5, 'done'], [6, 'todo'])), { status: 'incomplete', eligible: false });
  assert.deepEqual(publishStatus(withBuild([5, 'done'], [6, 'done'], [22, 'skip'])), { status: 'ready', eligible: true }, 'completed partial scope does not require every possible DS page');
  const skippedFigma = withBuild([5, 'done']);
  skippedFigma.sequence = skippedFigma.sequence.map(e => e.step === 2 ? { ...e, status: 'skip' } : e);
  assert.deepEqual(publishStatus(skippedFigma), { status: 'incomplete', eligible: false });
  for (const candidate of [null, {}, { sequence: [null] }, withBuild([5, 'mystery']), withBuild([5.5, 'done'])]) {
    assert.deepEqual(publishStatus(candidate), { status: 'unavailable', eligible: false });
  }
});

test('publish status reads the latest ledger on every request and remains read-only', async t => {
  const { output, run } = await fixture(t);
  const started = JSON.parse((await run('start')).stdout);
  const url = `${started.url}/api/publish-status`;
  assert.deepEqual(await (await fetch(url)).json(), { status: 'not-run', eligible: false });
  const file = path.join(output, 'ds-create-ledger.json');
  const completed = JSON.stringify({ ...ledger, sequence: [...ledger.sequence, { step: 5, status: 'done' }, { step: 6, status: 'done' }] });
  await writeFile(file, completed);
  const response = await fetch(url);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'ready', eligible: true });
  assert.equal((await fetch(url, { method: 'POST', body: '{}' })).status, 405);
  assert.equal(await readFile(file, 'utf8'), completed);
  await writeFile(file, '{');
  assert.deepEqual(await (await fetch(url)).json(), { status: 'unavailable', eligible: false });
});

test('skipping required Figma verification cannot complete init even when foundation output is saved', async t => {
  const { output } = await fixture(t);
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify({ ...ledger, sequence: ledger.sequence.map(e => e.step === 2 ? { ...e, status: 'skip' } : e) }));
  const state = await getState(output);
  assert.equal(state.initDone, false);
  assert.equal(state.status, 'incomplete');
  assert.equal(state.steps.filter(s => s.status === 'done').length, 3);
  assert.equal(state.steps.find(s => s.step === 2).required, true);
  assert.equal(state.foundations[0].status, 'ready', 'saved output remains inspectable');
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify(ledger));
  assert.equal((await getState(output)).initDone, true);
  assert.equal((await getState(output)).status, 'ready');
});

test('planned export does not count as completed Figma output; explicit progress controls the live view', async t => {
  const { output, run } = await fixture(t);
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify({ ...ledger, sequence: ledger.sequence.map(e => e.step === 4 ? { ...e, status: 'building' } : e) }));
  assert.equal((await getState(output)).foundations[0].status, 'generating');
  await run('progress', '--foundation', 'color', '--status', 'ready');
  assert.equal((await getState(output)).foundations[0].status, 'ready');
  await run('progress', '--foundation', 'typography', '--status', 'error', '--message', 'Font not installed.');
  const state = await getState(output);
  assert.equal(state.status, 'error');
  assert.equal(state.foundations[1].message, 'Font not installed.');
});

test('missing, malformed and unsupported exports show a recoverable problem and never ready specimens', async t => {
  const { output } = await fixture(t);
  const file = path.join(output, 'figma/figma-variables.json');
  for (const content of ['{', JSON.stringify({ format: 'unknown', variables: [] }), JSON.stringify({ ...data, collections: [null] }), JSON.stringify({ ...data, textStyles: [null] })]) {
    await writeFile(file, content);
    const state = await getState(output);
    assert.equal(state.foundations[0].status, 'error');
    assert.ok(state.warnings.length);
    assert.equal(state.summary.variables, 0);
  }
  await rm(file);
  assert.equal((await getState(output)).foundations[0].status, 'error');
});

test('missing and circular aliases remain visible; untrusted Figma links are not rendered', async t => {
  const { output } = await fixture(t);
  const broken = structuredClone(data);
  broken.variables[0].values.Value = { alias: 'color/text/primary' };
  broken.variables[1].values.Dark = { alias: 'missing' };
  await writeFile(path.join(output, 'figma/figma-variables.json'), JSON.stringify(broken));
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify({ ...ledger, figma: { url: 'javascript:alert(1)' } }));
  const state = await getState(output);
  assert.equal(state.figmaUrl, null);
  assert.equal(state.foundations[0].variables[1].resolved.Light.error, 'Circular alias');
  assert.equal(state.foundations[0].variables[1].resolved.Dark.error, 'Unresolved alias');
});

test('empty workspace stays pending and a recorded failed audit cannot become Init complete', async t => {
  const { output } = await fixture(t);
  const file = path.join(output, 'ds-create-ledger.json');
  await rm(file);
  assert.equal((await getState(output)).status, 'pending');
  assert.equal((await getState(output)).foundations[0].status, 'pending');
  await writeFile(file, JSON.stringify({ ...ledger, tokens: { audit: { fail: 2 } } }));
  const state = await getState(output);
  assert.equal(state.status, 'error');
  assert.equal(state.summary.audit, '2 findings');
});

test('localhost lifecycle: detached start, live updates, safe routes, idempotent reuse and stop', async t => {
  const { output, run } = await fixture(t);
  t.after(async () => { try { await run('stop'); } catch { /* cleanup */ } });
  const started = JSON.parse((await run('start')).stdout);
  assert.equal(started.reused, false);
  const health = await (await fetch(`${started.url}/api/health`)).json();
  assert.equal(health.outputDir, output);
  assert.equal(health.pid, started.pid);
  assert.match(await (await fetch(started.url)).text(), /DS Create Builder/);
  for (const font of preparedFonts) {
    const response = await fetch(`${started.url}/client/assets/fonts/${font.file}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'font/ttf');
    const bytes = new DataView(await response.arrayBuffer());
    assert.equal(bytes.getUint32(0), 0x00010000, `${font.family} has a TrueType header`);
  }
  assert.match(await (await fetch(`${started.url}/client/assets/fonts/inter-OFL.txt`)).text(), /SIL OPEN FONT LICENSE/);
  assert.equal((await fetch(`${started.url}/client/assets/fonts/sources.json`)).status, 404);
  assert.match(await readFile(path.join(output, 'manager/docs-presentation.css'), 'utf8'), /docs-reading-card/);
  assert.match(await readFile(path.join(output, 'manager/chrome.css'), 'utf8'), /chrome-fallbacks/);
  await assert.rejects(access(path.join(output,'manager/cli.mjs')),{code:'ENOENT'});
  await assert.rejects(access(path.join(output,'manager/README.md')),{code:'ENOENT'});
  for(const route of ['/server/index.mjs','/server/setup.mjs','/foundations/compiler.mjs'])assert.equal((await fetch(started.url+route)).status,404);
  const again = JSON.parse((await run('start')).stdout);
  assert.equal(again.pid, started.pid);
  assert.equal(again.reused, true);
  await run('progress', '--foundation', 'color', '--status', 'generating');
  assert.equal((await (await fetch(`${started.url}/api/state`)).json()).foundations[0].status, 'generating');
  await run('progress', '--foundation', 'color', '--status', 'ready');
  assert.equal((await (await fetch(`${started.url}/api/state`)).json()).foundations[0].status, 'ready');
  assert.equal((await fetch(`${started.url}/state.mjs`)).status, 404);
  assert.equal((await fetch(`${started.url}/../ds-create-ledger.json`)).status, 404);
  assert.equal((await fetch(`${started.url}/api/state`, { method: 'POST', body: '{}' })).status, 405);
  await run('stop');
  assert.equal(JSON.parse((await run('status')).stdout).running, false);
});

test('occupied requested port fails without attaching to another server', async t => {
  const { run } = await fixture(t);
  const other = http.createServer((_, res) => res.end('unrelated'));
  await new Promise(resolve => other.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => other.close(resolve)));
  await assert.rejects(run('start', '--port', String(other.address().port)), /Manager did not start/);
  assert.equal(JSON.parse((await run('status')).stdout).running, false);
});

test('two workspaces with the same slug keep separate servers and state', async t => {
  const first = await fixture(t);
  const second = await fixture(t);
  await writeFile(path.join(second.output, 'ds-create-ledger.json'), JSON.stringify({ ...ledger, system: 'Second system' }));
  const a = JSON.parse((await first.run('start')).stdout);
  const b = JSON.parse((await second.run('start')).stdout);
  assert.notEqual(a.url, b.url);
  assert.equal((await (await fetch(`${a.url}/api/state`)).json()).system, 'Fixture system');
  assert.equal((await (await fetch(`${b.url}/api/state`)).json()).system, 'Second system');
  await first.run('stop');
  assert.equal((await fetch(`${b.url}/api/health`)).status, 200);
});

test('status does not create missing Manager directories, and invalid slugs cannot escape output', async t => {
  const { root, run } = await fixture(t);
  await exec(process.execPath, [CLI, 'status', '--slug', 'absent', '--workspace', root]);
  await assert.rejects(access(path.join(root, 'workspace/output/absent')));
  await assert.rejects(exec(process.execPath, [CLI, 'start', '--slug', '../escape', '--workspace', root]));
  assert.equal(JSON.parse((await run('status')).stdout).running, false);
});

test('Builder opens a local draft before any Figma output and reports approval separately from init', async t => {
  const { output, run } = await fixture(t);
  await rm(path.join(output, 'figma'), { recursive: true });
  const draft = { ...data, format: 'ds-create/foundations@1', revision: 1 };
  const initial = { ...ledger, figma: undefined, foundationReview: { status: 'pending' }, sequence: ledger.sequence.map(e => ({ ...e, status: e.step === 1 ? 'done' : 'todo' })) };
  await writeFile(path.join(output, 'foundations.json'), JSON.stringify(draft));
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify(initial));
  const started = JSON.parse((await run('start')).stdout);
  const state = await (await fetch(`${started.url}/api/state`)).json();
  assert.equal(state.status, 'review');
  assert.equal(state.initDone, false);
  assert.equal(state.figmaUrl, null);
  assert.equal(state.source.kind, 'local');
  assert.equal(state.source.review, 'pending');
  assert.equal(state.foundations[0].status, 'ready');
  assert.equal(state.foundations[0].variables[1].resolved.Light.value, '#171717');
  assert.equal(state.foundations[1].styles[0].fontSize, 16);
  const status = JSON.parse((await run('status')).stdout);
  assert.equal(status.source.hash, state.source.hash);
  assert.equal(status.initDone, false);
  assert.equal((await fetch(`${started.url}/api/state`, { method: 'POST', body: '{}' })).status, 405);
  await assert.rejects(access(path.join(output, 'figma')), 'launch never creates a Figma output directory');
});

test('local draft takes precedence; approved current hash, confirmed export and audit are required for sync', async t => {
  const { output } = await fixture(t);
  const draft = { ...structuredClone(data), format: 'ds-create/foundations@1', revision: 1 };
  draft.variables[0].values.Value = '#222222';
  const draftFile = path.join(output, 'foundations.json');
  const ledgerFile = path.join(output, 'ds-create-ledger.json');
  await writeFile(draftFile, JSON.stringify(draft));
  let state = await getState(output);
  assert.equal(state.status, 'review', 'old completed Figma steps cannot approve a new draft');
  assert.equal(state.foundations[0].variables[1].resolved.Light.value, '#222222');
  const completed = { ...ledger, sequence: [...ledger.sequence, { step: 5, status: 'done' }], foundationReview: {
    status: 'approved', hash: state.source.hash, approvedBy: 'user', approvedAt: new Date().toISOString(), approvalSource: 'answers/01-init.md#review',
  } };
  await writeFile(ledgerFile, JSON.stringify(completed));
  state = await getState(output);
  assert.equal(state.status, 'approved');
  assert.equal(state.initDone, false);
  assert.deepEqual(await getPublishStatus(output), { status: 'incomplete', eligible: false });
  completed.foundationReview.figmaHash = state.source.hash;
  await writeFile(ledgerFile, JSON.stringify(completed));
  assert.equal((await getState(output)).source.review, 'approved', 'matching hash alone is not a successful audit');
  completed.tokens = { audit: { fail: 0 } };
  await writeFile(ledgerFile, JSON.stringify(completed));
  assert.equal((await getState(output)).source.review, 'approved', 'a passing audit cannot mask a different exported value');
  await writeFile(path.join(output,'figma/figma-variables.json'),JSON.stringify({...draft,format:'ds-create/figma-variables@1'}));
  assert.equal((await getState(output)).source.review, 'synced');
  assert.equal((await getState(output)).initDone, true);
  assert.deepEqual(await getPublishStatus(output), { status: 'ready', eligible: true });
  const syncedLedger = structuredClone(completed);
  for (const mutation of [
    l => { l.foundationReview.approvedBy = 'AI'; },
    l => { delete l.foundationReview.approvalSource; },
    l => { l.foundationReview.approvedAt = 'invalid'; },
    l => { l.sequence.find(e => e.step === 2).status = 'skip'; },
    l => { l.sequence.push({ step: 2, status: 'todo' }); },
    l => { l.tokens.audit.fail = 1; },
  ]) {
    const candidate = structuredClone(syncedLedger);
    mutation(candidate);
    await writeFile(ledgerFile, JSON.stringify(candidate));
    assert.equal((await getState(output)).initDone, false);
    assert.deepEqual(await getPublishStatus(output), { status: 'incomplete', eligible: false });
  }
  await writeFile(ledgerFile, JSON.stringify(syncedLedger));
  await rm(path.join(output, 'figma/figma-variables.json'));
  assert.equal((await getState(output)).source.review, 'approved', 'confirmed Figma export is required');
  await writeFile(path.join(output, 'figma/figma-variables.json'), JSON.stringify(data));
  await writeFile(draftFile, JSON.stringify({ ...draft, revision: 2 }));
  state = await getState(output);
  assert.equal(state.source.review, 'pending');
  assert.equal(state.initDone, false);
  assert.deepEqual(await getPublishStatus(output), { status: 'incomplete', eligible: false });
  await writeFile(draftFile, JSON.stringify(draft) + '\n');
  assert.equal((await getState(output)).source.review, 'pending', 'approval binds exact saved bytes');
});

test('invalid or missing tracked drafts cannot fall back to stale Figma data or bypass publish', async t => {
  const { output } = await fixture(t);
  const file = path.join(output, 'foundations.json');
  await writeFile(path.join(output, 'ds-create-ledger.json'), JSON.stringify({ ...ledger, foundationReview: { status: 'pending' }, sequence: [...ledger.sequence, { step: 5, status: 'done' }] }));
  for (const content of ['{', 'null', JSON.stringify({ ...data, format: 'ds-create/foundations@1', revision: 0 }), JSON.stringify({ ...data, format: 'ds-create/foundations@1', revision: 1, variables: [null] })]) {
    await writeFile(file, content);
    const state = await getState(output);
    assert.equal(state.status, 'error');
    assert.equal(state.source.review, 'invalid');
    assert.equal(state.summary.variables, 0);
    assert.equal(state.initDone, false);
    assert.deepEqual(await getPublishStatus(output), { status: 'incomplete', eligible: false });
  }
  await rm(file);
  assert.equal((await getState(output)).source.review, 'invalid');
  assert.equal((await getState(output)).summary.variables, 0);
  assert.deepEqual(await getPublishStatus(output), { status: 'incomplete', eligible: false });
});
