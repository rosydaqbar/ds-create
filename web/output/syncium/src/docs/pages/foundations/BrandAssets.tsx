import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { config } from '@/ds.config';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { Avatar, Flag, SocialButton, SocialMark, socialProviderName, socialProviders, type SocialProvider } from '@/components';
import { AnchorHeading, DocPage, Topics } from '../../DocPage';
import { Caption, CodeBlock, InlineCode, P } from '../../blocks';
import { pageMeta } from '../../meta';
import type { Topic } from '../../types';

/* ---------- data ---------- */
const base = import.meta.env.BASE_URL;
const src = (p: string) => `${base}${p}`;
const product = config.name.replace(/ Design System$/, '');

/** Flags supplied in public/brand/flags/ (ISO 3166 codes). */
const flagCodes = Object.keys(import.meta.glob('/public/brand/flags/*.svg', { query: '?url', import: 'default' }))
  .map((p) => p.replace(/^.*\/([a-z-]+)\.svg$/i, '$1').toLowerCase())
  .sort();
const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

const vars = new Map(tokens.variables.map((v) => [v.name, v]));
const hex = (name: string) => vars.get(name)?.modes.Light?.value ?? '#000000';
function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const x = h.replace('#', '').slice(0, 6);
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [p, q] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (p + 0.05) / (q + 0.05);
}
const facebookRatio = contrast(hex('social-button/facebook/fill'), hex('social-button/facebook/fg'));

/* ---------- small pieces ---------- */
type Mode = 'light' | 'dark';
function Surface({ mode, children, className, label }: { mode: Mode; children: ReactNode; className?: string; label?: string }) {
  return (
    <div data-theme={mode} className={cn('flex min-w-0 flex-col gap-lg rounded-surface border border-border-subtle bg-surface-base p-xl text-text-primary', className)}>
      {label !== '' && <span className="type-body-xs-semibold text-text-tertiary">{label ?? (mode === 'light' ? 'Light surface' : 'Dark surface')}</span>}
      {children}
    </div>
  );
}

/** The lockup. `auto` picks the version for the colour mode around it. */
function Lockup({ mode = 'auto', className, style }: { mode?: Mode | 'auto'; className?: string; style?: CSSProperties }) {
  if (mode === 'auto')
    return (
      <>
        <img src={src(config.logo.light)} alt={product} className={cn('block h-10 w-auto dark:hidden', className)} style={style} />
        <img src={src(config.logo.dark)} alt={product} className={cn('hidden h-10 w-auto dark:block', className)} style={style} />
      </>
    );
  return <img src={src(mode === 'light' ? config.logo.light : config.logo.dark)} alt={product} className={cn('block h-10 w-auto', className)} style={style} />;
}
function Mark({ className, alt = product }: { className?: string; alt?: string }) {
  return <img src={src(config.logo.mark)} alt={alt} className={cn('block size-12', className)} />;
}

/* ---------- Overview ---------- */
function LogoSection() {
  return (
    <section className="flex flex-col gap-lg">
      <AnchorHeading>Logo</AnchorHeading>
      <P>
        The {product} lockup pairs the wordmark with the sync glyph. Use it where the product signs its name: the app header, the cover and sign-in screens. The mark
        is the glyph alone, for small spaces such as avatars, favicons and app chrome. Each has a version for light surfaces and one for dark.
      </P>
      <div className="grid gap-lg md:grid-cols-2">
        {(['light', 'dark'] as const).map((m) => (
          <Surface key={m} mode={m}>
            <div className="flex min-h-32 items-center justify-center">
              <Lockup mode={m} />
            </div>
            <Caption>Lockup · {m === 'light' ? config.logo.light : config.logo.dark}</Caption>
          </Surface>
        ))}
        {(['light', 'dark'] as const).map((m) => (
          <Surface key={m} mode={m} label={m === 'light' ? 'Light surface' : 'Dark surface'}>
            <div className="flex min-h-24 items-center justify-center">
              <Mark />
            </div>
            <Caption>Mark · {config.logo.mark}. There’s only one version: on the darkest surfaces the disc blends into the page and the glyph carries the mark.</Caption>
          </Surface>
        ))}
      </div>
    </section>
  );
}

function ClearSpace() {
  return (
    <section className="flex flex-col gap-lg">
      <AnchorHeading>Clear space and minimum size</AnchorHeading>
      <P>
        Leave empty space around the logo equal to the mark’s height on every side, so nothing crowds it. Keep the mark at 16 pixels or larger and the lockup at
        least 24 pixels high. Any smaller and the glyph’s curves close up.
      </P>
      <div className="grid gap-lg lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col items-center justify-center gap-md rounded-surface border border-border-subtle bg-surface-sunken p-xl">
          <div className="relative max-w-full overflow-hidden border border-dashed border-border-brand p-10" aria-label={`${product} lockup with clear space equal to the mark height`} role="img">
            <span aria-hidden className="absolute top-0 left-1/2 h-10 w-px -translate-x-1/2 bg-border-brand" />
            <span aria-hidden className="absolute top-1/2 left-0 h-px w-10 -translate-y-1/2 bg-border-brand" />
            <div className="bg-surface-base">
              <Lockup className="max-w-full" />
            </div>
          </div>
          <Caption>Clear space = mark height on every side</Caption>
        </div>
        <div className="flex flex-col justify-center gap-xl rounded-surface border border-border-subtle bg-surface-sunken p-xl">
          <div className="flex items-end gap-2xl">
            <div className="flex flex-col items-start gap-xs">
              <img src={src(config.logo.mark)} alt={`${product} mark at minimum size`} className="block size-[16px]" />
              <span className="type-code-sm-regular text-text-secondary">mark 16</span>
            </div>
            <div className="flex flex-col items-start gap-xs">
              <img src={src(config.logo.light)} alt={`${product} lockup at minimum size`} className="block h-[24px] w-auto dark:hidden" />
              <img src={src(config.logo.dark)} alt={`${product} lockup at minimum size`} className="hidden h-[24px] w-auto dark:block" />
              <span className="type-code-sm-regular text-text-secondary">lockup 24 high</span>
            </div>
          </div>
          <Caption>Minimum sizes, shown at 1×.</Caption>
        </div>
      </div>
    </section>
  );
}

function SocialMarks() {
  return (
    <section className="flex flex-col gap-lg">
      <AnchorHeading>Social marks</AnchorHeading>
      <P>
        These are the sign-in providers the Social button (3.7) supports: {socialProviders.map((p) => socialProviderName[p]).join(', ')}. Each mark keeps its owner’s
        colors and proportions. For a quieter row, use the mono version: a single color that follows the icon color roles. Near-black marks follow the text color so
        they stay visible on dark surfaces. Their owners allow either black or white.
      </P>
      <div className="grid gap-lg md:grid-cols-2">
        {(['light', 'dark'] as const).map((m) => (
          <Surface key={m} mode={m}>
            <div className="grid grid-cols-3 gap-lg">
              {socialProviders.map((p) => (
                <div key={p} className="flex flex-col items-center gap-sm">
                  <span className="flex items-center gap-md">
                    <SocialMark provider={p} size="lg" alt={`${socialProviderName[p]} (color)`} />
                    <SocialMark provider={p} size="lg" mono className="text-icon-secondary" alt={`${socialProviderName[p]} (mono)`} />
                  </span>
                  <span className="type-body-xs-medium text-text-secondary">{socialProviderName[p]}</span>
                </div>
              ))}
            </div>
            <Caption>Color, then mono, for each provider.</Caption>
          </Surface>
        ))}
      </div>
    </section>
  );
}

function Flags() {
  return (
    <section className="flex flex-col gap-lg">
      <AnchorHeading>Flags</AnchorHeading>
      <P>
        Use these round flags for the regions where {product} bills and stores data, in badges, tags and country selectors. There are {flagCodes.length}, each named
        by its ISO 3166 code. Always show a flag with the country name.
      </P>
      <ul className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
        {flagCodes.map((c) => (
          <li key={c} className="flex items-center gap-md rounded-control border border-border-subtle p-md">
            <Flag country={c} size="lg" alt="" />
            <span className="flex flex-col">
              <span className="type-body-sm-medium text-text-primary">{countryName(c)}</span>
              <span className="type-code-sm-regular text-text-tertiary">{c}.svg</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Overview() {
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-lg">
        <AnchorHeading>About brand assets</AnchorHeading>
        <P>
          The {product} logo, provider marks and flags are the one place in the system where raw colors and shapes are allowed, because the artwork belongs to its
          owners. Each asset is a file in <InlineCode>public/brand/</InlineCode>, exported from the Figma file, so replacing a file updates it everywhere.
        </P>
      </section>
      <LogoSection />
      <ClearSpace />
      <SocialMarks />
      <Flags />
    </div>
  );
}

/* ---------- Guidelines ---------- */
const INVENTORY: { kind: string; sample: ReactNode; count: string; use: string; status: string; tone: 'ok' | 'warn' | 'off' }[] = [
  { kind: 'Product logo', sample: <Mark className="size-8" alt="" />, count: 'Two lockups and a mark', use: 'App header, cover, sign-in', status: 'Supplied · recreated from the brand guideline', tone: 'ok' },
  { kind: 'Social marks', sample: <SocialMark provider="google" size="xl" alt="" />, count: `${socialProviders.length} providers, in color and mono`, use: 'Social button (3.7), menus', status: 'Sourced · approval needed', tone: 'warn' },
  { kind: 'Flags', sample: <Flag country={flagCodes[0] ?? 'gb'} size="xl" alt="" />, count: `${flagCodes.length} countries`, use: 'Country selector, phone input, badges', status: 'Supplied', tone: 'ok' },
  { kind: 'Integration and payment marks', sample: <Icon name="general/plug" size="xl" className="text-icon-tertiary" />, count: 'In Figma', use: 'Integration menus, billing settings', status: 'In Figma · neutral stand-ins in code', tone: 'warn' },
  { kind: 'File types, app-store badges, partner logos', sample: <Icon name="files/file" size="xl" className="text-icon-disabled" />, count: '—', use: 'Not needed yet', status: 'Skipped on purpose', tone: 'off' },
];

function Inventory() {
  return (
    <div className="grid w-full gap-lg sm:grid-cols-2 lg:grid-cols-3">
      {INVENTORY.map((i) => (
        <div key={i.kind} className="flex flex-col gap-md rounded-surface border border-border-subtle bg-surface-base p-lg">
          <span className="flex h-10 items-center">{i.sample}</span>
          <span className="type-body-sm-semibold text-text-primary">{i.kind}</span>
          <span className="type-body-xs-regular text-text-secondary">{i.count}</span>
          <span className="type-body-xs-regular text-text-secondary">Used in: {i.use}</span>
          <span
            className={cn(
              'type-body-xs-semibold self-start rounded-indicator px-md py-xxs',
              i.tone === 'ok' ? 'bg-fill-success-subtle text-text-success' : i.tone === 'warn' ? 'bg-fill-warning-subtle text-text-warning' : 'bg-fill-neutral-subtle text-text-secondary',
            )}
          >
            {i.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function SharedLogo() {
  const uses: [string, ReactNode][] = [
    [
      'App header',
      <span key="h" className="flex w-full items-center justify-between rounded-control border border-border-subtle bg-surface-base px-md py-sm">
        <Lockup className="h-5" />
        <Icon name="users/user-circle" size="md" className="text-icon-secondary" />
      </span>,
    ],
    [
      'Sign-in card',
      <span key="s" className="flex w-full flex-col items-center gap-sm rounded-control border border-border-subtle bg-surface-base p-md">
        <Mark className="size-8" alt="" />
        <span className="type-body-xs-semibold text-text-primary">Welcome back</span>
      </span>,
    ],
    ['Avatar', <Avatar key="a" size="lg" type="image" src={src(config.logo.mark)} alt={`${product} workspace`} />],
    [
      'Cover',
      <span key="c" data-theme="dark" className="flex w-full items-center justify-center rounded-control bg-surface-base p-lg">
        <Lockup mode="dark" className="h-5" />
      </span>,
    ],
  ];
  return (
    <div className="flex w-full flex-col items-center gap-lg">
      <span className="flex flex-col items-center gap-xs rounded-surface border-2 border-dashed border-border-brand bg-surface-base px-xl py-lg">
        <Lockup className="h-6" />
        <span className="type-code-sm-regular text-text-secondary">public/{config.logo.light}</span>
      </span>
      <Icon name="arrows/arrow-down" size="md" className="text-icon-tertiary" />
      <div className="grid w-full gap-lg sm:grid-cols-2 lg:grid-cols-4">
        {uses.map(([label, node]) => (
          <div key={label} className="flex flex-col items-center gap-sm">
            <div className="flex h-24 w-full items-center justify-center">{node}</div>
            <span className="type-body-xs-medium text-text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="grid w-full gap-lg sm:grid-cols-2 lg:grid-cols-4">
      {items.map((t, i) => (
        <li key={t} className="flex flex-col gap-sm rounded-surface border border-border-subtle bg-surface-base p-lg">
          <span className="inline-flex size-(--size-control-xs) items-center justify-center rounded-full bg-fill-brand-subtle type-body-sm-semibold text-text-brand">{i + 1}</span>
          <span className="type-body-sm-regular text-text-primary">{t}</span>
        </li>
      ))}
    </ol>
  );
}

/** Optical sizing: the same marks forced to one box, then given their own heights. */
const OPTICAL: Record<SocialProvider, number> = { google: 30, apple: 34, github: 32, facebook: 31, x: 27, gitlab: 33 };
function OpticalSizing() {
  return (
    <div className="flex w-full flex-col gap-2xl">
      <div className="flex flex-col gap-sm">
        <span className="type-body-sm-semibold text-text-primary">1 · Without optical sizing: every mark in a 32-pixel box</span>
        <div className="flex flex-wrap items-center gap-2xl">
          {socialProviders.map((p) => (
            <SocialMark key={p} provider={p} size="xl" alt={socialProviderName[p]} />
          ))}
        </div>
        <Caption>The dense, square X looks heaviest, and the tall, narrow Apple mark looks smallest.</Caption>
      </div>
      <div className="flex flex-col gap-sm">
        <span className="type-body-sm-semibold text-text-primary">2 · Optically resized, 3 · with the heights used, 4 · on shared guides</span>
        <div className="flex flex-wrap gap-2xl">
          {socialProviders.map((p) => (
            <span key={p} className="flex flex-col items-center gap-xs">
              <span className="relative flex h-[36px] items-center">
                <span aria-hidden className="absolute inset-x-[-0.75rem] top-[1px] h-px bg-border-brand" />
                <span aria-hidden className="absolute inset-x-[-0.75rem] bottom-[1px] h-px bg-border-brand" />
                <SocialMark provider={p} alt={socialProviderName[p]} style={{ width: OPTICAL[p], height: OPTICAL[p] }} />
              </span>
              <span className="type-code-sm-regular text-text-tertiary">{OPTICAL[p]}</span>
            </span>
          ))}
        </div>
        <Caption>Heights from 27 to 34 pixels give every mark the same visual weight. Avoid forcing every mark to one height, or they’ll look uneven.</Caption>
      </div>
    </div>
  );
}

const TOPICS: Topic[] = [
  {
    title: 'What’s on this page and why',
    body: 'This page holds only the kinds of assets the product needs, each with where it’s used and its status. Add a new kind when the product needs it, not to make the library look complete.',
    render: () => <Inventory />,
  },
  {
    title: 'Logos are shared assets',
    body: `Each logo lives in a single file. Components and pages point to it through the system config, so replacing the approved artwork there updates every screen that uses it.`,
    render: () => <SharedLogo />,
  },
  {
    title: 'Replacing placeholder logos',
    body: 'The current lockup is a vector recreation from the brand guideline. When the source files arrive, swap them in without touching any component.',
    render: () => (
      <div className="flex w-full flex-col gap-lg">
        <Steps
          items={[
            'Open the Logo component on the 1.8 Brand assets page of the Figma file.',
            'Replace the artwork inside it, keeping the container and sizing.',
            'Export it as an SVG, replacing the same file in public/brand/.',
            'Check the header, sign-in and cover screens.',
          ]}
        />
        <CodeBlock
          label="Brand asset config"
          code={`// src/ds.config.ts
logo: { light: '${config.logo.light}', dark: '${config.logo.dark}', mark: '${config.logo.mark}' },`}
        />
      </div>
    ),
  },
  {
    title: 'Choose the version by surface',
    body: 'Use the light version on light surfaces and the dark version on dark ones. Keep the logo as drawn: don’t recolor, invert, outline, crop or stretch it, or add effects.',
    render: () => (
      <div className="grid w-full gap-lg sm:grid-cols-2">
        {[
          { ok: true, t: 'Keep its proportions.', node: <Lockup className="h-8" /> },
          { ok: false, t: 'Don’t stretch it.', node: <Lockup className="h-8" style={{ transform: 'scaleX(1.5)', transformOrigin: 'center' }} /> },
          { ok: true, t: 'Keep the original colors.', node: <Lockup className="h-8" /> },
          { ok: false, t: 'Don’t recolor it.', node: <Lockup className="h-8" style={{ filter: 'hue-rotate(150deg) saturate(1.6)' }} /> },
        ].map((v) => (
          <div key={v.t} className="flex flex-col gap-sm">
            <div className={cn('flex h-24 items-center justify-center overflow-hidden rounded-control border-b-4 bg-surface-base', v.ok ? 'border-b-border-success' : 'border-b-border-danger')}>{v.node}</div>
            <span className="flex items-center gap-sm type-body-sm-regular text-text-secondary">
              <Icon name={v.ok ? 'alerts/check-circle' : 'alerts/x-circle'} size="sm" className={v.ok ? 'text-icon-success' : 'text-icon-danger'} />
              {v.t}
            </span>
          </div>
        ))}
      </div>
    ),
    do: {
      caption: 'Dark version on a dark surface.',
      render: () => (
        <span data-theme="dark" className="flex w-full items-center justify-center rounded-control bg-surface-base p-xl">
          <Lockup mode="dark" className="h-8" />
        </span>
      ),
    },
    dont: {
      caption: 'Don’t put the light-surface version on a dark surface. The purple disappears.',
      render: () => (
        <span data-theme="dark" className="flex w-full items-center justify-center rounded-control bg-surface-base p-xl">
          <Lockup mode="light" className="h-8" />
        </span>
      ),
    },
  },
  {
    title: 'Optical sizing',
    body: 'Marks in identical boxes rarely look the same size. Wide, round, tall and dense marks each need their own height to look equal, so size each one by eye and line them up on shared top and bottom guides.',
    render: () => <OpticalSizing />,
  },
  {
    title: 'Resizing, clear space and minimum size',
    body: 'Always resize proportionally: set the height and let the width follow. Leave clear space equal to the mark’s height on every side. Keep the mark at 16 pixels or more and the lockup at least 24 pixels high. When a mark’s owner publishes their own rules, follow those.',
    do: { caption: 'Set the height and let the width follow.', render: () => <Lockup className="h-8" /> },
    dont: { caption: 'Don’t set both width and height to fit a box. The logo gets squashed.', render: () => <Lockup className="h-14 w-36 object-fill" /> },
  },
  {
    title: 'Using flags and social marks',
    body: 'Flags stand for countries and regions, not languages, so a language picker lists language names instead. Show each flag with its country name, so the meaning never depends on the image alone. Build social sign-in buttons with the Social button (3.7), using the provider’s own name.\n\nScreen readers announce the product name for logos, the country name for flags and the provider name for social marks. When a visible label already gives that name, the image is decorative and screen readers skip it.',
    render: () => (
      <div className="flex w-full flex-col items-center gap-sm">
        <div className="flex w-full max-w-[20rem] flex-col gap-sm">
          {socialProviders.slice(0, 3).map((p) => (
            <SocialButton key={p} provider={p} verb="Continue" fullWidth size="md" />
          ))}
        </div>
      </div>
    ),
    do: {
      caption: 'Pair each flag with its country name.',
      render: () => (
        <ul className="flex flex-col gap-sm">
          {flagCodes.slice(0, 3).map((c) => (
            <li key={c} className="flex items-center gap-sm type-body-sm-regular text-text-primary">
              <Flag country={c} size="md" alt="" /> {countryName(c)}
            </li>
          ))}
        </ul>
      ),
    },
    dont: {
      caption: 'Don’t use flags for languages. English isn’t spoken in just one country.',
      render: () => (
        <ul className="flex flex-col gap-sm">
          {[
            ['gb', 'English'],
            ['fr', 'Français'],
            ['de', 'Deutsch'],
          ].map(([c, l]) => (
            <li key={c} className="flex items-center gap-sm type-body-sm-regular text-text-primary">
              <Flag country={c} size="md" alt="" /> {l}
            </li>
          ))}
        </ul>
      ),
    },
  },
  {
    title: 'Partner marks follow their owners’ rules',
    body: `Third-party marks keep their owners’ colors, proportions and wording, even where the system would choose differently.\n\nThe Facebook button is the documented exception. Facebook’s brand rules set its blue and its white label, which reach ${facebookRatio.toFixed(2)}:1 contrast, just under the 4.5:1 the system uses for text. It stays as a recorded exception because the owner’s rules require it, and the label is large, bold and paired with the mark.\n\nNear-black marks (Apple, X, GitHub) follow the text color instead, which their owners allow, so they never disappear on a dark surface.`,
    render: () => (
      <div className="flex w-full flex-col items-center gap-lg">
        {/* A specimen of the recorded exception, not a control: inert and described as one image. */}
        <div role="img" aria-label={`Facebook and Apple sign-in buttons in their owners’ solid colors. Facebook’s white label on its blue is ${facebookRatio.toFixed(2)}:1.`} className="flex flex-wrap justify-center gap-md">
          <span inert aria-hidden className="flex flex-wrap justify-center gap-md">
            <SocialButton provider="facebook" type="solid" size="md" tabIndex={-1} />
            <SocialButton provider="apple" type="solid" size="md" tabIndex={-1} />
          </span>
        </div>
        <Caption>
          Facebook solid: white on its brand blue, {facebookRatio.toFixed(2)}:1, set by Facebook’s brand rules.
        </Caption>
      </div>
    ),
  },
  {
    title: 'Licensing and third-party marks',
    body: 'Use only marks you own or have approval for, and record the source and license of every third-party asset. Third-party marks stay their owners’ property, and showing them doesn’t imply endorsement. Every third-party mark needs approval before release.',
    render: () => (
      <div className="grid w-full gap-md sm:grid-cols-2 lg:grid-cols-3">
        {[
          ...socialProviders.map((p) => ({ mark: <SocialMark provider={p} size="lg" alt="" />, owner: socialProviderName[p], source: 'Simple Icons · CC0' })),
          { mark: <Flag country={flagCodes[0] ?? 'gb'} size="lg" alt="" />, owner: 'Flags', source: 'flag-icons · MIT' },
        ].map((r) => (
          <div key={r.owner} className="flex items-center gap-md rounded-control border border-border-subtle bg-surface-base p-md">
            {r.mark}
            <span className="flex flex-col">
              <span className="type-body-sm-medium text-text-primary">{r.owner}</span>
              <span className="type-body-xs-regular text-text-secondary">{r.source}</span>
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Extending the asset library',
    body: 'Add a new asset to the set it belongs to, with every version that set has. A new flag is one more country file, and a new provider needs both a color and a mono mark. Start a new kind of asset only when several screens need it.',
    render: () => (
      <div className="w-full">
        <CodeBlock
          label="Adding a flag"
          code={`// 1. Export the flag from Figma as public/brand/flags/{iso-code}.svg (lowercase), e.g. es.svg
// 2. Use it anywhere: the country name becomes its accessible name.
<Flag country="es" size="md" />          // "Spain"
<Flag country="es" size="md" alt="" />   // decorative, when the name is shown beside it`}
        />
      </div>
    ),
  },
];

export default function BrandAssets() {
  return (
    <DocPage
      eyebrow="Foundations › 1.8 Brand assets"
      title="Brand assets"
      description={`The ${product} logo, sign-in provider marks and flags are artwork, not tokens. Each piece belongs to its owner, so it keeps their colors and proportions.`}
      figmaNode={pageMeta['1.8'].figmaNode}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Guidelines', render: () => <Topics items={TOPICS} /> },
      ]}
    />
  );
}

