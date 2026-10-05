import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * 2.16 Divider — a thin line that separates groups on the same surface.
 * Figma: `Divider` · Orientation × Emphasis (6 variants) · Show label, Label.
 * The Divider has no margin; the space around it comes from the parent's gap.
 */
export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Orientation`. Vertical fills the height of its row. */
  orientation?: 'horizontal' | 'vertical';
  /** Figma `Emphasis`: line weight. `tertiary` by default; one weight per surface. */
  emphasis?: 'primary' | 'secondary' | 'tertiary';
  /** Figma `Show label` + `Label` (horizontal only). Present = shown. */
  label?: ReactNode;
  /** Purely visual: hidden from assistive technology instead of exposed as a separator. */
  decorative?: boolean;
}

const line = {
  horizontal: {
    primary: 'border-t-(length:--border-width-strong) border-border-strong',
    secondary: 'border-t-(length:--border-width-default) border-border-default',
    tertiary: 'border-t-(length:--border-width-default) border-border-subtle',
  },
  vertical: {
    primary: 'border-l-(length:--border-width-strong) border-border-strong',
    secondary: 'border-l-(length:--border-width-default) border-border-default',
    tertiary: 'border-l-(length:--border-width-default) border-border-subtle',
  },
} as const;

export function Divider({ orientation = 'horizontal', emphasis = 'tertiary', label, decorative = false, className, ...rest }: DividerProps) {
  const lineClass = line[orientation][emphasis];
  if (orientation === 'vertical') {
    return (
      <div
        data-anatomy="start-line"
        role={decorative ? undefined : 'separator'}
        aria-orientation={decorative ? undefined : 'vertical'}
        aria-hidden={decorative || undefined}
        className={cn('w-0 shrink-0 self-stretch', lineClass, className)}
        {...rest}
      />
    );
  }
  const withLabel = label != null && label !== '';
  if (withLabel) {
    // A labelled divider exposes its label as text, so "or" is announced.
    return (
      <div data-anatomy="root" className={cn('flex w-full items-center gap-md', className)} {...rest}>
        <span aria-hidden data-anatomy="start-line" className={cn('h-0 min-w-0 flex-1', lineClass)} />
        <span data-anatomy="label" className="type-body-sm-medium shrink-0 whitespace-nowrap text-text-tertiary">{label}</span>
        <span aria-hidden data-anatomy="end-line" className={cn('h-0 min-w-0 flex-1', lineClass)} />
      </div>
    );
  }
  return (
    <div
      data-anatomy="start-line"
      role={decorative ? undefined : 'separator'}
      aria-orientation={decorative ? undefined : 'horizontal'}
      aria-hidden={decorative || undefined}
      className={cn('h-0 w-full', lineClass, className)}
      {...rest}
    />
  );
}
