import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Badge } from '../parts/Badge';

/**
 * 3.8 Badge group — a Badge followed by a short message, for announcements and update notices.
 * Figma: `Badge group` · Size × Placement × Type × Tone × State (120 variants).
 * The badge is the real Badge (2.4); the whole group is one link (`href`) or one button.
 */
export type BadgeGroupSize = 'md' | 'lg';
export type BadgeGroupPlacement = 'left' | 'right';
export type BadgeGroupType = 'pill' | 'outline';
export type BadgeGroupTone = 'neutral' | 'brand' | 'danger' | 'warning' | 'success';

export const badgeGroupTones = ['neutral', 'brand', 'danger', 'warning', 'success'] as const satisfies readonly BadgeGroupTone[];

/** `Type=pill`: tinted container per tone, hover moves to the fill's hover child. */
const pillTone: Record<BadgeGroupTone, { root: string; icon: string }> = {
  neutral: { root: 'bg-fill-neutral-subtle border-border-subtle text-text-secondary is-hover:bg-fill-neutral-subtle-hover', icon: 'text-icon-tertiary' },
  brand: { root: 'bg-fill-brand-subtle border-border-brand-subtle text-text-brand is-hover:bg-fill-brand-subtle-hover', icon: 'text-icon-brand' },
  danger: { root: 'bg-fill-danger-subtle border-border-danger-subtle text-text-danger is-hover:bg-fill-danger-subtle-hover', icon: 'text-icon-danger' },
  warning: { root: 'bg-fill-warning-subtle border-border-warning-subtle text-text-warning is-hover:bg-fill-warning-subtle-hover', icon: 'text-icon-warning' },
  success: { root: 'bg-fill-success-subtle border-border-success-subtle text-text-success is-hover:bg-fill-success-subtle-hover', icon: 'text-icon-success' },
};
/** `Type=outline`: neutral surface with a border in every tone; the Badge carries the tone. */
const outlineRoot = { root: 'bg-surface-base border-border-default text-text-secondary is-hover:bg-surface-base-hover', icon: 'text-icon-tertiary' };

/** Padding minus the border, so sizes match Figma's inside stroke. */
const padBadgeStart = {
  md: 'pl-[calc(var(--badge-group-padding-badge-md)_-_var(--border-width-default))]',
  lg: 'pl-[calc(var(--badge-group-padding-badge-lg)_-_var(--border-width-default))]',
};
const padBadgeEnd = {
  md: 'pr-[calc(var(--badge-group-padding-badge-md)_-_var(--border-width-default))]',
  lg: 'pr-[calc(var(--badge-group-padding-badge-lg)_-_var(--border-width-default))]',
};
const padMessageStart = {
  md: 'pl-[calc(var(--badge-group-padding-message-md)_-_var(--border-width-default))]',
  lg: 'pl-[calc(var(--badge-group-padding-message-lg)_-_var(--border-width-default))]',
};
const padMessageEnd = {
  md: 'pr-[calc(var(--badge-group-padding-message-md)_-_var(--border-width-default))]',
  lg: 'pr-[calc(var(--badge-group-padding-message-lg)_-_var(--border-width-default))]',
};
/** Group `md` → Badge `sm`; group `lg` → Badge `md`. */
const badgeSize = { md: 'sm', lg: 'md' } as const;

type RootAttrs = Omit<AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'>;

export interface BadgeGroupProps extends RootAttrs {
  /** Figma `Size`. */
  size?: BadgeGroupSize;
  /** Figma `Placement`: the badge before (`left`) or after (`right`) the message. */
  placement?: BadgeGroupPlacement;
  /** Figma `Type`: tinted pill, or neutral surface with a border. The inner Badge takes the opposite type. */
  type?: BadgeGroupType;
  /** Figma `Tone`: colours of the container and the badge. */
  tone?: BadgeGroupTone;
  /** Figma `Badge label`: one or two words ("New", "Beta", "v2.4"). */
  badgeLabel?: string;
  /** Figma `Message`: one short sentence, single line, no full stop. */
  message?: ReactNode;
  /** Figma `Show trailing icon` + `Trailing icon`. Default `arrows/arrow-right`; `null` hides it. */
  trailingIcon?: IconName | null;
  /** Link target. With `href` the group is an `<a>`; without it, a `<button>`. */
  href?: string;
  /** Documentation only: render a Figma `State` statically. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
}

export function BadgeGroup({
  size = 'md',
  placement = 'left',
  type = 'pill',
  tone = 'brand',
  badgeLabel = 'New feature',
  message = 'We’ve just released a new update',
  trailingIcon = 'arrows/arrow-right',
  href,
  forceState,
  className,
  ...rest
}: BadgeGroupProps) {
  const t = type === 'pill' ? pillTone[tone] : outlineRoot;
  const left = placement === 'left';
  // One accessible name made of the badge label and the message: "New: Dark mode is here".
  const name = rest['aria-label'] ?? (typeof message === 'string' ? `${badgeLabel}: ${message}` : undefined);

  const badge = <Badge size={badgeSize[size]} tone={tone} type={type === 'pill' ? 'outline' : 'pill'} label={badgeLabel} />;
  const content = (
    <span className="inline-flex items-center gap-xs">
      <span className="type-body-sm-medium whitespace-nowrap">{message}</span>
      {trailingIcon && <Icon name={trailingIcon} size="sm" className={t.icon} />}
    </span>
  );

  const classes = cn(
    'inline-flex w-fit max-w-full shrink-0 items-center gap-md whitespace-nowrap no-underline outline-none cursor-pointer select-none',
    'border-(length:--border-width-default) py-[calc(var(--space-xs)_-_var(--border-width-default))]',
    'transition-[background-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
    type === 'pill' ? 'rounded-full' : 'rounded-sm',
    t.root,
    tone === 'danger' ? 'is-focus:shadow-focus-danger' : 'is-focus:shadow-focus-default',
    left ? [padBadgeStart[size], padMessageEnd[size]] : [padMessageStart[size], padBadgeEnd[size]],
    className,
  );
  const children = left ? (
    <>
      {badge}
      {content}
    </>
  ) : (
    <>
      {content}
      {badge}
    </>
  );

  if (href != null) {
    return (
      <a href={href} aria-label={name} className={classes} {...forceAttr(forceState)} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" aria-label={name} className={classes} {...forceAttr(forceState)} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
