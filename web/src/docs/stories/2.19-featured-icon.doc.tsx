import { FeaturedIcon, type FeaturedIconTone } from '@/components/parts/FeaturedIcon';
import { Button } from '@/components/parts/Button';
import { IconButton } from '@/components/parts/IconButton';
import { Icon, type IconName } from '@/icons';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps } from '../blocks';
import { DemoCard } from './_demo';

const TYPES = ['circle', 'square'] as const;
const SIZES = ['sm', 'md', 'lg', 'xl'] as const;
const EMPHASIS = ['primary', 'secondary', 'tertiary'] as const;
const TONES: readonly FeaturedIconTone[] = ['neutral', 'brand', 'danger', 'warning', 'success'];
const toneIcon: Record<FeaturedIconTone, IconName> = {
  neutral: 'general/placeholder',
  brand: 'general/layers',
  danger: 'alerts/alert-circle',
  warning: 'alerts/alert-triangle',
  success: 'alerts/check-circle',
};

/** Two-level rows (Emphasis, then Tone) × Size columns. */
function FeaturedMatrix({ type, emphases }: { type: 'circle' | 'square'; emphases: readonly ('primary' | 'secondary' | 'tertiary')[] }) {
  return (
    <div className="overflow-x-auto rounded-surface border border-dashed border-border-brand-subtle p-xl">
      <div className="grid w-max items-center gap-x-2xl gap-y-lg" style={{ gridTemplateColumns: `auto auto repeat(${SIZES.length}, auto)` }}>
        <span />
        <span />
        {SIZES.map((s) => (
          <div key={s} className="justify-self-center">
            <AxisLabel prop="Size" value={s} />
          </div>
        ))}
        {emphases.map((e) =>
          TONES.map((t, i) => (
            <div key={`${e}-${t}`} className="contents">
              {i === 0 ? (
                <div style={{ gridRow: `span ${TONES.length}` }} className="self-start pt-md">
                  <AxisLabel prop="Emphasis" value={e} />
                </div>
              ) : null}
              <AxisLabel prop="Tone" value={t} />
              {SIZES.map((s) => (
                <div key={s} className="flex justify-center">
                  <FeaturedIcon type={type} emphasis={e} tone={t} size={s} icon={toneIcon[t]} />
                </div>
              ))}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

const Feature = ({ icon, title, text }: { icon: IconName; title: string; text: string }) => (
  <div className="flex flex-col gap-lg">
    <FeaturedIcon size="md" icon={icon} />
    <div className="flex flex-col gap-xxs">
      <span className="type-body-md-semibold text-text-primary">{title}</span>
      <span className="type-body-sm-regular text-text-tertiary">{text}</span>
    </div>
  </div>
);

export default defineDoc({
  id: '2.19',
  name: 'Featured icon',
  level: 'parts',
  spec: 'parts/2.19-featured-icon.md',
  exports: ['FeaturedIcon'],
  summary:
    "An icon in a shaped container that anchors empty states, dialogs, feature lists and notifications. Tone carries the message's intent; Emphasis sets its weight; the icon is swappable and keeps its standard size.",
  hero: () => <FeaturedIcon size="xl" icon="general/layers" className="scale-150" />,
  playground: {
    controls: [
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'circle' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'emphasis', figma: 'Emphasis (square: tertiary only)', control: { type: 'select', options: EMPHASIS }, default: 'secondary' },
      { name: 'tone', figma: 'Tone', control: { type: 'select', options: TONES }, default: 'brand' },
      { name: 'icon', figma: 'Icon', control: { type: 'icon' }, default: 'general/layers' },
    ],
    render: (a) => <FeaturedIcon {...a} />,
    code: (a) => `<FeaturedIcon${jsxProps(a, { type: 'circle', size: 'md', emphasis: 'secondary', tone: 'brand' }, a.type === 'square' ? ['emphasis'] : [])} />`,
  },
  examples: [
    {
      title: 'Empty state',
      caption: 'A featured icon anchors an empty state above its heading.',
      render: () => (
        <div className="flex max-w-[22rem] flex-col items-center gap-xl text-center">
          <FeaturedIcon type="square" size="lg" tone="neutral" icon="general/search" />
          <div className="flex flex-col gap-xs">
            <span className="type-heading-xs-semibold text-text-primary">No projects found</span>
            <span className="type-body-sm-regular text-text-tertiary">Your search didn’t match any projects. Try another keyword.</span>
          </div>
          <div className="flex gap-md">
            <Button emphasis="secondary" label="Clear search" />
            <Button leadingIcon="general/plus" label="New project" />
          </div>
        </div>
      ),
      code: `<FeaturedIcon type="square" size="lg" tone="neutral" emphasis="tertiary" icon="general/search" />
<h3>No projects found</h3>
<p>Your search didn’t match any projects. Try another keyword.</p>
<Button emphasis="secondary" label="Clear search" />
<Button leadingIcon="general/plus" label="New project" />`,
    },
    {
      title: 'Delete confirmation dialog',
      caption: 'Tone matches the consequence of the action below it.',
      render: () => (
        <DemoCard className="w-full max-w-[22rem] shadow-overlay">
          <FeaturedIcon size="lg" tone="danger" icon="general/trash" />
          <div className="flex flex-col gap-xs">
            <span className="type-heading-xs-semibold text-text-primary">Delete this file?</span>
            <span className="type-body-sm-regular text-text-tertiary">This can’t be undone.</span>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <Button emphasis="secondary" label="Cancel" />
            <Button tone="danger" label="Delete" />
          </div>
        </DemoCard>
      ),
      code: `<FeaturedIcon size="lg" tone="danger" icon="general/trash" />
<h2>Delete this file?</h2>
<p>This can’t be undone.</p>
<Button emphasis="secondary" label="Cancel" />
<Button tone="danger" label="Delete" />`,
    },
    {
      title: 'Feature list',
      caption: 'In lists, one size and one emphasis keep the items equal.',
      stage: 'full',
      render: () => (
        <div className="grid w-full max-w-[48rem] gap-3xl md:grid-cols-3">
          <Feature icon="general/zap" title="Fast setup" text="Connect your data in minutes." />
          <Feature icon="security/lock" title="Secure by default" text="Encryption at rest and in transit." />
          <Feature icon="charts/chart-column" title="Clear reporting" text="Dashboards that update live." />
        </div>
      ),
      code: `<FeaturedIcon size="md" icon="general/zap" />
<FeaturedIcon size="md" icon="security/lock" />
<FeaturedIcon size="md" icon="charts/chart-column" />`,
    },
    {
      title: 'Success notification',
      caption: 'The outline style signals intent quietly next to body text.',
      render: () => (
        <DemoCard className="w-full max-w-[24rem] flex-row items-start gap-lg shadow-overlay">
          <FeaturedIcon size="sm" tone="success" emphasis="tertiary" icon="alerts/check-circle" />
          <div className="flex flex-1 flex-col gap-xxs">
            <span className="type-body-sm-semibold text-text-primary">Changes saved</span>
            <span className="type-body-sm-regular text-text-tertiary">Your profile is up to date.</span>
          </div>
          <IconButton size="sm" icon="general/x" label="Dismiss" />
        </DemoCard>
      ),
      code: `<FeaturedIcon size="sm" tone="success" emphasis="tertiary" icon="alerts/check-circle" />
<div>
  <p>Changes saved</p>
  <p>Your profile is up to date.</p>
</div>
<IconButton size="sm" icon="general/x" label="Dismiss" />`,
    },
  ],
  whenToUse: {
    use: ['To anchor a block: empty states, dialogs, feature lists, notifications.', 'When an icon needs more presence than its standard size.'],
    dont: ['Inline in a sentence — use a plain icon.', 'As an action — use an Icon button (2.2).'],
  },
  matrices: [
    { title: 'Type=circle', rows: 'Emphasis × Tone', columns: 'Size', render: () => <FeaturedMatrix type="circle" emphases={EMPHASIS} /> },
    { title: 'Type=square', rows: 'Emphasis × Tone', columns: 'Size', render: () => <FeaturedMatrix type="square" emphases={['tertiary']} /> },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-3xl">
        <div className="flex flex-wrap items-end justify-center gap-3xl">
          {([
            ['circle', 'primary'],
            ['circle', 'secondary'],
            ['circle', 'tertiary'],
            ['square', 'tertiary'],
          ] as const).map(([type, emphasis]) => (
            <div key={type + emphasis} className="flex flex-col items-center gap-md">
              <FeaturedIcon type={type} emphasis={emphasis} size="lg" icon="general/layers" />
              <AxisLabel prop={type} value={emphasis} />
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2xl">
          {SIZES.map((s) => (
            <div key={s} className="flex flex-col items-center gap-sm">
              <FeaturedIcon size={s} icon="general/layers" />
              <AxisLabel prop="Size" value={s} />
            </div>
          ))}
        </div>
      </div>
    ),
    parts: [
      { name: 'Container', description: 'Fixed square featured-icon/size/{size} (32 / 40 / 48 / 56). Circle: radius/full, fill by Emphasis and Tone. Square: color/surface/base, color/border/default, elevation/raised, radius/control (sm, md) or radius/surface (lg, xl).', tokens: ['featured-icon/size/md', 'radius/full', 'color/fill/brand/subtle', 'color/surface/base', 'color/border/default', 'elevation/raised'] },
      { name: 'Outer ring', description: 'Tertiary circle: full box, border/width/strong, color/border/{tone}/subtle.', tokens: ['border/width/strong', 'color/border/brand/subtle'] },
      { name: 'Inner ring', description: 'Tertiary circle: inset space/xs (4) on every side, border/width/strong, color/border/{tone}.', tokens: ['color/border/brand', 'space/xs'] },
      { name: 'Icon', description: 'Keeps its standard box: size/icon/sm, md, lg, and featured-icon/icon/xl (28). Colour bound by Emphasis and Tone, so swapping keeps it.', tokens: ['size/icon/md', 'featured-icon/icon/xl', 'color/icon/on-solid', 'color/icon/brand'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: "'circle' | 'square'", default: "'circle'", description: 'Square exists only with tertiary emphasis.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Container 32 / 40 / 48 / 56; icon 16 / 20 / 24 / 28.' },
    { name: 'emphasis', figma: 'Emphasis', type: "'primary' | 'secondary' | 'tertiary'", default: "'secondary'", description: 'Solid, subtle fill, or outline rings.' },
    { name: 'tone', figma: 'Tone', type: "'neutral' | 'brand' | 'danger' | 'warning' | 'success'", default: "'brand'", description: 'The intent of the message that follows.' },
    { name: 'icon', figma: 'Icon', type: 'IconName', default: "'general/placeholder'", description: 'Any icon from the registry.' },
    { name: 'label', type: 'string', description: 'Accessible name, only when the icon is the only signal of intent. Otherwise aria-hidden.' },
  ],
  tokens: [
    'featured-icon/size/sm', 'featured-icon/size/md', 'featured-icon/size/lg', 'featured-icon/size/xl', 'featured-icon/icon/xl',
    'color/fill/brand/solid', 'color/fill/brand/subtle', 'color/fill/neutral/solid', 'color/fill/neutral/subtle', 'color/fill/danger/solid', 'color/fill/danger/subtle',
    'color/fill/warning/solid', 'color/fill/warning/subtle', 'color/fill/success/solid', 'color/fill/success/subtle',
    'color/icon/on-solid', 'color/icon/inverse', 'color/icon/brand', 'color/icon/secondary', 'color/icon/danger', 'color/icon/warning', 'color/icon/success',
    'color/border/brand', 'color/border/brand/subtle', 'color/border/default', 'color/border/subtle', 'border/width/strong', 'border/width/default',
    'color/surface/base', 'elevation/raised', 'radius/full', 'radius/control', 'radius/surface', 'size/icon/sm', 'size/icon/md', 'size/icon/lg',
  ],
  guidelines: [
    {
      title: 'A bigger icon without a bigger icon',
      body: 'Icons are drawn for their box; scaling one far beyond it thickens strokes and blurs details. When an icon needs more presence, place the standard icon in a Featured icon: icon box 24, container 48, strokes and proportions unchanged.',
      do: { caption: 'The 24 icon in a Size=lg Featured icon.', render: () => <FeaturedIcon size="lg" icon="general/layers" /> },
      dont: { caption: 'The icon scaled up to 48 with thick strokes.', render: () => <Icon name="general/layers" className="text-icon-brand" style={{ width: 'var(--featured-icon-size-lg)', height: 'var(--featured-icon-size-lg)' }} /> },
    },
    {
      title: 'Tone follows the message',
      body: 'Match the tone to what follows: danger for errors and destructive confirmations, warning for risk, success for completion, brand for features and onboarding, neutral for everything else. Tone is never the only signal: the heading says the same thing.',
      render: () => (
        <div className="flex flex-wrap justify-center gap-xl">
          {([
            ['danger', 'general/trash', 'Delete this file?'],
            ['warning', 'alerts/alert-triangle', 'Unsaved changes'],
            ['success', 'alerts/check-circle', 'Payment received'],
            ['neutral', 'general/search', 'No results'],
          ] as const).map(([tone, icon, h]) => (
            <DemoCard key={tone} className="w-[11rem] items-start">
              <FeaturedIcon size="lg" tone={tone} icon={icon} />
              <span className="type-body-sm-semibold text-text-primary">{h}</span>
            </DemoCard>
          ))}
        </div>
      ),
    },
    {
      title: 'Emphasis per screen',
      body: 'Use one emphasis on a screen. Use primary only when the Featured icon is the main focal point, secondary by default, and tertiary next to body text or when several sit together.',
      do: {
        caption: 'One list, secondary only.',
        render: () => (
          <div className="flex gap-xl">
            <FeaturedIcon icon="general/zap" />
            <FeaturedIcon icon="security/lock" />
            <FeaturedIcon icon="charts/chart-column" />
          </div>
        ),
      },
      dont: {
        caption: 'Primary, secondary and square mixed in one list.',
        render: () => (
          <div className="flex gap-xl">
            <FeaturedIcon emphasis="primary" icon="general/zap" />
            <FeaturedIcon icon="security/lock" />
            <FeaturedIcon type="square" icon="charts/chart-column" />
          </div>
        ),
      },
    },
    {
      title: 'Size from the heading',
      body: 'Pick the size from the text it anchors: sm–md beside body text and list items, lg above a dialog or empty-state heading, xl for large empty states and onboarding.',
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-3xl">
          <span className="type-body-sm-regular flex items-center gap-md text-text-secondary">
            <FeaturedIcon size="sm" icon="general/bell" /> Body text
          </span>
          <span className="type-body-md-semibold flex items-center gap-md text-text-primary">
            <FeaturedIcon size="md" icon="general/bell" /> List item
          </span>
          <span className="type-heading-xs-semibold flex flex-col items-start gap-md text-text-primary">
            <FeaturedIcon size="lg" icon="general/bell" /> Dialog heading
          </span>
          <span className="type-heading-md-semibold flex flex-col items-start gap-md text-text-primary">
            <FeaturedIcon size="xl" icon="general/bell" /> Empty state
          </span>
        </div>
      ),
    },
    {
      title: 'Not a button, not inline',
      body: 'A Featured icon is not interactive; when the icon is an action, use an Icon button (2.2). Don’t place a Featured icon inside a sentence; use a plain icon.',
      do: { caption: 'An Icon button with the close icon.', render: () => <IconButton emphasis="secondary" icon="general/x" label="Close" /> },
      dont: { caption: 'A Featured icon used as a close control.', render: () => <FeaturedIcon size="md" tone="neutral" icon="general/x" className="cursor-pointer" /> },
    },
  ],
  accessibility: [
    'Most Featured icons repeat what the heading next to them says and are hidden from assistive technology (aria-hidden, the default).',
    'When the icon is the only signal of the message’s intent, pass `label` (“Warning”) — it becomes role="img" with that name.',
    'The icon meets the non-text contrast threshold against its container (or against the surface for tertiary) in every colour mode and tone.',
  ],
});
