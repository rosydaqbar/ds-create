import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** 2.15 Spinner — indeterminate loading. Figma: `Spinner` · Size × Tone. */
export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Figma `Size`. sm/md sit in controls; lg/xl stand alone. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Figma `Tone`. `current` follows the text colour (used inside Button and Icon button). */
  tone?: 'neutral' | 'brand' | 'current';
  /** Accessible status text; omit when a parent already announces loading. */
  label?: string;
}

const box = { sm: 'var(--size-icon-sm)', md: 'var(--size-icon-md)', lg: 'var(--size-icon-xl)', xl: 'var(--spinner-size-xl)' };

export function Spinner({ size = 'md', tone = 'neutral', label, className, style, ...rest }: SpinnerProps) {
  const active = tone === 'brand' ? 'var(--color-icon-brand)' : tone === 'neutral' ? 'var(--color-icon-secondary)' : 'currentColor';
  const track = tone === 'current' ? 'color-mix(in srgb, currentColor 25%, transparent)' : 'var(--color-fill-neutral-track)';
  const t = `var(--spinner-thickness-${size})`;
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-block shrink-0', className)}
      style={{ width: box[size], height: box[size], ...style }}
      {...rest}
    >
      <span className="absolute inset-0 rounded-full" style={{ border: `${t} solid ${track}` }} />
      <span
        className="absolute inset-0 animate-spin rounded-full"
        style={{
          border: `${t} solid transparent`,
          borderTopColor: active,
          animationDuration: 'var(--motion-duration-loop)',
          animationTimingFunction: 'linear',
        }}
      />
    </span>
  );
}
