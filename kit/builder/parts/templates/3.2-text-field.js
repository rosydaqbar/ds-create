// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.2-text-field.md, and a system may change any of it.
import {checkObjects, definePart, prop, semibold, variant} from '../kit.mjs';

export const id = 'text-field';
export const page = '3.2';
export const name = 'Text field';
export const set = 'Text field';
export const level = 'components';
export const spec = 'specs/components/3.2-text-field.md';
export const uses = ['label', 'text-control', 'help-text', 'button', 'tag'];

const textarea = 'Textarea field', code = 'Code field', cell = 'Code field cell', addon = 'Text field addon', tagBox = 'Text field tag box';
// A field never shows disabled and invalid together.
const live = c => !(c.State === 'disabled' && c.Status === 'invalid');
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4 and §7: per field size, the control height, the Label and Help text size (sm → sm, md and lg → md),
    // the addon padding (kept as text-field/addon/padding-x/{size}) and the addon Button size. Every Tag in a
    // tag box or the tags row is Tag sm.
    sizes: [
      {size: 'sm', height: 'size/control/sm', label: 'sm', addonPadding: 'space/lg', button: 'sm', tag: 'sm'},
      {size: 'md', height: 'size/control/md', label: 'md', addonPadding: 'space/lg', button: 'md', tag: 'sm'},
      {size: 'lg', height: 'size/control/lg', label: 'md', addonPadding: 'space/xl', button: 'lg', tag: 'sm'},
    ],
    textareaSizes: ['sm', 'md'],
    // §4: the code cell, its digit style (display styles when the system has them) and the gap between cells,
    // kept as code-field/cell-size/{size} and code-field/gap/{size}.
    cells: [
      {size: 'sm', cell: 64, digit: semibold('heading', 'xl'), gap: 'space/md'},
      {size: 'md', cell: 80, digit: ['type/display/sm/semibold', ...semibold('heading', 'xl')], gap: 'space/lg'},
      {size: 'lg', cell: 96, digit: ['type/display/md/semibold', ...semibold('heading', 'xl')], gap: 'space/lg'},
    ],
    types: ['default', 'leading-text', 'leading-dropdown', 'trailing-dropdown', 'trailing-button', 'password', 'payment', 'date-time', 'tags-inner', 'tags-outer', 'counter-horizontal', 'counter-vertical', 'file-upload'],
    textareaTypes: ['default', 'tags-inner', 'tags-outer'],
    codeTypes: ['4-digit', '6-digit'],
    statuses: ['none', 'invalid'],
    filled: ['false', 'true'],
    states: ['rest', 'focus', 'disabled'],
    addonTypes: ['dropdown', 'button', 'stepper', 'stepper-vertical'],
    addonStates: ['rest', 'hover', 'disabled'],
    defaultVariant: {size: 'md', type: 'default', textareaType: 'default', codeType: '4-digit', addonType: 'dropdown'},
    // "What each Type changes": the addons each Type puts before and after the control.
    addons: {
      'leading-dropdown': {leading: 'dropdown'}, 'trailing-dropdown': {trailing: 'dropdown'}, 'trailing-button': {trailing: 'button'},
      'date-time': {trailing: 'dropdown'}, 'counter-horizontal': {leading: 'stepper', trailing: 'stepper'}, 'counter-vertical': {trailing: 'stepper-vertical'}, 'file-upload': {leading: 'button'},
    },
    tags: 3,
    properties: [prop('Show label', 'boolean', true), prop('Show hint', 'boolean', true), prop('Show time', 'boolean', false)],
    textareaProperties: [prop('Show label', 'boolean', true), prop('Show hint', 'boolean', true), prop('Show resize handle', 'boolean', true)],
    codeProperties: [prop('Show label', 'boolean', true), prop('Show hint', 'boolean', true)],
    addonProperties: [prop('Text', 'text', 'US'), prop('Icon', 'instance swap', 'chevron-down')],
    // §5 and §6. The tag box and the code cell bind the same fill, border, focus and status roles as the Text
    // control (2.10).
    box: {
      rest: {fill: 'color/surface/base', border: 'color/border/default', effect: null},
      focus: {fill: 'color/surface/base', border: 'color/border/brand', effect: 'focus/default'},
      disabled: {fill: 'color/fill/neutral/subtle/disabled', border: 'color/border/disabled', effect: null},
    },
    invalid: {border: 'color/border/danger', focus: 'focus/danger'},
    digit: {empty: 'color/text/placeholder', filled: 'color/text/brand', disabled: 'color/text/disabled', invalid: 'color/text/danger'},
    addonLooks: {
      rest: {border: 'color/border/default', text: 'color/text/secondary', fill: 'color/fill/none', icon: 'color/icon/secondary'},
      hover: {border: 'color/border/default', text: 'color/text/secondary', fill: 'color/fill/neutral/subtle/hover', icon: 'color/icon/primary'},
      disabled: {border: 'color/border/disabled', text: 'color/text/disabled', fill: 'color/fill/none', icon: 'color/icon/disabled'},
    },
    separator: 'color/text/placeholder',
  },
  lists: {types: 'type', textareaTypes: 'textarea type', codeTypes: 'code type', statuses: 'status', filled: 'filled value', states: 'state', addonTypes: 'addon type', addonStates: 'addon state'},
  check: s => { checkObjects(name, s.sizes, 'size', 'size'); checkObjects(name, s.cells, 'size', 'code size'); },
  sets: s => {
    const sizeOf = sz => s.sizes.find(z => z.size === sz) || s.sizes.at(-1);
    const fieldProps = (sizes, types, typeDefault) => [variant('Size', sizes, s.defaultVariant.size), variant('Type', types, typeDefault), variant('Status', s.statuses, 'none'), variant('Filled', s.filled, 'false'), variant('State', s.states, 'rest')];
    const boxRow = c => ({...s.box[c.State], ...(c.Status === 'invalid' && c.State !== 'disabled' ? {border: s.invalid.border, ...(c.State === 'focus' ? {effect: s.invalid.focus} : {})} : {})});
    const tagRow = sz => Object.fromEntries(Array.from({length: s.tags}, (_, i) => [`tag-${i + 1}`, {part: 'tag', variant: {Size: sizeOf(sz).tag}}]));
    const addonState = st => st === 'disabled' ? 'disabled' : 'rest';
    // §7: Label and Help text follow the size mapping; the Text control takes the field's values one-to-one.
    const stack = (c, control) => ({
      label: {part: 'label', variant: {Size: sizeOf(c.Size).label}},
      ...(c.Type === 'tags-inner' ? {control: {part: id, set: tagBox, variant: {Size: c.Size, Type: control, State: c.State, Status: c.Status}}} : {control: {part: 'text-control', variant: {Type: control, Size: c.Size, State: c.State, Status: c.Status, Filled: c.Filled}}}),
      ...Object.fromEntries(Object.entries(s.addons[c.Type] || {}).map(([side, type]) => [side, {part: id, set: addon, variant: {Size: c.Size, Type: type, Placement: side === 'leading' ? 'left' : 'right', State: addonState(c.State)}}])),
      ...(c.Type === 'tags-outer' ? tagRow(c.Size) : {}),
      help: {part: 'help-text', variant: {Size: sizeOf(c.Size).label, Status: c.Status}},
    });
    const sizes = s.sizes.map(z => z.size), cellSizes = s.cells.map(z => z.size);
    return [
      {name: set, properties: [...fieldProps(sizes, s.types, s.defaultVariant.type), ...s.properties], exists: live, axes: [], row: () => ({}), instances: c => stack(c, 'single-line')},
      {name: textarea, properties: [...fieldProps(s.textareaSizes, s.textareaTypes, s.defaultVariant.textareaType), ...s.textareaProperties], exists: live, axes: [], row: () => ({}), instances: c => stack(c, 'multi-line')},
      {name: code, properties: [variant('Size', cellSizes, s.defaultVariant.size), variant('Type', s.codeTypes, s.defaultVariant.codeType), ...s.codeProperties], axes: [], row: () => ({separator: s.separator}),
        instances: c => ({label: {part: 'label', variant: {Size: sizeOf(c.Size).label}},
          ...Object.fromEntries(Array.from({length: parseInt(c.Type, 10) || 4}, (_, i) => [`cell-${i + 1}`, {part: id, set: cell, variant: {Size: c.Size}}])),
          help: {part: 'help-text', variant: {Size: sizeOf(c.Size).label}}})},
      {name: cell, private: true, properties: [variant('Size', cellSizes, s.defaultVariant.size), variant('Filled', s.filled, 'false'), variant('State', s.states, 'rest'), variant('Status', s.statuses, 'none'), prop('Digit', 'text', '0')], exists: live,
        axes: ['Filled', 'State', 'Status'],
        row: c => ({...boxRow(c), digit: c.State === 'disabled' ? s.digit.disabled : c.Status === 'invalid' ? s.digit.invalid : c.Filled === 'true' ? s.digit.filled : s.digit.empty})},
      {name: addon, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Type', s.addonTypes, s.defaultVariant.addonType), variant('Placement', ['left', 'right'], 'left'), variant('State', s.addonStates, 'rest'), ...s.addonProperties],
        axes: ['Type', 'State'],
        // A button addon holds a secondary Button; its look comes from the Button, so it has no fill of its own.
        row: c => ({...s.addonLooks[c.State], ...(c.Type === 'button' ? {fill: null} : {})}),
        instances: c => c.Type === 'button' ? {button: {part: 'button', variant: {Emphasis: 'secondary', Size: sizeOf(c.Size).button, State: c.State === 'disabled' ? 'disabled' : c.State}}} : {},
        instanceAxes: ['Size', 'Type', 'State']},
      {name: tagBox, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Type', ['single-line', 'multi-line'], 'single-line'), variant('State', s.states, 'rest'), variant('Status', s.statuses, 'none')],
        axes: ['State', 'Status'], row: boxRow, instances: c => tagRow(c.Size), instanceAxes: ['Size']},
    ];
  },
  measures: s => ({
    [set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'control-height': z.height}])), '*': {gap: 'space/sm', width: 'size/width/xxs'}},
    [textarea]: {'*': {gap: 'space/sm', width: 'size/width/xxs', 'min-height': 'text-control/multiline-min-height'}},
    [code]: Object.fromEntries(s.cells.map(z => [z.size, {gap: `code-field/gap/${z.size}`}])),
    [cell]: {...Object.fromEntries(s.cells.map(z => [z.size, {size: `code-field/cell-size/${z.size}`, 'digit-style': z.digit}])), '*': {radius: 'radius/control', 'border-width': 'border/width/default'}},
    [addon]: {...Object.fromEntries(s.sizes.map(z => [z.size, {height: z.height, 'padding-x': `text-field/addon/padding-x/${z.size}`}])), '*': {'border-width': 'border/width/default', radius: 'radius/control'}},
    [tagBox]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'min-height': z.height}])), '*': {radius: 'radius/control', 'border-width': 'border/width/default'}},
  }),
  tokens: s => [
    ...s.cells.flatMap(z => [
      {set: code, role: 'cell-size', variant: z.size, value: z.cell, description: `Width and height of ${z.size} code cells.`},
      {set: code, role: 'gap', variant: z.size, value: {alias: z.gap}, description: `Space between ${z.size} code cells.`},
    ]),
    ...s.sizes.map(z => ({set, role: 'addon/padding-x', variant: z.size, value: {alias: z.addonPadding}, description: `Side padding of addons on ${z.size} Text fields.`})),
  ],
});
