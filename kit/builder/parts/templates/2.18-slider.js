// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.18-slider.md, and a system may change any of it.
import {definePart, existsFrom, prop, variant} from '../kit.mjs';

export const id = 'slider';
export const page = '2.18';
export const name = 'Slider';
export const set = 'Slider';
export const level = 'parts';
export const spec = 'specs/parts/2.18-slider.md';
export const uses = ['tooltip'];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    startValues: ['0', '25', '50', '75'],
    endValues: ['25', '50', '75', '100'],
    placements: ['none', 'bottom', 'top'],
    handleStates: ['rest', 'hover', 'focus'],
    defaultVariant: {start: '0', end: '50', placement: 'none', state: 'rest'},
    properties: [prop('Show start handle', 'boolean', true)],
    handleProperties: [prop('Text', 'text', '50')],
    // §3: only pairs where the start is below the end exist.
    existsRule: {ascending: [['Start value', 'End value']]},
    roles: {track: 'color/fill/neutral/track', progress: 'color/fill/brand/solid', text: 'color/text/primary'},
    // §5 per handle state. A layer takes one effect style, so the focused handle shows the focus ring in
    // place of its shadow; a system without shadows draws the knob flat.
    handleRoles: {rest: {fill: 'color/surface/base', border: 'color/border/brand', effect: ['elevation/raised', null]}, hover: {fill: 'color/fill/brand/subtle', border: 'color/border/brand', effect: ['elevation/raised', null]}, focus: {fill: 'color/surface/base', border: 'color/border/brand', effect: 'focus/default'}},
    measures: {'track-height': 'size/track/lg', radius: 'radius/full', knob: 'size/icon/lg', 'knob-border': 'border/width/strong', 'label-style': 'type/body/md/medium', 'label-gap': 'space/md', 'tooltip-gap': 'space/md'},
  },
  lists: {startValues: 'start value', endValues: 'end value', placements: 'placement', handleStates: 'handle state'},
  sets: s => [
    {name: set, properties: [variant('Start value', s.startValues, s.defaultVariant.start), variant('End value', s.endValues, s.defaultVariant.end), variant('Placement', s.placements, s.defaultVariant.placement), ...s.properties],
      exists: existsFrom(s.existsRule), axes: [], row: () => ({...s.roles})},
    {name: 'Slider handle', private: true, properties: [variant('State', s.handleStates, s.defaultVariant.state), variant('Placement', s.placements, s.defaultVariant.placement), ...s.handleProperties], axes: ['State'], row: c => ({...s.handleRoles[c.State]})},
  ],
  measures: s => ({[set]: {'*': {...s.measures}}}),
});
