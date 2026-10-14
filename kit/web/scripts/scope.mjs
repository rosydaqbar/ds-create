#!/usr/bin/env node
/**
 * Fits the site to the round's scope (workflow/WEB.md W1), so a round "up to Parts" builds and type-checks before W4:
 *
 *   node scripts/scope.mjs --upto parts|components|sections|layouts [--no-gl] [--dry]
 *
 * - Deletes the stories of pages above the scope (src/docs/stories/{id}-*.doc.tsx: 3.x Components, 4.x Sections, …).
 * - A component above the scope that the site itself still imports (a docs control such as Select, a foundation page
 *   visual) moves to src/docs/controls/ with everything it needs, and every import of it is rewritten, the
 *   `@/components` barrel included. Controls are the site's own: not exported, not in the package.
 * - Every other component above the scope is deleted. The next round that documents a level copies its files and
 *   stories back from ds-create's kit/web.
 * - --no-gl sets `guidelines: false` in src/ds.config.ts (no Guidelines tab, matching a Figma build without them).
 * It prints the foundation and guidance pages that use a moved control: W5 replaces those visuals with the system's
 * own Parts or drops them, since they show components this system doesn't have yet.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const DRY = args.includes('--dry');
const LEVELS = ['parts', 'components', 'sections', 'layouts'];
const RANK = { 2: 'parts', 3: 'components', 4: 'sections', 5: 'layouts', 6: 'screens' };
const upto = arg('--upto');
if (!LEVELS.includes(upto)) {
  console.error(`scope: --upto ${LEVELS.join('|')} is required`);
  process.exit(2);
}
const SRC = path.resolve('src');
if (!fs.existsSync(path.join(SRC, 'docs', 'stories'))) {
  console.error('scope: run it in the site project (src/docs/stories not found)');
  process.exit(1);
}
const keep = LEVELS.slice(0, LEVELS.indexOf(upto) + 1);
const above = LEVELS.filter((l) => !keep.includes(l)).concat('screens');
const walk = (d, out = []) => {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (/\.(tsx?|mts)$/.test(e.name)) out.push(f);
  }
  return out;
};
const rel = (f) => path.relative(process.cwd(), f);

// 1. Stories above the scope.
const storyDir = path.join(SRC, 'docs', 'stories');
const goneStories = fs.readdirSync(storyDir).filter((f) => {
  const m = f.match(/^(\d)\.\d+-.*\.doc\.tsx$/);
  return m && !keep.includes(RANK[m[1]]);
}).map((f) => path.join(storyDir, f));

// 2. Components above the scope, and what each exports.
const aboveFiles = above.flatMap((l) => walk(path.join(SRC, 'components', l)));
const exportsOf = new Map();
for (const f of aboveFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop().replace(/^type\s+/, ''); if (n) names.add(n); }
  exportsOf.set(f, names);
}
const fileOfName = new Map();
for (const [f, names] of exportsOf) for (const n of names) if (!path.basename(f).startsWith('_')) fileOfName.set(n, f);

const resolveImport = (from, spec) => {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const ext of ['', '.tsx', '.ts', '/index.ts', '/index.tsx']) if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return base + ext;
  return null;
};
const IMPORT_RE = /import\s+(type\s+)?(\{[^}]*\}|[\w$]+|\*\s+as\s+[\w$]+)(\s*,\s*\{[^}]*\})?\s+from\s+['"]([^'"]+)['"];?/g;
const barrel = path.join(SRC, 'components', 'index.ts');
const isBarrel = (from, spec) => spec === '@/components' || resolveImport(from, spec) === barrel;
const namesIn = (clause) => clause.replace(/[{}]/g, '').split(',').map((s) => s.trim()).filter(Boolean);

// 3. What the site still uses: site files are everything outside src/components, minus the stories that go.
const siteFiles = walk(SRC).filter((f) => !f.startsWith(path.join(SRC, 'components') + path.sep) && !goneStories.includes(f));
const needed = new Set();
const pagesUsing = new Map();
for (const f of siteFiles) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[4];
    if (isBarrel(f, spec)) {
      for (const n of namesIn(m[2]).map((x) => x.replace(/^type\s+/, '').split(/\s+as\s+/)[0])) {
        const t = fileOfName.get(n);
        if (t) { needed.add(t); if (f.includes(`${path.sep}pages${path.sep}`)) pagesUsing.set(rel(f), [...(pagesUsing.get(rel(f)) || []), n]); }
      }
    } else {
      const t = resolveImport(f, spec);
      if (t && aboveFiles.includes(t)) { needed.add(t); if (f.includes(`${path.sep}pages${path.sep}`)) pagesUsing.set(rel(f), [...(pagesUsing.get(rel(f)) || []), path.basename(t, '.tsx')]); }
    }
  }
}
// Everything a needed file imports from above the scope comes along.
for (let grew = true; grew; ) {
  grew = false;
  for (const f of [...needed]) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(IMPORT_RE)) {
      const t = resolveImport(f, m[4]);
      if (t && aboveFiles.includes(t) && !needed.has(t)) { needed.add(t); grew = true; }
    }
  }
}
const CTRL = path.join(SRC, 'docs', 'controls');
const target = (f) => path.join(CTRL, path.basename(f));
const clash = [...needed].filter((f, i, a) => a.findIndex((g) => path.basename(g) === path.basename(f)) !== i);
if (clash.length) {
  console.error(`scope: two controls share a file name: ${clash.map(rel).join(', ')}`);
  process.exit(1);
}

// 4. Rewrite imports: inside moved files, and in every site file that imports a moved one.
const specFor = (fromNew, targetOld) => {
  if (needed.has(targetOld)) return path.dirname(fromNew) === CTRL ? './' + path.basename(targetOld).replace(/\.tsx?$/, '') : '@/docs/controls/' + path.basename(targetOld).replace(/\.tsx?$/, '');
  return '@/' + path.relative(SRC, targetOld).replace(/\\/g, '/').replace(/(\/index)?\.tsx?$/, '');
};
const writes = new Map();
for (const f of needed) {
  const src = fs.readFileSync(f, 'utf8').replace(IMPORT_RE, (all, ty, a, b, spec) => {
    if (!spec.startsWith('.')) return all;
    const t = resolveImport(f, spec);
    return t ? all.replace(spec, specFor(target(f), t)) : all;
  });
  writes.set(target(f), src);
}
for (const f of siteFiles) {
  const src = fs.readFileSync(f, 'utf8');
  let changed = false;
  const out = src.replace(IMPORT_RE, (all, ty, a, b, spec) => {
    if (isBarrel(f, spec) && a.startsWith('{')) {
      const names = namesIn(a);
      const moved = names.filter((n) => needed.has(fileOfName.get(n.replace(/^type\s+/, '').split(/\s+as\s+/)[0])));
      if (!moved.length) return all;
      changed = true;
      const stay = names.filter((n) => !moved.includes(n));
      const byFile = new Map();
      for (const n of moved) { const t = fileOfName.get(n.replace(/^type\s+/, '').split(/\s+as\s+/)[0]); byFile.set(t, [...(byFile.get(t) || []), n]); }
      const lines = [...byFile].map(([t, ns]) => `import ${ty || ''}{ ${ns.join(', ')} } from '${specFor(f, t)}';`);
      if (stay.length) lines.unshift(`import ${ty || ''}{ ${stay.join(', ')} } from '${spec}';`);
      return lines.join('\n');
    }
    const t = resolveImport(f, spec);
    if (t && needed.has(t)) { changed = true; return all.replace(spec, specFor(f, t)); }
    return all;
  });
  if (changed) writes.set(f, out);
}

// 5. Apply.
const removed = aboveFiles.filter((f) => !needed.has(f));
console.log(`scope: up to ${upto}`);
console.log(`  stories removed (${goneStories.length}): ${goneStories.map((f) => path.basename(f)).join(', ') || 'none'}`);
console.log(`  site controls moved to src/docs/controls (${needed.size}): ${[...needed].map((f) => path.basename(f)).join(', ') || 'none'}`);
console.log(`  components removed (${removed.length}): ${removed.map((f) => path.basename(f)).join(', ') || 'none'}`);
if (!DRY) {
  fs.mkdirSync(CTRL, { recursive: true });
  for (const f of goneStories) fs.rmSync(f);
  for (const [f, src] of writes) fs.writeFileSync(f, src);
  for (const f of aboveFiles) fs.rmSync(f);
  for (const l of above) { const d = path.join(SRC, 'components', l); if (fs.existsSync(d) && !fs.readdirSync(d).length) fs.rmdirSync(d); }
  if (args.includes('--no-gl')) {
    const cfg = path.join(SRC, 'ds.config.ts');
    const s = fs.readFileSync(cfg, 'utf8');
    fs.writeFileSync(cfg, s.replace(/guidelines:\s*true as boolean/, 'guidelines: false as boolean'));
    console.log('  ds.config: guidelines false (no Guidelines tab)');
  }
}
if (pagesUsing.size) {
  console.log('  W5: these pages show components this system does not have yet; replace them with its Parts or drop them:');
  for (const [f, ns] of pagesUsing) console.log(`    ${f}: ${[...new Set(ns)].join(', ')}`);
}
console.log(DRY ? 'scope: dry run, nothing changed' : 'scope: done; run npm run index, then npm run typecheck');
