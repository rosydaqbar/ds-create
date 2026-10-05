import { useId, useRef, useState, type ClipboardEvent, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { type ForcedState } from '@/lib/types';
import { type IconName } from '@/icons';
import { HelpText } from '../parts/HelpText';
import { Label } from '../parts/Label';
import { Tag } from '../parts/Tag';
import { TextControl, type TextControlProps, type TextControlStatus } from '../parts/TextControl';
import { PaymentMark } from './_PaymentMark';
import { CodeFieldCell, TextFieldAddon, TextFieldTagBox, cellGap, cellSize } from './_TextFieldParts';

/**
 * 3.2 Text field — the complete form field for typed data: Label (2.11) → Text control (2.10) → Help text (2.12).
 * Figma: `Text field` · Size × Type × Status × Filled × State (390 variants),
 *        `Textarea field` · Size × Type × Status × Filled × State (60),
 *        `Code field` · Size × Type (6).
 * Private parts (`.Main`) live in `_TextFieldParts.tsx`: addon, tag box, code cell — internal, not exported.
 *
 * The Label is linked to the control (`htmlFor`), the Help text is its description (`aria-describedby`),
 * and `status="invalid"` sets `aria-invalid` and turns the Help text into the error message.
 */

export type TextFieldSize = 'sm' | 'md' | 'lg';
export type TextFieldType =
  | 'default'
  | 'leading-text'
  | 'leading-dropdown'
  | 'trailing-dropdown'
  | 'trailing-button'
  | 'password'
  | 'payment'
  | 'date-time'
  | 'tags-inner'
  | 'tags-outer'
  | 'counter-horizontal'
  | 'counter-vertical'
  | 'file-upload';

export const textFieldTypes: readonly TextFieldType[] = [
  'default',
  'leading-text',
  'leading-dropdown',
  'trailing-dropdown',
  'trailing-button',
  'password',
  'payment',
  'date-time',
  'tags-inner',
  'tags-outer',
  'counter-horizontal',
  'counter-vertical',
  'file-upload',
];

/** Controlled when `value` is given, otherwise internal state seeded from `initial`. */
function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState<T>(initial);
  const controlled = value !== undefined;
  return [
    controlled ? (value as T) : inner,
    (v: T) => {
      if (!controlled) setInner(v);
      onChange?.(v);
    },
  ];
}

const labelSize = (s: TextFieldSize) => (s === 'sm' ? 'sm' : 'md');
const joinedBorder = '-ms-(--border-width-default)';
/** The Text control sits above its addons on focus (ring not covered) and when invalid (danger line wins at the joint). */
const controlLayer = (invalid: boolean) =>
  cn('flex-1', invalid && 'z-[1]', 'has-[[data-text-control-field]:focus-visible]:z-10 data-[force=focus]:z-10');

/* ---------- field shell ---------- */

interface ShellProps {
  size: TextFieldSize;
  status: TextControlStatus;
  id: string;
  hintId: string;
  label?: ReactNode;
  labelAs?: 'label' | 'span';
  labelId?: string;
  hint?: ReactNode;
  required?: boolean;
  showHelpIcon?: boolean;
  helpText?: ReactNode;
  className?: string;
  children: ReactNode;
}

function FieldShell({ size, status, id, hintId, label, labelAs = 'label', labelId, hint, required, showHelpIcon, helpText, className, children }: ShellProps) {
  return (
    <div data-anatomy="field" className={cn('relative flex w-full min-w-0 flex-col gap-sm', className)}>
      {label != null && (
        <Label
          as={labelAs}
          id={labelId}
          htmlFor={labelAs === 'label' ? id : undefined}
          size={labelSize(size)}
          label={label}
          showRequired={required}
          showHelpIcon={showHelpIcon}
          helpText={helpText}
        />
      )}
      {children}
      {hint != null && <HelpText id={hintId} size={labelSize(size)} status={status} hint={hint} />}
    </div>
  );
}

/* ---------- Text field ---------- */

type ControlPassThrough = Omit<
  TextControlProps,
  'type' | 'size' | 'status' | 'forceState' | 'value' | 'defaultValue' | 'onValueChange' | 'className' | 'style' | 'prefix'
>;

export interface TextFieldProps extends ControlPassThrough {
  /** Figma `Size`. Label and Help text follow: `sm` → sm, `md` / `lg` → md. */
  size?: TextFieldSize;
  /** Figma `Type`: what sits before and after the value. */
  type?: TextFieldType;
  /** Figma `Status`. `invalid` turns the border and the Help text to danger; put the error copy in `hint`. */
  status?: TextControlStatus;
  /** Figma `Show label` + Label `Label`. Present = shown. */
  label?: ReactNode;
  /** Figma `Show hint` + Help text `Hint`: the hint, or the error message when invalid. */
  hint?: ReactNode;
  /** Label `Show help icon` (exposed nested instance) and its Tooltip text. */
  showLabelHelpIcon?: boolean;
  labelHelpText?: ReactNode;
  /** Figma `Text` (Filled=true): the value. Figma `Filled` is derived from it. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** `Type=leading-text`: the static prefix inside the box. */
  prefix?: string;
  /** Dropdown addon (`leading-dropdown`, `trailing-dropdown`, `date-time` with `showTime`): options, value and its accessible name. */
  dropdownOptions?: string[];
  dropdownValue?: string;
  defaultDropdownValue?: string;
  onDropdownChange?: (value: string) => void;
  dropdownLabel?: string;
  /** `trailing-button` / `file-upload`: the Button addon's label, icon and action. */
  buttonLabel?: string;
  buttonIcon?: IconName;
  onButtonClick?: () => void;
  /** `payment`: the card mark in the leading slot (1.8 Brand assets); a neutral mark by default. */
  paymentMark?: ReactNode;
  /** Figma `Show time` (`date-time`): the trailing time dropdown. */
  showTime?: boolean;
  /** `tags-inner` / `tags-outer`: the Tags. */
  tags?: string[];
  defaultTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  /** `file-upload`: accepted types, multiple files, and the chosen files. */
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  /** Documentation only: Figma `State=focus` (or the Text control's hover). */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
  /** Props of the nested Text control instance (help icon, shortcut, …). */
  controlProps?: Partial<TextControlProps>;
  className?: string;
}

const typeDefaults: Partial<Record<TextFieldType, { options: string[]; value: string; label: string }>> = {
  'leading-dropdown': { options: ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU'], value: 'US', label: 'Country code' },
  'trailing-dropdown': { options: ['USD', 'EUR', 'GBP', 'JPY'], value: 'USD', label: 'Currency' },
  'date-time': {
    options: Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`),
    value: '09:00',
    label: 'Time',
  },
};

/** Groups card numbers in fours as people type. */
const formatCard = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

export function TextField({
  size = 'md',
  type = 'default',
  status = 'none',
  label,
  hint,
  showLabelHelpIcon = false,
  labelHelpText,
  value,
  defaultValue,
  onValueChange,
  prefix = 'https://',
  dropdownOptions,
  dropdownValue,
  defaultDropdownValue,
  onDropdownChange,
  dropdownLabel,
  buttonLabel,
  buttonIcon,
  onButtonClick,
  paymentMark,
  showTime = false,
  tags,
  defaultTags = [],
  onTagsChange,
  accept,
  multiple,
  onFilesChange,
  forceState,
  controlProps,
  id: idProp,
  disabled,
  required,
  className,
  ...rest
}: TextFieldProps) {
  const auto = useId();
  const id = idProp ?? `tf-${auto}`;
  const hintId = `${id}-hint`;
  const labelId = `${id}-label`;
  const invalid = status === 'invalid';
  const describedBy = [rest['aria-describedby'], hint != null ? hintId : undefined].filter(Boolean).join(' ') || undefined;

  const [text, setText] = useControllable(value, defaultValue ?? '', onValueChange);
  const dd = typeDefaults[type];
  const [ddValue, setDdValue] = useControllable(dropdownValue, defaultDropdownValue ?? dd?.value ?? '', onDropdownChange);
  const [tagList, setTags] = useControllable(tags, defaultTags, onTagsChange);
  const [reveal, setReveal] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const step = (dir: 1 | -1) => {
    const s = Number(rest.step ?? 1);
    const n = (Number(text) || 0) + dir * s;
    const min = rest.min != null ? Number(rest.min) : -Infinity;
    const max = rest.max != null ? Number(rest.max) : Infinity;
    setText(String(Math.min(max, Math.max(min, n))));
  };

  const addonCommon = { size, status, disabled } as const;
  const dropdownAddon = (placement: 'left' | 'right') => (
    <TextFieldAddon
      {...addonCommon}
      type="dropdown"
      placement={placement}
      text={ddValue}
      options={dropdownOptions ?? dd?.options}
      onSelect={setDdValue}
      label={dropdownLabel ?? dd?.label}
    />
  );

  const joinedLeft = ['leading-dropdown', 'counter-horizontal', 'file-upload'].includes(type);
  const joinedRight = ['trailing-dropdown', 'trailing-button', 'counter-horizontal', 'counter-vertical'].includes(type) || (type === 'date-time' && showTime);

  /* Tags inside the box replace the Text control. */
  if (type === 'tags-inner') {
    return (
      <FieldShell size={size} status={status} id={id} hintId={hintId} label={label} labelId={labelId} hint={hint} required={required} showHelpIcon={showLabelHelpIcon} helpText={labelHelpText} className={className}>
        <TextFieldTagBox
          size={size}
          type="single-line"
          status={status}
          disabled={disabled}
          forceState={forceState === 'focus' ? 'focus' : undefined}
          tags={tagList}
          onAdd={(t) => setTags([...tagList, t])}
          onRemove={(i) => setTags(tagList.filter((_, j) => j !== i))}
          id={id}
          placeholder={rest.placeholder}
          describedBy={describedBy}
          required={required}
          labelledBy={label != null ? labelId : rest['aria-labelledby']}
          ariaLabel={rest['aria-label']}
        />
      </FieldShell>
    );
  }

  const outerTags = type === 'tags-outer';
  const fileMode = type === 'file-upload';

  const control = (
    <TextControl
      size={size}
      status={status}
      forceState={forceState}
      id={id}
      disabled={disabled}
      required={required}
      value={text}
      onValueChange={(v) => setText(type === 'payment' ? formatCard(v) : v)}
      aria-describedby={describedBy}
      {...rest}
      {...(type === 'leading-text' && { prefix })}
      {...(type === 'password' && {
        inputType: reveal ? 'text' : 'password',
        autoComplete: rest.autoComplete ?? 'current-password',
        trailingIcon: reveal ? 'general/eye-off' : 'general/eye',
        trailingIconLabel: reveal ? 'Hide password' : 'Show password',
        onTrailingIconClick: () => setReveal((r) => !r),
      })}
      {...(type === 'payment' && {
        leadingVisual: paymentMark ?? <PaymentMark />,
        inputMode: 'numeric' as const,
        autoComplete: 'cc-number',
      })}
      {...(type === 'date-time' && { leadingIcon: rest.leadingIcon ?? 'time/calendar' })}
      {...((type === 'counter-horizontal' || type === 'counter-vertical') && {
        inputMode: 'numeric' as const,
        role: 'spinbutton',
        'aria-valuenow': text === '' ? undefined : Number(text),
        'aria-valuemin': rest.min != null ? Number(rest.min) : undefined,
        'aria-valuemax': rest.max != null ? Number(rest.max) : undefined,
        onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'ArrowUp') (e.preventDefault(), step(1));
          if (e.key === 'ArrowDown') (e.preventDefault(), step(-1));
          rest.onKeyDown?.(e);
        },
      })}
      {...(type === 'counter-horizontal' && { controlClassName: 'text-center' })}
      {...(fileMode && {
        readOnly: true,
        tabIndex: -1,
        'aria-hidden': true,
        onClick: () => fileInput.current?.click(),
        controlClassName: 'cursor-pointer',
      })}
      {...(outerTags && {
        onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
          if ((e.key === 'Enter' || e.key === ',') && text.trim()) {
            e.preventDefault();
            const t = text.trim();
            if (!tagList.includes(t)) setTags([...tagList, t]);
            setText('');
          }
          rest.onKeyDown?.(e);
        },
      })}
      {...controlProps}
      className={cn(
        controlLayer(invalid),
        joinedLeft && 'rounded-s-none',
        joinedRight && 'rounded-e-none',
        joinedLeft && joinedBorder,
        controlProps?.className,
      )}
    />
  );

  const trailing =
    type === 'trailing-dropdown' || (type === 'date-time' && showTime) ? (
      <span className={cn('flex', joinedBorder)}>{dropdownAddon('right')}</span>
    ) : type === 'trailing-button' ? (
      <span className={cn('flex', joinedBorder)}>
        <TextFieldAddon {...addonCommon} type="button" placement="right" text={buttonLabel ?? 'Copy'} icon={buttonIcon ?? 'general/copy'} onClick={onButtonClick} />
      </span>
    ) : type === 'counter-horizontal' ? (
      <span className={cn('flex', joinedBorder)}>
        <TextFieldAddon {...addonCommon} type="stepper" placement="right" label="Increase" onClick={() => step(1)} />
      </span>
    ) : type === 'counter-vertical' ? (
      <span className={cn('flex', joinedBorder)}>
        <TextFieldAddon {...addonCommon} type="stepper-vertical" placement="right" onStepUp={() => step(1)} onStepDown={() => step(-1)} />
      </span>
    ) : null;

  const leading =
    type === 'leading-dropdown' ? (
      dropdownAddon('left')
    ) : type === 'counter-horizontal' ? (
      <TextFieldAddon {...addonCommon} type="stepper" placement="left" label="Decrease" onClick={() => step(-1)} />
    ) : fileMode ? (
      <span id={`${id}-choose`} className="flex">
        <TextFieldAddon {...addonCommon} type="button" placement="left" text={buttonLabel ?? 'Choose file'} icon={buttonIcon} onClick={() => fileInput.current?.click()} />
      </span>
    ) : null;

  return (
    <FieldShell
      size={size}
      status={status}
      id={id}
      hintId={hintId}
      label={label}
      labelAs={fileMode ? 'span' : 'label'}
      labelId={labelId}
      hint={hint}
      required={required}
      showHelpIcon={showLabelHelpIcon}
      helpText={labelHelpText}
      className={className}
    >
      <div data-anatomy="control-row" className="flex w-full items-stretch">
        {leading}
        {control}
        {trailing}
      </div>
      {fileMode && (
        <input
          ref={fileInput}
          type="file"
          tabIndex={-1}
          aria-labelledby={label != null ? labelId : rest['aria-labelledby']}
          aria-label={label == null && !rest['aria-labelledby'] ? (rest['aria-label'] ?? 'Choose file') : undefined}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setText(files.map((f) => f.name).join(', '));
            onFilesChange?.(files);
          }}
        />
      )}
      {outerTags && tagList.length > 0 && (
        <div data-anatomy="tags-row" className="flex w-full flex-wrap gap-sm">
          {tagList.map((t, i) => (
            <Tag key={t} size="sm" type="removable" label={t} disabled={disabled} onRemove={() => setTags(tagList.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
    </FieldShell>
  );
}

/* ---------- Textarea field ---------- */

export type TextareaFieldType = 'default' | 'tags-inner' | 'tags-outer';

export interface TextareaFieldProps extends Omit<ControlPassThrough, 'inputType'> {
  /** Figma `Size`. */
  size?: 'sm' | 'md';
  /** Figma `Type`. */
  type?: TextareaFieldType;
  /** Figma `Status`. */
  status?: TextControlStatus;
  /** Figma `Show label` + Label text. */
  label?: ReactNode;
  /** Figma `Show hint` + Help text. */
  hint?: ReactNode;
  showLabelHelpIcon?: boolean;
  labelHelpText?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  tags?: string[];
  defaultTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  /** Documentation only: Figma `State=focus`. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
  controlProps?: Partial<TextControlProps>;
  className?: string;
}

export function TextareaField({
  size = 'md',
  type = 'default',
  status = 'none',
  label,
  hint,
  showLabelHelpIcon = false,
  labelHelpText,
  value,
  defaultValue,
  onValueChange,
  tags,
  defaultTags = [],
  onTagsChange,
  showResizeHandle = true,
  forceState,
  controlProps,
  id: idProp,
  disabled,
  required,
  className,
  ...rest
}: TextareaFieldProps) {
  const auto = useId();
  const id = idProp ?? `ta-${auto}`;
  const hintId = `${id}-hint`;
  const labelId = `${id}-label`;
  const describedBy = [rest['aria-describedby'], hint != null ? hintId : undefined].filter(Boolean).join(' ') || undefined;
  const [text, setText] = useControllable(value, defaultValue ?? '', onValueChange);
  const [tagList, setTags] = useControllable(tags, defaultTags, onTagsChange);
  const shell = { size, status, id, hintId, label, labelId, hint, required, showHelpIcon: showLabelHelpIcon, helpText: labelHelpText, className } as const;

  if (type === 'tags-inner') {
    return (
      <FieldShell {...shell}>
        <TextFieldTagBox
          size={size}
          type="multi-line"
          status={status}
          disabled={disabled}
          forceState={forceState === 'focus' ? 'focus' : undefined}
          tags={tagList}
          onAdd={(t) => setTags([...tagList, t])}
          onRemove={(i) => setTags(tagList.filter((_, j) => j !== i))}
          id={id}
          placeholder={rest.placeholder}
          describedBy={describedBy}
          required={required}
          labelledBy={label != null ? labelId : rest['aria-labelledby']}
          ariaLabel={rest['aria-label']}
        />
      </FieldShell>
    );
  }

  return (
    <FieldShell {...shell}>
      <TextControl
        type="multi-line"
        size={size}
        status={status}
        forceState={forceState}
        id={id}
        disabled={disabled}
        required={required}
        value={text}
        onValueChange={setText}
        showResizeHandle={showResizeHandle}
        aria-describedby={describedBy}
        {...rest}
        {...(type === 'tags-outer' && {
          placeholder: rest.placeholder ?? 'Add a topic and press Enter',
          onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
              e.preventDefault();
              const t = text.trim();
              if (!tagList.includes(t)) setTags([...tagList, t]);
              setText('');
            }
          },
        })}
        {...controlProps}
      />
      {type === 'tags-outer' && tagList.length > 0 && (
        <div data-anatomy="tags-row" className="flex w-full flex-wrap gap-sm">
          {tagList.map((t, i) => (
            <Tag key={t} size="sm" type="removable" label={t} disabled={disabled} onRemove={() => setTags(tagList.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
    </FieldShell>
  );
}

/* ---------- Code field ---------- */

export interface CodeFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Figma `Size`. Cells keep their size; the field grows wider rather than shrinking digits. */
  size?: 'sm' | 'md' | 'lg';
  /** Figma `Type`: four cells, or two groups of three with a separator. */
  type?: '4-digit' | '6-digit';
  /** Validation (each cell's `Status`). */
  status?: TextControlStatus;
  /** Figma `Show label` + Label text. */
  label?: ReactNode;
  /** Figma `Show hint` + Help text. */
  hint?: ReactNode;
  /** The code typed so far (digits only). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (code: string) => void;
  /** Called once every cell holds a digit. */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  required?: boolean;
  /** Documentation only: focus ring on the next empty cell. */
  forceState?: 'focus';
}

export function CodeField({
  size = 'md',
  type = '4-digit',
  status = 'none',
  label,
  hint,
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
  disabled,
  required,
  forceState,
  id: idProp,
  className,
  ...rest
}: CodeFieldProps) {
  const auto = useId();
  const id = idProp ?? `cf-${auto}`;
  const length = type === '6-digit' ? 6 : 4;
  const [code, setCode] = useControllable(value, defaultValue, onValueChange);
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => code[i] ?? '');

  const update = (next: string[]) => {
    const joined = next.join('').slice(0, length);
    setCode(joined);
    if (joined.length === length && next.every(Boolean)) onComplete?.(joined);
  };
  const focusCell = (i: number) => cells.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const onDigit = (i: number, d: string) => {
    const next = [...digits];
    next[i] = d;
    update(next);
    if (d) focusCell(i + 1);
  };
  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = '';
      update(next);
      focusCell(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusCell(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusCell(i + 1);
    }
  };
  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    for (let k = 0; k < pasted.length && i + k < length; k++) next[i + k] = pasted[k];
    update(next);
    focusCell(Math.min(length - 1, i + pasted.length));
  };

  const forcedIndex = forceState === 'focus' ? Math.min(length - 1, digits.findIndex((d) => !d) === -1 ? length - 1 : digits.findIndex((d) => !d)) : -1;
  const cell = (i: number) => (
    <CodeFieldCell
      key={i}
      size={size}
      status={status}
      digit={digits[i]}
      disabled={disabled}
      forceState={i === forcedIndex ? 'focus' : undefined}
      inputRef={(el) => (cells.current[i] = el)}
      onDigit={(d) => onDigit(i, d)}
      onKeyDown={(e) => onKeyDown(i, e)}
      onPaste={(e) => onPaste(i, e)}
      autoComplete={i === 0 ? 'one-time-code' : 'off'}
      aria-label={`Digit ${i + 1} of ${length}`}
      aria-describedby={hint != null ? `${id}-hint` : undefined}
      aria-required={required || undefined}
      id={i === 0 ? id : undefined}
    />
  );
  const half = length / 2;
  return (
    <div data-anatomy="field" className={cn('inline-flex flex-col gap-sm', className)} {...rest}>
      {label != null && <Label as="span" id={`${id}-label`} size={size === 'sm' ? 'sm' : 'md'} label={label} showRequired={required} />}
      <div role="group" aria-labelledby={label != null ? `${id}-label` : undefined} className={cn('flex items-center', cellGap[size])}>
        {type === '6-digit' ? (
          <>
            {digits.slice(0, half).map((_, i) => cell(i))}
            <span aria-hidden className={cn('text-text-placeholder', cellSize[size].split(' ')[1])}>
              –
            </span>
            {digits.slice(half).map((_, i) => cell(i + half))}
          </>
        ) : (
          digits.map((_, i) => cell(i))
        )}
      </div>
      {hint != null && <HelpText id={`${id}-hint`} size={size === 'sm' ? 'sm' : 'md'} status={status} hint={hint} />}
    </div>
  );
}
