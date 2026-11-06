// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.17-kbd.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'kbd';
export const page = '2.17';
export const name = 'Kbd';
export const set = 'Kbd';
export const level = 'parts';
export const spec = 'specs/parts/2.17-kbd.md';
export const uses = [];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: height (also the minimum width, kept as kbd/height/{size}), side padding and text style per size.
    sizes: [{size: 'sm', height: 20, padding: 'space/xs', text: 'type/body/xs/medium'}, {size: 'md', height: 24, padding: 'space/sm', text: 'type/body/sm/medium'}],
    defaultVariant: {size: 'sm'},
    properties: [prop('Text', 'text', 'K')],
    // §6: one look for every size.
    roles: {fill: 'color/surface/sunken', border: 'color/border/default', 'border-width': 'border/width/default', radius: 'radius/xs', text: 'color/text/secondary'},
  },
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), ...s.properties], axes: [], row: () => ({...s.roles})}],
  measures: s => ({[set]: Object.fromEntries(s.sizes.map(z => [z.size, {height: z.height, 'padding-x': z.padding, 'text-style': z.text}]))}),
  describe: (_, slot, size) => `Height and minimum width of ${size} keys.`,
});
