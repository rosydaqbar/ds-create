import { useRef, useState, type ClipboardEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Button } from '../parts/Button';
import { Tag } from '../parts/Tag';
import { textControlSurface, type TextControlStatus } from '../parts/TextControl';

/**
 * 3.2 Text field — `.Main` private parts: `.Main/Text field addon`, `.Main/Text field tag box`, `.Main/Code field cell`.
 * Internal building blocks of TextField, TextareaField and CodeField; the file name starts with `_`,
 * so they are not exported from the library. The explorer imports them for the `.Main` matrices.
 */

export type TextFieldPartSize = 'sm' | 'md' | 'lg';

/* ---------- .Main/Text field addon ---------- */

export type TextFieldAddonType = 'dropdown' | 'button' | 'stepper' | 'stepper-vertical';

export interface AddonProps {
  size: TextFieldPartSize;
  type: TextFieldAddonType;
  placement: 'left' | 'right';
  status?: TextControlStatus;
  disabled?: boolean;
  /** Documentation only: Figma `State=hover`. */
  forceState?: 'hover';
  /** Figma `Text` (dropdown) or the Button label. */
  text?: string;
  /** Figma `Icon` (dropdown chevron, stepper minus / plus, Button icon). */
  icon?: IconName;
  /** dropdown: options of the native menu. */
  options?: string[];
  onSelect?: (v: string) => void;
  /** Accessible name ("Country code", "Increase quantity"). */
  label?: string;
  onClick?: () => void;
  /** stepper-vertical: the two actions. */
  onStepUp?: () => void;
  onStepDown?: () => void;
  stepUpLabel?: string;
  stepDownLabel?: string;
}

const addonHeight: Record<TextFieldPartSize, string> = {
  sm: 'h-(--size-control-sm)',
  md: 'h-(--size-control-md)',
  lg: 'h-(--size-control-lg)',
};
const addonPadX: Record<TextFieldPartSize, string> = { sm: 'px-lg', md: 'px-lg', lg: 'px-xl' };
const addonText: Record<TextFieldPartSize, string> = { sm: 'type-body-sm-regular', md: 'type-body-md-regular', lg: 'type-body-md-regular' };

/** Shared addon frame: border, outer-side radius, colours; `[--addon-icon]` carries the icon colour per state. */
export function addonFrame(size: TextFieldPartSize, placement: 'left' | 'right', invalid: boolean, interactive: boolean) {
  return cn(
    'relative inline-flex shrink-0 select-none items-center border-(length:--border-width-default) bg-fill-none text-text-secondary outline-none',
    'transition-[background-color,color,box-shadow] duration-(--motion-duration-fast) ease-standard',
    '[--addon-icon:var(--color-icon-secondary)]',
    invalid ? 'border-border-danger' : 'border-border-default',
    placement === 'left' ? 'rounded-s-control' : 'rounded-e-control',
    addonHeight[size],
    addonText[size],
    interactive && 'cursor-pointer is-hover:bg-fill-neutral-subtle-hover is-hover:[--addon-icon:var(--color-icon-primary)]',
    'is-disabled:cursor-not-allowed is-disabled:border-border-disabled is-disabled:bg-fill-none is-disabled:text-text-disabled is-disabled:[--addon-icon:var(--color-icon-disabled)]',
    'is-focus:z-10 is-focus:shadow-focus-default has-[select:focus-visible]:z-10 has-[select:focus-visible]:shadow-focus-default',
  );
}

export function TextFieldAddon({
  size,
  type,
  placement,
  status = 'none',
  disabled,
  forceState,
  text = 'US',
  icon,
  options,
  onSelect,
  label,
  onClick,
  onStepUp,
  onStepDown,
  stepUpLabel = 'Increase',
  stepDownLabel = 'Decrease',
}: AddonProps) {
  const invalid = status === 'invalid';
  if (type === 'button') {
    return (
      <Button
        data-anatomy="addon"
        size={size}
        emphasis="secondary"
        label={text}
        leadingIcon={icon}
        disabled={disabled}
        onClick={onClick}
        forceState={forceState}
        className={cn('shadow-none is-focus:z-10', placement === 'left' ? 'rounded-e-none' : 'rounded-s-none')}
      />
    );
  }
  if (type === 'stepper') {
    return (
      <button
        data-anatomy="addon"
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={cn(addonFrame(size, placement, invalid, true), addonPadX[size])}
        {...forceAttr(forceState)}
      >
        <Icon name={icon ?? (placement === 'left' ? 'general/minus' : 'general/plus')} size="md" className="text-(--addon-icon)" />
      </button>
    );
  }
  if (type === 'stepper-vertical') {
    // − and + side by side (not stacked) so each target is at least 24 × 24 px (WCAG 2.5.8) at every Size.
    const cell = cn(
      'flex cursor-pointer items-center justify-center px-md outline-none [--addon-icon:var(--color-icon-secondary)]',
      'transition-[background-color] duration-(--motion-duration-fast) ease-standard',
      'is-hover:bg-fill-neutral-subtle-hover is-hover:[--addon-icon:var(--color-icon-primary)]',
      'is-focus:relative is-focus:z-10 is-focus:shadow-focus-default',
      'is-disabled:cursor-not-allowed is-disabled:bg-fill-none is-disabled:[--addon-icon:var(--color-icon-disabled)]',
    );
    return (
      <span
        data-anatomy="addon"
        data-disabled={disabled || undefined}
        className={cn(addonFrame(size, placement, invalid, false), 'items-stretch overflow-hidden')}
      >
        <button type="button" aria-label={stepDownLabel} disabled={disabled} onClick={onStepDown} className={cell} {...forceAttr(forceState)}>
          <Icon name="general/minus" size="md" className="text-(--addon-icon)" />
        </button>
        <span aria-hidden className={cn('w-(--border-width-default) shrink-0', invalid ? 'bg-border-danger' : 'bg-border-default', disabled && 'bg-border-disabled')} />
        <button type="button" aria-label={stepUpLabel} disabled={disabled} onClick={onStepUp} className={cell} {...forceAttr(forceState)}>
          <Icon name="general/plus" size="md" className="text-(--addon-icon)" />
        </button>
      </span>
    );
  }
  // dropdown: the visible text + chevron, with a native <select> on top for the menu and keyboard.
  return (
    <span
      data-anatomy="addon"
      data-disabled={disabled || undefined}
      // The visible value sits beside the (transparent) native select, so the addon carries the disabled state.
      aria-disabled={disabled || undefined}
      className={cn(addonFrame(size, placement, invalid, !disabled), addonPadX[size], 'gap-xs')}
      {...forceAttr(forceState)}
    >
      <span className="whitespace-nowrap">{text}</span>
      <Icon name={icon ?? 'arrows/chevron-down'} size="md" className="text-(--addon-icon)" />
      {options && (
        <select
          aria-label={label}
          value={text}
          disabled={disabled}
          onChange={(e) => onSelect?.(e.target.value)}
          className="absolute inset-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )}
    </span>
  );
}

/* ---------- .Main/Text field tag box ---------- */

export interface TagBoxProps {
  size: TextFieldPartSize;
  type: 'single-line' | 'multi-line';
  status?: TextControlStatus;
  disabled?: boolean;
  forceState?: 'focus';
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (i: number) => void;
  id?: string;
  placeholder?: string;
  describedBy?: string;
  required?: boolean;
  /** Id of the field's Label: names the input that types new Tags. */
  labelledBy?: string;
  /** Accessible name of that input when no Label names it. Defaults to "Add a tag". */
  ariaLabel?: string;
}

/** Tag box padding per Size: Text control padding-x, vertical padding centring an sm Tag in the control height. Shared with 3.5 Select tag box. */
export const tagBoxPad: Record<TextFieldPartSize, string> = {
  sm: 'px-(--text-control-padding-x-sm) min-h-(--size-control-sm) py-[calc((var(--size-control-sm)-var(--tag-height-sm))/2-var(--border-width-default))]',
  md: 'px-(--text-control-padding-x-md) min-h-(--size-control-md) py-[calc((var(--size-control-md)-var(--tag-height-sm))/2-var(--border-width-default))]',
  lg: 'px-(--text-control-padding-x-lg) min-h-(--size-control-lg) py-[calc((var(--size-control-lg)-var(--tag-height-sm))/2-var(--border-width-default))]',
};

/** Enter or comma adds the typed text as a Tag; Backspace in an empty input removes the last one. */
export function useTagTyping(tags: string[], onAdd: (t: string) => void, onRemove: (i: number) => void) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const t = draft.trim().replace(/,$/, '');
    if (t && !tags.includes(t)) onAdd(t);
    setDraft('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      if (draft.trim()) {
        e.preventDefault();
        commit();
      }
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };
  return { draft, setDraft, commit, onKeyDown };
}

export function TextFieldTagBox({ size, type, status = 'none', disabled, forceState, tags, onAdd, onRemove, id, placeholder = 'Add people', describedBy, required, labelledBy, ariaLabel }: TagBoxProps) {
  const input = useRef<HTMLInputElement>(null);
  const { draft, setDraft, commit, onKeyDown } = useTagTyping(tags, onAdd, onRemove);
  const multi = type === 'multi-line';
  return (
    <div
      data-anatomy="tag-box"
      className={cn(
        textControlSurface(status),
        'flex-wrap gap-sm',
        multi
          ? cn('min-h-(--text-control-multiline-min-height) content-start items-start py-(--text-control-padding-y-multiline)', tagBoxPad[size].split(' ')[0])
          : cn('items-center', tagBoxPad[size]),
        'cursor-text is-disabled:cursor-not-allowed',
      )}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      onPointerDown={(e) => {
        if (disabled || (e.target as HTMLElement).closest('button, input')) return;
        e.preventDefault();
        input.current?.focus();
      }}
      {...forceAttr(forceState)}
    >
      {tags.map((t, i) => (
        <Tag key={t} size="sm" type="removable" label={t} disabled={disabled} onRemove={() => onRemove(i)} />
      ))}
      <input
        ref={input}
        id={id}
        data-text-control-field=""
        value={draft}
        disabled={disabled}
        required={required && tags.length === 0}
        aria-invalid={status === 'invalid' || undefined}
        aria-describedby={describedBy}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : (ariaLabel ?? 'Add a tag')}
        placeholder={tags.length === 0 ? placeholder : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        className={cn(
          'h-(--tag-height-sm) min-w-[4rem] flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-placeholder',
          'is-disabled:cursor-not-allowed is-disabled:text-text-disabled is-disabled:placeholder:text-text-disabled',
          size === 'sm' ? 'type-body-sm-regular' : 'type-body-md-regular',
          'pointer-coarse:text-(length:--font-size-input-min)',
        )}
      />
    </div>
  );
}

/* ---------- .Main/Code field cell ---------- */

export const cellSize = {
  sm: 'size-(--code-field-cell-size-sm) type-heading-xl-semibold',
  md: 'size-(--code-field-cell-size-md) type-display-sm-semibold',
  lg: 'size-(--code-field-cell-size-lg) type-display-md-semibold',
} as const;
export const cellGap = { sm: 'gap-md', md: 'gap-lg', lg: 'gap-lg' } as const;

export interface CellProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  size: 'sm' | 'md' | 'lg';
  status?: TextControlStatus;
  /** Figma `Digit`. Empty = `Filled=false` (placeholder "0"). */
  digit?: string;
  disabled?: boolean;
  /** Documentation only: Figma `State=focus`. */
  forceState?: 'focus';
  onDigit?: (d: string) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  onPaste?: (e: ClipboardEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}

export function CodeFieldCell({ size, status = 'none', digit = '', disabled, forceState, onDigit, inputRef, className, ...rest }: CellProps) {
  const invalid = status === 'invalid';
  return (
    <input
      data-anatomy="code-cell"
      ref={inputRef}
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      placeholder="0"
      value={digit}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      onChange={(e) => onDigit?.(e.target.value.replace(/\D/g, '').slice(-1))}
      onFocus={(e) => e.currentTarget.select()}
      className={cn(
        'shrink-0 rounded-control border-(length:--border-width-default) bg-surface-base p-0 text-center outline-none',
        'transition-[border-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
        'placeholder:text-text-placeholder',
        invalid
          ? 'border-border-danger text-text-danger is-focus:shadow-focus-danger'
          : 'border-border-default text-text-brand is-hover:border-border-strong is-focus:border-border-brand is-focus:shadow-focus-default',
        'is-disabled:cursor-not-allowed is-disabled:border-border-disabled is-disabled:bg-fill-neutral-subtle-disabled is-disabled:text-text-disabled is-disabled:placeholder:text-text-disabled',
        cellSize[size],
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    />
  );
}

