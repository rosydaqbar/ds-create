import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from '@/icons';

/**
 * 2.19 Featured icon — an icon in a shaped container that anchors a block of content.
 * Figma: `Featured icon` · Type × Size × Emphasis × Tone (80 variants) · Icon.
 * The icon keeps its standard box; only the container grows with Size.
 */
export type FeaturedIconTone = 'neutral' | 'brand' | 'danger' | 'warning' | 'success';

export interface FeaturedIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Figma `Type`. `square` exists only with `emphasis="tertiary"`. */
  type?: 'circle' | 'square';
  /** Figma `Size`: container 32 / 40 / 48 / 56. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Figma `Emphasis`: solid, subtle fill, or outline (rings / bordered square). */
  emphasis?: 'primary' | 'secondary' | 'tertiary';
  /** Figma `Tone`: the message's intent. */
  tone?: FeaturedIconTone;
  /** Figma `Icon` (instance swap). */
  icon?: IconName;
  /** Accessible name, only when the icon is the only signal of intent ("Warning"). Otherwise decorative. */
  label?: string;
}

const box = {
  sm: 'size-(--featured-icon-size-sm)',
  md: 'size-(--featured-icon-size-md)',
  lg: 'size-(--featured-icon-size-lg)',
  xl: 'size-(--featured-icon-size-xl)',
} as const;

const iconSize = { sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' } as const;
const xlIcon: CSSProperties = { width: 'var(--featured-icon-icon-xl)', height: 'var(--featured-icon-icon-xl)' };

const solid: Record<FeaturedIconTone, string> = {
  // Neutral solid is the inverse surface (light in Dark), so its icon pairs with icon/inverse, not on-solid.
  neutral: 'bg-fill-neutral-solid text-icon-inverse',
  brand: 'bg-fill-brand-solid text-icon-on-solid',
  danger: 'bg-fill-danger-solid text-icon-on-solid',
  warning: 'bg-fill-warning-solid text-icon-on-solid',
  success: 'bg-fill-success-solid text-icon-on-solid',
};
const subtle: Record<FeaturedIconTone, string> = {
  neutral: 'bg-fill-neutral-subtle text-icon-secondary',
  brand: 'bg-fill-brand-subtle text-icon-brand',
  danger: 'bg-fill-danger-subtle text-icon-danger',
  warning: 'bg-fill-warning-subtle text-icon-warning',
  success: 'bg-fill-success-subtle text-icon-success',
};
const iconTone: Record<FeaturedIconTone, string> = {
  neutral: 'text-icon-secondary',
  brand: 'text-icon-brand',
  danger: 'text-icon-danger',
  warning: 'text-icon-warning',
  success: 'text-icon-success',
};
const outerRing: Record<FeaturedIconTone, string> = {
  neutral: 'border-border-subtle',
  brand: 'border-border-brand-subtle',
  danger: 'border-border-danger-subtle',
  warning: 'border-border-warning-subtle',
  success: 'border-border-success-subtle',
};
const innerRing: Record<FeaturedIconTone, string> = {
  neutral: 'border-border-default',
  brand: 'border-border-brand',
  danger: 'border-border-danger',
  warning: 'border-border-warning',
  success: 'border-border-success',
};

export function FeaturedIcon({
  type = 'circle',
  size = 'md',
  emphasis = 'secondary',
  tone = 'brand',
  icon = 'general/placeholder',
  label,
  className,
  ...rest
}: FeaturedIconProps) {
  const e = type === 'square' ? 'tertiary' : emphasis;
  const glyph = <Icon name={icon} size={iconSize[size]} style={size === 'xl' ? xlIcon : undefined} className="relative" />;
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };

  if (type === 'square') {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center border-(length:--border-width-default) border-border-default bg-surface-base shadow-raised',
          size === 'sm' || size === 'md' ? 'rounded-control' : 'rounded-surface',
          box[size],
          iconTone[tone],
          className,
        )}
        {...a11y}
        {...rest}
      >
        {glyph}
      </span>
    );
  }

  if (e === 'tertiary') {
    return (
      <span className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full', box[size], iconTone[tone], className)} {...a11y} {...rest}>
        <span className={cn('absolute inset-0 rounded-full border-(length:--border-width-strong)', outerRing[tone])} />
        <span className={cn('absolute inset-xs rounded-full border-(length:--border-width-strong)', innerRing[tone])} />
        {glyph}
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', box[size], e === 'primary' ? solid[tone] : subtle[tone], className)}
      {...a11y}
      {...rest}
    >
      {glyph}
    </span>
  );
}
