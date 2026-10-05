import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForceStateProps } from '@/lib/types';
import { choiceBoxClasses, choiceFocusClasses, choiceInputClasses } from './Checkbox';

/**
 * 2.8 Radio — the round control that marks one choice in a set.
 * Figma: `Radio` · Size × Checked × State (16 variants). No mixed state.
 * Shares Checkbox's fill, border and focus tokens; only the shape and the mark differ.
 * Group radios with the same `name`: the browser handles arrow keys and single selection.
 */
const ring = { sm: 'size-(--radio-size-sm)', md: 'size-(--radio-size-md)' };
const dot = { sm: 'size-(--size-indicator-xs)', md: 'size-(--size-indicator-sm)' };

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, ForceStateProps {
  /** Figma `Size`. */
  size?: 'sm' | 'md';
  /** Figma `Checked`. Omit (or use `defaultChecked`) for an uncontrolled group. */
  checked?: boolean;
  /** Called with `true` when this option becomes checked. */
  onCheckedChange?: (checked: boolean) => void;
  /** The parent (an option row or card) draws the focus ring. */
  parentFocus?: boolean;
}

export function Radio({ size = 'sm', checked, onCheckedChange, onChange, parentFocus = false, forceState, className, style, ...rest }: RadioProps) {
  return (
    <span className={cn('relative inline-flex shrink-0', ring[size], className)} style={style}>
      <input
        type="radio"
        className={cn(choiceInputClasses, 'rounded-full')}
        checked={checked}
        readOnly={checked !== undefined && !onChange && !onCheckedChange ? true : undefined}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...forceAttr(forceState)}
        {...rest}
      />
      <span aria-hidden className={cn(choiceBoxClasses, 'rounded-full', !parentFocus && choiceFocusClasses)}>
        {/* 1.6 Motion: the dot scales in at base · standard (instant in Reduced). */}
        <span className={cn('scale-0 rounded-full bg-current transition-[scale] duration-(--motion-duration-base) ease-standard [.peer:checked~*_&]:scale-100', dot[size])} />
      </span>
    </span>
  );
}
