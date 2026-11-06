// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.7-checkbox.md, and a system may change any of it.
import {checkObjects, definePart, variant} from '../kit.mjs';

export const id = 'checkbox';
export const page = '2.7';
export const name = 'Checkbox';
export const set = 'Checkbox';
export const level = 'parts';
export const spec = 'specs/parts/2.7-checkbox.md';
export const uses = [];

// §6: box fill, border and mark per checked value and state. Radio uses the same roles (spec 2.8 §6).
export const controlRoles = {
  off: {rest: {fill: 'color/surface/base', border: 'color/border/strong', mark: null}, hover: {fill: 'color/fill/brand/subtle', border: 'color/border/brand', mark: null}, disabled: {fill: 'color/fill/neutral/subtle/disabled', border: 'color/border/disabled', mark: null}},
  on: {rest: {fill: 'color/fill/brand/solid', border: 'color/fill/brand/solid', mark: 'color/icon/on-solid'}, hover: {fill: 'color/fill/brand/solid/hover', border: 'color/fill/brand/solid/hover', mark: 'color/icon/on-solid'}, disabled: {fill: 'color/fill/neutral/subtle/disabled', border: 'color/border/disabled', mark: 'color/icon/disabled'}},
};
// Focus looks like rest with the focus ring.
export const controlRow = (roles, stateRoles, focus) => c => {
  const row = stateRoles[c.State] || 'rest';
  return {...roles[c.Checked === 'false' ? 'off' : 'on'][row], effect: c.State === 'focus' ? focus : null};
};

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: box, radius and mark per size (px kept as checkbox/*/{size}, tokens aliased).
    sizes: [{size: 'sm', box: 16, radius: 'radius/xs', mark: 12}, {size: 'md', box: 20, radius: 'radius/sm', mark: 14}],
    checked: ['false', 'true', 'mixed'],
    states: ['rest', 'hover', 'focus', 'disabled'],
    stateRoles: {rest: 'rest', hover: 'hover', focus: 'rest', disabled: 'disabled'},
    // The property table's default; the spec's name pattern example shows md.
    defaultVariant: {size: 'sm', checked: 'false', state: 'rest'},
    roles: controlRoles,
    focus: 'focus/default',
    borderWidth: 'border/width/default',
  },
  lists: {checked: 'checked value', states: 'state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Checked', s.checked, s.defaultVariant.checked), variant('State', s.states, s.defaultVariant.state)], axes: ['Checked', 'State'], row: controlRow(s.roles, s.stateRoles, s.focus)}],
  measures: s => ({[set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {size: z.box, radius: {alias: z.radius}, mark: z.mark}])), '*': {'border-width': s.borderWidth}}}),
});
