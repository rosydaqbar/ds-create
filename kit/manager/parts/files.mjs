// Part files (parts/{id}.json, ds-create/part@2): the system's inputs and overrides, the compiled output,
// and a hash of every foundation item the Part uses, so only a change to one of those makes it outdated.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ItemError} from '../foundations/ops.mjs';
import {itemHashes} from '../foundations/baseline.mjs';
import {partTemplates} from './templates.mjs';
import {validatePart} from './validate.mjs';

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
  for (const [list, kind] of [['textStyles', 'textStyle'], ['effectStyles', 'effectStyle'], ['gridStyles', 'gridStyle']]) for (const s of draft[list] || []) keys.set(s.name, kind + ':' + s.name);
  return keys;
};
// Every foundation name the compiled Part mentions, with that item's current hash.
function dependencies(compiled, draft) {
  const keys = keyOf(draft), hashes = itemHashes(draft).items, found = new Set();
  const walk = x => { if (typeof x === 'string') { if (keys.has(x)) found.add(x); } else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
  walk({tokens: compiled.tokens.map(t => t.values), sizes: compiled.sizes, treatments: compiled.treatments, overrides: compiled.overrides});
  return Object.fromEntries([...found].sort().map(n => [n, hashes[keys.get(n)]]));
}

export function buildPart(template, {draft, plan, inputs = {}, overrides = {}, previous = null, parts = {}}) {
  template.checkInputs?.(inputs);
  const compiled = template.compile(inputs, {draft, plan, overrides, parts});
  const check = validatePart(compiled, template, {draft, parts, inputs});
  if (!check.valid) throw new ItemError(check.errors[0]);
  return {format: PART_FORMAT, id: template.id, page: template.page, name: template.name, set: template.set, level: template.level, template: `${template.page}-${template.id}`,
    ...compiled, inputs: structuredClone(inputs), overrides: structuredClone(overrides), revision: (previous?.revision || 0) + 1, foundationsHash: draftHash(draft), depends: dependencies(compiled, draft)};
}

export function partStatus(part, draft) {
  if (!part) return 'not-prepared';
  if (part.format !== PART_FORMAT || !part.depends) return 'outdated';
  const keys = keyOf(draft), hashes = itemHashes(draft).items;
  return Object.entries(part.depends).every(([n, h]) => keys.has(n) && hashes[keys.get(n)] === h) ? 'ready' : 'outdated';
}
