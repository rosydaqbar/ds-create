// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.3-link.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'link';
export const page = '2.3';
export const name = 'Link';
export const set = 'Link';
export const level = 'parts';
export const spec = 'specs/parts/2.3-link.md';
export const uses = [];

// A weight list: the first face the text styles have, closest to semibold first.
const semibold = size => [`type/body/${size}/semibold`, `type/body/${size}/medium`, `type/body/${size}/bold`];
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: label styles, standalone icon and gap (kept as link/gap/{size}) per size. Height is the line height.
    sizes: [
      {size: 'sm', standalone: semibold('sm'), inline: 'type/body/sm/regular', icon: 'size/icon/sm', gap: 'space/xs'},
      {size: 'md', standalone: semibold('md'), inline: 'type/body/md/regular', icon: 'size/icon/md', gap: 'space/xs'},
      {size: 'lg', standalone: semibold('lg'), inline: 'type/body/lg/regular', icon: 'size/icon/md', gap: 'space/sm'},
    ],
    types: ['inline', 'standalone'],
    tones: ['brand', 'neutral'],
    states: ['rest', 'hover', 'pressed', 'focus', 'disabled'],
    defaultVariant: {type: 'standalone', size: 'md', tone: 'brand', state: 'rest'},
    properties: [prop('Label', 'text', 'Link text'), prop('Show leading icon', 'boolean', false), prop('Show trailing icon', 'boolean', false), prop('Leading icon', 'instance swap', 'link'), prop('Trailing icon', 'instance swap', 'arrow-right')],
    // §6: label and icon color per state; {tone} fills from the Tone value, and a tone without hover or
    // pressed shades keeps its rest color. Focus is rest with the focus ring. No background.
    roles: {rest: 'color/text/{tone}', hover: ['color/text/{tone}/hover', 'color/text/{tone}'], pressed: ['color/text/{tone}/pressed', 'color/text/{tone}'], focus: 'color/text/{tone}', disabled: 'color/text/disabled'},
    toneRoles: {neutral: {rest: 'color/text/secondary', hover: 'color/text/primary', pressed: 'color/text/primary', focus: 'color/text/secondary'}},
    focus: 'focus/default',
    fill: 'color/fill/none',
    radius: 'radius/xs',
  },
  lists: {types: 'type', tones: 'tone', states: 'state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{name: set, properties: [variant('Type', s.types, s.defaultVariant.type), variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Tone', s.tones, s.defaultVariant.tone), variant('State', s.states, s.defaultVariant.state), ...s.properties],
    axes: ['Tone', 'State'], row: c => ({label: {...s.roles, ...s.toneRoles[c.Tone]}[c.State], fill: s.fill, effect: c.State === 'focus' ? s.focus : null})}],
  measures: s => ({[set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'standalone-style': z.standalone, 'inline-style': z.inline, icon: z.icon, gap: {alias: z.gap}}])), '*': {radius: s.radius}}}),
  describe: (_, slot, size) => `Space between the icon and label of ${size} links.`,
});
