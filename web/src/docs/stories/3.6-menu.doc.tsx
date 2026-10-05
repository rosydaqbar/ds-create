import type { ReactNode } from 'react';
import { ContextMenu, Menu, contextMenuTypes, menuTypes, type MenuItem, type MenuType } from '@/components/components/Menu';
import {
  MenuAccountItem,
  MenuAccountTrigger,
  MenuFooter,
  MenuHeader,
  MenuItemRow,
  MenuScrollBar,
  menuAccountTriggerTypes,
  menuHeaderTypes,
  menuLeadingTypes,
  menuPanelSurface,
  type MenuItemLeadingProps,
} from '@/components/components/_MenuParts';
import { Button } from '@/components/parts/Button';
import { IconButton } from '@/components/parts/IconButton';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const OPEN = ['false', 'true'] as const;
const ITEM_COLS = ['rest · false', 'rest · true', 'hover · false', 'hover · true', 'disabled · false', 'disabled · true'] as const;

/** Card triggers fill their container: give the matrix cell the menu width. */
const cardType = (t: MenuType) => t.startsWith('account-card');

const manyItems: MenuItem[] = Array.from({ length: 16 }, (_, i) => ({ text: `Saved view ${i + 1}`, leading: 'icon', icon: 'layout/layout-grid' }));

/** A static open panel built from the item part, as the Figma doc frames show it. */
function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`flex w-(--menu-width) flex-col py-xs ${menuPanelSurface} ${className ?? ''}`}>{children}</div>;
}
const row = (text: string, leading?: MenuItemLeadingProps, extra: Partial<Parameters<typeof MenuItemRow>[0]> = {}) => <MenuItemRow key={text} text={text} leading={leading} {...extra} />;
const divider = (k: string) => <MenuItemRow key={k} type="divider" />;

const tableRow = (menu: ReactNode) => (
  <div className="w-full max-w-[34rem] rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-base">
    {[
      ['Q3 roadmap', 'Olivia Rhye', 'Edited 2h ago'],
      ['Pricing review', 'Phoenix Baker', 'Edited yesterday'],
    ].map(([name, owner, when], i) => (
      <div key={name} className={`flex items-center gap-lg px-xl py-md ${i ? 'border-t-(length:--border-width-default) border-border-subtle' : ''}`}>
        <span className="type-body-sm-medium flex-1 text-text-primary">{name}</span>
        <span className="type-body-sm-regular w-[8rem] text-text-secondary">{owner}</span>
        <span className="type-body-sm-regular w-[8rem] text-text-tertiary">{when}</span>
        {i === 0 ? menu : <IconButton icon="general/more-vertical" label="More actions" emphasis="secondary" />}
      </div>
    ))}
  </div>
);

export default defineDoc({
  id: '3.6',
  name: 'Menu',
  level: 'components',
  spec: 'components/3.6-menu.md',
  exports: ['Menu', 'ContextMenu'],
  summary:
    'A compact panel of related actions or options that opens from a trigger. Items share one row structure so icons, checks, avatars and shortcuts line up in every menu. A Context menu gives quick secondary actions on right-click or long-press; it is built from the same items and is never the only way to reach an action.',
  hero: () => <Menu type="button-advanced" defaultOpen inlinePopup />,
  playground: {
    controls: [
      { name: 'type', figma: 'Type', control: { type: 'select', options: menuTypes }, default: 'button-simple' },
      { name: 'open', figma: 'Open', control: { type: 'boolean' }, default: false },
      { name: 'showChevron', figma: 'Show chevron', control: { type: 'boolean' }, default: true },
      { name: 'longList', figma: 'Show scroll bar (from a long list)', control: { type: 'boolean' }, default: false },
    ],
    render: ({ open, longList, ...a }) => (
      <div className={`flex min-h-[30rem] items-start ${cardType(a.type) ? 'w-(--menu-width)' : ''}`}>
        <Menu key={`${a.type}-${open}`} {...a} items={longList && !String(a.type).startsWith('account') ? manyItems : undefined} defaultOpen={open} inlinePopup />
      </div>
    ),
    code: ({ open, longList, ...a }) => `<Menu${jsxProps(a, { type: 'button-simple', showChevron: true })}${open ? ' defaultOpen' : ''}${longList ? ' items={savedViews}' : ''} onAction={(item) => run(item)} />`,
  },
  examples: [
    {
      title: 'Table row actions',
      caption: 'An icon trigger at the end of the row; the destructive action comes last, in danger.',
      stage: 'full',
      render: () => <div className="flex min-h-[20rem] w-full items-start justify-center">{tableRow(<Menu type="icon-simple" defaultOpen />)}</div>,
      code: `<Menu
  type="icon-simple"
  label="More actions"
  items={[
    { text: 'Edit', onSelect: edit },
    { text: 'Duplicate', onSelect: duplicate },
    { text: 'Move to…', onSelect: move },
    { type: 'divider' },
    { text: 'Archive', onSelect: archive },
    { text: 'Delete', tone: 'danger', onSelect: confirmDelete },
  ]}
/>`,
    },
    {
      title: 'Workspace switcher',
      caption: 'An account card in the sidebar header switches accounts; the current one is selected.',
      render: () => (
        <div className="flex min-h-[26rem] w-[17rem] flex-col gap-lg rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-raised p-lg">
          <Menu type="account-card-md" defaultOpen />
          {['Home', 'Projects', 'Reports', 'Settings'].map((n) => (
            <span key={n} className="type-body-sm-medium px-md text-text-secondary">
              {n}
            </span>
          ))}
        </div>
      ),
      code: `<Menu
  type="account-card-md"
  accounts={accounts}
  selectedAccount={current}
  onAccountChange={switchAccount}
  onFooterClick={signOut}
/>`,
    },
    {
      title: 'Text selection',
      caption: 'Right-click the paragraph (or Shift+F10) for shortcuts to actions that also live in the toolbar.',
      render: () => (
        <ContextMenu type="simple" defaultOpen inlinePopup targetLabel="Paragraph">
          <p className="type-body-md-regular max-w-[22rem] p-md text-text-secondary">
            The quarterly review covers <span className="bg-fill-brand-subtle text-text-primary">revenue, retention and hiring</span>, with a short section on next quarter’s goals.
          </p>
        </ContextMenu>
      ),
      code: `<ContextMenu type="simple" onAction={(item) => run(item)}>
  <p>The quarterly review covers revenue, retention and hiring…</p>
</ContextMenu>`,
    },
    {
      title: 'Integrations',
      caption: 'A toolbar button lists services; connected ones show a check.',
      render: () => (
        <div className="flex min-h-[18rem] items-start gap-md">
          <Button emphasis="secondary" leadingIcon="general/filter" label="Filter" />
          <Menu type="integrations" defaultOpen />
        </div>
      ),
      code: `<Menu
  type="integrations"
  items={[
    { text: 'GitHub', leading: 'integration', provider: 'github', checked: true },
    { text: 'GitLab', leading: 'integration', provider: 'gitlab' },
  ]}
/>`,
    },
  ],
  whenToUse: {
    use: ['Actions on an object (“Edit, Duplicate, Delete”).', 'Switching accounts or workspaces.', 'Context menu: shortcuts to actions that are also available elsewhere.'],
    dont: [
      'Picking a value for a form field — use a Select (3.5).',
      'Two to five actions that should stay visible — use a Button group (3.1).',
      'The only way to reach an action — never hide it in a Context menu alone.',
    ],
  },
  matrices: [
    {
      title: 'Menu',
      rows: 'Open',
      columns: 'Type',
      render: () => (
        <Matrix
          rowProp="Open"
          rows={OPEN}
          colProp="Type"
          cols={menuTypes}
          className="[&_.grid]:items-start"
          cell={(open, type) => (
            <div className="w-(--menu-width)">
              <Menu type={type} open={open === 'true'} inlinePopup className={cardType(type) ? '' : 'w-full'} />
            </div>
          )}
        />
      ),
    },
    {
      title: 'Context menu',
      rows: 'Open',
      columns: 'Type',
      render: () => (
        <Matrix
          rowProp="Open"
          rows={OPEN}
          colProp="Type"
          cols={contextMenuTypes}
          className="[&_.grid]:items-start"
          cell={(open, type) => (
            <div className={type === 'advanced' && open === 'true' ? 'pe-(--menu-width)' : ''}>
              <ContextMenu type={type} open={open === 'true'} inlinePopup />
            </div>
          )}
        />
      ),
    },
  ],
  privateParts: [
    {
      title: '.Main/Menu item',
      rows: 'Tone, then the divider',
      columns: 'State → Open',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One row of every menu. Leading, shortcut and chevron keep their size; the text is the flexible part.</p>
          <Matrix
            rowProp="Tone"
            rows={['neutral', 'danger', 'divider'] as const}
            colProp="State · Open"
            cols={ITEM_COLS}
            cell={(tone, col) => {
              const [state, open] = col.split(' · ');
              return (
                <div className="w-(--menu-width)">
                  {tone === 'divider' ? (
                    <MenuItemRow type="divider" />
                  ) : (
                    <MenuItemRow
                      text={tone === 'danger' ? 'Delete' : 'View profile'}
                      leading={{ type: 'icon', icon: tone === 'danger' ? 'general/trash' : 'users/user' }}
                      shortcut={open === 'true' ? undefined : ['⌘', 'P']}
                      showChevron={open === 'true'}
                      open={open === 'true' && state !== 'disabled'}
                      tone={tone}
                      disabled={state === 'disabled'}
                      forceState={state === 'hover' ? 'hover' : undefined}
                    />
                  )}
                </div>
              );
            }}
          />
        </div>
      ),
    },
    {
      title: '.Main/Menu item leading',
      columns: 'Type',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">Keeps the text on the same left edge in every row. Each type shown inside a sample item.</p>
          <Matrix
            rowProp="Item"
            rows={['sample'] as const}
            colProp="Type"
            cols={menuLeadingTypes}
            cell={(_, type) => (
              <div className="w-[12rem]">
                <MenuItemRow text="Label" leading={{ type, icon: 'general/settings', avatar: { initials: 'OR' }, provider: 'github', checked: true }} />
              </div>
            )}
          />
        </div>
      ),
    },
    {
      title: '.Main/Menu header',
      rows: 'Show supporting text',
      columns: 'Type',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The top of a panel: the signed-in person, a title, a group subheading, or a search field (Text control 2.10).</p>
          <Matrix
            rowProp="Show supporting text"
            rows={OPEN.slice().reverse() as unknown as readonly ('true' | 'false')[]}
            colProp="Type"
            cols={menuHeaderTypes}
            className="[&_.grid]:items-start"
            cell={(sup, type) => (
              <div className={`w-(--menu-width) ${menuPanelSurface}`}>
                <MenuHeader
                  type={type}
                  text={type === 'header' ? 'Workspace' : type === 'subheading' ? 'Switch account' : undefined}
                  supportingText={sup === 'true' ? (type === 'header' ? 'Acme Inc. · Pro plan' : 'olivia@example.com') : undefined}
                />
              </div>
            )}
          />
        </div>
      ),
    },
    {
      title: '.Main/Menu footer',
      columns: 'Type',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The bottom of a panel: a line of small print, or a full-width secondary Button. Padding matches the header.</p>
          <Matrix
            rowProp="Footer"
            rows={['sample'] as const}
            colProp="Type"
            cols={['text', 'button'] as const}
            cell={(_, type) => (
              <div className={`w-(--menu-width) ${menuPanelSurface}`}>
                <MenuFooter type={type} />
              </div>
            )}
          />
        </div>
      ),
    },
    {
      title: '.Main/Menu account item',
      rows: 'Selected',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One account in a switcher: Avatar (2.6) and a Radio (2.8), because switching account is a single choice.</p>
          <Matrix
            rowProp="Selected"
            rows={OPEN}
            colProp="State"
            cols={['rest', 'hover'] as const}
            cell={(sel, state) => (
              <div className="w-(--menu-width)">
                <MenuAccountItem selected={sel === 'true'} forceState={state === 'hover' ? 'hover' : undefined} />
              </div>
            )}
          />
        </div>
      ),
    },
    {
      title: '.Main/Menu account trigger',
      rows: 'Type',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The trigger of the account-card and account-breadcrumb menus.</p>
          <Matrix
            rowProp="Type"
            rows={menuAccountTriggerTypes}
            colProp="State"
            cols={['rest', 'hover', 'focus'] as const}
            cell={(type, state) => (
              <div className={type === 'breadcrumb' ? '' : 'w-(--menu-width)'}>
                <MenuAccountTrigger type={type} forceState={state === 'rest' ? undefined : state} />
              </div>
            )}
          />
        </div>
      ),
    },
    {
      title: '.Main/Menu scroll bar',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">A 4-wide thumb with no rail, inset space/xs from the panel edge; it appears when the items are taller than the panel.</p>
          <div className={`relative h-40 w-24 ${menuPanelSurface}`}>
            <MenuScrollBar thumb={{ top: 0.2, size: 0.4, overflow: true }} />
          </div>
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-wrap items-start justify-center gap-4xl">
        <Menu type="button-advanced" open inlinePopup />
        <Panel>
          {row('Duplicate', { type: 'icon', icon: 'general/copy' }, { shortcut: ['⌘', 'D'] })}
          {row('Share', { type: 'icon', icon: 'general/share' }, { showChevron: true })}
        </Panel>
      </div>
    ),
    parts: [
      { name: 'Trigger', description: 'Button (2.1) secondary + chevron, Link (2.3), Icon button (2.2), Avatar (2.6) or the account trigger part, by Type.' },
      { name: 'Panel', description: 'space/xs under the trigger (above it near the bottom edge), menu/width = 240 (account cards: the trigger’s width).', tokens: ['menu/width', 'color/surface/raised', 'color/border/subtle', 'radius/surface', 'elevation/overlay', 'space/xs'] },
      { name: 'Header', description: '.Main/Menu header: avatar, header, subheading or search; padding space/lg × space/xl, bottom stroke (not on subheading).', tokens: ['space/lg', 'space/xl', 'color/border/subtle'] },
      { name: 'Items', description: 'Vertical, padding-y space/xs. Rows are .Main/Menu item; dividers are items with their own padding-y space/xs.', tokens: ['space/xs'] },
      { name: 'Item', description: 'Outer inset space/xxs × space/sm; content padding space/md, radius/control, gap space/md: leading, text (type/body/sm/medium, fills, truncates), shortcut (Kbd), chevron. Row height 40.', tokens: ['space/xxs', 'space/sm', 'space/md', 'radius/control', 'type/body/sm/medium'] },
      { name: 'Item leading', description: '16 × 16 (avatar 24, integration 20): spacer, icon, check, checkbox, dot, avatar or integration logo. Keeps the text on one edge.', tokens: ['size/icon/sm', 'size/icon/md', 'color/icon/brand', 'color/icon/success'] },
      { name: 'Footer', description: '.Main/Menu footer: small print or a full-width secondary Button; padding as the header, top stroke.', tokens: ['type/body/xs/regular', 'color/text/tertiary'] },
      { name: 'Scroll bar', description: '.Main/Menu scroll bar: 4-wide thumb, no rail, inset space/xs.', tokens: ['color/fill/neutral/track', 'radius/full'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: menuTypes.map((t) => `'${t}'`).join(' | '), default: "'button-simple'", description: 'Menu: the trigger and the panel’s construction (header, items, footer).' },
    { name: 'open / defaultOpen / onOpenChange', figma: 'Open', type: 'boolean', default: 'false', description: 'The panel. Omit `open` for an uncontrolled menu.' },
    { name: 'showChevron', figma: 'Show chevron', type: 'boolean', default: 'true', description: 'The trigger chevron (button, link and account-button triggers).' },
    { name: 'items', figma: '.Main/Menu item (nested)', type: 'MenuItem[]', default: 'Figma sample content', description: '{ text, leading?, icon?, avatar?, provider?, checked?, shortcut?, tone?, disabled?, onSelect?, submenu? } or { type: "divider" }.' },
    { name: 'label', type: 'string', default: "'Options' · 'Search' · 'Integrations' · 'More actions'", description: 'Trigger text; the accessible name of icon and avatar triggers.' },
    { name: 'leadingIcon', type: 'IconName', description: 'Trigger icon of button types.' },
    { name: 'headerText / headerSupportingText', type: 'string', description: 'Header overrides; the avatar header reads `account` by default.' },
    { name: 'footerText / onFooterClick', type: 'string · () => void', description: 'Footer small print, or the footer Button’s label and action.' },
    { name: 'account / accounts / selectedAccount / onAccountChange', type: 'MenuAccount · MenuAccount[] · string', description: 'Account types: the signed-in account, the accounts to switch between, the current one (Radio checked).' },
    { name: 'onAction', type: '(item) => void', description: 'Called with every chosen item.' },
    { name: 'align', type: "'start' | 'end'", default: "'start' (icon: 'end')", description: 'Panel edge aligned to the trigger.' },
    { name: 'inlinePopup', type: 'boolean', default: 'false', description: 'Lay the open panel out in the page flow (the Figma Open variant hugs its panel). Documentation and static layouts.' },
    { name: 'ContextMenu · type', figma: 'Type', type: "'simple' | 'advanced'", default: "'simple'", description: 'ContextMenu: items with shortcuts, or with icons, dividers and a submenu.' },
    { name: 'ContextMenu · children / targetLabel', type: 'ReactNode · string', description: 'ContextMenu: the target region (a dashed “Right-click here” region by default) and its accessible name.' },
  ],
  tokens: [
    'menu/width', 'color/surface/raised', 'color/border/subtle', 'radius/surface', 'elevation/overlay', 'radius/control',
    'color/fill/none', 'color/fill/neutral/subtle/hover', 'color/text/secondary', 'color/text/primary', 'color/text/disabled', 'color/text/danger', 'color/text/tertiary',
    'color/icon/tertiary', 'color/icon/secondary', 'color/icon/disabled', 'color/icon/danger', 'color/icon/brand', 'color/icon/success', 'color/fill/neutral/track',
    'space/xxs', 'space/xs', 'space/sm', 'space/md', 'space/lg', 'space/xl', 'type/body/sm/medium', 'type/body/sm/semibold', 'type/body/xs/semibold', 'type/body/xs/regular',
    'size/icon/sm', 'size/icon/md', 'size/avatar/xs', 'color/border/default', 'color/surface/base', 'color/surface/base/hover', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Menu or context menu',
      body: 'Context menus are shortcuts; every action in one must also be reachable from a visible control.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <Menu type="icon-simple" open inlinePopup />
          <ContextMenu type="simple" open inlinePopup />
        </div>
      ),
    },
    {
      title: 'Trigger and panel',
      body: 'The panel opens space/xs under the trigger and aligns to its edge — start for buttons, end for icon triggers.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <Menu type="button-simple" />
          <Menu type="button-simple" open inlinePopup />
          <Menu type="icon-simple" open inlinePopup />
        </div>
      ),
    },
    {
      title: 'Item anatomy',
      body: 'Leading, text, shortcut and chevron in one row. The outer inset (space/xxs × space/sm) keeps the hover fill off the panel edge; the inner padding is space/md.',
      render: () => (
        <Panel>
          {row('View profile', { type: 'icon', icon: 'users/user' }, { shortcut: ['⌘', 'P'] })}
          {row('Share', { type: 'icon', icon: 'general/share' }, { showChevron: true, forceState: 'hover' })}
        </Panel>
      ),
    },
    {
      title: 'Leading alignment',
      body: 'A row with no icon in a menu that has icons uses the spacer leading, so its text stays on the same edge.',
      do: {
        caption: 'The spacer keeps the text aligned.',
        render: () => (
          <Panel>
            {row('Copy link', { type: 'icon', icon: 'general/link' })}
            {row('Rename', { type: 'spacer' })}
            {row('Download', { type: 'icon', icon: 'general/download' })}
          </Panel>
        ),
      },
      dont: {
        caption: 'The leading removed: the text shifts left.',
        render: () => (
          <Panel>
            {row('Copy link', { type: 'icon', icon: 'general/link' })}
            {row('Rename')}
            {row('Download', { type: 'icon', icon: 'general/download' })}
          </Panel>
        ),
      },
    },
    {
      title: 'Leading types',
      body: 'Check marks the current option, checkbox toggles several, dot shows a status, avatar a person, integration a connected service.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-xl">
          <Panel>
            {row('Comfortable', { type: 'check', checked: true })}
            {row('Compact', { type: 'check', checked: false })}
          </Panel>
          <Panel>
            {row('Show grid', { type: 'checkbox', checked: true })}
            {row('Show rulers', { type: 'checkbox', checked: false })}
          </Panel>
          <Panel>
            {row('Online', { type: 'dot' })}
            {row('Olivia Rhye', { type: 'avatar', avatar: { initials: 'OR' } })}
            {row('GitHub', { type: 'integration', provider: 'github' }, { trailingCheck: true })}
          </Panel>
        </div>
      ),
    },
    {
      title: 'Dividers and groups',
      body: 'Group related actions; keep each group to a few items. A divider is an item with its own vertical padding.',
      render: () => (
        <Panel>
          {row('Edit')}
          {row('Duplicate')}
          {divider('a')}
          {row('Move to…')}
          {row('Share…')}
          {divider('b')}
          {row('Archive')}
        </Panel>
      ),
    },
    {
      title: 'Danger actions',
      body: 'Put destructive actions last, separated, and confirm them in a dialog.',
      render: () => (
        <Panel>
          {row('Edit', { type: 'icon', icon: 'general/edit' })}
          {row('Duplicate', { type: 'icon', icon: 'general/copy' })}
          {divider('a')}
          {row('Delete', { type: 'icon', icon: 'general/trash' }, { tone: 'danger' })}
        </Panel>
      ),
    },
    {
      title: 'Content',
      body: 'Item labels start with a verb for actions (“Duplicate”, “Move to…”); use an ellipsis when the item opens a dialog that asks for more input. Sentence case, no full stops. Keep menus short — about seven items per group; long lists belong in a Select with search.',
    },
    {
      title: 'Build rows from the item part',
      body: 'Every row is .Main/Menu item, so states, padding and alignment stay the same in every menu.',
      do: {
        caption: 'Item part rows.',
        render: () => (
          <Panel>
            {row('Edit', { type: 'icon', icon: 'general/edit' })}
            {row('Duplicate', { type: 'icon', icon: 'general/copy' })}
          </Panel>
        ),
      },
      dont: {
        caption: 'Hand-drawn rows: uneven padding, no states.',
        render: () => (
          <div className={`flex w-(--menu-width) flex-col gap-xs p-sm ${menuPanelSurface}`}>
            <span className="type-body-sm-regular text-text-secondary">Edit</span>
            <span className="type-body-sm-regular ps-lg text-text-secondary">Duplicate</span>
          </div>
        ),
      },
    },
    {
      title: 'Let the menu show completely',
      body: 'An open menu is never clipped by its container; it flips above the trigger near the bottom edge.',
      do: { caption: 'The whole panel is visible.', render: () => <Menu type="button-simple" open inlinePopup /> },
      dont: {
        caption: 'The panel cut off inside a scrolling card.',
        render: () => (
          <div className="relative h-36 overflow-hidden rounded-surface border-(length:--border-width-default) border-border-subtle p-md">
            <Menu type="button-simple" open />
          </div>
        ),
      },
    },
    {
      title: 'Separate destructive items',
      body: 'Delete goes last, after a divider.',
      do: {
        caption: 'Delete last, after a divider.',
        render: () => (
          <Panel>
            {row('Edit')}
            {row('Duplicate')}
            {divider('a')}
            {row('Delete', undefined, { tone: 'danger' })}
          </Panel>
        ),
      },
      dont: {
        caption: 'Delete between Edit and Duplicate.',
        render: () => (
          <Panel>
            {row('Edit')}
            {row('Delete', undefined, { tone: 'danger' })}
            {row('Duplicate')}
          </Panel>
        ),
      },
    },
    {
      title: 'Maintenance',
      body: 'Change rows in .Main/Menu item and .Main/Menu item leading; headers and footers in their parts; the panel look through the tokens above. Every Menu and Context menu updates together.',
    },
  ],
  accessibility: [
    'The trigger announces that it opens a menu (aria-haspopup="menu") and whether it is open (aria-expanded); the menu is named by its trigger.',
    'Enter, Space or Down opens the menu on the first item, Up on the last. Arrow keys, Home and End move between items; typing a letter jumps to the matching item; Enter or Space activates; Escape closes and returns focus to the trigger; Tab or a press outside closes.',
    'Right opens a submenu on its first item; Left or Escape closes it and returns to the parent item.',
    'Check, checkbox and account items are menuitemcheckbox / menuitemradio and announce their state.',
    'Icon-only triggers have an accessible name (“More actions”).',
    'The open panel stays within the viewport: it flips above the trigger near the bottom edge; a Context menu shifts back inside the window.',
    'Context menu: right-click, Shift+F10 or the Menu key on the focused target, or a long press on touch.',
  ],
});
