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
    'Icon buttons are small, label-free actions for toolbars, table rows and closing things. Use them when the icon is instantly recognizable and space is tight.',
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
      caption: 'Put the close button in the corner, lined up with the first line of the title.',
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
      caption: 'Row actions stay quiet until someone hovers the row.',
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
      caption: 'On a busy surface, secondary emphasis gives each tool a visible edge.',
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
      caption: 'On a dark surface, the same component follows the color mode. There’s no separate dark variant.',
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
    use: ['When the icon is universally understood and space is tight: close, more, copy, edit, delete, settings.', 'For quiet tool actions in toolbars and table rows, and for closing dialogs, drawers, banners and toasts.'],
    dont: ['If the action needs words or is the main action, use a labeled Button (2.1).', 'For an icon action in a row of labeled buttons, use an icon-only Button (2.1).', 'For a primary or destructive icon action, use an icon-only Button (2.1) with the right emphasis or tone.'],
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
      title: 'Color modes',
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
      { name: 'Root', target: 'root', description: 'A fixed square with the icon centered, so the space is equal on every side. The size sets how big the square is.', tokens: ['icon-button/size/md', 'radius/control', 'border/width/default'] },
      { name: 'Icon', target: 'icon', description: 'The icon, which grows with the button. While loading, a Spinner (2.15) takes its place.', tokens: ['size/icon/md'] },
    ],
  },
  props: [
    { name: 'label', type: 'string', description: 'The accessible name, required because the button has no visible text. Show the same text in a Tooltip.' },
    { name: 'icon', figma: 'Icon', type: 'IconName', default: "'general/x'", description: 'The icon to show. Use the x icon for close.' },
    { name: 'size', figma: 'Size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the side (28 · 32 · 36 · 44) and the icon size.' },
    { name: 'emphasis', figma: 'Emphasis', type: "'secondary' | 'tertiary'", default: "'tertiary'", description: 'Secondary is a bordered surface. Tertiary has no container at rest.' },
    { name: 'loading', figma: 'State=loading', type: 'boolean', default: 'false', description: 'Replaces the icon with a spinner, blocks clicks and sets aria-busy.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Renders a native disabled button.' },
    { name: 'forceState', type: "'hover' | 'pressed' | 'focus'", description: 'For documentation only. Pins a hover, pressed or focus state.' },
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
      title: 'Icon button, icon-only button or labeled button',
      body: 'Use a labeled button when the action needs words or is the main action. Use an icon-only button when an icon action sits in a row of labeled buttons and should match their height and emphasis. Use an icon button for a quiet tool or close action inside content.',
      render: () => (
        <div className="flex flex-wrap items-center gap-3xl">
          <div className="flex flex-col items-center gap-sm">
            <Button label="Save changes" />
            <span className="type-body-xs-regular text-text-tertiary">Labeled button</span>
          </div>
          <div className="flex flex-col items-center gap-sm">
            <div className="flex gap-sm">
              <Button emphasis="secondary" label="Export" />
              <Button emphasis="secondary" iconOnly leadingIcon="general/settings" label="Settings" />
            </div>
            <span className="type-body-xs-regular text-text-tertiary">Icon-only button</span>
          </div>
          <div className="flex flex-col items-center gap-sm">
            <IconButton icon="general/more-horizontal" label="More actions" />
            <span className="type-body-xs-regular text-text-tertiary">Icon button</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Place close buttons consistently',
      body: 'Use the x icon in the top-right corner, lined up with the first line of the title. Match the size to the surface: sm for tags and toasts, md for banners and drawers, lg for dialogs.',
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
      do: { caption: 'An x close button in the dialog corner.', render: () => <IconButton size="lg" label="Close dialog" /> },
      dont: { caption: 'A text “Close” link in the same corner.', render: () => <span className="type-body-sm-semibold text-text-brand underline">Close</span> },
    },
    {
      title: 'Let color mode handle dark surfaces',
      body: 'Use the same component and variant on light and dark surfaces. The frame’s color mode switches the tokens, so you don’t need a dark-background variant or a separately drawn close button.',
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
      body: 'Give every icon in a toolbar the same size and emphasis, so the row reads as one group.',
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
      body: 'Stick to icons people understand at a glance: close, more, copy, edit, delete, settings. If you’re unsure, use a labeled button. The primary action of a view always needs words, so it shouldn’t be an icon button.',
      do: { caption: 'A primary action with words.', render: () => <Button leadingIcon="general/plus" label="New project" /> },
      dont: { caption: 'An icon button as the primary action.', render: () => <IconButton emphasis="secondary" icon="general/plus" label="New project" /> },
    },
  ],
  accessibility: [
    'Every icon button has a name screen readers announce (label, set as aria-label) and shows it in a Tooltip (2.13) on hover and focus.',
    'Keyboard focus shows a visible ring (focus/default) on every emphasis, different from hover.',
    'Icons meet the 3:1 non-text contrast threshold against their surface.',
    'On touch screens, the tap area grows to size/touch-min while the visible square stays the same.',
    'While loading, the button sets aria-busy and ignores clicks.',
  ],
});
