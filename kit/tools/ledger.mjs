#!/usr/bin/env node
/**
 * The progress ledger from the command line (workflow/INITIATOR.md §0, *Progress ledger*), so a step is marked in one
 * short command instead of an edited JSON file. It keeps the order rule: it marks entries, it never reorders them.
 *
 *   node kit/tools/ledger.mjs --slug acme --next
 *       the first entry that is not done or skip (the step to run now)
 *   node kit/tools/ledger.mjs --slug acme --done "docs:1.6,1.7,2.1" [--note "…"] [--set '{"audit":{…}}']
 *       mark entries done, in one write. An entry is named by its page id or name prefix ("1.6", "2.1 Button") or its
 *       task ("Clear plugin data"), with an optional phase ("docs:", "library:", "site:", "close:"); a comma list
 *       carries the phase of its first item. Today's date goes into `done`.
 *   node kit/tools/ledger.mjs --slug acme --render '<the return of a fast-pack batch call>'
 *       mark every page in its `done` list done, with its frame ids, and print the pages that failed
 *   node kit/tools/ledger.mjs --slug acme --status "docs:2.4" building|todo|skip [--note "…"]
 *   node kit/tools/ledger.mjs --slug acme --summary
 *       counts per phase and status, and the open entries
 *
 * Marking refuses an entry that comes after an open one (workflow/INITIATOR.md Part B, *Gates*): pass --force only
 * when the user moved a page (and record it under `decisions`). Each change updates `step` to the next open entry.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const slug = arg('--slug');
if (!slug) {
  console.error('ledger: --slug {system} is required');
  process.exit(2);
}
const FILE = path.join(ROOT, 'workspace', 'output', slug, 'ds-create-ledger.json');
if (!fs.existsSync(FILE)) {
  console.error(`ledger: no ledger at ${path.relative(ROOT, FILE)}`);
  process.exit(1);
}
const L = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const seq = L.sequence || [];
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const open = (e) => e.status !== 'done' && e.status !== 'skip';
const label = (e) => `${e.step} ${e.phase ? e.phase + ':' : ''}${e.page || e.task}`;

/** "docs:2.1" → the first matching entry (open entries first). */
function find(ref, phaseHint) {
  let phase = phaseHint;
  let key = ref.trim();
  const m = key.match(/^([a-z]+):(.*)$/);
  if (m) [, phase, key] = m;
  const name = (e) => e.page || e.task || '';
  const hit = (e) => {
    if (phase && e.phase !== phase) return false;
    const n = name(e);
    return n === key || n.startsWith(key + ' ') || (key.length > 3 && n.startsWith(key));
  };
  return { entry: seq.find((e) => hit(e) && open(e)) || seq.find(hit), phase };
}
const firstOpen = () => seq.find(open);
function save(changed) {
  const next = firstOpen();
  L.step = next ? { step: next.step, page: next.page || next.task } : null;
  fs.writeFileSync(FILE, JSON.stringify(L, null, 2) + '\n');
  for (const c of changed) console.log(`${label(c)} → ${c.status}`);
  console.log(`next: ${next ? label(next) : 'none (the sequence is complete)'}`);
}
function mark(refs, status, extra) {
  const changed = [];
  let phase;
  for (const ref of refs) {
    const r = find(ref, phase);
    phase = r.phase;
    if (!r.entry) {
      console.error(`ledger: no entry "${ref}"`);
      process.exit(1);
    }
    const e = r.entry;
    const before = seq.slice(0, seq.indexOf(e)).filter((x) => open(x) && !changed.includes(x) && !refs.some((rr) => find(rr, phase).entry === x));
    if (status === 'done' && before.length && !args.includes('--force')) {
      console.error(`ledger: ${label(e)} comes after open entries (${before.slice(0, 3).map(label).join(', ')}): finish those first, or --force when the user moved a page`);
      process.exit(1);
    }
    e.status = status;
    if (status === 'done') e.done = today;
    if (extra) Object.assign(e, extra);
    changed.push(e);
  }
  save(changed);
}

const note = arg('--note');
const set = arg('--set') ? JSON.parse(arg('--set')) : {};
if (note) set.note = note;

if (args.includes('--next')) {
  const n = firstOpen();
  console.log(n ? JSON.stringify(n) : 'none: the sequence is complete');
} else if (args.includes('--summary')) {
  const by = {};
  for (const e of seq) {
    const k = e.phase || '-';
    by[k] = by[k] || {};
    by[k][e.status] = (by[k][e.status] || 0) + 1;
  }
  for (const [p, c] of Object.entries(by)) console.log(`${p}: ${Object.entries(c).map(([s, n]) => `${n} ${s}`).join(', ')}`);
  const o = seq.filter(open);
  console.log(o.length ? `open (${o.length}): ${o.slice(0, 12).map(label).join(' · ')}${o.length > 12 ? ' …' : ''}` : 'open: none');
} else if (arg('--done')) {
  mark(arg('--done').split(','), 'done', Object.keys(set).length ? set : undefined);
} else if (arg('--status')) {
  const st = args[args.indexOf('--status') + 2];
  if (!['todo', 'building', 'done', 'skip'].includes(st)) {
    console.error('ledger: --status {entry} todo|building|done|skip');
    process.exit(2);
  }
  mark(arg('--status').split(','), st, Object.keys(set).length ? set : undefined);
} else if (arg('--render')) {
  // The return of a batch page call (kit/tools/fast-pack.mjs --batch): { done: [{ id, frames }], failed: [{ id, error }] }.
  const r = JSON.parse(arg('--render'));
  const changed = [];
  for (const d of r.done || []) {
    const { entry } = find(String(d.id), 'docs');
    if (!entry) {
      console.error(`ledger: no docs entry for page ${d.id}`);
      continue;
    }
    const prior = seq.slice(0, seq.indexOf(entry)).filter((x) => open(x) && !changed.includes(x));
    if (prior.length && !args.includes('--force')) {
      console.error(`ledger: page ${d.id} comes after open entries (${prior.slice(0, 3).map(label).join(', ')}); not marked`);
      continue;
    }
    entry.status = 'done';
    entry.done = today;
    if (d.frames) entry.frames = d.frames;
    if (L.engine === 'fast' && !entry.audit) entry.audit = { note: 'fast round: audits run on call (/ds-create qa)' };
    changed.push(entry);
  }
  for (const f of r.failed || []) console.log(`✕ ${f.id}: ${f.error}`);
  if (r.next) console.log(`the call stopped before page ${r.next} (time budget): send the batch that starts there`);
  save(changed);
} else {
  console.error('ledger: use --next, --summary, --done, --status or --render');
  process.exit(2);
}
