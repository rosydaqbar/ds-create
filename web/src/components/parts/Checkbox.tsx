import { useLayoutEffect, useRef, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForceStateProps } from '@/lib/types';
import { Icon } from '@/icons';

/**
 * 2.7 Checkbox — the box itself: unchecked, checked or mixed.
 * Figma: `Checkbox` · Size × Checked × State (24 variants).
 * A real `<input type="checkbox">` sits on top of the drawn box; the box reads its state
 * through `peer-*` variants, so controlled and uncontrolled use both work.
 * Labels come from 3.3 Choice field.
 */
const box = { sm: 'size-(--checkbox-size-sm)', md: 'size-(--checkbox-size-md)' };
const radius = { sm: 'rounded-(--checkbox-radius-sm)', md: 'rounded-(--checkbox-radius-md)' };
const mark = { sm: 'var(--checkbox-mark-sm)', md: 'var(--checkbox-mark-md)' };
const markMotion = 'scale-50 opacity-0 transition-[scale,opacity] duration-(--motion-duration-base) ease-standard';

/** Shared with 2.8 Radio: the same fill, border and focus tokens. */
export const choiceBoxClasses = [
  'pointer-events-none flex size-full items-center justify-center border-(length:--border-width-default)',
  'transition-[background-color,border-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
  'text-icon-on-solid',
  // unchecked
  'border-border-strong bg-surface-base',
  'peer-hover:border-border-brand peer-hover:bg-fill-brand-subtle',
  'peer-data-[force=hover]:border-border-brand peer-data-[force=hover]:bg-fill-brand-subtle',
  // checked / mixed
  'peer-checked:border-fill-brand-solid peer-checked:bg-fill-brand-solid',
  'peer-checked:peer-hover:border-fill-brand-solid-hover peer-checked:peer-hover:bg-fill-brand-solid-hover',
  'peer-checked:peer-data-[force=hover]:border-fill-brand-solid-hover peer-checked:peer-data-[force=hover]:bg-fill-brand-solid-hover',
  // disabled (listed after hover so it wins at equal specificity)
  'peer-disabled:border-border-disabled peer-disabled:bg-fill-neutral-subtle-disabled peer-disabled:text-icon-disabled',
  'peer-checked:peer-disabled:border-border-disabled peer-checked:peer-disabled:bg-fill-neutral-subtle-disabled',
].join(' ');
/** Checkbox only: mixed (`:indeterminate`) reads as checked. Not for radios — an unchecked radio group is `:indeterminate` too. */
const mixedClasses = [
  'peer-indeterminate:border-fill-brand-solid peer-indeterminate:bg-fill-brand-solid',
  'peer-indeterminate:peer-hover:border-fill-brand-solid-hover peer-indeterminate:peer-hover:bg-fill-brand-solid-hover',
  'peer-indeterminate:peer-data-[force=hover]:border-fill-brand-solid-hover peer-indeterminate:peer-data-[force=hover]:bg-fill-brand-solid-hover',
  'peer-indeterminate:peer-disabled:border-border-disabled peer-indeterminate:peer-disabled:bg-fill-neutral-subtle-disabled',
].join(' ');
export const choiceFocusClasses = 'peer-focus-visible:shadow-focus-default peer-data-[force=focus]:shadow-focus-default';
/** The invisible native input covering the box; reaches size/touch-min on touch platforms. */
export const choiceInputClasses =
  'peer absolute inset-0 z-10 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed pointer-coarse:inset-[min(0px,calc((100%_-_var(--size-touch-min))/2))]';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'checked' | 'defaultChecked'>, ForceStateProps {
  /** Figma `Size`. */
  size?: 'sm' | 'md';
  /** Figma `Checked`: `false`, `true` or `'mixed'` (partly checked). Omit for an uncontrolled box. */
  checked?: boolean | 'mixed';
  defaultChecked?: boolean | 'mixed';
  /** Called with the new checked value (a mixed box becomes `true`). */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * The parent draws the focus ring (a Tag or a list row that is the hit target).
   * The box then shows no ring of its own.
   */
  parentFocus?: boolean;
}

export function Checkbox({
  size = 'sm',
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  parentFocus = false,
  forceState,
  disabled,
  className,
  style,
  ...rest
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const mixed = checked === 'mixed' || (checked === undefined && defaultChecked === 'mixed');
  useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  const controlled = checked !== undefined;
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };
  const markStyle = { width: mark[size], height: mark[size] };
  return (
    <span className={cn('relative inline-flex shrink-0', box[size], className)} style={style}>
      <input
        ref={ref}
        type="checkbox"
        className={choiceInputClasses}
        disabled={disabled}
        {...(controlled ? { checked: checked === true, readOnly: !onChange && !onCheckedChange } : { defaultChecked: defaultChecked === true })}
        onChange={handle}
        {...forceAttr(forceState)}
        {...rest}
      />
      <span aria-hidden className={cn(choiceBoxClasses, mixedClasses, radius[size], !parentFocus && choiceFocusClasses)}>
        {/* 1.6 Motion: the mark scales in at base · standard (instant in Reduced). */}
        <Icon name="general/check" strokeWidth={3} style={markStyle} className={cn('absolute', markMotion, '[.peer:checked~*_&]:scale-100 [.peer:checked~*_&]:opacity-100 [.peer:indeterminate~*_&]:scale-50 [.peer:indeterminate~*_&]:opacity-0')} />
        <Icon name="general/minus" strokeWidth={3} style={markStyle} className={cn('absolute', markMotion, '[.peer:indeterminate~*_&]:scale-100 [.peer:indeterminate~*_&]:opacity-100')} />
      </span>
    </span>
  );
}
