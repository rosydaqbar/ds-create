// ds-create fast-mode renderer (workflow/FAST.md). Draws every documentation page from a page payload, always the
// same way. The payload is data only: kit/tools/fast-pack.mjs builds it from the page manifest (output/{slug}/fast/) and
// the page's copy file (output/{slug}/copy/). Values are never typed: every number, color and style is read from the
// file. Brand-agnostic: styling comes from the doc/* variables and the brand's text styles, like the doc builder.
//
// NEEDS the doc builder (kit/tools/figma-docbuilder.js: docbuilder, docpages, docfoundations) and the audit, cached as
// that file's header says. This file adds one more key:
//   Call: paste this file's function, then
//     figma.root.setSharedPluginData('dscreate', 'fastkit', fastkit.toString()); return fastkit.toString().length;
//
// PAGE CALL (one page per call; the body is the payload only):
//   const AF = Object.getPrototypeOf(async function () {}).constructor; const L = k => figma.root.getSharedPluginData('dscreate', k);
//   const D = await (new AF('figma', 'OPTS', 'let D = await (' + L('docbuilder') + ')(figma, OPTS); D = await (' + L('docpages') + ')(figma, D); D = await (' + L('docfoundations') + ')(figma, D); return await (' + L('fastkit') + ')(figma, D);'))(figma, {});
//   return await D.render(PAYLOAD);
// The result is the page's frame ids, its audit and its warnings (D.finishPage).
//
// PAYLOAD (printed by kit/tools/fast-pack.mjs):
//   { page: '{page id}', type: 'component' | 'layout', ...adapter fields }           Parts to Layouts (§ adapter below)
//   { page: '{page id}', type: 'reading', frames: [frame] }                          00, 01, 02, 1.x
//     frame = { name, title?, header?, kind: 'blocks' | 'topics', width?, items: [item] }
//     item  = { title, badge?, lines: [{ role, text }], visual?: { type, ...inputs, texts?: [] }, at?: n }
//   `lines` are the copy file's figma lines for that block or topic. `visual.texts` are the lines the visual took
//   from the copy (palette row notes, tile texts, column captions); `at` is where in `lines` the visual is drawn.
//   opts: { only: ['Overview'] } draws only those frames; { append: true, start: n } adds items n… to an existing frame.
//
// RULES (workflow/FAST.md §2): no value is typed; specimens are plain frames bound to tokens (workflow/GOTCHAS.md G21); every
// sentence comes from the copy file; an unknown visual type is a warning and draws nothing.

async function fastkit(figma, D) {
  const { G, AL, fillW, T, fill, bindN, radius, pad, stroke, kit, setP, badge, tokenBadge, spec, axis, stage, card, block, newFrame, finish, growTo, divider, table, caption, bullets, pairDD, dodont, inst, parseV, warn, num, V, paint, varsIn, varTable, typeRows, measureRows, effectTiles, paintTiles, paletteRow, resolve, ratio, rgb2hex, modesOf, vById, loadFontsIn, titleOf, finishPage, sectionPage, layoutPage, isRGB } = D;
  const ROOT = figma.root;
  const pagesByName = new Map(ROOT.children.map(p => [p.name, p.id]));
  const allTS = await figma.getLocalTextStylesAsync(); const allES = await figma.getLocalEffectStylesAsync(); const allPS = await figma.getLocalPaintStylesAsync(); const allGS = await figma.getLocalGridStylesAsync();
  const cols = await figma.variables.getLocalVariableCollectionsAsync(); const allVars = await figma.variables.getLocalVariablesAsync();
  const varByName = new Map(allVars.map(v => [v.name, v]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const valueOf = v => { const m = modesOf(v)[0]; return resolve(v, m.modeId); };

  // ---- Instance recipes: { set: id, props: { Variant or property: value }, text: { Property or layer: chars } | '*', w }.
  // Property names are matched loosely (case, common renames), so a recipe survives small naming differences.
  const KEYALIAS = { Color: ['Tone'], 'On BG': ['On color'], 'On White BG': ['On white'], Variant: ['Emphasis'], Style: ['Type'], Function: ['Type'], 'Icon Only': ['Icon only'] };
  const optsCache = new Map();
  const optsOf = async id => { if (optsCache.has(id)) return optsCache.get(id); const s = await G(id); if (!s) { warn('set ' + id + ' not found'); return null; } const o = { s, v: {}, p: {} }; if (s.type === 'COMPONENT_SET') { for (const c of s.children) for (const [k, x] of Object.entries(parseV(c.name))) (o.v[k] = o.v[k] || new Set()).add(x); try { o.p = s.componentPropertyDefinitions; } catch (e) {} } else if (s.type === 'COMPONENT') { try { o.p = s.componentPropertyDefinitions; } catch (e) {} } optsCache.set(id, o); return o; };
  const mk = async it => {
    const o = await optsOf(it.set); if (!o) { const f = AL('HORIZONTAL', 'Missing · ' + it.set); return f; }
    const v = {}, p = {}, texts = {}; let text;
    for (const [k0, val] of Object.entries(it.props || {})) {
      const keys = [k0].concat(KEYALIAS[k0] || []); const vk = keys.find(k => o.v[k]);
      if (vk) { const want = String(val).toLowerCase(); const hit = [...o.v[vk]].find(x => x.toLowerCase() === want); if (hit) v[vk] = hit; else warn(o.s.name + ': no ' + vk + '=' + val); continue; }
      const pk = Object.keys(o.p).find(k => keys.some(kk => k.split('#')[0].toLowerCase() === kk.toLowerCase())); if (pk && o.p[pk].type !== 'VARIANT') p[pk.split('#')[0]] = typeof val === 'string' && o.p[pk].type === 'BOOLEAN' ? val === 'true' : val; else warn(o.s.name + ': no property ' + k0);
    }
    for (const [k, val] of Object.entries(it.text || {})) { if (k === '*') { text = val; continue; } const pk = Object.keys(o.p).find(x => x.split('#')[0].toLowerCase() === k.toLowerCase() && o.p[x].type === 'TEXT'); if (pk) p[pk.split('#')[0]] = val; else texts[k] = val; }
    const i = await inst({ set: it.set, v, p, text, texts: Object.keys(texts).length ? texts : undefined });
    if (it.w) { try { i.resize(it.w, i.height); } catch (e) {} }
    return i;
  };
  // A row of recipes, wrapping at the container width (workflow/GOTCHAS.md G22); a vertical row scales wide items down.
  const row = async (parent, items, dir, name) => {
    const r = AL(dir === 'VERTICAL' ? 'VERTICAL' : 'HORIZONTAL', name || 'Row', 'doc/space/inline'); parent.appendChild(r); fillW(r);
    if (dir !== 'VERTICAL') { r.counterAxisAlignItems = 'CENTER'; r.layoutWrap = 'WRAP'; bindN(r, 'counterAxisSpacing', 'doc/space/inline'); }
    for (const it of items || []) { const n = await mk(it); r.appendChild(n); if (n.width > r.width && r.width > 0) n.rescale(r.width / n.width); }
    return r;
  };
  const exStage = (parent, name, dir) => { const s = stage(name || 'Example', dir || 'HORIZONTAL', 'doc/space/group'); parent.appendChild(s); fillW(s); if (dir !== 'VERTICAL') { s.layoutWrap = 'WRAP'; bindN(s, 'counterAxisSpacing', 'doc/space/group'); } return s; };
  const labeled = async (parent, node, label, key) => { const c = AL('VERTICAL', 'Labeled · ' + label, 'doc/space/tight'); parent.appendChild(c); c.appendChild(node); await T(c, label, key || 'code/sm', 'doc/text/tertiary', 'Label'); return c; };
  const hrow = (parent, name, gap, wrap) => { const r = AL('HORIZONTAL', name, gap || 'doc/space/group'); parent.appendChild(r); fillW(r); r.counterAxisAlignItems = 'MIN'; if (wrap !== false) { r.layoutWrap = 'WRAP'; bindN(r, 'counterAxisSpacing', gap || 'doc/space/group'); } return r; };
  const link = async (parent, label, pageName) => { const t = await T(parent, label + ' →', 'label/sm', 'doc/text/accent', 'Link'); const id = pagesByName.get(pageName || label); if (id) { try { t.hyperlink = { type: 'NODE', value: id }; } catch (e) { warn('link ' + label + ': ' + e.message); } } else warn('link: no page ' + (pageName || label)); return t; };
  const tsBy = prefix => allTS.filter(s => s.name.startsWith(prefix || ''));
  const esBy = prefix => allES.filter(s => s.name.startsWith(prefix || ''));
  const groupsOf = (vars, depth) => { const g = new Map(); for (const v of vars) { const k = v.name.split('/').slice(0, depth).join('/'); if (!g.has(k)) g.set(k, []); g.get(k).push(v); } return g; };
  const collectionVars = async (collection, prefix) => varsIn(collection, prefix);
  // Widest row a visual drew (palette rows never wrap), so the frame can grow to it. Node plugin data isn't available here.
  const fastWidth = new Map();

  // ---- The visual catalog (workflow/FAST.md §4). Each entry: async (container, inputs) → draws inside container.
  const VIS = {
    // Real instances side by side on a stage. { items: [recipe], dir, stage: false }
    instances: async (c, i) => { const s = i.stage === false ? c : exStage(c, 'Example', i.dir); await row(s, i.items, i.dir); },
    // Several labeled stages side by side. { columns: [{ items, dir }] }, labels from texts (one per column).
    compare: async (c, i) => { const r = hrow(c, 'Comparison', 'doc/space/group'); for (let k = 0; k < (i.columns || []).length; k++) { const col = AL('VERTICAL', 'Column', 'doc/space/inline'); r.appendChild(col); const s = stage('Example', i.columns[k].dir || 'HORIZONTAL', 'doc/space/inline'); col.appendChild(s); await row(s, i.columns[k].items, i.columns[k].dir); if (i.texts && i.texts[k]) await T(col, i.texts[k], 'body/sm', 'doc/text/tertiary', 'Caption', 240); } },
    // Do / don't pairs, reasons from the copy's do and don't lines. { pairs: [{ do: [recipe], dont: [recipe], dir }] }
    'do-dont': async (c, i) => { const reasons = i.reasons || []; for (let k = 0; k < (i.pairs || []).length; k++) { const pr = i.pairs[k]; const rs = reasons[k] || {}; await pairDD(c, async s => { await row(s, pr.do, pr.dir); }, rs.do || '', async s => { await row(s, pr.dont, pr.dir); }, rs.dont || ''); } },
    // One instance per value of a variant property, each labeled. { set, prop, values?, base?: { props } }
    states: async (c, i) => { const o = await optsOf(i.set); if (!o) return; const vals = i.values || [...(o.v[i.prop] || [])]; const s = exStage(c, 'States'); for (const val of vals) { const n = await mk({ set: i.set, props: Object.assign({}, (i.base || {}).props, { [i.prop]: val }) }); await labeled(s, n, i.prop + '=' + val); } },
    // Every variant of a set at a fixed maximum size, labeled with its name. { sets: [id], max: 200 }
    variants: async (c, i) => { for (const id of i.sets || []) { const s = await G(id); if (!s) { warn('set ' + id + ' not found'); continue; } const r = hrow(c, 'Variants · ' + s.name); const vs = s.type === 'COMPONENT_SET' ? s.children : [s]; for (const v of vs) { const n = v.createInstance(); const mx = i.max || 200; if (n.width > mx || n.height > mx) n.rescale(mx / Math.max(n.width, n.height)); await labeled(r, n, s.type === 'COMPONENT_SET' ? v.name : s.name); } } },
    // A text table. { columns: [{ label, w }], rows: [[cells]] } (cells may be { token: name })
    table: async (c, i) => { await table(c, i.columns, i.rows, i.name || 'Table'); },
    // Links to pages in this file. { pages: [name] } (label = page name) or [[label, page]]
    links: async (c, i) => { const r = hrow(c, 'Links', 'doc/space/row'); for (const p of i.pages || []) { if (Array.isArray(p)) await link(r, p[0], p[1]); else await link(r, p); } },
    // Palette rows per family, swatches bound (DOCFRAMES §5). { collection, prefix, depth } ; texts = one note per family, in order.
    // { include: ['palette/neutral'], exclude: […] } pick families by their group name.
    palette: async (c, i) => { const vars = await collectionVars(i.collection || 'Primitives', i.prefix || ''); const fam = groupsOf(vars, i.depth || 2); for (const k of [...fam.keys()]) { if ((i.include && !i.include.includes(k)) || (i.exclude && i.exclude.includes(k))) fam.delete(k); } if (!fam.size) warn('palette: no families for ' + JSON.stringify(i.include || i.prefix || '')); const rows = i.include ? i.include.filter((x) => fam.has(x)).map((x) => [x, fam.get(x)]) : [...fam]; let k = 0; let w = 0; for (const [name, vs] of rows) { const r = await paletteRow(c, cap(name.split('/').pop()), (i.texts || [])[k] || '', vs); k++; w = Math.max(w, r.children.reduce((a, ch) => a + ch.width, 0) + r.itemSpacing * (r.children.length - 1)); } fastWidth.set(c.id, w); },
    // Variable table with tree connectors and usage (DOCFRAMES §6). { collection, prefix, unsupported: ['Dark'] }
    // The frame grows so every mode column keeps its width and Usage keeps at least 400 (varTable: name 360, mode 300).
    'token-table': async (c, i) => { const vars = await collectionVars(i.collection, i.prefix); if (!vars.length) { warn('token-table: no variables in ' + i.collection + ' ' + (i.prefix || '')); return; } await varTable(c, vars, { unsupported: i.unsupported, name: 'Variable table · ' + (i.prefix || i.collection) }); const nm = modesOf(vars[0]).length; fastWidth.set(c.id, Math.max(fastWidth.get(c.id) || 0, 360 + nm * 300 + 400 + 16 * (nm + 2) + 32)); },
    // Text styles as type rows. { prefix: 'type/', sample }
    'type-scale': async (c, i) => { const ss = tsBy(i.prefix || ''); if (!ss.length) { warn('type-scale: no text styles ' + (i.prefix || '')); return; } await typeRows(c, ss, i.sample); },
    // One card per typeface the text styles use: the family in its own face, its styles. texts = one line per family, in order.
    typefaces: async (c, i) => { const fams = new Map(); for (const s of tsBy(i.prefix || '')) { const f = s.fontName.family; if (!fams.has(f)) fams.set(f, new Set()); fams.get(f).add(s.fontName.style); } const r = hrow(c, 'Typefaces'); let k = 0; for (const [f, st] of fams) { const cd = card('Typeface · ' + f, 'doc/space/inline'); r.appendChild(cd); cd.resize(320, 10); cd.counterAxisSizingMode = 'FIXED'; cd.primaryAxisSizingMode = 'AUTO'; const sm = figma.createText(); const style = [...st][0]; try { await figma.loadFontAsync({ family: f, style }); sm.fontName = { family: f, style }; } catch (e) { warn('typeface ' + f + ' not loadable'); await figma.loadFontAsync(sm.fontName); } sm.characters = 'Aa'; sm.fontSize = 56; fill(sm, 'doc/text/primary'); sm.name = 'Specimen'; cd.appendChild(sm); await T(cd, f, 'heading/sm', 'doc/text/primary', 'Name'); await T(cd, [...st].join(' · '), 'code/sm', 'doc/text/tertiary', 'Styles', 'fill'); if (i.texts && i.texts[k]) await T(cd, i.texts[k], 'body/sm', 'doc/text/secondary', 'Use', 'fill'); k++; } },
    // Number tokens as bars (space, size). { collection, prefix, unit }
    'scale-bars': async (c, i) => { const vs = await collectionVars(i.collection, i.prefix); if (!vs.length) { warn('scale-bars: none in ' + i.collection); return; } await measureRows(c, vs, 'space', { unit: i.unit }); },
    // Radius roles as tiles bound to their token. { collection: 'Shape', prefix: 'radius/' }
    'radius-tiles': async (c, i) => { const vs = await collectionVars(i.collection || 'Shape', i.prefix || 'radius/'); await measureRows(c, vs, 'radius'); },
    // Border widths as lines whose thickness is bound. { collection, prefix: 'border/width/' }
    'border-lines': async (c, i) => { const vs = await collectionVars(i.collection || 'Border', i.prefix || 'border/width/'); const list = AL('VERTICAL', 'Border widths', 'doc/space/row'); c.appendChild(list); fillW(list); for (const v of vs) { const r = AL('HORIZONTAL', 'Line · ' + v.name, 'doc/space/row'); list.appendChild(r); r.counterAxisAlignItems = 'CENTER'; const l = figma.createRectangle(); l.name = 'Stroke'; l.resize(200, Math.max(1, valueOf(v) || 1)); r.appendChild(l); fill(l, 'doc/text/primary'); try { l.setBoundVariable('height', v); } catch (e) { warn(v.name + ': height drawn raw'); } r.appendChild(await tokenBadge(v.name)); await T(r, String(valueOf(v)), 'code/sm', 'doc/text/tertiary', 'Value'); } },
    // Effect styles applied to tiles. { prefix }
    'effect-tiles': async (c, i) => { const ss = esBy(i.prefix || ''); if (!ss.length) { warn('effect-tiles: no effect styles'); return; } await effectTiles(c, ss); },
    // Paint styles (gradients) applied to tiles. { prefix }
    'paint-tiles': async (c, i) => { const ss = allPS.filter(s => s.name.startsWith(i.prefix || '') && s.paints.some(p => p.type !== 'SOLID')); if (!ss.length) { warn('paint-tiles: no gradient paint styles'); return; } await paintTiles(c, ss); },
    // Grid styles drawn with their columns (grid styles don't show in exports). { prefix: 'grid/' }
    grids: async (c, i) => { const r = hrow(c, 'Grids'); for (const gs of allGS.filter(s => s.name.startsWith(i.prefix || 'grid/'))) { const g = gs.layoutGrids.find(x => x.pattern === 'COLUMNS'); if (!g) continue; const w = i.width || 390, h = 240; const f = figma.createFrame(); f.name = 'Grid · ' + gs.name; f.resize(w, h); fill(f, 'doc/surface/specimen'); stroke(f); const cnt = g.count || 4, gut = g.gutterSize || 0, mar = g.offset || 0; const cw = (w - 2 * mar - (cnt - 1) * gut) / cnt; for (let k = 0; k < cnt; k++) { const col = figma.createRectangle(); col.name = 'Column'; f.appendChild(col); col.resize(Math.max(1, cw), h); col.x = mar + k * (cw + gut); col.y = 0; fill(col, 'doc/surface/stage'); } await labeled(r, f, gs.name + ' · ' + cnt + ' cols · gutter ' + gut + ' · margin ' + mar); } },
    // Duration tokens as bars, 1 px per millisecond (plain frames: durations can't bind to a width). { collection, prefix }
    'motion-bars': async (c, i) => { const vs = await collectionVars(i.collection || 'Motion', i.prefix || 'motion/duration/'); const list = AL('VERTICAL', 'Durations', 'doc/space/inline'); c.appendChild(list); fillW(list); for (const v of vs) { const ms = Number(valueOf(v)) || 0; const r = AL('HORIZONTAL', 'Duration · ' + v.name, 'doc/space/row'); list.appendChild(r); r.counterAxisAlignItems = 'CENTER'; r.appendChild(await tokenBadge(v.name)); const b = figma.createRectangle(); b.name = 'Bar'; b.resize(Math.max(1, Math.min(ms, 1200)), 12); fill(b, 'doc/text/accent'); r.appendChild(b); await T(r, ms + ' ms', 'code/sm', 'doc/text/tertiary', 'Value'); } },
    // Easing tokens plotted from their cubic-bezier value. { collection, prefix }
    'easing-curves': async (c, i) => { const vs = await collectionVars(i.collection || 'Motion', i.prefix || 'motion/easing/'); const r = hrow(c, 'Curves'); for (const v of vs) { const val = String(valueOf(v) || ''); const m = val.match(/(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/); const box = figma.createFrame(); box.name = 'Curve · ' + v.name; box.resize(160, 160); fill(box, 'doc/surface/specimen'); stroke(box); if (m) { const [x1, y1, x2, y2] = m.slice(1).map(Number); const s = 140, o = 10; const vec = figma.createVector(); vec.name = 'Curve'; box.appendChild(vec); vec.vectorPaths = [{ windingRule: 'NONE', data: 'M ' + o + ' ' + (o + s) + ' C ' + (o + x1 * s) + ' ' + (o + s - y1 * s) + ' ' + (o + x2 * s) + ' ' + (o + s - y2 * s) + ' ' + (o + s) + ' ' + o }]; vec.strokes = [paint('doc/text/accent')]; bindN(vec, 'strokeWeight', 'doc/border/width'); vec.x = 0; vec.y = 0; } else warn(v.name + ': not a cubic-bezier value'); const col = AL('VERTICAL', 'Easing · ' + v.name, 'doc/space/inline'); r.appendChild(col); col.appendChild(box); col.appendChild(await tokenBadge(v.name)); await T(col, val, 'code/sm', 'doc/text/tertiary', 'Value'); } },
    // Icons by category: outline and filled twin, name under each. { prefix: 'Icon/', categories?, max }
    'icon-grid': async (c, i) => { const pre = i.prefix || 'Icon/'; const comps = []; for (const p of ROOT.children) { if (i.pages && !i.pages.includes(p.name)) continue; await p.loadAsync(); for (const n of p.findAllWithCriteria({ types: ['COMPONENT'] })) if (n.name.startsWith(pre) && !(n.parent && n.parent.type === 'COMPONENT_SET') && !/-filled$/.test(n.name)) comps.push(n); } const cats = groupsOf(comps.map(n => ({ name: n.name, n })), 2); let k = 0; for (const [cat, list] of cats) { const name = cat.split('/').pop(); if (i.categories && !i.categories.includes(name)) continue; const sec = AL('VERTICAL', 'Category · ' + name, 'doc/space/inline'); c.appendChild(sec); fillW(sec); await T(sec, name + ' · ' + list.length + ' icons · ' + cat + '/*', 'label/sm', 'doc/text/primary', 'Category'); const g = hrow(sec, 'Icons', 'doc/space/row'); for (const { n } of list.slice(0, i.max || 400)) { const cell = AL('VERTICAL', 'Icon · ' + n.name, 'doc/space/tight'); g.appendChild(cell); cell.counterAxisAlignItems = 'CENTER'; cell.resize(96, 10); cell.counterAxisSizingMode = 'FIXED'; cell.primaryAxisSizingMode = 'AUTO'; cell.appendChild(n.createInstance()); await T(cell, n.name.split('/').pop(), 'code/sm', 'doc/text/tertiary', 'Name', 'fill'); } k++; } if (!k) warn('icon-grid: no ' + pre + ' components'); },
    // Brand color cards: swatch bound to a role, name, role, value. { roles: [[name, role]] }; texts = one meaning per card.
    'color-cards': async (c, i) => { const r = hrow(c, 'Colors'); let k = 0; for (const [name, role] of i.roles || []) { const v = varByName.get(role); const cd = card('Color · ' + name, 'doc/space/tight'); r.appendChild(cd); cd.resize(220, 10); cd.counterAxisSizingMode = 'FIXED'; cd.primaryAxisSizingMode = 'AUTO'; const sw = figma.createRectangle(); sw.name = 'Specimen'; sw.resize(188, 72); cd.appendChild(sw); fillW(sw); if (v) sw.fills = [paint(v)]; else warn('color-cards: no ' + role); radius(sw, 'doc/radius/badge'); stroke(sw); await T(cd, name, 'heading/sm', 'doc/text/primary', 'Name'); cd.appendChild(await tokenBadge(role)); const val = v ? valueOf(v) : null; if (isRGB(val)) await T(cd, rgb2hex(val), 'code/sm', 'doc/text/tertiary', 'Value'); if (i.texts && i.texts[k]) await T(cd, i.texts[k], 'body/sm', 'doc/text/secondary', 'Meaning', 'fill'); k++; } },
    // One card per variable collection: modes, count, sample tokens, link to its page. { exclude, pages: { Collection: page } }
    'collection-cards': async (c, i) => { const r = hrow(c, 'Collections'); for (const col of cols) { if ((i.exclude || []).includes(col.name)) continue; const cd = card('Collection · ' + col.name, 'doc/space/inline'); r.appendChild(cd); cd.resize(300, 10); cd.counterAxisSizingMode = 'FIXED'; cd.primaryAxisSizingMode = 'AUTO'; await T(cd, col.name, 'heading/sm', 'doc/text/primary', 'Name'); await T(cd, col.modes.map(m => m.name).join(' · ') + ' · ' + col.variableIds.length + ' variables', 'body/sm', 'doc/text/tertiary', 'Meta', 'fill'); await T(cd, 'Examples', 'label/sm', 'doc/text/secondary', 'Label'); const ex = col.variableIds.slice(0, 3).map(id => vById.get(id)).filter(Boolean); const er = AL('VERTICAL', 'Examples', 'doc/space/tight'); cd.appendChild(er); for (const v of ex) er.appendChild(await tokenBadge(v.name)); const pg = (i.pages || {})[col.name]; if (pg) await link(cd, 'See all on ' + pg, pg); } },
    // Equal-height goal tiles. { goals: [{ label, see }] }; texts = two per goal (what it means, in this file).
    'goal-tiles': async (c, i) => { const r = AL('HORIZONTAL', 'Goals', 'doc/space/group'); c.appendChild(r); fillW(r); r.counterAxisAlignItems = 'MIN'; const tiles = []; for (let k = 0; k < (i.goals || []).length; k++) { const g = i.goals[k]; const cd = card('Goal · ' + g.label, 'doc/space/inline'); r.appendChild(cd); fillW(cd); await T(cd, g.label, 'heading/sm', 'doc/text/primary', 'Label', 'fill'); const t = i.texts || []; if (t[2 * k]) { await T(cd, 'What it means', 'label/sm', 'doc/text/tertiary', 'Heading'); await T(cd, t[2 * k], 'body/sm', 'doc/text/secondary', 'What it means', 'fill'); } if (t[2 * k + 1]) { await T(cd, 'In this file', 'label/sm', 'doc/text/tertiary', 'Heading'); await T(cd, t[2 * k + 1], 'body/sm', 'doc/text/secondary', 'In this file', 'fill'); } if (g.see) await link(cd, 'See ' + g.see, g.see); tiles.push(cd); } const h = Math.max(...tiles.map(t => t.height)); for (const t of tiles) { t.layoutSizingVertical = 'FIXED'; t.resize(t.width, h); } },
    // A token name split into its segments, each labeled. { example: 'color/fill/accent/solid', labels: ['domain', …] }
    'name-anatomy': async (c, i) => { const segs = String(i.example || '').split('/'); const r = AL('HORIZONTAL', 'Name anatomy', 'doc/space/tight'); c.appendChild(r); for (let k = 0; k < segs.length; k++) { const col = AL('VERTICAL', 'Segment · ' + segs[k], 'doc/space/tight'); r.appendChild(col); col.counterAxisAlignItems = 'CENTER'; col.appendChild(await tokenBadge(segs[k] + (k < segs.length - 1 ? ' /' : ''))); await T(col, (i.labels || [])[k] || '', 'body/sm', 'doc/text/tertiary', 'Segment'); } },
    // primitive → role → component, each step labeled. { chains: [{ primitive, role, item: recipe }] }
    'token-chain': async (c, i) => { for (const ch of i.chains || []) { const r = AL('HORIZONTAL', 'Chain · ' + ch.role, 'doc/space/row'); c.appendChild(r); r.counterAxisAlignItems = 'CENTER'; if (ch.primitive) { r.appendChild(await tokenBadge(ch.primitive)); await T(r, '→', 'heading/md', 'doc/text/tertiary', 'Arrow'); } r.appendChild(await tokenBadge(ch.role)); if (ch.item) { await T(r, '→', 'heading/md', 'doc/text/tertiary', 'Arrow'); const s = stage('Example', 'HORIZONTAL', 'doc/space/inline'); r.appendChild(s); s.appendChild(await mk(ch.item)); } } },
    // Contrast of role pairs, computed in every supported mode. { pairs: [[fg, bg]], modes }
    'contrast-pairs': async (c, i) => { const rows = []; for (const [fg, bg] of i.pairs || []) { const a = varByName.get(fg), b = varByName.get(bg); if (!a || !b) { warn('contrast-pairs: ' + fg + ' or ' + bg + ' missing'); continue; } const m = modesOf(a)[0]; const ca = resolve(a, m.modeId), cb = resolve(b, modesOf(b)[0].modeId); const rt = isRGB(ca) && isRGB(cb) ? ratio(ca, cb) : null; rows.push([{ token: fg }, { token: bg }, rt === null ? '—' : rt + ':1 · ' + (rt >= 4.5 ? 'AA' : rt >= 3 ? 'AA large text and UI' : 'below AA')]); } await table(c, [{ label: 'Foreground', w: 260 }, { label: 'Background', w: 260 }, { label: 'Contrast', w: 'fill' }], rows, 'Contrast pairs'); },
    // Collections with more than one mode: a table of their modes. { exclude, unsupported: { Color: ['Dark'] } }
    'mode-table': async (c, i) => { const rows = cols.filter(col => col.modes.length > 1 && !(i.exclude || []).includes(col.name)).map(col => [col.name, col.modes.map(m => m.name + (((i.unsupported || {})[col.name] || []).includes(m.name) ? ' (not supported)' : '')).join(' · '), col.variableIds.length + ' variables']); await table(c, [{ label: 'Collection', w: 220 }, { label: 'Modes', w: 'fill' }, { label: 'Size', w: 160 }], rows, 'Modes'); },
    // The same instances in each supported mode of a collection, side by side (a frame per mode). { collection, items, modes }
    'mode-frames': async (c, i) => { const col = cols.find(x => x.name === (i.collection || 'Color')); if (!col) { warn('mode-frames: no collection ' + i.collection); return; } const r = hrow(c, 'Modes'); for (const m of col.modes.filter(m => !i.modes || i.modes.includes(m.name))) { const f = AL('VERTICAL', 'Frame · ' + m.name, 'doc/space/inline'); r.appendChild(f); pad(f, 'doc/space/group'); fill(f, 'color/surface/base'); radius(f, 'doc/radius/surface'); stroke(f); f.setExplicitVariableModeForCollection(col, m.modeId); await T(f, col.name + ' · ' + m.name, 'label/sm', 'color/text/secondary', 'Mode'); await row(f, i.items); } },
    // A recreated editor panel (DOCFRAMES §15: recreate, never screenshot). { title, rows: [[label, value]], hl, w }
    'editor-panel': async (c, i) => { const p = AL('VERTICAL', 'Editor · ' + i.title); c.appendChild(p); p.resize(i.w || 320, 10); p.counterAxisSizingMode = 'FIXED'; p.primaryAxisSizingMode = 'AUTO'; fill(p, 'doc/surface/specimen'); stroke(p); radius(p, 'doc/radius/surface'); p.clipsContent = true; const h = AL('HORIZONTAL', 'Panel header', 'doc/space/inline'); p.appendChild(h); fillW(h); pad(h, 'doc/space/row', 'doc/space/inline'); fill(h, 'doc/surface/header'); await T(h, i.title, 'label/sm', 'doc/text/primary', 'Title'); for (let k = 0; k < (i.rows || []).length; k++) { const [a, b] = i.rows[k]; const r = AL('HORIZONTAL', 'Panel row', 'doc/space/inline'); p.appendChild(r); fillW(r); pad(r, 'doc/space/row', 'doc/space/inline'); r.counterAxisAlignItems = 'CENTER'; if (k === i.hl) fill(r, 'doc/surface/stage'); const l = await T(r, a, 'body/sm', 'doc/text/secondary', 'Label'); fillW(l); if (b !== undefined && b !== null) await T(r, String(b), k === i.hl ? 'label/sm' : 'body/sm', k === i.hl ? 'doc/text/accent' : 'doc/text/primary', 'Value'); } },
    // An instance and the space tokens bound inside it, numbered. { item: recipe, fields: ['itemSpacing', 'padding…'] }
    callouts: async (c, i) => { const n = await mk(i.item); const r = AL('HORIZONTAL', 'Callouts', 'doc/space/group'); c.appendChild(r); r.counterAxisAlignItems = 'MIN'; const s = stage('Example', 'HORIZONTAL', 'doc/space/inline'); r.appendChild(s); s.appendChild(n); const list = AL('VERTICAL', 'Bound spacing', 'doc/space/tight'); r.appendChild(list); const seen = new Set(); const F = i.fields || ['itemSpacing', 'paddingLeft', 'paddingTop', 'counterAxisSpacing']; for (const x of [n].concat(n.findAll(() => true))) { const bv = x.boundVariables || {}; for (const f of F) { const b = bv[f]; if (!b || !b.id) continue; const v = vById.get(b.id); if (!v || seen.has(v.name + f)) continue; seen.add(v.name + f); const lr = AL('HORIZONTAL', 'Callout row', 'doc/space/inline'); list.appendChild(lr); lr.counterAxisAlignItems = 'CENTER'; lr.appendChild(await tokenBadge(v.name)); await T(lr, f.replace(/([A-Z])/g, ' $1').toLowerCase() + ' · ' + x.name, 'body/sm', 'doc/text/tertiary', 'Where'); } } if (!seen.size) await T(list, 'No space tokens are bound inside this instance.', 'body/sm', 'doc/text/tertiary', 'Note'); },
    // Nested radius: inner + padding = outer, pinched and parallel. { inner: 'radius/control', pad: 'space/xs', outer: 'radius/surface' }
    'nested-radius': async (c, i) => { const r = hrow(c, 'Nested radius'); const vin = varByName.get(i.inner || 'radius/control'), vp = varByName.get(i.pad || 'space/xs'), vout = varByName.get(i.outer || 'radius/surface'); if (!vin || !vp || !vout) { warn('nested-radius: tokens missing'); return; } for (const [label, same] of [['Same radius inside and out: pinched', true], ['Outer = inner + padding: parallel', false]]) { const o = AL('VERTICAL', 'Outer', 'doc/space/inline'); fill(o, 'doc/surface/stage'); for (const k of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom']) o.setBoundVariable(k, vp); for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) o.setBoundVariable(k, same ? vin : vout); const inner = figma.createFrame(); inner.name = 'Inner'; inner.resize(160, 48); fill(inner, 'doc/text/accent'); for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) inner.setBoundVariable(k, vin); o.appendChild(inner); const col = AL('VERTICAL', 'Case', 'doc/space/inline'); r.appendChild(col); col.appendChild(o); await T(col, label, 'body/sm', 'doc/text/tertiary', 'Label', 220); await T(col, (same ? i.inner : i.outer) + ' outside · ' + i.inner + ' inside · ' + i.pad, 'code/sm', 'doc/text/tertiary', 'Tokens', 220); } },
    // Text samples set in one style with optional overrides on the sample only. { style, sample, columns: [{ lineHeight, letterSpacing, fontSize }] }
    'type-samples': async (c, i) => { const st = allTS.find(s => s.name === i.style); if (!st) { warn('type-samples: no style ' + i.style); return; } await figma.loadFontAsync(st.fontName); const r = hrow(c, 'Samples'); for (let k = 0; k < (i.columns || [{}]).length; k++) { const o = (i.columns || [{}])[k]; const col = AL('VERTICAL', 'Sample', 'doc/space/inline'); r.appendChild(col); const s = stage('Example', 'VERTICAL', 'doc/space/inline'); col.appendChild(s); s.resize(i.w || 220, 10); s.counterAxisSizingMode = 'FIXED'; s.primaryAxisSizingMode = 'AUTO'; const t = figma.createText(); await t.setTextStyleIdAsync(st.id); t.characters = i.sample || 'The quick brown fox jumps over the lazy dog.'; if (o.lineHeight) t.lineHeight = { unit: 'PIXELS', value: o.lineHeight }; if (o.letterSpacing !== undefined) t.letterSpacing = { unit: 'PERCENT', value: o.letterSpacing }; if (o.fontSize) t.fontSize = o.fontSize; fill(t, 'doc/text/primary'); t.name = 'Sample'; s.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; if (i.texts && i.texts[k]) await T(col, i.texts[k], 'body/sm', 'doc/text/tertiary', 'Caption', i.w || 220); } },
    // Scopes per variable group, read from the variables. { collections?: [names], depth: 2 }
    'scope-table': async (c, i) => { const rows = []; for (const col of cols) { if (i.collections && !i.collections.includes(col.name)) continue; const vs = col.variableIds.map(id => vById.get(id)).filter(Boolean); for (const [g, list] of groupsOf(vs, i.depth || 2)) { const sc = new Set(); for (const v of list) for (const x of v.scopes || []) sc.add(x); rows.push([col.name, { token: g + '/…' }, sc.size ? [...sc].map(x => x.toLowerCase().replace(/_/g, ' ')).join(', ') : 'hidden from pickers']); } } await table(c, [{ label: 'Collection', w: 180 }, { label: 'Group', w: 300 }, { label: 'Offered for', w: 'fill' }], rows, 'Scopes'); },
    // Code names as set on the variables (web, iOS, Android). { collections?, per: 3 }
    'code-syntax': async (c, i) => { const rows = []; for (const col of cols) { if (i.collections && !i.collections.includes(col.name)) continue; for (const id of col.variableIds.slice(0, i.per || 3)) { const v = vById.get(id); if (!v) continue; const cs = v.codeSyntax || {}; rows.push([{ token: v.name }, cs.WEB || '—', cs.iOS || '—', cs.ANDROID || '—']); } } await table(c, [{ label: 'Variable', w: 320 }, { label: 'Web', w: 260 }, { label: 'iOS', w: 220 }, { label: 'Android', w: 'fill' }], rows, 'Code syntax'); },
    // Small labeled tiles from the copy: one tile per text. { titles: [] }
    // With no titles, each taken copy line becomes a tile title.
    tiles: async (c, i) => { const titles = (i.titles && i.titles.length) ? i.titles : (i.texts || []); const lines = (i.titles && i.titles.length) ? (i.texts || []) : []; const r = hrow(c, 'Tiles'); for (let k = 0; k < titles.length; k++) { const cd = card('Tile · ' + titles[k], 'doc/space/tight'); r.appendChild(cd); cd.resize(i.w || 220, 10); cd.counterAxisSizingMode = 'FIXED'; cd.primaryAxisSizingMode = 'AUTO'; await T(cd, titles[k], 'heading/sm', 'doc/text/primary', 'Title', 'fill'); if (lines[k]) await T(cd, lines[k], 'body/sm', 'doc/text/secondary', 'Line', 'fill'); } },
  };
  const visual = async (container, v) => {
    if (Array.isArray(v)) { for (const x of v) await visual(container, x); return; }
    if (!v || !v.type) return;
    if (v.type === 'custom') { warn('custom visual: drawn by its own function'); if (v.fn) await (new (Object.getPrototypeOf(async function () {}).constructor)('figma', 'D', 'c', 'i', v.fn))(figma, D, container, v); return; }
    const f = VIS[v.type]; if (!f) { warn('unknown visual ' + v.type); return; }
    await f(container, v);
  };

  // ---- Copy lines → text. Paragraphs in order, consecutive items as one list, the visual at `at`, then captions.
  const drawLines = async (t, lines, numbered) => { let items = []; const flush = async () => { if (items.length) { await bullets(t, items, numbered); items = []; } }; for (const l of lines) { if (l.role === 'item') { items.push(l.text); continue; } await flush(); if (l.role === '') await T(t, l.text, 'body/md', 'doc/text/secondary', 'Paragraph', 'fill'); else if (l.role === 'caption') await caption(t, l.text); } await flush(); };
  const topicItem = async (col, tp) => {
    if (col.children.length) divider(col);
    const t = AL('VERTICAL', 'Topic · ' + tp.title, 'doc/space/row'); col.appendChild(t); fillW(t);
    await T(t, tp.title, 'heading/lg', 'doc/text/primary', 'Title');
    const lines = (tp.lines || []).filter(l => l.role !== 'do' && l.role !== "don't");
    const at = tp.at === undefined ? lines.filter(l => l.role !== 'caption').length : tp.at;
    const body = lines.slice(0, at).filter(l => l.role !== 'caption'), after = lines.slice(at);
    await drawLines(t, body, tp.numbered);
    if (tp.visual) { for (const x of [].concat(tp.visual)) if (x.type === 'do-dont') x.reasons = pairsOf(tp.lines); await visual(t, tp.visual); }
    await drawLines(t, after.concat(lines.slice(0, at).filter(l => l.role === 'caption')), tp.numbered);
    return t;
  };
  const pairsOf = lines => { const ds = lines.filter(l => l.role === 'do').map(l => l.text), ns = lines.filter(l => l.role === "don't").map(l => l.text); return ds.map((d, k) => ({ do: d, dont: ns[k] || '' })); };
  const blockItem = async (body, b) => {
    const lines = b.lines || []; const paras = lines.filter(l => l.role === '');
    const items = await block(body, b.title, { desc: paras.length ? paras[0].text : undefined, badge: b.badge });
    const rest = lines.filter(l => l !== paras[0]);
    if (b.visual) await visual(items, b.visual);
    if (rest.length) await drawLines(items, rest);
    return items;
  };
  const frameTitle = (page, f) => f.title || (f.name === 'Overview' ? titleOf(page) : titleOf(page) + ' ' + f.name.toLowerCase());
  const readingFrame = async (page, f, opts) => {
    opts = opts || {};
    let fr, body, col;
    if (opts.append) { fr = page.children.find(n => n.type === 'FRAME' && n.name === page.name + ' · ' + f.name); if (!fr) throw new Error('append: no frame ' + f.name); body = fr.children.find(n => n.name === 'Body'); const foot = fr.children.find(n => n.type === 'INSTANCE' && /Footer/.test(n.name)); if (foot) foot.remove(); col = body.children.find(n => n.name === 'Rich text'); }
    else { const nf = await newFrame(page, f.name, { title: frameTitle(page, f), desc: f.header, width: f.width }); fr = nf.fr; body = nf.body; if (f.kind === 'topics') { col = AL('VERTICAL', 'Rich text', 'doc/space/block'); body.appendChild(col); col.resize(num('doc/measure/reading'), 10); col.counterAxisSizingMode = 'FIXED'; col.primaryAxisSizingMode = 'AUTO'; } }
    const list = (f.items || []).slice(opts.start || 0);
    let w = 0;
    for (const it of list) { if (f.kind === 'topics') await topicItem(col, it); else { const items = await blockItem(body, it); for (const ch of items.children) w = Math.max(w, ch.width); w = Math.max(w, fastWidth.get(items.id) || 0); } }
    if (f.kind !== 'topics' && w) growTo(fr, w);
    await finish(fr); return fr;
  };

  // ---- Component and layout pages: payload → doc builder config (the page-data adapter, proven on client builds).
  const componentCfg = async P => {
    const names = {}; for (const s of P.sets) { const o = await optsOf(s.id); names[s.id] = o ? o.s.name : s.id; }
    const pub = P.sets.filter(s => !/^\.Main\//.test(names[s.id])); const priv = P.sets.filter(s => /^\.Main\//.test(names[s.id]));
    const first = await optsOf(pub[0].id);
    const topics = (P.guidelines || []).map(g => ({ t: g.title, p: g.body || [], b: g.items && g.items.length ? g.items : undefined, c: g.caption,
      v: g.do ? async t => { await pairDD(t, async s => { await row(s, g.do.items, g.do.dir); }, g.do.reason || '', async s => { await row(s, g.dont.items, g.dont.dir); }, g.dont.reason || ''); }
        : g.visual ? async t => { await visual(t, g.visual); } : undefined }))
      .concat((P.accessibility || []).length ? [{ t: 'Accessibility', b: P.accessibility }] : [])
      .concat((P.inApps || []).length ? [{ t: 'In apps', b: P.inApps }] : []);
    return {
      rename: P.rename === true, sets: pub.map(s => [s.id, names[s.id], s.family || '']), desc: P.summary,
      main: priv.length ? priv.map(s => [s.id, null, s.family || 'Private part']) : undefined,
      hero: P.hero ? async h => { h.appendChild(await mk(P.hero)); } : undefined,
      examples: (P.examples || []).map(e => [e.title, e.caption, async st => { await row(st, e.items, e.dir); }, e.w]),
      exWidth: P.exWidth, when: P.use || [], whenNot: P.dont || [],
      anat: Object.assign({ sizeProp: first && first.v.Size ? 'Size' : undefined, stateProp: first && first.v.State ? 'State' : first && first.v.Tone ? 'Tone' : undefined, treeDepth: 3 }, P.anat || {}),
      topics, skip: P.skip,
    };
  };
  const layoutCfg = async P => {
    const c = await componentCfg(P);
    return { rename: c.rename, sets: P.sets.map(s => ({ id: s.id, title: s.title, desc: s.family || '', keep: s.keep })), desc: c.desc, examples: c.examples, when: c.when, whenNot: c.whenNot, topics: c.topics, scale: P.scale, fixed: P.fixed ? new RegExp(P.fixed, 'i') : undefined, landmarks: P.landmarks, skip: P.skip };
  };

  // ---- render(payload): one page, every frame from data, then arrange and audit.
  const render = async (P, opts) => {
    opts = opts || {};
    const page = /^\d+:\d+$/.test(P.page) ? await G(P.page) : ROOT.children.find(p => p.name === P.page);
    if (!page) throw new Error('render: no page ' + P.page);
    await figma.setCurrentPageAsync(page);
    if (P.type === 'component') return sectionPage(page.id, await componentCfg(P));
    if (P.type === 'layout') return layoutPage(page.id, await layoutCfg(P));
    if (P.type !== 'reading') throw new Error('render: type is component, layout or reading');
    const t0 = Date.now();
    for (const f of P.frames || []) { if (opts.only && !opts.only.includes(f.name)) continue; await readingFrame(page, f, opts); }
    const r = await finishPage(page, { order: (P.frames || []).map(f => f.name) }); r.ms = Date.now() - t0; return r;
  };

  return Object.assign(D, { render, visual, VIS, mk, row, readingFrame, componentCfg, layoutCfg, fastCatalog: Object.keys(VIS).concat('custom') });
}
