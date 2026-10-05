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
  spec: 'components/3.3-choice-field.md',
  exports: ['ChoiceField', 'ChoiceCard', 'ChoiceGroup'],
  summary:
    'A checkbox, radio or switch with its label and supporting text. The whole row is one click target, and the control stays aligned to the first line of text however long the description is. Choice cards give each option room for a title, a description and a leading visual; a Choice group stacks them into one question.',
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
      caption: 'The parent is mixed while only some children are checked.',
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
      caption: 'Switches apply at once; the label names the setting.',
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
      caption: 'Icon cards sit side by side on desktop; one plan is selected.',
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
      caption: 'Payment cards and a bank option in one radio question.',
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
      'Checkbox: zero or more choices saved with a form.',
      'Radio: exactly one choice from a short list.',
      'Switch: a setting that takes effect immediately.',
      'Choice cards when each option needs more than one line: plans, payment methods, delivery speeds.',
    ],
    dont: [
      'Options that don’t fit on screen — use a Select (3.5).',
      'A control with no visible text — that is the Part itself (2.7, 2.8, 2.9), used inside tables and lists.',
      'Switching views of the same content — use a Button group (3.1).',
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
      </div>
    ),
    parts: [
      { name: 'Choice field', description: 'Horizontal, align top, gap space/md (sm) or space/lg (md); the whole row is a <label> and one click target.', tokens: ['space/md', 'space/lg'] },
      { name: 'Control wrapper', description: 'Exactly one text line tall (20 at sm, 24 at md) and centres the 2.7 Checkbox, 2.8 Radio or 2.9 Switch inside it, so the control sits on the first line.', tokens: ['type/body/sm/medium', 'type/body/md/medium'] },
      { name: 'Text and supporting text', description: 'Fill, wraps. Text type/body/{size}/medium color/text/secondary; supporting text regular, color/text/tertiary; both color/text/disabled when disabled.', tokens: ['color/text/secondary', 'color/text/tertiary', 'color/text/disabled'] },
      { name: 'Choice card', description: 'Horizontal (icon-card: vertical), radius/surface, border/width/default color/border/default; padding space/xl–2xl (desktop) or space/lg–xl (mobile).', tokens: ['radius/surface', 'color/border/default', 'space/2xl'] },
      { name: 'Leading', description: '2.19 Featured icon (icon, icon-card), 2.6 Avatar md (avatar), payment mark 46 × 32 (payment), or the Radio / Checkbox itself on the first line (radio, checkbox).', tokens: ['size/avatar/md'] },
      { name: 'Content', description: 'Title row (Text medium, Subtext regular, optional 2.4 Badge; Subtext moves below on mobile) and supporting text; gap space/xxs. Titles share one left edge across types.', tokens: ['space/xxs', 'space/xs'] },
      { name: 'Selection', description: 'Trailing 2.8 Radio sm (icon, avatar, payment, icon-card). Selected: brand border at border/width/strong drawn inside, title color/text/brand.', tokens: ['color/border/brand', 'border/width/strong', 'color/text/brand'] },
      { name: 'Choice group', description: 'Vertical, gap space/lg; optional 2.11 Label as the question. icon-card sits in equal columns on desktop and stacks on mobile.', tokens: ['space/lg'] },
    ],
  },
  props: [
    { name: 'type', figma: 'Type', type: "'checkbox' | 'radio' | 'switch'", default: "'checkbox'", description: 'ChoiceField: which Part sits next to the text.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'Control size, gap and text styles.' },
    { name: 'checked / defaultChecked', figma: 'Checked', type: "boolean | 'mixed'", description: "ChoiceField: 'mixed' only for checkbox." },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'ChoiceField: called with the new value.' },
    { name: 'text', figma: 'Text', type: 'ReactNode', description: 'The label; positive statement, sentence case.' },
    { name: 'supportingText', figma: 'Show supporting text + Supporting text', type: 'ReactNode', description: 'One or two sentences; linked as the input’s description.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Disabled control and text.' },
    { name: 'ChoiceCard type', figma: 'Choice card › Type', type: "'icon' | 'icon-card' | 'avatar' | 'payment' | 'radio' | 'checkbox'", default: "'icon'", description: 'Leading visual and selection control; checkbox cards are the only multi-select type.' },
    { name: 'selected / defaultSelected / onSelectedChange', figma: 'Selected', type: 'boolean', description: 'ChoiceCard: brand border, brand title and checked control.' },
    { name: 'breakpoint', figma: 'Breakpoint', type: "'mobile' | 'desktop'", default: "'desktop'", description: 'Mobile is its own layout: tighter padding, Subtext under the title.' },
    { name: 'subtext', figma: 'Subtext', type: 'ReactNode', description: 'ChoiceCard: price, handle or detail after the title.' },
    { name: 'badge', figma: 'Show badge', type: 'ReactNode', description: 'ChoiceCard: 2.4 Badge in the title row.' },
    { name: 'icon / avatar / paymentMark', type: 'IconName / { src, initials } / ReactNode', description: 'ChoiceCard leading visual for icon, avatar and payment types.' },
    { name: 'label', figma: 'Choice group › Show label', type: 'ReactNode', description: 'ChoiceGroup: the question (2.11 Label). Without it pass aria-label.' },
    { name: 'options', type: 'ChoiceGroupOption[]', description: 'ChoiceGroup: the cards.' },
    { name: 'value / defaultValue / onValueChange', type: 'string | string[]', description: 'ChoiceGroup: one value, or an array for checkbox groups.' },
    { name: 'forceState', figma: 'State=hover / focus', type: "'hover' | 'focus'", description: 'Documentation only.' },
  ],
  tokens: [
    'color/text/secondary', 'color/text/tertiary', 'color/text/disabled', 'color/text/brand', 'color/border/default', 'color/border/strong', 'color/border/brand',
    'color/surface/base', 'border/width/default', 'border/width/strong', 'radius/surface', 'focus/default',
    'space/xxs', 'space/xs', 'space/md', 'space/lg', 'space/xl', 'space/2xl', 'type/body/sm/medium', 'type/body/md/medium', 'type/body/sm/regular', 'type/body/md/regular',
  ],
  guidelines: [
    {
      title: 'Checkbox, radio or switch',
      body: 'Checkbox: zero or more, saved with the form. Radio: exactly one. Switch: on or off, right away.',
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
      body: 'Mixed means some children are selected. Radios never show mixed.',
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
      title: 'Top alignment',
      body: 'The control sits on the first line of text, never centred against a multi-line description; supporting text never moves the control.',
      do: {
        caption: 'Control on the first line.',
        render: () => <ChoiceField className="w-[18rem]" text="Weekly summary" supportingText="Every Monday we email the last week’s activity, open tasks and deadlines." />,
      },
      dont: {
        caption: 'Control centred against the paragraph.',
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
      body: 'Six card types share one left edge for the title: changing the leading visual never shifts the text. Radio and checkbox cards put the control first; the other types end with a Radio.',
      render: () => (
        <div className="flex w-full max-w-[28rem] flex-col gap-md">
          {CARD_TYPES.filter((t) => t !== 'icon-card').map((t) => (
            <ChoiceCard key={t} type={t} size="sm" name="cards-demo" {...cardContent[t]} supportingText={undefined} />
          ))}
        </div>
      ),
    },
    {
      title: 'Selected vs focus',
      body: 'Selection is a thicker brand border plus a checked control; focus is the ring around the card. They always look different.',
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
      body: 'Mobile rearranges the title row; it is not the desktop card scaled down.',
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
      do: { caption: 'Mobile layout: Subtext under the title.', render: () => <div className="w-[16rem]"><ChoiceCard breakpoint="mobile" size="sm" badge="Popular" /></div> },
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
      body: 'Write labels as positive statements (“Send me updates”, not “Don’t send me updates”). Switch labels name the setting, not the action (“Dark mode”, not “Turn on dark mode”). Card titles are short; supporting text is one or two sentences. Keep option order logical: most common first, or small → large.',
      do: { caption: 'Switch names the setting.', render: () => <ChoiceField type="switch" defaultChecked text="Dark mode" /> },
      dont: { caption: 'Switch phrased as an action.', render: () => <ChoiceField type="switch" text="Turn on dark mode" /> },
    },
    {
      title: 'Switch vs submit',
      body: 'Use a switch for settings that apply instantly. In a form that saves on submit, use a checkbox.',
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
      body: 'Control looks live in the Parts (2.7, 2.8, 2.9); the row layout and card styles live here and use the semantic tokens in the token map.',
    },
  ],
  accessibility: [
    'The whole row or card is a <label>: clicking the text toggles the control; on touch platforms the control’s hit area reaches size/touch-min.',
    'A group of radios or cards has a group label (the Choice group’s Label, or aria-label) so screen readers announce the question; radio groups use role="radiogroup".',
    'Arrow keys move between radios in a group; Tab moves between checkboxes; Space toggles.',
    'Supporting text is the input’s description (aria-describedby).',
    'Selection is never colour alone: the control’s mark and the thicker border both change. Focus is a separate ring.',
    'Switches announce on / off (role="switch"); the label stays the same in both states.',
  ],
});
