import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import type { TokenTextStyle } from '@/tokens/types';
import { cn } from '@/lib/cn';
import { Badge, Button, Icon, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../../DocPage';
import { Bullets, Caption, DoDont, InlineCode, P, TokenBadge } from '../../blocks';
import { figmaNodeFor } from '../../meta';

/* ---------- token lookups ---------- */
const byName = new Map(tokens.variables.map((v) => [v.name, v]));
const value = (name: string) => Object.values(byName.get(name)!.modes)[0].value;
const px = (s: string) => Math.round(parseFloat(s) * 100) / 100;
const UI_FAMILY = value('font/family/ui');
const MONO_FAMILY = value('font/family/mono');

const ROLES = ['display', 'heading', 'body', 'code'] as const;
type Role = (typeof ROLES)[number];
const ROLE_INFO: Record<Role, { title: string; use: string; sample: string }> = {
  display: { title: 'Display', use: 'For hero and marketing headlines, like “Sync your world”. Keep it to marketing and onboarding screens.', sample: 'Sync' },
  heading: { title: 'Heading', use: 'For page, section, card and dialog titles.', sample: 'Shared' },
  body: { title: 'Body', use: 'For running text and most of the interface. Use regular for reading and values, medium for labels, badges and menu items, and semibold for buttons and links.', sample: 'Files' },
  code: { title: 'Code', use: `For code, IDs, keys and tabular figures, set in ${MONO_FAMILY}.`, sample: 'a7f3c9' },
};
const parts = (t: TokenTextStyle) => t.name.split('/');
/** Text styles grouped role → size → weights, largest first (the order of the Figma styles). */
const scale = ROLES.map((role) => {
  const styles = tokens.textStyles.filter((t) => parts(t)[1] === role);
  const sizes = [...new Set(styles.map((t) => parts(t)[2]))];
  return { role, rows: sizes.map((size) => ({ size, styles: styles.filter((t) => parts(t)[2] === size) })) };
});
const pct = (t: TokenTextStyle) => {
  const p = Math.round((parseFloat(t.letterSpacing) / parseFloat(t.fontSize)) * 100);
  return p === 0 ? '0' : `${p}%`.replace('-', '−');
};
const metrics = (t: TokenTextStyle) => `${px(t.fontSize)} / ${px(t.lineHeight)} · ${pct(t)}`;
const familyOf = (t: TokenTextStyle) => (t.bound.fontFamily === 'font/family/mono' ? MONO_FAMILY : UI_FAMILY);
const style = (name: string) => tokens.textStyles.find((t) => t.name === name)!;
const weightName = (t: TokenTextStyle) => parts(t)[3];

/* ---------- shared bits ---------- */
function Block({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-lg">
      <AnchorHeading>{title}</AnchorHeading>
      {intro && <P>{intro}</P>}
      {children}
    </section>
  );
}
function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-w-0 rounded-surface border border-border-subtle bg-surface-sunken p-xl md:p-3xl', className)}>{children}</div>;
}
function slashes(text: ReactNode): ReactNode {
  if (typeof text !== 'string') return text;
  return text.split('/').map((part, i, all) => (
    <Fragment key={i}>
      {part}
      {i < all.length - 1 && (
        <>
          /<wbr />
        </>
      )}
    </Fragment>
  ));
}
function Code({ children, className }: { children: ReactNode; className?: string }) {
  const list = Array.isArray(children) ? children : [children];
  return (
    <span className={cn('type-code-sm-regular min-w-0 text-text-tertiary', className)}>
      {list.map((c, i) => (
        <Fragment key={i}>{slashes(c)}</Fragment>
      ))}
    </span>
  );
}
function Tag({ children, selected }: { children: ReactNode; selected?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-sm">
      <span className="type-body-sm-semibold text-text-primary">{children}</span>
      {selected && <Badge size="sm" tone="brand" label="Selected" />}
    </span>
  );
}
function ScrollRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div tabIndex={0} role="region" aria-label={label} className="min-w-0 overflow-x-auto rounded-surface border border-border-subtle outline-none is-focus:shadow-focus-default">
      {children}
    </div>
  );
}
function Arrow() {
  return (
    <span aria-hidden className="flex shrink-0 items-center justify-center text-icon-tertiary">
      <Icon name="arrows/arrow-down" size="md" className="md:hidden" />
      <Icon name="arrows/arrow-right" size="md" className="hidden md:block" />
    </span>
  );
}

/* ---------- Overview ---------- */
function LayerModel() {
  const boxes: [string, string, ReactNode][] = [
    ['1 · Variables', 'The raw values: families, weights, sizes, line heights and letter spacing.', <Code key="v">font/size/body-md · font/weight/regular</Code>],
    ['2 · Text styles', 'Each style combines the variables for one role, size and weight.', <Code key="s">type/body/md/regular</Code>],
    ['3 · Components', 'Components apply a text style instead of setting size, line height or weight by hand.', <span key="c" className="type-body-md-regular text-text-primary">Text field value</span>],
  ];
  return (
    <Panel>
      <div className="flex flex-col items-stretch gap-md md:flex-row">
        {boxes.map(([t, d, ex], i) => (
          <Fragment key={t}>
            {i > 0 && <Arrow />}
            <div className="flex flex-1 flex-col gap-sm rounded-control border border-border-subtle bg-surface-base p-lg">
              <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">{t}</span>
              <p className="type-body-sm-regular text-text-secondary">{d}</p>
              {ex}
            </div>
          </Fragment>
        ))}
      </div>
    </Panel>
  );
}

function TypefaceCard({ family, mono, use, note }: { family: string; mono?: boolean; use: string; note?: string }) {
  const f = (cls: string) => (mono ? cls.replace('type-body', 'type-code').replace(/-(lg|xl)-/, '-md-') : cls);
  return (
    <div className="flex min-w-0 flex-col gap-lg rounded-surface border border-border-subtle bg-surface-base p-xl md:p-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-sm">
        <h3 className="type-heading-sm-semibold text-text-primary">{family}</h3>
        <Code>{mono ? 'font/family/mono' : 'font/family/ui'}</Code>
      </div>
      <span aria-hidden className={cn('text-text-primary', mono ? 'type-code-md-medium' : 'type-display-lg-semibold')} style={mono ? { fontSize: 'var(--font-size-display-lg)', lineHeight: 'var(--font-line-height-display-lg)' } : undefined}>
        Aa
      </span>
      <div className={cn('flex flex-col gap-xxs break-all text-text-secondary', f('type-body-md-regular'))}>
        <span>ABCDEFGHIJKLMNOPQRSTUVWXYZ</span>
        <span>abcdefghijklmnopqrstuvwxyz</span>
        <span>0123456789</span>
        <span>{'! ? & @ # % ( ) [ ] { } " \' , . : ; – —'}</span>
      </div>
      <p className="type-body-sm-regular text-text-secondary">{use}</p>
      {note && <p className="type-body-xs-regular text-text-tertiary">{note}</p>}
    </div>
  );
}

function TypeScale() {
  return (
    <div className="flex flex-col gap-3xl">
      {scale.map(({ role, rows }) => (
        <div key={role} className="flex min-w-0 flex-col gap-md">
          <div className="flex flex-col gap-xxs">
            <h3 className="type-heading-xs-semibold text-text-primary">{ROLE_INFO[role].title}</h3>
            <p className="type-body-sm-regular max-w-(--size-measure-reading) text-text-secondary">{ROLE_INFO[role].use}</p>
          </div>
          <div className="flex flex-col divide-y divide-border-subtle rounded-surface border border-border-subtle bg-surface-base">
            {rows.map(({ size, styles }) => (
              <div key={size} className="grid min-w-0 gap-md p-lg md:grid-cols-[12rem_minmax(0,1fr)] md:items-center md:p-xl">
                <div className="flex flex-col gap-xxs">
                  <span className="type-code-sm-medium text-text-primary">
                    type/{role}/{size}
                  </span>
                  <span className="type-body-xs-regular text-text-tertiary">
                    {metrics(styles[0])} · {familyOf(styles[0])}
                  </span>
                </div>
                <div className="flex min-w-0 flex-wrap items-end gap-x-2xl gap-y-md">
                  {styles.map((t) => (
                    <div key={t.name} className="flex min-w-0 flex-col gap-xxs">
                      <span className={cn(t.className, 'text-text-primary')}>{ROLE_INFO[role].sample}</span>
                      <span className="type-body-xs-regular text-text-tertiary">{weightName(t)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const HIERARCHY: { level: string; style: string; render: () => ReactNode }[] = [
  { level: 'Display', style: 'type/display/sm/semibold', render: () => <span className="type-display-sm-semibold text-text-primary">Your files, in sync everywhere</span> },
  { level: 'Heading', style: 'type/heading/md/semibold', render: () => <span className="type-heading-md-semibold text-text-primary">Shared folders and team access</span> },
  {
    level: 'Body',
    style: 'type/body/md/regular',
    render: () => <span className="type-body-md-regular text-text-secondary">Files sync in the background while you work, and large folders upload in parts, so a dropped connection never restarts the transfer.</span>,
  },
  {
    level: 'Labels and controls',
    style: 'type/body/sm/semibold · type/body/xs/medium',
    render: () => (
      <span className="flex flex-wrap items-center gap-md">
        <Button size="sm" label="Invite people" />
        <Badge size="sm" tone="success" label="In sync" />
      </span>
    ),
  },
  { level: 'Supporting', style: 'type/body/sm/regular', render: () => <span className="type-body-sm-regular text-text-tertiary">Last synced 2 minutes ago · 14 people</span> },
  { level: 'Code', style: 'type/code/sm/regular', render: () => <span className="type-code-sm-regular rounded-xs bg-surface-sunken px-sm py-xxs text-text-primary">syncium sync --folder ~/Documents</span> },
];

function HierarchyExample() {
  return (
    <Panel>
      <div className="flex flex-col gap-xl rounded-surface bg-surface-base p-xl md:p-3xl">
        {HIERARCHY.map((h) => (
          <div key={h.level} className="grid min-w-0 gap-xs md:grid-cols-[minmax(0,1fr)_13rem] md:items-center md:gap-xl">
            <div className="min-w-0">{h.render()}</div>
            <div className="order-first flex flex-col md:order-none md:border-l md:border-border-subtle md:pl-lg">
              <span className="type-body-xs-semibold text-text-brand">{h.level}</span>
              <Code>{h.style}</Code>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Overview() {
  return (
    <div className="flex flex-col gap-6xl">
      <Block title="How typography works" intro={`Syncium uses one friendly geometric family for the whole interface and a monospace for code and data. The brand typeface is Gilroy. ${UI_FAMILY} stands in for it in this build, with the same round shapes, and Rubik appears only in the logo.`}>
        <LayerModel />
        <Bullets
          items={[
            <>
              <strong className="font-semibold text-text-primary">Apply a text style, not a raw size.</strong> Every piece of text uses one of the styles below, so one change at the source reaches every screen.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Keep the hierarchy simple.</strong> Size, weight and color work together to set the levels. A dense screen rarely needs more than three sizes.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Write for reading.</strong> Body text is 16, stays within the reading measure and has generous line height.
            </>,
          ]}
        />
      </Block>

      <Block title="Typefaces" intro="Syncium uses two typefaces in the product. Each card is set in the typeface it describes.">
        <div className="grid gap-xl lg:grid-cols-2">
          <TypefaceCard
            family={UI_FAMILY}
            use="Used for every interface role: display, headings, body, labels and controls."
            note={`The brand typeface is Gilroy, a commercial font that needs a license. ${UI_FAMILY} stands in until it’s installed. Change the font/family/ui value and every style follows.`}
          />
          <TypefaceCard family={MONO_FAMILY} mono use="Used for code, sync IDs, file hashes, keyboard keys and tabular figures in logs and tables." />
        </div>
      </Block>

      <Block title="Type scale" intro="Styles are grouped by role and run from largest to smallest. Each row shows a sample in every weight that role supports, with its size / line height · letter spacing.">
        <TypeScale />
      </Block>

      <Block title="Hierarchy in use" intro="A Syncium page header and its content, labeled with the style each line uses. Cover the labels and the levels still read clearly.">
        <HierarchyExample />
      </Block>
    </div>
  );
}

/* ---------- Tokens ---------- */
function ValueTable({ names, label }: { names: string[]; label: string }) {
  return (
    <ScrollRegion label={label}>
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead className="bg-surface-sunken">
          <tr className="type-body-xs-semibold text-text-tertiary">
            <th scope="col" className="px-lg py-md">Token</th>
            <th scope="col" className="px-lg py-md">Value</th>
            <th scope="col" className="px-lg py-md">CSS</th>
            <th scope="col" className="px-lg py-md">Tailwind</th>
          </tr>
        </thead>
        <tbody>
          {names.map((n) => {
            const v = byName.get(n)!;
            const m = Object.values(v.modes)[0];
            return (
              <tr key={n} className="border-t border-border-subtle align-top">
                <td className="px-lg py-md">
                  <TokenBadge name={n} />
                  {v.description && <p className="type-body-xs-regular mt-xs max-w-80 text-text-tertiary">{v.description}</p>}
                </td>
                <td className="px-lg py-md">
                  <span className="type-code-sm-medium text-text-primary">{v.type === 'FLOAT' || m.value.endsWith('px') ? px(m.value) : m.value}</span>
                  {m.alias && <span className="type-code-sm-regular block text-text-tertiary">{m.alias}</span>}
                </td>
                <td className="type-code-sm-regular px-lg py-md text-text-secondary">var({v.css})</td>
                <td className="type-code-sm-regular px-lg py-md text-text-brand">{v.tailwind ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

function StyleTable() {
  return (
    <ScrollRegion label="Text styles">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead className="bg-surface-sunken">
          <tr className="type-body-xs-semibold text-text-tertiary">
            <th scope="col" className="px-lg py-md">Text style</th>
            <th scope="col" className="px-lg py-md">Utility</th>
            <th scope="col" className="px-lg py-md">Size / line height</th>
            <th scope="col" className="px-lg py-md">Weight</th>
            <th scope="col" className="px-lg py-md">Letter spacing</th>
          </tr>
        </thead>
        <tbody>
          {tokens.textStyles.map((t) => (
            <tr key={t.name} className="border-t border-border-subtle">
              <td className="px-lg py-md">
                <TokenBadge name={t.name} />
              </td>
              <td className="type-code-sm-regular px-lg py-md text-text-brand">{t.className}</td>
              <td className="type-code-sm-regular px-lg py-md text-text-secondary">
                {px(t.fontSize)} / {px(t.lineHeight)}
              </td>
              <td className="type-code-sm-regular px-lg py-md text-text-secondary">{t.fontWeight}</td>
              <td className="type-code-sm-regular px-lg py-md text-text-secondary">
                {px(t.letterSpacing)} ({pct(t)})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

const typo = tokens.variables.filter((v) => v.collection === 'Typography').map((v) => v.name);
const TOKEN_GROUPS: [string, string, string[]][] = [
  ['Family', 'The typefaces, one for each job.', typo.filter((n) => n.startsWith('font/family/'))],
  ['Weight', 'The four weights used across the scale.', typo.filter((n) => n.startsWith('font/weight/'))],
  ['Size', 'One size per role and step. Each one feeds the text style with the same name.', typo.filter((n) => n.startsWith('font/size/') && n !== 'font/size/input-min')],
  ['Line height', 'One line height per role and step.', typo.filter((n) => n.startsWith('font/line-height/'))],
  ['Letter spacing', 'Display text tightens by −2%, and headings from heading/md up by −1%. Everything else stays at 0.', typo.filter((n) => n.startsWith('font/letter-spacing/'))],
  ['Input minimum', 'The smallest size for text typed into a field on mobile, so browsers don’t zoom in when the field is focused.', ['font/size/input-min']],
];

function TokensTab() {
  return (
    <div className="flex flex-col gap-5xl">
      <P>
        The <InlineCode>Typography</InlineCode> collection has a single mode. Text styles use these variables, and components apply each style as a utility class with the same name: <InlineCode>type/body/md/regular</InlineCode> → <InlineCode>type-body-md-regular</InlineCode>.
      </P>
      <Block title="Text styles" intro="Look up any style’s utility class and its final size, weight and spacing.">
        <StyleTable />
      </Block>
      {TOKEN_GROUPS.map(([title, intro, names]) => (
        <Block key={title} title={title} intro={intro}>
          <ValueTable names={names} label={`${title} tokens`} />
        </Block>
      ))}
    </div>
  );
}

/* ---------- Guidelines ---------- */
interface Guide {
  title: string;
  body: ReactNode;
  visual?: ReactNode;
  caption?: string;
  do?: { caption: string; render: () => ReactNode };
  dont?: { caption: string; render: () => ReactNode };
}
function GuideList({ items }: { items: Guide[] }) {
  return (
    <div className="flex max-w-[64rem] flex-col gap-4xl">
      {items.map((g) => (
        <section key={g.title} className="flex min-w-0 flex-col gap-lg border-b border-border-subtle pb-4xl last:border-b-0">
          <AnchorHeading>{g.title}</AnchorHeading>
          <div className="flex flex-col gap-md">{g.body}</div>
          {g.visual && (
            <figure className="m-0 flex min-w-0 flex-col gap-sm">
              {g.visual}
              {g.caption && (
                <figcaption>
                  <Caption>{g.caption}</Caption>
                </figcaption>
              )}
            </figure>
          )}
          {(g.do || g.dont) && (
            <div className="grid gap-xl md:grid-cols-2">
              {g.do && (
                <DoDont kind="do" caption={g.do.caption}>
                  {g.do.render()}
                </DoDont>
              )}
              {g.dont && (
                <DoDont kind="dont" caption={g.dont.caption}>
                  {g.dont.render()}
                </DoDont>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

const SENTENCE = 'Files sync in the background while you work. Large folders upload in parts, so a dropped connection never restarts the transfer.';

function ReadingSpecimen() {
  const levels: [string, string, string, string][] = [
    ['Display', 'type/display/md/semibold', 'Sync your world', 'text-text-primary'],
    ['Heading', 'type/heading/lg/semibold', 'Shared folders and team access', 'text-text-primary'],
    ['Body', 'type/body/md/regular', SENTENCE, 'text-text-secondary'],
    ['Labels and controls', 'type/body/sm/medium', 'Folder name · Sync mode · Members', 'text-text-secondary'],
    ['Supporting', 'type/body/xs/regular', 'Last synced 2 minutes ago. Versions are kept for 30 days.', 'text-text-tertiary'],
  ];
  return (
    <Panel>
      <div className="flex flex-col divide-y divide-border-subtle rounded-surface bg-surface-base">
        {levels.map(([level, name, text, color]) => {
          const t = style(name);
          return (
            <div key={level} className="flex min-w-0 flex-col gap-sm p-lg md:p-xl">
              <span className="flex flex-wrap items-baseline gap-x-md">
                <span className="type-body-xs-semibold text-text-brand">{level}</span>
                <Code>{name}</Code>
                <span className="type-body-xs-regular text-text-tertiary">
                  {metrics(t)} · {t.fontWeight}
                </span>
              </span>
              <span className={cn(t.className, color, 'max-w-(--size-measure-reading) break-words')}>{text}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ThreeUp({ children }: { children: ReactNode }) {
  return (
    <Panel>
      <div className="grid gap-xl lg:grid-cols-3">{children}</div>
    </Panel>
  );
}
function Cell({ title, selected, note, children, bad }: { title: string; selected?: boolean; note?: string; children: ReactNode; bad?: boolean }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-md rounded-control border bg-surface-base p-lg', bad ? 'border-border-danger-subtle' : selected ? 'border-border-brand' : 'border-border-subtle')}>
      <Tag selected={selected}>{title}</Tag>
      <div className="min-w-0 overflow-hidden">{children}</div>
      {note && <span className="type-body-xs-regular text-text-tertiary">{note}</span>}
    </div>
  );
}

function DisplayVsBody() {
  const para = 'Large folders upload in parts, so a dropped connection never restarts the whole transfer.';
  return (
    <ThreeUp>
      <Cell title="1 · Display as a heading" note="type/display/sm/semibold: one short, high-emphasis line.">
        <span className="type-display-sm-semibold text-text-primary">Sync your world</span>
      </Cell>
      <Cell title="2 · Display misused as body" bad note="Too big and too tight to read, and it breaks the rhythm of the UI.">
        <span className="type-display-sm-semibold break-words text-text-primary">{para}</span>
      </Cell>
      <Cell title="3 · Body style" selected note="type/body/md/regular: the right style for running text.">
        <span className="type-body-md-regular text-text-secondary">{para}</span>
      </Cell>
    </ThreeUp>
  );
}

function BaseSize() {
  const opts: [string, string, string, boolean][] = [
    ['14 · type/body/sm', 'type-body-sm-regular', 'type-body-sm-medium', false],
    ['16 · type/body/md', 'type-body-md-regular', 'type-body-md-medium', true],
    ['18 · type/body/lg', 'type-body-lg-regular', 'type-body-lg-medium', false],
  ];
  return (
    <ThreeUp>
      {opts.map(([t, body, label, sel]) => (
        <Cell key={t} title={t} selected={sel}>
          <div className="flex flex-col gap-md">
            <span className={cn(body, 'text-text-secondary')}>Choose which folders sync to this device and which stay online only.</span>
            <span className={cn(label, 'text-text-primary')}>Sync mode</span>
          </div>
        </Cell>
      ))}
    </ThreeUp>
  );
}

function LineHeights() {
  const opts: [string, string, string | undefined, boolean][] = [
    ['Too tight', '16 / 18 · 1.1', 'var(--scale-line-height-18)', false],
    ['Selected', '16 / 24 · 1.5', undefined, true],
    ['Too loose', '16 / 32 · 2', 'var(--scale-line-height-32)', false],
  ];
  return (
    <ThreeUp>
      {opts.map(([t, m, lh, sel]) => (
        <Cell key={t} title={t} selected={sel} note={m}>
          <p className="type-body-md-regular text-text-secondary" style={lh ? { lineHeight: lh } : undefined}>
            {SENTENCE}
          </p>
        </Cell>
      ))}
    </ThreeUp>
  );
}

function Tracking() {
  const ls = (f: number): CSSProperties => ({ letterSpacing: `calc(var(--font-letter-spacing-display-md) * ${f})` });
  const opts: [string, string, CSSProperties | undefined, boolean][] = [
    ['Default · 0', 'Loose at this size', { letterSpacing: 'var(--font-letter-spacing-default)' }, false],
    ['Selected · −2%', 'font/letter-spacing/display-md', undefined, true],
    ['Too tight · −6%', 'Letters start to touch', ls(3), false],
  ];
  return (
    <ThreeUp>
      {opts.map(([t, n, s, sel]) => (
        <Cell key={t} title={t} selected={sel} note={n}>
          <span className="type-display-md-semibold whitespace-nowrap text-text-primary" style={s}>
            Sync
          </span>
        </Cell>
      ))}
    </ThreeUp>
  );
}

function WeightCoverage() {
  const weights = typo.filter((n) => n.startsWith('font/weight/'));
  return (
    <Panel>
      <div className="flex flex-col divide-y divide-border-subtle rounded-surface bg-surface-base">
        {weights.map((w) => {
          const used = [...new Set(tokens.textStyles.filter((t) => t.bound.fontWeight === w).map((t) => parts(t)[1]))];
          return (
            <div key={w} className="grid min-w-0 gap-sm p-lg md:grid-cols-[minmax(0,1fr)_14rem] md:items-center md:p-xl">
              <span className="type-heading-lg-semibold text-text-primary" style={{ fontWeight: `var(${byName.get(w)!.css})` }}>
                Shared folders
              </span>
              <span className="flex flex-col">
                <Code className="text-text-secondary">
                  {w} · {value(w)}
                </Code>
                <span className="type-body-xs-regular text-text-tertiary">Used by {used.join(', ')}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function FamilyRoles() {
  return (
    <Panel>
      <div className="flex flex-col gap-lg rounded-surface bg-surface-base p-xl md:p-3xl">
        <div className="flex flex-col gap-xs">
          <Code>{UI_FAMILY} · type/heading/lg/semibold</Code>
          <span className="type-heading-lg-semibold text-text-primary">Sync from the command line</span>
        </div>
        <div className="flex flex-col gap-xs">
          <Code>{UI_FAMILY} · type/body/md/regular</Code>
          <p className="type-body-md-regular max-w-(--size-measure-reading) text-text-secondary">Use the CLI to add a folder and choose how it syncs. Online-only folders keep a placeholder on disk and download when opened.</p>
        </div>
        <div className="flex flex-col gap-xs">
          <Code>{MONO_FAMILY} · type/code/md/regular</Code>
          <pre className="type-code-md-regular m-0 whitespace-pre-wrap break-words rounded-control bg-surface-sunken p-lg text-text-primary">syncium folder add ~/Documents --mode online-only</pre>
        </div>
      </div>
    </Panel>
  );
}

function SourceChange() {
  const deps = tokens.textStyles.filter((t) => t.bound.fontSize === 'font/size/body-md').map((t) => t.name);
  const sample = (
    <div className="flex flex-col gap-md">
      <TextField size="md" label="Folder name" defaultValue="Design reviews" />
      <div className="type-body-md-regular flex justify-between gap-md rounded-control border border-border-subtle px-lg py-sm text-text-primary">
        <span>Q3 reports.pdf</span>
        <span className="tabular-nums text-text-tertiary">2.4 MB</span>
      </div>
    </div>
  );
  return (
    <Panel>
      <ol className="grid gap-md lg:grid-cols-3">
        <li className="flex min-w-0 flex-col gap-sm rounded-control bg-surface-base p-lg">
          <span className="type-body-xs-semibold text-text-primary">1 · Text styles by role</span>
          {ROLES.map((r) => (
            <span key={r} className="flex flex-wrap items-baseline gap-x-sm">
              <span className="type-body-sm-medium text-text-primary">{ROLE_INFO[r].title}</span>
              <span className="type-body-xs-regular text-text-tertiary">{tokens.textStyles.filter((t) => parts(t)[1] === r).length} styles</span>
            </span>
          ))}
        </li>
        <li className="flex min-w-0 flex-col gap-sm rounded-control bg-surface-base p-lg">
          <span className="type-body-xs-semibold text-text-primary">2 · Typography collection</span>
          <Code className="text-text-secondary">font/size/body-md</Code>
          <span className="flex items-center gap-sm">
            <span className="type-code-sm-medium text-text-primary line-through">{px(value('font/size/body-md'))}</span>
            <span aria-hidden className="text-text-tertiary">→</span>
            <span className="type-code-sm-medium text-text-brand">15</span>
            <span className="sr-only">changed from 16 to 15 (preview)</span>
          </span>
        </li>
        <li className="flex min-w-0 flex-col gap-sm rounded-control bg-surface-base p-lg">
          <span className="type-body-xs-semibold text-text-primary">3 · Styles that follow</span>
          {deps.map((d) => (
            <Code key={d}>{d}</Code>
          ))}
        </li>
      </ol>
      <div className="mt-xl grid gap-xl md:grid-cols-2">
        <div className="flex flex-col gap-md">
          <Tag>Before · 16</Tag>
          {sample}
        </div>
        <div className="flex flex-col gap-md" style={{ '--font-size-body-md': '15px' } as CSSProperties}>
          <Tag>After · 15 (preview)</Tag>
          {sample}
        </div>
      </div>
    </Panel>
  );
}

const FILES: [string, string, string][] = [
  ['Q3 reports.pdf', '2.4 MB', '11:20'],
  ['Brand assets', '148.9 MB', '09:05'],
  ['Roadmap.key', '17.0 MB', '08:41'],
];
function FileTable({ tabular }: { tabular: boolean }) {
  return (
    <table className="type-body-sm-regular w-full border-collapse text-left text-text-primary">
      <tbody>
        {FILES.map(([n, s, t]) => (
          <tr key={n} className="border-t border-border-subtle first:border-t-0">
            <td className="py-xs pr-md">{n}</td>
            <td className={cn('py-xs pr-md', tabular ? 'text-right tabular-nums' : 'text-left')}>{s}</td>
            <td className={cn('py-xs', tabular ? 'text-right tabular-nums' : 'text-left')}>{t}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GuidelinesTab() {
  const items: Guide[] = [
    {
      title: 'Build a clear hierarchy',
      body: <P>Syncium text has five levels: display for hero text, headings, body, labels and controls, and supporting text. Make each level clearly different in size, weight or color, so people can tell them apart without the labels. A difference that’s too slight disappears.</P>,
      visual: <ReadingSpecimen />,
      caption: 'Each level in real product copy, with its style name, size / line height · letter spacing and weight.',
    },
    {
      title: 'Use display text sparingly',
      body: <P>Use display styles for large headlines and other high-emphasis moments. Body styles carry everything else: paragraphs, labels, navigation, buttons and menus. In dense UI, build hierarchy with weight, color and spacing instead of display sizes.</P>,
      visual: <DisplayVsBody />,
      caption: 'The same content set three ways. Display text is tightly set for short lines, so a whole paragraph of it is hard to read.',
      do: {
        caption: 'Inside a card, a heading style and a body style are enough.',
        render: () => (
          <div className="flex flex-col gap-xxs rounded-surface border border-border-subtle bg-surface-base p-lg">
            <span className="type-heading-xs-semibold text-text-primary">Storage</span>
            <span className="type-body-sm-regular text-text-secondary">68 GB of 100 GB used</span>
          </div>
        ),
      },
      dont: {
        caption: 'Don’t reach for a display size to make a card title stand out.',
        render: () => (
          <div className="flex flex-col gap-xxs rounded-surface border border-border-subtle bg-surface-base p-lg">
            <span className="type-display-sm-bold text-text-primary">Storage</span>
            <span className="type-body-sm-regular text-text-secondary">68 GB of 100 GB used</span>
          </div>
        ),
      },
    },
    {
      title: 'Base font size',
      body: (
        <>
          <P>Body text starts at 16 (type/body/md), which reads comfortably on laptops and phones at a normal distance. Use 14 (type/body/sm) for dense tables and secondary UI, and 18 or larger for long reads like release notes.</P>
          <P>On mobile, text typed into a field is at least {px(value('font/size/input-min'))} (font/size/input-min), so the browser doesn’t zoom in when the field is focused.</P>
        </>
      ),
      visual: <BaseSize />,
      caption: 'The same paragraph and control label at 14, 16 and 18. Syncium uses 16 as the base.',
    },
    {
      title: 'Line height',
      body: <P>Each role gets its own line height. Body and code text use 1.4–1.5 × the font size, headings 1.25–1.5 ×, and display about 1.2 ×. Every value lands on an even pixel, and you’ll find the exact numbers in the type scale.</P>,
      visual: <LineHeights />,
      caption: 'The same paragraph at 16 with three line heights. Tight lines crowd the ascenders, and loose lines break the paragraph into stripes.',
    },
    {
      title: 'Letter spacing',
      body: <P>Large text looks loose at the typeface’s default spacing, so display text tightens by −2% and headings from heading/md up by −1%. Everything else stays at 0. In Figma, each size has its own pixel value in font/letter-spacing/*.</P>,
      visual: <Tracking />,
      caption: 'The same display heading at three letter spacings.',
    },
    {
      title: 'Choosing the typeface and its weights',
      body: (
        <>
          <P>Gilroy is the brand typeface, but it’s a commercial font that needs a license, so {UI_FAMILY} stands in for it in this build. It’s a free geometric sans with a similar shape, Latin coverage, tabular figures and good legibility at small sizes. Once the license is in place, set font/family/ui to Gilroy and every style follows.</P>
          <P>Only use weights the font actually has, because faked weights look blurry or uneven. If a role needs a missing weight, map it to the nearest one and write that mapping down.</P>
        </>
      ),
      visual: <WeightCoverage />,
      caption: `${UI_FAMILY} has every weight the scale uses, so no fallback mapping is needed.`,
    },
    {
      title: 'Keep to three families',
      body: <P>Syncium uses three families, each with one job: {UI_FAMILY} for all UI and content, {MONO_FAMILY} for code, IDs and numbers in docs, and Rubik only in the logo wordmark. Avoid adding others. Fewer families load faster and look more consistent together.</P>,
      visual: <FamilyRoles />,
      caption: `${UI_FAMILY} carries the explanation; ${MONO_FAMILY} carries the command.`,
    },
    {
      title: 'Change typography from the source',
      body: <P>Changes flow outward, from font/* variables to type/* text styles to components. To change typography, edit the variable rather than a text layer or a component, so every screen stays in step.</P>,
      visual: <SourceChange />,
      caption: 'Changing font/size/body-md updates every type/body/md style, and with them every text field value and table row. The 15 is only a preview, not a real Syncium value.',
    },
    {
      title: 'Write in sentence case',
      body: <P>Use sentence case for headings, buttons, labels, menu items and tabs: capitalize only the first word and proper nouns. It reads faster, looks calmer next to bold weights and keeps translations consistent.</P>,
      do: { caption: 'Sentence case for buttons and titles.', render: () => <Button label="Share folder" leadingIcon="general/share" /> },
      dont: { caption: 'Don’t use title case or all caps for actions.', render: () => <Button emphasis="secondary" label="Share Folder Now" leadingIcon="general/share" /> },
    },
    {
      title: 'Numbers and data',
      body: <P>In tables, set sizes, dates and counts in tabular figures and align them right. The digits line up, so people can compare a column at a glance. Use the code styles in {MONO_FAMILY} for IDs, hashes and commands.</P>,
      do: { caption: 'Tabular figures, aligned right.', render: () => <div className="w-full max-w-[20rem] rounded-control bg-surface-base p-lg"><FileTable tabular /></div> },
      dont: { caption: 'Don’t leave proportional, left-aligned numbers in a column.', render: () => <div className="w-full max-w-[20rem] rounded-control bg-surface-base p-lg"><FileTable tabular={false} /></div> },
    },
    {
      title: 'Keep lines readable',
      body: <P>Cap running text at the reading measure (size/measure/reading), about 65–80 characters per line. On wider lines, the eye loses its place moving back to the start of the next one. See 1.3 Space &amp; layout for more.</P>,
      visual: (
        <Panel>
          <div className="flex flex-col gap-xl">
            <div className="flex flex-col gap-sm">
              <Tag selected>At the reading measure</Tag>
              <p className="type-body-md-regular max-w-(--size-measure-reading) rounded-control bg-surface-base p-lg text-text-secondary">
                {SENTENCE} {SENTENCE}
              </p>
            </div>
            <div className="flex flex-col gap-sm">
              <Tag>Full container width</Tag>
              <p className="type-body-md-regular rounded-control bg-surface-base p-lg text-text-secondary">
                {SENTENCE} {SENTENCE}
              </p>
            </div>
          </div>
        </Panel>
      ),
      caption: 'The same text capped at the reading measure and running full width. On wide screens, the uncapped line grows past 120 characters.',
    },
  ];
  return <GuideList items={items} />;
}

export default function Typography() {
  return (
    <DocPage
      eyebrow="Foundations › 1.2 Typography"
      title="Typography"
      description="Text styles set the hierarchy of every screen, from hero headlines to table data. Each Figma text style has a matching utility class: type/body/md/regular → type-body-md-regular."
      figmaNode={figmaNodeFor('1.2')}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Tokens', render: () => <TokensTab /> },
        { label: 'Guidelines', render: () => <GuidelinesTab /> },
      ]}
    />
  );
}
