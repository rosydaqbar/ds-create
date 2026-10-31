// Read helpers for agents and Builder: filtered, paged item lists with resolved values, and full item details
// with their alias chain and everything that references them.
import {foundations} from '../server/state.mjs';
import {ItemError, referencesTo, resolveIn} from './ops.mjs';

const styleLists = {textStyles: 'textStyle', effectStyles: 'effectStyle', gridStyles: 'gridStyle'};

function allItems(draft) {
  return [...draft.variables.map(item => ({kind: 'variable', item})), ...Object.entries(styleLists).flatMap(([list, kind]) => (draft[list] || []).map(item => ({kind, item})))];
}
function modesOf(draft, v) { return draft.collections.find(c => c.name === v.collection)?.modes || Object.keys(v.values || {}); }
function chain(byName, name, mode) {
  const names = [name];
  for (let v = byName.get(name), seen = new Set([name]); v;) {
    const values = v.values || {}, x = Object.hasOwn(values, mode) ? values[mode] : Object.keys(values).length === 1 ? Object.values(values)[0] : undefined;
    if (!x?.alias || seen.has(x.alias)) break;
    names.push(x.alias); seen.add(x.alias); v = byName.get(x.alias);
  }
  return names;
}
// A domain covers the variables under its prefixes, the primitives they alias, and its style list.
function domainNames(draft, id, byName) {
  const f = foundations.find(x => x.id === id);
  if (!f) throw new ItemError(`Unknown domain: ${id}.`);
  const names = new Set();
  for (const v of draft.variables) if (f.prefixes.some(p => v.name.startsWith(p))) for (const mode of modesOf(draft, v)) chain(byName, v.name, mode).forEach(n => names.add(n));
  for (const s of draft[f.styles] || []) names.add(s.name);
  return names;
}

export function listItems(draft, {domain, collection, kind, type, prefix, query, limit = 100, cursor = 0} = {}) {
  const byName = new Map(draft.variables.map(v => [v.name, v])), inDomain = domain ? domainNames(draft, domain, byName) : null, q = query?.toLowerCase();
  const rows = allItems(draft).filter(({kind: k, item}) =>
    (!inDomain || inDomain.has(item.name)) && (!collection || item.collection === collection) && (!kind || k === kind) && (!type || item.type === type) &&
    (!prefix || item.name.startsWith(prefix)) && (!q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)));
  const page = rows.slice(cursor, cursor + limit).map(({kind: k, item}) => {
    if (k !== 'variable') { const {name, ...style} = item; return {name, kind: k, values: {}, style}; }
    return {name: item.name, kind: k, collection: item.collection, type: item.type, values: Object.fromEntries(modesOf(draft, item).map(m => [m, resolveIn(byName, item.name, m)])), ...(item.description ? {description: item.description} : {})};
  });
  return {items: page, next: cursor + limit < rows.length ? cursor + limit : null, total: rows.length};
}

export function getItems(draft, names) {
  const byName = new Map(draft.variables.map(v => [v.name, v])), items = allItems(draft);
  return names.map(name => {
    const found = items.find(x => x.item.name === name);
    if (!found) throw new ItemError(`Unknown item: ${name}.`);
    const seen = new Set(), usedBy = [];
    for (const r of found.kind === 'variable' ? referencesTo(draft, name) : []) { const key = r.kind + ':' + r.name + ':' + r.via; if (!seen.has(key)) { seen.add(key); usedBy.push({kind: r.kind, name: r.name, via: r.via}); } }
    const modes = found.kind === 'variable' ? modesOf(draft, found.item) : [];
    return {kind: found.kind, item: structuredClone(found.item), resolved: Object.fromEntries(modes.map(m => [m, resolveIn(byName, name, m)])), aliasChain: Object.fromEntries(modes.map(m => [m, chain(byName, name, m)])), usedBy};
  });
}
