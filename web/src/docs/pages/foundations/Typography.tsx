import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import type { TokenTextStyle } from '@/tokens/types';
import { cn } from '@/lib/cn';
import { config } from '@/ds.config';
import { Badge, Button, Icon, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../../DocPage';
import { Bullets, Caption, DoDont, InlineCode, P, TokenBadge } from '../../blocks';
import { figmaNodeFor } from '../../meta';

/*
 * Everything on this page is computed from the token export: family names come from font/family/*,
 * sizes and ratios from the text styles. A style or variable the current tokens don't have is
 * skipped, so the page works with any token set that follows the ds-create naming.
 */

/* ---------- token lookups ---------- */
const byName = new Map(tokens.variables.map((v) => [v.name, v]));
const has = (name: string | undefined): name is string => !!name && byName.has(name);
const value = (name: string) => {
  const v = byName.get(name);
  return v ? (Object.values(v.modes)[0]?.value ?? '') : '';
};
const px = (s: string) => Math.round(parseFloat(s) * 100) / 100;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** "a", "a and b", "a, b and c". */
const list = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const words = (n: number) => NUMBER_WORDS[n] ?? String(n);

/* ---------- families, read from font/family/* ---------- */
const GENERIC_FAMILIES: Record<string, string> = {
  'ui-sans-serif': 'System sans-serif',
  'system-ui': 'System sans-serif',
  '-apple-system': 'System sans-serif',
  'sans-serif': 'System sans-serif',
  'ui-serif': 'System serif',
  serif: 'System serif',
  'ui-monospace': 'System monospace',
  monospace: 'System monospace',
  'ui-rounded': 'System rounded',
};
/** The display name of a font stack: its first family, or a plain name for a system stack. */
const familyLabel = (stack: string) => {
  const first = stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  return GENERIC_FAMILIES[first.toLowerCase()] ?? first;
};
type Family = { token: string; key: string; stack: string; label: string; css: string };
const FAMILY_ORDER = ['ui', 'display', 'mono'];
const rank = (key: string) => (FAMILY_ORDER.includes(key) ? FAMILY_ORDER.indexOf(key) : FAMILY_ORDER.length);
const ALL_FAMILIES: Family[] = tokens.variables
  .filter((v) => v.name.startsWith('font/family/'))
  .map((v) => {
    const stack = Object.values(v.modes)[0]?.value ?? '';
    return { token: v.name, key: v.name.split('/')[2], stack, label: familyLabel(stack), css: v.css };
  })
  .sort((a, b) => rank(a.key) - rank(b.key));
/** One entry per distinct typeface (a display family that repeats the UI stack is the same face). */
const FAMILIES = ALL_FAMILIES.filter((f, i) => ALL_FAMILIES.findIndex((g) => g.stack === f.stack) === i);
const familyByToken = new Map(ALL_FAMILIES.map((f) => [f.token, f]));
const UI = familyByToken.get('font/family/ui') ?? FAMILIES[0];
const MONO = FAMILIES.find((f) => f.key === 'mono' && f.stack !== UI?.stack);
const UI_FAMILY = UI?.label ?? 'the UI family';
const MONO_FAMILY = MONO?.label ?? 'the monospace family';

/* ---------- text styles ---------- */
const parts = (t: TokenTextStyle) => t.name.split('/');
const ROLE_ORDER = ['display', 'heading', 'body', 'code'];
const roleRank = (r: string) => (ROLE_ORDER.includes(r) ? ROLE_ORDER.indexOf(r) : ROLE_ORDER.length);
const ROLES = [...new Set(tokens.textStyles.map((t) => parts(t)[1]))].sort((a, b) => roleRank(a) - roleRank(b));
const ROLE_INFO: Record<string, { title: string; use: string; sample: string }> = {
  display: { title: 'Display', use: 'For hero and marketing headlines, like “Everything in one place”. Keep it to marketing and onboarding screens.', sample: 'Launch' },
  heading: { title: 'Heading', use: 'For page, section, card and dialog titles.', sample: 'Projects' },
  body: { title: 'Body', use: 'For running text and most of the interface. Use regular for reading and values, medium for labels, badges and menu items, and semibold for buttons and links.', sample: 'Settings' },
  code: { title: 'Code', use: `For code, IDs, keys and tabular figures, set in ${MONO_FAMILY}.`, sample: 'a7f3c9' },
};
const info = (role: string) => ROLE_INFO[role] ?? { title: cap(role), use: `Text styles in the ${role} role.`, sample: 'Aa' };
/** Text styles grouped role → size → weights, largest first (the order of the Figma styles). */
const scale = ROLES.map((role) => {
  const styles = tokens.textStyles.filter((t) => parts(t)[1] === role);
  const sizes = [...new Set(styles.map((t) => parts(t)[2]))];
  return { role, rows: sizes.map((size) => ({ size, styles: styles.filter((t) => parts(t)[2] === size) })) };
});
const pctNum = (t: TokenTextStyle) => {
  const fs = parseFloat(t.fontSize);
  return fs ? Math.round(((parseFloat(t.letterSpacing) || 0) / fs) * 100) : 0;
};
const pctText = (p: number) => (p === 0 ? '0' : `${p}%`.replace('-', '−'));
const pct = (t: TokenTextStyle) => pctText(pctNum(t));
const metrics = (t: TokenTextStyle) => `${px(t.fontSize)} / ${px(t.lineHeight)} · ${pct(t)}`;
const familyOf = (t: TokenTextStyle) => (familyByToken.get(t.bound.fontFamily) ?? UI)?.label ?? '';
const style = (name: string) => tokens.textStyles.find((t) => t.name === name);
/** The first of these styles that exists. */
const pick = (...names: string[]) => names.map(style).find(Boolean);
const firstOfRole = (role: string) => tokens.textStyles.find((t) => parts(t)[1] === role);
const weightName = (t: TokenTextStyle) => parts(t)[3];
const ratio = (t: TokenTextStyle) => Math.round((parseFloat(t.lineHeight) / parseFloat(t.fontSize)) * 100) / 100;

const BODY = pick('type/body/md/regular') ?? firstOfRole('body') ?? tokens.textStyles[0];
const BASE = BODY ? px(BODY.fontSize) : 16;
const typo = tokens.variables.filter((v) => v.collection === 'Typography').map((v) => v.name);

/** Plain-language summary of letter spacing per role, computed from the text styles. */
function trackingSummary() {
  const out: string[] = [];
  let zero = false;
  for (const { role, rows } of scale) {
    const vals = rows.map((r) => ({ size: r.size, p: pctNum(r.styles[0]) }));
    const nz = vals.filter((v) => v.p !== 0);
    if (nz.length < vals.length) zero = true;
    if (!nz.length) continue;
    const same = nz.every((v) => v.p === nz[0].p);
    const tighten = nz[0].p < 0;
    const title = info(role).title.toLowerCase();
    if (same && nz.length === vals.length) out.push(`${title} text ${tighten ? 'tightens' : 'opens up'} by ${pctText(nz[0].p)}`);
    else if (same && vals.slice(0, nz.length).every((v) => v.p !== 0)) out.push(`${title}s from ${role}/${nz[nz.length - 1].size} up ${tighten ? 'tighten' : 'open up'} by ${pctText(nz[0].p)}`);
    else out.push(`${title} styles use ${list(nz.map((v) => `${pctText(v.p)} at ${role}/${v.size}`))}`);
  }
  if (!out.length) return 'Every style keeps the typeface’s default spacing (0).';
  return `${cap(list(out))}.${zero ? ' Everything else stays at 0.' : ''}`;
}

/** Plain-language line-height ratios per role. */
function lineHeightSummary() {
  const out = scale.map(({ role, rows }) => {
    const rs = rows.map((r) => ratio(r.styles[0]));
    const lo = Math.min(...rs);
    const hi = Math.max(...rs);
    return `${info(role).title.toLowerCase()} ${lo === hi ? `${lo}` : `${lo}–${hi}`} ×`;
  });
  return out.length ? `${cap(list(out))} the font size` : '';
}
const EVEN_LINE_HEIGHTS = tokens.textStyles.length > 0 && tokens.textStyles.every((t) => Math.round(parseFloat(t.lineHeight)) % 2 === 0);

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
  const items = Array.isArray(children) ? children : [children];
  return (
    <span className={cn('type-code-sm-regular min-w-0 text-text-tertiary', className)}>
      {items.map((c, i) => (
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
  const sizeVar = has('font/size/body-md') ? 'font/size/body-md' : typo.find((n) => n.startsWith('font/size/'));
  const weightVar = has('font/weight/regular') ? 'font/weight/regular' : typo.find((n) => n.startsWith('font/weight/'));
  const boxes: [string, string, ReactNode][] = [
    ['1 · Variables', 'The raw values: families, weights, sizes, line heights and letter spacing.', <Code key="v">{[sizeVar, weightVar].filter(Boolean).join(' · ')}</Code>],
    ['2 · Text styles', 'Each style combines the variables for one role, size and weight.', BODY ? <Code key="s">{BODY.name}</Code> : null],
    ['3 · Components', 'Components apply a text style instead of setting size, line height or weight by hand.', <span key="c" className={cn(BODY?.className, 'text-text-primary')}>Text field value</span>],
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

const rolesBoundTo = (f: Family) =>
  ROLES.filter((r) => tokens.textStyles.some((t) => parts(t)[1] === r && (familyByToken.get(t.bound.fontFamily) ?? UI)?.stack === f.stack)).map((r) => info(r).title.toLowerCase());
function familyUse(f: Family) {
  const roles = rolesBoundTo(f);
  if (!roles.length) return 'No text style uses this family yet.';
  if (f.key === 'mono') return `Used for the ${list(roles)} styles: code, IDs, keyboard keys and tabular figures in logs and tables.`;
  if (f.key === 'ui') return `Used for every interface role in the ${list(roles)} styles, including labels and controls.`;
  return `Used for the ${list(roles)} styles.`;
}

function TypefaceCard({ family }: { family: Family }) {
  const face: CSSProperties = { fontFamily: `var(${family.css})` };
  /* Monospace glyphs run wider, so the mono card sets its sample lines in the code style. */
  const sample = (family.key === 'mono' ? pick('type/code/md/regular') : undefined) ?? BODY;
  return (
    <div className="flex min-w-0 flex-col gap-lg rounded-surface border border-border-subtle bg-surface-base p-xl md:p-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-sm">
        <h3 className="type-heading-sm-semibold text-text-primary">{family.label}</h3>
        <Code>{family.token}</Code>
      </div>
      <span aria-hidden className="text-text-primary" style={{ ...face, fontSize: 'var(--font-size-display-lg, 3.75rem)', lineHeight: 1.2, fontWeight: 'var(--font-weight-semibold, 600)' as CSSProperties['fontWeight'] }}>
        Aa
      </span>
      <div className={cn('flex flex-col gap-xxs break-all text-text-secondary', sample?.className)} style={face}>
        <span>ABCDEFGHIJKLMNOPQRSTUVWXYZ</span>
        <span>abcdefghijklmnopqrstuvwxyz</span>
        <span>0123456789</span>
        <span>{'! ? & @ # % ( ) [ ] { } " \' , . : ; – —'}</span>
      </div>
      <p className="type-body-sm-regular text-text-secondary">{familyUse(family)}</p>
      <p className="type-body-xs-regular text-text-tertiary">Set by {family.token}. Change its value and every style that uses it follows.</p>
    </div>
  );
}

function TypeScale() {
  return (
    <div className="flex flex-col gap-3xl">
      {scale.map(({ role, rows }) => (
        <div key={role} className="flex min-w-0 flex-col gap-md">
          <div className="flex flex-col gap-xxs">
            <h3 className="type-heading-xs-semibold text-text-primary">{info(role).title}</h3>
            <p className="type-body-sm-regular max-w-(--size-measure-reading) text-text-secondary">{info(role).use}</p>
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
                      <span className={cn(t.className, 'text-text-primary')}>{info(role).sample}</span>
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

const SENTENCE = 'Changes save in the background while you work. Large uploads continue in parts, so a dropped connection never restarts the transfer.';
const INSTALL = `npm install ${config.packageName}`;

type Line = { level: string; style: string; render: () => ReactNode };
const textLine = (level: string, t: TokenTextStyle | undefined, text: string, color: string): Line | null =>
  t ? { level, style: t.name, render: () => <span className={cn(t.className, color)}>{text}</span> } : null;
const CODE_SM = pick('type/code/sm/regular') ?? firstOfRole('code');
const HIERARCHY: Line[] = [
  textLine('Display', pick('type/display/sm/semibold'), 'Your work, all in one place', 'text-text-primary'),
  textLine('Heading', pick('type/heading/md/semibold'), 'Shared folders and team access', 'text-text-primary'),
  textLine('Body', BODY, 'Changes save in the background while you work, and large uploads continue in parts, so a dropped connection never restarts the transfer.', 'text-text-secondary'),
  {
    level: 'Labels and controls',
    style: 'type/body/sm/semibold · type/body/xs/medium',
    render: () => (
      <span className="flex flex-wrap items-center gap-md">
        <Button size="sm" label="Invite people" />
        <Badge size="sm" tone="success" label="Saved" />
      </span>
    ),
  },
  textLine('Supporting', pick('type/body/sm/regular'), 'Last updated 2 minutes ago · 14 people', 'text-text-tertiary'),
  CODE_SM ? { level: 'Code', style: CODE_SM.name, render: () => <span className={cn(CODE_SM.className, 'break-all rounded-xs bg-surface-sunken px-sm py-xxs text-text-primary')}>{INSTALL}</span> } : null,
].filter((l): l is Line => !!l);

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
  const jobs: Record<string, string> = { ui: FAMILIES.some((f) => f.key === 'display') ? 'the rest of the interface' : 'the interface', display: 'display and headline text', mono: 'code and data' };
  const families = FAMILIES.length <= 1 ? `One family, ${UI_FAMILY}, sets every interface role.` : `${list(FAMILIES.map((f) => `${f.label} sets ${jobs[f.key] ?? `${f.key} text`}`))}.`;
  // BRAND: a real build may add one sentence on the typeface's character and why it was chosen, from the Figma Guidelines frame.
  const intro = `${families} Every text style is built from these families, so changing a family variable restyles every screen at once.`;
  return (
    <div className="flex flex-col gap-6xl">
      <Block title="How typography works" intro={intro}>
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
              <strong className="font-semibold text-text-primary">Write for reading.</strong> Body text is {BASE}, stays within the reading measure and has generous line height.
            </>,
          ]}
        />
      </Block>

      {FAMILIES.length > 0 && (
        <Block title="Typefaces" intro={`The product uses ${words(FAMILIES.length)} ${FAMILIES.length === 1 ? 'typeface' : 'typefaces'}. Each card is set in the typeface it describes.`}>
          <div className="grid gap-xl lg:grid-cols-2">
            {FAMILIES.map((f) => (
              <TypefaceCard key={f.token} family={f} />
            ))}
          </div>
        </Block>
      )}

      <Block title="Type scale" intro="Styles are grouped by role and run from largest to smallest. Each row shows a sample in every weight that role supports, with its size / line height · letter spacing.">
        <TypeScale />
      </Block>

      <Block title="Hierarchy in use" intro="A page header and its content, labeled with the style each line uses. Cover the labels and the levels still read clearly.">
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

const WEIGHTS = typo.filter((n) => n.startsWith('font/weight/'));
const GROUPED: [string, string, string[]][] = [
  ['Family', 'The typefaces, one for each job.', typo.filter((n) => n.startsWith('font/family/'))],
  ['Weight', `The ${words(WEIGHTS.length)} weights used across the scale.`, WEIGHTS],
  ['Size', 'One size per role and step. Each one feeds the text style with the same name.', typo.filter((n) => n.startsWith('font/size/') && n !== 'font/size/input-min')],
  ['Line height', 'One line height per role and step.', typo.filter((n) => n.startsWith('font/line-height/'))],
  ['Letter spacing', trackingSummary(), typo.filter((n) => n.startsWith('font/letter-spacing/'))],
  ['Input minimum', 'The smallest size for text typed into a field on mobile, so browsers don’t zoom in when the field is focused.', typo.filter((n) => n === 'font/size/input-min')],
];
const OTHER = typo.filter((n) => !GROUPED.some(([, , names]) => names.includes(n)));
const TOKEN_GROUPS = [...GROUPED, ['Other', 'Typography variables outside the standard groups.', OTHER] as [string, string, string[]]].filter(([, , names]) => names.length > 0);

function TokensTab() {
  return (
    <div className="flex flex-col gap-5xl">
      <P>
        The <InlineCode>Typography</InlineCode> collection has a single mode. Text styles use these variables, and components apply each style as a utility class with the same name: <InlineCode>type/body/md/regular</InlineCode> → <InlineCode>type-body-md-regular</InlineCode>.
      </P>
      {tokens.textStyles.length > 0 && (
        <Block title="Text styles" intro="Look up any style’s utility class and its final size, weight and spacing.">
          <StyleTable />
        </Block>
      )}
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

type ReadingLine = { level: string; t: TokenTextStyle; text: string; color: string };
const READING: ReadingLine[] = (
  [
    ['Display', pick('type/display/md/semibold', 'type/display/sm/semibold'), 'Your work, all in one place', 'text-text-primary'],
    ['Heading', pick('type/heading/lg/semibold', 'type/heading/md/semibold'), 'Shared folders and team access', 'text-text-primary'],
    ['Body', BODY, SENTENCE, 'text-text-secondary'],
    ['Labels and controls', pick('type/body/sm/medium'), 'Folder name · Visibility · Members', 'text-text-secondary'],
    ['Supporting', pick('type/body/xs/regular', 'type/body/sm/regular'), 'Last updated 2 minutes ago. Versions are kept for 30 days.', 'text-text-tertiary'],
  ] as [string, TokenTextStyle | undefined, string, string][]
).flatMap(([level, t, text, color]) => (t ? [{ level, t, text, color }] : []));

function ReadingSpecimen() {
  return (
    <Panel>
      <div className="flex flex-col divide-y divide-border-subtle rounded-surface bg-surface-base">
        {READING.map(({ level, t, text, color }) => (
          <div key={level} className="flex min-w-0 flex-col gap-sm p-lg md:p-xl">
            <span className="flex flex-wrap items-baseline gap-x-md">
              <span className="type-body-xs-semibold text-text-brand">{level}</span>
              <Code>{t.name}</Code>
              <span className="type-body-xs-regular text-text-tertiary">
                {metrics(t)} · {t.fontWeight}
              </span>
            </span>
            <span className={cn(t.className, color, 'max-w-(--size-measure-reading) break-words')}>{text}</span>
          </div>
        ))}
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

/* Without display styles, the largest heading stands in for "big text" in the comparisons. */
const BIG = pick('type/display/sm/semibold', 'type/heading/xl/semibold', 'type/heading/xl/bold');
const BIG_BOLD = pick('type/display/sm/bold', 'type/heading/xl/bold') ?? BIG;
const BIG_LABEL = BIG && parts(BIG)[1] === 'display' ? 'Display' : 'Large heading';

function DisplayVsBody({ big, body }: { big: TokenTextStyle; body: TokenTextStyle }) {
  const para = 'Large uploads continue in parts, so a dropped connection never restarts the whole transfer.';
  return (
    <ThreeUp>
      <Cell title={`1 · ${BIG_LABEL} as a heading`} note={`${big.name}: one short, high-emphasis line.`}>
        <span className={cn(big.className, 'text-text-primary')}>Your work, all in one place</span>
      </Cell>
      <Cell title={`2 · ${BIG_LABEL} misused as body`} bad note="Too big and too tight to read, and it breaks the rhythm of the UI.">
        <span className={cn(big.className, 'break-words text-text-primary')}>{para}</span>
      </Cell>
      <Cell title="3 · Body style" selected note={`${body.name}: the right style for running text.`}>
        <span className={cn(body.className, 'text-text-secondary')}>{para}</span>
      </Cell>
    </ThreeUp>
  );
}

type BaseOption = { size: string; body: TokenTextStyle; label: TokenTextStyle };
const BASE_OPTIONS: BaseOption[] = ['sm', 'md', 'lg'].flatMap((size) => {
  const body = pick(`type/body/${size}/regular`);
  const label = pick(`type/body/${size}/medium`, `type/body/${size}/regular`);
  return body && label ? [{ size, body, label }] : [];
});
const sizeOf = (size: string) => BASE_OPTIONS.find((o) => o.size === size)?.body;

function BaseSize() {
  return (
    <ThreeUp>
      {BASE_OPTIONS.map(({ size, body, label }) => (
        <Cell key={size} title={`${px(body.fontSize)} · type/body/${size}`} selected={size === 'md'}>
          <div className="flex flex-col gap-md">
            <span className={cn(body.className, 'text-text-secondary')}>Choose which folders appear in the sidebar and which stay in the archive.</span>
            <span className={cn(label.className, 'text-text-primary')}>Visibility</span>
          </div>
        </Cell>
      ))}
    </ThreeUp>
  );
}

const even = (n: number) => Math.round(n / 2) * 2;
const fmtRatio = (lh: number, fs: number) => String(Math.round((lh / fs) * 100) / 100);
function LineHeights({ body }: { body: TokenTextStyle }) {
  const fs = px(body.fontSize);
  const opts: [string, number, boolean][] = [
    ['Too tight', even(fs * 1.125), false],
    ['Selected', px(body.lineHeight), true],
    ['Too loose', fs * 2, false],
  ];
  return (
    <ThreeUp>
      {opts.map(([t, l, sel]) => (
        <Cell key={t} title={t} selected={sel} note={`${fs} / ${l} · ${fmtRatio(l, fs)}`}>
          <p className={cn(body.className, 'text-text-secondary')} style={sel ? undefined : { lineHeight: `${l}px` }}>
            {SENTENCE}
          </p>
        </Cell>
      ))}
    </ThreeUp>
  );
}

/* The tracking demo uses a mid-size display style, or the largest style with tightened spacing. */
const TRACKED = pick('type/display/md/semibold') ?? [...tokens.textStyles].filter((t) => pctNum(t) !== 0).sort((a, b) => parseFloat(b.fontSize) - parseFloat(a.fontSize))[0] ?? BIG;
function Tracking({ t }: { t: TokenTextStyle }) {
  const p = pctNum(t);
  const opts: [string, string, string, boolean][] = [
    ...(p === 0 ? [] : ([['Default · 0', 'Loose at this size', '0em', false]] as [string, string, string, boolean][])),
    [`Selected · ${pctText(p)}`, t.bound.letterSpacing ?? t.name, t.letterSpacing, true],
    [`Too tight · ${pctText(p === 0 ? -6 : p * 3)}`, 'Letters start to touch', p === 0 ? '-0.06em' : `calc(${t.letterSpacing} * 3)`, false],
  ];
  return (
    <ThreeUp>
      {opts.map(([title, note, ls, sel]) => (
        <Cell key={title} title={title} selected={sel} note={note}>
          <span className={cn(t.className, 'whitespace-nowrap text-text-primary')} style={sel ? undefined : { letterSpacing: ls }}>
            Travel
          </span>
        </Cell>
      ))}
    </ThreeUp>
  );
}

const WEIGHT_SAMPLE = pick('type/heading/lg/semibold', 'type/heading/md/semibold') ?? BODY;
function WeightCoverage() {
  return (
    <Panel>
      <div className="flex flex-col divide-y divide-border-subtle rounded-surface bg-surface-base">
        {WEIGHTS.map((w) => {
          const used = [...new Set(tokens.textStyles.filter((t) => t.bound.fontWeight === w).map((t) => parts(t)[1]))];
          return (
            <div key={w} className="grid min-w-0 gap-sm p-lg md:grid-cols-[minmax(0,1fr)_14rem] md:items-center md:p-xl">
              <span className={cn(WEIGHT_SAMPLE?.className, 'text-text-primary')} style={{ fontWeight: `var(${byName.get(w)!.css})` as CSSProperties['fontWeight'] }}>
                Project settings
              </span>
              <span className="flex flex-col">
                <Code className="text-text-secondary">
                  {w} · {value(w)}
                </Code>
                <span className="type-body-xs-regular text-text-tertiary">{used.length ? `Used by ${used.join(', ')}` : 'No text style uses it yet'}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** A small docs page that shows each family doing its job. Only shown when there is more than one family. */
function FamilyRoles() {
  const rows: [TokenTextStyle | undefined, string][] = [
    [pick('type/display/sm/semibold'), 'Your work, all in one place'],
    [pick('type/heading/lg/semibold', 'type/heading/md/semibold'), 'Install the package'],
    [BODY, 'Add the package to your project, then import the styles once at the app root. Every component picks up the tokens from there.'],
    [pick('type/code/md/regular') ?? firstOfRole('code'), INSTALL],
  ];
  /* The display row appears only when display text has a family of its own. */
  const shown = rows.filter(([t], i) => t && (i > 0 || familyOf(t) !== UI_FAMILY)) as [TokenTextStyle, string][];
  return (
    <Panel>
      <div className="flex flex-col gap-lg rounded-surface bg-surface-base p-xl md:p-3xl">
        {shown.map(([t, text]) => (
          <div key={t.name} className="flex flex-col gap-xs">
            <Code>
              {familyOf(t)} · {t.name}
            </Code>
            {parts(t)[1] === 'code' ? (
              <pre className={cn(t.className, 'm-0 whitespace-pre-wrap break-words rounded-control bg-surface-sunken p-lg text-text-primary')}>{text}</pre>
            ) : (
              <p className={cn(t.className, 'max-w-(--size-measure-reading)', parts(t)[1] === 'body' ? 'text-text-secondary' : 'text-text-primary')}>{text}</p>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

const SOURCE_VAR = 'font/size/body-md';
function SourceChange() {
  const before = px(value(SOURCE_VAR));
  const after = before - 1;
  const deps = tokens.textStyles.filter((t) => t.bound.fontSize === SOURCE_VAR).map((t) => t.name);
  const sample = (
    <div className="flex flex-col gap-md">
      <TextField size="md" label="Folder name" defaultValue="Design reviews" />
      <div className={cn(BODY?.className, 'flex justify-between gap-md rounded-control border border-border-subtle px-lg py-sm text-text-primary')}>
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
              <span className="type-body-sm-medium text-text-primary">{info(r).title}</span>
              <span className="type-body-xs-regular text-text-tertiary">{tokens.textStyles.filter((t) => parts(t)[1] === r).length} styles</span>
            </span>
          ))}
        </li>
        <li className="flex min-w-0 flex-col gap-sm rounded-control bg-surface-base p-lg">
          <span className="type-body-xs-semibold text-text-primary">2 · Typography collection</span>
          <Code className="text-text-secondary">{SOURCE_VAR}</Code>
          <span className="flex items-center gap-sm">
            <span className="type-code-sm-medium text-text-primary line-through">{before}</span>
            <span aria-hidden className="text-text-tertiary">→</span>
            <span className="type-code-sm-medium text-text-brand">{after}</span>
            <span className="sr-only">
              changed from {before} to {after} (preview)
            </span>
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
          <Tag>Before · {before}</Tag>
          {sample}
        </div>
        <div className="flex flex-col gap-md" style={{ [byName.get(SOURCE_VAR)!.css]: `${after}px` } as CSSProperties}>
          <Tag>After · {after} (preview)</Tag>
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
  const hasDisplay = ROLES.includes('display');
  const sm = sizeOf('sm');
  const lg = sizeOf('lg');
  const lineHeights = lineHeightSummary();
  const familyJobs: Record<string, string> = { ui: 'all UI and content', display: 'display and headline text', mono: 'code, IDs and numbers in docs' };
  const sizeAdvice = [sm ? `Use ${px(sm.fontSize)} (type/body/sm) for dense tables and secondary UI` : '', lg ? `${sm ? '' : 'Use '}${px(lg.fontSize)} or larger for long reads like release notes` : ''].filter(Boolean);
  const items: Guide[] = [
    {
      title: 'Build a clear hierarchy',
      body: (
        <P>
          {hasDisplay ? 'Text has five levels: display for hero text, headings, body, labels and controls, and supporting text.' : 'Text has four levels: headings, body, labels and controls, and supporting text.'} Make each level clearly different in size, weight or color, so people can tell them apart without the labels. A difference that’s too slight disappears.
        </P>
      ),
      visual: READING.length ? <ReadingSpecimen /> : undefined,
      caption: 'Each level in real product copy, with its style name, size / line height · letter spacing and weight.',
    },
    {
      title: 'Use display text sparingly',
      body: <P>Use display styles for large headlines and other high-emphasis moments. Body styles carry everything else: paragraphs, labels, navigation, buttons and menus. In dense UI, build hierarchy with weight, color and spacing instead of display sizes.</P>,
      visual: BIG && BODY ? <DisplayVsBody big={BIG} body={BODY} /> : undefined,
      caption: `The same content set three ways. ${BIG_LABEL} text is tightly set for short lines, so a whole paragraph of it is hard to read.`,
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
        caption: `Don’t reach for a ${BIG_LABEL.toLowerCase()} size to make a card title stand out.`,
        render: () => (
          <div className="flex flex-col gap-xxs rounded-surface border border-border-subtle bg-surface-base p-lg">
            <span className={cn(BIG_BOLD?.className, 'text-text-primary')}>Storage</span>
            <span className="type-body-sm-regular text-text-secondary">68 GB of 100 GB used</span>
          </div>
        ),
      },
    },
    {
      title: 'Base font size',
      body: (
        <>
          <P>
            Body text starts at {BASE} ({BODY ? BODY.name.split('/').slice(0, 3).join('/') : 'type/body/md'}), which reads comfortably on laptops and phones at a normal distance.
            {sizeAdvice.length ? ` ${sizeAdvice.join(', and ')}.` : ''}
          </P>
          {has('font/size/input-min') && <P>On mobile, text typed into a field is at least {px(value('font/size/input-min'))} (font/size/input-min), so the browser doesn’t zoom in when the field is focused.</P>}
        </>
      ),
      visual: BASE_OPTIONS.length ? <BaseSize /> : undefined,
      caption: `The same paragraph and control label at ${list(BASE_OPTIONS.map((o) => String(px(o.body.fontSize))))}. This system uses ${BASE} as the base.`,
    },
    {
      title: 'Line height',
      body: (
        <P>
          Each role gets its own line height. {lineHeights ? `${lineHeights}. ` : ''}
          {EVEN_LINE_HEIGHTS ? 'Every value lands on an even pixel, and you’ll find the exact numbers in the type scale.' : 'You’ll find the exact numbers in the type scale.'}
        </P>
      ),
      visual: BODY ? <LineHeights body={BODY} /> : undefined,
      caption: `The same paragraph at ${BASE} with three line heights. Tight lines crowd the ascenders, and loose lines break the paragraph into stripes.`,
    },
    {
      title: 'Letter spacing',
      body: <P>Large text looks loose at the typeface’s default spacing, so it usually needs tighter tracking, while small text keeps the default. {trackingSummary()} In Figma, each size has its own pixel value in font/letter-spacing/*.</P>,
      visual: TRACKED ? <Tracking t={TRACKED} /> : undefined,
      caption: 'The same large heading at different letter spacings.',
    },
    {
      title: 'Choosing the typeface and its weights',
      body: (
        <>
          {/* BRAND: replace with why this typeface was chosen (license, script coverage, character), from the Figma Guidelines frame. */}
          <P>{UI_FAMILY} sets every interface role. Before you commit to a typeface, check that it covers the scripts and languages you need, every weight the scale uses, tabular figures for tables and readable text at small sizes.</P>
          <P>Only use weights the font actually has, because faked weights look blurry or uneven. If a role needs a missing weight, map it to the nearest one and write that mapping down.</P>
        </>
      ),
      visual: WEIGHTS.length ? <WeightCoverage /> : undefined,
      // BRAND: if the brand font lacks a weight, name the fallback mapping here (e.g. "semibold maps to bold, the font has no 600").
      caption: `Each weight is set in ${UI_FAMILY} and labeled with the roles that use it.`,
    },
    {
      title: 'Keep the number of families small',
      body: (
        <P>
          {FAMILIES.length <= 1
            ? `This system uses one family, ${UI_FAMILY}, for everything. Add a second only for a clear reason: display contrast, code, or a script the main family doesn’t cover.`
            : `This system uses ${words(FAMILIES.length)} families, each with one job: ${list(FAMILIES.map((f) => `${f.label} for ${familyJobs[f.key] ?? `${f.key} text`}`))}. Avoid adding others.`}{' '}
          Fewer families load faster and look more consistent together.
        </P>
      ),
      visual: FAMILIES.length > 1 ? <FamilyRoles /> : undefined,
      caption: 'Each family keeps to its job, even on the same page.',
    },
    {
      title: 'Change typography from the source',
      body: <P>Changes flow outward, from font/* variables to type/* text styles to components. To change typography, edit the variable rather than a text layer or a component, so every screen stays in step.</P>,
      visual: has(SOURCE_VAR) ? <SourceChange /> : undefined,
      caption: has(SOURCE_VAR) ? `Changing ${SOURCE_VAR} updates every style that uses it, and with them every text field value and table row. The ${px(value(SOURCE_VAR)) - 1} is only a preview, not a real value in this system.` : undefined,
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
      do: {
        caption: 'Tabular figures, aligned right.',
        render: () => (
          <div className="w-full max-w-[20rem] rounded-control bg-surface-base p-lg">
            <FileTable tabular />
          </div>
        ),
      },
      dont: {
        caption: 'Don’t leave proportional, left-aligned numbers in a column.',
        render: () => (
          <div className="w-full max-w-[20rem] rounded-control bg-surface-base p-lg">
            <FileTable tabular={false} />
          </div>
        ),
      },
    },
    {
      title: 'Keep lines readable',
      body: <P>Cap running text at the reading measure (size/measure/reading), about 65–80 characters per line. On wider lines, the eye loses its place moving back to the start of the next one. See 1.3 Space &amp; layout for more.</P>,
      visual: (
        <Panel>
          <div className="flex flex-col gap-xl">
            <div className="flex flex-col gap-sm">
              <Tag selected>At the reading measure</Tag>
              <p className={cn(BODY?.className, 'max-w-(--size-measure-reading) rounded-control bg-surface-base p-lg text-text-secondary')}>
                {SENTENCE} {SENTENCE}
              </p>
            </div>
            <div className="flex flex-col gap-sm">
              <Tag>Full container width</Tag>
              <p className={cn(BODY?.className, 'rounded-control bg-surface-base p-lg text-text-secondary')}>
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
