import { useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { SocialMark, type SocialProvider } from '../assets/SocialMark';
import { Avatar } from '../parts/Avatar';
import { Button } from '../parts/Button';
import { Checkbox } from '../parts/Checkbox';
import { Divider } from '../parts/Divider';
import { Kbd } from '../parts/Kbd';
import { Radio } from '../parts/Radio';
import { TextControl, type TextControlProps } from '../parts/TextControl';

/**
 * 3.6 Menu — `.Main` private parts: `.Main/Menu item`, `.Main/Menu item leading`, `.Main/Menu header`,
 * `.Main/Menu footer`, `.Main/Menu account item`, `.Main/Menu account trigger`, `.Main/Menu scroll bar`.
 * Internal to Menu and ContextMenu (one item system for both); the file name starts with `_`, so they are
 * not exported from the library. The explorer imports them for the `.Main` matrices.
 *
 * Keyboard focus in a menu takes the hover look (`data-highlighted`); items have no separate focus ring.
 */

/** The panel surface (Menu, Context menu and submenus). */
export const menuPanelSurface =
  'overflow-hidden rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-raised shadow-overlay';

/** Hover look, also held by keyboard focus (`data-highlighted`) and by an open submenu (`data-open`). */
const lookFill =
  'group-is-hover/item:bg-fill-neutral-subtle-hover group-data-[highlighted=true]/item:bg-fill-neutral-subtle-hover group-data-[open=true]/item:bg-fill-neutral-subtle-hover';
const lookText =
  'text-text-secondary group-is-hover/item:text-text-primary group-data-[highlighted=true]/item:text-text-primary group-data-[open=true]/item:text-text-primary';
const lookIcon =
  'text-icon-tertiary group-is-hover/item:text-icon-secondary group-data-[highlighted=true]/item:text-icon-secondary group-data-[open=true]/item:text-icon-secondary';

const itemRoot = 'group/item relative flex w-full cursor-pointer select-none px-sm py-xxs outline-none aria-disabled:cursor-not-allowed';
const itemContent = 'flex min-w-0 flex-1 items-center gap-md rounded-control bg-fill-none p-md transition-[background-color,color] duration-(--motion-duration-fast) ease-standard';

/** Highlight follows focus: arrow keys and the pointer move focus between items. */
function useHighlight() {
  const [on, setOn] = useState(false);
  return {
    'data-highlighted': on || undefined,
    onFocus: () => setOn(true),
    onBlur: () => setOn(false),
  };
}

/* ---------- .Main/Menu item leading ---------- */

export type MenuLeadingType = 'spacer' | 'icon' | 'check' | 'checkbox' | 'dot' | 'avatar' | 'integration';
export const menuLeadingTypes: readonly MenuLeadingType[] = ['spacer', 'icon', 'check', 'checkbox', 'dot', 'avatar', 'integration'];

export interface MenuItemLeadingProps {
  /** Figma `Type`. Within one menu all rows use leading types of the same width. */
  type?: MenuLeadingType;
  /** `icon`: the icon. */
  icon?: IconName;
  /** `check` / `checkbox`: the item is on. */
  checked?: boolean;
  /** `avatar`: the person. */
  avatar?: { src?: string; initials?: string };
  /** `integration`: the service's logo from 1.8 Brand assets. */
  provider?: SocialProvider;
  /** `integration`: any other logo node (wins over `provider`). */
  logo?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Keeps the text on the same left edge in every row: 16 × 16, avatar and integration larger. */
export function MenuItemLeading({ type = 'icon', icon = 'users/user', checked = true, avatar, provider = 'github', logo, disabled, className }: MenuItemLeadingProps) {
  const box = type === 'avatar' ? 'size-(--size-avatar-xs)' : type === 'integration' ? 'size-(--size-icon-md)' : 'size-(--size-icon-sm)';
  return (
    <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center', box, className)}>
      {type === 'icon' && <Icon name={icon} size="sm" />}
      {type === 'check' && checked && <Icon name="general/check" size="sm" className={disabled ? 'text-icon-disabled' : 'text-icon-brand'} />}
      {type === 'checkbox' && <Checkbox size="sm" checked={checked} disabled={disabled} tabIndex={-1} parentFocus className="pointer-events-none" />}
      {type === 'dot' && <span className={cn('size-(--size-indicator-sm) rounded-full', disabled ? 'bg-icon-disabled' : 'bg-icon-success')} />}
      {type === 'avatar' && <Avatar size="xs" type={avatar?.src ? 'image' : avatar?.initials ? 'initials' : 'icon'} src={avatar?.src} initials={avatar?.initials} alt="" />}
      {type === 'integration' && (logo ?? <SocialMark provider={provider} size="md" alt="" />)}
    </span>
  );
}

/* ---------- .Main/Menu item ---------- */

export interface MenuItemRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Type`: a row or a divider (an item with its own vertical padding). */
  type?: 'item' | 'divider';
  /** Figma `Text`. Starts with a verb for actions; sentence case. */
  text?: ReactNode;
  /** Figma `Show leading` + `.Main/Menu item leading`. Present = shown. */
  leading?: MenuItemLeadingProps;
  /** Figma `Show shortcut`: one Kbd per key. Hidden when disabled. */
  shortcut?: string | string[];
  /** Figma `Show chevron`: the item opens a submenu. */
  showChevron?: boolean;
  /** Figma `Open`: the hover look held while the submenu is open. */
  open?: boolean;
  /** Figma `Tone`. */
  tone?: 'neutral' | 'danger';
  /** Figma `State=disabled`. */
  disabled?: boolean;
  /** A trailing check (connected integrations). */
  trailingCheck?: boolean;
  /** `menuitem`, or `menuitemcheckbox` / `menuitemradio` for items with a checked state. */
  role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  checked?: boolean;
  /** Documentation only: Figma `State=hover`. */
  forceState?: 'hover';
}

export function MenuItemRow({
  type = 'item',
  text = 'View profile',
  leading,
  shortcut,
  showChevron = false,
  open = false,
  tone = 'neutral',
  disabled = false,
  trailingCheck = false,
  role = 'menuitem',
  checked,
  forceState,
  className,
  ...rest
}: MenuItemRowProps) {
  const hl = useHighlight();
  if (type === 'divider') {
    return (
      <div role="separator" className={cn('w-full py-xs', className)} {...rest}>
        <Divider decorative />
      </div>
    );
  }
  const danger = tone === 'danger';
  const keys = shortcut == null ? [] : Array.isArray(shortcut) ? shortcut : [shortcut];
  return (
    <div
      role={role}
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      aria-checked={role === 'menuitem' ? undefined : !!checked}
      aria-haspopup={showChevron ? 'menu' : undefined}
      aria-expanded={showChevron ? open : undefined}
      data-menu-item=""
      data-open={open || undefined}
      className={cn(itemRoot, className)}
      {...forceAttr(forceState)}
      {...hl}
      {...rest}
      onFocus={(e) => {
        hl.onFocus();
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        hl.onBlur();
        rest.onBlur?.(e);
      }}
    >
      <span className={cn(itemContent, !disabled && lookFill)}>
        {leading && (
          <MenuItemLeading
            {...leading}
            disabled={disabled}
            className={disabled ? 'text-icon-disabled' : danger ? 'text-icon-danger' : lookIcon}
          />
        )}
        <span className={cn('min-w-0 flex-1 truncate type-body-sm-medium', disabled ? 'text-text-disabled' : danger ? 'text-text-danger' : lookText)}>{text}</span>
        {keys.length > 0 && !disabled && (
          <span className="flex shrink-0 items-center gap-xxs">
            {keys.map((k, i) => (
              <Kbd key={`${k}-${i}`} size="sm" text={k} />
            ))}
          </span>
        )}
        {trailingCheck && <Icon name="general/check" size="sm" className={disabled ? 'text-icon-disabled' : 'text-icon-brand'} />}
        {showChevron && <Icon name="arrows/chevron-right" size="sm" className={disabled ? 'text-icon-disabled' : lookIcon} />}
      </span>
    </div>
  );
}

/* ---------- .Main/Menu header ---------- */

export type MenuHeaderType = 'avatar' | 'header' | 'subheading' | 'search';
export const menuHeaderTypes: readonly MenuHeaderType[] = ['avatar', 'header', 'subheading', 'search'];

export interface MenuHeaderProps {
  /** Figma `Type`. */
  type?: MenuHeaderType;
  /** Name (avatar), title (header) or the subheading text. */
  text?: ReactNode;
  /** Figma `Show supporting text` + the text (email, description). Present = shown. */
  supportingText?: ReactNode;
  /** `avatar`: the person. */
  avatar?: { src?: string; initials?: string };
  /** `search`: props of the Text control (value, onValueChange, onKeyDown, ref…). */
  searchProps?: Partial<TextControlProps>;
  className?: string;
}

export function MenuHeader({ type = 'avatar', text, supportingText, avatar, searchProps, className }: MenuHeaderProps) {
  const pad = 'flex w-full flex-col px-xl py-lg';
  const stroke = 'border-b-(length:--border-width-default) border-border-subtle';
  if (type === 'subheading') {
    return <div className={cn(pad, 'pb-xs type-body-xs-semibold text-text-tertiary', className)}>{text ?? 'Switch account'}</div>;
  }
  if (type === 'search') {
    return (
      <div className={cn(pad, stroke, className)}>
        <TextControl size="sm" leadingIcon="general/search" shortcut={['⌘', 'K']} placeholder="Search" aria-label="Search" autoComplete="off" {...searchProps} />
      </div>
    );
  }
  const support = supportingText != null && supportingText !== '' && (
    <span className="truncate type-body-sm-regular text-text-tertiary">{supportingText}</span>
  );
  if (type === 'header') {
    return (
      <div className={cn(pad, stroke, className)}>
        <span className="truncate type-body-sm-semibold text-text-primary">{text ?? 'Workspace'}</span>
        {support}
      </div>
    );
  }
  const name = typeof text === 'string' ? text : 'Olivia Rhye';
  return (
    <div className={cn(pad, stroke, 'flex-row items-center gap-md', className)}>
      <Avatar size="md" type={avatar?.src ? 'image' : 'initials'} src={avatar?.src} initials={avatar?.initials ?? initialsOf(name)} alt="" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-body-sm-semibold text-text-primary">{text ?? name}</span>
        {support}
      </span>
    </div>
  );
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

/* ---------- .Main/Menu footer ---------- */

export interface MenuFooterProps {
  /** Figma `Type`. */
  type?: 'text' | 'button';
  /** `text`: the line; `button`: the Button label. */
  text?: ReactNode;
  /** `button`: the action. The button is a menu item for the keyboard. */
  onClick?: () => void;
  className?: string;
}

export function MenuFooter({ type = 'text', text, onClick, className }: MenuFooterProps) {
  return (
    <div className={cn('flex w-full flex-col border-t-(length:--border-width-default) border-border-subtle px-xl py-lg', className)}>
      {type === 'text' ? (
        <span className="type-body-xs-regular text-text-tertiary">{text ?? 'v4.0 · Terms · Privacy'}</span>
      ) : (
        <Button size="sm" emphasis="secondary" fullWidth label={text ?? 'Sign out'} onClick={onClick} role="menuitem" tabIndex={-1} data-menu-item="" />
      )}
    </div>
  );
}

/* ---------- .Main/Menu account item ---------- */

export interface MenuAccountItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  name?: string;
  email?: string;
  avatar?: { src?: string; initials?: string };
  /** Figma `Selected`: the current account (Radio checked). */
  selected?: boolean;
  /** Documentation only: Figma `State=hover`. */
  forceState?: 'hover';
}

/** Switching account is a single choice, so the selection is a Radio (2.8). */
export function MenuAccountItem({ name = 'Olivia Rhye', email = 'olivia@example.com', avatar, selected = false, forceState, className, ...rest }: MenuAccountItemProps) {
  const hl = useHighlight();
  return (
    <div
      role="menuitemradio"
      aria-checked={selected}
      tabIndex={-1}
      data-menu-item=""
      className={cn(itemRoot, className)}
      {...forceAttr(forceState)}
      {...hl}
      {...rest}
    >
      <span className={cn(itemContent, lookFill)}>
        <Avatar size="md" type={avatar?.src ? 'image' : 'initials'} src={avatar?.src} initials={avatar?.initials ?? initialsOf(name)} alt="" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate type-body-sm-semibold text-text-primary">{name}</span>
          <span className="truncate type-body-sm-regular text-text-tertiary">{email}</span>
        </span>
        <Radio size="sm" checked={selected} tabIndex={-1} aria-hidden parentFocus className="pointer-events-none" forceState={forceState} />
      </span>
    </div>
  );
}

/* ---------- .Main/Menu account trigger ---------- */

export type MenuAccountTriggerType = 'card-xs' | 'card-sm' | 'card-md' | 'breadcrumb';
export const menuAccountTriggerTypes: readonly MenuAccountTriggerType[] = ['card-xs', 'card-sm', 'card-md', 'breadcrumb'];

export interface MenuAccountTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  /** Figma `Type`. */
  type?: MenuAccountTriggerType;
  name?: string;
  email?: string;
  avatar?: { src?: string; initials?: string };
  /** Documentation only: Figma `State=hover` or `State=focus`. */
  forceState?: 'hover' | 'focus';
}

const triggerAvatar = { 'card-xs': 'xs', 'card-sm': 'sm', 'card-md': 'md', breadcrumb: 'xs' } as const;

export function MenuAccountTrigger({ type = 'card-md', name = 'Olivia Rhye', email = 'olivia@example.com', avatar, forceState, className, ...rest }: MenuAccountTriggerProps) {
  const card = type !== 'breadcrumb';
  const withEmail = type === 'card-sm' || type === 'card-md';
  return (
    <button
      type="button"
      className={cn(
        'group/trigger inline-flex min-w-0 cursor-pointer items-center gap-md text-start outline-none',
        'transition-[background-color,border-color,box-shadow] duration-(--motion-duration-fast) ease-standard is-focus:shadow-focus-default',
        card
          ? cn('w-full rounded-surface border-(length:--border-width-default) border-border-default bg-surface-base is-hover:bg-surface-base-hover', type === 'card-xs' ? 'p-md' : 'p-lg')
          : 'rounded-xs',
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    >
      <Avatar size={triggerAvatar[type]} type={avatar?.src ? 'image' : 'initials'} src={avatar?.src} initials={avatar?.initials ?? initialsOf(name)} alt="" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate type-body-sm-semibold', card ? 'text-text-primary' : 'text-text-secondary group-is-hover/trigger:text-text-primary')}>{name}</span>
        {withEmail && <span className="truncate type-body-sm-regular text-text-tertiary">{email}</span>}
      </span>
      <Icon name="arrows/chevron-selector-vertical" size="sm" className="text-icon-tertiary group-is-hover/trigger:text-icon-secondary" />
    </button>
  );
}

/* ---------- .Main/Menu scroll bar ---------- */

/** No size token exists for the 4-wide thumb; the Figma part is fixed. */
const SCROLL_THUMB_WIDTH = 'w-[0.25rem]';

export function MenuScrollBar({ thumb = { top: 0, size: 0.4, overflow: true }, className }: { thumb?: { top: number; size: number; overflow: boolean }; className?: string }) {
  if (!thumb.overflow) return null;
  return (
    <span aria-hidden className={cn('pointer-events-none absolute end-xs top-xs bottom-xs', SCROLL_THUMB_WIDTH, className)}>
      <span className="absolute inset-x-0 rounded-full bg-fill-neutral-track" style={{ top: `${thumb.top * 100}%`, height: `${thumb.size * 100}%` }} />
    </span>
  );
}
