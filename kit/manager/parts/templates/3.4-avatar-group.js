// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.4-avatar-group.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, prop, semibold, variant} from '../kit.mjs';

export const id = 'avatar-group';
export const page = '3.4';
export const name = 'Avatar group';
export const set = 'Avatar group';
export const level = 'components';
export const spec = 'specs/components/3.4-avatar-group.md';
export const uses = ['avatar'];

const label = 'Avatar label', add = 'Avatar group add button';
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: the group's Avatar size, overlap (kept as avatar-group/overlap/{size}) and the gap to the add button.
    sizes: [
      {size: 'xs', avatar: 'size/avatar/xs', overlap: -4, gap: 'space/md', addIcon: 'size/icon/xs'},
      {size: 'sm', avatar: 'size/avatar/sm', overlap: -8, gap: 'space/md', addIcon: 'size/icon/sm'},
      {size: 'md', avatar: 'size/avatar/md', overlap: -12, gap: 'space/md', addIcon: 'size/icon/sm'},
    ],
    labelSizes: [
      {size: 'sm', avatar: 'size/avatar/sm', gap: 'space/md', text: semibold('body', 'sm'), supporting: 'type/body/sm/regular'},
      {size: 'md', avatar: 'size/avatar/md', gap: 'space/md', text: semibold('body', 'sm'), supporting: 'type/body/sm/regular'},
      {size: 'lg', avatar: 'size/avatar/lg', gap: 'space/lg', text: semibold('body', 'md'), supporting: 'type/body/md/regular'},
    ],
    // The avatars a group shows before its count.
    avatars: 4,
    states: ['rest', 'hover', 'focus', 'disabled'],
    defaultVariant: {size: 'sm', labelSize: 'md'},
    properties: [prop('Count', 'text', '+5'), prop('Show count', 'boolean', true), prop('Show add button', 'boolean', true)],
    labelProperties: [prop('Text', 'text', 'Olivia Rhye'), prop('Supporting text', 'text', 'olivia@example.com'), prop('Show supporting text', 'boolean', true)],
    // §5 and §6.
    ring: 'color/surface/base',
    labelRoles: {text: 'color/text/primary', supporting: 'color/text/tertiary'},
    addLooks: {
      rest: {border: 'color/border/default', fill: 'color/fill/none', icon: 'color/icon/tertiary'},
      hover: {border: 'color/border/strong', fill: 'color/fill/neutral/subtle/hover', icon: 'color/icon/secondary'},
      focus: {border: 'color/border/default', fill: 'color/fill/none', icon: 'color/icon/tertiary'},
      disabled: {border: 'color/border/disabled', fill: 'color/fill/none', icon: 'color/icon/disabled'},
    },
    focus: 'focus/default',
  },
  lists: {states: 'state'},
  check: s => {
    checkObjects(name, s.sizes, 'size', 'size'); checkObjects(name, s.labelSizes, 'size', 'label size');
    if (!Number.isInteger(s.avatars) || s.avatars < 1) throw new ItemError('Send avatars as a whole number of at least 1.');
  },
  sets: s => {
    const sizes = s.sizes.map(z => z.size);
    return [
      // §7: the group's Size reaches every Avatar and the add button one-to-one; the count is an initials Avatar.
      {name: set, properties: [variant('Size', sizes, s.defaultVariant.size), ...s.properties], axes: [], row: () => ({ring: s.ring}),
        instances: c => ({
          ...Object.fromEntries(Array.from({length: s.avatars}, (_, i) => [`avatar-${i + 1}`, {part: 'avatar', variant: {Size: c.Size, Type: 'image'}}])),
          count: {part: 'avatar', variant: {Size: c.Size, Type: 'initials'}},
          add: {part: id, set: add, variant: {Size: c.Size}},
        })},
      {name: label, properties: [variant('Size', s.labelSizes.map(z => z.size), s.defaultVariant.labelSize), ...s.labelProperties], axes: [], row: () => ({...s.labelRoles}),
        instances: c => ({avatar: {part: 'avatar', variant: {Size: c.Size}}})},
      {name: add, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('State', s.states, s.states[0])], axes: ['State'],
        row: c => ({...s.addLooks[c.State], effect: c.State === 'focus' ? s.focus : null})},
    ];
  },
  measures: s => ({
    [set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {avatar: z.avatar, overlap: z.overlap, 'add-gap': z.gap}])), '*': {'ring-width': 'border/width/strong'}},
    [label]: Object.fromEntries(s.labelSizes.map(z => [z.size, {avatar: z.avatar, gap: z.gap, 'text-style': z.text, 'supporting-style': z.supporting}])),
    [add]: {...Object.fromEntries(s.sizes.map(z => [z.size, {size: z.avatar, icon: z.addIcon}])), '*': {radius: 'radius/full', 'border-width': 'border/width/default'}},
  }),
  describe: (_, slot, size) => ({overlap: `How far each ${size} avatar overlaps the one before it.`})[slot],
});
