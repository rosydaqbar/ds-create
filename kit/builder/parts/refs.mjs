// Exact foundation names inside a Part file: its token aliases, its compiled sizes, treatments, map, measures and mixed
// colors, and the system's inputs and overrides. Foundation renames and deletes use these to keep Parts pointing at real items.
const areas = part => ({tokens: (part.tokens || []).map(t => t.values), compiled: {sizes: part.sizes, treatments: part.treatments, map: part.map, measures: part.measures, mixes: part.mixes}, overrides: part.overrides, inputs: part.inputs});
const contains = (x, name) => typeof x === 'string' ? x === name : Array.isArray(x) ? x.some(y => contains(y, name)) : !!x && typeof x === 'object' && Object.values(x).some(y => contains(y, name));
const swap = (x, from, to) => typeof x === 'string' ? (x === from ? to : x) : Array.isArray(x) ? x.map(y => swap(y, from, to)) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, swap(v, from, to)])) : x;

export function partRefs(part, name) {
  return Object.entries(areas(part)).filter(([, x]) => contains(x, name)).map(([via]) => via);
}

// The Part with every exact `from` value replaced by `to`, or null when it does not mention `from`.
export function replaceInPart(part, from, to) {
  if (!partRefs(part, from).length) return null;
  const next = {...part, tokens: (part.tokens || []).map(t => ({...t, values: swap(t.values, from, to)})), sizes: swap(part.sizes, from, to), treatments: swap(part.treatments, from, to), map: swap(part.map, from, to), measures: swap(part.measures, from, to), ...(part.mixes ? {mixes: swap(part.mixes, from, to)} : {}), overrides: swap(part.overrides, from, to), inputs: swap(part.inputs, from, to)};
  // Kept so the next prepare can map the template's old name to the new one (files.mjs buildPart).
  if ('depends' in part) next.renames = {...Object.fromEntries(Object.entries(part.renames || {}).map(([k, v]) => [k, v === from ? to : v])), [from]: to};
  if (part.depends && Object.hasOwn(part.depends, from)) next.depends = Object.fromEntries(Object.entries(part.depends).map(([k, v]) => [k === from ? to : k, v]));
  return next;
}
