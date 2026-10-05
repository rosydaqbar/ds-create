import { useState } from 'react';
import { Badge } from '@/components/parts/Badge';
import { Button } from '@/components/parts/Button';
import { Link } from '@/components/parts/Link';
import { Tag, type TagSize, type TagType } from '@/components/parts/Tag';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md', 'lg'] as const;
const TYPES = ['text', 'removable', 'count'] as const;
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const;
const ROWS = TYPES.flatMap((t) => SIZES.map((s) => `${t} · ${s}`));

const variant = (type: TagType, size: TagSize, state: (typeof STATES)[number]) => (
  <Tag
    type={type}
    size={size}
    label="Label"
    count="5"
    showDot
    onClick={type === 'removable' ? undefined : () => {}}
    forceState={state === 'hover' || state === 'focus' ? state : undefined}
    disabled={state === 'disabled'}
  />
);

function AppliedFilters() {
  const [filters, setFilters] = useState(['Status: Active', 'Owner: Me', 'Q3']);
  return (
    <div className="flex flex-wrap items-center gap-sm">
      {filters.map((f) => (
        <Tag key={f} type="removable" label={f} onRemove={() => setFilters((xs) => xs.filter((x) => x !== f))} />
      ))}
      {filters.length ? (
        <Link href="#" tone="neutral" size="sm" label="Clear all" onClick={(e) => { e.preventDefault(); setFilters([]); }} />
      ) : (
        <Link href="#" tone="neutral" size="sm" label="Reset filters" onClick={(e) => { e.preventDefault(); setFilters(['Status: Active', 'Owner: Me', 'Q3']); }} />
      )}
    </div>
  );
}

function MultiValueInput() {
  const [people, setPeople] = useState([{ n: 'Olivia', i: 'OR' }, { n: 'Lana', i: 'LS' }]);
  return (
    <label className="flex w-full max-w-[24rem] flex-wrap items-center gap-xs rounded-control border border-border-default bg-surface-base px-sm py-xs shadow-control has-[input:focus-visible]:border-border-brand has-[input:focus-visible]:shadow-focus-default">
      {people.map((p) => (
        <Tag key={p.n} size="sm" type="removable" label={p.n} avatar={{ initials: p.i }} onRemove={() => setPeople((xs) => xs.filter((x) => x !== p))} />
      ))}
      <input aria-label="Add people" placeholder="Add people…" className="type-body-md-regular min-w-[6rem] flex-1 bg-fill-none px-xs py-xxs text-text-primary outline-none placeholder:text-text-placeholder" />
    </label>
  );
}

export default defineDoc({
  id: '2.5',
  name: 'Tag',
  level: 'parts',
  spec: 'parts/2.5-tag.md',
  exports: ['Tag'],
  summary:
    'Compact interactive values. Text, removable and count types, an optional checkbox for selectable tags, and optional dot, flag or avatar before the text. Three sizes and four states.',
  hero: () => <Tag size="md" type="removable" label="Design" showDot />,
  playground: {
    controls: [
      { name: 'label', figma: 'Label', control: { type: 'text' }, default: 'Label' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'text' },
      { name: 'count', figma: 'Count', control: { type: 'text' }, default: '5' },
      { name: 'showCheckbox', figma: 'Show checkbox', control: { type: 'boolean' }, default: false },
      { name: 'showDot', figma: 'Show dot', control: { type: 'boolean' }, default: false },
      { name: 'flag', figma: 'Show flag + Flag', control: { type: 'text' }, default: '' },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <Tag {...(a as any)} flag={a.flag || undefined} />,
    code: (a) => `<Tag${jsxProps(a, { size: 'md', type: 'text', count: a.type === 'count' ? undefined : a.count, showCheckbox: false, showDot: false, disabled: false })} />`,
  },
  examples: [
    {
      title: 'Applied filters',
      caption: 'Removable tags show what is applied and how to remove it.',
      render: () => <AppliedFilters />,
      code: `{filters.map((f) => (
  <Tag key={f} type="removable" label={f} onRemove={() => remove(f)} />
))}
<Link href="#" tone="neutral" size="sm" label="Clear all" onClick={clearAll} />`,
    },
    {
      title: 'Multi-value input',
      caption: 'Inside a field, tags wrap and the field grows.',
      render: () => <MultiValueInput />,
      code: `<Tag size="sm" type="removable" label="Olivia" avatar={{ src: olivia.photo, initials: 'OR' }} onRemove={() => remove('olivia')} />
<Tag size="sm" type="removable" label="Lana" avatar={{ src: lana.photo, initials: 'LS' }} onRemove={() => remove('lana')} />`,
    },
    {
      title: 'Topic list with counts',
      caption: 'Count tags show how many items each value holds.',
      render: () => (
        <div className="flex flex-wrap gap-sm">
          <Tag type="count" label="Design" count="12" onClick={() => {}} />
          <Tag type="count" label="Research" count="4" onClick={() => {}} />
          <Tag type="count" label="Engineering" count="27" onClick={() => {}} />
        </div>
      ),
      code: `<Tag type="count" label="Design" count="12" onClick={() => filter('design')} />
<Tag type="count" label="Research" count="4" onClick={() => filter('research')} />
<Tag type="count" label="Engineering" count="27" onClick={() => filter('engineering')} />`,
    },
    {
      title: 'Selectable interests',
      caption: 'Selectable tags work like checkboxes in a compact form.',
      render: () => (
        <fieldset className="flex flex-wrap gap-sm">
          <legend className="sr-only">Interests</legend>
          {['Product', 'Design', 'Data', 'Marketing'].map((l, i) => (
            <Tag key={l} showCheckbox label={l} defaultChecked={i < 2} name="interests" value={l.toLowerCase()} />
          ))}
        </fieldset>
      ),
      code: `<fieldset>
  <legend>Interests</legend>
  <Tag showCheckbox label="Product" name="interests" value="product" defaultChecked />
  <Tag showCheckbox label="Design" name="interests" value="design" defaultChecked />
  <Tag showCheckbox label="Data" name="interests" value="data" />
</fieldset>`,
    },
  ],
  whenToUse: {
    use: ['Values the user adds, removes, filters by or selects.', 'Multiple values inside a field (people, labels, recipients).'],
    dont: ['Read-only labels — use a Badge (2.4).', 'Actions — use a Button (2.1).', 'Navigation — use a Link (2.3).'],
  },
  matrices: [
    {
      title: 'Tag',
      rows: 'Type × Size',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Type · Size"
          rows={ROWS}
          colProp="State"
          cols={STATES}
          cell={(row, state) => {
            const [t, s] = row.split(' · ') as [TagType, TagSize];
            return variant(t, s, state);
          }}
        />
      ),
    },
    {
      title: 'Content options',
      rows: 'Leading visual × Type',
      columns: 'Checkbox',
      render: () => (
        <Matrix
          rowProp="Leading visual · Type"
          rows={(['none', 'dot', 'flag', 'avatar'] as const).flatMap((v) => TYPES.map((t) => `${v} · ${t}`))}
          colProp="Checkbox"
          cols={['off', 'unchecked', 'checked'] as const}
          cell={(row, c) => {
            const [v, t] = row.split(' · ') as ['none' | 'dot' | 'flag' | 'avatar', TagType];
            return (
              <Tag
                type={t}
                label={v === 'flag' ? 'France' : v === 'avatar' ? 'Olivia' : 'Label'}
                showDot={v === 'dot'}
                flag={v === 'flag' ? 'fr' : undefined}
                avatar={v === 'avatar' ? { initials: 'OR' } : undefined}
                showCheckbox={c !== 'off'}
                checked={c === 'off' ? undefined : c === 'checked'}
              />
            );
          }}
        />
      ),
    },
    {
      title: '.Main/Tag close and .Main/Tag count',
      rows: 'Size',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Size"
          rows={SIZES}
          colProp="State"
          cols={['rest', 'hover', 'focus', 'count'] as const}
          cell={(size, s) =>
            s === 'count' ? (
              <Tag size={size} type="count" label="Label" count="5" />
            ) : (
              <Tag size={size} type="removable" label="Label" forceState={s === 'rest' ? undefined : s} />
            )
          }
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex scale-150 flex-col items-center gap-lg">
        <Tag size="md" type="removable" label="Olivia" showCheckbox checked avatar={{ initials: 'OR' }} />
        <Tag size="md" type="count" label="Design" count="12" showDot />
      </div>
    ),
    parts: [
      { name: 'Root', description: 'Horizontal, Hug, fixed height tag/height/{size}. Padding-x space/md · tag/padding-x/md · space/lg; trailing side tightens to tag/padding-x-tight/{size} with a close or count. Gap space/xs (sm) or space/sm. radius/sm, border/width/default.', tokens: ['tag/height/md', 'tag/padding-x/md', 'tag/padding-x-tight/md', 'radius/sm'] },
      { name: 'Checkbox', description: 'Optional (Show checkbox): 2.7 Checkbox, Size=sm at every tag size. The whole tag is the hit target.', tokens: ['checkbox/size/sm'] },
      { name: 'Leading visual', description: 'One at a time: dot (size/indicator/xs, sm at lg), flag or avatar (2.6, Size=2xs).', tokens: ['size/indicator/xs', 'size/avatar/2xs'] },
      { name: 'Label', description: 'Single line, the semantic centre. type/body/xs/medium (sm) or type/body/sm/medium (md, lg).', tokens: ['type/body/sm/medium'] },
      { name: 'Close / Count', description: 'Type=removable: .Main/Tag close (x at size/icon/xs, sm at lg; padding space/xxs; radius/xs). Type=count: .Main/Tag count (type/body/xs/medium, padding 0 space/xs, radius/xs).', tokens: ['space/xxs', 'radius/xs', 'type/body/xs/medium'] },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', default: "'Label'", description: 'Visible text.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height 24 · 28 · 32, padding, label style and part sizes.' },
    { name: 'type', figma: 'Type', type: "'text' | 'removable' | 'count'", default: "'text'", description: 'Trailing element: none, close or count. Never both.' },
    { name: 'count', figma: 'Count', type: 'ReactNode', default: "'5'", description: 'Count value (type="count").' },
    { name: 'showCheckbox', figma: 'Show checkbox', type: 'boolean', default: 'false', description: 'Leading 2.7 Checkbox; the tag becomes a label around it.' },
    { name: 'checked', figma: 'Checkbox › Checked (exposed)', type: 'boolean', description: 'Controlled selection. Use defaultChecked for uncontrolled.' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'Selection change.' },
    { name: 'showDot', figma: 'Show dot', type: 'boolean', default: 'false', description: 'Leading dot (color/icon/success).' },
    { name: 'flag', figma: 'Show flag + Flag', type: 'string', description: 'ISO country code; renders the 1.8 Flag asset.' },
    { name: 'avatar', figma: 'Show avatar', type: '{ src?: string; initials?: string }', description: 'Leading 2.6 Avatar, Size=2xs.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Disabled tokens; close and checkbox disabled.' },
    { name: 'onRemove', type: '() => void', description: 'Called by the close (type="removable").' },
    { name: 'removeLabel', type: 'string', default: '"Remove {label}"', description: 'Accessible name of the close.' },
    { name: 'onClick', type: '() => void', description: 'Text and count tags: renders the tag as a button.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'Documentation only: pins a pseudo-state (focus lands on the close for removable tags).' },
  ],
  tokens: [
    'color/surface/base', 'color/surface/base/hover', 'color/fill/neutral/subtle/disabled', 'color/border/default', 'color/border/disabled',
    'color/text/secondary', 'color/text/primary', 'color/text/disabled', 'color/icon/success', 'color/icon/tertiary', 'color/icon/secondary', 'color/icon/disabled',
    'color/fill/neutral/subtle/hover', 'color/fill/neutral/subtle',
    'tag/height/sm', 'tag/height/md', 'tag/height/lg', 'tag/padding-x/md', 'tag/padding-x-tight/sm', 'tag/padding-x-tight/md', 'tag/padding-x-tight/lg',
    'space/md', 'space/lg', 'space/sm', 'space/xs', 'space/xxs', 'size/indicator/xs', 'size/indicator/sm', 'size/icon/xs', 'size/icon/sm',
    'radius/sm', 'radius/xs', 'border/width/default', 'type/body/xs/medium', 'type/body/sm/medium', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Tag, Badge, filter control or Button',
      body: 'Tag = a value the user manages. A Badge is read-only; a Button acts.',
      render: () => (
        <div className="flex w-full max-w-[34rem] flex-col gap-lg">
          <div className="flex flex-wrap items-center gap-sm">
            <Tag type="removable" label="Status: Active" />
            <Tag type="removable" label="Owner: Me" />
            <Button size="sm" emphasis="tertiary" leadingIcon="general/plus" label="Add filter" />
          </div>
          <div className="flex items-center justify-between rounded-surface border border-border-subtle bg-surface-base px-lg py-md">
            <span className="type-body-sm-medium text-text-primary">Payment service</span>
            <Badge tone="success" label="Active" showDot />
          </div>
        </div>
      ),
    },
    {
      title: 'Anatomy',
      body: 'Four compositions: text only; removable (optional leading visual, label, close); count (optional leading visual, label, count); selectable (checkbox, optional leading visual, label).',
      render: () => (
        <div className="flex flex-wrap items-center gap-lg">
          <Tag label="Text" />
          <Tag type="removable" label="Removable" showDot />
          <Tag type="count" label="Count" count="8" flag="jp" />
          <Tag showCheckbox defaultChecked label="Selectable" />
        </div>
      ),
    },
    {
      title: 'Removable vs selectable',
      body: 'Removable: the close removes the value from a list or filter; the whole tag is not a button, only the close is. Selectable: the checkbox toggles the value; the whole tag is the hit target.',
      render: () => (
        <div className="flex gap-2xl">
          <span className="rounded-sm outline-(length:--border-width-strong) outline-offset-(--space-xs) outline-dashed outline-border-brand-subtle">
            <Tag type="removable" label="Design" />
          </span>
          <span className="rounded-sm outline-(length:--border-width-strong) outline-offset-(--space-xs) outline-dashed outline-border-brand-subtle">
            <Tag showCheckbox label="Design" />
          </span>
        </div>
      ),
    },
    {
      title: 'Size and interaction of parts',
      body: 'Close and checkbox scale with the tag. Rest, hover, focus and disabled side by side.',
      render: () => (
        <div className="flex flex-col gap-md">
          {(['removable', 'text'] as const).map((t) => (
            <div key={t} className="flex flex-wrap items-center gap-md">
              {STATES.map((s) => (
                <Tag key={s} type={t} showCheckbox={t === 'text'} checked={t === 'text'} label={s} forceState={s === 'hover' || s === 'focus' ? s : undefined} disabled={s === 'disabled'} />
              ))}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Label length and wrapping',
      body: 'Tags stay compact; labels are one to three words. Long labels never force smaller padding or type. In a row, tags wrap to the next line; inside a field, the field grows.',
      do: {
        caption: 'Shortened labels in a wrapping row.',
        render: () => (
          <div className="flex max-w-[16rem] flex-wrap gap-sm">
            {['Billing', 'Enterprise', 'Q3 renewals', 'EMEA'].map((l) => <Tag key={l} type="removable" label={l} />)}
          </div>
        ),
      },
      dont: {
        caption: 'Tiny type to fit a long label.',
        render: () => <span className="type-body-xs-regular inline-flex h-(--tag-height-sm) items-center rounded-sm border border-border-default px-xxs text-text-secondary">Enterprise customers renewing in the third quarter</span>,
      },
    },
    {
      title: 'Supporting visuals',
      body: 'Country flags and avatars support the label; they are never the only meaning. Always show the name next to the flag or avatar.',
      do: { caption: 'Flag and avatar with their names.', render: () => <div className="flex gap-sm"><Tag flag="br" label="Brazil" /><Tag avatar={{ initials: 'DK' }} label="Demi" /></div> },
      dont: { caption: 'A flag or avatar alone without a name.', render: () => <div className="flex gap-sm"><Tag flag="br" label="" /><Tag avatar={{ initials: 'DK' }} label="" /></div> },
    },
    {
      title: 'One trailing action',
      body: 'Type holds the trailing element, so a tag never combines close and count. Tags are not navigation links or primary actions.',
      do: { caption: 'One trailing action.', render: () => <Tag type="removable" label="Design" /> },
      dont: {
        caption: 'Close and count on the same tag.',
        render: () => (
          <span className="type-body-sm-medium inline-flex h-(--tag-height-md) items-center gap-sm rounded-sm border border-border-default bg-surface-base pl-(--tag-padding-x-md) pr-(--tag-padding-x-tight-md) text-text-secondary">
            Design
            <span className="type-body-xs-medium rounded-xs bg-fill-neutral-subtle px-xs">12</span>
            <span className="text-icon-tertiary">×</span>
          </span>
        ),
      },
    },
    {
      title: 'Maintenance',
      body: 'Edit .Main/Tag close, .Main/Tag count or the 2.7 Checkbox to change every tag. Colour changes go through the tokens in the token map.',
    },
  ],
  accessibility: [
    'Removable tags: the close has an accessible name (“Remove Design”), is reachable by keyboard, and reaches size/touch-min on touch platforms.',
    'Selectable tags: a real checkbox inside a label; its state is announced and Space toggles it; the focus ring sits around the whole tag.',
    'Focus is always visible: around the tag (text, count, selectable) or around the close (removable).',
    'Label contrast meets text contrast in every mode.',
  ],
});
