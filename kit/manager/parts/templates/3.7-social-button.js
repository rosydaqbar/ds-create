// Premade Component template. Brand-agnostic: every structural choice below is an input with a default from
// specs/components/3.7-social-button.md, and a system may change any of it. The provider colors are the
// providers' own, not the system's brand, so they are the one place a template holds color values.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, semibold, variant} from '../kit.mjs';

export const id = 'social-button';
export const page = '3.7';
export const name = 'Social button';
export const set = 'Social button';
export const level = 'components';
export const spec = 'specs/components/3.7-social-button.md';
export const uses = ['button'];

const group = 'Social button group';
const hex = /^#[0-9a-f]{6}$/i;
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // The providers, in order. fill, fillHover and fg stay the same in every color mode. On a solid
    // background the mark is the single-color version, except where the provider's full-color mark is meant
    // for it (solidMarkMono false).
    // provider colors: begin
    providers: [
      {id: 'google', name: 'Google', fill: '#1f1f1f', fillHover: '#303030', fg: '#ffffff', solidMarkMono: false},
      {id: 'apple', name: 'Apple', fill: '#000000', fillHover: '#1c1c1e', fg: '#ffffff', solidMarkMono: true},
      {id: 'github', name: 'GitHub', fill: '#24292f', fillHover: '#32383f', fg: '#ffffff', solidMarkMono: true},
      {id: 'facebook', name: 'Facebook', fill: '#1877f2', fillHover: '#166fe5', fg: '#ffffff', solidMarkMono: true},
      {id: 'x', name: 'X', fill: '#000000', fillHover: '#1c1c1e', fg: '#ffffff', solidMarkMono: true},
      {id: 'gitlab', name: 'GitLab', fill: '#fc6d26', fillHover: '#e2561a', fg: '#171321', solidMarkMono: true},
    ],
    // provider colors: end
    // §4: Button's own paddings and gap per size; the mark is one icon step larger at lg.
    sizes: [
      {size: 'md', height: 'size/control/md', mark: 'size/icon/md', text: semibold('body', 'sm')},
      {size: 'lg', height: 'size/control/lg', mark: 'size/icon/lg', text: semibold('body', 'md')},
    ],
    types: ['solid', 'color', 'mono'],
    states: ['rest', 'hover', 'focus'],
    defaultVariant: {size: 'lg', type: 'color'},
    // §5 and §6: color and mono take the secondary Button's look from the instance (null here); a mono mark
    // follows the icon color.
    monoMark: {rest: 'color/icon/secondary', hover: 'color/icon/primary', focus: 'color/icon/secondary'},
    focus: 'focus/default',
    groupGap: 'space/lg',
  },
  lists: {types: 'type', states: 'state'},
  check: s => {
    checkObjects(name, s.providers, 'id', 'provider');
    checkObjects(name, s.sizes, 'size', 'size');
    for (const p of s.providers) {
      if (!/^[a-z0-9-]+$/.test(p.id)) throw new ItemError(`Social button provider ids use lowercase letters, digits and hyphens: ${p.id}.`);
      if (typeof p.name !== 'string' || !p.name.trim()) throw new ItemError(`Social button needs a name for ${p.id}.`);
    }
    const twice = s.providers.map(p => p.name).find((n, i, a) => a.indexOf(n) !== i);
    if (twice) throw new ItemError(`Social button lists the name ${twice} twice.`);
    for (const p of s.providers) if (![p.fill, p.fillHover, p.fg].every(c => typeof c === 'string' && hex.test(c))) throw new ItemError(`Social button needs fill, fill-hover and fg colors for ${p.id}.`);
  },
  sets: s => {
    const sizes = s.sizes.map(z => z.size), byName = Object.fromEntries(s.providers.map(p => [p.name, p]));
    const props = [variant('Size', sizes, s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), variant('Icon only', ['false', 'true'], 'false')];
    const own = (p, role) => `social-button/${p.id}/${role}`;
    return [
      {name: set, properties: [props[0], variant('Provider', s.providers.map(p => p.name), s.providers[0]?.name), props[1], props[2], variant('State', s.states, s.states[0])],
        axes: ['Provider', 'Type', 'State'],
        row: c => {
          const p = byName[c.Provider], solid = c.Type === 'solid';
          if (!(c.Type in {solid: 1, color: 1, mono: 1})) return null;
          return {fill: solid ? own(p, c.State === 'hover' ? 'fill/hover' : 'fill') : null, label: solid ? own(p, 'fg') : null,
            mark: solid ? (p.solidMarkMono ? own(p, 'fg') : null) : c.Type === 'mono' ? s.monoMark[c.State] : null,
            effect: c.State === 'focus' ? s.focus : null};
        },
        // §7: a secondary Button with the Social button's Size, State and Icon only.
        instances: c => ({button: {part: 'button', variant: {Emphasis: 'secondary', Size: c.Size, State: c.State, 'Icon only': c['Icon only']}}}),
        instanceAxes: ['Size', 'State', 'Icon only']},
      {name: group, properties: [props[0], props[2], props[1]], axes: [], row: () => ({}),
        instances: c => Object.fromEntries(s.providers.map(p => [p.id, {part: id, set, variant: {Size: c.Size, Type: c.Type, 'Icon only': c['Icon only'], Provider: p.name}}]))},
    ];
  },
  measures: s => ({
    [set]: Object.fromEntries(s.sizes.map(z => [z.size, {height: z.height, 'padding-left': `button/padding-left/${z.size}`, 'padding-right': `button/padding-right/${z.size}`, gap: `button/gap/${z.size}`, mark: z.mark, 'text-style': z.text}])),
    [group]: {'*': {gap: s.groupGap}},
  }),
  tokens: s => s.providers.flatMap(p => [
    {set, role: `${p.id}/fill`, value: p.fill, type: 'COLOR', description: `${p.name}'s own fill for solid Social buttons, the same in every mode.`},
    {set, role: `${p.id}/fill/hover`, value: p.fillHover, type: 'COLOR', description: `${p.name}'s fill on hover.`},
    {set, role: `${p.id}/fg`, value: p.fg, type: 'COLOR', description: `Label and single-color mark on ${p.name}'s fill.`},
  ]),
});
