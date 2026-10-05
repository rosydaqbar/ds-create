import { useState, type ReactNode } from 'react';
import { HelpText } from '@/components/parts/HelpText';
import { Label } from '@/components/parts/Label';
import { Checkbox } from '@/components/parts/Checkbox';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { TextControl } from '@/components/parts/TextControl';
import { DemoField } from './_demo';

const SIZES = ['sm', 'md'] as const;
const STATUSES = ['none', 'invalid'] as const;

/** Live example: the error replaces the hint in the same place. */
function EmailField() {
  const [value, setValue] = useState('anna@');
  const invalid = value.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  return (
    <DemoField className="max-w-[22rem]">
      <Label htmlFor="ht-email" label="Email address" />
      <TextControl id="ht-email" status={invalid ? 'invalid' : 'none'} value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="ht-email-msg" />
      <HelpText id="ht-email-msg" status={invalid ? 'invalid' : 'none'} hint={invalid ? 'Enter an email address like name@example.com.' : 'We’ll send the invite here.'} />
    </DemoField>
  );
}

const Step = ({ n, children }: { n: string; children: ReactNode }) => (
  <div className="flex w-[15rem] flex-col gap-md">
    <span className="type-body-xs-semibold text-text-tertiary">{n}</span>
    {children}
  </div>
);

export default defineDoc({
  id: '2.12',
  name: 'Help text',
  level: 'parts',
  spec: 'parts/2.12-help-text.md',
  exports: ['HelpText'],
  summary: "The hint or validation message under a form control. Status switches the same line from a neutral hint to a danger message without changing the field's layout.",
  hero: () => (
    <div className="scale-150">
      <HelpText hint="Use 8 or more characters with at least one number." />
    </div>
  ),
  playground: {
    controls: [
      { name: 'hint', figma: 'Hint', control: { type: 'text' }, default: 'This is a hint text to help the user.' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'status', figma: 'Status', control: { type: 'select', options: STATUSES }, default: 'none' },
    ],
    render: (a) => <HelpText {...a} />,
    code: (a) => `<HelpText id="field-hint"${jsxProps(a, { size: 'md', status: 'none' })} />`,
  },
  examples: [
    {
      title: 'Password field',
      caption: 'A hint says what a valid value looks like before the user types.',
      render: () => (
        <DemoField className="max-w-[22rem]">
          <Label htmlFor="ht-pw" label="Password" showRequired />
          <TextControl id="ht-pw" inputType="password" required aria-describedby="ht-pw-hint" />
          <HelpText id="ht-pw-hint" hint="Use 8 or more characters with at least one number." />
        </DemoField>
      ),
      code: `<Label htmlFor="password" label="Password" showRequired />
<TextControl id="password" inputType="password" required aria-describedby="password-hint" />
<HelpText id="password-hint" hint="Use 8 or more characters with at least one number." />`,
    },
    {
      title: 'Email field with an error',
      caption: 'The error replaces the hint in the same place; the control and the message turn danger together.',
      render: () => <EmailField />,
      code: `<Label htmlFor="email" label="Email address" />
<TextControl id="email" status="invalid" value="anna@" aria-describedby="email-msg" />
<HelpText id="email-msg" status="invalid" hint="Enter an email address like name@example.com." />`,
    },
    {
      title: 'Choice group',
      caption: 'Help text works under groups of choices as well as single inputs.',
      render: () => (
        <div role="group" aria-labelledby="ch-label" aria-describedby="ch-hint" className="flex flex-col gap-sm">
          <Label as="span" id="ch-label" label="Notification channel" />
          <div className="flex flex-col gap-md py-xs">
            {['Email', 'SMS', 'Push'].map((c, i) => (
              <label key={c} className="type-body-sm-medium flex items-center gap-md text-text-secondary">
                <Checkbox defaultChecked={i === 0} /> {c}
              </label>
            ))}
          </div>
          <HelpText id="ch-hint" hint="Choose at least one." />
        </div>
      ),
      code: `<div role="group" aria-labelledby="channel-label" aria-describedby="channel-hint">
  <Label as="span" id="channel-label" label="Notification channel" />
  <label><Checkbox defaultChecked /> Email</label>
  <label><Checkbox /> SMS</label>
  <label><Checkbox /> Push</label>
  <HelpText id="channel-hint" hint="Choose at least one." />
</div>`,
    },
    {
      title: 'Textarea with a limit',
      caption: 'Limits and formats belong in the hint, not in the placeholder.',
      render: () => (
        <DemoField className="max-w-[22rem]">
          <Label htmlFor="ht-bio" label="Bio" />
          <TextControl type="multi-line" id="ht-bio" maxLength={200} aria-describedby="ht-bio-hint" />
          <HelpText id="ht-bio-hint" hint="Up to 200 characters." />
        </DemoField>
      ),
      code: `<Label htmlFor="bio" label="Bio" />
<TextControl type="multi-line" id="bio" maxLength={200} aria-describedby="bio-hint" />
<HelpText id="bio-hint" hint="Up to 200 characters." />`,
    },
  ],
  whenToUse: {
    use: ['Hints for what users need before they act: a format, a limit, what the value is used for.', 'Validation messages after a value fails a check — in the same place.', 'One line per field.'],
    dont: ['Repeating the Label.', 'Non-essential detail — use the Label’s help icon (2.13).', 'Stacking a hint and an error under the same control.'],
  },
  matrices: [
    {
      title: 'Help text',
      rows: 'Status',
      columns: 'Size',
      render: () => <Matrix rowProp="Status" rows={STATUSES} colProp="Size" cols={SIZES} cell={(status, size) => <HelpText size={size} status={status} />} />,
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-start gap-3xl">
        <div className="flex flex-wrap gap-3xl">
          {STATUSES.map((s) => (
            <DemoField key={s} className="w-[18rem]">
              <AxisLabel prop="Status" value={s} />
              <TextControl aria-label={`Example ${s}`} status={s} defaultValue={s === 'invalid' ? 'anna@' : ''} />
              <HelpText status={s} hint={s === 'invalid' ? 'Enter an email address like name@example.com.' : 'We’ll send the invite here.'} />
            </DemoField>
          ))}
        </div>
        <DemoField className="w-[18rem]">
          <AxisLabel prop="Wrapping" value="field width" />
          <TextControl aria-label="Wrapping example" />
          <HelpText hint="A message longer than the field wraps to a second line under the control; the field never grows wider." />
        </DemoField>
      </div>
    ),
    parts: [
      { name: 'Text', description: 'Fills the field width and wraps. type/body/xs/regular (sm) or type/body/sm/regular (md); colour by Status.', tokens: ['type/body/sm/regular', 'color/text/tertiary', 'color/text/danger'] },
      { name: 'Field gap', description: 'space/sm above the Help text, owned by the field. Help text adds no margin, so hint and error sit in exactly the same place.', tokens: ['space/sm'] },
    ],
  },
  props: [
    { name: 'hint', figma: 'Hint', type: 'ReactNode', default: "'This is a hint text to help the user.'", description: 'The hint or the validation message.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'Text style; match the control and Label size.' },
    { name: 'status', figma: 'Status', type: "'none' | 'invalid'", default: "'none'", description: 'Invalid turns the line into the danger message; set the control to the same Status.' },
    { name: 'id', type: 'string', description: 'Point the control’s aria-describedby at it.' },
  ],
  tokens: ['color/text/tertiary', 'color/text/danger', 'type/body/xs/regular', 'type/body/sm/regular', 'space/sm'],
  guidelines: [
    {
      title: 'Hint first, then error',
      body: 'Show a hint when users need it before they type: a format, a limit, a consequence. When validation fails, replace the hint with the error message in the same place. Don’t stack a hint and an error.',
      render: () => (
        <div className="flex flex-wrap items-start gap-xl">
          <Step n="1 · Empty">
            <TextControl aria-label="Start date" placeholder="" />
            <HelpText hint="Use the format DD/MM/YYYY." />
          </Step>
          <Icon name="arrows/arrow-right" className="mt-4xl text-icon-tertiary" />
          <Step n="2 · Invalid">
            <TextControl aria-label="Start date" status="invalid" defaultValue="31/02/2026" />
            <HelpText status="invalid" hint="Enter a date that exists." />
          </Step>
          <Icon name="arrows/arrow-right" className="mt-4xl text-icon-tertiary" />
          <Step n="3 · Fixed">
            <TextControl aria-label="Start date" defaultValue="28/02/2026" />
            <HelpText hint="Use the format DD/MM/YYYY." />
          </Step>
        </div>
      ),
    },
    {
      title: 'Validation is not only colour',
      body: 'The error message is text that says what went wrong; the control also turns Status=invalid. Colour supports the message; it never carries it alone.',
      do: {
        caption: 'Invalid control with a message that explains the fix.',
        render: () => (
          <DemoField className="w-[16rem]">
            <TextControl aria-label="Start date" status="invalid" defaultValue="12/12/2025" />
            <HelpText status="invalid" hint="Enter a date after 1 January 2026." />
          </DemoField>
        ),
      },
      dont: {
        caption: 'A message that only says “Invalid”.',
        render: () => (
          <DemoField className="w-[16rem]">
            <TextControl aria-label="Start date" status="invalid" defaultValue="12/12/2025" />
            <HelpText status="invalid" hint="Invalid" />
          </DemoField>
        ),
      },
    },
    {
      title: 'Essential information stays visible',
      body: 'Formats, limits and requirements go in Help text, not in a Tooltip or the placeholder. Tooltips are hidden until hovered and don’t exist on touch; placeholders disappear on typing.',
      do: {
        caption: 'The format in Help text under an empty control.',
        render: () => (
          <DemoField className="w-[16rem]">
            <TextControl aria-label="Date" />
            <HelpText hint="Use the format DD/MM/YYYY." />
          </DemoField>
        ),
      },
      dont: { caption: 'The format only in the placeholder.', render: () => <div className="w-[16rem]"><TextControl aria-label="Date" placeholder="DD/MM/YYYY" /></div> },
    },
    {
      title: 'Long messages wrap',
      body: 'A message that is longer than the field wraps under the control; the field never grows wider. Keep messages to two lines at the field width.',
      render: () => (
        <DemoField className="w-[18rem]">
          <Label htmlFor="wrap-g" label="Project key" />
          <TextControl id="wrap-g" status="invalid" defaultValue="my project" />
          <HelpText status="invalid" hint="Use only letters, numbers and dashes, with no spaces, for example my-project." />
        </DemoField>
      ),
    },
    {
      title: 'Content',
      body: 'Hints describe the expected value; they don’t repeat the Label (“Use 8 or more characters”, not “Enter your password”). Error messages say what went wrong and how to fix it, in plain words. Don’t blame the user and don’t use codes (“Error 422”). Sentence case; end full sentences with a full stop. One sentence, two lines at most.',
      do: { caption: 'What went wrong and how to fix it.', render: () => <HelpText status="invalid" hint="Enter an email address like name@example.com." /> },
      dont: { caption: 'Blame and a code.', render: () => <HelpText status="invalid" hint="You entered an invalid email (Error 422)" /> },
    },
  ],
  accessibility: [
    'The field links Help text to its control with aria-describedby, so it is read after the Label.',
    'The line is a polite live region: a validation message that appears after the user acts is announced without moving focus.',
    'Hint and error text meet the text contrast threshold on the surface behind them in every colour mode.',
  ],
});
