#!/usr/bin/env node
/**
 * Writes the build's set files from the return of kit/tools/figma/registry.js (one read-only call per file, usually):
 *
 *   node kit/tools/build/registry.mjs --slug acme <<'EOF'
 *   {…the call's return…}
 *   EOF
 *   node kit/tools/build/registry.mjs --slug acme --file return.json
 *
 * Writes workspace/output/{slug}/figma/sets/{id}.json (":" written as "-") for every set, private part and standalone component,
 * and workspace/output/{slug}/figma/icons.json (icon name → component id). A set file that holds a full layer snapshot
 * (kit/tools/figma/export-sets.js) keeps it: only its id, name, page, props and variant count are refreshed.
 * kit/tools/build/pack.mjs reads these files to turn set and icon names into ids.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const slug = arg('--slug');
if (!slug) {
  console.error('registry: --slug {system} is required');
  process.exit(2);
}
const raw = arg('--file') ? fs.readFileSync(path.resolve(arg('--file')), 'utf8') : fs.readFileSync(0, 'utf8');
const r = JSON.parse(raw);
const FIG = path.join(ROOT, 'workspace', 'output', slug, 'figma');
const SETS = path.join(FIG, 'sets');
fs.mkdirSync(SETS, { recursive: true });

let n = 0;
for (const [id, name, page, props, variants, def] of r.sets || []) {
  const f = path.join(SETS, `${id.replace(':', '-')}.json`);
  const prev = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  const full = prev.v === 1;
  const entry = full
    ? { ...prev, id, name, page: typeof prev.page === 'object' ? prev.page : page, registry: { props, variants, default: def || undefined } }
    : { v: 'registry', id, name, page, props, variants, default: def || undefined };
  fs.writeFileSync(f, JSON.stringify(entry, null, 1) + '\n');
  n++;
}
const iconFile = path.join(FIG, 'icons.json');
const icons = Object.keys(r.icons || {}).length ? { ...(fs.existsSync(iconFile) ? JSON.parse(fs.readFileSync(iconFile, 'utf8')) : {}), ...r.icons } : null;
if (icons) fs.writeFileSync(iconFile, JSON.stringify(icons, null, 1) + '\n');
console.log(`registry: ${n} set file(s) in workspace/output/${slug}/figma/sets/${icons ? `, ${Object.keys(icons).length} icon(s) in figma/icons.json` : ''}${r.next !== null && r.next !== undefined ? `; the call stopped at page ${r.next}: send it again with FROM = ${r.next}` : ''}`);
