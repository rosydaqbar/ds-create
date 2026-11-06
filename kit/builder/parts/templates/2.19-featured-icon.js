// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.19-featured-icon.md, and a system may change any of it.
import {checkObjects, definePart, existsFrom, keepAvailable, prop, variant} from '../kit.mjs';

export const id = 'featured-icon';
export const page = '2.19';
export const name = 'Featured icon';
export const set = 'Featured icon';
export const level = 'parts';
export const spec = 'specs/parts/2.19-featured-icon.md';
export const uses = [];

const look = (fill, border, outer, inner, icon, effect) => ({fill, border, 'outer-ring': outer, 'inner-ring': inner, icon, effect});
const toneProbe = t => t === 'neutral' ? ['color/fill/neutral/solid', 'color/fill/neutral/subtle'] : [`color/fill/${t}/solid`, `color/fill/${t}/subtle`, `color/border/${t}`, `color/border/${t}/subtle`, `color/icon/${t}`];

export const {fields, defaults, checkInputs, contract, compile, adapt} = definePart({
  id, page, name, set,
  defaults: {
    // §4: container (px kept as featured-icon/size/{size}), icon box and square radius per size.
    sizes: [
      {size: 'sm', side: 32, icon: 'size/icon/sm', radius: 'radius/control'}, {size: 'md', side: 40, icon: 'size/icon/md', radius: 'radius/control'},
      {size: 'lg', side: 48, icon: 'size/icon/lg', radius: 'radius/surface'}, {size: 'xl', side: 56, icon: 28, radius: 'radius/surface'},
    ],
    types: ['circle', 'square'],
    emphases: ['primary', 'secondary', 'tertiary'],
    tones: ['neutral', 'brand', 'danger', 'warning', 'success'],
    defaultVariant: {type: 'circle', size: 'md', emphasis: 'secondary', tone: 'brand'},
    properties: [prop('Icon', 'instance swap', 'placeholder')],
    // §3: a square featured icon is always tertiary.
    existsRule: {by: 'Type', only: {square: {Emphasis: ['tertiary']}}},
    // §6. Tertiary is drawn differently as a circle (two rings) and as a square (a raised tile).
    roles: {
      primary: look('color/fill/{tone}/solid', null, null, null, 'color/icon/on-solid', null),
      secondary: look('color/fill/{tone}/subtle', null, null, null, 'color/icon/{tone}', null),
      tertiary: look('color/fill/none', null, 'color/border/{tone}/subtle', 'color/border/{tone}', 'color/icon/{tone}', null),
      'tertiary-square': look('color/surface/base', 'color/border/default', null, null, 'color/icon/{tone}', ['elevation/raised', null]),
    },
    // Neutral resolves to its own roles; on the neutral solid fill the icon is inverse.
    neutralRoles: {primary: {icon: 'color/icon/inverse'}, secondary: {icon: 'color/icon/secondary'}, tertiary: {'outer-ring': 'color/border/subtle', 'inner-ring': 'color/border/default', icon: 'color/icon/secondary'}, 'tertiary-square': {icon: 'color/icon/secondary'}},
    shared: {'circle-radius': 'radius/full', 'ring-width': 'border/width/strong', 'border-width': 'border/width/default'},
  },
  lists: {types: 'type', emphases: 'emphasis', tones: 'tone'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{
    name: set,
    properties: [variant('Type', s.types, s.defaultVariant.type), variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Emphasis', s.emphases, s.defaultVariant.emphasis), variant('Tone', s.tones, s.defaultVariant.tone), ...s.properties],
    exists: existsFrom(s.existsRule), axes: ['Type', 'Emphasis', 'Tone'],
    row: c => { const key = c.Type === 'square' && c.Emphasis === 'tertiary' ? 'tertiary-square' : c.Emphasis; return {...s.roles[key], ...(c.Tone === 'neutral' ? s.neutralRoles[key] : {})}; },
  }],
  measures: s => ({[set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {size: z.side, icon: z.icon, 'square-radius': z.radius}])), '*': {...s.shared}}}),
  describe: (_, slot, size) => slot === 'size' ? `Container of ${size} featured icons.` : `Icon box of ${size} featured icons.`,
  adapt: (draft, s) => { const tones = keepAvailable(draft, name, s.tones, toneProbe, 'tone'); return {inputs: tones.decision ? {tones: tones.kept} : {}, decisions: [tones.decision].filter(Boolean)}; },
});
