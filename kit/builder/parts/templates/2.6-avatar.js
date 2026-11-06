// Premade Part template. Brand-agnostic: every structural choice below is an input with a default from
// specs/parts/2.6-avatar.md, and a system may change any of it. The page has two published sets, Avatar and
// Profile photo, and the private Avatar indicator. Avatar image holds the system's own photos, one component
// per image, so it has no fixed matrix here.
import {checkObjects, definePart, prop, variant} from '../kit.mjs';

export const id = 'avatar';
export const page = '2.6';
export const name = 'Avatar';
export const set = 'Avatar';
export const level = 'parts';
export const spec = 'specs/parts/2.6-avatar.md';
export const uses = [];
// A fill or background slot the kit component never draws as a background takes a color only: a CSS gradient
// cannot show there (parts/validate.mjs refuses it, Builder offers none). The verified indicator colors its mark as text.
export const solidSlots = {'Avatar indicator': {fill: 'the verified mark draws it as a text color, which cannot show a gradient'}};

// A weight list: the first face the text styles have, closest to semibold first.
const semibold = (scale, size) => [`type/${scale}/${size}/semibold`, `type/${scale}/${size}/medium`, `type/${scale}/${size}/bold`];
const placeholder = {fill: 'avatar/placeholder/fill', text: 'avatar/placeholder/text', icon: 'avatar/placeholder/icon'};
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4: side, initials style, placeholder icon, indicator dot and ring width per size. 2xs shows the
    // placeholder icon for initials. The ring is 3 above lg, a value with no token, drawn as built.
    sizes: [
      {size: '2xs', side: 'size/avatar/2xs', initials: null, icon: 'size/icon/xs', dot: 'size/indicator/xs', ring: 'border/width/strong'},
      {size: 'xs', side: 'size/avatar/xs', initials: semibold('body', 'xs'), icon: 'size/icon/sm', dot: 'size/indicator/xs', ring: 'border/width/strong'},
      {size: 'sm', side: 'size/avatar/sm', initials: semibold('body', 'sm'), icon: 'size/icon/md', dot: 'size/indicator/sm', ring: 'border/width/strong'},
      {size: 'md', side: 'size/avatar/md', initials: semibold('body', 'md'), icon: 'size/icon/lg', dot: 'size/indicator/md', ring: 'border/width/strong'},
      {size: 'lg', side: 'size/avatar/lg', initials: semibold('body', 'lg'), icon: 'size/icon/lg', dot: 'size/indicator/lg', ring: 'border/width/strong'},
      {size: 'xl', side: 'size/avatar/xl', initials: semibold('body', 'xl'), icon: 'size/icon/xl', dot: 'size/indicator/lg', ring: null},
      {size: '2xl', side: 'size/avatar/2xl', initials: semibold('heading', 'xs'), icon: 'size/icon/xl', dot: 'size/indicator/lg', ring: null},
    ],
    // Profile photo side and ring padding, px kept as profile-photo/*/{size}.
    photoSizes: [{size: 'sm', side: 72, ring: 3}, {size: 'md', side: 96, ring: 4}, {size: 'lg', side: 160, ring: 6}],
    types: ['image', 'initials', 'icon'],
    indicators: ['offline', 'online', 'verified', 'company', 'count'],
    defaultVariant: {size: 'md', type: 'image', indicator: 'offline'},
    properties: [prop('Image', 'instance swap', 'first image'), prop('Initials', 'text', 'OR'), prop('Show ring', 'boolean', false), prop('Show indicator', 'boolean', false)],
    photoProperties: [prop('Image', 'instance swap', 'first image'), prop('Initials', 'text', 'OR'), prop('Show verified', 'boolean', false)],
    // §6. The placeholder colors are component tokens so one change recolors every placeholder.
    placeholderRoles: {fill: 'color/fill/neutral/subtle', text: 'color/text/tertiary', icon: 'color/icon/tertiary'},
    typeRoles: {image: {fill: null, border: 'color/border/subtle', text: null, icon: null}, initials: {fill: placeholder.fill, border: null, text: placeholder.text, icon: null}, icon: {fill: placeholder.fill, border: null, text: null, icon: placeholder.icon}},
    ring: 'color/surface/base',
    photoEffect: ['elevation/raised', null],
    indicatorRoles: {
      offline: {fill: 'color/icon/disabled', text: null, ring: 'color/surface/base'},
      online: {fill: ['color/icon/success', 'color/icon/brand'], text: null, ring: 'color/surface/base'},
      verified: {fill: 'color/icon/brand', text: null, ring: null},
      company: {fill: null, text: null, ring: 'color/surface/base'},
      count: {fill: ['color/fill/danger/solid', 'color/fill/brand/solid'], text: 'color/text/on-solid', ring: 'color/surface/base'},
    },
    countStyle: semibold('body', 'xs'),
    radius: 'radius/full',
  },
  lists: {types: 'type', indicators: 'indicator'},
  check: s => { checkObjects(name, s.sizes, 'size', 'size'); checkObjects(name, s.photoSizes, 'size', 'profile photo size'); },
  sets: s => [
    {name: 'Avatar', properties: [variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), ...s.properties], axes: ['Type'], row: c => ({...s.typeRoles[c.Type], ring: s.ring})},
    {name: 'Profile photo', properties: [variant('Size', s.photoSizes.map(z => z.size), s.defaultVariant.size), variant('Type', s.types, s.defaultVariant.type), ...s.photoProperties], axes: ['Type'], row: c => ({...s.typeRoles[c.Type], ring: s.ring, effect: s.photoEffect})},
    {name: 'Avatar indicator', private: true, properties: [variant('Type', s.indicators, s.defaultVariant.indicator), variant('Size', s.sizes.map(z => z.size), s.defaultVariant.size)], axes: ['Type'], row: c => ({...s.indicatorRoles[c.Type], 'text-style': c.Type === 'count' ? s.countStyle : null})},
  ],
  measures: s => ({
    Avatar: {...Object.fromEntries(s.sizes.map(z => [z.size, {side: z.side, 'initials-style': z.initials, icon: z.icon, dot: z.dot, 'ring-width': z.ring}])), '*': {radius: s.radius}},
    'Profile photo': Object.fromEntries(s.photoSizes.map(z => [z.size, {size: z.side, ring: z.ring}])),
  }),
  tokens: s => Object.entries(s.placeholderRoles).map(([slot, role]) => ({set: 'Avatar', role: 'placeholder', variant: slot, value: {alias: role}, type: 'COLOR', description: `Placeholder ${slot} of avatars without an image.`})),
  describe: (set, slot, size) => slot === 'size' ? `Outer side of ${size} profile photos.` : `Ring padding of ${size} profile photos.`,
});
