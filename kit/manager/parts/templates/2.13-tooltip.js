// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.13-tooltip.md, and a system may change any of it. The page has two published sets, Tooltip
// and Help icon (which opens a Tooltip), and the private Tooltip arrow.
import {definePart, prop, variant} from '../kit.mjs';

export const id = 'tooltip';
export const page = '2.13';
export const name = 'Tooltip';
export const set = 'Tooltip';
export const level = 'parts';
export const spec = 'specs/parts/2.13-tooltip.md';
export const uses = [];

const text = 'Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text.';
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    placements: ['none', 'top', 'top-start', 'top-end', 'bottom', 'left', 'right'],
    arrowEdges: ['top', 'bottom', 'left', 'right'],
    helpStates: ['rest', 'hover', 'focus'],
    defaultVariant: {placement: 'top', state: 'rest'},
    properties: [prop('Text', 'text', 'This is a tooltip'), prop('Show supporting text', 'boolean', false), prop('Supporting text', 'text', text)],
    helpProperties: [prop('Show supporting text', 'boolean', false), prop('Show cursor', 'boolean', false)],
    // §6. The shadow is optional: a system without shadows draws the tooltip flat.
    roles: {fill: 'color/surface/inverse', effect: ['elevation/overlay', null], radius: 'radius/surface', text: 'color/text/inverse', 'text-style': ['type/body/xs/semibold', 'type/body/xs/medium'], 'supporting-text': 'color/text/inverse', 'supporting-style': 'type/body/xs/medium'},
    // §5: the help icon per state; focus adds the focus ring.
    helpRoles: {rest: {icon: 'color/icon/tertiary', effect: null}, hover: {icon: 'color/icon/tertiary/hover', effect: null}, focus: {icon: 'color/icon/tertiary/hover', effect: 'focus/default'}},
    measures: {'padding-y': 'space/md', 'padding-x': 'space/lg', 'padding-supporting': 'space/lg', 'text-gap': 'space/xs', 'max-width': 'size/width/xxs'},
    helpMeasures: {box: 'size/icon/sm', distance: 'space/xs'},
  },
  lists: {placements: 'placement', arrowEdges: 'arrow edge', helpStates: 'state'},
  sets: s => [
    {name: 'Tooltip', properties: [variant('Placement', s.placements, s.defaultVariant.placement), ...s.properties], axes: [], row: () => ({...s.roles})},
    {name: 'Help icon', properties: [variant('State', s.helpStates, s.defaultVariant.state), variant('Placement', s.placements, s.defaultVariant.placement), ...s.helpProperties], axes: ['State'], row: c => ({...s.helpRoles[c.State]})},
    {name: 'Tooltip arrow', private: true, properties: [variant('Placement', s.arrowEdges, s.arrowEdges[0])], axes: [], row: () => ({fill: s.roles.fill})},
  ],
  measures: s => ({Tooltip: {'*': {...s.measures}}, 'Help icon': {'*': {...s.helpMeasures}}}),
});
