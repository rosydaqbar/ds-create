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
  spec: 'parts/2.11-label.md',
  exports: ['Label'],
  summary: 'Names a form control above or beside it, with an optional required marker and a help icon that opens a short Tooltip. Used by every field in the system.',
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
      caption: 'Required marker on required fields; optional fields say so in the label text.',
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
      caption: 'Labels can sit beside the control in wide settings layouts; they keep the same type and marker.',
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
      caption: 'A Label names a whole group, not only single inputs.',
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
      caption: 'The Label stays readable when its control is disabled, so users still know what the field is.',
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
      'Every form control has one — text inputs, selects, sliders and groups of checkboxes or radios.',
      'Use the required marker for required fields.',
      'Use the help icon only for short, non-essential detail.',
    ],
    dont: ['As a placeholder or inside the control.', 'For information users need to fill the field — use Help text (2.12).', 'As a heading for a whole form section.'],
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
        <div className="scale-150 origin-left">
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
          <HelpText hint="Help text — the field owns the space/sm gap." />
        </DemoField>
      </div>
    ),
    parts: [
      { name: 'Label text', description: 'Hug, single line, never truncates. type/body/xs/medium (sm) or type/body/sm/medium (md), color/text/secondary.', tokens: ['type/body/sm/medium', 'color/text/secondary'] },
      { name: 'Asterisk', description: 'Separate glyph after the text (Show required), same style as the text, color/text/brand. Hidden from assistive technology.', tokens: ['color/text/brand'] },
      { name: 'Help icon', description: 'Instance of Help icon (2.13), icon box size/icon/xs (sm) or size/icon/sm (md). Its tooltip sits outside its bounds.', tokens: ['size/icon/sm', 'color/icon/tertiary'] },
      { name: 'Root', description: 'Horizontal, centred, gap space/xxs between text, asterisk and help icon. Hug; Fill when a field stretches it.', tokens: ['space/xxs'] },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', default: "'Label'", description: 'The name of the control: a short noun phrase.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'Text style and help-icon box; match the control size.' },
    { name: 'showRequired', figma: 'Show required', type: 'boolean', default: 'false', description: 'Adds the asterisk; set `required` on the control as well.' },
    { name: 'showHelpIcon', figma: 'Show help icon', type: 'boolean', default: 'false', description: 'Adds a Help icon after the label.' },
    { name: 'helpText', type: 'ReactNode', default: "'This is a tooltip'", description: 'Text of the help icon’s Tooltip.' },
    { name: 'helpSupportingText', type: 'ReactNode', description: 'Supporting text of the help icon’s Tooltip.' },
    { name: 'helpPlacement', type: 'TooltipPlacement', default: "'top'", description: 'Placement of the help icon’s Tooltip.' },
    { name: 'htmlFor', type: 'string', description: 'Id of the control; clicking the label focuses it and the label becomes its name.' },
    { name: 'as', type: "'label' | 'span' | 'legend'", default: "'label'", description: 'Use span (with id + aria-labelledby) or legend to name a group.' },
  ],
  tokens: ['color/text/secondary', 'color/text/brand', 'color/icon/tertiary', 'color/icon/tertiary/hover', 'space/xxs', 'type/body/xs/medium', 'type/body/sm/medium', 'size/icon/xs', 'size/icon/sm'],
  guidelines: [
    {
      title: 'Every control has a visible Label',
      body: 'A placeholder disappears as soon as the user types, and a Tooltip is hidden until hovered. Neither replaces a Label.',
      do: {
        caption: 'Label “Email address” above the filled control.',
        render: () => (
          <DemoField className="w-[16rem]">
            <Label htmlFor="g1-do" label="Email address" />
            <TextControl id="g1-do" defaultValue="anna@" />
          </DemoField>
        ),
      },
      dont: { caption: 'Placeholder only — once filled, the name is gone.', render: () => <div className="w-[16rem]"><TextControl aria-label="Email address" placeholder="Email address" defaultValue="anna@" /></div> },
    },
    {
      title: 'Required and optional',
      body: 'Use the asterisk when most fields in a form are optional. When most are required, leave the asterisk off and mark the few optional ones in the Label text: “Phone (optional)”. Explain the asterisk once at the top of a long form (“Fields marked * are required”). Mark the minority.',
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
      title: 'Help icon vs Help text',
      body: 'The help icon is for short, non-essential detail (“Why do we ask for this?”). Anything the user needs to fill the field correctly — format, limits, consequences — goes in Help text under the control, where it is always visible.',
      do: {
        caption: 'Requirements in Help text, always visible.',
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
      body: 'A disabled field keeps its Label at the normal colour so users can still read what it is and why it might be unavailable. The control carries the disabled look.',
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
      body: 'Labels sit above the control by default. In wide settings layouts they may sit to the left at a fixed column width, aligned to the control’s first text line. Use one placement per form.',
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
      body: 'Name the information asked for as a short noun phrase: “Email address”, “Company name”, “Start date”. Use sentence case and no trailing colon. Keep labels to one line at the narrowest field width; move explanation to Help text. Don’t phrase the label as an instruction (“Enter your email”).',
      do: { caption: 'A noun phrase in sentence case.', render: () => <Label label="Email address" /> },
      dont: { caption: 'An instruction with a colon.', render: () => <Label label="Enter Your Email:" /> },
    },
  ],
  accessibility: [
    'The Label is programmatically linked to its control (`htmlFor`), so it becomes the control’s accessible name; clicking it moves focus to the control.',
    'The asterisk is hidden from assistive technology; the control itself carries `required`, so users hear “required” once.',
    'The asterisk is a glyph, not only a colour, so the required marker does not rely on colour.',
    'The help icon is a separate focusable trigger next to the label; its tooltip text is the trigger’s description, not part of the Label’s name.',
    'Label text meets the text contrast threshold on the surface behind it in every colour mode.',
  ],
});
