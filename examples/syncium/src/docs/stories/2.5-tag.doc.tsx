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
    'Tags are compact values people can add, remove, filter by or select. Use them for applied filters, recipients in a field, or a list of topics with counts.',
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
      caption: 'Removable tags show which filters are on, and let people remove each one.',
      render: () => <AppliedFilters />,
      code: `{filters.map((f) => (
  <Tag key={f} type="removable" label={f} onRemove={() => remove(f)} />
))}
<Link href="#" tone="neutral" size="sm" label="Clear all" onClick={clearAll} />`,
    },
    {
      title: 'Multi-value input',
      caption: 'Inside a field, tags wrap onto new lines and the field grows to fit.',
      render: () => <MultiValueInput />,
      code: `<Tag size="sm" type="removable" label="Olivia" avatar={{ src: olivia.photo, initials: 'OR' }} onRemove={() => remove('olivia')} />
<Tag size="sm" type="removable" label="Lana" avatar={{ src: lana.photo, initials: 'LS' }} onRemove={() => remove('lana')} />`,
    },
    {
      title: 'Topic list with counts',
      caption: 'Each count tag shows how many items sit under that topic.',
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
      caption: 'Selectable tags work like a compact set of checkboxes.',
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
    use: ['For values people add, remove, filter by or select.', 'For several values inside one field, like people, labels or recipients.'],
    dont: ['For read-only labels, use a Badge (2.4).', 'For actions, use a Button (2.1).', 'For navigation, use a Link (2.3).'],
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
      <div className="flex scale-[2] flex-col items-center gap-lg">
        <Tag size="md" type="removable" label="Olivia" showCheckbox checked avatar={{ initials: 'OR' }} />
        <Tag size="md" type="count" label="Design" count="12" showDot />
      </div>
    ),
    parts: [
      { name: 'Root', target: 'root', description: 'The container fits its content at a fixed height set by the size. The padding tightens on the trailing side when there’s a close or count.', tokens: ['tag/height/md', 'tag/padding-x/md', 'tag/padding-x-tight/md', 'radius/sm'] },
      { name: 'Checkbox', target: 'box', description: 'An optional small Checkbox (2.7) that stays the same size at every tag size. The whole tag is the click target.', tokens: ['checkbox/size/sm'] },
      { name: 'Leading visual', target: 'leading-visual', description: 'One optional visual before the label: a dot, a flag or an Avatar (2.6).', tokens: ['size/indicator/xs', 'size/avatar/2xs'] },
      { name: 'Label', target: 'label', description: 'One line of text that carries the tag’s meaning. Medium and large tags use a larger text style.', tokens: ['type/body/sm/medium'] },
      { name: 'Close / Count', target: 'close', description: 'Removable tags end with an x button that removes the value. Count tags end with a small number instead.', tokens: ['space/xxs', 'radius/xs', 'type/body/xs/medium'] },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', default: "'Label'", description: 'The visible text.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the height (24 · 28 · 32), padding, label style and the size of inner parts.' },
    { name: 'type', figma: 'Type', type: "'text' | 'removable' | 'count'", default: "'text'", description: 'Chooses the trailing element: none, a close button or a count. A tag never has both.' },
    { name: 'count', figma: 'Count', type: 'ReactNode', default: "'5'", description: 'The count value, shown when type="count".' },
    { name: 'showCheckbox', figma: 'Show checkbox', type: 'boolean', default: 'false', description: 'Adds a Checkbox (2.7) before the label and turns the tag into a label wrapped around it.' },
    { name: 'checked', figma: 'Checkbox › Checked (exposed)', type: 'boolean', description: 'Controlled selection. Use defaultChecked for uncontrolled.' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'Called when the selection changes.' },
    { name: 'showDot', figma: 'Show dot', type: 'boolean', default: 'false', description: 'Adds a dot before the label (color/icon/success).' },
    { name: 'flag', figma: 'Show flag + Flag', type: 'string', description: 'ISO country code. Renders the matching Flag (1.8) asset.' },
    { name: 'avatar', figma: 'Show avatar', type: '{ src?: string; initials?: string }', description: 'Adds an Avatar (2.6) at the 2xs size before the label.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Applies the disabled style and disables the close button and checkbox.' },
    { name: 'onRemove', type: '() => void', description: 'Called when the close button is pressed (type="removable").' },
    { name: 'removeLabel', type: 'string', default: '"Remove {label}"', description: 'Accessible name of the close button.' },
    { name: 'onClick', type: '() => void', description: 'For text and count tags. Renders the tag as a button.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'For documentation only. Pins a hover or focus state (on removable tags, focus lands on the close button).' },
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
      title: 'Tag, badge or button',
      body: 'Use a tag for a value people manage, like an applied filter. A badge is read-only, and a button performs an action, like adding a filter.',
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
      title: 'Four kinds of tag',
      body: 'A tag can be plain text, removable, a count or selectable. Removable and count tags can start with a dot, flag or avatar, and end with a close or a number. Selectable tags start with a checkbox, before any leading visual.',
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
      title: 'Removable or selectable',
      body: 'In a removable tag, only the close button is interactive. It removes the value from a list or filter.\n\nIn a selectable tag, the whole tag is the click target and toggles the checkbox.',
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
      title: 'Parts scale with the tag',
      body: 'The close button grows with the tag, while the checkbox stays small at every size. The rows below show rest, hover, focus and disabled side by side.',
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
      title: 'Keep labels short',
      body: 'Tags stay compact, with labels of one to three words. A long label never gets smaller padding or type to fit.\n\nIn a row, tags wrap to the next line. Inside a field, the field grows.',
      do: {
        caption: 'Short labels in a wrapping row.',
        render: () => (
          <div className="flex max-w-[16rem] flex-wrap gap-sm">
            {['Billing', 'Enterprise', 'Q3 renewals', 'EMEA'].map((l) => <Tag key={l} type="removable" label={l} />)}
          </div>
        ),
      },
      dont: {
        caption: 'Tiny type squeezed in to fit a long label.',
        render: () => <span className="type-body-xs-regular inline-flex h-(--tag-height-sm) items-center rounded-sm border border-border-default px-xxs text-text-secondary">Enterprise customers renewing in the third quarter</span>,
      },
    },
    {
      title: 'Pair flags and avatars with a name',
      body: 'Flags and avatars support the label, but they can’t carry the meaning on their own. Show the name next to them every time.',
      do: { caption: 'A flag and an avatar, each with a name.', render: () => <div className="flex gap-sm"><Tag flag="br" label="Brazil" /><Tag avatar={{ initials: 'DK' }} label="Demi" /></div> },
      dont: { caption: 'A flag or avatar with no name.', render: () => <div className="flex gap-sm"><Tag flag="br" label="" /><Tag avatar={{ initials: 'DK' }} label="" /></div> },
    },
    {
      title: 'One trailing action',
      body: 'The type decides the trailing element, so a tag never combines a close button and a count. Tags aren’t for navigation or primary actions.',
      do: { caption: 'One trailing action.', render: () => <Tag type="removable" label="Design" /> },
      dont: {
        caption: 'A close button and a count on the same tag.',
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
      title: 'Change tags in one place',
      body: 'To change every tag at once, edit .Main/Tag close, .Main/Tag count or the Checkbox (2.7). Change colors through the tokens in the token map.',
    },
  ],
  accessibility: [
    'In removable tags, the close button has its own name (“Remove Design”), works from the keyboard, and gets a tap area of at least size/touch-min on touch screens.',
    'Selectable tags use a real checkbox inside a label. Screen readers announce its state, Space toggles it, and the focus ring wraps the whole tag.',
    'Focus is always visible: around the tag for text, count and selectable tags, and around the close button for removable ones.',
    'Label text meets text contrast in every mode.',
  ],
});
