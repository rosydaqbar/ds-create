import { Label } from '@/components/parts/Label';
import { HelpText } from '@/components/parts/HelpText';
import { Radio } from '@/components/parts/Radio';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { TextControl } from '@/components/parts/TextControl';
import { DemoField } from './_demo';

const SIZES = ['sm', 'md'] as const;

export default defineDoc({
  id: '2.11',
  name: 'Label',
  level: 'parts',
  spec: 'specs/parts/2.11-label.md',
  exports: ['Label'],
  summary: 'Labels name a form control so people know what to enter. Every field in the system uses one, with an optional required marker and a help icon for short extra detail.',
  hero: () => (
    <div className="scale-150">
      <Label label="Email address" showRequired showHelpIcon helpText="We use it to send receipts." />
    </div>
  ),
  playground: {
    controls: [
      { name: 'label', figma: 'Label', control: { type: 'text' }, default: 'Label' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'showRequired', figma: 'Show required', control: { type: 'boolean' }, default: false },
      { name: 'showHelpIcon', figma: 'Show help icon', control: { type: 'boolean' }, default: false },
      { name: 'helpText', figma: 'Help icon › Tooltip Text', control: { type: 'text' }, default: 'This is a tooltip' },
    ],
    render: (a) => <Label {...a} htmlFor="playground-input" />,
    code: (a) => `<Label${jsxProps(a, { size: 'md', showRequired: false, showHelpIcon: false, helpText: 'This is a tooltip' }, a.showHelpIcon ? [] : ['helpText'])} htmlFor="email" />`,
  },
  examples: [
    {
      title: 'Sign-up form column',
      caption: 'Required fields get the marker, and the optional field says so in its label.',
      render: () => (
        <div className="flex w-full max-w-[22rem] flex-col gap-xl">
          <DemoField>
            <Label htmlFor="su-name" label="Full name" showRequired />
            <TextControl id="su-name" required />
          </DemoField>
          <DemoField>
            <Label htmlFor="su-email" label="Email address" showRequired showHelpIcon helpText="We'll never share your email." />
            <TextControl id="su-email" inputType="email" required aria-describedby="su-email-hint" />
            <HelpText id="su-email-hint" hint="We'll only use this for receipts." />
          </DemoField>
          <DemoField>
            <Label htmlFor="su-company" label="Company (optional)" />
            <TextControl id="su-company" />
          </DemoField>
        </div>
      ),
      code: `<div className="flex flex-col gap-sm">
  <Label htmlFor="name" label="Full name" showRequired />
  <TextControl id="name" required />
</div>
<div className="flex flex-col gap-sm">
  <Label htmlFor="email" label="Email address" showRequired showHelpIcon helpText="We'll never share your email." />
  <TextControl id="email" inputType="email" required aria-describedby="email-hint" />
  <HelpText id="email-hint" hint="We'll only use this for receipts." />
</div>
<div className="flex flex-col gap-sm">
  <Label htmlFor="company" label="Company (optional)" />
  <TextControl id="company" />
</div>`,
    },
    {
      title: 'Settings row',
      caption: 'In wide settings layouts, the label can sit beside the control and keep the same style.',
      render: () => (
        <div className="grid w-full max-w-[32rem] grid-cols-[10rem_1fr] items-center gap-lg">
          <Label htmlFor="set-name" label="Display name" />
          <TextControl id="set-name" defaultValue="Anna Lindqvist" />
        </div>
      ),
      code: `<div className="grid grid-cols-[10rem_1fr] items-center gap-lg">
  <Label htmlFor="display-name" label="Display name" />
  <TextControl id="display-name" defaultValue="Anna Lindqvist" />
</div>`,
    },
    {
      title: 'Choice group',
      caption: 'A label can name a whole group of options, not only a single input.',
      render: () => (
        <div role="radiogroup" aria-labelledby="channel-label" aria-required className="flex flex-col gap-md">
          <Label as="span" id="channel-label" label="Notification channel" showRequired />
          {['Email', 'SMS', 'Push'].map((c, i) => (
            <label key={c} className="type-body-sm-medium flex items-center gap-md text-text-secondary">
              <Radio name="channel" value={c} defaultChecked={i === 0} /> {c}
            </label>
          ))}
        </div>
      ),
      code: `<div role="radiogroup" aria-labelledby="channel-label" aria-required>
  <Label as="span" id="channel-label" label="Notification channel" showRequired />
  <label><Radio name="channel" value="email" defaultChecked /> Email</label>
  <label><Radio name="channel" value="sms" /> SMS</label>
  <label><Radio name="channel" value="push" /> Push</label>
</div>`,
    },
    {
      title: 'Disabled field',
      caption: 'The label stays readable when its control is disabled, so people still know what the field is.',
      render: () => (
        <DemoField className="max-w-[22rem]">
          <Label htmlFor="ws-url" label="Workspace URL" />
          <TextControl id="ws-url" disabled defaultValue="acme.example.com" />
        </DemoField>
      ),
      code: `<Label htmlFor="workspace-url" label="Workspace URL" />
<TextControl id="workspace-url" disabled defaultValue="acme.example.com" />`,
    },
  ],
  whenToUse: {
    use: [
      'Naming every form control: text inputs, selects, sliders, and groups of checkboxes or radios.',
      'Marking required fields with the required marker.',
      'Adding short, nice-to-know detail through the help icon.',
    ],
    dont: ['As a placeholder, or inside the control.', 'For information people need to fill the field, use Help text (2.12).', 'For a heading over a whole form section.'],
  },
  matrices: [
    {
      title: 'Label',
      columns: 'Size',
      render: () => <Matrix rowProp="Label" rows={['default'] as const} colProp="Size" cols={SIZES} cell={(_, size) => <Label size={size} />} />,
    },
    {
      title: 'Boolean compositions (Size=md)',
      render: () => (
        <div className="flex flex-wrap items-center gap-4xl rounded-surface border border-dashed border-border-brand-subtle p-xl">
          {[
            { k: 'Show required = true', p: { showRequired: true } },
            { k: 'Show help icon = true', p: { showHelpIcon: true } },
            { k: 'Both = true', p: { showRequired: true, showHelpIcon: true } },
          ].map(({ k, p }) => (
            <div key={k} className="flex flex-col items-start gap-md">
              <AxisLabel prop={k.split(' = ')[0]} value={k.split(' = ')[1]} />
              <Label {...p} />
            </div>
          ))}
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-start gap-3xl">
        <div className="scale-[2] origin-left">
          <Label label="Label" showRequired showHelpIcon />
        </div>
        <div className="flex items-end gap-3xl">
          {SIZES.map((s) => (
            <div key={s} className="flex flex-col items-start gap-sm">
              <AxisLabel prop="Size" value={s} />
              <Label size={s} label="Label" showRequired showHelpIcon />
            </div>
          ))}
        </div>
        <DemoField className="w-[20rem]">
          <Label htmlFor="anat-field" label="Label" />
          <TextControl id="anat-field" placeholder="Control" />
          <HelpText hint="Help text. The field sets the gap above it." />
        </DemoField>
      </div>
    ),
    parts: [
      { name: 'Label text', target: 'label-text', description: 'The name of the control, on one line. It never truncates, so keep it short. The small size uses a smaller text style.', tokens: ['type/body/sm/medium', 'color/text/secondary'] },
      { name: 'Asterisk', target: 'asterisk', description: 'A separate asterisk after the text, in the brand color, for required fields. Screen readers skip it because the control announces “required” itself.', tokens: ['color/text/brand'] },
      { name: 'Help icon', target: 'help-icon', description: 'An optional Help icon (2.13) that scales with the label size. Its tooltip opens outside the label.', tokens: ['size/icon/sm', 'color/icon/tertiary'] },
      { name: 'Root', target: 'label', description: 'Lines up the text, asterisk and help icon in one row with a small gap. It fits its content unless a field stretches it.', tokens: ['space/xxs'] },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', default: "'Label'", description: 'The name of the control: a short noun phrase.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'Sets the text style and help icon size. Match it to the control size.' },
    { name: 'showRequired', figma: 'Show required', type: 'boolean', default: 'false', description: 'Adds the asterisk. Set required on the control too.' },
    { name: 'showHelpIcon', figma: 'Show help icon', type: 'boolean', default: 'false', description: 'Adds a Help icon after the label.' },
    { name: 'helpText', type: 'ReactNode', default: "'This is a tooltip'", description: 'The text in the help icon’s tooltip.' },
    { name: 'helpSupportingText', type: 'ReactNode', description: 'Supporting text in the help icon’s tooltip.' },
    { name: 'helpPlacement', type: 'TooltipPlacement', default: "'top'", description: 'Where the help icon’s tooltip opens.' },
    { name: 'htmlFor', type: 'string', description: 'The control’s id. Clicking the label focuses the control, and the label becomes its accessible name.' },
    { name: 'as', type: "'label' | 'span' | 'legend'", default: "'label'", description: 'Use span (with id and aria-labelledby) or legend to name a group.' },
  ],
  tokens: ['color/text/secondary', 'color/text/brand', 'color/icon/tertiary', 'color/icon/tertiary/hover', 'space/xxs', 'type/body/xs/medium', 'type/body/sm/medium', 'size/icon/xs', 'size/icon/sm'],
  guidelines: [
    {
      title: 'Give every control a visible label',
      body: 'A placeholder disappears as soon as people type, and a tooltip stays hidden until someone hovers. Neither can replace a label.',
      do: {
        caption: 'The label stays above the control after it’s filled.',
        render: () => (
          <DemoField className="w-[16rem]">
            <Label htmlFor="g1-do" label="Email address" />
            <TextControl id="g1-do" defaultValue="anna@" />
          </DemoField>
        ),
      },
      dont: { caption: 'A placeholder alone. Once the field is filled, the name is gone.', render: () => <div className="w-[16rem]"><TextControl aria-label="Email address" placeholder="Email address" defaultValue="anna@" /></div> },
    },
    {
      title: 'Required and optional',
      body: 'Mark whichever group is smaller. When most fields are optional, add the asterisk to the required ones. When most are required, leave it off and label the few optional ones, like “Phone (optional)”.\n\nOn a long form, explain the asterisk once at the top: “Fields marked * are required.”',
      render: () => (
        <div className="grid w-full gap-4xl md:grid-cols-2">
          <div className="flex flex-col gap-md">
            {['First name', 'Last name', 'Phone', 'Company', 'Website'].map((f, i) => (
              <Label key={f} label={f} showRequired={i < 2} />
            ))}
          </div>
          <div className="flex flex-col gap-md">
            {['First name', 'Last name', 'Email', 'Phone (optional)', 'Country'].map((f) => (
              <Label key={f} label={f} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Help icon or help text',
      body: 'Use the help icon for short, nice-to-know detail, like “Why do we ask for this?”. Put anything people need to fill the field correctly, such as a format, a limit or a consequence, in help text under the control, where it’s always visible.',
      do: {
        caption: 'Requirements in help text, always visible.',
        render: () => (
          <DemoField className="w-[18rem]">
            <Label htmlFor="pw-do" label="Password" />
            <TextControl id="pw-do" inputType="password" aria-describedby="pw-do-h" />
            <HelpText id="pw-do-h" hint="Use 8 or more characters with at least one number." />
          </DemoField>
        ),
      },
      dont: {
        caption: 'Requirements hidden behind the help icon.',
        render: () => (
          <div className="flex w-[18rem] flex-col gap-sm pt-4xl">
            <Label label="Password" showHelpIcon helpText="8+ characters, one number" helpPlacement="top-start" helpForceState="hover" />
            <TextControl aria-label="Password" inputType="password" />
          </div>
        ),
      },
    },
    {
      title: 'Disabled fields',
      body: 'Keep the label at its normal color when a field is disabled, so people can still read what it is and work out why it’s unavailable. Only the control takes the disabled look.',
      render: () => (
        <DemoField className="w-[20rem]">
          <span className="flex items-center gap-md">
            <Label htmlFor="dis-g" label="Workspace URL" />
            <span className="type-body-xs-medium rounded-indicator bg-fill-brand-subtle px-sm text-text-brand">unchanged</span>
          </span>
          <TextControl id="dis-g" disabled defaultValue="acme.example.com" />
        </DemoField>
      ),
    },
    {
      title: 'Placement',
      body: 'Put labels above the control by default. In wide settings layouts, you can place them on the left in a fixed-width column, lined up with the control’s first line of text. Keep one placement throughout a form.',
      render: () => (
        <div className="grid w-full gap-4xl md:grid-cols-2">
          <div className="flex flex-col gap-lg">
            {['Name', 'Email', 'Role'].map((f) => (
              <DemoField key={f}>
                <Label htmlFor={`st-${f}`} label={f} />
                <TextControl id={`st-${f}`} />
              </DemoField>
            ))}
          </div>
          <div className="grid grid-cols-[6rem_1fr] items-center gap-lg">
            {['Name', 'Email', 'Role'].map((f) => (
              <div key={f} className="contents">
                <Label htmlFor={`row-${f}`} label={f} />
                <TextControl id={`row-${f}`} />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Name what you’re asking for in a short noun phrase, like “Email address”, “Company name” or “Start date”. Use sentence case with no trailing colon, and avoid instructions such as “Enter your email”.\n\nKeep labels to one line at the narrowest field width, and move any explanation to help text.',
      do: { caption: 'A noun phrase in sentence case.', render: () => <Label label="Email address" /> },
      dont: { caption: 'An instruction with a colon.', render: () => <Label label="Enter Your Email:" /> },
    },
  ],
  accessibility: [
    'The label is linked to its control with htmlFor, so screen readers announce it as the control’s name. Clicking it moves focus to the control.',
    'Screen readers skip the asterisk. The control carries required itself, so people hear “required” once.',
    'The asterisk is a visible character, so the required marker doesn’t rely on color.',
    'The help icon is its own focusable trigger next to the label. Its tooltip describes the icon and isn’t part of the label’s name.',
    'Label text meets text contrast on the surface behind it in every color mode.',
  ],
});
