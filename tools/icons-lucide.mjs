#!/usr/bin/env node
/**
 * Writes the calls that create the icon library on 1.7 Iconography from Lucide (ISC), the same icons and the same
 * version the docs site uses. Nothing is drawn or chosen by hand:
 *
 *   node tools/icons-lucide.mjs --slug {slug} [--registry path/to/icons/index.tsx] [--extra output/{slug}/icons-extra.json]
 *                               [--color color/icon/primary] [--size size/icon/lg]
 *
 * - The icon set is the site's icon registry: `output/{slug}/web/src/icons/index.tsx` when the build has a site,
 *   otherwise the template's `web/src/icons/index.tsx`. Each entry `'{category}/{name}': LucideComponent` becomes the
 *   component `Icon/{category}/{name}`.
 * - Extra icons for one system go in the registry of its site, or, for a Figma-only build, in `--extra`:
 *   { "files/cloud-download": "CloudDownload" }. Only Lucide components are accepted.
 * - The icon shapes are read from the installed `lucide-react` (web/node_modules, or a build's site). Run `npm ci` in
 *   `web/` first when neither has it.
 *
 * - The stroke binds to `--color` (default `color/icon/primary`, then `color/text/primary`), and the box to `--size`
 *   (default `size/icon/lg`) when that variable exists. Existing systems pass their own names.
 *
 * Output: `output/{slug}/icons/call-{n}.js` (each one `use_figma` call, under 45,000 characters) and `icons.json`
 * (the names and the Lucide version). The calls are idempotent: icons already on the page are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const slug = arg('--slug');
if (!slug) {
  console.error('usage: node tools/icons-lucide.mjs --slug {slug} [--registry file] [--extra file]');
  process.exit(1);
}
const OUT = path.join(ROOT, 'output', slug, 'icons');
const COLORS = arg('--color') ? [arg('--color')] : ['color/icon/primary', 'color/text/primary'];
const SIZE = arg('--size') || 'size/icon/lg';

// 1. The registry: system name → Lucide component name.
const siteReg = path.join(ROOT, 'output', slug, 'web', 'src', 'icons', 'index.tsx');
const regFile = path.resolve(arg('--registry') || (fs.existsSync(siteReg) ? siteReg : path.join(ROOT, 'web', 'src', 'icons', 'index.tsx')));
const reg = fs.readFileSync(regFile, 'utf8');
const block = reg.match(/export const icons = \{([\s\S]*?)\n\}/);
if (!block) throw new Error(`no "export const icons = {…}" in ${regFile}`);
const entries = [...block[1].matchAll(/'([a-z0-9-]+)\/([a-z0-9-]+)':\s*([A-Za-z0-9]+)/g)].map((m) => [m[1], m[2], m[3]]);
const extra = arg('--extra');
if (extra) for (const [k, comp] of Object.entries(JSON.parse(fs.readFileSync(path.resolve(extra), 'utf8')))) {
  const [cat, name] = k.split('/');
  if (!cat || !name) throw new Error(`extra icon "${k}": use {category}/{name}`);
  if (!entries.some((e) => e[0] === cat && e[1] === name)) entries.push([cat, name, comp]);
}

// 2. Lucide shapes from the installed lucide-react.
const cands = [path.join(ROOT, 'output', slug, 'web', 'node_modules', 'lucide-react'), path.join(ROOT, 'web', 'node_modules', 'lucide-react')];
const LR = cands.find((c) => fs.existsSync(path.join(c, 'dist', 'esm', 'lucide-react.mjs')));
if (!LR) throw new Error('lucide-react is not installed: run `npm ci` in web/ (or in the build\'s site) first');
const version = JSON.parse(fs.readFileSync(path.join(LR, 'package.json'), 'utf8')).version;
const index = fs.readFileSync(path.join(LR, 'dist', 'esm', 'lucide-react.mjs'), 'utf8');
const fileOf = new Map();
for (const m of index.matchAll(/export \{([^}]*)\} from '\.\/icons\/([a-z0-9-]+)\.mjs'/g))
  for (const n of m[1].matchAll(/default as ([A-Za-z0-9]+)/g)) fileOf.set(n[1], m[2]);
const ATTRS = ['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points'];
const shapeOf = (file) => {
  const src = fs.readFileSync(path.join(LR, 'dist', 'esm', 'icons', `${file}.mjs`), 'utf8');
  const m = src.match(/const __iconData = (\{[\s\S]*?\n\});/);
  if (!m) throw new Error(`no icon data in ${file}.mjs`);
  const data = new Function(`return ${m[1]}`)();
  return data.node.map(([tag, a]) => `<${tag} ${ATTRS.filter((k) => a[k] !== undefined).map((k) => `${k}="${a[k]}"`).join(' ')}/>`).join('');
};
const icons = [];
const missing = [];
for (const [cat, name, comp] of entries) {
  const file = fileOf.get(comp);
  if (!file) missing.push(`${cat}/${name}: ${comp}`);
  else icons.push([cat, name, shapeOf(file)]);
}
if (missing.length) {
  console.error(`Not Lucide components (lucide-react ${version}):\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

// 3. The calls. Same construction for every icon (foundations/1.7-iconography.md §9): a component on the size/icon/lg
// box, one flattened vector named Icon, constraints scale, stroke bound to the icon color, Lucide's stroke of 2.
const BODY = `
const page = figma.root.children.find((p) => /^1\\.7\\b/.test(p.name));
if (!page) return { error: 'no 1.7 page' };
await figma.setCurrentPageAsync(page);
const V = new Map((await figma.variables.getLocalVariablesAsync()).map((v) => [v.name, v]));
const COLOR = ${JSON.stringify(COLORS)}.find((n) => V.get(n));
if (!COLOR) return { error: 'no icon color variable (${COLORS.join(', ')}): create the tokens first, or pass --color' };
const paint = (n) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V.get(n));
const bind = (node, f, n) => { if (V.get(n)) node.setBoundVariable(f, V.get(n)); };
const have = new Set(page.findAllWithCriteria({ types: ['COMPONENT'] }).map((c) => c.name));
let main = page.children.find((n) => n.type === 'FRAME' && n.name === '.Main');
if (!main) {
  const bottom = Math.max(0, ...page.children.map((n) => n.y + n.height + 400));
  main = figma.createAutoLayout('VERTICAL'); main.name = '.Main'; page.appendChild(main); main.x = 0; main.y = page.children.length > 1 ? bottom : 0;
  main.fills = V.get('doc/surface/base') ? [paint('doc/surface/base')] : [];
  bind(main, 'itemSpacing', 'doc/space/block');
  for (const k of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight']) bind(main, k, 'doc/space/frame');
}
const groups = new Map(main.children.filter((n) => n.name.startsWith('Icons · ')).map((n) => [n.name.slice(8), n]));
const made = [], skipped = [], bad = [];
for (const [cat, name, inner] of I) {
  const full = 'Icon/' + cat + '/' + name;
  if (have.has(full)) { skipped.push(full); continue; }
  let g = groups.get(cat);
  if (!g) {
    g = figma.createAutoLayout('HORIZONTAL'); g.name = 'Icons · ' + cat; main.appendChild(g); g.fills = [];
    g.layoutWrap = 'WRAP'; g.resize(1312, 24); g.primaryAxisSizingMode = 'FIXED';
    bind(g, 'itemSpacing', 'doc/space/row'); bind(g, 'counterAxisSpacing', 'doc/space/row'); groups.set(cat, g);
  }
  const svg = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>');
  const c = figma.createComponent(); c.name = full; g.appendChild(c); c.resize(24, 24); c.fills = []; c.clipsContent = true;
  const v = figma.flatten(svg.children.slice(), svg); c.appendChild(v); svg.remove();
  v.name = 'Icon'; v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  v.fills = []; v.strokes = [paint(COLOR)]; v.strokeWeight = 2; v.strokeCap = 'ROUND'; v.strokeJoin = 'ROUND';
  bind(c, 'width', '${SIZE}'); bind(c, 'height', '${SIZE}');
  c.description = name.replace(/-/g, ' ') + ' (' + cat + '). Lucide ${version}, ISC.';
  if (v.type !== 'VECTOR' || c.children.length !== 1) bad.push(full);
  made.push(c.id);
}
return { made: made.length, skipped: skipped.length, bad, color: COLOR, main: main.id, first: made.slice(0, 3) };
`;
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/^call-\d+\.js$/.test(f)) fs.rmSync(path.join(OUT, f));
const LIMIT = 45000 - BODY.length;
const chunks = [[]];
let size = 0;
for (const ic of icons) {
  const len = JSON.stringify(ic).length + 1;
  if (size + len > LIMIT && chunks.at(-1).length) { chunks.push([]); size = 0; }
  chunks.at(-1).push(ic);
  size += len;
}
chunks.forEach((ch, k) => {
  const call = `const I = ${JSON.stringify(ch)};\n${BODY}`;
  fs.writeFileSync(path.join(OUT, `call-${k + 1}.js`), call);
  console.log(`call-${k + 1}.js: ${ch.length} icons, ${call.length} characters`);
});
fs.writeFileSync(path.join(OUT, 'icons.json'), JSON.stringify({ library: 'lucide', version, registry: path.relative(ROOT, regFile), icons: icons.map(([c, n]) => `${c}/${n}`) }, null, 1) + '\n');
console.log(`${icons.length} icons from Lucide ${version} (${path.relative(ROOT, regFile)}) → ${path.relative(ROOT, OUT)}/. Send the calls one at a time, before rendering 1.7.`);
