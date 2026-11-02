// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.5-select.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'select';
export const page = '3.5';
export const name = 'Select';
export const set = 'Select';
export const level = 'components';
export const spec = 'specs/components/3.5-select.md';
export const uses = ['label', 'text-control', 'help-text', 'avatar', 'checkbox', 'tag'];

const multi = 'Multi-select', option = 'Select option', multiOption = 'Multi-select option', tagBox = 'Select tag box', scroll = 'Select scroll bar';
const look = (Filled, State, Open, Status) => ({Filled, State, Open, ...(Status ? {Status} : {})});
const matches = (c, list) => list.some(l => Object.entries(l).every(([k, v]) => c[k] === v));
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4 and §7: per size, the trigger height, the Label and Help text size (sm → sm, md and lg → md), the option
    // paddings (kept as select/option/padding-{x,y}/{size}) and the option text styles.
    sizes: [
      {size: 'sm', height: 'size/control/sm', label: 'sm', paddingX: 'space/md', paddingY: 'space/sm', text: 'type/body/sm/medium', supporting: 'type/body/sm/regular'},
      {size: 'md', height: 'size/control/md', label: 'md', paddingX: 'space/md', paddingY: 'space/md', text: 'type/body/md/medium', supporting: 'type/body/md/regular'},
      {size: 'lg', height: 'size/control/lg', label: 'md', paddingX: 'space/lg', paddingY: 'space/md', text: 'type/body/md/medium', supporting: 'type/body/md/regular'},
    ],
    types: ['default', 'icon', 'avatar', 'dot', 'search', 'tags'],
    optionTypes: ['default', 'icon', 'avatar', 'dot'],
    optionStates: ['rest', 'hover', 'disabled'],
    // §3: the looks each set holds per Size (and Type).
    looks: [look('false', 'rest', 'false', 'none'), look('true', 'rest', 'false', 'none'), look('true', 'focus', 'false', 'none'), look('true', 'focus', 'true', 'none'), look('false', 'disabled', 'false', 'none'), look('false', 'rest', 'false', 'invalid'), look('true', 'rest', 'false', 'invalid'), look('true', 'focus', 'false', 'invalid')],
    multiLooks: [look('false', 'rest', 'false'), look('true', 'rest', 'false'), look('true', 'focus', 'false'), look('false', 'focus', 'true'), look('true', 'focus', 'true'), look('false', 'disabled', 'false')],
    defaultVariant: {size: 'md', type: 'default', optionType: 'default'},
    // An open list shows this many options, the first one selected; a tag box this many tags.
    options: 4,
    tags: 2,
    listMaxHeight: 320,
    properties: [prop('Show label', 'boolean', true), prop('Show hint', 'boolean', true), prop('Show scroll bar', 'boolean', false)],
    multiProperties: [prop('Show label', 'boolean', true), prop('Show hint', 'boolean', true), prop('Show scroll bar', 'boolean', false), prop('Show empty state', 'boolean', false)],
    optionProperties: [prop('Text', 'text', 'Olivia Rhye'), prop('Supporting text', 'text', '@olivia'), prop('Show supporting text', 'boolean', false), prop('Icon', 'instance swap', 'user')],
    multiOptionProperties: [prop('Text', 'text', 'Design'), prop('Supporting text', 'text', '12 members'), prop('Show supporting text', 'boolean', false)],
    // §6. The list surface floats over the page; on a system without shadows it has none.
    list: {fill: 'color/surface/raised', border: 'color/border/subtle', effect: ['elevation/overlay', null], 'empty-text': 'color/text/tertiary'},
    optionLooks: {
      rest: {fill: 'color/fill/none', text: 'color/text/primary'},
      hover: {fill: 'color/fill/neutral/subtle/hover', text: 'color/text/primary'},
      disabled: {fill: 'color/fill/none', text: 'color/text/disabled'},
    },
    optionRoles: {supporting: 'color/text/tertiary', check: 'color/icon/brand', dot: 'color/icon/success'},
    // The tag box binds the Text control's box roles.
    box: {
      rest: {fill: 'color/surface/base', border: 'color/border/default', effect: null},
      focus: {fill: 'color/surface/base', border: 'color/border/brand', effect: 'focus/default'},
      disabled: {fill: 'color/fill/neutral/subtle/disabled', border: 'color/border/disabled', effect: null},
    },
    thumb: 'color/fill/neutral/track',
  },
  lists: {types: 'type', optionTypes: 'option type', optionStates: 'option state'},
  check: s => {
    checkObjects(name, s.sizes, 'size', 'size');
    for (const key of ['options', 'tags']) if (!Number.isInteger(s[key]) || s[key] < 1) throw new ItemError(`Send ${key} as a whole number of at least 1.`);
  },
  sets: s => {
    const sizes = s.sizes.map(z => z.size), sizeOf = sz => s.sizes.find(z => z.size === sz);
    const stateProps = (withStatus) => [variant('Filled', ['false', 'true'], 'false'), variant('State', ['rest', 'focus', 'disabled'], 'rest'), variant('Open', ['false', 'true'], 'false'), ...(withStatus ? [variant('Status', ['none', 'invalid'], 'none')] : [])];
    const optionType = t => s.optionTypes.includes(t) ? t : s.optionTypes[0];
    const many = (n, slot, make) => Object.fromEntries(Array.from({length: n}, (_, i) => [`${slot}-${i + 1}`, make(i)]));
    // §7: Label and Help text follow the size mapping; the trigger is the Text control (search: single-line) or
    // the tag box; an open list holds options of the same Size, the first one selected.
    const field = (c, {tags, optionSet, optionVariant}) => ({
      label: {part: 'label', variant: {Size: sizeOf(c.Size).label}},
      trigger: tags ? {part: id, set: tagBox, variant: {Size: c.Size, Filled: c.Filled, State: c.State}}
        : {part: 'text-control', variant: {Type: c.Type === 'search' ? 'single-line' : 'select', Size: c.Size, Filled: c.Filled, State: c.State, Status: c.Status}},
      ...(c.Open === 'true' ? {...many(s.options, 'option', i => ({part: id, set: optionSet, variant: {Size: c.Size, ...optionVariant(i)}})), 'scroll-bar': {part: id, set: scroll, variant: {}}} : {}),
      help: {part: 'help-text', variant: {Size: sizeOf(c.Size).label, ...(c.Status ? {Status: c.Status} : {})}},
    });
    const optionRow = c => ({...s.optionLooks[c.State], supporting: c.State === 'disabled' ? s.optionLooks.disabled.text : s.optionRoles.supporting, check: c.Selected === 'true' ? s.optionRoles.check : null});
    return [
      {name: set, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), ...stateProps(true), ...s.properties],
        exists: c => matches(c, s.looks), axes: [], row: () => ({...s.list}),
        instances: c => field(c, {tags: c.Type === 'tags', optionSet: option, optionVariant: i => ({Type: optionType(c.Type), Selected: i === 0 ? 'true' : 'false'})})},
      {name: multi, properties: [variant('Size', sizes, s.defaultVariant.size), ...stateProps(false), ...s.multiProperties],
        exists: c => matches(c, s.multiLooks), axes: [], row: () => ({...s.list}),
        instances: c => field(c, {tags: true, optionSet: multiOption, optionVariant: i => ({Selected: c.Filled === 'true' && i < s.tags ? 'true' : 'false'})})},
      {name: option, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Type', s.optionTypes, s.defaultVariant.optionType), variant('Selected', ['false', 'true'], 'false'), variant('State', s.optionStates, 'rest'), ...s.optionProperties],
        axes: ['Type', 'Selected', 'State'], row: c => ({...optionRow(c), dot: c.Type === 'dot' ? s.optionRoles.dot : null}),
        // The avatar option holds an Avatar xs at every size.
        instances: c => c.Type === 'avatar' ? {avatar: {part: 'avatar', variant: {Size: 'xs'}}} : {}, instanceAxes: ['Type']},
      {name: multiOption, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Selected', ['false', 'true'], 'false'), variant('State', s.optionStates, 'rest'), ...s.multiOptionProperties],
        axes: ['Selected', 'State'], row: c => ({...optionRow(c), check: null}),
        // A Checkbox sm: Checked is the option's Selected and its State follows the row.
        instances: c => ({checkbox: {part: 'checkbox', variant: {Size: 'sm', Checked: c.Selected, State: c.State}}}), instanceAxes: ['Selected', 'State']},
      {name: tagBox, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Filled', ['false', 'true'], 'true'), variant('State', ['rest', 'focus', 'disabled'], 'rest')],
        axes: ['State'], row: c => ({...s.box[c.State], placeholder: c.State === 'disabled' ? 'color/text/disabled' : 'color/text/placeholder'}),
        instances: c => c.Filled === 'true' ? many(s.tags, 'tag', () => ({part: 'tag', variant: {Size: 'sm', Type: 'removable'}})) : {}, instanceAxes: ['Filled']},
      {name: scroll, private: true, properties: [], axes: [], row: () => ({thumb: s.thumb})},
    ];
  },
  measures: s => ({
    [set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'control-height': z.height}])), '*': {gap: 'space/sm', width: 'size/width/xxs', 'list-max-height': 'select/list/max-height', 'list-padding-y': 'space/xs', 'list-offset': 'space/xs', 'list-radius': 'radius/surface', 'empty-padding': 'space/xl'}},
    [option]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'padding-x': `select/option/padding-x/${z.size}`, 'padding-y': `select/option/padding-y/${z.size}`, 'text-style': z.text, 'supporting-style': z.supporting}])),
      '*': {'inset-y': 'space/xxs', 'inset-x': 'space/sm', gap: 'space/md', radius: 'radius/control', icon: 'size/icon/md', dot: 'size/indicator/sm', check: 'size/icon/md'}},
    [tagBox]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'min-height': z.height}])), '*': {gap: 'space/md', 'content-gap': 'space/sm', radius: 'radius/control', 'border-width': 'border/width/default', chevron: 'size/icon/md'}},
    [scroll]: {'*': {width: 'size/track/sm', inset: 'space/xs', radius: 'radius/full'}},
  }),
  tokens: s => [
    {set, role: 'list/max-height', value: s.listMaxHeight, description: 'Tallest an open Select list grows before it scrolls.'},
    ...s.sizes.flatMap(z => [
      {set, role: 'option/padding-x', variant: z.size, value: {alias: z.paddingX}, description: `Side padding of ${z.size} Select options.`},
      {set, role: 'option/padding-y', variant: z.size, value: {alias: z.paddingY}, description: `Top and bottom padding of ${z.size} Select options.`},
    ]),
  ],
});
