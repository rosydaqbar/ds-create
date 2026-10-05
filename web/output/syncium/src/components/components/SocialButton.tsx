import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { buttonVariants } from '../parts/Button';
import { SocialMark, socialProviderName, socialProviders, type SocialProvider } from '../assets/SocialMark';

/**
 * 3.7 Social button — sign in or sign up with a third-party account.
 * Figma: `Social button` · Size × Provider × Type × Icon only × State (216 variants with six providers)
 * and `Social button group` · Size × Icon only × Type (12 variants).
 *
 * A Social button is a Button (2.1): it renders `buttonVariants` with `Emphasis=secondary` and the
 * same size, icon-only square and Text padding wrapper, so it lines up with any Button of the same size.
 * The leading icon is the provider's Social mark (1.8). `Type=solid` swaps the fill and label colour for
 * the provider's `social-button/{provider}/*` tokens.
 */
export type SocialButtonSize = 'md' | 'lg';
export type SocialButtonType = 'solid' | 'color' | 'mono';
/** Content rule: "Sign in" on sign-in screens, "Sign up" on sign-up, "Continue" when one screen does both. */
export type SocialButtonVerb = 'Sign in' | 'Sign up' | 'Continue';

export const socialButtonTypes = ['solid', 'color', 'mono'] as const satisfies readonly SocialButtonType[];

/** `Type=solid`: the provider's own fill and label colour. Full class strings so Tailwind can see them. */
const solidClass: Record<SocialProvider, string> = {
  google: 'bg-social-button-google-fill text-social-button-google-fg is-hover:bg-social-button-google-fill-hover',
  apple: 'bg-social-button-apple-fill text-social-button-apple-fg is-hover:bg-social-button-apple-fill-hover',
  github: 'bg-social-button-github-fill text-social-button-github-fg is-hover:bg-social-button-github-fill-hover',
  facebook: 'bg-social-button-facebook-fill text-social-button-facebook-fg is-hover:bg-social-button-facebook-fill-hover',
  x: 'bg-social-button-x-fill text-social-button-x-fg is-hover:bg-social-button-x-fill-hover',
  gitlab: 'bg-social-button-gitlab-fill text-social-button-gitlab-fg is-hover:bg-social-button-gitlab-fill-hover',
};
const solidBase = 'border-transparent shadow-control is-focus:shadow-focus-default';

/**
 * Mark version on the provider's solid background: single-colour in the label colour, except Google,
 * whose rules keep the standard colour G on every background.
 */
const solidMarkMono: Record<SocialProvider, boolean> = { google: false, apple: true, github: true, facebook: true, x: true, gitlab: true };

/** The mark is one icon step larger at `lg` so provider marks read clearly. */
const markSize = { md: 'md', lg: 'lg' } as const;

export interface SocialButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  /** Figma `Size` — the Button's `md` and `lg`. */
  size?: SocialButtonSize;
  /** Figma `Provider`. */
  provider?: SocialProvider;
  /** Figma `Type`: provider colours, neutral button with the colour mark, or neutral with a single-colour mark. */
  type?: SocialButtonType;
  /** Figma `Icon only`: square button at the control height; the label becomes the accessible name. */
  iconOnly?: boolean;
  /** First words of the label: "{verb} with {Provider}". */
  verb?: SocialButtonVerb;
  /** Overrides the whole label (and the icon-only accessible name). */
  label?: string;
  /** Fill the container (Figma: Fill width in layouts). Icon-only buttons become equal-width cells. */
  fullWidth?: boolean;
  /** Documentation only: render a Figma `State` statically. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
}

export function SocialButton({
  size = 'lg',
  provider = socialProviders[0],
  type = 'color',
  iconOnly = false,
  verb = 'Sign in',
  label,
  fullWidth = false,
  forceState,
  className,
  ...rest
}: SocialButtonProps) {
  const text = label ?? `${verb} with ${socialProviderName[provider]}`;
  const solid = type === 'solid';
  const square = iconOnly && !fullWidth;
  const mono = type === 'mono' || (solid && solidMarkMono[provider]);
  return (
    <button
      data-anatomy="button"
      type="button"
      aria-label={iconOnly ? text : undefined}
      className={cn(
        'group/social',
        // Button 2.1: solid keeps Button's shape and size but takes the provider's colours.
        buttonVariants({ size, emphasis: solid ? null : 'secondary', tone: solid ? null : 'brand', iconOnly: square }),
        solid && [solidBase, solidClass[provider]],
        iconOnly && fullWidth && 'min-w-0 flex-1 px-0',
        fullWidth && !iconOnly && 'w-full',
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    >
      <SocialMark
        provider={provider}
        mono={mono}
        size={markSize[size]}
        alt=""
        data-anatomy="leading-icon"
        className={cn(
          type === 'mono' &&
            'text-icon-secondary transition-colors duration-(--motion-duration-fast) ease-standard group-is-hover/social:text-icon-primary',
        )}
      />
      {/* Text padding: Button's optical wrapper. */}
      {!iconOnly && <span data-anatomy="text-padding" className="px-(--space-optical)"><span data-anatomy="label">{text}</span></span>}
    </button>
  );
}

/* ---------- Social button group ---------- */

export interface SocialButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Size`: every button in the group has it. */
  size?: SocialButtonSize;
  /** Figma `Icon only`: stacked full-width buttons, or a row of icon-only buttons. */
  iconOnly?: boolean;
  /** Figma `Type`: one treatment for every button in the group. */
  type?: SocialButtonType;
  /** The providers, in order. Default: the first three (text) or the first four (icon only). */
  providers?: readonly SocialProvider[];
  /** First words of every label: "{verb} with {Provider}". */
  verb?: SocialButtonVerb;
  /** Icon-only row: equal-width buttons that fill the row instead of hugging. */
  fullWidth?: boolean;
  /** Called with the provider whose button was pressed. */
  onProviderClick?: (provider: SocialProvider) => void;
  /** Documentation only: pin one State on every button. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
}

export function SocialButtonGroup({
  size = 'lg',
  iconOnly = false,
  type = 'color',
  providers,
  verb = 'Sign in',
  fullWidth = false,
  onProviderClick,
  forceState,
  className,
  ...rest
}: SocialButtonGroupProps) {
  const list = providers ?? socialProviders.slice(0, iconOnly ? 4 : 3);
  return (
    <div
      data-anatomy="social-button-group"
      role="group"
      aria-label={rest['aria-label'] ?? `${verb} with another account`}
      className={cn('flex gap-lg', iconOnly ? 'flex-row' : 'w-full flex-col', iconOnly && fullWidth && 'w-full', className)}
      {...rest}
    >
      {list.map((p) => (
        <SocialButton
          key={p}
          provider={p}
          size={size}
          type={type}
          iconOnly={iconOnly}
          verb={verb}
          fullWidth={!iconOnly || fullWidth}
          forceState={forceState}
          onClick={onProviderClick ? () => onProviderClick(p) : undefined}
        />
      ))}
    </div>
  );
}
