import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { Icon, type IconName, type IconSize } from '@/icons';
import { Flag } from '../assets/Flag';
import { Avatar } from './Avatar';

/**
 * 2.4 Badge — compact, read-only labels for status, counts, categories and metadata.
 * Figma: `Badge` · Size × Type × Tone × Icon only (234 variants) + `.Main/Badge close`.
 * Leading visual: dot, flag, avatar or icon (one at a time). Trailing: icon or close (one at a time).
 */
export type BadgeTone =
  | 'neutral' | 'brand' | 'danger' | 'warning' | 'success' | 'info'
  | 'slate' | 'sky' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
export type BadgeType = 'pill' | 'rounded' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export const badgeSemanticTones = ['neutral', 'brand', 'danger', 'warning', 'success', 'info'] as const;
export const badgeCategoryTones = ['slate', 'sky', 'blue', 'indigo', 'purple', 'pink', 'orange'] as const;
export const badgeTones: readonly BadgeTone[] = [...badgeSemanticTones, ...badgeCategoryTones];

/**
 * Per tone: filled container (pill, rounded), icon / dot colour, and the close hover tint.
 * Category families have no hover child, so their close hover uses the neutral tint.
 */
const tone: Record<BadgeTone, { fill: string; icon: string; dot: string; closeHover: string }> = {
  neutral: { fill: 'bg-fill-neutral-subtle border-border-subtle text-text-secondary', icon: 'text-icon-tertiary', dot: 'bg-icon-tertiary', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
  brand: { fill: 'bg-fill-brand-subtle border-border-brand-subtle text-text-brand', icon: 'text-icon-brand', dot: 'bg-icon-brand', closeHover: 'is-hover:bg-fill-brand-subtle-hover' },
  danger: { fill: 'bg-fill-danger-subtle border-border-danger-subtle text-text-danger', icon: 'text-icon-danger', dot: 'bg-icon-danger', closeHover: 'is-hover:bg-fill-danger-subtle-hover' },
  warning: { fill: 'bg-fill-warning-subtle border-border-warning-subtle text-text-warning', icon: 'text-icon-warning', dot: 'bg-icon-warning', closeHover: 'is-hover:bg-fill-warning-subtle-hover' },
  success: { fill: 'bg-fill-success-subtle border-border-success-subtle text-text-success', icon: 'text-icon-success', dot: 'bg-icon-success', closeHover: 'is-hover:bg-fill-success-subtle-hover' },
  info: { fill: 'bg-fill-info-subtle border-border-info-subtle text-text-info', icon: 'text-icon-info', dot: 'bg-icon-info', closeHover: 'is-hover:bg-fill-info-subtle-hover' },
  slate: { fill: 'bg-category-slate-subtle border-category-slate-border text-category-slate-text', icon: 'text-category-slate-solid', dot: 'bg-category-slate-solid', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
  sky: { fill: 'bg-category-sky-subtle border-category-sky-border text-category-sky-text', icon: 'text-category-sky-solid', dot: 'bg-category-sky-solid', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
  blue: { fill: 'bg-category-blue-subtle border-category-blue-border text-category-blue-text', icon: 'text-category-blue-solid', dot: 'bg-category-blue-solid', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
  indigo: { fill: 'bg-category-indigo-subtle border-category-indigo-border text-category-indigo-text', icon: 'text-category-indigo-solid', dot: 'bg-category-indigo-solid', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
  purple: { fill: 'bg-category-purple-subtle border-category-purple-border text-category-purple-text', icon: 'text-category-purple-solid', dot: 'bg-category-purple-solid', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
  pink: { fill: 'bg-category-pink-subtle border-category-pink-border text-category-pink-text', icon: 'text-category-pink-solid', dot: 'bg-category-pink-solid', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
  orange: { fill: 'bg-category-orange-subtle border-category-orange-border text-category-orange-text', icon: 'text-category-orange-solid', dot: 'bg-category-orange-solid', closeHover: 'is-hover:bg-fill-neutral-subtle-hover' },
};
const outline = 'bg-surface-base border-border-default text-text-secondary';

/** Padding-y is reduced by the border so heights match Figma's inside stroke (22 · 24 · 28). */
const sizeClass: Record<BadgeSize, string> = {
  sm: 'py-[calc(var(--space-xxs)_-_var(--border-width-default))] gap-(--space-xs) type-body-xs-medium',
  md: 'py-[calc(var(--space-xxs)_-_var(--border-width-default))] gap-(--space-xs) type-body-sm-medium',
  lg: 'py-[calc(var(--space-xs)_-_var(--border-width-default))] gap-(--space-xs) type-body-sm-medium',
};
const padStart = { sm: 'pl-(--badge-padding-x-sm)', md: 'pl-(--badge-padding-x-md)', lg: 'pl-(--badge-padding-x-lg)' };
const padEnd = { sm: 'pr-(--badge-padding-x-sm)', md: 'pr-(--badge-padding-x-md)', lg: 'pr-(--badge-padding-x-lg)' };
const padStartTight = { sm: 'pl-(--badge-padding-x-tight-sm)', md: 'pl-(--badge-padding-x-tight-md)', lg: 'pl-(--badge-padding-x-tight-lg)' };
const padEndTight = { sm: 'pr-(--badge-padding-x-tight-sm)', md: 'pr-(--badge-padding-x-tight-md)', lg: 'pr-(--badge-padding-x-tight-lg)' };
/** Icon only: equal padding on all sides (the vertical step). */
const padIconOnly = {
  sm: 'px-[calc(var(--space-xxs)_-_var(--border-width-default))]',
  md: 'px-[calc(var(--space-xxs)_-_var(--border-width-default))]',
  lg: 'px-[calc(var(--space-xs)_-_var(--border-width-default))]',
};
const iconSize: Record<BadgeSize, IconSize> = { sm: 'xs', md: 'xs', lg: 'sm' };
const dotSize = { sm: 'size-(--size-indicator-xs)', md: 'size-(--size-indicator-xs)', lg: 'size-(--size-indicator-sm)' };

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Figma `Size`. */
  size?: BadgeSize;
  /** Figma `Type`. */
  type?: BadgeType;
  /** Figma `Tone`: semantic tones carry meaning; category families only separate groups. */
  tone?: BadgeTone;
  /** Figma `Icon only`: one icon (`leadingIcon`), no visible label; `label` becomes the accessible name. */
  iconOnly?: boolean;
  /** Figma `Label`. */
  label?: ReactNode;
  /** Figma `Show dot`. */
  showDot?: boolean;
  /** Figma `Show flag` + `Flag`: ISO country code, e.g. `fr`. */
  flag?: string;
  /** Figma `Show avatar`: the person shown (2.6 Avatar, Size=2xs). */
  avatar?: { src?: string; initials?: string };
  /** Figma `Show leading icon` + `Leading icon`. Also the icon of `iconOnly`. */
  leadingIcon?: IconName;
  /** Figma `Show trailing icon` + `Trailing icon`. */
  trailingIcon?: IconName;
  /** Figma `Show close`: the badge is removable content (an applied filter). */
  showClose?: boolean;
  /** Close action. */
  onClose?: () => void;
  /** Accessible name of the close; default "Remove {label}". */
  closeLabel?: string;
  /** Documentation only: pin the close part's hover state. */
  forceCloseState?: Extract<ForcedState, 'hover' | 'focus'>;
}

export function Badge({
  size = 'md',
  type = 'pill',
  tone: t = 'neutral',
  iconOnly = false,
  label = 'Label',
  showDot = false,
  flag,
  avatar,
  leadingIcon,
  trailingIcon,
  showClose = false,
  onClose,
  closeLabel,
  forceCloseState,
  className,
  ...rest
}: BadgeProps) {
  const tk = tone[t];
  const leadingVisual = !iconOnly && (showDot || flag || avatar || leadingIcon);
  const trailingTight = !iconOnly && showClose;
  const text = typeof label === 'string' ? label : undefined;
  return (
    <span
      role={iconOnly && text ? 'img' : undefined}
      aria-label={iconOnly ? text : undefined}
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap border-(length:--border-width-default)',
        type === 'pill' ? 'rounded-full' : 'rounded-sm',
        type === 'outline' ? outline : tk.fill,
        sizeClass[size],
        iconOnly ? padIconOnly[size] : [leadingVisual ? padStartTight[size] : padStart[size], trailingTight ? padEndTight[size] : padEnd[size]],
        className,
      )}
      {...rest}
    >
      {iconOnly ? (
        <span aria-hidden className="flex size-[1lh] items-center justify-center">
          <Icon name={leadingIcon ?? 'arrows/arrow-up'} size={iconSize[size]} className={tk.icon} />
        </span>
      ) : (
        <>
          {showDot ? (
            <span aria-hidden className={cn('shrink-0 rounded-full', dotSize[size], tk.dot)} />
          ) : flag ? (
            <Flag country={flag} size="sm" alt="" />
          ) : avatar ? (
            <Avatar size="2xs" type={avatar.src ? 'image' : avatar.initials ? 'initials' : 'icon'} src={avatar.src} initials={avatar.initials} alt="" />
          ) : leadingIcon ? (
            <Icon name={leadingIcon} size={iconSize[size]} className={tk.icon} />
          ) : null}
          <span>{label}</span>
          {showClose ? (
            <BadgeClose
              type={type}
              iconClass={tk.icon}
              hoverClass={tk.closeHover}
              label={closeLabel ?? `Remove ${text ?? ''}`.trim()}
              onClick={onClose}
              forceState={forceCloseState}
            />
          ) : trailingIcon ? (
            <Icon name={trailingIcon} size={iconSize[size]} className={tk.icon} />
          ) : null}
        </>
      )}
    </span>
  );
}

/** `.Main/Badge close` — one dismiss affordance for every type and tone. Private. */
function BadgeClose({
  type,
  iconClass,
  hoverClass,
  label,
  onClick,
  forceState,
}: {
  type: BadgeType;
  iconClass: string;
  hoverClass: string;
  label: string;
  onClick?: () => void;
  forceState?: ForcedState;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center p-(--space-xxs) outline-none',
        'transition-[background-color,box-shadow] duration-(--motion-duration-fast) ease-standard is-focus:shadow-focus-default',
        "pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:after:inset-[min(0px,calc((100%_-_var(--size-touch-min))/2))]",
        type === 'pill' ? 'rounded-full' : 'rounded-xs',
        iconClass,
        hoverClass,
      )}
      {...forceAttr(forceState)}
    >
      <Icon name="general/x" size="xs" />
    </button>
  );
}
