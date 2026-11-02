// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.14-progress.md, and a system may change any of it.
import {checkObjects, definePart, existsFrom, prop, variant} from '../kit.mjs';

export const id = 'progress';
export const page = '2.14';
export const name = 'Progress';
export const set = 'Progress';
export const level = 'parts';
export const spec = 'specs/parts/2.14-progress.md';
export const uses = [];

// A weight list: the first face the text styles have, closest to semibold first.
const semibold = (scale, size) => [`type/${scale}/${size}/semibold`, `type/${scale}/${size}/medium`, `type/${scale}/${size}/bold`];
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: ring thickness (px kept as progress/ring-thickness/{size}), number and label styles per size of the
    // circles. The diameters are drawn as built; they have no token. 2xs shows no label.
    sizes: [
      {size: '2xs', thickness: 6, number: semibold('body', 'sm'), label: null},
      {size: 'xs', thickness: 16, number: semibold('heading', 'sm'), label: 'type/body/xs/medium'},
      {size: 'sm', thickness: 16, number: semibold('heading', 'md'), label: 'type/body/xs/medium'},
      {size: 'md', thickness: 20, number: semibold('heading', 'lg'), label: 'type/body/sm/medium'},
      {size: 'lg', thickness: 20, number: semibold('heading', 'xl'), label: 'type/body/sm/medium'},
    ],
    types: ['bar', 'circle', 'half-circle'],
    values: ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
    placements: ['none', 'right', 'bottom-end', 'top', 'bottom'],
    defaultVariant: {type: 'bar', size: 'md', value: '40', placement: 'none'},
    properties: [prop('Show label', 'boolean', false), prop('Label', 'text', 'Active users')],
    // §3: bars come in one size with every placement; circles in every size with no placement.
    existsRule: {by: 'Type', only: {bar: {Size: ['md']}, circle: {Placement: ['none']}, 'half-circle': {Placement: ['none']}}},
    // §6.
    roles: {track: 'color/fill/neutral/track', fill: 'color/fill/brand/solid', 'value-label': 'color/text/secondary', number: 'color/text/primary', 'circle-label': 'color/text/tertiary'},
    floatingRoles: {fill: 'color/surface/raised', border: 'color/border/subtle', effect: ['elevation/raised', null], text: 'color/text/secondary'},
    bar: {'track-height': 'size/track/lg', radius: 'radius/full', 'value-style': 'type/body/sm/medium', 'gap-right': 'space/lg', 'gap-bottom-end': 'space/md', 'stack-gap': 'space/xxs'},
    floating: {'padding-y': 'space/md', 'padding-x': 'space/lg', 'text-style': semibold('body', 'xs'), distance: 'space/md', radius: 'radius/control', 'border-width': 'border/width/default'},
  },
  lists: {types: 'type', values: 'value', placements: 'placement'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [
    {name: set, properties: [variant('Type', s.types, s.defaultVariant.type), variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Value', s.values, s.defaultVariant.value), variant('Placement', s.placements, s.defaultVariant.placement), ...s.properties],
      exists: existsFrom(s.existsRule), axes: [], row: () => ({...s.roles})},
    {name: 'Progress floating label', private: true, properties: [], axes: [], row: () => ({...s.floatingRoles})},
  ],
  measures: s => ({
    [set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'ring-thickness': z.thickness, 'number-style': z.number, 'label-style': z.label}])), '*': {...s.bar}},
    'Progress floating label': {'*': {...s.floating}},
  }),
  describe: (_, slot, size) => `Ring thickness of ${size} circular progress.`,
});
