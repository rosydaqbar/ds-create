/**
 * App tokens from the Figma export (the same tokens/figma-variables.json the web uses).
 *
 *   node build-app-tokens.mjs --platform rn|swiftui|compose --in tokens/figma-variables.json --out <dir> [--package design.system]
 *
 * Writes one generated file per platform (APP.md §5 has the naming contract):
 *   rn       → <out>/tokens.ts        light/dark color objects, numbers in dp, text styles, shadows, motion
 *   swiftui  → <out>/Tokens.swift     enum DSTokens with DSColor(light:dark:), CGFloat sizes, text styles, motion
 *   compose  → <out>/Tokens.kt        DsColors (Light/Dark instances), Dp/Sp values, TextStyles, motion
 * Never edit the output; fix the Figma variable and export again (APP.md §8).
 * Figma px become dp (React Native, Compose) and pt (SwiftUI) one to one; font sizes become sp in Compose.
 */
import fs from 'node:fs';
import path from 'node:path';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const platform = arg('platform');
const input = arg('in', 'tokens/figma-variables.json');
const outDir = arg('out', '.');
const pkg = arg('package', 'design.system');
if (!['rn', 'swiftui', 'compose'].includes(platform)) {
  console.error('--platform must be rn, swiftui or compose');
  process.exit(1);
}
const src = JSON.parse(fs.readFileSync(input, 'utf8'));
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
const textStyles = (src.textStyles ?? []).map((t) => {
  const b = t.bound ?? {};
  const val = (k, fallback) => (b[k] ? resolve(b[k], 'Light') : fallback);
  const fam = families.find((f) => f.name === b.fontFamily);
  return { name: t.name, key: member(t.name), family: fam?.family ?? null, mono: fam?.mono ?? false, size: Number(val('fontSize', t.fontSize)), lineHeight: Number(val('lineHeight', t.lineHeight)), letterSpacing: Number(val('letterSpacing', t.letterSpacing ?? 0)), weight: Number(val('fontWeight', 400)) };
});
const colorOf = (c, mode) => (c && typeof c === 'object' && 'alias' in c ? hex(resolve(c.alias, mode)) : typeof c === 'string' ? hex(c) : '#000000');
const shadows = (src.effectStyles ?? [])
  .filter((e) => e.effects.some((x) => x.type === 'DROP_SHADOW' || x.type === 'INNER_SHADOW'))
  .map((e) => ({ name: e.name, key: camel(e.name.split('/')), layers: e.effects.filter((x) => x.type === 'DROP_SHADOW').map((x) => ({ x: x.x, y: x.y, blur: x.blur, spread: x.spread ?? 0, light: colorOf(x.color, 'Light'), dark: colorOf(x.color, 'Dark') })) }));

const groups = (list) => list.reduce((m, x) => ((m[x.group] ??= []).push(x), m), {});
const header = (c) => `${c} GENERATED by app/shared/scripts/build-app-tokens.mjs from ${path.basename(input)} — do not edit.\n${c} Fix values in the Figma variables and export again (APP.md §8).\n`;
const argb = (h) => {
  const s = h.replace('#', '');
  const a = s.length === 8 ? s.slice(6, 8) : 'ff';
  return `0x${(a + s.slice(0, 6)).toUpperCase()}`;
};
const cubic = (s) => String(s).split(',').map((n) => Number(n.trim()));

/* ---------- emit ---------- */
let file;
let text;
if (platform === 'rn') {
  file = 'tokens.ts';
  const colorObj = (mode) => Object.fromEntries(Object.entries(groups(colors)).map(([g, l]) => [g, Object.fromEntries(l.map((c) => [c.key, c[mode]]))]));
  const num = Object.fromEntries(Object.entries(groups(numbers)).map(([g, l]) => [g, Object.fromEntries(l.map((n) => [n.key, n.value]))]));
  const mo = (mode) => Object.fromEntries(motion.map((m) => [m.key, m.type === 'easing' ? cubic(m[mode]) : Number(m[mode])]));
  const ts = Object.fromEntries(textStyles.map((t) => [t.key, { fontFamily: t.family ?? undefined, fontSize: t.size, lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, fontWeight: String(t.weight) }]));
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
} else if (platform === 'swiftui') {
  file = 'Tokens.swift';
  const id = (k) => (['default', 'none', 'static', 'case', 'in', 'is', 'as', 'self'].includes(k) ? `\`${k}\`` : k);
  const enumOf = (name, body) => `    public enum ${name} {\n${body.join('\n')}\n    }\n`;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  // Component colors and component sizes would both be `Component`: colors get `ComponentColor`.
  const colorEnums = Object.entries(groups(colors)).map(([g, l]) => enumOf(g === 'component' ? 'ComponentColor' : cap(g), l.map((c) => `        /// ${c.name}${c.description ? ` — ${c.description.replace(/\n/g, ' ')}` : ''}\n        public static let ${id(c.key)} = DSColor(light: ${argb(c.light)}, dark: ${argb(c.dark)})`)));
  const numEnums = Object.entries(groups(numbers)).map(([g, l]) => enumOf(cap(g), l.map((n) => `        public static let ${id(n.key)}: CGFloat = ${n.value}`)));
  const typeEnum = enumOf('TextStyle', textStyles.map((t) => `        public static let ${id(t.key)} = DSTextStyle(family: ${t.family ? `"${t.family}"` : 'nil'}, monospaced: ${t.mono}, size: ${t.size}, lineHeight: ${t.lineHeight}, letterSpacing: ${t.letterSpacing}, weight: ${t.weight})`));
  const shadowEnum = enumOf('Shadow', shadows.map((s) => `        public static let ${id(s.key)}: [DSShadow] = [${s.layers.map((l) => `DSShadow(x: ${l.x}, y: ${l.y}, blur: ${l.blur}, spread: ${l.spread}, color: DSColor(light: ${argb(l.light)}, dark: ${argb(l.dark)}))`).join(', ')}]`));
  const motionEnum = enumOf('Motion', motion.map((m) => (m.type === 'easing' ? `        public static let ${id(m.key)} = DSEasing(${cubic(m.standard).join(', ')})` : `        public static let ${id(m.key)} = DSDuration(standard: ${Number(m.standard)}, reduced: ${Number(m.reduced)})`)));
  text = `${header('//')}
import SwiftUI

public enum DSTokens {
${[...colorEnums, ...numEnums, typeEnum, shadowEnum, motionEnum].join('\n')}}
`;
} else {
  file = 'Tokens.kt';
  const kid = (k) => (['default', 'object', 'in', 'is', 'as', 'val', 'var', 'fun', 'when', 'null'].includes(k) ? `\`${k}\`` : k);
  const allColors = colors.map((c) => ({ ...c, prop: c.group === 'component' ? c.key : c.key }));
  const objOf = (name, body) => `object ${name} {\n${body.join('\n')}\n}\n`;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  // `DsSize` is the Size variant enum in components, so size tokens are `DsSizes`.
  const numObjs = Object.entries(groups(numbers)).map(([g, l]) => objOf(g === 'size' ? 'DsSizes' : `Ds${cap(g)}`, l.map((n) => `    val ${kid(n.key)} = ${g.startsWith('fontSize') || g.startsWith('fontLineHeight') || g.startsWith('fontLetterSpacing') ? `${n.value}.sp` : g === 'fontWeight' ? `FontWeight(${n.value})` : `${n.value}.dp`}`)));
  text = `${header('//')}
package ${pkg}.tokens

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Every color role. One instance per color mode; DsTheme provides the active one. */
@Immutable
data class DsColors(
${allColors.map((c) => `    /** ${c.name} */\n    val ${kid(c.prop)}: Color,`).join('\n')}
)

val LightDsColors = DsColors(
${allColors.map((c) => `    ${kid(c.prop)} = Color(${argb(c.light)}),`).join('\n')}
)

val DarkDsColors = DsColors(
${allColors.map((c) => `    ${kid(c.prop)} = Color(${argb(c.dark)}),`).join('\n')}
)

${numObjs.join('\n')}
/** Text styles. FontFamily.Default = the platform system font; a brand font is mapped in DsTheme. */
object DsTextStyles {
${textStyles.map((t) => `    val ${kid(t.key)} = TextStyle(fontFamily = ${t.mono ? 'FontFamily.Monospace' : 'FontFamily.Default'}, fontSize = ${t.size}.sp, lineHeight = ${t.lineHeight}.sp, letterSpacing = ${t.letterSpacing}.sp, fontWeight = FontWeight(${t.weight}))`).join('\n')}
}

/** One layer of an effect style. Compose draws elevation from the strongest layer; focus rings use DsInteraction. */
@Immutable
data class DsShadowLayer(val x: Float, val y: Float, val blur: Float, val spread: Float, val light: Color, val dark: Color)

object DsShadows {
${shadows.map((x) => `    val ${kid(x.key)} = listOf(${x.layers.map((l) => `DsShadowLayer(${l.x}f, ${l.y}f, ${l.blur}f, ${l.spread}f, Color(${argb(l.light)}), Color(${argb(l.dark)}))`).join(', ')})`).join('\n')}
}

/** Motion in ms; Reduced applies when the system asks for reduced motion (DsTheme reads it). */
@Immutable
data class DsMotion(
${motion.filter((m) => m.type === 'duration').map((m) => `    val ${kid(m.key)}: Int,`).join('\n')}
)
val StandardDsMotion = DsMotion(${motion.filter((m) => m.type === 'duration').map((m) => `${kid(m.key)} = ${Number(m.standard)}`).join(', ')})
val ReducedDsMotion = DsMotion(${motion.filter((m) => m.type === 'duration').map((m) => `${kid(m.key)} = ${Number(m.reduced)}`).join(', ')})
object DsEasing {
${motion.filter((m) => m.type === 'easing').map((m) => `    val ${kid(m.key)} = androidx.compose.animation.core.CubicBezierEasing(${cubic(m.standard).map((n) => `${n}f`).join(', ')})`).join('\n')}
}
`;
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, file), text);
console.log(`app tokens (${platform}): ${colors.length} colors, ${numbers.length} sizes, ${textStyles.length} text styles, ${shadows.length} shadows, ${motion.length} motion → ${path.join(outDir, file)}`);
