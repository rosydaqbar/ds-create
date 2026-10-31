// What was last confirmed in Figma (figma/synced.json) and how the local draft differs from it. The diff is computed
// from files only, so Builder can show "changes not in Figma" at any time without an agent or a Figma call.
import {createHash} from 'node:crypto';
import {mkdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {writeJSON} from '../server/files.mjs';
import {readFigmaSetting} from '../server/settings.mjs';

const lists = {variables: 'variable', textStyles: 'textStyle', effectStyles: 'effectStyle', gridStyles: 'gridStyle'};
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sorted(value[k])])) : value;
const canonical = value => JSON.stringify(sorted(value));
const hash = value => createHash('sha256').update(canonical(value)).digest('hex').slice(0, 16);
async function readJSON(file) { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }

function entries(draft) {
  return [...(draft.collections || []).map(item => ['collection', item]), ...Object.entries(lists).flatMap(([list, kind]) => (draft[list] || []).map(item => [kind, item]))];
}

// One hash per item, and one per collection and style group, so a Figma check can compare groups first.
export function itemHashes(draft) {
  const items = {}, members = {};
  for (const [kind, item] of entries(draft)) {
    const h = items[`${kind}:${item.name}`] = hash(item);
    const group = kind === 'variable' ? item.collection : kind === 'collection' ? item.name : kind + 's';
    (members[group] ||= []).push(`${kind}:${item.name}:${h}`);
  }
  return {items, groups: Object.fromEntries(Object.entries(members).map(([group, list]) => [group, hash(list.sort())]))};
}

export async function writeBaseline(outputDir, draft) {
  await mkdir(path.join(outputDir, 'figma'), {recursive: true});
  await writeJSON(path.join(outputDir, 'figma/synced.json'), {format: 'ds-create/figma-baseline@1', revision: draft.revision, time: new Date().toISOString(), draft, hashes: itemHashes(draft)});
}

function fieldChanges(before, after) {
  const fields = [];
  for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
    if (key === 'values' && before.values && after.values) {
      for (const mode of [...new Set([...Object.keys(before.values), ...Object.keys(after.values)])]) if (canonical(before.values[mode]) !== canonical(after.values[mode])) fields.push({field: `values.${mode}`, from: before.values[mode], to: after.values[mode]});
    } else if (canonical(before[key]) !== canonical(after[key])) fields.push({field: key, from: before[key], to: after[key]});
  }
  return fields;
}

// A rename is a delete plus an add whose item is the same apart from its name and code syntax.
export function localDiff(base, draft) {
  const was = new Map(entries(base).map(([kind, item]) => [`${kind}:${item.name}`, [kind, item]])), now = new Map(entries(draft).map(([kind, item]) => [`${kind}:${item.name}`, [kind, item]]));
  const added = [], deleted = [], changed = [], renamed = [];
  for (const [key, [kind, item]] of now) {
    if (!was.has(key)) added.push({kind, name: item.name});
    else { const fields = fieldChanges(was.get(key)[1], item); if (fields.length) changed.push({kind, name: item.name, fields}); }
  }
  for (const [key, [kind, item]] of was) if (!now.has(key)) deleted.push({kind, name: item.name});
  const body = item => { const {name, codeSyntax, ...rest} = item; return canonical(rest); };
  for (const gone of [...deleted]) {
    const old = was.get(`${gone.kind}:${gone.name}`)[1], match = added.find(a => a.kind === gone.kind && body(now.get(`${a.kind}:${a.name}`)[1]) === body(old));
    if (!match) continue;
    renamed.push({kind: gone.kind, from: gone.name, to: match.name});
    deleted.splice(deleted.indexOf(gone), 1); added.splice(added.indexOf(match), 1);
  }
  return {added, changed, renamed, deleted};
}

export async function syncState(outputDir) {
  const [draft, base, figma] = await Promise.all([readJSON(path.join(outputDir, 'foundations.json')), readJSON(path.join(outputDir, 'figma/synced.json')), readFigmaSetting(outputDir)]);
  const empty = {added: [], changed: [], renamed: [], deleted: []};
  if (!figma || !draft || base?.format !== 'ds-create/figma-baseline@1') return {state: 'local', revision: draft?.revision ?? null, baselineRevision: null, changes: 0, diff: empty};
  const diff = localDiff(base.draft, draft), changes = diff.added.length + diff.changed.length + diff.renamed.length + diff.deleted.length;
  return {state: changes ? 'local-changes' : 'in-sync', revision: draft.revision, baselineRevision: base.revision, changes, diff};
}
