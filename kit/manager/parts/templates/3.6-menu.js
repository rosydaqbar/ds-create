// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.6-menu.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {definePart, prop, semibold, variant} from '../kit.mjs';

export const id = 'menu';
export const page = '3.6';
export const name = 'Menu';
export const set = 'Menu';
export const level = 'components';
export const spec = 'specs/components/3.6-menu.md';
export const uses = ['button', 'icon-button', 'link', 'avatar', 'checkbox', 'radio', 'text-control', 'divider', 'kbd'];

const context = 'Context menu', item = 'Menu item', leading = 'Menu item leading', header = 'Menu header', footer = 'Menu footer', account = 'Menu account item', accountTrigger = 'Menu account trigger', scroll = 'Menu scroll bar';
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    types: ['button-simple', 'button-advanced', 'button-link', 'icon-simple', 'icon-advanced', 'search-simple', 'search-advanced', 'integrations', 'account-button', 'account-avatar', 'account-card-xs', 'account-card-sm', 'account-card-md', 'account-breadcrumb'],
    contextTypes: ['simple', 'advanced'],
    // "What each Type contains": the trigger and the open panel. A trigger is a Part with its variant, or one of
    // this page's account triggers. account-button holds a Button and an Avatar xs next to it.
    triggers: {
      'button-simple': {part: 'button', variant: {Emphasis: 'secondary'}}, 'button-advanced': {part: 'button', variant: {Emphasis: 'secondary'}},
      'button-link': {part: 'link'}, 'icon-simple': {part: 'icon-button'}, 'icon-advanced': {part: 'icon-button'},
      'search-simple': {part: 'button'}, 'search-advanced': {part: 'button'}, integrations: {part: 'button'},
      'account-button': {part: 'button', avatar: 'xs'}, 'account-avatar': {part: 'avatar', variant: {Size: 'sm'}},
      'account-card-xs': {account: 'card-xs'}, 'account-card-sm': {account: 'card-sm'}, 'account-card-md': {account: 'card-md'}, 'account-breadcrumb': {account: 'breadcrumb'},
    },
    panels: {
      simple: {items: 'spacer', divider: true}, advanced: {header: 'avatar', items: 'icon', footer: 'text', divider: true},
      'button-simple': {items: 'spacer', divider: true}, 'button-advanced': {header: 'avatar', items: 'icon', footer: 'text', divider: true}, 'button-link': {items: 'spacer', divider: true},
      'icon-simple': {items: 'spacer'}, 'icon-advanced': {header: 'avatar', items: 'icon', footer: 'text'},
      'search-simple': {header: 'search', items: 'spacer'}, 'search-advanced': {header: 'search', subheading: true, items: 'avatar', footer: 'button'},
      integrations: {header: 'subheading', items: 'integration'},
      account: {header: 'subheading', accounts: true, footer: 'button'},
    },
    // An open panel shows this many items (or account items), the first account selected.
    items: 3,
    states: ['rest', 'hover', 'disabled'],
    tones: ['neutral', 'danger'],
    leadingTypes: ['spacer', 'icon', 'check', 'checkbox', 'dot', 'avatar', 'integration'],
    headerTypes: ['avatar', 'header', 'subheading', 'search'],
    footerTypes: ['text', 'button'],
    accountTypes: ['card-xs', 'card-sm', 'card-md', 'breadcrumb'],
    accountStates: ['rest', 'hover', 'focus'],
    // §7: account trigger Type → Avatar Size. The leading avatar is Avatar 2xs so it fits its 20 × 20 box.
    accountAvatars: {'card-xs': 'xs', 'card-sm': 'sm', 'card-md': 'md', breadcrumb: 'xs'},
    leadingAvatar: '2xs',
    width: 240,
    properties: [prop('Show chevron', 'boolean', true), prop('Show scroll bar', 'boolean', false)],
    itemProperties: [prop('Text', 'text', 'View profile'), prop('Show leading', 'boolean', true), prop('Show shortcut', 'boolean', true), prop('Show chevron', 'boolean', false)],
    // §6. The panel floats over the page; on a system without shadows it has none.
    panel: {fill: 'color/surface/raised', border: 'color/border/subtle', effect: ['elevation/overlay', null]},
    itemLooks: {
      rest: {fill: 'color/fill/none', text: 'color/text/secondary', icon: 'color/icon/tertiary'},
      hover: {fill: 'color/fill/neutral/subtle/hover', text: 'color/text/primary', icon: 'color/icon/secondary'},
      disabled: {fill: 'color/fill/none', text: 'color/text/disabled', icon: 'color/icon/disabled'},
    },
    danger: {text: 'color/text/danger', icon: 'color/icon/danger'},
    marks: {icon: 'color/icon/tertiary', check: 'color/icon/brand', dot: 'color/icon/success'},
    headerRoles: {name: 'color/text/primary', supporting: 'color/text/tertiary', divider: 'color/border/subtle'},
    accountLooks: {rest: {fill: 'color/fill/none'}, hover: {fill: 'color/fill/neutral/subtle/hover'}},
    accountTriggerLooks: {rest: {border: 'color/border/default', effect: null}, hover: {border: 'color/border/strong', effect: null}, focus: {border: 'color/border/default', effect: 'focus/default'}},
    thumb: 'color/fill/neutral/track',
  },
  lists: {types: 'type', contextTypes: 'context menu type', states: 'state', tones: 'tone', leadingTypes: 'leading type', headerTypes: 'header type', footerTypes: 'footer type', accountTypes: 'account trigger type', accountStates: 'account trigger state'},
  check: s => { if (!Number.isInteger(s.items) || s.items < 1) throw new ItemError('Send items as a whole number of at least 1.'); },
  sets: s => {
    const many = (slot, make) => Object.fromEntries(Array.from({length: s.items}, (_, i) => [`${slot}-${i + 1}`, make(i)]));
    const own = (sub, v = {}) => ({part: id, set: sub, variant: v});
    const panelOf = type => s.panels[type] || (type.startsWith('account-') ? s.panels.account : null);
    // An open panel: header, items with their leading, a divider, account items, footer and the scroll bar.
    const open = p => !p ? {} : {
      ...(p.header ? {header: own(header, {Type: p.header})} : {}),
      ...(p.subheading ? {subheading: own(header, {Type: 'subheading'})} : {}),
      ...(p.items ? {...many('item', () => own(item, {Type: 'item'})), ...many('leading', () => own(leading, {Type: p.items}))} : {}),
      ...(p.divider ? {divider: own(item, {Type: 'divider'})} : {}),
      ...(p.accounts ? many('account', i => own(account, {Selected: i === 0 ? 'true' : 'false'})) : {}),
      ...(p.footer ? {footer: own(footer, {Type: p.footer})} : {}),
      'scroll-bar': own(scroll),
    };
    const trigger = type => {
      const t = s.triggers[type];
      if (!t) return {};
      if (t.account) return {trigger: own(accountTrigger, {Type: t.account})};
      return {trigger: {part: t.part, variant: {...(t.variant || {})}}, ...(t.avatar ? {'trigger-avatar': {part: 'avatar', variant: {Size: t.avatar}}} : {})};
    };
    return [
      {name: set, properties: [variant('Type', s.types, s.types[0]), variant('Open', ['false', 'true'], 'false'), ...s.properties], axes: [], row: () => ({...s.panel}),
        instances: c => ({...trigger(c.Type), ...(c.Open === 'true' ? open(panelOf(c.Type)) : {})})},
      {name: context, properties: [variant('Type', s.contextTypes, s.contextTypes[0]), variant('Open', ['false', 'true'], 'false')], axes: [], row: () => ({...s.panel}),
        instances: c => c.Open === 'true' ? open(s.panels[c.Type]) : {}},
      // A divider row exists once, with the other properties at their defaults.
      {name: item, private: true, properties: [variant('Type', ['item', 'divider'], 'item'), variant('State', s.states, 'rest'), variant('Open', ['false', 'true'], 'false'), variant('Tone', s.tones, 'neutral'), ...s.itemProperties],
        exists: c => c.Type === 'item' || (c.State === s.states[0] && c.Open === 'false' && c.Tone === s.tones[0]),
        axes: ['Type', 'State', 'Open', 'Tone'],
        row: c => {
          if (c.Type === 'divider') return {fill: 'color/fill/none', text: null, icon: null};
          const look = s.itemLooks[c.Open === 'true' && c.State !== 'disabled' ? 'hover' : c.State];
          return {...look, ...(c.Tone === 'danger' && c.State !== 'disabled' ? s.danger : {})};
        },
        instances: c => c.Type === 'divider' ? {divider: {part: 'divider', variant: {Orientation: 'horizontal'}}} : {leading: own(leading, {Type: s.leadingTypes[0]}), shortcut: {part: 'kbd', variant: {}}},
        instanceAxes: ['Type']},
      {name: leading, private: true, properties: [variant('Type', s.leadingTypes, s.leadingTypes[0])], axes: ['Type'], row: c => ({mark: s.marks[c.Type] || null}),
        instances: c => c.Type === 'checkbox' ? {checkbox: {part: 'checkbox', variant: {Size: 'sm'}}} : c.Type === 'avatar' ? {avatar: {part: 'avatar', variant: {Size: s.leadingAvatar}}} : {}},
      {name: header, private: true, properties: [variant('Type', s.headerTypes, s.headerTypes[0]), prop('Show supporting text', 'boolean', true)], axes: ['Type'],
        row: c => ({name: c.Type === 'subheading' ? s.headerRoles.supporting : s.headerRoles.name, supporting: s.headerRoles.supporting, divider: c.Type === 'subheading' ? null : s.headerRoles.divider}),
        instances: c => c.Type === 'avatar' ? {avatar: {part: 'avatar', variant: {Size: 'md'}}} : c.Type === 'search' ? {search: {part: 'text-control', variant: {Type: 'single-line', Size: 'sm'}}, shortcut: {part: 'kbd', variant: {}}} : {}},
      {name: footer, private: true, properties: [variant('Type', s.footerTypes, s.footerTypes[0])], axes: ['Type'], row: () => ({text: s.headerRoles.supporting, divider: s.headerRoles.divider}),
        instances: c => c.Type === 'button' ? {button: {part: 'button', variant: {Emphasis: 'secondary', Size: 'sm'}}} : {}},
      {name: account, private: true, properties: [variant('State', ['rest', 'hover'], 'rest'), variant('Selected', ['false', 'true'], 'false')], axes: ['State'],
        row: c => ({...s.accountLooks[c.State], name: s.headerRoles.name, supporting: s.headerRoles.supporting}),
        instances: c => ({avatar: {part: 'avatar', variant: {Size: 'md'}}, selection: {part: 'radio', variant: {Size: 'sm', Checked: c.Selected}}}), instanceAxes: ['Selected']},
      {name: accountTrigger, private: true, properties: [variant('Type', s.accountTypes, s.accountTypes[0]), variant('State', s.accountStates, 'rest')], axes: ['Type', 'State'],
        row: c => ({...s.accountTriggerLooks[c.State], ...(c.Type === 'breadcrumb' ? {border: null} : {}), name: s.headerRoles.name, supporting: s.headerRoles.supporting}),
        instances: c => ({avatar: {part: 'avatar', variant: {Size: s.accountAvatars[c.Type]}}}), instanceAxes: ['Type']},
      {name: scroll, private: true, properties: [], axes: [], row: () => ({thumb: s.thumb})},
    ];
  },
  measures: s => ({
    [set]: {'*': {width: 'menu/width', gap: 'space/xs', 'items-padding-y': 'space/xs', radius: 'radius/surface', 'border-width': 'border/width/default'}},
    [item]: {'*': {'inset-y': 'space/xxs', 'inset-x': 'space/sm', gap: 'space/md', padding: 'space/md', radius: 'radius/control', 'text-style': 'type/body/sm/medium', chevron: 'size/icon/sm', 'divider-padding-y': 'space/xs'}},
    [leading]: {'*': {box: 'size/icon/sm', 'box-large': 'size/icon/md', icon: 'size/icon/sm', dot: 'size/indicator/sm'}},
    [header]: {'*': {'padding-y': 'space/lg', 'padding-x': 'space/xl', gap: 'space/md', 'name-style': semibold('body', 'sm'), 'subheading-style': semibold('body', 'xs'), 'border-width': 'border/width/default'}},
    [footer]: {'*': {'padding-y': 'space/lg', 'padding-x': 'space/xl', 'text-style': 'type/body/xs/regular', 'border-width': 'border/width/default'}},
    [account]: {'*': {'inset-y': 'space/xxs', 'inset-x': 'space/sm', gap: 'space/md', padding: 'space/md', radius: 'radius/control'}},
    [accountTrigger]: {'card-xs': {padding: 'space/md'}, 'card-sm': {padding: 'space/lg'}, 'card-md': {padding: 'space/lg'}, '*': {gap: 'space/md', radius: 'radius/surface', icon: 'size/icon/sm', 'border-width': 'border/width/default'}},
    [scroll]: {'*': {width: 'size/track/sm', inset: 'space/xs', radius: 'radius/full'}},
  }),
  tokens: s => [{set, role: 'width', value: s.width, description: 'Width of an open Menu panel.'}],
});
