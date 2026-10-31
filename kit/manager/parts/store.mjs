// The only writer of parts/{id}.json. Same rules as the foundation store: one revision per save, the shared
// foundations.lock, staged renames, a history snapshot per revision, and the regenerated part pack.
import {mkdir, readFile, readdir, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {ItemError} from '../foundations/ops.mjs';
import {assertApproved, withLock} from '../foundations/store.mjs';
import {PublishError} from '../server/files.mjs';
import {partTemplates, templateFor} from './templates.mjs';
import {buildPart, partFile, partStatus, readPart, readParts} from './files.mjs';
import {createPartPack} from './pack.mjs';
import {validatePart} from './validate.mjs';

const authors = ['builder', 'mcp', 'build'];
const body = value => JSON.stringify(value, null, 2) + '\n';
async function readJSON(file) { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
// Inputs merge object by object (a list is replaced whole), so changing one role keeps the others.
const deepMerge = (base, over) => plain(base) && plain(over) ? Object.fromEntries([...new Set([...Object.keys(base), ...Object.keys(over)])].map(k => [k, k in over ? deepMerge(base[k], over[k]) : base[k]])) : structuredClone(over);
// Token choices merge per variant key and per size, the same way Builder saves them.
function mergeOverrides(base, over) {
  const out = {...structuredClone(base)};
  for (const [key, value] of Object.entries(over)) {
    if (key === 'treatments' && plain(value)) { out.treatments = {...(out.treatments || {})}; for (const [k, t] of Object.entries(value)) out.treatments[k] = {...(out.treatments[k] || {}), ...t}; }
    else if (key === 'sizes' && plain(value)) { out.sizes = {...(out.sizes || {})}; for (const [k, z] of Object.entries(value)) out.sizes[k] = {...(out.sizes[k] || {}), ...z, ...(z?.padding || out.sizes[k]?.padding ? {padding: {...(out.sizes[k]?.padding || {}), ...(z?.padding || {})}} : {})}; }
    else out[key] = structuredClone(value);
  }
  return out;
}

// A change to sizes, emphases, tones, states or properties changes the contract: that is the user's call.
function structureChange(template, before, after) {
  const a = template.contract(before), b = template.contract(after);
  if (same(a.properties, b.properties) && a.variantCount === b.variantCount) return null;
  const names = p => new Set(p.properties.map(x => x.name + '=' + JSON.stringify(x.values ?? x.default)));
  const was = names(a), now = names(b), moved = [...new Set([...was, ...now].filter(x => !was.has(x) || !now.has(x)).map(x => x.split('=')[0]))];
  return `${template.set} structure changes (${moved.join(', ') || 'properties'}; ${a.variantCount} → ${b.variantCount} variants)`;
}

export function createPartStore({outputDir}) {
  const file = name => path.join(outputDir, name);
  const historyDir = id => file(`history/parts/${id}`);
  const lock = fn => withLock(file('foundations.lock'), fn);
  async function context() {
    const draft = await readJSON(file('foundations.json'));
    if (!draft) throw new PublishError('There is no saved foundation draft yet. Prepare foundations first.', 412);
    return {draft, plan: await readJSON(file('foundation-plan.json')), parts: await readParts(outputDir), setup: await readJSON(file('manager/setup.json')) || {}};
  }
  // Stage every file, then rename: history first, part files, pack last.
  async function commit(ctx, saved, {author, reason, ops}) {
    const writes = [], all = {...ctx.parts, ...Object.fromEntries(saved.map(p => [p.id, p]))};
    for (const p of saved) {
      const prev = ctx.parts[p.id];
      if (prev && !await readJSON(path.join(historyDir(p.id), prev.revision + '.json'))) writes.push([path.join(historyDir(p.id), prev.revision + '.json'), body({format: 'ds-create/part-history@1', revision: prev.revision, author: 'preparation', reason: 'Saved before the first edit', ops: [], time: new Date().toISOString(), part: prev})]);
      writes.push([path.join(historyDir(p.id), p.revision + '.json'), body({format: 'ds-create/part-history@1', revision: p.revision, author, reason, ops, time: new Date().toISOString(), part: p})]);
      writes.push([partFile(outputDir, p.id), body(p)]);
    }
    const ready = Object.fromEntries(Object.entries(all).filter(([, p]) => p.format === 'ds-create/part@2'));
    writes.push(...createPartPack({parts: ready, draft: ctx.draft, projectName: ctx.setup.projectName || 'Design system'}).files.map(([name, text]) => [file(name), text]));
    const staged = [];
    for (const [target, text] of writes) { await mkdir(path.dirname(target), {recursive: true}); const temp = `${target}.${randomUUID()}.tmp`; await writeFile(temp, text); staged.push([temp, target]); }
    for (const [temp, target] of staged) await rename(temp, target);
  }
  function checkInput({reason, author}) {
    if (typeof reason !== 'string' || !reason.trim() || reason.length > 200) throw new ItemError('Send a reason of 1–200 characters.');
    if (!authors.includes(author)) throw new ItemError('Unknown author.');
  }

  async function list() {
    const draft = await readJSON(file('foundations.json')), parts = await readParts(outputDir);
    return partTemplates.map(t => ({id: t.id, page: t.page, name: t.name, set: t.set, level: t.level, status: draft ? partStatus(parts[t.id], draft) : 'not-prepared', revision: parts[t.id]?.revision || 0}));
  }
  async function read(id) {
    templateFor(id);
    const part = await readPart(outputDir, id);
    if (!part) throw new PublishError(`${templateFor(id).name} is not prepared yet.`, 412);
    return {revision: part.revision, part};
  }

  // Bottom-up: a Part is built only after every set it uses has a current file.
  async function prepare({ids, author, reason = 'Prepare Parts'}) {
    checkInput({reason, author});
    if (!Array.isArray(ids) || !ids.length) throw new ItemError('Choose the Parts to prepare.');
    const wanted = ids.map(id => templateFor(id));
    return lock(async () => {
      await assertApproved(outputDir);
      const ctx = await context(), built = {...ctx.parts}, saved = [];
      for (const t of partTemplates.filter(x => wanted.includes(x))) {
        for (const use of t.uses) if (partStatus(built[use], ctx.draft) !== 'ready') throw new ItemError(`${t.name} needs ${templateFor(use).name} first.`);
        const previous = ctx.parts[t.id];
        const part = buildPart(t, {draft: ctx.draft, plan: ctx.plan, inputs: previous?.inputs || {}, overrides: previous?.overrides || {}, previous, parts: built});
        built[t.id] = part; saved.push({...part, prepared: new Date().toISOString()});
      }
      await commit(ctx, saved, {author, reason: reason.trim(), ops: []});
      return {prepared: saved.map(p => ({id: p.id, revision: p.revision}))};
    });
  }

  async function change({id, expectedRevision, ops, reason, author, dryRun = false, confirmed = false}) {
    checkInput({reason, author});
    if (!Number.isInteger(expectedRevision)) throw new ItemError('Send expectedRevision, the revision you read.');
    if (!Array.isArray(ops) || !ops.length) throw new ItemError('Send at least one op.');
    if (ops.some(op => op?.target !== `part:${id}`)) throw new ItemError('Send one target per save.');
    const t = templateFor(id);
    const run = async () => {
      await assertApproved(outputDir);
      const ctx = await context(), current = ctx.parts[id];
      if (!current) throw new PublishError(`${t.name} is not prepared yet.`, 412);
      if (current.revision !== expectedRevision) throw new PublishError(`${t.name} changed to revision ${current.revision}. Reload and try again.`, 409);
      let inputs = structuredClone(current.inputs || {}), overrides = structuredClone(current.overrides || {});
      const changes = [];
      for (const op of ops) {
        if (op.op === 'apply' && op.recipe === 'recompile') { changes.push({field: 'recompile'}); continue; }
        if (op.op !== 'set' || !['inputs', 'overrides'].includes(op.field)) throw new ItemError('Part ops are set on inputs or overrides, and apply recompile.');
        if (op.value !== null && (typeof op.value !== 'object' || Array.isArray(op.value))) throw new ItemError(`Send ${op.field} as an object, or null to clear it.`);
        if (op.field === 'inputs') { for (const k of Object.keys(op.value || {})) if (!t.fields.includes(k)) throw new ItemError(`${t.name} has no input ${k}.`); inputs = op.value === null ? {} : deepMerge(inputs, op.value); }
        else overrides = op.value === null ? {} : mergeOverrides(overrides, op.value);
        changes.push({field: op.field});
      }
      const wide = structureChange(t, current.inputs || {}, inputs);
      const part = buildPart(t, {draft: ctx.draft, plan: ctx.plan, inputs, overrides, previous: current, parts: ctx.parts});
      if (dryRun) return {revision: current.revision, changes, wide, dryRun: true};
      if (wide && !confirmed) throw Object.assign(new PublishError(`This change is wide: ${wide}. Discuss it with the user, then resend with confirmed: true.`, 428), {changes, wide});
      await commit(ctx, [{...part, prepared: current.prepared, updated: new Date().toISOString()}], {author, reason: reason.trim(), ops});
      return {revision: part.revision, changes, wide, dryRun: false};
    };
    return dryRun ? run() : lock(run);
  }

  async function history(id, {limit = 20} = {}) {
    templateFor(id);
    const names = await readdir(historyDir(id)).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
    const revisions = names.map(n => n.match(/^(\d+)\.json$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => b - a).slice(0, limit);
    return Promise.all(revisions.map(async revision => { const h = await readJSON(path.join(historyDir(id), revision + '.json')); return {revision, author: h.author, reason: h.reason, ops: h.ops?.length || 0, time: h.time}; }));
  }
  async function restore({id, revision, expectedRevision, author}) {
    if (!Number.isInteger(revision) || revision < 1) throw new ItemError('Send the revision number to restore.');
    checkInput({reason: `Restore revision ${revision}`, author});
    const t = templateFor(id);
    return lock(async () => {
      await assertApproved(outputDir);
      const ctx = await context(), current = ctx.parts[id];
      if (!current || current.revision !== expectedRevision) throw new PublishError(`${t.name} changed to revision ${current?.revision ?? 0}. Reload and try again.`, 409);
      const snapshot = await readJSON(path.join(historyDir(id), revision + '.json'));
      if (!snapshot?.part) throw new ItemError(`Revision ${revision} is not in the history.`);
      // An old revision may point at foundation names that are gone now.
      const check = validatePart(snapshot.part, t, {draft: ctx.draft, parts: ctx.parts, inputs: snapshot.part.inputs || {}});
      if (!check.valid) throw new ItemError(check.errors[0]);
      const part = {...snapshot.part, revision: current.revision + 1};
      await commit(ctx, [part], {author, reason: `Restore revision ${revision}`, ops: []});
      return {revision: part.revision, changes: []};
    });
  }
  async function canUndo(id, revision) { return Number.isInteger(revision) && revision > 1 && !!await readJSON(path.join(historyDir(id), (revision - 1) + '.json')); }

  return {list, read, prepare, change, history, restore, canUndo};
}
