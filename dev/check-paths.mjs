#!/usr/bin/env node
// Maintainer script (not shipped). Finds repo paths named in tracked files and tests/ that do not exist.
//   node dev/check-paths.mjs [--json] [--root dir]
// Paths listed in dev/check-paths.allow (under the root) are not reported.
// Exits 1 when any path is missing.
import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PREFIXES = ['kit', 'workflow', 'specs', 'skill', 'skills', 'knowledge', 'dev', 'examples'];
const TEXT = /\.(md|mjs|js|cjs|ts|tsx|json|html|css|yml|yaml|txt|sh)$/i;
const SKIP_DIRS = new Set(['node_modules', '.git']);
// A path starts a token (not preceded by a word, dot, dash or slash) and runs to whitespace or a closing mark.
const PATH_RE = new RegExp(`(?<![\\w./{}$-])((?:${PREFIXES.join('|')})/[^\\s"'\`()\\[\\]<>,;:|*]*)`, 'g');

async function walk(dir, base = dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, base, out);
    else if (e.isFile()) out.push(path.relative(base, full));
  }
  return out;
}

async function listFiles(root) {
  let files;
  try {
    files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean);
  } catch { files = await walk(root); }
  const tests = await walk(path.join(root, 'tests'), root);
  return [...new Set([...files, ...tests])].filter(f => TEXT.test(f) && !f.endsWith('package-lock.json') && !f.split('/').includes('node_modules'));
}

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

async function readAllowed(root) {
  try {
    const text = await readFile(path.join(root, 'dev/check-paths.allow'), 'utf8');
    return new Set(text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')));
  } catch { return new Set(); }
}

export async function findMissing(root) {
  const missing = [], allowed = await readAllowed(root);
  for (const file of (await listFiles(root)).sort()) {
    let text;
    try { text = await readFile(path.join(root, file), 'utf8'); } catch { continue; }
    const seen = new Set();
    for (const m of text.matchAll(PATH_RE)) {
      let p = m[1].replace(/[.…]+$/, '');
      if (/[{}$…]/.test(p) || seen.has(p) || allowed.has(p)) continue;
      const last = p.split('/').pop();
      if (!(p.endsWith('/') || /\.[A-Za-z0-9]+$/.test(last))) continue;
      seen.add(p);
      if (!(await exists(path.join(root, p)))) missing.push({ path: p, file });
    }
  }
  return missing;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), i = args.indexOf('--root');
  const root = i >= 0 ? path.resolve(args[i + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const missing = await findMissing(root);
  if (args.includes('--json')) console.log(JSON.stringify(missing, null, 2));
  else for (const m of missing) console.log(`${m.path}\t(in ${m.file})`);
  process.exit(missing.length ? 1 : 0);
}
