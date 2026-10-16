// ds-create set registry: run as a READ-ONLY `use_figma` script, once at the end of the library phase (and again after
// a docs step changes a set). It lists every published set, private part and standalone component of the file in one
// compact return, so the build writes its set files (workspace/output/{slug}/figma/sets/) with one local command
// (`node kit/tools/registry.mjs --slug {slug}`) instead of one exported snapshot per set.
//
// A registry entry holds what the build reads: id, name, page, property definitions (variant options, BOOLEAN:default,
// TEXT, INSTANCE_SWAP), variant count and the default variant. The full layer snapshot (kit/tools/figma-export-sets.js)
// is still the tool for a QA run or a site agent that needs layers, and is exported on call.
// Icons (`Icon/{category}/{name}`) come back as one name → id map, so manifests can name an icon instead of an id.
// Doc kit parts (`Doc/…`) are left out. Pages are loaded without switching (no setCurrentPageAsync loop).
//
// The return stays under 20 KB: when the next page would pass MAX_CHARS, the call stops and `next` is the page index
// to pass as FROM in the next call. Save every return; registry.mjs merges them.
const FROM = 0;            // first page index (paging)
const MAX_CHARS = 17000;   // use_figma rejects a return over 20,480 bytes
const ICONS = true;        // false = leave the icon map out (when it was saved already)

const out = { file: figma.root.name, sets: [], icons: {}, next: null };
const size = () => JSON.stringify(out).length;
const pages = figma.root.children;
for (let i = FROM; i < pages.length; i++) {
  const p = pages[i];
  if (size() > MAX_CHARS) { out.next = i; break; }
  await p.loadAsync();
  for (const n of p.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
    if (n.name.startsWith('Doc/')) continue;
    if (n.name.startsWith('Icon/')) { if (ICONS) out.icons[n.name.slice(5)] = n.id; continue; }
    const props = {};
    for (const [k, d] of Object.entries(n.componentPropertyDefinitions)) props[k.split('#')[0]] = d.type === 'VARIANT' ? d.variantOptions : d.type === 'BOOLEAN' ? 'BOOLEAN:' + d.defaultValue : d.type;
    const isSet = n.type === 'COMPONENT_SET';
    out.sets.push([n.id, n.name, p.name, props, isSet ? n.children.length : 1, isSet ? n.defaultVariant.name : '']);
  }
}
return out;
