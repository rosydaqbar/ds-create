// The site's token input, built from the local files: foundations.json plus every Part's tokens (the Components
// collection), written in the shape of a Figma export so the site's scripts read it unchanged.
const hex = n => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
function color(value) {
  if (typeof value === 'string') return value.toLowerCase();
  if (value && typeof value === 'object' && 'r' in value) return '#' + hex(value.r) + hex(value.g) + hex(value.b) + (value.a !== undefined && value.a < 1 ? hex(value.a) : '');
  return value;
}
const measure = (m, size) => typeof m === 'number' ? m : m?.unit === 'PIXELS' ? m.value : m?.unit === 'PERCENT' ? m.value * size / 100 : m?.unit === 'AUTO' ? null : m ?? null;

function variable(v) {
  const values = Object.fromEntries(Object.entries(v.values).map(([mode, x]) => [mode, x?.alias ? {alias: x.alias} : v.type === 'COLOR' ? color(x) : x]));
  return {name: v.name, collection: v.collection, type: v.type, description: v.description ?? '', scopes: v.scopes ?? [], codeSyntax: v.codeSyntax ?? {}, hiddenFromPublishing: v.hiddenFromPublishing ?? false, values};
}
function textStyle(s) {
  const {name, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing, bound, ...rest} = s;
  return {textCase: 'ORIGINAL', textDecoration: 'NONE', paragraphSpacing: 0, paragraphIndent: 0, ...rest, name, fontFamily, fontStyle: fontStyle ?? 'Regular', fontSize,
    lineHeight: measure(lineHeight, fontSize), letterSpacing: measure(letterSpacing, fontSize) ?? 0, bound: bound ?? {}};
}
function effect(e) {
  return {type: e.type, visible: e.visible ?? true, blendMode: e.blendMode ?? 'NORMAL', x: e.x ?? e.offset?.x ?? 0, y: e.y ?? e.offset?.y ?? 0, blur: e.blur ?? e.radius ?? 0, spread: e.spread ?? 0,
    color: e.color?.alias ? {alias: e.color.alias} : color(e.color), ...(e.opacity !== undefined ? {opacity: e.opacity} : {})};
}

export function toTokenExport(draft, parts = {}, {pages, file = 'Local files'} = {}) {
  const tokens = Object.values(parts).flatMap(p => p?.tokens || []);
  const collections = draft.collections.map(c => ({name: c.name, modes: [...c.modes]}));
  if (tokens.length && !collections.some(c => c.name === 'Components')) collections.push({name: 'Components', modes: ['Value']});
  return {
    format: 'ds-create/figma-variables@1', file, collections,
    variables: [...draft.variables, ...tokens].map(variable),
    textStyles: (draft.textStyles || []).map(textStyle),
    effectStyles: (draft.effectStyles || []).map(s => ({...s, effects: s.effects.map(effect)})),
    gridStyles: structuredClone(draft.gridStyles || []),
    ...(pages ? {pages} : {}),
  };
}
