import type { CSSProperties, SVGProps } from 'react';
import { siApple, siFacebook, siGithub, siGitlab, siGoogle, siX, type SimpleIcon } from 'simple-icons';
import { cn } from '@/lib/cn';

/**
 * 1.8 Brand assets — `Social mark` (Provider · Mono).
 * Third-party marks come from `simple-icons` (CC0 paths, official brand colours) and are drawn
 * as-is in a 24-unit box: never redrawn, stretched or rebuilt from text.
 * `mono` is the single-colour version: it follows `currentColor`, so the parent sets the icon role
 * (`color/icon/secondary`, `color/icon/primary` on hover). Otherwise the provider's own colour is used —
 * brand colours are allowed here only, because the artwork belongs to its owner.
 */
export type SocialProvider = 'google' | 'apple' | 'github' | 'facebook' | 'x' | 'gitlab';

/** Providers in initiation order; the first one is the default everywhere. */
export const socialProviders = ['google', 'apple', 'github', 'facebook', 'x', 'gitlab'] as const satisfies readonly SocialProvider[];

const marks: Record<SocialProvider, SimpleIcon> = {
  google: siGoogle,
  apple: siApple,
  github: siGithub,
  facebook: siFacebook,
  x: siX,
  gitlab: siGitlab,
};

/** The provider's name exactly as they write it. */
export const socialProviderName: Record<SocialProvider, string> = Object.fromEntries(
  socialProviders.map((p) => [p, marks[p].title]),
) as Record<SocialProvider, string>;

/**
 * Near-black brand colours (Apple, X, GitHub) would disappear on a dark surface. Their owners allow
 * the mark in black or white, so the full-colour mark follows `color/icon/primary` for them.
 */
const isNearBlack = (hex: string) => {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40;
};

/** Mark sizes follow `size/icon/*`. */
export type SocialMarkSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SocialMarkProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'children'> {
  /** Figma `Provider`. */
  provider: SocialProvider;
  /** Figma `Mono`: single-colour mark in `currentColor`. */
  mono?: boolean;
  /** `size/icon/{size}`; default `md`. */
  size?: SocialMarkSize;
  /** Accessible name. Defaults to the provider name; pass `""` when a visible label names it (decorative). */
  alt?: string;
}

export function SocialMark({ provider, mono = false, size = 'md', alt, className, style, ...rest }: SocialMarkProps) {
  const mark = marks[provider];
  const name = alt ?? mark.title;
  const adaptive = !mono && isNearBlack(mark.hex);
  const box: CSSProperties = {
    width: `var(--size-icon-${size})`,
    height: `var(--size-icon-${size})`,
    // Provider colour from the mark's own data — the only place a brand hex is allowed.
    ...(!mono && !adaptive ? { color: `#${mark.hex}` } : {}),
    ...style,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role={name ? 'img' : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      focusable="false"
      className={cn('shrink-0', adaptive && 'text-icon-primary', className)}
      style={box}
      {...rest}
    >
      <path d={mark.path} />
    </svg>
  );
}
