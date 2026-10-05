import { Button, type ButtonEmphasis, type ButtonProps, type ButtonSize, type ButtonTone } from '../../components';
import type { IconName } from '../../icons';
import { defineDoc, jsxProps } from './types';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const STATES = ['rest', 'hover', 'pressed', 'focus', 'disabled', 'loading'] as const;
const EMPHASIS = ['primary', 'secondary', 'tertiary'] as const;
const TONES = ['brand', 'danger'] as const;
const PLAYGROUND_ICONS: readonly IconName[] = ['general/plus', 'general/check', 'general/download', 'arrows/arrow-right'];

type State = (typeof STATES)[number];

/** One Figma variant: State → previewState / disabled / loading. */
const variant = (p: { size?: ButtonSize; emphasis: ButtonEmphasis; tone: ButtonTone; state: State; iconOnly?: boolean }): ButtonProps => ({
  size: p.size ?? 'md',
  emphasis: p.emphasis,
  tone: p.tone,
  iconOnly: p.iconOnly,
  leadingIcon: p.iconOnly ? 'general/plus' : undefined,
  label: p.state === 'loading' ? 'Saving…' : p.iconOnly ? 'Add item' : 'Button',
  previewState: p.state === 'hover' || p.state === 'pressed' || p.state === 'focus' ? p.state : undefined,
  disabled: p.state === 'disabled',
  loading: p.state === 'loading',
});

const PLAYGROUND_DEFAULTS = { size: 'md', emphasis: 'primary', tone: 'brand', iconOnly: false, loading: false, disabled: false };

export default defineDoc<ButtonProps>({
  id: '2.1',
  name: 'Button',
  level: 'parts',
  spec: 'parts/2.1-button.md',
  exports: ['Button'],
  status: 'Beta',
  since: '0.1.0',
  summary:
    'Buttons start actions, like saving a form, creating a project or confirming a delete. Choose the emphasis by how important the action is on the screen, and the size by the space around it.',
  component: Button,
  hero: { size: 'lg', leadingIcon: 'general/check', label: 'Save changes' },

  examples: [
    {
      title: 'Dialog footer',
      caption: 'Use one primary action per view, and let the secondary action support it.',
      layout: 'end',
      items: [{ emphasis: 'secondary', label: 'Cancel' }, { label: 'Save changes' }],
      code: `<View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: dimensions.space.md }}>
  <Button emphasis="secondary" label="Cancel" onPress={close} />
  <Button label="Save changes" onPress={save} />
</View>`,
    },
    {
      title: 'Delete confirmation',
      caption: 'Give the danger tone only to the action that has the consequence.',
      items: [{ emphasis: 'secondary', label: 'Cancel' }, { tone: 'danger', label: 'Delete project' }],
      code: `<Button emphasis="secondary" label="Cancel" onPress={close} />
<Button tone="danger" label="Delete project" onPress={remove} />`,
    },
    {
      title: 'Page header actions',
      caption: 'Three levels of emphasis let the main action stand out from the rest.',
      items: [
        { emphasis: 'tertiary', leadingIcon: 'general/download', label: 'Export' },
        { emphasis: 'secondary', label: 'Share' },
        { leadingIcon: 'general/plus', label: 'New report' },
      ],
      code: `<Button emphasis="tertiary" leadingIcon="general/download" label="Export" />
<Button emphasis="secondary" label="Share" />
<Button leadingIcon="general/plus" label="New report" />`,
    },
    {
      title: 'Form submit in progress',
      caption: 'While it saves, the button keeps its place and width, so the layout doesn’t jump.',
      items: [{ emphasis: 'secondary', disabled: true, label: 'Cancel' }, { loading: true, label: 'Saving…' }],
      code: `<Button emphasis="secondary" disabled label="Cancel" />
<Button loading label="Saving…" />`,
    },
    {
      title: 'Full-width action',
      caption: 'On a phone, the main action at the bottom of a form can span the screen so it’s easy to reach.',
      layout: 'column',
      items: [{ fullWidth: true, size: 'lg', label: 'Continue' }],
      code: `<Button fullWidth size="lg" label="Continue" onPress={next} />`,
    },
  ],

  whenToUse: {
    use: ['For actions that change data or move a task forward: save, submit, create, delete.', 'For the main action in a dialog, form or screen.'],
    dont: [
      'For navigation to another screen, use a Link (2.3).',
      'For a compact tool action without a label, use an Icon button (2.2).',
      'For several related options that stay visible, use a Button group (3.1).',
    ],
  },

  platformNotes: [
    'Phones have no hover. On an iPad with a pointer, hovering shows the hover look.',
    'Small sizes keep their look, but the touch area grows to 44 pt on iOS and 48 dp on Android.',
    'The focus ring shows only when someone moves through the screen with a hardware keyboard.',
    'At the largest text sizes, the label can wrap to a second line instead of being cut off. Short labels rarely need to.',
  ],

  matrices: [
    ...TONES.flatMap((tone) =>
      EMPHASIS.map((emphasis) => ({
        title: `Tone=${tone} · Emphasis=${emphasis}`,
        rows: { name: 'Size', values: SIZES },
        columns: { name: 'State', values: STATES },
        cell: (size: string, state: string) => variant({ size: size as ButtonSize, emphasis, tone, state: state as State }),
      })),
    ),
    {
      title: 'Icon only=true',
      rows: { name: 'Emphasis', values: EMPHASIS },
      columns: { name: 'State', values: STATES },
      cell: (emphasis: string, state: string) => variant({ emphasis: emphasis as ButtonEmphasis, tone: 'brand', state: state as State, iconOnly: true }),
    },
  ],

  playground: {
    controls: [
      { name: 'label', figma: 'Label', control: { type: 'text' }, default: 'Button' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'emphasis', figma: 'Emphasis', control: { type: 'select', options: EMPHASIS }, default: 'primary' },
      { name: 'tone', figma: 'Tone', control: { type: 'select', options: TONES }, default: 'brand' },
      { name: 'leadingIcon', figma: 'Leading icon', control: { type: 'icon', options: PLAYGROUND_ICONS }, default: undefined },
      { name: 'trailingIcon', figma: 'Trailing icon', control: { type: 'icon', options: PLAYGROUND_ICONS }, default: undefined },
      { name: 'iconOnly', figma: 'Icon only', control: { type: 'boolean' }, default: false },
      { name: 'loading', figma: 'State=loading', control: { type: 'boolean' }, default: false },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    code: (args) => `<Button${jsxProps(args, PLAYGROUND_DEFAULTS)} onPress={save} />`,
  },

  anatomy: {
    specimen: {
      items: [
        { leadingIcon: 'general/plus', trailingIcon: 'arrows/arrow-right', label: 'Button' },
        { loading: true, label: 'Saving…' },
      ],
    },
    parts: [
      { name: 'Root', description: 'The pressable container. Its height and padding are set by the size.', tokens: ['size/control/md', 'button/padding-x/md', 'radius/control'] },
      { name: 'Leading icon', description: 'An optional icon before the label. While loading, a spinner takes its place.', tokens: ['size/icon/md'] },
      { name: 'Text padding', description: 'A thin wrapper around the label that evens out the space, so buttons with and without icons both look centered.', tokens: ['space/optical'] },
      { name: 'Label', description: 'The text that sets the button’s width. Larger sizes use a larger text style.', tokens: ['type/body/sm/semibold'] },
      { name: 'Trailing icon', description: 'An optional icon after the label. It hides while the button is loading.' },
      { name: 'Spinner', description: 'A Spinner (2.15) that replaces the leading icon while loading, in the same color as the label.', tokens: ['spinner/thickness/md', 'motion/duration/loop'] },
      { name: 'Touch area', description: 'An invisible margin that grows small buttons to the minimum touch target without changing how they look.', tokens: ['size/touch-min'] },
    ],
  },

  props: [
    { name: 'label', figma: 'Label', type: 'string', default: 'required', description: 'The visible label. When iconOnly is set, it becomes the button’s accessibilityLabel.' },
    { name: 'size', figma: 'Size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Sets the height, padding, gap and label style.' },
    { name: 'emphasis', figma: 'Emphasis', type: "'primary' | 'secondary' | 'tertiary'", default: "'primary'", description: 'Primary is a solid fill, secondary a bordered surface, and tertiary has no container.' },
    { name: 'tone', figma: 'Tone', type: "'brand' | 'danger'", default: "'brand'", description: 'Use danger for destructive actions.' },
    { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', type: 'IconName', description: 'The icon before the label, or the only icon when iconOnly is set.' },
    { name: 'leadingVisual', type: 'ReactNode', description: 'Any element in the leading icon slot, such as a brand mark or an avatar. Takes priority over leadingIcon.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName', description: 'The icon after the label.' },
    { name: 'iconOnly', figma: 'Icon only', type: 'boolean', default: 'false', description: 'Makes a square button with one icon. The label becomes its accessibilityLabel.' },
    { name: 'loading', figma: 'State=loading', type: 'boolean', default: 'false', description: 'Shows a spinner in the leading slot, ignores presses and sets accessibilityState.busy.' },
    { name: 'showLoadingText', figma: 'Show loading text', type: 'boolean', default: 'true', description: 'Keeps the label next to the spinner while loading.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Blocks presses and sets accessibilityState.disabled.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretches the button to fill its container. The content stays centered.' },
    { name: 'onPress', type: '(event: GestureResponderEvent) => void', description: 'Called on press. Not called while disabled or loading.' },
    { name: 'onLongPress', type: '(event: GestureResponderEvent) => void', description: 'Called on long-press, for example to show a Tooltip (2.13) on an icon-only button.' },
    { name: 'accessibilityHint', type: 'string', description: 'Extra context screen readers announce after the name, such as what happens next.' },
    { name: 'style', type: 'StyleProp<ViewStyle>', description: 'Layout only (margins, flex). Never colors or sizes.' },
    { name: 'previewState', type: "'hover' | 'pressed' | 'focus'", description: 'For documentation only. Pins a hover, pressed or focus look.', internal: true },
  ],

  tokens: [
    'color/fill/brand/solid', 'color/fill/brand/solid/hover', 'color/fill/brand/solid/pressed', 'color/text/on-solid', 'color/icon/on-solid',
    'color/surface/base', 'color/surface/base/hover', 'color/surface/base/pressed', 'color/border/default', 'color/text/secondary', 'color/text/primary',
    'color/fill/neutral/subtle/hover', 'color/fill/neutral/subtle/pressed', 'color/fill/none',
    'color/fill/danger/solid', 'color/fill/danger/solid/hover', 'color/fill/danger/solid/pressed', 'color/fill/danger/subtle/hover', 'color/fill/danger/subtle/pressed',
    'color/border/danger/subtle', 'color/text/danger', 'color/text/danger/hover',
    'color/fill/neutral/subtle/disabled', 'color/border/disabled', 'color/text/disabled',
    'color/border/focus', 'color/border/danger', 'border/width/default', 'border/width/focus',
    'radius/control', 'size/control/md', 'button/padding-x/md', 'button/gap/md', 'space/optical', 'size/icon/md', 'size/touch-min',
    'type/body/sm/semibold', 'elevation/control', 'focus/default', 'focus/danger',
    'motion/duration/fast', 'motion/easing/standard', 'motion/duration/loop', 'spinner/thickness/md',
  ],

  guidelines: [
    {
      title: 'Make buttons look pressable',
      body: 'People spot a button by its container, border, contrast and the way it reacts when they press it. Take those cues away and the same label reads as plain text.',
      do: { caption: 'A real button, with a visible container and states.', specimen: { items: [{ label: 'Upload files', leadingIcon: 'general/upload' }] } },
      dont: { caption: 'Text styled like a label doesn’t look pressable.', text: 'Upload files' },
    },
    {
      title: 'Use one primary action',
      body: 'Primary, secondary and tertiary emphasis set a clear order of importance. Keep one primary action per screen or dialog, so the next step is obvious.',
      do: {
        caption: 'One primary action, backed by secondary and tertiary.',
        specimen: { items: [{ emphasis: 'tertiary', label: 'Skip' }, { emphasis: 'secondary', label: 'Back' }, { label: 'Continue' }] },
      },
      dont: {
        caption: 'Three primary buttons fight for attention.',
        specimen: { items: [{ label: 'Skip' }, { label: 'Back' }, { label: 'Continue' }] },
      },
    },
    {
      title: 'Save the danger tone for real consequences',
      body: 'Not every negative action is dangerous. Use the danger tone only on the button that does the damage, like delete, remove or revoke. Cancel is the safe way out, so it stays neutral.',
      do: { caption: 'Danger on “Delete project”, the action with the consequence.', specimen: { items: [{ tone: 'danger', label: 'Delete project' }] } },
      dont: { caption: 'Danger on “Cancel”, which is the safe choice.', specimen: { items: [{ tone: 'danger', emphasis: 'secondary', label: 'Cancel' }] } },
    },
    {
      title: 'Balance buttons optically',
      body: 'Icons carry a little empty space inside their box, which can make a button look off-center. The label gets a small extra padding on each side and the outer padding shrinks by the same amount, so buttons with and without icons look evenly centered.',
      specimen: {
        items: [
          { emphasis: 'secondary', label: 'Label only' },
          { emphasis: 'secondary', leadingIcon: 'general/plus', label: 'Leading icon' },
          { emphasis: 'secondary', trailingIcon: 'arrows/arrow-right', label: 'Trailing icon' },
        ],
      },
    },
    {
      title: 'Content',
      body: 'Write labels as a verb, or a verb and a noun: “Save changes”, “Delete project”. Use sentence case and aim for three words or fewer.\n\nWhile loading, say what’s happening (“Saving…”). Icon-only buttons need a name for screen readers and a Tooltip (2.13) on long-press.',
    },
  ],

  accessibility: [
    'VoiceOver and TalkBack announce the label as the button’s name, and icon-only buttons use it too.',
    'Each button reports its role and state: disabled, or busy while it loads.',
    'While loading, the button ignores presses and keeps announcing the progress label, such as “Saving…”.',
    'Label text meets contrast requirements against the fill in every state. Disabled buttons are exempt, but stay legible.',
    'Small buttons keep a touch area of at least 44 pt on iOS and 48 dp on Android.',
    'With a hardware keyboard, focus shows a visible ring (focus/default, or focus/danger on danger buttons) that looks different from pressed.',
  ],
});
