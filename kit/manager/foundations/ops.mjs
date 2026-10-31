// Pure op engine for foundation items: a saved draft plus a list of ops becomes a new draft, plan, warnings and impact.
// It never touches files. Structural errors throw ItemError; contract and contrast problems come back as warnings.
import {validateFoundations, validatePlan, contrastReport} from './validate.mjs';
import {paletteRamp} from './compiler.mjs';
import {deriveRadii, shadowSeed, deriveShadows, isShadow, cssColor, draftEffect} from '../client/features/foundation-controls.mjs';

export class ItemError extends Error { constructor(message) { super(message); this.status = 400; } }

const lists = {variable: 'variables', textStyle: 'textStyles', effectStyle: 'effectStyles', gridStyle: 'gridStyles'};
const styleDomain = {textStyle: 'typography', effectStyle: 'elevation', gridStyle: 'space'};
const variableFields = ['description', 'scopes', 'codeSyntax', 'hiddenFromPublishing'];
const web = name => `var(--${name.replaceAll('/', '-')})`;
const isAlias = value => value && typeof value === 'object' && Object.hasOwn(value, 'alias');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Primitive names carry their value: scale/radius/10, scale/duration/0p12, scale/letter-spacing/n0p5, palette/custom/1a2b3c.
function slug(type, value) {
  if (type === 'COLOR') return String(value).replace(/^#/, '').toLowerCase();
  if (typeof value === 'number') return (value < 0 ? 'n' : '') + String(Math.abs(value)).replace('.', 'p');
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function resolveIn(byName, name, mode, seen = new Set()) {
  const v = byName.get(name);
  if (!v || seen.has(name)) return undefined;
  const values = v.values || {}, x = Object.hasOwn(values, mode) ? values[mode] : Object.keys(values).length === 1 ? Object.values(values)[0] : undefined;
  return isAlias(x) ? resolveIn(byName, x.alias, mode, new Set(seen).add(name)) : x;
}

// Every item that points at a variable: aliases, text-style bindings and effect colors.
export function referencesTo(draft, name) {
  const refs = [];
  for (const v of draft.variables) for (const [mode, value] of Object.entries(v.values || {})) if (value?.alias === name) { refs.push({kind: 'variable', name: v.name, via: 'alias', mode}); }
  for (const s of draft.textStyles || []) for (const [key, ref] of Object.entries(s.bound || {})) if (ref === name) refs.push({kind: 'textStyle', name: s.name, via: 'bound.' + key});
  for (const s of draft.effectStyles || []) if ((s.effects || []).some(e => e.color?.alias === name)) refs.push({kind: 'effectStyle', name: s.name, via: 'effect color'});
  return refs;
}
function replaceReferences(draft, from, to) {
  for (const v of draft.variables) for (const value of Object.values(v.values || {})) if (value?.alias === from) value.alias = to;
  for (const s of draft.textStyles || []) for (const key of Object.keys(s.bound || {})) if (s.bound[key] === from) s.bound[key] = to;
  for (const s of draft.effectStyles || []) for (const e of s.effects || []) if (e.color?.alias === from) e.color.alias = to;
}

function domainFor(plan, draft, name, kind, type, collection) {
  if (styleDomain[kind]) return styleDomain[kind];
  const included = Object.entries(plan.domains).filter(([, d]) => d.status === 'included');
  const segments = name.split('/');
  for (const depth of [2, 1]) {
    const prefix = segments.slice(0, depth).join('/') + '/';
    const hit = included.find(([, d]) => d.variables.some(n => n.startsWith(prefix)));
    if (hit) return hit[0];
  }
  if (type === 'COLOR') return 'color';
  const sibling = draft.variables.find(v => v.collection === collection && v.name !== name);
  return included.find(([, d]) => sibling && d.variables.includes(sibling.name))?.[0] || null;
}
function planAdd(plan, draft, name, kind, type, collection) {
  if (!plan) return;
  const domain = domainFor(plan, draft, name, kind, type, collection), key = kind === 'variable' ? 'variables' : 'styles';
  if (domain && plan.domains[domain]?.status === 'included' && !plan.domains[domain][key].includes(name)) plan.domains[domain][key].push(name);
}
function planRename(plan, from, to) {
  if (plan) for (const d of Object.values(plan.domains)) for (const key of ['variables', 'styles']) if (Array.isArray(d[key])) d[key] = d[key].map(n => n === from ? to : n);
}
function planDelete(plan, name) {
  if (plan) for (const d of Object.values(plan.domains)) for (const key of ['variables', 'styles']) if (Array.isArray(d[key])) d[key] = d[key].filter(n => n !== name);
}

// A literal on a semantic token of a new system aliases a primitive in the same family, created when none holds that value.
function primitiveFor(draft, plan, v, mode, value, ctx) {
  const current = v.values[mode], family = v.type === 'COLOR' ? 'palette/custom' : isAlias(current) ? current.alias.split('/').slice(0, -1).join('/') : null;
  if (!family) throw new ItemError(`${v.name} has no primitive family for ${mode}; pass alias instead.`);
  const literal = v.type === 'COLOR' && typeof value === 'string' ? value.toLowerCase() : value;
  const match = draft.variables.find(p => p.collection === 'Primitives' && p.type === v.type && p.name.startsWith(family + '/') && same(Object.values(p.values)[0], literal));
  if (match) return match.name;
  const name = `${family}/${slug(v.type, literal)}`;
  if (draft.variables.some(p => p.name === name)) throw new ItemError(`${name} already exists with another value; pass alias instead.`);
  const primitive = {name, collection: 'Primitives', type: v.type, values: {Value: literal}, scopes: [], hiddenFromPublishing: true};
  if (v.codeSyntax?.WEB) primitive.codeSyntax = {WEB: web(name)};
  draft.variables.push(primitive);
  // Remember what the store made, so it can remove the primitive again once nothing uses it.
  if (ctx.rules) (ctx.rules.created ||= []).push(name);
  // The new primitive belongs to the same domain as the semantic token that uses it.
  const domain = plan && Object.values(plan.domains).find(d => d.variables?.includes(v.name));
  if (domain) domain.variables.push(name); else planAdd(plan, draft, name, 'variable', v.type, 'Primitives');
  return name;
}

function itemOf(draft, kind, name) {
  const list = lists[kind];
  if (!list) throw new ItemError(`Unknown item kind: ${kind}.`);
  const item = (draft[list] || []).find(x => x.name === name);
  if (!item) throw new ItemError(`Unknown item: ${name}.`);
  return item;
}
function exists(draft, name) { return Object.values(lists).some(list => (draft[list] || []).some(x => x.name === name)); }

// Marks the set ops a ramp regeneration produced; a symbol, so callers cannot send it.
const fromRamp = Symbol('fromRamp');
export const discussDefaults = {maxSemantics: 10, maxFamilies: 1, contract: true, colorRules: true};
export const defaultRules = () => ({format: 'ds-create/foundation-rules@1', discuss: {...discussDefaults}, palettes: {}, contract: []});

// Recipes turn one Builder control or one direction into plain set ops on the current draft.
const recipes = {
  'radius-base'(draft, {rem}, {resolve}) {
    const rows = draft.variables.filter(v => v.name.startsWith('radius/')).map(v => ({name: v.name, value: resolve(v.name, 'Value')})).filter(r => Number.isFinite(r.value));
    let next;
    try { next = deriveRadii(rows, rem); } catch (e) { throw new ItemError(e.message); }
    return next.filter((r, i) => r.value !== rows[i].value).map(r => ({op: 'set', name: r.name, mode: 'Value', value: r.value}));
  },
  'space-base'(draft, {rem}, {resolve}) {
    if (!Number.isFinite(rem) || rem <= 0) throw new ItemError('Spacing must be a positive rem value.');
    const old = resolve('space/xs', 'Value') || 4, factor = rem * 16 / old;
    return draft.variables.filter(v => v.name.startsWith('space/')).flatMap(v => {
      const value = resolve(v.name, 'Value'), next = Math.round(value * factor * 2) / 2;
      return Number.isFinite(value) && next !== value ? [{op: 'set', name: v.name, mode: 'Value', value: next}] : [];
    });
  },
  'shadow-seed'(draft, {seed}, {resolveColor}) {
    if (!seed || typeof seed !== 'object') throw new ItemError('shadow-seed needs a seed.');
    return (draft.effectStyles || []).filter(s => !s.name.startsWith('focus/') && s.effects?.some(isShadow)).flatMap(s => {
      const original = shadowSeed(s, resolveColor);
      if (!original) return [];
      const derived = deriveShadows(s.effects, original, seed, resolveColor);
      let i = 0;
      const effects = s.effects.map(e => isShadow(e) ? draftEffect(derived[i++]) : structuredClone(e));
      return [{op: 'set', kind: 'effectStyle', name: s.name, fields: {effects}}];
    });
  },
  // Sets the role's token (every font/family/* token without a role), so a primitive named after the new family
  // is used or created, and the text styles bound to those tokens.
  'type-family'(draft, {family, role}) {
    if (typeof family !== 'string' || !family.trim()) throw new ItemError('type-family needs a family name.');
    const semantics = draft.variables.filter(v => role ? v.name === `font/family/${role}` : v.name.startsWith('font/family/')).map(v => v.name);
    if (role && !semantics.length) throw new ItemError(`font/family/${role} does not exist.`);
    const styles = (draft.textStyles || []).filter(s => role ? s.bound?.fontFamily === `font/family/${role}` : true);
    return [...semantics.map(name => ({op: 'set', name, mode: 'Value', value: family})), ...styles.map(s => ({op: 'set', kind: 'textStyle', name: s.name, fields: {fontFamily: family}}))];
  },
  // The percent is relative to the sizes recorded the first time the scale changed, so steps never compound
  // and 100 returns the original sizes.
  'type-scale'(draft, {percent}, {resolve, rules}) {
    if (!Number.isFinite(percent) || percent < 50 || percent > 200) throw new ItemError('Type scale must be between 50 and 200 percent.');
    const base = rules.baselines?.type || {
      tokens: Object.fromEntries(draft.variables.filter(v => /^font\/(size|line-height)\//.test(v.name)).map(v => [v.name, resolve(v.name, 'Value')]).filter(([, n]) => Number.isFinite(n))),
      styles: Object.fromEntries((draft.textStyles || []).map(s => [s.name, {fontSize: s.fontSize, lineHeight: s.lineHeight}])),
    };
    rules.baselines = {...rules.baselines, type: {...base, percent}};
    const scale = n => Math.round(n * percent / 100);
    const tokens = Object.entries(base.tokens).filter(([name]) => draft.variables.some(v => v.name === name)).flatMap(([name, n]) => scale(n) !== resolve(name, 'Value') ? [{op: 'set', name, mode: 'Value', value: scale(n)}] : []);
    const styles = (draft.textStyles || []).filter(s => base.styles[s.name]).map(s => {
      const b = base.styles[s.name];
      return {op: 'set', kind: 'textStyle', name: s.name, fields: {fontSize: scale(b.fontSize), ...(b.lineHeight?.unit === 'PIXELS' ? {lineHeight: {...b.lineHeight, value: scale(b.lineHeight.value)}} : {})}};
    });
    return [...tokens, ...styles];
  },
  'palette-ramp'(draft, {family, anchors, replace = false}, {rules, broken, ramps}) {
    const recorded = rules?.palettes?.[family];
    if (!recorded && !replace) throw new ItemError(`palette/${family} has no recorded ramp; pass replace: true with both ends pinned.`);
    if (recorded?.rule === 'custom') broken.push(`palette/${family}: regenerating overwrites hand-set steps`);
    const pins = replace ? {...anchors} : {...recorded.anchors, ...anchors};
    const present = draft.variables.filter(v => v.collection === 'Primitives' && new RegExp(`^palette/${family}/\\d+$`).test(v.name)).map(v => Number(v.name.split('/').pop()));
    const steps = [...new Set([...(recorded?.steps || []), ...present])].sort((a, b) => a - b);
    let ramp;
    try { ramp = paletteRamp({anchors: pins, steps}); } catch (e) { throw new ItemError(e.message); }
    rules.palettes[family] = {anchors: pins, steps, rule: 'ramp'};
    ramps.push(family);
    return present.map(step => ({op: 'set', name: `palette/${family}/${step}`, mode: 'Value', value: ramp[step], [fromRamp]: true}));
  },
};

// A direct set on a palette step follows the family's ramp: an anchor regenerates the ramp, any other step breaks it.
function expand(draft, op, ctx) {
  if (op?.target !== 'foundations') throw new ItemError('Only foundations can be changed in this version.');
  const byName = new Map(draft.variables.map(v => [v.name, v]));
  const resolve = (name, mode) => resolveIn(byName, name, mode);
  const colorMode = draft.collections.find(c => c.name === 'Color')?.modes[0] || 'Value';
  const resolveColor = c => cssColor(c?.alias ? resolveIn(byName, c.alias, colorMode) : c);
  if (op.op === 'apply') {
    const recipe = recipes[op.recipe];
    if (!recipe) throw new ItemError(`Unknown recipe: ${op.recipe}.`);
    ctx.rules ||= defaultRules();
    return recipe(draft, op, {resolve, resolveColor, rules: ctx.rules, broken: ctx.broken, ramps: ctx.ramps}).map(o => ({target: 'foundations', ...o}));
  }
  const step = op.op === 'set' && (op.kind || 'variable') === 'variable' && !op[fromRamp] && op.value !== undefined ? op.name?.match(/^palette\/([^/]+)\/(\d+)$/) : null;
  const recorded = step && ctx.rules?.palettes?.[step[1]];
  if (recorded && Object.hasOwn(recorded.anchors, step[2])) return expand(draft, {target: 'foundations', op: 'apply', recipe: 'palette-ramp', family: step[1], anchors: {[step[2]]: op.value}}, ctx);
  if (recorded?.rule === 'ramp') { ctx.broken.push(`palette/${step[1]}: step ${step[2]} set outside its OKLab ramp`); recorded.rule = 'custom'; }
  return [op];
}

function mergeRules(rules, fields = {}) {
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'discuss') rules.discuss = {...rules.discuss, ...value};
    else if (key === 'palettes') for (const [family, rule] of Object.entries(value || {})) rules.palettes[family] = {...rules.palettes[family], ...rule};
    else if (key === 'contract') rules.contract = [...value];
    else throw new ItemError(`Unknown rules field: ${key}.`);
  }
}

// The one-line reason a change needs the user's agreement, or null. Limits come from the rules file.
export function isWide(impact, ops = [], rules = null) {
  const discuss = {...discussDefaults, ...rules?.discuss}, contract = new Set(rules?.contract || []), reasons = [];
  if (ops.some(op => op.kind === 'rules')) reasons.push('changes the discussion rules');
  if (discuss.colorRules && impact.rulesBroken.length) reasons.push('breaks a color rule: ' + impact.rulesBroken.join('; '));
  // A new anchor recolors the whole family, and mixed anchors give a mixed-hue ramp: always worth a word first.
  if (discuss.colorRules && impact.ramps?.length) reasons.push(`regenerates the ${impact.ramps.map(f => `palette/${f}`).join(', ')} ramp`);
  if (impact.families.length > discuss.maxFamilies) reasons.push(`touches ${impact.families.length} palette families (${impact.families.join(', ')})`);
  const moved = new Set(impact.semantics.map(s => s.name)).size;
  if (moved > discuss.maxSemantics) reasons.push(`moves ${moved} semantic tokens`);
  const named = discuss.contract ? ops.filter(op => ['rename', 'delete'].includes(op.op) && contract.has(op.from ?? op.name)).map(op => op.from ?? op.name) : [];
  if (named.length) reasons.push(`renames or deletes contract items (${named.join(', ')})`);
  return reasons.length ? reasons.join('; ') : null;
}

function applyOne(draft, plan, op, changes, ctx) {
  const kind = op.kind || 'variable';
  if (kind === 'rules') {
    if (op.op !== 'set') throw new ItemError('Rules only take set.');
    ctx.rules ||= defaultRules();
    mergeRules(ctx.rules, op.fields);
    changes.push({kind: 'rules', name: 'rules', action: 'set'});
    return;
  }
  if (op.op === 'set') {
    const item = itemOf(draft, kind, op.name);
    if (kind === 'variable') {
      if (op.mode !== undefined) {
        const collection = draft.collections.find(c => c.name === item.collection);
        if (!collection?.modes.includes(op.mode)) throw new ItemError(`${op.name} has no mode ${op.mode}.`);
        if (op.alias !== undefined) item.values[op.mode] = {alias: op.alias};
        else if (op.value !== undefined) item.values[op.mode] = plan?.systemMode === 'new' && item.collection !== 'Primitives' ? {alias: primitiveFor(draft, plan, item, op.mode, op.value, ctx)} : structuredClone(op.value);
        else throw new ItemError(`Set needs a value or an alias for ${op.name}.`);
      }
      for (const [key, value] of Object.entries(op.fields || {})) {
        if (!variableFields.includes(key)) throw new ItemError(`${key} cannot be set on a variable; use rename or add.`);
        item[key] = structuredClone(value);
      }
    } else for (const [key, value] of Object.entries(op.fields || {})) {
      if (key === 'name') throw new ItemError('Use rename to change a style name.');
      item[key] = structuredClone(value);
    }
    changes.push({kind, name: op.name, action: 'set'});
  } else if (op.op === 'add') {
    if (kind === 'collection') {
      if (draft.collections.some(c => c.name === op.item?.name)) throw new ItemError(`Collection ${op.item?.name} already exists.`);
      draft.collections.push({name: op.item?.name, modes: [...(op.item?.modes || [])]});
      changes.push({kind, name: op.item?.name, action: 'add'});
    } else if (kind === 'mode') {
      const collection = draft.collections.find(c => c.name === op.collection);
      if (!collection) throw new ItemError(`Collection ${op.collection} does not exist.`);
      if (collection.modes.includes(op.mode)) throw new ItemError(`${op.collection} already has mode ${op.mode}.`);
      const source = op.copyFrom ?? collection.modes[0];
      collection.modes.push(op.mode);
      for (const v of draft.variables) if (v.collection === op.collection) v.values[op.mode] = structuredClone(v.values[source]);
      changes.push({kind: 'collection', name: op.collection, action: 'set'});
    } else {
      const item = structuredClone(op.item || {});
      if (!lists[kind]) throw new ItemError(`Unknown item kind: ${kind}.`);
      if (exists(draft, item.name)) throw new ItemError(`${item.name} already exists.`);
      if (kind === 'variable' && !draft.collections.some(c => c.name === item.collection)) throw new ItemError(`Collection ${item.collection} does not exist.`);
      (draft[lists[kind]] ||= []).push(item);
      planAdd(plan, draft, item.name, kind, item.type, item.collection);
      changes.push({kind, name: item.name, action: 'add'});
    }
  } else if (op.op === 'rename') {
    const item = itemOf(draft, kind, op.from);
    if (exists(draft, op.to)) throw new ItemError(`${op.to} already exists.`);
    item.name = op.to;
    if (kind === 'variable') {
      if (item.codeSyntax?.WEB === web(op.from)) item.codeSyntax.WEB = web(op.to);
      replaceReferences(draft, op.from, op.to);
    }
    planRename(plan, op.from, op.to);
    changes.push({kind, name: op.to, action: 'rename', from: op.from, to: op.to});
  } else if (op.op === 'delete') {
    itemOf(draft, kind, op.name);
    if (kind === 'variable') {
      const refs = referencesTo(draft, op.name).filter(r => !(r.kind === 'variable' && r.name === op.name));
      const users = new Set(refs.map(r => r.kind + ':' + r.name)).size;
      if (users && !op.replaceWith) throw new ItemError(`${op.name} is used by ${users} item${users === 1 ? '' : 's'}; pass replaceWith to delete it.`);
      if (op.replaceWith) {
        const target = draft.variables.find(v => v.name === op.replaceWith), source = draft.variables.find(v => v.name === op.name);
        if (!target || target.type !== source.type) throw new ItemError(`${op.replaceWith} cannot replace ${op.name}: it is missing or a different type.`);
        replaceReferences(draft, op.name, op.replaceWith);
      }
    }
    draft[lists[kind]] = draft[lists[kind]].filter(x => x.name !== op.name);
    planDelete(plan, op.name);
    changes.push({kind, name: op.name, action: 'delete'});
  } else throw new ItemError(`Unknown op: ${op.op}.`);
}

export function measureImpact(before, after) {
  const was = new Map(before.variables.map(v => [v.name, v])), now = new Map(after.variables.map(v => [v.name, v]));
  const primitives = after.variables.filter(v => v.collection === 'Primitives' && !same(was.get(v.name)?.values, v.values)).map(v => v.name);
  const semantics = [];
  for (const v of after.variables) {
    if (v.collection === 'Primitives') continue;
    for (const mode of after.collections.find(c => c.name === v.collection)?.modes || []) {
      const from = resolveIn(was, v.name, mode), to = resolveIn(now, v.name, mode);
      if (!same(from, to)) semantics.push({name: v.name, mode, from, to});
    }
  }
  const moved = new Set([...primitives, ...semantics.map(s => s.name)]);
  const styles = [];
  for (const list of ['textStyles', 'effectStyles', 'gridStyles']) for (const s of after[list] || []) {
    const old = (before[list] || []).find(x => x.name === s.name);
    const refs = [...Object.values(s.bound || {}), ...(s.effects || []).map(e => e.color?.alias).filter(Boolean)];
    if (!same(old, s) || refs.some(r => moved.has(r))) styles.push(s.name);
  }
  const families = [...new Set(primitives.map(n => n.match(/^palette\/[^/]+/)?.[0]).filter(Boolean))];
  return {primitives, semantics, styles, families, rulesBroken: []};
}

// Plan checks that need the source snapshot (decisions, sources, product) belong to preparation, not to item edits.
const sourceOnly = /^(Foundation plan must|Record |Include at least)|exclusion needs a reason and source/;
export function draftWarnings(draft, plan, rules = null) {
  const warnings = plan ? validatePlan(plan, draft, {hash: plan.inputHash, files: []}, plan.inputRevision).errors.filter(e => !sourceOnly.test(e)) : [];
  const names = new Set(Object.values(lists).flatMap(list => (draft[list] || []).map(x => x.name)));
  for (const name of rules?.contract || []) if (!names.has(name)) warnings.push(`Contract item ${name} is missing.`);
  for (const p of contrastReport(draft).filter(p => !p.pass)) warnings.push(`Contrast: ${p.mode} ${p.foreground} on ${p.background} is ${p.ratio?.toFixed(2) || 'unresolved'}; requires ${p.minimum}:1.`);
  return warnings;
}

export function applyOps(draft, ops, {plan = null, rules = null} = {}) {
  if (!Array.isArray(ops) || !ops.length) throw new ItemError('Send at least one op.');
  const next = structuredClone(draft), nextPlan = plan ? structuredClone(plan) : null, changes = [];
  const ctx = {rules: rules ? structuredClone(rules) : null, broken: [], ramps: []};
  for (const op of ops) for (const step of expand(next, op, ctx)) applyOne(next, nextPlan, step, changes, ctx);
  // Primitives the store created and nothing uses any more leave in the same revision; preparation's stay.
  if (ctx.rules?.created) ctx.rules.created = ctx.rules.created.filter(name => {
    if (!next.variables.some(v => v.name === name)) return false;
    if (referencesTo(next, name).length) return true;
    next.variables = next.variables.filter(v => v.name !== name); planDelete(nextPlan, name);
    changes.push({kind: 'variable', name, action: 'delete'});
    return false;
  });
  const check = validateFoundations(next);
  if (!check.valid) throw new ItemError(check.errors.slice(0, 5).join(' '));
  return {draft: next, plan: nextPlan, rules: ctx.rules, changes, warnings: draftWarnings(next, nextPlan, ctx.rules), impact: {...measureImpact(draft, next), rulesBroken: ctx.broken, ramps: ctx.ramps}};
}
