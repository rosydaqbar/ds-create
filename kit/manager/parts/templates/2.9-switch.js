// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.9-switch.md, and a system may change any of it.
import {checkObjects, definePart, variant} from '../kit.mjs';

export const id = 'switch';
export const page = '2.9';
export const name = 'Switch';
export const set = 'Switch';
export const level = 'parts';
export const spec = 'specs/parts/2.9-switch.md';
export const uses = [];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: default and slim measures per size, px kept as switch/*/{size}.
    sizes: [{size: 'sm', width: 36, height: 20, thumb: 16, slimWidth: 32, slimTrack: 10}, {size: 'md', width: 44, height: 24, thumb: 20, slimWidth: 40, slimTrack: 12}],
    types: ['default', 'slim'],
    checked: ['false', 'true'],
    states: ['rest', 'hover', 'focus', 'disabled'],
    stateRoles: {rest: 'rest', hover: 'hover', focus: 'rest', disabled: 'disabled'},
    defaultVariant: {size: 'md', type: 'default', checked: 'false', state: 'rest'},
    // §6: track per checked value and state, and the slim thumb's border. The off-hover track has no
    // foundation role, so it is a component token (switch/track/off-hover).
    roles: {
      off: {rest: {track: 'color/fill/neutral/track', 'thumb-border': 'color/border/default'}, hover: {track: 'switch/track/off-hover', 'thumb-border': 'color/border/default'}, disabled: {track: 'color/fill/neutral/subtle/disabled', 'thumb-border': 'color/border/default'}},
      on: {rest: {track: 'color/fill/brand/solid', 'thumb-border': 'color/fill/brand/solid'}, hover: {track: 'color/fill/brand/solid/hover', 'thumb-border': 'color/fill/brand/solid'}, disabled: {track: 'color/fill/neutral/subtle/disabled', 'thumb-border': 'color/fill/brand/solid'}},
    },
    colors: {'thumb-fill': 'color/surface/base', 'off-hover': 'color/border/strong'},
    focus: 'focus/default',
    // The thumb's shadow; a system without shadows draws it flat.
    thumbEffect: ['elevation/raised', null],
    inset: 'space/xxs',
    radius: 'radius/full',
    borderWidth: 'border/width/default',
  },
  lists: {types: 'type', checked: 'checked value', states: 'state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [
    {name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), variant('Checked', s.checked, s.defaultVariant.checked), variant('State', s.states, s.defaultVariant.state)],
      axes: ['Checked', 'State'], row: c => ({...s.roles[c.Checked === 'false' ? 'off' : 'on'][s.stateRoles[c.State] || 'rest'], effect: c.State === 'focus' ? s.focus : null, 'thumb-shadow': c.State === 'disabled' ? null : s.thumbEffect})},
    {name: 'Switch thumb', private: true, properties: [variant('Type', s.types, s.defaultVariant.type)], axes: ['Type'], row: c => ({fill: 'switch/thumb/fill', effect: s.thumbEffect, border: c.Type === 'slim' ? 'color/border/default' : null})},
  ],
  measures: s => ({[set]: {
    ...Object.fromEntries(s.sizes.map(z => [z.size, {width: z.width, height: z.height, thumb: z.thumb, 'slim-width': z.slimWidth, 'slim-track': z.slimTrack}])),
    '*': {inset: {alias: s.inset}, radius: s.radius, 'border-width': s.borderWidth},
  }}),
  tokens: s => [
    {set, role: 'thumb', variant: 'fill', value: {alias: s.colors['thumb-fill']}, type: 'COLOR', description: 'Fill of the switch thumb.'},
    {set, role: 'track', variant: 'off-hover', value: {alias: s.colors['off-hover']}, type: 'COLOR', description: 'Track of an off switch on hover; the neutral track role has no hover shade.'},
  ],
});
