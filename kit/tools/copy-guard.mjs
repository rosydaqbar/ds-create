#!/usr/bin/env node
/**
 * Checks that the docs carry the reasoning of knowledge/ in the system's own words, never the knowledge itself
 * (workflow/COPY.md §1, knowledge/README.md §1). Readers of a design system's docs should never see where the
 * reasoning came from:
 *
 *   node kit/tools/copy-guard.mjs --slug {slug}                 checks output/{slug}/copy/*.md, the fast-mode manifests
 *                                                           (output/{slug}/fast/*.json) and the site's stories
 *   node kit/tools/copy-guard.mjs --slug {slug} --page {id}     one page, before it is drawn: lists the knowledge topics to
 *                                                           read, checks the page's copy file, and checks the ledger
 *                                                           shows those topics under the page's `loaded`
 *
 * HARD RULE in fast mode and in YOLO (workflow/COPY.md §1): a page is drawn only after its knowledge topics were
 * read and recorded, and its copy passes this check. kit/tools/fast-pack.mjs refuses the page otherwise.
 *
 * What it refuses, in any copy line or site string:
 *   - a principle id from knowledge/ (B1, M3, R2) or the name of a knowledge file (buttons.md);
 *   - the words "knowledge base" or "knowledge/", and citing phrases such as "according to the principle";
 *   - a sentence of 40 or more characters taken word for word from knowledge/.
 * Principle titles are plain phrases ("Leaving is faster than arriving") that good copy may say in passing: not checked.
 * Exits 1 when something is found. kit/tools/fast-pack.mjs --check runs the same check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const KNOW = path.join(ROOT, 'knowledge');
const norm = (s) => s.toLowerCase().replace(/[`*_"'’“”]/g, '').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** What knowledge/ holds: principle ids and titles, file names, and its sentences. */
export const knowledge = (() => {
  const ids = new Set();
  const titles = new Map();
  const files = new Set();
  const sentences = new Map();
  if (!fs.existsSync(KNOW)) return { ids, titles, files, sentences };
  for (const f of fs.readdirSync(KNOW).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
    files.add(f);
    const src = fs.readFileSync(path.join(KNOW, f), 'utf8');
    for (const m of src.matchAll(/^## ([A-Z]{1,2}\d+) · (.+)$/gm)) {
      ids.add(m[1]);
      titles.set(norm(m[2]), m[1]);
    }
    for (const line of src.split('\n')) {
      const t = line.replace(/^[-*#>|\d.\s]+/, '').replace(/\*\*/g, '').trim();
      for (const s of t.split(/(?<=[.!?])\s+/)) if (s.length >= 40 && /\s/.test(s)) sentences.set(norm(s), f);
    }
  }
  return { ids, titles, files, sentences };
})();

const idRe = knowledge.ids.size ? new RegExp(`\\b(${[...knowledge.ids].map(esc).join('|')})\\b`) : null;
const fileRe = knowledge.files.size ? new RegExp(`\\b(${[...knowledge.files].map(esc).join('|')})\\b`, 'i') : null;
const citeRe = /\bknowledge(?: base|\/)|\b(?:according to|as per|per|in line with|following|based on) (?:the |our )?(?:principle|knowledge|rationale)\b/i;

/** Problems in one text: a copy file, or the strings of a site story. */
export function knowledgeErrors(text, where) {
  const errs = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^\[[^\]]*\]\s+/, '').trim();
    if (!line || line.startsWith('<!--') || line.startsWith('---') || /^(page|figma|web):/.test(line)) continue;
    const show = `"${line.slice(0, 80)}"`;
    const id = idRe && line.match(idRe);
    if (id) errs.push(`${where}: names the knowledge principle ${id[1]}: ${show}`);
    const fl = fileRe && line.match(fileRe);
    if (fl) errs.push(`${where}: names the knowledge file ${fl[1]}: ${show}`);
    if (citeRe.test(line)) errs.push(`${where}: cites knowledge instead of explaining: ${show}`);
    const n = norm(line);
    for (const s of n.split(/(?<=[.!?])\s+/)) {
      const src = s.length >= 40 && knowledge.sentences.get(s);
      if (src) errs.push(`${where}: copied word for word from knowledge/${src}; write it in this system's words and values: ${show}`);
    }
  }
  return errs;
}

/** The knowledge topics the index (knowledge/README.md §3) lists for a page id, from its Related specs column. */
export function topicsFor(id) {
  const idx = path.join(KNOW, 'README.md');
  if (!fs.existsSync(idx)) return [];
  const out = [];
  for (const row of fs.readFileSync(idx, 'utf8').split('\n')) {
    const m = row.match(/^\| [^|]+ \| `([\w-]+\.md)` \|[^|]*\|([^|]*)\|/);
    if (!m) continue;
    const ids = [...m[2].matchAll(/(\d+\.\d+)-[\w-]+\.md/g)].map((x) => x[1]);
    if (ids.includes(id)) out.push(m[1]);
  }
  return out;
}

/** The ledger must show the page's knowledge topics under `loaded` before the page is drawn. */
export function evidenceErrors(slug, id) {
  const topics = topicsFor(id);
  if (!topics.length) return { errs: [], topics, ledger: true };
  const lp = path.join(ROOT, 'output', slug, 'ds-create-ledger.json');
  if (!fs.existsSync(lp)) return { errs: [], topics, ledger: false };
  const L = JSON.parse(fs.readFileSync(lp, 'utf8'));
  // A page with sets has a library entry and a docs entry (workflow/INITIATOR.md Part B §0); the copy belongs to the docs entry.
  const e = (L.sequence || []).find((x) => String(x.page || '').split(' ')[0] === id && x.phase !== 'library');
  const loaded = (e && e.loaded) || [];
  const missing = topics.filter((t) => !loaded.some((l) => String(l).replace(/^knowledge\//, '') === t));
  return {
    errs: missing.length ? [`${id}: read knowledge/${missing.join(', knowledge/')} before writing this page's copy, write the reasoning in the system's own words, and add ${missing.map((t) => `"knowledge/${t}"`).join(', ')} to the page's \`loaded\` in the ledger`] : [],
    topics,
    ledger: true,
  };
}

/** Every string value of a JSON document (a manifest or a payload), one per line. */
export const jsonStrings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => jsonStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => jsonStrings(x, out));
  return out;
};

/** One page's copy file and its fast-mode manifest: everything that can reach its Figma frames or site page. */
export function checkPage(slug, id) {
  const errs = [];
  const copy = path.join(ROOT, 'output', slug, 'copy');
  const f = fs.existsSync(copy) && fs.readdirSync(copy).find((x) => x.startsWith(id + '-') && x.endsWith('.md'));
  if (f) errs.push(...knowledgeErrors(fs.readFileSync(path.join(copy, f), 'utf8'), `copy/${f}`));
  const fast = path.join(ROOT, 'output', slug, 'fast');
  if (fs.existsSync(fast)) for (const m of fs.readdirSync(fast).filter((x) => x.endsWith('.json'))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(fast, m), 'utf8'));
      if (String(j.page || '').split(' ')[0] === id) errs.push(...knowledgeErrors(jsonStrings(j).join('\n'), `fast/${m}`));
    } catch {}
  }
  return errs;
}

/** Every copy file of a build, and the strings of its site stories. */
export function checkBuild(slug) {
  const errs = [];
  const copy = path.join(ROOT, 'output', slug, 'copy');
  if (fs.existsSync(copy)) for (const f of fs.readdirSync(copy).filter((x) => x.endsWith('.md'))) errs.push(...knowledgeErrors(fs.readFileSync(path.join(copy, f), 'utf8'), `copy/${f}`));
  const fast = path.join(ROOT, 'output', slug, 'fast');
  if (fs.existsSync(fast)) for (const m of fs.readdirSync(fast).filter((x) => x.endsWith('.json'))) {
    try { errs.push(...knowledgeErrors(jsonStrings(JSON.parse(fs.readFileSync(path.join(fast, m), 'utf8'))).join('\n'), `fast/${m}`)); } catch {}
  }
  const docs = path.join(ROOT, 'output', slug, 'web', 'src', 'docs');
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.(tsx?|json)$/.test(e.name) && !e.name.endsWith('.gen.json')) { const strs = [...fs.readFileSync(f, 'utf8').matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.){12,}?)\1/g)].map((m) => m[2]).filter((s) => /\s/.test(s)); errs.push(...knowledgeErrors(strs.join('\n'), path.relative(path.join(ROOT, 'output', slug), f))); } } };
  walk(docs);
  return errs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const slug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
  if (!slug) { console.error('usage: node kit/tools/copy-guard.mjs --slug {slug}'); process.exit(1); }
  const page = args.includes('--page') ? args[args.indexOf('--page') + 1] : null;
  if (page) {
    const ev = evidenceErrors(slug, page);
    const errs = [...ev.errs, ...checkPage(slug, page)];
    console.log(`knowledge topics for ${page}: ${ev.topics.length ? ev.topics.map((t) => 'knowledge/' + t).join(', ') : 'none'}${ev.ledger ? '' : ' (no ledger: reading not checked)'}`);
    if (errs.length) { console.log(`✕ ${page}: ${errs.length} problem(s)\n  ` + errs.join('\n  ')); process.exit(1); }
    console.log(`✓ ${page}: ready to draw`);
    process.exit(0);
  }
  const errs = checkBuild(slug);
  if (errs.length) {
    console.log(`✕ copy guard: ${errs.length} problem(s)\n  ` + errs.slice(0, 40).join('\n  '));
    process.exit(1);
  }
  console.log(`✓ copy guard: no knowledge ids, file names, citations or copied sentences (${knowledge.ids.size} principles, ${knowledge.sentences.size} sentences checked)`);
}
