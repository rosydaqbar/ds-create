// Premade Section template. Brand-agnostic: every structural choice below is an input with a default from
// specs/sections/4.1-rich-text-editor.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, prop, semibold, variant} from '../kit.mjs';

export const id = 'rich-text-editor';
export const page = '4.1';
export const name = 'Rich text editor';
export const set = 'Rich text editor';
export const level = 'sections';
export const spec = 'specs/sections/4.1-rich-text-editor.md';
export const uses = ['select', 'divider', 'help-text', 'kbd', 'tooltip'];

const toolbar = 'Rich text toolbar', floating = 'Rich text floating toolbar', command = 'Rich text editor command', scroll = 'Rich text editor scroll bar';
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §7: per size, the gap from toolbar to input, the input padding and minimum height and the content style,
    // kept as rich-text-editor/{gap,input/padding-x,input/padding-y,input/min-height}/{size}.
    sizes: [
      {size: 'sm', gap: 'space/md', paddingX: 'space/xl', paddingY: 'space/lg', minHeight: 120, content: 'type/body/sm/regular'},
      {size: 'md', gap: 'space/lg', paddingX: 'space/2xl', paddingY: 'space/xl', minHeight: 160, content: 'type/body/md/regular'},
    ],
    types: ['default', 'floating-toolbar'],
    toolbarTypes: ['simple', 'advanced'],
    commands: ['bold', 'italic', 'underline', 'bullet-list', 'align-left', 'align-center', 'align-right', 'justify', 'link', 'image', 'attachment', 'code', 'color', 'generate', 'more', 'video'],
    states: ['rest', 'hover'],
    defaultVariant: {size: 'md', type: 'default', toolbar: 'advanced', floating: 'simple'},
    // §5 and §6: the commands of each toolbar in order; '|' is a Divider wrapper. The advanced toolbar starts
    // with two Selects (paragraph style and text size) at Size=sm.
    toolbars: {
      simple: ['bold', 'italic', 'underline', '|', 'bullet-list', 'align-left', '|', 'link', 'image'],
      advanced: ['bold', 'italic', 'underline', '|', 'color', '|', 'bullet-list', 'align-left', 'align-center', 'align-right', '|', 'link', 'image', '|', 'generate', 'more'],
    },
    floatingToolbars: {
      simple: ['bold', 'italic', 'underline', '|', 'link'],
      advanced: ['bold', 'italic', 'underline', '|', 'link', '|', 'color', 'bullet-list', '|', 'generate'],
    },
    selects: 2,
    properties: [prop('Show scroll bar', 'boolean', false), prop('Show hint', 'boolean', true)],
    // The input binds the Text control's box roles; the floating toolbar floats over the page and has no
    // shadow on a system without shadows.
    input: {fill: 'color/surface/base', border: 'color/border/default', text: 'color/text/primary', link: 'color/text/brand', highlight: 'color/fill/brand/subtle', handle: 'color/icon/tertiary'},
    panel: {fill: 'color/surface/raised', border: 'color/border/subtle', effect: ['elevation/overlay', null]},
    commandLooks: {rest: {fill: 'color/fill/none', icon: 'color/icon/tertiary'}, hover: {fill: 'color/fill/neutral/subtle/hover', icon: 'color/icon/secondary'}},
    selected: {fill: 'color/fill/neutral/subtle/selected', icon: 'color/icon/primary'},
    swatchRing: 'color/border/default',
    thumb: 'color/fill/neutral/track',
  },
  lists: {types: 'type', toolbarTypes: 'toolbar type', commands: 'command', states: 'state'},
  check: s => {
    checkObjects(name, s.sizes, 'size', 'size');
    for (const [kind, lists] of [['toolbar', s.toolbars], ['floating toolbar', s.floatingToolbars]]) for (const t of s.toolbarTypes) {
      const list = lists?.[t];
      if (!Array.isArray(list)) throw new ItemError(`Send the ${t} ${kind} commands as a list.`);
      const unknown = list.find(c => c !== '|' && !s.commands.includes(c));
      if (unknown) throw new ItemError(`The ${t} ${kind} uses ${unknown}, which is not a command.`);
    }
  },
  sets: s => {
    // A toolbar's row: each command, a vertical Divider per wrapper, and the Selects first on advanced.
    const bar = (list, selects) => {
      let n = 0;
      return {
        ...Object.fromEntries(Array.from({length: selects}, (_, i) => [`select-${i + 1}`, {part: 'select', variant: {Size: 'sm'}}])),
        ...Object.fromEntries(list.map(c => c === '|' ? [`divider-${++n}`, {part: 'divider', variant: {Orientation: 'vertical'}}] : [`command-${c}`, {part: id, set: command, variant: {Type: c}}])),
      };
    };
    return [
      // §7: the default editor holds the advanced toolbar; Help text takes the editor's Size.
      {name: set, properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), ...s.properties], axes: [], row: () => ({...s.input}),
        instances: c => ({...(c.Type === 'floating-toolbar' ? {toolbar: {part: id, set: floating, variant: {Type: s.defaultVariant.floating}}} : {toolbar: {part: id, set: toolbar, variant: {Type: s.defaultVariant.toolbar}}}),
          help: {part: 'help-text', variant: {Size: c.Size}}, 'scroll-bar': {part: id, set: scroll, variant: {}}})},
      {name: toolbar, properties: [variant('Type', s.toolbarTypes, s.defaultVariant.toolbar), prop('Show selects', 'boolean', true)], axes: [], row: () => ({}),
        instances: c => bar(s.toolbars[c.Type], c.Type === 'advanced' ? s.selects : 0)},
      {name: floating, properties: [variant('Type', s.toolbarTypes, s.defaultVariant.floating)], axes: [], row: () => ({...s.panel}),
        instances: c => bar(s.floatingToolbars[c.Type], 0)},
      // A command shows its name and shortcut on hover: a Tooltip and a Kbd, since Tooltip has no shortcut slot.
      {name: command, private: true, properties: [variant('Type', s.commands, s.commands[0]), variant('State', s.states, 'rest'), variant('Selected', ['false', 'true'], 'false')],
        axes: ['State', 'Selected'], row: c => ({...s.commandLooks[c.State], ...(c.Selected === 'true' ? s.selected : {}), 'swatch-ring': s.swatchRing}),
        instances: () => ({tooltip: {part: 'tooltip', variant: {}}, shortcut: {part: 'kbd', variant: {}}}), instanceAxes: ['Type']},
      {name: scroll, private: true, properties: [], axes: [], row: () => ({thumb: s.thumb})},
    ];
  },
  measures: s => ({
    [set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {gap: `rich-text-editor/gap/${z.size}`, 'input-padding-x': `rich-text-editor/input/padding-x/${z.size}`, 'input-padding-y': `rich-text-editor/input/padding-y/${z.size}`, 'min-height': `rich-text-editor/input/min-height/${z.size}`, 'content-style': z.content}])),
      '*': {width: 'size/width/lg', 'hint-gap': 'space/sm', 'content-gap': 'space/md', 'heading-style': semibold('heading', 'xs'), radius: 'radius/control', 'border-width': 'border/width/default'}},
    [toolbar]: {'*': {gap: 'space/md', 'selects-gap': 'space/md', 'commands-gap': 'space/xxs', 'divider-padding-x': 'space/xs', 'divider-height': 'size/icon/md'}},
    [floating]: {'*': {gap: 'space/xxs', padding: 'space/xs', radius: 'radius/surface', 'border-width': 'border/width/default'}},
    [command]: {'*': {size: 'size/control/xs', icon: 'size/icon/md', radius: 'radius/control', swatch: 'size/icon/sm', 'swatch-ring-width': 'border/width/default'}},
    [scroll]: {'*': {width: 'size/track/sm', inset: 'space/xs', radius: 'radius/full'}},
  }),
  tokens: s => s.sizes.flatMap(z => [
    {set, role: 'gap', variant: z.size, value: {alias: z.gap}, description: `Space from the toolbar to the input of ${z.size} editors.`},
    {set, role: 'input/padding-x', variant: z.size, value: {alias: z.paddingX}, description: `Side padding of the input of ${z.size} editors.`},
    {set, role: 'input/padding-y', variant: z.size, value: {alias: z.paddingY}, description: `Top and bottom padding of the input of ${z.size} editors.`},
    {set, role: 'input/min-height', variant: z.size, value: z.minHeight, description: `Minimum height of the input of ${z.size} editors.`},
  ]),
});
