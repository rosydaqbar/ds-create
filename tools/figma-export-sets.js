// ds-create set snapshot: run as a READ-ONLY `use_figma` script. It exports one compact JSON snapshot per
// component set on one page, so docs agents read a set from a file instead of reading Figma again.
// It never writes, renames or moves anything. It opens only PAGE_ID (one setCurrentPageAsync, never a loop
// over pages). Nested instances are described by their main component's name and id, never followed.
//
// A snapshot holds: set id, name and description; componentPropertyDefinitions, read from the set (never
// from a variant); every variant with its property values and size; the default variant's layer tree
// (names, types, auto layout: direction, padding, gap, sizing, alignment; radius; fills, strokes, effects;
// text style, font, size, line height, weight, characters; nested instances with main name and id); and,
// for every other variant, only what differs from that tree (changed keys only, null = removed). A paint is
// { hex, var }: var is the bound variable's name, "raw" when unbound, or "external" (with ext: its name when
// Figma can read it) when bound to a variable that isn't local. `bind` lists bound spacing, radius, size and
// stroke variables the same way. Numbers are rounded to 0.1; positions are left out.
//
// CALL PATTERN
// 1. Plan (optional): LIST_ONLY = true lists the page's sets with variant and layer counts. On a very large
//    page skip it and pass SET_IDS from the inventory: ids are fetched directly, without scanning the page.
// 2. Export: SET_IDS = ['id'] (or several small sets). use_figma rejects a return over 20,480 bytes, so each
//    call stops at MAX_CHARS and pages itself: OFFSET = 0 returns the tree and the first variants;
//    `paging.next` is the OFFSET for the next call (null when done). Later calls hold only `variants`; append
//    them to the file. A 144-variant button (4 layers per variant) needs 5 calls of ~16 s, most of it page load.
//    MAX_NODES keeps a call well under the 120 s tool window; a tree too big for one return is cut by depth
//    (`treeDepth` says where).
// 3. Save each entry of `sets` as output/{system-slug}/figma/sets/{set id, ":" written as "-"}.json, as returned,
//    at the step that audits the page (INITIATOR.md Part B §6). Docs agents read these files and open Figma only
//    for screenshots.
// Excluded pages: copy the ledger's never-open page names into NEVER_OPEN; the script refuses them.
const PAGE_ID = '0:1';      // the page that holds the sets
const SET_IDS = [];         // [] = every component set (and standalone component) on the page
const LIST_ONLY = false;    // true = only list the sets, to plan the calls
const OFFSET = 0;           // first variant to export (paging)
const LIMIT = 200;          // most variants per call (the byte budget usually stops it first)
const DEPTH = 6;            // layer tree depth below the variant
const MAX_NODES = 5000;     // stop early (and page) beyond this many nodes in one call
const MAX_CHARS = 16000;    // use_figma rejects a return over 20,480 bytes; this leaves room for multi-byte text
const NEVER_OPEN = [];      // page names that must never be opened

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== 'PAGE') return { error: 'PAGE_ID is not a page: ' + PAGE_ID };
if (NEVER_OPEN.includes(page.name)) return { error: 'refused: "' + page.name + '" is on the never-open list' };
await figma.setCurrentPageAsync(page);

const R = (x) => (typeof x === 'number' ? Math.round(x * 10) / 10 : x === figma.mixed ? 'mixed' : x);
const hex = (c) => '#' + ['r', 'g', 'b'].map((k) => Math.round(c[k] * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const local = new Map((await figma.variables.getLocalVariablesAsync()).map((v) => [v.id, v.name]));
const ext = new Map();
// Bound variable → its name, or { external } when it isn't a local variable.
const varRef = async (alias) => {
  if (!alias || !alias.id) return null;
  if (local.has(alias.id)) return local.get(alias.id);
  if (!ext.has(alias.id)) { let v = null; try { v = await figma.variables.getVariableByIdAsync(alias.id); } catch (e) {} ext.set(alias.id, v ? v.name : null); }
  return { external: ext.get(alias.id) };
};
const styleNames = new Map();
const styleRef = async (id) => {
  if (id === figma.mixed) return 'mixed';
  if (!id) return null;
  if (!styleNames.has(id)) { let s = null; try { s = await figma.getStyleByIdAsync(id); } catch (e) {} styleNames.set(id, s ? (s.remote ? { external: s.name } : s.name) : { external: null }); }
  return styleNames.get(id);
};
const withVar = (o, ref) => { if (ref === null) o.var = 'raw'; else if (typeof ref === 'string') o.var = ref; else { o.var = 'external'; if (ref.external) o.ext = ref.external; } return o; };
const paintOf = async (p) => {
  if (p.type === 'SOLID') { const o = withVar({ hex: hex(p.color) }, await varRef(p.boundVariables && p.boundVariables.color)); if (p.opacity !== undefined && p.opacity < 1) o.opacity = R(p.opacity); return o; }
  if (p.type.startsWith('GRADIENT')) { const stops = []; for (const s of p.gradientStops) stops.push(withVar({ hex: hex(s.color), at: R(s.position) }, await varRef(s.boundVariables && s.boundVariables.color))); return { type: p.type.toLowerCase(), stops }; }
  return { type: p.type.toLowerCase() };
};
const paints = async (arr) => { if (!Array.isArray(arr)) return arr === figma.mixed ? 'mixed' : undefined; const out = []; for (const p of arr) if (p.visible !== false) out.push(await paintOf(p)); return out.length ? out : undefined; };
const BIND = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing', 'counterAxisSpacing', 'topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius', 'strokeWeight', 'strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'opacity', 'visible', 'characters'];
const size = (o) => JSON.stringify(o).length;
const parseName = (n) => Object.fromEntries(n.split(', ').map((p) => p.split('=')));
const four = (a) => (a[0] === a[1] && a[1] === a[2] && a[2] === a[3] ? a[0] : a);
const topName = (mc) => (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name);
let nodes = 0;

// One layer, without its children.
const layer = async (n, isRoot) => {
  nodes++;
  const o = { name: n.name, type: n.type };
  if (n.visible === false) o.hidden = true;
  const refs = n.componentPropertyReferences;
  if (refs && Object.keys(refs).length) o.refs = Object.fromEntries(Object.entries(refs).map(([k, v]) => [k, v.split('#')[0]]));
  const inAL = n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE' && n.layoutPositioning !== 'ABSOLUTE';
  if (inAL && 'layoutSizingHorizontal' in n) o.sizing = [n.layoutSizingHorizontal, n.layoutSizingVertical];
  if (isRoot || !inAL || (o.sizing && o.sizing.includes('FIXED'))) o.size = [R(n.width), R(n.height)];
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.layout = { dir: n.layoutMode === 'HORIZONTAL' ? 'H' : n.layoutMode === 'VERTICAL' ? 'V' : n.layoutMode, pad: four([n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map(R)), gap: R(n.itemSpacing), align: [n.primaryAxisAlignItems, n.counterAxisAlignItems] };
    if (n.layoutWrap === 'WRAP') { o.layout.wrap = true; o.layout.rowGap = R(n.counterAxisSpacing); }
    if (isRoot || !inAL) o.layout.hug = [n.primaryAxisSizingMode === 'AUTO', n.counterAxisSizingMode === 'AUTO'];
  }
  if ('cornerRadius' in n && n.type !== 'TEXT') { const r = n.cornerRadius === figma.mixed ? four([n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius].map(R)) : R(n.cornerRadius); if (r) o.radius = r; }
  const f = await paints(n.fills); if (f) o.fills = f;
  const s = await paints(n.strokes); if (s) { o.strokes = s; o.strokeWeight = n.strokeWeight === figma.mixed ? four([n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight].map(R)) : R(n.strokeWeight); if (n.strokeAlign) o.strokeAlign = n.strokeAlign; }
  if ('effects' in n && n.effects.some((e) => e.visible !== false)) {
    o.effects = { style: (await styleRef(n.effectStyleId)) || 'raw', list: [] };
    for (const e of n.effects) if (e.visible !== false) { const x = { type: e.type.toLowerCase() }; if (e.color) withVar(Object.assign(x, { hex: hex(e.color), alpha: R(e.color.a) }), await varRef(e.boundVariables && e.boundVariables.color)); if (e.offset) x.offset = [R(e.offset.x), R(e.offset.y)]; if ('radius' in e) x.blur = R(e.radius); if (e.spread) x.spread = R(e.spread); o.effects.list.push(x); }
  }
  if ('opacity' in n && n.opacity < 1) o.opacity = R(n.opacity);
  if (n.type === 'TEXT') {
    const lh = n.lineHeight === figma.mixed ? 'mixed' : n.lineHeight.unit === 'AUTO' ? 'auto' : n.lineHeight.unit === 'PERCENT' ? R(n.lineHeight.value) + '%' : R(n.lineHeight.value);
    o.text = { style: (await styleRef(n.textStyleId)) || 'raw', font: n.fontName === figma.mixed ? 'mixed' : n.fontName.family + ' ' + n.fontName.style, size: R(n.fontSize), lineHeight: lh, weight: R(n.fontWeight), chars: n.characters.length > 120 ? n.characters.slice(0, 117) + '…' : n.characters };
  }
  if (n.type === 'INSTANCE') { const mc = await n.getMainComponentAsync(); o.main = mc ? { name: topName(mc), variant: mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.name : undefined, id: mc.id, remote: mc.remote || undefined } : null; }
  const bv = n.boundVariables || {}; const bind = {};
  for (const k of BIND) if (bv[k] && !Array.isArray(bv[k])) { const r = await varRef(bv[k]); bind[k] = typeof r === 'string' ? r : 'external' + (r.external ? ': ' + r.external : ''); }
  if (Object.keys(bind).length) o.bind = bind;
  return o;
};
// The tree: layers with children, instances not followed (their main component has its own snapshot).
const tree = async (n, d, isRoot) => { const o = await layer(n, isRoot); if (d > 0 && 'children' in n && n.type !== 'INSTANCE' && n.children.length) { o.children = []; for (const c of n.children) o.children.push(await tree(c, d - 1, false)); } return o; };
// Flatten to path → layer: "." is the variant itself, then "Label row/Label"; a repeated name gets [i].
const flat = (o, path, out) => { out[path || '.'] = Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'children')); const seen = {}, cnt = {}; for (const c of o.children || []) seen[c.name] = (seen[c.name] || 0) + 1; for (const c of o.children || []) { cnt[c.name] = (cnt[c.name] || 0) + 1; flat(c, (path ? path + '/' : '') + c.name + (seen[c.name] > 1 ? '[' + cnt[c.name] + ']' : ''), out); } return out; };
const diff = (base, other) => {
  const d = {}; const removed = [];
  for (const [p, l] of Object.entries(other)) {
    const b = base[p]; if (!b) { d[p] = l; continue; }
    const ch = {};
    for (const k of new Set(Object.keys(l).concat(Object.keys(b)))) {
      if (p === '.' && (k === 'name' || k === 'size')) continue; // the variant entry already holds props and size
      if (JSON.stringify(l[k]) === JSON.stringify(b[k])) continue;
      const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
      if (obj(l[k]) && obj(b[k])) { const sub = {}; for (const j of new Set(Object.keys(l[k]).concat(Object.keys(b[k])))) if (JSON.stringify(l[k][j]) !== JSON.stringify(b[k][j])) sub[j] = l[k][j] === undefined ? null : l[k][j]; ch[k] = sub; }
      else ch[k] = l[k] === undefined ? null : l[k];
    }
    if (Object.keys(ch).length) d[p] = ch;
  }
  for (const p of Object.keys(base)) if (!other[p]) removed.push(p);
  if (removed.length) d.removed = removed;
  return d;
};
const propsOf = (owner) => Object.fromEntries(Object.entries(owner.componentPropertyDefinitions).map(([k, d]) => {
  const o = { type: d.type, default: d.defaultValue };
  if (d.variantOptions) o.options = d.variantOptions;
  if (k.includes('#')) o.key = k;
  if (d.preferredValues && d.preferredValues.length) o.preferred = d.preferredValues.length;
  return [k.split('#')[0], o];
}));

// SET_IDS are fetched by id (no page scan) and must sit on PAGE_ID; otherwise the page is scanned once.
const pageOf = (n) => { let p = n; while (p && p.type !== 'PAGE') p = p.parent; return p; };
const isTop = (n) => n && (n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && !(n.parent && n.parent.type === 'COMPONENT_SET')));
const targets = [];
if (SET_IDS.length && !LIST_ONLY) for (const id of SET_IDS) { const n = await figma.getNodeByIdAsync(id); targets.push(isTop(n) && pageOf(n) === page ? n : id); }
const all = targets.length ? targets : page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).filter(isTop);

if (LIST_ONLY) {
  return { page: { id: page.id, name: page.name }, sets: all.map((s) => { const v = s.type === 'COMPONENT_SET' ? s.defaultVariant : s; return { id: s.id, name: s.name, type: s.type, variants: s.type === 'COMPONENT_SET' ? s.children.length : 1, layersPerVariant: v.findAll(() => true).length + 1 }; }) };
}

const out = { file: figma.root.name, page: { id: page.id, name: page.name }, sets: [] };
for (const s of all) {
  if (typeof s === 'string') { out.sets.push({ id: s, error: 'not a component set or standalone component on this page' }); continue; }
  if (nodes > MAX_NODES || size(out) > MAX_CHARS * 0.7) { out.sets.push({ id: s.id, name: s.name, skipped: 'budget reached: export it in its own call' }); continue; }
  const isSet = s.type === 'COMPONENT_SET';
  const base = isSet ? s.defaultVariant : s;
  const snap = { v: 1, id: s.id, name: s.name, type: s.type, description: s.description || '', props: propsOf(s) };
  const baseTree = await tree(base, DEPTH, true);
  if (OFFSET === 0) {
    snap.defaultVariant = isSet ? base.name : undefined; snap.tree = baseTree;
    // A tree too large for one return is cut by depth; treeDepth says where it stopped.
    for (let d = DEPTH - 1; d >= 1 && size(snap) > MAX_CHARS * 0.6; d--) { snap.tree = await tree(base, d, true); snap.treeDepth = d; }
  }
  if (isSet) {
    const baseFlat = flat(baseTree, '', {}); const vs = s.children; snap.variantCount = vs.length; snap.variants = [];
    let i = OFFSET;
    for (; i < Math.min(vs.length, OFFSET + LIMIT); i++) {
      if (nodes > MAX_NODES) break;
      const v = vs[i]; const entry = { id: v.id, props: v.variantProperties || parseName(v.name), size: [R(v.width), R(v.height)] };
      if (v !== base) { const d = diff(baseFlat, flat(await tree(v, DEPTH, true), '', {})); if (Object.keys(d).length) entry.diff = d; } else entry.isDefault = true;
      snap.variants.push(entry);
      if (size(out) + size(snap) > MAX_CHARS && snap.variants.length > 1) { snap.variants.pop(); break; }
    }
    snap.paging = { offset: OFFSET, limit: LIMIT, returned: snap.variants.length, next: i < vs.length ? i : null };
  }
  out.sets.push(snap);
}
out.nodes = nodes;
return out;
