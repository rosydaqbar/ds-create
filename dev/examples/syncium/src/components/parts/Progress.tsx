import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/cn';

/**
 * 2.14 Progress — percent completed for a task, or a level against a known maximum.
 * Figma: `Progress` · Type × Size × Value × Placement (165 variants) · Show label, Label.
 * Every value is the same track and progress line; `value` only changes the fill width or arc sweep.
 */
export type ProgressType = 'bar' | 'circle' | 'half-circle';
export type ProgressSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';
export type ProgressPlacement = 'none' | 'right' | 'bottom-end' | 'top' | 'bottom';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Type`. */
  type?: ProgressType;
  /** Figma `Size` (circle and half-circle; the bar has one size). */
  size?: ProgressSize;
  /** Figma `Value`: 0–100. Any value between the Figma steps works; it is rounded for display. */
  value?: number;
  /** Figma `Placement` (bar only): where the value label sits. */
  placement?: ProgressPlacement;
  /** Figma `Show label` + `Label` (circle and half-circle): short text above the number. Not shown at 2xs. */
  label?: ReactNode;
}

/* Ring diameters from the spec (§6). No size token exists for them; thickness uses progress/ring-thickness/*. */
const DIAMETER: Record<ProgressSize, number> = { '2xs': 64, xs: 160, sm: 200, md: 240, lg: 280 };
const numberStyle: Record<ProgressSize, string> = {
  '2xs': 'type-body-sm-semibold',
  xs: 'type-heading-sm-semibold',
  sm: 'type-heading-md-semibold',
  md: 'type-heading-lg-semibold',
  lg: 'type-heading-xl-semibold',
};
const labelStyle: Record<ProgressSize, string> = {
  '2xs': '',
  xs: 'type-body-xs-medium',
  sm: 'type-body-xs-medium',
  md: 'type-body-sm-medium',
  lg: 'type-body-sm-medium',
};

const clamp = (v: number) => Math.min(100, Math.max(0, v));
const motion = 'duration-(--motion-duration-base) ease-standard';

export function Progress({ type = 'bar', size = 'md', value = 40, placement = 'none', label, className, ...rest }: ProgressProps) {
  const v = clamp(value);
  const text = `${Math.round(v)}%`;
  const a11y = {
    role: 'progressbar' as const,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': Math.round(v),
    'aria-valuetext': text,
    // Name it after what is progressing; the circle label is a sensible default.
    'aria-label': rest['aria-label'] ?? (typeof label === 'string' ? label : undefined),
  };
  if (type === 'bar') return <ProgressBar v={v} text={text} placement={placement} className={className} {...a11y} {...rest} />;
  return <ProgressRing half={type === 'half-circle'} size={size} v={v} text={text} label={label} className={className} {...a11y} {...rest} />;
}

/* ---------- bar ---------- */
function Track({ v, trackRef, grow }: { v: number; trackRef?: Ref<HTMLDivElement>; grow?: boolean }) {
  return (
    <div ref={trackRef} data-anatomy="track" className={cn('relative h-(--size-track-lg) w-full min-w-0 shrink-0 overflow-hidden rounded-full bg-fill-neutral-track', grow && 'flex-1 shrink')}>
      {/* At 0 the fill is hidden, so it is not an anatomy target there. */}
      <div data-anatomy={v === 0 ? undefined : 'fill'} className={cn('absolute inset-y-0 left-0 rounded-full bg-fill-brand-solid transition-[width]', motion, v === 0 && 'hidden')} style={{ width: `${v}%` }} />
    </div>
  );
}

/** `.Main/Progress floating label`: centred on the fill end, kept inside the track. */
function FloatingLabel({ v, text, side }: { v: number; text: string; side: 'top' | 'bottom' }) {
  const space = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const [x, setX] = useState<number | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      if (!space.current || !tag.current) return;
      const w = space.current.clientWidth;
      const lw = tag.current.offsetWidth;
      setX(Math.min(Math.max((w * v) / 100 - lw / 2, 0), Math.max(w - lw, 0)));
    };
    place();
    const ro = new ResizeObserver(place);
    if (space.current) ro.observe(space.current);
    return () => ro.disconnect();
  }, [v, text]);
  return (
    // Label space: floating label height + space/md, reserved so the track never moves.
    <div
      ref={space}
      aria-hidden
      data-anatomy="floating-label"
      className={cn('relative w-full shrink-0', side === 'top' ? 'pb-md' : 'pt-md')}
    >
      <span
        ref={tag}
        className={cn(
          'type-body-xs-semibold inline-flex whitespace-nowrap rounded-control border-(length:--border-width-default) border-border-subtle bg-surface-raised px-lg py-md text-text-secondary shadow-raised',
          'transition-transform',
          motion,
          x === null && 'invisible',
        )}
        style={{ transform: `translateX(${x ?? 0}px)` }}
      >
        {text}
      </span>
    </div>
  );
}

function ProgressBar({ v, text, placement, className, ...rest }: { v: number; text: string; placement: ProgressPlacement; className?: string } & HTMLAttributes<HTMLDivElement>) {
  const valueLabel = <span data-anatomy="value-label" className="type-body-sm-medium shrink-0 text-text-secondary tabular-nums">{text}</span>;
  if (placement === 'right') {
    return (
      <div className={cn('flex w-full items-center gap-lg', className)} {...rest}>
        <Track v={v} grow />
        {valueLabel}
      </div>
    );
  }
  if (placement === 'bottom-end') {
    return (
      <div className={cn('flex w-full flex-col items-end gap-md', className)} {...rest}>
        <Track v={v} />
        {valueLabel}
      </div>
    );
  }
  return (
    <div className={cn('flex w-full flex-col', className)} {...rest}>
      {placement === 'top' && <FloatingLabel v={v} text={text} side="top" />}
      <Track v={v} />
      {placement === 'bottom' && <FloatingLabel v={v} text={text} side="bottom" />}
    </div>
  );
}

/* ---------- circle and half-circle ---------- */
function ProgressRing({
  half,
  size,
  v,
  text,
  label,
  className,
  style,
  ...rest
}: { half: boolean; size: ProgressSize; v: number; text: string; label?: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  const d = DIAMETER[size];
  const t = `var(--progress-ring-thickness-${size})`;
  // Ring geometry in CSS so thickness stays a token: r = (d − t) / 2, stroke inside the box.
  const ring = { cx: d / 2, cy: d / 2, pathLength: 100, fill: 'none', strokeLinecap: 'round' as const };
  const geo = { r: `calc((${d}px - ${t}) / 2)`, strokeWidth: t } as CSSProperties;
  // Circle: starts at 12 o'clock, clockwise. Half-circle: 180° arch from 9 o'clock to 3 o'clock.
  const sweep = half ? v / 2 : v;
  const rotate = half ? 'rotate(180deg)' : 'rotate(-90deg)';
  const showLabel = label != null && label !== '' && size !== '2xs';

  return (
    <div
      className={cn('relative inline-block shrink-0 overflow-hidden', className)}
      style={{ width: d, height: half ? `calc(${d / 2}px + ${t} / 2)` : d, ...style }}
      {...rest}
    >
      <svg aria-hidden width={d} height={d} viewBox={`0 0 ${d} ${d}`} className="absolute left-0 top-0" style={{ transform: rotate }}>
        <circle {...ring} data-anatomy="background" style={{ ...geo, strokeDasharray: half ? '50 100' : undefined }} className="stroke-fill-neutral-track" />
        {v > 0 && (
          <circle
            {...ring}
            data-anatomy="progress-line"
            style={{ ...geo, strokeDasharray: `${sweep} 100` }}
            className={cn('stroke-fill-brand-solid transition-[stroke-dasharray]', motion)}
          />
        )}
      </svg>
      <div
        aria-hidden
        data-anatomy="number-and-label"
        className={cn(
          'absolute inset-x-0 flex flex-col items-center gap-xxs text-center',
          half ? 'bottom-0' : 'top-1/2 -translate-y-1/2',
        )}
      >
        {showLabel && <span className={cn(labelStyle[size], 'text-text-tertiary')}>{label}</span>}
        <span className={cn(numberStyle[size], 'text-text-primary tabular-nums')}>{text}</span>
      </div>
    </div>
  );
}
