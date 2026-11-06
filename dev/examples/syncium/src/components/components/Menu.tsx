import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '@/lib/cn';
import { presenceClass, usePresence } from '@/lib/motion';
import { isPrintableKey, useControllable, useDismiss, usePopupSide, useScrollThumb, useTypeahead } from '@/lib/popup';
import { type IconName } from '@/icons';
import type { SocialProvider } from '../assets/SocialMark';
import { Avatar } from '../parts/Avatar';
import { Button } from '../parts/Button';
import { IconButton } from '../parts/IconButton';
import { Link } from '../parts/Link';
import {
  MenuAccountItem,
  MenuAccountTrigger,
  MenuFooter,
  MenuHeader,
  MenuItemRow,
  MenuScrollBar,
  initialsOf,
  menuPanelSurface,
  type MenuHeaderType,
  type MenuLeadingType,
} from './_MenuParts';

/**
 * 3.6 Menu — a compact panel of related actions or options that opens from a trigger.
 * Figma: `Menu` · Type × Open (28 variants) · Show chevron, Show scroll bar.
 *        `Context menu` · Type × Open (4 variants).
 * Private parts (`.Main`) live in `_MenuParts.tsx`: item, item leading, header, footer, account item,
 * account trigger, scroll bar. Menu and Context menu share one item system.
 *
 * Behaviour (menu button pattern): the trigger has `aria-haspopup="menu"` and `aria-expanded`; Enter, Space or
 * Down open the menu on the first item, Up on the last; arrows, Home and End move; typing a letter jumps to the
 * matching item; Enter or Space activates; Escape closes and returns focus to the trigger; a press outside or
 * Tab closes. Right / Left open and close a submenu. The panel flips above the trigger near the bottom edge.
 * Figma `Show scroll bar` comes from a panel taller than the viewport allows.
 */

export type MenuType =
  | 'button-simple'
  | 'button-advanced'
  | 'button-link'
  | 'icon-simple'
  | 'icon-advanced'
  | 'search-simple'
  | 'search-advanced'
  | 'integrations'
  | 'account-button'
  | 'account-avatar'
  | 'account-card-xs'
  | 'account-card-sm'
  | 'account-card-md'
  | 'account-breadcrumb';
export const menuTypes: readonly MenuType[] = [
  'button-simple',
  'button-advanced',
  'button-link',
  'icon-simple',
  'icon-advanced',
  'search-simple',
  'search-advanced',
  'integrations',
  'account-button',
  'account-avatar',
  'account-card-xs',
  'account-card-sm',
  'account-card-md',
  'account-breadcrumb',
];

/** One row of a menu: an item, or `{ type: 'divider' }`. */
export interface MenuItem {
  type?: 'item' | 'divider';
  /** Figma `Text`. */
  text?: string;
  /** Figma `.Main/Menu item leading` `Type`. Rows without a visual in a menu that has them use `spacer`. */
  leading?: MenuLeadingType;
  icon?: IconName;
  avatar?: { src?: string; initials?: string };
  /** `leading="integration"`: the service logo. */
  provider?: SocialProvider;
  /** check / checkbox leading on; for other items, a trailing check (connected). */
  checked?: boolean;
  /** Figma `Show shortcut`: one key per entry, e.g. `['⌘', 'K']`. */
  shortcut?: string | string[];
  /** Figma `Tone`. */
  tone?: 'neutral' | 'danger';
  disabled?: boolean;
  /** Called when the item is chosen. */
  onSelect?: () => void;
  /** Items of a submenu (Figma `Show chevron` + `Open`). */
  submenu?: MenuItem[];
}

export interface MenuAccount {
  id: string;
  name: string;
  email?: string;
  avatar?: { src?: string; initials?: string };
}

const div: MenuItem = { type: 'divider' };

/* ---------- sample content (Figma defaults) ---------- */

const simpleItems: MenuItem[] = [
  { text: 'Edit' },
  { text: 'Duplicate' },
  { text: 'Move to…' },
  div,
  { text: 'Archive' },
  { text: 'Delete', tone: 'danger' },
];
const advancedItems: MenuItem[] = [
  { text: 'View profile', leading: 'icon', icon: 'users/user', shortcut: ['⌘', 'P'] },
  { text: 'Settings', leading: 'icon', icon: 'general/settings', shortcut: ['⌘', ','] },
  { text: 'Keyboard shortcuts', leading: 'icon', icon: 'general/zap', shortcut: ['?'] },
  div,
  { text: 'Team', leading: 'icon', icon: 'users/users' },
  { text: 'Invite colleagues', leading: 'icon', icon: 'users/user-plus', shortcut: ['⌘', 'I'] },
  div,
  { text: 'Support', leading: 'icon', icon: 'alerts/help-circle' },
  { text: 'Log out', leading: 'icon', icon: 'general/log-out', shortcut: ['⌥', '⇧', 'Q'] },
];
const searchItems: MenuItem[] = [
  { text: 'Dashboard', leading: 'icon', icon: 'layout/layout-dashboard' },
  { text: 'Projects', leading: 'icon', icon: 'files/folder' },
  { text: 'Reports', leading: 'icon', icon: 'charts/chart-column' },
  { text: 'Documents', leading: 'icon', icon: 'files/file-text' },
  { text: 'Settings', leading: 'icon', icon: 'general/settings' },
];
const peopleItems: MenuItem[] = [
  { text: 'Olivia Rhye', leading: 'avatar', avatar: { initials: 'OR' } },
  { text: 'Phoenix Baker', leading: 'avatar', avatar: { initials: 'PB' } },
  { text: 'Lana Steiner', leading: 'avatar', avatar: { initials: 'LS' } },
  { text: 'Demi Wilkinson', leading: 'avatar', avatar: { initials: 'DW' } },
];
const integrationItems: MenuItem[] = [
  { text: 'GitHub', leading: 'integration', provider: 'github', checked: true },
  { text: 'GitLab', leading: 'integration', provider: 'gitlab' },
  { text: 'Google', leading: 'integration', provider: 'google', checked: true },
  { text: 'Facebook', leading: 'integration', provider: 'facebook' },
];
export const menuSampleAccounts: MenuAccount[] = [
  { id: 'olivia', name: 'Olivia Rhye', email: 'olivia@example.com' },
  { id: 'phoenix', name: 'Phoenix Baker', email: 'phoenix@example.com' },
  { id: 'lana', name: 'Lana Steiner', email: 'lana@example.com' },
];
export const contextMenuSampleItems: Record<ContextMenuType, MenuItem[]> = {
  simple: [
    { text: 'Cut', shortcut: ['⌘', 'X'] },
    { text: 'Copy', shortcut: ['⌘', 'C'] },
    { text: 'Paste', shortcut: ['⌘', 'V'] },
    { text: 'Select all', shortcut: ['⌘', 'A'] },
  ],
  advanced: [
    { text: 'Cut', leading: 'icon', icon: 'general/copy', shortcut: ['⌘', 'X'] },
    { text: 'Copy', leading: 'icon', icon: 'general/copy', shortcut: ['⌘', 'C'] },
    { text: 'Paste', leading: 'icon', icon: 'files/file-text', shortcut: ['⌘', 'V'] },
    div,
    {
      text: 'Share',
      leading: 'icon',
      icon: 'general/share',
      submenu: [
        { text: 'Copy link', leading: 'icon', icon: 'general/link' },
        { text: 'Email', leading: 'icon', icon: 'communication/mail' },
        { text: 'Message', leading: 'icon', icon: 'communication/message-square' },
      ],
    },
    { text: 'Download', leading: 'icon', icon: 'general/download', shortcut: ['⌘', 'S'] },
    div,
    { text: 'Delete', leading: 'icon', icon: 'general/trash', tone: 'danger', shortcut: ['⌫'] },
  ],
};

interface HeaderDef {
  type: MenuHeaderType;
  text?: string;
  supportingText?: string;
}
interface Preset {
  trigger: 'button' | 'link' | 'icon' | 'avatar' | 'card-xs' | 'card-sm' | 'card-md' | 'breadcrumb';
  label: string;
  leadingIcon?: IconName;
  chevron: boolean;
  headers: HeaderDef[];
  items: MenuItem[] | 'accounts';
  footer?: { type: 'text' | 'button'; text: string };
}

const accountPanel = {
  headers: [{ type: 'subheading', text: 'Switch account' }] as HeaderDef[],
  items: 'accounts' as const,
  footer: { type: 'button' as const, text: 'Sign out' },
};

const presets: Record<MenuType, Preset> = {
  'button-simple': { trigger: 'button', label: 'Options', chevron: true, headers: [], items: simpleItems },
  'button-advanced': { trigger: 'button', label: 'Options', chevron: true, headers: [{ type: 'avatar' }], items: advancedItems, footer: { type: 'text', text: 'v4.0 · Terms · Privacy' } },
  'button-link': { trigger: 'link', label: 'Options', chevron: true, headers: [], items: simpleItems },
  'icon-simple': { trigger: 'icon', label: 'More actions', chevron: false, headers: [], items: simpleItems },
  'icon-advanced': { trigger: 'icon', label: 'More actions', chevron: false, headers: [{ type: 'avatar' }], items: advancedItems, footer: { type: 'text', text: 'v4.0 · Terms · Privacy' } },
  'search-simple': { trigger: 'button', label: 'Search', leadingIcon: 'general/search', chevron: false, headers: [{ type: 'search' }], items: searchItems },
  'search-advanced': {
    trigger: 'button',
    label: 'Search',
    leadingIcon: 'general/search',
    chevron: false,
    headers: [{ type: 'search' }, { type: 'subheading', text: 'People' }],
    items: peopleItems,
    footer: { type: 'button', text: 'View all people' },
  },
  integrations: { trigger: 'button', label: 'Integrations', leadingIcon: 'general/plug', chevron: false, headers: [{ type: 'subheading', text: 'Integrations' }], items: integrationItems },
  'account-button': { trigger: 'button', label: '', chevron: true, ...accountPanel },
  'account-avatar': { trigger: 'avatar', label: 'Account', chevron: false, ...accountPanel },
  'account-card-xs': { trigger: 'card-xs', label: '', chevron: false, ...accountPanel },
  'account-card-sm': { trigger: 'card-sm', label: '', chevron: false, ...accountPanel },
  'account-card-md': { trigger: 'card-md', label: '', chevron: false, ...accountPanel },
  'account-breadcrumb': { trigger: 'breadcrumb', label: '', chevron: false, ...accountPanel },
};

/* ---------- panel (shared by Menu, Context menu and submenus) ---------- */

const itemsOf = (panel: HTMLElement | null) =>
  panel ? (Array.from(panel.querySelectorAll<HTMLElement>(':scope [data-menu-item]')).filter((el) => el.closest('[role="menu"]') === panel && el.getAttribute('aria-disabled') !== 'true')) : [];

interface PanelProps {
  id: string;
  labelledBy?: string;
  label?: string;
  headers?: HeaderDef[];
  items?: MenuItem[];
  accounts?: MenuAccount[];
  selectedAccount?: string;
  onAccountChange?: (id: string) => void;
  account?: MenuAccount;
  footer?: { type: 'text' | 'button'; text: string; onClick?: () => void };
  /** Close the whole menu and return focus to the trigger. */
  onClose: (returnFocus: boolean) => void;
  onAction?: (item: MenuItem) => void;
  /** Focus on mount: first item, last item, the search field, or the panel itself. */
  autoFocus?: 'first' | 'last' | 'panel' | 'none';
  /** Width: `menu/width`, or the trigger's width (account cards). */
  width?: 'menu' | 'trigger';
  /** Submenu: Left / Escape close it and focus the parent item. */
  onCloseSub?: () => void;
  /** Static: open submenus marked open (documentation). */
  openSubmenuIndex?: number;
  className?: string;
  panelRef?: RefObject<HTMLDivElement | null>;
}

function MenuPanel({
  id,
  labelledBy,
  label,
  headers = [],
  items = [],
  accounts,
  selectedAccount,
  onAccountChange,
  account,
  footer,
  onClose,
  onAction,
  autoFocus = 'none',
  width = 'menu',
  onCloseSub,
  openSubmenuIndex,
  className,
  panelRef,
}: PanelProps) {
  /** The `role="menu"` element. With a search header it sits inside the panel surface, below the search field. */
  const ref = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [sub, setSub] = useState<number | null>(openSubmenuIndex ?? null);
  const [subFocus, setSubFocus] = useState<'first' | 'none'>('none');
  const typeahead = useTypeahead();
  const thumb = useScrollThumb(scroller, [query]);
  const hasSearch = headers.some((h) => h.type === 'search');
  const wrap = useRef<HTMLDivElement>(null);
  const [subTop, setSubTop] = useState(0);
  useLayoutEffect(() => {
    if (sub == null) return;
    const el = ref.current?.querySelector<HTMLElement>(`[data-index="${sub}"]`);
    if (el && wrap.current) setSubTop(el.getBoundingClientRect().top - wrap.current.getBoundingClientRect().top);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub]);

  const shown = query
    ? items.filter((it) => it.type !== 'divider' && it.text?.toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => {
    if (autoFocus === 'none') return;
    if (hasSearch) {
      search.current?.focus();
      return;
    }
    const list = itemsOf(ref.current);
    if (autoFocus === 'first') list[0]?.focus();
    else if (autoFocus === 'last') list[list.length - 1]?.focus();
    else ref.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusAt = (i: number) => {
    const list = itemsOf(ref.current);
    if (!list.length) return;
    list[((i % list.length) + list.length) % list.length].focus();
  };
  const current = () => itemsOf(ref.current).indexOf(document.activeElement as HTMLElement);

  const activate = (it: MenuItem, i: number) => {
    if (it.disabled) return;
    if (it.submenu) {
      setSub(i);
      setSubFocus('first');
      // Already open (pointer hover or a static open state): move into it now.
      if (sub === i) wrap.current?.querySelector<HTMLElement>(`[id="${id}-sub-${i}"] [data-menu-item]`)?.focus();
      return;
    }
    it.onSelect?.();
    onAction?.(it);
    if (it.leading !== 'checkbox') onClose(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // A submenu handles its own keys; the parent panel never sees them.
    if (onCloseSub && e.key !== 'Tab') e.stopPropagation();
    const inSearch = e.target === search.current;
    const i = current();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusAt(inSearch || i < 0 ? 0 : i + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (hasSearch && i === 0) search.current?.focus();
        else focusAt(i < 0 ? -1 : i - 1);
        break;
      case 'Home':
      case 'End':
        if (inSearch) break;
        e.preventDefault();
        focusAt(e.key === 'Home' ? 0 : -1);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (onCloseSub) onCloseSub();
        else onClose(true);
        break;
      case 'ArrowLeft':
        if (onCloseSub && !inSearch) {
          e.preventDefault();
          e.stopPropagation();
          onCloseSub();
        }
        break;
      case 'Tab':
        onClose(false);
        break;
      case 'Enter':
      case ' ':
      case 'ArrowRight': {
        if (inSearch) {
          if (e.key === 'Enter') {
            e.preventDefault();
            focusAt(0);
            (itemsOf(ref.current)[0] as HTMLElement | undefined)?.click();
          }
          break;
        }
        const el = document.activeElement as HTMLElement;
        if (!el?.hasAttribute('data-menu-item')) break;
        if (e.key === 'ArrowRight' && el.getAttribute('aria-haspopup') !== 'menu') break;
        e.preventDefault();
        e.stopPropagation();
        el.click();
        break;
      }
      default:
        if (!inSearch && isPrintableKey(e)) {
          const list = itemsOf(ref.current);
          const j = typeahead(e.key, list.map((el) => el.textContent?.trim() ?? ''), i);
          if (j >= 0) list[j].focus();
        }
    }
  };

  // The submenu sits beside its item, outside the clipped, scrolling panel.
  const subItem = sub != null ? shown.filter((it) => it.type !== 'divider')[sub] : undefined;
  const subNode = subItem?.submenu && (
    <div className="absolute start-full z-10 ps-xs motion-enter" style={{ top: subTop }}>
      <MenuPanel
        id={`${id}-sub-${sub}`}
        label={subItem.text}
        items={subItem.submenu}
        autoFocus={subFocus}
        onClose={onClose}
        onAction={onAction}
        onCloseSub={() => {
          const i = sub!;
          setSub(null);
          focusAt(i);
        }}
      />
    </div>
  );

  let itemIndex = -1;
  const surfaceClass = cn(menuPanelSurface, 'relative flex flex-col outline-none', width === 'menu' ? 'w-(--menu-width)' : 'w-full');
  const menuAttrs = {
    id,
    role: 'menu',
    tabIndex: -1,
    'aria-labelledby': labelledBy,
    'aria-label': labelledBy ? undefined : label,
  } as const;
  /** The surface: `panelRef` (popup placement) measures it; without search it is the menu itself. */
  const setSurface = (el: HTMLDivElement | null) => {
    if (panelRef) panelRef.current = el;
    if (!hasSearch) ref.current = el;
  };
  // The search field is a textbox, not a menu child: it sits above the role="menu" list, inside the same surface.
  const searchHeader = hasSearch && (
    <MenuHeader
      type="search"
      searchProps={{
        ref: (el: HTMLElement | null) => {
          search.current = el;
        },
        value: query,
        onValueChange: setQuery,
        'aria-controls': id,
      }}
    />
  );
  const body = (
    <>
      {headers.map((h, k) =>
        h.type === 'search' ? null : (
          <MenuHeader
            key={k}
            type={h.type}
            text={h.type === 'avatar' ? h.text ?? account?.name : h.text}
            supportingText={h.type === 'avatar' ? h.supportingText ?? account?.email : h.supportingText}
            avatar={h.type === 'avatar' ? account?.avatar : undefined}
          />
        ),
      )}
      <div role="none" className="relative flex min-h-0 flex-col">
      <div
        ref={scroller}
        data-anatomy="items"
        role="none"
        className="flex max-h-[min(var(--select-list-max-height),70vh)] flex-col overflow-y-auto py-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {accounts
          ? accounts.map((a) => (
              <MenuAccountItem
                key={a.id}
                name={a.name}
                email={a.email}
                avatar={a.avatar}
                selected={a.id === selectedAccount}
                onPointerMove={(e) => e.currentTarget !== document.activeElement && e.currentTarget.focus()}
                onClick={() => {
                  onAccountChange?.(a.id);
                  onClose(true);
                }}
              />
            ))
          : shown.map((it, k) => {
              if (it.type === 'divider') return <MenuItemRow key={`d${k}`} type="divider" />;
              const idx = ++itemIndex;
              const lead = it.leading;
              const row = (
                <MenuItemRow
                  key={`${it.text}-${k}`}
                  text={it.text}
                  leading={lead ? { type: lead, icon: it.icon, avatar: it.avatar, provider: it.provider, checked: it.checked } : undefined}
                  role={lead === 'check' || lead === 'checkbox' ? 'menuitemcheckbox' : 'menuitem'}
                  checked={it.checked}
                  trailingCheck={!!it.checked && lead !== 'check' && lead !== 'checkbox'}
                  shortcut={it.shortcut}
                  tone={it.tone}
                  disabled={it.disabled}
                  showChevron={!!it.submenu}
                  open={sub === idx}
                  data-index={idx}
                  onPointerMove={(e) => {
                    if (it.disabled) return;
                    if (e.currentTarget !== document.activeElement) e.currentTarget.focus();
                    if (it.submenu && sub !== idx) {
                      setSub(idx);
                      setSubFocus('none');
                    } else if (!it.submenu && sub !== null && openSubmenuIndex == null) setSub(null);
                  }}
                  onClick={() => activate(it, idx)}
                />
              );
              return row;
            })}
        {query && shown.length === 0 && <div className="px-xl py-lg type-body-sm-regular text-text-tertiary">No results for “{query}”</div>}
      </div>
      <MenuScrollBar thumb={thumb} />
      </div>
      {footer && <MenuFooter type={footer.type} text={footer.text} onClick={() => (footer.onClick?.(), onClose(true))} />}
    </>
  );

  return (
    <div ref={wrap} className={cn('relative', width === 'trigger' && 'w-full', className)}>
      {hasSearch ? (
        <div ref={setSurface} data-anatomy="panel" onKeyDown={onKeyDown} className={surfaceClass}>
          {searchHeader}
          <div ref={ref} {...menuAttrs} className="relative flex min-h-0 flex-col outline-none">
            {body}
          </div>
        </div>
      ) : (
        <div ref={setSurface} data-anatomy="panel" {...menuAttrs} onKeyDown={onKeyDown} className={surfaceClass}>
          {body}
        </div>
      )}
      {subNode}
    </div>
  );
}

/* ---------- Menu ---------- */

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Type`: the trigger and the panel's construction. */
  type?: MenuType;
  /** Figma `Open`. Omit for an uncontrolled menu. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Figma `Show chevron` (button, link and account-button triggers). */
  showChevron?: boolean;
  /** Trigger text ("Options", "Search", "Integrations"); the accessible name of icon and avatar triggers. */
  label?: string;
  /** Trigger icon for `button-*` types. */
  leadingIcon?: IconName;
  /** The rows. Defaults to the Figma sample content of the Type. */
  items?: MenuItem[];
  /** Header text overrides (avatar header: name and email come from `account`). */
  headerText?: string;
  headerSupportingText?: string;
  /** Footer text, or the footer Button's label. */
  footerText?: string;
  onFooterClick?: () => void;
  /** The signed-in account: account triggers and the avatar header. */
  account?: MenuAccount;
  /** Account types: the accounts to switch between. */
  accounts?: MenuAccount[];
  /** Account types: the current account's id (its Radio is checked). */
  selectedAccount?: string;
  onAccountChange?: (id: string) => void;
  /** Called with every chosen item. */
  onAction?: (item: MenuItem) => void;
  /** Panel alignment to the trigger; icon triggers align to the end by default. */
  align?: 'start' | 'end';
  /**
   * Lay the open panel out in the page flow, as the Figma `Open=true` variant hugs its panel.
   * For documentation and static layouts; by default the panel floats.
   */
  inlinePopup?: boolean;
}

export function Menu({
  type = 'button-simple',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  showChevron = true,
  label,
  leadingIcon,
  items,
  headerText,
  headerSupportingText,
  footerText,
  onFooterClick,
  account: accountProp,
  accounts = menuSampleAccounts,
  selectedAccount,
  onAccountChange,
  onAction,
  align,
  inlinePopup = false,
  className,
  ...rest
}: MenuProps) {
  const p = presets[type];
  const auto = useId().replace(/:/g, '');
  const triggerId = `menu-${auto}-trigger`;
  const panelId = `menu-${auto}`;
  const [open, setOpenRaw] = useControllable(openProp, defaultOpen, onOpenChange);
  const [focusOnOpen, setFocusOnOpen] = useState<'first' | 'last' | 'panel' | 'none'>('none');
  const [selected, setSelected] = useControllable(selectedAccount, accounts[0]?.id ?? '', onAccountChange);
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const side = usePopupSide(open, anchor, panel, !inlinePopup);

  const account = accountProp ?? accounts.find((a) => a.id === selected) ?? menuSampleAccounts[0];
  const end = (align ?? (p.trigger === 'icon' ? 'end' : 'start')) === 'end';
  const cardWidth = p.trigger.startsWith('card');

  const setOpen = (o: boolean, focus: typeof focusOnOpen = 'none') => {
    setFocusOnOpen(focus);
    setOpenRaw(o);
  };
  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) document.getElementById(triggerId)?.focus();
  };
  useDismiss(open, [root], () => setOpen(false));

  const triggerKeys = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true, 'first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true, 'last');
    }
  };
  const triggerProps = {
    'data-anatomy': 'trigger',
    id: triggerId,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
    onKeyDown: triggerKeys,
    onClick: () => setOpen(!open, 'panel'),
  };
  const text = label ?? p.label;
  const chevron = showChevron && p.chevron ? 'arrows/chevron-down' : undefined;

  let triggerNode: ReactNode;
  switch (p.trigger) {
    case 'button':
      triggerNode =
        type === 'account-button' ? (
          <Button
            {...triggerProps}
            emphasis="secondary"
            leadingVisual={<Avatar size="xs" type={account.avatar?.src ? 'image' : 'initials'} src={account.avatar?.src} initials={account.avatar?.initials ?? initialsOf(account.name)} alt="" />}
            label={label ?? account.name}
            trailingIcon={chevron}
          />
        ) : (
          <Button {...triggerProps} emphasis="secondary" label={text} leadingIcon={leadingIcon ?? p.leadingIcon} trailingIcon={chevron} />
        );
      break;
    case 'link':
      triggerNode = <Link {...triggerProps} role="button" tabIndex={0} label={text} trailingIcon={chevron} onKeyDown={triggerKeys} />;
      break;
    case 'icon':
      triggerNode = <IconButton {...triggerProps} icon="general/more-vertical" label={text} emphasis="secondary" />;
      break;
    case 'avatar':
      triggerNode = (
        <button {...triggerProps} type="button" aria-label={label ?? `Account: ${account.name}`} className="inline-flex cursor-pointer rounded-full outline-none is-focus:shadow-focus-default">
          <Avatar size="sm" type={account.avatar?.src ? 'image' : 'initials'} src={account.avatar?.src} initials={account.avatar?.initials ?? initialsOf(account.name)} alt="" />
        </button>
      );
      break;
    default:
      triggerNode = <MenuAccountTrigger {...triggerProps} type={p.trigger} name={account.name} email={account.email} avatar={account.avatar} />;
  }

  // 1.6 Motion: the panel enters at base · enter and leaves at fast · exit.
  const presence = usePresence(open);
  const panelNode = presence.mounted && (
    <div data-side={side} inert={presence.closing || undefined} className={presenceClass(presence.closing)}>
    <MenuPanel
      panelRef={panel}
      id={panelId}
      labelledBy={triggerId}
      headers={p.headers.map((h) => (h.type === 'avatar' || h.type === 'header' ? { ...h, text: headerText ?? h.text, supportingText: headerSupportingText ?? h.supportingText } : h))}
      items={p.items === 'accounts' ? undefined : (items ?? p.items)}
      accounts={p.items === 'accounts' ? accounts : undefined}
      selectedAccount={selected}
      onAccountChange={setSelected}
      account={account}
      footer={p.footer && { type: p.footer.type, text: footerText ?? p.footer.text, onClick: onFooterClick }}
      onClose={close}
      onAction={onAction}
      autoFocus={focusOnOpen}
      width={cardWidth ? 'trigger' : 'menu'}
    />
    </div>
  );

  return (
    <div
      ref={root}
      className={cn('relative inline-flex flex-col gap-xs', end ? 'items-end' : 'items-start', cardWidth && 'w-full', className)}
      {...rest}
    >
      <div ref={anchor} className={cn('relative flex', cardWidth && 'w-full', !inlinePopup && (end ? 'justify-end' : ''))}>
        {triggerNode}
        {!inlinePopup && panelNode && (
          <div className={cn('absolute z-50', side === 'above' ? 'bottom-full mb-xs' : 'top-full mt-xs', cardWidth ? 'inset-x-0' : end ? 'end-0' : 'start-0')}>{panelNode}</div>
        )}
      </div>
      {inlinePopup && panelNode}
    </div>
  );
}

/* ---------- Context menu ---------- */

export type ContextMenuType = 'simple' | 'advanced';
export const contextMenuTypes: readonly ContextMenuType[] = ['simple', 'advanced'];

export interface ContextMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Type`: items with shortcuts, or items with icons, dividers and a submenu. */
  type?: ContextMenuType;
  /** Figma `Open`. Omit for an uncontrolled menu. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The rows. Defaults to the Figma sample content of the Type. */
  items?: MenuItem[];
  onAction?: (item: MenuItem) => void;
  /** The target region; a dashed "Right-click here" region by default. */
  children?: ReactNode;
  /** Accessible name of the target region. */
  targetLabel?: string;
  /** Documentation: lay the open panel out below the target, with the submenu open (Figma `Open=true`). */
  inlinePopup?: boolean;
}

/** Long-press duration on touch. No motion token covers it. */
const LONG_PRESS_MS = 500;

function PointerSpecimen() {
  // Pointer cursor specimen (Figma: cursor asset from 1.8); decorative.
  return (
    <svg aria-hidden viewBox="0 0 16 20" className="h-(--size-icon-md) w-(--size-icon-md)">
      <path d="M1 1 L1 15 L5 11.5 L8 18 L10.5 17 L7.6 10.6 L13 10.6 Z" className="fill-text-primary stroke-surface-base" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function ContextMenu({
  type = 'simple',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  items,
  onAction,
  children,
  targetLabel = 'Right-click for actions',
  inlinePopup = false,
  className,
  ...rest
}: ContextMenuProps) {
  const auto = useId().replace(/:/g, '');
  const panelId = `ctx-${auto}`;
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [shift, setShift] = useState({ x: 0, y: 0 });
  /** Focus moves into the panel when a person opens it (not for a panel shown open from the start). */
  const [focusPanel, setFocusPanel] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const press = useRef<number | undefined>(undefined);
  const list = items ?? contextMenuSampleItems[type];

  const openAt = (x: number, y: number) => {
    const r = target.current!.getBoundingClientRect();
    setPoint({ x: x - r.left, y: y - r.top });
    setShift({ x: 0, y: 0 });
    setFocusPanel(true);
    setOpen(true);
  };
  useDismiss(open && !inlinePopup, [root], () => setOpen(false));
  // 1.6 Motion: enters at base · enter, leaves at fast · exit.
  const presence = usePresence(open);

  // Keep the panel inside the viewport.
  useLayoutEffect(() => {
    if (!open || inlinePopup || !panel.current) return;
    const r = panel.current.getBoundingClientRect();
    const x = r.right > window.innerWidth ? -r.width : 0;
    const y = r.bottom > window.innerHeight ? -r.height : 0;
    if (x || y) setShift({ x, y });
  }, [open, point, inlinePopup]);

  const subIndex = type === 'advanced' && inlinePopup ? list.filter((i) => i.type !== 'divider').findIndex((i) => i.submenu) : -1;

  return (
    <div ref={root} className={cn('relative inline-flex flex-col gap-xs', className)} {...rest}>
      <div
        ref={target}
        tabIndex={0}
        role="group"
        aria-label={targetLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-keyshortcuts="Shift+F10"
        onContextMenu={(e) => {
          e.preventDefault();
          openAt(e.clientX, e.clientY);
        }}
        onKeyDown={(e) => {
          if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
            e.preventDefault();
            const r = e.currentTarget.getBoundingClientRect();
            openAt(r.left + r.width / 2, r.top + r.height / 2);
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'touch') return;
          const { clientX, clientY } = e;
          press.current = window.setTimeout(() => openAt(clientX, clientY), LONG_PRESS_MS);
        }}
        onPointerUp={() => window.clearTimeout(press.current)}
        onPointerCancel={() => window.clearTimeout(press.current)}
        className="rounded-surface outline-none is-focus:shadow-focus-default"
      >
        {children ?? (
          <div className="flex min-h-[7.5rem] w-(--menu-width) flex-col items-center justify-center gap-sm rounded-surface border-(length:--border-width-default) border-dashed border-border-default p-xl type-body-sm-medium text-text-tertiary">
            <span>Right-click here</span>
            <PointerSpecimen />
          </div>
        )}
      </div>
      {presence.mounted && (
        <div
          inert={presence.closing || undefined}
          className={cn(!inlinePopup && 'absolute z-50', presenceClass(presence.closing))}
          style={inlinePopup ? undefined : { left: point.x + shift.x, top: point.y + shift.y }}
        >
          <MenuPanel
            key={`${point.x},${point.y}`}
            panelRef={panel}
            id={panelId}
            label="Actions"
            items={list}
            onAction={onAction}
            autoFocus={focusPanel ? 'panel' : 'none'}
            openSubmenuIndex={subIndex >= 0 ? subIndex : undefined}
            onClose={(returnFocus) => {
              setOpen(false);
              if (returnFocus) target.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
