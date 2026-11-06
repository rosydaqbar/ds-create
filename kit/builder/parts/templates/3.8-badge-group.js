// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.8-badge-group.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'badge-group';
export const page = '3.8';
export const name = 'Badge group';
export const set = 'Badge group';
export const level = 'components';
export const spec = 'specs/components/3.8-badge-group.md';
export const uses = ['badge'];

export const {fields, defaults, checkInputs, contract, compile, adapt} = definePart({
  id, page, name, set,
  defaults: {
    // §4: the inner Badge size, message style, paddings on the badge and message sides (kept as
    // badge-group/padding-{badge,message}/{size}) and the trailing icon per size.
    sizes: [
      {size: 'md', badge: 'sm', message: 'type/body/sm/medium', paddingBadge: 4, paddingMessage: 10, icon: 'size/icon/sm'},
      {size: 'lg', badge: 'md', message: 'type/body/sm/medium', paddingBadge: 4, paddingMessage: 10, icon: 'size/icon/sm'},
    ],
    placements: ['left', 'right'],
    types: ['pill', 'outline'],
    tones: ['neutral', 'brand', 'danger', 'warning', 'success'],
    states: ['rest', 'hover', 'focus'],
    defaultVariant: {size: 'md', placement: 'left', type: 'pill', tone: 'brand'},
    properties: [prop('Badge label', 'text', 'New feature'), prop('Message', 'text', "We've just released a new update"), prop('Show trailing icon', 'boolean', true), prop('Trailing icon', 'instance swap', 'arrow-right')],
    // §7: the inner Badge takes the other type, so it stands out against the container.
    badgeTypes: {pill: 'outline', outline: 'pill'},
    // §6: pill is tinted by the tone, outline is a neutral surface. Neutral has its own roles where {tone} would
    // name a role the foundations do not have.
    looks: {
      pill: {fill: 'color/fill/{tone}/subtle', hover: 'color/fill/{tone}/subtle/hover', border: 'color/border/{tone}/subtle', message: 'color/text/{tone}', icon: 'color/icon/{tone}', radius: 'radius/full'},
      outline: {fill: 'color/surface/base', hover: 'color/surface/base/hover', border: 'color/border/default', message: 'color/text/secondary', icon: 'color/icon/tertiary', radius: 'radius/sm'},
    },
    neutral: {pill: {border: 'color/border/subtle', message: 'color/text/secondary', icon: 'color/icon/tertiary'}},
    focus: {danger: 'focus/danger', '*': 'focus/default'},
  },
  lists: {placements: 'placement', types: 'type', tones: 'tone', states: 'state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{
    name: set,
    properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Placement', s.placements, s.defaultVariant.placement), variant('Type', s.types, s.defaultVariant.type), variant('Tone', s.tones, s.defaultVariant.tone), variant('State', s.states, s.states[0]), ...s.properties],
    axes: ['Type', 'Tone', 'State'],
    row: c => {
      const look = {...s.looks[c.Type], ...(c.Tone === 'neutral' ? s.neutral[c.Type] : {})};
      return {fill: c.State === 'hover' ? look.hover : look.fill, border: look.border, message: look.message, icon: look.icon, radius: look.radius, effect: c.State === 'focus' ? s.focus[c.Tone] || s.focus['*'] : null};
    },
    // §7: Size maps md → sm and lg → md; the Tone is the group's; the Type is the other one.
    instances: c => ({badge: {part: 'badge', variant: {Size: s.sizes.find(z => z.size === c.Size).badge, Type: s.badgeTypes[c.Type], Tone: c.Tone}}}),
    instanceAxes: ['Size', 'Type', 'Tone'],
  }],
  measures: s => ({[set]: {
    ...Object.fromEntries(s.sizes.map(z => [z.size, {'padding-badge': z.paddingBadge, 'padding-message': z.paddingMessage, 'message-style': z.message, icon: z.icon}])),
    '*': {'padding-y': 'space/xs', gap: 'space/md', 'content-gap': 'space/xs', 'border-width': 'border/width/default'},
  }}),
  describe: (_, slot, size) => ({'padding-badge': `Padding on the badge side of ${size} Badge groups.`, 'padding-message': `Padding on the message side of ${size} Badge groups.`})[slot],
  // The group follows the tones its Badge kept: a tone Badge dropped gets no variants here either.
  adapt: (draft, s, plan, parts) => {
    const have = parts.badge?.properties?.find(p => p.name === 'Tone')?.values;
    if (!have) return {inputs: {}, decisions: []};
    const kept = s.tones.filter(t => have.includes(t)), gone = s.tones.filter(t => !kept.includes(t));
    if (!gone.length) return {inputs: {}, decisions: []};
    return {inputs: {tones: kept}, decisions: [{key: 'Badge group tones', value: kept.join(', ') || 'none', decidedBy: 'AI', reason: `Badge has no ${gone.join(', ')} ${gone.length > 1 ? 'tones' : 'tone'}, so the Badge group has no ${gone.join(', ')} variants.`}]};
  },
});
