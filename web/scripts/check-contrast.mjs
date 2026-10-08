/**
 * Contrast gate for the color roles, straight from the Figma export (tokens/figma-variables.json).
 * Every pair a component or page draws text with must reach WCAG AA 4.5:1 in every color mode,
 * including the hover, pressed and selected fills under on-solid text and the placeholder.
 * Pairs whose tokens don't exist in this system are skipped. Run: npm run check:contrast
 * (part of npm run build). Fix failures in the Figma variables, then export again (WEB.md §9).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'tokens/figma-variables.json'), 'utf8'));
const byName = new Map(src.variables.map((v) => [v.name, v]));
/**
 * What the owner approved for this system (tokens/accepted.json, copied from the build ledger):
 *   unsupportedModes  { "Color": ["Dark"] }: modes Figma has but the system doesn't support; not checked.
 *   contrast          ["color/text/x on color/fill/y"]: pairs below AA the owner approved; listed, never failing.
 * The template has no accepted.json: every mode is checked and every pair must pass.
 */
const accFile = path.join(root, 'tokens/accepted.json');
const accepted = fs.existsSync(accFile) ? JSON.parse(fs.readFileSync(accFile, 'utf8')) : {};
const approvedPairs = new Set(accepted.contrast ?? []);
const skipModes = accepted.unsupportedModes?.Color ?? [];
const colorModes = (src.collections.find((c) => c.name === 'Color')?.modes ?? ['Light']).filter((m) => !skipModes.includes(m));
for (const m of skipModes) console.log(`  ~ ${m} mode: not supported (approved in tokens/accepted.json), not checked`);

/** Follow aliases to a hex value in a mode family (primitives have one mode). */
function hex(name, mode, seen = 0) {
  const v = byName.get(name);
  if (!v || seen > 10) return null;
  const vals = v.values;
  const raw = vals[mode] ?? vals.Value ?? Object.values(vals)[0];
  if (raw && typeof raw === 'object' && raw.alias) return hex(raw.alias, mode, seen + 1);
  return typeof raw === 'string' && raw.startsWith('#') ? raw : null;
}
const rgba = (h) => {
  const s = h.slice(1);
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255).concat(s.length >= 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1);
};
const over = (top, under) => top.slice(0, 3).map((c, i) => c * top[3] + under[i] * (1 - top[3])).concat(1);
const lum = (c) => {
  const [r, g, b] = c.slice(0, 3).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Documented exceptions: a third party fixes the colors. Listed in the output, never failing. */
const exceptions = new Map([['social-button/facebook/fg', 'Facebook brand rules fix the button blue and white']]);

const pairs = [];
const surfaces = ['color/surface/base', 'color/surface/raised', 'color/surface/sunken', 'color/surface/overlay'];
for (const t of ['primary', 'secondary', 'tertiary', 'placeholder', 'brand', 'danger', 'warning', 'success', 'info'])
  for (const s of surfaces) pairs.push([`color/text/${t}`, s]);
// Brand and danger solids carry on-solid text; the neutral solid is the inverted surface and carries inverse text.
for (const [text, tone] of [['color/text/on-solid', 'brand'], ['color/text/on-solid', 'danger'], ['color/text/inverse', 'neutral']])
  for (const st of ['', '/hover', '/pressed', '/selected']) pairs.push([text, `color/fill/${tone}/solid${st}`]);
// Tone text on its subtle fill: rest and hover for every tone (badges, tags, banners);
// pressed and selected too for the action tones, brand and danger (secondary and tertiary buttons, rows).
for (const tone of ['brand', 'danger', 'warning', 'success', 'info'])
  for (const st of ['', '/hover', ...(tone === 'brand' || tone === 'danger' ? ['/pressed', '/selected'] : [])]) pairs.push([`color/text/${tone}`, `color/fill/${tone}/subtle${st}`]);
for (const t of ['primary', 'secondary']) pairs.push([`color/text/${t}/on-brand`, 'color/surface/brand-solid']);
pairs.push(['color/text/inverse', 'color/surface/inverse']);
for (const v of src.variables) {
  const m = v.name.match(/^social-button\/([a-z0-9-]+)\/fg$/);
  if (m) for (const st of ['', '/hover']) pairs.push([v.name, `social-button/${m[1]}/fill${st}`]);
}

let failed = 0;
let checked = 0;
const notes = [];
for (const mode of colorModes) {
  const base = hex('color/surface/base', mode);
  const baseC = base ? rgba(base) : [1, 1, 1, 1];
  for (const [fg, bg] of pairs) {
    const f = hex(fg, mode);
    const b = hex(bg, mode);
    if (!f || !b) continue;
    const bgC = over(rgba(b), baseC);
    const r = ratio(over(rgba(f), bgC), bgC);
    checked++;
    if (r >= 4.5) continue;
    const line = `${mode.padEnd(6)} ${fg} on ${bg}: ${r.toFixed(2)}:1 (needs 4.5:1)`;
    if (exceptions.has(fg)) notes.push(`  ~ ${line} — exception: ${exceptions.get(fg)}`);
    else if (approvedPairs.has(`${fg} on ${bg}`)) notes.push(`  ~ ${line} — approved by the owner (tokens/accepted.json; documented on 1.1 Color)`);
    else {
      failed++;
      console.log(`  ✕ ${line}`);
    }
  }
}
for (const n of [...new Set(notes)]) console.log(n);
console.log(`contrast: ${checked} pairs in ${colorModes.join(' and ')} → ${failed} unaccepted failures, ${notes.length} accepted below-target pairs`);
process.exit(failed ? 1 : 0);
