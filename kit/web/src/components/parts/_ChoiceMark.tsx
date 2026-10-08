import { cn } from '@/lib/cn';
import { Icon } from '@/icons';

/**
 * Presentational Checkbox (2.7) / Radio (2.8) box for rows that are themselves the control
 * (a `role="option"` in Multi-select, a `menuitemcheckbox` / `menuitemradio` in Menu).
 * Same tokens and motion as the real parts, but no `<input>`: it is `aria-hidden`, never focusable,
 * and its state comes from props — the row carries `aria-selected` / `aria-checked`.
 * Private (file name starts with `_`), not exported from the library.
 */
export interface ChoiceMarkProps {
  /** The part it draws. */
  kind: 'checkbox' | 'radio';
  size?: 'sm' | 'md';
  /** `'mixed'` is checkbox only. */
  checked?: boolean | 'mixed';
  disabled?: boolean;
  /** The row's hover / keyboard highlight look. */
  hover?: boolean;
  className?: string;
}

const box = {
  checkbox: { sm: 'size-(--checkbox-size-sm) rounded-(--checkbox-radius-sm)', md: 'size-(--checkbox-size-md) rounded-(--checkbox-radius-md)' },
  radio: { sm: 'size-(--radio-size-sm) rounded-full', md: 'size-(--radio-size-md) rounded-full' },
};
const mark = { sm: 'var(--checkbox-mark-sm)', md: 'var(--checkbox-mark-md)' };
const dot = { sm: 'size-(--size-indicator-xs)', md: 'size-(--size-indicator-sm)' };
const markMotion = 'transition-[scale,opacity] duration-(--motion-duration-base) ease-standard';

export function ChoiceMark({ kind, size = 'sm', checked = false, disabled = false, hover = false, className }: ChoiceMarkProps) {
  const on = checked === true || (kind === 'checkbox' && checked === 'mixed');
  const look = disabled
    ? 'border-border-disabled bg-fill-neutral-subtle-disabled text-icon-disabled'
    : on
      ? hover
        ? 'border-fill-brand-solid-hover bg-fill-brand-solid-hover'
        : 'border-fill-brand-solid bg-fill-brand-solid'
      : hover
        ? 'border-border-brand bg-fill-brand-subtle'
        : 'border-border-strong bg-surface-base';
  const markStyle = { width: mark[size], height: mark[size] };
  const shown = (v: boolean) => (v ? 'scale-100 opacity-100' : 'scale-50 opacity-0');
  return (
    <span
      aria-hidden
      data-anatomy={kind === 'checkbox' ? 'box' : 'ring'}
      className={cn(
        'pointer-events-none relative inline-flex shrink-0 items-center justify-center border-(length:--border-width-default) text-icon-on-solid',
        'transition-[background-color,border-color] duration-(--motion-duration-fast) ease-standard',
        box[kind][size],
        look,
        disabled && 'text-icon-disabled',
        className,
      )}
    >
      {kind === 'checkbox' ? (
        <>
          <Icon data-anatomy="mark" name="general/check" strokeWidth={3} style={markStyle} className={cn('absolute', markMotion, shown(checked === true))} />
          <Icon data-anatomy="mark" name="general/minus" strokeWidth={3} style={markStyle} className={cn('absolute', markMotion, shown(checked === 'mixed'))} />
        </>
      ) : (
        <span data-anatomy="dot" className={cn('rounded-full bg-current transition-[scale] duration-(--motion-duration-base) ease-standard', dot[size], checked === true ? 'scale-100' : 'scale-0')} />
      )}
    </span>
  );
}
