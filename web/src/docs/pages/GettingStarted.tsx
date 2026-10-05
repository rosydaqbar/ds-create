import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { config } from '@/ds.config';
import { Icon, type IconName } from '@/icons';
import { tokens } from '@/tokens/tokens.gen';
import type { TokenVariable } from '@/tokens/types';
import { Button, buttonVariants, Checkbox, FeaturedIcon, Label, Progress, Switch, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../DocPage';
import { APP_PLATFORMS, Bullets, Caption, CodeBlock, DoDont, H3, InlineCode, P, productHasApp, productHasWeb, Segmented, type AppPlatform } from '../blocks';
import { componentDocs, levelLabel, slugOf, staticPages } from '../registry';
import { figmaNodeFor, pageMeta, statusInfo, StatusPill } from '../meta';

/* ---------- data (everything below is read from the tokens, the config and the page registry) ---------- */
const byName = new Map(tokens.variables.map((t) => [t.name, t]));
const v = (name: string) => byName.get(name);
const lightOf = (name: string) => {
  const t = v(name);
  return t ? (t.modes.Light ?? Object.values(t.modes)[0]) : undefined;
};
const short = (alias?: string | null) => (alias ?? '').replace(/^palette\//, '');
const px = (name: string) => {
  const val = lightOf(name)?.value;
  return val ? String(parseFloat(val)) : '';
};
/** "a, b and c" (no serial comma, as in the rest of the docs). */
const joinList = (items: string[]) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

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
const primitiveOf = (name: string) => chainOf(name).at(-1) ?? name;

const brandPrimitive = primitiveOf('color/fill/brand/solid');
const brandPrimitiveCss = v(brandPrimitive)?.css ?? '--color-fill-brand-solid';
const bodySize = chainOf('font/size/body-md');
/** A different hue for the "one change, many updates" demo: the first non-brand family with a 600 step. */
const swapColor = (() => {
  const brandFamily = brandPrimitive.split('/')[1];
  const family = ['teal', 'green', 'orange', 'pink', 'red', 'amber', 'sky', 'blue'].find((f) => f !== brandFamily && byName.has(`palette/${f}/600`));
  return family ? { css: `var(${v(`palette/${family}/600`)!.css})`, label: family } : { css: 'var(--color-fill-danger-solid)', label: 'the danger color' };
})();

/** Typefaces, from `font/family/*`. A stack that starts with a generic family is the platform's own font. */
const SYSTEM_FONTS = new Set(['ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded', 'system-ui', '-apple-system', 'blinkmacsystemfont', 'sans-serif', 'serif', 'monospace', 'sfmono-regular']);
const FAMILY_USE: Record<string, string> = { ui: 'UI and content', mono: 'Code, tokens and numbers', display: 'Display text and headings', serif: 'Long-form reading', brand: 'Brand moments' };
const typefaces = tokens.variables
  .filter((t) => t.name.startsWith('font/family/'))
  .map((t) => {
    const role = t.name.split('/').pop() ?? '';
    const stack = Object.values(t.modes)[0]?.value ?? '';
    const first = stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
    const system = SYSTEM_FONTS.has(first.toLowerCase());
    const kind = /mono/i.test(stack) ? 'monospace' : /(^|[\s,])serif/i.test(stack) && !/sans/i.test(stack) ? 'serif' : 'sans-serif';
    const weights = [...new Set(tokens.textStyles.filter((s) => s.bound.fontFamily === t.name).map((s) => s.fontWeight))].sort((a, b) => Number(a) - Number(b));
    return {
      token: t.name,
      css: t.css,
      role,
      system,
      label: system ? `System ${kind}` : first,
      prose: system ? `the system ${kind} font` : first,
      use: FAMILY_USE[role] ?? `Text styles that use ${t.name}`,
      weights,
    };
  });
const webFonts = typefaces.filter((f) => !f.system);
const mainFace = typefaces.find((f) => f.role === 'ui') ?? typefaces[0];
const otherFaces = typefaces.filter((f) => f !== mainFace);
const typeSentence = !webFonts.length
  ? 'Text uses each device’s own system fonts, so screens load fast and there’s nothing to install.'
  : `Text is set in ${mainFace.prose}${otherFaces.length ? `, with ${joinList(otherFaces.map((f) => `${f.prose} for ${f.role === 'mono' ? 'code' : f.use.toLowerCase()}`))}` : ''}.`;

const modesOf = (collection: string) => tokens.collections.find((c) => c.name === collection)?.modes ?? [];
const colorModes = modesOf('Color');
const motionModes = modesOf('Motion');
const spaceSteps = tokens.variables.filter((t) => /^space\/[^/]+$/.test(t.name) && !/\/(none|optical)$/.test(t.name)).map((t) => t.name.split('/')[1]);
/** Short brand name for the library-split example: "Acme Design System" → "Acme". */
const shortName = config.name.replace(/\s*design system$/i, '').trim();

const foundationPages = staticPages.filter((p) => p.group === 'foundations');
const pageExists = (id: string) => staticPages.some((s) => s.id === id) || componentDocs.some((c) => c.id === id);
const pageTo = (id: string) => {
  const p = staticPages.find((s) => s.id === id);
  if (p) return `/${p.group}/${slugOf(p.id, p.name)}`;
  const d = componentDocs.find((c) => c.id === id);
  return d ? `/${d.level}/${slugOf(d.id, d.name)}` : '/';
};
const docsOf = (level: string) => componentDocs.filter((d) => d.level === level);
/** A few example names for a level, preferring the most familiar pages when the build has them. */
const examples = (items: { id: string; name: string }[], prefer: string[], n: number) => {
  const picked = [...prefer.map((id) => items.find((i) => i.id === id)).filter((i) => !!i), ...items].filter((i, k, all) => all.indexOf(i) === k);
  return joinList(picked.slice(0, n).map((i) => i.name));
};
const levels = [
  {
    key: 'foundations',
    ids: '1.x',
    icon: 'editor/palette',
    text: `The values every component is built from: ${joinList(foundationPages.map((p) => p.name.toLowerCase()))}.`,
    items: foundationPages.map((p) => ({ id: p.id, name: p.name })),
  },
  { key: 'parts', ids: '2.x', icon: 'shapes/square', text: `The smallest pieces, such as ${examples(docsOf('parts'), ['2.1', '2.7', '2.4'], 3)}.`, items: docsOf('parts') },
  { key: 'components', ids: '3.x', icon: 'layout/layout-grid', text: `A few Parts combined into one working unit, such as ${examples(docsOf('components'), ['3.2', '3.5'], 2)}.`, items: docsOf('components') },
  { key: 'sections', ids: '4.x', icon: 'layout/layout-dashboard', text: `Larger blocks with their own layout and behavior, such as ${examples(docsOf('sections'), ['4.1', '4.2'], 2)}.`, items: docsOf('sections') },
].filter((l) => l.items.length > 0) as { key: keyof typeof levelLabel; ids: string; icon: IconName; text: string; items: { id: string; name: string }[] }[];
const fontLinks = [
  ...(config.fontStylesheets.some((u) => u.includes('fonts.googleapis.com'))
    ? ['<link rel="preconnect" href="https://fonts.googleapis.com" />', '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />']
    : []),
  ...config.fontStylesheets.map((u) => `<link rel="stylesheet" href="${u}" />`),
].join('\n');
const numberWord = (n: number) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
const betaDocs = componentDocs.filter((d) => pageMeta[d.id]?.status === 'beta');
const stableCount = componentDocs.filter((d) => pageMeta[d.id]?.status === 'stable').length;

const brandColors = [
  { label: 'Brand', role: 'color/fill/brand/solid', meaning: 'Primary actions, links, selected states' },
  { label: 'Brand subtle', role: 'color/fill/brand/subtle', meaning: 'Tinted backgrounds, badges, highlights' },
  { label: 'Ink', role: 'color/text/primary', meaning: 'Primary text on light surfaces' },
  { label: 'Neutral', role: 'color/border/default', meaning: 'Borders, dividers, secondary surfaces' },
  { label: 'Danger', role: 'color/fill/danger/solid', meaning: 'Errors and destructive actions' },
  { label: 'Warning', role: 'color/fill/warning/solid', meaning: 'Caution and beta notices' },
  { label: 'Success', role: 'color/fill/success/solid', meaning: 'Completed and connected states' },
];

/* ---------- layout helpers ---------- */
function Topic({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-lg border-b border-border-subtle pb-4xl last:border-b-0 last:pb-0">
      <AnchorHeading>{title}</AnchorHeading>
      {children}
    </section>
  );
}
function Column({ children }: { children: ReactNode }) {
  return <div className="flex max-w-[64rem] flex-col gap-4xl">{children}</div>;
}
/** A visual example: a quiet stage that never forces horizontal scroll. */
function Visual({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-surface border border-border-subtle bg-surface-sunken p-xl md:p-3xl ${className}`}>{children}</div>;
}
function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="rounded-xs font-semibold text-text-brand underline decoration-1 underline-offset-2 outline-none is-hover:text-text-brand-hover is-focus:shadow-focus-default">
      {children}
    </Link>
  );
}
/** A link to another page of this site, or plain text when the build doesn't include that page. */
function PageLink({ id, children, suffix = '' }: { id: string; children: ReactNode; suffix?: string }) {
  return pageExists(id) ? <TextLink to={pageTo(id) + suffix}>{children}</TextLink> : <>{children}</>;
}
function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex max-w-(--size-measure-reading) flex-col gap-md">
      {items.map((it, i) => (
        <li key={i} className="flex gap-md">
          <span aria-hidden className="type-body-xs-semibold inline-flex size-(--size-control-xs) shrink-0 items-center justify-center rounded-full bg-fill-brand-subtle text-text-brand">
            {i + 1}
          </span>
          <span className="type-body-md-regular pt-xxs text-text-secondary">{it}</span>
        </li>
      ))}
    </ol>
  );
}
function NavCard({ to, icon, title, children, external }: { to: string; icon: IconName; title: string; children: ReactNode; external?: boolean }) {
  const cls =
    'group flex flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-xl shadow-raised outline-none transition-colors duration-(--motion-duration-fast) is-hover:border-border-brand is-focus:shadow-focus-default';
  const body = (
    <>
      <FeaturedIcon icon={icon} size="md" tone="brand" emphasis="secondary" />
      <span className="type-body-lg-semibold flex items-center gap-xs text-text-primary">
        {title}
        <Icon name={external ? 'arrows/external-link' : 'arrows/arrow-right'} size="sm" className="text-icon-tertiary transition-transform duration-(--motion-duration-fast) group-hover:translate-x-xxs" />
      </span>
      <span className="type-body-sm-regular text-text-secondary">{children}</span>
    </>
  );
  return external ? (
    <a href={to} target="_blank" rel="noreferrer" className={cls}>
      {body}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <Link to={to} className={cls}>
      {body}
    </Link>
  );
}
/** Wide tables scroll inside a focusable, named region. */
function TableRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div tabIndex={0} role="region" aria-label={label} className="min-w-0 overflow-x-auto rounded-surface border border-border-subtle outline-none is-focus:shadow-focus-default">
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
/** A swatch that is bound to the variable itself, so it follows the colour mode. */
function LiveSwatch({ css, className = 'size-10' }: { css: string; className?: string }) {
  return <span aria-hidden className={`block shrink-0 rounded-sm border border-border-subtle ${className}`} style={{ background: `var(${css})` }} />;
}
function Chain({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-sm">
      {items.map((it, i) => (
        <Fragment key={it}>
          {i > 0 && <Icon name="arrows/arrow-right" size="sm" className="text-icon-tertiary" />}
          <span className="type-code-sm-regular rounded-indicator border border-border-subtle bg-surface-raised px-md py-xxs text-text-primary">{it}</span>
        </Fragment>
      ))}
    </div>
  );
}
/** Forced-mode preview: the subtree uses Light or Dark values whatever the page uses. */
function ModeFrame({ mode, children }: { mode: 'Light' | 'Dark'; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-sm">
      <span className="type-body-xs-semibold text-text-tertiary">Frame mode: Color → {mode}</span>
      <div data-theme={mode.toLowerCase()} className="rounded-surface border border-border-subtle bg-surface-base p-xl text-text-primary">
        {children}
      </div>
    </div>
  );
}
function InviteCard() {
  return (
    <div className="flex flex-col gap-lg">
      <span className="type-heading-xs-semibold text-text-primary">Invite your team</span>
      <TextField label="Email" placeholder="you@company.com" inputType="email" />
      <Button label="Send invite" leadingIcon="communication/send" className="self-start" />
    </div>
  );
}

/* ---------- Overview ---------- */
// BRAND: rewrite from the Figma "01 Getting started · Overview" Welcome topic: name the product this system serves and its platforms (one or two sentences).
const productScreens = productHasWeb && productHasApp ? 'web screens and iOS and Android apps' : productHasApp ? 'iOS and Android apps' : 'responsive web screens';
const welcomeIntro = `${config.name} is the shared library of tokens, components and guidance for designing and building ${productScreens} in ${joinList(colorModes)}.`;
/** What developers get, by product type (ds.config `product`). */
const codeHome =
  productHasWeb && productHasApp
    ? 'this site for developers, with the React components and the code for React Native, Swift and Kotlin'
    : productHasApp
      ? 'this site for developers, with every component previewed and its code in React Native, Swift and Kotlin'
      : 'this site with its React components for developers';
const developerStart = productHasApp
  ? productHasWeb
    ? 'Install the web package, or copy the code for React Native, Swift or Kotlin. Props match the Figma properties, and every value comes from a token.'
    : 'Copy the code for React Native, Swift or Kotlin from each component page. Props match the Figma properties, and every value comes from a token.'
  : 'Install one package and start building. Props match the Figma properties, and every value comes from a token.';
// BRAND: rewrite from the Figma "The brand at a glance" topic: where the brand colors come from, and the corner and depth character.
const brandSummary =
  'The brand color becomes the brand ramp, and the neutrals carry text, borders and surfaces. The corner scale and the elevation styles give every component the same shape and depth.';

function Overview() {
  const fill = lightOf('color/fill/brand/solid');
  const radii = (
    [
      ['Controls use', 'radius/control'],
      ['cards', 'radius/surface'],
      ['dialogs', 'radius/modal'],
    ] as const
  ).filter(([, n]) => v(n));
  return (
    <Column>
      <Topic title="Welcome">
        <P>
          {welcomeIntro} {typeSentence}
        </P>
        <P>
          The system lives in two places: the Figma library for designers, and {codeHome}. Both use the same names, so a design and its code
          always describe the same thing.
        </P>
        <div className="grid gap-md sm:grid-cols-3">
          {[
            ['Designers', 'Keep components attached so library updates reach your screens. When something needs to change, change the variable, style or component, not the instance.', 'editor/palette'],
            ['Developers', developerStart, 'development/code'],
            ['Product managers', 'Before you plan work, check what already exists and how mature it is, so new screens reuse what’s built and tested.', 'layout/layout-dashboard'],
          ].map(([t, d, i]) => (
            <div key={t} className="flex flex-col gap-sm rounded-surface border border-border-subtle p-xl">
              <span className="flex items-center gap-sm">
                <Icon name={i as IconName} className="text-icon-brand" />
                <H3>{t}</H3>
              </span>
              <span className="type-body-sm-regular text-text-secondary">{d}</span>
            </div>
          ))}
        </div>
      </Topic>

      <Topic title="The brand at a glance">
        <P>{brandSummary}</P>
        <Visual className="flex flex-col gap-2xl">
          <div className="flex flex-wrap items-center gap-xl">
            <img src={config.logo.light} alt={`${config.name} logo`} className="h-10 max-w-full dark:hidden" />
            <img src={config.logo.dark} alt={`${config.name} logo`} className="hidden h-10 max-w-full dark:block" />
            <span className="type-body-sm-regular text-text-tertiary">
              Find logo files and clear-space rules in <PageLink id="1.8">1.8 Brand assets</PageLink>.
            </span>
          </div>
          <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
            {brandColors.map((c) => {
              const t = v(c.role);
              const m = lightOf(c.role);
              if (!t || !m) return null;
              const prim = primitiveOf(c.role);
              return (
                <div key={c.role} className="flex min-w-0 flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-raised">
                  <LiveSwatch css={t.css} className="h-16 w-full rounded-none border-0 border-b" />
                  <div className="flex flex-col gap-xxs p-lg">
                    <span className="type-body-md-semibold text-text-primary">{c.label}</span>
                    <span className="type-code-sm-regular flex flex-col text-text-secondary [overflow-wrap:anywhere]">
                      {prim !== c.role && <span>{prim}</span>}
                      <span>{prim !== c.role ? '→ ' : ''}{c.role}</span>
                    </span>
                    <span className="type-code-sm-regular text-text-tertiary">
                      <span className="uppercase">{m.value}</span> in Light
                    </span>
                    <span className="type-body-xs-regular pt-xs text-text-secondary">{c.meaning}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`grid gap-md ${typefaces.length > 2 ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {typefaces.map((f) => (
              <div key={f.token} className="flex min-w-0 flex-col gap-xs rounded-surface border border-border-subtle bg-surface-raised p-xl">
                <span className="font-semibold text-text-primary" style={{ fontFamily: `var(${f.css})`, fontSize: 44, lineHeight: '52px' }} aria-hidden>
                  Aa
                </span>
                <span className="type-body-md-semibold text-text-primary">{f.label}</span>
                <span className="type-body-xs-regular text-text-secondary">{f.use}</span>
                <span className="type-code-sm-regular text-text-tertiary [overflow-wrap:anywhere]">{f.token}</span>
              </div>
            ))}
          </div>
          <div className="grid items-start gap-xl md:grid-cols-[minmax(0,22rem)_1fr]">
            <div className="flex flex-col gap-lg rounded-surface bg-surface-raised p-xl shadow-raised">
              <span className="type-body-xs-semibold text-text-tertiary">Card · radius/surface {px('radius/surface')}</span>
              <TextField label="Email" placeholder="you@company.com" inputType="email" />
              <Button label="Save changes" leadingIcon="general/check" className="self-start" />
            </div>
            <P>
              {radii.map(([label, n], i) => (
                <Fragment key={n}>
                  {i > 0 && ', '}
                  {label} <InlineCode>{n}</InlineCode> ({px(n)})
                </Fragment>
              ))}{' '}
              and pills <InlineCode>radius/full</InlineCode>. Cards sit on <InlineCode>elevation/raised</InlineCode>, and menus lift higher on <InlineCode>elevation/overlay</InlineCode>.
            </P>
          </div>
        </Visual>
        <Caption>
          The swatches use the real variables, so they follow the color mode. The brand fill in Light is {fill?.value.toUpperCase()}. For more, see <PageLink id="1.1">1.1 Color</PageLink>,{' '}
          <PageLink id="1.2">1.2 Typography</PageLink>, <PageLink id="1.4">1.4 Shape</PageLink> and <PageLink id="1.5">1.5 Elevation</PageLink>.
        </Caption>
      </Topic>

      <Topic title="What’s in the system">
        <P>The system is organized in {numberWord(levels.length)} levels. Each level builds only on the ones before it, so when you change a foundation, every component that uses it changes too.</P>
        <div className="grid gap-md md:grid-cols-2">
          {levels.map((l) => (
            <div key={l.key} className="flex min-w-0 flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-xl">
              <div className="flex items-start gap-md">
                <FeaturedIcon icon={l.icon} size="md" tone="brand" emphasis="secondary" />
                <div className="flex flex-col">
                  <span className="type-heading-xs-semibold text-text-primary">{levelLabel[l.key]}</span>
                  <span className="type-body-sm-regular text-text-tertiary">
                    {l.items.length} pages · IDs {l.ids}
                  </span>
                </div>
              </div>
              <span className="type-body-sm-regular text-text-secondary">{l.text}</span>
              <ul className="flex flex-wrap gap-xs">
                {l.items.map((i) => (
                  <li key={i.id}>
                    <Link
                      to={pageTo(i.id)}
                      className="type-body-xs-medium inline-flex items-center gap-xs rounded-indicator border border-border-subtle px-md py-xxs text-text-secondary outline-none is-hover:border-border-brand is-hover:text-text-primary is-focus:shadow-focus-default"
                    >
                      <span className="type-code-sm-regular text-text-tertiary">{i.id}</span> {i.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Caption>
          Underneath are {tokens.variables.length} variables, {tokens.textStyles.length} text styles and {tokens.effectStyles.length} effect styles. See{' '}
          <TextLink to="/guidance/02-tokens">02 Tokens</TextLink> for how they’re organized.
        </Caption>
      </Topic>

      <Topic title="How mature it is">
        <P>
          Each component page shows a status label in its header, so you know how safe it is to build on today. Of the {componentDocs.length} components, {stableCount} are Stable and{' '}
          {betaDocs.length} are Beta.
        </P>
        <div className="grid gap-md md:grid-cols-2">
          {(['stable', 'beta'] as const).map((s) => (
            <div key={s} className="flex flex-col items-start gap-md rounded-surface border border-border-subtle p-xl">
              <StatusPill status={s} />
              <span className="type-body-sm-regular text-text-secondary">{statusInfo[s].description}</span>
            </div>
          ))}
        </div>
        <H3>In Beta today</H3>
        {betaDocs.length ? (
          <ul className="flex flex-col gap-xs">
            {betaDocs.map((d) => (
              <li key={d.id} className="type-body-md-regular flex flex-wrap items-baseline gap-sm text-text-secondary">
                <span className="type-code-sm-regular text-text-tertiary">{d.id}</span>
                <TextLink to={pageTo(d.id)}>{d.name}</TextLink>
                <span className="type-body-sm-regular text-text-tertiary">· {levelLabel[d.level]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <P>Nothing is in Beta right now: every component is Stable.</P>
        )}
        <Caption>
          Plan for small prop changes when you use a Beta component, and check the <TextLink to="/guidance/03-changelog">changelog</TextLink> before you upgrade.
        </Caption>
      </Topic>

      <Topic title="How this site is organized">
        <P>This site follows the Figma file page for page, with the same IDs. Every component page has the same five tabs, so you always know where to look.</P>
        <TableRegion label="Tabs on every component page">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Tab</Th>
                <Th>What you find there</Th>
                <Th>Most useful for</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Overview', 'The component in real examples, and when to use it.', 'Everyone'],
                ['Component', 'Every variant side by side, plus a playground to try the properties.', 'Designers, developers'],
                ['Anatomy', 'Its parts, properties, sizes, states and the tokens it uses.', 'Designers, developers'],
                ['Guidelines', 'When and how to use it, dos and don’ts, content and accessibility.', 'Everyone'],
                ['Code', 'Install and import lines, and copy-ready code for every example.', 'Developers'],
              ].map(([t, d, w]) => (
                <tr key={t} className="border-t border-border-subtle">
                  <Td className="type-body-sm-semibold whitespace-nowrap text-text-primary">{t}</Td>
                  <Td>{d}</Td>
                  <Td className="whitespace-nowrap">{w}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <Caption>
          Foundation pages show the values and how to use them.
          {config.figmaUrl ? ' Use “Open in Figma” in any page header to jump to the same page in the Figma library.' : ''}
        </Caption>
      </Topic>

      <Topic title="Where to go next">
        <div className="grid gap-md md:grid-cols-3">
          <NavCard to="?tab=for-designers" icon="editor/palette" title="For designers">
            Set up the Figma library, and learn how the file, its variables and modes work.
          </NavCard>
          <NavCard to="?tab=for-developers" icon="development/code" title="For developers">
            {productHasApp && !productHasWeb
              ? 'Read the code for React Native, Swift and Kotlin, with props and tokens named after Figma.'
              : 'Install the package, add the styles and use components and tokens in your app.'}
          </NavCard>
          <NavCard to="/guidance/03-changelog" icon="time/history" title="What changed">
            Release notes for every version: new components, changed props and fixes.
          </NavCard>
        </div>
      </Topic>

      <Topic title="Asking for a change">
        <P>
          Missing a component, a variant or a token? Ask before you build your own. Every change flows the same way, from Figma to the spec to code, so the two never drift apart.
        </P>
        <ol className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Request', 'Describe what you need, which screen it’s for and what you tried with existing components.'],
            ['Design in Figma', 'The maintainers design it in the Figma library, using variables and the shared property names.'],
            ['Spec', 'They update the page’s spec: anatomy, properties, states, tokens and guidelines.'],
            ['Code', 'They build it from the spec, document it on this site and add it to the changelog.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-xs rounded-surface border border-border-subtle p-lg">
              <span className="type-body-xs-semibold text-text-brand">Step {i + 1}</span>
              <span className="type-body-md-semibold text-text-primary">{t}</span>
              <span className="type-body-sm-regular text-text-secondary">{d}</span>
            </li>
          ))}
        </ol>
      </Topic>
    </Column>
  );
}

/* ---------- For designers ---------- */
function PropertyPanel() {
  const rows: [string, string][] = [
    ['Size', 'md'],
    ['Emphasis', 'primary'],
    ['Tone', 'brand'],
    ['State', 'rest'],
    ['Icon only', 'false'],
    ['Label', 'Upload'],
    ['Show leading icon', 'true'],
  ];
  return (
    <div className="flex w-full max-w-[17rem] flex-col rounded-surface border border-border-subtle bg-surface-raised shadow-raised">
      <span className="type-body-sm-semibold flex items-center gap-sm border-b border-border-subtle px-lg py-md text-text-primary">
        <Icon name="general/layers" size="sm" className="text-icon-brand" /> Button
      </span>
      <dl className="flex flex-col gap-sm p-lg">
        {rows.map(([k, val]) => (
          <div key={k} className="flex items-center justify-between gap-md">
            <dt className="type-body-xs-medium text-text-tertiary">{k}</dt>
            <dd className="type-body-xs-medium rounded-xs bg-surface-sunken px-sm py-xxs text-text-primary">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BrandSwapDemo() {
  const [swap, setSwap] = useState(false);
  const style = swap ? ({ '--color-fill-brand-solid': swapColor.css } as CSSProperties) : undefined;
  return (
    <Visual className="flex flex-col gap-xl">
      <label className="type-body-sm-medium flex cursor-pointer items-center gap-md self-start text-text-primary">
        <Switch checked={swap} onCheckedChange={setSwap} />
        Preview <InlineCode>color/fill/brand/solid</InlineCode> as {swapColor.label}
      </label>
      <div style={style} className="flex flex-wrap items-center gap-2xl rounded-surface border border-border-subtle bg-surface-base p-xl">
        <Button label="Save changes" />
        <label className="type-body-sm-medium flex items-center gap-sm text-text-primary">
          <Checkbox size="md" checked onCheckedChange={() => {}} /> Remember me
        </label>
        <label className="type-body-sm-medium flex items-center gap-sm text-text-primary">
          <Switch checked onCheckedChange={() => {}} /> Notifications
        </label>
        <Progress value={64} aria-label="Setup progress" className="w-full max-w-[14rem]" />
      </div>
    </Visual>
  );
}

function ForDesigners() {
  return (
    <Column>
      <Topic title="Setting up">
        <P>Do these five steps before your first screen. They take a few minutes and prevent the most common problems: missing fonts, out-of-date components and hand-picked colors.</P>
        <Steps
          items={[
            webFonts.length ? (
              <>
                Install the typefaces listed on the cover:{' '}
                {webFonts.map((f, i) => (
                  <Fragment key={f.token}>
                    {i > 0 && (i === webFonts.length - 1 ? ' and ' : ', ')}
                    <strong className="text-text-primary">{f.label}</strong>
                  </Fragment>
                ))}
                . Without them, every text style falls back to the wrong font.
              </>
            ) : (
              <>Check the typefaces on the cover. Text uses system fonts today, so there’s nothing to install. If a typeface is added later, install it first, or text styles fall back to the wrong font.</>
            ),
            <>
              Turn on the library in your team’s files: Assets panel → Libraries → <strong className="text-text-primary">{config.name}</strong>.
            </>,
            <>When the system changes, accept the library update and read its notes in the update dialog.</>,
            <>Set the color mode (Light or Dark) on the page or frame you’re designing, not on each layer.</>,
            <>Insert components from the Assets panel, and adjust them in the property panel rather than in the layers.</>,
          ]}
        />
        {config.figmaUrl ? (
          <div>
            <a href={config.figmaUrl} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })}>
              Open the Figma library <Icon name="arrows/external-link" size="sm" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        ) : (
          <Caption>Don’t see the library in your team’s files? Ask the design system maintainers for access to the Figma library.</Caption>
        )}
      </Topic>

      <Topic title="The page tree">
        <P>
          Each Figma page has an ID and sits in its level, just like the sidebar on this site. A component only uses pieces from the levels below it. IDs don’t change, so a Figma page,
          its spec and its code stay linked.
        </P>
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Foundations',
              ids: '1.1 · 1.7',
              node: (
                <div className="flex items-center gap-md">
                  <Icon name="communication/mail" size="lg" className="text-icon-secondary" />
                  <LiveSwatch css="--color-fill-brand-solid" className="size-8" />
                </div>
              ),
            },
            {
              title: 'Parts',
              ids: '2.1 · 2.11',
              node: (
                <div className="flex flex-col items-start gap-sm">
                  <Label as="span" label="Email" />
                  <Button size="sm" label="Sign in" />
                </div>
              ),
            },
            { title: 'Components', ids: '3.2', node: <TextField size="sm" label="Email" placeholder="you@company.com" inputType="email" /> },
            {
              title: 'Sections',
              ids: 'Sign-in form',
              node: (
                <div className="flex w-full flex-col gap-sm rounded-sm border border-border-subtle bg-surface-base p-md">
                  <span className="type-body-sm-semibold text-text-primary">Sign in</span>
                  <TextField size="sm" label="Work email" placeholder="you@company.com" inputType="email" />
                  <Button size="sm" label="Continue" fullWidth />
                </div>
              ),
            },
          ].map((l, i) => (
            <div key={l.title} className="flex min-w-0 flex-col gap-md rounded-surface border border-border-subtle bg-surface-sunken p-lg">
              <span className="flex items-center justify-between gap-sm">
                <span className="type-body-sm-semibold text-text-primary">{l.title}</span>
                <span className="type-code-sm-regular text-text-tertiary">{l.ids}</span>
              </span>
              <div className="flex min-h-28 items-center">{l.node}</div>
              {i < 3 && <span className="type-body-xs-regular text-text-tertiary">Used by the next level →</span>}
            </div>
          ))}
        </div>
        <Caption>
          Each level is built from the one before it. An icon and a color make a label and a button, those make a text field, and together they make a sign-in form. Utility pages
          such as <InlineCode>9.1 Doc kit</InlineCode> exist only in Figma, where they draw the documentation itself.
        </Caption>
      </Topic>

      <Topic title="Every page has the same frames">
        <P>Every Figma page lays out its frames from left to right, always in the same order. Most frames match a tab on this site, so you can move between the two without hunting.</P>
        <TableRegion label="Figma frames and site tabs">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Figma frame</Th>
                <Th>On this site</Th>
                <Th>What it holds</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ['.Main', '—', 'Private building blocks that make up the published component. Edit them to change it, but don’t use them in screens.'],
                ['Overview', 'Overview tab', 'The component or foundation in real examples.'],
                ['Component', 'Component tab', 'The published component set with every variant.'],
                ['Tokens', 'Tokens tables', 'Foundation pages only: every variable with its values.'],
                ['Anatomy', 'Anatomy tab', 'Parts, properties, sizes, states and tokens.'],
                ['Guidelines', 'Guidelines tab', 'When and how to use it, dos and don’ts, content and accessibility.'],
                ['—', 'Code tab', 'Site only: copy-ready code for developers.'],
              ].map(([f, s, d]) => (
                <tr key={f + s} className="border-t border-border-subtle">
                  <Td code>{f}</Td>
                  <Td className="whitespace-nowrap">{s}</Td>
                  <Td>{d}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <Caption>Component pages: .Main → Overview → Component → Anatomy → Guidelines. Foundation pages: .Main → Overview → Tokens → Guidelines.</Caption>
      </Topic>

      <Topic title="Components and properties">
        <P>Each component is a single component set. Its properties come from a small, shared vocabulary, named the same way on every component:</P>
        <Bullets
          items={[
            <>
              <InlineCode>Size</InlineCode>, <InlineCode>Emphasis</InlineCode> (primary, secondary, tertiary), <InlineCode>Tone</InlineCode> (brand, danger), <InlineCode>State</InlineCode> (rest,
              hover, pressed, focus, disabled, loading).
            </>,
            <>
              <InlineCode>Selected</InlineCode>, <InlineCode>Checked</InlineCode>, <InlineCode>Status</InlineCode>, <InlineCode>Type</InlineCode>, <InlineCode>Placement</InlineCode>,{' '}
              <InlineCode>Orientation</InlineCode>, <InlineCode>Icon only</InlineCode>.
            </>,
            <>
              Text properties (<InlineCode>Label</InlineCode>, <InlineCode>Supporting text</InlineCode>), <InlineCode>Show {'{part}'}</InlineCode> toggles and <InlineCode>Icon</InlineCode> swaps.
            </>,
          ]}
        />
        <P>For example, one button set covers every size, emphasis, tone and state. Danger is a tone, not a separate component.</P>
        <Visual className="flex flex-col items-center gap-2xl md:flex-row md:items-start">
          <PropertyPanel />
          <div className="grid w-full grid-cols-2 gap-xl">
            {(
              [
                ['Upload', 'primary', 'brand', 'files/cloud-upload'],
                ['Share', 'secondary', 'brand', 'general/share'],
                ['Cancel', 'tertiary', 'brand', undefined],
                ['Delete', 'primary', 'danger', 'general/trash'],
              ] as const
            ).map(([l, e, t, i]) => (
              <div key={l} className="flex flex-col items-start gap-sm">
                <Button label={l} emphasis={e} tone={t} leadingIcon={i} />
                <span className="type-code-sm-regular text-text-tertiary">
                  {e} · {t}
                </span>
              </div>
            ))}
          </div>
        </Visual>
        <H3>The same names in code</H3>
        <P>Developers use the property names you see in Figma, so a hand-off needs no translation table. What you set in the property panel is what they type.</P>
        <TableRegion label="Figma properties and code props">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>In Figma</Th>
                <Th>In code</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Size=lg', 'size="lg"'],
                ['Emphasis=secondary', 'emphasis="secondary"'],
                ['Tone=danger', 'tone="danger"'],
                ['Icon only=true', 'iconOnly'],
                ['Show leading icon=true, Leading icon=check', 'leadingIcon="general/check"'],
                ['State=disabled', 'disabled'],
                ['State=hover, pressed, focus', 'handled by the browser'],
              ].map(([f, c]) => (
                <tr key={f} className="border-t border-border-subtle">
                  <Td code>{f}</Td>
                  <Td code className="text-text-brand">
                    {c}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <Caption>
          Each component’s Anatomy tab lists its properties next to the matching code props, as on <TextLink to={pageTo('2.1')}>2.1 Button</TextLink>.
        </Caption>
      </Topic>

      <Topic title="Auto Layout">
        <P>
          Every component uses Auto Layout, so it resizes with its content, like flexbox in code. A longer label widens the button, hiding an icon closes its gap, and a field stretches
          to fill its container. Padding and gaps use the <InlineCode>space/*</InlineCode> variables.
        </P>
        <Visual className="flex flex-col gap-2xl">
          <div className="flex flex-wrap items-center gap-xl">
            <Button label="Share" leadingIcon="general/share" />
            <Button label="Share with your team" leadingIcon="general/share" />
            <Button label="Share" />
          </div>
          <div className="flex flex-col gap-xl">
            <div className="flex w-full max-w-[17.5rem] flex-col gap-xs">
              <TextField label="Label" placeholder="you@company.com" inputType="email" />
              <span className="type-code-sm-regular text-text-tertiary">Fill · 280</span>
            </div>
            <div className="flex w-full max-w-[35rem] flex-col gap-xs">
              <TextField label="Label" placeholder="you@company.com" inputType="email" />
              <span className="type-code-sm-regular text-text-tertiary">Fill · 560</span>
            </div>
          </div>
        </Visual>
        <Caption>
          Button: Horizontal, gap <InlineCode>{chainOf('button/gap/md')[1] ?? 'button/gap/md'}</InlineCode>, padding <InlineCode>button/padding-x/md</InlineCode> × 0, Hug × Fixed{' '}
          {px('size/control/md')}. Text field: Vertical, gap{' '}
          <InlineCode>space/sm</InlineCode>, Fill width.
        </Caption>
      </Topic>

      <Topic title="One library or several">
        <P>
          One library is easiest while the system is small, and {config.name} is a single library today. Split it when the file gets slow to open or publish, or when different teams own
          different parts. Splitting takes time: components move between files, instances need relinking, and each library is published on its own.
        </P>
        <div className="flex flex-col items-stretch gap-md md:flex-row md:items-center">
          <div className="flex flex-col gap-xs rounded-surface border border-border-subtle p-lg md:flex-1">
            <span className="type-body-sm-semibold text-text-primary">{config.name}</span>
            <span className="type-body-xs-regular text-text-secondary">Foundations · Parts · Components · Sections</span>
          </div>
          <Icon name="arrows/arrow-right" className="self-center rotate-90 text-icon-tertiary md:rotate-0" />
          <div className="flex flex-col gap-xs rounded-surface border border-border-brand-subtle bg-fill-brand-subtle p-lg md:flex-1">
            <span className="type-body-sm-semibold text-text-primary">{shortName ? `${shortName} Core` : 'Core library'}</span>
            <span className="type-body-xs-regular text-text-secondary">Foundations · Parts</span>
          </div>
          <span className="type-body-xs-medium self-center text-text-tertiary">← used by</span>
          <div className="flex flex-col gap-xs rounded-surface border border-border-subtle p-lg md:flex-1">
            <span className="type-body-sm-semibold text-text-primary">{shortName ? `${shortName} Product` : 'Product library'}</span>
            <span className="type-body-xs-regular text-text-secondary">Components · Sections</span>
          </div>
        </div>
        <Caption>If you split, decide which levels go where, keeping lower levels independent of higher ones. Move components together with their variables and styles, relink instances, then publish both libraries and check one product file end to end.</Caption>
      </Topic>

      <Topic title="What variables are">
        <P>
          Components use named, reusable values (colors, numbers, strings) instead of raw ones. Change a variable once, and everything that uses it updates.
        </P>
        <BrandSwapDemo />
        <Caption>
          One change to <InlineCode>color/fill/brand/solid</InlineCode> updates the button, checkbox, switch and progress bar at once. The preview changes only the resting color,
          because hover and pressed have their own variables.
        </Caption>
      </Topic>

      <Topic title="Modes">
        <P>
          Each variable holds one value per mode. The <strong className="text-text-primary">Color</strong> collection has Light and Dark. Set a frame to Dark and every variable switches
          to its dark value, so you never need a separate “dark” version of a component.
        </P>
        <div className="grid gap-xl md:grid-cols-2">
          <ModeFrame mode="Light">
            <InviteCard />
          </ModeFrame>
          <ModeFrame mode="Dark">
            <InviteCard />
          </ModeFrame>
        </div>
        <P>
          The <strong className="text-text-primary">Motion</strong> collection has Standard and Reduced. Reduced swaps movement for instant changes or short fades, for people who turn on
          reduced motion. Set it on a frame the same way to check what they see.
        </P>
        <TableRegion label="Motion values in Standard and Reduced">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Variable</Th>
                <Th>Standard</Th>
                <Th>Reduced</Th>
                <Th>Used for</Th>
              </tr>
            </thead>
            <tbody>
              {tokens.variables
                .filter((t) => t.name.startsWith('motion/duration/'))
                .map((t) => (
                  <tr key={t.name} className="border-t border-border-subtle">
                    <Td code>{t.name}</Td>
                    <Td code>{t.modes.Standard?.value}</Td>
                    <Td code>{t.modes.Reduced?.value}</Td>
                    <Td>{t.description}</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableRegion>
        <Caption>
          See <TextLink to={pageTo('1.6')}>1.6 Motion</TextLink> for more.
        </Caption>
      </Topic>

      <Topic title="Edit a variable">
        <Steps
          items={[
            <>Open the local variables: deselect everything, then click Variables in the right panel.</>,
            <>
              Choose a collection, for example <strong className="text-text-primary">Color</strong>.
            </>,
            <>Find the variable by name, then change its value or alias in the column for the mode you want.</>,
            <>Check real components in both modes before you publish the library update.</>,
          ]}
        />
        <TableRegion label="Color collection as seen in the variables panel">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Name</Th>
                <Th>Light</Th>
                <Th>Dark</Th>
              </tr>
            </thead>
            <tbody>
              {['color/text/primary', 'color/text/secondary', 'color/text/tertiary'].map((n) => {
                const t = v(n);
                return (
                  <tr key={n} className="border-t border-border-subtle">
                    <Td code>{n}</Td>
                    {(['Light', 'Dark'] as const).map((m) => (
                      <Td key={m} code>
                        <span className="inline-flex items-center gap-sm">
                          <span aria-hidden className="size-4 rounded-xs border border-border-subtle" style={{ background: t?.modes[m]?.value }} />
                          {short(t?.modes[m]?.alias)}
                        </span>
                      </Td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableRegion>
        <P>
          Primitives (<InlineCode>palette/*</InlineCode>, <InlineCode>scale/*</InlineCode>) are hidden from pickers. Change them only when the brand changes. Most edits change a
          semantic variable’s alias in one mode.
        </P>
      </Topic>

      <Topic title="Variables and styles">
        <P>
          A variable holds one value. A text, effect or grid style bundles several values into one asset, and uses variables for them where it can. Primitives feed semantic variables,
          and those feed styles and components.
        </P>
        <Visual className="flex flex-col gap-lg">
          <Chain items={[...chainOf('color/fill/brand/solid').reverse(), 'Button fill']} />
          <Chain items={[...[...bodySize].reverse(), 'type/body/md/regular']} />
        </Visual>
        <div className="grid gap-xl md:grid-cols-2">
          <DoDont kind="do" caption="Bind to the role, color/fill/brand/solid, so Dark mode, contrast fixes and brand changes reach it automatically.">
            <Button label="Upgrade" />
          </DoDont>
          <DoDont kind="dont" caption={`Bind straight to ${brandPrimitive}. It won’t change in Dark mode, or when the brand ramp is re-tuned for one role.`}>
            <Button label="Upgrade" style={{ background: `var(${brandPrimitiveCss})` }} />
          </DoDont>
        </div>
      </Topic>

      <Topic title="Do you need variables?">
        <P>
          Variables give you theming, shared meaning and a match with code, but they take time to set up and maintain. {config.name} uses them because it has {numberWord(colorModes.length)} color{' '}
          {colorModes.length === 1 ? 'mode' : 'modes'}, {numberWord(motionModes.length)} motion {motionModes.length === 1 ? 'mode' : 'modes'} and a code library that reads the same
          names. Starting a new file outside the system? Ask the same question:
        </P>
        <div className="grid gap-md sm:grid-cols-2">
          <div className="flex flex-col gap-xs rounded-surface border border-border-brand-subtle bg-fill-brand-subtle p-lg">
            <span className="type-body-sm-semibold text-text-primary">Several modes, brands or tokens in code</span>
            <span className="type-body-sm-regular text-text-secondary">→ Variables</span>
          </div>
          <div className="flex flex-col gap-xs rounded-surface border border-border-subtle p-lg">
            <span className="type-body-sm-semibold text-text-primary">A small file with one theme</span>
            <span className="type-body-sm-regular text-text-secondary">→ Styles, or a light token layer, may be enough</span>
          </div>
        </div>
        <Caption>
          For collections, naming, modes and the primitive palette, see <TextLink to="/guidance/02-tokens">02 Tokens</TextLink>.
        </Caption>
      </Topic>
    </Column>
  );
}

/* ---------- For developers ---------- */
function ForDevelopers() {
  return (
    <Column>
      <Topic title="Install the package">
        <P>
          Everything ships in one npm package, <InlineCode>{config.packageName}</InlineCode>: the React components, the tokens as CSS variables, the Tailwind theme and a design-token
          file. Your app needs React 19 and Tailwind CSS 4.
        </P>
        <CodeBlock lang="sh" code={`npm install ${config.packageName}`} />
        <Caption>
          Peer dependencies: <InlineCode>react</InlineCode> and <InlineCode>react-dom</InlineCode> 19 or later, <InlineCode>tailwindcss</InlineCode> 4 or later.
        </Caption>
      </Topic>

      <Topic title="Add the styles">
        <P>In your app’s main CSS file, import Tailwind first, then the system’s stylesheet. That one import gives you everything the components need:</P>
        <Bullets
          items={[
            <>The tokens as CSS variables, with Light, Dark and Reduced motion values</>,
            <>The Tailwind theme mapping, so token names become utilities</>,
            <>
              The state variants <InlineCode>is-hover</InlineCode>, <InlineCode>is-pressed</InlineCode>, <InlineCode>is-focus</InlineCode>, <InlineCode>is-focus-within</InlineCode>,{' '}
              <InlineCode>is-disabled</InlineCode> and <InlineCode>dark</InlineCode>
            </>,
            <>The text-style and motion utilities</>,
            <>
              An <InlineCode>@source</InlineCode>, so Tailwind generates the classes the components use
            </>,
          ]}
        />
        <CodeBlock
          lang="css"
          code={`/* app.css */
@import "tailwindcss";
@import "${config.packageName}/styles.css";`}
        />
        <P>Not using Tailwind? Import the variables on their own. Tools that read design tokens can use the DTCG file.</P>
        <CodeBlock
          lang="css"
          code={`/* Variables only, no utilities */
@import "${config.packageName}/tokens.css";

/* Design tokens (DTCG JSON) for other tools */
/* ${config.packageName}/tokens.json */`}
        />
      </Topic>

      <Topic title="Load the fonts">
        {config.fontStylesheets.length ? (
          <>
            <P>
              Text styles use{' '}
              {joinList(webFonts.map((f) => (f.weights.length ? `${f.label} (${f.weights.length > 1 ? 'weights ' : 'weight '}${joinList(f.weights)})` : f.label)))}. Load{' '}
              {webFonts.length > 1 ? 'them' : 'it'} before your app renders:
            </P>
            <CodeBlock lang="html" code={fontLinks} />
          </>
        ) : (
          <>
            <P>
              Text styles use each platform’s system fonts, so there’s nothing to load. To move to a web font, load its stylesheet and point the family token at it:
            </P>
            <CodeBlock
              lang="html"
              code={`<link rel="stylesheet" href="https://fonts.example.com/your-typeface.css" />

<style>
  :root { --font-family-ui: "Your Typeface", ui-sans-serif, system-ui, sans-serif; }
</style>`}
            />
            <Caption>
              To change it for everyone, set <InlineCode>font/family/ui</InlineCode> in Figma and regenerate the tokens, so designs and code keep the same typeface.
            </Caption>
          </>
        )}
      </Topic>

      <Topic title="Use a component">
        <P>
          Import components by name. Props are the Figma properties in camelCase, so you can read values straight from a design: <InlineCode>Size=lg</InlineCode> becomes{' '}
          <InlineCode>size="lg"</InlineCode>.
        </P>
        <CodeBlock
          code={`import { Button } from '${config.packageName}';

// Figma: Button · Size=lg, Emphasis=primary, Tone=brand, Show leading icon=true
<Button size="lg" leadingIcon="general/check" label="Save changes" />`}
        />
        <Caption>
          Each component’s Code tab has copy-ready code for every example, and its Anatomy tab lists every prop. Try <TextLink to={`${pageTo('2.1')}?tab=code`}>2.1 Button → Code</TextLink>.
        </Caption>
      </Topic>

      <Topic title="Switch color and motion modes">
        <P>
          Color modes follow the <InlineCode>data-theme</InlineCode> attribute. Set it on <InlineCode>&lt;html&gt;</InlineCode> for the whole app, or on any element to theme only that
          part of the page.
        </P>
        <CodeBlock
          code={`document.documentElement.dataset.theme = 'dark'; // 'light' | 'dark'

<section data-theme="dark">…always dark…</section>`}
        />
        <P>
          Reduced motion follows the operating system setting. To force it, for example from an in-app preference, set <InlineCode>data-motion="reduced"</InlineCode>.
        </P>
        <CodeBlock code={`document.documentElement.dataset.motion = 'reduced';`} />
      </Topic>

      <Topic title="Use tokens in your own layouts">
        <P>
          When the components don’t cover something, build it with tokens rather than raw values, so it follows the modes and the brand. Every token is also a Tailwind utility, named
          after the Figma variable with dashes for slashes.
        </P>
        <CodeBlock
          code={`<div className="rounded-surface bg-surface-raised p-xl shadow-raised">
  <h2 className="type-heading-sm-semibold text-text-primary">Seats</h2>
  <p className="type-body-sm-regular text-text-tertiary">8 of 10 seats used</p>
</div>`}
        />
        <P>Outside Tailwind, use the CSS variables directly.</P>
        <CodeBlock
          lang="css"
          code={`.usage-card {
  color: var(--color-text-primary);
  padding: var(--space-md);
}`}
        />
        <H3>Watch out for size-named widths</H3>
        <P>
          The spacing scale runs from <InlineCode>{spaceSteps[0]}</InlineCode> to <InlineCode>{spaceSteps.at(-1)}</InlineCode>, so Tailwind’s size-named widths pick up spacing tokens:{' '}
          <InlineCode>max-w-md</InlineCode> is {px('space/md')} px here, not 28 rem. Use an explicit value or a size token instead.
        </P>
        <div className="grid gap-xl md:grid-cols-2">
          <DoDont kind="do" caption="max-w-[40rem] or max-w-(--size-measure-reading)" />
          <DoDont kind="dont" caption={`max-w-md or w-xl, which are spacing tokens here (${px('space/md')} px, ${px('space/xl')} px)`} />
        </div>
        <Caption>
          Find every token with its CSS variable and Tailwind class in <TextLink to="/guidance/02-tokens?tab=reference">02 Tokens → Reference</TextLink>.
        </Caption>
      </Topic>

      <Topic title="Versions and updates">
        <P>
          The package follows semantic versioning. Patch versions fix bugs, minor versions add components, variants and tokens, and major versions may remove or rename things. Beta
          components are the exception: their props may change in a minor version while they’re being tested.
        </P>
        <Caption>
          Read the <TextLink to="/guidance/03-changelog">changelog</TextLink> before you upgrade.
        </Caption>
      </Topic>

      <Topic title="Keeping in sync with Figma">
        <P>
          Figma is the source of truth. When variables or styles change there, the maintainers regenerate the code formats and publish a new version. Components hold no raw values, so
          they update without edits. Don’t edit the generated files by hand: the next export overwrites them.
        </P>
        <Steps
          items={[
            <>
              Run <InlineCode>scripts/figma-export.js</InlineCode> on the Figma file and save the result as <InlineCode>tokens/figma-variables.json</InlineCode>.
            </>,
            <>
              Run <InlineCode>npm run tokens</InlineCode>. It writes <InlineCode>src/styles/tokens.css</InlineCode>, <InlineCode>src/tokens/tokens.gen.ts</InlineCode> and{' '}
              <InlineCode>tokens/tokens.dtcg.json</InlineCode>.
            </>,
            <>Check the changed components on this site in both modes, then publish the release with its changelog entry.</>,
          ]}
        />
        <CodeBlock lang="sh" code="npm run tokens" />
      </Topic>
    </Column>
  );
}

/* ---------- For developers, app code (products 'app' and 'both') ---------- */
type AppCode = Record<AppPlatform, string>;

function AppCodeBlock({ code, platform }: { code: AppCode; platform: AppPlatform }) {
  const p = APP_PLATFORMS.find((x) => x.value === platform)!;
  return <CodeBlock lang={p.lang} code={code[platform]} label={`${p.label} code`} />;
}

function ForAppDevelopers() {
  const [platform, setPlatform] = useState<AppPlatform>('reactNative');
  return (
    <Column>
      <Segmented label="Code for" options={APP_PLATFORMS} value={platform} onChange={setPlatform} />

      <Topic title="Code on this site">
        <P>
          Every component page has a Code tab with each example in React Native, Swift (SwiftUI) and Kotlin (Jetpack Compose). The previews are the React Native version, and the
          Swift and Kotlin code uses the same props, so all three look and behave the same.
        </P>
        <Caption>
          Try <TextLink to={`${pageTo('2.1')}?tab=code`}>2.1 Button → Code</TextLink>.
        </Caption>
      </Topic>

      <Topic title="Props are the Figma properties">
        <P>
          Props use the Figma property names, in each language’s own style, so you can read values straight from a design: <InlineCode>Size=lg</InlineCode> is{' '}
          <InlineCode>size="lg"</InlineCode> in React Native, <InlineCode>size: .lg</InlineCode> in Swift and <InlineCode>DsSize.Lg</InlineCode> in Kotlin.
        </P>
        <AppCodeBlock
          platform={platform}
          code={{
            reactNative: `// Figma: Button · Size=lg, Emphasis=primary, Tone=brand, Show leading icon=true
<Button size="lg" leadingIcon="general/check" label="Save changes" onPress={save} />`,
            swift: `// Figma: Button · Size=lg, Emphasis=primary, Tone=brand, Show leading icon=true
DSButton("Save changes", size: .lg, leadingIcon: .check) { save() }`,
            kotlin: `// Figma: Button · Size=lg, Emphasis=primary, Tone=brand, Show leading icon=true
DsButton(label = "Save changes", onClick = ::save, size = DsSize.Lg, leadingIcon = DsIcons.Check)`,
          }}
        />
      </Topic>

      <Topic title="Token names">
        <P>
          Values come from tokens, never typed numbers or colors, so screens follow the modes and the brand. Token names are the Figma variable names in camelCase:{' '}
          <InlineCode>color/text/primary</InlineCode> is <InlineCode>textPrimary</InlineCode>. Find every token in{' '}
          <TextLink to="/guidance/02-tokens?tab=reference">02 Tokens → Reference</TextLink>.
        </P>
        <AppCodeBlock
          platform={platform}
          code={{
            reactNative: `const theme = useTheme();
<View style={{ padding: dimensions.space.xl, backgroundColor: theme.color.surfaceRaised }}>
  <Text style={[theme.text('headingSmSemibold'), { color: theme.color.textPrimary }]}>Seats</Text>
</View>`,
            swift: `Text("Seats")
    .dsTextStyle(DSTokens.TextStyle.headingSmSemibold)
    .dsForeground(DSTokens.Color.textPrimary)
    .padding(DSTokens.Space.xl)
    .dsBackground(DSTokens.Color.surfaceRaised)`,
            kotlin: `Column(Modifier.background(DsTheme.colors.surfaceRaised).padding(DsSpace.xl)) {
    Text("Seats", style = DsTheme.textStyle(DsTextStyles.headingSmSemibold), color = DsTheme.colors.textPrimary)
}`,
          }}
        />
      </Topic>

      <Topic title="Color mode, text size and motion">
        <P>
          Components follow the phone’s Light or Dark setting, its text size and its Reduce motion setting. To keep one part of a screen in one mode, like a dark promo card in a
          light screen, the code wraps that part:
        </P>
        <AppCodeBlock
          platform={platform}
          code={{
            reactNative: `<ThemeScope scheme="dark">{/* always dark */}</ThemeScope>`,
            swift: `PromoCard()
    .dsTheme(colorScheme: .dark)`,
            kotlin: `DsTheme(darkTheme = true, reducedMotion = DsTheme.reducedMotion) {
    PromoCard()
}`,
          }}
        />
        <Caption>
          How each component behaves on iOS and Android, like its touch area and what screen readers announce, is in the “In apps” section of its Guidelines tab.
        </Caption>
      </Topic>

      <Topic title="Keeping in sync with Figma">
        <P>
          Figma is the source of truth. Component, prop and token names in the code are the Figma names, so when a variable or a component changes in Figma, this site and its code
          change with it.
        </P>
      </Topic>
    </Column>
  );
}

/** For developers: the web guide, the app guide, or both with a Web / App switch (`?platform=app`). */
function Developers() {
  const [params, setParams] = useSearchParams();
  const app = productHasApp && (!productHasWeb || params.get('platform') === 'app');
  if (!(productHasWeb && productHasApp)) return app ? <ForAppDevelopers /> : <ForDevelopers />;
  return (
    <div className="flex flex-col gap-3xl">
      <Segmented
        label="Developers on"
        options={[
          { value: 'web', label: 'Web' },
          { value: 'app', label: 'App' },
        ]}
        value={app ? 'app' : 'web'}
        onChange={(p) =>
          setParams((prev) => {
            const n = new URLSearchParams(prev);
            if (p === 'app') n.set('platform', 'app');
            else n.delete('platform');
            return n;
          }, { replace: true })
        }
      />
      {app ? <ForAppDevelopers /> : <ForDevelopers />}
    </div>
  );
}

export default function GettingStarted() {
  return (
    <DocPage
      eyebrow="Guidance › 01 Getting started"
      title="Getting started"
      description={`What’s in the ${config.name}, how mature each part is, and where designers, developers and product managers should start.`}
      figmaNode={figmaNodeFor('01')}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'For designers', render: () => <ForDesigners /> },
        { label: 'For developers', render: () => <Developers /> },
      ]}
    />
  );
}
