// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.4-badge.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, keepAvailable, prop, variant} from '../kit.mjs';

export const id = 'badge';
export const page = '2.4';
export const name = 'Badge';
export const set = 'Badge';
export const level = 'parts';
export const spec = 'specs/parts/2.4-badge.md';
export const uses = ['avatar'];

const look = (fill, border, label, icon) => ({fill, border, label, icon});
// The roles a tone or category family needs before it gets variants.
const toneProbe = t => t === 'neutral' ? ['color/fill/neutral/subtle'] : [`color/fill/${t}/subtle`, `color/border/${t}/subtle`, `color/text/${t}`, `color/icon/${t}`];
const familyProbe = f => [`color/category/${f}/subtle`, `color/category/${f}/border`, `color/category/${f}/text`, `color/category/${f}/solid`];

export const {fields, defaults, checkInputs, contract, compile, adapt} = definePart({
  id, page, name, set,
  defaults: {
    // §4: side padding (and the tighter side next to a visual), top and bottom padding, gap, label, dot and
    // icon per size. Paddings and the gap are kept as badge/*/{size}.
    sizes: [
      {size: 'sm', paddingX: 8, tight: 6, paddingY: 'space/xxs', gap: 'space/xs', label: 'type/body/xs/medium', dot: 'size/indicator/xs', icon: 'size/icon/xs'},
      {size: 'md', paddingX: 10, tight: 8, paddingY: 'space/xxs', gap: 'space/xs', label: 'type/body/sm/medium', dot: 'size/indicator/xs', icon: 'size/icon/xs'},
      {size: 'lg', paddingX: 12, tight: 10, paddingY: 'space/xs', gap: 'space/xs', label: 'type/body/sm/medium', dot: 'size/indicator/sm', icon: 'size/icon/sm'},
    ],
    types: ['pill', 'rounded', 'outline'],
    // Semantic tones, then category families; both are values of the Tone property.
    tones: ['neutral', 'brand', 'danger', 'warning', 'success', 'info'],
    families: ['slate', 'sky', 'blue', 'indigo', 'purple', 'pink', 'orange'],
    closeStates: ['rest', 'hover'],
    defaultVariant: {size: 'md', type: 'pill', tone: 'neutral'},
    properties: [
      prop('Label', 'text', 'Label'), prop('Show dot', 'boolean', false), prop('Show flag', 'boolean', false), prop('Show avatar', 'boolean', false),
      prop('Show leading icon', 'boolean', false), prop('Show trailing icon', 'boolean', false), prop('Show close', 'boolean', false),
      prop('Flag', 'instance swap', null), prop('Leading icon', 'instance swap', 'arrow-up'), prop('Trailing icon', 'instance swap', 'arrow-right'),
    ],
    // §6: pill and rounded are filled, outline is not. Neutral has its own roles where {tone} would name a
    // role the foundations do not have.
    typeLooks: {pill: 'filled', rounded: 'filled', outline: 'outline'},
    toneRoles: {filled: look('color/fill/{tone}/subtle', 'color/border/{tone}/subtle', 'color/text/{tone}', 'color/icon/{tone}'), outline: look('color/surface/base', 'color/border/default', 'color/text/secondary', 'color/icon/{tone}')},
    neutralRoles: {filled: {border: 'color/border/subtle', label: 'color/text/secondary', icon: 'color/icon/tertiary'}, outline: {icon: 'color/icon/tertiary'}},
    familyRoles: {filled: look('color/category/{family}/subtle', 'color/category/{family}/border', 'color/category/{family}/text', 'color/category/{family}/solid'), outline: look('color/surface/base', 'color/border/default', 'color/text/secondary', 'color/category/{family}/solid')},
    // The close: rest is the icon alone; hover adds a tinted background (none for category families).
    closeHover: 'color/fill/{tone}/subtle/hover',
    radius: {pill: 'radius/full', rounded: 'radius/sm', outline: 'radius/sm'},
    borderWidth: 'border/width/default',
  },
  lists: {types: 'type', tones: 'tone', closeStates: 'close state'},
  // A system may have no category families at all.
  check: s => {
    checkObjects(name, s.sizes, 'size', 'size');
    if (!Array.isArray(s.families) || s.families.some(f => typeof f !== 'string' || !f)) throw new ItemError('Send families as a list.');
    const twice = [...s.tones, ...s.families].find((x, i, a) => a.indexOf(x) !== i);
    if (twice) throw new ItemError(`Badge lists tone ${twice} twice.`);
  },
  sets: s => {
    const values = [...s.tones, ...s.families], isFamily = t => s.families.includes(t);
    const roles = (type, tone) => {
      const lookName = s.typeLooks[type] || 'filled';
      const r = isFamily(tone) ? s.familyRoles[lookName] : {...s.toneRoles[lookName], ...(tone === 'neutral' ? s.neutralRoles[lookName] : {})};
      return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'string' ? v.replaceAll('{family}', tone) : v]));
    };
    return [
      {name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), variant('Tone', values, s.defaultVariant.tone), variant('Icon only', ['false', 'true'], 'false'), ...s.properties],
        axes: ['Type', 'Tone'], row: c => ({...roles(c.Type, c.Tone), radius: s.radius[c.Type] || s.radius.rounded})},
      {name: 'Badge close', private: true, properties: [variant('Type', s.types, s.defaultVariant.type), variant('Tone', values, s.defaultVariant.tone), variant('State', s.closeStates, s.closeStates[0])],
        axes: ['Type', 'Tone', 'State'], row: c => ({icon: roles(c.Type, c.Tone).icon, background: c.State === 'hover' && !isFamily(c.Tone) ? s.closeHover : null})},
    ];
  },
  measures: s => ({[set]: {
    ...Object.fromEntries(s.sizes.map(z => [z.size, {'padding-x': z.paddingX, 'padding-x-tight': z.tight, 'padding-y': {alias: z.paddingY}, gap: {alias: z.gap}, 'label-style': z.label, dot: z.dot, icon: z.icon}])),
    '*': {'border-width': s.borderWidth},
  }}),
  describe: (_, slot, size) => ({'padding-x': `Side padding of ${size} badges.`, 'padding-x-tight': `Side padding of ${size} badges next to a dot, avatar, flag or close.`, 'padding-y': `Top and bottom padding of ${size} badges.`, gap: `Space between the parts of ${size} badges.`})[slot],
  // A tone or family the foundations have no colors for gets no variants until the user adds it back.
  adapt: (draft, s) => {
    const tones = keepAvailable(draft, name, s.tones, toneProbe, 'tone'), families = keepAvailable(draft, name, s.families, familyProbe, 'category family');
    return {inputs: {...(tones.decision ? {tones: tones.kept} : {}), ...(families.decision ? {families: families.kept} : {})}, decisions: [tones.decision, families.decision].filter(Boolean)};
  },
});
