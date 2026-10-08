/**
 * React Native tokens for the docs site's App previews, from the Figma export the docs use.
 *
 *   node build-rn-tokens.mjs --in <figma-variables.json> --out <dir>
 *
 * Writes <out>/tokens.ts: light/dark color objects, sizes in dp, text styles, shadows, motion
 * (workflow/APP.md §5 has the naming). Never edit the output; fix the Figma variable and export again.
 */
import fs from 'node:fs';
import path from 'node:path';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const input = arg('in', 'tokens/figma-variables.json');
const outDir = arg('out', '.');
const src = JSON.parse(fs.readFileSync(input, 'utf8'));

// Modes the owner approved as not supported (accepted.json next to the export, copied from the build
// ledger: { "unsupportedModes": { "Color": ["Dark"] } }) are left out. Without a Dark mode, `darkColors`
// repeats the Light values, so a device in dark mode still gets the supported colors.
const accPath = [path.join(path.dirname(input), 'accepted.json'), arg('accepted', '')].find((p) => p && fs.existsSync(p));
if (accPath) {
  const acc = JSON.parse(fs.readFileSync(accPath, 'utf8'));
  for (const [colName, drop] of Object.entries(acc.unsupportedModes || {})) {
    if (!Array.isArray(drop) || !drop.length) continue;
    const col = src.collections.find((c) => c.name === colName);
    if (col) col.modes = col.modes.filter((m) => !drop.includes(m));
    for (const v of src.variables) if (v.collection === colName) for (const m of drop) delete v.values[m];
  }
}
const byName = new Map(src.variables.map((v) => [v.name, v]));

/* ---------- resolve ---------- */
const FAMILY = { Light: ['Light', 'Standard', 'Value'], Dark: ['Dark', 'Standard', 'Value'], Standard: ['Standard', 'Light', 'Value'], Reduced: ['Reduced', 'Light', 'Value'] };
function resolve(name, mode, depth = 0) {
  const v = byName.get(name);
  if (!v || depth > 12) throw new Error(`Unknown or circular alias: ${name}`);
  const vals = v.values;
  const key = FAMILY[mode].find((m) => m in vals) ?? Object.keys(vals)[0];
  const raw = vals[key];
  return raw && typeof raw === 'object' && 'alias' in raw ? resolve(raw.alias, mode, depth + 1) : raw;
}
const isColor = (v) => v.type === 'COLOR';
const semantic = src.variables.filter((v) => v.collection !== 'Primitives' && v.collection !== 'Documentation');

/* ---------- naming ---------- */
const camel = (parts) =>
  parts
    .join('-')
    .split(/[-/ ]+/)
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join('');
/** `color/text/primary` → `textPrimary`; `space/2xl` → `space2xl` (a name never starts with a digit). */
const member = (name) => {
  const parts = name.split('/');
  const rest = camel(parts.slice(1));
  return /^\d/.test(rest) || !rest ? camel(parts) : rest;
};
const domainOf = (v) => {
  const d = v.name.split('/')[0];
  if (v.collection === 'Components') return 'component';
  if (d === 'font') return `font${v.name.split('/')[1].replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`; // fontSize, fontLineHeight, fontWeight, fontLetterSpacing, fontFamily
  if (d === 'border') return 'borderWidth';
  return d; // color, space, size, radius, motion, …
};
const memberIn = (v) => {
  const p = v.name.split('/');
  if (v.collection === 'Components') return camel(p);
  if (p[0] === 'font' || p[0] === 'border') { const r = camel(p.slice(2)); return /^\d/.test(r) || !r ? camel(p) : r; }
  return member(v.name);
};

/* ---------- collect ---------- */
const hex = (h) => h.toLowerCase();
const colors = semantic.filter(isColor).map((v) => ({ name: v.name, group: v.collection === 'Components' ? 'component' : 'color', key: memberIn(v), light: hex(resolve(v.name, 'Light')), dark: hex(resolve(v.name, 'Dark')), description: v.description }));
const numbers = semantic.filter((v) => v.type === 'FLOAT' && v.collection !== 'Motion').map((v) => ({ name: v.name, group: domainOf(v), key: memberIn(v), value: Number(resolve(v.name, 'Light')) }));
const families = semantic.filter((v) => v.type === 'STRING' && v.name.startsWith('font/family/')).map((v) => {
  const stack = String(resolve(v.name, 'Light'));
  const first = stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
  const system = /^(ui-sans-serif|system-ui|-apple-system|ui-monospace|SFMono-Regular|monospace|sans-serif)$/i.test(first);
  return { name: v.name, key: memberIn(v), family: system ? null : first, mono: /mono|code/i.test(v.name) || /mono/i.test(first) };
});
const motion = src.variables.filter((v) => v.collection === 'Motion').map((v) => ({
  name: v.name,
  key: member(v.name),
  type: v.name.includes('/easing/') ? 'easing' : 'duration',
  standard: resolve(v.name, 'Standard'),
  reduced: resolve(v.name, 'Reduced'),
}));
const STYLE_WEIGHTS = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900 };
const textStyles = (src.textStyles ?? []).map((t) => {
  const b = t.bound ?? {};
  const val = (k, fallback) => (b[k] ? resolve(b[k], 'Light') : fallback);
  const fam = families.find((f) => f.name === b.fontFamily);
  // Unbound text styles (raw values in Figma): weight and family come from the style itself.
  const ownWeight = STYLE_WEIGHTS[String(t.fontStyle || '').replace(/italic|oblique|\s|-|_/gi, '').toLowerCase() || 'regular'] ?? 400;
  const ownFamily = t.fontFamily && !/^(ui-sans-serif|system-ui|-apple-system|sf pro( (text|display))?)$/i.test(t.fontFamily) ? t.fontFamily : null;
  return {
    name: t.name,
    key: member(t.name),
    family: fam ? fam.family : ownFamily,
    mono: fam ? fam.mono : /mono|code/i.test(t.fontFamily || ''),
    size: Number(val('fontSize', t.fontSize)),
    lineHeight: Number(val('lineHeight', t.lineHeight)),
    letterSpacing: Number(val('letterSpacing', t.letterSpacing ?? 0)),
    weight: Number(val('fontWeight', ownWeight)),
    italic: /italic|oblique/i.test(t.fontStyle || ''),
  };
});
const colorOf = (c, mode) => (c && typeof c === 'object' && 'alias' in c ? hex(resolve(c.alias, mode)) : typeof c === 'string' ? hex(c) : '#000000');
const shadows = (src.effectStyles ?? [])
  .filter((e) => e.effects.some((x) => x.type === 'DROP_SHADOW' || x.type === 'INNER_SHADOW'))
  .map((e) => ({ name: e.name, key: camel(e.name.split('/')), layers: e.effects.filter((x) => x.type === 'DROP_SHADOW').map((x) => ({ x: x.x, y: x.y, blur: x.blur, spread: x.spread ?? 0, light: colorOf(x.color, 'Light'), dark: colorOf(x.color, 'Dark') })) }));

const groups = (list) => list.reduce((m, x) => ((m[x.group] ??= []).push(x), m), {});
const header = (c) => `${c} GENERATED by app/scripts/build-rn-tokens.mjs from ${path.basename(input)} — do not edit.\n${c} Fix values in the Figma variables and export again (workflow/APP.md §8).\n`;
const cubic = (s) => String(s).split(',').map((n) => Number(n.trim()));

/* ---------- emit ---------- */
let file;
let text;
{
  file = 'tokens.ts';
  const colorObj = (mode) => Object.fromEntries(Object.entries(groups(colors)).map(([g, l]) => [g, Object.fromEntries(l.map((c) => [c.key, c[mode]]))]));
  const num = Object.fromEntries(Object.entries(groups(numbers)).map(([g, l]) => [g, Object.fromEntries(l.map((n) => [n.key, n.value]))]));
  const mo = (mode) => Object.fromEntries(motion.map((m) => [m.key, m.type === 'easing' ? cubic(m[mode]) : Number(m[mode])]));
  const ts = Object.fromEntries(textStyles.map((t) => [t.key, { fontFamily: t.family ?? undefined, fontSize: t.size, lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, fontWeight: String(t.weight), ...(t.italic ? { fontStyle: 'italic' } : {}) }]));
  const sh = (mode) => Object.fromEntries(shadows.map((s) => {
    const l = s.layers[s.layers.length - 1] ?? { x: 0, y: 0, blur: 0, light: '#00000000', dark: '#00000000' };
    return [s.key, { shadowColor: l[mode], shadowOffset: { width: l.x, height: l.y }, shadowRadius: l.blur / 2, shadowOpacity: 1, elevation: Math.round(l.blur / 2) }];
  }));
  text = `${header('//')}
export const lightColors = ${JSON.stringify(colorObj('light'), null, 2)} as const;
export const darkColors: ColorTokens = ${JSON.stringify(colorObj('dark'), null, 2)};
export type ColorTokens = { [G in keyof typeof lightColors]: { [K in keyof (typeof lightColors)[G]]: string } };

/** Sizes in dp (Figma px one to one). */
export const dimensions = ${JSON.stringify(num, null, 2)} as const;

/** Text styles. fontFamily undefined = the platform system font. */
export const typography = ${JSON.stringify(ts, null, 2)} as const;

/** Elevation: the strongest layer of each effect style (React Native draws one shadow). */
export type ShadowToken = { shadowColor: string; shadowOffset: { width: number; height: number }; shadowRadius: number; shadowOpacity: number; elevation: number };
export const lightShadows: Record<${JSON.stringify(shadows.map((x) => x.key)).slice(1, -1).split(',').join(' | ') || 'never'}, ShadowToken> = ${JSON.stringify(sh('light'), null, 2)};
export const darkShadows: typeof lightShadows = ${JSON.stringify(sh('dark'), null, 2)};

/** Motion in ms and cubic-bezier control points; Reduced applies when the OS asks for reduced motion. */
export type MotionTokens = { [K in keyof typeof standardMotion]: (typeof standardMotion)[K] extends readonly number[] ? readonly number[] : number };
export const standardMotion = ${JSON.stringify(mo('standard'), null, 2)} as const;
export const reducedMotion: MotionTokens = ${JSON.stringify(mo('reduced'), null, 2)};
`;
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, file), text);
console.log(`React Native tokens: ${colors.length} colors, ${numbers.length} sizes, ${textStyles.length} text styles, ${shadows.length} shadows, ${motion.length} motion → ${path.join(outDir, file)}`);
