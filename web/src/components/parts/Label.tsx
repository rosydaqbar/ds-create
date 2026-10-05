import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { HelpIcon, type TooltipPlacement } from './Tooltip';

/**
 * 2.11 Label — names a form control above or beside it.
 * Figma: `Label` · Size (2 variants) · Label, Show required, Show help icon.
 * The Help icon is the published `Help icon` from 2.13 Tooltip.
 */
export interface LabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children'> {
  /** Figma `Size`. `sm` pairs with sm controls; `md` with md and lg controls. */
  size?: 'sm' | 'md';
  /** Figma `Label`. A short noun phrase in sentence case, no trailing colon. */
  label?: ReactNode;
  /** Figma `Show required`: the asterisk marker. The control itself carries `required`. */
  showRequired?: boolean;
  /** Figma `Show help icon`: a Help icon after the label. */
  showHelpIcon?: boolean;
  /** Text of the help icon's Tooltip (short, non-essential detail). */
  helpText?: ReactNode;
  /** Supporting text of the help icon's Tooltip. */
  helpSupportingText?: ReactNode;
  /** Placement of the help icon's Tooltip. */
  helpPlacement?: TooltipPlacement;
  /**
   * Element for the text: `label` (linked with `htmlFor`) for single controls; `span` (give it an `id`
   * and point the group's `aria-labelledby` at it) or `legend` (inside a fieldset) for groups.
   */
  as?: 'label' | 'span' | 'legend';
  /** Documentation only: Help icon `State=hover` or `State=focus` (tooltip open). */
  helpForceState?: 'hover' | 'focus';
  children?: ReactNode;
}

const sizes = {
  sm: { text: 'type-body-xs-medium' },
  md: { text: 'type-body-sm-medium' },
} as const;

export function Label({
  size = 'md',
  label,
  children,
  showRequired = false,
  showHelpIcon = false,
  helpText = 'This is a tooltip',
  helpSupportingText,
  helpPlacement = 'top',
  as = 'label',
  helpForceState,
  className,
  ...rest
}: LabelProps) {
  const text = label ?? children ?? 'Label';
  const Text = as as 'label';
  return (
    <div className={cn('inline-flex items-center gap-xxs', className)}>
      <Text className={cn('inline-flex items-center gap-xxs text-text-secondary', sizes[size].text)} {...rest}>
        <span>{text}</span>
        {showRequired && (
          <span aria-hidden className="text-text-brand">
            *
          </span>
        )}
      </Text>
      {showHelpIcon && (
        <HelpIcon
          text={helpText}
          supportingText={helpSupportingText}
          placement={helpPlacement}
          label={typeof text === 'string' ? `More information about ${text}` : 'More information'}
          iconSize={size === 'sm' ? 'xs' : 'sm'}
          forceState={helpForceState}
        />
      )}
    </div>
  );
}
