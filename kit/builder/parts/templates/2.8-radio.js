// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.8-radio.md, and a system may change any of it.
import {checkObjects, definePart, variant} from '../kit.mjs';
import {controlRoles, controlRow} from './2.7-checkbox.js';

export const id = 'radio';
export const page = '2.8';
export const name = 'Radio';
export const set = 'Radio';
export const level = 'parts';
export const spec = 'specs/parts/2.8-radio.md';
export const uses = [];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: ring size (px kept as radio/size/{size}) and dot per size.
    sizes: [{size: 'sm', ring: 16, dot: 'size/indicator/xs'}, {size: 'md', ring: 20, dot: 'size/indicator/sm'}],
    checked: ['false', 'true'],
    states: ['rest', 'hover', 'focus', 'disabled'],
    stateRoles: {rest: 'rest', hover: 'hover', focus: 'rest', disabled: 'disabled'},
    defaultVariant: {size: 'sm', checked: 'false', state: 'rest'},
    // §6: the same roles as Checkbox; the mark is the dot.
    roles: controlRoles,
    focus: 'focus/default',
    radius: 'radius/full',
    borderWidth: 'border/width/default',
  },
  lists: {checked: 'checked value', states: 'state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Checked', s.checked, s.defaultVariant.checked), variant('State', s.states, s.defaultVariant.state)], axes: ['Checked', 'State'], row: controlRow(s.roles, s.stateRoles, s.focus)}],
  measures: s => ({[set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {size: z.ring, dot: z.dot}])), '*': {radius: s.radius, 'border-width': s.borderWidth}}}),
});
