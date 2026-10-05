import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForceStateProps } from '@/lib/types';

/**
 * 2.9 Switch — turns one setting on or off; the change applies immediately.
 * Figma: `Switch` · Size × Type × Checked × State (32 variants).
 * A native checkbox with `role="switch"` (Space toggles, announced as on/off). `Checked` moves
 * the thumb and recolours the track; slim is the same control over a thin rail.
 */
const root = {
  default: { sm: 'w-(--switch-width-sm) h-(--switch-height-sm)', md: 'w-(--switch-width-md) h-(--switch-height-md)' },
  slim: { sm: 'w-(--switch-slim-width-sm) h-(--switch-thumb-sm)', md: 'w-(--switch-slim-width-md) h-(--switch-thumb-md)' },
};
const rail = { sm: 'h-(--switch-slim-track-sm)', md: 'h-(--switch-slim-track-md)' };
const thumb = { sm: 'size-(--switch-thumb-sm)', md: 'size-(--switch-thumb-md)' };
/** Distance the thumb travels: track width − thumb − both insets (default), or rail width − thumb (slim). */
const travel = {
  default: {
    sm: 'peer-checked:translate-x-[calc(var(--switch-width-sm)_-_var(--switch-thumb-sm)_-_2*var(--switch-inset))]',
    md: 'peer-checked:translate-x-[calc(var(--switch-width-md)_-_var(--switch-thumb-md)_-_2*var(--switch-inset))]',
  },
  slim: {
    sm: 'peer-checked:translate-x-[calc(var(--switch-slim-width-sm)_-_var(--switch-thumb-sm))]',
    md: 'peer-checked:translate-x-[calc(var(--switch-slim-width-md)_-_var(--switch-thumb-md))]',
  },
};

const trackColors = [
  'bg-fill-neutral-track',
  'peer-hover:bg-switch-track-off-hover peer-data-[force=hover]:bg-switch-track-off-hover',
  'peer-checked:bg-fill-brand-solid',
  'peer-checked:peer-hover:bg-fill-brand-solid-hover peer-checked:peer-data-[force=hover]:bg-fill-brand-solid-hover',
  'peer-disabled:bg-fill-neutral-subtle-disabled peer-checked:peer-disabled:bg-fill-neutral-subtle-disabled',
].join(' ');

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, ForceStateProps {
  /** Figma `Size`. */
  size?: 'sm' | 'md';
  /** Figma `Type`: thumb inside a full track, or thumb over a thin rail. */
  type?: 'default' | 'slim';
  /** Figma `Checked`. Omit (or use `defaultChecked`) for an uncontrolled switch. */
  checked?: boolean;
  /** Called with the new value. */
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ size = 'md', type = 'default', checked, onCheckedChange, onChange, forceState, className, style, ...rest }: SwitchProps) {
  const slim = type === 'slim';
  const motion = 'duration-(--motion-duration-fast) ease-standard';
  return (
    <span className={cn('relative inline-flex shrink-0', root[type][size], className)} style={style}>
      <input
        type="checkbox"
        role="switch"
        className="peer absolute inset-0 z-10 m-0 cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-not-allowed pointer-coarse:inset-y-[min(0px,calc((100%_-_var(--size-touch-min))/2))]"
        checked={checked}
        readOnly={checked !== undefined && !onChange && !onCheckedChange ? true : undefined}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...forceAttr(forceState)}
        {...rest}
      />
      {/* Track (default: the whole root; slim: a centred rail). */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute rounded-full transition-colors',
          motion,
          trackColors,
          slim ? cn('inset-x-0 top-1/2 -translate-y-1/2', rail[size]) : 'inset-0',
        )}
      />
      {/* Focus ring around the track (default) or the root (slim). */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full transition-shadow peer-focus-visible:shadow-focus-default peer-data-[force=focus]:shadow-focus-default" />
      {/* .Main/Switch thumb */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute rounded-full bg-switch-thumb-fill shadow-raised transition-[translate,border-color]',
          // 1.6 Motion: the thumb moves at base · standard (instant in Reduced).
          'duration-(--motion-duration-base) ease-standard',
          thumb[size],
          travel[type][size],
          'peer-disabled:shadow-none',
          slim
            ? 'left-0 top-0 border-(length:--border-width-default) border-border-default peer-checked:border-fill-brand-solid peer-disabled:border-border-disabled peer-checked:peer-disabled:border-border-disabled'
            : 'left-(--switch-inset) top-(--switch-inset)',
        )}
      />
    </span>
  );
}
