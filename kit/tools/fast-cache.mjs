#!/usr/bin/env node
/**
 * Writes the calls that cache the doc builder, the fast-mode renderer and the audit in the Figma file's plugin data
 * (workflow/FAST.md F3). One file per key, each one `use_figma` call:
 *
 *   node kit/tools/fast-cache.mjs --out output/{slug}/fast/cache [--accepted output/{slug}/figma/audit-accepted.json]
 *                             [--pages reading|components|all]
 *
 * Keys, in the order to send them: docbuilder, docpages, docfoundations, fastkit, audit. `--pages reading` leaves out
 * docpages, which only Parts to Layouts need (default: all).
 *
 * SEND THE STATUS CALL FIRST: cache-status.js (read-only, tiny) answers which keys are missing or outdated in the
 * file. Send only those: re-typing a 20 KB call that is already in the file is the slowest part of a fast build.
 * Every caching call also stores a version stamp (`{key}.v`), so a retry or a new session skips what is current.
 * Each function is minified when a minifier is installed (rolldown, from kit/web/node_modules or a build's site), which
 * keeps every call under the 50,000-character limit. Without one, the source is used as it is.
 *
 * Each call checks itself before it saves: the tool runs code through a formatter, so a byte-for-byte check would
 * always fail. The call compares only the letters of the function text (formatting never changes letters, and a
 * typo almost always does) and refuses to save on a mismatch (workflow/GOTCHAS.md G41).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
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
const builder = read('kit/tools/figma-docbuilder.js');
let audit = read('kit/tools/figma-audit.js').replace(/^const PAGE = .*;\n/m, '');
const accepted = arg('--accepted');
if (accepted) {
  // A build's approved exceptions (workflow/INITIATOR.md Part B, Gates) replace the empty ACCEPTED block.
  const acc = fs.readFileSync(path.resolve(accepted), 'utf8').trim();
  audit = audit.replace(/const ACCEPTED = \{[\s\S]*?\n\};/, `const ACCEPTED = ${acc};`);
}
const want = arg('--pages') || 'all';
const SOURCES = {
  docbuilder: fnFrom(builder, 'docbuilder'),
  docpages: fnFrom(builder, 'docpages'),
  docfoundations: fnFrom(builder, 'docfoundations'),
  fastkit: fnFrom(read('kit/tools/figma-fastbuild.js'), 'fastkit'),
  audit: `async function audit(figma, PAGE) {\n${audit}\n}\n`,
};
if (want === 'reading') delete SOURCES.docpages;
const stamps = {};

// A minifier, when one is installed next to a docs site.
async function loadRolldown() {
  const cands = [path.join(ROOT, 'kit', 'web', 'node_modules', 'rolldown')];
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
  // A raw control character in the code is lost on the way into Figma (workflow/GOTCHAS.md G46): send its escape instead.
  code = code.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
  const text = new Function(`${code};return ${local}`)().toString();
  const letters = text.replace(/[^A-Za-z]/g, '');
  const call = `${code}
const __L = ${local}.toString().replace(/[^A-Za-z]/g, ''); let __h = 0x811c9dc5; for (let i = 0; i < __L.length; i++) { __h ^= __L.charCodeAt(i); __h = Math.imul(__h, 0x01000193) >>> 0; }
if (__L.length !== ${letters.length} || __h !== ${fnv(letters)}) return { key: '${key}', stored: false, letters: __L.length, want: ${letters.length} };
figma.root.setSharedPluginData('dscreate', '${key}', ${local}.toString()); figma.root.setSharedPluginData('dscreate', '${key}.v', '${fnv(letters)}'); return { key: '${key}', stored: true, len: ${local}.toString().length };
`;
  stamps[key] = String(fnv(letters));
  if (call.length > 49000) throw new Error(`${key}: the call is ${call.length} characters, over the 50,000 limit`);
  fs.writeFileSync(path.join(OUT, `cache-${key}.js`), call);
  console.log(`${key}: ${call.length} characters${rd ? ' (minified)' : ''} → ${path.relative(ROOT, path.join(OUT, `cache-${key}.js`))}`);
}
// The status call: which keys the file still needs. Read-only and a few hundred characters.
fs.writeFileSync(path.join(OUT, 'cache-status.js'), `const want = ${JSON.stringify(stamps)};
const need = Object.keys(want).filter((k) => figma.root.getSharedPluginData('dscreate', k + '.v') !== want[k] || !figma.root.getSharedPluginData('dscreate', k));
return { need, current: Object.keys(want).filter((k) => !need.includes(k)) };
`);
console.log(`cache-status.js → send it first; then send only the keys it lists in "need", one at a time, in this order: ${Object.keys(SOURCES).join(', ')}. Clear the dscreate keys at step 17.`);
