// Figma → tokens export.
// Run this as a `use_figma` script (Plugin API) on the generated Figma file.
// It returns one JSON object; save it verbatim as kit/web/tokens/figma-variables.json,
// then run `npm run tokens` to regenerate CSS, the Tailwind theme and the DTCG file.
// Read-only: it never changes the Figma file.
//
// Foundation approval verification needs lossless full/PART exports, including scopes/codeSyntax.
// The compact hash/rows route covers values only and cannot certify metadata equality.
// Large files: tool output is capped (about 20 KB). Export in parts by setting PART below,
// save each result as tokens/parts/{n}.json, then run `npm run tokens:merge`.
//   PART = { collections: ['Color'], from: 0, to: 90, styles: false }   one slice of variables
//   PART = { collections: [], styles: true }                             only text, effect and grid styles
// Leave PART = null to export everything at once.
//
// Faster on any file that has a local base (the previous export, or the token plan init wrote; workflow/WEB.md W2):
//   MODE = 'hash'   returns hashes only: per collection, its modes, count and 16 bucket hashes; one hash per style list;
//                   the pages. Save it, then `node scripts/export-diff.mjs --hash hash.json` prints the ROWS to fetch.
//   MODE = 'rows'   returns compact rows for what differs: ROWS = { Collection: 'all' | [bucket, …], styles: true }.
//                   `node scripts/export-diff.mjs --hash hash.json --merge rows.json [more.json …]` writes the export.
// Unchanged collections are never re-sent: a round that changed only component tokens fetches only those.
const PART = null;
const MODE = 'full'; // 'full' | 'hash' | 'rows'
const ROWS = {};

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
      scopes: [...v.scopes],
      codeSyntax: { ...v.codeSyntax },
      hiddenFromPublishing: v.hiddenFromPublishing,
      values,
    };
  })
  .slice(PART && PART.from != null ? PART.from : 0, PART && PART.to != null ? PART.to : undefined);
const withStyles = !PART || PART.styles || MODE !== 'full';

const textStyles = !withStyles ? [] : (await figma.getLocalTextStylesAsync()).map((s) => ({
  name: s.name,
  fontFamily: s.fontName.family,
  fontStyle: s.fontName.style,
  fontSize: s.fontSize,
  textCase: s.textCase,
  textDecoration: s.textDecoration,
  paragraphSpacing: s.paragraphSpacing,
  paragraphIndent: s.paragraphIndent,
  lineHeight: s.lineHeight.unit === 'PIXELS' ? s.lineHeight.value : s.lineHeight.unit === 'PERCENT' ? (s.lineHeight.value * s.fontSize) / 100 : null,
  letterSpacing: s.letterSpacing.unit === 'PIXELS' ? s.letterSpacing.value : (s.letterSpacing.value * s.fontSize) / 100,
  bound: Object.fromEntries(Object.entries(s.boundVariables || {}).map(([k, b]) => [k, bound(b)])),
}));

const effectStyles = !withStyles ? [] : (await figma.getLocalEffectStylesAsync()).map((s) => ({
  name: s.name,
  effects: s.effects.map((e) => ({
    type: e.type,
    visible: e.visible,
    blendMode: e.blendMode,
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

// Hashes and rows use the same canonical entry as scripts/export-diff.mjs: change both together.
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
const canon = (e, modes) => JSON.stringify([e.name, e.collection, e.type, e.description, modes.map((m) => e.values[m])]);
const pageList = figma.root.children.map((p) => ({ id: p.id, name: p.name }));
if (MODE === 'hash') {
  return {
    format: 'ds-create/figma-variables-hash@1',
    collections: cols.map((c) => {
      const modes = c.modes.map((m) => m.name);
      const mine = variables.filter((v) => v.collection === c.name);
      const b = Array.from({ length: 16 }, () => []);
      for (const e of mine) b[fnv(e.name) % 16].push(canon(e, modes));
      return { name: c.name, modes, n: mine.length, b: b.map((l) => fnv(l.sort().join('\n')).toString(36)) };
    }),
    styles: { text: fnv(JSON.stringify(textStyles)).toString(36), effect: fnv(JSON.stringify(effectStyles)).toString(36), grid: fnv(JSON.stringify(gridStyles)).toString(36) },
    order: fnv(variables.map((v) => v.name).join('|')).toString(36),
    pages: pageList,
  };
}
if (MODE === 'rows') {
  const rows = {};
  for (const c of cols) {
    const want = ROWS[c.name];
    if (!want) continue;
    const modes = c.modes.map((m) => m.name);
    rows[c.name] = variables.filter((v) => v.collection === c.name && (want === 'all' || want.includes(fnv(v.name) % 16)))
      .map((v) => [v.name, v.type, v.description, ...modes.map((m) => (v.values[m] && v.values[m].alias ? '@' + v.values[m].alias : v.values[m]))]);
  }
  return { format: 'ds-create/figma-variables-rows@1', rows, textStyles: ROWS.styles ? textStyles : undefined, effectStyles: ROWS.styles ? effectStyles : undefined, gridStyles: ROWS.styles ? gridStyles : undefined };
}

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
