// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.3-choice-field.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'choice-field';
export const page = '3.3';
export const name = 'Choice field';
export const set = 'Choice field';
export const level = 'components';
export const spec = 'specs/components/3.3-choice-field.md';
export const uses = ['checkbox', 'radio', 'switch', 'featured-icon', 'avatar', 'badge', 'label'];

const card = 'Choice card', group = 'Choice group';
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: the field's gap and text styles, and the card's padding and gap per breakpoint (kept as
    // choice-card/{padding,gap}/{breakpoint}/{size}).
    sizes: [
      {size: 'sm', gap: 'space/md', text: 'type/body/sm/medium', supporting: 'type/body/sm/regular', card: {desktop: {padding: 'space/xl', gap: 'space/md'}, mobile: {padding: 'space/lg', gap: 'space/md'}}},
      {size: 'md', gap: 'space/lg', text: 'type/body/md/medium', supporting: 'type/body/md/regular', card: {desktop: {padding: 'space/2xl', gap: 'space/lg'}, mobile: {padding: 'space/xl', gap: 'space/md'}}},
    ],
    types: ['checkbox', 'radio', 'switch'],
    checked: ['false', 'true', 'mixed'],
    states: ['rest', 'hover', 'focus', 'disabled'],
    cardTypes: ['icon', 'icon-card', 'avatar', 'payment', 'radio', 'checkbox'],
    cardStates: ['rest', 'hover', 'focus'],
    breakpoints: ['mobile', 'desktop'],
    defaultVariant: {size: 'md', type: 'checkbox', cardType: 'icon', breakpoint: 'desktop'},
    // A group shows this many cards, the first one selected.
    cards: 3,
    properties: [prop('Text', 'text', 'Remember me'), prop('Supporting text', 'text', 'Save my login details for next time.'), prop('Show supporting text', 'boolean', true)],
    cardProperties: [prop('Text', 'text', 'Basic plan'), prop('Subtext', 'text', '$10/month'), prop('Supporting text', 'text', 'Includes up to 10 users, 20 GB individual data and access to all features.'), prop('Show badge', 'boolean', false)],
    groupProperties: [prop('Show label', 'boolean', false)],
    // §5 and §6.
    fieldLooks: {rest: {text: 'color/text/secondary', supporting: 'color/text/tertiary'}, disabled: {text: 'color/text/disabled', supporting: 'color/text/disabled'}},
    cardLooks: {
      rest: {border: 'color/border/default', 'border-width': 'border/width/default', fill: 'color/surface/base', title: 'color/text/secondary', subtext: 'color/text/tertiary'},
      hover: {border: 'color/border/strong', 'border-width': 'border/width/default', fill: 'color/surface/base', title: 'color/text/secondary', subtext: 'color/text/tertiary'},
      focus: {border: 'color/border/default', 'border-width': 'border/width/default', fill: 'color/surface/base', title: 'color/text/secondary', subtext: 'color/text/tertiary'},
    },
    // The selected outline is the foundations' selected border width (2 by default).
    selected: {border: 'color/border/brand', 'border-width': 'border/width/selected', title: 'color/text/brand'},
    focus: 'focus/default',
    // §7: the leading visual and the selection control per card type. The selection Radio is Size=sm and the
    // avatar Size=md at every card size.
    visuals: {icon: 'featured-icon', 'icon-card': 'featured-icon', avatar: 'avatar', radio: 'radio', checkbox: 'checkbox'},
    selection: ['icon', 'icon-card', 'avatar', 'payment'],
    fixedSizes: {avatar: 'md', selection: 'sm'},
  },
  lists: {types: 'type', checked: 'checked value', states: 'state', cardTypes: 'card type', cardStates: 'card state', breakpoints: 'breakpoint'},
  check: s => {
    checkObjects(name, s.sizes, 'size', 'size');
    for (const z of s.sizes) for (const b of s.breakpoints) if (!z.card?.[b]?.padding || !z.card[b].gap) throw new ItemError(`Choice field has no card padding and gap for ${b} at ${z.size}.`);
  },
  sets: s => {
    const sizes = s.sizes.map(z => z.size), checked = sel => sel === 'true' ? 'true' : 'false';
    const visual = c => {
      const part = s.visuals[c.Type];
      if (!part) return {};
      const variantOf = part === 'avatar' ? {Size: s.fixedSizes.avatar} : ['radio', 'checkbox'].includes(part) ? {Size: c.Size, Checked: checked(c.Selected)} : {Size: c.Size};
      return {visual: {part, variant: variantOf}};
    };
    return [
      // §7: the control takes the field's Size, Checked and State; mixed exists for checkbox only.
      {name: set, properties: [variant('Type', s.types, s.defaultVariant.type), variant('Size', sizes, s.defaultVariant.size), variant('Checked', s.checked, 'false'), variant('State', s.states, 'rest'), ...s.properties],
        exists: c => c.Checked !== 'mixed' || c.Type === 'checkbox', axes: ['State'], row: c => ({...(s.fieldLooks[c.State] || s.fieldLooks.rest)}),
        instances: c => ({control: {part: c.Type, variant: {Size: c.Size, Checked: c.Checked, State: c.State}}})},
      {name: card, properties: [variant('Type', s.cardTypes, s.defaultVariant.cardType), variant('Size', sizes, s.defaultVariant.size), variant('Selected', ['false', 'true'], 'false'), variant('State', s.cardStates, 'rest'), variant('Breakpoint', s.breakpoints, s.defaultVariant.breakpoint), ...s.cardProperties],
        axes: ['Selected', 'State'],
        row: c => ({...s.cardLooks[c.State], ...(c.Selected === 'true' ? s.selected : {}), effect: c.State === 'focus' ? s.focus : null}),
        instances: c => ({...visual(c), ...(s.selection.includes(c.Type) ? {selection: {part: 'radio', variant: {Size: s.fixedSizes.selection, Checked: checked(c.Selected)}}} : {}), badge: {part: 'badge', variant: {Size: c.Size}}}),
        instanceAxes: ['Type', 'Size', 'Selected']},
      {name: group, properties: [variant('Type', s.cardTypes, s.defaultVariant.cardType), variant('Size', sizes, s.defaultVariant.size), variant('Breakpoint', s.breakpoints, s.defaultVariant.breakpoint), ...s.groupProperties],
        axes: [], row: () => ({}),
        instances: c => ({label: {part: 'label', variant: {Size: c.Size}}, ...Object.fromEntries(Array.from({length: s.cards}, (_, i) => [`card-${i + 1}`, {part: id, set: card, variant: {Type: c.Type, Size: c.Size, Breakpoint: c.Breakpoint, Selected: i === 0 ? 'true' : 'false'}}]))})},
    ];
  },
  measures: s => ({
    [set]: Object.fromEntries(s.sizes.map(z => [z.size, {gap: z.gap, 'text-style': z.text, 'supporting-style': z.supporting}])),
    [card]: {
      ...Object.fromEntries(s.sizes.map(z => [z.size, Object.fromEntries(s.breakpoints.flatMap(b => [[`padding-${b}`, `choice-card/padding/${b}/${z.size}`], [`gap-${b}`, `choice-card/gap/${b}/${z.size}`]]))])),
      '*': {radius: 'radius/surface', 'content-gap': 'space/xxs', 'title-gap': 'space/xs', 'icon-card-gap': 'space/lg'},
    },
    [group]: {'*': {gap: 'space/lg', 'items-gap': 'space/lg'}},
  }),
  tokens: s => s.sizes.flatMap(z => s.breakpoints.flatMap(b => [
    {set: card, role: `padding/${b}`, variant: z.size, value: {alias: z.card[b].padding}, description: `Padding of ${z.size} Choice cards on ${b}.`},
    {set: card, role: `gap/${b}`, variant: z.size, value: {alias: z.card[b].gap}, description: `Space between the parts of ${z.size} Choice cards on ${b}.`},
  ])),
});
