// ds-create Doc kit builder (workflow/FAST.md F3, workflow/DOCFRAMES.md §1 and §16, templates/structure.md §7).
// Creates the `Documentation` collection and the 16 Doc kit components in a file that has none, so a fresh file is
// ready for the doc builder and the fast-mode renderer in two or three calls. Brand-agnostic: every doc variable
// aliases the brand token DOCFRAMES §1 names when the file has it; a neutral default is used only when it doesn't,
// and is listed in the result. Text uses the brand's own text styles, found by role and size.
//
// SAFE TO RE-RUN: an existing doc variable is never changed, and when the kit page already holds Doc/* components the
// kit is not built again (the result says so). Values of brand tokens are never touched.
//
// CALL (two write calls; tokens from init must exist first):
//   1. the collection:  paste this file's function, then  return await dockit(figma, { only: 'collection' });
//   2. the components:  paste it again, then              return await dockit(figma, { only: 'kit', page: '9.1 Doc kit',
//        mark: '{logo component or set id}', system: '{System} · v1.0', footer: '{one-line description}', meta: 'v1.0 · Light' });
// The result lists the doc variables created, the ones that fell back to a default, and the kit component ids
// (also cached under the 'dockit' plugin-data key the doc builder reads).

async function dockit(figma, OPTS) {
  OPTS = OPTS || {};
  const out = { created: [], defaults: [], kept: [], kit: {} };
  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = new Map(vars.map(v => [v.name, v]));
  let cols = await figma.variables.getLocalVariableCollectionsAsync();

  // ---- 1. The Documentation collection (DOCFRAMES §1): role → brand aliases in order → default.
  const C = (r, g, b) => ({ r: r / 255, g: g / 255, b: b / 255 });
  const DOC = [
    ['doc/surface/base', 'COLOR', ['color/surface/base'], C(255, 255, 255)],
    ['doc/surface/header', 'COLOR', ['color/surface/sunken'], C(244, 244, 245)],
    ['doc/surface/specimen', 'COLOR', ['color/surface/raised', 'color/surface/base'], C(255, 255, 255)],
    ['doc/surface/stage', 'COLOR', ['color/surface/sunken'], C(244, 244, 245)],
    ['doc/status/do', 'COLOR', ['color/icon/success', 'color/text/success'], C(21, 128, 61)],
    ['doc/status/dont', 'COLOR', ['color/icon/danger', 'color/text/danger'], C(185, 28, 28)],
    ['doc/border/subtle', 'COLOR', ['color/border/subtle', 'color/border/default'], C(228, 228, 231)],
    ['doc/border/specimen', 'COLOR', ['color/border/subtle', 'color/border/default'], C(228, 228, 231)],
    ['doc/text/primary', 'COLOR', ['color/text/primary'], C(24, 24, 27)],
    ['doc/text/secondary', 'COLOR', ['color/text/secondary'], C(63, 63, 70)],
    ['doc/text/tertiary', 'COLOR', ['color/text/tertiary', 'color/text/secondary'], C(82, 82, 91)],
    ['doc/text/accent', 'COLOR', ['color/text/brand', 'color/text/accent'], C(29, 78, 216)],
    ['doc/text/specimen', 'COLOR', ['color/text/primary'], C(24, 24, 27)],
    ['doc/radius/surface', 'FLOAT', ['radius/surface'], 8],
    ['doc/radius/badge', 'FLOAT', ['radius/indicator', 'radius/full'], 4],
    ['doc/radius/chip', 'FLOAT', ['radius/xs', 'radius/sm'], 4],
    ['doc/space/canvas', 'FLOAT', ['space/11xl'], 160],
    ['doc/space/frame', 'FLOAT', ['space/7xl'], 64],
    ['doc/space/header', 'FLOAT', ['space/5xl'], 40],
    ['doc/space/block', 'FLOAT', ['space/4xl'], 32],
    ['doc/space/group', 'FLOAT', ['space/3xl'], 24],
    ['doc/space/row', 'FLOAT', ['space/xl'], 16],
    ['doc/space/compact', 'FLOAT', ['space/lg', 'space/md'], 12],
    ['doc/space/inline', 'FLOAT', ['space/md'], 8],
    ['doc/space/tight', 'FLOAT', ['space/xs', 'space/2xs'], 4],
    ['doc/space/hairline', 'FLOAT', ['space/xxs', 'space/2xs'], 2],
    ['doc/border/width', 'FLOAT', ['border/width/default', 'border/width/subtle'], 1],
    // Measures describe the canvas, not the product: the same in every build (DOCFRAMES §1).
    ['doc/measure/frame', 'FLOAT', [], 1440], ['doc/measure/reading', 'FLOAT', [], 720], ['doc/measure/row-note', 'FLOAT', [], 320],
    ['doc/measure/table', 'FLOAT', [], 1280], ['doc/measure/specimen', 'FLOAT', [], 160], ['doc/table/name', 'FLOAT', [], 320],
    ['doc/table/header', 'FLOAT', [], 40], ['doc/table/separator', 'FLOAT', [], 16], ['doc/table/row-min', 'FLOAT', [], 56],
  ];
  const SCOPES = n => /^doc\/(surface|status)\//.test(n) ? ['FRAME_FILL', 'SHAPE_FILL'] : /^doc\/text\//.test(n) ? ['TEXT_FILL', 'SHAPE_FILL'] : /^doc\/border\/(subtle|specimen)/.test(n) ? ['STROKE_COLOR', 'SHAPE_FILL'] : /^doc\/radius\//.test(n) ? ['CORNER_RADIUS'] : /^doc\/space\//.test(n) ? ['GAP'] : n === 'doc/border/width' ? ['STROKE_FLOAT'] : ['WIDTH_HEIGHT'];
  if (OPTS.only !== 'kit') {
    let col = cols.find(c => c.name === 'Documentation');
    if (!col) { col = figma.variables.createVariableCollection('Documentation'); col.renameMode(col.modes[0].modeId, 'Value'); cols = await figma.variables.getLocalVariableCollectionsAsync(); }
    const mode = col.modes[0].modeId;
    for (const [name, type, aliases, def] of DOC) {
      if (byName.has(name)) { out.kept.push(name); continue; }
      const v = figma.variables.createVariable(name, col, type);
      const target = aliases.map(a => byName.get(a)).find(x => x && x.resolvedType === type);
      if (target) v.setValueForMode(mode, { type: 'VARIABLE_ALIAS', id: target.id });
      else { v.setValueForMode(mode, def); if (aliases.length) out.defaults.push(name); }
      v.scopes = SCOPES(name);
      v.setVariableCodeSyntax('WEB', 'var(--' + name.replace(/\//g, '-') + ')');
      v.description = 'Documentation only: ' + (aliases.length ? 'aliases ' + (target ? target.name : 'a default (the brand has no ' + aliases[0] + ')') : 'a canvas measure, the same in every build') + '.';
      byName.set(name, v); out.created.push(name);
    }
    if (OPTS.only === 'collection') return out;
  }

  // ---- 2. The Doc kit components (DOCFRAMES §16, templates/structure.md §7).
  const page = figma.root.children.find(p => p.name === (OPTS.page || '9.1 Doc kit'));
  if (!page) return Object.assign(out, { error: 'No page named "' + (OPTS.page || '9.1 Doc kit') + '": create it with the page tree first' });
  await figma.setCurrentPageAsync(page);
  const existing = page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] }).filter(c => /^Doc\//.test(c.name) && !(c.parent && c.parent.type === 'COMPONENT_SET'));
  if (existing.length) { out.kit = Object.fromEntries(existing.map(c => [c.name, c.id])); out.note = 'kit already on the page: nothing built'; figma.root.setSharedPluginData('dscreate', 'dockit', JSON.stringify(out.kit)); return out; }

  const V = n => byName.get(n) || null;
  const paint = n => { const v = V(n); return v ? figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v) : { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }; };
  const bind = (node, prop, n) => { const v = V(n); if (v) node.setBoundVariable(prop, v); };
  // Text styles by role and size, nearest match: the brand's own styles (SYSTEM.md Part C §3.2).
  const styles = await figma.getLocalTextStylesAsync();
  const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const style = (role, size) => { const si = SIZES.indexOf(size); for (const r of [role, ...(role === 'overline' ? ['label'] : []), 'body']) { const hits = styles.filter(s => s.name.startsWith('type/' + r + '/')); if (!hits.length) continue; hits.sort((a, b) => Math.abs(SIZES.indexOf(a.name.split('/')[2]) - si) - Math.abs(SIZES.indexOf(b.name.split('/')[2]) - si)); return hits[0]; } return styles[0] || null; };
  for (const s of styles) { try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const T = async (parent, chars, role, size, color, name, fillW) => { const t = figma.createText(); t.name = name; const s = style(role, size); if (s) await t.setTextStyleIdAsync(s.id); t.characters = chars; t.fills = [paint(color)]; parent.appendChild(t); if (fillW) { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } return t; };
  const AL = (dir, name, gap) => { const f = figma.createAutoLayout(dir); f.name = name; f.fills = []; if (gap) bind(f, 'itemSpacing', gap); return f; };
  const pad = (f, t, r, b, l) => { for (const [p, v] of [['paddingTop', t], ['paddingRight', r], ['paddingBottom', b], ['paddingLeft', l]]) if (v) bind(f, p, v); };
  const rad = (n, v) => { for (const r of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) bind(n, r, v); };
  const comp = (name, dir, gap) => { const c = figma.createComponent(); c.name = name; c.layoutMode = dir; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.fills = []; if (gap) bind(c, 'itemSpacing', gap); return c; };
  const txt = (c, t, prop) => { t.componentPropertyReferences = { characters: c.addComponentProperty(prop, 'TEXT', t.characters) }; };
  const bool = (c, node, prop) => { node.componentPropertyReferences = Object.assign({}, node.componentPropertyReferences || {}, { visible: c.addComponentProperty(prop, 'BOOLEAN', true) }); };
  const stroke = (n, color) => { n.strokes = [paint(color)]; n.strokeAlign = 'INSIDE'; bind(n, 'strokeWeight', 'doc/border/width'); };
  const fixW = (c, measure) => { c.counterAxisSizingMode = 'FIXED'; if (c.layoutMode === 'HORIZONTAL') c.primaryAxisSizingMode = 'FIXED'; bind(c, 'width', measure); };
  // The identity mark: the logo set's mark variant when there is one, else a neutral square stand-in.
  let markSrc = OPTS.mark ? await figma.getNodeByIdAsync(OPTS.mark) : null;
  if (markSrc && markSrc.type === 'COMPONENT_SET') markSrc = markSrc.children.find(v => /mark/i.test(v.name)) || markSrc.defaultVariant;
  if (!markSrc) out.defaults.push('mark: no logo given, a neutral square is drawn (replace it once 1.8 has the logo)');
  const mark = size => { if (markSrc) { const i = markSrc.createInstance(); i.name = 'Mark'; i.rescale(size / Math.max(i.height, 1)); return i; } const r = figma.createRectangle(); r.name = 'Mark'; r.resize(size, size); r.fills = [paint('doc/text/accent')]; rad(r, 'doc/radius/badge'); return r; };
  const system = OPTS.system || 'Design System · v1.0';
  const made = {};

  { const c = comp('Doc/Badge', 'HORIZONTAL'); pad(c, 'doc/space/hairline', 'doc/space/inline', 'doc/space/hairline', 'doc/space/inline'); rad(c, 'doc/radius/badge'); stroke(c, 'doc/border/subtle'); txt(c, await T(c, 'Badge', 'body', 'xs', 'doc/text/secondary', 'Label'), 'Label'); made.badge = c; }
  { const c = comp('Doc/Token badge', 'HORIZONTAL'); pad(c, 'doc/space/hairline', 'doc/space/inline', 'doc/space/hairline', 'doc/space/inline'); rad(c, 'doc/radius/chip'); stroke(c, 'doc/border/subtle'); c.fills = [paint('doc/surface/specimen')]; txt(c, await T(c, 'color/text/primary', 'code', 'sm', 'doc/text/primary', 'Token'), 'Token'); made.token = c; }
  { const c = comp('Doc/Header', 'VERTICAL'); pad(c, 'doc/space/frame', 'doc/space/frame', null, 'doc/space/frame'); fixW(c, 'doc/measure/frame');
    const card = AL('VERTICAL', 'Card', 'doc/space/header'); c.appendChild(card); card.layoutSizingHorizontal = 'FILL'; pad(card, 'doc/space/header', 'doc/space/header', 'doc/space/header', 'doc/space/header'); card.fills = [paint('doc/surface/header')]; rad(card, 'doc/radius/surface');
    const top = AL('HORIZONTAL', 'Top row', 'doc/space/compact'); card.appendChild(top); top.layoutSizingHorizontal = 'FILL'; top.counterAxisAlignItems = 'CENTER'; top.appendChild(mark(32));
    txt(c, await T(top, 'Level › ID Name', 'body', 'sm', 'doc/text/tertiary', 'Breadcrumb', true), 'Breadcrumb');
    txt(c, await T(top, system, 'body', 'sm', 'doc/text/tertiary', 'System'), 'System');
    const hr = AL('HORIZONTAL', 'Heading row', 'doc/space/header'); card.appendChild(hr); hr.layoutSizingHorizontal = 'FILL'; hr.counterAxisAlignItems = 'MAX';
    const hd = AL('VERTICAL', 'Heading', 'doc/space/compact'); hr.appendChild(hd); hd.counterAxisSizingMode = 'FIXED'; bind(hd, 'width', 'doc/measure/reading');
    txt(c, await T(hd, 'Title', 'heading', '2xl', 'doc/text/primary', 'Title', true), 'Title');
    const de = await T(hd, 'Description of the page.', 'body', 'md', 'doc/text/secondary', 'Description', true); txt(c, de, 'Description'); bool(c, de, 'Show description'); made.header = c; }
  { const c = comp('Doc/Footer', 'VERTICAL', 'doc/space/group'); pad(c, null, 'doc/space/frame', 'doc/space/frame', 'doc/space/frame'); fixW(c, 'doc/measure/frame');
    const dv = figma.createRectangle(); dv.name = 'Divider'; c.appendChild(dv); dv.resize(100, 1); dv.layoutSizingHorizontal = 'FILL'; dv.fills = [paint('doc/border/subtle')];
    const row = AL('HORIZONTAL', 'Row', 'doc/space/group'); c.appendChild(row); row.layoutSizingHorizontal = 'FILL'; row.counterAxisAlignItems = 'CENTER'; row.appendChild(mark(24));
    txt(c, await T(row, OPTS.footer || system, 'body', 'sm', 'doc/text/secondary', 'Description', true), 'Description');
    txt(c, await T(row, OPTS.meta || 'v1.0', 'body', 'sm', 'doc/text/tertiary', 'Meta'), 'Meta'); made.footer = c; }
  { const c = comp('Doc/Block note', 'VERTICAL', 'doc/space/inline'); fixW(c, 'doc/measure/reading');
    const tr = AL('HORIZONTAL', 'Title row', 'doc/space/inline'); c.appendChild(tr); tr.counterAxisAlignItems = 'CENTER';
    txt(c, await T(tr, 'Block title', 'heading', 'md', 'doc/text/primary', 'Title'), 'Title');
    const b = made.badge.createInstance(); tr.appendChild(b); bool(c, b, 'Show badge');
    const de = await T(c, 'What this block shows and why it matters.', 'body', 'md', 'doc/text/secondary', 'Description', true); txt(c, de, 'Description'); bool(c, de, 'Show description'); made.note = c; }
  { const c = comp('Doc/Family header', 'VERTICAL', 'doc/space/inline'); fixW(c, 'doc/measure/reading');
    txt(c, await T(c, 'LEVEL › ID NAME', 'overline', 'xs', 'doc/text/accent', 'Eyebrow', true), 'Eyebrow');
    txt(c, await T(c, 'Family title', 'heading', 'lg', 'doc/text/primary', 'Title', true), 'Title');
    txt(c, await T(c, 'What this set is for.', 'body', 'md', 'doc/text/secondary', 'Description', true), 'Description'); made.family = c; }
  { const c = comp('Doc/Row note', 'VERTICAL', 'doc/space/inline'); fixW(c, 'doc/measure/row-note');
    txt(c, await T(c, 'Row heading', 'heading', 'sm', 'doc/text/primary', 'Heading', true), 'Heading');
    const b = made.badge.createInstance(); c.appendChild(b); bool(c, b, 'Show badge');
    txt(c, await T(c, 'Short explanation of the row.', 'body', 'sm', 'doc/text/secondary', 'Body', true), 'Body'); made.row = c; }
  { const tree = last => { const c = figma.createComponent(); c.name = 'Type=' + (last ? 'last' : 'middle'); c.resize(16, 56); c.fills = [];
      const v = figma.createRectangle(); v.name = 'Stem'; c.appendChild(v); v.resize(1, last ? 28 : 56); v.x = 7; v.y = 0; v.fills = [paint('doc/border/subtle')];
      const h = figma.createRectangle(); h.name = 'Elbow'; c.appendChild(h); h.resize(9, 1); h.x = 7; h.y = 28; h.fills = [paint('doc/border/subtle')]; return c; };
    const set = figma.combineAsVariants([tree(false), tree(true)], page); set.name = 'Doc/Tree connector'; set.cornerRadius = 0; set.layoutMode = 'HORIZONTAL'; bind(set, 'itemSpacing', 'doc/space/row'); set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO'; set.fills = []; made.tree = set; }
  { const c = comp('Doc/Alias chip', 'HORIZONTAL', 'doc/space/inline'); c.counterAxisAlignItems = 'CENTER';
    const sw = figma.createRectangle(); sw.name = 'Swatch'; c.appendChild(sw); sw.resize(16, 16); rad(sw, 'doc/radius/chip'); sw.fills = [paint('doc/surface/specimen')]; stroke(sw, 'doc/border/specimen');
    txt(c, await T(c, 'palette/neutral/900', 'code', 'sm', 'doc/text/primary', 'Name'), 'Name'); made.alias = c; }
  { const c = comp('Doc/Color swatch', 'VERTICAL', 'doc/space/tight'); fixW(c, 'doc/measure/specimen');
    const sp = AL('VERTICAL', 'Specimen'); c.appendChild(sp); sp.layoutSizingHorizontal = 'FILL'; sp.primaryAxisSizingMode = 'FIXED'; sp.resize(160, 96); sp.layoutSizingHorizontal = 'FILL'; sp.fills = [paint('doc/surface/specimen')]; stroke(sp, 'doc/border/specimen'); rad(sp, 'doc/radius/chip'); sp.primaryAxisAlignItems = 'MAX'; pad(sp, 'doc/space/inline', 'doc/space/inline', 'doc/space/inline', 'doc/space/inline');
    txt(c, await T(sp, 'AA 4.5', 'code', 'sm', 'doc/text/specimen', 'Contrast'), 'Contrast');
    txt(c, await T(c, '500', 'label', 'sm', 'doc/text/primary', 'Step', true), 'Step');
    txt(c, await T(c, '#000000', 'code', 'sm', 'doc/text/secondary', 'Value', true), 'Value'); made.swatch = c; }
  { const c = comp('Doc/Type row', 'HORIZONTAL', 'doc/space/group'); c.counterAxisAlignItems = 'CENTER'; fixW(c, 'doc/measure/table');
    const n = await T(c, 'type/body/md/regular', 'code', 'sm', 'doc/text/secondary', 'Name'); n.textAutoResize = 'HEIGHT'; n.resize(240, n.height); txt(c, n, 'Name');
    txt(c, await T(c, 'The quick brown fox jumps', 'body', 'md', 'doc/text/primary', 'Sample', true), 'Sample');
    txt(c, await T(c, '16 / 24', 'code', 'sm', 'doc/text/tertiary', 'Meta'), 'Meta'); made.type = c; }
  { const c = comp('Doc/Measure', 'HORIZONTAL', 'doc/space/compact'); c.counterAxisAlignItems = 'CENTER';
    txt(c, await T(c, 'space/md', 'code', 'sm', 'doc/text/primary', 'Token'), 'Token');
    const bar = figma.createRectangle(); bar.name = 'Bar'; c.appendChild(bar); bar.resize(16, 16); bar.fills = [paint('doc/text/accent')];
    txt(c, await T(c, '8', 'code', 'sm', 'doc/text/secondary', 'Value'), 'Value'); made.measure = c; }
  { const c = comp('Doc/Callout', 'HORIZONTAL'); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; c.resize(24, 24); c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; rad(c, 'doc/radius/badge'); c.fills = [paint('doc/text/accent')];
    txt(c, await T(c, '1', 'label', 'xs', 'doc/surface/base', 'Number'), 'Number'); made.callout = c; }
  { const c = comp('Doc/Spec label', 'HORIZONTAL'); pad(c, 'doc/space/hairline', 'doc/space/tight', 'doc/space/hairline', 'doc/space/tight'); rad(c, 'doc/radius/chip'); c.fills = [paint('doc/text/accent')];
    txt(c, await T(c, '16', 'label', 'xs', 'doc/surface/base', 'Value'), 'Value'); made.spec = c; }
  { const dd = async dont => { const c = comp('Type=' + (dont ? "Don't" : 'Do'), 'VERTICAL', 'doc/space/inline'); fixW(c, 'doc/measure/row-note'); c.primaryAxisSizingMode = 'AUTO';
      const bar = figma.createRectangle(); bar.name = 'Bar'; c.appendChild(bar); bar.resize(100, 2); bar.layoutSizingHorizontal = 'FILL'; bar.fills = [paint(dont ? 'doc/status/dont' : 'doc/status/do')];
      const row = AL('HORIZONTAL', 'Row', 'doc/space/inline'); c.appendChild(row); row.layoutSizingHorizontal = 'FILL';
      await T(row, dont ? "Don't" : 'Do', 'label', 'sm', dont ? 'doc/status/dont' : 'doc/status/do', 'Label');
      txt(c, await T(row, 'One line on why.', 'body', 'sm', 'doc/text/secondary', 'Reason', true), 'Reason'); return c; };
    const set = figma.combineAsVariants([await dd(false), await dd(true)], page); set.name = 'Doc/Do-dont'; set.cornerRadius = 0; set.layoutMode = 'HORIZONTAL'; bind(set, 'itemSpacing', 'doc/space/group'); set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO'; set.fills = []; made.dodont = set; }
  { const c = comp('Doc/Axis label', 'VERTICAL', 'doc/space/hairline');
    txt(c, await T(c, 'SIZE', 'overline', 'xs', 'doc/text/tertiary', 'Property'), 'Property');
    txt(c, await T(c, 'md', 'label', 'sm', 'doc/text/primary', 'Value'), 'Value'); made.axis = c; }

  // The kit page's one frame (templates/structure.md §1: nothing loose on the canvas).
  const FN = page.name + ' · Components';
  const fr = AL('VERTICAL', FN, 'doc/space/block'); page.appendChild(fr); pad(fr, 'doc/space/frame', 'doc/space/frame', 'doc/space/frame', 'doc/space/frame'); fr.fills = [paint('doc/surface/base')]; fr.x = 0; fr.y = 0;
  for (const k of ['header', 'footer', 'family', 'note', 'row', 'badge', 'token', 'tree', 'alias', 'swatch', 'type', 'measure', 'callout', 'spec', 'dodont', 'axis']) fr.appendChild(made[k]);
  out.kit = Object.fromEntries(Object.values(made).map(c => [c.name, c.id]));
  out.frame = fr.id;
  figma.root.setSharedPluginData('dscreate', 'dockit', JSON.stringify(out.kit));
  return out;
}
