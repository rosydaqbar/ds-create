// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.12-help-text.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'help-text';
export const page = '2.12';
export const name = 'Help text';
export const set = 'Help text';
export const level = 'parts';
export const spec = 'specs/parts/2.12-help-text.md';
export const uses = [];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    sizes: [{size: 'sm', text: 'type/body/xs/regular'}, {size: 'md', text: 'type/body/sm/regular'}],
    statuses: ['none', 'invalid'],
    defaultVariant: {size: 'md', status: 'none'},
    properties: [prop('Hint', 'text', 'This is a hint text to help the user.')],
    // §6: text color per status.
    roles: {none: {text: 'color/text/tertiary'}, invalid: {text: 'color/text/danger'}},
  },
  lists: {statuses: 'status'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Status', s.statuses, s.defaultVariant.status), ...s.properties], axes: ['Status'], row: c => ({...s.roles[c.Status]})}],
  measures: s => ({[set]: Object.fromEntries(s.sizes.map(z => [z.size, {'text-style': z.text}]))}),
});
