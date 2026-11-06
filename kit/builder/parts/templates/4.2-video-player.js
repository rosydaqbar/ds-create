// Premade Section template. Brand-agnostic: every structural choice below is an input with a default from
// specs/sections/4.2-video-player.md, and a system may change any of it.
import {ItemError} from '../../foundations/ops.mjs';
import {checkObjects, definePart, prop, semibold, variant} from '../kit.mjs';

export const id = 'video-player';
export const page = '4.2';
export const name = 'Video player';
export const set = 'Video player';
export const level = 'sections';
export const spec = 'specs/sections/4.2-video-player.md';
export const uses = ['kbd'];

const action = 'Video player action', tooltip = 'Video player tooltip', volume = 'Video player volume', bar = 'Video player actions bar', overlay = 'Video player overlay action', scrub = 'Video player scrub preview';
const onSolid = 'color/text/on-solid';
export const {fields, defaults, checkInputs, contract, compile} = definePart({
  id, page, name, set,
  defaults: {
    // §4 and §7: per player size, the overlay action and its icon (kept as video-player/overlay/{size,icon}/{size}),
    // the actions bar's fade zone and padding (video-player/bar/{fade,padding}/{size}) and the action square
    // and icon. The player's Size reaches the bar and every action one-to-one.
    sizes: [
      {size: 'sm', overlay: 56, overlayIcon: 24, fade: 'space/3xl', padding: 'space/md', action: 'size/control/xs', icon: 'size/icon/sm'},
      {size: 'md', overlay: 64, overlayIcon: 28, fade: 'space/4xl', padding: 'space/lg', action: 'size/control/sm', icon: 'size/icon/md'},
      {size: 'lg', overlay: 80, overlayIcon: 32, fade: 'space/5xl', padding: 'space/xl', action: 'size/control/md', icon: 'size/icon/md'},
    ],
    actions: ['play', 'pause', 'rewind', 'fast-forward', 'skip-back', 'skip-forward', 'volume-none', 'volume-min', 'volume-max', 'zoom-out', 'zoom-in', 'cast', 'minimize', 'maximize', 'fullscreen', 'exit-fullscreen', 'playback-speed', 'captions'],
    states: ['rest', 'hover', 'focus'],
    volumes: ['0', '25', '50', '75', '100'],
    defaultVariant: {size: 'lg', volume: '75'},
    // Volume value → the volume action it shows.
    volumeActions: {'0': 'volume-none', '25': 'volume-min', '50': 'volume-min', '75': 'volume-max', '100': 'volume-max'},
    // The actions bar after play/pause and volume, in order.
    barActions: ['playback-speed', 'captions', 'cast', 'fullscreen'],
    properties: [prop('Show overlay action', 'boolean', true), prop('Show actions bar', 'boolean', true)],
    // §6: controls sit on video in every color mode. The on-solid tints hold one color at an alpha.
    tints: {'action/fill/hover': 0.16, 'overlay/fill': 0.24, 'overlay/fill/hover': 0.32, track: 0.24, 'track/buffer': 0.4},
    fg: 'video-player/control/fg',
    played: 'color/fill/brand/solid',
    fade: 'color/overlay/scrim',
    focus: 'focus/default',
    handleEffect: ['elevation/raised', null],
  },
  lists: {actions: 'action', states: 'state', volumes: 'volume', barActions: 'bar action'},
  check: s => {
    checkObjects(name, s.sizes, 'size', 'size');
    const unknown = [...s.barActions, ...Object.values(s.volumeActions || {}), 'play', 'pause'].find(a => !s.actions.includes(a));
    if (unknown) throw new ItemError(`Video player uses the ${unknown} action, which is not in actions.`);
    const silent = s.volumes.find(v => !s.volumeActions?.[v]);
    if (silent) throw new ItemError(`Video player has no volume action for ${silent}.`);
  },
  sets: s => {
    const sizes = s.sizes.map(z => z.size), playing = c => c.Playing === 'true' ? 'pause' : 'play';
    const own = (sub, v = {}) => ({part: id, set: sub, variant: v});
    return [
      {name: set, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Playing', ['false', 'true'], 'false'), ...s.properties], axes: [], row: () => ({fade: s.fade}),
        instances: c => ({overlay: own(overlay, {Playing: c.Playing}), bar: own(bar, {Size: c.Size, Playing: c.Playing})})},
      {name: action, private: true, properties: [variant('Type', s.actions, s.actions[0]), variant('State', s.states, 'rest'), variant('Size', sizes, s.defaultVariant.size)],
        axes: ['State'], row: c => ({fill: c.State === 'hover' ? 'video-player/action/fill/hover' : null, icon: s.fg, effect: c.State === 'focus' ? s.focus : null}),
        // The tooltip shows on hover.
        instances: c => c.State === 'hover' ? {tooltip: own(tooltip)} : {}, instanceAxes: ['State']},
      {name: tooltip, private: true, properties: [prop('Text', 'text', 'Play'), prop('Show shortcut', 'boolean', true)], axes: [], row: () => ({fill: 'video-player/tooltip/fill', text: s.fg}),
        instances: () => ({shortcut: {part: 'kbd', variant: {Size: 'sm'}}})},
      // The track shows on hover only.
      {name: volume, private: true, properties: [variant('Value', s.volumes, s.defaultVariant.volume), variant('State', ['rest', 'hover'], 'rest')],
        axes: ['State'], row: c => c.State === 'hover' ? {track: 'video-player/track', level: s.fg, handle: s.fg, effect: s.handleEffect} : {track: null, level: null, handle: null, effect: null},
        instances: c => ({action: own(action, {Type: s.volumeActions[c.Value]})}), instanceAxes: ['Value']},
      {name: bar, private: true, properties: [variant('Size', sizes, s.defaultVariant.size), variant('Playing', ['false', 'true'], 'false'), prop('Show timestamps', 'boolean', true)],
        axes: [], row: () => ({fade: s.fade, track: 'video-player/track', buffer: 'video-player/track/buffer', played: s.played, timestamp: s.fg}),
        instances: c => ({'play-pause': own(action, {Type: playing(c), Size: c.Size}), volume: own(volume), ...Object.fromEntries(s.barActions.map(a => [a, own(action, {Type: a, Size: c.Size})]))})},
      {name: overlay, private: true, properties: [variant('Playing', ['false', 'true'], 'false'), variant('State', ['rest', 'hover'], 'rest')],
        axes: ['State'], row: c => ({fill: c.State === 'hover' ? 'video-player/overlay/fill/hover' : 'video-player/overlay/fill', icon: s.fg})},
      {name: scrub, private: true, properties: [], axes: [], row: () => ({fill: 'video-player/tooltip/fill', text: s.fg, line: s.fg})},
    ];
  },
  measures: s => ({
    [set]: {...Object.fromEntries(s.sizes.map(z => [z.size, {'overlay-size': `video-player/overlay/size/${z.size}`, 'overlay-icon': `video-player/overlay/icon/${z.size}`}])), '*': {radius: 'radius/surface'}},
    [action]: {...Object.fromEntries(s.sizes.map(z => [z.size, {size: z.action, icon: z.icon}])), '*': {radius: 'radius/control', 'speed-style': semibold('body', 'sm')}},
    [tooltip]: {'*': {gap: 'space/sm', 'padding-y': 'space/sm', 'padding-x': 'space/md', radius: 'radius/control', 'text-style': semibold('body', 'xs')}},
    [volume]: {'*': {gap: 'space/xs', 'track-height': 'size/track/sm', handle: 'size/indicator/lg', radius: 'radius/full'}},
    [bar]: {...Object.fromEntries(s.sizes.map(z => [z.size, {fade: `video-player/bar/fade/${z.size}`, padding: `video-player/bar/padding/${z.size}`}])),
      '*': {gap: 'space/sm', 'progress-gap': 'space/md', 'timestamp-style': 'type/body/xs/medium', 'track-height': 'size/track/sm', 'track-radius': 'radius/full'}},
    [scrub]: {'*': {gap: 'space/xs', 'indicator-padding-y': 'space/xxs', 'indicator-padding-x': 'space/sm', radius: 'radius/control'}},
  }),
  tokens: s => [
    {set, role: 'control/fg', value: {alias: 'color/text/on-solid'}, type: 'COLOR', description: 'Icons, timestamps and the progress handle on video.'},
    {set, role: 'tooltip/fill', value: {alias: 'color/overlay/scrim'}, type: 'COLOR', description: 'Fill of video tooltips and the timestamp indicator.'},
    ...Object.entries(s.tints).map(([role, alpha]) => ({set, role, value: {mix: onSolid, alpha}, type: 'COLOR', description: `On-solid at ${Math.round(alpha * 100)}%, the same in every mode.`})),
    ...s.sizes.flatMap(z => [
      {set, role: 'overlay/size', variant: z.size, value: z.overlay, description: `Overlay play button on ${z.size} players.`},
      {set, role: 'overlay/icon', variant: z.size, value: z.overlayIcon, description: `Overlay play icon on ${z.size} players.`},
      {set, role: 'bar/padding', variant: z.size, value: {alias: z.padding}, description: `Side and bottom padding of the actions bar on ${z.size} players.`},
      {set, role: 'bar/fade', variant: z.size, value: {alias: z.fade}, description: `Fade zone above the actions bar on ${z.size} players.`},
    ]),
  ],
});
