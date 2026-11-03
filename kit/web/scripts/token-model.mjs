// The token rules every code format shares: CSS names, values per mode, Tailwind mapping, text-style and
// effect declarations, and the site chrome defaults. build-tokens.mjs writes the site's files from it; Builder
// uses the same rules to draw a system's Parts with its own tokens (stageCss).
import * as chrome from './chrome-fallbacks.mjs';

export const cssName = (name) => '--' + name.replaceAll('/', '-').replaceAll('.', '_');
export const LIGHT = ['Light', 'Standard', 'Value'];
export const DARK = ['Dark'];
export const REDUCED = ['Reduced'];

// A literal stop color ({r,g,b,a} in 0–1, or a string already in CSS form) as CSS: hex when opaque, else rgba().
export const stopCss = (c) => {
  if (!c || typeof c !== 'object') return String(c);
  const h = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255);
  const a = c.a ?? 1;
  return a >= 1 ? '#' + [c.r, c.g, c.b].map((x) => h(x).toString(16).padStart(2, '0')).join('') : `rgba(${h(c.r)}, ${h(c.g)}, ${h(c.b)}, ${+a.toFixed(3)})`;
};
// One linear gradient paint ({angle, stops:[{position 0–1, color: {alias} | {r,g,b,a}}]}) as CSS. `colorOf` turns a
// stop color into CSS; by default an alias becomes var(--its-name). Pure, so Builder's session copy runs it too.
export function gradientCss(paint, colorOf = (c) => (c && c.alias ? `var(${cssName(c.alias)})` : stopCss(c))) {
  const stops = paint.stops.map((s) => `${colorOf(s.color)} ${+(s.position * 100).toFixed(2)}%`);
  return `linear-gradient(${+(paint.angle ?? 180).toFixed(2)}deg, ${stops.join(', ')})`;
}

export function tokenModel(src) {
  const paintStyles = src.paintStyles || [];
  const byName = new Map(src.variables.map((v) => [v.name, v]));

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
    if (v.type === 'TIMING') return `${value}s`; // Plugin API stores seconds, not UI milliseconds.
    if (v.type === 'EASING') {
      const points = bezierPoints(value, v.name);
      return `cubic-bezier(${points.join(', ')})`;
    }
    if (typeof value === 'number') return value + unit(v.name);
    if (v.name.startsWith('motion/easing/') && !/^(?:cubic-bezier\(|linear$|ease(?:-in|-out|-in-out)?$)/.test(value)) return `cubic-bezier(${value})`;
    return value;
  }
  function bezierPoints(value, name) {
    if (value?.type === 'CUSTOM_CUBIC_BEZIER') {
      const {x1, y1, x2, y2} = value.easingFunctionCubicBezier || {};
      if ([x1, y1, x2, y2].every(Number.isFinite) && x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1) return [x1, y1, x2, y2];
    }
    const points = {LINEAR: [0,0,1,1], EASE_IN: [.42,0,1,1], EASE_OUT: [0,0,.58,1], EASE_IN_AND_OUT: [.42,0,.58,1]}[value?.type];
    if (points) return points;
    throw new Error(`${name}: native ${value?.type || 'invalid easing'} has no supported CSS cubic-bezier mapping; preserve the Figma value and provide an explicit code mapping.`);
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
  // A variable is modeful when it has a Dark value, or when its alias chain reaches one (a single-mode
  // component or documentation token that aliases a Light/Dark role needs its own Dark declaration).
  const modeful = (v, guard = 0) => {
    if (Object.keys(v.values).some((m) => DARK.includes(m))) return true;
    const r = Object.values(v.values)[0];
    const next = r && typeof r === 'object' && r.alias ? byName.get(r.alias) : null;
    return !!next && guard < 10 && modeful(next, guard + 1);
  };
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
  // Gradients: color/gradient/brand → --color-gradient-brand, stops resolved to their primitive per mode like effect colors.
  // Figma paints later paints on top; CSS paints the first background layer on top, so the order is reversed.
  const paintCss = (style, modes) => style.paints.filter((p) => p.type === 'GRADIENT_LINEAR').slice().reverse()
    .map((p) => gradientCss(p, (c) => (c && c.alias ? `var(${cssName(resolveVar(c.alias, modes).variable.name)})` : stopCss(c)))).join(', ');
  const paintName = (s) => cssName(s.name);

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

  // Gradients are not Tailwind colors: no --color-* mapping, only an image utility over the plain variable.
  for (const s of paintStyles) twNames[s.name] = `bg-(image:${paintName(s)})`;

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
  const defined = new Set([...src.variables.map((v) => cssName(v.name)), ...src.effectStyles.map((s) => effectName(s)), ...paintStyles.map((s) => paintName(s)), ...(rawUiFamily ? ['--font-family-ui'] : [])]);
  const definedUtils = new Set(src.textStyles.map((t) => t.name.replaceAll('/', '-')));
  const chromeTw = [];
  const chromeLight = [];
  const chromeDark = [];
  const chromeText = []; // [class, declarations]
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
    chromeText.push([cls, [`font-family: var(${mono ? '--font-family-mono' : '--font-family-ui'});`, `font-size: var(--font-size-${key}, ${size}px);`, `line-height: var(--font-line-height-${key}, ${lh}px);`, `font-weight: var(--font-weight-${w}, ${weight});`]]);
  }

  // ---------- declarations ----------
  const lightDecl = [];
  for (const v of primitives) lightDecl.push(`${cssName(v.name)}: ${cssValue(v, LIGHT)};`);
  for (const v of others) lightDecl.push(`${cssName(v.name)}: ${cssValue(v, LIGHT)};`);
  for (const s of src.effectStyles) lightDecl.push(`${effectName(s)}: ${shadowCss(s, LIGHT)};`);
  for (const s of paintStyles) lightDecl.push(`${paintName(s)}: ${paintCss(s, LIGHT)};`);
  if (rawUiFamily) lightDecl.push(`--font-family-ui: ${rawUiFamily};`);
  const darkDecl = [];
  for (const v of others) if (modeful(v) && isColor(v)) darkDecl.push(`${cssName(v.name)}: ${cssValue(v, DARK)};`);
  for (const s of src.effectStyles) if (!isBlur(s)) darkDecl.push(`${effectName(s)}: ${shadowCss(s, DARK)};`);
  for (const s of paintStyles) darkDecl.push(`${paintName(s)}: ${paintCss(s, DARK)};`);
  const reducedDecl = others.filter((v) => Object.keys(v.values).some((m) => REDUCED.includes(m))).map((v) => `${cssName(v.name)}: ${cssValue(v, REDUCED)};`);

  // Text styles → one utility per Figma text style: type/body/md/regular → .type-body-md-regular
  const textRules = [];
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
    textRules.push([cls, decl]);
  }

  return { byName, rawIn, resolveVar, unit, literal, bezierPoints, cssValue, resolvedLiteral, isColor, modeful, primitives, others, isBlur, shadowCss, effectName, paintStyles, paintCss, paintName,
    tw, twNames, styleWeight, familyStack, rawUiFamily, chromeTw, chromeLight, chromeDark, chromeText, lightDecl, darkDecl, textRules, reducedDecl };
}

// Plain CSS (no Tailwind directives) for a system's tokens under one selector: its variables, the chrome
// defaults for the names it lacks, its Dark values, and its text styles as classes. Builder draws Parts with it.
export function stageCss(src, scope, { dark = true } = {}) {
  const m = tokenModel(src);
  const block = (sel, decl) => decl.length ? `${sel} {\n  ${decl.join('\n  ')}\n}` : '';
  // A family the viewer may not have installed still reads as the right kind of face, as Builder's Button preview does.
  const families = src.variables.filter((v) => v.name.startsWith('font/family/')).map((v) => { const r = m.resolveVar(v.name, LIGHT).value; return typeof r === 'string' && !r.includes(',') ? `${cssName(v.name)}: ${m.familyStack(r)};` : null; }).filter(Boolean);
  return [
    block(scope, [...m.lightDecl, ...m.chromeLight, ...families]),
    // The drawings follow a dark page (data-theme on <html>) as well as their own data-theme. A system without a
    // Dark mode leaves this out, so its drawings stay in their Light values instead of half-dark defaults.
    dark ? block(`${scope}[data-theme="dark"], [data-theme="dark"] ${scope}`, [...m.darkDecl, ...m.chromeDark]) : '',
    ...[...m.textRules, ...m.chromeText].map(([cls, decl]) => block(`${scope} .${cls}`, decl)),
  ].filter(Boolean).join('\n') + '\n';
}
