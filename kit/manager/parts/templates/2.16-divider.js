// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.16-divider.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {definePart, prop, variant} from '../kit.mjs';

export const id = 'divider';
export const page = '2.16';
export const name = 'Divider';
export const set = 'Divider';
export const level = 'parts';
export const spec = 'specs/parts/2.16-divider.md';
export const uses = [];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    orientations: ['horizontal', 'vertical'],
    emphases: ['primary', 'secondary', 'tertiary'],
    defaultVariant: {orientation: 'horizontal', emphasis: 'tertiary'},
    properties: [prop('Show label', 'boolean', false), prop('Label', 'text', 'or')],
    // §9: the line's color and thickness per emphasis; the label is the same for every emphasis.
    roles: {
      primary: {stroke: 'color/border/strong', thickness: 'border/width/strong'},
      secondary: {stroke: 'color/border/default', thickness: 'border/width/default'},
      tertiary: {stroke: 'color/border/subtle', thickness: 'border/width/default'},
    },
    label: {color: 'color/text/tertiary', style: 'type/body/sm/medium', gap: 'space/md'},
  },
  lists: {orientations: 'orientation', emphases: 'emphasis'},
  check: s => { for (const e of s.emphases) if (!s.roles[e]) throw new ItemError(`Divider has no roles for the ${e} emphasis.`); },
  sets: s => [{
    name: set,
    properties: [variant('Orientation', s.orientations, s.defaultVariant.orientation), variant('Emphasis', s.emphases, s.defaultVariant.emphasis), ...s.properties],
    axes: ['Emphasis'],
    row: c => ({...s.roles[c.Emphasis], 'label-color': s.label.color}),
  }],
  measures: s => ({[set]: {'*': {'label-style': s.label.style, 'label-gap': s.label.gap}}}),
});
