import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { presenceClass, usePresence } from '@/lib/motion';
import { isPrintableKey, useControllable, useDismiss, usePopupSide, useScrollThumb, useTypeahead } from '@/lib/popup';
import { type IconName } from '@/icons';
import { HelpText } from '../parts/HelpText';
import { Label } from '../parts/Label';
import { TextControl, type TextControlStatus } from '../parts/TextControl';
import { MultiSelectOptionRow, SelectOptionRow, SelectScrollBar, SelectTagBox, selectListSurface } from './_SelectParts';

/**
 * 3.5 Select — pick one value (Select) or several (MultiSelect) from a list that may be long.
 * Figma: `Select` · Size × Type × (Filled, State, Open, Status) (144 variants) · Show label, Show hint, Show scroll bar.
 *        `Multi-select` · Size × (Filled, State, Open) (18 variants) · Show label, Show hint, Show scroll bar, Show empty state.
 * Private parts (`.Main`) live in `_SelectParts.tsx`: option rows, tag box, scroll bar.
 *
 * Label (2.11) → trigger (Text control 2.10, or the tag box) → Help text (2.12); the list opens directly under
 * the trigger (above it near the bottom of the viewport), matches its width, and scrolls past `select/list/max-height`.
 *
 * Behaviour (combobox pattern): focus stays on the trigger and the active option is `aria-activedescendant`.
 * Enter, Space, Down or Up open the list; arrows, Home, End and Page keys move; typing jumps to a match
 * (or filters, for search, tags and Multi-select); Enter chooses; Escape closes; a press outside closes.
 * Figma `Filled` comes from the value, `Show empty state` from a search with no match,
 * `Show scroll bar` from a list longer than the max height.
 */

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectType = 'default' | 'icon' | 'avatar' | 'dot' | 'search' | 'tags';
export const selectTypes: readonly SelectType[] = ['default', 'icon', 'avatar', 'dot', 'search', 'tags'];

export interface SelectOption {
  value: string;
  /** Figma option `Text`. */
  label: string;
  /** Figma option `Supporting text` ("@olivia", "12 members"). */
  supportingText?: string;
  /** `type="icon"`: the leading icon. */
  icon?: IconName;
  /** `type="avatar"`: the person's avatar. Without `src` it shows the initials. */
  avatar?: { src?: string; initials?: string };
  disabled?: boolean;
}
export type SelectOptionInput = SelectOption | string;

const normalize = (o: SelectOptionInput): SelectOption => (typeof o === 'string' ? { value: o, label: o } : o);
/** True when the caller sets a width (utilities don't merge, so w-full would compete). */
const hasWidth = (c?: string) => !!c && /(^|\s)w-/.test(c);
const labelSize = (s: SelectSize) => (s === 'sm' ? 'sm' : 'md');
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

/** Trigger attributes: id, aria-*, data-* and handlers go to the trigger control. */
type TriggerAttributes = Omit<HTMLAttributes<HTMLElement>, 'defaultValue' | 'onChange' | 'children' | 'placeholder'>;

interface SelectCommonProps extends TriggerAttributes {
  /** Figma `Size`. Label and Help text follow: `sm` → sm, `md` / `lg` → md. */
  size?: SelectSize;
  /** Figma `Show label` + Label `Label`. Present = shown. Without it, give the trigger an `aria-label`. */
  label?: ReactNode;
  /** Figma `Show hint` + Help text `Hint`: the hint, or the error message when invalid. */
  hint?: ReactNode;
  /** Label `Show required`. */
  required?: boolean;
  /** Label `Show help icon` and its Tooltip text. */
  showLabelHelpIcon?: boolean;
  labelHelpText?: ReactNode;
  /** The options, in order. Strings are shorthand for `{ value, label }`. */
  options?: SelectOptionInput[];
  placeholder?: string;
  /** Figma `State=disabled`. */
  disabled?: boolean;
  /** Figma `Open`. Omit for an uncontrolled list. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Search text (search, tags, Multi-select). Uncontrolled; seed it with `defaultQuery`. */
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Empty-state text for a search without matches. */
  emptyText?: (query: string) => ReactNode;
  /** Form field name: hidden inputs carry the chosen value(s). */
  name?: string;
  /** Documentation only: Figma `State=focus`. */
  forceState?: 'focus';
  /**
   * Lay the open list out in the page flow, as the Figma `Open=true` variant hugs its list.
   * For documentation and static layouts; by default the list floats over the content below.
   */
  inlinePopup?: boolean;
  className?: string;
}

export interface SelectProps extends SelectCommonProps {
  /** Figma `Type`: what the trigger and the options show. */
  type?: SelectType;
  /** Figma `Status`. `invalid` turns the border and the Help text to danger. */
  status?: TextControlStatus;
  /** The chosen option's value; `null` for none. Figma `Filled` is derived from it. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** `type="icon"`: icon shown before the placeholder (the chosen option's icon replaces it). */
  leadingIcon?: IconName;
}

export interface MultiSelectProps extends SelectCommonProps {
  /** Figma `Status` (shared with Select). */
  status?: TextControlStatus;
  /** The chosen values, shown as removable Tags. Figma `Filled` is derived from them. */
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
}

/** Placeholder content matching the Figma sample. */
export const selectSampleOptions: SelectOption[] = [
  { value: 'olivia', label: 'Olivia Rhye', supportingText: '@olivia', icon: 'users/user' },
  { value: 'phoenix', label: 'Phoenix Baker', supportingText: '@phoenix', icon: 'users/user' },
  { value: 'lana', label: 'Lana Steiner', supportingText: '@lana', icon: 'users/user' },
  { value: 'demi', label: 'Demi Wilkinson', supportingText: '@demi', icon: 'users/user' },
  { value: 'candice', label: 'Candice Wu', supportingText: '@candice', icon: 'users/user' },
  { value: 'natali', label: 'Natali Craig', supportingText: '@natali', icon: 'users/user' },
];

interface FieldProps extends SelectCommonProps {
  multiple: boolean;
  type: SelectType;
  status: TextControlStatus;
  chosen: string[];
  onChoose: (value: string) => void;
  onRemove: (index: number) => void;
  leadingIcon?: IconName;
}

function SelectField({
  multiple,
  type,
  status,
  chosen,
  onChoose,
  onRemove,
  leadingIcon,
  size = 'md',
  label,
  hint,
  required,
  showLabelHelpIcon,
  labelHelpText,
  options: optionsProp = selectSampleOptions,
  placeholder,
  disabled = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  defaultQuery,
  onQueryChange,
  emptyText = (q) => `No results for “${q}”`,
  name,
  forceState,
  inlinePopup = false,
  className,
  id: idProp,
  ...rest
}: FieldProps) {
  const auto = useId();
  const id = idProp ?? `sel-${auto.replace(/:/g, '')}`;
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const hintId = `${id}-hint`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  const options = optionsProp.map(normalize);
  const searchable = multiple || type === 'search' || type === 'tags';
  const tagged = multiple || type === 'tags';
  const textInput = searchable;

  const [open, setOpenRaw] = useControllable(openProp, defaultOpen, onOpenChange);
  const [query, setQueryRaw] = useState<string | null>(defaultQuery ?? null);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const control = useRef<HTMLElement | null>(null);
  const typeahead = useTypeahead();

  const q = query ?? '';
  const filtered = options
    .map((o, index) => ({ o, index }))
    .filter(({ o }) => !searchable || !q || o.label.toLowerCase().includes(q.toLowerCase()));
  const selectedOptions = chosen.map((v) => options.find((o) => o.value === v)).filter(Boolean) as SelectOption[];
  const single = !multiple ? selectedOptions[0] : undefined;
  const filled = selectedOptions.length > 0;

  const side = usePopupSide(open, anchor, popup, !inlinePopup);
  const thumb = useScrollThumb(scroller, [open, filtered.length]);

  const setQuery = (v: string | null) => {
    setQueryRaw(v);
    onQueryChange?.(v ?? '');
  };
  const enabledFrom = (start: number, dir: 1 | -1, list = filtered) => {
    for (let k = 0, i = start; k < list.length; k++, i += dir) {
      const j = ((i % list.length) + list.length) % list.length;
      if (!list[j].o.disabled) return j;
    }
    return -1;
  };
  const setOpen = (o: boolean, focusAt?: 'selected' | 'first' | 'last') => {
    if (disabled) return;
    if (o && !open) {
      const sel = filtered.findIndex(({ o: opt }) => chosen.includes(opt.value));
      setActive(focusAt === 'last' ? enabledFrom(filtered.length - 1, -1) : focusAt === 'first' || sel < 0 ? enabledFrom(0, 1) : sel);
    }
    if (!o) {
      setActive(-1);
      if (query !== null) setQuery(null);
    }
    setOpenRaw(o);
  };

  const choose = (i: number) => {
    const item = filtered[i];
    if (!item || item.o.disabled) return;
    onChoose(item.o.value);
    if (multiple) {
      if (q) setQuery(null);
      return;
    }
    setQuery(null);
    setActive(-1);
    setOpenRaw(false);
  };

  useDismiss(open, [root], () => setOpen(false));

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    const el = document.getElementById(optionId(filtered[active]?.index ?? -1));
    const box = scroller.current;
    if (!el || !box) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  const move = (to: number) => setActive(to);
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    rest.onKeyDown?.(e as KeyboardEvent<HTMLElement>);
    if (e.defaultPrevented || disabled) return;
    const key = e.key;
    const value = (e.currentTarget as HTMLInputElement).value;
    if (tagged && key === 'Backspace' && !value && chosen.length > 0) {
      onRemove(chosen.length - 1);
      return;
    }
    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || (key === ' ' && !textInput)) {
        e.preventDefault();
        setOpen(true, key === 'ArrowUp' ? 'last' : 'selected');
      } else if (!textInput && (key === 'Home' || key === 'End')) {
        e.preventDefault();
        setOpen(true, key === 'Home' ? 'first' : 'last');
      } else if (!textInput && isPrintableKey(e)) {
        const i = typeahead(key, filtered.map(({ o }) => o.label), -1, (j) => !!filtered[j].o.disabled);
        setOpen(true);
        if (i >= 0) setActive(i);
      }
      return;
    }
    switch (key) {
      case 'ArrowDown':
        e.preventDefault();
        move(enabledFrom(active < 0 ? 0 : active + 1, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (e.altKey) {
          if (active >= 0) choose(active);
          if (!multiple) setOpen(false);
        } else move(enabledFrom(active < 0 ? filtered.length - 1 : active - 1, -1));
        break;
      case 'Home':
      case 'End':
        if (textInput) break;
        e.preventDefault();
        move(key === 'Home' ? enabledFrom(0, 1) : enabledFrom(filtered.length - 1, -1));
        break;
      case 'PageDown':
      case 'PageUp':
        e.preventDefault();
        move(Math.max(0, Math.min(filtered.length - 1, active + (key === 'PageDown' ? 10 : -10))));
        break;
      case 'Enter':
        e.preventDefault();
        if (active >= 0) choose(active);
        else if (!multiple) setOpen(false);
        break;
      case ' ':
        if (textInput) break;
        e.preventDefault();
        if (active >= 0) choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (!textInput && isPrintableKey(e)) {
          const i = typeahead(key, filtered.map(({ o }) => o.label), active, (j) => !!filtered[j].o.disabled);
          if (i >= 0) setActive(i);
        }
    }
  };

  const onType = (v: string) => {
    setQuery(v);
    const next = options.map((o, index) => ({ o, index })).filter(({ o }) => !v || o.label.toLowerCase().includes(v.toLowerCase()));
    setActive(enabledFrom(0, 1, next));
    if (!open) setOpenRaw(true);
  };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    rest.onBlur?.(e);
    if (open && !root.current?.contains(e.relatedTarget as Node)) setOpen(false);
  };

  const describedBy = [rest['aria-describedby'], hint != null ? hintId : undefined].filter(Boolean).join(' ') || undefined;
  const activeId = open && active >= 0 && filtered[active] ? optionId(filtered[active].index) : undefined;
  const comboboxAttrs = {
    ...rest,
    id,
    role: 'combobox',
    'aria-controls': open ? listId : undefined,
    'aria-expanded': open,
    'aria-haspopup': 'listbox' as const,
    'aria-activedescendant': activeId,
    'aria-labelledby': label != null ? labelId : rest['aria-labelledby'],
    'aria-describedby': describedBy,
    'aria-invalid': status === 'invalid' || undefined,
    'aria-required': required || undefined,
    onKeyDown,
    onBlur,
  };
  const focusLook: 'focus' | undefined = open || forceState === 'focus' ? 'focus' : undefined;

  /* ---------- trigger ---------- */
  let trigger: ReactNode;
  if (tagged) {
    trigger = (
      <SelectTagBox
        size={size}
        status={status}
        disabled={disabled}
        forceState={focusLook}
        tags={selectedOptions.map((o) => ({ key: o.value, label: o.label }))}
        onRemove={onRemove}
        placeholder={filled ? (multiple ? placeholder ?? 'Search' : '') : placeholder ?? (multiple ? 'Search' : 'Select an option')}
        onBoxPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => {
          if (disabled || (e.target as HTMLElement).closest('button, input')) return;
          e.preventDefault();
          control.current?.focus();
          setOpen(!open);
        }}
        inputProps={{
          ...(comboboxAttrs as object),
          ref: (el: HTMLInputElement | null) => {
            control.current = el;
          },
          'aria-autocomplete': 'list',
          value: q,
          onChange: (e) => onType(e.target.value),
          onClick: () => !open && setOpen(true),
          required: required && !filled,
        }}
      />
    );
  } else if (type === 'search') {
    trigger = (
      <TextControl
        {...(comboboxAttrs as object)}
        ref={(el) => {
          control.current = el;
        }}
        size={size}
        status={status}
        disabled={disabled}
        forceState={focusLook}
        leadingIcon="general/search"
        shortcut={['⌘', 'K']}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder ?? 'Search'}
        value={query ?? single?.label ?? ''}
        onValueChange={onType}
        onClick={() => !open && setOpen(true)}
      />
    );
  } else {
    const avatar = type === 'avatar' ? single?.avatar ?? (single ? { initials: initialsOf(single.label) } : {}) : undefined;
    trigger = (
      <TextControl
        {...(comboboxAttrs as object)}
        ref={(el) => {
          control.current = el;
        }}
        type="select"
        size={size}
        status={status}
        disabled={disabled}
        forceState={forceState}
        open={open}
        value={single?.label ?? ''}
        placeholder={placeholder ?? 'Select an option'}
        leadingIcon={type === 'icon' ? single?.icon ?? leadingIcon ?? 'users/user' : undefined}
        avatar={avatar}
        showDot={type === 'dot' && filled}
        supportingText={type === 'avatar' ? single?.supportingText : undefined}
        onClick={() => setOpen(!open)}
      />
    );
  }

  /* ---------- list ---------- */
  // 1.6 Motion: the list enters at base · enter and leaves at fast · exit.
  const presence = usePresence(open);
  const rowType = type === 'icon' || type === 'avatar' || type === 'dot' ? type : 'default';
  const list = presence.mounted && (
    <div
      data-anatomy="list"
      ref={popup}
      data-side={side}
      inert={presence.closing || undefined}
      className={cn(
        selectListSurface,
        presenceClass(presence.closing),
        inlinePopup ? 'relative mt-xs' : cn('absolute inset-x-0 z-50', side === 'above' ? 'bottom-full mb-xs' : 'top-full mt-xs'),
      )}
      onPointerDown={(e) => e.preventDefault()}
    >
      {filtered.length > 0 ? (
        <div
          ref={scroller}
          id={listId}
          role="listbox"
          aria-labelledby={label != null ? labelId : undefined}
          aria-label={label == null ? rest['aria-label'] : undefined}
          aria-multiselectable={multiple || undefined}
          className="max-h-(--select-list-max-height) overflow-y-auto py-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filtered.map(({ o, index }, i) => {
            const common = {
              id: optionId(index),
              size,
              text: o.label,
              supportingText: o.supportingText,
              selected: chosen.includes(o.value),
              disabled: o.disabled,
              active: i === active,
              query: searchable ? q : undefined,
              onPointerMove: () => !o.disabled && active !== i && setActive(i),
              onClick: () => choose(i),
            };
            return multiple ? (
              <MultiSelectOptionRow key={o.value} {...common} />
            ) : (
              <SelectOptionRow key={o.value} {...common} type={rowType} icon={o.icon} avatar={o.avatar ?? { initials: initialsOf(o.label) }} />
            );
          })}
        </div>
      ) : (
        <div id={listId} role="status" className="flex flex-col items-center p-xl text-center type-body-sm-regular text-text-tertiary">
          {emptyText(q)}
        </div>
      )}
      <SelectScrollBar thumb={thumb} />
    </div>
  );

  const showHint = hint != null && !(inlinePopup && open && !multiple);
  return (
    <div ref={root} className={cn('relative flex min-w-0 flex-col gap-sm', !hasWidth(className) && 'w-full', className)}>
      {label != null && (
        <Label
          id={labelId}
          htmlFor={id}
          size={labelSize(size)}
          label={label}
          showRequired={required}
          showHelpIcon={showLabelHelpIcon}
          helpText={labelHelpText}
          onClick={(e) => {
            // A label click focuses the trigger without toggling the list.
            e.preventDefault();
            control.current?.focus();
          }}
        />
      )}
      <div ref={anchor} className="relative flex flex-col">
        {trigger}
        {list}
      </div>
      {showHint && <HelpText id={hintId} size={labelSize(size)} status={status} hint={hint} />}
      {name && chosen.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
    </div>
  );
}

/* ---------- Select ---------- */

export function Select({ type = 'default', status = 'none', value, defaultValue = null, onValueChange, ...rest }: SelectProps) {
  const [v, setV] = useControllable<string | null>(value, defaultValue, onValueChange);
  return (
    <SelectField
      {...rest}
      multiple={false}
      type={type}
      status={status}
      chosen={v != null ? [v] : []}
      onChoose={(next) => setV(next)}
      onRemove={() => setV(null)}
    />
  );
}

/* ---------- Multi-select ---------- */

export function MultiSelect({ status = 'none', values, defaultValues = [], onValuesChange, placeholder = 'Search', ...rest }: MultiSelectProps) {
  const [v, setV] = useControllable<string[]>(values, defaultValues, onValuesChange);
  return (
    <SelectField
      {...rest}
      placeholder={placeholder}
      multiple
      type="tags"
      status={status}
      chosen={v}
      onChoose={(next) => setV(v.includes(next) ? v.filter((x) => x !== next) : [...v, next])}
      onRemove={(i) => setV(v.filter((_, j) => j !== i))}
    />
  );
}
