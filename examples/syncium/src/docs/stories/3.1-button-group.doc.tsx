import { useState } from 'react';
import { ButtonGroup, type ButtonGroupItemData } from '@/components/components/ButtonGroup';
import { ButtonGroupItemPart } from '@/components/components/_ButtonGroupItem';
import { Button } from '@/components/parts/Button';
import { Tooltip } from '@/components/parts/Tooltip';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md'] as const;
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const;
const ICON_ONLY = ['false', 'true'] as const;
const ITEM_ROWS = SIZES.flatMap((s) => ICON_ONLY.flatMap((i) => [`${s} · ${i} · false`, `${s} · ${i} · true`]));

const views: ButtonGroupItemData[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];
const formatting: ButtonGroupItemData[] = [
  { value: 'bold', label: 'Bold', leadingIcon: 'editor/bold' },
  { value: 'italic', label: 'Italic', leadingIcon: 'editor/italic' },
  { value: 'underline', label: 'Underline', leadingIcon: 'editor/underline' },
];
const generic = (iconOnly: boolean): ButtonGroupItemData[] =>
  ['Button', 'Button', 'Button'].map((l, i) => ({ value: String(i), label: iconOnly ? `Button ${i + 1}` : l, leadingIcon: iconOnly ? 'general/placeholder' : undefined }));

function CalendarHeader() {
  const [view, setView] = useState('week');
  return (
    <div className="flex w-full max-w-[30rem] items-center justify-between gap-lg rounded-surface border border-border-subtle bg-surface-base p-lg">
      <span className="type-body-md-semibold text-text-primary">March 2026</span>
      <ButtonGroup aria-label="Calendar view" items={views} value={view} onValueChange={setView} />
    </div>
  );
}

function EditorToolbar() {
  const [on, setOn] = useState<Record<string, boolean>>({ bold: true, italic: false, underline: false });
  return (
    <div className="flex w-full max-w-[30rem] flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-base">
      <div className="flex items-center gap-md border-b border-border-subtle p-md">
        <ButtonGroup
          behavior="toolbar"
          aria-label="Text formatting"
          size="sm"
          iconOnly
          items={formatting.map((f) => ({ ...f, selected: on[f.value] }))}
          onItemClick={(v) => setOn((o) => ({ ...o, [v]: !o[v] }))}
          renderItem={(it, node) => <Tooltip text={it.label}>{node}</Tooltip>}
        />
      </div>
      <p className="type-body-md-regular p-lg text-text-secondary">
        <strong className="text-text-primary">Release notes.</strong> The editor keeps formatting toggles in one connected toolbar.
      </p>
    </div>
  );
}

function ListFilter() {
  const [f, setF] = useState('all');
  return (
    <div className="flex w-full max-w-[30rem] flex-col gap-md">
      <ButtonGroup
        aria-label="Project status"
        className="self-start"
        size="sm"
        value={f}
        onValueChange={setF}
        items={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active', showDot: true },
          { value: 'archived', label: 'Archived' },
        ]}
      />
      <div className="flex flex-col rounded-surface border border-border-subtle bg-surface-base">
        {['Website redesign', 'Mobile app', 'Billing migration'].map((p, i) => (
          <div key={p} className="type-body-sm-regular flex justify-between border-b border-border-subtle px-lg py-md text-text-secondary last:border-b-0">
            <span className="text-text-primary">{p}</span>
            <span>{i === 2 ? 'Archived' : 'Active'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default defineDoc({
  id: '3.1',
  name: 'Button group',
  level: 'components',
  spec: 'components/3.1-button-group.md',
  exports: ['ButtonGroup'],
  summary:
    'Button groups join two to five related options into one connected control. Use them for compact view switchers and formatting toolbars.',
  hero: () => <ButtonGroup aria-label="Example" items={views} defaultValue="day" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'iconOnly', figma: 'Icon only', control: { type: 'boolean' }, default: false },
      { name: 'behavior', control: { type: 'select', options: ['switcher', 'toolbar'] }, default: 'switcher' },
      { name: 'leadingIcons', figma: 'Item › Show leading icon', control: { type: 'boolean' }, default: false },
      { name: 'showDot', figma: 'Item 2 › Show dot', control: { type: 'boolean' }, default: false },
      { name: 'disabledLast', figma: 'Item 3 › State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: ({ leadingIcons, showDot, disabledLast, ...a }) => (
      <ButtonGroup
        key={a.behavior}
        aria-label="Playground"
        {...a}
        items={formatting.map((f, i) => ({
          value: f.value,
          label: a.iconOnly ? f.label : ['Day', 'Week', 'Month'][i],
          leadingIcon: leadingIcons || a.iconOnly ? f.leadingIcon : undefined,
          showDot: showDot && i === 1,
          disabled: disabledLast && i === 2,
        }))}
      />
    ),
    code: ({ leadingIcons, showDot, disabledLast, ...a }) =>
      `<ButtonGroup${jsxProps(a, { size: 'md', iconOnly: false, behavior: 'switcher' })}
  aria-label="Calendar view"
  items={[
    { value: 'day', label: '${a.iconOnly ? 'Bold' : 'Day'}'${leadingIcons || a.iconOnly ? ", leadingIcon: 'editor/bold'" : ''} },
    { value: 'week', label: '${a.iconOnly ? 'Italic' : 'Week'}'${leadingIcons || a.iconOnly ? ", leadingIcon: 'editor/italic'" : ''}${showDot ? ', showDot: true' : ''} },
    { value: 'month', label: '${a.iconOnly ? 'Underline' : 'Month'}'${leadingIcons || a.iconOnly ? ", leadingIcon: 'editor/underline'" : ''}${disabledLast ? ', disabled: true' : ''} },
  ]}
/>`,
  },
  examples: [
    {
      title: 'Calendar view switcher',
      caption: 'One segment is always selected, so it’s clear which view is showing. Arrow keys move between Day, Week and Month.',
      render: () => <CalendarHeader />,
      code: `const [view, setView] = useState('week');

<ButtonGroup
  aria-label="Calendar view"
  value={view}
  onValueChange={setView}
  items={[
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ]}
/>`,
    },
    {
      title: 'Text toolbar',
      caption: 'Formatting icons are familiar enough to stand on their own, and a tooltip names each one.',
      render: () => <EditorToolbar />,
      code: `<ButtonGroup
  behavior="toolbar"
  aria-label="Text formatting"
  size="sm"
  iconOnly
  items={[
    { value: 'bold', label: 'Bold', leadingIcon: 'editor/bold', selected: bold },
    { value: 'italic', label: 'Italic', leadingIcon: 'editor/italic', selected: italic },
    { value: 'underline', label: 'Underline', leadingIcon: 'editor/underline', selected: underline },
  ]}
  onItemClick={toggle}
  renderItem={(item, node) => <Tooltip text={item.label}>{node}</Tooltip>}
/>`,
    },
    {
      title: 'List filter',
      caption: 'A status dot makes the Active filter easy to spot, and the list below updates with the selection.',
      render: () => <ListFilter />,
      code: `<ButtonGroup
  aria-label="Project status"
  size="sm"
  value={filter}
  onValueChange={setFilter}
  items={[
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active', showDot: true },
    { value: 'archived', label: 'Archived' },
  ]}
/>`,
    },
  ],
  whenToUse: {
    use: [
      'Two to five related actions used side by side, like a formatting toolbar or a split action.',
      'A compact view switcher, where the choice changes how the same content is shown (Day / Week / Month).',
    ],
    dont: [
      'For independent actions, like a dialog footer, use separate Buttons (2.1).',
      'For page sections with their own content, use tabs.',
      'For one choice that’s saved when a form is submitted, use radios in a Choice field (3.3).',
      'For more than five options, use a Select (3.5).',
    ],
  },
  matrices: [
    {
      title: 'Button group',
      rows: 'Size',
      columns: 'Icon only',
      render: () => (
        <Matrix
          rowProp="Size"
          rows={SIZES}
          colProp="Icon only"
          cols={ICON_ONLY}
          cell={(size, io) => <ButtonGroup aria-label={`Size ${size}`} size={size} iconOnly={io === 'true'} items={generic(io === 'true')} />}
        />
      ),
    },
    {
      title: 'Configured instances',
      render: () => (
        <div className="flex flex-wrap items-center gap-4xl rounded-surface border border-dashed border-border-brand-subtle p-xl">
          {[
            { k: 'Text', items: views },
            { k: 'Leading icons', items: [{ value: 'list', label: 'List', leadingIcon: 'editor/bullet-list' as const }, { value: 'grid', label: 'Grid', leadingIcon: 'layout/layout-grid' as const }, { value: 'board', label: 'Board', leadingIcon: 'layout/columns' as const }] },
            { k: 'Dot on item 2', items: [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active', showDot: true }, { value: 'archived', label: 'Archived' }] },
          ].map(({ k, items }) => (
            <div key={k} className="flex flex-col items-start gap-md">
              <AxisLabel prop="Example" value={k} />
              <ButtonGroup aria-label={k} items={items} />
            </div>
          ))}
        </div>
      ),
    },
  ],
  privateParts: [
    {
      title: '.Main/Button group item',
      rows: 'Size × Icon only × Selected',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One segment of a button group. Changes here apply to every group.</p>
          <Matrix
            rowProp="Size · Icon only · Selected"
            rows={ITEM_ROWS}
            colProp="State"
            cols={STATES}
            cell={(row, state) => {
              const [size, io, sel] = row.split(' · ') as ['sm' | 'md', 'true' | 'false', 'true' | 'false'];
              return (
                <span className="inline-flex rounded-control border border-border-default bg-surface-base">
                  <ButtonGroupItemPart
                    size={size}
                    iconOnly={io === 'true'}
                    selected={sel === 'true'}
                    showDivider={false}
                    edge="only"
                    leadingIcon={io === 'true' ? 'general/placeholder' : undefined}
                    forceState={state === 'hover' || state === 'focus' ? state : undefined}
                    disabled={state === 'disabled'}
                    tabIndex={-1}
                  />
                </span>
              );
            }}
          />
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-3xl">
        <div className="scale-150">
          <ButtonGroup aria-label="Anatomy" items={[{ value: 'a', label: 'Day', leadingIcon: 'time/calendar' }, { value: 'b', label: 'Active', showDot: true }, { value: 'c', label: 'Month' }]} defaultValue="a" />
        </div>
        <div className="mt-xl flex flex-wrap items-end gap-3xl">
          {SIZES.map((s) => (
            <div key={s} className="flex flex-col items-start gap-sm">
              <AxisLabel prop="Size" value={s} />
              <ButtonGroup aria-label={s} size={s} items={views} />
            </div>
          ))}
          <div className="flex flex-col items-start gap-sm">
            <AxisLabel prop="Item" value="rest · hover · focus · disabled" />
            <ButtonGroup
              aria-label="States"
              behavior="toolbar"
              items={[
                { value: 'r', label: 'Rest' },
                { value: 'h', label: 'Hover', forceState: 'hover' },
                { value: 'f', label: 'Focus', forceState: 'focus' },
                { value: 'd', label: 'Disabled', disabled: true },
              ]}
            />
          </div>
        </div>
      </div>
    ),
    parts: [
      { name: 'Group', target: 'group', description: 'The container. It draws the only outer border and the outer radius, and its shadow matches a secondary button.', tokens: ['color/border/default', 'radius/control', 'elevation/control'] },
      { name: 'Item', target: 'item', description: 'One segment. Its height and padding follow the size, and it becomes a square when it’s icon-only.', tokens: ['size/control/md', 'button-group/item/padding-x/md', 'button-group/item/padding-y/md', 'space/sm'] },
      { name: 'Divider', target: 'divider', description: 'A 1 px line on each item’s leading edge, and the only border between two items. The first item doesn’t show it.', tokens: ['border/width/default', 'color/border/default'] },
      { name: 'Dot', target: 'dot', description: 'An optional status marker that takes the place of the leading icon.', tokens: ['size/indicator/sm', 'color/icon/success'] },
      { name: 'Leading icon / Icon', target: 'leading-icon', description: 'An optional icon before the label. In an icon-only item, it’s the only thing shown.', tokens: ['size/icon/md', 'color/icon/secondary'] },
      { name: 'Text padding + Label', target: 'text-padding', description: 'The label, with a little optical padding on each side, as on a button.', tokens: ['space/optical', 'type/body/sm/semibold'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'The height and padding of every item.' },
    { name: 'iconOnly', figma: 'Icon only', type: 'boolean', default: 'false', description: 'Shows square icon segments. Each item’s label becomes its accessible name.' },
    { name: 'items', figma: 'Exposed item instances', type: 'ButtonGroupItemData[]', description: 'The segments, each as { value, label (Label), leadingIcon (Show leading icon), showDot (Show dot), disabled (State=disabled), selected (toolbar toggle) }.' },
    { name: 'behavior', type: "'switcher' | 'toolbar'", default: "'switcher'", description: 'Switcher is a radio group with one selected value. Toolbar renders buttons, which become toggles with aria-pressed when selected is set.' },
    { name: 'value / defaultValue', figma: 'Item › Selected', type: 'string', description: 'Switcher only: the selected item. Pair value with onValueChange to control it.' },
    { name: 'onValueChange', type: '(value: string) => void', description: 'Switcher only: called when the selection changes, by click or arrow keys.' },
    { name: 'onItemClick', type: '(value: string) => void', description: 'Toolbar only: called when an item is activated.' },
    { name: 'aria-label', type: 'string', description: 'The group’s accessible name, like “Calendar view” or “Text formatting”.' },
    { name: 'renderItem', type: '(item, node) => ReactNode', description: 'Wraps each item, for example in a Tooltip for icon-only segments.' },
  ],
  tokens: [
    'color/border/default', 'color/surface/base', 'color/fill/none', 'color/fill/neutral/subtle/hover', 'color/fill/neutral/subtle/selected',
    'color/text/secondary', 'color/text/primary', 'color/text/disabled', 'color/icon/secondary', 'color/icon/primary', 'color/icon/disabled', 'color/icon/success',
    'radius/control', 'border/width/default', 'size/control/sm', 'size/control/md', 'button-group/item/padding-x/sm', 'button-group/item/padding-x/md',
    'button-group/item/padding-y/sm', 'button-group/item/padding-y/md', 'space/sm', 'space/optical', 'size/icon/md', 'size/indicator/sm',
    'type/body/sm/semibold', 'elevation/control', 'focus/default',
  ],
  guidelines: [
    {
      title: 'When to use',
      body: 'Use a button group when a few related options change how something is shown. Use separate buttons for unrelated actions, like a dialog footer, and tabs when each choice opens a page section with its own content.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-3">
          <div className="flex flex-col items-start gap-sm">
            <ButtonGroup aria-label="View" size="sm" items={views} defaultValue="week" />
            <span className="type-body-xs-medium text-text-tertiary">Button group: related options in one control.</span>
          </div>
          <div className="flex flex-col items-start gap-sm">
            <div className="flex gap-md">
              <Button size="sm" emphasis="secondary" label="Cancel" />
              <Button size="sm" label="Save" />
            </div>
            <span className="type-body-xs-medium text-text-tertiary">Buttons: independent actions.</span>
          </div>
          <div className="flex flex-col items-start gap-sm">
            <div className="flex gap-lg border-b border-border-subtle">
              {['Overview', 'Activity', 'Settings'].map((t, i) => (
                <span key={t} className={i === 0 ? 'type-body-sm-semibold -mb-px border-b-2 border-border-brand pb-sm text-text-brand' : 'type-body-sm-semibold pb-sm text-text-tertiary'}>
                  {t}
                </span>
              ))}
            </div>
            <span className="type-body-xs-medium text-text-tertiary">Tabs: page sections.</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Connected edges',
      body: 'The segments read as one control because the group draws a single outer border and rounds only its outside corners. Inner corners stay square, and one divider line separates each pair of neighbors.',
      render: () => (
        <div className="scale-150 py-xl">
          <ButtonGroup aria-label="Connected" items={views} defaultValue="day" />
        </div>
      ),
      do: { caption: 'One group, one shared border.', render: () => <ButtonGroup aria-label="Do" items={views} defaultValue="day" /> },
      dont: {
        caption: 'Separate buttons side by side double the borders and round every segment.',
        render: () => (
          <div className="flex">
            {['Day', 'Week', 'Month'].map((l) => (
              <Button key={l} emphasis="secondary" label={l} />
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Keep selection and focus distinct',
      body: 'Selection shows as a fill and focus as a ring, so people can always tell them apart. A selected segment may or may not have focus, and moving focus never changes the selection.',
      render: () => (
        <ButtonGroup
          aria-label="Selected vs focus"
          behavior="toolbar"
          items={[
            { value: 'a', label: 'Unselected' },
            { value: 'b', label: 'Selected', selected: true },
            { value: 'c', label: 'Focused', forceState: 'focus' },
            { value: 'd', label: 'Selected + focused', selected: true, forceState: 'focus' },
          ]}
        />
      ),
      do: { caption: 'One item selected in a view switcher.', render: () => <ButtonGroup aria-label="One" items={views} defaultValue="week" /> },
      dont: {
        caption: 'Two items selected in a view switcher.',
        render: () => <ButtonGroup aria-label="Two" behavior="toolbar" items={views.map((v, i) => ({ ...v, selected: i < 2 }))} />,
      },
    },
    {
      title: 'Choose text, icons or both',
      body: 'Use text for short words, and add a leading icon when it helps people recognize an option faster. Go icon-only for familiar formatting or layout icons, and give each one a name and a tooltip.',
      render: () => (
        <div className="flex flex-wrap items-center gap-3xl">
          <ButtonGroup aria-label="Text" items={views} />
          <ButtonGroup aria-label="Icon and text" items={[{ value: 'l', label: 'List', leadingIcon: 'editor/bullet-list' }, { value: 'g', label: 'Grid', leadingIcon: 'layout/layout-grid' }]} />
          <ButtonGroup aria-label="Formatting" iconOnly behavior="toolbar" items={formatting} renderItem={(it, n) => <Tooltip text={it.label}>{n}</Tooltip>} />
        </div>
      ),
      do: { caption: 'Icon-only for familiar formatting icons.', render: () => <ButtonGroup aria-label="Formatting" iconOnly behavior="toolbar" items={formatting} /> },
      dont: {
        caption: 'Icon-only for actions with no familiar icon.',
        render: () => (
          <ButtonGroup
            aria-label="Unclear"
            iconOnly
            behavior="toolbar"
            items={[
              { value: 'a', label: 'Archive old drafts', leadingIcon: 'shapes/hexagon' },
              { value: 'b', label: 'Sync owners', leadingIcon: 'general/zap' },
              { value: 'c', label: 'Rebuild index', leadingIcon: 'general/layers' },
            ]}
          />
        ),
      },
    },
    {
      title: 'Content',
      body: 'Keep labels to one or two words, in the same form across items: “Day / Week / Month”, not “Day / Show weeks / Month”. Use two to five items. If you need more, use a Select (3.5).',
      do: { caption: 'Parallel, one-word labels.', render: () => <ButtonGroup aria-label="Parallel" items={views} /> },
      dont: { caption: 'Mixed forms and lengths.', render: () => <ButtonGroup aria-label="Mixed" items={[{ value: 'a', label: 'Day' }, { value: 'b', label: 'Show weeks' }, { value: 'c', label: 'Month' }]} /> },
    },
    {
      title: 'Maintenance',
      body: 'To change how every segment looks, edit .Main/Button group item. Change the outer border or radius on Button group itself. Colors come from the semantic tokens in the token map.',
    },
  ],
  accessibility: [
    'As a view switcher, the group is a radiogroup with one tab stop. Arrow keys, Home and End move the selection, and the selected item has aria-checked.',
    'As a toolbar, the group has role="toolbar" and its own name. It’s one tab stop: arrow keys move focus, Enter or Space activates an item, and toggles expose aria-pressed.',
    'Icon-only items take the name screen readers announce from label. Pair them with a Tooltip (2.13) so sighted users can see it too.',
    'Selection never relies on color alone: the selected fill and the darker label give two cues. Focus is a separate ring drawn inside the item.',
    'Arrow-key navigation skips disabled items.',
  ],
});
