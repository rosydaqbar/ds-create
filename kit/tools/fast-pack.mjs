#!/usr/bin/env node
/**
 * Fast mode packer (workflow/FAST.md §3). Joins a page manifest with the page's copy file and prints the payload
 * that kit/tools/figma-fastbuild.js renders. Checks every manifest first: a page that fails the check is never drawn.
 *
 *   node kit/tools/fast-pack.mjs --slug acme --init            copy the default reading-page manifests (workflow/templates/fast/)
 *                                                           into output/acme/fast/ when they are missing
 *   node kit/tools/fast-pack.mjs --slug acme --check           check every manifest in output/acme/fast/
 *   node kit/tools/fast-pack.mjs --slug acme --page 1.4        print the payload of one page (checked first)
 *   node kit/tools/fast-pack.mjs --slug acme --page 1.4 --call print the whole page call: load the cached renderer,
 *                                                           render the payload, return frame ids, audit and warnings
 *
 * What the check refuses:
 *   - a visual type the renderer doesn't have (the catalog is read from kit/tools/figma-fastbuild.js);
 *   - a visual still marked `todo` (fill its inputs or remove it);
 *   - a block or topic title that the copy file doesn't have, and a copy topic the manifest doesn't place;
 *   - a set name that isn't in the build's snapshots (output/{slug}/figma/sets/);
 *   - an instances visual without items, and do / don't pairs that don't match the copy's do and don't lines;
 *   - a copy line taken word for word from a reference build in examples/, and any copy or manifest line that names
 *     one: examples are references, never sources (workflow/GOTCHAS.md G43);
 *   - a copy line that cites knowledge/ instead of explaining it (kit/tools/copy-guard.mjs, workflow/COPY.md §1);
 *   - HARD RULE: a page whose knowledge topics (knowledge/README.md §3) aren't in its ledger entry's `loaded`: the copy
 *     is written from that reasoning, so it is read first. --check, --page and --call all refuse it.
 * Values are never in a manifest: sets are named, and the renderer reads everything else from the file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCopy, forSurface } from '../web/scripts/build-copy.mjs';
import { checkBuild as knowledgeCheck, evidenceErrors, checkPage, knowledgeErrors, jsonStrings } from './copy-guard.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
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
const TEMPL = path.join(ROOT, 'workflow', 'templates', 'fast');

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Reference builds (workflow/GOTCHAS.md G43): their names and their sentences, read by this tool so the agent doesn't have to.
 * A sentence is a string of 40 or more characters with spaces, from the example's source, docs and copy files.
 */
const EXAMPLES = path.join(ROOT, 'examples');
const reference = (() => {
  const names = new Set();
  const sentences = new Map();
  if (!fs.existsSync(EXAMPLES)) return { names, sentences };
  const walk = (dir, out) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'package', '.git'].includes(e.name)) continue;
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f, out);
      else if (/\.(tsx?|md|json)$/.test(e.name) && !/lock|tsbuildinfo|qa-report/.test(e.name)) out.push(f);
    }
    return out;
  };
  for (const ex of fs.readdirSync(EXAMPLES, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    if (norm(ex.name) === norm(slug) || norm(slug).includes(norm(ex.name))) continue;
    names.add(ex.name.toLowerCase());
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(EXAMPLES, ex.name, 'package.json'), 'utf8'));
      for (const part of String(pkg.name || '').replace(/^@/, '').split(/[\/-]/)) if (part.length > 3 && !['design', 'system', 'tokens', 'docs'].includes(part)) names.add(part.toLowerCase());
    } catch {}
    for (const f of walk(path.join(EXAMPLES, ex.name), [])) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.){40,}?)\1/g)) if (/\s/.test(m[2])) sentences.set(norm(m[2]), ex.name);
      if (f.endsWith('.md')) for (const line of src.split('\n')) { const t = line.replace(/^\[[^\]]*\]\s+|^[-*#>\d.\s]+/, ''); if (t.length >= 40) sentences.set(norm(t), ex.name); }
    }
  }
  // Text the repo itself gives every build (specs, templates, tools, the web and app templates) is a shared source,
  // not copying: drop any example sentence that also appears there.
  const own = [];
  const ownWalk = (dir) => { if (!fs.existsSync(dir)) return; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (['node_modules', 'dist', 'package'].includes(e.name)) continue; const f = path.join(dir, e.name); if (e.isDirectory()) ownWalk(f); else if (/\.(tsx?|md|mjs|js|json)$/.test(e.name)) own.push(norm(fs.readFileSync(f, 'utf8'))); } };
  for (const d of ['specs', 'workflow', 'kit/tools', 'kit/web/src', 'kit/app']) ownWalk(path.join(ROOT, d));
  for (const f of ['specs/SYSTEM.md', 'README.md', 'workflow/INITIATOR.md', 'workflow/GOTCHAS.md']) if (fs.existsSync(path.join(ROOT, f))) own.push(norm(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  const corpus = own.join(' | ');
  for (const k of [...sentences.keys()]) if (corpus.includes(k)) sentences.delete(k);
  return { names, sentences };
})();
const nameRe = reference.names.size ? new RegExp('\\b(' + [...reference.names].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i') : null;
/** Lines of one text (a copy file or a manifest) that come from or name a reference build. */
function referenceErrors(text, where) {
  const errs = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^\[[^\]]*\]\s+/, '').trim();
    if (!line) continue;
    const ex = line.length >= 40 && reference.sentences.get(norm(line));
    if (ex) errs.push(`${where}: copied word for word from examples/${ex}: "${line.slice(0, 80)}" (examples are references, never sources: workflow/GOTCHAS.md G43)`);
    const nm = nameRe && line.match(nameRe);
    if (nm) errs.push(`${where}: names the reference build "${nm[1]}": "${line.slice(0, 80)}"`);
  }
  return errs;
}
const idOf = (page) => String(page || '').split(' ')[0];

/** The renderer's catalog: the keys of VIS in kit/tools/figma-fastbuild.js, plus `custom`. */
const catalog = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'kit', 'tools', 'figma-fastbuild.js'), 'utf8');
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
    const dos = ofRole(copyLines, 'do'), donts = ofRole(copyLines, "don't");
    if (dos.length !== out.pairs.length) errs.push(`${where}: ${out.pairs.length} do / don't pairs, the copy has ${dos.length} do lines`);
    // Reasons travel with the visual, so component pages (which have no topic lines in the renderer) get them too.
    out.reasons = dos.map((d, k) => ({ do: d, dont: donts[k] || '' }));
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
    // Column labels of a compare visual come from the topic's caption lines, so the copy check sees them.
    if (g.visual?.type === 'compare' && !g.visual.texts) {
      g.visual.texts = ofRole(ci.lines, 'caption');
      delete g.caption;
    }
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
  // Every copy file and manifest of this build, against the reference builds (workflow/GOTCHAS.md G43).
  const refErrs = [];
  if (fs.existsSync(COPY)) for (const f of fs.readdirSync(COPY).filter((x) => x.endsWith('.md'))) refErrs.push(...referenceErrors(fs.readFileSync(path.join(COPY, f), 'utf8'), `copy/${f}`));
  for (const f of files) refErrs.push(...referenceErrors(fs.readFileSync(f, 'utf8'), `fast/${path.basename(f)}`));
  if (refErrs.length) {
    bad++;
    console.log(`✕ reference check: ${refErrs.length} problem(s)\n  ` + refErrs.slice(0, 30).join('\n  '));
  } else console.log(`✓ reference check (${reference.sentences.size} sentences from ${reference.names.size ? [...reference.names].join(', ') : 'no examples'})`);
  for (const f of files) {
    const { id, errs } = pack(f);
    errs.push(...evidenceErrors(slug, id).errs);
    if (errs.length) {
      bad++;
      console.log(`✕ ${id} (${path.basename(f)}): ${errs.length} problem(s)\n  ` + errs.slice(0, 30).join('\n  '));
    } else console.log(`✓ ${id}`);
  }
  // The docs explain with the reasoning of knowledge/, never cite it (workflow/COPY.md §1).
  const kErrs = knowledgeCheck(slug);
  if (kErrs.length) {
    bad++;
    console.log(`✕ copy guard: ${kErrs.length} problem(s)\n  ` + kErrs.slice(0, 30).join('\n  '));
  } else console.log('✓ copy guard');
  const refBad = (refErrs.length ? 1 : 0) + (kErrs.length ? 1 : 0);
  console.log(`fast-pack: ${files.length - (bad - refBad)} of ${files.length} manifest(s) ready${refBad ? '; the reference check or the copy guard failed' : ''}`);
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
  const ev = evidenceErrors(slug, want);
  errs.push(...ev.errs, ...checkPage(slug, want));
  // Last gate: every string that would reach Figma, after packing (workflow/COPY.md §1).
  if (payload) errs.push(...knowledgeErrors(jsonStrings(payload).join('\n'), `payload ${want}`));
  if (!ev.ledger && ev.topics.length) console.error(`fast-pack: no ledger, so reading knowledge/${ev.topics.join(', knowledge/')} for ${want} is not checked`);
  if (errs.length) {
    console.error(`fast-pack: page ${want} is not ready:\n  ` + errs.join('\n  '));
    process.exit(1);
  }
  if (args.includes('--as')) payload.page = arg('--as');
  if (!args.includes('--call')) {
    process.stdout.write(JSON.stringify(payload));
    process.exit(0);
  }
  // The page call: the renderer stack is read from plugin data (kit/tools/fast-cache.mjs), the body is data only.
  process.stdout.write(`const AF = Object.getPrototypeOf(async function () {}).constructor; const L = k => figma.root.getSharedPluginData('dscreate', k);
if (!L('fastkit')) return { error: 'the renderer is not cached: send the kit/tools/fast-cache.mjs calls first' };
const D = await (new AF('figma', 'OPTS', 'let D = await (' + L('docbuilder') + ')(figma, OPTS); D = await (' + L('docpages') + ')(figma, D); D = await (' + L('docfoundations') + ')(figma, D); return await (' + L('fastkit') + ')(figma, D);'))(figma, {});
const PAYLOAD = ${JSON.stringify(payload)};
const r = await D.render(PAYLOAD);
return { page: r.page, frames: r.frames, audit: r.audit, checks: r.checks, warnings: (r.warnings || []).slice(0, 12), ms: r.ms };
`);
  process.exit(0);
}
console.error('fast-pack: use --init, --check or --page {id}');
process.exit(2);
