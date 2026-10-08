// Builds every code format from the Figma export.
//
//   tokens/figma-variables.json   input: run scripts/figma-export.js on the Figma file
//   src/styles/tokens.css         CSS custom properties (spec code syntax) + Tailwind v4 theme + text-style utilities
//   src/styles/chrome.gen.css     site-only defaults for the names the docs chrome uses that this file lacks
//   src/tokens/tokens.gen.ts      token data for the explorer pages
//   tokens/tokens.dtcg.json       DTCG (Design Tokens Community Group) JSON with modes in $extensions
//
// Names follow specs/SYSTEM.md Part C: `color/text/primary` → `--color-text-primary`.
// Never edit the generated files; change the Figma file, export, and run `npm run tokens`.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as chrome from './chrome-fallbacks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'tokens/figma-variables.json'), 'utf8'));

// Modes the owner approved as not supported (tokens/accepted.json, copied from the build ledger) are left
// out of the generated CSS, site data and DTCG. The Figma export itself is never edited. The site data keeps
// them as `collections[].unsupportedModes`, so the pages can say which modes exist in Figma but aren't supported.
//   tokens/accepted.json: { "unsupportedModes": { "Color": ["Dark"] }, "contrast": ["color/text/x on color/fill/y"] }
try {
  const acc = JSON.parse(readFileSync(join(root, 'tokens/accepted.json'), 'utf8'));
  for (const [colName, drop] of Object.entries(acc.unsupportedModes || {})) {
    const col = src.collections.find((c) => c.name === colName);
    if (!col || !Array.isArray(drop) || !drop.length) continue;
    col.modes = col.modes.filter((m) => !drop.includes(m));
    col.unsupportedModes = drop;
    for (const v of src.variables) if (v.collection === colName) for (const m of drop) delete v.values[m];
  }
} catch {
  /* no accepted.json: every mode in the export is supported */
}

const byName = new Map(src.variables.map((v) => [v.name, v]));
const cssName = (name) => '--' + name.replaceAll('/', '-').replaceAll('.', '_');
const LIGHT = ['Light', 'Standard', 'Value'];
const DARK = ['Dark'];
const REDUCED = ['Reduced'];

// Value of a variable in a mode family (falls back to the collection's first mode).
function rawIn(v, modes) {
  for (const m of modes) if (m in v.values) return v.values[m];
  return Object.values(v.values)[0];
}
// Follow aliases to the final variable for a mode family.
function resolveVar(name, modes, guard = 0) {
  const v = byName.get(name);
  if (!v) throw new Error(`Unknown token ${name}`);
  const r = rawIn(v, modes);
  if (r && typeof r === 'object' && r.alias) {
    if (guard > 10) throw new Error(`Alias loop at ${name}`);
    return resolveVar(r.alias, modes, guard + 1);
  }
  return { variable: v, value: r };
}

function unit(name) {
  if (/(^|\/)(font-weight|weight)\//.test(name) || name.startsWith('font/weight/')) return '';
  if (/^scale\/font-weight\//.test(name)) return '';
  if (/^scale\/duration\//.test(name) || /^motion\/(duration|delay)\//.test(name)) return 'ms';
  return 'px';
}
function literal(v, value) {
  if (v.type === 'COLOR') return value;
  if (typeof value === 'number') return value + unit(v.name);
  if (v.name.startsWith('motion/easing/')) return `cubic-bezier(${value})`;
  return value;
}
// CSS value for a variable in a mode family. Colours resolve to the primitive so a
// themed subtree (data-theme on any element) never inherits a value frozen at :root.
function cssValue(v, modes) {
  const r = rawIn(v, modes);
  if (r && typeof r === 'object' && r.alias) {
    if (v.type === 'COLOR') {
      const fin = resolveVar(v.name, modes);
      return `var(${cssName(fin.variable.name)})`;
    }
    return `var(${cssName(r.alias)})`;
  }
  return literal(v, r);
}
function resolvedLiteral(name, modes) {
  const { variable, value } = resolveVar(name, modes);
  return literal(variable, value);
}

const isColor = (v) => v.type === 'COLOR';
const modeful = (v) => Object.keys(v.values).some((m) => DARK.includes(m));
const primitives = src.variables.filter((v) => v.collection === 'Primitives');
const others = src.variables.filter((v) => v.collection !== 'Primitives');

// ---------- effects ----------
// Figma paints later effects on top; CSS paints the first shadow on top, so the order is reversed.
const isBlur = (style) => style.effects.length > 0 && style.effects.every((e) => e.type === 'BACKGROUND_BLUR' || e.type === 'LAYER_BLUR');
function shadowCss(style, modes) {
  if (isBlur(style)) return `${style.effects[0].blur}px`;
  return style.effects
    .filter((e) => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW')
    .slice()
    .reverse()
    .map((e) => {
      const color = e.color && e.color.alias ? `var(${cssName(resolveVar(e.color.alias, modes).variable.name)})` : e.color;
      return `${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${e.x}px ${e.y}px ${e.blur}px ${e.spread}px ${color}`;
    })
    .join(', ');
}
const effectName = (s) => cssName(s.name); // elevation/raised → --elevation-raised

// ---------- tailwind mapping ----------
const tw = []; // lines inside @theme inline
const twNames = {}; // token name → example utility
for (const v of others) {
  const n = v.name;
  const c = cssName(n);
  if (n.startsWith('color/') && !n.startsWith('color/gradient')) {
    tw.push(`${c}: var(${c});`);
    const rest = n.slice('color/'.length).replaceAll('/', '-');
    twNames[n] = n.startsWith('color/text/') ? `text-${rest}` : n.startsWith('color/icon/') ? `text-${rest}` : n.startsWith('color/border/') ? `border-${rest}` : `bg-${rest}`;
  } else if (v.collection === 'Components' && isColor(v)) {
    const t = '--color-' + c.slice(2);
    tw.push(`${t}: var(${c});`);
    twNames[n] = `bg-${c.slice(2)}`;
  } else if (n.startsWith('space/')) {
    const step = n.split('/')[1];
    tw.push(`--spacing-${step}: var(${c});`);
    twNames[n] = `p-${step} · gap-${step}`;
  } else if (n.startsWith('radius/')) {
    tw.push(`${c}: var(${c});`);
    twNames[n] = `rounded-${n.split('/')[1]}`;
  } else if (n.startsWith('font/family/')) {
    tw.push(`--font-${n.split('/')[2]}: var(${c});`);
    twNames[n] = `font-${n.split('/')[2]}`;
  } else if (n.startsWith('font/weight/')) {
    tw.push(`${c}: var(${c});`);
    twNames[n] = `font-${n.split('/')[2]}`;
  } else if (n.startsWith('font/size/')) {
    const k = n.split('/')[2];
    tw.push(`--text-${k}: var(${c});`);
    if (byName.has(`font/line-height/${k}`)) tw.push(`--text-${k}--line-height: var(${cssName(`font/line-height/${k}`)});`);
    if (byName.has(`font/letter-spacing/${k}`)) tw.push(`--text-${k}--letter-spacing: var(${cssName(`font/letter-spacing/${k}`)});`);
    twNames[n] = `text-${k}`;
  } else if (n.startsWith('motion/easing/')) {
    tw.push(`--ease-${n.split('/')[2]}: var(${c});`);
    twNames[n] = `ease-${n.split('/')[2]}`;
  } else if (n.startsWith('size/') || n.startsWith('motion/') || n.startsWith('border/') || v.collection === 'Components') {
    const prop = n.startsWith('motion/duration') ? 'duration' : n.startsWith('border/') ? 'border-(length:' : 'h';
    twNames[n] = prop === 'border-(length:' ? `border-(length:${c})` : `${prop}-(${c})`;
  }
}
for (const s of src.effectStyles) {
  if (isBlur(s)) {
    // blur/backdrop/md → backdrop-blur-backdrop-md
    const k = s.name.replace(/^blur\//, '').replaceAll('/', '-');
    tw.push(`--blur-${k}: var(${effectName(s)});`);
    twNames[s.name] = `backdrop-blur-${k}`;
    continue;
  }
  const k = s.name.replace(/^elevation\//, '').replaceAll('/', '-');
  tw.push(`--shadow-${k}: var(${effectName(s)});`);
  twNames[s.name] = `shadow-${k}`;
}

// Raw text styles (not bound to variables): weight from the style name, family with a fallback stack.
const WEIGHTS = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900 };
const styleWeight = (style) => WEIGHTS[String(style || '').replace(/italic|oblique|\s|-|_/gi, '').toLowerCase() || 'regular'] ?? null;
const familyStack = (family) => `"${family}", ${/mono|code/i.test(family) ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'}`;
tw.push('--font-sans: var(--font-family-ui);');
tw.push('--default-font-family: var(--font-family-ui);');

// No font family variables (raw text styles): the UI family is the one most text styles use.
let rawUiFamily = null;
if (!src.variables.some((v) => cssName(v.name) === '--font-family-ui') && src.textStyles.length) {
  const count = {};
  for (const t of src.textStyles) if (t.fontFamily && !/mono|code/i.test(t.fontFamily)) count[t.fontFamily] = (count[t.fontFamily] || 0) + 1;
  const ui = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (ui) rawUiFamily = familyStack(ui);
}

// ---------- site chrome fallbacks ----------
// The docs site's own UI uses a fixed set of names (scripts/chrome-fallbacks.mjs). Only the names this
// file doesn't define get a default, so the brand's own values always win and never show a default.
const defined = new Set([...src.variables.map((v) => cssName(v.name)), ...src.effectStyles.map((s) => effectName(s)), ...(rawUiFamily ? ['--font-family-ui'] : [])]);
const definedUtils = new Set(src.textStyles.map((t) => t.name.replaceAll('/', '-')));
const chromeTw = [];
const chromeLight = [];
const chromeDark = [];
const chromeUtils = [];
for (const [name, value] of chrome.colors) {
  if (defined.has(name)) continue;
  if (name.startsWith('--color-')) chromeTw.push(`${name}: var(${name});`);
  chromeLight.push(`${name}: ${value};`);
  chromeDark.push(`${name}: ${value};`);
}
for (const [name, value, key] of chrome.values) {
  if (defined.has(name)) continue;
  if (key) chromeTw.push(`${key}: var(${name});`);
  chromeLight.push(`${name}: ${value};`);
}
for (const [name, value, key] of chrome.effects) {
  if (defined.has(name)) continue;
  chromeTw.push(`${key}: var(${name});`);
  chromeLight.push(`${name}: ${value};`);
  chromeDark.push(`${name}: ${value};`);
}
for (const [cls, [size, lh, weight, mono]] of Object.entries(chrome.textStyles)) {
  if (definedUtils.has(cls)) continue;
  const key = cls.replace(/^type-/, '').replace(/-[a-z]+$/, ''); // type-body-xs-semibold → body-xs
  const w = { 400: 'regular', 500: 'medium', 600: 'semibold', 700: 'bold' }[weight];
  chromeUtils.push(
    `@utility ${cls} {\n  font-family: var(${mono ? '--font-family-mono' : '--font-family-ui'});\n  font-size: var(--font-size-${key}, ${size}px);\n  line-height: var(--font-line-height-${key}, ${lh}px);\n  font-weight: var(--font-weight-${w}, ${weight});\n}`,
  );
}

// ---------- css blocks ----------
const lines = [];
lines.push('/* GENERATED by scripts/build-tokens.mjs from tokens/figma-variables.json — do not edit. */');
lines.push('');
lines.push('/* Remove Tailwind defaults so only system tokens exist. */');
lines.push('@theme {\n  --color-*: initial;\n  --radius-*: initial;\n  --shadow-*: initial;\n  --inset-shadow-*: initial;\n  --drop-shadow-*: initial;\n  --blur-*: initial;\n}');
lines.push('');
lines.push('/* Tailwind utilities → system tokens (inline: utilities read the token at the element, so themed subtrees work). */');
lines.push('@theme inline {\n  ' + tw.join('\n  ') + '\n}');
lines.push('');

const lightDecl = [];
for (const v of primitives) lightDecl.push(`${cssName(v.name)}: ${cssValue(v, LIGHT)};`);
for (const v of others) lightDecl.push(`${cssName(v.name)}: ${cssValue(v, LIGHT)};`);
for (const s of src.effectStyles) lightDecl.push(`${effectName(s)}: ${shadowCss(s, LIGHT)};`);
if (rawUiFamily) lightDecl.push(`--font-family-ui: ${rawUiFamily};`);
lines.push(':root,\n[data-theme="light"] {\n  color-scheme: light;\n  ' + lightDecl.join('\n  ') + '\n}');
lines.push('');

const darkDecl = [];
for (const v of others) if (modeful(v) && isColor(v)) darkDecl.push(`${cssName(v.name)}: ${cssValue(v, DARK)};`);
for (const s of src.effectStyles) if (!isBlur(s)) darkDecl.push(`${effectName(s)}: ${shadowCss(s, DARK)};`);
lines.push('[data-theme="dark"] {\n  color-scheme: dark;\n  ' + darkDecl.join('\n  ') + '\n}');
lines.push('');

const reducedDecl = others.filter((v) => Object.keys(v.values).some((m) => REDUCED.includes(m))).map((v) => `${cssName(v.name)}: ${cssValue(v, REDUCED)};`);
lines.push('@media (prefers-reduced-motion: reduce) {\n  :root {\n    ' + reducedDecl.join('\n    ') + '\n  }\n}');
lines.push('[data-motion="reduced"] {\n  ' + reducedDecl.join('\n  ') + '\n}');
lines.push('');

// Text styles → one utility per Figma text style: type/body/md/regular → .type-body-md-regular
lines.push('/* Text styles: one utility per Figma text style. */');
for (const t of src.textStyles) {
  const b = t.bound || {};
  const decl = [];
  // Bound values use their variable; unbound ones (raw values in Figma) keep the style's own value,
  // so every utility sets family, size, line height, spacing and weight.
  if (b.fontFamily) decl.push(`font-family: var(${cssName(b.fontFamily)});`);
  else if (t.fontFamily) decl.push(`font-family: ${familyStack(t.fontFamily)};`);
  if (b.fontSize) decl.push(`font-size: var(${cssName(b.fontSize)});`);
  else if (typeof t.fontSize === 'number') decl.push(`font-size: ${t.fontSize}px;`);
  if (b.lineHeight) decl.push(`line-height: var(${cssName(b.lineHeight)});`);
  else if (typeof t.lineHeight === 'number') decl.push(`line-height: ${t.lineHeight}px;`);
  if (b.letterSpacing) decl.push(`letter-spacing: var(${cssName(b.letterSpacing)});`);
  else if (typeof t.letterSpacing === 'number' && t.letterSpacing !== 0) decl.push(`letter-spacing: ${t.letterSpacing}px;`);
  if (b.fontWeight) decl.push(`font-weight: var(${cssName(b.fontWeight)});`);
  else if (styleWeight(t.fontStyle)) decl.push(`font-weight: ${styleWeight(t.fontStyle)};`);
  if (/italic|oblique/i.test(t.fontStyle || '')) decl.push('font-style: italic;');
  const cls = t.name.replaceAll('/', '-');
  twNames[t.name] = cls;
  lines.push(`@utility ${cls} {\n  ${decl.join('\n  ')}\n}`);
}
lines.push('');

mkdirSync(join(root, 'src/styles'), { recursive: true });
writeFileSync(join(root, 'src/styles/tokens.css'), lines.join('\n') + '\n');

// Site chrome fallbacks: a separate file, so they never ship in the package or count as tokens.
const chromeCss = ['/* GENERATED by scripts/build-tokens.mjs — do not edit. Site chrome fallbacks (scripts/chrome-fallbacks.mjs): */'];
chromeCss.push('/* the names the docs site uses that this Figma file does not define. Docs site only: not tokens, not in the package. */');
if (chromeTw.length) chromeCss.push('@theme inline {\n  ' + chromeTw.join('\n  ') + '\n}');
if (chromeLight.length) chromeCss.push(':root,\n[data-theme="light"] {\n  ' + chromeLight.join('\n  ') + '\n}');
if (chromeDark.length) chromeCss.push('[data-theme="dark"] {\n  ' + chromeDark.join('\n  ') + '\n}');
chromeCss.push(...chromeUtils);
if (chromeCss.length === 2) chromeCss.push('/* Nothing missing: this file defines every name the site uses. */');
writeFileSync(join(root, 'src/styles/chrome.gen.css'), chromeCss.join('\n') + '\n');

// ---------- data for the explorer ----------
const data = {
  source: src.file,
  collections: src.collections,
  variables: src.variables.map((v) => {
    const modes = {};
    for (const [m, r] of Object.entries(v.values)) {
      // Custom modes (such as Border S/M/L) must resolve their own value first.
      const fam = DARK.includes(m) ? DARK : REDUCED.includes(m) ? REDUCED : LIGHT;
      modes[m] = { alias: r && typeof r === 'object' ? r.alias : null, value: String(resolvedLiteral(v.name, [m, ...fam])) };
    }
    return { name: v.name, collection: v.collection, type: v.type, description: v.description, css: cssName(v.name), tailwind: twNames[v.name] || null, modes };
  }),
  textStyles: src.textStyles.map((t) => ({
    name: t.name,
    className: t.name.replaceAll('/', '-'),
    bound: t.bound || {},
    // Raw text styles: the family as Figma has it, so pages can name it without a font variable.
    fontFamily: t.fontFamily ?? null,
    fontSize: t.bound && t.bound.fontSize ? String(resolvedLiteral(t.bound.fontSize, LIGHT)) : t.fontSize + 'px',
    lineHeight: t.bound && t.bound.lineHeight ? String(resolvedLiteral(t.bound.lineHeight, LIGHT)) : t.lineHeight + 'px',
    fontWeight: t.bound && t.bound.fontWeight ? String(resolvedLiteral(t.bound.fontWeight, LIGHT)) : String(styleWeight(t.fontStyle) ?? t.fontStyle),
    letterSpacing: t.bound && t.bound.letterSpacing ? String(resolvedLiteral(t.bound.letterSpacing, LIGHT)) : t.letterSpacing + 'px',
  })),
  effectStyles: src.effectStyles.map((s) => ({ name: s.name, css: effectName(s), tailwind: twNames[s.name], effects: s.effects, light: shadowCss(s, LIGHT), dark: shadowCss(s, DARK) })),
  gridStyles: src.gridStyles,
  pages: src.pages ?? [],
};
mkdirSync(join(root, 'src/tokens'), { recursive: true });
writeFileSync(
  join(root, 'src/tokens/tokens.gen.ts'),
  '// GENERATED by scripts/build-tokens.mjs — do not edit.\n' +
    "import type { TokenData } from './types';\n" +
    'export const tokens: TokenData = ' +
    JSON.stringify(data, null, 1) +
    ';\n',
);

// ---------- DTCG ----------
const dtcg = {};
const dtcgType = (v) => (v.type === 'COLOR' ? 'color' : v.type === 'STRING' ? (v.name.startsWith('motion/easing') ? 'cubicBezier' : 'fontFamily') : /duration|delay/.test(v.name) ? 'duration' : /weight/.test(v.name) ? 'fontWeight' : 'dimension');
const ref = (a) => '{' + a.replaceAll('/', '.') + '}';
for (const v of src.variables) {
  const parts = v.name.split('/');
  let node = dtcg;
  for (const p of parts.slice(0, -1)) {
    node[p] = node[p] && typeof node[p] === 'object' ? node[p] : {};
    node = node[p];
  }
  const modes = Object.entries(v.values);
  const toVal = (r) => (r && typeof r === 'object' && r.alias ? ref(r.alias) : typeof r === 'number' ? (unit(v.name) ? `${r}${unit(v.name)}` : r) : r);
  const leaf = { $type: dtcgType(v), $value: toVal(modes[0][1]) };
  if (v.description) leaf.$description = v.description;
  if (modes.length > 1) leaf.$extensions = { 'ds-create.modes': Object.fromEntries(modes.map(([m, r]) => [m, toVal(r)])), 'ds-create.collection': v.collection };
  else leaf.$extensions = { 'ds-create.collection': v.collection };
  const last = parts[parts.length - 1];
  // A role with children (color/text/brand + color/text/brand/hover): the role's own value lives in `$root`.
  if (node[last] && typeof node[last] === 'object' && !('$value' in node[last])) node[last].$root = leaf;
  else node[last] = leaf;
}
// fix parents created after their own leaf
(function fixRoots(n) {
  for (const [k, v] of Object.entries(n)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    const childKeys = Object.keys(v).filter((x) => !x.startsWith('$'));
    if ('$value' in v && childKeys.length) {
      const { $type, $value, $description, $extensions, ...kids } = v;
      n[k] = { ...kids, $root: { $type, $value, $description, $extensions } };
    }
    fixRoots(n[k]);
  }
})(dtcg);
writeFileSync(join(root, 'tokens/tokens.dtcg.json'), JSON.stringify(dtcg, null, 2) + '\n');

if (chromeLight.length || chromeUtils.length) console.log(`site chrome: ${chromeLight.length + chromeUtils.length} name(s) this file doesn't define got a site-only default (scripts/chrome-fallbacks.mjs)`);
console.log(`tokens: ${src.variables.length} variables, ${src.textStyles.length} text styles, ${src.effectStyles.length} effect styles → src/styles/tokens.css, src/tokens/tokens.gen.ts, tokens/tokens.dtcg.json`);
