// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.10-text-control.md, and a system may change any of it.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'text-control';
export const page = '2.10';
export const name = 'Text control';
export const set = 'Text control';
export const level = 'parts';
export const spec = 'specs/parts/2.10-text-control.md';
export const uses = ['avatar', 'tooltip', 'kbd'];

const base = {fill: 'color/surface/base', placeholder: 'color/text/placeholder', value: 'color/text/primary', supporting: 'color/text/tertiary', icon: 'color/icon/tertiary', 'status-icon': null, effect: null};
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: height, side padding (px kept as text-control/padding-x/{size}), gap, text style and icons per size.
    sizes: [
      {size: 'sm', height: 'size/control/sm', padding: 12, gap: 'space/md', text: 'type/body/sm/regular'},
      {size: 'md', height: 'size/control/md', padding: 12, gap: 'space/md', text: 'type/body/md/regular'},
      {size: 'lg', height: 'size/control/lg', padding: 14, gap: 'space/md', text: 'type/body/md/regular'},
    ],
    types: ['single-line', 'multi-line', 'select'],
    filled: ['false', 'true'],
    statuses: ['none', 'invalid'],
    states: ['rest', 'hover', 'focus', 'disabled'],
    defaultVariant: {type: 'single-line', size: 'md', filled: 'false', status: 'none', state: 'rest'},
    properties: [
      prop('Text', 'text', 'Placeholder'), prop('Supporting text', 'text', '@olivia'), prop('Prefix', 'text', 'https://'),
      prop('Show leading icon', 'boolean', false), prop('Leading icon', 'instance swap', 'mail'), prop('Show avatar', 'boolean', false), prop('Show dot', 'boolean', false),
      prop('Show prefix', 'boolean', false), prop('Show supporting text', 'boolean', false), prop('Show help icon', 'boolean', false), prop('Show shortcut', 'boolean', false),
      prop('Show trailing icon', 'boolean', false), prop('Trailing icon', 'instance swap', 'eye'), prop('Show resize handle', 'boolean', true),
    ],
    // §6 per state. Filled only switches the text between placeholder and value.
    roles: {
      rest: {...base, border: 'color/border/default'},
      hover: {...base, border: 'color/border/strong'},
      focus: {...base, border: 'color/border/brand', effect: 'focus/default'},
      disabled: {...base, fill: 'color/fill/neutral/subtle/disabled', border: 'color/border/disabled', placeholder: 'color/text/disabled', value: 'color/text/disabled', supporting: 'color/text/disabled', icon: 'color/icon/disabled'},
    },
    // Invalid keeps the danger border in every state except disabled, where the disabled look wins.
    invalid: {border: 'color/border/danger', 'status-icon': 'color/icon/danger', focus: 'focus/danger', except: ['disabled']},
    shared: {radius: 'radius/control', 'border-width': 'border/width/default', 'leading-icon': 'size/icon/md', 'status-icon': 'size/icon/sm', 'input-min': 'font/size/input-min', 'prefix-border': 'color/border/default'},
    multiline: {minHeight: 128, paddingY: 12},
  },
  lists: {types: 'type', filled: 'filled value', statuses: 'status', states: 'state'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{
    name: set,
    properties: [variant('Type', s.types, s.defaultVariant.type), variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Filled', s.filled, s.defaultVariant.filled), variant('Status', s.statuses, s.defaultVariant.status), variant('State', s.states, s.defaultVariant.state), ...s.properties],
    axes: ['Status', 'State'],
    row: c => {
      const row = {...(s.roles[c.State] || s.roles.rest)};
      if (c.Status === 'invalid' && !s.invalid.except.includes(c.State)) Object.assign(row, {border: s.invalid.border, 'status-icon': s.invalid['status-icon'], ...(c.State === 'focus' ? {effect: s.invalid.focus} : {})});
      return row;
    },
  }],
  measures: s => ({[set]: {
    ...Object.fromEntries(s.sizes.map(z => [z.size, {height: z.height, 'padding-x': z.padding, gap: z.gap, 'text-style': z.text}])),
    '*': {...s.shared, 'multiline-min-height': s.multiline.minHeight, 'padding-y-multiline': s.multiline.paddingY},
  }}),
  describe: (_, slot, size) => ({'padding-x': `Side padding of ${size} text controls.`, 'multiline-min-height': 'Minimum height of a multi-line text control.', 'padding-y-multiline': 'Top and bottom padding of a multi-line text control.'})[slot],
});
