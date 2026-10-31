// The only writer of foundations.json. Builder and the MCP tools both save through it: one revision per save,
// a cross-process lock, atomic renames, the regenerated pack, the rules file and a history snapshot per revision.
import {mkdir, open, readFile, readdir, rename, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {applyOps, defaultRules, draftWarnings, isWide, ItemError} from './ops.mjs';
import {validateFoundations} from './validate.mjs';
import {createFoundationPack} from './pack.mjs';
import {PublishError} from '../server/files.mjs';
import {latestPublish} from '../server/publish.mjs';

const LOCK_WAIT_MS = 2000, LOCK_STALE_MS = 30000;
const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const authors = ['builder', 'mcp'];
const body = value => JSON.stringify(value, null, 2) + '\n';
async function readJSON(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

async function withLock(file, fn) {
  const started = Date.now();
  let handle;
  while (!handle) {
    try { handle = await open(file, 'wx'); }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const info = await stat(file).catch(() => null);
      if (info && Date.now() - info.mtimeMs > LOCK_STALE_MS) { await unlink(file).catch(() => {}); continue; }
      if (Date.now() - started > LOCK_WAIT_MS) throw new PublishError('Foundations are being saved by another process. Try again.', 409);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  try { return await fn(); } finally { await handle.close(); await unlink(file).catch(() => {}); }
}

export function createItemStore({outputDir}) {
  const file = name => path.join(outputDir, name);
  const historyDir = file('history/foundations');

  async function setup() { return await readJSON(file('manager/setup.json')) || {}; }
  async function decisions(s) { return s.jobId ? await readJSON(file(`manager/setup-jobs/${s.jobId}/decisions.json`)) : null; }
  // First save: palette anchors from the preparation decisions, and the names preparation produced as the contract.
  async function seedRules(plan) {
    const rules = {...defaultRules(), inputHash: plan?.inputHash ?? null}, palettes = (await decisions(await setup()))?.domains?.color?.inputs?.palettes || {};
    for (const [family, p] of Object.entries(palettes)) if (p?.anchors) rules.palettes[family] = {anchors: {...p.anchors}, steps: p.steps || RAMP_STEPS, rule: 'ramp'};
    rules.contract = plan ? [...new Set(Object.values(plan.domains).flatMap(d => [...(d.variables || []), ...(d.styles || [])]))] : [];
    return rules;
  }
  async function read() {
    const draft = await readJSON(file('foundations.json'));
    if (!draft) throw new PublishError('There is no saved foundation draft yet. Prepare foundations first.', 412);
    const plan = await readJSON(file('foundation-plan.json')), saved = await readJSON(file('foundation-rules.json'));
    // A new preparation brings new anchors and names; the user's discussion limits carry over.
    const stale = saved && plan && saved.inputHash !== plan.inputHash;
    const rules = !saved ? await seedRules(plan) : stale ? {...await seedRules(plan), discuss: saved.discuss} : saved;
    return {revision: draft.revision, draft, plan, rules, rulesSaved: !!saved && !stale};
  }

  // Stage every file, then rename in order: history, plan, pack, rules, draft, ledger last.
  async function commit(current, next, {plan, rules, author, reason, ops}) {
    const writes = [];
    if (!await readJSON(path.join(historyDir, current.revision + '.json'))) writes.push([path.join(historyDir, current.revision + '.json'), body({format: 'ds-create/foundation-history@1', revision: current.revision, author: 'preparation', reason: 'Saved before the first edit', ops: [], time: new Date().toISOString(), draft: current.draft, plan: current.plan, rules: current.rules})]);
    writes.push([path.join(historyDir, next.revision + '.json'), body({format: 'ds-create/foundation-history@1', revision: next.revision, author, reason, ops, time: new Date().toISOString(), draft: next, plan, rules})]);
    if (plan) {
      writes.push([file('foundation-plan.json'), body(plan)]);
      const s = await setup();
      const pack = createFoundationPack({draft: next, plan, decision: await decisions(s) || {}, request: {projectName: s.projectName ?? plan.projectName, interfaceDetails: s.interfaceDetails}});
      await mkdir(file('foundations'), {recursive: true});
      writes.push(...pack.files.map(([name, text]) => [file(name), text]));
    }
    writes.push([file('foundation-rules.json'), body(rules)], [file('foundations.json'), body(next)]);
    const ledger = await readJSON(file('ds-create-ledger.json'));
    if (ledger) writes.push([file('ds-create-ledger.json'), body({...ledger, foundationReview: {status: 'pending'}})]);
    await mkdir(historyDir, {recursive: true});
    const staged = [];
    for (const [target, text] of writes) { const temp = `${target}.${randomUUID()}.tmp`; await writeFile(temp, text); staged.push([temp, target]); }
    for (const [temp, target] of staged) await rename(temp, target);
  }

  function checkInput({expectedRevision, reason, author}) {
    if (!Number.isInteger(expectedRevision)) throw new ItemError('Send expectedRevision, the revision you read.');
    if (typeof reason !== 'string' || !reason.trim() || reason.length > 200) throw new ItemError('Send a reason of 1–200 characters.');
    if (!authors.includes(author)) throw new ItemError('Unknown author.');
  }
  const stale = revision => new PublishError(`Foundations changed to revision ${revision}. Reload and try again.`, 409);
  // A publish reads the draft while it writes Figma, and preparation rewrites it: neither may see a save midway.
  async function assertIdle() {
    const job = await latestPublish(outputDir).catch(() => null);
    if (['prepared', 'queued', 'running'].includes(job?.status)) throw new PublishError('A publish is running. Save again when it finishes.', 409);
    if (['queued', 'running'].includes((await setup()).status)) throw new PublishError('Preparation is running. Save again when it finishes.', 409);
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  async function change({expectedRevision, ops, reason, author, dryRun = false, confirmed = false}) {
    checkInput({expectedRevision, reason, author});
    const run = async () => {
      const current = await read();
      if (current.revision !== expectedRevision) throw stale(current.revision);
      if (!dryRun) await assertIdle();
      const result = applyOps(current.draft, ops, {plan: current.plan, rules: current.rules});
      const wide = isWide(result.impact, ops, result.rules);
      const summary = {changes: result.changes, warnings: result.warnings, impact: result.impact, wide};
      if (dryRun) return {revision: current.revision, ...summary, dryRun: true};
      // Nothing changed (the same preset clicked again): no revision, and an approved draft stays approved.
      if (same(result.draft, current.draft) && same(result.plan, current.plan) && same(result.rules, current.rules)) return {revision: current.revision, ...summary, changes: [], wide: null, dryRun: false, unchanged: true};
      if (wide && !confirmed) throw Object.assign(new PublishError(`This change is wide: ${wide}. Discuss it with the user, then resend with confirmed: true.`, 428), summary);
      const next = {...result.draft, revision: current.revision + 1};
      await commit(current, next, {plan: result.plan, rules: result.rules, author, reason: reason.trim(), ops});
      return {revision: next.revision, ...summary, dryRun: false};
    };
    return dryRun ? run() : withLock(file('foundations.lock'), run);
  }

  async function history({limit = 20} = {}) {
    const names = await readdir(historyDir).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
    const revisions = names.map(n => n.match(/^(\d+)\.json$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => b - a).slice(0, limit);
    return Promise.all(revisions.map(async revision => {
      const h = await readJSON(path.join(historyDir, revision + '.json'));
      return {revision, author: h.author, reason: h.reason, ops: h.ops?.length || 0, time: h.time};
    }));
  }

  // Restoring copies an old snapshot forward as a new revision; history is never rewritten.
  async function restore({revision, expectedRevision, author}) {
    if (!Number.isInteger(revision) || revision < 1) throw new ItemError('Send the revision number to restore.');
    checkInput({expectedRevision, reason: `Restore revision ${revision}`, author});
    return withLock(file('foundations.lock'), async () => {
      const current = await read();
      if (current.revision !== expectedRevision) throw stale(current.revision);
      await assertIdle();
      const snapshot = await readJSON(path.join(historyDir, revision + '.json'));
      if (!snapshot?.draft) throw new ItemError(`Revision ${revision} is not in the history.`);
      const check = validateFoundations(snapshot.draft);
      if (!check.valid) throw new ItemError(check.errors.slice(0, 5).join(' '));
      const plan = snapshot.plan ?? current.plan, rules = snapshot.rules ?? current.rules, next = {...snapshot.draft, revision: current.revision + 1};
      await commit(current, next, {plan, rules, author, reason: `Restore revision ${revision}`, ops: []});
      return {revision: next.revision, changes: [], warnings: draftWarnings(next, plan, rules)};
    });
  }

  // Undo needs the revision before this one in the history; preparation's earlier revisions are not kept there.
  async function canUndo(revision) { return Number.isInteger(revision) && revision > 1 && !!await readJSON(path.join(historyDir, (revision - 1) + '.json')); }
  async function typeScale() { return (await readJSON(file('foundation-rules.json')))?.baselines?.type?.percent ?? 100; }

  return {read, change, history, restore, canUndo, typeScale};
}
