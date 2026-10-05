import { CodeField, TextareaField, TextField, textFieldTypes, type TextareaFieldType, type TextFieldSize, type TextFieldType } from '@/components/components/TextField';
import { CodeFieldCell, TextFieldAddon, TextFieldTagBox, type TextFieldAddonType } from '@/components/components/_TextFieldParts';
import { Button } from '@/components/parts/Button';
import { Link } from '@/components/parts/Link';
import { TextControl } from '@/components/parts/TextControl';
import type { TextControlStatus } from '@/components/parts/TextControl';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'invalid'] as const;
/** Columns: Filled → State. */
const COLS = ['placeholder · rest', 'placeholder · focus', 'placeholder · disabled', 'filled · rest', 'filled · focus', 'filled · disabled'] as const;
const ROWS = SIZES.flatMap((s) => STATUSES.map((st) => `${s} · ${st}`));
const TA_ROWS = (['sm', 'md'] as const).flatMap((s) => STATUSES.map((st) => `${s} · ${st}`));

const sample: Record<TextFieldType, { label: string; placeholder: string; value: string; tags?: string[] }> = {
  default: { label: 'Email address', placeholder: 'you@company.com', value: 'olivia@company.com' },
  'leading-text': { label: 'Website', placeholder: 'www.example.com', value: 'example.com' },
  'leading-dropdown': { label: 'Phone number', placeholder: '+1 (555) 000-0000', value: '+1 555 0100' },
  'trailing-dropdown': { label: 'Amount', placeholder: '0.00', value: '1,000.00' },
  'trailing-button': { label: 'Share link', placeholder: 'Link', value: 'example.com/s/8f3k' },
  password: { label: 'Password', placeholder: 'Enter your password', value: 'correct-horse' },
  payment: { label: 'Card number', placeholder: '1234 1234 1234 1234', value: '4242 4242 4242 4242' },
  'date-time': { label: 'Start date', placeholder: 'Select a date', value: '18 Mar 2026' },
  'tags-inner': { label: 'Invite people', placeholder: 'Add people', value: '', tags: ['olivia@company.com', 'phoenix@company.com'] },
  'tags-outer': { label: 'Topics', placeholder: 'Add a topic', value: 'Research', tags: ['Design', 'Product'] },
  'counter-horizontal': { label: 'Seats', placeholder: '0', value: '12' },
  'counter-vertical': { label: 'Quantity', placeholder: '0', value: '12' },
  'file-upload': { label: 'Attachment', placeholder: 'No file chosen', value: 'quarterly-report.pdf' },
};

function fieldVariant(type: TextFieldType, row: string, col: (typeof COLS)[number]) {
  const [size, status] = row.split(' · ') as [TextFieldSize, TextControlStatus];
  const [filled, state] = col.split(' · ');
  if (state === 'disabled' && status === 'invalid') return <span className="type-body-xs-regular text-text-tertiary">—</span>;
  const s = sample[type];
  const isFilled = filled === 'filled';
  return (
    <div className="w-[16rem]">
      <TextField
        type={type}
        size={size}
        status={status}
        label={s.label}
        hint={status === 'invalid' ? 'Check this value and try again.' : 'This is a hint text to help the user.'}
        placeholder={s.placeholder}
        defaultValue={isFilled ? s.value : ''}
        defaultTags={type === 'tags-inner' ? (isFilled ? s.tags : []) : s.tags}
        forceState={state === 'focus' ? 'focus' : undefined}
        disabled={state === 'disabled'}
      />
    </div>
  );
}

function textareaVariant(type: TextareaFieldType, row: string, col: (typeof COLS)[number]) {
  const [size, status] = row.split(' · ') as ['sm' | 'md', TextControlStatus];
  const [filled, state] = col.split(' · ');
  if (state === 'disabled' && status === 'invalid') return <span className="type-body-xs-regular text-text-tertiary">—</span>;
  const isFilled = filled === 'filled';
  return (
    <div className="w-[16rem]">
      <TextareaField
        type={type}
        size={size}
        status={status}
        label={type === 'default' ? 'Description' : 'Topics'}
        hint={status === 'invalid' ? 'Write at least 20 characters.' : 'This is a hint text to help the user.'}
        placeholder={type === 'tags-inner' ? 'Add topics' : 'Enter a description…'}
        defaultValue={isFilled && type !== 'tags-inner' ? 'A short summary of the project goals and the team working on it.' : ''}
        defaultTags={type === 'tags-inner' ? (isFilled ? ['Design', 'Research', 'Q2'] : []) : type === 'tags-outer' ? ['Design', 'Research'] : []}
        forceState={state === 'focus' ? 'focus' : undefined}
        disabled={state === 'disabled'}
      />
    </div>
  );
}

const ADDON_TYPES: TextFieldAddonType[] = ['dropdown', 'button', 'stepper', 'stepper-vertical'];
const ADDON_ROWS = ADDON_TYPES.flatMap((t) => (['left', 'right'] as const).flatMap((p) => SIZES.map((s) => `${t} · ${p} · ${s}`)));
const TAGBOX_ROWS = (['single-line', 'multi-line'] as const).flatMap((t) => STATUSES.flatMap((st) => SIZES.map((s) => `${t} · ${st} · ${s}`)));
const CELL_ROWS = SIZES.flatMap((s) => STATUSES.map((st) => `${s} · ${st}`));
const noop = () => {};

export default defineDoc({
  id: '3.2',
  name: 'Text field',
  level: 'components',
  spec: 'components/3.2-text-field.md',
  exports: ['TextField', 'TextareaField', 'CodeField'],
  summary:
    'Text fields let people type data like names, emails, amounts and dates. Pick a type to add a prefix, dropdown, button or tags around the value. Use a textarea for longer text and a code field for verification codes.',
  hero: () => (
    <div className="w-(--size-width-xxs)">
      <TextField label="Email address" required leadingIcon="communication/mail" placeholder="you@company.com" hint="We'll only use this for receipts." inputType="email" />
    </div>
  ),
  playground: {
    controls: [
      { name: 'type', figma: 'Type', control: { type: 'select', options: textFieldTypes }, default: 'default' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'status', figma: 'Status', control: { type: 'select', options: STATUSES }, default: 'none' },
      { name: 'label', figma: 'Show label + Label', control: { type: 'text' }, default: 'Label' },
      { name: 'hint', figma: 'Show hint + Hint', control: { type: 'text' }, default: 'This is a hint text to help the user.' },
      { name: 'placeholder', figma: 'Text control › Text', control: { type: 'text' }, default: 'Placeholder' },
      { name: 'required', figma: 'Label › Show required', control: { type: 'boolean' }, default: false },
      { name: 'leadingIcon', figma: 'Text control › Leading icon', control: { type: 'icon' }, default: undefined },
      { name: 'showTime', figma: 'Show time', control: { type: 'boolean' }, default: false },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => (
      <div className="w-(--size-width-xxs)">
        <TextField key={a.type} {...a} label={a.label || undefined} hint={a.hint || undefined} defaultTags={a.type.startsWith('tags') ? ['Design', 'Research'] : undefined} />
      </div>
    ),
    code: (a) =>
      `<TextField${jsxProps(a, { type: 'default', size: 'md', status: 'none', required: false, showTime: false, disabled: false }, a.type === 'date-time' ? [] : ['showTime'])} />`,
  },
  examples: [
    {
      title: 'Sign-up dialog',
      caption: 'Every field has the same label, control and hint, and people can show the password when they want to check it.',
      render: () => (
        <form className="flex w-full max-w-[22rem] flex-col gap-xl rounded-surface border border-border-subtle bg-surface-raised p-2xl shadow-raised" onSubmit={(e) => e.preventDefault()}>
          <span className="type-heading-xs-semibold text-text-primary">Create your account</span>
          <TextField label="Full name" required autoComplete="name" placeholder="Olivia Rhye" />
          <TextField label="Email address" required inputType="email" autoComplete="email" placeholder="you@company.com" />
          <TextField type="password" label="Password" required autoComplete="new-password" hint="Use 8 or more characters with at least one number." />
          <Button type="submit" label="Create account" fullWidth />
        </form>
      ),
      code: `<form className="flex flex-col gap-xl">
  <TextField label="Full name" required autoComplete="name" placeholder="Olivia Rhye" />
  <TextField label="Email address" required inputType="email" autoComplete="email" placeholder="you@company.com" />
  <TextField type="password" label="Password" required autoComplete="new-password" hint="Use 8 or more characters with at least one number." />
  <Button type="submit" label="Create account" fullWidth />
</form>`,
    },
    {
      title: 'Website field',
      caption: 'The fixed “https://” prefix sits inside the box, so people only type the rest.',
      render: () => (
        <div className="w-full max-w-[22rem]">
          <TextField type="leading-text" label="Website" prefix="https://" placeholder="www.example.com" defaultValue="example.com" hint="Your public company page." />
        </div>
      ),
      code: `<TextField type="leading-text" label="Website" prefix="https://" placeholder="www.example.com" hint="Your public company page." />`,
    },
    {
      title: 'Invite form',
      caption: 'Tags wrap inside the box as the list grows. Enter or a comma adds one, and Backspace removes the last.',
      render: () => (
        <div className="flex w-full max-w-[24rem] flex-col items-end gap-lg">
          <TextField type="tags-inner" label="Invite people" placeholder="Add people" defaultTags={['olivia@company.com', 'phoenix@company.com', 'lana@company.com']} hint="They’ll get an email with a link to join." />
          <Button label="Send invites" />
        </div>
      ),
      code: `<TextField
  type="tags-inner"
  label="Invite people"
  placeholder="Add people"
  tags={people}
  onTagsChange={setPeople}
  hint="They’ll get an email with a link to join."
/>`,
    },
    {
      title: 'Verification screen',
      caption: 'Two groups of three make a six-digit code easy to check, and pasting fills every cell.',
      render: () => (
        <div className="flex flex-col items-center gap-xl text-center">
          <div className="flex flex-col gap-xs">
            <span className="type-heading-sm-semibold text-text-primary">Check your email</span>
            <span className="type-body-sm-regular text-text-tertiary">We sent a code to olivia@company.com</span>
          </div>
          <CodeField type="6-digit" size="sm" label="Verification code" hint="The code expires in 10 minutes." />
          <span className="type-body-sm-regular text-text-tertiary">
            Didn’t get it? <Link type="inline" href="#" label="Resend code" onClick={(e) => e.preventDefault()} />
          </span>
        </div>
      ),
      code: `<CodeField type="6-digit" size="sm" label="Verification code" hint="The code expires in 10 minutes." onComplete={verify} />
<Link type="inline" href="/resend" label="Resend code" />`,
    },
  ],
  whenToUse: {
    use: [
      'Typed data in forms and dialogs, like names, emails, amounts, links, dates or people.',
      'A textarea field for longer free text, like descriptions, messages and notes.',
      'A code field for one-time and verification codes.',
    ],
    dont: [
      'For picking from a known list, use a Select (3.5).',
      'For yes / no or one-of-a-few choices, use a Choice field (3.3).',
      'For text that needs formatting, use a Rich text editor (4.1).',
    ],
  },
  matrices: [
    ...textFieldTypes.map((type) => ({
      title: `Text field · Type=${type}`,
      rows: 'Size × Status',
      columns: 'Filled × State',
      render: () => <Matrix rowProp="Size · Status" rows={ROWS} colProp="Filled · State" cols={COLS} cell={(r, c) => fieldVariant(type, r, c)} />,
    })),
    {
      title: 'Text field · Boolean options',
      render: () => (
        <div className="flex flex-wrap items-start gap-3xl rounded-surface border border-dashed border-border-brand-subtle p-xl">
          {[
            { k: 'Show label = false', n: <TextField aria-label="Search" placeholder="Search" hint="Press Enter to search." /> },
            { k: 'Show hint = false', n: <TextField label="Full name" placeholder="Olivia Rhye" /> },
            { k: 'Show time = true', n: <TextField type="date-time" showTime label="Start" placeholder="Select a date" defaultValue="18 Mar 2026" hint="Times are in your time zone." /> },
          ].map(({ k, n }) => (
            <div key={k} className="flex w-[18rem] flex-col items-start gap-md">
              <AxisLabel prop={k.split(' = ')[0]} value={k.split(' = ')[1]} />
              {n}
            </div>
          ))}
        </div>
      ),
    },
    ...(['default', 'tags-inner', 'tags-outer'] as const).map((type) => ({
      title: `Textarea field · Type=${type}`,
      rows: 'Size × Status',
      columns: 'Filled × State',
      render: () => <Matrix rowProp="Size · Status" rows={TA_ROWS} colProp="Filled · State" cols={COLS} cell={(r, c) => textareaVariant(type, r, c)} />,
    })),
    {
      title: 'Code field',
      rows: 'Size',
      columns: 'Type',
      render: () => (
        <Matrix
          rowProp="Size"
          rows={SIZES}
          colProp="Type"
          cols={['4-digit', '6-digit'] as const}
          cell={(size, type) => <CodeField size={size} type={type} label="Secure code" hint="This is a hint text to help the user." defaultValue="12" />}
        />
      ),
    },
  ],
  privateParts: [
    {
      title: '.Main/Text field addon',
      rows: 'Type × Placement × Size',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The dropdowns, buttons and steppers that attach before or after the control.</p>
          <Matrix
            rowProp="Type · Placement · Size"
            rows={ADDON_ROWS}
            colProp="State"
            cols={['rest', 'hover', 'disabled'] as const}
            cell={(row, state) => {
              const [type, placement, size] = row.split(' · ') as [TextFieldAddonType, 'left' | 'right', TextFieldSize];
              return (
                <TextFieldAddon
                  size={size}
                  type={type}
                  placement={placement}
                  text={type === 'button' ? 'Copy' : 'US'}
                  icon={type === 'button' ? 'general/copy' : undefined}
                  label="Example"
                  disabled={state === 'disabled'}
                  forceState={state === 'hover' ? 'hover' : undefined}
                  onClick={noop}
                />
              );
            }}
          />
        </div>
      ),
    },
    {
      title: '.Main/Text field tag box',
      rows: 'Type × Status × Size',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The control box that holds tags. It uses the same tokens as the Text control.</p>
          <Matrix
            rowProp="Type · Status · Size"
            rows={TAGBOX_ROWS}
            colProp="State"
            cols={['rest', 'focus', 'disabled'] as const}
            cell={(row, state) => {
              const [type, status, size] = row.split(' · ') as ['single-line' | 'multi-line', TextControlStatus, TextFieldSize];
              if (state === 'disabled' && status === 'invalid') return <span className="type-body-xs-regular text-text-tertiary">—</span>;
              return (
                <div className="w-[16rem]">
                  <TextFieldTagBox
                    size={size}
                    type={type}
                    status={status}
                    disabled={state === 'disabled'}
                    forceState={state === 'focus' ? 'focus' : undefined}
                    tags={['Design', 'Research']}
                    onAdd={noop}
                    onRemove={noop}
                    placeholder="Add people"
                  />
                </div>
              );
            }}
          />
        </div>
      ),
    },
    {
      title: '.Main/Code field cell',
      rows: 'Size × Status',
      columns: 'Filled × State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">One digit of a code field. Its border, focus and invalid styles match the Text control.</p>
          <Matrix
            rowProp="Size · Status"
            rows={CELL_ROWS}
            colProp="Filled · State"
            cols={['false · rest', 'false · focus', 'false · disabled', 'true · rest', 'true · focus', 'true · disabled'] as const}
            cell={(row, col) => {
              const [size, status] = row.split(' · ') as [TextFieldSize, TextControlStatus];
              const [filled, state] = col.split(' · ');
              if (state === 'disabled' && status === 'invalid') return <span className="type-body-xs-regular text-text-tertiary">—</span>;
              return (
                <CodeFieldCell
                  size={size}
                  status={status}
                  digit={filled === 'true' ? '7' : ''}
                  disabled={state === 'disabled'}
                  forceState={state === 'focus' ? 'focus' : undefined}
                  aria-label="Digit"
                  readOnly
                />
              );
            }}
          />
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex w-full flex-col gap-3xl">
        <div className="mx-auto w-(--size-width-xxs)">
          <TextField label="Label" required showLabelHelpIcon labelHelpText="Short, optional detail." placeholder="Text control" hint="Help text: the hint or the error." />
        </div>
        <div className="grid gap-x-3xl gap-y-xl md:grid-cols-2 xl:grid-cols-3">
          {textFieldTypes.map((t) => (
            <div key={t} className="flex flex-col items-start gap-sm">
              <AxisLabel prop="Type" value={t} />
              <div className="w-full">
                <TextField type={t} aria-label={sample[t].label} placeholder={sample[t].placeholder} defaultValue={sample[t].value} defaultTags={sample[t].tags} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-md">
          <span className="type-body-sm-semibold text-text-primary">Joined edges</span>
          <div className="flex flex-wrap items-center gap-3xl">
            <div className="w-[18rem] scale-125 origin-left">
              <TextField type="leading-dropdown" aria-label="Phone" defaultValue="+1 555 0100" />
            </div>
          </div>
          <div className="mt-xl w-[18rem] scale-125 origin-left">
            <TextField type="trailing-button" aria-label="Link" defaultValue="example.com/s/8f3k" />
          </div>
        </div>
        <div className="flex flex-col items-start gap-md">
          <span className="type-body-sm-semibold text-text-primary">Code field</span>
          <CodeField size="md" label="Verification code" defaultValue="12" />
        </div>
        <div className="flex flex-wrap items-start gap-xl">
          {SIZES.map((s) => (
            <div key={s} className="flex w-[14rem] flex-col gap-sm">
              <AxisLabel prop="Size" value={s} />
              <TextField size={s} label="Label" placeholder="Placeholder" hint="Hint" />
            </div>
          ))}
        </div>
      </div>
    ),
    parts: [
      { name: 'Field', target: 'field', description: 'Stacks the label, control and hint with a small gap. It fills the width of its layout and grows taller when the hint wraps or tags add rows.', tokens: ['space/sm', 'size/width/xxs'] },
      { name: 'Label', target: 'label', description: 'A Label (2.11) linked to the input. Small fields use the small label, medium and large fields the medium one. It can show a required mark and a help icon.', tokens: ['type/body/sm/medium'] },
      { name: 'Control row', target: 'control-row', description: 'Holds the control and any addons, overlapped so they share one border line. The control fills the row, and addons take only the space they need.', tokens: ['border/width/default'] },
      { name: 'Leading / trailing addon', target: 'addon', description: 'An attached dropdown, button (a real Button, 2.1) or stepper, rounded only on its outer side. The vertical counter shows − and + side by side, so each button is at least 24 × 24 px.', tokens: ['space/lg', 'color/border/default', 'color/fill/neutral/subtle/hover'] },
      { name: 'Text control', target: 'root', description: 'The input itself: a Text control (2.10), or the tag box for tags-inner. Its joined corners are square, and it moves in front of the addons on focus.', tokens: ['radius/control', 'focus/default'] },
      { name: 'Tags row', target: 'tags-row', description: 'For tags-outer: a wrapping row of Tags (2.5) below the control.', tokens: ['space/sm'] },
      { name: 'Help text', target: 'help-text', description: 'Help text (2.12) with the same size and status as the field. Screen readers read it as the field’s description.', tokens: ['type/body/sm/regular'] },
      { name: 'Code cell', target: 'code-cell', description: 'One square cell per digit, with the digit in a large display style. An empty cell shows a “0” placeholder.', tokens: ['code-field/cell-size/md', 'type/display/sm/semibold'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: 'TextFieldType', default: "'default'", description: 'What sits before and after the value: a prefix, dropdown, button, password reveal, payment mark, date and time, tags, counter or file upload.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'The control height. Label and help text are sm for sm fields, md for md and lg. Textarea field takes sm | md, and on Code field it sets the cell size.' },
    { name: 'status', figma: 'Status', type: "'none' | 'invalid'", default: "'none'", description: 'Invalid adds a danger border, danger help text and aria-invalid. Put the error message in hint.' },
    { name: 'label', figma: 'Show label + Label', type: 'ReactNode', description: 'The field’s name, linked with htmlFor. Without a label, pass aria-label.' },
    { name: 'hint', figma: 'Show hint + Hint', type: 'ReactNode', description: 'The hint, or the error message when invalid. Linked with aria-describedby.' },
    { name: 'required', figma: 'Label › Show required', type: 'boolean', description: 'Adds an asterisk to the label and sets required on the input.' },
    { name: 'showLabelHelpIcon / labelHelpText', figma: 'Label › Show help icon', type: 'boolean / ReactNode', description: 'A help icon after the label, and the text of its tooltip.' },
    { name: 'value / defaultValue / onValueChange', figma: 'Filled', type: 'string', description: 'The value. The Figma Filled property follows from it.' },
    { name: 'placeholder', figma: 'Text control › Text', type: 'string', description: 'An example of the expected format.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', description: 'Disables the control and addons. The label stays readable.' },
    { name: 'prefix', type: 'string', default: "'https://'", description: 'For leading-text: the fixed prefix inside the box.' },
    { name: 'dropdownOptions / dropdownValue / onDropdownChange / dropdownLabel', type: 'string[] / string', description: 'For leading-dropdown, trailing-dropdown and the date-time time picker: the addon’s options, value and accessible name.' },
    { name: 'buttonLabel / buttonIcon / onButtonClick', type: 'string / IconName / () => void', description: 'The addon button for trailing-button (“Copy”) and file-upload (“Choose file”).' },
    { name: 'showTime', figma: 'Show time', type: 'boolean', default: 'false', description: 'For date-time: adds a time dropdown after the date.' },
    { name: 'paymentMark', type: 'ReactNode', description: 'For payment: the card mark from 1.8 Brand assets.' },
    { name: 'tags / defaultTags / onTagsChange', type: 'string[]', description: 'For tags-inner and tags-outer: the tags.' },
    { name: 'min / max / step', type: 'number', description: 'For counter-horizontal and counter-vertical: the stepper limits. Arrow keys step the value too.' },
    { name: 'accept / multiple / onFilesChange', type: 'string / boolean / (files) => void', description: 'For file-upload: options for the native file picker.' },
    { name: 'controlProps', type: 'Partial<TextControlProps>', description: 'Options for the nested Text control, like its help icon or shortcut.' },
    { name: 'CodeField type', figma: 'Code field › Type', type: "'4-digit' | '6-digit'", default: "'4-digit'", description: 'Four cells, or two groups of three with a separator.' },
    { name: 'CodeField onComplete', type: '(code: string) => void', description: 'Called when every cell holds a digit.' },
    { name: 'TextareaField showResizeHandle', figma: 'Show resize handle', type: 'boolean', default: 'true', description: 'Shows a grip for resizing the field vertically.' },
    { name: 'forceState', figma: 'State=focus', type: "'focus'", description: 'For documentation only.' },
  ],
  tokens: [
    'space/sm', 'size/width/xxs', 'border/width/default', 'radius/control', 'color/border/default', 'color/border/disabled', 'color/border/danger',
    'color/text/secondary', 'color/text/disabled', 'color/fill/none', 'color/fill/neutral/subtle/hover', 'color/icon/secondary', 'color/icon/primary', 'color/icon/disabled',
    'color/text/placeholder', 'color/text/brand', 'color/text/danger', 'space/lg', 'space/xl', 'space/md',
    'code-field/cell-size/sm', 'code-field/cell-size/md', 'code-field/cell-size/lg', 'type/heading/xl/semibold', 'type/display/sm/semibold', 'type/display/md/semibold',
    'size/control/sm', 'size/control/md', 'size/control/lg', 'text-control/multiline-min-height', 'font/size/input-min', 'focus/default', 'focus/danger',
  ],
  guidelines: [
    {
      title: 'When to use',
      body: 'Use a text field when people type the value. When they pick from a known list, use a Select (3.5). For yes / no or one-of-a-few choices, use a Choice field (3.3), and for formatted text, a Rich text editor (4.1).',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-2">
          <TextField label="Company name" placeholder="Acme Inc." hint="Typed data → Text field." />
          <div className="flex flex-col gap-sm">
            <span className="type-body-sm-medium text-text-secondary">Country</span>
            <TextControl type="select" aria-label="Country" value="Portugal" />
            <span className="type-body-sm-regular text-text-tertiary">A known list → Select (3.5).</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Label, control, hint',
      body: 'Every field uses the same three rows with the same small gap between them. Only the control changes, so forms stay easy to scan.',
      render: () => (
        <div className="w-(--size-width-xxs)">
          <TextField label="Email address" placeholder="you@company.com" hint="We’ll only use this for receipts." />
        </div>
      ),
      do: { caption: 'Keep the label visible.', render: () => <div className="w-[16rem]"><TextField label="Email address" placeholder="you@company.com" /></div> },
      dont: { caption: 'The placeholder doubles as the label.', render: () => <div className="w-[16rem]"><TextField aria-label="Email address" placeholder="Email address" /></div> },
    },
    {
      title: 'Status and state are separate',
      body: 'Invalid describes the value, and focus describes where the person is. A field can be both at once.',
      render: () => (
        <Matrix
          rowProp="Status"
          rows={STATUSES}
          colProp="State"
          cols={['rest', 'focus', 'disabled'] as const}
          cell={(status, state) =>
            state === 'disabled' && status === 'invalid' ? (
              <span className="type-body-xs-regular text-text-tertiary">—</span>
            ) : (
              <div className="w-[14rem]">
                <TextField label="Email" status={status} defaultValue="olivia@" hint={status === 'invalid' ? 'Enter a full email address.' : 'Work email.'} forceState={state === 'focus' ? 'focus' : undefined} disabled={state === 'disabled'} />
              </div>
            )
          }
        />
      ),
    },
    {
      title: 'Types change what’s around the value',
      body: 'A type is more than a different placeholder. Each one changes what sits before or after the value.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-2 xl:grid-cols-3">
          {(['leading-text', 'leading-dropdown', 'trailing-button', 'password', 'tags-inner'] as const).map((t) => (
            <div key={t} className="flex flex-col gap-sm">
              <AxisLabel prop="Type" value={t} />
              <TextField type={t} label={sample[t].label} placeholder={sample[t].placeholder} defaultValue={sample[t].value} defaultTags={sample[t].tags} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Joined edges',
      body: 'Addons and the control share one border line, with square inner corners and rounded outer corners. A button addon holds a real button, not text styled as a link, so it looks and works like an action.',
      do: { caption: 'A button addon for the action.', render: () => <div className="w-[18rem]"><TextField type="trailing-button" aria-label="Share link" defaultValue="example.com/s/8f3k" /></div> },
      dont: {
        caption: 'Addon text styled as a link.',
        render: () => (
          <div className="flex w-[18rem] items-center gap-md">
            <TextControl aria-label="Share link" defaultValue="example.com/s/8f3k" />
            <span className="type-body-sm-semibold text-text-brand underline">Copy</span>
          </div>
        ),
      },
    },
    {
      title: 'Tags grow the field',
      body: 'Tags wrap onto new lines, so the field grows taller instead of scrolling sideways.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-2">
          <TextField type="tags-inner" label="Two tags" defaultTags={['Design', 'Research']} />
          <TextField type="tags-inner" label="Seven tags" defaultTags={['Design', 'Research', 'Product', 'Marketing', 'Sales', 'Support', 'Legal']} />
        </div>
      ),
      do: { caption: 'Let tags wrap to new lines.', render: () => <div className="w-[16rem]"><TextField type="tags-inner" aria-label="Tags" defaultTags={['Design', 'Research', 'Product', 'Sales']} /></div> },
      dont: {
        caption: 'A tags field that scrolls sideways.',
        render: () => (
          <div className="flex w-[16rem] gap-sm overflow-hidden rounded-control border border-border-default bg-surface-base px-lg py-sm">
            {['Design', 'Research', 'Product', 'Sales'].map((t) => (
              <span key={t} className="type-body-xs-medium shrink-0 rounded-sm border border-border-default px-md py-xxs text-text-secondary">
                {t}
              </span>
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Code fields',
      body: 'Group long codes so people can read them back: show six digits as two groups of three with a separator. Cells keep their size, so the field gets wider instead of shrinking the digits.',
      render: () => (
        <div className="flex flex-wrap items-start gap-3xl">
          <CodeField size="sm" label="4-digit" />
          <CodeField size="sm" type="6-digit" label="6-digit" defaultValue="123" />
        </div>
      ),
      do: { caption: 'Large cells, grouped in threes.', render: () => <CodeField size="sm" type="6-digit" aria-label="Code" /> },
      dont: {
        caption: 'Cells shrunk to fit a narrow column.',
        render: () => (
          <div className="flex gap-xxs">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="type-body-sm-regular flex size-(--size-control-xs) items-center justify-center rounded-xs border border-border-default bg-surface-base text-text-placeholder">
                0
              </span>
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Textarea text',
      body: 'Text in a textarea starts at the top left, and people can resize the field vertically. Avoid centering the text.',
      do: { caption: 'Top-aligned text.', render: () => <div className="w-[16rem]"><TextareaField aria-label="Message" defaultValue="Thanks — I’ll review it today." /></div> },
      dont: {
        caption: 'Vertically centered text.',
        render: () => (
          <div className="type-body-md-regular flex h-(--text-control-multiline-min-height) w-[16rem] items-center rounded-control border border-border-default bg-surface-base px-lg text-text-primary">
            Thanks — I’ll review it today.
          </div>
        ),
      },
    },
    {
      title: 'Mobile text size',
      body: 'Text of 16 px or larger stops mobile browsers zooming in when a field gets focus. On touch screens, the Text control switches small sizes to font/size/input-min, so every field inherits it.',
    },
    {
      title: 'Content',
      body: 'Labels name the data (“Email address”), hints say what a valid value looks like, and placeholders show an example, not instructions. Error messages say how to fix the problem: “Enter a date after 1 January 2026.” Keep prefixes and suffixes short, like “https://”, “USD” or “kg”.',
    },
    {
      title: 'Maintenance',
      body: 'Change the input box in Text control (2.10), the label style in Label (2.11), and the hint and error style in Help text (2.12). Addons, the tag box and code cells are edited in the .Main parts on this page.',
    },
  ],
  accessibility: [
    'The label gives the control its name (htmlFor), and the help text becomes its description (aria-describedby). An invalid field sets aria-invalid and shows the error as text, so it doesn’t rely on color alone.',
    'Addon dropdowns and steppers are focusable controls with their own names (“Country code”, “Increase”, “Decrease”). The arrow keys on the input step the value too (role="spinbutton").',
    'The password reveal is a button whose name switches between “Show password” and “Hide password”.',
    'People can paste a whole code into a code field. Focus moves to the next cell as each digit is typed, Backspace goes back, and arrow keys move between cells. The first cell offers one-time-code autofill.',
    'Each tag has its own “Remove {tag}” button, and Backspace in the empty input removes the last tag.',
  ],
});
