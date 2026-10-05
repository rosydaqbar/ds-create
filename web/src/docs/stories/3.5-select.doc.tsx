import { Menu } from '@/components/components/Menu';
import { MultiSelect, Select, selectSampleOptions, selectTypes, type SelectOption, type SelectSize, type SelectType } from '@/components/components/Select';
import { MultiSelectOptionRow, SelectOptionRow, SelectScrollBar, SelectTagBox, selectListSurface, type SelectOptionType } from '@/components/components/_SelectParts';
import { ChoiceField } from '@/components/components/ChoiceField';
import { Badge } from '@/components/parts/Badge';
import { Button } from '@/components/parts/Button';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';
import { DemoCard } from './_demo';

const SIZES = ['sm', 'md', 'lg'] as const;
const LOOKS = ['placeholder', 'filled', 'focus', 'open', 'disabled', 'placeholder · invalid', 'filled · invalid', 'focus · invalid'] as const;
const MULTI_LOOKS = ['placeholder', 'filled', 'focus', 'open · empty', 'open · chosen', 'disabled'] as const;
const OPTION_TYPES: SelectOptionType[] = ['default', 'icon', 'avatar', 'dot'];
const ROW_COLS = ['rest · false', 'rest · true', 'hover · false', 'hover · true', 'disabled · false', 'disabled · true'] as const;
const W = 'w-(--size-width-xxs)';

const people: SelectOption[] = selectSampleOptions.slice(0, 5);
const reviewers: SelectOption[] = selectSampleOptions.map(({ value, label }) => ({ value, label }));
const timezones = ['Pacific Time (UTC−08:00)', 'Eastern Time (UTC−05:00)', 'Greenwich Mean Time (UTC+00:00)', 'Central European Time (UTC+01:00)', 'India Standard Time (UTC+05:30)', 'Japan Standard Time (UTC+09:00)'];
const statuses = ['Active', 'Paused', 'Archived'];
const manyOptions: SelectOption[] = Array.from({ length: 14 }, (_, i) => ({ value: `opt-${i}`, label: `Option ${i + 1}` }));
const noop = () => {};

/** One Select variant: look → value, State, Open, Status. */
const selectLook = (type: SelectType, size: SelectSize, look: (typeof LOOKS)[number]) => {
  const invalid = look.endsWith('invalid');
  const filled = look.startsWith('filled') || look.startsWith('focus') || look === 'open';
  return (
    <Select
      className={W}
      size={size}
      type={type}
      label="Team member"
      hint={invalid ? 'Choose a team member.' : 'This is a hint text to help the user.'}
      options={people}
      value={filled ? 'olivia' : null}
      status={invalid ? 'invalid' : 'none'}
      forceState={look.startsWith('focus') ? 'focus' : undefined}
      open={look === 'open'}
      disabled={look === 'disabled'}
      inlinePopup
    />
  );
};

const multiLook = (size: SelectSize, look: (typeof MULTI_LOOKS)[number]) => (
  <MultiSelect
    className={W}
    size={size}
    label="Reviewers"
    hint="This is a hint text to help the user."
    options={reviewers}
    values={look === 'filled' || look === 'focus' || look === 'open · chosen' ? ['olivia', 'phoenix', 'lana'] : []}
    forceState={look === 'focus' ? 'focus' : undefined}
    open={look.startsWith('open')}
    disabled={look === 'disabled'}
    inlinePopup
  />
);

const rowCell = (size: SelectSize, col: (typeof ROW_COLS)[number], type?: SelectOptionType) => {
  const [state, selected] = col.split(' · ');
  const common = { size, selected: selected === 'true', disabled: state === 'disabled', forceState: state === 'hover' ? ('hover' as const) : undefined };
  return (
    <div className="w-[15rem]">
      {type ? (
        <SelectOptionRow {...common} type={type} text="Olivia Rhye" avatar={{ initials: 'OR' }} />
      ) : (
        <MultiSelectOptionRow {...common} text="Design" />
      )}
    </div>
  );
};

const settingsForm = () => (
  <DemoCard className="w-[26rem]">
    <div className="flex flex-col gap-xxs">
      <span className="type-body-md-semibold text-text-primary">Regional settings</span>
      <span className="type-body-sm-regular text-text-tertiary">Used for dates, reminders and reports.</span>
    </div>
    <Select label="Timezone" options={timezones} defaultValue="Central European Time (UTC+01:00)" placeholder="Select a timezone" />
    <Select label="Status" type="dot" options={statuses} defaultValue="Active" />
    <div className="flex justify-end">
      <Button label="Save" />
    </div>
  </DemoCard>
);

export default defineDoc({
  id: '3.5',
  name: 'Select',
  level: 'components',
  spec: 'components/3.5-select.md',
  exports: ['Select', 'MultiSelect'],
  summary:
    'Pick one value from a list that may be long. The field opens a list directly under the trigger; options can show an icon, avatar or status dot, and the list scrolls when it is long. Multi-select picks several values: chosen values appear as removable tags in the field; options use checkboxes and the list can be searched, with an empty state when nothing matches.',
  hero: () => (
    <div className="flex min-h-[26rem] items-start">
      <Select className={W} size="md" type="avatar" label="Team member" options={people} defaultValue="olivia" defaultOpen inlinePopup />
    </div>
  ),
  playground: {
    controls: [
      { name: 'label', figma: 'Show label + Label', control: { type: 'text' }, default: 'Team member' },
      { name: 'hint', figma: 'Show hint + Hint', control: { type: 'text' }, default: 'This is a hint text to help the user.' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: selectTypes }, default: 'default' },
      { name: 'status', figma: 'Status', control: { type: 'select', options: ['none', 'invalid'] }, default: 'none' },
      { name: 'filled', figma: 'Filled (from the value)', control: { type: 'boolean' }, default: false },
      { name: 'open', figma: 'Open', control: { type: 'boolean' }, default: false },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
      { name: 'longList', figma: 'Show scroll bar (from a long list)', control: { type: 'boolean' }, default: false },
    ],
    render: ({ filled, open, longList, ...a }) => (
      <div className="flex min-h-[24rem] items-start">
        <Select
          key={`${a.type}-${filled}-${open}-${longList}`}
          {...a}
          className={W}
          options={longList ? [...people, ...manyOptions] : people}
          defaultValue={filled ? 'olivia' : null}
          defaultOpen={open}
          inlinePopup
        />
      </div>
    ),
    code: ({ filled, open, longList, ...a }) =>
      `<Select${jsxProps(a, { size: 'md', type: 'default', status: 'none', disabled: false })}${filled ? ' defaultValue="olivia"' : ''}${open ? ' defaultOpen' : ''}
  options={${longList ? 'longList' : 'people'}}
/>`,
  },
  examples: [
    {
      title: 'Settings form',
      caption: 'Long option lists in a form: a timezone, and a status with its dot.',
      render: settingsForm,
      code: `<Select label="Timezone" placeholder="Select a timezone" options={timezones} defaultValue="Central European Time (UTC+01:00)" />
<Select label="Status" type="dot" options={['Active', 'Paused', 'Archived']} defaultValue="Active" />
<Button label="Save" />`,
    },
    {
      title: 'Assign reviewers',
      caption: 'Several people at once: chosen values become tags, the list stays open while people pick.',
      render: () => (
        <div className="flex min-h-[25rem] items-start">
          <MultiSelect className={W} label="Reviewers" options={reviewers} defaultValues={['olivia', 'phoenix', 'lana']} defaultOpen inlinePopup />
        </div>
      ),
      code: `<MultiSelect
  label="Reviewers"
  options={people}
  values={reviewers}
  onValuesChange={setReviewers}
/>`,
    },
    {
      title: 'Filter bar',
      caption: 'Small Selects side by side above a table; each shows the kind of value it filters by.',
      stage: 'full',
      render: () => (
        <div className="flex w-full max-w-[48rem] flex-col gap-lg">
          <div className="flex flex-wrap gap-md">
            <Select size="sm" type="dot" aria-label="Status" options={statuses} placeholder="Status" className="w-[10rem]" />
            <Select size="sm" type="avatar" aria-label="Owner" options={people} placeholder="Owner" className="w-[12rem]" />
            <Select
              size="sm"
              type="icon"
              aria-label="Type"
              leadingIcon="files/file"
              options={[
                { value: 'doc', label: 'Document', icon: 'files/file-text' },
                { value: 'sheet', label: 'Spreadsheet', icon: 'layout/table' },
                { value: 'deck', label: 'Presentation', icon: 'charts/chart-column' },
              ]}
              placeholder="Type"
              className="w-[11rem]"
            />
          </div>
          <div className="overflow-hidden rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-base">
            {[
              ['Q3 roadmap', 'Olivia Rhye', 'Active'],
              ['Pricing review', 'Phoenix Baker', 'Paused'],
              ['Launch checklist', 'Lana Steiner', 'Active'],
            ].map(([name, owner, status], i) => (
              <div key={name} className={`grid grid-cols-3 items-center gap-lg px-xl py-md type-body-sm-regular text-text-secondary ${i ? 'border-t-(length:--border-width-default) border-border-subtle' : ''}`}>
                <span className="type-body-sm-medium text-text-primary">{name}</span>
                <span>{owner}</span>
                <span>
                  <Badge tone={status === 'Active' ? 'success' : 'neutral'} label={status} showDot />
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
      code: `<div className="flex gap-md">
  <Select size="sm" type="dot" aria-label="Status" placeholder="Status" options={statuses} />
  <Select size="sm" type="avatar" aria-label="Owner" placeholder="Owner" options={people} />
  <Select size="sm" type="icon" aria-label="Type" placeholder="Type" leadingIcon="files/file" options={fileTypes} />
</div>`,
    },
  ],
  whenToUse: {
    use: [
      'Choosing one value from more than about five options, or when space is tight.',
      'Multi-select: choosing several values from a long list, with search.',
    ],
    dont: [
      'Five or fewer options that should all stay visible — use Radios in a Choice field (3.3).',
      'Actions rather than values — use a Menu (3.6).',
      'A free value people type — use a Text field (3.2).',
    ],
  },
  matrices: [
    ...selectTypes.map((type) => ({
      title: `Select · Type=${type}`,
      rows: 'Size',
      columns: 'Look (Filled · State · Open · Status)',
      render: () => <Matrix rowProp="Size" rows={SIZES} colProp="Look" cols={LOOKS} cell={(size, look) => <div className="self-start">{selectLook(type, size, look)}</div>} className="[&_.grid]:items-start" />,
    })),
    {
      title: 'Multi-select',
      rows: 'Size',
      columns: 'Look (Filled · State · Open)',
      render: () => (
        <div className="flex min-w-0 flex-col gap-xl">
          <Matrix rowProp="Size" rows={SIZES} colProp="Look" cols={MULTI_LOOKS} cell={(size, look) => multiLook(size, look)} className="[&_.grid]:items-start" />
          <div className="flex flex-col gap-sm">
            <span className="type-body-sm-semibold text-text-primary">Show empty state=true</span>
            <MultiSelect className={W} label="Reviewers" hint="This is a hint text to help the user." options={reviewers} values={[]} defaultQuery="des" open inlinePopup />
          </div>
        </div>
      ),
    },
  ],
  privateParts: [
    ...OPTION_TYPES.map((type) => ({
      title: `.Main/Select option · Type=${type}`,
      rows: 'Size',
      columns: 'State → Selected',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One row of a Select list. A list uses one Type for all its rows; the text keeps one left edge.</p>
          <Matrix rowProp="Size" rows={SIZES} colProp="State · Selected" cols={ROW_COLS} cell={(size, col) => rowCell(size, col, type)} />
        </div>
      ),
    })),
    {
      title: '.Main/Multi-select option',
      rows: 'Size',
      columns: 'State → Selected',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One row of a Multi-select list: a Checkbox (2.7) that follows the row’s state.</p>
          <Matrix rowProp="Size" rows={SIZES} colProp="State · Selected" cols={ROW_COLS} cell={(size, col) => rowCell(size, col)} />
        </div>
      ),
    },
    {
      title: '.Main/Select tag box',
      rows: 'Size',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The trigger of Type=tags and Multi-select. Binds the Text control’s tokens because a Text control instance cannot hold Tags.</p>
          <Matrix
            rowProp="Size"
            rows={SIZES}
            colProp="State"
            cols={['rest', 'focus', 'disabled'] as const}
            cell={(size, state) => (
              <div className={W}>
                <SelectTagBox
                  size={size}
                  disabled={state === 'disabled'}
                  forceState={state === 'focus' ? 'focus' : undefined}
                  tags={[
                    { key: 'a', label: 'Olivia Rhye' },
                    { key: 'b', label: 'Phoenix Baker' },
                  ]}
                  onRemove={noop}
                  inputProps={{ 'aria-label': 'Search', readOnly: true }}
                />
              </div>
            )}
          />
        </div>
      ),
    },
    {
      title: '.Main/Select scroll bar',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">A 4-wide thumb with no rail, inset space/xs from the list edge. It appears when the list is longer than select/list/max-height.</p>
          <div className={`relative h-40 w-24 ${selectListSurface}`}>
            <SelectScrollBar thumb={{ top: 0.15, size: 0.4, overflow: true }} />
          </div>
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-wrap items-start justify-center gap-4xl">
        <Select className={W} label="Team member" hint="This is a hint text to help the user." options={people} value="olivia" />
        <div className="min-h-[24rem]">
          <Select className={W} type="avatar" label="Team member" options={people} value="olivia" open inlinePopup />
        </div>
      </div>
    ),
    parts: [
      { name: 'Label', description: 'Label (2.11): sm for Size=sm, md for md and lg. Required marker and help icon exposed.', tokens: ['type/body/sm/medium'] },
      { name: 'Trigger', description: 'Text control (2.10) Type=select (Type=search: single-line with a search icon and ⌘K); tags and Multi-select use the tag box. Heights 36 / 40 / 44.', tokens: ['size/control/md', 'text-control/padding-x/md', 'radius/control', 'color/border/default'] },
      { name: 'Help text', description: 'Help text (2.12) under the trigger, same Size as the Label, Status as the field. Hidden while the list is open.', tokens: ['color/text/tertiary', 'color/text/danger'] },
      { name: 'List', description: 'space/xs under the trigger, the trigger’s width, padding-y space/xs, max height select/list/max-height (320); then it scrolls.', tokens: ['color/surface/raised', 'color/border/subtle', 'radius/surface', 'elevation/overlay', 'select/list/max-height', 'space/xs'] },
      { name: 'Option', description: '.Main/Select option: outer inset space/xxs × space/sm; content padding space/sm–md × space/md–lg, radius/control; leading visual, text (fills, truncates), supporting text, check.', tokens: ['radius/control', 'color/fill/neutral/subtle/hover', 'color/icon/brand'] },
      { name: 'Leading visual', description: 'Icon (size/icon/md), Avatar (2.6) xs or a status dot, in a fixed avatar-xs box so the text keeps one edge.', tokens: ['size/icon/md', 'size/avatar/xs', 'size/indicator/sm', 'color/icon/success'] },
      { name: 'Tag box', description: '.Main/Select tag box: removable Tags (2.5, sm) that wrap, the typing text and the chevron; Text control tokens.', tokens: ['tag/height/sm', 'space/sm'] },
      { name: 'Scroll bar', description: '.Main/Select scroll bar: 4-wide thumb, no rail, inset space/xs.', tokens: ['color/fill/neutral/track', 'radius/full'] },
    ],
  },
  props: [
    { name: 'label', figma: 'Show label + Label', type: 'ReactNode', description: 'Label above the trigger. Without it, give the trigger an aria-label.' },
    { name: 'hint', figma: 'Show hint + Hint', type: 'ReactNode', description: 'Help text under the trigger; the error message when invalid.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Trigger height and option rows; Label and Help text follow (sm → sm, md / lg → md).' },
    { name: 'type', figma: 'Type', type: "'default' | 'icon' | 'avatar' | 'dot' | 'search' | 'tags'", default: "'default'", description: 'Select: what the trigger and the options show. search filters as people type; tags shows the value as a Tag.' },
    { name: 'status', figma: 'Status', type: "'none' | 'invalid'", default: "'none'", description: 'Danger border and Help text; sets aria-invalid.' },
    { name: 'options', type: '(SelectOption | string)[]', default: 'sample people', description: '{ value, label, supportingText?, icon?, avatar?, disabled? }. Strings are shorthand for value = label.' },
    { name: 'value / defaultValue / onValueChange', figma: 'Filled (derived)', type: 'string | null', description: 'Select: the chosen option. Figma Filled comes from it.' },
    { name: 'values / defaultValues / onValuesChange', figma: 'Filled (derived)', type: 'string[]', description: 'MultiSelect: the chosen options, shown as removable Tags.' },
    { name: 'open / defaultOpen / onOpenChange', figma: 'Open', type: 'boolean', default: 'false', description: 'The list. Omit `open` for an uncontrolled list.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Not focusable; the list cannot open.' },
    { name: 'placeholder', type: 'string', default: "'Select an option' · 'Search'", description: 'What to choose (“Select a timezone”).' },
    { name: 'leadingIcon', type: 'IconName', default: "'users/user'", description: 'Type=icon: the icon before the placeholder; the chosen option’s icon replaces it.' },
    { name: 'defaultQuery / onQueryChange', figma: 'Show empty state (derived)', type: 'string', description: 'Search text (search, tags, Multi-select). No match shows the empty state.' },
    { name: 'emptyText', type: '(query) => ReactNode', default: '“No results for “{query}””', description: 'Empty-state text.' },
    { name: 'required', type: 'boolean', description: 'Label required marker; aria-required on the trigger.' },
    { name: 'showLabelHelpIcon / labelHelpText', type: 'boolean · ReactNode', description: 'The Label’s help icon and its Tooltip.' },
    { name: 'name', type: 'string', description: 'Form name: hidden inputs carry the chosen value(s).' },
    { name: 'inlinePopup', type: 'boolean', default: 'false', description: 'Lay the open list out in the page flow (the Figma Open variant hugs its list). Documentation and static layouts.' },
    { name: 'forceState', type: "'focus'", description: 'Documentation only: Figma State=focus.' },
    { name: '…trigger attributes', type: 'HTMLAttributes', description: 'id, aria-*, data-*, tabIndex and handlers go to the trigger control; className to the field.' },
  ],
  tokens: [
    'color/surface/raised', 'color/border/subtle', 'radius/surface', 'elevation/overlay', 'select/list/max-height', 'space/xs',
    'color/fill/none', 'color/fill/neutral/subtle/hover', 'color/text/primary', 'color/text/tertiary', 'color/text/disabled', 'color/icon/brand', 'color/icon/success', 'color/icon/tertiary', 'color/icon/disabled',
    'radius/control', 'space/xxs', 'space/sm', 'space/md', 'space/lg', 'type/body/sm/medium', 'type/body/md/medium', 'type/body/sm/regular', 'type/body/md/regular',
    'size/control/sm', 'size/control/md', 'size/control/lg', 'text-control/padding-x/md', 'color/surface/base', 'color/border/default', 'color/border/strong', 'color/border/brand', 'color/border/danger',
    'color/fill/neutral/subtle/disabled', 'color/border/disabled', 'focus/default', 'focus/danger', 'size/avatar/xs', 'size/indicator/sm', 'tag/height/sm', 'color/fill/neutral/track', 'size/width/xxs',
  ],
  guidelines: [
    {
      title: 'Select, radios or menu',
      body: 'A Select is for a value from a long list; radios for a value from a few visible options; a Menu for an action.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <div className="flex flex-col gap-md">
            <Select className="w-[14rem]" label="Timezone" options={timezones} placeholder="Select a timezone" />
            <span className="type-body-xs-regular text-text-tertiary">A value from a long list</span>
          </div>
          <div className="flex flex-col gap-md">
            <span className="type-body-sm-medium text-text-secondary">Plan</span>
            {['Monthly', 'Yearly', 'Lifetime'].map((p, i) => (
              <ChoiceField key={p} type="radio" name="g-plan" value={p} text={p} defaultChecked={i === 0} />
            ))}
            <span className="type-body-xs-regular text-text-tertiary">A value from a few visible options</span>
          </div>
          <div className="flex flex-col gap-md">
            <Menu type="button-simple" />
            <span className="type-body-xs-regular text-text-tertiary">An action</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Trigger and list',
      body: 'The list opens space/xs under the trigger and matches its width. It is part of the field, not a separate panel placed next to it.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <Select className={W} label="Team member" options={people} value="olivia" />
          <div className="min-h-[22rem]">
            <Select className={W} label="Team member" options={people} value="olivia" open inlinePopup />
          </div>
        </div>
      ),
    },
    {
      title: 'Option rows',
      body: 'Leading visuals never move the text: icon, avatar and dot sit in one fixed box, so the text starts on the same edge in every list.',
      render: () => (
        <div className={`flex flex-col py-xs ${W} ${selectListSurface}`}>
          {OPTION_TYPES.map((t) => (
            <SelectOptionRow key={t} type={t} text={`Type=${t}`} avatar={{ initials: 'OR' }} />
          ))}
        </div>
      ),
    },
    {
      title: 'Long selected values',
      body: 'Single values truncate; tags wrap and grow the field down.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <Select className="w-[15rem]" label="Project" options={['Customer onboarding redesign for enterprise accounts']} value="Customer onboarding redesign for enterprise accounts" />
          <MultiSelect className={W} label="Reviewers" options={[...reviewers, { value: 'drew', label: 'Drew Cano' }]} values={['olivia', 'phoenix', 'lana', 'demi', 'candice', 'natali', 'drew']} />
        </div>
      ),
    },
    {
      title: 'Search and empty state',
      body: 'Typing filters the list and shows the matching part of each option in color/text/primary. When nothing matches, the list says so.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <div className="min-h-[14rem]">
            <MultiSelect className={W} label="Reviewers" options={reviewers} values={['phoenix']} defaultQuery="li" open inlinePopup />
          </div>
          <MultiSelect className={W} label="Reviewers" options={reviewers} values={[]} defaultQuery="des" open inlinePopup />
        </div>
      ),
    },
    {
      title: 'Invalid',
      body: 'A required Select left empty shows Status=invalid and says what to do in the Help text.',
      render: () => <Select className={W} label="Timezone" required status="invalid" hint="Choose a timezone." options={timezones} placeholder="Select a timezone" />,
    },
    {
      title: 'Content',
      body: 'Placeholders say what to choose (“Select a timezone”). Order options logically — alphabetical, most used first, or natural order. Keep option labels short and unique.',
    },
    {
      title: 'Open the list under the trigger',
      body: 'The list belongs to its field.',
      do: {
        caption: 'The list opens directly under the trigger at its width.',
        render: () => (
          <div className="min-h-[18rem]">
            <Select className="w-[15rem]" aria-label="Team member" options={people.slice(0, 3)} value="olivia" open inlinePopup />
          </div>
        ),
      },
      dont: {
        caption: 'A detached list floating elsewhere.',
        render: () => (
          <div className="flex items-start gap-2xl">
            <Select className="w-[12rem]" aria-label="Team member" options={people} value="olivia" />
            <div className={`mt-4xl flex w-[10rem] flex-col py-xs ${selectListSurface}`}>
              {people.slice(0, 3).map((p) => (
                <SelectOptionRow key={p.value} size="sm" text={p.label} selected={p.value === 'olivia'} />
              ))}
            </div>
          </div>
        ),
      },
    },
    {
      title: 'Build rows from the option parts',
      body: 'Rows come from .Main/Select option, so states, padding and alignment stay the same everywhere.',
      do: {
        caption: 'Option part rows.',
        render: () => (
          <div className={`flex w-[14rem] flex-col py-xs ${selectListSurface}`}>
            {people.slice(0, 3).map((p) => (
              <SelectOptionRow key={p.value} size="sm" type="avatar" text={p.label} avatar={{ initials: p.label.split(' ').map((w) => w[0]).join('') }} selected={p.value === 'olivia'} />
            ))}
          </div>
        ),
      },
      dont: {
        caption: 'Rows typed by hand: uneven padding, no states.',
        render: () => (
          <div className={`flex w-[14rem] flex-col gap-xs p-sm ${selectListSurface}`}>
            {people.slice(0, 3).map((p, i) => (
              <span key={p.value} className={`type-body-sm-regular text-text-secondary ${i === 1 ? 'ps-lg' : ''}`}>
                {p.label}
              </span>
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Checkboxes in a Multi-select',
      body: 'Multiple choices need checkboxes; single-select rows tell people they can pick one.',
      do: {
        caption: 'Multi-select option rows.',
        render: () => (
          <div className={`flex w-[14rem] flex-col py-xs ${selectListSurface}`}>
            {people.slice(0, 3).map((p, i) => (
              <MultiSelectOptionRow key={p.value} size="sm" text={p.label} selected={i < 2} />
            ))}
          </div>
        ),
      },
      dont: {
        caption: 'Single-select rows used for several values.',
        render: () => (
          <div className={`flex w-[14rem] flex-col py-xs ${selectListSurface}`}>
            {people.slice(0, 3).map((p, i) => (
              <SelectOptionRow key={p.value} size="sm" text={p.label} selected={i < 2} />
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Let tags wrap',
      body: 'Chosen values stay readable: the tag box wraps and grows down.',
      do: { caption: 'Tags wrap onto a second line.', render: () => <MultiSelect className="w-[16rem]" aria-label="Reviewers" options={reviewers} values={['olivia', 'phoenix', 'lana', 'demi']} /> },
      dont: {
        caption: 'Chosen values clipped at the edge.',
        render: () => (
          <div className="w-[16rem] [&_.flex-wrap]:flex-nowrap [&_.flex-wrap]:overflow-hidden">
            <MultiSelect aria-label="Reviewers" options={reviewers} values={['olivia', 'phoenix', 'lana', 'demi']} />
          </div>
        ),
      },
    },
    {
      title: 'Maintenance',
      body: 'Trigger looks come from the Text control (2.10); option rows, tag box and scroll bar live in .Main here; the list surface tokens are shared with Menu (3.6).',
    },
  ],
  accessibility: [
    'The Label names the select (aria-labelledby); the chosen value is announced with it. The trigger is a combobox with aria-expanded and aria-controls.',
    'Enter, Space or Down opens the list; Up opens it on the last option; arrow keys, Home, End and Page keys move; Enter chooses; Escape closes and focus stays on the trigger; typing jumps to matching options.',
    'Focus never leaves the trigger: the active option is aria-activedescendant and shows the hover look.',
    'In a Multi-select each tag’s remove button has a name (“Remove Olivia Rhye”), and Backspace in the empty search removes the last tag.',
    'Selected options are announced (aria-selected); the check and the checkbox give a non-colour cue.',
    'A press outside or Tab closes the list.',
  ],
});
