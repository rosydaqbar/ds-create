import { useState } from 'react';
import { ChoiceCard, ChoiceField, ChoiceGroup, type ChoiceBreakpoint, type ChoiceCardType, type ChoiceFieldType, type ChoiceGroupOption } from '@/components/components/ChoiceField';
import { Label } from '@/components/parts/Label';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md'] as const;
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const;
const FIELD_TYPES: ChoiceFieldType[] = ['checkbox', 'radio', 'switch'];
const CARD_TYPES: ChoiceCardType[] = ['icon', 'icon-card', 'avatar', 'payment', 'radio', 'checkbox'];
const BREAKPOINTS: ChoiceBreakpoint[] = ['desktop', 'mobile'];
const CARD_COLS = ['rest · false', 'rest · true', 'hover · false', 'hover · true', 'focus · false', 'focus · true'] as const;
const CARD_ROWS = BREAKPOINTS.flatMap((b) => SIZES.map((s) => `${b} · ${s}`));

const checkedValues = (t: ChoiceFieldType) => (t === 'checkbox' ? (['false', 'true', 'mixed'] as const) : (['false', 'true'] as const));
const toChecked = (c: string) => (c === 'mixed' ? 'mixed' : c === 'true');

function fieldVariant(type: ChoiceFieldType, row: string, state: (typeof STATES)[number], supporting: boolean) {
  const [size, checked] = row.split(' · ') as ['sm' | 'md', string];
  return (
    <ChoiceField
      type={type}
      size={size}
      checked={toChecked(checked) as boolean | 'mixed'}
      text="Remember me"
      supportingText={supporting ? 'Save my login details for next time.' : undefined}
      forceState={state === 'hover' || state === 'focus' ? state : undefined}
      disabled={state === 'disabled'}
      className="w-[16rem]"
    />
  );
}

const cardContent: Record<ChoiceCardType, Partial<Parameters<typeof ChoiceCard>[0]>> = {
  icon: { icon: 'general/layers', text: 'Basic plan', subtext: '$10/month' },
  'icon-card': { icon: 'general/zap', text: 'Basic plan', subtext: '$10/month' },
  avatar: { avatar: { initials: 'OR' }, text: 'Olivia Rhye', subtext: '@olivia', supportingText: 'Product designer. Owns the onboarding flow and the design system.' },
  payment: { text: 'Visa ending in 1234', subtext: 'Expiry 06/2028', supportingText: 'Set as default · Edit' },
  radio: { text: 'Basic plan', subtext: '$10/month' },
  checkbox: { text: 'Basic plan', subtext: '$10/month' },
};

function cardVariant(type: ChoiceCardType, row: string, col: (typeof CARD_COLS)[number], badge = false) {
  const [breakpoint, size] = row.split(' · ') as [ChoiceBreakpoint, 'sm' | 'md'];
  const [state, selected] = col.split(' · ');
  return (
    <div className={breakpoint === 'desktop' ? 'w-[24rem]' : 'w-[18rem]'}>
      <ChoiceCard
        type={type}
        size={size}
        breakpoint={breakpoint}
        selected={selected === 'true'}
        forceState={state === 'hover' || state === 'focus' ? state : undefined}
        badge={badge ? 'Popular' : undefined}
        {...cardContent[type]}
      />
    </div>
  );
}

const plans: ChoiceGroupOption[] = [
  { value: 'basic', icon: 'general/layers', text: 'Basic', subtext: '$10/month', supportingText: 'Up to 10 users and 20 GB of data.' },
  { value: 'business', icon: 'general/zap', text: 'Business', subtext: '$20/month', supportingText: 'Up to 20 users, 40 GB and priority support.', badge: 'Popular' },
  { value: 'enterprise', icon: 'security/shield-check', text: 'Enterprise', subtext: '$40/month', supportingText: 'Unlimited users, SSO and an account manager.' },
];

const bankMark = (
  <span aria-hidden className="inline-flex h-(--size-icon-xl) w-[2.875rem] shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface-base text-icon-tertiary">
    <Icon name="commerce/banknote" size="md" />
  </span>
);

const groupOptions = (type: ChoiceCardType): ChoiceGroupOption[] =>
  type === 'icon-card' || type === 'icon'
    ? plans.map((p) => ({ ...p, badge: undefined }))
    : type === 'avatar'
      ? [
          { value: 'or', avatar: { initials: 'OR' }, text: 'Olivia Rhye', subtext: '@olivia', supportingText: 'Product designer.' },
          { value: 'pb', avatar: { initials: 'PB' }, text: 'Phoenix Baker', subtext: '@phoenix', supportingText: 'Engineering lead.' },
          { value: 'lw', avatar: { initials: 'LW' }, text: 'Lana Wong', subtext: '@lana', supportingText: 'Customer success.' },
        ]
      : type === 'payment'
        ? [
            { value: 'visa', text: 'Card ending in 1234', subtext: 'Expiry 06/2028', supportingText: 'Set as default' },
            { value: 'mc', text: 'Card ending in 5678', subtext: 'Expiry 11/2027', supportingText: 'Personal card' },
            { value: 'bank', text: 'Bank transfer', subtext: '2–3 business days', supportingText: 'Pay from your bank account.', paymentMark: bankMark },
          ]
        : plans.map((p) => ({ ...p, icon: undefined, badge: undefined }));

function NotificationSettings() {
  const [kids, setKids] = useState({ product: true, billing: false });
  const all = kids.product && kids.billing ? true : kids.product || kids.billing ? 'mixed' : false;
  return (
    <div role="group" aria-labelledby="notif-label" className="flex flex-col gap-md">
      <Label as="span" id="notif-label" label="Email me about" />
      <ChoiceField text="All updates" checked={all} onCheckedChange={(c) => setKids({ product: c, billing: c })} />
      <div className="flex flex-col gap-md ps-3xl">
        <ChoiceField text="Product news" supportingText="New features and improvements." checked={kids.product} onCheckedChange={(c) => setKids((k) => ({ ...k, product: c }))} />
        <ChoiceField text="Billing" supportingText="Invoices and payment reminders." checked={kids.billing} onCheckedChange={(c) => setKids((k) => ({ ...k, billing: c }))} />
      </div>
    </div>
  );
}

export default defineDoc({
  id: '3.3',
  name: 'Choice field',
  level: 'components',
  spec: 'specs/components/3.3-choice-field.md',
  exports: ['ChoiceField', 'ChoiceCard', 'ChoiceGroup'],
  summary:
    'Choice fields pair a checkbox, radio or switch with a label and optional supporting text, so the whole row is easy to click. Choice cards give each option room for a title, details and a visual.',
  hero: () => <ChoiceField defaultChecked text="Remember me for 30 days" supportingText="Save my login details on this device." />,
  playground: {
    controls: [
      { name: 'type', figma: 'Type', control: { type: 'select', options: FIELD_TYPES }, default: 'checkbox' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'checked', figma: 'Checked', control: { type: 'select', options: ['false', 'true', 'mixed'] }, default: 'true' },
      { name: 'text', figma: 'Text', control: { type: 'text' }, default: 'Remember me' },
      { name: 'supportingText', figma: 'Show supporting text + Supporting text', control: { type: 'text' }, default: 'Save my login details for next time.' },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: ({ checked, ...a }) => {
      const c = a.type !== 'checkbox' && checked === 'mixed' ? 'true' : checked;
      return <ChoiceField key={`${a.type}-${c}`} {...a} supportingText={a.supportingText || undefined} defaultChecked={toChecked(c) as boolean | 'mixed'} className="max-w-[22rem]" />;
    },
    code: ({ checked, ...a }) => `<ChoiceField${jsxProps(a, { type: 'checkbox', size: 'md', disabled: false })}${checked === 'mixed' ? ' defaultChecked="mixed"' : checked === 'true' ? ' defaultChecked' : ''} />`,
  },
  examples: [
    {
      title: 'Notification settings',
      caption: 'The parent checkbox shows mixed while only some of its children are checked.',
      render: () => <NotificationSettings />,
      code: `<div role="group" aria-labelledby="notif-label">
  <Label as="span" id="notif-label" label="Email me about" />
  <ChoiceField text="All updates" checked={all} onCheckedChange={setAll} />  {/* all: true | false | 'mixed' */}
  <ChoiceField text="Product news" supportingText="New features and improvements." checked={product} onCheckedChange={setProduct} />
  <ChoiceField text="Billing" supportingText="Invoices and payment reminders." checked={billing} onCheckedChange={setBilling} />
</div>`,
    },
    {
      title: 'Privacy settings',
      caption: 'Each switch applies straight away, and its label names the setting it controls.',
      render: () => (
        <div className="flex w-full max-w-[26rem] flex-col gap-xl rounded-surface border border-border-subtle bg-surface-raised p-2xl shadow-raised">
          <span className="type-body-md-semibold text-text-primary">Privacy</span>
          <ChoiceField type="switch" defaultChecked text="Public profile" supportingText="Anyone with the link can see your name and photo." />
          <ChoiceField type="switch" text="Show activity status" supportingText="Teammates see when you’re online." />
          <ChoiceField type="switch" defaultChecked text="Usage analytics" supportingText="Share anonymous data to help improve the product." />
        </div>
      ),
      code: `<ChoiceField type="switch" defaultChecked text="Public profile" supportingText="Anyone with the link can see your name and photo." />
<ChoiceField type="switch" text="Show activity status" supportingText="Teammates see when you’re online." />
<ChoiceField type="switch" defaultChecked text="Usage analytics" supportingText="Share anonymous data to help improve the product." />`,
    },
    {
      title: 'Plan picker',
      caption: 'On desktop, icon cards sit side by side so people can compare plans at a glance.',
      stage: 'full',
      render: () => <ChoiceGroup type="icon-card" label="Choose a plan" defaultValue="business" options={plans} />,
      code: `<ChoiceGroup
  type="icon-card"
  label="Choose a plan"
  defaultValue="business"
  options={[
    { value: 'basic', icon: 'general/layers', text: 'Basic', subtext: '$10/month', supportingText: 'Up to 10 users and 20 GB of data.' },
    { value: 'business', icon: 'general/zap', text: 'Business', subtext: '$20/month', supportingText: 'Up to 20 users, 40 GB and priority support.', badge: 'Popular' },
    { value: 'enterprise', icon: 'security/shield-check', text: 'Enterprise', subtext: '$40/month', supportingText: 'Unlimited users, SSO and an account manager.' },
  ]}
/>`,
    },
    {
      title: 'Checkout payment',
      caption: 'Saved cards and a bank transfer sit in one question, so people pick exactly one way to pay.',
      render: () => (
        <div className="w-full max-w-[28rem]">
          <ChoiceGroup type="payment" size="sm" label="Payment method" options={groupOptions('payment')} />
        </div>
      ),
      code: `<ChoiceGroup
  type="payment"
  size="sm"
  label="Payment method"
  options={[
    { value: 'card-1', text: 'Card ending in 1234', subtext: 'Expiry 06/2028', supportingText: 'Set as default', paymentMark: <CardMark /> },
    { value: 'card-2', text: 'Card ending in 5678', subtext: 'Expiry 11/2027', supportingText: 'Personal card', paymentMark: <CardMark /> },
    { value: 'bank', text: 'Bank transfer', subtext: '2–3 business days', supportingText: 'Pay from your bank account.', paymentMark: <BankMark /> },
  ]}
/>`,
    },
  ],
  whenToUse: {
    use: [
      'Checkboxes for zero or more choices saved with a form.',
      'Radios for exactly one choice from a short list.',
      'A switch for a setting that takes effect straight away.',
      'Choice cards when each option needs more than one line, like plans, payment methods or delivery speeds.',
    ],
    dont: [
      'For more options than fit on screen, use a Select (3.5).',
      'For a control with no visible text, like in tables and lists, use the Part itself (2.7, 2.8, 2.9).',
      'For switching views of the same content, use a Button group (3.1).',
    ],
  },
  matrices: [
    ...FIELD_TYPES.flatMap((type) => {
      const rows = SIZES.flatMap((s) => checkedValues(type).map((c) => `${s} · ${c}`));
      return [
        {
          title: `Choice field · Type=${type}`,
          rows: 'Size × Checked',
          columns: 'State',
          render: () => <Matrix rowProp="Size · Checked" rows={rows} colProp="State" cols={STATES} cell={(r, s) => fieldVariant(type, r, s, true)} />,
        },
        {
          title: `Choice field · Type=${type} · Show supporting text=false`,
          rows: 'Size × Checked',
          columns: 'State',
          render: () => <Matrix rowProp="Size · Checked" rows={rows} colProp="State" cols={STATES} cell={(r, s) => fieldVariant(type, r, s, false)} />,
        },
      ];
    }),
    ...CARD_TYPES.map((type) => ({
      title: `Choice card · Type=${type}`,
      rows: 'Breakpoint × Size',
      columns: 'State × Selected',
      render: () => (
        <div className="flex min-w-0 flex-col gap-lg">
          <Matrix rowProp="Breakpoint · Size" rows={CARD_ROWS} colProp="State · Selected" cols={CARD_COLS} cell={(r, c) => cardVariant(type, r, c)} />
          <div className="flex flex-col items-start gap-sm">
            <AxisLabel prop="Show badge" value="true" />
            {cardVariant(type, 'desktop · md', 'rest · false', true)}
          </div>
        </div>
      ),
    })),
    {
      title: 'Choice group',
      rows: 'Type × Size',
      columns: 'Breakpoint',
      render: () => (
        <Matrix
          rowProp="Type · Size"
          rows={CARD_TYPES.flatMap((t) => SIZES.map((s) => `${t} · ${s}`))}
          colProp="Breakpoint"
          cols={BREAKPOINTS}
          cell={(row, bp) => {
            const [type, size] = row.split(' · ') as [ChoiceCardType, 'sm' | 'md'];
            return (
              <div className={bp === 'desktop' ? (type === 'icon-card' ? 'w-[48rem]' : 'w-[28rem]') : 'w-[20rem]'}>
                <ChoiceGroup
                  type={type}
                  size={size}
                  breakpoint={bp}
                  aria-label={`${type} ${size} ${bp}`}
                  defaultValue={type === 'checkbox' ? ['basic'] : groupOptions(type)[0].value}
                  options={groupOptions(type)}
                />
              </div>
            );
          }}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex w-full flex-col items-start gap-3xl">
        <div className="flex flex-wrap items-start gap-3xl">
          {SIZES.map((s) => (
            <div key={s} className="flex flex-col gap-md">
              <AxisLabel prop="Size" value={s} />
              {FIELD_TYPES.map((t) => (
                <ChoiceField key={t} type={t} size={s} defaultChecked text={`${t[0].toUpperCase()}${t.slice(1)} label`} supportingText="Supporting text wraps under the label." className="w-[18rem]" />
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-md">
          <AxisLabel prop="Top alignment" value="control on the first line" />
          <ChoiceField
            className="w-[20rem]"
            text="Send weekly summary"
            supportingText="Every Monday we email a summary of the last week’s activity, open tasks and upcoming deadlines for every project you follow."
          />
        </div>
        <div className="grid w-full gap-xl md:grid-cols-2">
          <div className="flex flex-col gap-sm">
            <AxisLabel prop="Choice card" value="desktop" />
            <ChoiceCard defaultSelected badge="Popular" />
          </div>
          <div className="flex w-[20rem] flex-col gap-sm">
            <AxisLabel prop="Choice card" value="mobile" />
            <ChoiceCard breakpoint="mobile" defaultSelected badge="Popular" />
          </div>
        </div>
        <div className="flex w-[24rem] flex-col gap-sm">
          <AxisLabel prop="Choice group" value="radio · sm" />
          <ChoiceGroup type="radio" size="sm" label="Plan" defaultValue="basic" options={groupOptions('radio').slice(0, 2)} />
        </div>
      </div>
    ),
    parts: [
      { name: 'Choice field', target: 'choice-field', description: 'The whole row is one label, so clicking anywhere on it toggles the control. Content aligns to the top, and medium fields have a slightly larger gap.', tokens: ['space/md', 'space/lg'] },
      { name: 'Control wrapper', target: 'control-wrapper', description: 'Exactly one line of text tall, with the Checkbox (2.7), Radio (2.8) or Switch (2.9) centered inside. This keeps the control on the first line.', tokens: ['type/body/sm/medium', 'type/body/md/medium'] },
      { name: 'Text and supporting text', target: 'text', description: 'The label and an optional description, which wrap to fill the width. The description is lighter, and both turn gray when the field is disabled.', tokens: ['color/text/secondary', 'color/text/tertiary', 'color/text/disabled'] },
      { name: 'Choice card', target: 'choice-card', description: 'The card container, with a rounded border. Icon-card cards stack their content vertically, and mobile cards use tighter padding.', tokens: ['radius/surface', 'color/border/default', 'space/2xl'] },
      { name: 'Leading', target: 'leading', description: 'The visual before the title: a Featured icon (2.19), an Avatar (2.6), a 46 × 32 payment mark, or the radio or checkbox itself for those card types.', tokens: ['size/avatar/md'] },
      { name: 'Content', target: 'content', description: 'The title row (text, subtext and an optional Badge, 2.4) and the supporting text. On mobile the subtext moves below the title. Titles share one left edge across card types.', tokens: ['space/xxs', 'space/xs'] },
      { name: 'Selection', target: 'selection', description: 'A small Radio (2.8) at the end of icon, avatar, payment and icon-card cards. A selected card gets a thicker brand border drawn inside and a brand-colored title.', tokens: ['color/border/brand', 'border/width/strong', 'color/text/brand'] },
      { name: 'Choice group', target: 'choice-group', description: 'Stacks the cards under an optional Label (2.11) that asks the question. Icon cards sit in equal columns on desktop and stack on mobile.', tokens: ['space/lg'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: "'checkbox' | 'radio' | 'switch'", default: "'checkbox'", description: 'ChoiceField: the control that sits next to the text.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'The control size, gap and text styles.' },
    { name: 'checked / defaultChecked', figma: 'Checked', type: "boolean | 'mixed'", description: "ChoiceField: the checked value. 'mixed' is for checkboxes only." },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'ChoiceField: called with the new value.' },
    { name: 'text', figma: 'Text', type: 'ReactNode', description: 'The label. Write it as a positive statement, in sentence case.' },
    { name: 'supportingText', figma: 'Show supporting text + Supporting text', type: 'ReactNode', description: 'One or two sentences, linked as the input’s description.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Disables the control and its text.' },
    { name: 'ChoiceCard type', figma: 'Choice card › Type', type: "'icon' | 'icon-card' | 'avatar' | 'payment' | 'radio' | 'checkbox'", default: "'icon'", description: 'The leading visual and selection control. Checkbox cards are the only multi-select type.' },
    { name: 'selected / defaultSelected / onSelectedChange', figma: 'Selected', type: 'boolean', description: 'ChoiceCard: shows the brand border, brand title and checked control.' },
    { name: 'breakpoint', figma: 'Breakpoint', type: "'mobile' | 'desktop'", default: "'desktop'", description: 'Mobile is its own layout, with tighter padding and the subtext under the title.' },
    { name: 'subtext', figma: 'Subtext', type: 'ReactNode', description: 'ChoiceCard: a price, handle or detail after the title.' },
    { name: 'badge', figma: 'Show badge', type: 'ReactNode', description: 'ChoiceCard: a Badge (2.4) in the title row.' },
    { name: 'icon / avatar / paymentMark', type: 'IconName / { src, initials } / ReactNode', description: 'ChoiceCard: the leading visual for the icon, avatar and payment types.' },
    { name: 'label', figma: 'Choice group › Show label', type: 'ReactNode', description: 'ChoiceGroup: the question, shown as a Label (2.11). Without it, pass aria-label.' },
    { name: 'options', type: 'ChoiceGroupOption[]', description: 'ChoiceGroup: the cards to show.' },
    { name: 'value / defaultValue / onValueChange', type: 'string | string[]', description: 'ChoiceGroup: one value, or an array for checkbox groups.' },
    { name: 'forceState', figma: 'State=hover / focus', type: "'hover' | 'focus'", description: 'For documentation only.' },
  ],
  tokens: [
    'color/text/secondary', 'color/text/tertiary', 'color/text/disabled', 'color/text/brand', 'color/border/default', 'color/border/strong', 'color/border/brand',
    'color/surface/base', 'border/width/default', 'border/width/strong', 'radius/surface', 'focus/default',
    'space/xxs', 'space/xs', 'space/md', 'space/lg', 'space/xl', 'space/2xl', 'type/body/sm/medium', 'type/body/md/medium', 'type/body/sm/regular', 'type/body/md/regular',
  ],
  guidelines: [
    {
      title: 'Checkbox, radio or switch',
      body: 'Use checkboxes when people can pick any number of options and save them with the form. Use radios when they must pick exactly one, and a switch for an on/off setting that applies straight away.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-3">
          <ChoiceField type="checkbox" defaultChecked text="Include archived" supportingText="Zero or more, saved with the form." />
          <ChoiceField type="radio" name="g-radio" defaultChecked text="Monthly billing" supportingText="Exactly one." />
          <ChoiceField type="switch" defaultChecked text="Dark mode" supportingText="On or off, right away." />
        </div>
      ),
      do: {
        caption: 'Radios for one choice.',
        render: () => (
          <div role="radiogroup" aria-label="Billing" className="flex flex-col gap-md">
            <ChoiceField type="radio" name="do-r" defaultChecked text="Monthly" />
            <ChoiceField type="radio" name="do-r" text="Yearly" />
          </div>
        ),
      },
      dont: {
        caption: 'Checkboxes for a single choice.',
        render: () => (
          <div className="flex flex-col gap-md">
            <ChoiceField defaultChecked text="Monthly" />
            <ChoiceField text="Yearly" />
          </div>
        ),
      },
    },
    {
      title: 'Checked, unchecked, mixed',
      body: 'A parent checkbox shows mixed when only some of its children are selected. Radios never show mixed, because only one can be picked.',
      render: () => (
        <div className="flex flex-wrap gap-3xl">
          {([false, 'mixed', true] as const).map((c) => (
            <div key={String(c)} className="flex flex-col gap-md">
              <ChoiceField checked={c} text="All projects" />
              <div className="flex flex-col gap-md ps-3xl">
                <ChoiceField checked={c === true} text="Website" />
                <ChoiceField checked={c !== false} text="Mobile app" />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Align the control to the top',
      body: 'The control sits on the first line of text instead of centering against a long description. That way, adding supporting text never moves it.',
      do: {
        caption: 'Control on the first line.',
        render: () => <ChoiceField className="w-[18rem]" text="Weekly summary" supportingText="Every Monday we email the last week’s activity, open tasks and deadlines." />,
      },
      dont: {
        caption: 'Control centered against the paragraph.',
        render: () => (
          <div className="flex w-[18rem] items-center gap-lg">
            <span className="size-(--checkbox-size-md) shrink-0 rounded-(--checkbox-radius-md) border border-border-strong bg-surface-base" />
            <span className="flex flex-col">
              <span className="type-body-md-medium text-text-secondary">Weekly summary</span>
              <span className="type-body-md-regular text-text-tertiary">Every Monday we email the last week’s activity, open tasks and deadlines.</span>
            </span>
          </div>
        ),
      },
    },
    {
      title: 'Choice cards',
      body: 'All six card types line titles up on the same left edge, so changing the leading visual never shifts the text. Radio and checkbox cards put the control first, and the other types end with a radio.',
      render: () => (
        <div className="flex w-full max-w-[28rem] flex-col gap-md">
          {CARD_TYPES.filter((t) => t !== 'icon-card').map((t) => (
            <ChoiceCard key={t} type={t} size="sm" name="cards-demo" {...cardContent[t]} supportingText={undefined} />
          ))}
        </div>
      ),
    },
    {
      title: 'Keep selection and focus distinct',
      body: 'Selection shows as a thicker brand border and a checked control, and focus as a ring around the card. The two always look different, so people can tell them apart.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-2">
          {([
            ['Rest', false, undefined],
            ['Selected', true, undefined],
            ['Focused', false, 'focus'],
            ['Selected + focused', true, 'focus'],
          ] as const).map(([k, sel, f]) => (
            <div key={k} className="flex flex-col gap-sm">
              <AxisLabel prop="Card" value={k} />
              <ChoiceCard size="sm" selected={sel} forceState={f} supportingText={undefined} />
            </div>
          ))}
        </div>
      ),
      do: { caption: 'One selected card in a radio group.', render: () => <div className="w-[20rem]"><ChoiceGroup type="radio" size="sm" aria-label="Plan" options={groupOptions('radio').slice(0, 2).map((o) => ({ ...o, supportingText: undefined }))} /></div> },
      dont: {
        caption: 'Two selected radio cards.',
        render: () => (
          <div className="flex w-[20rem] flex-col gap-lg">
            <ChoiceCard type="radio" size="sm" selected text="Basic" subtext="$10/month" supportingText={undefined} />
            <ChoiceCard type="radio" size="sm" selected text="Business" subtext="$20/month" supportingText={undefined} />
          </div>
        ),
      },
    },
    {
      title: 'Mobile and desktop',
      body: 'On mobile, the card rearranges its title row instead of shrinking the desktop layout.',
      render: () => (
        <div className="flex w-full flex-wrap items-start gap-3xl">
          <div className="w-[26rem]">
            <ChoiceCard defaultSelected badge="Popular" />
          </div>
          <div className="w-[18rem]">
            <ChoiceCard breakpoint="mobile" defaultSelected badge="Popular" />
          </div>
        </div>
      ),
      do: { caption: 'Mobile layout, with the subtext under the title.', render: () => <div className="w-[16rem]"><ChoiceCard breakpoint="mobile" size="sm" badge="Popular" /></div> },
      dont: {
        caption: 'The desktop card scaled down.',
        render: () => (
          <div className="w-[16rem] overflow-hidden">
            <div className="w-[26rem] origin-top-left scale-[0.615]">
              <ChoiceCard badge="Popular" />
            </div>
          </div>
        ),
      },
    },
    {
      title: 'Content',
      body: 'Write labels as positive statements: “Send me updates”, not “Don’t send me updates”. Switch labels name the setting, not the action: “Dark mode”, not “Turn on dark mode”. Keep card titles short, supporting text to one or two sentences, and options in a logical order, like most common first or smallest to largest.',
      do: { caption: 'Switch names the setting.', render: () => <ChoiceField type="switch" defaultChecked text="Dark mode" /> },
      dont: { caption: 'Switch phrased as an action.', render: () => <ChoiceField type="switch" text="Turn on dark mode" /> },
    },
    {
      title: 'Switches apply straight away',
      body: 'People expect a switch to take effect as soon as they flip it. In a form that saves on submit, use a checkbox instead.',
      do: { caption: 'Switch for an instant setting.', render: () => <ChoiceField type="switch" defaultChecked text="Email notifications" /> },
      dont: {
        caption: 'Switch in a form that saves on submit.',
        render: () => (
          <div className="flex flex-col items-start gap-md">
            <ChoiceField type="switch" text="I accept the terms" />
            <span className="type-body-sm-semibold rounded-control bg-fill-brand-solid px-lg py-sm text-text-on-solid">Submit</span>
          </div>
        ),
      },
    },
    {
      title: 'Maintenance',
      body: 'The control styles live in the Parts (2.7, 2.8, 2.9). The row layout and card styles live here, and use the semantic tokens in the token map.',
    },
  ],
  accessibility: [
    'The whole row or card is a <label>, so clicking the text toggles the control. On touch screens, the control’s hit area grows to size/touch-min.',
    'A group of radios or cards has a group label (the Choice group’s Label, or aria-label), so screen readers announce the question. Radio groups use role="radiogroup".',
    'Arrow keys move between radios in a group, Tab moves between checkboxes, and Space toggles.',
    'Screen readers read the supporting text as the input’s description (aria-describedby).',
    'Selection never relies on color alone: the control’s mark and the thicker border both change. Focus is a separate ring.',
    'Switches announce on or off (role="switch"), and the label stays the same in both states.',
  ],
});
