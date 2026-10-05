// Merges partial Figma exports (tokens/parts/*.json, written from scripts/figma-export.js
// with PART set) into tokens/figma-variables.json.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'tokens/parts');
const parts = readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
if (!parts.length) throw new Error('No files in tokens/parts/');
const seen = new Set();
const out = { format: 'ds-create/figma-variables@1', file: parts[0].file, collections: parts[0].collections, variables: [], textStyles: [], effectStyles: [], gridStyles: [] };
for (const p of parts) {
  for (const v of p.variables) if (!seen.has(v.name)) (seen.add(v.name), out.variables.push(v));
  for (const k of ['textStyles', 'effectStyles', 'gridStyles']) if (p[k] && p[k].length) out[k] = p[k];
}
writeFileSync(join(root, 'tokens/figma-variables.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`merged ${parts.length} parts: ${out.variables.length} variables, ${out.textStyles.length} text styles`);
