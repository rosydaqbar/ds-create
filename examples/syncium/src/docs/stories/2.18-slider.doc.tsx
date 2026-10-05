import { useState } from 'react';
import { Slider } from '@/components/parts/Slider';
import { Label } from '@/components/parts/Label';
import { Divider } from '@/components/parts/Divider';
import { Button } from '@/components/parts/Button';
import { Progress } from '@/components/parts/Progress';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { TextControl } from '@/components/parts/TextControl';
import { DemoCard } from './_demo';

const PLACEMENTS = ['none', 'bottom', 'top'] as const;
const PAIRS = ['0 → 25', '0 → 50', '0 → 75', '0 → 100', '25 → 50', '25 → 75', '25 → 100', '50 → 75', '50 → 100', '75 → 100'] as const;
const STATES = ['rest', 'hover', 'focus'] as const;
const money = (v: number) => `$${v.toLocaleString('en-US')}`;

function PriceFilter() {
  const [[lo, hi], setRange] = useState<[number, number]>([200, 600]);
  return (
    <div className="flex w-full max-w-[22rem] flex-col gap-sm">
      <Label as="span" id="price-label" label="Price" />
      <Slider
        aria-labelledby="price-label"
        min={0}
        max={800}
        step={10}
        startValue={lo}
        endValue={hi}
        onValueChange={(s, e) => setRange([s, e])}
        placement="bottom"
        formatValue={money}
        startAriaLabel="Minimum price"
        endAriaLabel="Maximum price"
      />
      <div className="mt-sm grid grid-cols-2 gap-md">
        <TextControl aria-label="Minimum price" value={`Min ${money(lo)}`} readOnly />
        <TextControl aria-label="Maximum price" value={`Max ${money(hi)}`} readOnly />
      </div>
    </div>
  );
}

const pair = (p: (typeof PAIRS)[number]) => p.split(' → ').map(Number) as [number, number];

export default defineDoc({
  id: '2.18',
  name: 'Slider',
  level: 'parts',
  spec: 'parts/2.18-slider.md',
  exports: ['Slider'],
  summary:
    'Sliders let people set a value or a range by dragging along a scale, like a price filter or a volume control. Use them when the position matters more than the exact number.',
  hero: () => (
    <div className="w-[30rem] max-w-full">
      <Slider label="Range" startValue={25} endValue={75} placement="bottom" />
    </div>
  ),
  playground: {
    controls: [
      { name: 'startValue', figma: 'Start value', control: { type: 'number', min: 0, max: 100, step: 1 }, default: 0 },
      { name: 'endValue', figma: 'End value', control: { type: 'number', min: 0, max: 100, step: 1 }, default: 50 },
      { name: 'placement', figma: 'Placement', control: { type: 'select', options: PLACEMENTS }, default: 'none' },
      { name: 'showStartHandle', figma: 'Show start handle', control: { type: 'boolean' }, default: true },
    ],
    render: (a) => (
      <div className="w-[20rem]">
        <Slider label="Value" {...(a as Record<string, unknown>)} />
      </div>
    ),
    code: (a) => `<Slider label="Value"${jsxProps(a, { startValue: 0, endValue: 50, placement: 'none', showStartHandle: true })} onValueChange={(start, end) => …} />`,
  },
  examples: [
    {
      title: 'Price filter',
      caption: 'A range slider for quick, rough choices, with fields beside it for exact values.',
      render: () => <PriceFilter />,
      code: `const [[min, max], setRange] = useState([200, 600]);

<Label as="span" id="price-label" label="Price" />
<Slider
  min={0} max={800} step={10}
  startValue={min} endValue={max}
  onValueChange={(s, e) => setRange([s, e])}
  placement="bottom"
  formatValue={(v) => \`$\${v}\`}
  startAriaLabel="Minimum price"
  endAriaLabel="Maximum price"
/>`,
    },
    {
      title: 'Volume setting',
      caption: 'A single-value slider with icons at each end, so people know which way is louder.',
      render: () => (
        <div className="flex w-full max-w-[22rem] items-center gap-md">
          <Icon name="media/volume-min" className="text-icon-tertiary" />
          <Slider showStartHandle={false} endValue={75} endAriaLabel="Volume" formatValue={(v) => `${v}%`} />
          <Icon name="media/volume-max" className="text-icon-tertiary" />
        </div>
      ),
      code: `<Icon name="media/volume-min" />
<Slider showStartHandle={false} endValue={75} endAriaLabel="Volume" formatValue={(v) => \`\${v}%\`} />
<Icon name="media/volume-max" />`,
    },
    {
      title: 'Dragging with a tooltip',
      caption: 'The value floats above the handle while it moves, so people can see where they’ll stop.',
      render: () => (
        <div className="flex w-full max-w-[22rem] flex-col gap-sm">
          <Label as="span" label="Opacity" />
          <Slider showStartHandle={false} endValue={50} placement="top" forceState="focus" endAriaLabel="Opacity" formatValue={(v) => `${v}%`} />
        </div>
      ),
      code: `<Label as="span" label="Opacity" />
<Slider showStartHandle={false} endValue={50} placement="top" endAriaLabel="Opacity" formatValue={(v) => \`\${v}%\`} />`,
    },
    {
      title: 'Filter panel',
      caption: 'In a filter panel, the results update as each slider moves.',
      render: () => (
        <DemoCard className="w-full max-w-[18rem] gap-xl">
          <div className="flex flex-col gap-sm">
            <Label as="span" label="Distance" />
            <Slider showStartHandle={false} min={0} max={100} endValue={25} placement="bottom" endAriaLabel="Distance" formatValue={(v) => `Within ${v} km`} />
          </div>
          <Divider />
          <div className="flex flex-col gap-sm">
            <Label as="span" label="Rating" />
            <Slider min={1} max={5} step={1} startValue={2} endValue={4} placement="bottom" startAriaLabel="Minimum rating" endAriaLabel="Maximum rating" />
          </div>
        </DemoCard>
      ),
      code: `<Label as="span" label="Distance" />
<Slider showStartHandle={false} endValue={25} placement="bottom" endAriaLabel="Distance" formatValue={(v) => \`Within \${v} km\`} />
<Divider />
<Label as="span" label="Rating" />
<Slider min={1} max={5} startValue={2} endValue={4} placement="bottom" startAriaLabel="Minimum rating" endAriaLabel="Maximum rating" />`,
    },
  ],
  whenToUse: {
    use: ['Pick a rough value or range on a scale, where the position matters more than the number.', 'Filter live (price, distance) or adjust settings (volume, opacity).'],
    dont: ['For exact values, use a Text control (2.10), or pair one with the slider.', 'For a few named options, use Radios (2.8) or a segmented Button group (3.1).', 'To show a level people can’t change, use Progress (2.14).'],
  },
  matrices: [
    {
      title: 'Slider',
      rows: 'Start value → End value',
      columns: 'Placement',
      render: () => (
        <Matrix
          rowProp="Value"
          rows={PAIRS}
          colProp="Placement"
          cols={PLACEMENTS}
          cell={(p, placement) => {
            const [s, e] = pair(p);
            return (
              <div className="w-[16rem]">
                <Slider label="Value" startValue={s} endValue={e} placement={placement} alwaysShowTooltip />
              </div>
            );
          }}
        />
      ),
    },
    {
      title: 'Single value and handle states',
      render: () => (
        <div className="grid w-max grid-cols-[auto_16rem] items-center justify-items-start gap-x-2xl gap-y-xl rounded-surface border border-dashed border-border-brand-subtle p-xl">
          {[25, 50, 75].map((v) => (
            <div key={v} className="contents">
              <AxisLabel prop="Show start handle=false · End value" value={String(v)} />
              <Slider label="Value" showStartHandle={false} endValue={v} />
            </div>
          ))}
          <AxisLabel prop="End handle" value="hover" />
          <Slider label="Value" startValue={25} endValue={75} forceState="hover" />
          <AxisLabel prop="End handle" value="focus" />
          <Slider label="Value" startValue={25} endValue={75} forceState="focus" />
        </div>
      ),
    },
    {
      title: '.Main/Slider handle',
      rows: 'State',
      columns: 'Placement',
      render: () => (
        <Matrix
          rowProp="State"
          rows={STATES}
          colProp="Placement"
          cols={PLACEMENTS}
          cell={(state, placement) => (
            <div className="w-[8rem]">
              <Slider label="Value" showStartHandle={false} endValue={50} placement={placement} alwaysShowTooltip forceState={state === 'rest' ? undefined : state} />
            </div>
          )}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex w-[24rem] flex-col gap-2xl">
        {PLACEMENTS.map((p) => (
          <div key={p} className="flex flex-col gap-sm">
            <AxisLabel prop="Placement" value={p} />
            <Slider label="Value" startValue={25} endValue={75} placement={p} alwaysShowTooltip />
          </div>
        ))}
      </div>
    ),
    parts: [
      { name: 'Background track', target: 'background-track', description: 'The full scale, drawn as a rounded bar. It’s inset by half a knob, so handles at 0 and 100 stay inside the slider.', tokens: ['size/track/lg', 'radius/full', 'color/fill/neutral/track'] },
      { name: 'Progress line', target: 'progress-line', description: 'The brand-colored part that shows the selection. It always runs between the centers of the two knobs.', tokens: ['color/fill/brand/solid'] },
      { name: 'Start handle', target: 'start-handle', description: 'The knob people drag to set the start. Its center sits on the start value, and it’s hidden on a single-value slider.', tokens: ['size/icon/lg', 'border/width/strong', 'color/border/brand', 'color/surface/base', 'elevation/raised'] },
      { name: 'End handle', target: 'end-handle', description: 'The same knob, at the end value. It fills with a light brand color on hover and shows a focus ring on focus.', tokens: ['color/fill/brand/subtle', 'focus/default'] },
      { name: 'Value labels', target: 'value-label', description: 'The value, shown either below each knob or in a Tooltip (2.13) above the active one. Labels sit outside the knob and never move it.', tokens: ['type/body/md/medium', 'color/text/primary', 'space/md'] },
    ],
  },
  props: [
    { name: 'startValue', figma: 'Start value', type: 'number', default: '0', description: 'Where the progress line starts (the start handle).' },
    { name: 'endValue', figma: 'End value', type: 'number', default: '50', description: 'Where the progress line ends (the end handle).' },
    { name: 'placement', figma: 'Placement', type: "'none' | 'bottom' | 'top'", default: "'none'", description: 'Where value labels show: nowhere, under each handle, or in a tooltip above the active handle.' },
    { name: 'showStartHandle', figma: 'Show start handle', type: 'boolean', default: 'true', description: 'Turn it off for a single-value slider.' },
    { name: 'min / max / step', type: 'number', default: '0 / 100 / 1', description: 'The scale and its step size. Page Up and Page Down move by a tenth of the range.' },
    { name: 'onValueChange', type: '(start, end) => void', description: 'Called while a handle moves. Pass the values back to control the slider.' },
    { name: 'label', type: 'string', description: 'The accessible name (“Price”). A range names its handles “Price minimum” and “Price maximum”. Required unless aria-label, aria-labelledby or endAriaLabel names the slider.' },
    { name: 'aria-labelledby', type: 'string', description: 'The id of a visible Label that names the slider. Range handles add “minimum” and “maximum”.' },
    { name: 'formatValue', type: '(v) => string', description: 'Formats the label and aria-valuetext with a unit (“$200”).' },
    { name: 'startAriaLabel / endAriaLabel', type: 'string', description: 'Accessible names for the handles (“Minimum price”). They override the names built from label.' },
    { name: 'alwaysShowTooltip', type: 'boolean', default: 'false', description: 'With placement top, keeps every tooltip visible instead of only the active handle’s.' },
    { name: 'forceState / forceStartState', figma: '.Main/Slider handle State', type: "'hover' | 'focus'", description: 'Documentation only: pins the state of the end or start handle.' },
  ],
  tokens: [
    'color/fill/neutral/track', 'color/fill/brand/solid', 'color/surface/base', 'color/fill/brand/subtle', 'color/border/brand', 'border/width/strong',
    'elevation/raised', 'focus/default', 'color/text/primary', 'type/body/md/medium', 'size/track/lg', 'size/icon/lg', 'size/touch-min', 'radius/full', 'space/md',
  ],
  guidelines: [
    {
      title: 'When to use a slider',
      body: 'Use a slider when the position on a scale matters more than the exact number, and seeing the effect live helps, as with filters, volume or opacity. When people need an exact value, pair it with text controls or use a text control alone. For a few named choices, use radios or a segmented button group.',
      do: {
        caption: 'A segmented choice: “Small”, “Medium”, “Large”.',
        render: () => (
          <div className="flex">
            <Button emphasis="secondary" label="Small" className="rounded-r-none" />
            <Button emphasis="secondary" label="Medium" className="-ml-px rounded-none bg-surface-base-pressed" />
            <Button emphasis="secondary" label="Large" className="-ml-px rounded-l-none" />
          </div>
        ),
      },
      dont: {
        caption: 'A slider with three steps labeled S, M and L.',
        render: () => (
          <div className="w-[14rem]">
            <Slider label="Size" showStartHandle={false} min={0} max={2} step={1} endValue={1} placement="bottom" formatValue={(v) => ['S', 'M', 'L'][v]} />
          </div>
        ),
      },
    },
    {
      title: 'Single value or range',
      body: 'Use a single-value slider for one setting, and a range to filter between a minimum and a maximum. In a range, the handles never cross, and the progress line always runs between them.',
      render: () => (
        <div className="flex w-full flex-wrap items-center justify-center gap-4xl">
          <div className="flex w-[16rem] items-center gap-md">
            <Icon name="media/volume-min" className="text-icon-tertiary" />
            <Slider showStartHandle={false} endValue={75} endAriaLabel="Volume" />
            <Icon name="media/volume-max" className="text-icon-tertiary" />
          </div>
          <div className="w-[16rem]">
            <Slider min={0} max={800} step={10} startValue={200} endValue={600} placement="bottom" formatValue={money} startAriaLabel="Minimum price" endAriaLabel="Maximum price" />
          </div>
        </div>
      ),
    },
    {
      title: 'One handle for every slider',
      body: 'The background track shows the full scale and the progress line shows the selected part. Both ends use the same handle, so changing it once updates every slider.',
      render: () => (
        <div className="flex w-[20rem] flex-col gap-xl">
          <Slider label="Value" startValue={0} endValue={50} />
          <Slider label="Value" startValue={25} endValue={75} />
          <Slider label="Value" showStartHandle={false} endValue={60} />
        </div>
      ),
    },
    {
      title: 'Labels',
      body: 'Pick none when the value shows elsewhere or doesn’t matter, as with volume. Pick bottom for a readout that stays under each handle, and top for a value that floats above the handle while it’s dragged or focused. Whichever you pick, the knob’s center stays on the value.',
      render: () => (
        <div className="flex w-[20rem] flex-col gap-2xl">
          {PLACEMENTS.map((p) => (
            <Slider label="Value" key={p} startValue={25} endValue={75} placement={p} alwaysShowTooltip />
          ))}
        </div>
      ),
    },
    {
      title: 'Min, max and units',
      body: 'Show what the ends mean, with a minimum and maximum or icons for low and high. Show the unit too, either in the value labels (“$200”) or in the field label (“Price, $”).',
      do: {
        caption: 'Labeled ends and units.',
        render: () => (
          <div className="flex w-[16rem] flex-col gap-xs">
            <Slider label="Price" min={0} max={1000} step={10} startValue={200} endValue={600} placement="bottom" formatValue={money} />
            <div className="type-body-xs-medium mt-xs flex justify-between text-text-tertiary">
              <span>$0</span>
              <span>$1,000</span>
            </div>
          </div>
        ),
      },
      dont: { caption: 'An unlabeled range with no ends.', render: () => <div className="w-[16rem]"><Slider label="Value" startValue={20} endValue={60} /></div> },
    },
    {
      title: 'Keep it for values people set',
      body: 'A slider invites people to drag it, so avoid using one to show a level they can’t change, like battery or signal strength. Use Progress (2.14) or a dedicated indicator instead.',
      do: { caption: 'A progress bar for “Battery 60%”.', render: () => <div className="w-[16rem]"><Progress aria-label="Battery" value={60} placement="right" /></div> },
      dont: { caption: 'A disabled slider showing the battery level.', render: () => <div className="w-[16rem]"><Slider label="Battery" showStartHandle={false} endValue={60} disabled /></div> },
    },
    {
      title: 'How people move it',
      body: 'People drag a knob, or click the track to move the nearest handle there. Arrow keys move the focused handle one step, Page Up and Page Down move a larger step, and Home and End jump to the ends. In a range, neither handle can pass the other. On touch screens, each knob has a larger tap area than it shows.',
      render: () => (
        <div className="w-[20rem]">
          <Slider label="Value" startValue={30} endValue={70} placement="top" />
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Show the unit in value labels when it isn’t stated nearby (“40%”, “25 km”). Keep labels short enough not to overlap when the handles are close. Shorten units, like “k” for thousands, before you drop them.',
    },
  ],
  accessibility: [
    'Each handle is a separate role="slider" with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext (with the unit, via formatValue).',
    'Every slider has a name, from label, aria-label or aria-labelledby pointing at its visible Label. In a range, each handle gets its own name (“Price minimum”, “Price maximum”, or startAriaLabel / endAriaLabel). The start handle’s maximum is the end value, and the other way around.',
    'Keyboard users move a handle one step with the arrow keys, 10% with Page Up and Page Down, and to the ends with Home and End.',
    'Focus is always visible: a focus ring surrounds the focused knob and looks different from hover.',
    'The progress line meets the non-text contrast threshold against the track, and the knob border against the surface, in every color mode.',
  ],
});
