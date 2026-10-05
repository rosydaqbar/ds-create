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
    'Lets users pick a value or a range by dragging handles along a track. The progress line always runs between the two handles; labels show the value below the handles or float above the active one.',
  hero: () => (
    <div className="w-[30rem] max-w-full">
      <Slider startValue={25} endValue={75} placement="bottom" />
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
        <Slider {...a} />
      </div>
    ),
    code: (a) => `<Slider${jsxProps(a, { startValue: 0, endValue: 50, placement: 'none', showStartHandle: true })} onValueChange={(start, end) => …} />`,
  },
  examples: [
    {
      title: 'Price filter',
      caption: 'A range slider with typed inputs for exact values.',
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
      caption: 'A single-value slider where the ends are shown with icons.',
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
      caption: 'A floating value appears above the active handle while it moves.',
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
      caption: 'Sliders in a filter panel update results as they move.',
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
    use: ['Approximate values and ranges on a scale, where the position matters more than the number.', 'Live filtering (price, distance) and settings (volume, opacity).'],
    dont: ['Exact values — use a Text control (2.10), or pair one with the Slider.', 'A few named options — use Radios (2.8) or a segmented Button group (3.1).', 'Displaying a level users can’t change — use Progress (2.14).'],
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
                <Slider startValue={s} endValue={e} placement={placement} alwaysShowTooltip />
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
              <Slider showStartHandle={false} endValue={v} />
            </div>
          ))}
          <AxisLabel prop="End handle" value="hover" />
          <Slider startValue={25} endValue={75} forceState="hover" />
          <AxisLabel prop="End handle" value="focus" />
          <Slider startValue={25} endValue={75} forceState="focus" />
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
              <Slider showStartHandle={false} endValue={50} placement={placement} alwaysShowTooltip forceState={state === 'rest' ? undefined : state} />
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
            <Slider startValue={25} endValue={75} placement={p} alwaysShowTooltip />
          </div>
        ))}
      </div>
    ),
    parts: [
      { name: 'Background track', description: 'Full scale: size/track/lg high, radius/full, color/fill/neutral/track. Inset by half the knob so handles at 0 and 100 stay inside.', tokens: ['size/track/lg', 'radius/full', 'color/fill/neutral/track'] },
      { name: 'Progress line', description: 'Runs from the start value to the end value, always between the knob centres. color/fill/brand/solid.', tokens: ['color/fill/brand/solid'] },
      { name: 'Start handle', description: '.Main/Slider handle; knob centre on the progress start. Hidden for a single-value slider.', tokens: ['size/icon/lg', 'border/width/strong', 'color/border/brand', 'color/surface/base', 'elevation/raised'] },
      { name: 'End handle', description: 'Same handle on the progress end. Hover fills color/fill/brand/subtle; focus adds focus/default.', tokens: ['color/fill/brand/subtle', 'focus/default'] },
      { name: 'Value labels', description: 'bottom: type/body/md/medium, color/text/primary, space/md under the knob. top: a Tooltip (2.13) space/md above the active knob. Labels sit outside the knob and never move it.', tokens: ['type/body/md/medium', 'color/text/primary', 'space/md'] },
    ],
  },
  props: [
    { name: 'startValue', figma: 'Start value', type: 'number', default: '0', description: 'Start of the progress line (start handle).' },
    { name: 'endValue', figma: 'End value', type: 'number', default: '50', description: 'End of the progress line (end handle).' },
    { name: 'placement', figma: 'Placement', type: "'none' | 'bottom' | 'top'", default: "'none'", description: 'Value labels: none, under each handle, or a Tooltip above the active handle.' },
    { name: 'showStartHandle', figma: 'Show start handle', type: 'boolean', default: 'true', description: 'Off = single-value slider.' },
    { name: 'min / max / step', type: 'number', default: '0 / 100 / 1', description: 'Scale. Page Up/Down move by a tenth of the range.' },
    { name: 'onValueChange', type: '(start, end) => void', description: 'Called while a handle moves; pass the values back to control the Slider.' },
    { name: 'formatValue', type: '(v) => string', description: 'Label and aria-valuetext with its unit (“$200”).' },
    { name: 'startAriaLabel / endAriaLabel', type: 'string', description: 'Accessible names of the handles (“Minimum price”).' },
    { name: 'alwaysShowTooltip', type: 'boolean', default: 'false', description: 'Placement=top: keep tooltips visible instead of only on the active handle.' },
    { name: 'forceState / forceStartState', figma: '.Main/Slider handle State', type: "'hover' | 'focus'", description: 'Documentation only: pins the end / start handle state.' },
  ],
  tokens: [
    'color/fill/neutral/track', 'color/fill/brand/solid', 'color/surface/base', 'color/fill/brand/subtle', 'color/border/brand', 'border/width/strong',
    'elevation/raised', 'focus/default', 'color/text/primary', 'type/body/md/medium', 'size/track/lg', 'size/icon/lg', 'size/touch-min', 'radius/full', 'space/md',
  ],
  guidelines: [
    {
      title: 'When a Slider is right',
      body: 'Use a Slider when the position on a scale matters more than the exact number, and when seeing the effect live helps (filters, volume, opacity). When users need an exact value, pair the Slider with Text controls or use a Text control alone. When there are only a few named choices, use Radios or a segmented Button group.',
      do: {
        caption: 'A segmented choice “Small · Medium · Large”.',
        render: () => (
          <div className="flex">
            <Button emphasis="secondary" label="Small" className="rounded-r-none" />
            <Button emphasis="secondary" label="Medium" className="-ml-px rounded-none bg-surface-base-pressed" />
            <Button emphasis="secondary" label="Large" className="-ml-px rounded-l-none" />
          </div>
        ),
      },
      dont: {
        caption: 'A Slider with three steps labelled S, M, L.',
        render: () => (
          <div className="w-[14rem]">
            <Slider showStartHandle={false} min={0} max={2} step={1} endValue={1} placement="bottom" formatValue={(v) => ['S', 'M', 'L'][v]} />
          </div>
        ),
      },
    },
    {
      title: 'Single value or range',
      body: 'Use a single-value slider for one setting. Use a range to filter between a minimum and a maximum; the handles never cross, and the progress line always runs between them.',
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
      title: 'Anatomy: track, progress, handles',
      body: 'The background track shows the full scale; the progress line shows the selected part; each end is the same reusable handle. Change the handle once to change every Slider.',
      render: () => (
        <div className="flex w-[20rem] flex-col gap-xl">
          <Slider startValue={0} endValue={50} />
          <Slider startValue={25} endValue={75} />
          <Slider showStartHandle={false} endValue={60} />
        </div>
      ),
    },
    {
      title: 'Labels',
      body: 'none when the value is shown elsewhere or doesn’t matter (volume). bottom for a permanent readout under each handle. top for a value that floats above the handle while it is dragged or focused. Labels never move the handle: the knob centre stays on the value, whatever the label.',
      render: () => (
        <div className="flex w-[20rem] flex-col gap-2xl">
          {PLACEMENTS.map((p) => (
            <Slider key={p} startValue={25} endValue={75} placement={p} alwaysShowTooltip />
          ))}
        </div>
      ),
    },
    {
      title: 'Min, max and units',
      body: 'Always show what the ends mean — minimum and maximum, or icons for low and high — and the unit of the value, either in the labels (“$200”) or in the field label (“Price, $”).',
      do: {
        caption: 'Ends and units are labelled.',
        render: () => (
          <div className="flex w-[16rem] flex-col gap-xs">
            <Slider min={0} max={1000} step={10} startValue={200} endValue={600} placement="bottom" formatValue={money} />
            <div className="type-body-xs-medium mt-xs flex justify-between text-text-tertiary">
              <span>$0</span>
              <span>$1,000</span>
            </div>
          </div>
        ),
      },
      dont: { caption: 'An unlabelled range with no ends.', render: () => <div className="w-[16rem]"><Slider startValue={20} endValue={60} /></div> },
    },
    {
      title: 'Not for measurements',
      body: 'A Slider is for values users set. Don’t use it to display a level users can’t change, such as signal strength or a progress amount; use Progress (2.14) or a dedicated indicator.',
      do: { caption: 'A Progress bar “Battery 60%”.', render: () => <div className="w-[16rem]"><Progress aria-label="Battery" value={60} placement="right" /></div> },
      dont: { caption: 'A disabled Slider showing battery level.', render: () => <div className="w-[16rem]"><Slider showStartHandle={false} endValue={60} disabled /></div> },
    },
    {
      title: 'Interaction',
      body: 'Dragging the knob moves it; clicking the track moves the nearest handle to that point. Arrow keys move the focused handle by one step; Page Up and Page Down by a larger step; Home and End to the minimum and maximum. In a range, the start handle can’t pass the end handle and vice versa. On touch screens, the hit area of each knob extends to size/touch-min without changing its visual size.',
      render: () => (
        <div className="w-[20rem]">
          <Slider startValue={30} endValue={70} placement="top" />
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Value labels show the number with its unit when the unit isn’t stated nearby (“40%”, “25 km”). Keep labels short enough not to overlap when the two handles are close; shorten units (“k” for thousands) before dropping them.',
    },
  ],
  accessibility: [
    'Each handle is a separate role="slider" with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext (with the unit, via formatValue).',
    'In a range, each handle has its own accessible name (startAriaLabel, endAriaLabel); the start handle’s maximum is the end value and vice versa.',
    'Keyboard: arrows ±1 step, Page Up/Down ±10%, Home/End to the ends.',
    'Focus is always visible: the focus/default ring sits around the focused knob, distinct from hover.',
    'The progress line meets the non-text contrast threshold against the track, and the knob border against the surface, in every colour mode.',
  ],
});
