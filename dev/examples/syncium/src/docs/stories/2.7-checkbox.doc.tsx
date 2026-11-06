import { useState, type ReactNode } from 'react';
import { Checkbox } from '@/components/parts/Checkbox';
import { Radio } from '@/components/parts/Radio';
import { Switch } from '@/components/parts/Switch';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md'] as const;
const CHECKED = ['false', 'true', 'mixed'] as const;
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const;
const ROWS = SIZES.flatMap((s) => CHECKED.map((c) => `${s} · ${c}`));
const toChecked = (c: string) => (c === 'mixed' ? 'mixed' : c === 'true');

/** Documentation-only labelled row (3.3 Choice field provides the real one). */
const Row = ({ children, label, indent }: { children: ReactNode; label: string; indent?: boolean }) => (
  <label className={`flex cursor-pointer items-center gap-md ${indent ? 'pl-2xl' : ''}`}>
    {children}
    <span className="type-body-sm-regular text-text-primary">{label}</span>
  </label>
);

function TableSelection() {
  const rows = ['Website refresh', 'Onboarding flow', 'Pricing experiment', 'Billing migration'];
  const [sel, setSel] = useState<string[]>([rows[0], rows[2]]);
  const all = sel.length === rows.length ? true : sel.length ? 'mixed' : false;
  return (
    <div className="w-full max-w-[24rem] overflow-hidden rounded-surface border border-border-subtle bg-surface-base">
      <label className="flex cursor-pointer items-center gap-md border-b border-border-subtle bg-surface-sunken px-lg py-sm">
        <Checkbox checked={all} onCheckedChange={(c) => setSel(c ? rows : [])} aria-label="Select all projects" />
        <span className="type-body-xs-semibold text-text-tertiary">Project</span>
      </label>
      {rows.map((r) => (
        <label key={r} className="flex cursor-pointer items-center gap-md border-b border-border-subtle px-lg py-md last:border-b-0 is-hover:bg-surface-base-hover">
          <Checkbox checked={sel.includes(r)} onCheckedChange={(c) => setSel((s) => (c ? [...s, r] : s.filter((x) => x !== r)))} />
          <span className="type-body-sm-medium text-text-primary">{r}</span>
        </label>
      ))}
    </div>
  );
}

function NestedList() {
  const kids = ['Email', 'Push', 'SMS'];
  const [on, setOn] = useState<string[]>(['Email', 'Push']);
  const parent = on.length === kids.length ? true : on.length ? 'mixed' : false;
  return (
    <div className="flex flex-col gap-md">
      <Row label="All notifications">
        <Checkbox size="md" checked={parent} onCheckedChange={(c) => setOn(c ? kids : [])} />
      </Row>
      {kids.map((k) => (
        <Row key={k} label={k} indent>
          <Checkbox size="md" checked={on.includes(k)} onCheckedChange={(c) => setOn((s) => (c ? [...s, k] : s.filter((x) => x !== k)))} />
        </Row>
      ))}
    </div>
  );
}

export default defineDoc({
  id: '2.7',
  name: 'Checkbox',
  level: 'parts',
  spec: 'parts/2.7-checkbox.md',
  exports: ['Checkbox'],
  summary: 'Checkboxes let people pick any number of options from a set, or confirm a single statement in a form. This page covers the box itself; a Choice field (3.3) adds the label.',
  hero: () => <Checkbox size="md" defaultChecked aria-label="Example checkbox" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'sm' },
      { name: 'checked', figma: 'Checked', control: { type: 'select', options: CHECKED }, default: 'true' },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <Checkbox size={a.size} checked={toChecked(a.checked)} disabled={a.disabled} aria-label="Example" />,
    code: (a) => `<Checkbox${jsxProps({ size: a.size, disabled: a.disabled }, { size: 'sm', disabled: false })} checked={${a.checked === 'mixed' ? "'mixed'" : a.checked}} onCheckedChange={setChecked} />`,
  },
  examples: [
    {
      title: 'Table selection',
      caption: 'The header shows a mixed state when only some rows are selected, and one click selects them all.',
      render: () => <TableSelection />,
      code: `const all = selected.length === rows.length ? true : selected.length ? 'mixed' : false;

<Checkbox checked={all} onCheckedChange={(c) => setSelected(c ? rows : [])} aria-label="Select all projects" />
{rows.map((r) => (
  <label key={r.id}>
    <Checkbox checked={selected.includes(r)} onCheckedChange={(c) => toggle(r, c)} />
    {r.name}
  </label>
))}`,
    },
    {
      title: 'Nested list',
      caption: 'Only the parent can be mixed. Each child is either checked or unchecked.',
      render: () => <NestedList />,
      code: `<Checkbox size="md" checked={parent} onCheckedChange={(c) => setOn(c ? children : [])} /> All notifications
<Checkbox size="md" checked={on.includes('email')} onCheckedChange={…} /> Email`,
    },
    {
      title: 'Filter menu',
      caption: 'In menus and lists, people can click anywhere on the row, not only the box.',
      render: () => (
        <div role="group" aria-label="Filter by status" className="flex w-[14rem] flex-col rounded-surface border border-border-subtle bg-surface-raised p-xs shadow-overlay">
          {['Active', 'Draft', 'Archived', 'Scheduled'].map((l, i) => (
            <label key={l} className="flex cursor-pointer items-center gap-md rounded-control px-md py-sm is-hover:bg-surface-raised-hover">
              <Checkbox defaultChecked={i < 2} />
              <span className="type-body-sm-medium text-text-primary">{l}</span>
            </label>
          ))}
        </div>
      ),
      code: `<label className="flex items-center gap-md px-md py-sm">
  <Checkbox defaultChecked />
  <span>Active</span>
</label>`,
    },
    {
      title: 'Labeled checkbox',
      caption: 'For a checkbox with a label, use a Choice field (3.3). It wraps this box and adds the text.',
      render: () => (
        <Row label="I agree to the terms">
          <Checkbox size="md" />
        </Row>
      ),
      code: `<label className="flex items-center gap-md">
  <Checkbox size="md" name="terms" required />
  I agree to the terms
</label>`,
    },
  ],
  whenToUse: {
    use: ['Picking any number of options from a set.', 'Agreeing to a single statement in a form, like accepting the terms.'],
    dont: ['For one choice among several, use a Radio (2.8).', 'For a setting that applies straight away, use a Switch (2.9).'],
  },
  matrices: [
    {
      title: 'Checkbox',
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
            return <Checkbox size={s} checked={toChecked(c)} forceState={state === 'hover' || state === 'focus' ? state : undefined} disabled={state === 'disabled'} aria-label={`${s} ${c} ${state}`} />;
          }}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex scale-[2] items-center gap-xl">
        <Checkbox size="md" checked aria-label="Checked" />
        <Checkbox size="md" checked="mixed" aria-label="Mixed" />
        <Checkbox size="md" checked={false} aria-label="Unchecked" />
      </div>
    ),
    parts: [
      { name: 'Root (box)', target: 'box', description: 'The square box, 16 or 20px depending on the size. It draws the border, checked fill, focus ring and disabled look, and a real checkbox input sits on top of it.', tokens: ['checkbox/size/sm', 'checkbox/size/md', 'checkbox/radius/sm', 'border/width/default'] },
      { name: 'Mark', target: 'mark', description: 'A check when the box is checked, or a minus when it’s mixed, centered in the box. It disappears when the box is unchecked.', tokens: ['checkbox/mark/sm', 'checkbox/mark/md', 'color/icon/on-solid'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'sm'", description: 'The box size. sm pairs with type/body/sm labels, md with type/body/md labels.' },
    { name: 'checked', figma: 'Checked', type: "boolean | 'mixed'", description: 'The controlled value. Mixed sets the native indeterminate state. Leave it out for an uncontrolled checkbox.' },
    { name: 'defaultChecked', type: "boolean | 'mixed'", description: 'The starting value of an uncontrolled checkbox.' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'Called with the new value. Clicking a mixed box makes it true.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Disables the native input.' },
    { name: 'name, value, required, aria-label …', type: 'InputHTMLAttributes', description: 'Passed to the native input, so the box submits with forms.' },
    { name: 'parentFocus', type: 'boolean', default: 'false', description: 'Lets the parent, such as a tag or a row, draw the focus ring instead of the box.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'For documentation only. Pins the hover or focus look.' },
  ],
  tokens: [
    'color/surface/base', 'color/fill/brand/subtle', 'color/fill/neutral/subtle/disabled',
    'color/border/strong', 'color/border/brand', 'color/border/disabled',
    'color/fill/brand/solid', 'color/fill/brand/solid/hover', 'color/icon/on-solid', 'color/icon/disabled',
    'checkbox/size/sm', 'checkbox/size/md', 'checkbox/radius/sm', 'checkbox/radius/md', 'checkbox/mark/sm', 'checkbox/mark/md',
    'border/width/default', 'size/touch-min', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Checkbox, radio or switch',
      body: 'Use checkboxes when people can pick any number of options, or confirm one statement in a form. Use radios when exactly one option fits, and a switch when the setting applies straight away.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-3">
          <div className="flex flex-col gap-md">
            <span className="type-body-sm-semibold text-text-primary">Notification channels</span>
            <Row label="Email"><Checkbox defaultChecked /></Row>
            <Row label="Push"><Checkbox defaultChecked /></Row>
            <Row label="SMS"><Checkbox /></Row>
          </div>
          <div className="flex flex-col gap-md">
            <span className="type-body-sm-semibold text-text-primary">Billing period</span>
            <Row label="Monthly"><Radio name="g-billing" /></Row>
            <Row label="Yearly"><Radio name="g-billing" defaultChecked /></Row>
          </div>
          <div className="flex flex-col gap-md">
            <span className="type-body-sm-semibold text-text-primary">Appearance</span>
            <label className="flex items-center justify-between gap-md">
              <span className="type-body-sm-regular text-text-primary">Dark mode</span>
              <Switch size="sm" />
            </label>
          </div>
        </div>
      ),
      do: { caption: 'Checkboxes for options people can combine.', render: () => <div className="flex flex-col gap-sm"><Row label="Design"><Checkbox defaultChecked /></Row><Row label="Research"><Checkbox defaultChecked /></Row></div> },
      dont: { caption: 'Checkboxes where only one option fits. Use radios.', render: () => <div className="flex flex-col gap-sm"><Row label="Monthly"><Checkbox /></Row><Row label="Yearly"><Checkbox defaultChecked /></Row></div> },
    },
    {
      title: 'Unchecked, checked and mixed',
      body: 'A parent shows the mixed state when only some of its children are checked. Clicking it checks all of them. People never pick mixed directly; it follows from the children.',
      render: () => <NestedList />,
      dont: { caption: 'A mixed state on a child item.', render: () => <div className="flex flex-col gap-sm"><Row label="All notifications"><Checkbox checked /></Row><Row label="Email" indent><Checkbox checked="mixed" /></Row></div> },
    },
    {
      title: 'Size',
      body: 'Use small checkboxes in dense tables, menus and tags, and medium ones in forms and settings. Keep one size within a list.',
      render: () => (
        <div className="flex gap-3xl">
          <Row label="Small, type/body/sm"><Checkbox size="sm" defaultChecked /></Row>
          <label className="flex items-center gap-md"><Checkbox size="md" defaultChecked /><span className="type-body-md-regular text-text-primary">Medium, type/body/md</span></label>
        </div>
      ),
    },
    {
      title: 'Labels and hit targets',
      body: 'A checkbox almost always needs a visible label, which a Choice field (3.3) adds. Leave the box unlabeled only in tables, where the row or column header names it.\n\nMake the label and the box one target, so a click on either one toggles it.',
      render: () => (
        <label className="flex w-full max-w-[22rem] cursor-pointer items-center gap-md rounded-control px-lg py-md outline-(length:--border-width-strong) outline-offset-(--space-xxs) outline-dashed outline-border-brand-subtle is-hover:bg-surface-base-hover">
          <Checkbox />
          <span className="type-body-sm-medium flex-1 text-text-primary">Quarterly report.pdf</span>
          <span className="type-body-xs-regular text-text-tertiary">2.4 MB</span>
        </label>
      ),
      dont: { caption: 'An unlabeled checkbox outside a table.', render: () => <Checkbox aria-label="Unlabeled" /> },
    },
    {
      title: 'Maintenance',
      body: 'Change the tokens in the token map, or this component, to update every checkbox in the system, including those in tags, menus, tables and choice fields. Radio (2.8) shares the same fill, border and focus tokens, so it updates too.',
      dont: { caption: 'A checkbox that applies a setting straight away, with no submit. Use a switch.' },
    },
  ],
  accessibility: [
    'It’s a real <input type="checkbox">, so Space toggles it and it submits with forms.',
    'The mark shows checked and mixed, so the state doesn’t rely on color alone. Screen readers announce mixed as “mixed” (native indeterminate).',
    'Keyboard users always see the focus ring (focus/default).',
    'The unchecked border (color/border/strong) meets 3:1 non-text contrast against the surface.',
    'On touch screens, an invisible hit area brings a standalone box up to size/touch-min. In rows, the whole row is the target.',
  ],
});
