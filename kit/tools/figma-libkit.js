// ds-create library kit: the helpers every library step (workflow/INITIATOR.md Part B §6, steps 6–10) needs to build
// component sets from tokens. Cached once in the file's plugin data (`node kit/tools/fast-cache.mjs --library`), then
// loaded in one line, so a set's call holds only that set's structure, not binding boilerplate:
//
//   const AF = Object.getPrototypeOf(async function () {}).constructor;
//   const K = await (new AF('figma', 'return await (' + figma.root.getSharedPluginData('dscreate', 'libkit') + ')(figma);'))(figma);
//
// Every helper binds a variable by its name (specs/SYSTEM.md Part C), never a raw value: a name that doesn't exist
// throws, so a typo stops the call before anything half-built is left (workflow/GOTCHAS.md §1). It never audits.
//
//   K.tokens(rows)                 create or update variables: [collection, name, value, scopes?, description?];
//                                  value = number | '#rrggbb[aa]' | 'other/variable' (an alias). Code syntax var(--a-b),
//                                  Primitives hidden from publishing. Returns the count.
//   K.v(name) / K.paint(name)      a variable / a solid paint bound to it
//   K.fill, K.stroke, K.pad, K.pad4, K.gap, K.radius, K.size, K.minW   bind node properties to variables
//   K.AL(dir, name), K.FR(name)    an auto-layout frame / a plain frame, both without fill
//   await K.text(parent, chars, style, color, name)   text with a text style and a color role
//   await K.effect(node, style)    apply an effect style by name
//   await K.loadPage(name)         load a page and index its components; K.comp(name), K.icon('general/x')
//   K.iconInst(parent, icon, sizeVar, colorVar, name)  an icon instance sized and colored by tokens
//   K.matrix(axes, skip?)          every combination of { Prop: [values] } in order, minus `skip(combo)`
//   K.vname(combo)                 'Size=md, State=rest' from a combination (the variant name)
//   K.variant(set, props)          the variant of a set with these property values
//   K.holder(page, name)           the page's '{ID} {Name} · Component' (or '.Main') holding frame, created when missing
//   K.combine(variants, parent, name, rows, cols)       combine into a set laid out as a grid
//   K.props(set)                   the set's property definitions, compact
//   K.entry(set)                   the set's registry entry (kit/tools/figma-registry.js format), to return
async function libkit(figma) {
  const V = new Map((await figma.variables.getLocalVariablesAsync()).map((x) => [x.name, x]));
  const TS = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
  const ES = new Map((await figma.getLocalEffectStylesAsync()).map((s) => [s.name, s]));
  const v = (n) => { const x = V.get(n); if (!x) throw new Error('no variable ' + n); return x; };
  const paint = (n) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v(n));
  const fill = (node, n) => { node.fills = n ? [paint(n)] : []; return node; };
  const stroke = (node, n, w, align) => { node.strokes = [paint(n)]; node.strokeAlign = align || 'INSIDE'; node.setBoundVariable('strokeWeight', v(w || 'border/width/default')); return node; };
  const pad = (node, x, y) => { if (x) { node.setBoundVariable('paddingLeft', v(x)); node.setBoundVariable('paddingRight', v(x)); } if (y) { node.setBoundVariable('paddingTop', v(y)); node.setBoundVariable('paddingBottom', v(y)); } return node; };
  const pad4 = (node, t, r, b, l) => { for (const [k, n] of [['paddingTop', t], ['paddingRight', r], ['paddingBottom', b], ['paddingLeft', l]]) if (n) node.setBoundVariable(k, v(n)); return node; };
  const gap = (node, n) => { node.setBoundVariable('itemSpacing', v(n)); return node; };
  const radius = (node, n) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) node.setBoundVariable(k, v(n)); return node; };
  const size = (node, w, h) => { if (w) node.setBoundVariable('width', v(w)); if (h) node.setBoundVariable('height', v(h)); return node; };
  const minW = (node, n) => { node.setBoundVariable('minWidth', v(n)); return node; };
  const AL = (dir, name, props) => { const f = figma.createAutoLayout(dir, Object.assign({ name }, props || {})); f.fills = []; return f; };
  const FR = (name) => { const f = figma.createFrame(); f.name = name; f.fills = []; return f; };

  // Variables from rows. A component token aliases a semantic token (specs/SYSTEM.md Part C §1).
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const col = (name) => { let c = cols.find((x) => x.name === name); if (!c) { c = figma.variables.createVariableCollection(name); cols.push(c); } return c; };
  const rgb = (h) => { const n = h.replace('#', ''); const p = (i) => parseInt(n.slice(i, i + 2), 16) / 255; const o = { r: p(0), g: p(2), b: p(4) }; if (n.length === 8) o.a = p(6); return o; };
  const tokens = (rows) => {
    let n = 0;
    for (const [cname, name, value, scopes, desc] of rows) {
      const c = col(cname);
      const alias = typeof value === 'string' && !value.startsWith('#');
      const type = alias ? v(value).resolvedType : typeof value === 'number' ? 'FLOAT' : typeof value === 'boolean' ? 'BOOLEAN' : 'COLOR';
      let x = V.get(name);
      if (!x) { x = figma.variables.createVariable(name, c, type); V.set(name, x); }
      x.scopes = scopes || [];
      if (desc) x.description = desc;
      x.setVariableCodeSyntax('WEB', 'var(--' + name.replace(/\//g, '-') + ')');
      if (cname === 'Primitives') x.hiddenFromPublishing = true;
      const val = alias ? figma.variables.createVariableAlias(v(value)) : type === 'COLOR' ? rgb(value) : value;
      for (const m of c.modes) x.setValueForMode(m.modeId, val);
      n++;
    }
    return n;
  };

  const fonts = new Set();
  const text = async (parent, chars, style, color, name) => {
    const s = TS.get(style); if (!s) throw new Error('no text style ' + style);
    const key = s.fontName.family + '|' + s.fontName.style;
    if (!fonts.has(key)) { await figma.loadFontAsync(s.fontName); fonts.add(key); }
    const t = figma.createText(); parent.appendChild(t);
    await t.setTextStyleIdAsync(s.id);
    t.characters = chars; t.name = name || 'Label'; t.autoRename = false;
    if (color) t.fills = [paint(color)];
    return t;
  };
  const effect = async (node, n) => { const s = ES.get(n); if (!s) throw new Error('no effect style ' + n); await node.setEffectStyleIdAsync(s.id); return node; };

  // Components on other pages: load the page (no page switch), then index its components by name.
  const comps = new Map();
  const loadPage = async (name) => { const p = figma.root.children.find((x) => x.name === name); if (!p) throw new Error('no page ' + name); await p.loadAsync(); for (const c of p.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })) if (!comps.has(c.name) || c.type === 'COMPONENT_SET') comps.set(c.name, c); return p; };
  const comp = (n) => { const c = comps.get(n); if (!c) throw new Error('no component ' + n + ' (load its page first)'); return c; };
  const icon = (n) => comp('Icon/' + n);
  // An icon instance sized and colored by tokens; the glyph's stroke follows the color role, so it survives a swap.
  const iconInst = (parent, n, sizeVar, colorVar, name) => {
    const i = icon(n).createInstance(); parent.appendChild(i); i.name = name || 'Icon';
    size(i, sizeVar, sizeVar);
    if (colorVar) { const g = i.findOne((x) => x.type === 'VECTOR'); if (g) g.strokes = [paint(colorVar)]; }
    return i;
  };

  // Variant matrices: every combination of the axes, in axis order, minus the ones `skip` refuses.
  const matrix = (axes, skip) => {
    let out = [{}];
    for (const [k, vals] of Object.entries(axes)) out = out.flatMap((o) => vals.map((x) => Object.assign({}, o, { [k]: x })));
    return skip ? out.filter((o) => !skip(o)) : out;
  };
  const vname = (combo) => Object.entries(combo).map(([k, x]) => k + '=' + x).join(', ');
  const variant = (set, props) => set.children.find((c) => Object.entries(props).every(([k, val]) => c.variantProperties && c.variantProperties[k] === val)) || set.defaultVariant;
  // The holding frame of a library step: '{ID} {Name} · Component' (or '.Main') on the page, right of what is there.
  const holder = (page, name) => {
    let f = page.children.find((n) => n.type === 'FRAME' && n.name === name);
    if (!f) {
      f = figma.createAutoLayout('VERTICAL', { name }); page.appendChild(f); f.fills = []; f.itemSpacing = 160; f.counterAxisSizingMode = 'AUTO';
      const right = page.children.filter((n) => n !== f).reduce((m, n) => Math.max(m, n.x + n.width), -160); f.x = name === '.Main' ? 0 : right + 160; f.y = 0;
    }
    return f;
  };
  // Combine variants and lay them out as a grid: rows by rowProps, columns by colProps, as [[prop, [values]], …].
  const combine = (variants, parent, name, rows, cols2, gapX, gapY) => {
    const set = figma.combineAsVariants(variants, parent);
    set.name = name; set.layoutMode = 'NONE'; set.fills = [];
    const key = (c, props) => props.reduce((a, [p, vals]) => a * vals.length + Math.max(0, vals.indexOf(c.variantProperties[p])), 0);
    const colW = Math.max(...set.children.map((c) => c.width)) + (gapX || 32);
    const rowH = Math.max(...set.children.map((c) => c.height)) + (gapY || 24);
    for (const c of set.children) { c.x = 32 + key(c, cols2 || []) * colW; c.y = 32 + key(c, rows || []) * rowH; }
    const w = Math.max(...set.children.map((c) => c.x + c.width)) + 32, h = Math.max(...set.children.map((c) => c.y + c.height)) + 32;
    set.resizeWithoutConstraints(w, h);
    return set;
  };
  const props = (set) => Object.fromEntries(Object.entries(set.componentPropertyDefinitions).map(([k, d]) => [k.split('#')[0], d.type === 'VARIANT' ? d.variantOptions : d.type === 'BOOLEAN' ? 'BOOLEAN:' + d.defaultValue : d.type]));
  const pageOf = (n) => { let p = n; while (p && p.type !== 'PAGE') p = p.parent; return p; };
  const entry = (set) => ({ id: set.id, name: set.name, type: set.type, page: (pageOf(set) || {}).name, props: set.type === 'COMPONENT_SET' || !(set.parent && set.parent.type === 'COMPONENT_SET') ? props(set) : {}, variants: set.type === 'COMPONENT_SET' ? set.children.length : 1, default: set.type === 'COMPONENT_SET' ? set.defaultVariant.name : undefined });
  return { V, TS, ES, v, paint, fill, stroke, pad, pad4, gap, radius, size, minW, AL, FR, tokens, text, effect, loadPage, comp, comps, icon, iconInst, matrix, vname, variant, holder, combine, props, entry };
}
