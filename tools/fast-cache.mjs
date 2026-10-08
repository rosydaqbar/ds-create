#!/usr/bin/env node
/**
 * Writes the calls that cache the doc builder, the fast-mode renderer and the audit in the Figma file's plugin data
 * (workflow/FAST.md F3). One file per key, each one `use_figma` call:
 *
 *   node tools/fast-cache.mjs --out output/{slug}/fast/cache [--accepted output/{slug}/figma/audit-accepted.json]
 *
 * Keys, in the order to send them: docbuilder, docpages, docfoundations, fastkit, audit.
 * Each function is minified when a minifier is installed (rolldown, from web/node_modules or a build's site), which
 * keeps every call under the 50,000-character limit. Without one, the source is used as it is.
 *
 * Each call checks itself before it saves: the tool runs code through a formatter, so a byte-for-byte check would
 * always fail. The call compares only the letters of the function text (formatting never changes letters, and a
 * typo almost always does) and refuses to save on a mismatch (GOTCHAS.md G41).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const OUT = path.resolve(arg('--out') || path.join(ROOT, 'output', 'fast-cache'));
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const fnFrom = (src, name) => {
  const i = src.indexOf(`async function ${name}(`);
  if (i < 0) throw new Error(`no function ${name}`);
  const j = src.indexOf('\n}\n', i);
  return src.slice(i, j < 0 ? undefined : j + 2);
};
const builder = read('tools/figma-docbuilder.js');
let audit = read('tools/figma-audit.js').replace(/^const PAGE = .*;\n/m, '');
const accepted = arg('--accepted');
if (accepted) {
  // A build's approved exceptions (INITIATOR.md Part B, Gates) replace the empty ACCEPTED block.
  const acc = fs.readFileSync(path.resolve(accepted), 'utf8').trim();
  audit = audit.replace(/const ACCEPTED = \{[\s\S]*?\n\};/, `const ACCEPTED = ${acc};`);
}
const SOURCES = {
  docbuilder: fnFrom(builder, 'docbuilder'),
  docpages: fnFrom(builder, 'docpages'),
  docfoundations: fnFrom(builder, 'docfoundations'),
  fastkit: fnFrom(read('tools/figma-fastbuild.js'), 'fastkit'),
  audit: `async function audit(figma, PAGE) {\n${audit}\n}\n`,
};

// A minifier, when one is installed next to a docs site.
async function loadRolldown() {
  const cands = [path.join(ROOT, 'web', 'node_modules', 'rolldown')];
  const outDir = path.join(ROOT, 'output');
  if (fs.existsSync(outDir)) for (const d of fs.readdirSync(outDir)) cands.push(path.join(outDir, d, 'web', 'node_modules', 'rolldown'));
  for (const c of cands) {
    if (!fs.existsSync(path.join(c, 'package.json'))) continue;
    const pkg = JSON.parse(fs.readFileSync(path.join(c, 'package.json'), 'utf8'));
    const entry = pkg.exports?.['.']?.import ?? pkg.exports?.['.']?.default ?? pkg.module ?? pkg.main;
    const file = typeof entry === 'string' ? entry : entry?.default;
    if (file) return import(pathToFileURL(path.join(c, file)).href);
  }
  return null;
}
const rd = await loadRolldown();
const fnv = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

for (const [key, src] of Object.entries(SOURCES)) {
  let code = src.trim();
  let local = key;
  if (rd) {
    const tmp = path.join(OUT, `.${key}.mjs`);
    fs.writeFileSync(tmp, src.replace(`async function ${key}(`, `export async function ${key}(`));
    const r = await rd.build({ input: tmp, write: false, output: { format: 'esm', minify: true }, logLevel: 'silent' });
    fs.rmSync(tmp);
    code = r.output[0].code.trim().replace(/\/\* @__PURE__ \*\/ /g, '');
    const m = code.match(/export\s*\{\s*([\w$]+)(?:\s+as\s+\w+)?\s*\}\s*;?\s*$/);
    if (!m) throw new Error(`minified ${key}: no export`);
    local = m[1];
    code = code.slice(0, m.index).trim();
  }
  const text = new Function(`${code};return ${local}`)().toString();
  const letters = text.replace(/[^A-Za-z]/g, '');
  const call = `${code}
const __L = ${local}.toString().replace(/[^A-Za-z]/g, ''); let __h = 0x811c9dc5; for (let i = 0; i < __L.length; i++) { __h ^= __L.charCodeAt(i); __h = Math.imul(__h, 0x01000193) >>> 0; }
if (__L.length !== ${letters.length} || __h !== ${fnv(letters)}) return { key: '${key}', stored: false, letters: __L.length, want: ${letters.length} };
figma.root.setSharedPluginData('dscreate', '${key}', ${local}.toString()); return { key: '${key}', stored: true, len: ${local}.toString().length };
`;
  if (call.length > 49000) throw new Error(`${key}: the call is ${call.length} characters, over the 50,000 limit`);
  fs.writeFileSync(path.join(OUT, `cache-${key}.js`), call);
  console.log(`${key}: ${call.length} characters${rd ? ' (minified)' : ''} → ${path.relative(ROOT, path.join(OUT, `cache-${key}.js`))}`);
}
console.log('fast-cache: send the five calls in this order, one at a time; each answers stored: true. Clear the dscreate keys at step 17.');
