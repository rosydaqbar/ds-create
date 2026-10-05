import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * 1.8 Brand assets — `Flag` (Country = ISO 3166 two-letter code, lowercase).
 * Renders `public/brand/flags/{code}.svg` when the build supplies it. Without the file, a
 * neutral round placeholder shows the uppercase code, so layouts never break.
 * Flags are supplied by the user (1.8); the template ships none.
 */
const supplied = new Set(
  Object.keys(import.meta.glob('/public/brand/flags/*.svg', { query: '?url', import: 'default' })).map((p) =>
    p.replace(/^.*\/([a-z]{2}(?:-[a-z0-9]+)?)\.svg$/i, '$1').toLowerCase(),
  ),
);

let regionNames: Intl.DisplayNames | undefined;
const countryName = (code: string) => {
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

/** Flag sizes follow `size/icon/*`. */
export type FlagSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FlagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Figma `Country`: ISO 3166 two-letter code, e.g. `fr`. */
  country: string;
  /** `size/icon/{size}`; default `md`. */
  size?: FlagSize;
  /** Accessible name. Defaults to the country name; pass `""` when a visible label names it. */
  alt?: string;
}

export function Flag({ country, size = 'md', alt, className, style, ...rest }: FlagProps) {
  const code = country.toLowerCase();
  const name = alt ?? countryName(code);
  const box: CSSProperties = { width: `var(--size-icon-${size})`, height: `var(--size-icon-${size})`, ...style };
  const a11y = name ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true as const };
  if (supplied.has(code)) {
    return (
      <span className={cn('inline-flex shrink-0 overflow-hidden rounded-full', className)} style={box} {...a11y} {...rest}>
        <img src={`${import.meta.env.BASE_URL}brand/flags/${code}.svg`} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-(length:--border-width-default) border-border-subtle bg-fill-neutral-subtle font-ui font-semibold uppercase leading-none text-text-tertiary',
        className,
      )}
      style={{ fontSize: `calc(var(--size-icon-${size}) * 0.4)`, ...box }}
      title={name || undefined}
      {...a11y}
      {...rest}
    >
      {code.slice(0, 2)}
    </span>
  );
}
