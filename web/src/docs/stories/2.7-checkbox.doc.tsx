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
  summary: 'The checkbox box. Two sizes, unchecked, checked and mixed, four states. Its marks are aligned optically to the box; labels are added by 3.3 Choice field.',
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
      caption: 'The header checkbox is mixed when only some rows are selected.',
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
      caption: 'Mixed belongs to the parent; children are only checked or unchecked.',
      render: () => <NestedList />,
      code: `<Checkbox size="md" checked={parent} onCheckedChange={(c) => setOn(c ? children : [])} /> All notifications
<Checkbox size="md" checked={on.includes('email')} onCheckedChange={…} /> Email`,
    },
    {
      title: 'Filter menu',
      caption: 'In menus and lists, the row is the hit target, not only the box.',
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
      title: 'Labelled checkbox',
      caption: 'Labels come from Choice field; the box stays this Part.',
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
    use: ['Multiple selection from a set.', 'A single yes/no statement submitted with a form.'],
    dont: ['One choice among several — use Radio (2.8).', 'Settings that apply immediately — use Switch (2.9).'],
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
      { name: 'Root (box)', description: 'Fixed square checkbox/size/{size} (16 · 20), radius checkbox/radius/{size}, border/width/default. Owns shape, border, checked fill, focus ring and disabled treatment. A real input covers it.', tokens: ['checkbox/size/sm', 'checkbox/size/md', 'checkbox/radius/sm', 'border/width/default'] },
      { name: 'Mark', description: 'Icon general/check (Checked=true) or general/minus (Checked=mixed), checkbox/mark/{size} (12 · 14), centred. Absent when unchecked.', tokens: ['checkbox/mark/sm', 'checkbox/mark/md', 'color/icon/on-solid'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'sm'", description: 'sm pairs with type/body/sm labels, md with type/body/md.' },
    { name: 'checked', figma: 'Checked', type: "boolean | 'mixed'", description: 'Controlled value; mixed sets the native indeterminate state. Omit for uncontrolled.' },
    { name: 'defaultChecked', type: "boolean | 'mixed'", description: 'Uncontrolled initial value.' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'New value; a mixed box becomes true.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Native disabled input.' },
    { name: 'name, value, required, aria-label …', type: 'InputHTMLAttributes', description: 'Native input attributes; the box submits with forms.' },
    { name: 'parentFocus', type: 'boolean', default: 'false', description: 'The parent (a Tag, a row) draws the focus ring instead of the box.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'Documentation only: pins a pseudo-state.' },
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
      title: 'Checkbox, Radio or Switch',
      body: 'Checkbox for any number of choices or a single confirmation submitted with a form. Radio for exactly one of several. Switch for a setting that applies immediately.',
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
      do: { caption: 'Checkbox for multiple choices.', render: () => <div className="flex flex-col gap-sm"><Row label="Design"><Checkbox defaultChecked /></Row><Row label="Research"><Checkbox defaultChecked /></Row></div> },
      dont: { caption: 'Checkbox for a single choice among several (use Radio).', render: () => <div className="flex flex-col gap-sm"><Row label="Monthly"><Checkbox /></Row><Row label="Yearly"><Checkbox defaultChecked /></Row></div> },
    },
    {
      title: 'Unchecked, checked and mixed',
      body: 'Mixed (partly checked) only appears on a parent whose children are partly checked. Clicking a mixed parent checks all children. Mixed is never an end-state a user picks directly.',
      render: () => <NestedList />,
      dont: { caption: 'Mixed on a child item.', render: () => <div className="flex flex-col gap-sm"><Row label="All notifications"><Checkbox checked /></Row><Row label="Email" indent><Checkbox checked="mixed" /></Row></div> },
    },
    {
      title: 'Size',
      body: 'sm in dense tables, menus and tags; md in forms and settings. One size per list.',
      render: () => (
        <div className="flex gap-3xl">
          <Row label="Small, type/body/sm"><Checkbox size="sm" defaultChecked /></Row>
          <label className="flex items-center gap-md"><Checkbox size="md" defaultChecked /><span className="type-body-md-regular text-text-primary">Medium, type/body/md</span></label>
        </div>
      ),
    },
    {
      title: 'Labels and hit targets',
      body: 'In product, a checkbox almost always has a visible label (3.3 Choice field); an unlabelled box is only acceptable when the row or column header labels it (tables). The label and the box are one hit target.',
      render: () => (
        <label className="flex w-full max-w-[22rem] cursor-pointer items-center gap-md rounded-control px-lg py-md outline-(length:--border-width-strong) outline-offset-(--space-xxs) outline-dashed outline-border-brand-subtle is-hover:bg-surface-base-hover">
          <Checkbox />
          <span className="type-body-sm-medium flex-1 text-text-primary">Quarterly report.pdf</span>
          <span className="type-body-xs-regular text-text-tertiary">2.4 MB</span>
        </label>
      ),
      dont: { caption: 'An unlabelled checkbox outside tables.', render: () => <Checkbox aria-label="Unlabelled" /> },
    },
    {
      title: 'Maintenance',
      body: 'Edit the tokens in the token map or this component to change every checkbox in the system, including those inside tags, menus, tables and Choice fields. 2.8 Radio uses the same fill, border and focus tokens.',
      dont: { caption: 'A checkbox that applies a setting immediately without a submit (use Switch).' },
    },
  ],
  accessibility: [
    'A real `<input type="checkbox">`: Space toggles it and it submits with forms.',
    'Checked and mixed are shown by the mark, not by colour alone; mixed is announced as “mixed” (native indeterminate).',
    'Focus ring (focus/default) is always visible.',
    'The unchecked border (color/border/strong) meets the non-text contrast threshold (3:1) against the surface.',
    'On its own, the box reaches size/touch-min on touch platforms through an invisible hit area; in rows the whole row is the target.',
  ],
});
