import { Spinner } from '@/components/parts/Spinner';
import { Button } from '@/components/parts/Button';
import { IconButton } from '@/components/parts/IconButton';
import { Progress } from '@/components/parts/Progress';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { DemoCard } from './_demo';

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;
const TONES = ['neutral', 'brand'] as const;
const iconFor = { sm: 'sm', md: 'md', lg: 'xl', xl: 'xl' } as const;

const Loading = ({ text, size = 'lg' as const }: { text: string; size?: 'lg' | 'xl' }) => (
  <div className="flex flex-col items-center gap-md">
    <Spinner size={size} label={text} />
    <span className="type-body-sm-medium text-text-tertiary">{text}</span>
  </div>
);

export default defineDoc({
  id: '2.15',
  name: 'Spinner',
  level: 'parts',
  spec: 'specs/parts/2.15-spinner.md',
  exports: ['Spinner'],
  summary: 'Spinners tell people something is loading when you can’t say how long it will take. They’re sized like icons, and buttons use them for their loading state.',
  hero: () => <Spinner size="xl" tone="brand" label="Loading" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'lg' },
      { name: 'tone', figma: 'Tone', control: { type: 'select', options: TONES }, default: 'neutral' },
      { name: 'label', figma: '— (accessible status text)', control: { type: 'text' }, default: 'Loading invoices' },
    ],
    render: (a) => <Spinner {...a} />,
    code: (a) => `<Spinner${jsxProps(a, { size: 'md', tone: 'neutral' })} />`,
  },
  examples: [
    {
      title: 'Dialog footer, saving',
      caption: "Inside a button, the spinner takes the label color, so the button keeps its size and stays readable.",
      render: () => (
        <div className="flex gap-md">
          <Button emphasis="secondary" disabled label="Cancel" />
          <Button loading label="Saving…" />
        </div>
      ),
      code: `<Button emphasis="secondary" disabled label="Cancel" />
<Button loading label="Saving…" />`,
    },
    {
      title: 'Toolbar refresh',
      caption: 'In an icon button, the spinner replaces the icon in the same spot, so nothing around it moves.',
      render: () => (
        <div className="flex gap-xs">
          <IconButton icon="general/filter" label="Filter" />
          <IconButton icon="general/sliders" label="View options" />
          <IconButton icon="general/refresh" label="Refresh" loading />
          <IconButton icon="general/download" label="Download" />
        </div>
      ),
      code: `<IconButton icon="general/filter" label="Filter" />
<IconButton icon="general/sliders" label="View options" />
<IconButton icon="general/refresh" label="Refresh" loading />
<IconButton icon="general/download" label="Download" />`,
    },
    {
      title: 'Card loading',
      caption: 'On its own, the spinner sits where the content will appear, with a short line saying what’s loading.',
      render: () => (
        <DemoCard className="w-full max-w-[22rem]">
          <span className="type-heading-xs-semibold text-text-primary">Invoices</span>
          <div className="flex min-h-40 items-center justify-center">
            <Loading text="Loading invoices…" />
          </div>
        </DemoCard>
      ),
      code: `<div className="flex flex-col items-center gap-md">
  <Spinner size="lg" label="Loading invoices" />
  <span className="type-body-sm-medium text-text-tertiary">Loading invoices…</span>
</div>`,
    },
    {
      title: 'Inline status',
      caption: 'At small sizes, it sits inline with text, just like an icon.',
      render: () => (
        <span className="type-body-sm-medium flex items-center gap-sm text-text-secondary">
          <Spinner size="sm" /> Syncing 3 files
        </span>
      ),
      code: `<span className="flex items-center gap-sm">
  <Spinner size="sm" /> Syncing 3 files
</span>`,
    },
  ],
  whenToUse: {
    use: ['Show loading that takes long enough to notice when you don’t know how long it will take.', 'Fill a region, card or table body while it waits for content.'],
    dont: ['For work with a known size, use Progress (2.14).', 'For a button’s action, use the button’s loading state instead of a spinner beside it.', 'For waits under about one second, show nothing.'],
  },
  matrices: [
    {
      title: 'Spinner',
      rows: 'Tone',
      columns: 'Size',
      render: () => <Matrix rowProp="Tone" rows={TONES} colProp="Size" cols={SIZES} cell={(tone, size) => <Spinner size={size} tone={tone} />} />,
    },
    {
      title: 'Used by 2.1 Button, 2.2 Icon button',
      render: () => (
        <div className="flex flex-wrap items-center gap-xl rounded-surface border border-dashed border-border-brand-subtle p-xl">
          <Button loading label="Saving…" />
          <Button emphasis="secondary" loading label="Saving…" />
          <Button emphasis="tertiary" tone="danger" loading label="Deleting…" />
          <IconButton emphasis="secondary" icon="general/refresh" label="Refresh" loading />
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-3xl">
        <Spinner size="xl" tone="brand" className="my-3xl scale-200" />
        <div className="mt-xl flex items-end gap-2xl">
          {SIZES.map((s) => (
            <div key={s} className="flex flex-col items-center gap-sm">
              <div className="flex items-center gap-xs">
                {/* The md spinner beside its icon carries the Box marker: the box is what matches the icon. */}
                <Spinner size={s} data-anatomy={s === 'md' ? 'box' : undefined} />
                <Icon name="general/placeholder" size={iconFor[s]} className="text-icon-tertiary" style={s === 'xl' ? { width: 'var(--spinner-size-xl)', height: 'var(--spinner-size-xl)' } : undefined} />
              </div>
              <AxisLabel prop="Size" value={s} />
            </div>
          ))}
        </div>
      </div>
    ),
    parts: [
      { name: 'Background ring', target: 'background-ring', description: 'A full, faint circle the size of the box. Its stroke is drawn inside, so the spinner never grows past its icon box.', tokens: ['color/fill/neutral/track', 'spinner/thickness/md'] },
      { name: 'Active segment', description: 'A 90° arc on the same circle that starts at 12 o’clock and turns clockwise at a steady speed. It’s gray for neutral and brand-colored for brand.', tokens: ['color/icon/secondary', 'color/icon/brand', 'motion/duration/loop', 'motion/easing/linear'] },
      { name: 'Box', target: 'box', description: 'The square the spinner fits in. It matches the icon sizes, with a 48px xl for whole regions.', tokens: ['size/icon/sm', 'size/icon/md', 'size/icon/xl', 'spinner/size/xl'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Use sm or md in controls and inline with text, and lg or xl on their own.' },
    { name: 'tone', figma: 'Tone', type: "'neutral' | 'brand' | 'current'", default: "'neutral'", description: 'current follows the text color. Button and Icon button use it.' },
    { name: 'label', type: 'string', description: 'For standalone use: adds role="status" with this accessible name. Leave it out inside a button that already announces it’s busy.' },
  ],
  tokens: [
    'color/fill/neutral/track', 'color/icon/secondary', 'color/icon/brand', 'size/icon/sm', 'size/icon/md', 'size/icon/xl', 'spinner/size/xl',
    'spinner/thickness/sm', 'spinner/thickness/md', 'spinner/thickness/lg', 'spinner/thickness/xl', 'motion/duration/loop', 'motion/easing/linear',
  ],
  guidelines: [
    {
      title: 'Choose a spinner or a progress bar',
      body: 'Ask yourself whether you know how much is left. If you don’t, use a spinner. If you do, use Progress (2.14), and if you find out part-way, switch to it.',
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-4xl">
          <Loading text="Loading invoices…" />
          <div className="flex w-[16rem] flex-col gap-sm">
            <span className="type-body-sm-medium text-text-secondary">Uploading 3 files</span>
            <Progress aria-label="Uploading 3 files" value={40} placement="right" />
          </div>
        </div>
      ),
    },
    {
      title: 'Loading inside a button',
      body: 'When an action starts work, put the button into its loading state. The spinner appears inside in the label color, the button keeps its size, and people can’t press it twice. Avoid a separate spinner beside the button, and don’t disable the button without saying why.',
      do: { caption: 'The button in its loading state, with “Saving…”.', render: () => <Button loading label="Saving…" /> },
      dont: {
        caption: 'A disabled button with a spinner floating beside it.',
        render: () => (
          <div className="flex items-center gap-md">
            <Button disabled label="Save changes" />
            <Spinner size="md" />
          </div>
        ),
      },
    },
    {
      title: 'Size it to the content it replaces',
      body: 'Put the spinner where the content will appear. Use sm or md inline and in controls, lg in cards and panels, and xl for a whole region. Show one spinner per region rather than one in every row of a loading list.',
      do: { caption: 'One lg spinner in the card body.', render: () => <DemoCard className="w-[14rem] items-center"><Loading text="Loading…" /></DemoCard> },
      dont: {
        caption: 'A spinner in every row.',
        render: () => (
          <DemoCard className="w-[14rem] gap-md">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="type-body-sm-regular flex items-center gap-sm text-text-tertiary">
                <Spinner size="sm" /> Row {i}
              </span>
            ))}
          </DemoCard>
        ),
      },
    },
    {
      title: 'Short waits and long waits',
      body: 'For waits under about one second, show nothing: a spinner that flashes by feels slower than none. For long waits, say what’s happening (“Preparing your export…”) and, after a while, what people can do (“You can leave this page. We’ll email you.”).',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <div className="flex w-[8rem] flex-col items-center gap-md">
            <span className="type-body-xs-semibold text-text-tertiary">0–1 s</span>
            <span className="type-body-sm-regular text-text-tertiary">Show nothing</span>
          </div>
          <div className="flex w-[11rem] flex-col items-center gap-md">
            <span className="type-body-xs-semibold text-text-tertiary">1–10 s</span>
            <Loading text="Preparing your export…" />
          </div>
          <div className="flex w-[14rem] flex-col items-center gap-md">
            <span className="type-body-xs-semibold text-text-tertiary">10 s +</span>
            <Loading text="Preparing your export…" />
            <span className="type-body-xs-regular text-center text-text-tertiary">You can leave this page. We’ll email you.</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Tone',
      body: 'Use neutral by default. Save brand for when the spinner is the main thing on screen, such as a whole region loading.',
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-4xl">
          <div className="flex flex-col items-center gap-sm">
            <Spinner size="lg" tone="neutral" />
            <span className="type-body-xs-medium text-text-tertiary">Table loading · neutral</span>
          </div>
          <div className="flex flex-col items-center gap-sm">
            <Spinner size="xl" tone="brand" />
            <span className="type-body-xs-medium text-text-tertiary">Start screen · brand</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Motion',
      body: 'The arc turns at a steady speed without stopping. Because the movement is what says work is happening, Reduced motion slows it to half speed instead of stopping it. The loading text carries the meaning too.',
      render: () => (
        <div className="flex items-center gap-4xl">
          <div className="flex flex-col items-center gap-sm">
            <Spinner size="lg" />
            <span className="type-body-xs-medium text-text-tertiary">Default</span>
          </div>
          <div data-motion="reduced" className="flex flex-col items-center gap-sm">
            <Spinner size="lg" />
            <span className="type-body-xs-medium text-text-tertiary">Reduced motion · half speed</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Keep loading text short and specific, and end it with an ellipsis: “Loading invoices…”, “Saving…”. Instead of “Please wait” on its own, say what’s loading.',
      do: { caption: 'Says what’s loading.', render: () => <Loading text="Loading invoices…" /> },
      dont: { caption: '“Please wait” on its own.', render: () => <Loading text="Please wait" /> },
    },
  ],
  accessibility: [
    'A standalone spinner has role="status" and a name screen readers announce, set with label (for example “Loading invoices”). Announce completion through the content that replaces it.',
    'Inside a button or icon button, the button sets aria-busy and keeps its name. The spinner itself is aria-hidden.',
    'The turning arc meets the non-text contrast threshold against the surface or the parent’s fill in every color mode.',
  ],
});
