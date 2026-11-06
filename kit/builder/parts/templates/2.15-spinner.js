// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.15-spinner.md, and a system may change any of it.
import {checkObjects, definePart, variant} from '../kit.mjs';

export const id = 'spinner';
export const page = '2.15';
export const name = 'Spinner';
export const set = 'Spinner';
export const level = 'parts';
export const spec = 'specs/parts/2.15-spinner.md';
export const uses = [];

export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §6: the box per size (a token, or px kept as spinner/size/{size}) and the ring thickness (px or a token).
    sizes: [
      {size: 'sm', box: 'size/icon/sm', thickness: 2}, {size: 'md', box: 'size/icon/md', thickness: 2},
      {size: 'lg', box: 'size/icon/xl', thickness: {alias: 'size/track/sm'}}, {size: 'xl', box: 48, thickness: {alias: 'size/track/md'}},
    ],
    tones: ['neutral', 'brand'],
    defaultVariant: {size: 'md', tone: 'neutral'},
    // §9: ring roles per tone; {tone} fills from the Tone value.
    roles: {track: 'color/fill/neutral/track', active: 'color/icon/{tone}'},
    toneRoles: {neutral: {active: 'color/icon/secondary'}},
    // §6: standalone loading text under the Spinner.
    text: {gap: 'space/md', style: 'type/body/sm/medium', color: 'color/text/tertiary'},
  },
  lists: {tones: 'tone'},
  check: s => checkObjects(name, s.sizes, 'size', 'size'),
  sets: s => [{
    name: set,
    properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Tone', s.tones, s.defaultVariant.tone)],
    axes: ['Tone'],
    row: c => ({...s.roles, ...s.toneRoles[c.Tone]}),
  }],
  measures: s => ({[set]: {
    ...Object.fromEntries(s.sizes.map(z => [z.size, {size: z.box, thickness: typeof z.thickness === 'string' ? {alias: z.thickness} : z.thickness}])),
    '*': {'text-gap': s.text.gap, 'text-style': s.text.style, 'text-color': s.text.color},
  }}),
  describe: (_, slot, size) => slot === 'thickness' ? `Ring thickness of ${size} spinners.` : `Box of ${size} spinners.`,
});
