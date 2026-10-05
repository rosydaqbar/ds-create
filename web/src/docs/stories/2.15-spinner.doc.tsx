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
  spec: 'parts/2.15-spinner.md',
  exports: ['Spinner'],
  summary: 'Shows indeterminate loading. A background ring with a rotating active segment, sized like an icon. Button and Icon button instance it for their loading state.',
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
      caption: "Inside a Button the Spinner takes the label colour and keeps the button's size.",
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
      caption: 'In an Icon button the Spinner replaces the icon in the same box.',
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
      caption: 'On its own, the Spinner sits where the content will appear, with a short line of text.',
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
      caption: 'At small sizes it sits inline with text like an icon.',
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
    use: ['Loading that takes long enough to notice, with an unknown duration.', 'A region, card or table body waiting for its content.'],
    dont: ['Work with a known size — use Progress (2.14).', 'Next to a button — use the Button’s loading state.', 'Waits under about one second — show nothing.'],
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
                <Spinner size={s} />
                <Icon name="general/placeholder" size={iconFor[s]} className="text-icon-tertiary" style={s === 'xl' ? { width: 'var(--spinner-size-xl)', height: 'var(--spinner-size-xl)' } : undefined} />
              </div>
              <AxisLabel prop="Size" value={s} />
            </div>
          ))}
        </div>
      </div>
    ),
    parts: [
      { name: 'Background ring', description: 'Full circle the size of the box, stroke inside so the Spinner never exceeds its icon box. color/fill/neutral/track.', tokens: ['color/fill/neutral/track', 'spinner/thickness/md'] },
      { name: 'Active segment', description: '90° arc of the same circle from 12 o’clock, rotating clockwise once per motion/duration/loop at a linear speed. color/icon/secondary (neutral) or color/icon/brand.', tokens: ['color/icon/secondary', 'color/icon/brand', 'motion/duration/loop', 'motion/easing/linear'] },
      { name: 'Box', description: 'size/icon/sm (sm), size/icon/md (md), size/icon/xl (lg), spinner/size/xl = 48 (xl).', tokens: ['size/icon/sm', 'size/icon/md', 'size/icon/xl', 'spinner/size/xl'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'sm/md sit in controls and inline; lg/xl stand alone.' },
    { name: 'tone', figma: 'Tone', type: "'neutral' | 'brand' | 'current'", default: "'neutral'", description: '`current` follows the text colour — used inside Button and Icon button.' },
    { name: 'label', type: 'string', description: 'Standalone use: role="status" with this accessible name. Omit inside a button that already announces busy.' },
  ],
  tokens: [
    'color/fill/neutral/track', 'color/icon/secondary', 'color/icon/brand', 'size/icon/sm', 'size/icon/md', 'size/icon/xl', 'spinner/size/xl',
    'spinner/thickness/sm', 'spinner/thickness/md', 'spinner/thickness/lg', 'spinner/thickness/xl', 'motion/duration/loop', 'motion/easing/linear',
  ],
  guidelines: [
    {
      title: 'Spinner or Progress',
      body: 'Use a Spinner when loading takes long enough to notice and its length is unknown. When the amount of work is known, use Progress (2.14); when it becomes known part-way, switch to Progress. Do you know how much is left?',
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
      body: 'When an action starts work, put the button into its loading state. The Spinner appears inside it in the label colour, the button keeps its size, and it can’t be pressed twice. Don’t place a separate Spinner next to the button, and don’t disable the button without telling users why.',
      do: { caption: 'The Button in its loading state with “Saving…”.', render: () => <Button loading label="Saving…" /> },
      dont: {
        caption: 'A disabled Button with a Spinner floating beside it.',
        render: () => (
          <div className="flex items-center gap-md">
            <Button disabled label="Save changes" />
            <Spinner size="md" />
          </div>
        ),
      },
    },
    {
      title: 'Size from the content it replaces',
      body: 'Place the Spinner where the content will appear and size it to that content: sm–md inline with text and in controls, lg in cards and panels, xl for a whole region. One Spinner per region; don’t scatter spinners in every row of a loading list.',
      do: { caption: 'One lg Spinner in the card body.', render: () => <DemoCard className="w-[14rem] items-center"><Loading text="Loading…" /></DemoCard> },
      dont: {
        caption: 'A Spinner in every row.',
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
      body: 'For waits under about one second, show nothing; a flash of a Spinner feels slower than none. For long waits, add text that says what is happening (“Preparing your export…”) and, after a while, what users can do (“You can leave this page; we’ll email you.”).',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <div className="flex w-[8rem] flex-col items-center gap-md">
            <span className="type-body-xs-semibold text-text-tertiary">0–1 s</span>
            <span className="type-body-sm-regular text-text-tertiary">nothing</span>
          </div>
          <div className="flex w-[11rem] flex-col items-center gap-md">
            <span className="type-body-xs-semibold text-text-tertiary">1–10 s</span>
            <Loading text="Preparing your export…" />
          </div>
          <div className="flex w-[14rem] flex-col items-center gap-md">
            <span className="type-body-xs-semibold text-text-tertiary">10 s +</span>
            <Loading text="Preparing your export…" />
            <span className="type-body-xs-regular text-center text-text-tertiary">You can leave this page; we’ll email you.</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Tone',
      body: 'Use neutral by default. Use brand only when the Spinner is the main thing on screen, for example a full region loading.',
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
      title: 'Motion and reduced motion',
      body: 'The Active segment rotates continuously at a constant speed (motion/duration/loop, linear). Rotation is the only signal that work is in progress, so with reduced motion the Spinner keeps rotating at half speed instead of stopping; the loading text carries the meaning as well.',
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
      body: 'Loading text is short and specific, with an ellipsis: “Loading invoices…”, “Saving…”. Don’t write “Please wait” on its own; say what is loading.',
      do: { caption: 'Says what is loading.', render: () => <Loading text="Loading invoices…" /> },
      dont: { caption: '“Please wait” on its own.', render: () => <Loading text="Please wait" /> },
    },
  ],
  accessibility: [
    'A standalone Spinner has role="status" and an accessible name (`label`, e.g. “Loading invoices”); announce completion through the content that replaces it.',
    'Inside a Button or Icon button, the button exposes aria-busy and keeps its accessible name; the Spinner itself is aria-hidden.',
    'The Active segment meets the non-text contrast threshold against the surface or the parent’s fill in every colour mode.',
  ],
});
