import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { Icon } from '@/icons';
import { Flag } from '../assets/Flag';
import { Avatar } from './Avatar';
import { Checkbox } from './Checkbox';

/**
 * 2.5 Tag — compact interactive values: filters people remove, topics they count, options they select.
 * Figma: `Tag` · Size × Type × State (36 variants) + `.Main/Tag close`, `.Main/Tag count`.
 * `Type` holds the trailing element, so close and count never combine.
 *
 * Behaviour:
 * - `showCheckbox`: the whole tag is a `<label>` around a 2.7 Checkbox; it is the hit target.
 * - `type="removable"`: only the close is a button ("Remove {label}").
 * - otherwise, with `onClick`, the tag is a button; without it, static text.
 */
export type TagSize = 'sm' | 'md' | 'lg';
export type TagType = 'text' | 'removable' | 'count';

const sizeClass: Record<TagSize, string> = {
  sm: 'h-(--tag-height-sm) gap-(--space-xs) type-body-xs-medium',
  md: 'h-(--tag-height-md) gap-(--space-sm) type-body-sm-medium',
  lg: 'h-(--tag-height-lg) gap-(--space-sm) type-body-sm-medium',
};
const padStart = { sm: 'pl-(--space-md)', md: 'pl-(--tag-padding-x-md)', lg: 'pl-(--space-lg)' };
const padEnd = { sm: 'pr-(--space-md)', md: 'pr-(--tag-padding-x-md)', lg: 'pr-(--space-lg)' };
const padEndTight = { sm: 'pr-(--tag-padding-x-tight-sm)', md: 'pr-(--tag-padding-x-tight-md)', lg: 'pr-(--tag-padding-x-tight-lg)' };
const dotSize = { sm: 'size-(--size-indicator-xs)', md: 'size-(--size-indicator-xs)', lg: 'size-(--size-indicator-sm)' };

export interface TagProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick'> {
  /** Figma `Size`. */
  size?: TagSize;
  /** Figma `Type`: trailing element — none, close, or count. */
  type?: TagType;
  /** Figma `Label`. */
  label?: ReactNode;
  /** Figma `Count` (`type="count"`). */
  count?: ReactNode;
  /** Figma `Show checkbox`: a selectable tag. */
  showCheckbox?: boolean;
  /** Figma nested Checkbox `Checked` (exposed on the Tag). Omit for uncontrolled. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Form name / value of the selectable tag's checkbox. */
  name?: string;
  value?: string;
  /** Figma `Show dot`. */
  showDot?: boolean;
  /** Figma `Show flag` + `Flag`: ISO country code. */
  flag?: string;
  /** Figma `Show avatar` (2.6 Avatar, Size=2xs). */
  avatar?: { src?: string; initials?: string };
  /** Figma `State=disabled`. */
  disabled?: boolean;
  /** Removable: called by the close. */
  onRemove?: () => void;
  /** Accessible name of the close; default "Remove {label}". */
  removeLabel?: string;
  /** Text / count tags: makes the tag a button. */
  onClick?: () => void;
  /** Documentation only. Figma `State` hover / focus (focus lands on the close for removable tags). */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
}

export function Tag({
  size = 'md',
  type = 'text',
  label = 'Label',
  count = '5',
  showCheckbox = false,
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  value,
  showDot = false,
  flag,
  avatar,
  disabled = false,
  onRemove,
  removeLabel,
  onClick,
  forceState,
  className,
  ...rest
}: TagProps) {
  const text = typeof label === 'string' ? label : '';
  const removable = type === 'removable';
  // Where the focus ring sits: the close (removable, not selectable) or the tag.
  const tagForce = removable && !showCheckbox && forceState === 'focus' ? undefined : forceState;
  const closeForce = removable && !showCheckbox && forceState === 'focus' ? 'focus' : forceState === 'hover' ? 'hover' : undefined;

  const Root = showCheckbox ? 'label' : onClick && !removable ? 'button' : 'span';
  const interactive = Root !== 'span';

  return (
    <Root
      data-anatomy="root"
      {...(Root === 'button' ? { type: 'button' as const, disabled, onClick } : {})}
      data-disabled={disabled || undefined}
      // A static tag (not a button or label) exposes its disabled state itself; the close is natively disabled.
      aria-disabled={(Root === 'span' && disabled) || undefined}
      className={cn(
        'group/tag relative inline-flex shrink-0 select-none items-center whitespace-nowrap rounded-sm border-(length:--border-width-default) outline-none',
        'transition-[background-color,color,box-shadow] duration-(--motion-duration-fast) ease-standard',
        'border-border-default bg-surface-base text-text-secondary',
        'is-hover:bg-surface-base-hover is-hover:text-text-primary',
        'is-focus:shadow-focus-default has-[input:focus-visible]:shadow-focus-default',
        'is-disabled:border-border-disabled is-disabled:bg-fill-neutral-subtle-disabled is-disabled:text-text-disabled is-disabled:shadow-none',
        interactive && 'cursor-pointer is-disabled:cursor-not-allowed',
        sizeClass[size],
        padStart[size],
        type === 'text' ? padEnd[size] : padEndTight[size],
        className,
      )}
      {...forceAttr(tagForce)}
      {...rest}
    >
      {showCheckbox && (
        <Checkbox
          size="sm"
          parentFocus
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          name={name}
          value={value}
        />
      )}
      {showDot ? (
        <span aria-hidden data-anatomy="leading-visual" className={cn('shrink-0 rounded-full bg-icon-success group-data-[disabled=true]/tag:bg-icon-disabled', dotSize[size])} />
      ) : flag ? (
        <Flag country={flag} size={size === 'lg' ? 'md' : 'sm'} alt="" data-anatomy="leading-visual" />
      ) : avatar ? (
        <Avatar size="2xs" type={avatar.src ? 'image' : avatar.initials ? 'initials' : 'icon'} src={avatar.src} initials={avatar.initials} alt="" data-anatomy="leading-visual" />
      ) : null}
      <span data-anatomy="label">{label}</span>
      {removable && (
        <TagClose
          size={size}
          label={removeLabel ?? `Remove ${text}`.trim()}
          onClick={onRemove}
          disabled={disabled}
          forceState={closeForce}
        />
      )}
      {type === 'count' && <TagCount>{count}</TagCount>}
    </Root>
  );
}

/** `.Main/Tag close` — the remove action of removable tags. Private. */
function TagClose({
  size,
  label,
  onClick,
  disabled,
  forceState,
}: {
  size: TagSize;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  forceState?: ForcedState;
}) {
  return (
    <button
      data-anatomy="close"
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xs p-(--space-xxs) outline-none',
        'transition-[background-color,color,box-shadow] duration-(--motion-duration-fast) ease-standard',
        'text-icon-tertiary is-hover:bg-fill-neutral-subtle-hover is-hover:text-icon-secondary',
        // The tag's hover shows the close's hover background.
        'group-hover/tag:bg-fill-neutral-subtle-hover group-hover/tag:text-icon-secondary',
        'is-focus:shadow-focus-default',
        'is-disabled:cursor-not-allowed is-disabled:bg-fill-none is-disabled:text-icon-disabled',
        'group-data-[disabled=true]/tag:bg-fill-none group-data-[disabled=true]/tag:text-icon-disabled',
        "pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:after:inset-[min(0px,calc((100%_-_var(--size-touch-min))/2))]",
      )}
      {...forceAttr(forceState)}
    >
      <Icon name="general/x" size={size === 'lg' ? 'sm' : 'xs'} />
    </button>
  );
}

/** `.Main/Tag count` — compact trailing count. Private. */
function TagCount({ children }: { children: ReactNode }) {
  return (
    <span data-anatomy="count" className="inline-flex shrink-0 items-center rounded-xs bg-fill-neutral-subtle px-(--space-xs) type-body-xs-medium text-text-secondary group-data-[disabled=true]/tag:text-text-disabled">
      {children}
    </span>
  );
}
