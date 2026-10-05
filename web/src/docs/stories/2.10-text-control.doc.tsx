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
  spec: 'parts/2.10-text-control.md',
  exports: ['TextControl'],
  summary:
    'The input box for typing and choosing. Single-line, multi-line and select types, three sizes, placeholder or filled, normal or invalid, four states. Leading icon, avatar, dot, prefix, help icon, shortcut and resize handle are optional slots.',
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
      caption: 'Controls stack with their labels and hints; the box itself stays this Part.',
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
      caption: 'Shortcut hints sit at the trailing edge.',
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
      caption: 'Select triggers look like inputs and open a menu (3.5).',
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
      caption: 'Multi-line text starts at the top and grows; it is never centred.',
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
      'Inside 3.2 Text field in forms, so every control has a visible label and a hint.',
      'Alone only where the context names it (a search box in a top bar, a filter row) — and then with `aria-label`.',
    ],
    dont: [
      'As a complete form field — use 3.2 Text field (Label + control + Help text).',
      'For a choice of two to five visible options — use 3.3 Choice field or 3.1 Button group.',
      'For formatted text — use a Rich text editor (4.1).',
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
        <div className="flex flex-col gap-xl">
          <div className="w-(--size-width-xxs)">
            <TextControl aria-label="Website" prefix="https://" leadingIcon="maps/globe" defaultValue="example.com" showHelpIcon shortcut="/" />
          </div>
          <div className="w-(--size-width-xxs)">
            <TextControl type="select" aria-label="Assignee" value="Olivia Rhye" avatar={{ initials: 'OR' }} supportingText="@olivia" />
          </div>
          <div className="w-(--size-width-xxs)">
            <TextControl type="multi-line" aria-label="Description" defaultValue="Text starts at the top left and wraps." />
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
      { name: 'Root', description: 'Horizontal (multi-line: vertical), Fill width; height size/control/{Size} (multi-line: min text-control/multiline-min-height, grows). Border border/width/default, radius/control, padding-x text-control/padding-x/{Size}.', tokens: ['size/control/md', 'text-control/padding-x/md', 'radius/control', 'border/width/default'] },
      { name: 'Leading slot', description: 'One of: leading icon (size/icon/md), 2.6 Avatar Size=xs, or a status dot. Fixed; never shifts the text baseline.', tokens: ['size/icon/md', 'color/icon/tertiary'] },
      { name: 'Prefix', description: 'Single-line only. Static text that is part of the value; flush with the left edge, padding-x as the control, right border color/border/default.', tokens: ['color/text/tertiary', 'color/border/default'] },
      { name: 'Content', description: 'Fills the width, gap space/md between leading visual, text and supporting text.', tokens: ['space/md'] },
      { name: 'Text', description: 'The placeholder (color/text/placeholder) or the value (color/text/primary) — one layer; Filled is derived from the value. Single line truncates with an ellipsis; multi-line is top-aligned and wraps.', tokens: ['type/body/md/regular', 'color/text/placeholder', 'color/text/primary', 'font/size/input-min'] },
      { name: 'Supporting text', description: 'Optional secondary text after the value (select), hugs, color/text/tertiary.', tokens: ['color/text/tertiary'] },
      { name: 'Trailing slot', description: '2.13 Help icon, 2.17 Kbd shortcut, a trailing icon (password reveal), or the status icon (alert-circle, color/icon/danger) when invalid — it replaces the Help icon.', tokens: ['size/icon/sm', 'color/icon/danger'] },
      { name: 'Chevron', description: 'Type=select only: chevron-down, size/icon/md, color/icon/tertiary. The whole trigger opens the menu (3.5).', tokens: ['size/icon/md'] },
      { name: 'Resize handle', description: 'Multi-line only: 12 × 12 grip in the bottom-right corner, inset space/sm; drag to enlarge on desktop.', tokens: ['size/icon/xs', 'space/sm'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: "'single-line' | 'multi-line' | 'select'", default: "'single-line'", description: 'Input, text area, or select trigger with the chevron.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height, padding and text style; matches Button sm / md / lg.' },
    { name: 'status', figma: 'Status', type: "'none' | 'invalid'", default: "'none'", description: 'Danger border, status icon and aria-invalid. The message is a 2.12 Help text.' },
    { name: 'placeholder', figma: 'Text (Filled=false)', type: 'string', description: 'An example of the expected format, never the label.' },
    { name: 'value / defaultValue', figma: 'Text (Filled=true) · Filled', type: 'string', description: 'The value; Filled is derived from it. Controlled with value + onValueChange.' },
    { name: 'onValueChange', type: '(value: string) => void', description: 'Called with the new text (single-line, multi-line).' },
    { name: 'inputType', type: 'HTMLInputTypeAttribute', default: "'text'", description: 'Native type of the single-line input: email, password, tel, search…' },
    { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', type: 'IconName', description: 'Names the kind of value.' },
    { name: 'avatar', figma: 'Show avatar', type: '{ src?: string; initials?: string }', description: 'A 2.6 Avatar Size=xs before the value.' },
    { name: 'showDot', figma: 'Show dot', type: 'boolean', default: 'false', description: 'A leading status dot.' },
    { name: 'prefix', figma: 'Show prefix + Prefix', type: 'string', description: 'Static prefix segment (single-line).' },
    { name: 'supportingText', figma: 'Show supporting text + Supporting text', type: 'ReactNode', description: 'Secondary text after the value.' },
    { name: 'showHelpIcon', figma: 'Show help icon', type: 'boolean', default: 'false', description: 'Trailing 2.13 Help icon; `helpText` is its Tooltip.' },
    { name: 'shortcut', figma: 'Show shortcut', type: 'string | string[]', description: 'Keys of the shortcut, one 2.17 Kbd per key. Pair with aria-keyshortcuts.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName', description: 'Trailing icon; with onTrailingIconClick + trailingIconLabel it is a button.' },
    { name: 'showResizeHandle', figma: 'Show resize handle', type: 'boolean', default: 'true', description: 'Multi-line: vertical resize with the corner grip.' },
    { name: 'open', type: 'boolean', description: 'Select: the menu is open (aria-expanded); looks like State=focus.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Disabled fill and text; adornments disabled.' },
    { name: 'forceState', figma: 'State=hover / focus', type: "'hover' | 'focus'", description: 'Documentation only: pins a pseudo-state.' },
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
      title: 'Which type',
      body: 'Single-line for short values: names, emails, numbers, search. Multi-line for free text longer than one line: comments, descriptions, messages. Select for choosing one value from a list the system knows; it opens 3.5 Select’s menu.',
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
      title: 'Anatomy: label → control → hint',
      body: 'The box is the Part; the field is the Component. 2.11 Label sits above, this control in the middle, 2.12 Help text below — as they come together on 3.2 Text field.',
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
      title: 'Status vs state',
      body: 'State is interaction (hover, focus, disabled). Status is validation (invalid). They combine: an invalid control keeps the danger border at rest, on hover and on focus — only focus adds the ring. The error message always appears as 2.12 Help text; the border and status icon alone are not enough.',
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
        caption: 'Invalid border plus a Help text message that says how to fix it.',
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
      title: 'Adornments',
      body: 'Leading icon names the kind of value (mail, search, calendar). Prefix is static text that is part of the value but not typed (https://, a currency symbol). Avatar and dot are for select values that are people or statuses. Help icon opens a Tooltip with more context. Shortcut shows the key that focuses the control. Trailing icon is a small action on the value (show / hide password). Use one leading visual at a time.',
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
      title: 'Multi-line behaviour',
      body: 'Text starts at the top-left and wraps; the control grows with content up to the layout’s limit, then scrolls. The resize handle lets people enlarge it on desktop.',
      do: { caption: 'Top-aligned text.', render: () => <div className="w-[16rem]"><TextControl type="multi-line" aria-label="Message" defaultValue="Thanks for the update — I’ll review it today." /></div> },
      dont: {
        caption: 'Vertically centred multi-line text.',
        render: () => (
          <div className="flex h-(--text-control-multiline-min-height) w-[16rem] items-center rounded-control border border-border-default bg-surface-base px-lg type-body-md-regular text-text-primary">
            Thanks for the update — I’ll review it today.
          </div>
        ),
      },
    },
    {
      title: 'Placeholder and value content',
      body: 'Placeholders show an example of the expected format (“you@company.com”), never the label, and never instructions people need after they start typing. Long values truncate with an ellipsis in single-line and select; they wrap in multi-line.',
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
      body: 'On mobile, value text is at least 16 (font/size/input-min) so the browser does not zoom into the field on focus. Size sm uses 14 on desktop and switches to 16 on touch screens automatically.',
    },
    {
      title: 'Select triggers',
      body: 'The select trigger is its own Type: the chevron is part of it and the whole box opens the menu. Never build a select from a single-line control with a chevron icon pasted in — it reads as a text input and does not open.',
      do: { caption: 'Type=select: the whole box is the trigger.', render: () => <div className="w-[16rem]"><TextControl type="select" aria-label="Country" value="Portugal" /></div> },
      dont: { caption: 'A text input with a trailing chevron icon.', render: () => <div className="w-[16rem]"><TextControl aria-label="Country" defaultValue="Portugal" trailingIcon="arrows/chevron-down" /></div> },
    },
  ],
  accessibility: [
    'Every control has a visible label in product (3.2 Text field links it with htmlFor). Placeholder is never the label; standalone controls take aria-label.',
    'Focus is always visible (focus/default) and distinct from hover; invalid controls keep the ring on focus (focus/danger).',
    'Status=invalid sets aria-invalid; the message is a 2.12 Help text referenced with aria-describedby.',
    'The border meets non-text contrast (3:1) against the surface; text meets text contrast. Disabled values stay legible — prefer readOnly when people need to copy the value.',
    'Select triggers are buttons with aria-haspopup="listbox" and aria-expanded; the trailing icon button and help icon have their own accessible names.',
    'On touch screens the value is at least 16 so the browser does not zoom on focus.',
  ],
});
