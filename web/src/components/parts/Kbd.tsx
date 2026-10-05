import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * 2.17 Kbd — one keyboard key in a shortcut or an instruction. Display only.
 * Figma: `Kbd` · Size (2 variants) · Text. One key per Kbd; build combinations in a row with `gap-xxs`.
 */
export interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Figma `Size`. `sm` next to small text, menus and tooltips; `md` next to body text. */
  size?: 'sm' | 'md';
  /** Figma `Text`: the key's printed name or symbol ("K", "Esc", "⌘"). */
  text?: string;
  children?: ReactNode;
}

/** Text alternatives for key symbols, read by screen readers instead of the glyph. */
const symbolNames: Record<string, string> = {
  '⌘': 'Command', '⌥': 'Option', '⇧': 'Shift', '⌃': 'Control', '↵': 'Enter', '⏎': 'Return', '⌫': 'Backspace', '⌦': 'Delete',
  '⎋': 'Escape', '⇥': 'Tab', '↑': 'Up arrow', '↓': 'Down arrow', '←': 'Left arrow', '→': 'Right arrow', '⇞': 'Page up', '⇟': 'Page down',
};

const sizes = {
  sm: 'h-(--kbd-height-sm) min-w-(--kbd-height-sm) px-xs type-body-xs-medium',
  md: 'h-(--kbd-height-md) min-w-(--kbd-height-md) px-sm type-body-sm-medium',
} as const;

export function Kbd({ size = 'sm', text, children, className, ...rest }: KbdProps) {
  const content = text ?? children ?? 'K';
  const spoken = typeof content === 'string' ? symbolNames[content] : undefined;
  return (
    <kbd
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap align-middle font-ui',
        'rounded-xs border-(length:--border-width-default) border-border-default bg-surface-sunken text-text-secondary',
        sizes[size],
        className,
      )}
      {...rest}
    >
      {spoken ? (
        <>
          <span aria-hidden>{content}</span>
          <span className="sr-only">{spoken}</span>
        </>
      ) : (
        content
      )}
    </kbd>
  );
}
