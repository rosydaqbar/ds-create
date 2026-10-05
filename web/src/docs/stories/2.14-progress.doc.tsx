import { useEffect, useState } from 'react';
import { Progress } from '@/components/parts/Progress';
import { Spinner } from '@/components/parts/Spinner';
import { IconButton } from '@/components/parts/IconButton';
import { Checkbox } from '@/components/parts/Checkbox';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { DemoCard } from './_demo';

const TYPES = ['bar', 'circle', 'half-circle'] as const;
const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg'] as const;
const VALUES = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'] as const;
const PLACEMENTS = ['none', 'right', 'bottom-end', 'top', 'bottom'] as const;

/** Value-driven demo: the same bar animates between values. */
function MovingBar() {
  const [v, setV] = useState(40);
  useEffect(() => {
    const t = setInterval(() => setV((x) => (x === 40 ? 60 : 40)), 1600);
    return () => clearInterval(t);
  }, []);
  return <Progress aria-label="Upload" value={v} placement="right" />;
}

export default defineDoc({
  id: '2.14',
  name: 'Progress',
  level: 'parts',
  spec: 'parts/2.14-progress.md',
  exports: ['Progress'],
  summary:
    "Shows the percent completed for a task, or a level against a known maximum, as a bar, a circle or a half-circle. Every value uses the same track and progress line; Value only changes the line's length.",
  hero: () => (
    <div className="w-[30rem] max-w-full">
      <Progress aria-label="Upload progress" value={40} placement="right" />
    </div>
  ),
  playground: {
    controls: [
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'bar' },
      { name: 'size', figma: 'Size (circle, half-circle)', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'value', figma: 'Value', control: { type: 'number', min: 0, max: 100, step: 1 }, default: 40 },
      { name: 'placement', figma: 'Placement (bar)', control: { type: 'select', options: PLACEMENTS }, default: 'none' },
      { name: 'label', figma: 'Show label + Label (circle)', control: { type: 'text' }, default: 'Active users' },
    ],
    render: (a) => (
      <div className="flex w-[20rem] justify-center">
        <Progress aria-label="Progress" {...a} />
      </div>
    ),
    code: (a) => {
      const skip = a.type === 'bar' ? ['size', 'label'] : ['placement'];
      return `<Progress aria-label="Active users"${jsxProps(a, { type: 'bar', size: 'md', value: 40, placement: 'none' }, skip)} />`;
    },
  },
  examples: [
    {
      title: 'File upload row',
      caption: 'A bar under the item shows how far an upload has come.',
      render: () => (
        <DemoCard className="w-full max-w-[26rem] flex-row items-start gap-md">
          <Icon name="files/file-text" className="mt-xxs text-icon-secondary" />
          <div className="flex min-w-0 flex-1 flex-col gap-sm">
            <span className="type-body-sm-medium text-text-primary">
              design-review.pdf <span className="text-text-tertiary">· 2.4 MB of 6 MB</span>
            </span>
            <Progress aria-label="Uploading design-review.pdf" value={40} placement="right" />
          </div>
          <IconButton size="sm" icon="general/x" label="Cancel upload" />
        </DemoCard>
      ),
      code: `<div className="flex items-start gap-md">
  <Icon name="files/file-text" />
  <div className="flex flex-1 flex-col gap-sm">
    <span>design-review.pdf · 2.4 MB of 6 MB</span>
    <Progress aria-label="Uploading design-review.pdf" value={40} placement="right" />
  </div>
  <IconButton size="sm" icon="general/x" label="Cancel upload" />
</div>`,
    },
    {
      title: 'Storage card',
      caption: 'A circle summarises a resource level next to its exact numbers.',
      render: () => (
        <DemoCard className="w-[18rem] items-center">
          <span className="type-heading-xs-semibold self-start text-text-primary">Storage</span>
          <Progress type="circle" size="xs" value={70} label="Used" aria-label="Storage used" />
          <span className="type-body-sm-regular text-text-secondary">7 GB of 10 GB</span>
        </DemoCard>
      ),
      code: `<Progress type="circle" size="xs" value={70} label="Used" aria-label="Storage used" />
<span>7 GB of 10 GB</span>`,
    },
    {
      title: 'Onboarding checklist',
      caption: 'Progress across a list of steps; the label matches the checked items.',
      render: () => (
        <DemoCard className="w-full max-w-[22rem]">
          <span className="type-heading-xs-semibold text-text-primary">Get started</span>
          <Progress aria-label="Onboarding" value={60} placement="bottom-end" />
          <div className="flex flex-col gap-md">
            {['Create a project', 'Invite your team', 'Connect a repository', 'Set up billing', 'Publish your first report'].map((s, i) => (
              <label key={s} className="type-body-sm-medium flex items-center gap-md text-text-secondary">
                <Checkbox defaultChecked={i < 3} /> {s}
              </label>
            ))}
          </div>
        </DemoCard>
      ),
      code: `<Progress aria-label="Onboarding" value={60} placement="bottom-end" />
<label><Checkbox defaultChecked /> Create a project</label>
…`,
    },
    {
      title: 'Dashboard metric',
      caption: 'A half-circle fits wide, short dashboard cards.',
      render: () => (
        <DemoCard className="w-full max-w-[24rem] items-center">
          <span className="type-body-sm-medium self-start text-text-tertiary">Quarterly sign-ups</span>
          <Progress type="half-circle" size="sm" value={80} label="Goal reached" aria-label="Quarterly goal" />
        </DemoCard>
      ),
      code: `<Progress type="half-circle" size="sm" value={80} label="Goal reached" aria-label="Quarterly goal" />`,
    },
  ],
  whenToUse: {
    use: ['Determinate work: uploads, exports, multi-step setup.', 'A level against a known maximum: storage, quota, seats.'],
    dont: ['Unknown durations — use a Spinner (2.15).', 'Status (“Healthy”, “Active”) — use a Badge (2.4).', 'Signal or network strength.'],
  },
  matrices: [
    {
      title: 'Type=bar',
      rows: 'Placement',
      columns: 'Value',
      render: () => (
        <Matrix
          rowProp="Placement"
          rows={PLACEMENTS}
          colProp="Value"
          cols={VALUES}
          cell={(placement, v) => (
            <div className="w-[10rem]">
              <Progress aria-label="Progress" value={Number(v)} placement={placement} />
            </div>
          )}
        />
      ),
    },
    ...(['circle', 'half-circle'] as const).map((type) => ({
      title: `Type=${type}`,
      rows: 'Size',
      columns: 'Value',
      render: () => (
        <Matrix rowProp="Size" rows={SIZES} colProp="Value" cols={VALUES} cell={(size, v) => <Progress aria-label="Progress" type={type} size={size} value={Number(v)} />} />
      ),
    })),
    {
      title: 'Show label = true',
      columns: 'Size',
      render: () => (
        <Matrix
          rowProp="Type"
          rows={['circle', 'half-circle'] as const}
          colProp="Size"
          cols={SIZES}
          cell={(type, size) => <Progress type={type} size={size} value={40} label="Active users" />}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex w-full flex-col items-center gap-3xl">
        <div className="flex w-[24rem] flex-col gap-lg">
          {[0, 40, 100].map((v) => (
            <Progress key={v} aria-label="Progress" value={v} placement="right" />
          ))}
          <span className="type-body-xs-medium text-center text-text-tertiary">same Track, same Fill, only the width changes</span>
        </div>
        <div className="flex flex-wrap items-end justify-center gap-3xl">
          <Progress type="circle" size="md" value={40} label="Active users" />
          <Progress type="half-circle" size="md" value={40} label="Active users" />
        </div>
      </div>
    ),
    parts: [
      { name: 'Track', description: 'Bar background: fills the width, size/track/lg high, radius/full, color/fill/neutral/track.', tokens: ['size/track/lg', 'radius/full', 'color/fill/neutral/track'] },
      { name: 'Fill', description: 'Width = Value % of the Track, pinned to its start; hidden at 0. color/fill/brand/solid.', tokens: ['color/fill/brand/solid'] },
      { name: 'Value label', description: 'right (space/lg gap) or bottom-end (space/md gap). type/body/sm/medium, color/text/secondary.', tokens: ['type/body/sm/medium', 'color/text/secondary', 'space/lg', 'space/md'] },
      { name: 'Floating label', description: 'top / bottom: raised box centred on the fill end, kept inside the track, in a reserved Label space so the track never moves.', tokens: ['color/surface/raised', 'color/border/subtle', 'elevation/raised', 'radius/control', 'type/body/xs/semibold'] },
      { name: 'Background', description: 'Circle: full ring; half-circle: 180° arch from 9 to 3 o’clock. Stroke progress/ring-thickness/{size}, round caps.', tokens: ['progress/ring-thickness/md', 'color/fill/neutral/track'] },
      { name: 'Progress line', description: 'Arc from 12 o’clock clockwise (half-circle: from 9 o’clock); sweep = Value % of 360° (180°). Round caps.', tokens: ['color/fill/brand/solid'] },
      { name: 'Number and label', description: 'Vertical, centred in the ring (on the base line of the arch). Label optional and not shown at 2xs.', tokens: ['color/text/primary', 'color/text/tertiary', 'type/heading/lg/semibold', 'type/body/sm/medium'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: "'bar' | 'circle' | 'half-circle'", default: "'bar'", description: 'Bar for rows and sections; circle for summary cards; half-circle for wide, short cards.' },
    { name: 'size', figma: 'Size', type: "'2xs' | 'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Circle and half-circle diameter 64 / 160 / 200 / 240 / 280. The bar has one size.' },
    { name: 'value', figma: 'Value', type: 'number', default: '40', description: '0–100. Any value works; the number is rounded to a whole percent.' },
    { name: 'placement', figma: 'Placement', type: "'none' | 'right' | 'bottom-end' | 'top' | 'bottom'", default: "'none'", description: 'Bar only: where the value label sits.' },
    { name: 'label', figma: 'Show label + Label', type: 'ReactNode', description: 'Circle and half-circle: short text above the number (present = shown). Also the default accessible name.' },
    { name: 'aria-label', type: 'string', description: 'Says what is progressing (“Uploading 3 files”).' },
  ],
  tokens: [
    'color/fill/neutral/track', 'color/fill/brand/solid', 'color/text/secondary', 'color/text/primary', 'color/text/tertiary',
    'color/surface/raised', 'color/border/subtle', 'elevation/raised', 'radius/control', 'radius/full', 'size/track/lg',
    'progress/ring-thickness/2xs', 'progress/ring-thickness/xs', 'progress/ring-thickness/sm', 'progress/ring-thickness/md', 'progress/ring-thickness/lg',
    'type/body/sm/medium', 'type/body/xs/semibold', 'space/lg', 'space/md', 'motion/duration/base', 'motion/easing/standard',
  ],
  guidelines: [
    {
      title: 'Bar or circle',
      body: 'Use a bar where there is width to spare and the progress belongs to a row or a section: uploads, onboarding, a quota line. Use a circle where the indicator is a summary in a card or tile and is paired with a label; use a half-circle in wide, short dashboard cards.',
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-4xl">
          <div className="flex w-[18rem] flex-col gap-sm">
            <span className="type-body-sm-medium text-text-primary">design-review.pdf</span>
            <Progress aria-label="Upload" value={40} placement="right" />
          </div>
          <Progress type="circle" size="xs" value={70} label="Used" />
        </div>
      ),
    },
    {
      title: 'Determinate vs indeterminate',
      body: 'Progress is for work with a known size. When the size or duration is unknown, use a Spinner (2.15). If the size becomes known part-way, switch from Spinner to Progress.',
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-3xl">
          <span className="type-body-sm-medium flex items-center gap-sm text-text-secondary">
            <Spinner size="sm" /> Preparing…
          </span>
          <div className="w-[12rem]">
            <Progress aria-label="Upload" value={30} placement="right" />
          </div>
          <div className="flex w-[12rem] flex-col gap-xs">
            <Progress aria-label="Upload" value={100} placement="right" />
            <span className="type-body-xs-medium text-text-success">Upload complete</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Value-driven construction',
      body: 'Every value is the same track and the same line. To change the look — colour, thickness, radius — edit the tokens once and all 165 variants update. Values between the steps are the same Fill or arc, never new shapes.',
      render: () => (
        <div className="flex w-[22rem] flex-col gap-lg">
          {[20, 50, 90].map((v) => (
            <Progress key={v} aria-label="Progress" value={v} />
          ))}
        </div>
      ),
    },
    {
      title: 'Label placement',
      body: 'The value label can sit to the right, under the end, or float above or below the fill end. Changing placement never moves the track. Floating labels are useful when the exact value matters; static labels are calmer for lists.',
      render: () => (
        <div className="flex w-[24rem] flex-col gap-xl">
          {PLACEMENTS.map((p) => (
            <div key={p} className="flex flex-col gap-xs">
              <AxisLabel prop="Placement" value={p} />
              <Progress aria-label="Progress" value={40} placement={p} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Showing the number',
      body: 'Show the percentage when users make decisions with it (storage, quotas) or when the wait is long. Hide it for quick operations where the movement alone is enough. Round to whole percents; don’t show decimals.',
      do: { caption: '“Uploading… 37%”.', render: () => <div className="flex w-[16rem] flex-col gap-xs"><span className="type-body-sm-medium text-text-secondary">Uploading…</span><Progress aria-label="Upload" value={37.462} placement="right" /></div> },
      dont: { caption: '“Uploading… 37.462%”.', render: () => <div className="flex w-[16rem] flex-col gap-xs"><span className="type-body-sm-medium text-text-secondary">Uploading…</span><div className="flex items-center gap-lg"><Progress aria-label="Upload" value={37.462} /><span className="type-body-sm-medium text-text-secondary">37.462%</span></div></div> },
    },
    {
      title: 'Progress is not status, and not signal strength',
      body: 'A Progress shows completion toward a maximum. Don’t use it as a status badge (“Healthy”) or to draw network or signal strength; those are categorical states, not progress, and need their own components.',
      do: { caption: 'A status label for status.', render: () => <span className="type-body-xs-semibold rounded-indicator bg-fill-success-subtle px-md py-xxs text-text-success">Active</span> },
      dont: { caption: 'A full bar used as an “Active” marker.', render: () => <div className="w-[10rem]"><Progress aria-label="Active" value={100} /></div> },
    },
    {
      title: 'Fake precision and fake progress',
      body: 'Don’t move a bar at a steady speed to look busy when you don’t know the real progress, and don’t stop at 99% for a long time. If you can’t measure, use a Spinner.',
      do: { caption: 'A Spinner with “Finishing up…”.', render: () => <span className="type-body-sm-medium flex items-center gap-sm text-text-secondary"><Spinner size="sm" /> Finishing up…</span> },
      dont: { caption: '“99%” with “Still working…”.', render: () => <div className="flex w-[16rem] flex-col gap-xs"><Progress aria-label="Progress" value={99} placement="right" /><span className="type-body-xs-medium text-text-tertiary">Still working…</span></div> },
    },
    {
      title: 'Motion',
      body: 'The Fill or Progress line animates smoothly from the old value to the new one with motion/duration/base and motion/easing/standard. With reduced motion, it jumps to the new value.',
      render: () => (
        <div className="w-[22rem]">
          <MovingBar />
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Pair a Progress with text that names the task (“Uploading 3 files”) and, when helpful, the remaining amount (“2 MB left”). Use the percent sign with no space (“40%”). Circle labels are one or two words (“Used”, “Goal reached”).',
    },
  ],
  accessibility: [
    'Progress is role="progressbar" with aria-valuemin 0, aria-valuemax 100, aria-valuenow and aria-valuetext (“40%”).',
    'Give it an accessible name that says what is progressing (aria-label); the circle label is the default.',
    'Announce completion in text; don’t rely on the bar reaching the end.',
    'The Fill meets the non-text contrast threshold against the Track, and the Track against the surface, in every colour mode.',
    'Colour is not the only signal: the number or the accompanying text carries the value.',
  ],
});
