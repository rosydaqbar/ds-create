import { cva, type VariantProps } from 'class-variance-authority';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForceStateProps } from '@/lib/types';
import { Icon, type IconName } from '@/icons';

/**
 * 2.3 Link — text that navigates.
 * Figma: `Link` · Type × Size × Tone × State (60 variants).
 * Inline links are always underlined and carry no icons; standalone links underline on hover.
 */
export const linkVariants = cva(
  [
    'rounded-xs outline-none cursor-pointer',
    'transition-[color,box-shadow,text-decoration-color] duration-(--motion-duration-fast) ease-standard',
    'is-focus:shadow-focus-default',
    'is-disabled:cursor-not-allowed is-disabled:text-text-disabled is-disabled:shadow-none',
  ],
  {
    variants: {
      type: {
        inline: 'inline underline decoration-from-font',
        standalone:
          'relative inline-flex items-center no-underline is-hover:underline is-pressed:underline is-disabled:no-underline ' +
          "pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:after:inset-x-0 pointer-coarse:after:inset-y-[min(0px,calc((100%_-_var(--size-touch-min))/2))]",
      },
      size: { sm: '', md: '', lg: '' },
      tone: {
        brand: 'text-text-brand is-hover:text-text-brand-hover is-pressed:text-text-brand-pressed',
        neutral: 'text-text-secondary is-hover:text-text-primary is-pressed:text-text-primary',
      },
    },
    compoundVariants: [
      { type: 'inline', size: 'sm', className: 'type-body-sm-regular' },
      { type: 'inline', size: 'md', className: 'type-body-md-regular' },
      { type: 'inline', size: 'lg', className: 'type-body-lg-regular' },
      { type: 'standalone', size: 'sm', className: 'type-body-sm-semibold gap-(--link-gap-sm)' },
      { type: 'standalone', size: 'md', className: 'type-body-md-semibold gap-(--link-gap-md)' },
      { type: 'standalone', size: 'lg', className: 'type-body-lg-semibold gap-(--link-gap-lg)' },
    ],
    defaultVariants: { type: 'standalone', size: 'md', tone: 'brand' },
  },
);

const iconSize = { sm: 'sm', md: 'md', lg: 'md' } as const;

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type' | 'children'>,
    VariantProps<typeof linkVariants>,
    ForceStateProps {
  /** Figma `Label`: names the destination. */
  label?: ReactNode;
  /** Figma `Show leading icon` + `Leading icon` (standalone only). */
  leadingIcon?: IconName;
  /** Figma `Show trailing icon` + `Trailing icon` (standalone only). */
  trailingIcon?: IconName;
  /** Figma `State=disabled`: not focusable, announced as unavailable. Prefer removing the link. */
  disabled?: boolean;
  children?: ReactNode;
}

export function Link({
  type = 'standalone',
  size = 'md',
  tone = 'brand',
  label,
  children,
  leadingIcon,
  trailingIcon,
  disabled = false,
  forceState,
  href,
  className,
  ...rest
}: LinkProps) {
  const standalone = type === 'standalone';
  const s = size ?? 'md';
  const newTab = rest.target === '_blank';
  return (
    <a
      data-anatomy="root"
      href={disabled ? undefined : href}
      role={disabled ? 'link' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(linkVariants({ type, size, tone }), className)}
      {...forceAttr(forceState)}
      {...rest}
    >
      {standalone && leadingIcon && <Icon name={leadingIcon} size={iconSize[s]} data-anatomy="leading-icon" />}
      <span data-anatomy="label">{label ?? children}</span>
      {newTab && <span className="sr-only"> (opens in a new tab)</span>}
      {standalone && trailingIcon && <Icon name={trailingIcon} size={iconSize[s]} data-anatomy="trailing-icon" />}
    </a>
  );
}
