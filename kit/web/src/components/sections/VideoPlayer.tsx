import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { VideoActionsBar, VideoOverlayAction, VideoPlaceholderFrame, type VideoPlayerSize } from './_VideoPlayerParts';

/**
 * 4.2 Video player — a 16:9 media frame with playback controls on top of it.
 * Figma: `Video player` · Size × Playing (6 variants) · Show overlay action · Show actions bar,
 * built from the `.Main/Video player *` private parts in `_VideoPlayerParts.tsx`.
 *
 * The controls overlay the media and never add height: the frame is always 16:9.
 * It is a working player around `<video>`: play/pause, volume, seek with buffered and played,
 * playback speed, captions, cast (Remote Playback API) and full screen (Fullscreen API).
 * Keyboard: Space / K play-pause, M mute, F full screen, C captions, ← → seek 5 s, ↑ ↓ volume.
 * Without `src` it renders a poster-only state (a sample frame) with fully working controls.
 */
export type { VideoPlayerSize } from './_VideoPlayerParts';

export interface VideoTrack {
  src: string;
  srcLang: string;
  label: string;
  kind?: 'captions' | 'subtitles';
  default?: boolean;
}

export interface VideoPlayerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /** Figma `Size`: frame 480 × 270, 720 × 405 or 960 × 540, and the size of every control. */
  size?: VideoPlayerSize;
  /**
   * Figma `Playing`. Sets the playing state (and follows the prop when it changes); the controls
   * still toggle it. Without `src` it is the static visual state used in mockups and docs.
   */
  playing?: boolean;
  /** Called when playback starts or stops. */
  onPlayingChange?: (playing: boolean) => void;
  /** Figma `Show overlay action`. */
  showOverlayAction?: boolean;
  /** Figma `Show actions bar`. */
  showActionsBar?: boolean;
  /** Video file. Without it, the poster-only state is shown. */
  src?: string;
  /** Preview frame (Figma: the Media image fill); also used by the scrub preview. */
  poster?: string;
  /** Caption tracks; the captions action is shown whenever there are captions. */
  tracks?: VideoTrack[];
  /** The video title: the text on the sample frame and, unless `label` is set, the player's accessible name. */
  title?: string;
  /**
   * Accessible name of the player region ("Product tour video"). Defaults to `title`.
   * Give every player on a page a distinct name so the regions can be told apart.
   */
  label?: string;
  /** Poster-only state: times shown on the timeline, in seconds. */
  placeholderTime?: { current?: number; duration?: number; buffered?: number };
  /** Documentation only: show the scrub preview at this time (seconds). */
  forceScrub?: number;
  /** Extra content inside the frame (e.g. a badge over the media). */
  children?: ReactNode;
}

/**
 * Frame widths per size (480 · 720 · 960); the height follows from 16:9. The player fills narrower
 * containers instead of overflowing them, so give it a sized parent when it sits in a row.
 */
const frameWidth: Record<VideoPlayerSize, string> = {
  sm: 'max-w-(--size-width-sm)',
  md: 'max-w-[45rem]',
  lg: 'max-w-[60rem]',
};

const RATES = [1, 1.25, 1.5, 2, 0.5, 0.75] as const;
const hasRemotePlayback = typeof HTMLMediaElement !== 'undefined' && 'remote' in HTMLMediaElement.prototype;

export function VideoPlayer({
  size = 'lg',
  playing,
  onPlayingChange,
  showOverlayAction = true,
  showActionsBar = true,
  src,
  poster,
  tracks,
  title = 'Video player',
  label,
  placeholderTime,
  forceScrub,
  className,
  children,
  onKeyDown,
  ...rest
}: VideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const interacted = useRef(false);

  const [isPlaying, setIsPlaying] = useState(playing ?? false);
  const [current, setCurrent] = useState(src ? 0 : (placeholderTime?.current ?? 42));
  const [duration, setDuration] = useState(src ? 0 : (placeholderTime?.duration ?? 252));
  const [buffered, setBuffered] = useState(src ? 0 : (placeholderTime?.buffered ?? 120));
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [captions, setCaptions] = useState(Boolean(tracks?.some((t) => t.default)));
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Follow the `playing` prop when it changes.
  useEffect(() => {
    if (playing !== undefined) setIsPlaying(playing);
  }, [playing]);

  const setPlaying = useCallback(
    (p: boolean) => {
      setIsPlaying(p);
      onPlayingChange?.(p);
    },
    [onPlayingChange],
  );

  // Real media: keep the element in sync with the state. Never autoplay before the user acts.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !interacted.current) return;
    if (isPlaying && v.paused) v.play().catch(() => setPlaying(false));
    else if (!isPlaying && !v.paused) v.pause();
  }, [isPlaying, setPlaying]);

  // Poster-only state: a simulated clock once the user presses play.
  useEffect(() => {
    if (src || !isPlaying || !interacted.current) return;
    const id = setInterval(() => setCurrent((c) => Math.min(c + 0.25 * rate, duration)), 250);
    return () => clearInterval(id);
  }, [src, isPlaying, rate, duration]);
  useEffect(() => {
    if (!src && isPlaying && interacted.current && current >= duration) setPlaying(false);
  }, [src, isPlaying, current, duration, setPlaying]);

  // Full screen follows the document, so Escape and browser UI stay in sync.
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Captions: show or hide every caption track.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    for (const t of Array.from(v.textTracks)) if (t.kind === 'captions' || t.kind === 'subtitles') t.mode = captions ? 'showing' : 'hidden';
  }, [captions, tracks]);

  /* ---------- actions ---------- */
  const togglePlay = () => {
    interacted.current = true;
    if (!src && !isPlaying && current >= duration) setCurrent(0);
    setPlaying(!isPlaying);
  };
  const seek = (t: number) => {
    interacted.current = true;
    const next = Math.min(Math.max(t, 0), duration || 0);
    if (videoRef.current) videoRef.current.currentTime = next;
    setCurrent(next);
  };
  const changeVolume = (v: number) => {
    const next = Math.min(Math.max(v, 0), 100);
    setVolume(next);
    setMuted(next === 0);
    if (videoRef.current) {
      videoRef.current.volume = next / 100;
      videoRef.current.muted = next === 0;
    }
  };
  const toggleMute = () => {
    const next = !(muted || volume === 0);
    if (!next && volume === 0) changeVolume(50);
    else {
      setMuted(next);
      if (videoRef.current) videoRef.current.muted = next;
    }
  };
  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate as (typeof RATES)[number]) + 1) % RATES.length];
    setRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };
  const toggleCaptions = () => setCaptions((c) => !c);
  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };
  const cast = () => {
    const remote = (videoRef.current as (HTMLVideoElement & { remote?: { prompt: () => Promise<void> } }) | null)?.remote;
    remote?.prompt().catch(() => {});
  };

  const showCaptions = src ? Boolean(tracks?.length) : true;
  const showCast = src ? hasRemotePlayback : true;

  /* ---------- keyboard ---------- */
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement;
    const onButton = target.closest('button') !== null;
    switch (e.key) {
      case ' ':
        if (onButton) return; // a focused action keeps native Space activation
        e.preventDefault();
        togglePlay();
        break;
      case 'k':
      case 'K':
        e.preventDefault();
        togglePlay();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'c':
      case 'C':
        if (!showCaptions) return;
        e.preventDefault();
        toggleCaptions();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seek(current - 5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        seek(current + 5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        changeVolume((muted ? 0 : volume) + 10);
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeVolume((muted ? 0 : volume) - 10);
        break;
    }
  };

  /* ---------- auto-hide while a real video plays ---------- */
  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
  };
  useEffect(() => () => clearTimeout(idleTimer.current), []);
  const autoHide = Boolean(src) && isPlaying && idle;

  return (
    <div
      ref={rootRef}
      data-video-frame
      role="region"
      aria-label={label ?? title}
      aria-roledescription="video player"
      tabIndex={0}
      onKeyDown={handleKey}
      onPointerMove={wake}
      onPointerLeave={() => isPlaying && setIdle(true)}
      onFocus={wake}
      className={cn(
        // Fixed 16:9 frame, clip content, radius/surface. Controls are absolute overlays.
        'group/player relative isolate aspect-video w-full shrink-0 overflow-hidden rounded-surface outline-none',
        'transition-shadow duration-(--motion-duration-fast) ease-standard is-focus:shadow-focus-default',
        '[&:fullscreen]:rounded-none',
        frameWidth[size],
        className,
      )}
      {...rest}
    >
      {/* Media */}
      <div data-anatomy="media" className="absolute inset-0" onClick={togglePlay}>
        {src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            playsInline
            preload="metadata"
            className="size-full bg-surface-inverse object-cover [:fullscreen_&]:object-contain"
            data-theme="light"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onDurationChange={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onProgress={(e) => {
              const b = e.currentTarget.buffered;
              setBuffered(b.length ? b.end(b.length - 1) : 0);
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          >
            {tracks?.map((t) => (
              <track key={t.src} src={t.src} srcLang={t.srcLang} label={t.label} kind={t.kind ?? 'captions'} default={t.default} />
            ))}
          </video>
        ) : poster ? (
          <img src={poster} alt="" className="size-full object-cover" />
        ) : (
          <VideoPlaceholderFrame title={title !== 'Video player' ? title : undefined} />
        )}
      </div>

      {children}

      {/* Overlay action: absolute, centred; never part of the layout. */}
      {showOverlayAction && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-(--motion-duration-base) ease-standard',
            (autoHide || scrubbing) && 'opacity-0',
          )}
        >
          <VideoOverlayAction playing={isPlaying} size={size} className="pointer-events-auto" onClick={togglePlay} tabIndex={showActionsBar ? -1 : 0} />
        </div>
      )}

      {/* Actions bar: absolute, bottom, Fill width. */}
      {showActionsBar && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 transition-opacity duration-(--motion-duration-base) ease-standard focus-within:opacity-100',
            autoHide && 'opacity-0',
          )}
        >
          <VideoActionsBar
            size={size}
            playing={isPlaying}
            current={current}
            duration={duration}
            buffered={buffered}
            volume={volume}
            muted={muted}
            rate={rate}
            captions={captions}
            fullscreen={fullscreen}
            showCaptions={showCaptions}
            showCast={showCast}
            poster={poster}
            forceScrub={forceScrub}
            onTogglePlay={togglePlay}
            onSeek={seek}
            onVolume={changeVolume}
            onToggleMute={toggleMute}
            onCycleRate={cycleRate}
            onToggleCaptions={toggleCaptions}
            onCast={cast}
            onToggleFullscreen={toggleFullscreen}
            onScrubChange={setScrubbing}
          />
        </div>
      )}
    </div>
  );
}
