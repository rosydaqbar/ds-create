// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.1-button-group.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, prop, semibold, variant} from '../kit.mjs';

export const id = 'button-group';
export const page = '3.1';
export const name = 'Button group';
export const set = 'Button group';
export const level = 'components';
export const spec = 'specs/components/3.1-button-group.md';
export const uses = [];

const item = 'Button group item';
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: the item per size. Paddings are kept as button-group/item/padding-{x,y}/{size}.
    sizes: [
      {size: 'sm', height: 'size/control/sm', paddingX: 'space/lg', paddingY: 'space/md', gap: 'space/sm', icon: 'size/icon/md', text: semibold('body', 'sm')},
      {size: 'md', height: 'size/control/md', paddingX: 'space/xl', paddingY: 'space/md', gap: 'space/sm', icon: 'size/icon/md', text: semibold('body', 'sm')},
    ],
    states: ['rest', 'hover', 'focus', 'disabled'],
    defaultVariant: {size: 'md'},
    // §3: the group holds three items, the first one selected.
    items: 3,
    itemProperties: [prop('Label', 'text', 'Button'), prop('Show leading icon', 'boolean', false), prop('Leading icon', 'instance swap', 'placeholder'), prop('Show dot', 'boolean', false), prop('Show divider', 'boolean', true)],
    // §5 and §6: the item's look per state; Selected=true takes the selected fill and the primary colors.
    looks: {
      rest: {fill: 'color/fill/none', label: 'color/text/secondary', icon: 'color/icon/secondary', dot: 'color/icon/success'},
      hover: {fill: 'color/fill/neutral/subtle/hover', label: 'color/text/primary', icon: 'color/icon/primary', dot: 'color/icon/success'},
      focus: {fill: 'color/fill/none', label: 'color/text/secondary', icon: 'color/icon/secondary', dot: 'color/icon/success'},
      disabled: {fill: 'color/fill/none', label: 'color/text/disabled', icon: 'color/icon/disabled', dot: 'color/icon/disabled'},
    },
    selected: {fill: 'color/fill/neutral/subtle/selected', label: 'color/text/primary', icon: 'color/icon/primary'},
    focus: 'focus/default',
    group: {border: 'color/border/default', radius: 'radius/control', divider: 'color/border/default'},
  },
  lists: {states: 'state'},
  check: s => {
    checkObjects(name, s.sizes, 'size', 'size');
    if (!Number.isInteger(s.items) || s.items < 2) throw new ItemError('Send items as a whole number of at least 2.');
  },
  sets: s => {
    const sizes = s.sizes.map(z => z.size);
    return [
      {name: set, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Icon only', ['false', 'true'], 'false')], axes: [],
        row: () => ({border: s.group.border, radius: s.group.radius}),
        // §7: the group's Size and Icon only reach every item one-to-one.
        instances: c => Object.fromEntries(Array.from({length: s.items}, (_, i) => [`item-${i + 1}`, {part: id, set: item, variant: {Size: c.Size, 'Icon only': c['Icon only'], ...(i === 0 ? {Selected: 'true'} : {})}}]))},
      {name: item, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Icon only', ['false', 'true'], 'false'), variant('Selected', ['false', 'true'], 'false'), variant('State', s.states, s.states[0]), ...s.itemProperties],
        axes: ['Selected', 'State'],
        row: c => {
          const look = s.looks[c.State];
          const on = c.Selected === 'true' ? {...s.selected, ...(c.State === 'disabled' ? {label: look.label, icon: look.icon} : {})} : {};
          return {...look, ...on, divider: s.group.divider, effect: c.State === 'focus' ? s.focus : null};
        }},
    ];
  },
  measures: s => ({
    [set]: {'*': {'border-width': 'border/width/default'}},
    [item]: {
      ...Object.fromEntries(s.sizes.map(z => [z.size, {height: z.height, 'padding-x': `button-group/item/padding-x/${z.size}`, 'padding-y': `button-group/item/padding-y/${z.size}`, gap: z.gap, icon: z.icon, 'text-style': z.text}])),
      '*': {'text-padding': 'space/optical', dot: 'size/indicator/sm', 'divider-width': 'border/width/default'},
    },
  }),
  tokens: s => s.sizes.flatMap(z => [
    {set, role: 'item/padding-x', variant: z.size, value: {alias: z.paddingX}, description: `Side padding of ${z.size} Button group items.`},
    {set, role: 'item/padding-y', variant: z.size, value: {alias: z.paddingY}, description: `Top and bottom padding of ${z.size} Button group items.`},
  ]),
});
