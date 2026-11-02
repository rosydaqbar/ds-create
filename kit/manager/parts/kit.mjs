// Shared helpers for Part templates. A template holds its page's structure as data; these turn that data into
// variants, filled token roles and component tokens the same way for every Part.
import {ItemError} from '../foundations/ops.mjs';
import {setPrefix} from './validate.mjs';

export const plain = x => !!x && typeof x === 'object' && !Array.isArray(x);
// Object inputs merge into the defaults, so changing one role keeps the rest; a list is replaced whole.
export const merge = (base, over) => plain(base) && plain(over) ? Object.fromEntries([...new Set([...Object.keys(base), ...Object.keys(over)])].map(k => [k, k in over ? merge(base[k], over[k]) : base[k]])) : structuredClone(over === undefined ? base : over);
export const settingsOf = (defaults, inputs) => merge(defaults, inputs || {});

export function resolver(draft) {
  const vars = new Map(draft.variables.map(v => [v.name, v]));
  const modes = Object.fromEntries(draft.collections.map(c => [c.name, c.modes]));
  const resolve = (name, depth = 0) => {
    const v = vars.get(name);
    if (!v || depth > 12) return null;
    const x = v.values[modes[v.collection]?.[0]] ?? Object.values(v.values)[0];
    return x && typeof x === 'object' && x.alias ? resolve(x.alias, depth + 1) : x;
  };
  const css = value => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'r' in value) return `rgba(${[value.r, value.g, value.b].map(n => Math.round(n * 255)).join(', ')}, ${value.a ?? 1})`;
    return null;
  };
  return {vars, has: name => vars.has(name), value: resolve, color: name => css(resolve(name))};
}

// A foundation color as {r, g, b} in 0–1, from a hex string or a color object; null for anything else.
export function rgbOf(value) {
  if (plain(value) && 'r' in value) return {r: value.r, g: value.g, b: value.b};
  const hex = typeof value === 'string' && value.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i)?.[1];
  return hex ? Object.fromEntries(['r', 'g', 'b'].map((k, i) => [k, parseInt(hex.slice(i * 2, i * 2 + 2), 16) / 255])) : null;
}

// Every combination of the variant properties, keeping only those `exists` accepts.
export function variantsOf(properties, exists) {
  let combos = [{}];
  for (const p of properties.filter(x => x.type === 'variant')) combos = combos.flatMap(c => p.values.map(v => ({...c, [p.name]: v})));
  if (exists) combos = combos.filter(exists);
  return {count: combos.length, combos};
}
export const rowKey = combo => Object.keys(combo).length ? Object.entries(combo).map(([k, v]) => `${k}=${v}`).join('|') : '*';

// A role with {tone}, {family} or {size} filled in. A list [wanted, …, fallback] uses the first role the
// foundations have, else the last one, with a note when it is not the wanted role.
export function fillRole(role, vars = {}, has = () => true, notes = []) {
  if (role === null || role === undefined) return null;
  const fill = r => r === null ? null : r.replace(/\{(\w+)\}/g, (m, k) => k in vars ? vars[k] : m);
  if (!Array.isArray(role)) return fill(role);
  const list = role.map(fill), out = list.slice(0, -1).find(r => r !== null && has(r)) ?? list.at(-1);
  const note = `${list[0]} → ${out}`;
  if (out && out !== list[0] && !notes.includes(note)) notes.push(note);
  return out;
}

// Scopes follow the role segment nearest the end that names a scope, so addon/padding-x and padding/desktop are
// gaps like padding-x.
const scopeWords = [[/^(padding|gap|inset|overlap)/, ['GAP']], [/radius/, ['CORNER_RADIUS']], [/thickness|^ring/, ['STROKE_FLOAT']]];
const scopes = (path, variant, type) => {
  const segments = String(path).split('/');
  if (type === 'COLOR') return [segments.at(-1), variant].includes('text') ? ['TEXT_FILL'] : ['FRAME_FILL', 'SHAPE_FILL'];
  for (const role of segments.reverse()) for (const [word, scope] of scopeWords) if (word.test(role)) return [...scope];
  return ['WIDTH_HEIGHT'];
};
// A Components variable: an alias of a foundation token ({alias}), a value the spec gives (a number), or for a
// color a foundation color at an alpha ({mix: role, alpha}), which definePart resolves to one value.
export function componentToken({set, role, variant = null, value, type = 'FLOAT', description}) {
  const name = [setPrefix(set), role, variant].filter(x => x !== null && x !== undefined).join('/');
  const kept = !plain(value) ? value : 'mix' in value ? {mix: value.mix, alpha: value.alpha} : {alias: value.alias};
  return {name, collection: 'Components', type, values: {Value: kept},
    description: description || `${set} ${[role, variant].filter(Boolean).join(' ')}.`, scopes: scopes(role, variant, type), codeSyntax: {WEB: `var(--${name.replaceAll('/', '-')})`}};
}

// One sentence naming the roles the foundations lack.
export function requireRoles(name, names, draft, extra = []) {
  const known = new Set([...draft.variables.map(v => v.name), ...draft.textStyles.map(t => t.name), ...draft.effectStyles.map(e => e.name), ...extra]);
  const missing = [...new Set(names.filter(n => n && !known.has(n)))];
  if (missing.length) throw Object.assign(new ItemError(`The foundations are missing roles the ${name} needs: ${missing.slice(0, 6).join(', ')}`), {status: 412});
}

export function checkLists(name, s, lists) {
  for (const [key, one] of Object.entries(lists)) {
    if (!Array.isArray(s[key]) || s[key].some(x => typeof x !== 'string' || !x)) throw new ItemError(`Send ${key} as a list.`);
    if (!s[key].length) throw new ItemError(`${name} needs at least one ${one}.`);
    const twice = s[key].find((x, i) => s[key].indexOf(x) !== i);
    if (twice) throw new ItemError(`${name} lists ${one} ${twice} twice.`);
  }
}

// The system's token choices on top of the compiled map and measures. A row, size or slot the Part does not
// have is refused, so a choice never lands on nothing. A choice is a token name; null only clears a slot that
// is empty somewhere else in its set. A measure held in the Part's own component token changes through the
// inputs, so the token and the measure never disagree.
export function withOverrides(name, {map = {}, measures = {}}, overrides = {}, own = new Set()) {
  const out = {map: structuredClone(map), measures: structuredClone(measures)};
  for (const area of ['map', 'measures']) for (const [set, rows] of Object.entries(overrides[area] || {})) for (const [key, slots] of Object.entries(rows || {})) for (const [slot, token] of Object.entries(slots || {})) {
    const row = out[area][set]?.[key];
    if (!row || !(slot in row)) throw new ItemError(`${name} has no ${key} ${slot}.`);
    const optional = Object.values(area === 'map' ? map[set] : measures[set]).some(r => r[slot] === null);
    if (!(typeof token === 'string' && token || token === null && optional)) throw new ItemError(`${set} ${key} ${slot} takes a token name.`);
    const before = (area === 'map' ? map : measures)[set][key][slot];
    if (area === 'measures' && own.has(before)) throw new ItemError(`${set} ${key} ${slot} is ${before}; change it through the Part's inputs.`);
    row[slot] = token;
  }
  return out;
}

// A semi-bold text style as a weight list: the first face the text styles have, closest to semibold first.
export const semibold = (scale, size) => [`type/${scale}/${size}/semibold`, `type/${scale}/${size}/medium`, `type/${scale}/${size}/bold`];

// A variant property whose default is the wanted value when the system still has it.
export const variant = (name, values, wanted) => ({name, type: 'variant', values, default: values.includes(wanted) ? wanted : values[0]});
export const prop = (name, type, value) => ({name, type, default: value});

// Sizes and similar lists of objects: each has a unique string key.
export function checkObjects(name, list, key, one) {
  if (!Array.isArray(list) || !list.length || list.some(x => !plain(x) || typeof x[key] !== 'string' || !x[key])) throw new ItemError(`Send ${one}s as a list of {${key}, …}.`);
  const twice = list.map(x => x[key]).find((x, i, a) => a.indexOf(x) !== i);
  if (twice) throw new ItemError(`${name} lists ${one} ${twice} twice.`);
}

// A Part defined as data, for every page except Button. def:
//   name, set, defaults, lists {key: 'one'}, check(s)
//   sets(s) → [{name, private, properties, exists(combo), axes, row(combo, s) → {slot: role}}]
//     axes are the variant properties the token map changes with; a row is filled for every combination of
//     them that some variant has.
//   measures(s) → {set: {size or '*': {slot: value}}}: a number becomes a component token
//     {set}/{slot}/{size} holding it, {alias} a component token aliasing it, a name is used as it is.
//   tokens(s) → extra component tokens ({set, role, variant, value, type, description})
//     instances(combo, s) → {slot: {part, set?, variant}}: the Parts (or same-page sets) a variant holds, over
//     instanceAxes (every variant property by default). variant names only the properties the spec sets.
//   adapt(draft, s, plan, parts) → {inputs, decisions}; decide(draft, s) → decisions
// A role is a name, null, or [wanted, fallback]. A fallback of null makes the slot optional: an effect slot
// [style, null] stays empty on a system without shadows.
export function definePart(def) {
  const settings = inputs => settingsOf(def.defaults, inputs);
  const vars = combo => Object.fromEntries(Object.entries(combo).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '-'), v]));
  function structure(s) {
    const sets = def.sets(s).map(x => ({...x, ...variantsOf(x.properties, x.exists)}));
    const tokens = [], measures = {};
    for (const [set, sizes] of Object.entries(def.measures?.(s) || {})) for (const [size, slots] of Object.entries(sizes)) for (const [slot, v] of Object.entries(slots)) {
      let name = v;
      if (typeof v === 'number' || plain(v)) { const t = componentToken({set, role: slot, variant: size === '*' ? null : size, value: v, description: def.describe?.(set, slot, size)}); tokens.push(t); name = t.name; }
      ((measures[set] ||= {})[size] ||= {})[slot] = name;
    }
    tokens.push(...(def.tokens?.(s) || []).map(componentToken));
    const keysOf = (x, axes) => [...new Set(x.combos.map(c => rowKey(Object.fromEntries(axes.map(a => [a, c[a]])))))];
    const rows = sets.flatMap(x => keysOf(x, x.axes || []).map(key => ({set: x.name, key})));
    const instanceAxes = x => x.instanceAxes || x.properties.filter(p => p.type === 'variant').map(p => p.name);
    const instanceRows = sets.filter(x => x.instances).flatMap(x => keysOf(x, instanceAxes(x)).map(key => ({set: x.name, key})));
    return {sets, tokens, measures, rows, instanceRows};
  }
  const comboOf = key => key === '*' ? {} : Object.fromEntries(key.split('|').map(p => p.split('=')));
  const summary = sets => sets.map(x => ({name: x.name, private: !!x.private, properties: x.properties, variantCount: x.count}));
  function contract(inputs = {}) {
    const st = structure(settings(inputs)), sets = summary(st.sets);
    return {sets, properties: sets[0].properties, variantCount: sets.reduce((n, x) => n + x.variantCount, 0), tokens: st.tokens.map(t => t.name), rows: st.rows, instanceRows: st.instanceRows};
  }
  function checkInputs(inputs = {}) {
    const s = settings(inputs);
    checkLists(def.name, s, def.lists || {});
    def.check?.(s);
  }
  function compile(inputs, {draft, overrides = {}, parts = {}} = {}) {
    const s = settings(inputs), st = structure(s), notes = [], decisions = [...(def.decide?.(draft, s) || [])];
    const own = new Set([...st.tokens.map(t => t.name), ...Object.values(parts).flatMap(p => (p.tokens || []).map(t => t.name))]);
    const known = new Set([...draft.variables.map(v => v.name), ...draft.textStyles.map(t => t.name), ...draft.effectStyles.map(e => e.name), ...own]);
    const has = n => known.has(n);
    let flat = false;
    const fill = (role, v, slot) => { const out = fillRole(role, v, has, notes); if (Array.isArray(role) && role.at(-1) === null && out === null && slot === 'effect') flat = true; return out; };
    // Every row of a set fills the same slots. A value the inputs added without roles for it (a new tone or
    // state) leaves a row short; that is refused in one sentence instead of saving an empty slot.
    const map = {};
    for (const x of st.sets) {
      const raw = st.rows.filter(r => r.set === x.name).map(({key}) => {
        const combo = comboOf(key);
        let row;
        try { row = x.row(combo, s); } catch (e) { if (e instanceof TypeError) row = null; else throw e; }
        return {key, combo, row};
      });
      const slots = [...new Set(raw.flatMap(r => Object.keys(r.row || {})))];
      for (const {key, combo, row} of raw) {
        if (!row || slots.some(sl => row[sl] === undefined)) throw new ItemError(`${def.name} has no roles for ${x.name} ${key}.`);
        (map[x.name] ||= {})[key] = Object.fromEntries(slots.map(slot => [slot, fill(row[slot], vars(combo), slot)]));
      }
    }
    // An instance names its Part's main set unless it says which; the validator checks it against that set.
    const instances = {};
    for (const {set: name, key} of st.instanceRows) {
      const x = st.sets.find(y => y.name === name), held = x.instances(comboOf(key), s) || {};
      (instances[name] ||= {})[key] = Object.fromEntries(Object.entries(held).map(([slot, i]) => [slot, {part: i.part, set: i.set || (i.part === def.id ? def.set : parts[i.part]?.set ?? null), variant: {...(i.variant || {})}}]));
    }
    // A mixed color is one value: the foundation color in its first mode, at the alpha. Its source is kept in
    // mixes, so a change to that color makes the Part outdated.
    const r = resolver(draft), mixes = {};
    for (const t of st.tokens) {
      const v = t.values.Value;
      if (!plain(v) || !('mix' in v)) continue;
      const c = rgbOf(r.value(v.mix));
      if (!c) throw Object.assign(new ItemError(`The foundations are missing roles the ${def.name} needs: ${v.mix}`), {status: 412});
      mixes[t.name] = {role: v.mix, alpha: v.alpha};
      t.values = {Value: {r: c.r, g: c.g, b: c.b, a: v.alpha}};
    }
    const measures = Object.fromEntries(Object.entries(st.measures).map(([set, sizes]) => [set, Object.fromEntries(Object.entries(sizes).map(([size, slots]) => [size, Object.fromEntries(Object.entries(slots).map(([slot, v]) => [slot, fill(v, size === '*' ? {} : {size}, slot)]))]))]));
    const used = [map, measures].flatMap(a => Object.values(a).flatMap(rows => Object.values(rows).flatMap(slots => Object.values(slots)))).filter(n => typeof n === 'string');
    requireRoles(def.name, [...used, ...st.tokens.flatMap(t => Object.values(t.values).map(v => v?.alias).filter(Boolean))], draft, [...own]);
    if (flat) decisions.push({key: 'Shadow', value: 'No shadow', decidedBy: 'AI', reason: `Your foundations use flat surfaces without shadows, so the ${def.name} has none.`});
    const sets = summary(st.sets), first = st.sets[0];
    return {id: def.id, page: def.page, name: def.name, set: def.set,
      sets, properties: sets[0].properties, variantCount: sets.reduce((n, x) => n + x.variantCount, 0),
      variantPattern: first.properties.filter(p => p.type === 'variant').map(p => `${p.name}=${p.default}`).join(', '),
      primitives: [], tokens: st.tokens, ...(st.instanceRows.length ? {instances} : {}), ...(Object.keys(mixes).length ? {mixes} : {}), ...withOverrides(def.name, {map, measures}, overrides, new Set(st.tokens.map(t => t.name))), decisions, notes, overrides};
  }
  const out = {fields: Object.keys(def.defaults), defaults: def.defaults, checkInputs, contract, compile};
  if (def.adapt) out.adapt = (draft, plan, parts = {}) => def.adapt(draft, settings({}), plan, parts);
  return out;
}

// Drops list values whose role the foundations lack, for a template's adapt. probe(value) → the role names
// that value needs. Returns the kept list and a decision naming what was dropped, or null.
export function keepAvailable(draft, name, list, probe, one) {
  const known = new Set([...draft.variables.map(v => v.name), ...draft.textStyles.map(t => t.name), ...draft.effectStyles.map(e => e.name)]);
  const kept = list.filter(x => probe(x).every(n => known.has(n))), gone = list.filter(x => !kept.includes(x));
  const many = one.endsWith('y') ? one.slice(0, -1) + 'ies' : one + 's';
  return {kept, decision: gone.length ? {key: `${name} ${many}`, value: kept.join(', ') || 'none', decidedBy: 'AI', reason: `Your colors have no ${gone.join(', ')} ${gone.length > 1 ? many : one}, so the ${name} has no ${gone.join(', ')} variants.`} : null};
}

// A partial matrix as data. only: for each value of the `by` property, the values other properties may
// take with it; ascending: pairs of properties whose values must rise (Start value below End value).
export function existsFrom(rule = {}) {
  return c => Object.entries(rule.only?.[c[rule.by]] || {}).every(([p, values]) => values.includes(c[p])) && (rule.ascending || []).every(([a, b]) => Number(c[a]) < Number(c[b]));
}
