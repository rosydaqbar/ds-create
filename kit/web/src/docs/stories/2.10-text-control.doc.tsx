import { useState } from 'react';
import { TextControl, type TextControlSize, type TextControlStatus, type TextControlType } from '@/components/parts/TextControl';
import { Button } from '@/components/parts/Button';
import { HelpText } from '@/components/parts/HelpText';
import { Label } from '@/components/parts/Label';
import { TextField } from '@/components/components/TextField';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';

const TYPES = ['single-line', 'multi-line', 'select'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const;
const ROWS = SIZES.flatMap((s) => [`${s} · placeholder`, `${s} · filled`, `${s} · placeholder, invalid`, `${s} · filled, invalid`]);

const sample: Record<TextControlType, { placeholder: string; value: string }> = {
  'single-line': { placeholder: 'Placeholder', value: 'olivia@company.com' },
  'multi-line': { placeholder: 'Placeholder', value: 'The new dashboard loads faster and the filters finally remember my last selection.' },
  select: { placeholder: 'Select a person', value: 'Olivia Rhye' },
};

/** One Figma variant: Filled → value, Status → status, State → forceState / disabled. */
function variant(type: TextControlType, row: string, state: (typeof STATES)[number]) {
  const [size, rest] = row.split(' · ') as [TextControlSize, string];
  const filled = rest.startsWith('filled');
  const status: TextControlStatus = rest.endsWith('invalid') ? 'invalid' : 'none';
  const s = sample[type];
  return (
    <div className="w-(--size-width-xxs)">
      <TextControl
        type={type}
        size={size}
        status={status}
        aria-label={`${type} ${row} ${state}`}
        placeholder={s.placeholder}
        {...(type === 'select' ? { value: filled ? s.value : '' } : { defaultValue: filled ? s.value : undefined })}
        forceState={state === 'hover' || state === 'focus' ? state : undefined}
        disabled={state === 'disabled'}
      />
    </div>
  );
}

function FilterSelect(p: { label: string; value: string; icon?: 'time/calendar'; avatar?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-[11rem]">
      <TextControl
        type="select"
        size="sm"
        aria-label={p.label}
        value={p.value}
        leadingIcon={p.icon}
        avatar={p.avatar ? { initials: 'OR' } : undefined}
        open={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      />
    </div>
  );
}

export default defineDoc({
  id: '2.10',
  name: 'Text control',
  level: 'parts',
  spec: 'specs/parts/2.10-text-control.md',
  exports: ['TextControl'],
  summary:
    'The box people type into or pick from: single-line inputs, multi-line text areas and select triggers. Optional icons, prefixes and shortcuts help explain the value.',
  hero: () => (
    <div className="w-(--size-width-xxs)">
      <TextControl aria-label="Email" leadingIcon="communication/mail" placeholder="you@company.com" />
    </div>
  ),
  playground: {
    controls: [
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'single-line' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'status', figma: 'Status', control: { type: 'select', options: ['none', 'invalid'] }, default: 'none' },
      { name: 'placeholder', figma: 'Text (Filled=false)', control: { type: 'text' }, default: 'Placeholder' },
      { name: 'defaultValue', figma: 'Text (Filled=true)', control: { type: 'text' }, default: '' },
      { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', control: { type: 'icon' }, default: undefined },
      { name: 'showAvatar', figma: 'Show avatar', control: { type: 'boolean' }, default: false },
      { name: 'showDot', figma: 'Show dot', control: { type: 'boolean' }, default: false },
      { name: 'prefix', figma: 'Show prefix + Prefix', control: { type: 'text' }, default: '' },
      { name: 'supportingText', figma: 'Show supporting text + Supporting text', control: { type: 'text' }, default: '' },
      { name: 'showHelpIcon', figma: 'Show help icon', control: { type: 'boolean' }, default: false },
      { name: 'shortcut', figma: 'Show shortcut', control: { type: 'text' }, default: '' },
      { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', control: { type: 'icon' }, default: undefined },
      { name: 'showResizeHandle', figma: 'Show resize handle', control: { type: 'boolean' }, default: true },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: ({ showAvatar, defaultValue, ...a }) => (
      <div className="w-(--size-width-xxs)">
        <TextControl
          key={`${a.type}-${defaultValue}`}
          aria-label="Playground"
          {...a}
          prefix={a.prefix || undefined}
          supportingText={a.supportingText || undefined}
          shortcut={a.shortcut || undefined}
          avatar={showAvatar ? { initials: 'OR' } : undefined}
          {...(a.type === 'select' ? { value: defaultValue } : { defaultValue: defaultValue || undefined })}
        />
      </div>
    ),
    code: ({ showAvatar, ...a }) =>
      `<TextControl${jsxProps(
        a,
        { type: 'single-line', size: 'md', status: 'none', showDot: false, showHelpIcon: false, showResizeHandle: true, disabled: false },
        a.type === 'multi-line' ? [] : ['showResizeHandle'],
      )}${showAvatar ? ` avatar={{ initials: 'OR' }}` : ''} aria-label="Email" />`,
  },
  examples: [
    {
      title: 'Sign-in form',
      caption: 'In forms, a Text field (3.2) wraps each control with its label and hint.',
      render: () => (
        <form className="flex w-full max-w-[22rem] flex-col gap-xl" onSubmit={(e) => e.preventDefault()}>
          <TextField label="Email address" inputType="email" autoComplete="email" placeholder="you@company.com" leadingIcon="communication/mail" />
          <TextField type="password" label="Password" hint="Use 8 or more characters." />
          <Button type="submit" label="Sign in" fullWidth />
        </form>
      ),
      code: `<form className="flex flex-col gap-xl">
  <TextField label="Email address" inputType="email" autoComplete="email" placeholder="you@company.com" leadingIcon="communication/mail" />
  <TextField type="password" label="Password" hint="Use 8 or more characters." />
  <Button type="submit" label="Sign in" fullWidth />
</form>`,
    },
    {
      title: 'Search in a top bar',
      caption: 'The shortcut at the end of the box tells people how to jump to search from anywhere.',
      render: () => (
        <div className="w-full max-w-[22rem]">
          <TextControl aria-label="Search" inputType="search" leadingIcon="general/search" placeholder="Search" shortcut={['⌘', 'K']} aria-keyshortcuts="Meta+K" />
        </div>
      ),
      code: `<TextControl
  aria-label="Search"
  inputType="search"
  leadingIcon="general/search"
  placeholder="Search"
  shortcut={['⌘', 'K']}
  aria-keyshortcuts="Meta+K"
/>`,
    },
    {
      title: 'Filter row',
      caption: 'Select triggers look like the inputs around them and open a menu (3.5).',
      render: () => (
        <div className="flex flex-wrap gap-md">
          <FilterSelect label="Status" value="Status: All" />
          <FilterSelect label="Owner" value="Owner" avatar />
          <FilterSelect label="Date range" value="Date range" icon="time/calendar" />
        </div>
      ),
      code: `<TextControl type="select" size="sm" aria-label="Status" value="Status: All" open={open} onClick={toggle} />
<TextControl type="select" size="sm" aria-label="Owner" value="Owner" avatar={{ initials: 'OR' }} />
<TextControl type="select" size="sm" aria-label="Date range" value="Date range" leadingIcon="time/calendar" />`,
    },
    {
      title: 'Comment box',
      caption: 'Multi-line text starts at the top and the box grows as people type.',
      render: () => (
        <div className="flex w-full max-w-[26rem] flex-col items-end gap-md">
          <TextControl type="multi-line" aria-label="Comment" placeholder="Add a comment…" />
          <Button label="Post" />
        </div>
      ),
      code: `<div className="flex flex-col items-end gap-md">
  <TextControl type="multi-line" aria-label="Comment" placeholder="Add a comment…" />
  <Button label="Post" />
</div>`,
    },
  ],
  whenToUse: {
    use: [
      'Whenever people enter or pick a value: a name, an email, a search, a description, a choice from a list.',
      'In forms, inside a Text field (3.2), so every control gets a visible label and hint.',
      'On its own where the context already names it, like a search box in a top bar or a filter row. Screen readers still need a name, so add an aria-label.',
    ],
    dont: [
      'For a complete form field, use a Text field (3.2). It adds the label and help text.',
      'For two to five visible options, use a Choice field (3.3) or a Button group (3.1).',
      'For formatted text, use a Rich text editor (4.1).',
    ],
  },
  matrices: [
    ...TYPES.map((type) => ({
      title: `Type=${type}`,
      rows: 'Size × Filled × Status',
      columns: 'State',
      render: () => <Matrix rowProp="Size · Filled · Status" rows={ROWS} colProp="State" cols={STATES} cell={(row, state) => variant(type, row, state)} />,
    })),
    {
      title: 'Content options',
      render: () => (
        <div className="grid gap-x-3xl gap-y-xl rounded-surface border border-dashed border-border-brand-subtle p-xl md:grid-cols-2">
          {[
            { k: 'Leading icon', n: <TextControl aria-label="Email" leadingIcon="communication/mail" placeholder="you@company.com" /> },
            { k: 'Prefix', n: <TextControl aria-label="Website" prefix="https://" defaultValue="example.com" /> },
            { k: 'Avatar + supporting text (select)', n: <TextControl type="select" aria-label="Assignee" value="Olivia Rhye" avatar={{ initials: 'OR' }} supportingText="@olivia" /> },
            { k: 'Dot (select)', n: <TextControl type="select" aria-label="Status" value="Online" showDot /> },
            { k: 'Help icon', n: <TextControl aria-label="Tax ID" placeholder="Tax ID" showHelpIcon helpText="Find it on your invoice." /> },
            { k: 'Shortcut', n: <TextControl aria-label="Search" leadingIcon="general/search" placeholder="Search" shortcut={['⌘', 'K']} /> },
            { k: 'Trailing icon', n: <TextControl aria-label="Password" inputType="password" defaultValue="hunter22" trailingIcon="general/eye" /> },
            { k: 'Invalid with status icon', n: <TextControl aria-label="Email" status="invalid" defaultValue="olivia@" /> },
            { k: 'Resize handle (multi-line)', n: <TextControl type="multi-line" aria-label="Notes" placeholder="Notes" /> },
          ].map(({ k, n }) => (
            <div key={k} className="flex flex-col items-start gap-sm">
              <AxisLabel prop="Option" value={k} />
              <div className="w-(--size-width-xxs)">{n}</div>
            </div>
          ))}
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-start gap-3xl">
        {/* Multi-line first: Root and Text land on it, so the single-line row shows Prefix and Content apart from them. */}
        <div className="flex flex-col gap-xl">
          <div className="w-(--size-width-xxs)">
            <TextControl type="multi-line" aria-label="Description" defaultValue="Text starts at the top left and wraps." />
          </div>
          <div className="w-(--size-width-xxs)">
            <TextControl aria-label="Website" prefix="https://" defaultValue="example.com" showHelpIcon shortcut="/" />
          </div>
          <div className="w-(--size-width-xxs)">
            <TextControl type="select" aria-label="Assignee" value="Olivia Rhye" avatar={{ initials: 'OR' }} supportingText="@olivia" />
          </div>
        </div>
        <div className="flex flex-col gap-lg">
          {TYPES.map((t) => (
            <div key={t} className="flex flex-wrap items-start gap-xl">
              <AxisLabel prop="Type" value={t} />
              {SIZES.map((s) => (
                <div key={s} className="flex w-[14rem] flex-col gap-xs">
                  <AxisLabel prop="Size" value={s} />
                  <TextControl type={t} size={s} aria-label={`${t} ${s}`} placeholder={sample[t].placeholder} {...(t === 'select' ? { value: '' } : {})} rows={t === 'multi-line' ? 1 : undefined} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-md">
          <span className="type-body-sm-semibold text-text-primary">Mobile text size</span>
          <div className="flex flex-wrap gap-xl">
            <div className="flex w-[14rem] flex-col gap-xs">
              <AxisLabel prop="Desktop · sm" value="14" />
              <TextControl size="sm" aria-label="Desktop" defaultValue="Olivia Rhye" />
            </div>
            <div className="flex w-[14rem] flex-col gap-xs">
              <AxisLabel prop="Mobile · sm" value="16 (font/size/input-min)" />
              <TextControl size="sm" aria-label="Mobile" defaultValue="Olivia Rhye" controlClassName="text-(length:--font-size-input-min)" />
            </div>
          </div>
        </div>
      </div>
    ),
    parts: [
      { name: 'Root', target: 'root', description: 'The bordered box. It fills the available width, and its height and side padding follow the size. Multi-line boxes start at a minimum height and grow with the text.', tokens: ['size/control/md', 'text-control/padding-x/md', 'radius/control', 'border/width/default'] },
      { name: 'Leading slot', target: 'leading-slot', description: 'Holds one leading visual: an icon, a small Avatar (2.6) or a status dot. It keeps a fixed size, so the text never shifts.', tokens: ['size/icon/md', 'color/icon/tertiary'] },
      { name: 'Prefix', target: 'prefix', description: 'Fixed text at the start of a single-line value, like https://. It sits against the left edge with a divider on its right.', tokens: ['color/text/tertiary', 'color/border/default'] },
      { name: 'Content', target: 'content', description: 'Fills the width and spaces out the leading visual, the text and any supporting text.', tokens: ['space/md'] },
      { name: 'Text', target: 'text', description: 'One layer that shows the placeholder or the value, so the box counts as filled once there’s a value. Single-line text truncates with an ellipsis. Multi-line text starts at the top and wraps.', tokens: ['type/body/md/regular', 'color/text/placeholder', 'color/text/primary', 'font/size/input-min'] },
      { name: 'Supporting text', target: 'supporting-text', description: 'Optional secondary text after a select value, such as a username.', tokens: ['color/text/tertiary'] },
      { name: 'Trailing slot', target: 'trailing-slot', description: 'Holds a Help icon (2.13), a Kbd shortcut (2.17) or a trailing icon such as a password reveal. When the value is invalid, a status icon takes the help icon’s place.', tokens: ['size/icon/sm', 'color/icon/danger'] },
      { name: 'Chevron', target: 'chevron', description: 'The down arrow on select triggers. The whole trigger opens the menu (3.5), not only the chevron.', tokens: ['size/icon/md'] },
      { name: 'Resize handle', target: 'resize-handle', description: 'A 12 × 12 grip in the bottom-right corner of multi-line boxes. On desktop, people drag it to make the box bigger.', tokens: ['size/icon/xs', 'space/sm'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: "'single-line' | 'multi-line' | 'select'", default: "'single-line'", description: 'A single-line input, a text area, or a select trigger with a chevron.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the height, padding and text style. Matches Button sm, md and lg.' },
    { name: 'status', figma: 'Status', type: "'none' | 'invalid'", default: "'none'", description: 'Invalid adds the danger border, the status icon and aria-invalid. Show the message with Help text (2.12).' },
    { name: 'placeholder', figma: 'Text (Filled=false)', type: 'string', description: 'An example of the expected format, never the label.' },
    { name: 'value / defaultValue', figma: 'Text (Filled=true) · Filled', type: 'string', description: 'The value. Filled follows from it. Use value with onValueChange to control it.' },
    { name: 'onValueChange', type: '(value: string) => void', description: 'Called with the new text (single-line, multi-line).' },
    { name: 'inputType', type: 'HTMLInputTypeAttribute', default: "'text'", description: 'Native type of the single-line input: email, password, tel, search…' },
    { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', type: 'IconName', description: 'An icon that hints at the kind of value.' },
    { name: 'avatar', figma: 'Show avatar', type: '{ src?: string; initials?: string }', description: 'An extra-small Avatar (2.6) before the value.' },
    { name: 'showDot', figma: 'Show dot', type: 'boolean', default: 'false', description: 'A leading status dot.' },
    { name: 'prefix', figma: 'Show prefix + Prefix', type: 'string', description: 'Fixed text before a single-line value.' },
    { name: 'supportingText', figma: 'Show supporting text + Supporting text', type: 'ReactNode', description: 'Secondary text after the value.' },
    { name: 'showHelpIcon', figma: 'Show help icon', type: 'boolean', default: 'false', description: 'Adds a Help icon (2.13) at the end. helpText sets its tooltip.' },
    { name: 'shortcut', figma: 'Show shortcut', type: 'string | string[]', description: 'The shortcut’s keys, shown as one Kbd (2.17) per key. Pair it with aria-keyshortcuts.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName', description: 'An icon at the end. Add onTrailingIconClick and trailingIconLabel to make it a button.' },
    { name: 'showResizeHandle', figma: 'Show resize handle', type: 'boolean', default: 'true', description: 'Multi-line only. Lets people resize the box vertically with the corner grip.' },
    { name: 'open', type: 'boolean', description: 'Select only. Marks the menu as open (aria-expanded) and shows the focus look.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Applies the disabled fill and text, and disables the adornments.' },
    { name: 'forceState', figma: 'State=hover / focus', type: "'hover' | 'focus'", description: 'For documentation only. Pins the hover or focus look.' },
  ],
  tokens: [
    'color/surface/base', 'color/border/default', 'color/border/strong', 'color/border/brand', 'color/border/disabled', 'color/border/danger',
    'color/fill/neutral/subtle/disabled', 'color/text/placeholder', 'color/text/primary', 'color/text/tertiary', 'color/text/disabled',
    'color/icon/tertiary', 'color/icon/disabled', 'color/icon/danger', 'focus/default', 'focus/danger',
    'radius/control', 'border/width/default', 'size/control/sm', 'size/control/md', 'size/control/lg',
    'text-control/padding-x/sm', 'text-control/padding-x/md', 'text-control/padding-x/lg', 'text-control/padding-y-multiline', 'text-control/multiline-min-height',
    'font/size/input-min', 'space/md', 'size/icon/md', 'size/icon/sm', 'type/body/sm/regular', 'type/body/md/regular',
  ],
  guidelines: [
    {
      title: 'Pick the right type',
      body: 'Use single-line for short values like names, emails, numbers and search. Use multi-line for free text that runs longer, like comments and messages. Use select when people choose one value from a known list. It opens the Select (3.5) menu.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-3">
          {([
            ['single-line', 'Short values'],
            ['multi-line', 'Longer free text'],
            ['select', 'One value from a known list'],
          ] as const).map(([t, c]) => (
            <div key={t} className="flex flex-col gap-sm">
              <Label label="Project" htmlFor={`which-${t}`} />
              <TextControl id={`which-${t}`} type={t} placeholder={t === 'select' ? 'Select a project' : 'Project'} {...(t === 'select' ? { value: '' } : {})} rows={t === 'multi-line' ? 1 : undefined} />
              <span className="type-body-xs-medium text-text-tertiary">{c}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Label, control and hint',
      body: 'This control is only the box. In a Text field (3.2), a Label (2.11) sits above it and Help text (2.12) sits below.',
      render: () => (
        <div className="flex w-(--size-width-xxs) flex-col gap-sm">
          <Label htmlFor="ga-email" label="Email address" />
          <div className="rounded-control outline-2 outline-offset-4 outline-border-brand outline-dashed">
            <TextControl id="ga-email" placeholder="you@company.com" aria-describedby="ga-email-h" />
          </div>
          <HelpText id="ga-email-h" hint="We’ll only use this for receipts." />
        </div>
      ),
    },
    {
      title: 'Status and state',
      body: 'State follows interaction: hover, focus and disabled. Status follows validation: invalid. An invalid control keeps its danger border at rest, on hover and on focus, and focus adds the ring.\n\nAlways show the error message as Help text (2.12). The border and icon alone don’t tell people how to fix the problem.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-3">
          {(['rest', 'hover', 'focus'] as const).map((s) => (
            <div key={s} className="flex flex-col gap-sm">
              <AxisLabel prop="Invalid · State" value={s} />
              <TextControl aria-label={`Invalid ${s}`} status="invalid" defaultValue="olivia@" forceState={s === 'rest' ? undefined : s} />
            </div>
          ))}
        </div>
      ),
      do: {
        caption: 'A danger border with a message that says how to fix it.',
        render: () => (
          <div className="flex w-[16rem] flex-col gap-sm">
            <TextControl aria-label="Email" status="invalid" defaultValue="olivia@" aria-describedby="sv-do" />
            <HelpText id="sv-do" status="invalid" hint="Enter an email like name@company.com." />
          </div>
        ),
      },
      dont: { caption: 'A red border with no message.', render: () => <div className="w-[16rem]"><TextControl aria-label="Email" status="invalid" defaultValue="olivia@" /></div> },
    },
    {
      title: 'Use adornments sparingly',
      body: 'Each adornment has one job. A leading icon hints at the kind of value, a prefix shows fixed text like https:// or a currency symbol, and an avatar or dot shows a person or status in a select.\n\nA help icon opens a tooltip, a shortcut shows the key that focuses the control, and a trailing icon acts on the value, like showing a password. Use one leading visual at a time.',
      do: { caption: 'One adornment that explains the value.', render: () => <div className="w-[16rem]"><TextControl aria-label="Search" leadingIcon="general/search" placeholder="Search" /></div> },
      dont: {
        caption: 'Three adornments crowd the value.',
        render: () => (
          <div className="w-[16rem]">
            <TextControl aria-label="Search" leadingIcon="general/search" prefix="in:" placeholder="Search" showHelpIcon shortcut={['⌘', 'K']} trailingIcon="general/filter" />
          </div>
        ),
      },
    },
    {
      title: 'Multi-line behavior',
      body: 'Text starts at the top left and wraps. The box grows with the content up to the layout’s limit, then scrolls. On desktop, people can drag the resize handle to make it bigger.',
      do: { caption: 'Top-aligned text.', render: () => <div className="w-[16rem]"><TextControl type="multi-line" aria-label="Message" defaultValue="Thanks for the update — I’ll review it today." /></div> },
      dont: {
        caption: 'Vertically centered multi-line text.',
        render: () => (
          <div className="flex h-(--text-control-multiline-min-height) w-[16rem] items-center rounded-control border border-border-default bg-surface-base px-lg type-body-md-regular text-text-primary">
            Thanks for the update — I’ll review it today.
          </div>
        ),
      },
    },
    {
      title: 'Placeholders and long values',
      body: 'Use the placeholder for an example of the expected format, like “you@company.com”. Don’t use it for the label or for instructions, because it disappears once people start typing.\n\nLong values truncate with an ellipsis in single-line and select controls, and wrap in multi-line ones.',
      do: {
        caption: 'Label above, placeholder as an example.',
        render: () => (
          <div className="flex w-[16rem] flex-col gap-sm">
            <Label htmlFor="ph-do" label="Email address" />
            <TextControl id="ph-do" placeholder="you@company.com" />
          </div>
        ),
      },
      dont: { caption: 'Placeholder as the label.', render: () => <div className="w-[16rem]"><TextControl aria-label="Email address" placeholder="Email address" /></div> },
    },
    {
      title: 'Mobile text size',
      body: 'On mobile, the value text is at least 16px (font/size/input-min), so the browser doesn’t zoom into the field on focus. The small size uses 14px on desktop and switches to 16px on touch screens by itself.',
    },
    {
      title: 'Build selects with the select type',
      body: 'The select trigger is its own type. The chevron is built in, and the whole box opens the menu. Don’t fake one by adding a chevron icon to a single-line control: it reads as a text input and won’t open.',
      do: { caption: 'The select type, where the whole box opens the menu.', render: () => <div className="w-[16rem]"><TextControl type="select" aria-label="Country" value="Portugal" /></div> },
      dont: { caption: 'A text input with a trailing chevron icon.', render: () => <div className="w-[16rem]"><TextControl aria-label="Country" defaultValue="Portugal" trailingIcon="arrows/chevron-down" /></div> },
    },
  ],
  accessibility: [
    'Every control in the product has a visible label, which Text field (3.2) links with htmlFor. The placeholder is never the label, and standalone controls take aria-label.',
    'Keyboard focus is always visible (focus/default) and looks different from hover. Invalid controls show a danger focus ring (focus/danger).',
    'An invalid status sets aria-invalid. The message is Help text (2.12), linked with aria-describedby so screen readers read it with the control.',
    'The border meets 3:1 non-text contrast against the surface, and the text meets text contrast. Disabled values stay legible. When people need to copy a value, prefer readOnly.',
    'Select triggers are buttons with aria-haspopup="listbox" and aria-expanded. The trailing icon button and the help icon each have their own accessible name.',
    'On touch screens, the value is at least 16px, so the browser doesn’t zoom in on focus.',
  ],
});
