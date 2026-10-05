import { Button } from '@/components/parts/Button';
import { IconButton } from '@/components/parts/IconButton';
import type { IconName } from '@/icons';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const EMPHASIS = ['secondary', 'tertiary'] as const;
const STATES = ['rest', 'hover', 'pressed', 'focus', 'disabled', 'loading'] as const;
const ROWS = EMPHASIS.flatMap((e) => SIZES.map((s) => `${e} · ${s}` as const));
const CONTENT: { icon: IconName; label: string }[] = [
  { icon: 'general/x', label: 'Close' },
  { icon: 'general/more-horizontal', label: 'More actions' },
  { icon: 'general/copy', label: 'Copy' },
  { icon: 'general/edit', label: 'Edit' },
  { icon: 'general/trash', label: 'Delete' },
  { icon: 'general/settings', label: 'Settings' },
];

/** Render one Figma variant: State → forceState / disabled / loading. */
const variant = (size: (typeof SIZES)[number], emphasis: (typeof EMPHASIS)[number], state: (typeof STATES)[number]) => (
  <IconButton
    size={size}
    emphasis={emphasis}
    label="Close"
    forceState={state === 'hover' || state === 'pressed' || state === 'focus' ? state : undefined}
    disabled={state === 'disabled'}
    loading={state === 'loading'}
  />
);

const dialogHeader = (
  <div className="flex w-full max-w-[26rem] items-start gap-lg rounded-modal border border-border-subtle bg-surface-raised p-xl shadow-raised">
    <div className="flex flex-1 flex-col gap-xxs">
      <span className="type-body-lg-semibold text-text-primary">Invite teammates</span>
      <span className="type-body-sm-regular text-text-tertiary">They’ll get an email with a link to join.</span>
    </div>
    <IconButton size="lg" label="Close dialog" className="-mr-sm -mt-sm" />
  </div>
);

export default defineDoc({
  id: '2.2',
  name: 'Icon button',
  level: 'parts',
  spec: 'parts/2.2-icon-button.md',
  exports: ['IconButton'],
  summary:
    'Square, label-free actions for toolbars, rows and close. Four sizes, secondary or tertiary emphasis, six states including loading. The icon is swappable; close is the same component with the x icon.',
  hero: () => <IconButton size="md" emphasis="tertiary" label="Close" />,
  playground: {
    controls: [
      { name: 'label', figma: '— (accessible name)', control: { type: 'text' }, default: 'Close' },
      { name: 'icon', figma: 'Icon', control: { type: 'icon' }, default: 'general/x' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'emphasis', figma: 'Emphasis', control: { type: 'select', options: EMPHASIS }, default: 'tertiary' },
      { name: 'loading', figma: 'State=loading', control: { type: 'boolean' }, default: false },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <IconButton {...(a as any)} icon={a.icon ?? 'general/x'} />,
    code: (a) => `<IconButton${jsxProps(a, { size: 'md', emphasis: 'tertiary', icon: 'general/x', loading: false, disabled: false })} />`,
  },
  examples: [
    {
      title: 'Dialog close',
      caption: 'Close sits in the corner, aligned to the title’s first line.',
      render: () => dialogHeader,
      code: `<div className="flex items-start gap-lg">
  <div className="flex flex-1 flex-col gap-xxs">
    <h2 className="type-body-lg-semibold">Invite teammates</h2>
    <p className="type-body-sm-regular text-text-tertiary">They’ll get an email with a link to join.</p>
  </div>
  <IconButton size="lg" label="Close dialog" />
</div>`,
    },
    {
      title: 'Table row actions',
      caption: 'Row actions stay quiet until the row is hovered.',
      render: () => (
        <div className="flex w-full max-w-[28rem] items-center gap-md rounded-surface border border-border-subtle bg-surface-base py-sm pl-lg pr-sm">
          <span className="type-body-sm-medium flex-1 text-text-primary">Quarterly report.pdf</span>
          <span className="type-body-sm-regular text-text-tertiary">2.4 MB</span>
          <span className="flex gap-xxs">
            <IconButton size="sm" icon="general/edit" label="Rename" />
            <IconButton size="sm" icon="general/trash" label="Delete" />
            <IconButton size="sm" icon="general/more-horizontal" label="More actions" />
          </span>
        </div>
      ),
      code: `<IconButton size="sm" icon="general/edit" label="Rename" />
<IconButton size="sm" icon="general/trash" label="Delete" />
<IconButton size="sm" icon="general/more-horizontal" label="More actions" />`,
    },
    {
      title: 'Toolbar',
      caption: 'Secondary emphasis gives tool actions a visible boundary on busy surfaces.',
      render: () => (
        <div className="flex w-full max-w-[28rem] flex-col gap-sm">
          <div className="flex justify-end gap-xs">
            <IconButton size="sm" emphasis="secondary" icon="general/copy" label="Copy code" />
            <IconButton size="sm" emphasis="secondary" icon="general/download" label="Download" />
            <IconButton size="sm" emphasis="secondary" icon="general/share" label="Share" />
          </div>
          <pre className="type-code-sm-regular rounded-surface border border-border-subtle bg-surface-base p-lg text-text-secondary">{'npm install\nnpm run build'}</pre>
        </div>
      ),
      code: `<div className="flex justify-end gap-xs">
  <IconButton size="sm" emphasis="secondary" icon="general/copy" label="Copy code" />
  <IconButton size="sm" emphasis="secondary" icon="general/download" label="Download" />
  <IconButton size="sm" emphasis="secondary" icon="general/share" label="Share" />
</div>`,
    },
    {
      title: 'Dark banner close',
      caption: 'On dark surfaces, the same component follows the colour mode; there is no dark variant.',
      render: () => (
        <div data-theme="dark" className="flex w-full max-w-[28rem] items-center gap-md rounded-surface bg-surface-raised py-sm pl-lg pr-sm">
          <span className="type-body-sm-medium flex-1 text-text-primary">Scheduled maintenance tonight at 22:00.</span>
          <IconButton size="md" label="Dismiss banner" />
        </div>
      ),
      code: `<div data-theme="dark" className="flex items-center gap-md bg-surface-raised">
  <span className="flex-1 text-text-primary">Scheduled maintenance tonight at 22:00.</span>
  <IconButton size="md" label="Dismiss banner" />
</div>`,
    },
  ],
  whenToUse: {
    use: ['The icon is universally understood and space is tight: close, more, copy, edit, delete, settings.', 'Quiet tool actions in toolbars and table rows, and the close of dialogs, drawers, banners and toasts.'],
    dont: ['The action needs words or is the main action — use a labelled Button (2.1).', 'An icon action inside a row of labelled buttons — use Button with iconOnly.', 'A primary or destructive icon action — use Button with iconOnly and its emphasis or tone.'],
  },
  matrices: [
    {
      title: 'Icon button',
      rows: 'Emphasis × Size',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Emphasis · Size"
          rows={ROWS}
          colProp="State"
          cols={STATES}
          cell={(row, state) => {
            const [e, s] = row.split(' · ') as [(typeof EMPHASIS)[number], (typeof SIZES)[number]];
            return variant(s, e, state);
          }}
        />
      ),
    },
    {
      title: 'Content options',
      rows: 'Emphasis',
      columns: 'Icon',
      render: () => (
        <Matrix
          rowProp="Emphasis"
          rows={EMPHASIS}
          colProp="Icon"
          cols={CONTENT.map((c) => c.icon.split('/')[1])}
          cell={(emphasis, name) => {
            const c = CONTENT.find((x) => x.icon.endsWith(`/${name}`))!;
            return <IconButton emphasis={emphasis} icon={c.icon} label={c.label} />;
          }}
        />
      ),
    },
    {
      title: 'Colour modes',
      rows: 'Mode',
      columns: 'Emphasis',
      render: () => (
        <div className="grid gap-lg md:grid-cols-2">
          {(['light', 'dark'] as const).map((m) => (
            <div key={m} data-theme={m} className="flex flex-col gap-md rounded-surface border border-border-subtle bg-surface-base p-xl">
              <span className="type-body-xs-semibold text-text-tertiary">{m === 'light' ? 'Light' : 'Dark'}</span>
              <div className="flex flex-wrap items-center gap-md">
                {EMPHASIS.map((e) => CONTENT.slice(0, 3).map((c) => <IconButton key={e + c.icon} emphasis={e} icon={c.icon} label={c.label} />))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex scale-150 items-center gap-xl">
        <IconButton emphasis="secondary" icon="general/copy" label="Copy" />
        <IconButton emphasis="tertiary" label="Close" />
        <IconButton emphasis="secondary" loading label="Saving" />
      </div>
    ),
    parts: [
      { name: 'Root', description: 'Fixed square, icon centred so the space is equal on every side. Side icon-button/size/{size}; radius/control; border/width/default.', tokens: ['icon-button/size/md', 'radius/control', 'border/width/default'] },
      { name: 'Icon', description: 'Fixed icon box: size/icon/sm (xs, sm), md (md), lg (lg). Replaced by a 2.15 Spinner (sm for xs–sm, md for md–lg) while loading.', tokens: ['size/icon/md'] },
    ],
  },
  props: [
    { name: 'label', type: 'string', description: 'Accessible name (required): the button has no visible text. Pair with a Tooltip showing the same text.' },
    { name: 'icon', figma: 'Icon', type: 'IconName', default: "'general/x'", description: 'The glyph; close is the x icon.' },
    { name: 'size', figma: 'Size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Side 28 · 32 · 36 · 44 and icon size.' },
    { name: 'emphasis', figma: 'Emphasis', type: "'secondary' | 'tertiary'", default: "'tertiary'", description: 'Bordered surface, or no container at rest.' },
    { name: 'loading', figma: 'State=loading', type: 'boolean', default: 'false', description: 'Spinner replaces the icon; not clickable; aria-busy.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Native disabled button.' },
    { name: 'forceState', type: "'hover' | 'pressed' | 'focus'", description: 'Documentation only: pins a pseudo-state.' },
  ],
  tokens: [
    'icon-button/size/xs', 'icon-button/size/sm', 'icon-button/size/md', 'icon-button/size/lg',
    'size/icon/sm', 'size/icon/md', 'size/icon/lg', 'size/touch-min',
    'color/surface/base', 'color/surface/base/hover', 'color/surface/base/pressed', 'color/border/default',
    'color/fill/none', 'color/fill/neutral/subtle/hover', 'color/fill/neutral/subtle/pressed',
    'color/icon/tertiary', 'color/icon/secondary', 'color/icon/disabled', 'color/border/disabled',
    'radius/control', 'border/width/default', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Icon button, icon-only Button, or labelled Button',
      body: 'A labelled Button when the action needs words or is the main action. Button with iconOnly when an icon action sits in a row of labelled buttons and shares their height and emphasis. Icon button for a quiet tool or close action inside content.',
      render: () => (
        <div className="flex flex-wrap items-center gap-3xl">
          <div className="flex flex-col items-center gap-sm">
            <Button label="Save changes" />
            <span className="type-body-xs-regular text-text-tertiary">Labelled Button</span>
          </div>
          <div className="flex flex-col items-center gap-sm">
            <div className="flex gap-sm">
              <Button emphasis="secondary" label="Export" />
              <Button emphasis="secondary" iconOnly leadingIcon="general/settings" label="Settings" />
            </div>
            <span className="type-body-xs-regular text-text-tertiary">Button, Icon only</span>
          </div>
          <div className="flex flex-col items-center gap-sm">
            <IconButton icon="general/more-horizontal" label="More actions" />
            <span className="type-body-xs-regular text-text-tertiary">Icon button</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Close actions',
      body: 'Always the x icon, in the top-right corner of the surface, aligned to the first line of the title. Size follows the surface: sm for tags and toasts, md for banners and drawers, lg for dialogs.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-xl">
          <div className="flex items-center gap-md rounded-surface border border-border-subtle bg-surface-raised py-xs pl-lg pr-xs shadow-raised">
            <span className="type-body-sm-medium text-text-primary">Link copied</span>
            <IconButton size="sm" label="Dismiss" />
          </div>
          <div className="flex items-center gap-md rounded-surface border border-border-subtle bg-surface-raised py-xs pl-lg pr-xs">
            <span className="type-body-sm-medium text-text-primary">New version available</span>
            <IconButton size="md" label="Dismiss banner" />
          </div>
          {dialogHeader}
        </div>
      ),
      do: { caption: 'The x close in the dialog corner.', render: () => <IconButton size="lg" label="Close dialog" /> },
      dont: { caption: 'A text “Close” link in the same corner.', render: () => <span className="type-body-sm-semibold text-text-brand underline">Close</span> },
    },
    {
      title: 'Dark surfaces through colour mode',
      body: 'Same component, same variant. The frame’s colour mode switches the tokens — there is no dark-background variant and no separately drawn dark close button.',
      render: () => (
        <div className="flex gap-xl">
          {(['light', 'dark'] as const).map((m) => (
            <div key={m} data-theme={m} className="flex items-center gap-md rounded-surface bg-surface-base p-lg">
              <IconButton label="Close" />
              <IconButton emphasis="secondary" icon="general/copy" label="Copy" />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'One size and emphasis per toolbar',
      body: 'Tool icons in one row share the same size and emphasis so the row reads as one group.',
      do: {
        caption: 'One row, one size, one emphasis.',
        render: () => (
          <div className="flex gap-xs">
            {CONTENT.slice(1, 5).map((c) => <IconButton key={c.icon} size="sm" emphasis="secondary" icon={c.icon} label={c.label} />)}
          </div>
        ),
      },
      dont: {
        caption: 'Mixed sizes and emphasis in one toolbar.',
        render: () => (
          <div className="flex items-center gap-xs">
            <IconButton size="xs" emphasis="secondary" icon="general/more-horizontal" label="More" />
            <IconButton size="lg" icon="general/copy" label="Copy" />
            <IconButton size="sm" emphasis="secondary" icon="general/edit" label="Edit" />
            <IconButton size="md" icon="general/trash" label="Delete" />
          </div>
        ),
      },
    },
    {
      title: 'Content',
      body: 'Use only icons whose meaning is widely understood (close, more, copy, edit, delete, settings). When in doubt, use a labelled Button. Never use an Icon button for the primary action of a view.',
      do: { caption: 'Primary action with words.', render: () => <Button leadingIcon="general/plus" label="New project" /> },
      dont: { caption: 'An Icon button as the primary action.', render: () => <IconButton emphasis="secondary" icon="general/plus" label="New project" /> },
    },
  ],
  accessibility: [
    'Every Icon button has an accessible name (`label` → aria-label) and shows a Tooltip (2.13) with that name on hover and focus.',
    'Visible focus ring (focus/default) on every emphasis, distinct from hover.',
    'Icon contrast meets the non-text threshold (3:1) against its surface.',
    'On touch platforms (coarse pointers) the hit area grows to size/touch-min; the visual square does not change.',
    'Loading sets aria-busy and blocks clicks.',
  ],
});
