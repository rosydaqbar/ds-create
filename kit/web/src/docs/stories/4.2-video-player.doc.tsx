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
  spec: 'specs/sections/4.2-video-player.md',
  exports: ['VideoPlayer'],
  summary:
    'The video player plays lessons, product tours and recordings, and works for realistic playback mockups. Its controls sit on the 16:9 frame: a large play button in the center and a bar of controls along the bottom.',
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
      caption: 'The player leads the lesson page, with the instructor and course progress underneath.',
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
      caption: 'In a marketing card, a small player with only the play button keeps attention on the call to action.',
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
      caption: 'Hovering the timeline shows a preview frame and the time under the pointer.',
      stage: 'full',
      render: () => <VideoPlayer size="md" title="Quarterly review · recording" forceScrub={102} />,
      code: `<VideoPlayer size="md" src="/recordings/q3.mp4" poster="/recordings/q3.jpg" title="Quarterly review" />
{/* The scrub preview appears while the pointer is over the timeline. */}`,
    },
  ],
  whenToUse: {
    use: ['Video people will actually watch, like course lessons, product tours and recorded meetings.', 'Realistic playback mockups in product screens.'],
    dont: [
      'When video is secondary, use an image with a play link.',
      'For ambient or decorative motion, use a still image. Don’t autoplay with sound.',
      'For audio-only content, skip the player: the 16:9 frame has nothing to show.',
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
              <VideoPlayer size={size} playing={p === 'true'} label={`Video player, size ${size}, ${p === 'true' ? 'playing' : 'paused'}`} tabIndex={-1} />
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
          <VideoPlayer size="lg" showOverlayAction={false} label="Video player without overlay action" tabIndex={-1} />
          <VideoPlayer size="lg" showActionsBar={false} label="Video player without actions bar" tabIndex={-1} />
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
    render: () => (
      // Two states: at rest (the overlay action shows) and while scrubbing (the overlay hides, the preview shows).
      <div className="flex w-[45rem] flex-col items-start gap-2xl">
        <VideoPlayer size="md" title="Media" tabIndex={-1} />
        <VideoPlayer size="sm" title="Scrubbing" forceScrub={102} tabIndex={-1} />
      </div>
    ),
    parts: [
      { name: 'Media', target: 'media', description: 'The video, or its poster, in a fixed 16:9 frame. A sample frame shows when there’s no video.', tokens: ['radius/surface'] },
      { name: 'Overlay action', target: 'overlay-action', description: 'The large play or pause button in the center of the frame, on a blurred circle. It grows with the player size.', tokens: ['video-player/overlay/fill', 'video-player/overlay/fill/hover', 'video-player/control/fg'] },
      { name: 'Actions bar', target: 'actions-bar', description: 'Runs along the bottom of the frame, full width. Its top padding is a fade zone where a gradient darkens the video so the controls stay readable.', tokens: ['color/overlay/scrim', 'space/5xl', 'space/xl'] },
      { name: 'Action', target: 'action', description: 'Every control in the bar is an action: a square button with a fill on hover and a tooltip that shows its shortcut.', tokens: ['video-player/action/fill/hover', 'size/control/md', 'radius/control'] },
      { name: 'Volume', target: 'volume', description: 'A mute button, plus a volume slider that appears on hover or focus.', tokens: ['video-player/track', 'video-player/control/fg', 'elevation/raised'] },
      { name: 'Video progress', target: 'video-progress', description: 'The timeline, with timestamps on either side. It fills the free space and shows the played and buffered parts.', tokens: ['video-player/track', 'video-player/track/buffer', 'color/fill/brand/solid', 'type/body/xs/medium'] },
      { name: 'Playback speed · Captions · Cast · Full screen', target: 'playback-speed', description: 'The actions after the timeline. Playback speed shows the current rate as text (“1×”).', tokens: ['type/body/sm/semibold'] },
      { name: 'Tooltip', description: 'Appears above an action, outside its bounds, with the action’s name and a Kbd (2.17) for its shortcut.', tokens: ['video-player/tooltip/fill', 'type/body/xs/semibold'] },
      { name: 'Scrub preview', target: 'scrub-preview', description: 'Appears while scrubbing: a small preview frame, the time (“1:42 / 4:12”) and a thin line at the pointer.', tokens: ['video-player/tooltip/fill'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'lg'", description: 'Sets the frame to 480 × 270, 720 × 405 or 960 × 540 (it shrinks to fit its container) and sizes every control to match.' },
    { name: 'playing', figma: 'Playing', type: 'boolean', default: 'false', description: 'Sets the playing state and follows the prop when it changes, while the controls can still toggle it. Switches the overlay icon and the play/pause action.' },
    { name: 'onPlayingChange', type: '(playing: boolean) => void', description: 'Called when playback starts or stops.' },
    { name: 'showOverlayAction', figma: 'Show overlay action', type: 'boolean', default: 'true', description: 'Shows the large play / pause button in the center.' },
    { name: 'showActionsBar', figma: 'Show actions bar', type: 'boolean', default: 'true', description: 'Shows the bar of controls along the bottom.' },
    { name: 'src', figma: 'Media (image fill)', type: 'string', description: 'The video file. Without it, the player shows only the poster, and the controls still work.' },
    { name: 'poster', type: 'string', description: 'The preview frame, also used in the scrub preview.' },
    { name: 'tracks', type: 'VideoTrack[]', description: 'Caption tracks ({ src, srcLang, label, kind?, default? }). The captions action appears when at least one track is set.' },
    { name: 'title', type: 'string', default: "'Video player'", description: 'The video’s title. It’s the player’s accessible name and shows on the sample frame.' },
    { name: 'label', type: 'string', default: 'title', description: 'The accessible name of the player region (“Product tour video”). Give each player on a page its own name.' },
    { name: 'placeholderTime', type: '{ current?, duration?, buffered? }', description: 'The times shown on the timeline in the poster-only state, in seconds.' },
    { name: 'forceScrub', type: 'number', description: 'Documentation only: shows the scrub preview at this time, in seconds.' },
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
      title: 'Player or play link',
      body: 'Use the player when people will actually watch the video. When the video is secondary, an image with a play link takes less space and attention.',
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
      title: 'Three layers',
      body: 'The player has three layers: the media, the play button in the center and the actions bar along the bottom. The controls sit on top of the media, so the frame stays 16:9.',
      render: () => (
        <div className="flex flex-col items-center gap-lg">
          <div className="flex flex-wrap items-center justify-center gap-xl">
            <div className="flex flex-col items-center gap-sm">
              <div className="w-[15rem]">
                <VideoPlayer size="sm" showOverlayAction={false} showActionsBar={false} label="Video player without controls" tabIndex={-1} />
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
      title: 'Controls sit on the video',
      body: 'The play button and the actions bar float on top of the media. Turning them on or off never changes the player’s size.',
      do: {
        caption: 'The actions bar sits on top of the video.',
        render: () => (
          <div className="w-[24rem]">
            <VideoPlayer size="sm" label="Video player with controls on the media" tabIndex={-1} />
          </div>
        ),
      },
      dont: {
        caption: 'A bar below the video makes the player taller than 16:9.',
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
      body: 'The bar holds play, volume, the timeline, playback speed, captions, cast and full screen. The timeline stretches to fill the space, and every action keeps its size.\n\nThe top padding is the fade zone. It gives the gradient room to darken the video, so the controls stay readable on bright footage.',
      render: () => (
        <Specimen bare className="w-[45rem] max-w-full">
          <VideoActionsBar size="lg" />
        </Specimen>
      ),
    },
    {
      title: 'Playing and paused',
      body: 'Playing only swaps the icons on the play button and the play / pause action. Everything else stays the same.\n\nWhile a video plays, the controls fade out after a few seconds without pointer movement, and come back on hover or focus.',
      render: () => (
        <div className="flex flex-wrap justify-center gap-xl">
          <div className="w-[24rem]">
            <VideoPlayer size="sm" label="Paused video player" tabIndex={-1} />
          </div>
          <div className="w-[24rem]">
            <VideoPlayer size="sm" playing label="Playing video player" tabIndex={-1} />
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Use realistic durations (“4:12”), a sensible playback speed (“1×”) and a preview frame that shows what the video is about, not a blank one. Use the video’s title as the player’s name, so screen readers announce it.',
    },
    {
      title: 'Use the action part',
      body: 'Build every control in the bar from the shared action part, so they all get the same size, hover fill, focus ring and shortcut tooltip.',
      do: {
        caption: 'Controls built from the action part.',
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
        caption: 'Regular interface buttons placed in the bar.',
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
      body: 'Light controls need the dark gradient behind them to stay readable. Without it, they disappear on a bright frame.',
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
      body: 'The player never starts on its own. Playback begins when someone presses play, so nobody is surprised by sound. When people have asked their device to reduce motion, don’t autoplay at all.',
    },
    {
      title: 'Maintenance',
      body: 'The actions, tooltip, volume, bar and overlay are private parts of this page. Change one and every player updates. Colors on the media come from the video-player/* tokens, which stay the same in every color mode.',
    },
  ],
  accessibility: [
    'The player is a focusable region named after its title. Keyboard shortcuts work while focus is anywhere inside it.',
    'Every action has a name screen readers announce (“Play”, “Mute”, “Enter full screen”) and a tooltip with its shortcut. The shortcut is also exposed through aria-keyshortcuts.',
    'Shortcuts: Space or K to play or pause, M to mute, F for full screen, C for captions, ← → to seek 5 seconds and ↑ ↓ for volume. When an action has focus, Space presses that action as usual.',
    'The timeline and the volume are sliders. They respond to the arrow keys, Page Up / Down, Home and End, and screen readers announce their value (“0:42 of 4:12”).',
    'Provide captions for speech. The captions action is a toggle (aria-pressed) and appears whenever captions exist.',
    'The player doesn’t autoplay. Full screen uses the browser’s Fullscreen API, so Escape and the browser’s own controls exit it.',
    'Focus rings on actions (focus/default) stay visible on bright video, because the fade zone sits behind them.',
    'Media controls keep the same colors in every color mode (video-player/* tokens), since they always sit on video.',
  ],
});
