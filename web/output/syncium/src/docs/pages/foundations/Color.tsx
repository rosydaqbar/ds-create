import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import type { TokenVariable } from '@/tokens/types';
import { cn } from '@/lib/cn';
import { Badge, Button, Checkbox, Divider, HelpText, Icon, Label, Link, TextControl, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../../DocPage';
import { Bullets, Caption, DoDont, InlineCode, P, TokenTable } from '../../blocks';
import { figmaNodeFor } from '../../meta';

/* ---------- token lookups ---------- */
const byName = new Map(tokens.variables.map((v) => [v.name, v]));
const tok = (name: string) => byName.get(name) as TokenVariable;
type Mode = 'Light' | 'Dark';
const MODES: Mode[] = ['Light', 'Dark'];
/** Resolved value of a variable in a mode (single-mode primitives fall back to their one value). */
const val = (name: string, mode: Mode = 'Light') => {
  const v = tok(name);
  return (v.modes[mode] ?? Object.values(v.modes)[0]).value;
};
const alias = (name: string, mode: Mode = 'Light') => tok(name)?.modes[mode]?.alias ?? null;
const cssVar = (name: string) => `var(${tok(name).css})`;
const short = (name: string) => name.replace(/^(palette|color)\//, '');
const familySteps = (fam: string) => tokens.variables.filter((v) => v.name.startsWith(`palette/${fam}/`));

/* ---------- WCAG contrast ---------- */
const rgba = (hex: string) => {
  const x = hex.replace('#', '');
  const n = (i: number) => parseInt(x.slice(i, i + 2), 16);
  return [n(0), n(2), n(4), x.length === 8 ? n(6) / 255 : 1] as const;
};
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (r: number, g: number, b: number) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
/** Contrast of `fg` over `bg`; an alpha foreground is composited onto the background first. */
function contrast(fg: string, bg: string) {
  const [br, bgG, bb] = rgba(bg);
  const [fr, fgG, fb, a] = rgba(fg);
  const mix = (f: number, b: number) => f * a + b * (1 - a);
  const l1 = luminance(mix(fr, br), mix(fgG, bgG), mix(fb, bb));
  const l2 = luminance(br, bgG, bb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
/** Ratios are rounded down so a pair never looks better than it is. */
const fmt = (r: number) => (Math.floor(r * 10) / 10).toFixed(1);
type Level = 'AAA' | 'AA' | 'AA large' | 'Fail' | '3:1 pass' | 'Decorative';
const textLevel = (r: number): Level => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Fail');
const levelTone = (l: Level) => (l === 'AAA' || l === 'AA' || l === '3:1 pass' ? 'success' : l === 'AA large' ? 'warning' : l === 'Decorative' ? 'neutral' : 'danger');
function LevelBadge({ level }: { level: Level }) {
  return <Badge size="sm" type="pill" tone={levelTone(level)} label={level} />;
}

const WHITE = val('palette/base/white');
const BLACK = val('palette/base/black');

const checker = (dark = false): CSSProperties => {
  const a = dark ? 'var(--palette-neutral-800)' : 'var(--palette-neutral-200)';
  const b = dark ? 'var(--palette-neutral-950)' : 'var(--palette-base-white)';
  return { backgroundImage: `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0)`, backgroundSize: '12px 12px' };
};

/* ---------- palette swap previews (brand and neutral changes in Guidelines) ---------- */
const themed = tokens.variables.filter((v) => v.collection === 'Color' || v.collection === 'Components');
/**
 * Re-declares a palette family inside one wrapper, plus every themed variable and effect style that
 * reads it, so the components inside show the swapped palette while keeping their roles.
 */
function swapCss(cls: string, family: string, steps: Record<string, string>) {
  const block = (mode: Mode) => {
    const lines = Object.entries(steps).map(([step, value]) => `--palette-${family}-${step}:${value};`);
    for (const v of themed) {
      const a = v.modes[mode]?.alias;
      const target = a ? byName.get(a) : undefined;
      if (target) lines.push(`${v.css}:var(${target.css});`);
    }
    for (const e of tokens.effectStyles) {
      const s = mode === 'Light' ? e.light : e.dark;
      if (s?.includes('var(--palette')) lines.push(`${e.css}:${s};`);
    }
    return lines.join('');
  };
  return `.${cls}{${block('Light')}}[data-theme="dark"] .${cls}{${block('Dark')}}`;
}
const STEPS = familySteps('brand').map((v) => v.name.split('/')[2]);
/* teal/600 under white text misses AA, so the preview moves every step one darker (600 → teal/700). */
const tealShift = (s: string) => STEPS[Math.min(STEPS.indexOf(s) + 1, STEPS.length - 1)];
const tealBrand = Object.fromEntries(STEPS.map((s) => [s, `var(--palette-teal-${tealShift(s)})`]));
const TEAL_FAIL = contrast(WHITE, val('palette/teal/600'));
const TEAL_FIX = contrast(WHITE, val('palette/teal/700'));
/* Comparison greys for the neutral topic only. They are not Syncium tokens. */
const greyNeutral = Object.fromEntries(STEPS.map((s, i) => [s, ['#f8f8f8', '#f0f0f0', '#e2e2e2', '#cbcbcb', '#a2a2a2', '#808080', '#636363', '#4b4b4b', '#323232', '#1b1b1b', '#0b0b0b'][i]]));
const warmNeutral = Object.fromEntries(STEPS.map((s, i) => [s, ['#faf8f5', '#f3efe9', '#e6e0d7', '#d0c8bc', '#a69d90', '#847b6f', '#675f55', '#4f4840', '#35302a', '#1e1a16', '#0e0b08'][i]]));
const PREVIEW_CSS = swapCss('cx-brand-teal', 'brand', tealBrand) + swapCss('cx-neutral-grey', 'neutral', greyNeutral) + swapCss('cx-neutral-warm', 'neutral', warmNeutral);

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
/** Token names may wrap after a slash, never mid-word. */
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
function Code({ children }: { children: ReactNode }) {
  const parts = Array.isArray(children) ? children : [children];
  return <span className="type-code-sm-regular min-w-0 text-text-secondary">{parts.map((c, i) => <Fragment key={i}>{slashes(c)}</Fragment>)}</span>;
}
/** Wide tables scroll inside a keyboard-focusable region. */
function ScrollRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div tabIndex={0} role="region" aria-label={label} className="min-w-0 overflow-x-auto rounded-surface outline-none is-focus:shadow-focus-default [&>div]:min-w-full [&>div]:w-max [&>div]:overflow-visible">
      {children}
    </div>
  );
}
function Arrow({ vertical = false }: { vertical?: boolean }) {
  return (
    <span aria-hidden className="flex shrink-0 items-center justify-center text-icon-tertiary">
      <Icon name="arrows/arrow-down" size="md" className={vertical ? '' : 'md:hidden'} />
      {!vertical && <Icon name="arrows/arrow-right" size="md" className="hidden md:block" />}
    </span>
  );
}
function Dot({ name, size = 16 }: { name: string; size?: number }) {
  return <span aria-hidden className="inline-block shrink-0 rounded-xs border border-border-subtle" style={{ width: size, height: size, background: cssVar(name) }} />;
}

/* ---------- palette swatches ---------- */
function PaletteSwatch({ v, dark = false }: { v: TokenVariable; dark?: boolean }) {
  const hex = Object.values(v.modes)[0].value;
  const step = v.name.split('/')[2];
  const alphaColor = v.name.startsWith('palette/alpha-');
  const onWhite = contrast(hex, WHITE);
  const onBlack = contrast(hex, BLACK);
  const best = Math.max(onWhite, onBlack);
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <div className="h-16 overflow-hidden rounded-sm border border-border-subtle" style={hex.length === 9 ? checker(dark) : undefined}>
        <div className="flex h-full items-end p-xs" style={{ background: `var(${v.css})` }}>
          {hex.length !== 9 && (
            <span className="type-code-sm-medium whitespace-nowrap" style={{ color: onWhite >= onBlack ? 'var(--palette-base-white)' : 'var(--palette-base-black)' }}>
              {textLevel(best) === 'AA large' ? 'AA' : textLevel(best)} {fmt(best)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="type-body-xs-semibold text-text-primary">{alphaColor ? `${step}%` : step}</span>
        <span className="type-code-sm-regular text-text-tertiary">{hex.toUpperCase()}</span>
        {hex.length === 9 ? (
          <span className="type-body-xs-regular text-text-tertiary">depends on surface</span>
        ) : (
          <>
            <span className="type-body-xs-regular text-text-tertiary">
              <span className="sr-only">Contrast </span>on white {fmt(onWhite)}
            </span>
            <span className="type-body-xs-regular text-text-tertiary">on black {fmt(onBlack)}</span>
          </>
        )}
      </div>
    </div>
  );
}

function FamilyRow({ title, family, note, badge, dark = false }: { title: string; family: string; note: string; badge?: { label: string; tone: 'brand' | 'neutral' | 'danger' | 'warning' | 'success' | 'info' }; dark?: boolean }) {
  const steps = familySteps(family);
  return (
    <div className="flex min-w-0 flex-col gap-lg border-t border-border-subtle pt-xl">
      <div className="flex flex-col gap-xs">
        <div className="flex flex-wrap items-center gap-sm">
          <h3 className="type-heading-xs-semibold text-text-primary">{title}</h3>
          {badge && <Badge size="sm" tone={badge.tone} label={badge.label} />}
          <span className="type-code-sm-regular text-text-tertiary">palette/{family}/*</span>
        </div>
        <p className="type-body-sm-regular max-w-(--size-measure-reading) text-text-secondary">{note}</p>
      </div>
      <div className="@container min-w-0">
        <div className={cn('grid gap-sm', steps.length > 4 ? 'grid-cols-3 @md:grid-cols-6 @3xl:grid-cols-11' : 'grid-cols-3 @md:grid-cols-6')}>
          {steps.map((s) => (
            <PaletteSwatch key={s.name} v={s} dark={dark} />
          ))}
        </div>
      </div>
    </div>
  );
}

const SUPPORTING: [string, string][] = [
  ['slate', 'Charts and categorical tags only.'],
  ['sky', 'Charts and categorical tags only.'],
  ['indigo', 'Charts, categorical tags and avatar fills.'],
  ['purple', 'Charts and categorical tags only.'],
  ['pink', 'Charts, categorical tags and measurement overlays in docs.'],
  ['orange', 'Charts and categorical tags only.'],
  ['teal', 'Charts and categorical tags only.'],
];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/* ---------- role samples (Light and Dark side by side) ---------- */
const STATUS = [
  { tone: 'danger', icon: 'alerts/x-circle', text: 'Sync failed for 2 files' },
  { tone: 'warning', icon: 'alerts/alert-triangle', text: 'Storage is 90% full' },
  { tone: 'success', icon: 'alerts/check-circle', text: 'All files are in sync' },
  { tone: 'info', icon: 'alerts/info-circle', text: 'A new version is ready' },
] as const;
const statusClass: Record<string, string> = {
  danger: 'bg-fill-danger-subtle border-border-danger-subtle text-text-danger',
  warning: 'bg-fill-warning-subtle border-border-warning-subtle text-text-warning',
  success: 'bg-fill-success-subtle border-border-success-subtle text-text-success',
  info: 'bg-fill-info-subtle border-border-info-subtle text-text-info',
};
const statusIcon: Record<string, string> = { danger: 'text-icon-danger', warning: 'text-icon-warning', success: 'text-icon-success', info: 'text-icon-info' };

function SampleLabel({ children }: { children: ReactNode }) {
  return <span className="type-code-sm-regular text-text-tertiary">{children}</span>;
}

function ModePanel({ mode }: { mode: Mode }) {
  return (
    <div data-theme={mode.toLowerCase()} className="flex min-w-0 flex-col gap-xl rounded-surface border border-border-subtle bg-surface-base p-xl">
      <span className="type-body-sm-semibold text-text-primary">{mode}</span>

      <div className="flex flex-col gap-sm">
        <SampleLabel>Text on surfaces</SampleLabel>
        <div className="grid gap-sm sm:grid-cols-2">
          {[
            ['surface/base', 'bg-surface-base border border-border-subtle', ''],
            ['surface/sunken', 'bg-surface-sunken', ''],
            ['surface/raised', 'bg-surface-raised shadow-raised', ''],
            ['surface/brand-solid', 'bg-surface-brand-solid', 'on-brand'],
          ].map(([name, cls, on]) => (
            <div key={name} className={cn('flex flex-col gap-xxs rounded-control p-lg', cls)}>
              <span className={cn('type-body-sm-semibold', on ? 'text-text-primary-on-brand' : 'text-text-primary')}>Primary text</span>
              <span className={cn('type-body-sm-regular', on ? 'text-text-secondary-on-brand' : 'text-text-secondary')}>Secondary text</span>
              <span className={cn('type-body-xs-regular', on ? 'text-text-tertiary-on-brand' : 'text-text-tertiary')}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <SampleLabel>Borders</SampleLabel>
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
          {[
            ['subtle', 'border-border-subtle'],
            ['default', 'border-border-default'],
            ['strong', 'border-border-strong'],
            ['brand', 'border-border-brand'],
            ['danger', 'border-border-danger'],
            ['focus', 'border-border-focus'],
          ].map(([n, cls]) => (
            <span key={n} className={cn('type-body-xs-medium rounded-control border-(length:--border-width-focus) bg-surface-base px-md py-sm text-text-secondary', cls)}>
              {n}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <SampleLabel>Fills</SampleLabel>
        <div className="flex flex-wrap items-center gap-sm">
          <span className="type-body-sm-semibold rounded-control bg-fill-brand-solid px-lg py-sm text-text-on-solid">Brand solid</span>
          <span className="type-body-sm-semibold rounded-control bg-fill-brand-subtle px-lg py-sm text-text-brand">Brand subtle</span>
          <span className="type-body-sm-semibold rounded-control bg-fill-neutral-solid px-lg py-sm text-text-inverse">Neutral solid</span>
          <span className="type-body-sm-semibold rounded-control bg-fill-neutral-subtle px-lg py-sm text-text-secondary">Neutral subtle</span>
        </div>
        <div aria-hidden className="h-(--size-track-md) w-full overflow-hidden rounded-full bg-fill-neutral-track">
          <div className="h-full w-3/5 rounded-full bg-fill-brand-solid" />
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <SampleLabel>Status sets: subtle fill, subtle border, text and icon</SampleLabel>
        {STATUS.map((s) => (
          <div key={s.tone} className={cn('flex items-center gap-md rounded-control border px-lg py-md', statusClass[s.tone])}>
            <Icon name={s.icon} size="sm" className={statusIcon[s.tone]} />
            <span className="type-body-sm-medium">{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- contrast pairs ---------- */
type Pair = { fg: string; bg: string; kind: 'text' | 'ui'; use: string; decorative?: boolean };
const PAIRS: Pair[] = [
  { fg: 'color/text/primary', bg: 'color/surface/base', kind: 'text', use: 'Headings and body copy' },
  { fg: 'color/text/secondary', bg: 'color/surface/base', kind: 'text', use: 'Labels, navigation' },
  { fg: 'color/text/secondary', bg: 'color/surface/sunken', kind: 'text', use: 'Labels on recessed areas' },
  { fg: 'color/text/tertiary', bg: 'color/surface/base', kind: 'text', use: 'Descriptions, timestamps' },
  { fg: 'color/text/placeholder', bg: 'color/surface/base', kind: 'text', use: 'Placeholder hints (never the only label)' },
  { fg: 'color/text/brand', bg: 'color/surface/base', kind: 'text', use: 'Links' },
  { fg: 'color/text/primary/on-brand', bg: 'color/surface/brand-solid', kind: 'text', use: 'Brand banners' },
  { fg: 'color/text/on-solid', bg: 'color/fill/brand/solid', kind: 'text', use: 'Primary button labels' },
  { fg: 'color/text/on-solid', bg: 'color/fill/danger/solid', kind: 'text', use: 'Danger button labels' },
  { fg: 'color/text/danger', bg: 'color/fill/danger/subtle', kind: 'text', use: 'Error alerts and badges' },
  { fg: 'color/text/warning', bg: 'color/fill/warning/subtle', kind: 'text', use: 'Warning alerts and badges' },
  { fg: 'color/text/success', bg: 'color/fill/success/subtle', kind: 'text', use: 'Success alerts and badges' },
  { fg: 'color/text/info', bg: 'color/fill/info/subtle', kind: 'text', use: 'Info alerts and badges' },
  { fg: 'color/text/inverse', bg: 'color/surface/inverse', kind: 'text', use: 'Tooltips' },
  { fg: 'color/icon/secondary', bg: 'color/surface/base', kind: 'ui', use: 'Icons in buttons and inputs' },
  { fg: 'color/border/strong', bg: 'color/surface/base', kind: 'ui', use: 'A border that is the only cue for a control' },
  { fg: 'color/border/default', bg: 'color/surface/base', kind: 'ui', use: 'Field outlines (fields also carry a label and fill)', decorative: true },
  { fg: 'color/border/focus', bg: 'color/surface/base', kind: 'ui', use: 'Focus ring on the page' },
  { fg: 'color/border/focus', bg: 'color/surface/raised', kind: 'ui', use: 'Focus ring on cards' },
  { fg: 'color/border/danger', bg: 'color/surface/base', kind: 'ui', use: 'Invalid field border' },
];
const pairLevel = (p: Pair, r: number): Level => (p.decorative && r < 3 ? 'Decorative' : p.kind === 'ui' ? (r >= 3 ? '3:1 pass' : 'Fail') : textLevel(r));

function PairSample({ p, mode }: { p: Pair; mode: Mode }) {
  const style: CSSProperties = { background: `var(${tok(p.bg).css})` };
  return (
    <span data-theme={mode.toLowerCase()} aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-border-subtle" style={style}>
      {p.kind === 'text' ? (
        <span className="type-heading-lg-semibold" style={{ color: `var(${tok(p.fg).css})` }}>
          Aa
        </span>
      ) : p.fg.startsWith('color/icon') ? (
        <span style={{ color: `var(${tok(p.fg).css})` }}>
          <Icon name="files/folder" size="md" />
        </span>
      ) : (
        <span className="size-6 rounded-xs border-(length:--border-width-focus)" style={{ borderColor: `var(${tok(p.fg).css})` }} />
      )}
    </span>
  );
}

function PairTable() {
  return (
    <ScrollRegion label="Approved color pairs with contrast ratios">
      <div className="rounded-surface border border-border-subtle">
        <table className="w-full border-collapse text-left">
          <thead className="bg-surface-sunken">
            <tr className="type-body-xs-semibold text-text-tertiary">
              <th scope="col" className="px-lg py-md">Pair</th>
              <th scope="col" className="px-lg py-md">Target</th>
              {MODES.map((m) => (
                <th key={m} scope="col" className="px-lg py-md">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAIRS.map((p) => (
              <tr key={p.fg + p.bg} className="border-t border-border-subtle align-middle">
                <td className="px-lg py-md">
                  <div className="flex flex-col gap-xxs">
                    <span className="type-body-sm-medium text-text-primary">{p.use}</span>
                    <span className="type-code-sm-regular text-text-tertiary">
                      {short(p.fg)} on {short(p.bg)}
                    </span>
                  </div>
                </td>
                <td className="type-body-sm-regular whitespace-nowrap px-lg py-md text-text-secondary">{p.kind === 'text' ? '4.5:1 text' : '3:1 UI'}</td>
                {MODES.map((m) => {
                  const r = contrast(val(p.fg, m), val(p.bg, m));
                  return (
                    <td key={m} className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <PairSample p={p} mode={m} />
                        <span className="type-code-sm-medium w-10 text-text-primary">{fmt(r)}</span>
                        <LevelBadge level={pairLevel(p, r)} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollRegion>
  );
}

/* ---------- role model diagram ---------- */
function RoleModel() {
  return (
    <Panel>
      <div className="flex flex-col items-stretch gap-md md:flex-row">
        <div className="flex flex-1 flex-col gap-md rounded-control border border-border-subtle bg-surface-base p-lg">
          <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">1 · Primitives</span>
          <p className="type-body-sm-regular text-text-secondary">The raw palette. It’s hidden from color pickers, and components don’t use it directly.</p>
          {MODES.map((m) => (
            <span key={m} className="flex items-center gap-sm">
              <Dot name={alias('color/text/brand', m)!} />
              <Code>{alias('color/text/brand', m)}</Code>
            </span>
          ))}
        </div>
        <Arrow />
        <div className="flex flex-1 flex-col gap-md rounded-control border border-border-brand-subtle bg-surface-base p-lg">
          <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">2 · Semantic role</span>
          <p className="type-body-sm-regular text-text-secondary">Names what the color is for and points to a different step in each mode.</p>
          <span className="flex items-center gap-sm">
            <Dot name="color/text/brand" />
            <Code>color/text/brand</Code>
          </span>
          <span className="type-body-xs-regular text-text-tertiary">
            Light → {short(alias('color/text/brand', 'Light')!)} · Dark → {short(alias('color/text/brand', 'Dark')!)}
          </span>
        </div>
        <Arrow />
        <div className="flex flex-1 flex-col gap-md rounded-control border border-border-subtle bg-surface-base p-lg">
          <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">3 · Component</span>
          <p className="type-body-sm-regular text-text-secondary">A Link (2.3) uses the role, so it looks right in every mode with no extra work. Live sample:</p>
          <Link label="View shared files" href="#" onClick={(e) => e.preventDefault()} />
        </div>
      </div>
    </Panel>
  );
}

/* ---------- Overview ---------- */
function Overview() {
  return (
    <div className="flex flex-col gap-6xl">
      <Block title="How color works" intro="Syncium color comes in two layers. Primitive palettes hold the raw values. Semantic roles say what each color is for, and they change with the mode. Components use only roles, so you can change a palette without touching a single component.">
        <RoleModel />
        <Bullets
          items={[
            <>
              <strong className="font-semibold text-text-primary">Pick by purpose, not by hue.</strong> Choose the role that matches the job (text, border, fill, surface) rather than a palette step that happens to look right.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Every role works in Light and Dark.</strong> Each role has a value for each mode, so a screen built from roles needs no Dark overrides.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Color never carries meaning alone.</strong> Always pair a status color with text or an icon, so people who can’t see the difference still get the message.
            </>,
          ]}
        />
      </Block>

      <Block title="Base colors" intro="These are the building blocks: white, black and transparent, the brand ramp, and the alpha scales for overlays and shadows. Each swatch lists its contrast on white and on black, and the label on the swatch shows the better of the two.">
        <div className="flex flex-col gap-xl">
          <FamilyRow title="Base" family="base" note="Pure white and black for the extremes, plus transparent for layers that should show nothing but still use a token." />
          <FamilyRow title="Brand" family="brand" badge={{ label: 'Brand', tone: 'brand' }} note="The Syncium ramp runs from periwinkle tints (50, 200) through violet (400) to deep purple (600). Step 600 is the main action color, and 950 grounds dark brand surfaces." />
          <FamilyRow title="Alpha black" family="alpha-black" note="Black at set opacities, for the scrim behind dialogs and for shadow colors. Shown on a light surface." />
          <div data-theme="dark" className="rounded-surface bg-surface-base px-lg pb-lg">
            <FamilyRow title="Alpha white" family="alpha-white" dark note="White at set opacities, for hover tints over media and for video controls. Shown on a dark surface." />
          </div>
        </div>
      </Block>

      <Block title="Extended palettes" intro="Neutral builds the structure. Red, amber, green and blue each serve one status, and the supporting hues are only for categories, charts and avatars. Brand and neutral are named for their role, and the rest for their hue.">
        <div className="flex flex-col gap-xl">
          <FamilyRow title="Neutral" family="neutral" badge={{ label: 'Neutral', tone: 'neutral' }} note="Violet-tinted neutrals for text, borders, surfaces and structure. Step 950 is the brand’s midnight and the page color in Dark." />
          <FamilyRow title="Red" family="red" badge={{ label: 'Danger', tone: 'danger' }} note="Errors, invalid fields and destructive actions." />
          <FamilyRow title="Amber" family="amber" badge={{ label: 'Warning', tone: 'warning' }} note="Warnings, caution and rating stars." />
          <FamilyRow title="Green" family="green" badge={{ label: 'Success', tone: 'success' }} note="Success, completed syncs and online presence." />
          <FamilyRow title="Blue" family="blue" badge={{ label: 'Info', tone: 'info' }} note="Informational messages. Blue also works as a category hue." />
          {SUPPORTING.map(([f, note]) => (
            <FamilyRow key={f} title={cap(f)} family={f} note={note} />
          ))}
        </div>
      </Block>

      <Block title="Roles in Light and Dark" intro="Both panels below use only color roles. The Dark panel is the Light panel with the mode switched, and nothing else changed.">
        <div className="grid min-w-0 gap-xl lg:grid-cols-2">
          {MODES.map((m) => (
            <ModePanel key={m} mode={m} />
          ))}
        </div>
      </Block>

      <Block title="Contrast pairs" intro="These are the text and icon pairs Syncium screens use, tested in both modes. Text needs 4.5:1 (AA). Large text, icons and borders that identify a control need 3:1.">
        <PairTable />
        <Caption>Ratios are rounded down, so a pair never looks better than it is. Alpha colors are measured over the surface they sit on. Disabled text is exempt from contrast rules, but people still need to see it.</Caption>
      </Block>
    </div>
  );
}

/* ---------- Tokens ---------- */
const GROUPS: { title: string; prefix: string; intro: string }[] = [
  { title: 'Text', prefix: 'color/text/', intro: 'Every piece of text takes its color from here, from page headings to placeholder hints.' },
  { title: 'Icon', prefix: 'color/icon/', intro: 'Icons have their own roles, so they can sit a step lighter or stronger than the text beside them.' },
  { title: 'Border', prefix: 'color/border/', intro: 'Use these for outlines, dividers and focus rings.' },
  { title: 'Surface', prefix: 'color/surface/', intro: 'The backgrounds content sits on, from the page itself to floating panels.' },
  { title: 'Fill', prefix: 'color/fill/', intro: 'Fills for interactive and status elements, like buttons, badges, checkboxes, switches and selected rows. Each tone comes in a solid and a subtle emphasis, followed by their states.' },
  { title: 'Overlay', prefix: 'color/overlay/', intro: 'The scrim behind dialogs and drawers.' },
  { title: 'Shadow', prefix: 'color/shadow/', intro: 'The elevation styles (see 1.5 Elevation) take their shadow colors from here, so changing one changes every shadow.' },
  { title: 'Category', prefix: 'color/category/', intro: 'Category colors for badges, tags, avatars and charts. They carry no status meaning, so keep them away from actions and feedback.' },
];
/** Names in a group, each parent followed by its children (hover, pressed, on-brand…). */
const groupNames = (prefix: string, exclude: string[] = []) => {
  const names = tokens.variables.filter((v) => v.collection === 'Color' && v.name.startsWith(prefix) && !exclude.includes(v.name)).map((v) => v.name);
  const order = new Map(names.map((n, i) => [n, i]));
  const rootOf = (n: string): string => {
    const parts = n.split('/');
    for (let i = parts.length - 1; i >= 3; i--) {
      const p = parts.slice(0, i).join('/');
      if (order.has(p)) return rootOf(p);
    }
    return n;
  };
  return [...names].sort((a, b) => order.get(rootOf(a))! - order.get(rootOf(b))! || order.get(a)! - order.get(b)!);
};

function TokensTab() {
  const fillTones = ['neutral', 'brand', 'danger', 'warning', 'success', 'info'];
  return (
    <div className="flex flex-col gap-5xl">
      <P>
        Each role in the <InlineCode>Color</InlineCode> collection is listed with its Light and Dark values, the primitive it points to, its CSS variable and its Tailwind class. Variants of a role (hover, pressed, on-brand) follow right after it.
      </P>
      {GROUPS.map((g) =>
        g.title === 'Fill' ? (
          <Block key={g.title} title={g.title} intro={g.intro}>
            {fillTones.map((t) => (
              <div key={t} className="flex flex-col gap-sm">
                <h3 className="type-heading-xs-semibold text-text-primary">{cap(t)}</h3>
                <ScrollRegion label={`Fill ${t} tokens`}>
                  <TokenTable names={groupNames(`color/fill/${t}/`, ['color/fill/neutral/track'])} />
                </ScrollRegion>
              </div>
            ))}
            <div className="flex flex-col gap-sm">
              <h3 className="type-heading-xs-semibold text-text-primary">Special fills</h3>
              <ScrollRegion label="Special fill tokens">
                <TokenTable names={['color/fill/none', 'color/fill/neutral/track']} />
              </ScrollRegion>
            </div>
          </Block>
        ) : (
          <Block key={g.title} title={g.title} intro={g.intro}>
            <ScrollRegion label={`${g.title} color tokens`}>
              <TokenTable names={groupNames(g.prefix)} />
            </ScrollRegion>
          </Block>
        ),
      )}
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

function Strip({ family, label }: { family: string; label: string }) {
  return (
    <div className="grid items-center gap-sm sm:grid-cols-[6rem_minmax(0,1fr)]">
      <span className="type-body-sm-medium text-text-primary">{label}</span>
      <div aria-hidden className="flex h-8 overflow-hidden rounded-sm border border-border-subtle">
        {familySteps(family).map((s) => (
          <span key={s.name} className="flex-1" style={{ background: `var(${s.css})` }} />
        ))}
      </div>
    </div>
  );
}

function PaletteArchitecture() {
  const groups: [string, string, [string, string][]][] = [
    ['Neutral', 'Text, borders, surfaces, structure', [['neutral', 'Neutral']]],
    ['Brand', 'Actions, links, selection, brand surfaces', [['brand', 'Brand']]],
    ['Feedback', 'Danger, warning, success, info', [['red', 'Red'], ['amber', 'Amber'], ['green', 'Green'], ['blue', 'Blue']]],
    ['Supporting', 'Categories, tags and charts only', SUPPORTING.map(([f]) => [f, cap(f)] as [string, string])],
  ];
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-2">
        {groups.map(([title, use, fams]) => (
          <div key={title} className="flex flex-col gap-md rounded-control bg-surface-base p-lg">
            <div className="flex flex-col">
              <span className="type-body-md-semibold text-text-primary">{title}</span>
              <span className="type-body-sm-regular text-text-tertiary">{use}</span>
            </div>
            {fams.map(([f, l]) => (
              <Strip key={f} family={f} label={l} />
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AddingFamily() {
  const roles = ['subtle', 'solid', 'text', 'border'].map((r) => `color/category/teal/${r}`);
  return (
    <Panel>
      <div className="flex flex-col items-stretch gap-md">
        <div className="flex flex-col gap-sm rounded-control bg-surface-base p-lg">
          <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">New family</span>
          <Strip family="teal" label="palette/teal" />
        </div>
        <Arrow vertical />
        <div className="flex flex-col gap-sm rounded-control bg-surface-base p-lg">
          <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">Roles it feeds</span>
          <div className="grid gap-sm sm:grid-cols-2">
            {roles.map((r) => (
              <span key={r} className="flex items-center gap-sm">
                <Dot name={r} />
                <Code>{r}</Code>
                <span className="type-body-xs-regular text-text-tertiary">→ {short(alias(r)!)}</span>
              </span>
            ))}
          </div>
        </div>
        <Arrow vertical />
        <div className="flex flex-col gap-md rounded-control bg-surface-base p-lg">
          <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">Where it shows</span>
          <span className="type-body-xs-medium inline-flex w-fit items-center rounded-indicator border border-category-teal-border bg-category-teal-subtle px-md py-xxs text-category-teal-text">Finance</span>
          <div className="flex items-end gap-sm" aria-hidden>
            {[
              ['bg-category-sky-solid', 'h-8'],
              ['bg-category-indigo-solid', 'h-12'],
              ['bg-category-teal-solid', 'h-16'],
              ['bg-category-sky-solid', 'h-10'],
              ['bg-category-indigo-solid', 'h-6'],
              ['bg-category-teal-solid', 'h-14'],
            ].map(([c, h], i) => (
              <span key={i} className={cn('w-4 rounded-t-xs', c, h)} />
            ))}
          </div>
          <span className="type-body-xs-regular text-text-tertiary">Storage by department: teal is the third series.</span>
        </div>
      </div>
    </Panel>
  );
}

const MAPPING: { role: string; part: string; render: () => ReactNode }[] = [
  { role: 'color/text/secondary', part: 'Label', render: () => <Label label="Folder name" as="span" /> },
  { role: 'color/border/danger', part: 'Text control · invalid', render: () => <span aria-hidden className="block h-(--size-control-sm) w-32 rounded-control border border-border-danger bg-surface-base" /> },
  { role: 'color/text/danger', part: 'Help text · invalid', render: () => <HelpText size="sm" status="invalid" hint="This field needs attention." /> },
  { role: 'color/fill/brand/solid', part: 'Button · primary', render: () => <Button size="sm" label="Save" /> },
];

function MappingDiagram() {
  return (
    <Panel>
      <div className="flex flex-col gap-md">
        <div className="hidden grid-cols-[1fr_1.4fr_1.4fr] gap-lg md:grid">
          {['Primitive', 'Semantic role', 'Component'].map((h) => (
            <span key={h} className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">
              {h}
            </span>
          ))}
        </div>
        {MAPPING.map((m) => (
          <div key={m.role} className="grid items-center gap-sm rounded-control bg-surface-base p-lg md:grid-cols-[1fr_1.4fr_1.4fr] md:gap-lg">
            <span className="flex items-center gap-sm">
              <Dot name={alias(m.role)!} />
              <Code>{alias(m.role)}</Code>
            </span>
            <span className="flex items-center gap-sm">
              <span aria-hidden className="type-body-sm-regular text-text-tertiary">→</span>
              <Dot name={m.role} />
              <Code>{m.role}</Code>
            </span>
            <span className="flex flex-wrap items-center gap-md">
              <span aria-hidden className="type-body-sm-regular text-text-tertiary">→</span>
              {m.render()}
              <span className="type-body-xs-regular text-text-tertiary">{m.part}</span>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Callouts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <ul className="flex flex-col gap-xs">
      {rows.map(([k, v]) => (
        <li key={k} className="flex flex-wrap items-baseline gap-x-sm">
          <span className="type-body-xs-semibold text-text-primary">{k}</span>
          <span className="type-code-sm-regular min-w-0 text-text-secondary">{slashes(v)}</span>
        </li>
      ))}
    </ul>
  );
}

function RawVsSystem() {
  const layers: [string, string][] = [
    ['Label', 'color/text/secondary'],
    ['Border', 'color/border/danger'],
    ['Hint', 'color/text/danger'],
  ];
  return (
    <Panel>
      <div data-theme="light" className="grid gap-xl rounded-control md:grid-cols-2">
        <div className="flex flex-col gap-lg rounded-control bg-surface-base p-xl">
          <Badge size="sm" tone="danger" label="Before · raw values" className="self-start" />
          <div className="flex flex-col gap-xs">
            <span className="type-body-xs-medium" style={{ color: val('color/text/secondary') }}>
              Folder name
            </span>
            <span className="type-body-sm-regular flex h-(--size-control-sm) items-center rounded-control border bg-surface-base px-lg" style={{ borderColor: val('color/border/danger'), color: val('color/text/primary') }}>
              Q3 reports/
            </span>
            <span className="type-body-xs-regular" style={{ color: val('color/text/danger') }}>
              This field needs attention.
            </span>
          </div>
          <Callouts rows={layers.map(([k, r]) => [k, val(r).toUpperCase()])} />
        </div>
        <div className="flex flex-col gap-lg rounded-control bg-surface-base p-xl">
          <Badge size="sm" tone="success" label="After · color roles" className="self-start" />
          <TextField size="sm" label="Folder name" status="invalid" defaultValue="Q3 reports/" hint="This field needs attention." />
          <Callouts rows={layers.map(([k, r]) => [k, `${r} → ${alias(r)}`])} />
        </div>
      </div>
    </Panel>
  );
}

function PairCard({ fg, bg, title, children }: { fg: string; bg: string; title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-md rounded-control bg-surface-base p-lg">
      {children}
      <span className="type-body-sm-semibold text-text-primary">{title}</span>
      <div className="flex flex-wrap gap-sm">
        {MODES.map((m) => {
          const r = contrast(val(fg, m), val(bg, m));
          return (
            <span key={m} className="inline-flex items-center gap-xs">
              <span className="type-body-xs-regular text-text-tertiary">{m}</span>
              <span className="type-code-sm-medium text-text-primary">{fmt(r)}</span>
              <LevelBadge level={textLevel(r)} />
            </span>
          );
        })}
      </div>
      <Code>
        {short(fg)} on {short(bg)}
      </Code>
    </div>
  );
}

function ContrastInContext() {
  return (
    <Panel>
      <div className="grid gap-lg lg:grid-cols-3">
        <PairCard fg="color/text/secondary" bg="color/surface/base" title="Passing pair">
          <p className="type-body-md-regular rounded-sm border border-border-subtle bg-surface-base p-md text-text-secondary">Shared with 4 people</p>
        </PairCard>
        <PairCard fg="color/text/placeholder" bg="color/surface/sunken" title="Placeholder hint: never the only label">
          <input aria-label="Search files (sample)" placeholder="Search files" className="type-body-md-regular w-full rounded-sm border border-border-subtle bg-surface-sunken p-md text-text-primary outline-none placeholder:text-text-placeholder is-focus:shadow-focus-default" />
        </PairCard>
        <PairCard fg="color/text/danger" bg="color/surface/base" title="Error: color, icon and message">
          <TextField size="sm" label="Folder name" status="invalid" defaultValue="Q3 reports/" hint="Names can’t end with a slash." />
        </PairCard>
      </div>
    </Panel>
  );
}

function BorderFix() {
  const rows: [string, string][] = [
    ['color/border/default', 'border-border-default'],
    ['color/border/strong', 'border-border-strong'],
  ];
  return (
    <Panel>
      <div className="grid gap-lg md:grid-cols-2">
        {rows.map(([name, cls]) => {
          const r = contrast(val(name), val('color/surface/base'));
          return (
            <div key={name} className="flex flex-col gap-md rounded-control bg-surface-base p-lg">
              <span aria-hidden className={cn('block h-(--size-control-md) rounded-control border bg-surface-base', cls)} />
              <div className="flex flex-wrap items-center gap-sm">
                <Code>{name}</Code>
                <span className="type-code-sm-medium text-text-primary">{fmt(r)}</span>
                <LevelBadge level={r >= 3 ? '3:1 pass' : 'Decorative'} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function EditingWorkflow() {
  const prim = 'palette/brand/600';
  const roles = themed.filter((v) => v.collection === 'Color' && Object.values(v.modes).some((m) => m.alias === prim)).map((v) => v.name);
  const steps: { title: string; body: ReactNode }[] = [
    {
      title: '1 · Primitives',
      body: (
        <span className="flex items-center gap-sm">
          <Dot name={prim} /> <Code>{prim}</Code>
        </span>
      ),
    },
    {
      title: '2 · Color collection',
      body: (
        <span className="flex flex-wrap gap-xs">
          <Badge size="sm" tone="neutral" label="Light" />
          <Badge size="sm" tone="neutral" label="Dark" />
        </span>
      ),
    },
    {
      title: '3 · Edit the value',
      body: (
        <span className="flex items-center gap-sm">
          <Dot name={prim} size={24} />
          <span aria-hidden className="text-text-tertiary">→</span>
          <span aria-hidden className="inline-block size-6 rounded-xs border border-border-subtle" style={{ background: 'var(--palette-teal-600)' }} />
          <span className="sr-only">old value to new value</span>
        </span>
      ),
    },
    {
      title: '4 · Roles that point to it',
      body: (
        <span className="flex flex-col gap-xxs">
          {roles.map((r) => (
            <Code key={r}>{r}</Code>
          ))}
        </span>
      ),
    },
    {
      title: '5 · Components update',
      body: (
        <span className="flex flex-wrap items-center gap-md">
          <Button size="sm" label="Share" />
          <Link label="Open folder" href="#" onClick={(e) => e.preventDefault()} />
          <Checkbox defaultChecked aria-label="Sync on mobile data" />
        </span>
      ),
    },
  ];
  return (
    <Panel>
      <ol className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <li key={s.title} className="flex min-w-0 flex-col gap-md rounded-control bg-surface-base p-lg">
            <span className="type-body-xs-semibold text-text-primary">{s.title}</span>
            {s.body}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function BrandSample() {
  return (
    <div className="flex flex-col gap-lg rounded-control bg-surface-base p-lg">
      <div className="flex flex-wrap items-center gap-md">
        <Button size="sm" label="Upload files" leadingIcon="files/cloud-upload" />
        <Checkbox defaultChecked aria-label="Keep offline copy" />
        <Badge size="sm" tone="brand" label="Pro" />
      </div>
      <div className="flex gap-lg border-b border-border-subtle" aria-hidden>
        <span className="type-body-sm-semibold -mb-px border-b-2 border-border-brand pb-sm text-text-brand">My files</span>
        <span className="type-body-sm-semibold pb-sm text-text-tertiary">Shared</span>
      </div>
      <TextControl size="sm" defaultValue="Team folder" aria-label="Folder (focused sample)" forceState="focus" />
    </div>
  );
}

function BrandReplacement() {
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-2">
        <div className="flex flex-col gap-md">
          <span className="type-body-sm-semibold text-text-primary">Before · palette/brand/*</span>
          <Strip family="brand" label="Brand" />
          <BrandSample />
        </div>
        <div className="cx-brand-teal flex flex-col gap-md">
          <span className="type-body-sm-semibold text-text-primary">After · brand replaced (teal preview)</span>
          <Strip family="brand" label="Brand" />
          <BrandSample />
        </div>
      </div>
    </Panel>
  );
}

function NeutralCard() {
  return (
    <div className="flex flex-col gap-lg rounded-surface border border-border-subtle bg-surface-raised p-xl shadow-raised">
      <div className="flex flex-col gap-xxs">
        <span className="type-heading-xs-semibold text-text-primary">Shared folder</span>
        <span className="type-body-sm-regular text-text-secondary">Everyone with the link can view.</span>
      </div>
      <Divider decorative />
      <TextField size="sm" label="Folder name" defaultValue="Design reviews" />
      <div className="flex justify-end">
        <Button size="sm" emphasis="secondary" label="Cancel" />
      </div>
    </div>
  );
}

function NeutralCharacter() {
  const options: [string, string, boolean][] = [
    ['Desaturated gray', 'cx-neutral-grey', false],
    ['Cool, violet-tinted', '', true],
    ['Warm gray', 'cx-neutral-warm', false],
  ];
  return (
    <Panel>
      <div className="grid gap-xl lg:grid-cols-3">
        {options.map(([title, cls, selected]) => (
          <div key={title} className={cn('flex min-w-0 flex-col gap-md', cls)}>
            <span className="flex flex-wrap items-center gap-sm">
              <span className="type-body-sm-semibold text-text-primary">{title}</span>
              {selected && <Badge size="sm" tone="brand" label="Selected" />}
            </span>
            <Strip family="neutral" label="Neutral" />
            <NeutralCard />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function EffectDependencies() {
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-3">
        <div className="flex flex-col gap-md">
          <div className="flex h-28 items-center justify-center rounded-surface bg-surface-raised shadow-raised">
            <span className="type-body-sm-medium text-text-secondary">Raised card</span>
          </div>
          <Callouts rows={[['Shadow', 'color/shadow/key · color/shadow/ambient']]} />
        </div>
        <div className="flex flex-col gap-md">
          <div className="flex h-28 items-center justify-center rounded-surface bg-surface-base">
            <Button size="sm" label="Focused button" forceState="focus" />
          </div>
          <Callouts rows={[['Focus ring', 'color/border/focus · color/border/danger']]} />
        </div>
        <div className="flex flex-col gap-md">
          <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-surface bg-surface-base">
            <div aria-hidden className="absolute inset-0 flex flex-col gap-xs p-md">
              <span className="h-2 w-3/4 rounded-full bg-fill-neutral-track" />
              <span className="h-2 w-1/2 rounded-full bg-fill-neutral-track" />
            </div>
            <div aria-hidden className="absolute inset-0 bg-overlay-scrim" />
            <div className="relative rounded-modal bg-surface-overlay px-xl py-md shadow-modal">
              <span className="type-body-sm-medium text-text-primary">Dialog</span>
            </div>
          </div>
          <Callouts rows={[['Scrim', 'color/overlay/scrim']]} />
        </div>
      </div>
    </Panel>
  );
}

function GuidelinesTab() {
  const items: Guide[] = [
    {
      title: 'Build the palette around jobs',
      body: (
        <>
          <P>Each color family should have a job in the interface, not just look attractive as a swatch. Syncium has four kinds of family:</P>
          <Bullets
            items={[
              'Neutral: a violet-tinted cool gray for text, borders, surfaces and structure, ending in midnight.',
              'Brand: periwinkle to deep violet for actions, links, selection and branded surfaces.',
              'Feedback: red, amber, green and blue for danger, warning, success and info.',
              'Supporting: slate, sky, indigo, purple, pink, orange and teal for categories, tags and charts only.',
            ]}
          />
          <P>Each family has eleven steps, from 50 to 950, enough for subtle surfaces, borders, icons, text, solid fills and their states. None of them is there just to fill out the page.</P>
        </>
      ),
      visual: <PaletteArchitecture />,
      caption: 'The whole palette at a glance. Hex values and contrast for every step are on the Overview tab.',
    },
    {
      title: 'Add a family only when you need it',
      body: (
        <>
          <P>A new family should solve a real interface problem. Before you add one, answer these questions:</P>
          <Bullets
            items={[
              'Which product role does it serve?',
              'Which steps does it actually need?',
              'Does it need icon, border, surface or solid treatments?',
              'Does it work in Light and Dark?',
              'Do its important text and background pairs pass contrast?',
            ]}
          />
          <P>Avoid purely decorative palettes, since every family adds upkeep in both modes. If a supporting palette is already approved, audit it rather than replace it.</P>
        </>
      ),
      visual: <AddingFamily />,
      caption: 'Teal is here because the files table tags departments and the storage chart needs another series color, not to round out the palette.',
    },
    {
      title: 'Set up color before building components',
      body: (
        <>
          <P>Components use roles, not primitives. With primitives and roles in place first, the brand palette can change while every component keeps its meaning.</P>
          <P>When you audit a screen or component, find the raw values and group repeated purposes into roles. Keep any intentional exceptions, and write them down.</P>
        </>
      ),
      visual: (
        <div className="flex flex-col gap-xl">
          <RawVsSystem />
          <MappingDiagram />
        </div>
      ),
      caption: 'Top: the same field twice, shown in Light because raw values have no Dark value at all. Before, each layer holds a hex value. After, each layer names its role, and the role points to a primitive. Bottom: primitive → role → component for four real layers.',
      do: { caption: 'Use the role that matches the job, such as color/fill/brand/solid for a primary action.', render: () => <Button label="Share folder" /> },
      dont: {
        caption: 'Don’t color a component with a palette step or a hex value. It breaks in Dark and misses every future palette change.',
        render: () => (
          <span className="type-body-sm-semibold inline-flex h-(--size-control-md) items-center rounded-control px-xl" style={{ background: 'var(--palette-brand-400)', color: 'var(--palette-base-black)' }}>
            Share folder
          </span>
        ),
      },
    },
    {
      title: 'Color accessibility',
      body: (
        <>
          <P>Check contrast while you build the palette and its mappings, not after the components are done. Test text, links, button and form labels, readable placeholders, meaningful icons, control borders, focus indicators, text on brand surfaces and feedback messages. Disabled states are exempt, but they should stay visible.</P>
          <P>Not everyone can tell colors apart, so color should never carry meaning on its own. Pair it with text, an icon, a shape change or a message, and set the matching state in code.</P>
        </>
      ),
      visual: <ContrastInContext />,
      caption: 'Each pair sits on its real surface, with its ratio in both modes. Placeholder text disappears as people type, so keep a visible label even when the placeholder passes.',
      do: {
        caption: 'Pair the status color with an icon and words.',
        render: () => <Badge tone="danger" leadingIcon="alerts/x-circle" label="Sync failed" />,
      },
      dont: {
        caption: 'Don’t rely on a colored dot alone: people who can’t tell red from green get nothing.',
        render: () => (
          <span className="type-body-sm-medium flex items-center gap-sm text-text-primary">
            <span aria-hidden className="size-(--size-indicator-md) rounded-full bg-icon-danger" /> Q3 reports
          </span>
        ),
      },
    },
    {
      title: 'Test contrast on real pairs',
      body: (
        <>
          <P>Syncium targets WCAG AA: 4.5:1 for body text, and 3:1 for large text and UI parts such as control borders and icons. Test real semantic pairs in every mode rather than primitives on their own, because a step that passes on one surface can fail on another.</P>
          <P>Automated checks help, but alpha colors, tinted surfaces, disabled states and nested surfaces all create pairs that a palette row never shows. You’ll find every tested pair in the contrast table on the Overview tab.</P>
        </>
      ),
      visual: <BorderFix />,
      caption: 'The default border is decorative here, since fields also have a label and a fill. Where a border is the only cue for a control, use color/border/strong.',
    },
    {
      title: 'Change colors through variables',
      body: (
        <>
          <P>Primitives hold the raw palette, semantic variables describe intent, and components use the semantic roles. When you change a primitive:</P>
          <Bullets
            items={[
              'Update it in the Primitives collection.',
              'Review the roles that point to it.',
              'Let the change flow into components.',
              'Check the affected states and real screens.',
              'Run the contrast tests again.',
            ]}
          />
          <P>If a component’s meaning hasn’t changed, don’t recolor it by hand. Let the roles carry the update.</P>
        </>
      ),
      visual: <EditingWorkflow />,
      caption: 'One edit to palette/brand/600 reaches every role that points to it, and through them every button, link and checkbox.',
    },
    {
      title: 'Change the brand palette',
      body: (
        <>
          <P>Make the change in the primitives, not component by component. Then review the whole family: subtle surfaces, borders, icons and text, solid fills, hover and pressed, selected states, text on brand surfaces, and every mode. Keep the roles as they are when their purpose hasn’t changed.</P>
          <P>The focus ring uses the brand family, so check it too. The change is done only when the whole family and its mappings pass.</P>
        </>
      ),
      visual: <BrandReplacement />,
      caption: `The structure, token names and copy stay the same. Only palette/brand/* changes. Contrast testing moved the ramp one step darker: white on teal/600 is ${fmt(TEAL_FAIL)}:1 and fails AA, so brand/600 maps to teal/700 (${fmt(TEAL_FIX)}:1).`,
    },
    {
      title: 'Change the neutral palette',
      body: (
        <>
          <P>Neutrals make up most of an interface, so they set its character. They can be warm, cool, very desaturated or slightly tinted with the brand. There’s no single correct gray.</P>
          <P>To change direction, update palette/neutral/* and keep the roles. Then check the text hierarchy, borders and dividers, disabled states, the page, card and raised surfaces, overlays and Dark, and run the contrast tests again.</P>
        </>
      ),
      visual: <NeutralCharacter />,
      caption: 'The card, brand and anatomy are the same in all three. Changing only the neutral hue shifts the text, borders and overall feel. The alternatives use comparison grays that aren’t Syncium tokens.',
    },
    {
      title: 'Update the effects that use color',
      body: (
        <>
          <P>A palette change also reaches shadows, focus rings and overlays, so keep their colors in shared roles. Shadows use color/shadow/*, focus rings use color/border/focus and color/border/danger, and the scrim uses color/overlay/scrim. See 1.5 Elevation for how the effects are built.</P>
          <P>After a palette change, recheck the shadow tint on light and dark surfaces, the focus ring’s contrast on the page and on raised cards, and how strong the scrim looks behind dialogs.</P>
        </>
      ),
      visual: <EffectDependencies />,
      caption: 'Each effect reads its color from one role, so a palette change updates all three.',
    },
  ];
  return <GuideList items={items} />;
}

export default function Color() {
  return (
    <>
      <style>{PREVIEW_CSS}</style>
      <DocPage
        eyebrow="Foundations › 1.1 Color"
        title="Color"
        description="Color carries the Syncium brand and tells people what’s happening. Components use semantic roles instead of raw palette values, so every screen works in Light and Dark and the palette can change in one place."
        figmaNode={figmaNodeFor('1.1')}
        tabs={[
          { label: 'Overview', render: () => <Overview /> },
          { label: 'Tokens', render: () => <TokensTab /> },
          { label: 'Guidelines', render: () => <GuidelinesTab /> },
        ]}
      />
    </>
  );
}
