/**
 * 4.2 Video player — `.Main` private parts. Not exported from the library (the `_` prefix keeps them
 * out of the generated index); `VideoPlayer` composes them and the explorer shows their matrices.
 *
 * They sit on video in every colour mode, so they use the `video-player/*` component tokens
 * (light on dark whatever the interface mode is) instead of Icon button, Tooltip and Slider.
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Kbd } from '../parts/Kbd';

export type VideoPlayerSize = 'sm' | 'md' | 'lg';

/* ---------- helpers ---------- */

/** "4:12", or "1:02:05" past an hour. */
export function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Sample media frame used when there is no `src` / `poster` (docs, mockups, scrub preview).
 * Pinned to the Light mode so `color/surface/inverse` is a dark frame in every interface mode.
 */
export function VideoPlaceholderFrame({ title, compact = false, className }: { title?: ReactNode; compact?: boolean; className?: string }) {
  return (
    <div
      data-theme="light"
      aria-hidden
      className={cn(
        'flex size-full bg-surface-inverse bg-linear-to-br from-surface-inverse via-surface-inverse to-fill-brand-solid',
        compact ? 'items-center justify-center' : 'items-start justify-start p-[4%]',
        className,
      )}
    >
      {title && !compact && <span className="type-body-md-semibold max-w-[70%] text-text-inverse">{title}</span>}
      {compact && <Icon name="editor/video" size="lg" className="text-icon-inverse" />}
    </div>
  );
}

/* ---------- .Main/Video player tooltip (mirrors Tooltip 2.13) ---------- */

export interface VideoTooltipProps {
  /** Figma `Text`. */
  text?: ReactNode;
  /** Figma `Show shortcut` + the Kbd text ("Space", "M", "F"). Present = shown. */
  shortcut?: string;
  /** Floating above an action, aligned to its start, centre or end so it stays inside the frame. */
  floating?: 'start' | 'center' | 'end';
  className?: string;
}

export function VideoTooltip({ text = 'Play', shortcut, floating, className }: VideoTooltipProps) {
  return (
    <span
      aria-hidden
      data-anatomy="tooltip"
      className={cn(
        'pointer-events-none inline-flex items-center gap-sm whitespace-nowrap rounded-control bg-video-player-tooltip-fill px-md py-sm',
        'type-body-xs-semibold text-video-player-control-fg',
        floating && 'absolute bottom-full z-10 mb-sm',
        floating === 'start' && 'left-0',
        floating === 'center' && 'left-1/2 -translate-x-1/2',
        floating === 'end' && 'right-0',
        className,
      )}
    >
      {text}
      {shortcut && (
        // The key always reads light-on-dark, like every on-media control.
        <span data-theme="dark" className="contents">
          <Kbd size="sm" text={shortcut} />
        </span>
      )}
    </span>
  );
}

/* ---------- .Main/Video player action (mirrors Icon button 2.2) ---------- */

export type VideoActionType =
  | 'play' | 'pause' | 'rewind' | 'fast-forward' | 'skip-back' | 'skip-forward'
  | 'volume-none' | 'volume-min' | 'volume-max' | 'zoom-out' | 'zoom-in' | 'cast'
  | 'minimize' | 'maximize' | 'fullscreen' | 'exit-fullscreen' | 'playback-speed' | 'captions';

export const videoActionTypes: readonly VideoActionType[] = [
  'play', 'pause', 'rewind', 'fast-forward', 'skip-back', 'skip-forward', 'volume-none', 'volume-min', 'volume-max',
  'zoom-out', 'zoom-in', 'cast', 'minimize', 'maximize', 'fullscreen', 'exit-fullscreen', 'playback-speed', 'captions',
];

const actionIcon: Record<Exclude<VideoActionType, 'playback-speed'>, IconName> = {
  play: 'media/play', pause: 'media/pause', rewind: 'media/rewind', 'fast-forward': 'media/fast-forward',
  'skip-back': 'media/skip-back', 'skip-forward': 'media/skip-forward', 'volume-none': 'media/volume-none',
  'volume-min': 'media/volume-min', 'volume-max': 'media/volume-max', 'zoom-out': 'media/zoom-out', 'zoom-in': 'media/zoom-in',
  cast: 'media/cast', minimize: 'media/minimize', maximize: 'media/maximize', fullscreen: 'media/fullscreen',
  'exit-fullscreen': 'media/exit-fullscreen', captions: 'media/captions',
};

/** Default names; the player passes its own ("Mute", "Enter full screen"…). */
export const actionLabel: Record<VideoActionType, string> = {
  play: 'Play', pause: 'Pause', rewind: 'Rewind', 'fast-forward': 'Fast forward', 'skip-back': 'Previous', 'skip-forward': 'Next',
  'volume-none': 'Unmute', 'volume-min': 'Mute', 'volume-max': 'Mute', 'zoom-out': 'Zoom out', 'zoom-in': 'Zoom in', cast: 'Cast',
  minimize: 'Minimize', maximize: 'Maximize', fullscreen: 'Enter full screen', 'exit-fullscreen': 'Exit full screen',
  'playback-speed': 'Playback speed', captions: 'Captions',
};

/** 32 · 36 · 40 — the control heights xs · sm · md. */
const actionBox: Record<VideoPlayerSize, string> = {
  sm: 'size-(--size-control-xs)',
  md: 'size-(--size-control-sm)',
  lg: 'size-(--size-control-md)',
};
const actionIconSize = { sm: 'sm', md: 'md', lg: 'md' } as const;

export interface VideoActionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  /** Figma `Type`. */
  type?: VideoActionType;
  /** Figma `Size`. */
  size?: VideoPlayerSize;
  /** Accessible name and tooltip text. */
  label?: string;
  /** Shortcut shown in the tooltip's Kbd and exposed as `aria-keyshortcuts`. */
  shortcut?: string;
  /** `Type=playback-speed`: the current rate, e.g. "1×". */
  speedText?: string;
  /** Tooltip alignment above the button; `false` = no tooltip. */
  tooltip?: 'start' | 'center' | 'end' | false;
  /** Documentation only: Figma `State`. Hover also shows the tooltip. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
}

export function VideoAction({
  type = 'play',
  size = 'lg',
  label,
  shortcut,
  speedText = '1×',
  tooltip = 'center',
  forceState,
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...rest
}: VideoActionProps) {
  const [tip, setTip] = useState(false);
  const name = label ?? actionLabel[type];
  const showTip = tooltip !== false && (tip || forceState === 'hover');
  return (
    <span className="relative inline-flex shrink-0">
      <button
        data-anatomy={type === 'playback-speed' ? 'playback-speed' : 'action'}
        type="button"
        aria-label={name}
        aria-keyshortcuts={shortcut === 'Space' ? 'Space k' : shortcut}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control outline-none',
          'bg-transparent text-video-player-control-fg',
          'transition-[background-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
          'is-hover:bg-video-player-action-fill-hover is-focus:shadow-focus-default',
          actionBox[size],
          className,
        )}
        onPointerEnter={(e) => {
          setTip(true);
          onPointerEnter?.(e);
        }}
        onPointerLeave={(e) => {
          setTip(false);
          onPointerLeave?.(e);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(':focus-visible')) setTip(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setTip(false);
          onBlur?.(e);
        }}
        {...forceAttr(forceState)}
        {...rest}
      >
        {type === 'playback-speed' ? (
          <span className="type-body-sm-semibold tabular-nums">{speedText}</span>
        ) : (
          <Icon name={actionIcon[type]} size={actionIconSize[size]} />
        )}
      </button>
      {showTip && <VideoTooltip text={name} shortcut={shortcut} floating={tooltip} />}
    </span>
  );
}

/* ---------- media slider (shared by the timeline and the volume track) ---------- */

interface MediaSliderProps {
  /** 0–100. */
  value: number;
  /** Buffered part, 0–100 (timeline only). */
  buffered?: number;
  /** Played line colour: brand on the timeline, control fg on the volume. */
  line: 'brand' | 'control';
  /** Show the 12 × 12 handle (volume). */
  handle?: boolean;
  label: string;
  valueText: string;
  /** Arrow step and Page step, in percent. */
  step: number;
  pageStep?: number;
  onChange?: (v: number) => void;
  onHover?: (v: number | null, trackX: number, trackEl: HTMLDivElement) => void;
  className?: string;
  style?: CSSProperties;
  tabIndex?: number;
}

function MediaSlider({ value, buffered, line, handle, label, valueText, step, pageStep = 10, onChange, onHover, className, style, tabIndex = 0 }: MediaSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = (e: ReactPointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { v: clamp(((e.clientX - r.left) / r.width) * 100, 0, 100), x: e.clientX - r.left };
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? value + step
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? value - step
      : e.key === 'PageUp' ? value + pageStep
      : e.key === 'PageDown' ? value - pageStep
      : e.key === 'Home' ? 0
      : e.key === 'End' ? 100
      : null;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    onChange?.(clamp(next, 0, 100));
  };
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={tabIndex}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      aria-valuetext={valueText}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (!onChange) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange(pct(e).v);
      }}
      onPointerMove={(e) => {
        const p = pct(e);
        if (dragging.current) onChange?.(p.v);
        onHover?.(p.v, p.x, ref.current!);
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      onPointerLeave={() => {
        if (!dragging.current) onHover?.(null, 0, ref.current!);
      }}
      className={cn(
        'relative h-(--size-track-sm) cursor-pointer touch-none rounded-full bg-video-player-track outline-none',
        // Taller hit area than the 4px track; the visual track does not change.
        "after:absolute after:inset-x-0 after:-inset-y-lg after:content-['']",
        'transition-shadow duration-(--motion-duration-fast) ease-standard is-focus:shadow-focus-default',
        className,
      )}
      style={style}
    >
      {buffered != null && (
        <span aria-hidden className="absolute inset-y-0 left-0 rounded-full bg-video-player-track-buffer" style={{ width: `${clamp(buffered, 0, 100)}%` }} />
      )}
      <span
        aria-hidden
        className={cn('absolute inset-y-0 left-0 rounded-full', line === 'brand' ? 'bg-fill-brand-solid' : 'bg-video-player-control-fg')}
        style={{ width: `${clamp(value, 0, 100)}%` }}
      />
      {handle && (
        <span
          aria-hidden
          className="absolute top-1/2 size-(--size-indicator-lg) -translate-x-1/2 -translate-y-1/2 rounded-full bg-video-player-control-fg shadow-raised"
          style={{ left: `${clamp(value, 0, 100)}%` }}
        />
      )}
    </div>
  );
}

/* ---------- .Main/Video player volume (mirrors Slider 2.18) ---------- */

export const volumeAction = (value: number, muted = false): VideoActionType =>
  muted || value <= 0 ? 'volume-none' : value <= 50 ? 'volume-min' : 'volume-max';

export interface VideoVolumeProps {
  /** Figma `Value`: 0–100. */
  value?: number;
  muted?: boolean;
  size?: VideoPlayerSize;
  /** Documentation only: Figma `State=hover` (track shown). */
  forceState?: 'hover';
  onValueChange?: (v: number) => void;
  onToggleMute?: () => void;
}

export function VideoVolume({ value = 75, muted = false, size = 'lg', forceState, onValueChange, onToggleMute }: VideoVolumeProps) {
  const [open, setOpen] = useState(false);
  const shown = open || forceState === 'hover';
  const level = muted ? 0 : value;
  return (
    <div
      data-anatomy="volume"
      className={cn('flex shrink-0 items-center transition-[gap] duration-(--motion-duration-fast) ease-standard', shown ? 'gap-xs' : 'gap-none')}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={(e) => {
        if (!e.currentTarget.contains(document.activeElement)) setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <VideoAction
        type={volumeAction(value, muted)}
        size={size}
        label={muted || value === 0 ? 'Unmute' : 'Mute'}
        shortcut="M"
        tooltip="start"
        onClick={onToggleMute}
      />
      <MediaSlider
        value={level}
        line="control"
        handle
        label="Volume"
        valueText={`${Math.round(level)}%`}
        step={5}
        onChange={onValueChange}
        // Track: Fixed 64 × 4, hidden at rest; it stays focusable so the keyboard opens it.
        className={cn('shrink-0 transition-[width,opacity] duration-(--motion-duration-fast) ease-standard', shown ? 'w-[4rem] opacity-100' : 'w-0 opacity-0')}
      />
    </div>
  );
}

/* ---------- .Main/Video player scrub preview ---------- */

export interface VideoScrubPreviewProps {
  time?: number;
  duration?: number;
  /** Preview frame. Without it the sample frame is shown. */
  poster?: string;
  /** Show the 1 × 12 indicator line under the preview (off when the player draws it at the exact position). */
  showIndicator?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function VideoScrubPreview({ time = 102, duration = 252, poster, showIndicator = true, className, style }: VideoScrubPreviewProps) {
  return (
    <div aria-hidden data-anatomy="scrub-preview" className={cn('pointer-events-none flex flex-col items-center gap-xs', className)} style={style}>
      <div className="h-[5.625rem] w-[10rem] overflow-hidden rounded-control shadow-raised">
        {poster ? <img src={poster} alt="" className="size-full object-cover" /> : <VideoPlaceholderFrame compact />}
      </div>
      <div className="type-body-xs-semibold inline-flex gap-xs rounded-control bg-video-player-tooltip-fill px-sm py-xxs text-video-player-control-fg tabular-nums">
        <span>{formatTime(time)}</span>
        <span>/</span>
        <span>{formatTime(duration)}</span>
      </div>
      {showIndicator && <span className="h-(--space-lg) w-(--border-width-default) bg-video-player-control-fg" />}
    </div>
  );
}

/* ---------- .Main/Video player actions bar ---------- */

const barPad: Record<VideoPlayerSize, string> = {
  sm: 'pt-3xl px-md pb-md',
  md: 'pt-4xl px-lg pb-lg',
  lg: 'pt-5xl px-xl pb-xl',
};

export interface VideoActionsBarProps {
  /** Figma `Size`. */
  size?: VideoPlayerSize;
  /** Figma `Playing`. */
  playing?: boolean;
  /** Figma `Show timestamps`. */
  showTimestamps?: boolean;
  current?: number;
  duration?: number;
  buffered?: number;
  volume?: number;
  muted?: boolean;
  rate?: number;
  captions?: boolean;
  fullscreen?: boolean;
  showCaptions?: boolean;
  showCast?: boolean;
  poster?: string;
  /** Documentation only: show the scrub preview at this time. */
  forceScrub?: number;
  onTogglePlay?: () => void;
  onSeek?: (t: number) => void;
  onVolume?: (v: number) => void;
  onToggleMute?: () => void;
  onCycleRate?: () => void;
  onToggleCaptions?: () => void;
  onCast?: () => void;
  onToggleFullscreen?: () => void;
  /** Called when the scrub preview appears or disappears (the player hides its overlay action meanwhile). */
  onScrubChange?: (scrubbing: boolean) => void;
  className?: string;
}

export function VideoActionsBar({
  size = 'lg',
  playing = false,
  showTimestamps = true,
  current = 42,
  duration = 252,
  buffered = 120,
  volume = 75,
  muted = false,
  rate = 1,
  captions = false,
  fullscreen = false,
  showCaptions = true,
  showCast = true,
  poster,
  forceScrub,
  onTogglePlay,
  onSeek,
  onVolume,
  onToggleMute,
  onCycleRate,
  onToggleCaptions,
  onCast,
  onToggleFullscreen,
  onScrubChange,
  className,
}: VideoActionsBarProps) {
  const [hover, setHover] = useState<{ v: number; x: number; w: number; left: number; right: number } | null>(null);
  const timelineId = useId();
  const d = duration > 0 ? duration : 0;
  const pct = d ? (current / d) * 100 : 0;

  // Scrub preview: forced (docs) or under the pointer.
  const scrub = forceScrub != null ? { v: d ? (forceScrub / d) * 100 : 0 } : hover;
  const scrubTime = scrub ? (scrub.v / 100) * d : 0;
  const scrubbing = scrub != null;
  useEffect(() => {
    onScrubChange?.(scrubbing);
  }, [scrubbing, onScrubChange]);
  let previewLeft = 0;
  let lineLeft = 0;
  if (hover && forceScrub == null) {
    // Keep the 160-wide preview inside the frame; the indicator line stays at the exact position.
    lineLeft = hover.x;
    previewLeft = clamp(hover.x, 80 - hover.left, hover.w + hover.right - 80);
  }

  return (
    <div
      data-anatomy="actions-bar"
      className={cn(
        'flex w-full flex-col bg-linear-to-t from-overlay-scrim to-transparent',
        barPad[size],
        className,
      )}
    >
      <div className="flex w-full items-center gap-sm">
        <VideoAction type={playing ? 'pause' : 'play'} size={size} label={playing ? 'Pause' : 'Play'} shortcut="Space" tooltip="start" onClick={onTogglePlay} />
        <VideoVolume value={volume} muted={muted} size={size} onValueChange={onVolume} onToggleMute={onToggleMute} />
        {/* Video progress: fills; every action keeps its size. */}
        <div data-anatomy="video-progress" className="flex min-w-0 flex-1 items-center gap-md">
          {showTimestamps && <span className="type-body-xs-medium shrink-0 text-video-player-control-fg tabular-nums">{formatTime(current)}</span>}
          <div className="relative min-w-0 flex-1" id={timelineId}>
            {scrub && (
              <>
                <VideoScrubPreview
                  time={scrubTime}
                  duration={d}
                  poster={poster}
                  showIndicator={forceScrub != null}
                  className="absolute bottom-[calc(100%_+_var(--space-xs))] -translate-x-1/2"
                  style={{ left: forceScrub != null ? `${scrub.v}%` : previewLeft }}
                />
                {forceScrub == null && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-[calc(100%_+_var(--space-xs))] h-(--space-lg) w-(--border-width-default) bg-video-player-control-fg"
                    style={{ left: lineLeft }}
                  />
                )}
              </>
            )}
            <MediaSlider
              value={pct}
              buffered={d ? (buffered / d) * 100 : 0}
              line="brand"
              label="Seek"
              valueText={`${formatTime(current)} of ${formatTime(d)}`}
              step={d ? (5 / d) * 100 : 1}
              onChange={onSeek ? (v) => onSeek((v / 100) * d) : undefined}
              onHover={(v, x, el) => {
                if (v === null) return setHover(null);
                const frame = el.closest('[data-video-frame]')?.getBoundingClientRect();
                const r = el.getBoundingClientRect();
                setHover({ v, x, w: r.width, left: frame ? r.left - frame.left - 8 : 0, right: frame ? frame.right - r.right - 8 : 0 });
              }}
            />
          </div>
          {showTimestamps && <span className="type-body-xs-medium shrink-0 text-video-player-control-fg tabular-nums">{formatTime(d)}</span>}
        </div>
        <VideoAction type="playback-speed" size={size} label="Playback speed" speedText={`${rate}×`} onClick={onCycleRate} />
        {showCaptions && (
          <VideoAction type="captions" size={size} label={captions ? 'Turn off captions' : 'Turn on captions'} shortcut="C" aria-pressed={captions} onClick={onToggleCaptions} />
        )}
        {showCast && <VideoAction type="cast" size={size} label="Cast" tooltip="end" onClick={onCast} />}
        <VideoAction
          type={fullscreen ? 'exit-fullscreen' : 'fullscreen'}
          size={size}
          label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
          shortcut="F"
          tooltip="end"
          onClick={onToggleFullscreen}
        />
      </div>
    </div>
  );
}

/* ---------- .Main/Video player overlay action ---------- */

/** 56 · 64 · 80 circles with 24 · 28 · 32 icons (no size tokens exist for these). */
const overlayBox: Record<VideoPlayerSize, string> = { sm: 'size-[3.5rem]', md: 'size-[4rem]', lg: 'size-[5rem]' };
const overlayIcon: Record<VideoPlayerSize, CSSProperties> = {
  sm: { width: 'var(--size-icon-lg)', height: 'var(--size-icon-lg)' },
  md: { width: '1.75rem', height: '1.75rem' },
  lg: { width: 'var(--size-icon-xl)', height: 'var(--size-icon-xl)' },
};

export interface VideoOverlayActionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  /** Figma `Playing`: play or pause icon. */
  playing?: boolean;
  /** Follows the player size. */
  size?: VideoPlayerSize;
  /** Documentation only: Figma `State`. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
}

export function VideoOverlayAction({ playing = false, size = 'lg', forceState, className, ...rest }: VideoOverlayActionProps) {
  return (
    <button
      data-anatomy="overlay-action"
      type="button"
      aria-label={playing ? 'Pause' : 'Play'}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full outline-none backdrop-blur-[0.5rem]',
        'bg-video-player-overlay-fill text-video-player-control-fg is-hover:bg-video-player-overlay-fill-hover is-focus:shadow-focus-default',
        'transition-[background-color,box-shadow,opacity] duration-(--motion-duration-fast) ease-standard',
        overlayBox[size],
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    >
      <Icon name={playing ? 'media/pause' : 'media/play'} style={overlayIcon[size]} />
    </button>
  );
}
