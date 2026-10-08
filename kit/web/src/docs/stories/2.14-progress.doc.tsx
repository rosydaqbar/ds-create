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
  spec: 'specs/parts/2.14-progress.md',
  exports: ['Progress'],
  summary:
    "Progress shows how much of a task is done, like an upload or setup, or how full something is, like storage. Use a bar in rows and sections, and a circle or half-circle in summary cards.",
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
      caption: 'A bar under the file name shows how far the upload has come, next to the exact size.',
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
      caption: 'A circle sums up how much storage is used, with the exact numbers right below it.',
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
      caption: 'The bar tracks a list of steps, and its value matches the items already checked.',
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
      caption: 'A half-circle fits wide, short dashboard cards better than a full circle.',
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
    use: ['Show work with a known size, like uploads, exports or a multi-step setup.', 'Show a level against a known maximum, like storage, quota or seats.'],
    dont: ['Don’t know how long it will take? Use a Spinner (2.15).', 'For a status like “Healthy” or “Active”, use a Badge (2.4).', 'Avoid it for signal or network strength, which isn’t progress.'],
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
          <span className="type-body-xs-medium text-center text-text-tertiary">Same track and fill. Only the width changes.</span>
        </div>
        <div className="flex w-[24rem] flex-col gap-sm">
          <AxisLabel prop="Placement" value="top" />
          <Progress aria-label="Progress" value={40} placement="top" />
        </div>
        <div className="flex flex-wrap items-end justify-center gap-3xl">
          <Progress type="circle" size="md" value={0} label="Active users" />
          <Progress type="circle" size="md" value={40} label="Active users" />
          <Progress type="half-circle" size="md" value={40} label="Active users" />
        </div>
      </div>
    ),
    parts: [
      { name: 'Track', target: 'track', description: 'The background of the bar. It fills the available width and has fully rounded ends.', tokens: ['size/track/lg', 'radius/full', 'color/fill/neutral/track'] },
      { name: 'Fill', target: 'fill', description: 'The colored part that grows from the start of the track to match the value. It’s hidden at 0.', tokens: ['color/fill/brand/solid'] },
      { name: 'Value label', target: 'value-label', description: 'The percentage, shown to the right of the bar or below its end.', tokens: ['type/body/sm/medium', 'color/text/secondary', 'space/lg', 'space/md'] },
      { name: 'Floating label', target: 'floating-label', description: 'A small box above or below the end of the fill. It stays within the track, and space is reserved for it so the bar never moves.', tokens: ['color/surface/raised', 'color/border/subtle', 'elevation/raised', 'radius/control', 'type/body/xs/semibold'] },
      { name: 'Background', target: 'background', description: 'The ring behind the progress line: a full circle, or a 180° arch from 9 to 3 o’clock. Its thickness follows the size.', tokens: ['progress/ring-thickness/md', 'color/fill/neutral/track'] },
      { name: 'Progress line', target: 'progress-line', description: 'The arc that shows the value. It runs clockwise from 12 o’clock, or from 9 o’clock on a half-circle, with rounded ends.', tokens: ['color/fill/brand/solid'] },
      { name: 'Number and label', target: 'number-and-label', description: 'The percentage, centered in the ring or on the base of the arch. The optional label sits above it and is hidden at 2xs.', tokens: ['color/text/primary', 'color/text/tertiary', 'type/heading/lg/semibold', 'type/body/sm/medium'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: "'bar' | 'circle' | 'half-circle'", default: "'bar'", description: 'Use a bar in rows and sections, a circle in summary cards and a half-circle in wide, short cards.' },
    { name: 'size', figma: 'Size', type: "'2xs' | 'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'The circle and half-circle diameter: 64 / 160 / 200 / 240 / 280. The bar has one size.' },
    { name: 'value', figma: 'Value', type: 'number', default: '40', description: 'A number from 0 to 100. Any value works, and the number shown is rounded to a whole percent.' },
    { name: 'placement', figma: 'Placement', type: "'none' | 'right' | 'bottom-end' | 'top' | 'bottom'", default: "'none'", description: 'Bar only: where the value label sits.' },
    { name: 'label', figma: 'Show label + Label', type: 'ReactNode', description: 'Circle and half-circle only: short text above the number, shown when set. It’s also the default accessible name.' },
    { name: 'aria-label', type: 'string', description: 'Says what’s in progress, for example “Uploading 3 files”.' },
  ],
  tokens: [
    'color/fill/neutral/track', 'color/fill/brand/solid', 'color/text/secondary', 'color/text/primary', 'color/text/tertiary',
    'color/surface/raised', 'color/border/subtle', 'elevation/raised', 'radius/control', 'radius/full', 'size/track/lg',
    'progress/ring-thickness/2xs', 'progress/ring-thickness/xs', 'progress/ring-thickness/sm', 'progress/ring-thickness/md', 'progress/ring-thickness/lg',
    'type/body/sm/medium', 'type/body/xs/semibold', 'space/lg', 'space/md', 'motion/duration/base', 'motion/easing/standard',
  ],
  guidelines: [
    {
      title: 'Choose a bar or a circle',
      body: 'Use a bar when there’s width to spare and the progress belongs to a row or section, like an upload, onboarding or a quota line. Use a circle with a label to sum things up in a card or tile, and a half-circle in wide, short dashboard cards.',
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
      title: 'Use it only when you can measure',
      body: 'Progress is for work with a known size. When you don’t know the size or how long it will take, use a Spinner (2.15). If the size becomes known part-way, switch from the spinner to a progress bar.',
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
      title: 'One shape for every value',
      body: 'Every value uses the same track and the same line. To change the color, thickness or radius, edit the tokens once and all 165 variants update. Values between the steps reuse the same fill or arc, never new shapes.',
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
      body: 'Place the value label to the right, under the end, or floating above or below the end of the fill. The track stays put whichever you pick. Floating labels help when the exact value matters, while fixed labels feel calmer in lists.',
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
      body: 'Show the percentage when people make decisions with it, like for storage or quotas, or when the wait is long. Hide it for quick tasks where the movement says enough. Round to whole percents, without decimals.',
      do: { caption: '“Uploading… 37%”.', render: () => <div className="flex w-[16rem] flex-col gap-xs"><span className="type-body-sm-medium text-text-secondary">Uploading…</span><Progress aria-label="Upload" value={37.462} placement="right" /></div> },
      dont: { caption: '“Uploading… 37.462%”.', render: () => <div className="flex w-[16rem] flex-col gap-xs"><span className="type-body-sm-medium text-text-secondary">Uploading…</span><div className="flex items-center gap-lg"><Progress aria-label="Upload" value={37.462} /><span className="type-body-sm-medium text-text-secondary">37.462%</span></div></div> },
    },
    {
      title: 'Keep it for progress, not status',
      body: 'Progress shows how close something is to a maximum. Avoid using it as a status badge (“Healthy”) or to draw network or signal strength. Those are states, not progress, and need their own components.',
      do: { caption: 'A status label for status.', render: () => <span className="type-body-xs-semibold rounded-indicator bg-fill-success-subtle px-md py-xxs text-text-success">Active</span> },
      dont: { caption: 'A full bar used as an “Active” marker.', render: () => <div className="w-[10rem]"><Progress aria-label="Active" value={100} /></div> },
    },
    {
      title: 'Don’t fake progress',
      body: 'Moving a bar at a steady speed to look busy, or letting it sit at 99%, breaks people’s trust in it. If you can’t measure the real progress, use a spinner.',
      do: { caption: 'A spinner with “Finishing up…”.', render: () => <span className="type-body-sm-medium flex items-center gap-sm text-text-secondary"><Spinner size="sm" /> Finishing up…</span> },
      dont: { caption: '“99%” with “Still working…”.', render: () => <div className="flex w-[16rem] flex-col gap-xs"><Progress aria-label="Progress" value={99} placement="right" /><span className="type-body-xs-medium text-text-tertiary">Still working…</span></div> },
    },
    {
      title: 'Motion',
      body: 'When the value changes, the fill or line glides smoothly from the old value to the new one. With Reduced motion, it jumps straight to the new value.',
      render: () => (
        <div className="w-[22rem]">
          <MovingBar />
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Pair the bar with text that names the task (“Uploading 3 files”) and, when it helps, what’s left (“2 MB left”). Write the percent sign with no space (“40%”). Keep circle labels to one or two words, like “Used” or “Goal reached”.',
    },
  ],
  accessibility: [
    'Progress is role="progressbar" with aria-valuemin 0, aria-valuemax 100, aria-valuenow and aria-valuetext (“40%”).',
    'Give it a name with aria-label that says what’s in progress. Circles use their label by default.',
    'Announce completion in text. Screen reader users can’t see the bar reach the end.',
    'The fill meets the non-text contrast threshold against the track, and the track against the surface, in every color mode.',
    'Color is never the only signal: the number or the text beside it also carries the value.',
  ],
});
