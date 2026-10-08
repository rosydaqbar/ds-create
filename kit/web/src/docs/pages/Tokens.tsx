import { Fragment, useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { tokens } from '@/tokens/tokens.gen';
import type { TokenVariable } from '@/tokens/types';
import { Icon } from '@/icons';
import { Button, Progress, Select, Switch, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../DocPage';
import { appTokenNames, breakable, Bullets, Caption, DoDont, H3, InlineCode, P, productHasWeb, Swatch, TokenTable } from '../blocks';
import { siteHasDark, supportedModes, unsupportedModes } from '../modes';
import { componentDocs, slugOf, staticPages } from '../registry';
import { figmaNodeFor } from '../meta';
import { brandCopy } from '@/brand/copy';

/* ---------- data ---------- */
const byName = new Map(tokens.variables.map((t) => [t.name, t]));
const countOf = (c: string) => tokens.variables.filter((t) => t.collection === c).length;
const firstValue = (name: string) => {
  const t = byName.get(name);
  return t ? (t.modes.Light ?? t.modes.Standard ?? Object.values(t.modes)[0]) : undefined;
};
/** Follows a variable's aliases down to its raw value: `[semantic, …, primitive]`. */
function chainOf(name: string, mode = 'Light'): string[] {
  const out: string[] = [];
  let cur: string | null | undefined = name;
  while (cur && byName.has(cur) && !out.includes(cur)) {
    out.push(cur);
    const t: TokenVariable = byName.get(cur)!;
    cur = (t.modes[mode] ?? Object.values(t.modes)[0])?.alias;
  }
  return out;
}
const primitiveOf = (name: string, mode = 'Light') => chainOf(name, mode).at(-1) ?? name;
const exists = (name: string) => byName.has(name) || tokens.textStyles.some((s) => s.name === name) || tokens.effectStyles.some((s) => s.name === name);
/** "a, b and c" (no serial comma, as in the rest of the docs). */
const joinList = (items: string[]) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);
const pageTo = (id: string) => {
  const p = staticPages.find((s) => s.id === id);
  if (p) return `/${p.group}/${slugOf(p.id, p.name)}`;
  const d = componentDocs.find((c) => c.id === id);
  return d ? `/${d.level}/${slugOf(d.id, d.name)}` : '/';
};

const collectionInfo: Record<string, { holds: string; shownOn: ReactNode; samples: string[] }> = {
  Primitives: { holds: 'The raw palette/* colors and scale/* numbers, hidden from pickers.', shownOn: 'this page, under Primitive palette', samples: [...new Set([primitiveOf('color/fill/brand/solid'), primitiveOf('color/text/primary'), primitiveOf('space/xl')])].filter((n) => /^(palette|scale)\//.test(n)) },
  Color: { holds: 'Semantic color roles for text, icons, borders, surfaces and fills.', shownOn: <TextLinkTo id="1.1" label="1.1 Color" />, samples: ['color/text/primary', 'color/surface/base', 'color/fill/brand/solid'] },
  Typography: { holds: 'Families, weights, sizes, line heights and letter spacing.', shownOn: <TextLinkTo id="1.2" label="1.2 Typography" />, samples: ['font/family/ui', 'font/size/body-md', 'font/weight/semibold'] },
  Space: { holds: 'The spacing scale for gaps and padding.', shownOn: <TextLinkTo id="1.3" label="1.3 Space & layout" />, samples: ['space/sm', 'space/md', 'space/xl'] },
  Size: { holds: 'Control, icon, avatar, indicator, track, width, container, measure and touch sizes.', shownOn: <TextLinkTo id="1.3" label="1.3 Space & layout" />, samples: ['size/control/md', 'size/icon/md', 'size/touch-min'] },
  Shape: { holds: 'Radius roles and border widths.', shownOn: <TextLinkTo id="1.4" label="1.4 Shape" />, samples: ['radius/control', 'radius/surface', 'border/width/default'] },
  Motion: { holds: 'Durations, easings and delays.', shownOn: <TextLinkTo id="1.6" label="1.6 Motion" />, samples: ['motion/duration/fast', 'motion/duration/base', 'motion/easing/enter'] },
  Components: { holds: 'Component tokens, used only where no semantic role fits.', shownOn: 'each component’s Anatomy tab', samples: ['button/padding-x/md', 'switch/thumb/fill', 'avatar/placeholder/fill'] },
  Documentation: { holds: 'Measures and roles for the Figma documentation kit.', shownOn: '9.1 Doc kit (Figma only)', samples: ['doc/space/block', 'doc/measure/reading', 'doc/surface/stage'] },
};

const MAP = (
  [
  ['color/text/primary', '--color-text-primary', 'text-text-primary'],
  ['color/icon/secondary', '--color-icon-secondary', 'text-icon-secondary'],
  ['color/border/default', '--color-border-default', 'border-border-default'],
  ['color/surface/raised', '--color-surface-raised', 'bg-surface-raised'],
  ['color/fill/brand/solid/hover', '--color-fill-brand-solid-hover', 'bg-fill-brand-solid-hover'],
  ['space/md', '--space-md', 'p-md · gap-md · m-md'],
  ['size/control/md', '--size-control-md', 'h-(--size-control-md)'],
  ['radius/control', '--radius-control', 'rounded-control'],
  ['font/family/ui', '--font-family-ui', 'font-ui'],
  ['type/body/md/regular', '(text style)', 'type-body-md-regular'],
  ['font/size/body-md', '--font-size-body-md', 'text-body-md'],
  ['elevation/raised', '--elevation-raised', 'shadow-raised'],
  ['focus/default', '--focus-default', 'shadow-focus-default'],
  ['motion/duration/base', '--motion-duration-base', 'duration-(--motion-duration-base)'],
  ['motion/easing/enter', '--motion-easing-enter', 'ease-enter'],
  ['button/padding-x/md', '--button-padding-x-md', 'px-(--button-padding-x-md)'],
  ] as const
).filter(([n]) => exists(n));

const PATTERNS = [
  ['Primitives', 'palette/{family}/{step} · scale/{dimension}/{value}', 'palette/neutral/900, scale/radius/8'],
  ['Color', 'color/{group}/{role}[/{emphasis}][/{state}]', 'color/text/secondary/hover, color/border/danger/subtle'],
  ['Typography', 'font/{property}/{role}', 'font/family/ui, font/size/body-md'],
  ['Text styles', 'type/{role}/{size}/{weight}', 'type/body/md/regular'],
  ['Space', 'space/{step}', 'space/md'],
  ['Size', 'size/{group}/{step} · size/touch-min', 'size/control/md'],
  ['Shape', 'radius/{role} · border/width/{role}', 'radius/control, border/width/focus'],
  ['Effect styles', 'elevation/{level} · focus/{tone} · blur/backdrop/{step}', 'elevation/overlay, focus/danger'],
  ['Grid styles', 'grid/{breakpoint}', 'grid/desktop'],
  ['Motion', 'motion/{duration | easing | delay}/{role}', 'motion/duration/base'],
  ['Components', '{component}[/{part}]/{property}[/{size | state}]', 'button/padding-x/md, switch/thumb/fill'],
  ['Documentation', 'doc/{group}/{role}', 'doc/space/block'],
];

const MODE_ROLES = ['color/text/primary', 'color/surface/base', 'color/border/subtle', 'color/fill/brand/solid', 'color/fill/danger/subtle'].filter((n) => byName.has(n));
const modeCollections = tokens.collections.filter((c) => c.modes.length > 1);
const singleDensity = tokens.collections.filter((c) => c.name === 'Space' || c.name === 'Size').every((c) => c.modes.length <= 1);
const gridNames = tokens.gridStyles.map((g) => g.name);
const hasCategory = tokens.variables.some((t) => t.name.startsWith('color/category/'));

/** Example chains for the three-layer diagram, found in the tokens so they hold for any brand. */
const brandChain = chainOf('color/fill/brand/solid').reverse();
/** A component token that points to a semantic role, which points to a primitive. */
function componentChain(prefer: string[], test: (t: TokenVariable) => boolean) {
  const ok = (t: TokenVariable | undefined): t is TokenVariable => !!t && t.collection === 'Components' && test(t) && chainOf(t.name).length >= 3;
  const found = prefer.map((n) => byName.get(n)).find(ok) ?? tokens.variables.find(ok);
  return found ? chainOf(found.name).slice(0, 3).reverse() : null;
}
const paddingChain = componentChain(['button/padding-x/lg', 'button/padding-x/md', 'button/padding-x/sm', 'button/padding-x/xl'], (t) => t.type === 'FLOAT');
const SIZE_WORD: Record<string, string> = { xs: 'extra-small', sm: 'small', md: 'medium', lg: 'large', xl: 'extra-large' };
const withArticle = (w: string) => `${/^[aeiou]/i.test(w) ? 'An' : 'A'} ${w}`;
const colorChain = componentChain(['switch/thumb/fill'], (t) => t.type === 'COLOR');
const families = [...new Set(tokens.variables.filter((t) => t.name.startsWith('palette/')).map((t) => t.name.split('/')[1]))];
const scales = [...new Set(tokens.variables.filter((t) => t.name.startsWith('scale/')).map((t) => t.name.split('/')[1]))];

/* ---------- helpers ---------- */
function TextLinkTo({ id, label }: { id: string; label: string }) {
  return <TextLink to={pageTo(id)}>{label}</TextLink>;
}
function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="rounded-xs font-semibold text-text-brand underline decoration-1 underline-offset-2 outline-none is-hover:text-text-brand-hover is-focus:shadow-focus-default">
      {children}
    </Link>
  );
}
function Topic({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-lg border-b border-border-subtle pb-4xl last:border-b-0 last:pb-0">
      <AnchorHeading>{title}</AnchorHeading>
      {children}
    </section>
  );
}
function Visual({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-surface border border-border-subtle bg-surface-sunken p-xl md:p-3xl ${className}`}>{children}</div>;
}
function TableRegion({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div tabIndex={0} role="region" aria-label={label} className={`min-w-0 overflow-x-auto rounded-surface border border-border-subtle outline-none is-focus:shadow-focus-default ${className}`}>
      {children}
    </div>
  );
}
function Th({ children }: { children: ReactNode }) {
  return <th className="type-body-xs-semibold whitespace-nowrap px-lg py-md text-text-tertiary">{children}</th>;
}
function Td({ children, code, className = '' }: { children: ReactNode; code?: boolean; className?: string }) {
  return <td className={`px-lg py-md align-top ${code ? 'type-code-sm-regular whitespace-nowrap text-text-primary' : 'type-body-sm-regular text-text-secondary'} ${className}`}>{children}</td>;
}
function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'brand' }) {
  return (
    <span
      className={`type-code-sm-regular inline-flex max-w-full items-center gap-sm break-all rounded-indicator border px-md py-xxs ${tone === 'brand' ? 'border-border-brand-subtle bg-fill-brand-subtle text-site-brand-on-tint' : 'border-border-subtle bg-surface-raised text-text-primary'}`}
    >
      {children}
    </span>
  );
}
/** Small preview of a token value: a swatch for colours, the value for everything else. */
function ValueChip({ name, mode }: { name: string; mode?: string }) {
  const t = byName.get(name);
  if (!t) return null;
  const m = mode ? t.modes[mode] : firstValue(name);
  return (
    <span className="type-code-sm-regular inline-flex items-center gap-sm text-text-secondary">
      {t.type === 'COLOR' && <Swatch name={name} mode={mode ?? Object.keys(t.modes)[0]} size={16} />}
      {m?.alias ? m.alias.replace(/^palette\//, '') : t.name.startsWith('font/family/') && m?.value.includes(',') ? `${m.value.split(',')[0].trim()}, …` : m?.value}
    </span>
  );
}

/* ---------- Overview ---------- */
const paletteCharacter = brandCopy.paletteCharacter;

function LayerStep({ layer, name, children }: { layer: string; name?: string; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-sm rounded-surface border border-border-subtle bg-surface-raised p-lg">
      <span className="type-body-xs-semibold text-text-tertiary">{layer}</span>
      {name ? (
        <>
          <span className="type-code-sm-medium text-text-primary [overflow-wrap:anywhere]">{name}</span>
          <ValueChip name={name} />
        </>
      ) : (
        children
      )}
    </div>
  );
}
function Arrow() {
  return <Icon name="arrows/arrow-right" className="shrink-0 self-center text-icon-tertiary" />;
}
function LayerRow({ steps, result, note }: { steps: (string | null)[]; result: ReactNode; note: string }) {
  const labels = ['Primitive', 'Semantic', 'Component'];
  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-stretch gap-sm">
        {steps.map((s, i) => (
          <Fragment key={i}>
            {i > 0 && <Arrow />}
            {s ? (
              <LayerStep layer={labels[i]} name={s} />
            ) : (
              <LayerStep layer={labels[i]}>
                <span className="type-body-xs-regular max-w-[7rem] text-text-tertiary">None needed: the component uses the role directly.</span>
              </LayerStep>
            )}
          </Fragment>
        ))}
        <Arrow />
        <LayerStep layer="In use">
          <div className="flex min-h-10 items-center">{result}</div>
        </LayerStep>
      </div>
      <Caption>{note}</Caption>
    </div>
  );
}

function SegmentAnatomy() {
  const segs = [
    ['color', 'domain'],
    ['fill', 'group'],
    ['brand', 'role'],
    ['solid', 'emphasis'],
    ['hover', 'state'],
  ];
  return (
    <div className="flex flex-wrap items-end gap-xs">
      {segs.map(([s, l], i) => (
        <Fragment key={s}>
          {i > 0 && <span className="type-code-md-regular pb-xl text-text-tertiary">/</span>}
          <div className="flex flex-col items-center gap-xs">
            <span className="type-code-md-medium rounded-sm border border-border-brand-subtle bg-fill-brand-subtle px-md py-xs text-site-brand-on-tint">{s}</span>
            <span className="type-body-xs-medium text-text-tertiary">{l}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function ModeCard() {
  return (
    <div className="flex flex-col gap-md rounded-surface border border-border-subtle bg-surface-base p-xl shadow-raised">
      <span className="type-body-sm-semibold text-text-primary">Seats</span>
      <span className="type-body-sm-regular text-text-secondary">You have used 19 of 20 seats.</span>
      <Progress value={95} aria-label="Seats used" />
      <div className="flex flex-wrap gap-sm">
        <Button size="sm" label="Upgrade" />
        <Button size="sm" emphasis="secondary" label="Manage members" />
      </div>
    </div>
  );
}

/* What the token system is for (specs/guidance/02-tokens.md §2.1): four goals, each with what it means and where this system meets it. */
const goalRole = ['color/fill/brand/solid', 'color/text/brand', 'color/fill/accent/solid'].find((n) => byName.has(n));
const GOALS: { goal: string; means: string; here: string; see: string; to: string }[] = [
  {
    goal: 'Simplicity',
    means: 'One name per concept, and only as many collections as there are domains.',
    here: `${tokens.collections.length} collections (${joinList(tokens.collections.map((c) => c.name))}) share one naming grammar: domain, group, role, then emphasis or state.`,
    see: 'Naming',
    to: '#naming',
  },
  {
    goal: 'Accessibility',
    means: 'Every text and surface pair passes contrast in each supported mode before a component uses it.',
    here: `Pairs are checked in ${joinList(supportedModes)}${unsupportedModes.length ? `; ${joinList(unsupportedModes)} is checked once it has real values` : ''}. Pairs below AA are listed on 1.1 Color with the rule that makes them safe.`,
    see: '1.1 Color',
    to: pageTo('1.1'),
  },
  {
    goal: 'Aesthetics',
    means: 'The brand’s character lives in the primitives and the roles that alias them, never on layers.',
    here: goalRole
      ? `${families.length} palette families sit behind the color roles; ${goalRole} → ${primitiveOf(goalRole)} carries the brand into every component that uses it.`
      : `${families.length} palette families sit behind the color roles.`,
    see: 'Primitive palette',
    to: '#primitive-palette',
  },
  {
    goal: 'Scalability',
    means: 'New modes, brands and components add values without renaming anything.',
    here: unsupportedModes.length
      ? `The ${joinList(unsupportedModes)} column is already in the Color collection, waiting for values; new roles go into the groups that exist.`
      : 'New roles go into the groups that exist, and new modes into the collections that exist.',
    see: 'Modes',
    to: '#modes',
  },
];
/* The connecting paragraph: each goal makes the next one possible. */
const GOALS_LINK = `Because each concept has one name, each role exists once, so each foreground and background pair is checked once, in ${joinList(supportedModes)}. The brand sits in the primitives behind those roles, so restyling never touches a component, and growth only adds values and modes, never renames what exists.`;
function HashOrPageLink({ to, children }: { to: string; children: ReactNode }) {
  const cls = 'rounded-xs font-semibold text-text-brand underline decoration-1 underline-offset-2 outline-none is-hover:text-text-brand-hover is-focus:shadow-focus-default';
  return to.startsWith('#') ? (
    <a href={to} className={cls}>
      {children}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}

function Overview() {
  return (
    <div className="flex max-w-[64rem] flex-col gap-4xl">
      <Topic title="What the token system is for">
        <P>Four goals decide every token. Each one is a concrete rule with a place in this file where you can check it.</P>
        <div className="grid gap-md sm:grid-cols-2">
          {GOALS.map((g) => (
            <div key={g.goal} className="flex flex-col gap-md rounded-surface border border-border-subtle p-xl">
              <H3>{g.goal}</H3>
              <dl className="flex flex-col gap-sm">
                <div className="flex flex-col gap-xxs">
                  <dt className="type-body-xs-semibold text-text-tertiary">What it means</dt>
                  <dd className="type-body-sm-regular text-text-secondary">{g.means}</dd>
                </div>
                <div className="flex flex-col gap-xxs">
                  <dt className="type-body-xs-semibold text-text-tertiary">In this system</dt>
                  <dd className="type-body-sm-regular text-text-secondary">{g.here}</dd>
                </div>
              </dl>
              <span className="type-body-sm-regular mt-auto">
                <HashOrPageLink to={g.to}>See {g.see} →</HashOrPageLink>
              </span>
            </div>
          ))}
        </div>
        <P>{GOALS_LINK}</P>
      </Topic>

      <Topic title="The collections">
        <P>
          Variables live in collections with plain domain names. A collection gets modes only when its values really change
          {modeCollections.length ? `: ${joinList(modeCollections.map((c) => `${c.name} has ${joinList(c.modes)}`))}.` : '.'}
        </P>
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          {tokens.collections.map((c) => {
            const info = collectionInfo[c.name];
            return (
              <div key={c.name} className="flex min-w-0 flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-xl">
                <div className="flex flex-col gap-xxs">
                  <span className="type-heading-xs-semibold text-text-primary">{c.name}</span>
                  <span className="type-body-sm-regular text-text-tertiary">
                    {countOf(c.name)} variables · {c.modes.length > 1 ? c.modes.join(', ') : 'one mode'}
                  </span>
                </div>
                {info && <span className="type-body-sm-regular text-text-secondary">{info.holds}</span>}
                {info && <span className="type-body-xs-semibold text-text-tertiary">Examples</span>}
                {info && (
                  <ul className="flex flex-col gap-xs">
                    {info.samples
                      .filter((s) => byName.has(s))
                      .map((s) => (
                        <li key={s} className="flex flex-wrap items-center justify-between gap-x-md gap-y-xxs">
                          <span className="type-code-sm-regular break-all text-text-primary">{s}</span>
                          <ValueChip name={s} />
                        </li>
                      ))}
                  </ul>
                )}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-sm border-t border-border-subtle pt-md">
                  <span className="type-body-xs-regular text-text-tertiary">{info ? <>See all on {info.shownOn} →</> : `${c.modes.length} ${c.modes.length === 1 ? 'mode' : 'modes'}`}</span>
                  <TextLink to={`?tab=reference&c=${encodeURIComponent(c.name)}`}>
                    Browse<span className="sr-only"> {c.name} tokens</span>
                  </TextLink>
                </div>
              </div>
            );
          })}
        </div>
        <Bullets
          items={[
            <>Keep collection names plain: don’t prefix them with a tier, product or feature name.</>,
            <>
              Put a product concept in a group inside its domain collection, not in a new collection. For example, a signal-strength scale would be{' '}
              <InlineCode>color/signal/excellent</InlineCode>, <InlineCode>good</InlineCode> and <InlineCode>poor</InlineCode> inside Color.
            </>,
            <>Add each new variable to the collection it belongs to, give it a name that follows the naming pattern, and describe what it’s for in the UI. Add a mode only when you really need one.</>,
          ]}
        />
      </Topic>

      <Topic title="Three layers">
        <P>
          Primitives hold the raw values. Semantic variables point to a primitive and say what it’s for, and components use them. Component variables appear only where no semantic
          role fits, such as a button’s horizontal padding at each size.
        </P>
        <Visual className="flex flex-col gap-2xl">
          {brandChain.length >= 2 && (
            <LayerRow
              steps={[brandChain[0], brandChain[brandChain.length - 1], null]}
              result={<Button label="Save changes" />}
              note="The primary button fill. The brand color is defined once, and every brand fill uses it."
            />
          )}
          {paddingChain && (
            <LayerRow
              steps={paddingChain}
              result={paddingChain[2].startsWith('button/') ? <Button size={(paddingChain[2].split('/').pop() as 'sm' | 'md' | 'lg' | 'xl') ?? 'md'} label="Save changes" /> : <ValueChip name={paddingChain[2]} />}
              note={
                paddingChain[2].startsWith('button/padding-x/')
                  ? `${withArticle(SIZE_WORD[paddingChain[2].split('/').pop() ?? ''] ?? 'sized')} button’s horizontal padding needs a component token, because no general spacing role means “button padding”.`
                  : 'This value needs a component token, because no general role describes it.'
              }
            />
          )}
          {colorChain && (
            <LayerRow
              steps={colorChain}
              result={
                colorChain[2].startsWith('switch/') ? (
                  <label className="type-body-sm-medium flex items-center gap-sm text-text-primary">
                    <Switch checked onCheckedChange={() => {}} /> Notifications
                  </label>
                ) : (
                  <ValueChip name={colorChain[2]} />
                )
              }
              note={(() => {
                const dark = primitiveOf(colorChain[1], 'Dark');
                const what = colorChain[2].startsWith('switch/thumb') ? 'The switch thumb' : `The ${colorChain[2]} color`;
                return dark !== colorChain[0]
                  ? `${what}. In Dark, ${colorChain[1]} points to ${dark} instead, and the component follows.`
                  : `${what}. It follows ${colorChain[1]} in every mode.`;
              })()}
            />
          )}
        </Visual>
        {hasCategory && (
          <Caption>
            Category variables (<InlineCode>color/category/*</InlineCode>) are utility colors for badges, tags, avatars and charts. They don’t signal any status.
          </Caption>
        )}
      </Topic>

      <Topic title="Scopes">
        <P>Scopes narrow the variables shown in Figma’s property pickers. Check the role and the actual foreground/background pairing as well.</P>
        <TableRegion label="Variable scopes">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Variables</Th>
                <Th>Offered for</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ['color/text/*', 'Text fills'],
                ['color/icon/*', 'Icon fills and strokes'],
                ['color/border/*', 'Strokes'],
                ['color/surface/*, color/fill/*, color/overlay/*, color/category/*', 'Frame and shape fills'],
                ['color/shadow/*', 'Effect colors'],
                ['space/*', 'Gaps and padding'],
                ['size/*', 'Width and height'],
                ['radius/*', 'Corner radius'],
                ['border/width/*', 'Stroke width'],
                ['font/*', 'The matching text property'],
                ['Primitives, motion/*', 'Not offered in pickers'],
              ].map(([n, d]) => (
                <tr key={n} className="border-t border-border-subtle">
                  <Td code className="whitespace-normal">
                    {n}
                  </Td>
                  <Td>{d}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      </Topic>

      <Topic title="Naming">
        <P>Names group tokens by domain and purpose. Check the domain-specific patterns below and use Reference for the exact name.</P>
        <Visual className="flex flex-col gap-xl">
          <span className="type-code-md-regular text-text-secondary">{'{domain}/{group}/{role}[/{emphasis}][/{state}]'}</span>
          <SegmentAnatomy />
          <div className="flex flex-wrap items-center gap-md">
            <Swatch name="color/fill/brand/solid/hover" size={28} />
            <Button label="Save changes" forceState="hover" />
            <span className="type-body-xs-regular text-text-tertiary">The solid brand fill on hover.</span>
          </div>
        </Visual>
        <TableRegion label="Naming patterns by domain">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Domain</Th>
                <Th>Pattern</Th>
                <Th>Examples</Th>
              </tr>
            </thead>
            <tbody>
              {PATTERNS.map(([d, p, e]) => (
                <tr key={d} className="border-t border-border-subtle">
                  <Td className="type-body-sm-semibold whitespace-nowrap text-text-primary">{d}</Td>
                  <Td code>{p}</Td>
                  <Td code className="text-text-secondary">
                    {e}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <H3>Roles and children</H3>
        <P>
          States and variants sit under their role as children. The role itself is the resting value, so there’s no <InlineCode>/rest</InlineCode> or <InlineCode>/default</InlineCode> segment.
        </P>
        <div className="flex flex-col gap-xs rounded-surface border border-border-subtle p-lg">
          {['color/text/brand', 'hover', 'pressed'].filter((n, i) => byName.has(i === 0 ? n : `color/text/brand/${n}`)).map((n, i, all) => {
            const full = i === 0 ? n : `color/text/brand/${n}`;
            return (
              <div key={n} className="flex flex-wrap items-center gap-md">
                {i > 0 && (
                  <span aria-hidden className="type-code-sm-regular pl-md text-text-tertiary">
                    {i === all.length - 1 ? '└─' : '├─'}
                  </span>
                )}
                <Badge tone={i === 0 ? 'brand' : 'default'}>
                  <Swatch name={full} size={14} />
                  {n}
                </Badge>
                <span className="type-body-xs-regular text-text-tertiary">{byName.get(full)?.description}</span>
              </div>
            );
          })}
        </div>
        <H3>Names describe purpose, not values</H3>
        <P>
          Name a token for its job, not for how it looks or the one place it appears. Sizes are named by step (<InlineCode>xs</InlineCode> to <InlineCode>2xl</InlineCode>), so their values
          can change without a rename.
        </P>
        <div className="grid gap-xl md:grid-cols-2">
          <DoDont kind="do" caption="color/text/secondary · space/md · radius/control" />
          <DoDont kind="dont" caption="gray-text-2 · space-8px · button-radius-login" />
        </div>
        <H3>From Figma to code</H3>
        {productHasWeb ? (
          <>
            <P>
              In code, the same segments are joined with hyphens. Color, space, radius, font, shadow and easing tokens become Tailwind theme keys. Use everything else through its CSS
              variable.
            </P>
            <TableRegion label="Figma names, CSS variables and Tailwind classes">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface-sunken">
                  <tr>
                    <Th>Figma</Th>
                    <Th>CSS</Th>
                    <Th>Tailwind</Th>
                  </tr>
                </thead>
                <tbody>
                  {MAP.map(([a, b, c]) => (
                    <tr key={a} className="border-t border-border-subtle">
                      <Td code>{a}</Td>
                      <Td code className="text-text-secondary">
                        {b}
                      </Td>
                      <Td code className="text-text-brand">
                        {c}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
          </>
        ) : (
          <>
            <P>
              In app code, the segments become camelCase members, without the domain: <InlineCode>color/text/primary</InlineCode> is{' '}
              <InlineCode>textPrimary</InlineCode>. A member that would start with a digit keeps its domain.
            </P>
            <TableRegion label="Figma names in React Native, Swift and Kotlin">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface-sunken">
                  <tr>
                    <Th>Figma</Th>
                    <Th>React Native</Th>
                    <Th>Swift</Th>
                    <Th>Kotlin</Th>
                  </tr>
                </thead>
                <tbody>
                  {MAP.filter(([a]) => appTokenNames(a)).map(([a]) => {
                    const n = appTokenNames(a)!;
                    return (
                      <tr key={a} className="border-t border-border-subtle">
                        <Td code>{a}</Td>
                        {[n.rn, n.swift, n.kotlin].map((c) => (
                          <Td key={c} code className="text-text-secondary">
                            {breakable(c)}
                          </Td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableRegion>
          </>
        )}
        <Caption>
          Every semantic variable describes what it’s for in the UI. You’ll see the same text in Figma’s picker tooltip and in the <TextLink to="?tab=reference">Reference</TextLink> table.
        </Caption>
      </Topic>

      <Topic title="Modes">
        <P>
          {supportedModes.length > 1 ? (
            <>
              Color has {joinList(supportedModes)} modes, and every role has a value in each. Components don’t need a dark variant: in {supportedModes[1]}, the role points to a
              different primitive and everything that uses it follows.
            </>
          ) : (
            <>
              Color is {supportedModes[0]} only
              {unsupportedModes.length
                ? `. The collection has a ${joinList(unsupportedModes)} column, but it isn’t supported, so keep frames on ${supportedModes[0]}`
                : ''}
              . Every role has one value, and everything that uses it follows when it changes.
            </>
          )}
        </P>
        <TableRegion label={`Color roles in ${joinList(supportedModes)}`}>
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Role</Th>
                {supportedModes.map((m) => (
                  <Th key={m}>{m}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODE_ROLES.map((n) => (
                <tr key={n} className="border-t border-border-subtle">
                  <Td code>{n}</Td>
                  {supportedModes.map((m) => (
                    <Td key={m}>
                      <ValueChip name={n} mode={m} />
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        {/* An explicit width: with brand spacing tokens, max-w-md would be the md space step, not 28 rem. */}
        <div className={supportedModes.length > 1 ? 'grid gap-xl md:grid-cols-2' : 'grid max-w-[28rem] gap-xl'}>
          {supportedModes.map((mode) => mode.toLowerCase()).map((m) => (
            <div key={m} className="flex min-w-0 flex-col gap-sm">
              <span className="type-body-xs-semibold text-text-tertiary">Color → {m === 'dark' ? 'Dark' : 'Light'}</span>
              <div data-theme={m} className="rounded-surface bg-surface-sunken p-xl">
                <ModeCard />
              </div>
            </div>
          ))}
        </div>
        <H3>Motion: Standard and Reduced</H3>
        <P>
          For people who ask their device for less motion, Reduced turns movement into instant changes or short fades. Fades and loops stay, because they don’t move anything across the
          screen.
        </P>
        <TableRegion label="Motion durations in Standard and Reduced">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Token</Th>
                <Th>Standard</Th>
                <Th>Reduced</Th>
              </tr>
            </thead>
            <tbody>
              {tokens.variables
                .filter((t) => t.name.startsWith('motion/duration/'))
                .map((t) => (
                  <tr key={t.name} className="border-t border-border-subtle">
                    <Td code>{t.name}</Td>
                    <Td code>{t.modes.Standard?.value}</Td>
                    <Td code className={t.modes.Standard?.value !== t.modes.Reduced?.value ? 'text-text-brand' : ''}>
                      {t.modes.Reduced?.value}
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableRegion>
        <Bullets
          items={[
            singleDensity ? (
              <>
                There’s one density, so Space and Size have no Compact or Spacious modes. Add them only when the product needs them, and let them change only control heights, paddings and
                row heights.
              </>
            ) : (
              <>Space and Size have density modes. They change only control heights, paddings and row heights.</>
            ),
            <>
              Breakpoints aren’t modes.{' '}
              {gridNames.length ? (
                <>
                  Layouts change structure at{' '}
                  {gridNames.map((g, i) => (
                    <Fragment key={g}>
                      {i > 0 && (i === gridNames.length - 1 ? ' and ' : ', ')}
                      <InlineCode>{g}</InlineCode>
                    </Fragment>
                  ))}
                  , and tokens change only where a value really differs.
                </>
              ) : (
                <>Layouts change structure at each grid breakpoint, and tokens change only where a value really differs.</>
              )}
            </>,
            ...(siteHasDark
              ? [
                  <>Dark neutrals are solid colors, not transparent white, so contrast stays predictable and stacked layers don’t add up.</>,
                  <>Each mode is tested on its own, because a pair that passes in Light can fail in Dark.</>,
                ]
              : [
                  <>
                    {unsupportedModes.length ? `${joinList(unsupportedModes)} isn’t supported yet. ` : ''}When a dark mode is added, start with solid neutrals rather than
                    transparent white, and test each mode on its own.
                  </>,
                ]),
          ]}
        />
      </Topic>

      <Topic title="Primitive palette">
        <P>
          Under every semantic token sits a raw value: a <InlineCode>palette/*</InlineCode> color or a <InlineCode>scale/*</InlineCode> number. Primitives are hidden from pickers and never
          used directly in components, and they change only when the brand does.{' '}
          {paletteCharacter}
        </P>
        <Visual className="flex flex-col gap-md">
          {families.map((f) => {
            const steps = tokens.variables.filter((t) => t.name.startsWith(`palette/${f}/`));
            return (
              <div key={f} className="grid items-center gap-xs sm:grid-cols-[9rem_1fr] sm:gap-lg">
                <span className="type-code-sm-regular text-text-secondary">palette/{f}</span>
                <div className={`flex h-6 overflow-hidden rounded-xs border border-border-subtle ${f === 'alpha-white' ? 'bg-[var(--palette-neutral-950,#000)]' : f === 'alpha-black' ? 'bg-[var(--palette-base-white,#fff)]' : ''}`} role="img" aria-label={`palette/${f}: ${steps.length} steps`}>
                  {steps.map((s) => (
                    <span key={s.name} title={s.name} className="flex-1" style={{ background: Object.values(s.modes)[0]?.value }} />
                  ))}
                </div>
              </div>
            );
          })}
        </Visual>
        <P>
          {families.includes('alpha-black') && families.includes('alpha-white') && (
            <>
              The alpha scales, <InlineCode>palette/alpha-black/*</InlineCode> and <InlineCode>palette/alpha-white/*</InlineCode>, hold black and white at fixed opacities for the scrim,
              shadow colors and tints over media.{' '}
            </>
          )}
          The number scales are {joinList(scales.map((s) => `scale/${s}`))}.
        </P>
        <Caption>
          For every step with its value and contrast, see <TextLinkTo id="1.1" label="1.1 Color" />. Change a primitive only when the brand changes, then check the roles that use it and
          rerun the contrast tests.
        </Caption>
      </Topic>
    </div>
  );
}

/* ---------- Reference ---------- */
interface Row {
  name: string;
  collection: string;
  hay: string;
}
const ALL = 'All collections';
/** The code names a token is found by: CSS and Tailwind on a web product, React Native, Swift and Kotlin on an App product. */
function codeHay(name: string, web: string) {
  if (productHasWeb) return web;
  const a = appTokenNames(name);
  return a ? `${a.rn} ${a.swift} ${a.kotlin}` : '';
}
const rows: Row[] = [
  ...tokens.variables.map((t) => ({ name: t.name, collection: t.collection, hay: `${t.name} ${codeHay(t.name, `${t.css} ${t.tailwind ?? ''}`)}`.toLowerCase() })),
  ...tokens.textStyles.map((t) => ({ name: t.name, collection: 'Text styles', hay: `${t.name} ${codeHay(t.name, t.className)}`.toLowerCase() })),
  ...tokens.effectStyles.map((t) => ({ name: t.name, collection: 'Effect styles', hay: `${t.name} ${codeHay(t.name, `${t.css} ${t.tailwind}`)}`.toLowerCase() })),
];
const groups = [...tokens.collections.map((c) => c.name), 'Text styles', 'Effect styles'];
const PAGE = 120;

function Reference() {
  const [params] = useSearchParams();
  const initial = params.get('c');
  const urlQ = params.get('q');
  const [q, setQ] = useState(urlQ ?? '');
  // Site search can send a new ?q= while this tab is open: adopt it once per change.
  const [seenQ, setSeenQ] = useState(urlQ);
  if (urlQ !== seenQ) {
    setSeenQ(urlQ);
    setQ(urlQ ?? '');
  }
  const [col, setCol] = useState<string>(initial && groups.includes(initial) ? initial : ALL);
  const [limit, setLimit] = useState(PAGE);
  const dq = useDeferredValue(q.trim().toLowerCase());
  const list = useMemo(() => rows.filter((r) => (col === ALL || r.collection === col) && (!dq || r.hay.includes(dq))).map((r) => r.name), [dq, col]);
  const shown = list.slice(0, limit);
  return (
    <div className="flex flex-col gap-xl">
      <P>
        Find any variable, text style or effect style by its Figma name{productHasWeb ? ', CSS variable or Tailwind class' : ' or its React Native, Swift or Kotlin name'}.{' '}
        {supportedModes.length > 1
          ? `Values are shown for ${joinList(supportedModes)}, and tokens with a single mode show the same value in each.`
          : `Values are shown for ${supportedModes[0]}, the only supported color mode.`}
      </P>
      <div className="grid gap-lg md:grid-cols-[minmax(0,1fr)_16rem]">
        <TextField
          label="Search tokens"
          leadingIcon="general/search"
          placeholder={productHasWeb ? 'Try brand, --space-md or rounded-control' : 'Try brand, textPrimary or DsSpace'}
          value={q}
          onValueChange={(val) => {
            setQ(val);
            setLimit(PAGE);
          }}
        />
        <Select
          label="Collection"
          options={[ALL, ...groups]}
          value={col}
          onValueChange={(val) => {
            setCol(val ?? ALL);
            setLimit(PAGE);
          }}
        />
      </div>
      <p className="type-body-sm-medium text-text-secondary" role="status" aria-live="polite">
        {list.length} {list.length === 1 ? 'token' : 'tokens'}
        {col !== ALL ? ` in ${col}` : ''}
        {dq ? ` matching “${q.trim()}”` : ''}
      </p>
      {list.length ? (
        <TableRegion label="Token search results" className="[&>div]:overflow-visible [&>div]:rounded-none [&>div]:border-0">
          <TokenTable names={shown} />
        </TableRegion>
      ) : (
        <div className="flex flex-col items-center gap-sm rounded-surface border border-dashed border-border-default p-3xl text-center">
          <Icon name="general/search" size="lg" className="text-icon-tertiary" />
          <span className="type-body-md-semibold text-text-primary">No tokens match</span>
          <span className="type-body-sm-regular text-text-secondary">Try part of a name, such as “surface” or “radius”, or search all collections.</span>
        </div>
      )}
      {list.length > limit && (
        <div>
          <Button emphasis="secondary" label={`Show all ${list.length}`} onClick={() => setLimit(list.length)} />
        </div>
      )}
    </div>
  );
}

export default function Tokens() {
  return (
    <DocPage
      eyebrow="Guidance › 02 Tokens"
      title="Tokens"
      description="Tokens are the named values behind every screen, shared by Figma and code. Here’s how they’re organized, named and switched between modes. Look up any token in the Reference tab."
      figmaNode={figmaNodeFor('02')}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Reference', render: () => <Reference /> },
      ]}
    />
  );
}
