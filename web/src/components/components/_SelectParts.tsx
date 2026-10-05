import type { HTMLAttributes, InputHTMLAttributes, PointerEvent as ReactPointerEvent, ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Avatar } from '../parts/Avatar';
import { Checkbox } from '../parts/Checkbox';
import { Tag } from '../parts/Tag';
import { textControlSurface, type TextControlStatus } from '../parts/TextControl';
import { tagBoxPad } from './_TextFieldParts';

/**
 * 3.5 Select — `.Main` private parts: `.Main/Select option`, `.Main/Multi-select option`,
 * `.Main/Select tag box`, `.Main/Select scroll bar`. Internal to Select and MultiSelect; the file
 * name starts with `_`, so they are not exported from the library. The explorer imports them for the `.Main` matrices.
 *
 * Option rows use the same row metrics and tokens as the Menu items (3.6).
 */

export type SelectPartSize = 'sm' | 'md' | 'lg';
export type SelectOptionType = 'default' | 'icon' | 'avatar' | 'dot';

/** The list surface (shared by every open list of this page). */
export const selectListSurface =
  'overflow-hidden rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-raised shadow-overlay';

/** Content padding: y sm space/sm, md–lg space/md; x sm–md space/md, lg space/lg. */
const contentPad: Record<SelectPartSize, string> = { sm: 'py-sm px-md', md: 'py-md px-md', lg: 'py-md px-lg' };
const textStyle: Record<SelectPartSize, string> = { sm: 'type-body-sm-medium', md: 'type-body-md-medium', lg: 'type-body-md-medium' };
const supportStyle: Record<SelectPartSize, string> = { sm: 'type-body-sm-regular', md: 'type-body-md-regular', lg: 'type-body-md-regular' };

/** Row: outer inset space/xxs × space/sm, content rounded with the hover / active fill. */
function rowClasses(disabled: boolean) {
  return {
    root: cn('group/opt flex w-full px-sm py-xxs outline-none', disabled ? 'cursor-not-allowed' : 'cursor-pointer'),
    content: cn(
      'flex min-w-0 flex-1 items-center gap-md rounded-control bg-fill-none',
      'transition-[background-color] duration-(--motion-duration-fast) ease-standard',
      !disabled && 'group-is-hover/opt:bg-fill-neutral-subtle-hover group-data-[active=true]/opt:bg-fill-neutral-subtle-hover',
    ),
  };
}

/** Text with the typed query: the matching part in color/text/primary, the rest tertiary. */
function Highlighted({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (!q || i < 0) return <>{text}</>;
  return (
    <>
      <span className="text-text-tertiary">{text.slice(0, i)}</span>
      <span className="text-text-primary">{text.slice(i, i + q.length)}</span>
      <span className="text-text-tertiary">{text.slice(i + q.length)}</span>
    </>
  );
}

function OptionText({ size, text, supportingText, disabled, query }: { size: SelectPartSize; text: ReactNode; supportingText?: ReactNode; disabled: boolean; query?: string }) {
  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-md">
      <span className={cn('truncate', textStyle[size], disabled ? 'text-text-disabled' : 'text-text-primary')}>
        {typeof text === 'string' ? <Highlighted text={text} query={disabled ? undefined : query} /> : text}
      </span>
      {supportingText != null && supportingText !== '' && (
        <span className={cn('min-w-0 shrink-[2] truncate', supportStyle[size], disabled ? 'text-text-disabled' : 'text-text-tertiary')}>{supportingText}</span>
      )}
    </span>
  );
}

/* ---------- .Main/Select option ---------- */

export interface SelectOptionRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Size`. */
  size?: SelectPartSize;
  /** Figma `Type`: the leading visual. A list uses one Type for all its rows. */
  type?: SelectOptionType;
  /** Figma `Selected`: the check. */
  selected?: boolean;
  /** Figma `State=disabled`. */
  disabled?: boolean;
  /** Keyboard highlight: takes the hover look. */
  active?: boolean;
  /** Documentation only: Figma `State=hover`. */
  forceState?: 'hover';
  /** Figma `Text`. */
  text?: ReactNode;
  /** Figma `Show supporting text` + `Supporting text`. */
  supportingText?: ReactNode;
  /** Figma `Icon` (`type="icon"`). */
  icon?: IconName;
  /** Avatar of `type="avatar"`. */
  avatar?: { src?: string; initials?: string };
  /** Search: the typed text, shown in color/text/primary inside the option text. */
  query?: string;
}

export function SelectOptionRow({
  size = 'md',
  type = 'default',
  selected = false,
  disabled = false,
  active = false,
  forceState,
  text = 'Olivia Rhye',
  supportingText,
  icon = 'users/user',
  avatar,
  query,
  className,
  ...rest
}: SelectOptionRowProps) {
  const c = rowClasses(disabled);
  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-active={active || undefined}
      className={cn(c.root, className)}
      {...forceAttr(forceState)}
      {...rest}
    >
      <span className={cn(c.content, contentPad[size])}>
        {type !== 'default' && (
          // Fixed leading box (avatar xs): icon, avatar and dot rows keep the text on one edge.
          <span aria-hidden className="inline-flex size-(--size-avatar-xs) shrink-0 items-center justify-center">
            {type === 'icon' && <Icon name={icon} size="md" className={disabled ? 'text-icon-disabled' : 'text-icon-tertiary'} />}
            {type === 'avatar' && <Avatar size="xs" type={avatar?.src ? 'image' : avatar?.initials ? 'initials' : 'icon'} src={avatar?.src} initials={avatar?.initials} alt="" />}
            {type === 'dot' && <span className={cn('size-(--size-indicator-sm) rounded-full', disabled ? 'bg-icon-disabled' : 'bg-icon-success')} />}
          </span>
        )}
        <OptionText size={size} text={text} supportingText={supportingText} disabled={disabled} query={query} />
        {selected && <Icon name="general/check" size="md" className={cn('shrink-0', disabled ? 'text-icon-disabled' : 'text-icon-brand')} />}
      </span>
    </div>
  );
}

/* ---------- .Main/Multi-select option ---------- */

export interface MultiSelectOptionRowProps extends Omit<SelectOptionRowProps, 'type' | 'icon' | 'avatar'> {}

export function MultiSelectOptionRow({
  size = 'md',
  selected = false,
  disabled = false,
  active = false,
  forceState,
  text = 'Design',
  supportingText,
  query,
  className,
  ...rest
}: MultiSelectOptionRowProps) {
  const c = rowClasses(disabled);
  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-active={active || undefined}
      className={cn(c.root, className)}
      {...forceAttr(forceState)}
      {...rest}
    >
      <span className={cn(c.content, contentPad[size])}>
        {/* The row is the option; the Checkbox is its visual state and follows the row's hover. */}
        <Checkbox
          size="sm"
          checked={selected}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          parentFocus
          forceState={(active || forceState === 'hover') && !disabled ? 'hover' : undefined}
          className="pointer-events-none"
        />
        <OptionText size={size} text={text} supportingText={supportingText} disabled={disabled} query={query} />
      </span>
    </div>
  );
}

/* ---------- .Main/Select tag box ---------- */

export interface SelectTagBoxProps {
  /** Figma `Size`: the Text control's height and padding. */
  size?: SelectPartSize;
  status?: TextControlStatus;
  /** Figma `State=disabled`. */
  disabled?: boolean;
  /** Figma `State=focus`, or the open list. Documentation and open state only. */
  forceState?: 'focus';
  /** The chosen values (Figma `Filled` is derived from them). */
  tags: { key: string; label: string }[];
  onRemove?: (index: number) => void;
  /** Typing text. */
  inputProps?: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };
  placeholder?: string;
  /** Pointer press on the box (not a tag or the input): the field focuses its input and toggles the list. */
  onBoxPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  className?: string;
}

/**
 * Binds the same fill, border, focus and status tokens as the Text control (2.10),
 * so it always matches the other fields. Tags wrap and grow the box down.
 */
export function SelectTagBox({ size = 'md', status = 'none', disabled, forceState, tags, onRemove, inputProps, placeholder = 'Search', onBoxPointerDown, className }: SelectTagBoxProps) {
  const adorn = 'shrink-0 text-icon-tertiary group-data-[disabled=true]/tc:text-icon-disabled';
  return (
    <div
      className={cn(textControlSurface(status), 'items-center gap-md', tagBoxPad[size], disabled ? 'cursor-not-allowed' : 'cursor-text', className)}
      data-disabled={disabled || undefined}
      onPointerDown={onBoxPointerDown}
      {...forceAttr(forceState)}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-sm">
        {tags.map((t, i) => (
          <Tag key={t.key} size="sm" type="removable" label={t.label} disabled={disabled} onRemove={() => onRemove?.(i)} />
        ))}
        <input
          data-text-control-field=""
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          {...inputProps}
          className={cn(
            'h-(--tag-height-sm) min-w-[4rem] flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-placeholder',
            'is-disabled:cursor-not-allowed is-disabled:text-text-disabled is-disabled:placeholder:text-text-disabled',
            size === 'sm' ? 'type-body-sm-regular' : 'type-body-md-regular',
            'pointer-coarse:text-(length:--font-size-input-min)',
          )}
        />
      </div>
      {status === 'invalid' && <Icon name="alerts/alert-circle" size="sm" className="shrink-0 text-icon-danger" />}
      <Icon name="arrows/chevron-down" size="md" className={adorn} />
    </div>
  );
}

/* ---------- .Main/Select scroll bar ---------- */

/** No size token exists for the 4-wide thumb; the Figma part is fixed. */
const SCROLL_THUMB_WIDTH = 'w-[0.25rem]';

export interface SelectScrollBarProps {
  /** Thumb offset and length as fractions of the track; `overflow=false` hides it. */
  thumb?: { top: number; size: number; overflow: boolean };
  className?: string;
}

/** A 4-wide thumb with no visible rail, inset space/xs from the list edge, extra space/xs at the bottom. */
export function SelectScrollBar({ thumb = { top: 0, size: 0.4, overflow: true }, className }: SelectScrollBarProps) {
  if (!thumb.overflow) return null;
  return (
    <span aria-hidden className={cn('pointer-events-none absolute end-xs top-xs bottom-[calc(var(--space-xs)*2)]', SCROLL_THUMB_WIDTH, className)}>
      <span className="absolute inset-x-0 rounded-full bg-fill-neutral-track" style={{ top: `${thumb.top * 100}%`, height: `${thumb.size * 100}%` }} />
    </span>
  );
}
