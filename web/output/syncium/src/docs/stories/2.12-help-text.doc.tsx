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
  summary: "Help text sits under a form control to explain what to enter, or what went wrong. When validation fails, the same line turns into an error, so the layout doesn’t jump.",
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
      caption: 'The hint shows what a valid password looks like before people start typing.',
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
      caption: 'The error replaces the hint in the same spot, and the control and message switch to the danger color together.',
      render: () => <EmailField />,
      code: `<Label htmlFor="email" label="Email address" />
<TextControl id="email" status="invalid" value="anna@" aria-describedby="email-msg" />
<HelpText id="email-msg" status="invalid" hint="Enter an email address like name@example.com." />`,
    },
    {
      title: 'Choice group',
      caption: 'Help text works under a group of choices as well as a single input.',
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
      caption: 'Put limits and formats in the hint, where they stay visible, not in the placeholder.',
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
    use: ['Telling people what they need before they type: a format, a limit, or what the value is for.', 'Showing a validation message in the same place after a value fails a check.', 'Adding one line of help per field.'],
    dont: ['Repeating what the label already says.', 'For nice-to-know detail, use the label’s Help icon (2.13).', 'Stacking a hint and an error under the same control.'],
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
          <HelpText hint="A message longer than the field wraps onto a second line. The field never grows wider." />
        </DemoField>
      </div>
    ),
    parts: [
      { name: 'Text', target: 'hint', description: 'The message itself. It fills the field’s width, wraps when it needs to, and changes color with the status.', tokens: ['type/body/sm/regular', 'color/text/tertiary', 'color/text/danger'] },
      { name: 'Field gap', description: 'The small gap above the help text comes from the field. Help text adds no margin of its own, so the hint and the error sit in exactly the same place.', tokens: ['space/sm'] },
    ],
  },
  props: [
    { name: 'hint', figma: 'Hint', type: 'ReactNode', default: "'This is a hint text to help the user.'", description: 'The hint or the validation message.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'Sets the text style. Match it to the control and label size.' },
    { name: 'status', figma: 'Status', type: "'none' | 'invalid'", default: "'none'", description: 'Invalid turns the line into an error message. Set the control to the same status.' },
    { name: 'id', type: 'string', description: 'The id the control’s aria-describedby points to.' },
  ],
  tokens: ['color/text/tertiary', 'color/text/danger', 'type/body/xs/regular', 'type/body/sm/regular', 'space/sm'],
  guidelines: [
    {
      title: 'Hint first, then error',
      body: 'Show a hint when people need something before they type, like a format, a limit or a consequence. When validation fails, replace the hint with the error in the same place, rather than stacking both.',
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
      title: 'Don’t rely on color alone',
      body: 'Write an error message that says what went wrong, and set the control to invalid as well. Color backs up the message, but people who can’t see the color still need the words.',
      do: {
        caption: 'An invalid control with a message that explains the fix.',
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
      title: 'Keep essential information visible',
      body: 'Put formats, limits and requirements in help text, not in a tooltip or the placeholder. Tooltips stay hidden until someone hovers and don’t work on touch screens. Placeholders disappear as soon as people type.',
      do: {
        caption: 'The format in help text, under an empty control.',
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
      body: 'A message longer than the field wraps under the control, and the field never grows wider. Keep messages to two lines at the field’s width.',
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
      body: 'Hints describe the expected value without repeating the label: “Use 8 or more characters”, not “Enter your password”. Error messages say what went wrong and how to fix it, in plain words, without blaming anyone or showing codes like “Error 422”.\n\nWrite one sentence in sentence case, end it with a full stop, and keep it to two lines.',
      do: { caption: 'What went wrong and how to fix it.', render: () => <HelpText status="invalid" hint="Enter an email address like name@example.com." /> },
      dont: { caption: 'A message that blames people and shows a code.', render: () => <HelpText status="invalid" hint="You entered an invalid email (Error 422)" /> },
    },
  ],
  accessibility: [
    'The field links help text to its control with aria-describedby, so screen readers read it after the label.',
    'The line is a polite live region. When a validation message appears after someone acts, screen readers announce it without moving focus.',
    'Hint and error text meet text contrast on the surface behind them in every color mode.',
  ],
});
