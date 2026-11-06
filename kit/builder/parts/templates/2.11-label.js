// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.11-label.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'label';
export const page = '2.11';
export const name = 'Label';
export const set = 'Label';
export const level = 'parts';
export const spec = 'specs/parts/2.11-label.md';
export const uses = ['tooltip'];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: text style and gap per size. The help icon is the Help icon set as it is, at every size.
    sizes: [{size: 'sm', text: 'type/body/xs/medium', gap: 'space/xxs'}, {size: 'md', text: 'type/body/sm/medium', gap: 'space/xxs'}],
    defaultVariant: {size: 'md'},
    properties: [prop('Label', 'text', 'Label'), prop('Show required', 'boolean', false), prop('Show help icon', 'boolean', false)],
    // §6: the Label keeps these colors when its control is disabled.
    roles: {text: 'color/text/secondary', asterisk: 'color/text/brand'},
  },
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), ...s.properties], axes: [], row: () => ({...s.roles})}],
  measures: s => ({[set]: Object.fromEntries(s.sizes.map(z => [z.size, {'text-style': z.text, gap: z.gap}]))}),
});
