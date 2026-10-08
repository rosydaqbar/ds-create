import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { Icon, type IconName } from '@/icons';

/**
 * 3.1 Button group — `.Main/Button group item` (Size × Icon only × Selected × State, 32 variants).
 * Private part: one segment of a Button group. The file name starts with `_`, so it is not exported
 * from the library; ButtonGroup renders it and the explorer imports it for the `.Main` matrix.
 */
export type ButtonGroupSize = 'sm' | 'md';

/* ---------- .Main/Button group item ---------- */

const itemSize: Record<ButtonGroupSize, string> = {
  sm: 'h-[calc(var(--size-control-sm)-2*var(--border-width-default))] px-(--button-group-item-padding-x-sm) py-(--button-group-item-padding-y-sm)',
  md: 'h-[calc(var(--size-control-md)-2*var(--border-width-default))] px-(--button-group-item-padding-x-md) py-(--button-group-item-padding-y-md)',
};
const iconOnlySize: Record<ButtonGroupSize, string> = {
  sm: 'w-[calc(var(--size-control-sm)-2*var(--border-width-default))] px-0',
  md: 'w-[calc(var(--size-control-md)-2*var(--border-width-default))] px-0',
};

export interface ButtonGroupItemProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Figma `Size`. */
  size?: ButtonGroupSize;
  /** Figma `Icon only`. */
  iconOnly?: boolean;
  /** Figma `Selected`: the selected fill. Combines with every State. */
  selected?: boolean;
  /** Figma `Label`. */
  label?: string;
  /** Figma `Show leading icon` + `Leading icon`. */
  leadingIcon?: IconName;
  /** Figma `Show dot`. */
  showDot?: boolean;
  /** Figma `Show divider`: the single line on the leading edge (off for the first item). */
  showDivider?: boolean;
  /** Figma `State=disabled`. */
  disabled?: boolean;
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
  /** Semantics set by the group. */
  role?: string;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  /** Set by the group: rounds the fill of the first / last item inside the outer radius. */
  edge?: 'first' | 'last' | 'only';
}

/** Private part — rendered by ButtonGroup; exported for the explorer's `.Main` matrix only. */
export function ButtonGroupItemPart({
  size = 'md',
  iconOnly = false,
  selected = false,
  label = 'Button',
  leadingIcon,
  showDot = false,
  showDivider = true,
  disabled = false,
  forceState,
  buttonRef,
  edge,
  className,
  ...rest
}: ButtonGroupItemProps) {
  return (
    <button
      data-anatomy="item"
      ref={buttonRef}
      type="button"
      disabled={disabled}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-sm whitespace-nowrap outline-none type-body-sm-semibold',
        'transition-[background-color,color] duration-(--motion-duration-fast) ease-standard',
        // Colours: rest → hover → selected; icons read --bgi-icon.
        selected
          ? 'bg-fill-neutral-subtle-selected text-text-primary [--bgi-icon:var(--color-icon-primary)]'
          : 'bg-fill-none text-text-secondary [--bgi-icon:var(--color-icon-secondary)] is-hover:bg-fill-neutral-subtle-hover is-hover:text-text-primary is-hover:[--bgi-icon:var(--color-icon-primary)]',
        !selected && 'is-disabled:bg-fill-none',
        'is-disabled:cursor-not-allowed is-disabled:text-text-disabled is-disabled:[--bgi-icon:var(--color-icon-disabled)]',
        // Focus ring drawn inside the item, so the group's clip and the next item never cover it.
        "after:pointer-events-none after:absolute after:inset-xs after:rounded-xs after:content-[''] is-focus:after:shadow-focus-default",
        itemSize[size],
        iconOnly && iconOnlySize[size],
        (edge === 'first' || edge === 'only') && 'rounded-s-[calc(var(--radius-control)-var(--border-width-default))]',
        (edge === 'last' || edge === 'only') && 'rounded-e-[calc(var(--radius-control)-var(--border-width-default))]',
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    >
      {showDivider && <span aria-hidden data-anatomy="divider" className="pointer-events-none absolute inset-y-0 start-0 w-(--border-width-default) bg-border-default" />}
      {iconOnly ? (
        <Icon data-anatomy="leading-icon" name={leadingIcon ?? 'general/placeholder'} size="md" className="text-(--bgi-icon)" />
      ) : (
        <>
          {showDot ? (
            <span aria-hidden data-anatomy="dot" className={cn('size-(--size-indicator-sm) shrink-0 rounded-full', disabled ? 'bg-icon-disabled' : 'bg-icon-success')} />
          ) : (
            leadingIcon && <Icon data-anatomy="leading-icon" name={leadingIcon} size="md" className="text-(--bgi-icon)" />
          )}
          <span data-anatomy="text-padding" className="px-(--space-optical)">{label}</span>
        </>
      )}
    </button>
  );
}
