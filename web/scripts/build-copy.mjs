#!/usr/bin/env node
/**
 * Parses the page copy files (workflow/COPY.md) into src/docs/copy.gen.json for the docs site.
 *
 *   node scripts/build-copy.mjs                     ../copy/*.md → src/docs/copy.gen.json (npm run copy), site lines only
 *   node scripts/build-copy.mjs --dir path/to/copy  another copy folder
 *   node scripts/build-copy.mjs --page 2.1 --surface figma
 *                                                   prints one page's lines for one surface as JSON,
 *                                                   for tools/figma-copy.js (apply) and the doc builder
 *
 * A missing copy folder writes an empty file, so a template without copy still builds.
 * Unknown surfaces or roles fail the run: they would silently drop text.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SURFACES = ['both', 'figma', 'web'];
const ROLES = ['', 'caption', 'item', 'do', "don't"];

/** One copy file → { id, page, figma, web, sections: [{ name, figma, web, lines, items: [{ title, figma, web, lines }] }] }. */
export function parseCopy(text, file = 'copy') {
  const errors = [];
  const out = { id: '', page: '', figma: '', web: '', sections: [] };
  let body = text.replace(/\r\n/g, '\n');
  const fm = body.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) {
    for (const l of fm[1].split('\n')) {
      const m = l.match(/^(\w+):\s*(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    body = body.slice(fm[0].length);
  }
  out.id = (out.page || '').split(' ')[0];
  let section = null;
  let item = null;
  const target = () => item || section;
  body.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const where = `${file}:${i + 1 + (fm ? fm[0].split('\n').length - 1 : 0)}`;
    if (!line.trim()) return;
    let m;
    if ((m = line.match(/^#\s+(.+)$/))) {
      section = { name: m[1].trim(), figma: '', web: '', lines: [], items: [] };
      item = null;
      out.sections.push(section);
      return;
    }
    if ((m = line.match(/^##\s+(.+)$/))) {
      if (!section) return errors.push(`${where}: item before any section`);
      item = { title: m[1].trim(), figma: '', web: '', lines: [] };
      section.items.push(item);
      return;
    }
    if ((m = line.match(/^<!--\s*(.*?)\s*-->$/))) {
      const t = target();
      if (!t) return;
      for (const part of m[1].split('|')) {
        const kv = part.match(/^\s*(figma|web):\s*(.+?)\s*$/);
        if (kv) t[kv[1]] = kv[2];
      }
      return;
    }
    if ((m = line.match(/^\[(\w+)(?:\s+([a-z']+))?\]\s+(.+)$/))) {
      const [, surface, role = '', txt] = m;
      if (!SURFACES.includes(surface)) return errors.push(`${where}: unknown surface "${surface}"`);
      if (!ROLES.includes(role)) return errors.push(`${where}: unknown role "${role}"`);
      const t = target();
      if (!t) return errors.push(`${where}: line before any section`);
      t.lines.push({ surface, role, text: txt.trim() });
      return;
    }
    errors.push(`${where}: not a section, item, source comment or [surface role] line`);
  });
  return { copy: out, errors };
}

/** Lines one surface shows: its own and the shared ones, in file order. */
export const linesFor = (lines, surface) => lines.filter((l) => l.surface === 'both' || l.surface === surface);

/** One page reduced to one surface: { section: { lines, items: { title: lines } } }, the shape tools read. */
export function forSurface(copy, surface) {
  const page = { id: copy.id, page: copy.page, figma: copy.figma, web: copy.web, sections: [] };
  for (const s of copy.sections) {
    page.sections.push({
      name: s.name,
      figma: s.figma,
      web: s.web,
      lines: linesFor(s.lines, surface),
      items: s.items.map((it) => ({ title: it.title, figma: it.figma, web: it.web, lines: linesFor(it.lines, surface) })).filter((it) => it.lines.length),
    });
  }
  return page;
}

function readDir(dir) {
  const pages = {};
  const errors = [];
  if (!fs.existsSync(dir)) return { pages, errors, missing: true };
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
    const { copy, errors: e } = parseCopy(fs.readFileSync(path.join(dir, f), 'utf8'), f);
    errors.push(...e);
    if (!copy.id) errors.push(`${f}: front matter has no page`);
    else if (pages[copy.id]) errors.push(`${f}: page ${copy.id} is already in another file`);
    else pages[copy.id] = copy;
  }
  return { pages, errors };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const dir = path.resolve(arg('--dir') || '../copy');
  const { pages, errors, missing } = readDir(dir);
  if (errors.length) {
    console.error(`copy: ${errors.length} problem(s)\n  ` + errors.join('\n  '));
    process.exit(1);
  }
  if (arg('--page')) {
    const p = pages[arg('--page')];
    if (!p) {
      console.error(`copy: no page ${arg('--page')} in ${dir}`);
      process.exit(1);
    }
    process.stdout.write(JSON.stringify(forSurface(p, arg('--surface') || 'figma')));
  } else {
    const outFile = path.resolve('src/docs/copy.gen.json');
    // The site ships only its own lines (both and web).
    const site = Object.fromEntries(Object.entries(pages).map(([id, p]) => [id, forSurface(p, 'web')]));
    fs.writeFileSync(outFile, JSON.stringify({ source: missing ? null : path.relative(process.cwd(), dir), pages: site }, null, 1) + '\n');
    console.log(missing ? `copy: no ${path.relative(process.cwd(), dir)} folder → empty ${path.relative(process.cwd(), outFile)}` : `copy: ${Object.keys(pages).length} page(s) → ${path.relative(process.cwd(), outFile)}`);
  }
}
