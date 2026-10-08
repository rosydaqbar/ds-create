// ds-create Figma doc builder: shared code that draws documentation frames through `use_figma`.
// It implements workflow/DOCFRAMES.md (how doc frames look), templates/structure.md (page → frame → block → items)
// and the frame lists of SYSTEM.md Part A §A3. Those files stay the spec: each rule below cites its section,
// and agents read workflow/DOCFRAMES.md only when they change this file. Brand-agnostic: every color, text style and
// space comes from the file's own variables and styles, found by name (SYSTEM.md Part C §3).
//
// TWO FUNCTIONS, TWO KEYS. `docbuilder` (core: tokens, Doc kit, frames, blocks, tables, Guidelines, .Main,
// finishPage) and `docpages` (matrix, Component, Overview, Anatomy, whole component and layout pages).
// A use_figma call takes at most 50,000 characters, so each is cached by its own call.
//
// CACHE ONCE PER BUILD (two write calls; the first build step that draws doc frames, INITIATOR.md Part B §6).
//   Call 1: paste from "async function docbuilder" down to the PART 2 line, then
//     figma.root.setSharedPluginData('dscreate', 'docbuilder', docbuilder.toString()); return docbuilder.toString().length;
//   Call 2: paste from "async function docpages" to the end, then
//     figma.root.setSharedPluginData('dscreate', 'docpages', docpages.toString()); return docpages.toString().length;
//   Each stored text is ~30 kB, under the 100 kB limit per plugin-data entry. Cache tools/figma-audit.js
//   too, so finishPage audits every page it arranges (call 3):
//     const audit = async (figma, PAGE) => { <figma-audit.js without its "const PAGE = …;" line> };
//     figma.root.setSharedPluginData('dscreate', 'audit', audit.toString()); return 'ok';
//   fn.toString() keeps backticks and ${ as written, so nothing needs escaping. (The code itself has none,
//   so the older method, String.raw text appended to the body, still works.)
//
// CALL WITH A SMALL PAGE BODY (one call per page):
//     const AF = Object.getPrototypeOf(async function () {}).constructor; const L = k => figma.root.getSharedPluginData('dscreate', k);
//     const D = await (new AF('figma', 'OPTS', 'const D = await (' + L('docbuilder') + ')(figma, OPTS); return await (' + L('docpages') + ')(figma, D);'))(figma, { gridColumn: '…' });
//     return await D.sectionPage('{page id}', { sets: [['{set id}', 'Button', 'What it does and when it helps.']], desc: '…', when: ['…'], whenNot: ['…'], topics: [{ t: 'Emphasis', p: ['…'], v: async t => … }] });
//   OPTS (optional): kit {'Doc/Header': id, …}, else found by name on the "… Doc kit" page and cached under
//   'dockit'; gridColumn: id of '.Main/Space grid column' for Layout grids.
//   Body rules: the body is an ordinary script (backticks and ${ are fine); just don't redeclare D or L.
//   Page helpers return { page, frames: {name: id}, audit, checks, warnings, foreign, ms }. Save the audit as
//   output/{slug}/figma/audit-{page}.json and the frame ids in the ledger. Smaller helpers (newFrame, block,
//   table, topic, pairDD, inst…) build custom frames the same way; end with D.finishPage(page).
//
// CLEAN UP at the end of the build (one write call):
//     for (const k of figma.root.getSharedPluginDataKeys('dscreate')) figma.root.setSharedPluginData('dscreate', k, '');
//
// FAILURE AND RECOVERY (learned on the first client build):
// - A call running past ~120 s can lose its transport while Figma keeps running it. Never re-run blind: make a
//   read-only call that lists the page's top-level frames and their child counts first. Re-running a page is
//   safe once it has finished, because every frame is replaced by exact name.
// - A script that throws is rolled back completely (no partial nodes): fix the error and run it again.
// - resize() resets sizing modes to FIXED; this code sets AUTO again after each resize. Do the same in bodies.
// - You can't appendChild into an instance; change instances only through their properties.
// - Keep one page per call; split a page's frames over two calls (cfg.skip) when a set has hundreds of variants.
// - warnings lists missing doc variables, text styles or Doc kit parts and the fallback used. A fallback is drawn
//   raw, so the audit warns too: add the missing variable or kit part rather than accept it.
//
// SAFETY ON CLIENT FILES:
// - Never changes component values (fills, sizes, spacing, properties); never detaches, unlinks or relinks.
// - Replaces only frames it owns, matched by exact name: "{ID} {Page} · {Frame}" and ".Main". Every component
//   or set inside a frame is moved out to the page before the frame is removed, so no component is deleted.
// - Moves sets into the Component and Layout frames (SYSTEM.md Part A §A3); other canvas nodes are only moved.
// - Renames only when asked: autoName (cfg.rename: true) gives default-named layers inside components their
//   role names (SYSTEM.md Part C §4.1); mainFrame renames a part only when given a new ".Main/…" name.

async function docbuilder(figma, OPTS) {
  OPTS = OPTS || {};
  const W = []; const warn = m => { if (!W.includes(m)) W.push(m); };
  const G = id => figma.getNodeByIdAsync(id);
  const ROOT = figma.root;
  const AF = Object.getPrototypeOf(async function () {}).constructor;

  // ---- Variables by name, with fallbacks (workflow/DOCFRAMES.md §1: doc roles alias the brand; SYSTEM.md Part C §3).
  const vars = await figma.variables.getLocalVariablesAsync();
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const vByName = new Map(vars.map(v => [v.name, v])); const vById = new Map(vars.map(v => [v.id, v]));
  const colById = new Map(cols.map(c => [c.id, c]));
  const FALL = {
    'doc/surface/base': ['color/surface/base'], 'doc/surface/header': ['color/surface/sunken'],
    'doc/surface/specimen': ['color/surface/raised', 'color/surface/base'], 'doc/surface/stage': ['color/surface/sunken'],
    'doc/status/do': ['color/icon/success', 'color/text/success'], 'doc/status/dont': ['color/icon/danger', 'color/text/danger'],
    'doc/border/subtle': ['color/border/subtle'], 'doc/text/primary': ['color/text/primary'],
    'doc/text/secondary': ['color/text/secondary'], 'doc/text/tertiary': ['color/text/tertiary', 'color/text/secondary'],
    'doc/text/accent': ['color/text/brand'], 'doc/radius/surface': ['radius/surface'], 'doc/radius/badge': ['radius/indicator', 'radius/full'],
    'doc/space/canvas': ['space/11xl'], 'doc/space/frame': ['space/7xl'], 'doc/space/header': ['space/5xl'],
    'doc/space/block': ['space/4xl'], 'doc/space/group': ['space/3xl'], 'doc/space/row': ['space/xl'], 'doc/space/inline': ['space/md'],
    // Not in workflow/DOCFRAMES.md §1: chip/list gaps, table cell padding and stroke width. Brand steps first.
    'doc/space/tight': ['space/xs', 'space/2xs'], 'doc/space/compact': ['doc/space/inline', 'space/md'],
    'doc/border/width': ['border/width/default', 'border/width/subtle'],
  };
  // Raw defaults, used only when neither the doc role nor its brand alias exists (templates/structure.md §5).
  const DEF = {
    'doc/surface/base': '#FFFFFF', 'doc/surface/header': '#F4F4F5', 'doc/surface/specimen': '#FFFFFF', 'doc/surface/stage': '#F4F4F5',
    'doc/status/do': '#15803D', 'doc/status/dont': '#B91C1C', 'doc/border/subtle': '#E4E4E7', 'doc/text/primary': '#18181B',
    'doc/text/secondary': '#3F3F46', 'doc/text/tertiary': '#52525B', 'doc/text/accent': '#1D4ED8',
    'doc/radius/surface': 8, 'doc/radius/badge': 4, 'doc/space/canvas': 160, 'doc/space/frame': 64, 'doc/space/header': 40,
    'doc/space/block': 32, 'doc/space/group': 24, 'doc/space/row': 16, 'doc/space/inline': 8, 'doc/space/tight': 4, 'doc/space/compact': 8,
    'doc/border/width': 1, 'doc/measure/frame': 1440, 'doc/measure/reading': 720, 'doc/measure/row-note': 320, 'doc/measure/table': 1280,
    'doc/measure/specimen': 160, 'doc/table/name': 320, 'doc/table/header': 40, 'doc/table/separator': 16, 'doc/table/row-min': 56,
  };
  const vCache = new Map();
  const V = role => {
    if (vCache.has(role)) return vCache.get(role);
    let v = vByName.get(role);
    if (!v) for (const alt of FALL[role] || []) { v = vByName.get(alt); if (v) { warn(role + ' missing: bound to ' + alt + ' instead'); break; } }
    if (!v && !/^doc\/(measure|table)\//.test(role)) warn(role + ' missing: raw ' + DEF[role] + ' drawn (audit will warn)');
    vCache.set(role, v || null); return v || null;
  };
  const valueOf = (v, d) => { if (!v || (d || 0) > 8) return null; const c = colById.get(v.variableCollectionId); const x = c ? v.valuesByMode[c.defaultModeId] : null; return x && x.type === 'VARIABLE_ALIAS' ? valueOf(vById.get(x.id), (d || 0) + 1) : x; };
  const num = role => { const x = valueOf(V(role)); return typeof x === 'number' ? x : DEF[role]; };
  const hex2rgb = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
  const rgb2hex = c => '#' + ['r', 'g', 'b'].map(k => Math.round(c[k] * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  // A role name or a local Variable → a paint bound to it (workflow/DOCFRAMES.md §5.1: specimens bound to their variable).
  const paint = x => { const v = typeof x === 'string' ? V(x) : x; if (v) return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', v); return { type: 'SOLID', color: hex2rgb(DEF[x] || '#808080') }; };
  const fill = (n, x) => { n.fills = [paint(x)]; };
  // Bound paints drop opacity on assignment: assign, clone, set opacity, reassign.
  const fillAlpha = (n, x, a) => { n.fills = [paint(x)]; const f = JSON.parse(JSON.stringify(n.fills)); f[0].opacity = a; n.fills = f; };
  const bindN = (n, field, role) => { const v = V(role); if (v) n.setBoundVariable(field, v); else n[field] = num(role); };
  const radius = (n, role) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) bindN(n, c, role); };
  const pad = (n, x, y) => { for (const p of ['paddingLeft', 'paddingRight']) bindN(n, p, x); for (const p of ['paddingTop', 'paddingBottom']) bindN(n, p, y || x); };
  const stroke = (n, role) => { n.strokes = [paint(role || 'doc/border/subtle')]; n.strokeWeight = 1; for (const k of ['strokeTopWeight', 'strokeBottomWeight', 'strokeLeftWeight', 'strokeRightWeight']) bindN(n, k, 'doc/border/width'); };
  const topStroke = r => { r.strokes = [paint('doc/border/subtle')]; r.strokeBottomWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeTopWeight = 1; bindN(r, 'strokeTopWeight', 'doc/border/width'); };
  const AL = (dir, name, gap) => { const f = figma.createAutoLayout(dir); f.name = name; f.fills = []; if (gap) bindN(f, 'itemSpacing', gap); return f; };
  const fillW = n => { n.layoutSizingHorizontal = 'FILL'; return n; };
  // Variable names for reading components: local name, 'external: name' for library variables, else 'raw'.
  const extNames = new Map();
  const varName = async alias => { if (!alias || !alias.id) return null; const l = vById.get(alias.id); if (l) return l.name; if (!extNames.has(alias.id)) { let v = null; try { v = await figma.variables.getVariableByIdAsync(alias.id); } catch (e) {} extNames.set(alias.id, 'external: ' + (v ? v.name : 'variable')); } return extNames.get(alias.id); };

  // ---- Text styles by name: type/{role}/{size}/{weight} (SYSTEM.md Part C §3.2), nearest match + warning.
  const styles = await figma.getLocalTextStylesAsync(); const tsName = new Map(styles.map(s => [s.id, s.name]));
  const effStyles = await figma.getLocalEffectStylesAsync(); const esName = new Map(effStyles.map(s => [s.id, s.name]));
  const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const WEIGHTS = { heading: ['semibold', 'bold', 'medium'], label: ['medium', 'semibold', 'bold'], body: ['regular', 'medium'], code: ['regular', 'medium'], display: ['semibold', 'bold'] };
  const ROLEFALL = { code: ['code', 'body'], label: ['label', 'body'], heading: ['heading', 'display', 'body'], body: ['body'] };
  const pickStyle = (key, names) => {
    const [role, size] = key.split('/'); const si = SIZES.indexOf(size);
    const order = SIZES.slice().sort((a, b) => Math.abs(SIZES.indexOf(a) - si) - Math.abs(SIZES.indexOf(b) - si) || SIZES.indexOf(a) - SIZES.indexOf(b));
    for (const r of ROLEFALL[role] || [role]) for (const s of order) {
      const pre = 'type/' + r + '/' + s + '/'; const hits = names.filter(n => n.startsWith(pre)); if (!hits.length) continue;
      for (const w of WEIGHTS[r] || []) if (hits.includes(pre + w)) return pre + w;
      return hits[0];
    }
    return null;
  };
  const stCache = new Map(); const fontsDone = new Set();
  const loadFont = async f => { const k = f.family + '|' + f.style; if (fontsDone.has(k)) return; fontsDone.add(k); try { await figma.loadFontAsync(f); } catch (e) { warn('font ' + f.family + ' ' + f.style + ' not available'); } };
  const S = async key => {
    if (stCache.has(key)) return stCache.get(key);
    const nm = pickStyle(key, styles.map(s => s.name)); const s = nm ? styles.find(x => x.name === nm) : null;
    if (!s) warn('no text style for ' + key + ': unstyled text drawn (audit fails doc-text-no-style as warn)');
    else if (!nm.startsWith('type/' + key + '/')) warn('text style type/' + key + '/… missing: using ' + nm);
    if (s) await loadFont(s.fontName); stCache.set(key, s); return s;
  };
  const T = async (parent, chars, key, color, name, width) => {
    const s = await S(key); const t = figma.createText(); t.name = name || 'Text';
    if (s) await t.setTextStyleIdAsync(s.id); else await loadFont(t.fontName);
    t.characters = String(chars); fill(t, color || 'doc/text/secondary'); parent.appendChild(t);
    if (width === 'fill') { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } else if (width) { t.resize(width, t.height); t.textAutoResize = 'HEIGHT'; }
    return t;
  };
  const loadFontsIn = async root => { for (const t of root.findAllWithCriteria({ types: ['TEXT'] })) { if (t.fontName !== figma.mixed) await loadFont(t.fontName); else for (const s of t.getStyledTextSegments(['fontName'])) await loadFont(s.fontName); } };

  // ---- Doc kit by name (workflow/DOCFRAMES.md §16; templates/structure.md §7). Index cached in 'dockit'.
  const KIT = ['Doc/Header', 'Doc/Footer', 'Doc/Family header', 'Doc/Block note', 'Doc/Row note', 'Doc/Badge', 'Doc/Token badge', 'Doc/Tree connector', 'Doc/Alias chip', 'Doc/Color swatch', 'Doc/Type row', 'Doc/Measure', 'Doc/Callout', 'Doc/Spec label', 'Doc/Do-dont', 'Doc/Axis label'];
  let idx = OPTS.kit || null;
  if (!idx) { try { idx = JSON.parse(ROOT.getSharedPluginData('dscreate', 'dockit') || 'null'); } catch (e) { idx = null; } }
  if (!idx) {
    idx = {}; const kp = ROOT.children.find(p => /doc kit$/i.test(p.name));
    if (kp) { await kp.loadAsync(); for (const c of kp.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) if (/^Doc\//.test(c.name) && !(c.parent && c.parent.type === 'COMPONENT_SET')) idx[c.name] = c.id; ROOT.setSharedPluginData('dscreate', 'dockit', JSON.stringify(idx)); }
    else warn('no page named "… Doc kit": every Doc/* part is a plain stand-in');
  }
  const K = {}; for (const n of KIT) { const node = idx[n] ? await G(idx[n]) : null; if (node) K[n] = node; }
  const ALIAS = { Breadcrumb: ['Subtitle Text', 'Subtitle'], Token: ['Name', 'Label'], Name: ['Token', 'Label'], Number: ['Label', 'Value'], Reason: ['Description', 'Text', 'Label'], Value: ['Label'], Description: ['Supporting text', 'Text'] };
  const setP = async (i, map) => {
    const keys = Object.keys(i.componentProperties || {}); const o = {}; let fonts = false;
    for (const [k, val] of Object.entries(map)) {
      if (val === undefined) continue;
      const want = [k].concat(ALIAS[k] || []).map(x => x.toLowerCase());
      const key = want.map(w => keys.find(x => x.split('#')[0].toLowerCase() === w)).find(Boolean);
      if (key) { o[key] = i.componentProperties[key].type === 'TEXT' ? String(val) : val; if (typeof val !== 'boolean') fonts = true; continue; }
      if (typeof val === 'boolean') continue;
      const t = i.findOne(n => n.type === 'TEXT' && want.includes(n.name.toLowerCase()));
      if (t) { await loadFontsIn(t); t.characters = String(val); } else warn(i.name + ': no property or text layer "' + k + '"');
    }
    if (fonts) await loadFontsIn(i); if (Object.keys(o).length) i.setProperties(o); return i;
  };
  const kit = async (name, props, want) => {
    const c = K[name];
    if (!c) { warn(name + ' not in the Doc kit: stand-in drawn'); const s = AL('HORIZONTAL', name + ' (stand-in)', 'doc/space/inline'); for (const v of Object.values(props || {})) if (typeof v === 'string' && v) await T(s, v, 'body/sm', 'doc/text/secondary'); return s; }
    let comp = c; if (c.type === 'COMPONENT_SET') comp = (want && c.children.find(want)) || c.defaultVariant;
    return setP(comp.createInstance(), props || {});
  };
  const badge = l => kit('Doc/Badge', { Label: l });
  const tokenBadge = n => kit('Doc/Token badge', { Token: n });
  const callout = n => kit('Doc/Callout', { Number: String(n) });
  const spec = v => kit('Doc/Spec label', { Value: String(v) });
  const measure = (t, v) => kit('Doc/Measure', { Token: t, Value: String(v) });
  const axis = (p, v) => kit('Doc/Axis label', { Property: p, Value: v });
  // Alias chip (workflow/DOCFRAMES.md §6.5): swatch bound to a local variable; a raw or library color is shown raw.
  const chip = async (name, v, rgb) => { const a = await kit('Doc/Alias chip', { Name: String(name || '—') }); const sw = a.type === 'INSTANCE' ? a.findOne(n => /swatch/i.test(n.name)) : null; if (sw) { if (v) sw.fills = [paint(v)]; else if (rgb) sw.fills = [{ type: 'SOLID', color: rgb }]; else sw.visible = false; } return a; };
  const blockNote = async (parent, title, desc, b) => { const n = await kit('Doc/Block note', { Title: title, Description: desc || '', 'Show description': !!desc, 'Show badge': !!b }); parent.appendChild(n); if (b && n.type === 'INSTANCE') { const bi = n.findOne(x => x.type === 'INSTANCE' && /badge/i.test(x.name)); if (bi) await setP(bi, { Label: b }); } return n; };
  const familyHeader = async (parent, eyebrow, title, desc) => { const f = await kit('Doc/Family header', { Eyebrow: eyebrow, Title: title, Description: desc }); parent.appendChild(f); fillW(f); return f; };
  const dodont = async (parent, kind, why) => { const d = await kit('Doc/Do-dont', { Reason: why }, v => { const vals = Object.values(parseV(v.name)).join(' '); return kind === 'do' ? /(^|\s)do(\s|$)/i.test(vals) : /don/i.test(vals); }); parent.appendChild(d); fillW(d); return d; };

  // ---- Variants and instances.
  const parseV = n => Object.fromEntries(n.split(',').map(p => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  const pickV = async (id, want) => { const s = typeof id === 'string' ? await G(id) : id; if (s.type !== 'COMPONENT_SET') return s; const full = Object.assign(parseV(s.defaultVariant.name), want || {}); const m = (o) => s.children.find(v => { const p = parseV(v.name); return Object.entries(o).every(([k, x]) => p[k] === String(x)); }); return m(full) || m(want || {}) || s.defaultVariant; };
  const setInst = async (i, map) => { const keys = Object.keys(i.componentProperties); const o = {}; for (const [k, v] of Object.entries(map || {})) { const key = keys.find(x => x.split('#')[0] === k); if (key) o[key] = v; } if (Object.values(o).some(v => typeof v === 'string')) await loadFontsIn(i); if (Object.keys(o).length) i.setProperties(o); return i; };
  // Instance spec: { set, v: {variant props}, p: {other props}, text, texts: {layer: chars}, w, scale, name }.
  const inst = async sp => {
    const i = (await pickV(sp.set, sp.v)).createInstance(); await setInst(i, sp.p);
    if (sp.text !== undefined || sp.texts) { await loadFontsIn(i); if (sp.text !== undefined) { const t = i.findAll(n => n.type === 'TEXT' && n.visible)[0]; if (t) t.characters = String(sp.text); } for (const [ln, ch] of Object.entries(sp.texts || {})) { const t = i.findOne(n => n.type === 'TEXT' && n.name === ln); if (t) t.characters = ch; } }
    if (sp.w) i.resize(sp.w, i.height); if (sp.scale) i.rescale(sp.scale); if (sp.name) i.name = sp.name; return i;
  };
  const defInst = async (id, want, p) => setInst((await pickV(id, want)).createInstance(), p);
  const topName = mc => !mc ? '?' : (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name);
  const mainOf = n => { try { return n.mainComponent; } catch (e) { return null; } };

  // ---- Page, frame, block (templates/structure.md §1–§6; SYSTEM.md Part A §A3).
  const LEVEL = { 1: 'Foundations', 2: 'Parts', 3: 'Components', 4: 'Sections', 5: 'Layouts', 6: 'Screens', 9: 'Internal' };
  const pid = page => page.name.split(' ')[0];
  const crumb = page => (LEVEL[pid(page).split('.')[0]] || 'Guidance') + ' › ' + page.name; // workflow/DOCFRAMES.md §2 header row
  const titleOf = page => page.name.replace(/^[\d.]+ /, '');
  const owned = (page, n) => n.name === '.Main' || n.name.startsWith(page.name + ' · ');
  // Move every component or set out of a frame before it is removed: a doc rebuild never deletes a component.
  const rescue = (node, page) => { const cs = node.findAll(n => n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET')); for (const c of cs) { const ab = c.absoluteTransform; page.appendChild(c); c.x = ab[0][2]; c.y = ab[1][2]; } return cs.length; };
  const clearFrame = (page, name) => { let n = 0; for (const old of page.children.filter(x => x.type === 'FRAME' && x.name === name)) { n += rescue(old, page); old.remove(); } return n; };
  const rightEdge = page => page.children.reduce((m, n) => Math.max(m, n.x + n.width), 0);
  // Documented frame (templates/structure.md §2): Doc/Header, Body, Doc/Footer; workflow/DOCFRAMES.md §1 frame families.
  const newFrame = async (page, frameName, o) => {
    o = o || {}; const FN = page.name + ' · ' + frameName; clearFrame(page, FN);
    const fr = AL('VERTICAL', FN); fr.resize(o.width || num('doc/measure/frame'), 100); fr.counterAxisSizingMode = 'FIXED'; fr.primaryAxisSizingMode = 'AUTO'; fr.clipsContent = false; fill(fr, 'doc/surface/base');
    const x0 = rightEdge(page) + num('doc/space/canvas'); page.appendChild(fr); fr.x = x0; fr.y = 0;
    const h = await kit('Doc/Header', { Breadcrumb: o.crumb || crumb(page), Title: o.title || titleOf(page), Description: o.desc || '', 'Show description': !!o.desc }); fr.appendChild(h); fillW(h);
    const body = AL('VERTICAL', 'Body', 'doc/space/frame'); pad(body, 'doc/space/frame'); fr.appendChild(body); fillW(body);
    return { fr, body };
  };
  // A block without items keeps only its note: drop empty Items frames so they leave no gap (templates/structure.md §3).
  const finish = async fr => { for (const it of fr.findAll(n => n.type === 'FRAME' && n.name === 'Items' && n.children.length === 0)) it.remove(); const f = await kit('Doc/Footer', {}); fr.appendChild(f); fillW(f); return fr; }; // workflow/DOCFRAMES.md §8
  // Grow a frame to its widest content, never narrower than the frame measure (workflow/DOCFRAMES.md §1 frame families).
  const growTo = (fr, w) => { fr.resize(Math.max(num('doc/measure/frame'), Math.ceil(w) + 2 * num('doc/space/frame')), fr.height); fr.primaryAxisSizingMode = 'AUTO'; };
  const divider = parent => { const r = figma.createRectangle(); r.name = 'Divider'; r.resize(100, 1); fill(r, 'doc/border/subtle'); parent.appendChild(r); fillW(r); return r; };
  // Block (templates/structure.md §2–§3): 'Block · {title}' → Doc/Block note → Items; one Divider between blocks.
  const block = async (body, title, o) => {
    o = o || {}; if (body.children.some(c => c.name.startsWith('Block · '))) divider(body);
    const b = AL('VERTICAL', 'Block · ' + title, 'doc/space/block'); body.appendChild(b); fillW(b);
    if (o.note !== false) await blockNote(b, o.noteTitle || title, o.desc, o.badge);
    const items = AL(o.dir || 'VERTICAL', 'Items', o.gap || 'doc/space/group'); b.appendChild(items); fillW(items);
    if (o.wrap) { items.layoutWrap = 'WRAP'; bindN(items, 'counterAxisSpacing', o.gap || 'doc/space/group'); }
    return items;
  };
  // Stage: the surface real instances sit on (workflow/DOCFRAMES.md §1 doc/surface/stage); card: bordered specimen tile.
  const stage = (name, dir, gap) => { const s = AL(dir || 'HORIZONTAL', name, gap || 'doc/space/row'); fill(s, 'doc/surface/stage'); radius(s, 'doc/radius/surface'); pad(s, 'doc/space/group'); s.counterAxisAlignItems = dir === 'VERTICAL' ? 'MIN' : 'CENTER'; return s; };
  const card = (name, gap) => { const c = AL('VERTICAL', name, gap || 'doc/space/inline'); fill(c, 'doc/surface/specimen'); radius(c, 'doc/radius/surface'); pad(c, 'doc/space/row'); stroke(c); return c; };
  const vstage = (parent, name, dir) => { const s = stage(name || 'Example', dir, 'doc/space/group'); parent.appendChild(s); fillW(s); if (!dir || dir === 'HORIZONTAL') { s.layoutWrap = 'WRAP'; bindN(s, 'counterAxisSpacing', 'doc/space/group'); } return s; };

  // ---- Table (workflow/DOCFRAMES.md §6.2 rows of fixed-width cells, §6.3 rhythm, §6.4 token badges, §6.5 chips).
  // cols: [{ label, w: number | 'fill' }]; a cell is a node, { token }, { chips: [[name, Variable|null, rgb?]] } or text.
  const CODEISH = /^[a-z0-9-]+\/|^Show |=|#[0-9A-F]{6}/;
  const table = async (parent, colsDef, rows, name) => {
    const t = AL('VERTICAL', name || 'Table'); parent.appendChild(t); fillW(t); stroke(t); radius(t, 'doc/radius/surface'); t.clipsContent = true;
    const mkRow = async (cells, head) => {
      const r = AL('HORIZONTAL', head ? 'Header row' : 'Row', 'doc/space/row'); t.appendChild(r); fillW(r); r.counterAxisAlignItems = 'CENTER'; pad(r, 'doc/space/row', 'doc/space/compact');
      bindN(r, 'minHeight', head ? 'doc/table/header' : 'doc/table/row-min'); if (head) fill(r, 'doc/surface/header'); else topStroke(r);
      for (let i = 0; i < colsDef.length; i++) {
        const c = cells[i]; const cell = AL('HORIZONTAL', 'Cell · ' + colsDef[i].label, 'doc/space/tight'); cell.layoutWrap = 'WRAP'; bindN(cell, 'counterAxisSpacing', 'doc/space/tight'); cell.counterAxisAlignItems = 'CENTER'; r.appendChild(cell);
        if (colsDef[i].w === 'fill') fillW(cell); else { cell.resize(colsDef[i].w, 20); cell.primaryAxisSizingMode = 'FIXED'; cell.counterAxisSizingMode = 'AUTO'; }
        if (c && typeof c === 'object' && c.type) cell.appendChild(c);
        else if (c && c.token) cell.appendChild(await tokenBadge(c.token));
        else if (c && c.chips) { for (const ch of c.chips) cell.appendChild(await chip(ch[0], ch[1], ch[2])); if (!c.chips.length) await T(cell, '—', 'body/sm', 'doc/text/tertiary'); }
        else { const s = String(c === undefined || c === null ? '' : c); const tx = await T(cell, s, head ? 'label/sm' : CODEISH.test(s) ? 'code/sm' : 'body/sm', head ? 'doc/text/primary' : 'doc/text/secondary'); fillW(tx); tx.textAutoResize = 'HEIGHT'; }
      }
    };
    await mkRow(colsDef.map(c => c.label), true); for (const row of rows) await mkRow(row, false); return t;
  };
  const PROPCOLS = [{ label: 'Property', w: 200 }, { label: 'Type', w: 120 }, { label: 'Values', w: 320 }, { label: 'Default', w: 140 }, { label: 'What it changes', w: 'fill' }];
  // Property definitions are read from the set (or a standalone component), never from a variant.
  const defsOf = n => (n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && !(n.parent && n.parent.type === 'COMPONENT_SET'))) ? n.componentPropertyDefinitions : {};
  const propTable = async (parent, set, notes) => {
    const rows = Object.entries(defsOf(set)).map(([k, d]) => { const nm = k.split('#')[0]; const ty = { VARIANT: 'variant', BOOLEAN: 'boolean', TEXT: 'text', INSTANCE_SWAP: 'instance swap', SLOT: 'slot' }[d.type] || d.type.toLowerCase(); return [nm, ty, d.variantOptions ? d.variantOptions.join(', ') : d.type === 'BOOLEAN' ? 'true, false' : d.type === 'INSTANCE_SWAP' ? 'components' : 'text', d.type === 'INSTANCE_SWAP' ? 'swap' : String(d.defaultValue), (notes || {})[nm] || '—']; });
    return rows.length ? table(parent, PROPCOLS, rows, 'Property table') : null;
  };

  // ---- Guidelines: reading-oriented frame (workflow/DOCFRAMES.md §7, §15 visual right after its explanation).
  const guideFrame = async (page, title, o) => {
    o = o || {}; const { fr, body } = await newFrame(page, 'Guidelines', { title: title || titleOf(page) + ' guidelines', desc: o.desc });
    const col = AL('VERTICAL', 'Rich text', 'doc/space/block'); body.appendChild(col);
    if (o.wide) fillW(col); else { col.resize(num('doc/measure/reading'), 10); col.counterAxisSizingMode = 'FIXED'; col.primaryAxisSizingMode = 'AUTO'; }
    return { fr, col };
  };
  const topic = async (col, title, paras) => { if (col.children.length) divider(col); const t = AL('VERTICAL', 'Topic · ' + title, 'doc/space/row'); col.appendChild(t); fillW(t); await T(t, title, 'heading/lg', 'doc/text/primary', 'Title'); for (const p of paras || []) await T(t, p, 'body/md', 'doc/text/secondary', 'Paragraph', 'fill'); return t; };
  const caption = (t, s) => T(t, s, 'body/sm', 'doc/text/tertiary', 'Caption', 'fill');
  const bullets = async (t, items, numbered) => { const l = AL('VERTICAL', 'List', 'doc/space/tight'); t.appendChild(l); fillW(l); for (let i = 0; i < items.length; i++) await T(l, (numbered ? (i + 1) + '.  ' : '•  ') + items[i], 'body/md', 'doc/text/secondary', 'Item', 'fill'); return l; };
  // Do / don't pair (workflow/DOCFRAMES.md §15 Comparison): two stages built from real instances, Doc/Do-dont under each.
  const pairDD = async (parent, doBuild, doWhy, dontBuild, dontWhy) => {
    const r = AL('HORIZONTAL', 'Do and don’t', 'doc/space/group'); parent.appendChild(r); fillW(r); r.counterAxisAlignItems = 'MIN';
    for (const [kind, build, why, nm] of [['do', doBuild, doWhy, 'Do'], ['dont', dontBuild, dontWhy, 'Don’t']]) { const c = AL('VERTICAL', nm, 'doc/space/inline'); r.appendChild(c); fillW(c); const s = stage(kind === 'do' ? 'Example' : 'Don’t example', 'HORIZONTAL', 'doc/space/inline'); c.appendChild(s); fillW(s); await build(s); await dodont(c, kind, why); }
    return r;
  };
  // topics: [{ t: title, p: [paragraphs], b: [bullets], v: async topicFrame => visual, c: caption }]
  const guideTopics = async (page, topics, o) => { o = o || {}; const g = await guideFrame(page, o.title, o); for (const tp of topics) { const t = await topic(g.col, tp.t, tp.p || []); if (tp.b) await bullets(t, tp.b, tp.n); if (tp.v) await tp.v(t); if (tp.c) await caption(t, tp.c); } await finish(g.fr); return g.fr; };
  // Contrast for accessibility topics (WCAG 2 relative luminance), from a paint's resolved color.
  const lum = c => { const f = x => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contrast = (a, b) => { if (!a || !b) return null; const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round((x + 0.05) / (y + 0.05) * 100) / 100; };

  // ---- Layer names (SYSTEM.md Part C §4.1: no default names inside components). Opt-in; renames only.
  const DEFN = /^(Frame|Rectangle|Group|Ellipse|Vector|Line|Polygon|Star|Union|Subtract|Intersect|Exclude|Component|Instance)( \d+)?$/;
  const ICON_ROLES = ['Leading icon', 'Trailing icon', 'Close', 'Chevron', 'Icon'];
  const roleFor = (c, root, mcn) => {
    const refs = Object.values(c.componentPropertyReferences || {}).map(x => x.split('#')[0]);
    if (c.type === 'INSTANCE') {
      if ((/^Icon\//.test(c.name) || DEFN.test(c.name) || /^Icon\//.test(mcn || '')) && !ICON_ROLES.includes(c.name)) return refs.some(x => /leading/i.test(x)) ? 'Leading icon' : refs.some(x => /trailing/i.test(x)) ? 'Trailing icon' : /close/i.test(c.name) ? 'Close' : /chevron/i.test(c.name) ? 'Chevron' : 'Icon';
      if (c.name.includes('/') && mcn && !/^Icon\//.test(mcn) && (c.name === mcn || mcn.startsWith(c.name.split('/')[0] + '/'))) return mcn.split('/').pop();
      return null;
    }
    if (!DEFN.test(c.name)) return null;
    const kids = c.children || []; const vis = s => Array.isArray(s) && s.some(p => p.visible !== false);
    if (c.type === 'FRAME' || c.type === 'GROUP') { if (kids.some(k => k.type === 'TEXT' && /label|title|question/i.test(k.name)) && kids.length <= 3 && c.parent === root) return 'Label row'; if (vis(c.strokes) && (c.parent === root || (c.parent && c.parent.parent === root))) return 'Box'; if (kids.length && kids.every(k => k.type === 'INSTANCE')) return 'Icon group'; if (kids.length === 1 && kids[0].type === 'TEXT') return 'Text wrap'; return 'Content'; }
    if (c.type === 'RECTANGLE' || c.type === 'LINE') return (c.width <= 2 || c.height <= 2) ? 'Divider' : 'Shape';
    if (c.type === 'ELLIPSE') return c.width <= 12 ? 'Dot' : 'Circle';
    return 'Shape';
  };
  const autoName = root => { let n = 0; for (const r of root.type === 'COMPONENT_SET' ? root.children : [root]) { const q = [...(r.children || [])]; while (q.length) { const c = q.shift(); const nn = roleFor(c, r, c.type === 'INSTANCE' ? topName(mainOf(c)) : null); if (nn && nn !== c.name) { c.name = nn; n++; } if ('children' in c && c.type !== 'INSTANCE') q.push(...c.children); } } return n; };

  // ---- .Main (workflow/DOCFRAMES.md §9 .Main frame, §12.2 private header). parts: [[id, newName|null, purpose]].
  const mainFrame = async (page, parts) => {
    clearFrame(page, '.Main');
    const m = AL('VERTICAL', '.Main', 'doc/space/block'); page.appendChild(m); m.resize(num('doc/measure/reading'), 100); m.counterAxisSizingMode = 'AUTO'; m.primaryAxisSizingMode = 'AUTO'; m.minWidth = num('doc/measure/reading'); fill(m, 'doc/surface/base'); m.clipsContent = false;
    const h = await kit('Doc/Header', { Breadcrumb: crumb(page), Title: 'Private parts', Description: 'Internal building blocks of the published sets on this page. Edit them to change every published variant at once. Never use them directly in product screens.', 'Show description': true }); m.appendChild(h); fillW(h);
    const body = AL('VERTICAL', 'Body', 'doc/space/block'); pad(body, 'doc/space/frame'); m.appendChild(body); fillW(body);
    for (const [id, newName, purpose] of parts) { const n = await G(id); if (newName && /^\.Main\//.test(newName) && n.name !== newName) n.name = newName; const it = await block(body, n.name, { note: false, gap: 'doc/space/inline' }); await T(it, n.name + ' — ' + purpose, 'body/sm', 'doc/text/secondary', 'Purpose', 'fill'); const hold = AL('HORIZONTAL', 'Part · ' + n.name); it.appendChild(hold); hold.appendChild(n); }
    await finish(m); return m;
  };

  // ---- Arrange and audit (templates/structure.md §1; SYSTEM.md Part A §A3 order; workflow/DOCFRAMES.md §14).
  const ORDER = { component: ['Overview', 'Component', 'Anatomy', 'Guidelines'], layout: ['Overview', 'Layout', 'Anatomy', 'Guidelines'], foundation: ['Overview', 'Tokens', 'Guidelines'] };
  const typeOf = page => { const l = pid(page).split('.')[0]; return /^[234]$/.test(l) ? 'component' : l === '5' ? 'layout' : l === '1' ? 'foundation' : 'other'; };
  const finishPage = async (page, o) => {
    o = o || {}; const gap = num('doc/space/canvas'); const order = ['.Main'].concat((o.order || ORDER[typeOf(page)] || []).map(x => page.name + ' · ' + x));
    const mine = page.children.filter(n => n.type === 'FRAME' && owned(page, n)).sort((a, b) => { const ia = order.indexOf(a.name), ib = order.indexOf(b.name); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.x - b.x; });
    let x = 0; for (const f of mine) { f.x = x; f.y = 0; x += f.width + gap; }
    // Anything else on the canvas is moved (never changed) to the right of the doc frames, keeping its layout.
    const other = page.children.filter(n => !mine.includes(n)); if (other.length) { const minX = Math.min(...other.map(n => n.x)); if (minX < x) for (const n of other) n.x += x - minX; }
    const res = { page: page.name, frames: Object.fromEntries(mine.map(f => [f.name, f.id])), foreign: other.map(n => n.type + ' ' + n.name).slice(0, 10), warnings: W };
    const src = ROOT.getSharedPluginData('dscreate', 'audit');
    if (src && o.audit !== false) { const au = await (new AF('figma', 'PAGE', 'return await (' + src + ')(figma, PAGE);'))(figma, page.name); res.audit = au.result; res.checks = Object.fromEntries(Object.entries(au.checks || {}).filter(([, c]) => c.level !== 'info').map(([k, c]) => [k, c.level + ' ' + c.count + (c.examples && c.examples[0] ? ' · ' + c.examples[0] : '')])); }
    else res.audit = 'not run: cache tools/figma-audit.js under the "audit" key, or run it separately';
    return res;
  };

  return {
    OPTS, G, warn, warnings: W, V, num, paint, fill, fillAlpha, bindN, radius, pad, stroke, topStroke, AL, fillW, T, S, loadFontsIn,
    varName, rgb2hex, vById, tsName, esName, kit, setP, badge, tokenBadge, chip, callout, spec, measure, axis, blockNote, familyHeader, dodont,
    parseV, pickV, inst, defInst, setInst, topName, mainOf, pid, crumb, titleOf, owned, newFrame, block, finish, growTo, divider, stage, card, vstage,
    table, propTable, defsOf, guideFrame, topic, caption, bullets, pairDD, guideTopics, contrast, autoName, mainFrame, finishPage,
    _pure: { parseV, roleFor, pickStyle, rgb2hex, hex2rgb, contrast },
  };
}

// ==== PART 2: page builders. Cache it under 'docpages' (see the header). It extends the core API. ====
async function docpages(figma, D) {
  const { OPTS, G, warn, AL, fillW, T, bindN, pad, fill, fillAlpha, num, spec, axis, measure, callout, familyHeader, parseV, pickV, defInst,
    pid, crumb, titleOf, newFrame, block, finish, growTo, stage, card, table, propTable, defsOf, varName, vById, tsName, esName, rgb2hex,
    mainOf, topName, autoName, mainFrame, guideTopics, finishPage } = D;

  // ---- Matrix with axis labels (workflow/DOCFRAMES.md §9 Component frame, §12.3). Axis tiers come from run lengths:
  // a property constant within each column (row) line becomes a label tier; tiers whose value changes least
  // often sit outermost. When the innermost tier changes every line it uses Doc/Spec label, with a key.
  const axisTiers = (vs, key, props) => {
    const lines = [...new Set(vs.map(o => o[key]))].sort((a, b) => a - b); const groups = lines.map(l => vs.filter(o => o[key] === l));
    const varying = props.filter(pr => new Set(vs.map(o => o.p[pr])).size > 1);
    const cand = varying.filter(pr => groups.every(g => new Set(g.map(o => o.p[pr])).size === 1) && new Set(groups.map(g => g[0].p[pr])).size > 1);
    const runs = pr => { let r = 1; for (let i = 1; i < groups.length; i++) if (groups[i][0].p[pr] !== groups[i - 1][0].p[pr]) r++; return groups.length / r; };
    cand.sort((a, b) => runs(b) - runs(a)); return { lines, groups, cand, runs };
  };
  const matrix = async (parent, set) => {
    const vs = set.children.map(v => ({ v, p: parseV(v.name), x: Math.round(v.x), y: Math.round(v.y) })); const props = Object.keys(vs[0].p);
    const cols = axisTiers(vs, 'x', props), rows = axisTiers(vs, 'y', props);
    const m = figma.createFrame(); m.name = 'Matrix · ' + set.name; m.fills = []; m.clipsContent = false; parent.appendChild(m);
    const labels = []; // [node, tier, line index, vertical]
    const emit = async (TT, vertical) => { for (let ti = 0; ti < TT.cand.length; ti++) { const pr = TT.cand[ti]; const inner = ti === TT.cand.length - 1 && TT.cand.length > 1 && TT.runs(pr) < 2; let prev = null; for (let gi = 0; gi < TT.groups.length; gi++) { const g = TT.groups[gi]; const k = TT.cand.slice(0, ti + 1).map(q => g[0].p[q]).join('|'); if (k === prev) continue; prev = k; const n = inner ? await spec(g[0].p[pr]) : await axis(pr, g[0].p[pr]); m.appendChild(n); labels.push([n, ti, gi, vertical, g]); } } };
    await emit(cols, false); await emit(rows, true);
    const keys = []; for (const [TT, vertical] of [[cols, false], [rows, true]]) { const lp = TT.cand[TT.cand.length - 1]; if (TT.cand.length > 1 && TT.runs(lp) < 2) { const k = await axis(lp, vertical ? '↓ per row' : '→ per column'); m.appendChild(k); keys.push([k, TT.cand.length - 1, vertical]); } }
    const G8 = 8; const tierW = [], tierH = [];
    for (const [n, ti, , vertical] of labels.concat(keys.map(k => [k[0], k[1], 0, k[2]]))) { if (vertical) tierW[ti] = Math.max(tierW[ti] || 0, n.width); else tierH[ti] = Math.max(tierH[ti] || 0, n.height); }
    const off = (arr, ti) => arr.slice(0, ti).reduce((s, x) => s + (x || 0) + G8, 0);
    let topH = off(tierH, tierH.length), leftW = off(tierW, tierW.length);
    for (const [k, , vertical] of keys) { if (vertical) topH = Math.max(topH, k.height + G8); else leftW = Math.max(leftW, k.width + G8); } // keys sit in the empty corner
    m.resize(Math.ceil(set.width + leftW), Math.ceil(set.height + topH)); m.appendChild(set); set.x = leftW; set.y = topH;
    for (const [n, ti, gi, vertical, g] of labels) { if (vertical) { const h0 = Math.min(...g.map(o => o.v.height)); n.x = off(tierW, ti); n.y = topH + rows.lines[gi] + Math.max(0, (h0 - n.height) / 2); } else { n.x = leftW + cols.lines[gi]; n.y = off(tierH, ti); } }
    for (const [k, ti, vertical] of keys) { if (vertical) { k.x = off(tierW, ti); k.y = Math.max(0, topH - k.height - G8); } else { k.x = 0; k.y = off(tierH, ti); } }
    return { m, colProps: cols.cand, rowProps: rows.cand };
  };

  // ---- Component frame (SYSTEM.md Part A §A3; workflow/DOCFRAMES.md §9, §12.1 family header, §12.3 full matrix).
  // sets: [{ id, title, desc }]; extra: async (body) => more blocks (content options, color modes…).
  const compFrame = async (page, sets, o) => {
    o = o || {}; const { fr, body } = await newFrame(page, o.frameName || 'Component', { title: o.title, desc: o.desc }); let maxW = 0;
    for (const s of sets) {
      const node = await G(s.id); const items = await block(body, s.title || node.name, { note: false, gap: 'doc/space/block' });
      await familyHeader(items, crumb(page), s.title || node.name, s.desc);
      if (node.type === 'COMPONENT_SET' && node.children.length > 1) { const mx = await matrix(items, node); maxW = Math.max(maxW, mx.m.width); }
      else { const h = AL('HORIZONTAL', 'Set · ' + node.name); items.appendChild(h); h.appendChild(node); maxW = Math.max(maxW, node.width); }
    }
    if (o.extra) await o.extra(body); growTo(fr, maxW); await finish(fr); return fr;
  };
  // Overview (SYSTEM.md Part A §A3: hero + 2–4 examples in use + when to use).
  // o: { desc, hero: async stage => …, examples: [[title, caption, async stage => …, width?]], when: [], whenNot: [] }
  const overviewFrame = async (page, o) => {
    const { fr, body } = await newFrame(page, 'Overview', { title: o.title, desc: o.desc });
    const hi = await block(body, 'Hero', { note: false }); const hero = stage('Hero', 'HORIZONTAL', 'doc/space/group'); hi.appendChild(hero); fillW(hero); hero.primaryAxisAlignItems = 'CENTER'; pad(hero, 'doc/space/header'); await o.hero(hero);
    if ((o.examples || []).length) {
      const ex = await block(body, 'Examples in use', { desc: o.exNote || 'Real instances composed the way product screens use them.', dir: 'HORIZONTAL', wrap: true });
      for (const [name, cap, build, w] of o.examples) { const c = AL('VERTICAL', 'Example · ' + name, 'doc/space/inline'); ex.appendChild(c); const st = stage('Stage', 'VERTICAL', 'doc/space/inline'); c.appendChild(st); st.resize(w || o.exWidth || 388, 120); st.counterAxisSizingMode = 'FIXED'; st.primaryAxisSizingMode = 'AUTO'; await build(st); await T(c, name, 'label/sm', 'doc/text/primary', 'Title'); await T(c, cap, 'body/sm', 'doc/text/secondary', 'Caption', w || o.exWidth || 388); }
    }
    const wi = await block(body, 'When to use', { note: false, dir: 'HORIZONTAL' });
    for (const [h, list] of [['When to use', o.when || []], ['When not to use', o.whenNot || []]]) { const c = card(h); wi.appendChild(c); fillW(c); await T(c, h, 'label/md', 'doc/text/primary', 'Title'); for (const it of list) await T(c, '•  ' + it, 'body/md', 'doc/text/secondary', 'Item', 'fill'); }
    await finish(fr); return fr;
  };

  // ---- Anatomy (workflow/DOCFRAMES.md §12.4, §15 Anatomy diagram: labels, connector lines, layer names, roles).
  const describe = n => { const p = []; if ('layoutMode' in n && n.layoutMode !== 'NONE') p.push((n.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical') + ' auto layout'); if (n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE' && 'layoutSizingHorizontal' in n) p.push('W ' + n.layoutSizingHorizontal.toLowerCase() + ' · H ' + n.layoutSizingVertical.toLowerCase()); if (n.type === 'TEXT') p.push(typeof n.textStyleId === 'string' && tsName.get(n.textStyleId) || 'no text style'); if (n.type === 'INSTANCE') p.push('instance of ' + topName(mainOf(n))); for (const [k, v] of Object.entries(n.componentPropertyReferences || {})) p.push(k + ' ← ' + v.split('#')[0]); return p.join(' · '); };
  const treeText = (n, d, pre) => { pre = pre || ''; let s = ''; const kids = 'children' in n && n.type !== 'INSTANCE' ? n.children : []; kids.forEach((c, i) => { const last = i === kids.length - 1; s += pre + (last ? '└─ ' : '├─ ') + c.name + '   ' + describe(c) + '\n'; if (d > 1) s += treeText(c, d - 1, pre + (last ? '   ' : '│  ')); }); return s; };
  const anatomyDiagram = async (parent, comp, scale, depth) => {
    const st = stage('Diagram', 'HORIZONTAL', 'doc/space/group'); parent.appendChild(st); fillW(st);
    const wrap = figma.createFrame(); wrap.name = 'Specimen'; wrap.fills = []; wrap.clipsContent = false; st.appendChild(wrap);
    const i = comp.createInstance(); wrap.appendChild(i); i.rescale(scale || 2); const M = 48; wrap.resize(i.width + 2 * M, i.height + 2 * M); i.x = M; i.y = M;
    const targets = []; const walk = (n, d) => { for (const c of ('children' in n ? n.children : [])) { if (!c.visible) continue; targets.push(c); if (d > 1 && c.type !== 'INSTANCE' && 'children' in c) walk(c, d - 1); } }; walk(comp, depth || 1);
    const legend = AL('VERTICAL', 'Legend', 'doc/space/inline'); st.appendChild(legend); fillW(legend); const sc = scale || 2;
    const rows = [['Root', comp]].concat(targets.map(t => [t.name, t]));
    for (let k = 0; k < rows.length; k++) {
      const [nm, node] = rows[k]; const n = k + 1; const co = await callout(n); wrap.appendChild(co);
      if (node === comp) { co.x = 0; co.y = M + i.height / 2 - co.height / 2; }
      else {
        const bx = node.absoluteTransform[0][2] - comp.absoluteTransform[0][2], by = node.absoluteTransform[1][2] - comp.absoluteTransform[1][2];
        const top = n % 2 === 1; co.x = M + (bx + node.width / 2) * sc - co.width / 2; co.y = top ? 0 : M + i.height + M - co.height;
        const y1 = top ? co.height : M + (by + node.height) * sc, y2 = top ? M + by * sc : co.y; // connector line
        if (y2 - y1 > 2) { const ln = figma.createRectangle(); ln.name = 'Connector'; wrap.appendChild(ln); ln.resize(1, y2 - y1); ln.x = co.x + co.width / 2; ln.y = y1; fill(ln, 'doc/text/tertiary'); }
      }
      const r = AL('HORIZONTAL', 'Legend · ' + n, 'doc/space/inline'); legend.appendChild(r); fillW(r); r.appendChild(await callout(n));
      const tx = await T(r, nm + ' — ' + (describe(node) || node.type.toLowerCase()), 'body/sm', 'doc/text/secondary'); fillW(tx); tx.textAutoResize = 'HEIGHT';
    }
    return st;
  };
  const fmtRaw = async (n, k) => (n.boundVariables && n.boundVariables[k]) ? (await varName(n.boundVariables[k])) + ' = ' + Math.round(n[k] * 10) / 10 : Math.round(n[k] * 10) / 10 + ' (raw)';
  // Token map (SYSTEM.md Part A §A3: part × state → token chip with swatch). cols: [[label, component]].
  const tokenMap = async (parent, colsList, name) => {
    const layers = []; const walk = n => { for (const c of ('children' in n && n.type !== 'INSTANCE' ? n.children : [])) { if (!layers.includes(c.name)) layers.push(c.name); walk(c); } }; walk(colsList[0][1]);
    const cellFor = async (comp, ln, prop) => { const node = ln === 'Root' ? comp : comp.findOne(n => n.name === ln); if (!node || !(prop in node) || !Array.isArray(node[prop])) return { chips: [] }; const out = []; for (const p of node[prop]) { if (p.visible === false) continue; const b = p.boundVariables && p.boundVariables.color; if (b) out.push([await varName(b), vById.get(b.id) || null, p.color]); else if (p.type === 'SOLID') out.push(['raw ' + rgb2hex(p.color), null, p.color]); else out.push([p.type.toLowerCase(), null]); } return { chips: out }; };
    const rowsOut = [];
    for (const ln of ['Root'].concat(layers)) for (const [prop, lab] of [['fills', ln === 'Root' ? 'fill' : 'color'], ['strokes', 'border']]) { const cells = []; for (const [, c] of colsList) cells.push(await cellFor(c, ln, prop)); if (cells.every(c => !c.chips.length)) continue; rowsOut.push([ln + ' ' + lab].concat(cells)); }
    return table(parent, [{ label: 'Part', w: 220 }].concat(colsList.map(([l]) => ({ label: l, w: 'fill' }))), rowsOut, name || 'Token map');
  };
  // Composition (SYSTEM.md Part A §A3: Components and Sections open Anatomy with the Parts they contain).
  const composition = async (body, base, desc) => {
    const found = new Map();
    for (const ins of base.findAllWithCriteria({ types: ['INSTANCE'] })) { const mc = mainOf(ins); if (!mc) continue; const top = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc; if (/^(Icon|Doc)\//.test(top.name)) continue; let pg = top; while (pg && pg.type !== 'PAGE') pg = pg.parent; if (!found.has(top.id)) found.set(top.id, { top, mc, pg: pg && /^[1-6]\.\d+ /.test(pg.name) ? pg.name.split(' ')[0] : 'library', layers: new Set() }); found.get(top.id).layers.add(ins.name); }
    const items = await block(body, 'Composition', { badge: 'Built from', desc: desc || ('Built from ' + (found.size ? [...found.values()].map(f => f.top.name + ' (' + f.pg + ')').join(', ') : 'its own layers only') + '. Edit a part on its own page to change every instance here.'), dir: 'HORIZONTAL', wrap: true });
    for (const f of found.values()) { const c = AL('VERTICAL', 'Part · ' + f.top.name, 'doc/space/inline'); items.appendChild(c); const i = f.mc.createInstance(); c.appendChild(i); if (i.width > 360) i.rescale(360 / i.width); c.appendChild(await spec(f.pg)); await T(c, 'as ' + [...f.layers].slice(0, 3).join(', '), 'code/sm', 'doc/text/tertiary', 'Layers'); }
    return found;
  };
  // a: { set, base: {variant props}, scale, depth, treeDepth, notes: {prop: what it changes}, sizeProp, stateProp,
  //      stateCaps: {state: caption}, groupProp, composition: true|false|'description', extraBlocks: async (body, pick) => …,
  //      gaps: [[ds-create spec, this file]] }
  const anatomyFrame = async (page, a) => {
    const { fr, body } = await newFrame(page, 'Anatomy', { title: a.title || titleOf(page) + ' anatomy', desc: a.desc });
    const set = await G(a.set); const isSet = set.type === 'COMPONENT_SET'; const VV = o => pickV(set, Object.assign({}, a.base || {}, o || {})); const base = await VV({});
    if (a.composition !== false && (a.composition || /^[345]\./.test(pid(page)))) await composition(body, base, typeof a.composition === 'string' ? a.composition : null);
    let it = await block(body, 'Anatomy diagram', { noteTitle: 'Anatomy', desc: (a.baseLabel || base.name) + '. Numbers match the layer names in the component.' });
    await anatomyDiagram(it, base, a.scale || 2, a.depth || 1);
    const tc = card('Tree'); it.appendChild(tc); fillW(tc);
    const geo = 'layoutMode' in base && base.layoutMode !== 'NONE' ? ' · padding ' + base.paddingTop + '/' + base.paddingLeft + ' · gap ' + base.itemSpacing : '';
    await T(tc, set.name + '   ' + (describe(base) || base.type.toLowerCase()) + ' · ' + Math.round(base.width) + ' × ' + Math.round(base.height) + geo + '\n' + treeText(base, a.treeDepth || 3), 'code/sm', 'doc/text/secondary', 'Tree', 'fill');
    it = await block(body, 'Properties', { desc: Object.keys(defsOf(set)).length ? 'Every property of the ' + set.name + ' set, with what it changes.' : 'The component has no properties.' });
    await propTable(it, set, a.notes);
    const opts = p => isSet && set.componentPropertyDefinitions[p] ? set.componentPropertyDefinitions[p].variantOptions : null;
    if (a.sizeProp && opts(a.sizeProp)) {
      it = await block(body, 'Sizes', { desc: 'One instance per size with its measurements; (raw) means the value is not bound to a variable.', dir: 'HORIZONTAL' }); it.counterAxisAlignItems = 'MAX';
      for (const sz of opts(a.sizeProp)) { const comp = await VV({ [a.sizeProp]: sz }); const c = AL('VERTICAL', 'Size · ' + sz, 'doc/space/inline'); it.appendChild(c); c.appendChild(comp.createInstance()); c.appendChild(await axis(a.sizeProp, sz)); c.appendChild(await measure('height', await fmtRaw(comp, 'height'))); c.appendChild(await measure('width', Math.round(comp.width))); if (comp.layoutMode && comp.layoutMode !== 'NONE') { c.appendChild(await measure('padding', await fmtRaw(comp, 'paddingLeft'))); c.appendChild(await measure('gap', await fmtRaw(comp, 'itemSpacing'))); } const tx = comp.findOne(n => n.type === 'TEXT'); if (tx) c.appendChild(await measure('text', tsName.get(tx.textStyleId) || 'no style')); }
    } else await block(body, 'Sizes', { noteTitle: 'Size', desc: 'One size: ' + Math.round(base.width) + ' × ' + Math.round(base.height) + (a.sizeNote ? '. ' + a.sizeNote : '.') });
    const stProp = a.stateProp && opts(a.stateProp) ? a.stateProp : null; const groups = a.groupProp && opts(a.groupProp) ? opts(a.groupProp) : [null];
    if (stProp) {
      it = await block(body, 'States', { desc: 'Each ' + stProp + ' value, captioned with what changes.' });
      for (const gv of groups) { const r = AL('HORIZONTAL', 'States' + (gv ? ' · ' + gv : ''), 'doc/space/block'); it.appendChild(r); r.counterAxisAlignItems = 'MIN'; if (gv) r.appendChild(await axis(a.groupProp, gv)); for (const s of opts(stProp)) { const c = AL('VERTICAL', 'State · ' + s, 'doc/space/inline'); r.appendChild(c); c.appendChild((await VV(Object.assign({ [stProp]: s }, gv ? { [a.groupProp]: gv } : {}))).createInstance()); c.appendChild(await spec(s)); if ((a.stateCaps || {})[s]) await T(c, a.stateCaps[s], 'body/sm', 'doc/text/secondary', 'Caption', 160); } }
    } else await block(body, 'States', { desc: a.stateNote || 'No interaction states are designed; the component has one look.' });
    it = await block(body, 'Token map', { desc: 'Color variables read from the component. “raw” means the value is not bound to a variable.' });
    for (const gv of groups) { if (gv) await T(it, a.groupProp + '=' + gv, 'label/md', 'doc/text/primary', 'Heading'); const cl = []; if (stProp) { for (const s of opts(stProp)) cl.push([s, await VV(Object.assign({ [stProp]: s }, gv ? { [a.groupProp]: gv } : {}))]); } else cl.push([a.baseLabel || 'default', await VV(gv ? { [a.groupProp]: gv } : {})]); await tokenMap(it, cl, 'Token map' + (gv ? ' · ' + gv : '')); }
    const b = base.boundVariables || {}; const sh = [['Root radius', b.topLeftRadius ? await varName(b.topLeftRadius) : ('cornerRadius' in base ? (typeof base.cornerRadius === 'number' ? base.cornerRadius : 'mixed') + ' (raw)' : '—')], ['Root size', Math.round(base.width) + ' × ' + Math.round(base.height)]];
    if (base.layoutMode && base.layoutMode !== 'NONE') { sh.push(['Padding', (await fmtRaw(base, 'paddingLeft')) + ' / ' + (await fmtRaw(base, 'paddingTop'))]); sh.push(['Gap', await fmtRaw(base, 'itemSpacing')]); }
    if (base.strokes && base.strokes.length) sh.push(['Border width', base.strokeWeight + (b.strokeTopWeight || b.strokeWeight ? ' → ' + await varName(b.strokeTopWeight || b.strokeWeight) : ' (raw)')]);
    sh.push(['Effects', base.effectStyleId ? esName.get(base.effectStyleId) || 'library effect style' : (base.effects && base.effects.length ? 'effect without a style' : 'none')]);
    for (const tx of base.findAll(n => n.type === 'TEXT').slice(0, 6)) sh.push([tx.name + ' text style', tsName.get(tx.textStyleId) || 'none']);
    await T(it, 'Shape, size and type', 'label/md', 'doc/text/primary', 'Heading'); await table(it, [{ label: 'Part', w: 220 }, { label: 'Token or value', w: 'fill' }], sh, 'Shape table');
    if (a.extraBlocks) await a.extraBlocks(body, VV);
    if (a.gaps && a.gaps.length) { it = await block(body, 'Spec gaps', { noteTitle: 'Compared with the ds-create spec', badge: 'Gap', desc: 'What the spec defines that this component does not have, and parts only this file has. Nothing here was added to the component.' }); await table(it, [{ label: 'ds-create spec', w: 400 }, { label: 'This file', w: 'fill' }], a.gaps, 'Gap table'); }
    await finish(fr); return fr;
  };

  // ---- Whole component page: Parts, Components, Sections (SYSTEM.md Part A §A3 component page template).
  // cfg: { sets: [[id, title, desc]], main: [[id, newName, purpose]], rename, desc, hero, examples, exWidth, when, whenNot,
  //        compExtra: async body, anat: {anatomyFrame options}, anatExtra: async body, otherScale, topics, skip: ['main','comp','ov','anat','gl'] }
  const sectionPage = async (pageId, cfg) => {
    const t0 = Date.now(); const page = await G(pageId); await figma.setCurrentPageAsync(page); const skip = cfg.skip || []; const title = titleOf(page);
    let ren = 0; if (cfg.rename === true) for (const [id] of cfg.sets) ren += autoName(await G(id));
    if (cfg.main && !skip.includes('main')) await mainFrame(page, cfg.main);
    if (!skip.includes('comp')) await compFrame(page, cfg.sets.map(([id, t, d]) => ({ id, title: t, desc: d })), { extra: cfg.compExtra });
    if (!skip.includes('ov')) await overviewFrame(page, { desc: cfg.desc, hero: cfg.hero || (async h => h.appendChild(await defInst(cfg.sets[0][0]))), examples: cfg.examples || [], exWidth: cfg.exWidth, when: cfg.when, whenNot: cfg.whenNot });
    if (!skip.includes('anat')) { const others = cfg.sets.slice(1); await anatomyFrame(page, Object.assign({ set: cfg.sets[0][0], scale: 1, depth: 1 }, cfg.anat || {}, { extraBlocks: async (body, VV) => {
      if (cfg.anat && cfg.anat.extraBlocks) await cfg.anat.extraBlocks(body, VV); if (cfg.anatExtra) await cfg.anatExtra(body);
      for (const [id, t] of others) { const n = await G(id); const comp = n.type === 'COMPONENT_SET' ? n.defaultVariant : n; const it = await block(body, t, { desc: n.type === 'COMPONENT_SET' ? n.children.length + ' variants · ' + Object.keys(n.componentPropertyDefinitions).map(k => k.split('#')[0]).join(', ') : 'Single component' }); await anatomyDiagram(it, comp, cfg.otherScale || 1, 1); if (n.type === 'COMPONENT_SET' && n.children.length <= 6) await tokenMap(it, n.children.map(v => [v.name.replace(/^[^=]+=/, ''), v]), 'Token map · ' + t); }
    } })); }
    if (!skip.includes('gl')) await guideTopics(page, cfg.topics || [], { title: title + ' guidelines' });
    const r = await finishPage(page); r.renamed = ren; r.ms = Date.now() - t0; return r;
  };

  // ---- Layout pages (SYSTEM.md Part A §A3 layout template; layouts/00-layouts.md §3).
  // Grid overlay: grid styles don't show in exports, so columns are drawn on top of the instance, in the doc frame.
  const gridColumn = OPTS.gridColumn ? await G(OPTS.gridColumn) : null;
  const gridStyles = await figma.getLocalGridStylesAsync();
  const gridFor = (comp, bp) => { const gs = gridStyles.find(s => s.name === 'grid/' + bp); const g = (gs && gs.layoutGrids.find(x => x.pattern === 'COLUMNS')) || (comp.layoutGrids || []).find(x => x.pattern === 'COLUMNS'); if (g) return { count: g.count, gutter: g.gutterSize, margin: g.offset || 0 }; warn('no grid/' + bp + ' style or column grid on ' + comp.name + ': 4 columns, 16 gutter, 16 margin drawn'); return { count: 4, gutter: 16, margin: 16 }; };
  const gridView = async (comp, bp) => {
    const w = figma.createFrame(); w.name = 'Grid view · ' + comp.name; w.fills = []; w.clipsContent = false; const i = comp.createInstance(); w.appendChild(i); w.resize(i.width, i.height);
    const g = gridFor(comp, bp); const cw = (i.width - 2 * g.margin - (g.count - 1) * g.gutter) / g.count;
    if (!gridColumn) warn('OPTS.gridColumn not given: grid columns drawn as rectangles');
    for (let k = 0; k < g.count; k++) { const c = gridColumn ? gridColumn.createInstance() : figma.createRectangle(); c.name = gridColumn ? c.name : 'Grid column'; w.appendChild(c); c.resize(cw, i.height); c.x = g.margin + k * (cw + g.gutter); c.y = 0; if (!gridColumn) fillAlpha(c, 'doc/status/dont', 0.12); }
    return { w, g };
  };
  // sets: [{ id, title, desc, keep: 'section name' when the main component must stay where it is }]
  const layoutFrame = async (page, sets) => {
    const { fr, body } = await newFrame(page, 'Layout'); let mw = 0;
    for (const s of sets) {
      const node = await G(s.id); const items = await block(body, s.title || node.name, { note: false, gap: 'doc/space/block' });
      await familyHeader(items, crumb(page), s.title || node.name, s.desc + (s.keep ? ' The main component stays in “' + s.keep + '”; it is shown here as instances.' : ''));
      if (!s.keep) { const h = AL('HORIZONTAL', 'Set · ' + node.name); items.appendChild(h); h.appendChild(node); mw = Math.max(mw, node.width); }
      const comps = (node.type === 'COMPONENT_SET' ? node.children.slice() : [node]).sort((a, b) => b.width - a.width);
      const rw = AL('HORIZONTAL', 'Breakpoints · ' + node.name, 'doc/space/group'); items.appendChild(rw); fillW(rw); rw.layoutWrap = 'WRAP'; bindN(rw, 'counterAxisSpacing', 'doc/space/group');
      for (const c of comps) { const bp = (parseV(c.name).Breakpoint) || 'mobile'; const col = AL('VERTICAL', 'Breakpoint · ' + c.name, 'doc/space/inline'); rw.appendChild(col); const { w, g } = await gridView(c, bp); col.appendChild(await axis('Breakpoint', bp + ' · ' + Math.round(c.width) + ' · ' + g.count + ' cols · gutter ' + g.gutter + ' · margin ' + g.margin)); col.appendChild(w); if (node.type === 'COMPONENT_SET') col.appendChild(await spec(c.name)); mw = Math.max(mw, c.width); }
    }
    growTo(fr, mw); await finish(fr); return fr;
  };
  // Region table: top-level regions of a layout variant (layouts/00-layouts.md §3 Region map). fixed: RegExp of
  // region names that stay at an edge; everything else scrolls.
  const regionTable = async (parent, comp, fixed) => { const rx = fixed || /status|header|app bar|top bar|indicator|navigation|footer|bottom|tab bar/i; const rows = comp.children.map(k => [k.name, k.type === 'INSTANCE' ? 'instance of ' + topName(mainOf(k)) : k.type.toLowerCase(), Math.round(k.width) + ' × ' + Math.round(k.height), rx.test(k.name + ' ' + (k.type === 'INSTANCE' ? topName(mainOf(k)) : '')) ? 'stays (fixed to its edge)' : 'scrolls with the page']); return table(parent, [{ label: 'Region', w: 220 }, { label: 'Built from', w: 320 }, { label: 'Size', w: 160 }, { label: 'Behavior', w: 'fill' }], rows, 'Region map'); };
  // cfg: { sets, main, rename, desc, hero, examples, when, whenNot, scale, landmarks, gaps, anatExtra: async body, topics, skip: ['main','lay','ov','anat','gl'] }
  const layoutPage = async (pageId, cfg) => {
    const t0 = Date.now(); const page = await G(pageId); await figma.setCurrentPageAsync(page); const skip = cfg.skip || []; const title = titleOf(page);
    let ren = 0; if (cfg.rename === true) for (const s of cfg.sets) if (!s.keep) ren += autoName(await G(s.id));
    if (cfg.main && !skip.includes('main')) await mainFrame(page, cfg.main);
    if (!skip.includes('lay')) await layoutFrame(page, cfg.sets);
    if (!skip.includes('ov')) await overviewFrame(page, { desc: cfg.desc, hero: cfg.hero || (async h => h.appendChild(await defInst(cfg.sets[0].id))), examples: cfg.examples || [], exWidth: cfg.exWidth, when: cfg.when, whenNot: cfg.whenNot });
    if (!skip.includes('anat')) {
      const first = await G(cfg.sets[0].id); const base = first.type === 'COMPONENT_SET' ? first.defaultVariant : first;
      const { fr, body } = await newFrame(page, 'Anatomy', { title: title + ' anatomy' });
      await composition(body, base);
      let it = await block(body, 'Region map', { noteTitle: 'Regions', desc: 'Top-level regions of ' + base.name + ', numbered to match the layer names.' }); await anatomyDiagram(it, base, cfg.scale || 0.6, 1); await regionTable(it, base, cfg.fixed);
      if (cfg.anatExtra) await cfg.anatExtra(body);
      it = await block(body, 'Properties', { desc: Object.keys(defsOf(first)).length ? 'Every property of ' + first.name + '.' : 'No properties.' }); await propTable(it, first, cfg.notes);
      await block(body, 'Landmarks and focus order', { desc: cfg.landmarks || 'Header (banner) first, then the main content in reading order, then the bottom action or navigation. Reading order never changes when content grows.' });
      it = await block(body, 'Token map', { desc: 'Colors read from the layout’s own layers.' }); await tokenMap(it, [['default', base]], 'Token map');
      if (cfg.gaps && cfg.gaps.length) { it = await block(body, 'Spec gaps', { noteTitle: 'Compared with the ds-create spec', badge: 'Gap', desc: 'Nothing here was added to the component.' }); await table(it, [{ label: 'ds-create spec', w: 400 }, { label: 'This file', w: 'fill' }], cfg.gaps, 'Gap table'); }
      await finish(fr);
    }
    if (!skip.includes('gl')) await guideTopics(page, cfg.topics || [], { title: title + ' guidelines' });
    const r = await finishPage(page); r.renamed = ren; r.ms = Date.now() - t0; return r;
  };

  return Object.assign(D, {
    axisTiers, matrix, compFrame, overviewFrame, describe, treeText, anatomyDiagram, tokenMap, composition, anatomyFrame,
    sectionPage, gridView, layoutFrame, regionTable, layoutPage, _pure: Object.assign(D._pure, { axisTiers }),
  });
}

// =====================================================================================================
// PART 3 · docfoundations: foundation and guidance specimens (workflow/DOCFRAMES.md §5 palette rows, §6 variable
// tables, foundations/00-foundations.md · Overview / · Tokens). Cache it like the other parts:
//   figma.root.setSharedPluginData('dscreate', 'docfoundations', docfoundations.toString());
// Load: const F = await (new AF('figma', 'D', 'return await (' + L('docfoundations') + ')(figma, D);'))(figma, D);
// =====================================================================================================
async function docfoundations(figma, D) {
  const { G, AL, fillW, T, fill, num, kit, setP, block, chip, rgb2hex, vById, tsName, loadFontsIn, warn, stage, card, radius, pad, stroke, topStroke, bindN, tokenBadge } = D;
  const cols = await figma.variables.getLocalVariableCollectionsAsync(); const colById = new Map(cols.map(c => [c.id, c]));
  const modesOf = v => colById.get(v.variableCollectionId).modes;
  const resolve = (v, modeId, d) => { if (!v || (d || 0) > 10) return null; const col = colById.get(v.variableCollectionId); const val = v.valuesByMode[modeId] !== undefined ? v.valuesByMode[modeId] : v.valuesByMode[col.defaultModeId]; if (val && val.type === 'VARIABLE_ALIAS') { const t = vById.get(val.id); if (!t) return null; const tc = colById.get(t.variableCollectionId); return resolve(t, tc.modes.find(m => m.name === (col.modes.find(x => x.modeId === modeId) || {}).name) ? tc.modes.find(m => m.name === col.modes.find(x => x.modeId === modeId).name).modeId : tc.defaultModeId, (d || 0) + 1); } return val; };
  const lum = c => { const f = x => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round((x + 0.05) / (y + 0.05) * 10) / 10; };
  const WHITE = { r: 1, g: 1, b: 1 }, BLACK = { r: 0, g: 0, b: 0 };
  // Palette row (workflow/DOCFRAMES.md §5): Doc/Row note at doc/measure/row-note, then Doc/Color swatch per step, bound (§5.1).
  const paletteRow = async (parent, title, desc, vars, badgeLabel) => {
    const row = AL('HORIZONTAL', 'Palette row · ' + title, 'doc/space/group'); parent.appendChild(row); fillW(row); row.counterAxisAlignItems = 'MIN';
    const note = await kit('Doc/Row note', { Heading: title, Body: desc || '', 'Show badge': !!badgeLabel }); row.appendChild(note);
    if (badgeLabel && note.type === 'INSTANCE') { const b = note.findOne(x => x.type === 'INSTANCE'); if (b) await setP(b, { Label: badgeLabel }); }
    const sw = AL('HORIZONTAL', 'Swatches', 'doc/space/inline'); row.appendChild(sw); // one row: a long family widens the frame (call growTo), never wraps
    for (const v of vars) {
      const c = resolve(v, modesOf(v)[0].modeId); const rgb = c && 'r' in c ? c : null;
      const s = await kit('Doc/Color swatch', { Step: v.name.split('/').pop(), Value: rgb ? rgb2hex(rgb) : '—', Contrast: rgb ? ('W ' + ratio(rgb, WHITE) + ' · B ' + ratio(rgb, BLACK)) : '' });
      sw.appendChild(s); const sp = s.type === 'INSTANCE' ? s.findOne(n => n.name === 'Specimen') : null; if (sp) sp.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', v)];
      if (sp && rgb) { const ct = sp.findOne(n => n.type === 'TEXT'); if (ct) { await loadFontsIn(sp); fill(ct, ratio(rgb, WHITE) >= ratio(rgb, BLACK) ? 'color/text/on-solid' : 'doc/text/specimen'); } }
    }
    return row;
  };
  // Variable table (workflow/DOCFRAMES.md §6): Name (token badge; children with Doc/Tree connector) │ one column per mode │ Usage.
  const varTable = async (parent, vars, o) => {
    o = o || {}; const modes = o.modes || modesOf(vars[0]); const nameW = o.nameW || 360, modeW = o.modeW || 300;
    const t = AL('VERTICAL', o.name || 'Variable table'); parent.appendChild(t); fillW(t); stroke(t); radius(t, 'doc/radius/surface'); t.clipsContent = true;
    const names = new Set(vars.map(v => v.name)); const parentOf = n => { const p = n.split('/').slice(0, -1).join('/'); return names.has(p) ? p : null; };
    const kids = new Map(); for (const v of vars) { const p = parentOf(v.name); if (p) { if (!kids.has(p)) kids.set(p, []); kids.get(p).push(v); } }
    const mkRow = async (head) => { const r = AL('HORIZONTAL', head ? 'Header row' : 'Row', 'doc/space/row'); t.appendChild(r); fillW(r); r.counterAxisAlignItems = 'CENTER'; pad(r, 'doc/space/row', 'doc/space/compact'); bindN(r, 'minHeight', head ? 'doc/table/header' : 'doc/table/row-min'); if (head) fill(r, 'doc/surface/header'); else topStroke(r); return r; };
    const cell = (r, label, w) => { const c = AL('HORIZONTAL', 'Cell · ' + label, 'doc/space/tight'); r.appendChild(c); c.counterAxisAlignItems = 'CENTER'; if (w === 'fill') fillW(c); else { c.resize(w, 20); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; } return c; };
    const h = await mkRow(true); await T(cell(h, 'Name', nameW), 'Name', 'label/sm', 'doc/text/primary'); for (const m of modes) await T(cell(h, m.name, modeW), m.name + (o.unsupported && o.unsupported.includes(m.name) ? ' (not supported)' : ''), 'label/sm', 'doc/text/primary'); const uh = await T(cell(h, 'Usage', 'fill'), 'Usage', 'label/sm', 'doc/text/primary');
    const valueCell = async (c, v, m) => {
      const raw = v.valuesByMode[m.modeId] !== undefined ? v.valuesByMode[m.modeId] : v.valuesByMode[colById.get(v.variableCollectionId).defaultModeId];
      if (raw && raw.type === 'VARIABLE_ALIAS') { const tv = vById.get(raw.id); const res = resolve(v, m.modeId); c.appendChild(await chip(tv ? tv.name : 'external', tv && tv.resolvedType === 'COLOR' ? tv : null, res && 'r' in res ? res : null)); if (tv && tv.resolvedType !== 'COLOR') await T(c, '= ' + JSON.stringify(res), 'code/sm', 'doc/text/tertiary'); return; }
      if (raw && typeof raw === 'object' && 'r' in raw) { c.appendChild(await chip(rgb2hex(raw), null, raw)); return; }
      await T(c, raw === undefined ? '—' : String(raw), 'code/sm', 'doc/text/secondary');
    };
    const emit = async (v, depth, last) => {
      const r = await mkRow(false); const nc = cell(r, 'Name', nameW);
      if (depth) { const tc = await kit('Doc/Tree connector', {}, x => /last/.test(x.name) === !!last); nc.appendChild(tc); nc.appendChild(await tokenBadge(v.name.split('/').pop())); } else nc.appendChild(await tokenBadge(v.name));
      for (const m of modes) await valueCell(cell(r, m.name, modeW), v, m);
      const u = await T(cell(r, 'Usage', 'fill'), v.description || '—', 'body/sm', v.description ? 'doc/text/secondary' : 'doc/text/tertiary'); fillW(u); u.textAutoResize = 'HEIGHT';
      const ch = kids.get(v.name) || []; for (let i = 0; i < ch.length; i++) await emit(ch[i], depth + 1, i === ch.length - 1);
    };
    for (const v of vars) if (!parentOf(v.name)) await emit(v, 0, false);
    return t;
  };
  // Type rows: one Doc/Type row per text style, the sample set in that style.
  // '14 / 20 (140%)': percent line heights resolved to pixels and rounded; letter spacing appended when not 0.
  const lhText = s => { const lh = s.lineHeight.unit === 'PIXELS' ? Math.round(s.lineHeight.value) + '' : s.lineHeight.unit === 'PERCENT' ? Math.round(s.fontSize * s.lineHeight.value / 100) + ' (' + Math.round(s.lineHeight.value) + '%)' : 'auto'; const ls = s.letterSpacing && s.letterSpacing.value ? ' · ' + (Math.round(s.letterSpacing.value * 10) / 10) + (s.letterSpacing.unit === 'PERCENT' ? '%' : 'px') : ''; return s.fontSize + ' / ' + lh + ls; };
  const typeRows = async (parent, styles, sample) => {
    const list = AL('VERTICAL', 'Type rows'); parent.appendChild(list); fillW(list);
    for (const s of styles) {
      const r = await kit('Doc/Type row', { Name: s.name, Sample: sample || 'The quick brown fox jumps', Meta: lhText(s) + ' · ' + s.fontName.family + ' ' + s.fontName.style });
      list.appendChild(r); fillW(r); const sm = r.type === 'INSTANCE' ? r.findOne(n => n.name === 'Sample') : null; if (sm) { try { await figma.loadFontAsync(s.fontName); await sm.setTextStyleIdAsync(s.id); } catch (e) { warn('type row ' + s.name + ': ' + e.message); } }
    }
    return list;
  };
  // Measure rows: Doc/Measure per number variable, the bar's width bound to it (spacing, sizes); radius shows a box.
  const measureRows = async (parent, vars, kind, o) => {
    const list = AL(kind === 'radius' ? 'HORIZONTAL' : 'VERTICAL', 'Measures', kind === 'radius' ? 'doc/space/group' : 'doc/space/inline'); parent.appendChild(list); fillW(list); if (kind === 'radius') { list.layoutWrap = 'WRAP'; bindN(list, 'counterAxisSpacing', 'doc/space/group'); }
    for (const v of vars) {
      const val = resolve(v, modesOf(v)[0].modeId);
      if (kind === 'radius') { const c = AL('VERTICAL', 'Radius · ' + v.name, 'doc/space/inline'); list.appendChild(c); const box = figma.createFrame(); box.name = 'Box'; box.resize(96, 64); fill(box, 'doc/surface/specimen'); stroke(box, 'doc/text/accent'); for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) box.setBoundVariable(k, v); c.appendChild(box); c.appendChild(await tokenBadge(v.name)); await T(c, String(val), 'code/sm', 'doc/text/tertiary'); continue; }
      // The bar is a frame whose left padding is bound to the token: space variables are often scoped to gaps only,
      // and a width binding on a gap-scoped variable is silently dropped. Padding takes the binding in every scope set.
      const m = AL('HORIZONTAL', 'Measure · ' + v.name, 'doc/space/row'); list.appendChild(m); m.counterAxisAlignItems = 'CENTER';
      const tk = await T(m, v.name, 'code/sm', 'doc/text/primary', 'Token', num('doc/table/name') / 2);
      const bar = AL('HORIZONTAL', 'Bar'); m.appendChild(bar); fill(bar, 'doc/text/accent'); bar.resize(1, 12); bar.counterAxisSizingMode = 'FIXED'; bar.primaryAxisSizingMode = 'AUTO';
      if (typeof val === 'number' && val > 0) { bar.setBoundVariable('paddingLeft', v); if (!(bar.boundVariables && bar.boundVariables.paddingLeft)) { bar.paddingLeft = val; warn(v.name + ': bar drawn raw (binding refused)'); } } else bar.visible = false;
      await T(m, String(val) + (o && o.unit ? ' · ' + (val / o.unit) + '×' : ''), 'code/sm', 'doc/text/tertiary', 'Value');
    }
    return list;
  };
  // Effect tiles: a card per effect style, the style applied (workflow/DOCFRAMES.md §5.1 visual).
  const effectTiles = async (parent, styles) => {
    const list = AL('HORIZONTAL', 'Effects', 'doc/space/block'); parent.appendChild(list); fillW(list); list.layoutWrap = 'WRAP'; bindN(list, 'counterAxisSpacing', 'doc/space/block'); pad(list, 'doc/space/group');
    for (const s of styles) { const c = AL('VERTICAL', 'Effect · ' + s.name, 'doc/space/inline'); list.appendChild(c); const box = figma.createFrame(); box.name = 'Surface'; box.resize(200, 120); fill(box, 'doc/surface/specimen'); radius(box, 'doc/radius/surface'); await box.setEffectStyleIdAsync(s.id); c.appendChild(box); c.appendChild(await tokenBadge(s.name)); if (s.description) await T(c, s.description, 'body/sm', 'doc/text/secondary', 'Usage', 200); }
    return list;
  };
  // Paint-style tiles (gradients): the style applied to a swatch.
  const paintTiles = async (parent, styles) => {
    const list = AL('HORIZONTAL', 'Paint styles', 'doc/space/group'); parent.appendChild(list); fillW(list); list.layoutWrap = 'WRAP'; bindN(list, 'counterAxisSpacing', 'doc/space/group');
    for (const s of styles) { const c = AL('VERTICAL', 'Style · ' + s.name, 'doc/space/inline'); list.appendChild(c); const box = figma.createFrame(); box.name = 'Specimen'; box.resize(160, 96); radius(box, 'doc/radius/surface'); await box.setFillStyleIdAsync(s.id); c.appendChild(box); c.appendChild(await tokenBadge(s.name)); }
    return list;
  };
  // Step order without Intl (the plugin sandbox ignores localeCompare's numeric option): white first, numbers ascending, black last.
  const stepKey = n => { const l = n.split('/').pop(); return l === 'white' ? -1 : l === 'black' ? 1e6 : /^\d+$/.test(l) ? +l : 5e5; };
  const byStep = (a, b) => { const pa = a.name.split('/').slice(0, -1).join('/'), pb = b.name.split('/').slice(0, -1).join('/'); return pa === pb ? stepKey(a.name) - stepKey(b.name) : (pa < pb ? -1 : 1); };
  const varsIn = async (collectionName, prefix) => { const all = await figma.variables.getLocalVariablesAsync(); const col = cols.find(c => c.name === collectionName); return all.filter(v => col && v.variableCollectionId === col.id && (!prefix || v.name.startsWith(prefix))).sort(byStep); }; // step order (50 before 100), not creation order
  return Object.assign(D, { lhText, byStep, resolve, ratio, paletteRow, varTable, typeRows, measureRows, effectTiles, paintTiles, varsIn, modesOf });
}
