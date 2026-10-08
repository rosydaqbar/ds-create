#!/usr/bin/env node
/**
 * Fast mode packer (workflow/FAST.md §3). Joins a page manifest with the page's copy file and prints the payload
 * that tools/figma-fastbuild.js renders. Checks every manifest first: a page that fails the check is never drawn.
 *
 *   node tools/fast-pack.mjs --slug acme --init            copy the default reading-page manifests (templates/fast/)
 *                                                           into output/acme/fast/ when they are missing
 *   node tools/fast-pack.mjs --slug acme --check           check every manifest in output/acme/fast/
 *   node tools/fast-pack.mjs --slug acme --page 1.4        print the payload of one page (checked first)
 *   node tools/fast-pack.mjs --slug acme --page 1.4 --call print the whole page call: load the cached renderer,
 *                                                           render the payload, return frame ids, audit and warnings
 *
 * What the check refuses:
 *   - a visual type the renderer doesn't have (the catalog is read from tools/figma-fastbuild.js);
 *   - a visual still marked `todo` (fill its inputs or remove it);
 *   - a block or topic title that the copy file doesn't have, and a copy topic the manifest doesn't place;
 *   - a set name that isn't in the build's snapshots (output/{slug}/figma/sets/);
 *   - an instances visual without items, and do / don't pairs that don't match the copy's do and don't lines.
 * Values are never in a manifest: sets are named, and the renderer reads everything else from the file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCopy, forSurface } from '../web/scripts/build-copy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const slug = arg('--slug');
if (!slug) {
  console.error('fast-pack: --slug {system} is required');
  process.exit(2);
}
const OUT = path.join(ROOT, 'output', slug);
const FAST = path.join(OUT, 'fast');
const COPY = path.join(OUT, 'copy');
const SETS = path.join(OUT, 'figma', 'sets');
const TEMPL = path.join(ROOT, 'templates', 'fast');

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const idOf = (page) => String(page || '').split(' ')[0];

/** The renderer's catalog: the keys of VIS in tools/figma-fastbuild.js, plus `custom`. */
const catalog = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'tools', 'figma-fastbuild.js'), 'utf8');
  const keys = [...src.matchAll(/^ {4}'?([a-z][a-z-]*)'?: async \(c, i\)/gm)].map((m) => m[1]);
  return new Set([...keys, 'custom']);
})();

/** Set names → node ids, from the build's set snapshots. */
const setIds = (() => {
  const m = new Map();
  if (!fs.existsSync(SETS)) return m;
  for (const f of fs.readdirSync(SETS).filter((x) => x.endsWith('.json'))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(SETS, f), 'utf8'));
      if (j.name && j.id) m.set(j.name, j.id);
    } catch {}
  }
  return m;
})();
const resolveSet = (s, errs, where) => {
  if (!s) return errs.push(`${where}: a recipe has no set`), null;
  if (/^\d+:\d+$/.test(s)) return s;
  const id = setIds.get(s);
  if (!id) errs.push(`${where}: no set named "${s}" in output/${slug}/figma/sets/`);
  return id ?? null;
};
const recipes = (list, errs, where) => (list || []).map((r) => ({ ...r, set: resolveSet(r.set, errs, where) }));

/** Copy files by page id. */
const copies = (() => {
  const m = new Map();
  if (!fs.existsSync(COPY)) return m;
  for (const f of fs.readdirSync(COPY).filter((x) => x.endsWith('.md'))) {
    const { copy, errors } = parseCopy(fs.readFileSync(path.join(COPY, f), 'utf8'), f);
    if (errors.length) console.error(`copy ${f}: ${errors.join('; ')}`);
    m.set(copy.id, forSurface(copy, 'figma'));
  }
  return m;
})();

const findSection = (copy, name) => copy?.sections.find((s) => norm(s.name) === norm(name));
const findItem = (section, title) => section?.items.find((i) => norm(i.title) === norm(title));
const lineView = (lines) => (lines || []).map((l) => ({ role: l.role, text: l.text }));
const paras = (lines) => lineView(lines).filter((l) => l.role === '').map((l) => l.text);
const ofRole = (lines, role) => lineView(lines).filter((l) => l.role === role).map((l) => l.text);

/** Checks one visual (or a list) and resolves its recipes. */
function checkVisual(v, errs, where, copyLines) {
  if (Array.isArray(v)) return v.map((x, k) => checkVisual(x, errs, `${where} [${k}]`, copyLines));
  if (!v) return v;
  const out = { ...v };
  if (!catalog.has(v.type)) errs.push(`${where}: unknown visual "${v.type}" (catalog: ${[...catalog].join(', ')})`);
  if (v.todo) errs.push(`${where}: visual "${v.type}" still marked todo: ${v.todo}`);
  if (v.type === 'instances') {
    if (!(v.items || []).length) errs.push(`${where}: instances needs items`);
    out.items = recipes(v.items, errs, where);
  }
  if (v.type === 'compare') out.columns = (v.columns || []).map((c) => ({ ...c, items: recipes(c.items, errs, where) }));
  if (v.type === 'do-dont') {
    out.pairs = (v.pairs || []).map((p) => ({ ...p, do: recipes(p.do, errs, where), dont: recipes(p.dont, errs, where) }));
    const dos = ofRole(copyLines, 'do').length;
    if (dos !== out.pairs.length) errs.push(`${where}: ${out.pairs.length} do / don't pairs, the copy has ${dos} do lines`);
  }
  if (v.type === 'states' || v.type === 'callouts') {
    if (v.set) out.set = resolveSet(v.set, errs, where);
    if (v.item) out.item = recipes([v.item], errs, where)[0];
  }
  if (v.type === 'variants') out.sets = (v.sets || []).map((s) => resolveSet(s, errs, where));
  if (v.type === 'mode-frames') out.items = recipes(v.items, errs, where);
  if (v.type === 'token-chain') out.chains = (v.chains || []).map((c) => ({ ...c, item: c.item ? recipes([c.item], errs, where)[0] : undefined }));
  delete out.todo;
  return out;
}

/** take: { role, skip, count } moves matching copy lines into visual.texts; `at` is where the visual is drawn. */
function applyTake(lines, take) {
  const base = lineView(lines).filter((l) => l.role !== 'do' && l.role !== "don't");
  const dd = lineView(lines).filter((l) => l.role === 'do' || l.role === "don't");
  if (!take) return { lines: base.concat(dd), texts: undefined, at: undefined };
  let seen = 0;
  const taken = [];
  let at;
  const keep = [];
  base.forEach((l, k) => {
    const match = l.role === (take.role ?? '');
    if (match) seen++;
    const want = match && seen > (take.skip || 0) && (take.count === 'all' || taken.length < (take.count ?? Infinity));
    if (want) {
      if (at === undefined) at = keep.length;
      taken.push(l.text);
    } else keep.push(l);
  });
  return { lines: keep.concat(dd), texts: taken, at };
}

function packReading(m, copy, errs) {
  const frames = [];
  const placed = new Set();
  for (const f of m.frames || []) {
    const sec = findSection(copy, f.name);
    if (!sec) errs.push(`${m.page} · ${f.name}: the copy file has no section "# ${f.name}"`);
    const items = [];
    for (const it of f.items || []) {
      const where = `${m.page} · ${f.name} › ${it.title}`;
      const ci = findItem(sec, it.title);
      if (!ci && !it.textless) errs.push(`${where}: the copy file has no "## ${it.title}" under "# ${f.name}"`);
      if (ci) placed.add(`${norm(f.name)}|${norm(ci.title)}`);
      const { lines, texts, at } = applyTake(ci?.lines, it.take);
      let visual = it.visual ? checkVisual(it.visual, errs, where, ci?.lines) : undefined;
      if (visual && texts) visual = Array.isArray(visual) ? visual.map((v, k) => (k === 0 ? { ...v, texts } : v)) : { ...visual, texts };
      items.push({ title: it.title, badge: it.badge, numbered: it.numbered, lines, visual, at });
    }
    frames.push({ name: f.name, title: f.title, kind: f.kind, width: f.width, header: sec ? paras(sec.lines).join(' ') : undefined, items });
  }
  for (const s of copy?.sections || []) for (const i of s.items) if (!placed.has(`${norm(s.name)}|${norm(i.title)}`)) errs.push(`${m.page}: copy "${s.name} › ${i.title}" has no place in the manifest`);
  return { page: m.page, type: 'reading', frames };
}

function packComponent(m, copy, errs) {
  const where = m.page;
  const sec = (n) => findSection(copy, n);
  const setsSec = sec('Sets');
  const sets = (m.sets || []).map((s) => {
    const id = s.id || resolveSet(s.set, errs, where);
    const ci = findItem(setsSec, s.set || s.title || '');
    return { id, title: s.title, keep: s.keep ?? undefined, family: ci ? paras(ci.lines).join(' ') : s.family || '' };
  });
  if (!sets.length) errs.push(`${where}: no sets`);
  const exSec = sec('Examples');
  const examples = (m.examples || []).map((e) => {
    const ci = findItem(exSec, e.title);
    if (!ci) errs.push(`${where} › Examples: the copy file has no "## ${e.title}"`);
    return { title: e.title, caption: ci ? (ofRole(ci.lines, 'caption')[0] ?? paras(ci.lines)[0]) : '', items: recipes(e.items, errs, where), dir: e.dir, w: e.w };
  });
  const gl = sec('Guidelines');
  const mt = m.topics || {};
  for (const t of Object.keys(mt)) if (!findItem(gl, t)) errs.push(`${where} › Guidelines: the manifest names "${t}", the copy file doesn't have it`);
  const guidelines = (gl?.items || []).map((ci) => {
    const t = Object.entries(mt).find(([k]) => norm(k) === norm(ci.title))?.[1] || {};
    const g = { title: ci.title, body: paras(ci.lines), items: ofRole(ci.lines, 'item'), caption: ofRole(ci.lines, 'caption')[0] };
    if (t.do || t.dont) {
      const dl = ofRole(ci.lines, 'do'), nl = ofRole(ci.lines, "don't");
      if (!dl.length || !nl.length) errs.push(`${where} › ${ci.title}: do / don't recipes but the copy has no do or don't line`);
      g.do = { items: recipes(t.do, errs, where), reason: dl[0] || '', dir: t.dir };
      g.dont = { items: recipes(t.dont, errs, where), reason: nl[0] || '', dir: t.dir };
    }
    if (t.visual) g.visual = checkVisual(t.visual, errs, `${where} › ${ci.title}`, ci.lines);
    return g;
  });
  const listOf = (name) => {
    const s = sec(name);
    return s ? lineView(s.lines).filter((l) => l.role === 'item' || l.role === '').map((l) => l.text) : [];
  };
  return {
    page: m.page,
    type: m.type,
    sets,
    summary: sec('Summary') ? paras(sec('Summary').lines).join(' ') : '',
    hero: m.hero ? recipes([m.hero], errs, where)[0] : undefined,
    examples,
    use: listOf('When to use'),
    dont: listOf('When not to use'),
    guidelines,
    accessibility: listOf('Accessibility'),
    inApps: listOf('In apps'),
    anat: m.anat,
    rename: m.rename === true,
    skip: m.skip,
    scale: m.scale,
    fixed: m.fixed,
    landmarks: m.landmarks,
  };
}

function pack(file) {
  const errs = [];
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  const id = idOf(m.page);
  const copy = copies.get(id);
  if (!copy) errs.push(`${m.page}: no copy file for page ${id} in output/${slug}/copy/`);
  const payload = m.type === 'reading' ? packReading(m, copy, errs) : m.type === 'component' || m.type === 'layout' ? packComponent(m, copy, errs) : (errs.push(`${m.page}: type is reading, component or layout`), null);
  return { id, payload, errs };
}

if (args.includes('--init')) {
  fs.mkdirSync(FAST, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(TEMPL).filter((x) => x.endsWith('.json') && !x.includes('example'))) {
    const dst = path.join(FAST, f);
    if (!fs.existsSync(dst)) {
      fs.copyFileSync(path.join(TEMPL, f), dst);
      n++;
    }
  }
  console.log(`fast-pack: ${n} default manifest(s) copied to output/${slug}/fast/ (existing ones kept)`);
  process.exit(0);
}

const files = fs.existsSync(FAST) ? fs.readdirSync(FAST).filter((x) => x.endsWith('.json')).map((x) => path.join(FAST, x)) : [];
if (args.includes('--check')) {
  let bad = 0;
  for (const f of files) {
    const { id, errs } = pack(f);
    if (errs.length) {
      bad++;
      console.log(`✕ ${id} (${path.basename(f)}): ${errs.length} problem(s)\n  ` + errs.slice(0, 30).join('\n  '));
    } else console.log(`✓ ${id}`);
  }
  console.log(`fast-pack: ${files.length - bad} of ${files.length} manifest(s) ready`);
  process.exit(bad ? 1 : 0);
}
const want = arg('--page');
if (want) {
  const f = files.find((x) => idOf(JSON.parse(fs.readFileSync(x, 'utf8')).page) === want);
  if (!f) {
    console.error(`fast-pack: no manifest for page ${want} in output/${slug}/fast/`);
    process.exit(1);
  }
  const { payload, errs } = pack(f);
  if (errs.length) {
    console.error(`fast-pack: page ${want} is not ready:\n  ` + errs.join('\n  '));
    process.exit(1);
  }
  if (args.includes('--as')) payload.page = arg('--as');
  if (!args.includes('--call')) {
    process.stdout.write(JSON.stringify(payload));
    process.exit(0);
  }
  // The page call: the renderer stack is read from plugin data (tools/fast-cache.mjs), the body is data only.
  process.stdout.write(`const AF = Object.getPrototypeOf(async function () {}).constructor; const L = k => figma.root.getSharedPluginData('dscreate', k);
if (!L('fastkit')) return { error: 'the renderer is not cached: send the tools/fast-cache.mjs calls first' };
const D = await (new AF('figma', 'OPTS', 'let D = await (' + L('docbuilder') + ')(figma, OPTS); D = await (' + L('docpages') + ')(figma, D); D = await (' + L('docfoundations') + ')(figma, D); return await (' + L('fastkit') + ')(figma, D);'))(figma, {});
const PAYLOAD = ${JSON.stringify(payload)};
const r = await D.render(PAYLOAD);
return { page: r.page, frames: r.frames, audit: r.audit, checks: r.checks, warnings: (r.warnings || []).slice(0, 12), ms: r.ms };
`);
  process.exit(0);
}
console.error('fast-pack: use --init, --check or --page {id}');
process.exit(2);
