import {
  useRef,
  type ChangeEvent,
  type HTMLAttributes,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Avatar } from './Avatar';
import { Kbd } from './Kbd';
import { HelpIcon } from './Tooltip';

/**
 * 2.10 Text control — the box people type into or open. It has no label and no hint
 * (those are 2.11 Label and 2.12 Help text, composed by 3.2 Text field).
 * Figma: `Text control` · Type × Size × Filled × Status × State (144 variants).
 *
 * - `single-line` renders an `<input>`, `multi-line` a `<textarea>`, `select` a `<button>` trigger
 *   with the chevron (the menu belongs to 3.5 Select).
 * - Figma `Filled` is derived from the value; Figma `State` comes from the browser
 *   (`forceState` pins hover / focus for documentation).
 * - The id, name, value and every native attribute go to the inner control; `className` and `style` to the box.
 */
export type TextControlType = 'single-line' | 'multi-line' | 'select';
export type TextControlSize = 'sm' | 'md' | 'lg';
export type TextControlStatus = 'none' | 'invalid';

/** Box height, padding-x and text style per Size (multi-line keeps the padding-x and text style). */
const boxSize: Record<TextControlSize, string> = {
  sm: 'h-(--size-control-sm) px-(--text-control-padding-x-sm)',
  md: 'h-(--size-control-md) px-(--text-control-padding-x-md)',
  lg: 'h-(--size-control-lg) px-(--text-control-padding-x-lg)',
};
const padX: Record<TextControlSize, string> = {
  sm: 'px-(--text-control-padding-x-sm)',
  md: 'px-(--text-control-padding-x-md)',
  lg: 'px-(--text-control-padding-x-lg)',
};
const textStyle: Record<TextControlSize, string> = {
  sm: 'type-body-sm-regular',
  md: 'type-body-md-regular',
  lg: 'type-body-md-regular',
};
/** Mobile: the value never goes below font/size/input-min, so browsers don't zoom in on focus. */
const mobileText = 'pointer-coarse:text-(length:--font-size-input-min)';

/**
 * The control surface: fill, border, radius, hover, focus, invalid and disabled treatment.
 * Shared with the boxes that must look exactly like a Text control (3.2 tag box).
 * The box reads focus from any descendant marked `data-text-control-field`, or from `data-force="focus"`.
 */
export function textControlSurface(status: TextControlStatus = 'none') {
  const invalid = status === 'invalid';
  return cn(
    'group/tc relative flex w-full min-w-0 rounded-control border-(length:--border-width-default) bg-surface-base',
    'transition-[border-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
    invalid
      ? [
          'border-border-danger',
          'has-[[data-text-control-field]:focus-visible]:shadow-focus-danger data-[force=focus]:shadow-focus-danger',
        ]
      : [
          'border-border-default is-hover:border-border-strong',
          'has-[[data-text-control-field]:focus-visible]:border-border-brand has-[[data-text-control-field]:focus-visible]:shadow-focus-default',
          'data-[force=focus]:border-border-brand data-[force=focus]:shadow-focus-default',
        ],
    'is-disabled:cursor-not-allowed is-disabled:border-border-disabled is-disabled:bg-fill-neutral-subtle-disabled is-disabled:shadow-none',
  );
}

/** Adornment colours: tertiary at rest, disabled with the box. */
const adornIcon = 'shrink-0 text-icon-tertiary group-data-[disabled=true]/tc:text-icon-disabled';
const adornText = 'shrink-0 whitespace-nowrap text-text-tertiary group-data-[disabled=true]/tc:text-text-disabled';

export interface TextControlProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'prefix' | 'value' | 'defaultValue' | 'onChange' | 'children'> {
  /** Figma `Type`: one line, a text area, or a select trigger with the chevron. */
  type?: TextControlType;
  /** Figma `Size`. Heights match Button sm / md / lg. */
  size?: TextControlSize;
  /** Figma `Status`. `invalid` sets the danger border, the status icon and `aria-invalid`; the message is a 2.12 Help text. */
  status?: TextControlStatus;
  /** Figma `Text` with `Filled=true`: the value. Figma `Filled` is derived from it. Select: the chosen option's text. */
  value?: string;
  defaultValue?: string;
  /** Native change event of the input / textarea. */
  onChange?: (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => void;
  /** Called with the new text (single-line, multi-line). */
  onValueChange?: (value: string) => void;
  /** Native `type` of the single-line input (`email`, `password`, `tel`, …). */
  inputType?: HTMLInputTypeAttribute;
  /** Figma `Show leading icon` + `Leading icon`. */
  leadingIcon?: IconName;
  /** Custom leading visual for instance swaps of the leading icon (a payment mark on 3.2 `Type=payment`). */
  leadingVisual?: ReactNode;
  /** Figma `Show avatar`: a 2.6 Avatar `Size=xs` before the value (select values that are people). */
  avatar?: { src?: string; initials?: string };
  /** Figma `Show dot`: a leading status dot (select values that are statuses). */
  showDot?: boolean;
  /** Figma `Show prefix` + `Prefix`: static text that is part of the value but not typed (single-line). */
  prefix?: string;
  /** Figma `Show supporting text` + `Supporting text`: secondary text after the value (select). */
  supportingText?: ReactNode;
  /** Figma `Show help icon`: a trailing 2.13 Help icon. Replaced by the status icon when invalid. */
  showHelpIcon?: boolean;
  /** Text of the help icon's Tooltip. */
  helpText?: ReactNode;
  /** Figma `Show shortcut`: the keys of the shortcut that focuses the control, one 2.17 Kbd per key. */
  shortcut?: string | string[];
  /** Figma `Show trailing icon` + `Trailing icon`. */
  trailingIcon?: IconName;
  /** Makes the trailing icon a button (e.g. password reveal). Give it `trailingIconLabel`. */
  onTrailingIconClick?: () => void;
  /** Accessible name of the trailing icon button ("Show password"). */
  trailingIconLabel?: string;
  /** Figma `Show resize handle` (multi-line). */
  showResizeHandle?: boolean;
  /** Multi-line: initial number of rows above the minimum height. */
  rows?: number;
  /** Select: the menu is open (`aria-expanded`); the open trigger looks like `State=focus`. */
  open?: boolean;
  /** Select: click handler of the trigger. */
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  /** Documentation only: Figma `State=hover` or `State=focus`. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
  /** Ref to the inner control (input, textarea or button). */
  ref?: Ref<HTMLElement>;
  /** Extra classes for the inner control. */
  controlClassName?: string;
}

/** Decorative resize grip for multi-line (12 × 12, inset 6); the native resizer underneath does the work. */
function ResizeGrip() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className="pointer-events-none absolute bottom-sm right-sm size-(--size-icon-xs) stroke-current text-icon-tertiary group-data-[disabled=true]/tc:text-icon-disabled"
      fill="none"
      strokeWidth={1.25}
      strokeLinecap="round"
    >
      <path d="M11 3 3 11M11 7.5 7.5 11" />
    </svg>
  );
}

export function TextControl({
  type = 'single-line',
  size = 'md',
  status = 'none',
  value,
  defaultValue,
  onChange,
  onValueChange,
  inputType = 'text',
  leadingIcon,
  leadingVisual,
  avatar,
  showDot = false,
  prefix,
  supportingText,
  showHelpIcon = false,
  helpText = 'This is a tooltip',
  shortcut,
  trailingIcon,
  onTrailingIconClick,
  trailingIconLabel,
  showResizeHandle = true,
  rows,
  open,
  onClick,
  forceState,
  disabled,
  placeholder,
  className,
  style,
  controlClassName,
  ref,
  ...rest
}: TextControlProps) {
  const inner = useRef<HTMLElement | null>(null);
  const setRef = (el: HTMLElement | null) => {
    inner.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as { current: HTMLElement | null }).current = el;
  };
  const invalid = status === 'invalid';
  const multi = type === 'multi-line';
  const select = type === 'select';
  const shownForce = select && open ? 'focus' : forceState;
  const handle = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  /** Clicking the box (not an adornment button) focuses or opens the control. */
  const onBoxPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (disabled || !inner.current || t === inner.current || t.closest('button, a, input, textarea, [tabindex]')) return;
    e.preventDefault();
    inner.current.focus();
    if (select) inner.current.click();
  };

  const fieldText = cn(
    'min-w-0 flex-1 bg-transparent outline-none placeholder:text-text-placeholder',
    'is-disabled:cursor-not-allowed is-disabled:text-text-disabled is-disabled:placeholder:text-text-disabled',
    textStyle[size],
    mobileText,
    controlClassName,
  );

  if (multi) {
    return (
      <div
        className={cn(textControlSurface(status), 'flex-col', className)}
        style={style}
        data-disabled={disabled || undefined}
        onPointerDown={onBoxPointerDown}
        {...forceAttr(shownForce)}
      >
        <textarea
          ref={setRef as Ref<HTMLTextAreaElement>}
          data-text-control-field=""
          aria-invalid={invalid || undefined}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={handle}
          rows={rows}
          className={cn(
            fieldText,
            'block w-full text-text-primary min-h-[calc(var(--text-control-multiline-min-height)-2*var(--border-width-default))] rounded-control py-(--text-control-padding-y-multiline) align-top [field-sizing:content]',
            padX[size],
            showResizeHandle ? 'resize-y [&::-webkit-resizer]:bg-transparent' : 'resize-none',
          )}
          {...(rest as InputHTMLAttributes<HTMLTextAreaElement>)}
        />
        {showResizeHandle && <ResizeGrip />}
      </div>
    );
  }

  const filled = value != null ? value !== '' : defaultValue != null && defaultValue !== '';
  const keys = shortcut == null ? [] : Array.isArray(shortcut) ? shortcut : [shortcut];

  const control = select ? (
    <button
      ref={setRef as Ref<HTMLButtonElement>}
      type="button"
      data-text-control-field=""
      aria-haspopup="listbox"
      aria-expanded={open ?? false}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(fieldText, 'flex h-full cursor-pointer items-center gap-md text-start', filled ? 'text-text-primary' : 'text-text-placeholder')}
      {...(rest as HTMLAttributes<HTMLButtonElement>)}
    >
      {leadingIcon && <Icon name={leadingIcon} size="md" className={adornIcon} />}
      {avatar && <Avatar size="xs" type={avatar.src ? 'image' : avatar.initials ? 'initials' : 'icon'} src={avatar.src} initials={avatar.initials} alt="" />}
      {showDot && <span aria-hidden className="size-(--size-indicator-sm) shrink-0 rounded-full bg-icon-success group-data-[disabled=true]/tc:bg-icon-disabled" />}
      <span className="min-w-0 flex-1 truncate">
        {filled ? value ?? defaultValue : placeholder}
        {supportingText != null && filled && <span className={cn(adornText, 'ms-md')}>{supportingText}</span>}
      </span>
    </button>
  ) : (
    <>
      {leadingVisual}
      {leadingIcon && <Icon name={leadingIcon} size="md" className={adornIcon} />}
      {avatar && <Avatar size="xs" type={avatar.src ? 'image' : avatar.initials ? 'initials' : 'icon'} src={avatar.src} initials={avatar.initials} alt="" />}
      {showDot && <span aria-hidden className="size-(--size-indicator-sm) shrink-0 rounded-full bg-icon-success group-data-[disabled=true]/tc:bg-icon-disabled" />}
      <input
        ref={setRef as Ref<HTMLInputElement>}
        type={inputType}
        data-text-control-field=""
        aria-invalid={invalid || undefined}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={handle}
        className={cn(fieldText, 'h-full truncate text-text-primary')}
        {...rest}
      />
      {supportingText != null && <span className={adornText}>{supportingText}</span>}
    </>
  );

  return (
    <div
      className={cn(textControlSurface(status), 'items-center gap-md', boxSize[size], prefix && !select && 'ps-0', textStyle[size], className)}
      style={style}
      data-disabled={disabled || undefined}
      onPointerDown={onBoxPointerDown}
      {...forceAttr(shownForce)}
    >
      {prefix && !select && (
        <span
          className={cn(
            adornText,
            'flex items-center self-stretch border-e-(length:--border-width-default) border-border-default group-data-[disabled=true]/tc:border-border-disabled',
            padX[size],
          )}
        >
          {prefix}
        </span>
      )}
      {/* Content: fills; adornments stay fixed. */}
      <div className="flex h-full min-w-0 flex-1 items-center gap-md">{control}</div>
      {showHelpIcon && !invalid && <HelpIcon text={helpText} label="More information" className="group-data-[disabled=true]/tc:text-icon-disabled" />}
      {keys.length > 0 && (
        <span className="flex shrink-0 items-center gap-xxs" aria-hidden={!!rest['aria-keyshortcuts'] || undefined}>
          {keys.map((k) => (
            <Kbd key={k} size="sm" text={k} />
          ))}
        </span>
      )}
      {trailingIcon &&
        (onTrailingIconClick ? (
          <button
            type="button"
            aria-label={trailingIconLabel}
            onClick={onTrailingIconClick}
            disabled={disabled}
            className={cn(
              'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xs outline-none',
              'text-icon-tertiary is-hover:text-icon-tertiary-hover is-focus:shadow-focus-default',
              'is-disabled:cursor-not-allowed is-disabled:text-icon-disabled',
              "pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:after:inset-[min(0px,calc((100%_-_var(--size-touch-min))/2))]",
            )}
          >
            <Icon name={trailingIcon} size="md" />
          </button>
        ) : (
          <Icon name={trailingIcon} size="md" className={adornIcon} />
        ))}
      {invalid && <Icon name="alerts/alert-circle" size="sm" className="shrink-0 text-icon-danger" />}
      {select && <Icon name="arrows/chevron-down" size="md" className={adornIcon} />}
    </div>
  );
}
