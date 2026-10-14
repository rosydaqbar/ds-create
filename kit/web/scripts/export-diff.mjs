#!/usr/bin/env node
/**
 * The token export without re-sending what didn't change (workflow/WEB.md W2). Run in the site project.
 *
 *   1. Send scripts/figma-export.js with MODE = 'hash' (read-only, ~3 KB back). Save the return as hash.json.
 *   2. node scripts/export-diff.mjs --hash hash.json [--base tokens/figma-variables.json]
 *        compares each collection's 16 buckets and the style lists with the base (the last export, or the token plan
 *        init wrote) and prints the ROWS to fetch. Nothing to fetch → it writes the export straight away.
 *   3. Send figma-export.js with MODE = 'rows' and those ROWS; save the return as rows.json (split ROWS over several
 *      calls when one return would pass 20 KB: one collection per call, say).
 *   4. node scripts/export-diff.mjs --hash hash.json --merge rows.json [rows-2.json …]
 *        writes tokens/figma-variables.json (and ../figma/figma-variables.json when that folder exists), then checks the
 *        result against every hash from step 1. A mismatch writes nothing: re-fetch that collection with ROWS 'all'.
 *
 * The canonical entry (name, collection, type, description, values per mode) is the one figma-export.js hashes.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const many = (k) => {
  const i = args.indexOf(k);
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < args.length && !args[j].startsWith('--'); j++) out.push(args[j]);
  return out;
};
const read = (f) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
if (!arg('--hash')) {
  console.error('export-diff: --hash hash.json is required (the return of figma-export.js with MODE = "hash")');
  process.exit(2);
}
const H = read(arg('--hash'));
const basePath = arg('--base') || ['tokens/figma-variables.json', '../figma/figma-variables.json'].find((f) => fs.existsSync(f));
const base = basePath && fs.existsSync(basePath) ? read(basePath) : { variables: [], textStyles: [], effectStyles: [], gridStyles: [] };

const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
const canon = (e, modes) => JSON.stringify([e.name, e.collection, e.type, e.description, modes.map((m) => e.values[m])]);
const buckets = (entries, modes) => {
  const b = Array.from({ length: 16 }, () => []);
  for (const e of entries) b[fnv(e.name) % 16].push(canon(e, modes));
  return b.map((l) => fnv(l.sort().join('\n')).toString(36));
};
const styleHash = (list) => fnv(JSON.stringify(list || [])).toString(36);

// What differs from the base.
const want = {};
for (const c of H.collections) {
  const mine = (base.variables || []).filter((v) => v.collection === c.name);
  if (!mine.length) { if (c.n) want[c.name] = 'all'; continue; }
  const hb = buckets(mine, c.modes);
  const diff = hb.map((h, i) => (h === c.b[i] ? -1 : i)).filter((i) => i >= 0);
  if (diff.length) want[c.name] = diff.length > 10 ? 'all' : diff;
}
const stylesDiffer = H.styles.text !== styleHash(base.textStyles) || H.styles.effect !== styleHash(base.effectStyles) || H.styles.grid !== styleHash(base.gridStyles);
if (stylesDiffer) want.styles = true;

const rowFiles = many('--merge');
if (!rowFiles.length && Object.keys(want).length) {
  console.log(`export-diff: base ${basePath || '(none)'}; fetch only this with figma-export.js, MODE = 'rows':`);
  console.log(`const ROWS = ${JSON.stringify(want)};`);
  for (const [k, v] of Object.entries(want)) if (k !== 'styles') console.log(`  ${k}: ${v === 'all' ? 'every variable' : `${v.length} of 16 buckets`} (${H.collections.find((c) => c.name === k).n} variables in Figma)`);
  process.exit(0);
}

// Merge: base entries in unchanged buckets, fetched rows in changed ones.
const rows = {};
let fetched = {};
for (const f of rowFiles) {
  const r = read(f);
  for (const [c, list] of Object.entries(r.rows || {})) rows[c] = (rows[c] || []).concat(list);
  for (const k of ['textStyles', 'effectStyles', 'gridStyles']) if (r[k]) fetched[k] = r[k];
}
const fromRow = (c) => ([name, type, description, ...vals]) => ({ name, collection: c.name, type, description, values: Object.fromEntries(c.modes.map((m, i) => [m, typeof vals[i] === 'string' && vals[i].startsWith('@') ? { alias: vals[i].slice(1) } : vals[i]])) });
const problems = [];
// Keep the base order: an entry in a changed bucket takes its fetched version (or goes, when Figma no longer has it),
// and variables new to the base come last, in Figma's order.
const changed = (v) => { const w = want[v.collection]; return w && (w === 'all' || w.includes(fnv(v.name) % 16)); };
const fresh = new Map();
for (const c of H.collections) {
  if (!want[c.name]) continue;
  if (!rows[c.name]) { problems.push(`${c.name}: changed, but no rows were fetched for it`); continue; }
  for (const g of rows[c.name].map(fromRow(c))) fresh.set(c.name + '|' + g.name, g);
}
const known = new Set(H.collections.map((c) => c.name));
const variables = [];
for (const v of base.variables || []) {
  if (!known.has(v.collection)) continue;
  if (!changed(v)) { variables.push(v); continue; }
  const k = v.collection + '|' + v.name;
  if (fresh.has(k)) { variables.push(fresh.get(k)); fresh.delete(k); }
}
variables.push(...fresh.values());
const out = {
  format: 'ds-create/figma-variables@1',
  file: base.file || 'Document',
  collections: H.collections.map((c) => ({ name: c.name, modes: c.modes })),
  variables,
  textStyles: fetched.textStyles || base.textStyles || [],
  effectStyles: fetched.effectStyles || base.effectStyles || [],
  gridStyles: fetched.gridStyles || base.gridStyles || [],
  pages: H.pages,
};
// Verify against every hash before writing anything.
for (const c of H.collections) {
  const mine = variables.filter((v) => v.collection === c.name);
  if (mine.length !== c.n) problems.push(`${c.name}: ${mine.length} variables, Figma has ${c.n}`);
  const hb = buckets(mine, c.modes);
  const bad = hb.map((h, i) => (h === c.b[i] ? -1 : i)).filter((i) => i >= 0);
  if (bad.length) problems.push(`${c.name}: buckets ${bad.join(', ')} still differ (fetch ROWS { "${c.name}": "all" })`);
}
if (styleHash(out.textStyles) !== H.styles.text) problems.push('text styles differ (fetch ROWS { styles: true })');
if (styleHash(out.effectStyles) !== H.styles.effect) problems.push('effect styles differ (fetch ROWS { styles: true })');
if (styleHash(out.gridStyles) !== H.styles.grid) problems.push('grid styles differ (fetch ROWS { styles: true })');
if (problems.length) {
  console.error('export-diff: nothing written:\n  ' + problems.join('\n  '));
  process.exit(1);
}
const orderOk = fnv(variables.map((v) => v.name).join('|')).toString(36) === H.order;
const targets = ['tokens/figma-variables.json'];
if (fs.existsSync('../figma')) targets.push('../figma/figma-variables.json');
for (const t of targets) fs.writeFileSync(t, JSON.stringify(out, null, 2) + '\n');
console.log(`export-diff: ${variables.length} variables, ${out.textStyles.length} text styles, ${out.effectStyles.length} effect styles, ${out.gridStyles.length} grid styles, ${out.pages.length} pages → ${targets.join(', ')}; every hash matches Figma${orderOk ? '' : ' (variable order differs from Figma; names and values match)'}. Next: npm run tokens`);
