import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { TooltipBubble } from './Tooltip';

/**
 * 2.18 Slider — pick a value or a range by dragging handles along a track.
 * Figma: `Slider` · Start value × End value × Placement (30 variants) · Show start handle;
 * private part `.Main/Slider handle` · State × Placement.
 * A single-value slider is `startValue={0}` with `showStartHandle={false}`.
 */
export type SliderPlacement = 'none' | 'bottom' | 'top';
type HandleState = Extract<ForcedState, 'hover' | 'focus'>;

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  /** Figma `Start value`: where the progress line starts (the start handle's value). */
  startValue?: number;
  /** Figma `End value`: where the progress line ends (the end handle's value). */
  endValue?: number;
  /** Figma `Placement`: value labels — none, text under each handle, or a Tooltip above the active handle. */
  placement?: SliderPlacement;
  /** Figma `Show start handle`. Off = single-value slider. */
  showStartHandle?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** Called while a handle moves. Pass the values back as `startValue` / `endValue` to control the Slider. */
  onValueChange?: (start: number, end: number) => void;
  /** Value text for labels and screen readers, with its unit: `(v) => `$${v}``. */
  formatValue?: (v: number) => string;
  /** Accessible names of the handles ("Minimum price", "Maximum price"). */
  startAriaLabel?: string;
  endAriaLabel?: string;
  disabled?: boolean;
  /** `Placement=top`: keep the tooltips visible instead of only on the active handle. */
  alwaysShowTooltip?: boolean;
  /** Documentation only: `.Main/Slider handle` State of the end handle. */
  forceState?: HandleState;
  /** Documentation only: `.Main/Slider handle` State of the start handle. */
  forceStartState?: HandleState;
}

type Which = 'start' | 'end';

export function Slider({
  startValue = 0,
  endValue = 50,
  placement = 'none',
  showStartHandle = true,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  formatValue = (v) => String(v),
  startAriaLabel = 'Minimum',
  endAriaLabel,
  disabled = false,
  alwaysShowTooltip = false,
  forceState,
  forceStartState,
  className,
  ...rest
}: SliderProps) {
  const [values, setValues] = useState<[number, number]>([startValue, endValue]);
  useEffect(() => {
    setValues([startValue, endValue]);
  }, [startValue, endValue]);
  const [active, setActive] = useState<Which | null>(null);
  const [dragging, setDragging] = useState<Which | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const tie = useRef(false);
  const handles = { start: useRef<HTMLSpanElement>(null), end: useRef<HTMLSpanElement>(null) };

  const range = max - min || 1;
  const pct = (v: number) => ((v - min) / range) * 100;
  const snap = (v: number) => Math.round((v - min) / step) * step + min;
  const lo = showStartHandle ? values[0] : min;

  const set = (which: Which, raw: number) => {
    const [s, e] = values;
    // Handles never cross: start ≤ end.
    const next: [number, number] =
      which === 'start' ? [Math.min(Math.max(snap(raw), min), e), e] : [s, Math.max(Math.min(snap(raw), max), showStartHandle ? s : min)];
    if (next[0] === s && next[1] === e) return;
    setValues(next);
    onValueChange?.(next[0], next[1]);
  };

  const valueAt = (clientX: number) => {
    const r = area.current!.getBoundingClientRect();
    return min + ((clientX - r.left) / r.width) * range;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const v = valueAt(e.clientX);
    // Pressing a knob drags that handle; clicking the track moves the nearest handle.
    const hit = (e.target as HTMLElement).closest('[role="slider"]');
    const which: Which = !showStartHandle
      ? 'end'
      : hit === handles.start.current
        ? 'start'
        : hit === handles.end.current
          ? 'end'
          : Math.abs(v - values[0]) < Math.abs(v - values[1]) || (v < values[0] && values[0] === values[1])
            ? 'start'
            : 'end';
    if (hit) {
      // Keep the value under the knob until the pointer moves. Stacked knobs (start = end): the
      // first move decides — left drags the start handle, right drags the end handle.
      tie.current = showStartHandle && values[0] === values[1];
      setDragging(which);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
      handles[which].current?.focus({ preventScroll: true });
      return;
    }
    set(which, v);
    setDragging(which);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    handles[which].current?.focus({ preventScroll: true });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const v = valueAt(e.clientX);
    let which = dragging;
    if (tie.current && Math.abs(v - values[0]) * 100 > range / 2) {
      which = v < values[0] ? 'start' : 'end';
      tie.current = false;
      setDragging(which);
      handles[which].current?.focus({ preventScroll: true });
    } else if (tie.current) return;
    set(which, v);
  };
  const endDrag = () => {
    tie.current = false;
    setDragging(null);
  };

  const onKeyDown = (which: Which) => (e: KeyboardEvent) => {
    const cur = which === 'start' ? values[0] : values[1];
    const big = Math.max(step, Math.round(range / 10 / step) * step);
    const map: Record<string, number> = {
      ArrowRight: cur + step, ArrowUp: cur + step, ArrowLeft: cur - step, ArrowDown: cur - step,
      PageUp: cur + big, PageDown: cur - big, Home: min, End: max,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    set(which, map[e.key]);
  };

  const handle = (which: Which) => {
    const v = which === 'start' ? values[0] : values[1];
    const forced = which === 'start' ? forceStartState : forceState;
    const showTip = placement === 'top' && (alwaysShowTooltip || !!forced || active === which || dragging === which);
    return (
      <span
        key={which}
        ref={handles[which]}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={which === 'start' ? startAriaLabel : endAriaLabel ?? (showStartHandle ? 'Maximum' : undefined)}
        aria-valuemin={which === 'start' ? min : showStartHandle ? values[0] : min}
        aria-valuemax={which === 'start' ? values[1] : max}
        aria-valuenow={v}
        aria-valuetext={formatValue(v)}
        aria-orientation="horizontal"
        aria-disabled={disabled || undefined}
        {...forceAttr(forced)}
        onKeyDown={onKeyDown(which)}
        onFocus={() => setActive(which)}
        onBlur={() => setActive((a) => (a === which ? null : a))}
        onPointerEnter={(e) => e.pointerType !== 'touch' && setActive(which)}
        onPointerLeave={() => setActive((a) => (a === which && document.activeElement !== handles[which].current ? null : a))}
        className={cn(
          // .Main/Slider handle — Knob; bounds are the knob only, labels sit outside.
          'absolute top-1/2 z-10 size-(--size-icon-lg) -translate-x-1/2 -translate-y-1/2 rounded-full outline-none',
          'border-(length:--border-width-strong) border-border-brand bg-surface-base shadow-raised',
          'transition-[background-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
          'is-hover:bg-fill-brand-subtle is-focus:bg-surface-base is-focus:shadow-[var(--elevation-raised),var(--focus-default)]',
          disabled ? 'cursor-not-allowed' : dragging === which ? 'cursor-grabbing' : 'cursor-grab',
          // Touch: the hit area grows to size/touch-min without changing the knob.
          'pointer-coarse:before:absolute pointer-coarse:before:left-1/2 pointer-coarse:before:top-1/2 pointer-coarse:before:size-(--size-touch-min) pointer-coarse:before:-translate-1/2',
        )}
        style={{ left: `${pct(v)}%` }}
      >
        {placement === 'bottom' && (
          <span aria-hidden className="type-body-md-medium pointer-events-none absolute left-1/2 top-full mt-md -translate-x-1/2 whitespace-nowrap text-text-primary">
            {formatValue(v)}
          </span>
        )}
        {placement === 'top' && (
          <TooltipBubble
            aria-hidden
            placement="top"
            text={formatValue(v)}
            className={cn(
              'pointer-events-none absolute bottom-full left-1/2 mb-md -translate-x-1/2 transition-[opacity,visibility] duration-(--motion-duration-fast) ease-standard',
              showTip ? 'visible opacity-100' : 'invisible opacity-0',
            )}
          />
        )}
      </span>
    );
  };

  return (
    <div className={cn('flex w-full flex-col', className)} {...rest}>
      {/* Label space (top): Tooltip height (text line + 2 × space/md + 6 arrow) + space/md. */}
      {placement === 'top' && <div aria-hidden className="h-[calc(var(--font-line-height-body-xs)+var(--space-md)*3+6px)] shrink-0" />}
      {/* Track area: knob height; padding of half the knob so handles at 0 and 100 stay inside. */}
      <div className="h-(--size-icon-lg) shrink-0 px-[calc(var(--size-icon-lg)/2)]">
        <div
          ref={area}
          className={cn('relative h-full touch-none select-none', !disabled && 'cursor-pointer')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="absolute inset-x-0 top-1/2 h-(--size-track-lg) -translate-y-1/2 rounded-full bg-fill-neutral-track" />
          <div
            className="absolute top-1/2 h-(--size-track-lg) -translate-y-1/2 rounded-full bg-fill-brand-solid"
            style={{ left: `${pct(lo)}%`, width: `${pct(values[1]) - pct(lo)}%` }}
          />
          {showStartHandle && handle('start')}
          {handle('end')}
        </div>
      </div>
      {/* Label space (bottom): label line height + space/md. */}
      {placement === 'bottom' && <div aria-hidden className="h-[calc(var(--font-line-height-body-md)+var(--space-md))] shrink-0" />}
    </div>
  );
}
