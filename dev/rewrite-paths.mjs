#!/usr/bin/env node
// Maintainer script (not shipped). Rewrites path prefixes in tracked text files and tests/.
//   node dev/rewrite-paths.mjs '{"old/prefix":"new/prefix"}' [--root dir] [--dry]
//   node dev/rewrite-paths.mjs map.json
// A prefix matches only when it starts a path: at the start of a line or after whitespace, a backtick, a quote,
// "(", "[", "<", "=", ":", "," or "../". A prefix that begins with kit/, workflow/, specs/ and the like also matches after "/".
// Skips binary files, node_modules, lockfiles, the locked specs, .superpowers/ and docs/superpowers/. Prints the files changed.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRS = new Set(['node_modules', '.git']);
const SKIP_PREFIX = ['.superpowers/', 'docs/superpowers/', 'specs/foundations/', 'dev/rewrite-paths.mjs', 'dev/check-paths.allow'];
const SKIP_FILES = new Set(['specs/SYSTEM.md']);
const REPO_ROOTED = /^(kit|workflow|specs|skill|skills|knowledge|dev)\//;

async function walk(dir, base, out = []) {
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

export function skipFile(f) {
  return SKIP_FILES.has(f) || SKIP_PREFIX.some(p => f.startsWith(p)) || f.split('/').includes('node_modules') || /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(f);
}

async function listFiles(root) {
  let files;
  try { files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean); }
  catch { files = await walk(root, root); }
  files = files.concat(await walk(path.join(root, 'tests'), root));
  return [...new Set(files)].filter(f => !skipFile(f) && existsSync(path.join(root, f))).sort();
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function rewriteText(text, map) {
  const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  let out = text;
  for (const [from, to] of entries) {
    const lead = REPO_ROOTED.test(from) ? '(?:^|[\\s`\'"(\\[<=:,/])' : '(?:^|[\\s`\'"(\\[<=:,]|\\.\\./)';
    // The prefix must end at a path edge: "/" already ends it, otherwise no word character, dot-name or dash may follow.
    const tail = from.endsWith('/') ? '' : '(?![\\w-]|\\.\\w)';
    const re = new RegExp(`(${lead})${esc(from)}${tail}`, 'gm');
    out = out.replace(re, (_, pre) => pre + to);
  }
  return out;
}

export async function rewriteAll(root, map, { dry = false } = {}) {
  const changed = [];
  for (const f of await listFiles(root)) {
    let buf;
    try { buf = await readFile(path.join(root, f)); } catch { continue; }
    if (buf.includes(0)) continue; // binary
    const text = buf.toString('utf8'), next = rewriteText(text, map);
    if (next !== text) { changed.push(f); if (!dry) await writeFile(path.join(root, f), next); }
  }
  return changed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), ri = args.indexOf('--root');
  const root = ri >= 0 ? path.resolve(args[ri + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const arg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--root');
  if (!arg) { console.error('usage: rewrite-paths.mjs <json map | map.json> [--root dir] [--dry]'); process.exit(2); }
  const map = JSON.parse(arg.trim().startsWith('{') ? arg : await readFile(arg, 'utf8'));
  for (const f of await rewriteAll(root, map, { dry: args.includes('--dry') })) console.log(f);
}
