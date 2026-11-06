// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.1-button.md, and a system may change any of it. compile never holds a brand value.
import {ItemError} from '../../foundations/ops.mjs';
import {merge, paintContrast, paintCss, paintOf, paintRisk, resolver} from '../kit.mjs';

export const id = 'button';
export const page = '2.1';
export const name = 'Button';
export const set = 'Button';
export const level = 'parts';
export const spec = 'specs/parts/2.1-button.md';
export const uses = ['spinner'];
export const fields = ['sizes', 'emphases', 'tones', 'states', 'stateRoles', 'defaultVariant', 'properties', 'roles', 'toneRoles', 'effects', 'labelWeights', 'depth'];

const live = (fill, border, text, icon) => ({fill, border, text, icon});
// §5 and §7: roles per emphasis and state. {tone} is the Tone value; a [wanted, fallback] pair uses the fallback,
// with a note, when the system lacks the wanted role.
const roles = {
  primary: {
    rest: live('color/fill/{tone}/solid', null, 'color/text/on-solid', 'color/icon/on-solid'),
    hover: live('color/fill/{tone}/solid/hover', null, 'color/text/on-solid', 'color/icon/on-solid'),
    pressed: live('color/fill/{tone}/solid/pressed', null, 'color/text/on-solid', 'color/icon/on-solid'),
    disabled: live('color/fill/neutral/subtle/disabled', 'color/border/disabled', 'color/text/disabled', 'color/icon/disabled'),
  },
  secondary: {
    rest: live('color/surface/base', 'color/border/{tone}/subtle', 'color/text/{tone}', 'color/icon/{tone}'),
    hover: live('color/fill/{tone}/subtle/hover', 'color/border/{tone}/subtle', ['color/text/{tone}/hover', 'color/text/{tone}'], ['color/icon/{tone}/hover', 'color/icon/{tone}']),
    pressed: live('color/fill/{tone}/subtle/pressed', 'color/border/{tone}/subtle', ['color/text/{tone}/hover', 'color/text/{tone}'], ['color/icon/{tone}/hover', 'color/icon/{tone}']),
    disabled: live('color/surface/base', 'color/border/disabled', 'color/text/disabled', 'color/icon/disabled'),
  },
  tertiary: {
    rest: live('color/fill/none', null, 'color/text/{tone}', 'color/icon/{tone}'),
    hover: live('color/fill/{tone}/subtle/hover', null, ['color/text/{tone}/hover', 'color/text/{tone}'], ['color/icon/{tone}/hover', 'color/icon/{tone}']),
    pressed: live('color/fill/{tone}/subtle/pressed', null, ['color/text/{tone}/hover', 'color/text/{tone}'], ['color/icon/{tone}/hover', 'color/icon/{tone}']),
    disabled: live('color/fill/none', null, 'color/text/disabled', 'color/icon/disabled'),
  },
};
// The brand tone's secondary and tertiary buttons are neutral, so they sit quietly next to a primary one.
const toneRoles = {
  brand: {
    secondary: {
      rest: live('color/surface/base', 'color/border/default', 'color/text/secondary', 'color/icon/secondary'),
      hover: live('color/surface/base/hover', 'color/border/default', 'color/text/primary', 'color/icon/primary'),
      pressed: live('color/surface/base/pressed', 'color/border/default', 'color/text/primary', 'color/icon/primary'),
    },
    tertiary: {
      rest: live('color/fill/none', null, 'color/text/secondary', 'color/icon/secondary'),
      hover: live('color/fill/neutral/subtle/hover', null, 'color/text/primary', 'color/icon/primary'),
      pressed: live('color/fill/neutral/subtle/pressed', null, 'color/text/primary', 'color/icon/primary'),
    },
  },
};

export const defaults = {
  // §4: visual padding (px, before space/optical), gap and label size per size.
  sizes: [
    {size: 'xs', padding: 10, gap: 'space/xs', label: 'sm'}, {size: 'sm', padding: 12, gap: 'space/xs', label: 'sm'},
    {size: 'md', padding: 14, gap: 'space/xs', label: 'sm'}, {size: 'lg', padding: 16, gap: 'space/sm', label: 'md'},
    {size: 'xl', padding: 18, gap: 'space/sm', label: 'md'},
  ],
  emphases: ['primary', 'secondary', 'tertiary'],
  tones: ['brand', 'danger'],
  states: ['rest', 'hover', 'pressed', 'focus', 'disabled', 'loading'],
  // Which role row each state draws from; focus and loading look like rest.
  stateRoles: {rest: 'rest', hover: 'hover', pressed: 'pressed', focus: 'rest', disabled: 'disabled', loading: 'rest'},
  defaultVariant: {size: 'md', emphasis: 'primary', tone: 'brand', state: 'rest'},
  properties: [
    {name: 'Label', type: 'text', default: 'Button'},
    {name: 'Show leading icon', type: 'boolean', default: false}, {name: 'Show trailing icon', type: 'boolean', default: false},
    {name: 'Leading icon', type: 'instance swap', default: 'plus'}, {name: 'Trailing icon', type: 'instance swap', default: 'arrow-right'},
    {name: 'Show loading text', type: 'boolean', default: true},
  ],
  roles,
  toneRoles,
  effects: {raised: 'elevation/control', raisedEmphases: ['primary', 'secondary'], focus: {danger: 'focus/danger', '*': 'focus/default'}, focusStates: ['focus'], none: ['disabled']},
  labelWeights: ['semibold', 'medium', 'bold', 'regular'],
  depth: 'auto',
};

// Object inputs (roles, toneRoles, effects…) merge into the defaults, so changing one role keeps the rest.
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
const settings = inputs => merge(defaults, inputs || {});

// One sentence for a structure this template cannot build.
export function checkInputs(inputs = {}) {
  const s = settings(inputs), lists = {emphases: 'emphasis', tones: 'tone', states: 'state', labelWeights: 'label weight'};
  for (const [key, one] of Object.entries(lists)) {
    if (!Array.isArray(s[key]) || s[key].some(x => typeof x !== 'string' || !x)) throw new ItemError(`Send ${key} as a list.`);
    if (!s[key].length) throw new ItemError(`Button needs at least one ${one}.`);
    const twice = s[key].find((x, i) => s[key].indexOf(x) !== i);
    if (twice) throw new ItemError(`Button lists ${one} ${twice} twice.`);
  }
  if (!Array.isArray(s.sizes) || !s.sizes.length) throw new ItemError('Button needs at least one size.');
  for (const z of s.sizes) if (!plain(z) || typeof z.size !== 'string' || typeof z.padding !== 'number' || typeof z.gap !== 'string' || typeof z.label !== 'string') throw new ItemError('Send each size as {size, padding (px), gap (token), label (sm|md|…)}.');
  const twice = s.sizes.map(z => z.size).find((x, i, a) => a.indexOf(x) !== i);
  if (twice) throw new ItemError(`Button lists size ${twice} twice.`);
  if (!Array.isArray(s.properties) || s.properties.some(p => !plain(p) || typeof p.name !== 'string')) throw new ItemError('Send properties as a list of {name, type, default}.');
  for (const key of ['stateRoles', 'defaultVariant', 'roles', 'toneRoles', 'effects']) if (!plain(s[key])) throw new ItemError(`Send ${key} as an object.`);
  for (const key of ['raisedEmphases', 'focusStates', 'none']) if (!Array.isArray(s.effects[key])) throw new ItemError(`Send effects.${key} as a list.`);
  if (typeof s.effects.raised !== 'string' || !plain(s.effects.focus)) throw new ItemError('Send effects.raised as a style name and effects.focus as an object.');
  for (const em of s.emphases) if (!plain(s.roles[em])) throw new ItemError(`Button has no roles for the ${em} emphasis.`);
  if (!['auto', true, false].includes(s.depth)) throw new ItemError('Send depth as "auto", true or false.');
}
const variants = s => [
  {name: 'Size', type: 'variant', values: s.sizes.map(z => z.size), default: s.sizes.some(z => z.size === s.defaultVariant.size) ? s.defaultVariant.size : s.sizes[0].size},
  {name: 'Emphasis', type: 'variant', values: s.emphases, default: s.emphases.includes(s.defaultVariant.emphasis) ? s.defaultVariant.emphasis : s.emphases[0]},
  {name: 'Tone', type: 'variant', values: s.tones, default: s.tones.includes(s.defaultVariant.tone) ? s.defaultVariant.tone : s.tones[0]},
  {name: 'State', type: 'variant', values: s.states, default: s.states.includes(s.defaultVariant.state) ? s.defaultVariant.state : s.states[0]},
  {name: 'Icon only', type: 'variant', values: ['false', 'true'], default: 'false'},
];

export function contract(inputs = {}) {
  const s = settings(inputs), props = [...variants(s), ...s.properties];
  const tokens = s.sizes.flatMap(z => [...['top', 'right', 'bottom', 'left'].map(side => `button/padding-${side}/${z.size}`), `button/gap/${z.size}`]);
  return {properties: props, variantCount: props.filter(p => p.type === 'variant').reduce((n, p) => n * p.values.length, 1), tokens};
}

const list = items => items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' and ' + items.at(-1);

function treatment(s, tone, emphasis, state, depth, has, notes) {
  const pick = role => {
    if (role === null || role === undefined) return null;
    if (!Array.isArray(role)) return role.replaceAll('{tone}', tone);
    const [wanted, fallback] = role.map(r => r.replaceAll('{tone}', tone));
    if (has(wanted)) return wanted;
    if (fallback && !notes.includes(`${wanted} → ${fallback}`)) notes.push(`${wanted} → ${fallback}`);
    return fallback;
  };
  const row = s.stateRoles[state] || 'rest';
  const base = {...s.roles[emphasis]?.[row], ...s.toneRoles[tone]?.[emphasis]?.[row]};
  const out = {fill: pick(base.fill), border: pick(base.border), text: pick(base.text), icon: pick(base.icon)};
  const e = s.effects, raised = depth && e.raisedEmphases.includes(emphasis), focus = e.focus[tone] || e.focus['*'];
  out.effect = e.none.includes(row) ? null : e.focusStates.includes(state) ? (raised ? pick([focus + '/control', focus]) : focus) : raised ? e.raised : null;
  return out;
}

export function compile(inputs, {draft, plan, overrides = {}}) {
  const s = settings(inputs), r = resolver(draft), notes = [], risks = [], decisions = [];
  const depth = s.depth !== 'auto' ? !!s.depth : plan?.domains?.elevation?.inputs?.treatment ? plan.domains.elevation.inputs.treatment !== 'none' : draft.effectStyles.some(e => e.name === s.effects.raised);
  const weight = s.labelWeights.find(w => draft.textStyles.some(st => st.name === `type/body/sm/${w}`));
  if (!weight) throw new ItemError('The foundations have no body text styles for the Button label.');
  const faces = [...new Set(draft.textStyles.filter(st => st.name.startsWith('type/body/')).map(st => st.name.split('/').at(-1)))];
  const title = w => w[0].toUpperCase() + w.slice(1);
  if (weight !== s.labelWeights[0]) decisions.push({key: 'Button text weight', value: title(weight), style: `type/body/{sm,md}/${weight}`, decidedBy: 'AI', reason: `The button guide asks for semi-bold text, but your text styles only come in ${faces.join(', ')}. ${title(weight)} is the closest.`});
  decisions.push({key: 'Shadow', value: depth ? 'Primary and Secondary buttons get a soft shadow' : 'No shadow', decidedBy: 'AI', reason: depth ? 'Your foundations use layered shadows, so raised buttons get the same soft shadow.' : 'Your foundations use flat surfaces without shadows.'});
  // Every measurement is assigned to a semantic token, never a raw value. The spec's visual padding has
  // no exact space step, so it starts at the nearest one and the user tunes it in Builder.
  const space = draft.variables.filter(v => v.collection === 'Space' && !v.name.endsWith('/optical') && typeof r.value(v.name) === 'number');
  const nearest = px => space.reduce((a, b) => Math.abs(r.value(b.name) - px) < Math.abs(r.value(a.name) - px) || Math.abs(r.value(b.name) - px) === Math.abs(r.value(a.name) - px) && r.value(b.name) > r.value(a.name) ? b : a).name;
  const sides = ['top', 'right', 'bottom', 'left'], none = space.find(v => r.value(v.name) === 0)?.name || 'space/none';
  const sizeRows = s.sizes.map(z => {
    const x = nearest(z.padding), o = overrides.sizes?.[z.size] || {};
    return {size: z.size, height: o.height || `size/control/${z.size}`, padding: {top: o.padding?.top || none, right: o.padding?.right || x, bottom: o.padding?.bottom || none, left: o.padding?.left || x},
      gap: o.gap || z.gap, icon: 'size/icon/md', label: o.label || `type/body/${z.label}/${weight}`, inset: 'space/optical', radius: o.radius || 'radius/control', borderWidth: 'border/width/default'};
  });
  decisions.push({key: 'Side spacing', value: sizeRows.map(z => `${z.size}: ${z.padding.left.split('/').at(-1)}`).join(', '), decidedBy: 'AI', reason: `The button guide uses ${list(s.sizes.map(z => String(z.padding)))} px, but only some of those are spacing tokens. Each size starts at the nearest token; adjust them in the panel.`});
  const primitives = [], tokens = [];
  for (const z of sizeRows) {
    for (const side of sides) tokens.push({name: `button/padding-${side}/${z.size}`, collection: 'Components', type: 'FLOAT', values: {Value: {alias: z.padding[side]}}, description: `${side[0].toUpperCase() + side.slice(1)} padding of ${z.size} buttons, outside the optical text inset.`, scopes: ['GAP'], codeSyntax: {WEB: `var(--button-padding-${side}-${z.size})`}});
    tokens.push({name: `button/gap/${z.size}`, collection: 'Components', type: 'FLOAT', values: {Value: {alias: z.gap}}, description: `Space between the icon and label of ${z.size} buttons.`, scopes: ['GAP'], codeSyntax: {WEB: `var(--button-gap-${z.size})`}});
  }
  // A fill may be a gradient (paint style); the validator keeps gradients out of every other slot.
  const defined = n => r.has(n) || draft.effectStyles.some(e => e.name === n) || !!paintOf(draft, n);
  const treatments = Object.fromEntries(s.tones.map(tone => [tone, Object.fromEntries(s.emphases.map(e => [e, Object.fromEntries(s.states.map(st => [st, {...treatment(s, tone, e, st, depth, defined, notes), ...(overrides.treatments?.[`${tone}|${e}|${st}`] || {})}]))]))]));
  const missing = [...new Set(Object.values(treatments).flatMap(t => Object.values(t).flatMap(e => Object.values(e).flatMap(x => [x.fill, x.border, x.text, x.icon].filter(Boolean)))).filter(n => !r.has(n) && !paintOf(draft, n)))];
  for (const z of sizeRows) for (const n of [z.height, z.icon, z.inset, z.radius, z.borderWidth, z.gap, ...Object.values(z.padding)]) if (!r.has(n)) missing.push(n);
  for (const t of Object.values(treatments).flatMap(x => Object.values(x).flatMap(y => Object.values(y)))) if (t.effect && !defined(t.effect)) missing.push(t.effect);
  for (const z of sizeRows) if (!draft.textStyles.some(t => t.name === z.label)) missing.push(z.label);
  if (missing.length) throw Object.assign(new ItemError('The foundations are missing roles the Button needs: ' + [...new Set(missing)].slice(0, 6).join(', ')), {status: 412});
  // Text on a gradient fill is checked against every stop.
  for (const [tone, ems] of Object.entries(treatments)) for (const [em, states] of Object.entries(ems)) for (const [st, t] of Object.entries(states))
    if (paintOf(draft, t.fill) && r.has(t.text)) {
      const where = `${title(tone)} ${em} ${st} text`, risk = paintRisk(draft, {where, text: t.text, paint: t.fill});
      for (const n of paintContrast(draft, {where, text: t.text, paint: t.fill})) if (!notes.includes(n)) notes.push(n);
      if (risk) risks.push(risk);
    }
  const c = contract(s), variantProps = c.properties.filter(p => p.type === 'variant');
  return {
    id, page, name, set,
    variantPattern: variantProps.map(p => `${p.name}=${p.default}`).join(', '),
    properties: c.properties,
    variantCount: c.variantCount,
    primitives, tokens, sizes: sizeRows, treatments, depth, decisions, notes, ...(risks.length ? {risks} : {}), overrides,
  };
}

// Resolved values for Builder's preview only; Figma and the site use the token names above.
export function preview(part, draft) {
  const r = resolver(draft), withTokens = {...draft, variables: [...draft.variables, ...part.primitives, ...part.tokens], collections: [...draft.collections, {name: 'Components', modes: ['Value']}]}, rp = resolver(withTokens);
  // Shadows only: an inner shadow is drawn inside the button; hidden layers and blurs are not shadows.
  const shadow = n => { const e = draft.effectStyles.find(x => x.name === n); return e ? e.effects.filter(x => ['DROP_SHADOW', 'INNER_SHADOW'].includes(x.type) && x.visible !== false).map(x => `${x.type === 'INNER_SHADOW' ? 'inset ' : ''}${x.offset?.x ?? 0}px ${x.offset?.y ?? 0}px ${x.radius ?? 0}px ${x.spread ?? 0}px ${x.color?.alias ? r.color(x.color.alias) : 'transparent'}`).join(', ') : null; };
  const colors = prefixes => draft.variables.filter(v => v.type === 'COLOR' && prefixes.some(p => v.name.startsWith(p))).map(v => ({name: v.name, value: r.color(v.name)}));
  const numbers = prefixes => draft.variables.filter(v => v.type === 'FLOAT' && prefixes.some(p => v.name.startsWith(p))).map(v => ({name: v.name, value: r.value(v.name)}));
  const style = n => { const st = draft.textStyles.find(t => t.name === n); return st && {fontFamily: st.fontFamily, fontStyle: st.fontStyle, fontSize: st.fontSize, lineHeight: st.lineHeight?.value ?? null, letterSpacing: st.letterSpacing?.value ?? 0, weight: r.value(st.bound?.fontWeight) ?? 400}; };
  return {
    sizes: part.sizes.map(z => ({size: z.size, height: rp.value(z.height), padding: Object.fromEntries(Object.entries(z.padding).map(([k, v]) => [k, rp.value(v)])), gap: rp.value(z.gap), icon: rp.value(z.icon), inset: rp.value(z.inset), radius: rp.value(z.radius), borderWidth: rp.value(z.borderWidth), label: style(z.label), labelStyle: z.label})),
    // Token choices per control, with their resolved value, so Builder can preview any assignment.
    options: {
      // Gradients come after the colors, drawn with their stops resolved.
      fill: [...colors(['color/fill/', 'color/surface/']), ...(draft.paintStyles || []).map(g => ({name: g.name, value: paintCss(draft, g.name, r)}))], border: colors(['color/border/']), text: colors(['color/text/']), icon: colors(['color/icon/']),
      effect: draft.effectStyles.map(e => ({name: e.name, value: shadow(e.name)})),
      height: numbers(['size/control/']), space: numbers(['space/']).filter(o => !o.name.endsWith('/optical')), radius: numbers(['radius/']),
      label: draft.textStyles.map(t => ({name: t.name, value: style(t.name)})),
    },
    treatments: Object.fromEntries(Object.entries(part.treatments).map(([tone, e]) => [tone, Object.fromEntries(Object.entries(e).map(([em, st]) => [em, Object.fromEntries(Object.entries(st).map(([x, t]) => [x, {fill: paintOf(draft, t.fill) ? paintCss(draft, t.fill, r) : r.color(t.fill), border: t.border ? r.color(t.border) : null, text: r.color(t.text), icon: r.color(t.icon), shadow: t.effect ? shadow(t.effect) : null}]))]))])),
  };
}
