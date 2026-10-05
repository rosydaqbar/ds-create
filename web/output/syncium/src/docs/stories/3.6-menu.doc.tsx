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
  return (
    <div role="menu" aria-label="Example menu" className={`flex w-(--menu-width) flex-col py-xs ${menuPanelSurface} ${className ?? ''}`}>
      {children}
    </div>
  );
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
    'Menus keep a short list of actions or options behind a trigger, like Edit, Duplicate and Delete on a table row. A context menu offers the same kind of shortcuts on right-click or long press.',
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
      caption: 'Put row actions behind an icon button at the end of the row, with Delete last and in the danger color.',
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
      caption: 'An account card at the top of the sidebar lets people switch accounts, with the current one selected.',
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
      caption: 'Right-click the paragraph, or press Shift+F10, for quick access to actions that are also in the toolbar.',
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
      caption: 'A toolbar button lists the available services, and a check marks the ones already connected.',
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
    use: ['Actions on one object, like Edit, Duplicate and Delete.', 'Switching accounts or workspaces.', 'Shortcuts to actions that are also available elsewhere, in a context menu.'],
    dont: [
      'For picking a value in a form field, use a Select (3.5).',
      'For two to five actions that should stay visible, use a Button group (3.1).',
      'For an action with no visible control, add one first. A context menu can only be a shortcut.',
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
      specimenRole: 'menu',
      rows: 'Tone, then the divider',
      columns: 'State → Open',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The row every menu is built from. The leading visual, shortcut and chevron keep a fixed size, and the text takes the rest of the space.</p>
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
      specimenRole: 'menu',
      columns: 'Type',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The slot before the text that keeps it on the same left edge in every row. Each type is shown inside a sample item.</p>
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
          <p className="type-body-sm-regular text-text-secondary">The top of a menu: the signed-in person, a title, a group subheading or a search field (Text control, 2.10).</p>
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
      specimenRole: 'menu',
      columns: 'Type',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The bottom of a menu: a line of small print or a full-width secondary button. Its padding matches the header.</p>
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
      specimenRole: 'menu',
      rows: 'Selected',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One account in a switcher, with an Avatar (2.6) and a Radio (2.8), because people pick one account at a time.</p>
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
          <p className="type-body-sm-regular text-text-secondary">The trigger for the account card and account breadcrumb menus.</p>
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
          <p className="type-body-sm-regular text-text-secondary">A 4px-wide thumb with no rail, set slightly in from the panel edge. It appears when the items don’t fit in the panel.</p>
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
        {/* A static long panel (clipped, as the Figma doc frames show it): past the max height the scroll bar shows. */}
        <Panel className="relative h-[12.5rem]">
          {['Saved view 1', 'Saved view 2', 'Saved view 3', 'Saved view 4', 'Saved view 5', 'Saved view 6'].map((t) => row(t, { type: 'icon', icon: 'layout/layout-grid' }))}
          <MenuScrollBar thumb={{ top: 0, size: 0.45, overflow: true }} />
        </Panel>
      </div>
    ),
    parts: [
      { name: 'Trigger', target: 'trigger', description: 'What people click to open the menu. Depending on the type, it’s a secondary Button (2.1) with a chevron, a Link (2.3), an Icon button (2.2), an Avatar (2.6) or the account trigger.' },
      { name: 'Panel', target: 'panel', description: 'Opens just below the trigger, or above it near the bottom of the screen. It’s 240 px wide; account card menus match the trigger’s width.', tokens: ['menu/width', 'color/surface/raised', 'color/border/subtle', 'radius/surface', 'elevation/overlay', 'space/xs'] },
      { name: 'Header', target: 'header', description: 'An optional top section: the signed-in person, a title, a subheading or a search field. A line separates it from the items, except under a subheading.', tokens: ['space/lg', 'space/xl', 'color/border/subtle'] },
      { name: 'Items', target: 'items', description: 'The stack of rows. Dividers are items too, with their own space above and below.', tokens: ['space/xs'] },
      { name: 'Item', target: 'item', description: 'One action: a leading visual, the text, and an optional shortcut or chevron. Rows are 40 px tall, and long text ends in an ellipsis.', tokens: ['space/xxs', 'space/sm', 'space/md', 'radius/control', 'type/body/sm/medium'] },
      { name: 'Item leading', target: 'item-leading', description: 'An icon, check, checkbox, dot, avatar, integration logo or an empty spacer, so the text stays on one edge. It’s 16 px square (avatars 24, logos 20).', tokens: ['size/icon/sm', 'size/icon/md', 'color/icon/brand', 'color/icon/success'] },
      { name: 'Footer', target: 'footer', description: 'An optional bottom section with small print or a full-width secondary button. A line separates it from the items.', tokens: ['type/body/xs/regular', 'color/text/tertiary'] },
      { name: 'Scroll bar', target: 'scroll-bar', description: 'A 4px-wide thumb with no rail. It shows only when the items scroll.', tokens: ['color/fill/neutral/track', 'radius/full'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: menuTypes.map((t) => `'${t}'`).join(' | '), default: "'button-simple'", description: 'Menu only: sets the trigger and what the panel holds (header, items, footer).' },
    { name: 'open / defaultOpen / onOpenChange', figma: 'Open', type: 'boolean', default: 'false', description: 'Whether the panel is open. Leave out open for an uncontrolled menu.' },
    { name: 'showChevron', figma: 'Show chevron', type: 'boolean', default: 'true', description: 'Shows the chevron on button, link and account-button triggers.' },
    { name: 'items', figma: '.Main/Menu item (nested)', type: 'MenuItem[]', default: 'Figma sample content', description: 'Each item is { text, leading?, icon?, avatar?, provider?, checked?, shortcut?, tone?, disabled?, onSelect?, submenu? }, or { type: "divider" }.' },
    { name: 'label', type: 'string', default: "'Options' · 'Search' · 'Integrations' · 'More actions'", description: 'The trigger text. For icon and avatar triggers, it becomes the accessible name.' },
    { name: 'leadingIcon', type: 'IconName', description: 'An icon on the trigger, for the button types.' },
    { name: 'headerText / headerSupportingText', type: 'string', description: 'Override the header text. The avatar header shows account by default.' },
    { name: 'footerText / onFooterClick', type: 'string · () => void', description: 'The footer’s small print, or the footer button’s label and click handler.' },
    { name: 'account / accounts / selectedAccount / onAccountChange', type: 'MenuAccount · MenuAccount[] · string', description: 'For account types: the signed-in account, the accounts to switch between, and the current one (its radio is checked).' },
    { name: 'onAction', type: '(item) => void', description: 'Called with the item each time one is chosen.' },
    { name: 'align', type: "'start' | 'end'", default: "'start' (icon: 'end')", description: 'Which panel edge lines up with the trigger.' },
    { name: 'inlinePopup', type: 'boolean', default: 'false', description: 'Places the open panel in the page flow instead of floating it, like the Figma Open variant. For documentation and static layouts.' },
    { name: 'ContextMenu · type', figma: 'Type', type: "'simple' | 'advanced'", default: "'simple'", description: 'ContextMenu: simple has items with shortcuts; advanced adds icons, dividers and a submenu.' },
    { name: 'ContextMenu · children / targetLabel', type: 'ReactNode · string', description: 'ContextMenu: the area people right-click (a dashed “Right-click here” box by default), and its accessible name.' },
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
      body: 'Many people never discover a context menu, so treat it as a shortcut. Put every action in it somewhere visible too, like a menu button or the toolbar.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <Menu type="icon-simple" open inlinePopup />
          <ContextMenu type="simple" open inlinePopup />
        </div>
      ),
    },
    {
      title: 'Trigger and panel',
      body: 'The menu opens just below its trigger and lines up with it: with the start edge for a text button, and with the end edge for an icon button, so it never covers what opened it.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <Menu type="button-simple" />
          <Menu type="button-simple" open inlinePopup />
          <Menu type="icon-simple" open inlinePopup />
        </div>
      ),
    },
    {
      title: 'Inside a menu item',
      body: 'Each row holds a leading visual, the text, and an optional shortcut or chevron. A small inset keeps the hover fill clear of the panel edge.',
      render: () => (
        <Panel>
          {row('View profile', { type: 'icon', icon: 'users/user' }, { shortcut: ['⌘', 'P'] })}
          {row('Share', { type: 'icon', icon: 'general/share' }, { showChevron: true, forceState: 'hover' })}
        </Panel>
      ),
    },
    {
      title: 'Keep item text aligned',
      body: 'When a menu has icons, give rows without one an empty spacer, so all the text starts on the same edge.',
      do: {
        caption: 'A spacer keeps “Rename” in line with the rest.',
        render: () => (
          <Panel>
            {row('Copy link', { type: 'icon', icon: 'general/link' })}
            {row('Rename', { type: 'spacer' })}
            {row('Download', { type: 'icon', icon: 'general/download' })}
          </Panel>
        ),
      },
      dont: {
        caption: 'Without a spacer, “Rename” shifts left.',
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
      title: 'Pick the right leading visual',
      body: 'Use a check to mark the current option, and checkboxes when people can turn several on. A dot shows a status, an avatar shows a person and a logo shows a connected service.',
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
      body: 'Group related actions and keep each group to a few items. Separate groups with a divider, which brings its own spacing.',
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
      title: 'Confirm destructive actions',
      body: 'Put destructive actions last, after a divider. Confirm them in a dialog before anything is lost.',
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
      body: 'Start action labels with a verb, like “Duplicate” or “Move to…”. Add an ellipsis when the item opens a dialog that asks for more input. Use sentence case and no full stops.\n\nKeep menus short, about seven items per group. For a long list of options, use a Select (3.5) with search.',
    },
    {
      title: 'Build rows from the item part',
      body: 'Build every row from the menu item part (.Main/Menu item), so states, padding and alignment match in every menu.',
      do: {
        caption: 'Rows built from the item part.',
        render: () => (
          <Panel>
            {row('Edit', { type: 'icon', icon: 'general/edit' })}
            {row('Duplicate', { type: 'icon', icon: 'general/copy' })}
          </Panel>
        ),
      },
      dont: {
        caption: 'Hand-drawn rows with uneven padding and no states.',
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
      body: 'Make sure an open menu is never cut off by its container. Near the bottom of the screen, it opens above the trigger instead.',
      do: { caption: 'The whole menu is visible.', render: () => <Menu type="button-simple" open inlinePopup /> },
      dont: {
        caption: 'The menu cut off inside a scrolling card.',
        render: () => (
          <div className="relative h-36 overflow-hidden rounded-surface border-(length:--border-width-default) border-border-subtle p-md">
            <Menu type="button-simple" open />
          </div>
        ),
      },
    },
    {
      title: 'Separate destructive items',
      body: 'Put Delete last, after a divider, so people don’t hit it while reaching for Edit or Duplicate.',
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
        caption: 'Delete squeezed between Edit and Duplicate.',
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
      body: 'To change rows, edit the menu item and item leading parts. Headers and footers have their own parts, and the panel’s look comes from the tokens above. Every menu and context menu updates together.',
    },
  ],
  accessibility: [
    'The trigger tells screen readers that it opens a menu (aria-haspopup="menu") and whether it’s open (aria-expanded). The menu takes its name from the trigger.',
    'Enter, Space or Down opens the menu on the first item, and Up opens it on the last. Arrow keys, Home and End move between items, and typing a letter jumps to a match. Enter or Space activates an item. Escape closes the menu and returns focus to the trigger; Tab or clicking outside also closes it.',
    'Right arrow opens a submenu on its first item. Left arrow or Escape closes it and returns to the parent item.',
    'Check, checkbox and account items are menuitemcheckbox or menuitemradio, so screen readers announce whether they’re checked.',
    'Icon-only triggers have a name screen readers announce, like “More actions”.',
    'The open menu stays inside the window. Near the bottom edge it opens above the trigger, and a context menu shifts back into view.',
    'People open a context menu by right-clicking, pressing Shift+F10 or the Menu key on the focused target, or with a long press on touch screens.',
  ],
});
