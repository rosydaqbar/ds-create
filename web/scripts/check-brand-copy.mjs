/**
 * Brand copy gate for src/brand/copy.ts: the brand's own sentences on the foundation and guidance
 * pages (WEB.md W5). Run: npm run check:brand-copy (part of npm run build).
 *
 * Every slot must have its question (a /** … *\/ comment) and a value. A slot still wrapped in
 * `template(…)` holds the template's generic text:
 *   - `brandCopy: 'template'` in src/ds.config.ts (ds-create, and a build before W5): listed, passes;
 *   - `brandCopy: 'written'` (a build after W5): fails, like an empty slot.
 * The template builds out of the box; a build can't finish W5 with a slot left unanswered.
 * `--list` prints every slot still marked, with its question: the W5 to-do list.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/brand/copy.ts');
const rel = path.relative(root, file);
const src = fs.readFileSync(file, 'utf8');
const config = fs.readFileSync(path.join(root, 'src/ds.config.ts'), 'utf8');
const written = /brandCopy:\s*'written'/.test(config);

const start = src.search(/export const brandCopy(:\s*\w+)?\s*=\s*\{/);
const end = src.indexOf('\n};', start);
if (start < 0 || end < 0) {
  console.log(`  ✕ ${rel}: no \`export const brandCopy: BrandCopy = { … };\` object`);
  process.exit(1);
}
const body = src.slice(src.indexOf('{', start) + 1, end);

/** Top-level slots: `  key: value` at two spaces, each with the comment right above it. */
const slots = [];
const lines = body.split('\n');
let comment = '';
let inComment = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^  \/\*\*/.test(line)) {
    inComment = !line.includes('*/');
    comment = line;
    continue;
  }
  if (inComment) {
    comment += '\n' + line;
    if (line.includes('*/')) inComment = false;
    continue;
  }
  const m = line.match(/^  ([A-Za-z_$][\w$]*):\s?(.*)$/);
  if (m) {
    const question = comment.replace(/\*\//g, ' ').replace(/\/\*\*/g, ' ').replace(/^\s*\*\s?/gm, ' ').replace(/\s+/g, ' ').trim();
    slots.push({ key: m[1], question, value: m[2] });
    comment = '';
    continue;
  }
  // Continuation of the current slot's value (deeper indent); section comments (`/* … */`) and blank lines are skipped.
  if (slots.length && /^ {3,}\S/.test(line)) slots.at(-1).value += '\n' + line;
}

const problems = [];
const pending = [];
for (const s of slots) {
  const v = s.value.trim().replace(/,$/, '').trim();
  // The bare value: without the template( … ) wrapper, outer parentheses or a type assertion.
  let inner = v.replace(/^template\(/, '(');
  for (let k = 0; k < 4; k++) inner = inner.replace(/\s+as\s+[^)]*$/, '').replace(/^\((.*)\)$/s, '$1').trim();
  const empty = inner === '' || /^(''|""|``)$/.test(inner) || /=>\s*\(?\s*(''|""|``)\s*\)?$/.test(inner);
  if (!s.question) problems.push(`${s.key}: no question above it (a /** … */ comment saying what the brand must answer)`);
  if (empty) problems.push(`${s.key}: empty`);
  else if (v.startsWith('template(')) pending.push(s);
}

if (!slots.length) problems.push('no slots found');
for (const p of problems) console.log(`  ✕ ${rel} · ${p}`);
// The questions are listed when they fail, or on request (`npm run check:brand-copy -- --list`, WEB.md W5).
if (pending.length && (written || process.argv.includes('--list'))) {
  const mark = written ? '✕' : '~';
  for (const s of pending) console.log(`  ${mark} ${s.key}: ${s.question}`);
}
const failed = problems.length + (written ? pending.length : 0);
console.log(
  `brand copy: ${slots.length} slots, ${pending.length} still template text${
    written ? '' : pending.length ? " (allowed while ds.config brandCopy is 'template'; WEB.md W5 answers them: npm run check:brand-copy -- --list)" : ''
  } → ${failed ? `${failed} problem(s)` : 'ok'}`,
);
process.exit(failed ? 1 : 0);
