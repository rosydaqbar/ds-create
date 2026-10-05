import { useState, type ReactNode } from 'react';
import { Checkbox } from '@/components/parts/Checkbox';
import { Radio } from '@/components/parts/Radio';
import { Switch } from '@/components/parts/Switch';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md'] as const;
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const;
const ROWS = SIZES.flatMap((s) => (['false', 'true'] as const).map((c) => `${s} · ${c}`));

const Row = ({ children, label, sub }: { children: ReactNode; label: string; sub?: string }) => (
  <label className="flex cursor-pointer items-center gap-md">
    {children}
    <span className="type-body-sm-regular text-text-primary">
      {label}
      {sub && <span className="text-text-tertiary"> {sub}</span>}
    </span>
  </label>
);

function PlanCards() {
  const [plan, setPlan] = useState('team');
  return (
    <div role="radiogroup" aria-label="Plan" className="grid w-full max-w-[30rem] grid-cols-2 gap-md">
      {[
        { id: 'starter', name: 'Starter', price: '$0 / month' },
        { id: 'team', name: 'Team', price: '$12 / seat' },
      ].map((p) => (
        <label
          key={p.id}
          className={`flex cursor-pointer items-start justify-between gap-md rounded-surface border-(length:--border-width-default) bg-surface-base p-lg has-[input:focus-visible]:shadow-focus-default ${plan === p.id ? 'border-border-brand' : 'border-border-subtle'}`}
        >
          <span className="flex flex-col gap-xxs">
            <span className="type-body-sm-semibold text-text-primary">{p.name}</span>
            <span className="type-body-sm-regular text-text-tertiary">{p.price}</span>
          </span>
          <Radio size="md" name="plan" value={p.id} checked={plan === p.id} onCheckedChange={() => setPlan(p.id)} parentFocus />
        </label>
      ))}
    </div>
  );
}

export default defineDoc({
  id: '2.8',
  name: 'Radio',
  level: 'parts',
  spec: 'parts/2.8-radio.md',
  exports: ['Radio'],
  summary: 'Radios let people pick exactly one option from a short list they can see all at once. This page covers the control itself; a Choice field (3.3) adds labels, groups and option cards.',
  hero: () => <Radio size="md" defaultChecked aria-label="Example radio" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'sm' },
      { name: 'checked', figma: 'Checked', control: { type: 'boolean' }, default: true },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <Radio {...(a as any)} aria-label="Example" />,
    code: (a) => `<Radio name="plan" value="team"${jsxProps(a, { size: 'sm', disabled: false })} />`,
  },
  examples: [
    {
      title: 'Billing period',
      caption: 'One option is always checked, so people can see the current choice at a glance.',
      render: () => (
        <fieldset className="flex flex-col gap-md">
          <legend className="type-body-sm-semibold mb-md text-text-primary">Billing period</legend>
          <Row label="Monthly"><Radio name="period" value="monthly" /></Row>
          <Row label="Yearly" sub="(save 20%)"><Radio name="period" value="yearly" defaultChecked /></Row>
          <Row label="Lifetime"><Radio name="period" value="lifetime" /></Row>
        </fieldset>
      ),
      code: `<fieldset>
  <legend>Billing period</legend>
  <label><Radio name="period" value="monthly" /> Monthly</label>
  <label><Radio name="period" value="yearly" defaultChecked /> Yearly (save 20%)</label>
  <label><Radio name="period" value="lifetime" /> Lifetime</label>
</fieldset>`,
    },
    {
      title: 'Option cards',
      caption: 'In option cards, the radio still shows the selection, and the brand border backs it up.',
      render: () => <PlanCards />,
      code: `<label className={plan === 'team' ? 'border-border-brand' : 'border-border-subtle'}>
  Team · $12 / seat
  <Radio size="md" name="plan" value="team" checked={plan === 'team'} onCheckedChange={() => setPlan('team')} parentFocus />
</label>`,
    },
    {
      title: 'Table row choice',
      caption: 'People can click anywhere on the row to pick it.',
      render: () => (
        <div role="radiogroup" aria-label="Shipping address" className="w-full max-w-[26rem] overflow-hidden rounded-surface border border-border-subtle bg-surface-base">
          {['12 Harbour Street, Lisbon', '4 Rue des Fleurs, Lyon', '88 King Road, Leeds'].map((a, i) => (
            <label key={a} className="flex cursor-pointer items-center gap-md border-b border-border-subtle px-lg py-md last:border-b-0 is-hover:bg-surface-base-hover">
              <Radio name="address" value={String(i)} defaultChecked={i === 0} />
              <span className="type-body-sm-medium flex-1 text-text-primary">{a}</span>
              {i === 0 && <span className="type-body-xs-regular text-text-tertiary">Default</span>}
            </label>
          ))}
        </div>
      ),
      code: `<label className="flex items-center gap-md px-lg py-md">
  <Radio name="address" value="home" defaultChecked />
  12 Harbour Street, Lisbon
</label>`,
    },
  ],
  whenToUse: {
    use: ['Picking one option out of two to seven, when it helps to compare them side by side.'],
    dont: ['For longer lists, use a Select (3.5).', 'When people can pick several, use a Checkbox (2.7).', 'For a single on/off setting, use a Switch (2.9).'],
  },
  matrices: [
    {
      title: 'Radio',
      rows: 'Size × Checked',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Size · Checked"
          rows={ROWS}
          colProp="State"
          cols={STATES}
          cell={(row, state) => {
            const [s, c] = row.split(' · ') as [(typeof SIZES)[number], string];
            return <Radio size={s} checked={c === 'true'} forceState={state === 'hover' || state === 'focus' ? state : undefined} disabled={state === 'disabled'} aria-label={`${s} ${c} ${state}`} />;
          }}
        />
      ),
    },
    {
      title: 'Checkbox and Radio',
      rows: 'Size',
      columns: 'Control',
      render: () => (
        <Matrix
          rowProp="Size"
          rows={SIZES}
          colProp="Control"
          cols={['Checkbox off', 'Checkbox on', 'Radio off', 'Radio on'] as const}
          cell={(s, c) =>
            c.startsWith('Checkbox') ? <Checkbox size={s} checked={c.endsWith('on')} aria-label={c} /> : <Radio size={s} checked={c.endsWith('on')} aria-label={c} />
          }
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex scale-[2] items-center gap-xl">
        <Radio size="md" checked aria-label="Checked" />
        <Radio size="md" checked={false} aria-label="Unchecked" />
      </div>
    ),
    parts: [
      { name: 'Root (ring)', target: 'ring', description: 'The round ring, 16 or 20px depending on the size, the same as the checkbox. A real radio input sits on top of it.', tokens: ['radio/size/sm', 'radio/size/md', 'radius/full', 'border/width/default'] },
      { name: 'Dot', target: 'dot', description: 'The dot in the center of the ring. It appears only when the radio is checked.', tokens: ['size/indicator/xs', 'size/indicator/sm', 'color/icon/on-solid'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'sm'", description: 'Sets the size of the ring and the dot.' },
    { name: 'checked', figma: 'Checked', type: 'boolean', description: 'The controlled value. For an uncontrolled group, leave it out and use defaultChecked.' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'Called with true when this option becomes checked.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Disables the native input.' },
    { name: 'name, value …', type: 'InputHTMLAttributes', description: 'Radios that share a name form one group, with arrow-key navigation and a single selection.' },
    { name: 'parentFocus', type: 'boolean', default: 'false', description: 'Lets the parent row or card draw the focus ring instead of the radio.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'For documentation only. Pins the hover or focus look.' },
  ],
  tokens: [
    'color/surface/base', 'color/fill/brand/subtle', 'color/fill/neutral/subtle/disabled',
    'color/border/strong', 'color/border/brand', 'color/border/disabled',
    'color/fill/brand/solid', 'color/fill/brand/solid/hover', 'color/icon/on-solid', 'color/icon/disabled',
    'radio/size/sm', 'radio/size/md', 'size/indicator/xs', 'size/indicator/sm', 'radius/full', 'border/width/default', 'size/touch-min', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Keep one option checked',
      body: 'A radio group always has one option checked, so start with a sensible default. Picking an option clears the previous one. If people can choose several together, use checkboxes instead.',
      do: { caption: 'One option checked by default.', render: () => <div className="flex flex-col gap-sm"><Row label="Standard shipping"><Radio name="g-ship" defaultChecked /></Row><Row label="Express"><Radio name="g-ship" /></Row></div> },
      dont: { caption: 'Two radios checked in the same group.', render: () => <div className="flex flex-col gap-sm"><Row label="Standard shipping"><Radio checked /></Row><Row label="Express"><Radio checked /></Row></div> },
    },
    {
      title: 'Checked and focused look different',
      body: 'The dot shows which option is checked, and the outer ring shows where keyboard focus is. They can appear together, but the focus ring never means selected.',
      render: () => (
        <div className="flex gap-2xl">
          {[
            { l: 'Unchecked', c: false },
            { l: 'Checked', c: true },
            { l: 'Focused, unchecked', c: false, f: true },
            { l: 'Focused, checked', c: true, f: true },
          ].map((x) => (
            <div key={x.l} className="flex flex-col items-center gap-sm">
              <Radio size="md" checked={x.c} forceState={x.f ? 'focus' : undefined} aria-label={x.l} />
              <span className="type-body-xs-regular text-text-tertiary">{x.l}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Radio, select, checkbox or switch',
      body: 'Use radios when people should see every option at once, from two to seven. For longer lists, use a Select (3.5). A checkbox would suggest people can pick several, and a switch only covers on and off.',
      render: () => (
        <div className="flex flex-wrap gap-3xl">
          <div className="flex flex-col gap-sm">
            <Row label="Monthly"><Radio name="g-cmp" /></Row>
            <Row label="Yearly"><Radio name="g-cmp" defaultChecked /></Row>
            <Row label="Lifetime"><Radio name="g-cmp" /></Row>
          </div>
          <div className="flex flex-col gap-sm">
            <Row label="Monthly"><Checkbox /></Row>
            <label className="flex items-center gap-md"><span className="type-body-sm-regular text-text-primary">Yearly</span><Switch size="sm" /></label>
            <span className="type-body-xs-regular text-text-tertiary">Not for a single choice</span>
          </div>
        </div>
      ),
      dont: { caption: 'A lone radio. For a single statement, use a checkbox.', render: () => <Row label="Subscribe to updates"><Radio /></Row> },
    },
    {
      title: 'Maintenance',
      body: 'Radios and checkboxes share their fill, border and focus tokens. Change them once to update both, including every radio inside a Choice field (3.3).',
    },
  ],
  accessibility: [
    'These are real radio inputs. Tab moves into and out of the group, and the arrow keys move the selection within it.',
    'Each group has a label (a fieldset legend, or aria-label on a radiogroup) that screen readers announce with each option.',
    'The dot shows the selection, so it doesn’t rely on color alone. The unchecked ring meets 3:1 non-text contrast.',
    'The round focus ring (focus/default) is always visible and looks different from the checked state.',
  ],
});
