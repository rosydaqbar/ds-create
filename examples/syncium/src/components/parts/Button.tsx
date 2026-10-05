import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForceStateProps } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Spinner } from './Spinner';

/**
 * 2.1 Button — actions users can take.
 * Figma: `Button` · Size × Emphasis × Tone × State × Icon only (360 variants).
 * Figma `State` maps to browser states; `loading` and `disabled` are props.
 */
export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap',
    'rounded-control border-(length:--border-width-default) outline-none',
    'transition-[background-color,color,border-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
    'cursor-pointer is-disabled:cursor-not-allowed is-disabled:shadow-none',
  ],
  {
    variants: {
      size: {
        xs: 'h-(--size-control-xs) px-(--button-padding-x-xs) gap-(--button-gap-xs) type-body-sm-semibold',
        sm: 'h-(--size-control-sm) px-(--button-padding-x-sm) gap-(--button-gap-sm) type-body-sm-semibold',
        md: 'h-(--size-control-md) px-(--button-padding-x-md) gap-(--button-gap-md) type-body-sm-semibold',
        lg: 'h-(--size-control-lg) px-(--button-padding-x-lg) gap-(--button-gap-lg) type-body-md-semibold',
        xl: 'h-(--size-control-xl) px-(--button-padding-x-xl) gap-(--button-gap-xl) type-body-md-semibold',
      },
      emphasis: { primary: '', secondary: '', tertiary: '' },
      tone: { brand: '', danger: '' },
      iconOnly: {
        true: 'px-0 aspect-square',
        false: '',
      },
    },
    compoundVariants: [
      // Tone=brand
      { emphasis: 'primary', tone: 'brand', className: 'border-transparent bg-fill-brand-solid text-text-on-solid shadow-control is-hover:bg-fill-brand-solid-hover is-pressed:bg-fill-brand-solid-pressed is-focus:shadow-focus-default' },
      { emphasis: 'secondary', tone: 'brand', className: 'border-border-default bg-surface-base text-text-secondary shadow-control is-hover:bg-surface-base-hover is-hover:text-text-primary is-pressed:bg-surface-base-pressed is-pressed:text-text-primary is-focus:shadow-focus-default' },
      { emphasis: 'tertiary', tone: 'brand', className: 'border-transparent bg-fill-none text-text-secondary is-hover:bg-fill-neutral-subtle-hover is-hover:text-text-primary is-pressed:bg-fill-neutral-subtle-pressed is-pressed:text-text-primary is-focus:shadow-focus-default' },
      // Tone=danger
      { emphasis: 'primary', tone: 'danger', className: 'border-transparent bg-fill-danger-solid text-text-on-solid shadow-control is-hover:bg-fill-danger-solid-hover is-pressed:bg-fill-danger-solid-pressed is-focus:shadow-focus-danger' },
      { emphasis: 'secondary', tone: 'danger', className: 'border-border-danger-subtle bg-surface-base text-text-danger shadow-control is-hover:bg-fill-danger-subtle-hover is-hover:text-text-danger-hover is-pressed:bg-fill-danger-subtle-pressed is-focus:shadow-focus-danger' },
      { emphasis: 'tertiary', tone: 'danger', className: 'border-transparent bg-fill-none text-text-danger is-hover:bg-fill-danger-subtle-hover is-hover:text-text-danger-hover is-pressed:bg-fill-danger-subtle-pressed is-focus:shadow-focus-danger' },
      // Disabled (all emphasis, both tones) — listed last so it wins.
      { emphasis: 'primary', className: 'is-disabled:border-border-disabled is-disabled:bg-fill-neutral-subtle-disabled is-disabled:text-text-disabled' },
      { emphasis: 'secondary', className: 'is-disabled:border-border-disabled is-disabled:bg-surface-base is-disabled:text-text-disabled' },
      { emphasis: 'tertiary', className: 'is-disabled:bg-fill-none is-disabled:text-text-disabled' },
      // Icon-only squares: side = control height.
      { iconOnly: true, size: 'xs', className: 'w-(--size-control-xs)' },
      { iconOnly: true, size: 'sm', className: 'w-(--size-control-sm)' },
      { iconOnly: true, size: 'md', className: 'w-(--size-control-md)' },
      { iconOnly: true, size: 'lg', className: 'w-(--size-control-lg)' },
      { iconOnly: true, size: 'xl', className: 'w-(--size-control-xl)' },
    ],
    defaultVariants: { size: 'md', emphasis: 'primary', tone: 'brand', iconOnly: false },
  },
);

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    Omit<VariantProps<typeof buttonVariants>, 'iconOnly'>,
    ForceStateProps {
  /** Figma `Label`. For icon-only buttons it becomes the accessible name. */
  label?: ReactNode;
  /** Figma `Leading icon` (+ `Show leading icon`). The only glyph when `iconOnly`. */
  leadingIcon?: IconName;
  /** Any node in the leading icon box (a brand mark, an avatar); wins over `leadingIcon`. */
  leadingVisual?: ReactNode;
  /** Figma `Trailing icon` (+ `Show trailing icon`). */
  trailingIcon?: IconName;
  /** Figma `Icon only=true`: square button; `label` is used as aria-label. */
  iconOnly?: boolean;
  /** Figma `State=loading`: Spinner in the leading slot, not clickable. */
  loading?: boolean;
  /** Figma `Show loading text`. */
  showLoadingText?: boolean;
  /** Stretch to the container (content stays centred). */
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  size = 'md',
  emphasis = 'primary',
  tone = 'brand',
  iconOnly = false,
  label,
  children,
  leadingIcon,
  leadingVisual,
  trailingIcon,
  loading = false,
  showLoadingText = true,
  fullWidth = false,
  forceState,
  disabled,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const text = label ?? children;
  const showText = !iconOnly && (!loading || showLoadingText);
  return (
    <button
      data-anatomy="root"
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-label={iconOnly && typeof text === 'string' ? text : undefined}
      className={cn(buttonVariants({ size, emphasis, tone, iconOnly }), fullWidth && 'w-full', loading && 'pointer-events-none', className)}
      {...forceAttr(forceState)}
      {...rest}
    >
      {loading ? (
        <Spinner size="md" tone="current" />
      ) : (
        leadingVisual ?? ((leadingIcon || iconOnly) && <Icon name={leadingIcon ?? 'general/plus'} size="md" data-anatomy="leading-icon" />)
      )}
      {showText && text != null && <span data-anatomy="text-padding" className="px-(--space-optical)"><span data-anatomy="label">{text}</span></span>}
      {!iconOnly && !loading && trailingIcon && <Icon name={trailingIcon} size="md" data-anatomy="trailing-icon" />}
    </button>
  );
}
