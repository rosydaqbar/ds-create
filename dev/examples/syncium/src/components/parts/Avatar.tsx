import { useState, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconSize } from '@/icons';

/**
 * 2.6 Avatar — one person or organisation.
 * Figma: `Avatar` · Size × Type (21 variants) · `Show ring` · `Show indicator` (+ nested indicator type).
 * Figma: `Profile photo` · Size × Type (9 variants) · `Show verified`.
 * The root is always square with a full radius; indicators overlay the edge and never change the size.
 */
export type AvatarSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarType = 'image' | 'initials' | 'icon';
export type AvatarIndicator = 'offline' | 'online' | 'verified' | 'company' | 'count';

const side: Record<AvatarSize, string> = {
  '2xs': 'size-(--size-avatar-2xs)',
  xs: 'size-(--size-avatar-xs)',
  sm: 'size-(--size-avatar-sm)',
  md: 'size-(--size-avatar-md)',
  lg: 'size-(--size-avatar-lg)',
  xl: 'size-(--size-avatar-xl)',
  '2xl': 'size-(--size-avatar-2xl)',
};
/** 2xs is too small for letters: initials fall back to the placeholder icon. */
const initialsStyle: Record<AvatarSize, string> = {
  '2xs': 'type-body-xs-semibold',
  xs: 'type-body-xs-semibold',
  sm: 'type-body-sm-semibold',
  md: 'type-body-md-semibold',
  lg: 'type-body-lg-semibold',
  xl: 'type-body-xl-semibold',
  '2xl': 'type-heading-xs-semibold',
};
const placeholderIcon: Record<AvatarSize, IconSize> = { '2xs': 'xs', xs: 'sm', sm: 'md', md: 'lg', lg: 'lg', xl: 'xl', '2xl': 'xl' };
/** Presence dot: size/indicator/{step}. */
const dotSize: Record<AvatarSize, string> = {
  '2xs': 'var(--size-indicator-xs)',
  xs: 'var(--size-indicator-xs)',
  sm: 'var(--size-indicator-sm)',
  md: 'var(--size-indicator-md)',
  lg: 'var(--size-indicator-lg)',
  xl: 'var(--size-indicator-lg)',
  '2xl': 'var(--size-indicator-lg)',
};
/** Verified / company / count mark: 8 · 10 · 12 · 14 · 16 · 18 · 20 (tokens where a step exists). */
const markSize: Record<AvatarSize, string> = {
  '2xs': 'var(--size-indicator-sm)',
  xs: 'var(--size-indicator-md)',
  sm: 'var(--size-icon-xs)',
  md: '0.875rem',
  lg: 'var(--size-icon-sm)',
  xl: '1.125rem',
  '2xl': 'var(--size-icon-md)',
};
/** Ring: border/width/strong up to lg, 3 above. */
const ringWidth = (s: AvatarSize) =>
  s === 'xl' || s === '2xl' ? 'calc(var(--border-width-strong) + var(--border-width-default))' : 'var(--border-width-strong)';

/** One accessible name for the avatar and its indicator ("Olivia Rhye, online"). `alt=""` hides a decorative repeat. */
function accessibleName(name: string | undefined, indicator?: AvatarIndicator, count?: number, companyName?: string) {
  if (name === '') return '';
  const ind =
    indicator === 'count' ? `${count ?? 0} unread` : indicator === 'company' ? (companyName ?? 'company') : indicator;
  return [name, ind].filter(Boolean).join(', ');
}

/** `.Main/Avatar indicator` — overlay mark, bottom-right, sized to the avatar. */
function AvatarIndicatorMark({
  type,
  size,
  count,
  companySrc,
}: {
  type: AvatarIndicator;
  size: AvatarSize;
  count?: number;
  companySrc?: string;
}) {
  const ring = '0 0 0 var(--border-width-strong) var(--color-surface-base)';
  if (type === 'online' || type === 'offline') {
    const d = dotSize[size];
    return (
      <span
        data-anatomy="indicator"
        className={cn('absolute bottom-0 right-0 rounded-full', type === 'online' ? 'bg-icon-success' : 'bg-icon-disabled')}
        style={{ width: d, height: d, boxShadow: ring }}
      />
    );
  }
  const m = markSize[size];
  if (type === 'verified') {
    return (
      <span data-anatomy="indicator" className="absolute -bottom-[2%] -right-[2%] inline-flex rounded-full bg-surface-base text-icon-brand" style={{ width: m, height: m }}>
        <Icon name="alerts/verified" style={{ width: '100%', height: '100%' }} />
      </span>
    );
  }
  if (type === 'company') {
    return (
      <span
        data-anatomy="indicator"
        className="absolute bottom-0 right-0 inline-flex items-center justify-center overflow-hidden rounded-xs bg-surface-base text-icon-tertiary"
        style={{ width: m, height: m, boxShadow: ring }}
      >
        {companySrc ? (
          <img src={companySrc} alt="" className="size-full object-contain" />
        ) : (
          <Icon name="shapes/hexagon" style={{ width: '75%', height: '75%' }} />
        )}
      </span>
    );
  }
  const n = count ?? 0;
  return (
    <span
      data-anatomy="indicator"
      className="absolute -bottom-[4%] -right-[10%] inline-flex items-center justify-center rounded-full bg-fill-danger-solid px-(--space-xxs) font-ui font-semibold text-text-on-solid"
      style={{ minWidth: m, height: m, fontSize: `calc(${m} * 0.7)`, lineHeight: 1, boxShadow: ring }}
    >
      {n > 99 ? '99+' : n}
    </span>
  );
}

/** Shared content: image, initials or placeholder icon, centred and clipped. */
function AvatarContent({
  type,
  src,
  alt,
  initials,
  initialsClass,
  iconSize,
  iconStyle,
}: {
  type: AvatarType;
  src?: string;
  alt?: string;
  initials?: string;
  initialsClass: string;
  iconSize?: IconSize;
  iconStyle?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = type === 'image' && src && !failed;
  const resolved: AvatarType = showImage ? 'image' : type === 'image' ? (initials ? 'initials' : 'icon') : type;
  if (resolved === 'image') return <img data-anatomy="content" src={src} alt={alt ?? ''} onError={() => setFailed(true)} className="size-full object-cover" />;
  if (resolved === 'initials')
    return (
      <span aria-hidden data-anatomy="content" className={cn('select-none uppercase text-avatar-placeholder-text', initialsClass)}>
        {initials}
      </span>
    );
  return <Icon data-anatomy="content" name="users/user" size={iconSize} style={iconStyle} className="text-avatar-placeholder-icon" />;
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Figma `Size`. */
  size?: AvatarSize;
  /** Figma `Type`. `image` falls back to initials (or the icon) when there is no `src` or it fails to load. */
  type?: AvatarType;
  /** Figma `Image`: the photo URL (`type="image"`). */
  src?: string;
  /** Accessible name — the person's name. Pass `""` when the name is already visible next to the avatar. */
  alt?: string;
  /** Figma `Initials`. */
  initials?: string;
  /** Figma `Show ring`: separates overlapping avatars and photos from same-coloured backgrounds. */
  showRing?: boolean;
  /** Figma `Show indicator` + the nested `.Main/Avatar indicator` type. */
  indicator?: AvatarIndicator;
  /** `indicator="count"`: the number; above 99 shows "99+". */
  count?: number;
  /** `indicator="company"`: the organisation's logo. */
  companySrc?: string;
  /** `indicator="company"`: the organisation's name. */
  companyName?: string;
}

export function Avatar({
  size = 'md',
  type = 'image',
  src,
  alt,
  initials,
  showRing = false,
  indicator,
  count,
  companySrc,
  companyName,
  className,
  ...rest
}: AvatarProps) {
  const label = accessibleName(alt ?? initials, indicator, count, companyName);
  return (
    <span
      data-anatomy="root"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-flex shrink-0 rounded-full', side[size], className)}
      {...rest}
    >
      <span
        data-anatomy="surface"
        className="flex size-full items-center justify-center overflow-hidden rounded-full bg-avatar-placeholder-fill">
        <AvatarContent type={size === '2xs' && type === 'initials' ? 'icon' : type} src={src} alt="" initials={size === '2xs' ? undefined : initials} initialsClass={initialsStyle[size]} iconSize={placeholderIcon[size]} />
      </span>
      {/* Inner contrast border: keeps photos and placeholders from bleeding into same-coloured surfaces. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-(length:--border-width-default) border-border-subtle" />
      {showRing && (
        <span aria-hidden data-anatomy="ring" className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: `inset 0 0 0 ${ringWidth(size)} var(--color-surface-base)` }} />
      )}
      {indicator && <AvatarIndicatorMark type={indicator} size={size} count={count} companySrc={companySrc} />}
    </span>
  );
}

/* ---------- Profile photo ---------- */

const profileSide = { sm: 'size-(--profile-photo-size-sm)', md: 'size-(--profile-photo-size-md)', lg: 'size-(--profile-photo-size-lg)' } as const;
const profileRing = { sm: 'p-(--profile-photo-ring-sm)', md: 'p-(--profile-photo-ring-md)', lg: 'p-(--profile-photo-ring-lg)' } as const;
const profileInitials = { sm: 'type-heading-md-semibold', md: 'type-heading-lg-semibold', lg: 'type-display-md-semibold' } as const;
const profileVerified = { sm: 'var(--size-icon-md)', md: 'var(--size-icon-lg)', lg: 'var(--size-icon-xl)' } as const;

export interface ProfilePhotoProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Figma `Size`. */
  size?: 'sm' | 'md' | 'lg';
  /** Figma `Type`. */
  type?: AvatarType;
  /** Figma `Image`. */
  src?: string;
  /** Accessible name — the person's name. */
  alt?: string;
  /** Figma `Initials`. */
  initials?: string;
  /** Figma `Show verified`. */
  showVerified?: boolean;
}

export function ProfilePhoto({ size = 'md', type = 'image', src, alt, initials, showVerified = false, className, ...rest }: ProfilePhotoProps) {
  const label = accessibleName(alt ?? initials, showVerified ? 'verified' : undefined);
  const v = profileVerified[size];
  return (
    <span
      data-anatomy="profile-photo"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-flex shrink-0', profileSide[size], className)}
      {...rest}
    >
      {/* Outer wrapper: the ring. */}
      <span data-anatomy="outer-wrapper" className={cn('flex size-full rounded-full bg-surface-base shadow-raised', profileRing[size])}>
        {/* Avatar wrapper: clip + inner contrast border. */}
        <span data-anatomy="avatar-wrapper" className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-avatar-placeholder-fill">
          <AvatarContent type={type} src={src} alt="" initials={initials} initialsClass={profileInitials[size]} iconStyle={{ width: '40%', height: '40%' }} />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-(length:--border-width-default) border-border-subtle" />
        </span>
      </span>
      {showVerified && (
        <span data-anatomy="verified" className="absolute bottom-[4%] right-[4%] inline-flex rounded-full bg-surface-base text-icon-brand" style={{ width: v, height: v }}>
          <Icon name="alerts/verified" style={{ width: '100%', height: '100%' }} />
        </span>
      )}
    </span>
  );
}
