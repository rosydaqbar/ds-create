// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.5-tag.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'tag';
export const page = '2.5';
export const name = 'Tag';
export const set = 'Tag';
export const level = 'parts';
export const spec = 'specs/parts/2.5-tag.md';
export const uses = ['avatar', 'checkbox'];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: height, side padding, the tighter trailing padding, gap, label, close icon and dot per size. Every
    // measure the anatomy names is kept as tag/*/{size}. The avatar is Avatar 2xs at every size.
    sizes: [
      {size: 'sm', height: 24, paddingX: {alias: 'space/md'}, tight: 4, gap: 'space/xs', label: 'type/body/xs/medium', close: 'size/icon/xs', dot: 'size/indicator/xs'},
      {size: 'md', height: 28, paddingX: 10, tight: 4, gap: 'space/sm', label: 'type/body/sm/medium', close: 'size/icon/xs', dot: 'size/indicator/xs'},
      {size: 'lg', height: 32, paddingX: {alias: 'space/lg'}, tight: 6, gap: 'space/sm', label: 'type/body/sm/medium', close: 'size/icon/sm', dot: 'size/indicator/sm'},
    ],
    types: ['text', 'removable', 'count'],
    states: ['rest', 'hover', 'focus', 'disabled'],
    closeStates: ['rest', 'hover', 'focus'],
    defaultVariant: {size: 'md', type: 'text', state: 'rest'},
    properties: [prop('Label', 'text', 'Label'), prop('Count', 'text', '5'), prop('Show checkbox', 'boolean', false), prop('Show dot', 'boolean', false), prop('Show flag', 'boolean', false), prop('Show avatar', 'boolean', false), prop('Flag', 'instance swap', null)],
    // §6 per state; a dash in the spec keeps the rest role.
    roles: {
      rest: {fill: 'color/surface/base', border: 'color/border/default', label: 'color/text/secondary', dot: ['color/icon/success', 'color/icon/brand'], 'close-icon': 'color/icon/tertiary', 'close-background': null, 'count-fill': 'color/fill/neutral/subtle', 'count-text': 'color/text/secondary', effect: null},
      hover: {fill: 'color/surface/base/hover', label: 'color/text/primary', 'close-icon': 'color/icon/secondary', 'close-background': 'color/fill/neutral/subtle/hover'},
      focus: {effect: 'focus/default'},
      disabled: {fill: 'color/fill/neutral/subtle/disabled', border: 'color/border/disabled', label: 'color/text/disabled', dot: 'color/icon/disabled', 'close-icon': 'color/icon/disabled', 'count-text': 'color/text/disabled'},
    },
    closeRoles: {rest: {icon: 'color/icon/tertiary', background: null, effect: null}, hover: {icon: 'color/icon/secondary', background: 'color/fill/neutral/subtle/hover', effect: null}, focus: {icon: 'color/icon/tertiary', background: null, effect: 'focus/default'}},
    radius: 'radius/sm',
    partRadius: 'radius/xs',
    borderWidth: 'border/width/default',
    countStyle: 'type/body/xs/medium',
  },
  lists: {types: 'type', states: 'state', closeStates: 'close state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => {
    const sizes = s.sizes.map(z => z.size);
    return [
      {name: set, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), variant('State', s.states, s.defaultVariant.state), ...s.properties], axes: ['State'], row: c => ({...s.roles.rest, ...s.roles[c.State]})},
      {name: 'Tag close', private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('State', s.closeStates, s.closeStates[0])], axes: ['State'], row: c => ({...s.closeRoles[c.State]})},
      {name: 'Tag count', private: true, properties: [variant('Size', sizes, s.defaultVariant.size)], axes: [], row: () => ({fill: s.roles.rest['count-fill'], text: s.roles.rest['count-text']})},
    ];
  },
  measures: s => ({[set]: {
    ...Object.fromEntries(s.sizes.map(z => [z.size, {height: z.height, 'padding-x': z.paddingX, 'padding-x-tight': z.tight, gap: {alias: z.gap}, 'label-style': z.label, 'close-icon': z.close, dot: z.dot}])),
    '*': {radius: s.radius, 'part-radius': s.partRadius, 'border-width': s.borderWidth, 'count-style': s.countStyle},
  }}),
  describe: (_, slot, size) => ({height: `Height of ${size} tags.`, 'padding-x': `Side padding of ${size} tags.`, 'padding-x-tight': `Trailing padding of ${size} tags with a close or count.`, gap: `Space between the parts of ${size} tags.`})[slot],
});
