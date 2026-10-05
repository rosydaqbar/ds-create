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
    'Buttons start actions, like saving a form, creating a project or confirming a delete. Choose the emphasis by how important the action is on the screen, and the size by the space around it.',
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
      caption: 'Use one primary action per view, and let the secondary action support it.',
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
      caption: 'Give the danger tone only to the action that has the consequence.',
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
      caption: 'Three levels of emphasis let the main action stand out from the rest.',
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
      caption: 'While it saves, the button keeps its place and width, so the layout doesn’t jump.',
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
    use: ['For actions that change data or move a task forward: save, submit, create, delete.', 'For the main action in a dialog, form or page header.'],
    dont: ['For navigation to another page, use a Link (2.3).', 'For a compact tool action without a label, use an Icon button (2.2).', 'For several related options that stay visible, use a Button group (3.1).'],
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
      { name: 'Root', target: 'root', description: 'The clickable container. Its height and padding are set by the size.', tokens: ['size/control/md', 'button/padding-x/md', 'radius/control'] },
      { name: 'Leading icon', target: 'leading-icon', description: 'An optional icon before the label. While loading, a spinner takes its place.', tokens: ['size/icon/md'] },
      { name: 'Text padding', target: 'text-padding', description: 'A thin wrapper around the label that evens out the space, so buttons with and without icons both look centered.', tokens: ['space/optical'] },
      { name: 'Label', target: 'label', description: 'One line of text that sets the button’s width. Larger sizes use a larger text style.', tokens: ['type/body/sm/semibold'] },
      { name: 'Trailing icon', target: 'trailing-icon', description: 'An optional icon after the label. It hides while the button is loading.' },
      { name: 'Spinner', target: 'spinner', description: 'A Spinner (2.15) that replaces the leading icon while loading, in the same color as the label.' },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', default: '—', description: 'The visible label. When iconOnly is set, it becomes the button’s accessible name.' },
    { name: 'size', figma: 'Size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Sets the height, padding, gap and label style.' },
    { name: 'emphasis', figma: 'Emphasis', type: "'primary' | 'secondary' | 'tertiary'", default: "'primary'", description: 'Primary is a solid fill, secondary a bordered surface, and tertiary has no container.' },
    { name: 'tone', figma: 'Tone', type: "'brand' | 'danger'", default: "'brand'", description: 'Use danger for destructive actions.' },
    { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', type: 'IconName', description: 'The icon before the label, or the only icon when iconOnly is set.' },
    { name: 'leadingVisual', type: 'ReactNode', description: 'Any element in the leading icon slot, such as a brand mark or an avatar. Takes priority over leadingIcon.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName', description: 'The icon after the label.' },
    { name: 'iconOnly', figma: 'Icon only', type: 'boolean', default: 'false', description: 'Makes a square button with one icon. The label becomes its aria-label.' },
    { name: 'loading', figma: 'State=loading', type: 'boolean', default: 'false', description: 'Shows a spinner in the leading slot, blocks clicks and sets aria-busy.' },
    { name: 'showLoadingText', figma: 'Show loading text', type: 'boolean', default: 'true', description: 'Keeps the label next to the spinner while loading.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Renders a native disabled button.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretches the button to fill its container. The content stays centered.' },
    { name: 'forceState', type: "'hover' | 'pressed' | 'focus'", description: 'For documentation only. Pins a hover, pressed or focus state.' },
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
      title: 'Make buttons look clickable',
      body: 'People spot a button by its container, border, contrast and the way it reacts when they hover or press. Take those cues away and the same label reads as plain text.',
      do: { caption: 'A real button, with a visible container and states.', render: () => <Button label="Upload files" leadingIcon="general/upload" /> },
      dont: { caption: 'Text styled like a label doesn’t look clickable.', render: () => <span className="type-body-sm-semibold text-text-secondary">Upload files</span> },
    },
    {
      title: 'Use one primary action',
      body: 'Primary, secondary and tertiary emphasis set a clear order of importance. Keep one primary action per view or dialog, so the next step is obvious.',
      do: {
        caption: 'One primary action, backed by secondary and tertiary.',
        render: () => (
          <div className="flex gap-md">
            <Button emphasis="tertiary" label="Skip" />
            <Button emphasis="secondary" label="Back" />
            <Button label="Continue" />
          </div>
        ),
      },
      dont: {
        caption: 'Three primary buttons fight for attention.',
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
      title: 'Save the danger tone for real consequences',
      body: 'Not every negative action is dangerous. Use the danger tone only on the button that does the damage, like delete, remove or revoke. Cancel is the safe way out, so it stays neutral.',
      do: { caption: 'Danger on “Delete project”, the action with the consequence.', render: () => <Button tone="danger" label="Delete project" /> },
      dont: { caption: 'Danger on “Cancel”, which is the safe choice.', render: () => <Button tone="danger" emphasis="secondary" label="Cancel" /> },
    },
    {
      title: 'Balance buttons optically',
      body: 'Icons carry a little empty space inside their box, which can make a button look off-center. To fix it, the label gets a small extra padding on each side and the outer padding shrinks by the same amount. Buttons with and without icons then look evenly centered.',
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
      body: 'Write labels as a verb, or a verb and a noun: “Save changes”, “Delete project”. Use sentence case and aim for three words or fewer.\n\nWhile loading, say what’s happening (“Saving…”). Icon-only buttons need a name for screen readers and a Tooltip (2.13).',
    },
  ],
  accessibility: [
    'Label text meets contrast requirements against the fill in every state. Disabled buttons are exempt, but stay legible.',
    'Keyboard focus always shows a visible ring (focus/default, or focus/danger on danger buttons) that looks different from hover.',
    'While loading, the button sets aria-busy and ignores clicks. Screen readers announce the progress label, such as “Saving…”.',
    'Icon-only buttons use label as the name screen readers announce.',
  ],
});
