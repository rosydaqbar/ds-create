import { Button } from '@/components/parts/Button';
import { Link } from '@/components/parts/Link';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md', 'lg'] as const;
const TONES = ['brand', 'neutral'] as const;
const TYPES = ['standalone', 'inline'] as const;
const STATES = ['rest', 'hover', 'pressed', 'focus', 'disabled'] as const;
const bodyStyle = { sm: 'type-body-sm-regular', md: 'type-body-md-regular', lg: 'type-body-lg-regular' } as const;

type S = (typeof SIZES)[number];
const force = (state: (typeof STATES)[number]) => (state === 'hover' || state === 'pressed' || state === 'focus' ? state : undefined);

const cell = (type: (typeof TYPES)[number], tone: (typeof TONES)[number], size: S, state: (typeof STATES)[number]) =>
  type === 'standalone' ? (
    <Link href="#" onClick={(e) => e.preventDefault()} size={size} tone={tone} label="Link text" forceState={force(state)} disabled={state === 'disabled'} />
  ) : (
    <span className={`${bodyStyle[size]} whitespace-nowrap text-text-secondary`}>
      Read the <Link type="inline" href="#" onClick={(e) => e.preventDefault()} size={size} tone={tone} label="terms" forceState={force(state)} disabled={state === 'disabled'} />.
    </span>
  );

const ROWS = TYPES.flatMap((t) => TONES.flatMap((tone) => SIZES.map((s) => `${t} · ${tone} · ${s}`)));

export default defineDoc({
  id: '2.3',
  name: 'Link',
  level: 'parts',
  spec: 'parts/2.3-link.md',
  exports: ['Link'],
  summary:
    'Text that navigates. Inline links follow the sentence and are always underlined; standalone links underline on hover and can carry a trailing icon. Brand or neutral tone, three sizes, five states.',
  hero: () => <Link href="#" size="md" label="View all projects" trailingIcon="arrows/arrow-right" />,
  playground: {
    controls: [
      { name: 'label', figma: 'Label', control: { type: 'text' }, default: 'Link text' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'standalone' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'tone', figma: 'Tone', control: { type: 'select', options: TONES }, default: 'brand' },
      { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', control: { type: 'icon' }, default: undefined },
      { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', control: { type: 'icon' }, default: undefined },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <Link href="#" onClick={(e) => e.preventDefault()} {...(a as any)} />,
    code: (a) => `<Link href="/projects"${jsxProps(a, { type: 'standalone', size: 'md', tone: 'brand', disabled: false })} />`,
  },
  examples: [
    {
      title: 'Inline in body copy',
      caption: 'Inline links match the size of the text around them and stay underlined.',
      render: () => (
        <p className="type-body-md-regular max-w-[26rem] text-text-secondary">
          Your plan renews on 1 March. Read the <Link type="inline" href="#" label="billing terms" /> to see how renewals and refunds work.
        </p>
      ),
      code: `<p className="type-body-md-regular text-text-secondary">
  Your plan renews on 1 March. Read the <Link type="inline" href="/billing/terms" label="billing terms" /> to see
  how renewals and refunds work.
</p>`,
    },
    {
      title: 'Card footer',
      caption: 'Standalone links sit after the content they lead to.',
      render: () => (
        <div className="flex w-full max-w-[20rem] flex-col gap-lg rounded-surface border border-border-subtle bg-surface-raised p-xl">
          <span className="type-body-md-semibold text-text-primary">Recent projects</span>
          <ul className="type-body-sm-regular flex flex-col gap-sm text-text-secondary">
            <li>Website refresh</li>
            <li>Onboarding flow</li>
            <li>Pricing experiment</li>
          </ul>
          <Link href="#" size="sm" label="View all" trailingIcon="arrows/arrow-right" />
        </div>
      ),
      code: `<Link href="/projects" size="sm" label="View all" trailingIcon="arrows/arrow-right" />`,
    },
    {
      title: 'Form helper row',
      caption: 'Neutral links keep secondary paths quiet.',
      render: () => (
        <div className="flex w-full max-w-[20rem] items-center justify-between">
          <span className="type-body-sm-medium text-text-secondary">Password</span>
          <Link href="#" tone="neutral" size="sm" label="Forgot password?" />
        </div>
      ),
      code: `<div className="flex items-center justify-between">
  <label className="type-body-sm-medium text-text-secondary" htmlFor="password">Password</label>
  <Link href="/reset" tone="neutral" size="sm" label="Forgot password?" />
</div>`,
    },
    {
      title: 'Footer links',
      caption: 'The external icon marks destinations that leave the product.',
      render: () => (
        <div className="flex flex-wrap items-center gap-xl border-t border-border-subtle pt-lg">
          <Link href="#" tone="neutral" size="sm" label="Privacy" />
          <Link href="#" tone="neutral" size="sm" label="Terms" />
          <Link href="#" tone="neutral" size="sm" label="Status" trailingIcon="arrows/external-link" target="_blank" rel="noreferrer" />
        </div>
      ),
      code: `<Link href="/privacy" tone="neutral" size="sm" label="Privacy" />
<Link href="/terms" tone="neutral" size="sm" label="Terms" />
<Link href="https://status.example.com" target="_blank" rel="noreferrer" tone="neutral" size="sm" label="Status" trailingIcon="arrows/external-link" />`,
    },
  ],
  whenToUse: {
    use: ['Navigate to another page, section or resource.', 'Inside a sentence (inline) or after the content it leads to (standalone).'],
    dont: ['Submit, delete or save — that is a Button (2.1).', 'A primary call to action that changes data.'],
  },
  matrices: [
    {
      title: 'Link',
      rows: 'Type × Tone × Size',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Type · Tone · Size"
          rows={ROWS}
          colProp="State"
          cols={STATES}
          cell={(row, state) => {
            const [t, tone, s] = row.split(' · ') as [(typeof TYPES)[number], (typeof TONES)[number], S];
            return cell(t, tone, s, state);
          }}
        />
      ),
    },
    {
      title: 'Content options',
      rows: 'Tone',
      columns: 'Content',
      render: () => (
        <Matrix
          rowProp="Tone"
          rows={TONES}
          colProp="Content"
          cols={['trailing arrow', 'external link', 'leading icon', 'inline'] as const}
          cell={(tone, c) =>
            c === 'trailing arrow' ? (
              <Link href="#" tone={tone} label="View all" trailingIcon="arrows/arrow-right" />
            ) : c === 'external link' ? (
              <Link href="#" tone={tone} label="Documentation" trailingIcon="arrows/external-link" />
            ) : c === 'leading icon' ? (
              <Link href="#" tone={tone} label="Annual report" leadingIcon="general/download" />
            ) : (
              <span className="type-body-md-regular whitespace-nowrap text-text-secondary">
                See <Link type="inline" href="#" tone={tone} label="release notes" /> for details.
              </span>
            )
          }
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex scale-150 flex-col items-center gap-xl">
        <Link href="#" label="Annual report" leadingIcon="files/file-text" trailingIcon="arrows/arrow-right" />
      </div>
    ),
    parts: [
      { name: 'Root', description: 'Horizontal, Hug, no padding and no control height — the height is the text’s line height, so inline links never shift the sentence. Gap link/gap/{size}; radius/xs for the focus ring.', tokens: ['link/gap/md', 'radius/xs', 'color/fill/none'] },
      { name: 'Leading icon', description: 'Standalone only. Identifies the destination type (a document, a download). size/icon/sm (sm) or md (md, lg).', tokens: ['size/icon/md'] },
      { name: 'Label', description: 'Names the destination. Standalone: type/body/{size}/semibold, underline on hover and pressed. Inline: type/body/{size}/regular, always underlined.', tokens: ['type/body/md/semibold', 'type/body/md/regular'] },
      { name: 'Trailing icon', description: 'Standalone only. arrow-right for “continue to”; external-link when the destination leaves the product.' },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', description: 'Visible text; names the destination. `children` works too.' },
    { name: 'type', figma: 'Type', type: "'inline' | 'standalone'", default: "'standalone'", description: 'Inline: always underlined, no icons. Standalone: underline on hover, icons allowed.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Label style and icon size.' },
    { name: 'tone', figma: 'Tone', type: "'brand' | 'neutral'", default: "'brand'", description: 'Brand-coloured or neutral text.' },
    { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', type: 'IconName', description: 'Standalone only.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName', description: 'Standalone only.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Removes href, not focusable, aria-disabled. Prefer removing the link.' },
    { name: 'href, target, rel …', type: 'AnchorHTMLAttributes', description: 'Native anchor attributes. target="_blank" adds “(opens in a new tab)” to the accessible name.' },
    { name: 'forceState', type: "'hover' | 'pressed' | 'focus'", description: 'Documentation only: pins a pseudo-state.' },
  ],
  tokens: [
    'color/text/brand', 'color/text/brand/hover', 'color/text/brand/pressed',
    'color/text/secondary', 'color/text/primary', 'color/text/disabled', 'color/fill/none',
    'link/gap/sm', 'link/gap/md', 'link/gap/lg', 'radius/xs', 'size/icon/sm', 'size/icon/md', 'size/touch-min',
    'type/body/sm/semibold', 'type/body/md/semibold', 'type/body/lg/semibold',
    'type/body/sm/regular', 'type/body/md/regular', 'type/body/lg/regular', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Link or Button',
      body: 'If it goes somewhere, it is a Link; if it does something, it is a Button. Never style one to look like the other — the role in code must match what people see.',
      render: () => (
        <div className="flex w-full max-w-[26rem] flex-col gap-md">
          <div className="flex items-center justify-between rounded-surface border border-border-subtle bg-surface-base p-lg">
            <span className="type-body-sm-medium text-text-primary">Invoice #2041</span>
            <Link href="#" size="sm" label="View invoice" trailingIcon="arrows/arrow-right" />
          </div>
          <div className="flex items-center justify-between rounded-surface border border-border-subtle bg-surface-base p-lg">
            <span className="type-body-sm-medium text-text-primary">Invoice #2041</span>
            <Button size="sm" label="Pay invoice" />
          </div>
        </div>
      ),
      dont: { caption: 'A Link that deletes, saves or submits.', render: () => <Link href="#" tone="brand" label="Delete account" /> },
    },
    {
      title: 'Inline vs standalone',
      body: 'Inline: inside a sentence, same size and weight as the text, always underlined so it never depends on colour alone. Standalone: on its own line or in an action row, after the content it leads to; semibold; underline on hover.',
      render: () => (
        <div className="flex flex-wrap items-start gap-3xl">
          <p className="type-body-md-regular max-w-[18rem] text-text-secondary">
            Exports run nightly. Change the schedule in <Link type="inline" href="#" label="workspace settings" />.
          </p>
          <div className="flex flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-lg">
            <span className="type-body-sm-semibold text-text-primary">3 new comments</span>
            <Link href="#" size="sm" label="View all" trailingIcon="arrows/arrow-right" />
          </div>
        </div>
      ),
      do: { caption: 'Underline inline links.', render: () => <p className="type-body-md-regular text-text-secondary">Read the <Link type="inline" href="#" label="billing terms" />.</p> },
      dont: { caption: 'Rely on colour alone inside paragraphs.', render: () => <p className="type-body-md-regular text-text-secondary">Read the <span className="text-text-brand">billing terms</span>.</p> },
    },
    {
      title: 'Brand vs neutral tone',
      body: 'Brand is the default and the one people recognise as a link. Neutral suits dense secondary text: footers, captions, table metadata, “Forgot password?”.',
      do: {
        caption: 'Neutral links in a dense footer.',
        render: () => (
          <div className="flex gap-lg">
            {['Privacy', 'Terms', 'Cookies', 'Status'].map((l) => <Link key={l} href="#" tone="neutral" size="sm" label={l} />)}
          </div>
        ),
      },
      dont: {
        caption: 'Brand-tone links stacked densely in a footer.',
        render: () => (
          <div className="flex gap-lg">
            {['Privacy', 'Terms', 'Cookies', 'Status'].map((l) => <Link key={l} href="#" size="sm" label={l} />)}
          </div>
        ),
      },
    },
    {
      title: 'Icons',
      body: 'Trailing arrow-right for “continue to” standalone links. Trailing external-link only when the destination leaves the product or opens a new tab. Leading icons only when they identify the destination type.',
      render: () => (
        <div className="flex flex-wrap gap-2xl">
          <Link href="#" label="View all" trailingIcon="arrows/arrow-right" />
          <Link href="#" label="API reference" trailingIcon="arrows/external-link" />
          <Link href="#" label="Annual report" leadingIcon="general/download" />
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'The label names the destination (“Billing settings”, “Release notes”), never “click here” or “read more” on its own. Standalone labels are short (up to four words); inline labels may wrap with the sentence.',
      do: { caption: '“billing terms” is linked.', render: () => <p className="type-body-md-regular text-text-secondary">Read the <Link type="inline" href="#" label="billing terms" />.</p> },
      dont: { caption: '“Click here” is linked.', render: () => <p className="type-body-md-regular text-text-secondary">For billing terms, <Link type="inline" href="#" label="click here" />.</p> },
    },
  ],
  accessibility: [
    'The underline keeps inline links distinguishable without colour.',
    'Text colour meets text contrast against color/surface/base in every mode and state except disabled.',
    'Focus ring (focus/default, radius/xs) always visible.',
    'Avoid disabled links; a disabled Link has no href, is not focusable and is announced as unavailable (aria-disabled).',
    'Links that open a new tab say so in their accessible name — `target="_blank"` adds “(opens in a new tab)” automatically.',
    'Standalone links reach size/touch-min on touch platforms through an invisible hit area.',
  ],
});
