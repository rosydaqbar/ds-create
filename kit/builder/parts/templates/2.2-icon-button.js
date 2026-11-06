// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.2-icon-button.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'icon-button';
export const page = '2.2';
export const name = 'Icon button';
export const set = 'Icon button';
export const level = 'parts';
export const spec = 'specs/parts/2.2-icon-button.md';
export const uses = ['spinner'];

const look = (fill, border, icon) => ({fill, border, icon});
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: side (px kept as icon-button/size/{size}) and icon per size; the padding is what remains.
    sizes: [{size: 'xs', side: 28, icon: 'size/icon/sm'}, {size: 'sm', side: 32, icon: 'size/icon/sm'}, {size: 'md', side: 36, icon: 'size/icon/md'}, {size: 'lg', side: 44, icon: 'size/icon/lg'}],
    emphases: ['secondary', 'tertiary'],
    states: ['rest', 'hover', 'pressed', 'focus', 'disabled', 'loading'],
    // Focus and loading look like rest; loading shows the Spinner in the icon color.
    stateRoles: {rest: 'rest', hover: 'hover', pressed: 'pressed', focus: 'rest', disabled: 'disabled', loading: 'rest'},
    defaultVariant: {size: 'md', emphasis: 'tertiary', state: 'rest'},
    properties: [prop('Icon', 'instance swap', 'x')],
    // §6. The disabled fill is the rest fill.
    roles: {
      secondary: {rest: look('color/surface/base', 'color/border/default', 'color/icon/tertiary'), hover: look('color/surface/base/hover', 'color/border/default', 'color/icon/secondary'), pressed: look('color/surface/base/pressed', 'color/border/default', 'color/icon/secondary'), disabled: look('color/surface/base', 'color/border/disabled', 'color/icon/disabled')},
      tertiary: {rest: look('color/fill/none', null, 'color/icon/tertiary'), hover: look('color/fill/neutral/subtle/hover', null, 'color/icon/secondary'), pressed: look('color/fill/neutral/subtle/pressed', null, 'color/icon/secondary'), disabled: look('color/fill/none', null, 'color/icon/disabled')},
    },
    focus: 'focus/default',
    radius: 'radius/control',
    borderWidth: 'border/width/default',
  },
  lists: {emphases: 'emphasis', states: 'state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Emphasis', s.emphases, s.defaultVariant.emphasis), variant('State', s.states, s.defaultVariant.state), ...s.properties],
    axes: ['Emphasis', 'State'], row: c => ({...s.roles[c.Emphasis][s.stateRoles[c.State] || 'rest'], effect: c.State === 'focus' ? s.focus : null})}],
  measures: s => ({[set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {size: z.side, icon: z.icon}])), '*': {radius: s.radius, 'border-width': s.borderWidth}}}),
  describe: (_, slot, size) => `Side of ${size} icon buttons.`,
});
