import type { ReactNode } from 'react';
import { VideoPlayer, type VideoPlayerSize } from '@/components/sections/VideoPlayer';
import {
  VideoAction,
  VideoActionsBar,
  VideoOverlayAction,
  VideoPlaceholderFrame,
  VideoScrubPreview,
  VideoTooltip,
  VideoVolume,
  videoActionTypes,
} from '@/components/sections/_VideoPlayerParts';
import { Avatar } from '@/components/parts/Avatar';
import { Button } from '@/components/parts/Button';
import { Progress } from '@/components/parts/Progress';
import { cn } from '@/lib/cn';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md', 'lg'] as const;
const PLAYING = ['false', 'true'] as const;
const STATES = ['rest', 'hover', 'focus'] as const;
const VOLUME_VALUES = ['0', '25', '50', '75', '100'] as const;

/** Bar widths = the player frame widths (480 · 720 · 960). */
const barWidth: Record<VideoPlayerSize, string> = { sm: 'w-(--size-width-sm)', md: 'w-[45rem]', lg: 'w-[60rem]' };

/** Dark specimen surface (a sample video frame) so the light controls are visible, as on the Figma `.Main` frame. */
function Specimen({ children, className, inner, bare = false }: { children: ReactNode; className?: string; inner?: string; bare?: boolean }) {
  return (
    <div className={cn('relative isolate rounded-surface', className)}>
      <VideoPlaceholderFrame className="absolute inset-0 -z-10 rounded-surface" />
      <div className={cn('flex items-end justify-center', !bare && 'px-xl pb-lg pt-[3.5rem]', inner)}>{children}</div>
    </div>
  );
}

const lesson = 'Lesson 3 · Building with tokens';

export default defineDoc({
  id: '4.2',
  name: 'Video player',
  level: 'sections',
  spec: 'sections/4.2-video-player.md',
  exports: ['VideoPlayer'],
  summary:
    'Video players are for realistic playback-preview mockups. Controls overlay the 16:9 media frame: a large play button in the centre, and an actions bar along the bottom with play, volume, timeline, speed, casting and fullscreen.',
  hero: () => <VideoPlayer size="lg" title="Product tour · 4 minutes" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'lg' },
      { name: 'playing', figma: 'Playing', control: { type: 'boolean' }, default: false },
      { name: 'showOverlayAction', figma: 'Show overlay action', control: { type: 'boolean' }, default: true },
      { name: 'showActionsBar', figma: 'Show actions bar', control: { type: 'boolean' }, default: true },
    ],
    render: (a) => <VideoPlayer {...(a as any)} title="Product tour · 4 minutes" />,
    code: (a) => `<VideoPlayer${jsxProps(a, { size: 'lg', playing: false, showOverlayAction: true, showActionsBar: true })} src="/media/tour.mp4" poster="/media/tour.jpg" title="Product tour" />`,
  },
  examples: [
    {
      title: 'Course lesson',
      caption: 'The player leads the lesson page; progress and the instructor sit under it.',
      stage: 'full',
      render: () => (
        <div className="flex w-[60rem] max-w-full flex-col gap-xl">
          <VideoPlayer size="lg" playing title={lesson} placeholderTime={{ current: 154, duration: 612, buffered: 260 }} />
          <div className="flex flex-col gap-lg">
            <h3 className="type-heading-md-semibold text-text-primary">{lesson}</h3>
            <div className="flex items-center gap-md">
              <Avatar size="md" type="initials" initials="MR" alt="" />
              <div className="flex flex-col">
                <span className="type-body-sm-semibold text-text-primary">Maya Rossi</span>
                <span className="type-body-sm-regular text-text-tertiary">Design systems lead</span>
              </div>
            </div>
            <div className="flex flex-col gap-sm">
              <span className="type-body-sm-medium text-text-secondary">Lesson 3 of 8</span>
              <Progress value={37.5} placement="right" aria-label="Course progress" />
            </div>
          </div>
        </div>
      ),
      code: `<VideoPlayer size="lg" src="/lessons/03.mp4" poster="/lessons/03.jpg" title="Lesson 3 · Building with tokens"
  tracks={[{ src: '/lessons/03.en.vtt', srcLang: 'en', label: 'English' }]} />
<h2 className="type-heading-md-semibold">Lesson 3 · Building with tokens</h2>
<div className="flex items-center gap-md">
  <Avatar size="md" type="initials" initials="MR" alt="" />
  <span className="type-body-sm-semibold">Maya Rossi</span>
</div>
<Progress value={37.5} placement="right" aria-label="Course progress" />`,
    },
    {
      title: 'Product tour card',
      caption: 'A small player with the overlay action only, inside a marketing card.',
      render: () => (
        <div className="flex w-(--size-width-sm) max-w-full flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-raised shadow-raised">
          <div className="p-md pb-none">
            <VideoPlayer size="sm" showActionsBar={false} title="See it in 2 minutes" />
          </div>
          <div className="flex flex-col items-start gap-lg p-2xl">
            <div className="flex flex-col gap-xs">
              <h3 className="type-heading-sm-semibold text-text-primary">See how teams plan together</h3>
              <p className="type-body-sm-regular text-text-tertiary">A two-minute tour of boards, timelines and reports.</p>
            </div>
            <Button label="Start free trial" />
          </div>
        </div>
      ),
      code: `<div className="flex flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-raised">
  <div className="p-md">
    <VideoPlayer size="sm" showActionsBar={false} src="/media/tour.mp4" poster="/media/tour.jpg" title="Product tour" />
  </div>
  <div className="flex flex-col gap-lg p-2xl">
    <h3 className="type-heading-sm-semibold">See how teams plan together</h3>
    <Button label="Start free trial" />
  </div>
</div>`,
    },
    {
      title: 'Scrubbing',
      caption: 'Hovering the timeline shows the scrub preview with the time under the pointer.',
      stage: 'full',
      render: () => <VideoPlayer size="md" title="Quarterly review · recording" forceScrub={102} />,
      code: `<VideoPlayer size="md" src="/recordings/q3.mp4" poster="/recordings/q3.jpg" title="Quarterly review" />
{/* The scrub preview appears while the pointer is over the timeline. */}`,
    },
  ],
  whenToUse: {
    use: ['People will actually watch: course lessons, product tours, recorded meetings.', 'Realistic playback mockups in product screens.'],
    dont: [
      'Video is secondary — use an image with a play link.',
      'Ambient or decorative motion — use a still image; never autoplay with sound.',
      'Audio-only content — the 16:9 frame has nothing to show.',
    ],
  },
  matrices: [
    {
      title: 'Video player',
      rows: 'Size',
      columns: 'Playing',
      render: () => (
        <Matrix
          rowProp="Size"
          rows={SIZES}
          colProp="Playing"
          cols={PLAYING}
          cell={(size, p) => (
            <div className={barWidth[size]}>
              <VideoPlayer size={size} playing={p === 'true'} tabIndex={-1} />
            </div>
          )}
        />
      ),
    },
    {
      title: 'Size=lg · overlay off · actions bar off',
      columns: 'Show overlay action=false, Show actions bar=false',
      render: () => (
        <div className="flex w-[60rem] max-w-full flex-col gap-2xl">
          <VideoPlayer size="lg" showOverlayAction={false} tabIndex={-1} />
          <VideoPlayer size="lg" showActionsBar={false} tabIndex={-1} />
        </div>
      ),
    },
  ],
  privateParts: [
    ...SIZES.map((size) => ({
      title: `.Main/Video player action · Size=${size}`,
      rows: 'Type',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Type"
          rows={videoActionTypes}
          colProp="State"
          cols={STATES}
          cell={(type, state) => (
            <Specimen className="min-w-[11rem]">
              <VideoAction type={type} size={size} shortcut={type === 'play' || type === 'pause' ? 'Space' : type.startsWith('volume') ? 'M' : type.endsWith('fullscreen') ? 'F' : type === 'captions' ? 'C' : undefined} forceState={state === 'rest' ? undefined : state} tabIndex={-1} />
            </Specimen>
          )}
        />
      ),
    })),
    {
      title: '.Main/Video player tooltip',
      columns: 'Show shortcut',
      render: () => (
        <Matrix
          rowProp="Text"
          rows={['Play']}
          colProp="Show shortcut"
          cols={['true', 'false'] as const}
          cell={(text, s) => (
            <Specimen bare className="p-xl">
              <VideoTooltip text={text} shortcut={s === 'true' ? 'Space' : undefined} />
            </Specimen>
          )}
        />
      ),
    },
    {
      title: '.Main/Video player volume',
      rows: 'State',
      columns: 'Value',
      render: () => (
        <Matrix
          rowProp="State"
          rows={['rest', 'hover'] as const}
          colProp="Value"
          cols={VOLUME_VALUES}
          cell={(state, v) => (
            <Specimen bare className="w-[9rem] p-lg">
              <VideoVolume value={Number(v)} forceState={state === 'hover' ? 'hover' : undefined} />
            </Specimen>
          )}
        />
      ),
    },
    {
      title: '.Main/Video player actions bar',
      rows: 'Size',
      columns: 'Playing',
      render: () => (
        <Matrix
          rowProp="Size"
          rows={SIZES}
          colProp="Playing"
          cols={PLAYING}
          cell={(size, p) => (
            <Specimen bare className={barWidth[size]}>
              <VideoActionsBar size={size} playing={p === 'true'} />
            </Specimen>
          )}
        />
      ),
    },
    {
      title: '.Main/Video player overlay action',
      rows: 'Playing',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Playing"
          rows={PLAYING}
          colProp="State"
          cols={['rest', 'hover'] as const}
          cell={(p, state) => (
            <Specimen bare className="p-2xl">
              <VideoOverlayAction playing={p === 'true'} forceState={state === 'hover' ? 'hover' : undefined} tabIndex={-1} />
            </Specimen>
          )}
        />
      ),
    },
    {
      title: '.Main/Video player scrub preview',
      render: () => (
        <div className="flex">
          <Specimen bare className="p-2xl">
            <VideoScrubPreview time={102} duration={252} />
          </Specimen>
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => <VideoPlayer size="md" title="Media" forceScrub={102} tabIndex={-1} />,
    parts: [
      { name: 'Media', description: 'Fixed 16:9 frame (480 × 270, 720 × 405, 960 × 540), clip content, radius/surface. The <video> or its poster; a sample frame when there is none.', tokens: ['radius/surface'] },
      { name: 'Overlay action', description: 'Circle in the centre, absolutely positioned: 56 · 64 · 80 with a 24 · 28 · 32 icon, backdrop blur. Play or pause.', tokens: ['video-player/overlay/fill', 'video-player/overlay/fill/hover', 'video-player/control/fg'] },
      { name: 'Actions bar', description: 'Absolute along the bottom, Fill width. The top padding is the fade zone (space/3xl · 4xl · 5xl) for the scrim gradient; padding x and bottom space/md · lg · xl.', tokens: ['color/overlay/scrim', 'space/5xl', 'space/xl'] },
      { name: 'Action', description: 'Every control in the bar: 32 · 36 · 40 square, radius/control, icon size/icon/sm or md; hover fill and a tooltip with its shortcut.', tokens: ['video-player/action/fill/hover', 'size/control/md', 'radius/control'] },
      { name: 'Volume', description: 'Mute action and a 64 × 4 track shown on hover or focus, with a 12 × 12 handle.', tokens: ['video-player/track', 'video-player/control/fg', 'elevation/raised'] },
      { name: 'Video progress', description: 'Timestamps (type/body/xs/medium) around the timeline, which fills: track, buffered part and played line.', tokens: ['video-player/track', 'video-player/track/buffer', 'color/fill/brand/solid', 'type/body/xs/medium'] },
      { name: 'Playback speed · Captions · Cast · Full screen', description: 'Actions after the timeline; speed shows the rate (“1×”) in type/body/sm/semibold.', tokens: ['type/body/sm/semibold'] },
      { name: 'Tooltip', description: 'Above the action, outside its bounds: text in type/body/xs/semibold and a Kbd (2.17, sm). padding space/sm × space/md.', tokens: ['video-player/tooltip/fill', 'type/body/xs/semibold'] },
      { name: 'Scrub preview', description: 'While scrubbing: a 160 × 90 frame, the time “1:42 / 4:12” and a 1 × 12 indicator line at the pointer.', tokens: ['video-player/tooltip/fill'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'lg'", description: 'Frame 480 × 270, 720 × 405 or 960 × 540 (shrinks to its container), and the size of every control.' },
    { name: 'playing', figma: 'Playing', type: 'boolean', default: 'false', description: 'Sets the playing state and follows the prop when it changes; the controls still toggle it. Switches the overlay icon and the play/pause action.' },
    { name: 'onPlayingChange', type: '(playing: boolean) => void', description: 'Called when playback starts or stops.' },
    { name: 'showOverlayAction', figma: 'Show overlay action', type: 'boolean', default: 'true', description: 'The large play / pause button in the centre.' },
    { name: 'showActionsBar', figma: 'Show actions bar', type: 'boolean', default: 'true', description: 'The bar along the bottom.' },
    { name: 'src', figma: 'Media (image fill)', type: 'string', description: 'The video file. Without it, the poster-only state is shown and the controls still work.' },
    { name: 'poster', type: 'string', description: 'Preview frame; also used by the scrub preview.' },
    { name: 'tracks', type: 'VideoTrack[]', description: 'Caption tracks ({ src, srcLang, label, kind?, default? }). The captions action shows when there are captions.' },
    { name: 'title', type: 'string', default: "'Video player'", description: 'Accessible name of the player (the video title); shown on the sample frame.' },
    { name: 'placeholderTime', type: '{ current?, duration?, buffered? }', description: 'Poster-only state: the times on the timeline, in seconds.' },
    { name: 'forceScrub', type: 'number', description: 'Documentation only: show the scrub preview at this time.' },
  ],
  tokens: [
    'video-player/control/fg', 'video-player/action/fill/hover', 'video-player/overlay/fill', 'video-player/overlay/fill/hover',
    'video-player/tooltip/fill', 'video-player/track', 'video-player/track/buffer', 'color/fill/brand/solid', 'color/overlay/scrim',
    'radius/surface', 'radius/control', 'radius/full', 'size/control/xs', 'size/control/sm', 'size/control/md', 'size/icon/sm', 'size/icon/md',
    'size/icon/lg', 'size/icon/xl', 'size/track/sm', 'size/indicator/lg', 'size/width/sm', 'space/xs', 'space/sm', 'space/md', 'space/lg', 'space/xl',
    'space/3xl', 'space/4xl', 'space/5xl', 'type/body/xs/medium', 'type/body/xs/semibold', 'type/body/sm/semibold', 'elevation/raised', 'focus/default',
  ],
  guidelines: [
    {
      title: 'When to use',
      body: 'Use the player when people will actually watch; use an image with a play link when video is secondary.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-2xl">
          <div className="w-(--size-width-sm) max-w-full">
            <VideoPlayer size="sm" title={lesson} tabIndex={-1} />
          </div>
          <div className="flex w-[18rem] flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-raised">
            <div className="aspect-video">
              <VideoPlaceholderFrame title="Product tour" />
            </div>
            <div className="flex flex-col items-start gap-sm p-xl">
              <span className="type-body-md-semibold text-text-primary">Plan your first project</span>
              <Button size="sm" emphasis="tertiary" leadingIcon="media/play" label="Watch the tour · 2 min" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Media, overlay, actions bar',
      body: 'Controls overlay the media; the frame stays 16:9. Three layers: the media, the overlay action in the centre and the actions bar along the bottom.',
      render: () => (
        <div className="flex flex-col items-center gap-lg">
          <div className="flex flex-wrap items-center justify-center gap-xl">
            <div className="flex flex-col items-center gap-sm">
              <div className="w-[15rem]">
                <VideoPlayer size="sm" showOverlayAction={false} showActionsBar={false} tabIndex={-1} />
              </div>
              <span className="type-body-xs-medium text-text-tertiary">1 · Media</span>
            </div>
            <div className="flex flex-col items-center gap-sm">
              <Specimen bare className="aspect-video w-[15rem]" inner="size-full items-center">
                <VideoOverlayAction size="sm" tabIndex={-1} />
              </Specimen>
              <span className="type-body-xs-medium text-text-tertiary">2 · Overlay action</span>
            </div>
            <div className="flex flex-col items-center gap-sm">
              <Specimen bare className="w-(--size-width-sm)">
                <VideoActionsBar size="sm" />
              </Specimen>
              <span className="type-body-xs-medium text-text-tertiary">3 · Actions bar</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Overlay, not layout',
      body: 'The overlay action and the actions bar are absolutely positioned on the media. Turning them on or off never changes the player’s size.',
      do: {
        caption: 'The actions bar sits on top of the video.',
        render: () => (
          <div className="w-[24rem]">
            <VideoPlayer size="sm" tabIndex={-1} />
          </div>
        ),
      },
      dont: {
        caption: 'The bar under the video makes the player taller than 16:9.',
        render: () => (
          <div className="flex w-[24rem] flex-col overflow-hidden rounded-surface">
            <div className="aspect-video">
              <VideoPlaceholderFrame />
            </div>
            <div className="bg-video-player-tooltip-fill pt-md">
              <VideoActionsBar size="sm" showTimestamps={false} showCast={false} />
            </div>
          </div>
        ),
      },
    },
    {
      title: 'The actions bar',
      body: 'Play, volume, the timeline, playback speed, captions, cast and full screen. The video progress fills the bar; every action keeps its size. The top padding is the fade zone: it gives the gradient room so controls stay readable on bright video.',
      render: () => (
        <Specimen bare className="w-[45rem] max-w-full">
          <VideoActionsBar size="lg" />
        </Specimen>
      ),
    },
    {
      title: 'Playing and paused',
      body: 'Playing switches the overlay icon and the play / pause action; it does not create a different anatomy. While a video plays, the overlay and the bar fade out after a few seconds without pointer movement and come back on hover or focus.',
      render: () => (
        <div className="flex flex-wrap justify-center gap-xl">
          <div className="w-[24rem]">
            <VideoPlayer size="sm" tabIndex={-1} />
          </div>
          <div className="w-[24rem]">
            <VideoPlayer size="sm" playing tabIndex={-1} />
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Show realistic durations (“4:12”), a sensible playback speed (“1×”) and a preview frame that represents the video, not a blank frame. Give the player the video’s title as its accessible name.',
    },
    {
      title: 'Use the action part',
      body: 'Every control in the bar is the Video player action: the same size, hover fill, focus ring and tooltip with its shortcut.',
      do: {
        caption: 'Actions from the private part.',
        render: () => (
          <Specimen bare className="flex gap-sm p-lg">
            <VideoAction type="play" size="md" tooltip={false} tabIndex={-1} />
            <VideoAction type="volume-max" size="md" tooltip={false} tabIndex={-1} />
            <VideoAction type="captions" size="md" tooltip={false} tabIndex={-1} />
            <VideoAction type="fullscreen" size="md" tooltip={false} tabIndex={-1} />
          </Specimen>
        ),
      },
      dont: {
        caption: 'Interface buttons redrawn inside the bar.',
        render: () => (
          <Specimen bare className="flex gap-sm p-lg">
            <Button size="sm" emphasis="secondary" iconOnly leadingIcon="media/play" label="Play" tabIndex={-1} />
            <Button size="sm" emphasis="secondary" iconOnly leadingIcon="media/volume-max" label="Mute" tabIndex={-1} />
            <Button size="sm" emphasis="secondary" iconOnly leadingIcon="media/captions" label="Captions" tabIndex={-1} />
          </Specimen>
        ),
      },
    },
    {
      title: 'Keep the fade zone',
      body: 'Light controls need the scrim gradient behind them. Don’t put light controls straight on a bright frame.',
      do: {
        caption: 'The bar’s fade zone keeps the controls readable.',
        render: () => (
          <div data-theme="light" className="w-[24rem] overflow-hidden rounded-surface bg-surface-sunken">
            <div className="h-[3rem]" />
            <VideoActionsBar size="sm" showTimestamps={false} />
          </div>
        ),
      },
      dont: {
        caption: 'Light controls on a bright frame, without the gradient.',
        render: () => (
          <div data-theme="light" className="flex w-[24rem] items-end gap-sm rounded-surface bg-surface-sunken p-md pt-[4rem]">
            <VideoAction type="play" size="sm" tooltip={false} tabIndex={-1} />
            <VideoAction type="volume-max" size="sm" tooltip={false} tabIndex={-1} />
            <VideoAction type="fullscreen" size="sm" tooltip={false} tabIndex={-1} />
          </div>
        ),
      },
    },
    {
      title: 'No autoplay with sound',
      body: 'The player never starts by itself: playback begins when the person presses play. Respect reduced motion: don’t autoplay at all when the user has asked for reduced motion.',
    },
    {
      title: 'Maintenance',
      body: 'Actions, tooltip, volume, bar and overlay are private parts of this page; change them once and every player updates. On-media colours live in the video-player/* tokens, which keep the same value in every colour mode.',
    },
  ],
  accessibility: [
    'The player is a labelled region (its title) and focusable; shortcuts work while focus is anywhere inside it.',
    'Every action has an accessible name (“Play”, “Mute”, “Enter full screen”) and a tooltip with its shortcut, also exposed as aria-keyshortcuts.',
    'Shortcuts: Space or K play / pause, M mute, F full screen, C captions, ← → seek 5 seconds, ↑ ↓ volume. A focused action keeps native Space activation.',
    'The timeline and the volume are sliders with arrow, Page Up / Down, Home and End keys and a spoken value (“0:42 of 4:12”).',
    'Captions are available for speech; the captions action is a toggle (aria-pressed) and is present whenever captions exist.',
    'No autoplay. Full screen uses the Fullscreen API, so Escape and the browser controls exit it.',
    'Focus rings on actions are visible on bright video: focus/default plus the fade zone behind it.',
    'Media controls keep the same colours in every colour mode (video-player/* tokens).',
  ],
});
