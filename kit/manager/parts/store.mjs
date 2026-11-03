// The only writer of parts/{id}.json. Same rules as the foundation store: one revision per save, the shared
// foundations.lock, staged renames, a history snapshot per revision, and the regenerated part pack.
import {mkdir, readFile, readdir, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {ItemError} from '../foundations/ops.mjs';
import {assertApproved, withLock} from '../foundations/store.mjs';
import {PublishError} from '../server/files.mjs';
import {buildOrder, partTemplates, templateFor} from './templates.mjs';
import {buildPart, partFile, partStatus, readPart, readParts, staleBy} from './files.mjs';
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
export function mergeOverrides(base, over) {
  const out = {...structuredClone(base)};
  for (const [key, value] of Object.entries(over)) {
    if (key === 'treatments' && plain(value)) { out.treatments = {...(out.treatments || {})}; for (const [k, t] of Object.entries(value)) out.treatments[k] = {...(out.treatments[k] || {}), ...t}; }
    else if (key === 'sizes' && plain(value)) { out.sizes = {...(out.sizes || {})}; for (const [k, z] of Object.entries(value)) out.sizes[k] = {...(out.sizes[k] || {}), ...z, ...(z?.padding || out.sizes[k]?.padding ? {padding: {...(out.sizes[k]?.padding || {}), ...(z?.padding || {})}} : {})}; }
    // Other Parts: map is set → row → slot, measures set → size → slot.
    else if (['map', 'measures'].includes(key) && plain(value)) { out[key] = structuredClone(out[key] || {}); for (const [set, rows] of Object.entries(value)) { out[key][set] ||= {}; for (const [k, slots] of Object.entries(rows || {})) out[key][set][k] = {...(out[key][set][k] || {}), ...slots}; } }
    // A component token choice per token name; null drops that one choice.
    else if (key === 'tokens' && plain(value)) { out.tokens = {...(out.tokens || {})}; for (const [k, v] of Object.entries(value)) { if (v === null) delete out.tokens[k]; else out.tokens[k] = v; } }
    else out[key] = structuredClone(value);
  }
  return out;
}

// Button's choices are keyed as Builder saves them: treatments by tone|emphasis|state, sizes by size. The compile
// reads only those keys, so a key sent in a change that the Button does not have is refused, and choices saved for
// a tone, emphasis, state or size the structure no longer has are dropped.
const treatmentSlots = ['fill', 'border', 'text', 'icon', 'effect'];
const hasTreatment = (part, key) => { const [tone, emphasis, state] = key.split('|'); return !!part.treatments[tone]?.[emphasis]?.[state]; };
function checkButtonOverrides(t, part, sent) {
  for (const [key, slots] of Object.entries(sent.treatments)) {
    if (!hasTreatment(part, key)) throw new ItemError(`${t.name} treatments are keyed tone|emphasis|state, like brand|primary|rest; ${key} is not one.`);
    const slot = Object.keys(slots || {}).find(s => !treatmentSlots.includes(s));
    if (slot) throw new ItemError(`${t.name} treatments set fill, border, text, icon or effect; ${slot} is not one.`);
  }
  for (const size of Object.keys(sent.sizes)) if (!part.sizes.some(z => z.size === size)) throw new ItemError(`${t.name} has no size ${size}.`);
  const {treatments, sizes, ...rest} = part.overrides || {};
  part.overrides = {...rest,
    ...(treatments ? {treatments: Object.fromEntries(Object.entries(treatments).filter(([key]) => hasTreatment(part, key)))} : {}),
    ...(sizes ? {sizes: Object.fromEntries(Object.entries(sizes).filter(([size]) => part.sizes.some(z => z.size === size)))} : {})};
}
// A change to sizes, emphases, tones, states or properties changes the contract: that is the user's call.
// users: the names of the prepared templates that use this Part, directly or through another; they become
// outdated. broken: those that cannot be prepared again on the new structure, with the first reason.
const and = list => list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : list[0];
export function structureChange(template, before, after, users = [], broken = []) {
  const a = template.contract(before), b = template.contract(after);
  if (same(a.properties, b.properties) && a.variantCount === b.variantCount && same(a.sets, b.sets)) return null;
  const props = c => (c.sets || [c]).flatMap(s => s.properties);
  const names = c => new Set(props(c).map(x => x.name + '=' + JSON.stringify(x.values ?? x.default)));
  const was = names(a), now = names(b), moved = [...new Set([...was, ...now].filter(x => !was.has(x) || !now.has(x)).map(x => x.split('=')[0]))];
  const counts = a.sets && b.sets ? [...new Set([...a.sets, ...b.sets].map(s => s.name))].map(n => `${n} ${a.sets.find(s => s.name === n)?.variantCount ?? 0} → ${b.sets.find(s => s.name === n)?.variantCount ?? 0}`).join(', ') : `${a.variantCount} → ${b.variantCount}`;
  const outdated = users.length ? `; ${and(users)} ${users.length > 1 ? 'use it and become' : 'uses it and becomes'} outdated` : '';
  const stuck = broken.length ? `; ${and(broken.map(b => b.name))} cannot be prepared again until ${broken.length > 1 ? 'their' : 'its'} inputs change (${broken[0].reason.replace(/\.$/, '')})` : '';
  return `${template.set} structure changes (${moved.join(', ') || 'properties'}; ${counts} variants${outdated}${stuck})`;
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
    return partTemplates.map(t => {
      const status = draft ? partStatus(parts[t.id], draft, parts) : 'not-prepared';
      return {id: t.id, page: t.page, name: t.name, set: t.set, level: t.level, status, revision: parts[t.id]?.revision || 0, ...(status === 'outdated' ? {staleBy: staleBy(parts[t.id], draft, parts)} : {})};
    });
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
    ids.forEach(templateFor);
    return lock(async () => {
      await assertApproved(outputDir);
      const ctx = await context(), built = {...ctx.parts}, saved = [];
      for (const t of buildOrder(ids)) {
        for (const use of t.uses) if (partStatus(built[use], ctx.draft, built) !== 'ready') throw new ItemError(`${t.name} needs ${templateFor(use).name} first.`);
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
      const changes = [], sent = {treatments: {}, sizes: {}};
      for (const op of ops) {
        if (op.op === 'apply' && op.recipe === 'recompile') { changes.push({field: 'recompile'}); continue; }
        if (op.op !== 'set' || !['inputs', 'overrides'].includes(op.field)) throw new ItemError('Part ops are set on inputs or overrides, and apply recompile.');
        if (op.value !== null && (typeof op.value !== 'object' || Array.isArray(op.value))) throw new ItemError(`Send ${op.field} as an object, or null to clear it.`);
        // Button's token choices are treatments and sizes; every other Part's are map, measures and tokens.
        const shape = t.preview ? ['treatments', 'sizes'] : ['map', 'measures', 'tokens'];
        if (op.field === 'overrides' && op.value && Object.keys(op.value).some(k => !shape.includes(k))) throw new ItemError(`${t.name} overrides take ${shape.slice(0, -1).join(', ')} and ${shape.at(-1)}.`);
        if (op.field === 'inputs') { for (const k of Object.keys(op.value || {})) if (!t.fields.includes(k)) throw new ItemError(`${t.name} has no input ${k}.`); inputs = op.value === null ? {} : deepMerge(inputs, op.value); }
        else { overrides = op.value === null ? {} : mergeOverrides(overrides, op.value); Object.assign(sent.treatments, op.value?.treatments); Object.assign(sent.sizes, op.value?.sizes); }
        changes.push({field: op.field});
      }
      const part = buildPart(t, {draft: ctx.draft, plan: ctx.plan, inputs, overrides, previous: current, parts: ctx.parts});
      if (t.preview) checkButtonOverrides(t, part, sent);
      // Every prepared template that uses this one, directly or through another, in build order. Each is built
      // against the new structure, so the message names those that would be refused.
      const reach = new Set([id]);
      for (const x of buildOrder(partTemplates.map(y => y.id))) if (x.uses.some(u => reach.has(u))) reach.add(x.id);
      const users = buildOrder([...reach].filter(x => x !== id && ctx.parts[x])), broken = [];
      let wide = null;
      if (structureChange(t, current.inputs || {}, inputs)) {
        const built = {...ctx.parts, [id]: part};
        for (const u of users) {
          try { built[u.id] = buildPart(u, {draft: ctx.draft, plan: ctx.plan, inputs: ctx.parts[u.id].inputs || {}, overrides: ctx.parts[u.id].overrides || {}, previous: ctx.parts[u.id], parts: built}); }
          catch (e) { broken.push({name: u.name, reason: e.message}); }
        }
        wide = structureChange(t, current.inputs || {}, inputs, users.map(u => u.name), broken);
      }
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
