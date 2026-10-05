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
const longList: SelectOption[] = [
  ...selectSampleOptions,
  { value: 'drew', label: 'Drew Cano', supportingText: '@drew' },
  { value: 'orlando', label: 'Orlando Diggs', supportingText: '@orlando' },
];
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
    'Select lets people pick one option from a list that’s too long to show at once. Multi-select lets them pick several, shown as removable tags, with search to find options quickly.',
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
      caption: 'Use a select when the list is long, like timezones, or when each option needs a cue, like a status dot.',
      render: settingsForm,
      code: `<Select label="Timezone" placeholder="Select a timezone" options={timezones} defaultValue="Central European Time (UTC+01:00)" />
<Select label="Status" type="dot" options={['Active', 'Paused', 'Archived']} defaultValue="Active" />
<Button label="Save" />`,
    },
    {
      title: 'Assign reviewers',
      caption: 'When people pick several reviewers, each choice becomes a tag and the list stays open until they’re done.',
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
      caption: 'Small selects work well as filters above a table. Each one shows the kind of value it filters by.',
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
      'Picking one value from more than about five options, or when space is tight.',
      'Picking several values from a long list, with search to narrow it down (Multi-select).',
    ],
    dont: [
      'For five or fewer options that should all stay visible, use radios in a Choice field (3.3).',
      'For actions rather than values, use a Menu (3.6).',
      'For a value people type freely, use a Text field (3.2).',
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
      specimenRole: 'listbox' as const,
      rows: 'Size',
      columns: 'State → Selected',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One row in a select list. Every row in a list uses the same type, so the text lines up on one left edge.</p>
          <Matrix rowProp="Size" rows={SIZES} colProp="State · Selected" cols={ROW_COLS} cell={(size, col) => rowCell(size, col, type)} />
        </div>
      ),
    })),
    {
      title: '.Main/Multi-select option',
      specimenRole: 'listbox',
      rows: 'Size',
      columns: 'State → Selected',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One row in a multi-select list. Its Checkbox (2.7) follows the row’s state.</p>
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
          <p className="type-body-sm-regular text-text-secondary">The trigger for the tags type and for Multi-select. It uses the Text control’s tokens directly, because a Text control instance can’t hold tags.</p>
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
          <p className="type-body-sm-regular text-text-secondary">A 4px-wide thumb with no rail, set slightly in from the list edge. It appears once the list grows past its maximum height.</p>
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
        <div className="flex flex-col gap-3xl">
          <Select className={W} label="Team member" hint="This is a hint text to help the user." options={people} value="olivia" />
          <MultiSelect className={W} label="Reviewers" options={reviewers} defaultValues={['olivia', 'phoenix']} />
        </div>
        <div className="min-h-[24rem]">
          {/* Eight options: more than select/list/max-height holds, so the list scrolls and shows its scroll bar. */}
          <Select className={W} type="avatar" label="Team member" options={longList} value="olivia" open inlinePopup />
        </div>
      </div>
    ),
    parts: [
      { name: 'Label', target: 'label', description: 'A Label (2.11) that names the field. It can show a required marker and a help icon, and is smaller on the small size.', tokens: ['type/body/sm/medium'] },
      { name: 'Trigger', target: 'root', description: 'The field people click to open the list, built on the Text control (2.10). The search type adds a search icon and ⌘K; tags and Multi-select use the tag box. It’s 36, 40 or 44 px tall, by size.', tokens: ['size/control/md', 'text-control/padding-x/md', 'radius/control', 'color/border/default'] },
      { name: 'Help text', target: 'help-text', description: 'Help text (2.12) below the trigger. It matches the label’s size and the field’s status, and hides while the list is open.', tokens: ['color/text/tertiary', 'color/text/danger'] },
      { name: 'List', target: 'list', description: 'Opens just below the trigger, at the same width. It grows up to 320 px tall, then scrolls.', tokens: ['color/surface/raised', 'color/border/subtle', 'radius/surface', 'elevation/overlay', 'select/list/max-height', 'space/xs'] },
      { name: 'Option', target: 'option', description: 'One choice in the list: an optional leading visual, the text, optional supporting text and a check on the selected option. Long text ends in an ellipsis.', tokens: ['radius/control', 'color/fill/neutral/subtle/hover', 'color/icon/brand'] },
      { name: 'Leading visual', target: 'leading-visual', description: 'An icon, an Avatar (2.6) or a status dot. It sits in a fixed-size box, so the text starts on the same edge whichever you use.', tokens: ['size/icon/md', 'size/avatar/xs', 'size/indicator/sm', 'color/icon/success'] },
      { name: 'Tag box', target: 'tag-box', description: 'Holds the chosen values as small removable Tags (2.5), the search text and the chevron. Tags wrap onto new lines as people add more.', tokens: ['tag/height/sm', 'space/sm'] },
      { name: 'Scroll bar', target: 'scroll-bar', description: 'A 4px-wide thumb with no rail. It shows only when the list scrolls.', tokens: ['color/fill/neutral/track', 'radius/full'] },
    ],
  },
  props: [
    { name: 'label', figma: 'Show label + Label', type: 'ReactNode', description: 'The label above the trigger. Without one, pass an aria-label so the trigger still has a name.' },
    { name: 'hint', figma: 'Show hint + Hint', type: 'ReactNode', description: 'Help text below the trigger. When the status is invalid, it holds the error message.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the trigger height and the option rows. The label and help text follow: sm uses sm, md and lg use md.' },
    { name: 'type', figma: 'Type', type: "'default' | 'icon' | 'avatar' | 'dot' | 'search' | 'tags'", default: "'default'", description: 'Select only: what the trigger and options show. search filters as people type; tags shows the value as a Tag.' },
    { name: 'status', figma: 'Status', type: "'none' | 'invalid'", default: "'none'", description: 'invalid shows a danger border and danger help text, and sets aria-invalid.' },
    { name: 'options', type: '(SelectOption | string)[]', default: 'sample people', description: 'Each option is { value, label, supportingText?, icon?, avatar?, disabled? }. A plain string is shorthand for value = label.' },
    { name: 'value / defaultValue / onValueChange', figma: 'Filled (derived)', type: 'string | null', description: 'Select only: the chosen option. The Figma Filled property follows from it.' },
    { name: 'values / defaultValues / onValuesChange', figma: 'Filled (derived)', type: 'string[]', description: 'MultiSelect only: the chosen options, shown as removable tags.' },
    { name: 'open / defaultOpen / onOpenChange', figma: 'Open', type: 'boolean', default: 'false', description: 'Whether the list is open. Leave out open for an uncontrolled list.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Takes the trigger out of the tab order and stops the list from opening.' },
    { name: 'placeholder', type: 'string', default: "'Select an option' · 'Search'", description: 'Tells people what to choose, like “Select a timezone”.' },
    { name: 'leadingIcon', type: 'IconName', default: "'users/user'", description: 'For the icon type: the icon before the placeholder. The chosen option’s icon replaces it.' },
    { name: 'defaultQuery / onQueryChange', figma: 'Show empty state (derived)', type: 'string', description: 'The search text for search, tags and MultiSelect. When nothing matches, the empty state shows.' },
    { name: 'emptyText', type: '(query) => ReactNode', default: '“No results for “{query}””', description: 'The message shown when no option matches.' },
    { name: 'required', type: 'boolean', description: 'Adds the required marker to the label and aria-required to the trigger.' },
    { name: 'showLabelHelpIcon / labelHelpText', type: 'boolean · ReactNode', description: 'Shows a help icon on the label, and the text of its tooltip.' },
    { name: 'name', type: 'string', description: 'The form field name. Hidden inputs submit the chosen value or values.' },
    { name: 'inlinePopup', type: 'boolean', default: 'false', description: 'Places the open list in the page flow instead of floating it, like the Figma Open variant. For documentation and static layouts.' },
    { name: 'forceState', type: "'focus'", description: 'Documentation only: shows the focus state (Figma State=focus).' },
    { name: '…trigger attributes', type: 'HTMLAttributes', description: 'id, aria-*, data-*, tabIndex and event handlers go to the trigger. className goes to the field.' },
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
      body: 'Use a select to pick a value from a long list, and radios when there are only a few options to show. If the choice runs an action instead of setting a value, use a Menu (3.6).',
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
      body: 'The list opens just below the trigger and matches its width, so it reads as part of the field rather than a separate panel.',
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
      title: 'Keep option text aligned',
      body: 'Icons, avatars and status dots all sit in the same fixed-size box, so the text starts on the same edge in every list.',
      render: () => (
        <div role="listbox" aria-label="Option types" className={`flex flex-col py-xs ${W} ${selectListSurface}`}>
          {OPTION_TYPES.map((t) => (
            <SelectOptionRow key={t} type={t} text={`Type=${t}`} avatar={{ initials: 'OR' }} />
          ))}
        </div>
      ),
    },
    {
      title: 'Long selected values',
      body: 'A long single value ends in an ellipsis. Tags wrap onto new lines instead, and the field grows taller to fit them.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <Select className="w-[15rem]" label="Project" options={['Customer onboarding redesign for enterprise accounts']} value="Customer onboarding redesign for enterprise accounts" />
          <MultiSelect className={W} label="Reviewers" options={[...reviewers, { value: 'drew', label: 'Drew Cano' }]} values={['olivia', 'phoenix', 'lana', 'demi', 'candice', 'natali', 'drew']} />
        </div>
      ),
    },
    {
      title: 'Search and empty state',
      body: 'As people type, the list narrows and picks out the matching part of each option in the primary text color. When nothing matches, the list says so.',
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
      title: 'Errors',
      body: 'When people leave a required select empty, show the invalid status and use the help text to say what to do, like “Choose a timezone.”',
      render: () => <Select className={W} label="Timezone" required status="invalid" hint="Choose a timezone." options={timezones} placeholder="Select a timezone" />,
    },
    {
      title: 'Content',
      body: 'Use the placeholder to say what to choose, like “Select a timezone”. Put options in an order people expect: alphabetical, most used first, or a natural order such as days of the week. Keep labels short and unique.',
    },
    {
      title: 'Open the list under the trigger',
      body: 'Keep the list attached to its field, so people can see which field they’re choosing for.',
      do: {
        caption: 'The list opens right below the trigger, at the same width.',
        render: () => (
          <div className="min-h-[18rem]">
            <Select className="w-[15rem]" aria-label="Team member" options={people.slice(0, 3)} value="olivia" open inlinePopup />
          </div>
        ),
      },
      dont: {
        caption: 'A detached list floating away from its field.',
        render: () => (
          <div className="flex items-start gap-2xl">
            <Select className="w-[12rem]" aria-label="Team member" options={people} value="olivia" />
            <div role="listbox" aria-label="Team member" className={`mt-4xl flex w-[10rem] flex-col py-xs ${selectListSurface}`}>
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
      body: 'Build every row from the Select option part (.Main/Select option), so states, padding and alignment match in every list.',
      do: {
        caption: 'Rows built from the option part.',
        render: () => (
          <div role="listbox" aria-label="Team member" className={`flex w-[14rem] flex-col py-xs ${selectListSurface}`}>
            {people.slice(0, 3).map((p) => (
              <SelectOptionRow key={p.value} size="sm" type="avatar" text={p.label} avatar={{ initials: p.label.split(' ').map((w) => w[0]).join('') }} selected={p.value === 'olivia'} />
            ))}
          </div>
        ),
      },
      dont: {
        caption: 'Hand-made rows with uneven padding and no states.',
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
      title: 'Use checkboxes for several choices',
      body: 'Checkboxes tell people they can pick more than one. Single-select rows suggest only one choice, so keep those for a select.',
      do: {
        caption: 'Checkbox rows for picking several reviewers.',
        render: () => (
          <div role="listbox" aria-multiselectable aria-label="Reviewers" className={`flex w-[14rem] flex-col py-xs ${selectListSurface}`}>
            {people.slice(0, 3).map((p, i) => (
              <MultiSelectOptionRow key={p.value} size="sm" text={p.label} selected={i < 2} />
            ))}
          </div>
        ),
      },
      dont: {
        caption: 'Single-select rows used to pick several values.',
        render: () => (
          <div role="listbox" aria-label="Reviewers" className={`flex w-[14rem] flex-col py-xs ${selectListSurface}`}>
            {people.slice(0, 3).map((p, i) => (
              <SelectOptionRow key={p.value} size="sm" text={p.label} selected={i < 2} />
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Let tags wrap',
      body: 'Let the tag box wrap and grow taller, so every chosen value stays readable.',
      do: { caption: 'Tags wrap onto a second line.', render: () => <MultiSelect className="w-[16rem]" aria-label="Reviewers" options={reviewers} values={['olivia', 'phoenix', 'lana', 'demi']} /> },
      dont: {
        caption: 'Chosen values cut off at the edge.',
        render: () => (
          <div className="w-[16rem] [&_.flex-wrap]:flex-nowrap [&_.flex-wrap]:overflow-hidden">
            <MultiSelect aria-label="Reviewers" options={reviewers} values={['olivia', 'phoenix', 'lana', 'demi']} />
          </div>
        ),
      },
    },
    {
      title: 'Maintenance',
      body: 'The trigger’s look comes from the Text control (2.10). Option rows, the tag box and the scroll bar are private parts of this component. The list surface shares its tokens with the Menu (3.6), so changing them updates both.',
    },
  ],
  accessibility: [
    'Screen readers announce the label together with the chosen value (aria-labelledby). The trigger is a combobox with aria-expanded and aria-controls.',
    'Enter, Space or Down opens the list, and Up opens it on the last option. Arrow keys, Home, End, Page Up and Page Down move through it, and typing jumps to a match. Enter chooses; Escape closes the list and keeps focus on the trigger.',
    'Focus stays on the trigger while people move through the list. The active option is set with aria-activedescendant and shows the hover style.',
    'In a multi-select, each tag’s remove button has its own name, like “Remove Olivia Rhye”. Backspace in an empty search removes the last tag.',
    'Screen readers announce selected options (aria-selected). The check or checkbox shows the selection without relying on color.',
    'Clicking or tapping outside the list, or pressing Tab, closes it.',
  ],
});
