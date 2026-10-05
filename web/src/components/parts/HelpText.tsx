import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * 2.12 Help text — the hint or validation message under a form control.
 * Figma: `Help text` · Size × Status (4 variants) · Hint.
 * Link it to its control with `aria-describedby` pointing at this element's `id`.
 */
export interface HelpTextProps extends Omit<HTMLAttributes<HTMLParagraphElement>, 'children'> {
  /** Figma `Size`. Pairs with the control and Label of the same size. */
  size?: 'sm' | 'md';
  /** Figma `Status`. `invalid` turns the hint into the validation message; set the control to the same Status. */
  status?: 'none' | 'invalid';
  /** Figma `Hint`. One sentence, two lines at most at the field width. */
  hint?: ReactNode;
  children?: ReactNode;
}

const sizes = { sm: 'type-body-xs-regular', md: 'type-body-sm-regular' } as const;
const statuses = { none: 'text-text-tertiary', invalid: 'text-text-danger' } as const;

export function HelpText({ size = 'md', status = 'none', hint, children, className, ...rest }: HelpTextProps) {
  return (
    <p aria-live="polite" className={cn('m-0 flex items-start', sizes[size], statuses[status], className)} {...rest}>
      <span className="min-w-0">{hint ?? children ?? 'This is a hint text to help the user.'}</span>
    </p>
  );
}
