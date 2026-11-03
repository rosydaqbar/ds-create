// Part files (parts/{id}.json, ds-create/part@2): the system's inputs and overrides, the compiled output,
// a hash of every foundation item the Part uses and the structure hash of every Part it uses, so only a change
// to one of those makes it outdated.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ItemError} from '../foundations/ops.mjs';
import {itemHashes} from '../foundations/baseline.mjs';
import {partTemplates} from './templates.mjs';
import {validatePart} from './validate.mjs';
import {replaceInPart} from './refs.mjs';

export const PART_FORMAT = 'ds-create/part@2';
export const partFile = (outputDir, id) => path.join(outputDir, 'parts', `${id}.json`);
export const draftHash = draft => createHash('sha256').update(JSON.stringify(draft, null, 2) + '\n').digest('hex');

export async function readPart(outputDir, id) {
  try { return JSON.parse(await readFile(partFile(outputDir, id), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
export async function readParts(outputDir) {
  const parts = {};
  for (const t of partTemplates) { const p = await readPart(outputDir, t.id); if (p && ['ds-create/part@1', PART_FORMAT].includes(p.format)) parts[t.id] = p; }
  return parts;
}

const keyOf = draft => {
  const keys = new Map();
  for (const v of draft.variables) keys.set(v.name, 'variable:' + v.name);
  for (const [list, kind] of [['textStyles', 'textStyle'], ['effectStyles', 'effectStyle'], ['gridStyles', 'gridStyle'], ['paintStyles', 'paintStyle']]) for (const s of draft[list] || []) keys.set(s.name, kind + ':' + s.name);
  return keys;
};
// Every foundation name the compiled Part mentions, with that item's current hash.
function dependencies(compiled, draft) {
  const keys = keyOf(draft), hashes = itemHashes(draft).items, found = new Set();
  const walk = x => { if (typeof x === 'string') { if (keys.has(x)) found.add(x); } else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
  // A mixed color holds a resolved value, so every item on its alias chain counts, down to the primitive.
  const vars = new Map(draft.variables.map(v => [v.name, v])), chain = (name, seen = new Set()) => {
    if (seen.has(name) || !vars.has(name)) return;
    seen.add(name); found.add(name);
    for (const x of Object.values(vars.get(name).values || {})) if (x?.alias) chain(x.alias, seen);
  };
  for (const m of Object.values(compiled.mixes || {})) chain(m.role);
  walk({tokens: compiled.tokens.map(t => t.values), mixes: compiled.mixes, sizes: compiled.sizes, treatments: compiled.treatments, map: compiled.map, measures: compiled.measures, overrides: compiled.overrides});
  // A gradient draws its stops' colors, so every item on each stop's alias chain counts too.
  for (const g of (draft.paintStyles || []).filter(p => found.has(p.name))) for (const p of g.paints || []) for (const st of p.stops || []) if (st.color?.alias) chain(st.color.alias);
  return Object.fromEntries([...found].sort().map(n => [n, hashes[keys.get(n)]]));
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// What a Component or Section relies on in a Part it uses: its sets, properties and variant counts. A change to
// the Part's tokens alone leaves it the same.
export function structureHash(part) {
  const shape = part.sets || {properties: part.properties, variantCount: part.variantCount};
  return createHash('sha256').update(JSON.stringify(shape)).digest('hex');
}
export function buildPart(template, {draft, plan, inputs = {}, overrides = {}, previous = null, parts = {}}) {
  // On a Part's first prepare a template may fit its default structure to the foundations (dropping a tone the
  // system has no colors for). The result is saved as the Part's inputs; its decisions stay while they hold.
  let adapted = [];
  if (!previous && template.adapt && !Object.keys(inputs).length) ({inputs = {}, decisions: adapted = []} = template.adapt(draft, plan, parts) || {});
  else if (previous && same(previous.inputs || {}, inputs)) adapted = (previous.decisions || []).filter(d => d.adapted);
  adapted = adapted.map(d => ({...d, adapted: true}));
  template.checkInputs?.(inputs);
  // A foundation rename the Part followed is kept in `renames`. The template still asks for the old name, so it
  // compiles against the old name standing in for the new item, and every old name is then written as the new one.
  const renames = previous?.renames || {}, standIns = {};
  let view = draft;
  for (const [from, to] of Object.entries(renames)) for (const list of ['variables', 'textStyles', 'effectStyles', 'paintStyles']) {
    const item = (draft[list] || []).find(x => x.name === to);
    if (item && !(draft[list] || []).some(x => x.name === from)) { view = view === draft ? structuredClone(draft) : view; view[list].push({...structuredClone(item), name: from}); standIns[from] = to; }
  }
  let compiled = template.compile(inputs, {draft: view, plan, overrides, parts});
  for (const [from, to] of Object.entries(standIns)) compiled = replaceInPart(compiled, from, to) || compiled;
  if (adapted.length) compiled.decisions = [...adapted, ...(compiled.decisions || [])];
  const check = validatePart(compiled, template, {draft, parts, inputs});
  if (!check.valid) throw new ItemError(check.errors[0]);
  return {format: PART_FORMAT, id: template.id, page: template.page, name: template.name, set: template.set, level: template.level, template: `${template.page}-${template.id}`,
    ...compiled, inputs: structuredClone(inputs), overrides: structuredClone(overrides), ...(Object.keys(renames).length ? {renames: structuredClone(renames)} : {}), revision: (previous?.revision || 0) + 1, foundationsHash: draftHash(draft), depends: dependencies(compiled, draft),
    ...(template.uses.length ? {usesHash: Object.fromEntries(template.uses.map(u => [u, parts[u] ? structureHash(parts[u]) : null]))} : {})};
}

// parts: the saved Parts. A Part is outdated when a Part it uses is not ready or changed its structure.
export function partStatus(part, draft, parts = {}) {
  if (!part) return 'not-prepared';
  return staleBy(part, draft, parts) ? 'outdated' : 'ready';
}
// What made a saved Part outdated: 'foundations', the id of the first Part it uses that changed, or null when current.
export function staleBy(part, draft, parts = {}) {
  if (part.format !== PART_FORMAT || !part.depends) return 'foundations';
  const keys = keyOf(draft), hashes = itemHashes(draft).items;
  if (!Object.entries(part.depends).every(([n, h]) => keys.has(n) && hashes[keys.get(n)] === h)) return 'foundations';
  return Object.entries(part.usesHash || {}).find(([u, h]) => !(parts[u] && partStatus(parts[u], draft, parts) === 'ready' && structureHash(parts[u]) === h))?.[0] || null;
}
