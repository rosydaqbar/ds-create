import { Button } from '@/components/parts/Button';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const STATES = ['rest', 'hover', 'pressed', 'focus', 'disabled', 'loading'] as const;
const EMPHASIS = ['primary', 'secondary', 'tertiary'] as const;

/** Render one Figma variant: State → forceState / disabled / loading. */
const variant = (p: { size?: (typeof SIZES)[number]; emphasis: (typeof EMPHASIS)[number]; tone: 'brand' | 'danger'; state: (typeof STATES)[number]; iconOnly?: boolean }) => (
  <Button
    size={p.size ?? 'md'}
    emphasis={p.emphasis}
    tone={p.tone}
    iconOnly={p.iconOnly}
    leadingIcon={p.iconOnly ? 'general/plus' : undefined}
    label={p.state === 'loading' ? 'Saving…' : 'Button'}
    forceState={p.state === 'hover' || p.state === 'pressed' || p.state === 'focus' ? p.state : undefined}
    disabled={p.state === 'disabled'}
    loading={p.state === 'loading'}
  />
);

export default defineDoc({
  id: '2.1',
  name: 'Button',
  level: 'parts',
  spec: 'parts/2.1-button.md',
  exports: ['Button'],
  summary:
    'Actions users can take. Five sizes, three emphasis levels, brand and danger tones, six states, with optional leading and trailing icons and an icon-only square form. Label width hugs its content; height is fixed per size.',
  hero: () => <Button size="lg" leadingIcon="general/check" label="Save changes" />,
  playground: {
    controls: [
      { name: 'label', figma: 'Label', control: { type: 'text' }, default: 'Button' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'emphasis', figma: 'Emphasis', control: { type: 'select', options: EMPHASIS }, default: 'primary' },
      { name: 'tone', figma: 'Tone', control: { type: 'select', options: ['brand', 'danger'] }, default: 'brand' },
      { name: 'leadingIcon', figma: 'Leading icon', control: { type: 'icon' }, default: undefined },
      { name: 'trailingIcon', figma: 'Trailing icon', control: { type: 'icon' }, default: undefined },
      { name: 'iconOnly', figma: 'Icon only', control: { type: 'boolean' }, default: false },
      { name: 'loading', figma: 'State=loading', control: { type: 'boolean' }, default: false },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <Button {...a} />,
    code: (a) => `<Button${jsxProps(a, { size: 'md', emphasis: 'primary', tone: 'brand', iconOnly: false, loading: false, disabled: false })} />`,
  },
  examples: [
    {
      title: 'Dialog footer',
      caption: 'One primary action per view; the secondary action supports it.',
      render: () => (
        <div className="flex w-full max-w-[28rem] justify-end gap-md">
          <Button emphasis="secondary" label="Cancel" />
          <Button label="Save changes" />
        </div>
      ),
      code: `<div className="flex justify-end gap-md">
  <Button emphasis="secondary" label="Cancel" />
  <Button label="Save changes" />
</div>`,
    },
    {
      title: 'Delete confirmation',
      caption: 'Danger tone only on the action that causes the consequence.',
      render: () => (
        <div className="flex gap-md">
          <Button emphasis="secondary" label="Cancel" />
          <Button tone="danger" label="Delete project" />
        </div>
      ),
      code: `<Button emphasis="secondary" label="Cancel" />
<Button tone="danger" label="Delete project" />`,
    },
    {
      title: 'Page header actions',
      caption: 'Three levels of emphasis in one row.',
      render: () => (
        <div className="flex gap-md">
          <Button emphasis="tertiary" leadingIcon="general/download" label="Export" />
          <Button emphasis="secondary" label="Share" />
          <Button leadingIcon="general/plus" label="New report" />
        </div>
      ),
      code: `<Button emphasis="tertiary" leadingIcon="general/download" label="Export" />
<Button emphasis="secondary" label="Share" />
<Button leadingIcon="general/plus" label="New report" />`,
    },
    {
      title: 'Form submit in progress',
      caption: 'Loading keeps the button’s place and width.',
      render: () => (
        <div className="flex gap-md">
          <Button emphasis="secondary" disabled label="Cancel" />
          <Button loading label="Saving…" />
        </div>
      ),
      code: `<Button emphasis="secondary" disabled label="Cancel" />
<Button loading label="Saving…" />`,
    },
  ],
  whenToUse: {
    use: ['Actions that change data or move a task forward: save, submit, create, delete.', 'The main action of a dialog, form or page header.'],
    dont: ['Navigation to another page — use a Link (2.3).', 'Compact tool actions without a label — use an Icon button (2.2).', 'Several related options that stay visible — use a Button group (3.1).'],
  },
  matrices: (['brand', 'danger'] as const).flatMap((tone) =>
    EMPHASIS.map((emphasis) => ({
      title: `Tone=${tone} · Emphasis=${emphasis}`,
      rows: 'Size',
      columns: 'State',
      render: () => <Matrix rowProp="Size" rows={SIZES} colProp="State" cols={STATES} cell={(size, state) => variant({ size, emphasis, tone, state })} />,
    })),
  ).concat([
    {
      title: 'Icon only=true',
      rows: 'Emphasis',
      columns: 'State',
      render: () => <Matrix rowProp="Emphasis" rows={EMPHASIS} colProp="State" cols={STATES} cell={(emphasis, state) => variant({ emphasis, tone: 'brand', state, iconOnly: true })} />,
    },
  ]),
  anatomy: {
    render: () => (
      <div className="flex scale-150 gap-xl">
        <Button leadingIcon="general/plus" trailingIcon="arrows/arrow-right" label="Button" />
        <Button loading label="Saving…" />
      </div>
    ),
    parts: [
      { name: 'Root', description: 'Horizontal, centred. Height size/control/{size}; padding-x button/padding-x/{size}; gap button/gap/{size}.', tokens: ['size/control/md', 'button/padding-x/md', 'radius/control'] },
      { name: 'Leading icon', description: 'Optional icon in a size/icon/md box; replaced by the Spinner while loading.', tokens: ['size/icon/md'] },
      { name: 'Text padding', description: 'Wraps the label with space/optical on both sides so icon and label-only buttons look centred.', tokens: ['space/optical'] },
      { name: 'Label', description: 'Single line, hugs its text. type/body/sm/semibold (xs–md) or type/body/md/semibold (lg–xl).', tokens: ['type/body/sm/semibold'] },
      { name: 'Trailing icon', description: 'Optional icon after the label; hidden while loading.' },
      { name: 'Spinner', description: '2.15 Spinner in the leading slot when loading, coloured like the label.' },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', default: '—', description: 'Visible label; the accessible name when iconOnly.' },
    { name: 'size', figma: 'Size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Height, padding, gap and label style.' },
    { name: 'emphasis', figma: 'Emphasis', type: "'primary' | 'secondary' | 'tertiary'", default: "'primary'", description: 'Solid fill, bordered surface, or no container.' },
    { name: 'tone', figma: 'Tone', type: "'brand' | 'danger'", default: "'brand'", description: 'Danger for destructive actions.' },
    { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', type: 'IconName', description: 'Icon before the label; the only icon when iconOnly.' },
    { name: 'leadingVisual', type: 'ReactNode', description: 'Any node in the leading icon box (a brand mark, an avatar); wins over leadingIcon.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName', description: 'Icon after the label.' },
    { name: 'iconOnly', figma: 'Icon only', type: 'boolean', default: 'false', description: 'Square button with one icon; label becomes aria-label.' },
    { name: 'loading', figma: 'State=loading', type: 'boolean', default: 'false', description: 'Spinner in the leading slot; not clickable; aria-busy.' },
    { name: 'showLoadingText', figma: 'Show loading text', type: 'boolean', default: 'true', description: 'Keep the label next to the Spinner while loading.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Native disabled button.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to the container; content stays centred.' },
    { name: 'forceState', type: "'hover' | 'pressed' | 'focus'", description: 'Documentation only: pins a pseudo-state.' },
  ],
  tokens: [
    'color/fill/brand/solid', 'color/fill/brand/solid/hover', 'color/fill/brand/solid/pressed', 'color/text/on-solid',
    'color/surface/base', 'color/surface/base/hover', 'color/surface/base/pressed', 'color/border/default', 'color/text/secondary', 'color/text/primary',
    'color/fill/neutral/subtle/hover', 'color/fill/neutral/subtle/pressed',
    'color/fill/danger/solid', 'color/fill/danger/solid/hover', 'color/fill/danger/subtle/hover', 'color/border/danger/subtle', 'color/text/danger',
    'color/fill/neutral/subtle/disabled', 'color/border/disabled', 'color/text/disabled',
    'radius/control', 'size/control/md', 'button/padding-x/md', 'button/gap/md', 'space/optical', 'size/icon/md',
    'type/body/sm/semibold', 'elevation/control', 'focus/default', 'focus/danger',
  ],
  guidelines: [
    {
      title: 'Buttons should look actionable',
      body: 'A container, border, contrast and visible states tell people something can be clicked. Strip those cues and the same label reads as static text.',
      do: { caption: 'A real Button: visible container and states.', render: () => <Button label="Upload files" leadingIcon="general/upload" /> },
      dont: { caption: 'Text styled like a label gives no affordance.', render: () => <span className="type-body-sm-semibold text-text-secondary">Upload files</span> },
    },
    {
      title: 'Emphasis',
      body: 'Primary, secondary and tertiary create a clear priority. Use one primary action per view or dialog so the next step is obvious.',
      do: {
        caption: 'One primary, supported by secondary and tertiary.',
        render: () => (
          <div className="flex gap-md">
            <Button emphasis="tertiary" label="Skip" />
            <Button emphasis="secondary" label="Back" />
            <Button label="Continue" />
          </div>
        ),
      },
      dont: {
        caption: 'Three primary buttons compete for attention.',
        render: () => (
          <div className="flex gap-md">
            <Button label="Skip" />
            <Button label="Back" />
            <Button label="Continue" />
          </div>
        ),
      },
    },
    {
      title: 'Danger tone',
      body: 'Not every negative action is dangerous. Use Tone=danger only for the action that causes the consequence — delete, remove, revoke — never for Cancel.',
      do: { caption: 'Danger on “Delete project”.', render: () => <Button tone="danger" label="Delete project" /> },
      dont: { caption: 'Danger on “Cancel”.', render: () => <Button tone="danger" emphasis="secondary" label="Cancel" /> },
    },
    {
      title: 'Optically balancing buttons',
      body: 'Icons carry empty space inside their box. The label sits in a Text padding wrapper with space/optical on each side, and the outer padding is reduced by the same amount, so label-only and icon + label buttons look centred.',
      render: () => (
        <div className="flex flex-wrap gap-md">
          <Button emphasis="secondary" label="Label only" />
          <Button emphasis="secondary" leadingIcon="general/plus" label="Leading icon" />
          <Button emphasis="secondary" trailingIcon="arrows/arrow-right" label="Trailing icon" />
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Labels are verbs or verb + noun (“Save changes”, “Delete project”), in sentence case, ideally three words or fewer. Loading labels say what is happening (“Saving…”). Icon-only buttons need an accessible name and a Tooltip.',
    },
  ],
  accessibility: [
    'Every state meets text contrast against its fill; disabled is exempt but stays legible.',
    'Focus is always visible (focus/default, focus/danger) and differs from hover.',
    'Loading sets aria-busy and blocks clicks; the label announces the progress phrase.',
    'Icon-only buttons take their accessible name from `label`.',
  ],
});
