import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForceStateProps } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Spinner } from './Spinner';

/**
 * 2.2 Icon button — compact square actions with one icon.
 * Figma: `Icon button` · Size × Emphasis × State (48 variants) · `Icon` swap.
 * Close is the same component with `icon="general/x"`; dark surfaces come from colour mode.
 */
export const iconButtonVariants = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center',
    'rounded-control border-(length:--border-width-default) outline-none',
    'transition-[background-color,color,border-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
    'cursor-pointer is-focus:shadow-focus-default is-disabled:cursor-not-allowed is-disabled:shadow-none',
    // Touch platforms: the hit area reaches size/touch-min; the visual square does not change.
    "pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:after:inset-[min(0px,calc((100%_-_var(--size-touch-min))/2))]",
  ],
  {
    variants: {
      size: {
        xs: 'size-(--icon-button-size-xs)',
        sm: 'size-(--icon-button-size-sm)',
        md: 'size-(--icon-button-size-md)',
        lg: 'size-(--icon-button-size-lg)',
      },
      emphasis: {
        secondary:
          'border-border-default bg-surface-base text-icon-tertiary is-hover:bg-surface-base-hover is-hover:text-icon-secondary is-pressed:bg-surface-base-pressed is-pressed:text-icon-secondary is-disabled:border-border-disabled is-disabled:bg-surface-base is-disabled:text-icon-disabled',
        tertiary:
          'border-transparent bg-fill-none text-icon-tertiary is-hover:bg-fill-neutral-subtle-hover is-hover:text-icon-secondary is-pressed:bg-fill-neutral-subtle-pressed is-pressed:text-icon-secondary is-disabled:bg-fill-none is-disabled:text-icon-disabled',
      },
    },
    defaultVariants: { size: 'md', emphasis: 'tertiary' },
  },
);

const iconSize = { xs: 'sm', sm: 'sm', md: 'md', lg: 'lg' } as const;
const spinnerSize = { xs: 'sm', sm: 'sm', md: 'md', lg: 'md' } as const;

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof iconButtonVariants>,
    ForceStateProps {
  /** Figma `Icon`. Default `general/x` (close). */
  icon?: IconName;
  /** Accessible name — required: the button has no visible text. Pair with a Tooltip (2.13) showing the same text. */
  label: string;
  /** Figma `State=loading`: Spinner replaces the icon; not clickable. */
  loading?: boolean;
}

export function IconButton({
  size = 'md',
  emphasis = 'tertiary',
  icon = 'general/x',
  label,
  loading = false,
  forceState,
  disabled,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const s = size ?? 'md';
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      aria-busy={loading || undefined}
      className={cn(iconButtonVariants({ size, emphasis }), loading && 'pointer-events-none', className)}
      {...forceAttr(forceState)}
      {...rest}
    >
      {loading ? <Spinner size={spinnerSize[s]} tone="current" /> : <Icon name={icon} size={iconSize[s]} />}
    </button>
  );
}
