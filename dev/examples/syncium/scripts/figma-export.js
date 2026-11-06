// Figma → tokens export.
// Run this as a `use_figma` script (Plugin API) on the generated Figma file.
// It returns one JSON object; save it verbatim as web/tokens/figma-variables.json,
// then run `npm run tokens` to regenerate CSS, the Tailwind theme and the DTCG file.
// Read-only: it never changes the Figma file.
//
// Large files: tool output is capped (about 20 KB). Export in parts by setting PART below,
// save each result as tokens/parts/{n}.json, then run `npm run tokens:merge`.
//   PART = { collections: ['Color'], from: 0, to: 90, styles: false }   one slice of variables
//   PART = { collections: [], styles: true }                             only text, effect and grid styles
// Leave PART = null to export everything at once.
const PART = null;

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const byId = Object.fromEntries(vars.map((v) => [v.id, v]));
const colById = Object.fromEntries(cols.map((c) => [c.id, c]));
const hex = (c) => {
  const h = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + h(c.r) + h(c.g) + h(c.b) + (c.a !== undefined && c.a < 1 ? h(c.a) : '');
};
const val = (v) =>
  v && v.type === 'VARIABLE_ALIAS'
    ? { alias: byId[v.id] ? byId[v.id].name : null }
    : v && typeof v === 'object' && 'r' in v
      ? hex(v)
      : v;
const bound = (bv) => (bv && bv.id && byId[bv.id] ? byId[bv.id].name : null);

const variables = vars
  .filter((v) => colById[v.variableCollectionId])
  .filter((v) => !PART || PART.collections.includes(colById[v.variableCollectionId].name))
  .map((v) => {
    const col = colById[v.variableCollectionId];
    const values = {};
    for (const m of col.modes) values[m.name] = val(v.valuesByMode[m.modeId]);
    return {
      name: v.name,
      collection: col.name,
      type: v.resolvedType,
      description: v.description || '',
      values,
    };
  })
  .slice(PART && PART.from != null ? PART.from : 0, PART && PART.to != null ? PART.to : undefined);
const withStyles = !PART || PART.styles;

const textStyles = !withStyles ? [] : (await figma.getLocalTextStylesAsync()).map((s) => ({
  name: s.name,
  fontFamily: s.fontName.family,
  fontStyle: s.fontName.style,
  fontSize: s.fontSize,
  lineHeight: s.lineHeight.unit === 'PIXELS' ? s.lineHeight.value : null,
  letterSpacing: s.letterSpacing.unit === 'PIXELS' ? s.letterSpacing.value : (s.letterSpacing.value * s.fontSize) / 100,
  bound: Object.fromEntries(Object.entries(s.boundVariables || {}).map(([k, b]) => [k, bound(b)])),
}));

const effectStyles = !withStyles ? [] : (await figma.getLocalEffectStylesAsync()).map((s) => ({
  name: s.name,
  effects: s.effects.map((e) => ({
    type: e.type,
    x: e.offset ? e.offset.x : 0,
    y: e.offset ? e.offset.y : 0,
    blur: e.radius || 0,
    spread: e.spread || 0,
    color: e.color ? (bound(e.boundVariables && e.boundVariables.color) ? { alias: bound(e.boundVariables.color) } : hex(e.color)) : null,
  })),
}));

const gridStyles = !withStyles ? [] : (await figma.getLocalGridStylesAsync()).map((s) => ({
  name: s.name,
  grids: s.layoutGrids.map((g) => ({ pattern: g.pattern, count: g.count, gutter: g.gutterSize, margin: g.offset || 0, alignment: g.alignment })),
}));

return {
  format: 'ds-create/figma-variables@1',
  file: figma.root.name,
  collections: cols.map((c) => ({ name: c.name, modes: c.modes.map((m) => m.name) })),
  variables,
  textStyles,
  effectStyles,
  gridStyles,
  // Page ids, so every docs page can link to its Figma page ("Open in Figma").
  pages: figma.root.children.map((p) => ({ id: p.id, name: p.name })),
};
