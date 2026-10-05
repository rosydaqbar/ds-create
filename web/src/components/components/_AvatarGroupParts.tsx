import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr } from '@/lib/types';
import { Icon } from '@/icons';
import { Tooltip } from '../parts/Tooltip';

/**
 * 3.4 Avatar group — `.Main` private part: `.Main/Avatar group add button`.
 * Internal to AvatarGroup; the file name starts with `_`, so it is not exported from the library.
 * Figma: Size × State (12 variants).
 */
export type AvatarGroupPartSize = 'xs' | 'sm' | 'md';

const side: Record<AvatarGroupPartSize, string> = {
  xs: 'size-(--size-avatar-xs)',
  sm: 'size-(--size-avatar-sm)',
  md: 'size-(--size-avatar-md)',
};

export interface AvatarGroupAddButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Figma `Size`: the side matches the avatars of the group. */
  size?: AvatarGroupPartSize;
  /** Accessible name and Tooltip text. */
  label?: string;
  /** Documentation only: Figma `State=hover` or `State=focus`. */
  forceState?: 'hover' | 'focus';
  /** Wrap in a Tooltip with the label (on by default). */
  showTooltip?: boolean;
}

export function AvatarGroupAddButton({ size = 'sm', label = 'Add people', forceState, showTooltip = true, disabled, className, type = 'button', ...rest }: AvatarGroupAddButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full outline-none',
        'border-(length:--border-width-default) border-dashed border-border-default bg-fill-none text-icon-tertiary',
        'transition-[background-color,color,border-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
        'is-hover:border-border-strong is-hover:bg-fill-neutral-subtle-hover is-hover:text-icon-secondary',
        'is-focus:shadow-focus-default',
        'is-disabled:cursor-not-allowed is-disabled:border-border-disabled is-disabled:bg-fill-none is-disabled:text-icon-disabled is-disabled:shadow-none',
        "pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:after:inset-[min(0px,calc((100%_-_var(--size-touch-min))/2))]",
        side[size],
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    >
      <Icon name="general/plus" size={size === 'xs' ? 'xs' : 'sm'} />
    </button>
  );
  return showTooltip && !disabled ? <Tooltip text={label}>{button}</Tooltip> : button;
}
