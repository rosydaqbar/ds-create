// ds-create Figma audit — run as a READ-ONLY `use_figma` script on a generated file.
// It checks what the page specs and specs/SYSTEM.md require, so QA doesn't rely on reading alone.
//
// Two modes (set PAGE below):
//   PAGE = null            file checks: contrast of every color pair in every mode (the same pairs as
//                          kit/web/scripts/check-contrast.mjs), variable scopes and WEB code syntax.
//   PAGE = '2.1 Button'    page checks for one page: canvas (loose nodes, frame order, y = 0, gap,
//                          overlap), frame names for the page type, unbound fills/strokes/gradients,
//                          text without a text style, padding/gap/radius/stroke without a variable,
//                          effects without an effect style, layer opacity, default layer names,
//                          variant naming and the Part C §4.2 property vocabulary.
// Run one page per call (the page is switched once). Output stays small: counts plus a few examples.
// A result with "fail" > 0 fails the page's QA (INITIATOR Part B §8, EXTEND step 11, workflow/DOCFRAMES.md §14).
// Save each result as output/{system-slug}/figma/audit-{page or file}.json and record it in the ledger.
const PAGE = null;
const MAX_EXAMPLES = 6;
// Exceptions the user approved (INITIATOR Part B §6, Gates). Copy them from the ledger's `auditExceptions`;
// they are reported as info, never as fail. Leave empty for a new system.
const ACCEPTED = {
  contrast: [],              // 'color/text/brand on color/surface/base'
  unsupportedModes: {},      // { Color: ['Dark'] }
  outOfScopeCollections: [], // collections that aren't tokens, e.g. prototype state
  frozenComponentValues: false, // existing system whose component values must not change: raw values inside
                                // components are reported as info (listed for the owner), doc frames stay strict
};

const out = { file: figma.root.name, mode: PAGE ? 'page' : 'file', page: PAGE, checks: {} };
const check = (name, level, desc) => (out.checks[name] ??= { level, desc, count: 0, examples: [] });
const hit = (name, level, desc, example) => {
  const c = check(name, level, desc);
  c.count++;
  if (c.examples.length < MAX_EXAMPLES) c.examples.push(example);
};
const pathOf = (n) => {
  const parts = [];
  for (let p = n; p && p.type !== 'PAGE'; p = p.parent) parts.unshift(p.name);
  return parts.slice(-3).join(' › ');
};

/* ---------------- file mode ---------------- */
if (!PAGE) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  const byId = new Map(vars.map((v) => [v.id, v]));
  const byName = new Map(vars.map((v) => [v.name, v]));
  const colById = new Map(cols.map((c) => [c.id, c]));
  const colorCol = cols.find((c) => c.name === 'Color');
  out.counts = { collections: cols.length, variables: vars.length, textStyles: (await figma.getLocalTextStylesAsync()).length, effectStyles: (await figma.getLocalEffectStylesAsync()).length };

  for (const v of vars) {
    const col = colById.get(v.variableCollectionId);
    if (col && ACCEPTED.outOfScopeCollections.includes(col.name)) { hit('out-of-scope-collection', 'info', 'Approved: collections that are not tokens', col.name); continue; }
    if (v.scopes.includes('ALL_SCOPES') && col && col.name !== 'Primitives') hit('variable-all-scopes', 'fail', 'Variables must have explicit scopes (never ALL_SCOPES)', v.name);
    if (!v.codeSyntax || !v.codeSyntax.WEB) hit('variable-no-web-syntax', 'warn', 'Variables need WEB code syntax var(--name)', v.name);
  }

  // Resolve a color variable to {r,g,b,a} in a mode name (aliases may cross collections).
  const modeIdFor = (col, modeName) => (col.modes.find((m) => m.name === modeName) || col.modes[0]).modeId;
  const resolve = (v, modeName, depth = 0) => {
    if (!v || depth > 10) return null;
    const col = colById.get(v.variableCollectionId);
    const val = v.valuesByMode[modeIdFor(col, modeName)];
    if (val && val.type === 'VARIABLE_ALIAS') return resolve(byId.get(val.id), modeName, depth + 1);
    return val && typeof val === 'object' && 'r' in val ? { r: val.r, g: val.g, b: val.b, a: val.a ?? 1 } : null;
  };
  const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  const lum = (c) => [c.r, c.g, c.b].map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  const pairs = [];
  const surfaces = ['color/surface/base', 'color/surface/raised', 'color/surface/sunken', 'color/surface/overlay'];
  for (const t of ['primary', 'secondary', 'tertiary', 'placeholder', 'brand', 'danger', 'warning', 'success', 'info']) for (const s of surfaces) pairs.push([`color/text/${t}`, s]);
  for (const [text, tone] of [['color/text/on-solid', 'brand'], ['color/text/on-solid', 'danger'], ['color/text/inverse', 'neutral']])
    for (const st of ['', '/hover', '/pressed', '/selected']) pairs.push([text, `color/fill/${tone}/solid${st}`]);
  for (const tone of ['brand', 'danger', 'warning', 'success', 'info'])
    for (const st of ['', '/hover', ...(tone === 'brand' || tone === 'danger' ? ['/pressed', '/selected'] : [])]) pairs.push([`color/text/${tone}`, `color/fill/${tone}/subtle${st}`]);
  for (const t of ['primary', 'secondary']) pairs.push([`color/text/${t}/on-brand`, 'color/surface/brand-solid']);
  pairs.push(['color/text/inverse', 'color/surface/inverse']);
  for (const v of vars) { const m = v.name.match(/^social-button\/([a-z0-9-]+)\/fg$/); if (m) for (const st of ['', '/hover']) pairs.push([v.name, `social-button/${m[1]}/fill${st}`]); }
  const exceptions = { 'social-button/facebook/fg': 'Facebook brand rules fix the button blue and white' };

  let checked = 0;
  const skipModes = (colorCol && ACCEPTED.unsupportedModes[colorCol.name]) || [];
  for (const m of skipModes) hit('unsupported-mode', 'info', 'Approved: modes that are not supported', `Color: ${m}`);
  for (const mode of (colorCol ? colorCol.modes.map((m) => m.name) : ['Light']).filter((m) => !skipModes.includes(m))) {
    const base = resolve(byName.get('color/surface/base'), mode) || { r: 1, g: 1, b: 1, a: 1 };
    for (const [fg, bg] of pairs) {
      const f = resolve(byName.get(fg), mode);
      const b = resolve(byName.get(bg), mode);
      if (!f || !b) continue;
      checked++;
      const bgC = over(b, base);
      const r = ratio(over(f, bgC), bgC);
      if (r >= 4.5) continue;
      const ex = `${mode}: ${fg} on ${bg} = ${r.toFixed(2)}:1`;
      if (ACCEPTED.contrast.includes(`${fg} on ${bg}`)) hit('contrast-accepted', 'info', 'Approved contrast exceptions, documented on 1.1 Color', ex);
      else if (exceptions[fg]) hit('contrast-exception', 'info', 'Documented third-party exceptions', `${ex} (${exceptions[fg]})`);
      else hit('contrast-below-aa', 'fail', 'Text pairs below 4.5:1 (1.1 Color QA, Contrast pairs)', ex);
    }
  }
  out.counts.contrastPairs = checked;
}

/* ---------------- page mode ---------------- */
if (PAGE) {
  const page = figma.root.children.find((p) => p.name === PAGE);
  if (!page) return { error: `No page named "${PAGE}"`, pages: figma.root.children.map((p) => p.name) };
  await figma.setCurrentPageAsync(page);

  const id = PAGE.split(' ')[0];
  const name = PAGE.slice(id.length + 1);
  const type = /^[234]\./.test(id) ? 'component' : /^1\./.test(id) ? 'foundation' : /^[56]\./.test(id) ? 'layout' : 'other';
  out.pageType = type;

  // Canvas: only frames, left to right at y = 0, no overlap, the canvas gap between them.
  const vars = await figma.variables.getLocalVariablesAsync('FLOAT');
  const gapVar = vars.find((v) => v.name === 'doc/space/canvas');
  const gap = gapVar ? Object.values(gapVar.valuesByMode)[0] : 160;
  const top = page.children.slice();
  for (const n of top) if (n.type !== 'FRAME' && n.type !== 'SECTION') hit('canvas-loose-node', 'fail', 'Only frames sit on the page canvas', `${n.type} "${n.name}"`);
  const frames = top.filter((n) => n.type === 'FRAME').sort((a, b) => a.x - b.x);
  frames.forEach((f, i) => {
    if (Math.round(f.y) !== 0) hit('canvas-frame-y', 'fail', 'Frames are top-aligned at y = 0', `"${f.name}" at y = ${Math.round(f.y)}`);
    const prev = frames[i - 1];
    if (prev) {
      const d = Math.round(f.x - (prev.x + prev.width));
      if (d < 0) hit('canvas-overlap', 'fail', 'Frames never overlap', `"${prev.name}" and "${f.name}" overlap by ${-d}px`);
      else if (typeof gap === 'number' && Math.abs(d - gap) > 1) hit('canvas-gap', 'warn', `Frames are ${gap}px apart (doc/space/canvas)`, `"${prev.name}" → "${f.name}": ${d}px`);
    }
  });

  // Frame names for the page type (SYSTEM Part A §A3).
  const expected = type === 'component' ? ['Overview', 'Component', 'Anatomy', 'Guidelines'] : type === 'foundation' ? ['Overview', 'Guidelines'] : [];
  const names = frames.map((f) => f.name);
  for (const e of expected) if (!names.includes(`${id} ${name} · ${e}`)) hit('frame-missing', 'fail', 'Template frames from SYSTEM Part A §A3', `${id} ${name} · ${e}`);
  for (const n of names) if (n !== '.Main' && !n.startsWith(`${id} ${name} · `)) hit('frame-name', 'warn', 'Frame names are ".Main" or "{ID} {Name} · {Frame}"', n);
  out.frames = names;

  // Node checks, skipping the inside of instances (they inherit from their main component).
  const VOCAB = ['Size', 'Emphasis', 'Tone', 'State', 'Selected', 'Checked', 'Status', 'Type', 'Filled', 'Open', 'Playing', 'Breakpoint', 'Provider', 'Placement', 'Orientation', 'Value', 'Icon only'];
  const DEFAULT_NAME = /^(Frame|Rectangle|Group|Ellipse|Vector|Line|Polygon|Star|Component|Instance|Union|Subtract)( \d+)?$/;
  let nodes = 0;
  const bound = (n, key) => n.boundVariables && n.boundVariables[key];
  const anyBound = (n, keys) => keys.some((k) => bound(n, k));
  const checkPaints = (n, prop, lvl, where) => {
    const paints = n[prop];
    if (!Array.isArray(paints)) return;
    for (const p of paints) {
      if (p.visible === false) continue;
      if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) hit(`${where}-unbound-paint`, lvl, 'Fills and strokes are bound to color variables', `${prop} on ${pathOf(n)}`);
      if (p.type.startsWith('GRADIENT') && p.gradientStops.some((s) => !(s.boundVariables && s.boundVariables.color))) hit(`${where}-unbound-gradient`, lvl, 'Gradient stops are bound to color variables', pathOf(n));
    }
  };
  // Intentional "wrong" examples in Guidelines (named "(wrong)" or inside a Don't frame) are exempt.
  const EXEMPT = /\(wrong\)|\bdon[’']?t\b/i;
  const visit = (n, inComponent, exempt) => {
    nodes++;
    const isComp = n.type === 'COMPONENT' || n.type === 'COMPONENT_SET';
    const comp = inComponent || isComp;
    const skip = exempt || EXEMPT.test(n.name);
    // Inside a component a raw value is a product bug (fail); in documentation frames it is a doc-kit gap (warn).
    // With frozenComponentValues the owner approved keeping component values as built: info, never fail.
    const lvl = comp ? (ACCEPTED.frozenComponentValues ? 'info' : 'fail') : 'warn';
    const where = comp ? 'component' : 'doc';
    if (n.type !== 'INSTANCE' && !skip) {
      if ('fills' in n) checkPaints(n, 'fills', lvl, where);
      if ('strokes' in n) {
        checkPaints(n, 'strokes', lvl, where);
        const visibleStroke = Array.isArray(n.strokes) && n.strokes.some((p) => p.visible !== false);
        if (visibleStroke && typeof n.strokeWeight === 'number' && n.strokeWeight > 0 && !anyBound(n, ['strokeWeight', 'strokeTopWeight', 'strokeBottomWeight', 'strokeLeftWeight', 'strokeRightWeight']))
          hit(`${where}-unbound-stroke-weight`, comp && ACCEPTED.frozenComponentValues ? 'info' : 'warn', 'Stroke widths use border/width/* variables', pathOf(n));
      }
      if (n.type === 'TEXT') {
        if (n.textStyleId === '') hit(`${where}-text-no-style`, lvl, 'Text uses a text style', pathOf(n));
        else if (typeof n.textStyleId !== 'string') hit(`${where}-text-mixed-style`, comp && ACCEPTED.frozenComponentValues ? 'info' : 'warn', 'Text uses one text style', pathOf(n));
      }
      if ('layoutMode' in n && n.layoutMode !== 'NONE') {
        for (const k of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'itemSpacing'])
          if (n[k] > 0 && !bound(n, k)) hit(`${where}-unbound-spacing`, lvl, comp ? 'Padding and gap are bound to space/size variables' : 'Doc frames bind padding and gap to doc/* variables', `${k} ${n[k]} on ${pathOf(n)}`);
      }
      if ('cornerRadius' in n && typeof n.cornerRadius === 'number' && n.cornerRadius > 0 && !anyBound(n, ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius', 'cornerRadius']))
        hit(`${where}-unbound-radius`, lvl, 'Corner radius is bound to radius/* variables', `${n.cornerRadius} on ${pathOf(n)}`);
      if ('effects' in n && Array.isArray(n.effects) && n.effects.some((e) => e.visible !== false) && !n.effectStyleId)
        hit(`${where}-effect-no-style`, lvl, 'Effects come from effect styles', pathOf(n));
      if ('opacity' in n && n.opacity < 1 && !bound(n, 'opacity')) hit(`${where}-layer-opacity`, comp && ACCEPTED.frozenComponentValues ? 'info' : 'warn', 'No opacity on layers; use a color role', `${Math.round(n.opacity * 100)}% on ${pathOf(n)}`);
      if (comp && !isComp && DEFAULT_NAME.test(n.name)) hit('default-layer-name', 'fail', 'Layers inside components use anatomy names (SYSTEM Part C §4.1)', pathOf(n));
    }
    if (n.type === 'COMPONENT_SET') {
      const defs = n.componentPropertyDefinitions;
      for (const [k, d] of Object.entries(defs)) {
        if (d.type !== 'VARIANT') continue;
        if (!VOCAB.includes(k) && !/ value$/.test(k)) hit('variant-vocabulary', 'warn', 'Variant properties use the Part C §4.2 vocabulary (or the page spec adds the concept there first)', `${n.name}: ${k}`);
      }
      for (const v of n.children) if (!/^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$/.test(v.name)) hit('variant-name', 'fail', 'Variant names are "Property=value, …"', `${n.name}: ${v.name}`);
      out.sets = (out.sets || []).concat(`${n.name} (${n.children.length})`);
    }
    if (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET' && n.name.startsWith('.Main/')) {
      let f = n.parent;
      while (f && f.parent && f.parent.type !== 'PAGE') f = f.parent;
      if (f && f.name !== '.Main') hit('private-part-outside-main', 'fail', 'Private parts live in the .Main frame', n.name);
    }
    if (n.type === 'INSTANCE') return;
    if ('children' in n) for (const c of n.children) visit(c, comp, skip);
  };
  for (const f of frames) visit(f, false, false);
  out.counts = { nodes, frames: frames.length };
}

const fails = Object.values(out.checks).filter((c) => c.level === 'fail').reduce((s, c) => s + c.count, 0);
const warns = Object.values(out.checks).filter((c) => c.level === 'warn').reduce((s, c) => s + c.count, 0);
out.result = { fail: fails, warn: warns, verdict: fails ? 'fail' : 'pass' };
return out;
