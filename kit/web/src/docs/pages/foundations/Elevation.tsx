import { useState, type CSSProperties, type ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { Button, Checkbox, IconButton, Switch, TextField, TooltipBubble } from '@/components';
import { AnchorHeading, DocPage, Topics } from '../../DocPage';
import { breakable, Bullets, Caption, CodeBlock, H3, InlineCode, P, productHasWeb, Swatch, TokenBadge, tokenCodeColumns, tokenCodeNames, TokenTable } from '../../blocks';
import { figmaNodeFor } from '../../meta';
import { siteSchemes, supportedModes } from '../../modes';
import type { Topic } from '../../types';
import { config } from '@/ds.config';
import { brandCopy } from '@/brand/copy';

/* ---------- token helpers ---------- */
type Mode = 'light' | 'dark';
const vars = new Map(tokens.variables.map((v) => [v.name, v]));
const modeKey = (m: Mode) => (m === 'light' ? 'Light' : 'Dark');
const value = (name: string, m: Mode = 'light') => vars.get(name)?.modes[modeKey(m)]?.value ?? '';
const alias = (name: string, m: Mode = 'light') => vars.get(name)?.modes[modeKey(m)]?.alias ?? value(name, m);
const effect = (name: string) => tokens.effectStyles.find((e) => e.name === name);
const hasStyle = (name: string) => !!effect(name);
const shadows = tokens.effectStyles.filter((e) => e.name.startsWith('elevation/'));
const blurs = tokens.effectStyles.filter((e) => e.name.startsWith('blur/') && e.effects.some((l) => l.type === 'BACKGROUND_BLUR'));
const controlFocus = ['focus/default/control', 'focus/danger/control'].filter(hasStyle);

type Layer = (typeof tokens.effectStyles)[number]['effects'][number];
/** Colour role a layer is bound to (`color/shadow/key`). */
const step = (name: string) => name.split('/').pop()!;
const roleOf = (l: Layer) => (l.color as { alias?: string } | null)?.alias ?? '';
const isShadow = (l: Layer) => l.type === 'DROP_SHADOW' || l.type === 'INNER_SHADOW';
/** A layer that actually draws something (flat systems may keep empty or zeroed layers). */
const visible = (l: Layer) => isShadow(l) && (l.blur > 0 || l.spread !== 0 || l.x !== 0 || l.y !== 0);

/** One line per layer: `0 / 1 / 3 / 0 · key`. */
const layerLine = (l: Layer) =>
  l.type === 'BACKGROUND_BLUR'
    ? `background blur ${l.blur}`
    : `${l.type === 'INNER_SHADOW' ? 'inner ' : ''}${l.x} / ${l.y} / ${l.blur} / ${l.spread}${roleOf(l) ? ` · ${roleOf(l).split('/').pop()}` : ''}`;

/**
 * Depth treatment, read from the elevation styles (spec 1.5: flat, layered or tactile).
 * Flat: cards carry no shadow. Tactile: the control style adds inner shadows.
 */
const RAISED = effect('elevation/raised') ?? shadows[0];
const DEPTH: 'flat' | 'layered' | 'tactile' = !RAISED || !RAISED.effects.some(visible) ? 'flat' : effect('elevation/control')?.effects.some((l) => l.type === 'INNER_SHADOW') ? 'tactile' : 'layered';
const DEPTH_PHRASE = { flat: 'flat surfaces: borders and spacing separate layers, and only floating panels cast a shadow', layered: 'layered shadows that separate surfaces without decorating them', tactile: 'layered shadows, with a tactile edge and highlight on controls' }[DEPTH];
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const countWord = (n: number) => COUNT_WORDS[n] ?? `${n}`;

/** Relative luminance of a hex colour. */
function lum(hex: string) {
  const h = hex.replace('#', '').slice(0, 6);
  const [r, g, bl] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
/** WCAG contrast ratio between two hex colours. */
function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** Alpha of an 8-digit hex colour (1 for 6-digit). */
const alphaOf = (hex: string) => (/^#[0-9a-f]{8}$/i.test(hex) ? parseInt(hex.slice(7), 16) / 255 : 1);
/** Facts about Dark mode depth, read from the color roles rather than assumed. */
const DARK_SHADOW_STRONGER = alphaOf(value('color/shadow/key', 'dark')) > alphaOf(value('color/shadow/key', 'light'));
const DARK_RAISED_LIGHTER = !!value('color/surface/raised', 'dark') && lum(value('color/surface/raised', 'dark')) > lum(value('color/surface/base', 'dark'));

/** Focus ring geometry read from focus/default: the gap is the inner spread, the ring is the rest. */
const ringLayers = (effect('focus/default')?.effects ?? []).filter(isShadow);
const HAS_RING = ringLayers.length >= 2;
const gapPx = HAS_RING ? Math.min(...ringLayers.map((l) => l.spread)) : 0;
const ringPx = HAS_RING ? Math.max(...ringLayers.map((l) => l.spread)) - gapPx : 0;

/* ---------- small pieces ---------- */
function Themed({ mode, children, className, label = true }: { mode: Mode; children: ReactNode; className?: string; label?: boolean }) {
  return (
    <div data-theme={mode} className={cn('flex min-w-0 flex-col gap-lg rounded-surface bg-surface-sunken p-xl text-text-primary', className)}>
      {label && <span className="type-body-xs-semibold text-text-tertiary">{mode === 'light' ? 'Light' : 'Dark'}</span>}
      {children}
    </div>
  );
}

function ReportCard({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('flex w-full max-w-[16rem] flex-col gap-xs rounded-surface border border-border-subtle bg-surface-raised p-lg shadow-raised', className)} style={style}>
      <span className="flex items-center gap-sm type-body-sm-semibold text-text-primary">
        <Icon name="charts/chart-line" size="sm" className="text-icon-secondary" /> Monthly report
      </span>
      <span className="type-body-xs-regular text-text-secondary">Updated 2 hours ago</span>
    </div>
  );
}

function MenuPanel({ className }: { className?: string }) {
  return (
    <div className={cn('flex w-full max-w-[12rem] flex-col rounded-control border border-border-subtle bg-surface-overlay p-xs shadow-overlay', className)}>
      {(
        [
          ['general/edit', 'Rename'],
          ['files/folder', 'Move to…'],
          ['general/share', 'Share'],
        ] as const
      ).map(([icon, text]) => (
        <span key={text} className="flex items-center gap-sm rounded-sm px-md py-xs type-body-sm-medium text-text-secondary">
          <Icon name={icon} size="sm" className="text-icon-secondary" /> {text}
        </span>
      ))}
    </div>
  );
}

function DialogPanel() {
  return (
    <div className="flex w-full max-w-[17rem] flex-col gap-md rounded-modal border border-border-subtle bg-surface-overlay p-xl shadow-modal">
      <span className="type-body-md-semibold text-text-primary">Delete this project?</span>
      <span className="type-body-sm-regular text-text-secondary">Everyone on the team loses access to it.</span>
      <span className="flex justify-end gap-sm">
        <Button size="sm" emphasis="secondary" label="Cancel" tabIndex={-1} />
        <Button size="sm" tone="danger" label="Delete" tabIndex={-1} />
      </span>
    </div>
  );
}

function BaseSurface() {
  return (
    <div className="flex w-full max-w-[16rem] flex-col gap-xs rounded-surface border border-border-subtle bg-surface-base p-lg">
      <span className="type-body-sm-semibold text-text-primary">All projects</span>
      <span className="type-body-xs-regular text-text-secondary">Page background, no shadow</span>
    </div>
  );
}

const ALL_LEVELS: { name: string; style?: string; purpose: string; usedBy: string; surface: string; specimen: () => ReactNode }[] = [
  {
    name: 'Base',
    purpose: 'The page itself. Content sits straight on it, and borders and spacing separate things instead of shadows.',
    usedBy: 'Page background, sections, tables, lists',
    surface: 'color/surface/base',
    specimen: () => <BaseSurface />,
  },
  {
    name: 'Control',
    style: 'elevation/control',
    purpose: 'A hairline shadow that gives buttons a touchable edge without lifting them off the page.',
    usedBy: 'Primary and secondary buttons',
    surface: 'The control’s own fill',
    specimen: () => <Button emphasis="secondary" leadingIcon="general/share" label="Share" tabIndex={-1} />,
  },
  {
    name: 'Raised',
    style: 'elevation/raised',
    purpose: 'Lifts cards and panels just above the page, so related content reads as one object.',
    usedBy: 'Cards and panels',
    surface: 'color/surface/raised',
    specimen: () => <ReportCard />,
  },
  {
    name: 'Overlay',
    style: 'elevation/overlay',
    purpose: 'Menus, popovers and tooltips float over the page while they’re open, then close back into their trigger.',
    usedBy: 'Selects, menus, tooltips, popovers',
    surface: 'color/surface/overlay (color/surface/inverse for tooltips)',
    specimen: () => (
      <div className="flex flex-col items-center gap-md">
        <TooltipBubble placement="bottom" text="Saved 2 min ago" />
        <MenuPanel />
      </div>
    ),
  },
  {
    name: 'Modal',
    style: 'elevation/modal',
    purpose: 'Dialogs, drawers and sheets take over the screen until someone answers them, so they carry the deepest shadow.',
    usedBy: 'Dialogs, drawers, sheets',
    surface: 'color/surface/overlay',
    specimen: () => <DialogPanel />,
  },
];
/** Only the levels this system has an effect style for (the base level has none). */
const LEVELS = ALL_LEVELS.filter((l) => !l.style || hasStyle(l.style)).map((l, level) => ({ ...l, level }));

/** Focused controls on one surface. */
function FocusSet() {
  return (
    <div className="flex flex-wrap items-center gap-xl">
      <Button forceState="focus" label="Upload" tabIndex={-1} />
      <Button forceState="focus" emphasis="secondary" label="Cancel" tabIndex={-1} />
      <IconButton forceState="focus" icon="general/more-horizontal" label="More actions" tabIndex={-1} />
      <Checkbox forceState="focus" defaultChecked aria-label="Remember me" tabIndex={-1} />
      <Switch forceState="focus" defaultChecked aria-label="Notifications" tabIndex={-1} />
    </div>
  );
}

const FOCUS_SURFACES: { title: string; mode: Mode; surface: string; className: string }[] = [
  { title: 'On color/surface/base', mode: 'light', surface: 'color/surface/base', className: 'bg-surface-base border border-border-subtle' },
  { title: 'Dark mode', mode: 'dark', surface: 'color/surface/base', className: 'bg-surface-base' },
  { title: 'On color/surface/brand-subtle', mode: 'light', surface: 'color/surface/brand-subtle', className: 'bg-surface-brand-subtle' },
];

/** Busy backdrop for the blur specimens: stripes in brand, info and warning fills (decorative). */
const STRIPES: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--color-fill-brand-solid) 0 14px, var(--color-fill-info-solid) 14px 28px, var(--color-fill-warning-solid) 28px 42px, var(--color-surface-base) 42px 56px)',
};
function BlurBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-lg rounded-surface p-xl sm:grid-cols-3" style={STRIPES}>
      {children}
    </div>
  );
}

function Meta({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xxs">
      <span className="type-body-xs-semibold text-text-tertiary">{k}</span>
      <span className="type-body-sm-regular text-text-secondary">{children}</span>
    </div>
  );
}

/** What each blur step is for, by step name (spec 1.5 · Backdrop blurs). */
const BLUR_USE: Record<string, string> = {
  sm: 'sticky headers over content',
  md: 'floating panels over media',
  lg: 'full-screen overlays over imagery',
};

const FOCUS_GROUPS = [
  { names: ['focus/default'], text: 'For brand and neutral controls, like buttons, links, tabs, checkboxes and switches.' },
  { names: ['focus/danger'], text: 'For invalid fields and danger actions, so the ring matches the error color.' },
  { names: controlFocus, text: 'The same rings plus the elevation/control shadow, for controls that also carry one.' },
]
  .map((g) => ({ ...g, names: g.names.filter(hasStyle) }))
  .filter((g) => g.names.length > 0);

/* ---------- Overview ---------- */
function Overview() {
  const raisedLevels = LEVELS.filter((l) => l.style).length;
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-lg">
        <AnchorHeading>How depth works</AnchorHeading>
        <P>
          {`Elevation shows people what sits on top of what. ${brandCopy.depthDirection({ name: config.name, depth: DEPTH_PHRASE })} Above the page there ${raisedLevels === 1 ? 'is one shadow level' : `are ${countWord(raisedLevels)} shadow levels`}, each with its own job and its own surface color.`}
        </P>
        <Bullets
          items={[
            'The higher something sits, the more temporary it is: a card stays, a menu closes, a dialog waits for an answer.',
            DARK_SHADOW_STRONGER
              ? 'Shadows are built from color roles, so they get stronger in Dark mode, where shadows are harder to see.'
              : 'Shadows are built from color roles, so a palette or mode change reaches every shadow.',
            ...(DARK_RAISED_LIGHTER ? ['Raised surfaces also get lighter in Dark mode, so depth shows through color as well as shadow.'] : []),
          ]}
        />
      </section>

      <section className="flex flex-col gap-2xl">
        <AnchorHeading>Levels</AnchorHeading>
        <P>The levels run from lowest to highest. Each one shows the same example in Light and Dark.</P>
        {LEVELS.map((l) => (
          <div key={l.name} className="grid gap-xl border-t border-border-subtle pt-2xl lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <div className="flex flex-col gap-md">
              <span className="type-body-xs-semibold text-text-brand">Level {l.level}</span>
              <H3>{l.name}</H3>
              <P className="type-body-sm-regular">{l.purpose}</P>
              <Meta k="Used by">{l.usedBy}</Meta>
              <Meta k="Surface">{l.surface}</Meta>
              <Meta k="Effect style">{l.style ? <TokenBadge name={l.style} /> : 'None'}</Meta>
            </div>
            <div className="grid gap-lg sm:grid-cols-2">
              {siteSchemes.map((m) => (
                <Themed key={m} mode={m} className="min-h-44">
                  <div className="flex flex-1 items-center justify-center py-md">{l.specimen()}</div>
                </Themed>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Focus rings</AnchorHeading>
        {HAS_RING ? (
          <>
            <P>
              People who move through the page with a keyboard or another non-pointer device need to see where they are, so every interactive component shows a focus
              ring. It has two parts: a {gapPx}-pixel gap in the surface color, then a {ringPx}-pixel ring in <InlineCode>color/border/focus</InlineCode>. The gap keeps
              the ring visible on any background, even next to a dark button.
            </P>
            <div className="grid gap-xl md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
              <div className="flex justify-center p-3xl" aria-hidden>
                <span
                  className="type-body-md-semibold inline-flex h-(--size-control-xl) items-center rounded-control bg-fill-brand-solid px-2xl text-text-on-solid"
                  style={{ boxShadow: `0 0 0 ${gapPx * 4}px var(--color-surface-base), 0 0 0 ${(gapPx + ringPx) * 4}px var(--color-border-focus)` }}
                >
                  Upload
                </span>
              </div>
              <div className="flex flex-col gap-md">
                <Caption>Shown at 4× so you can see both parts.</Caption>
                <span className="flex items-center gap-sm type-body-sm-regular text-text-secondary">
                  <Swatch name="color/surface/base" /> Gap · {gapPx} px · color/surface/base
                </span>
                <span className="flex items-center gap-sm type-body-sm-regular text-text-secondary">
                  <Swatch name="color/border/focus" /> Ring · {ringPx} px (border/width/focus) · color/border/focus
                </span>
              </div>
            </div>
          </>
        ) : (
          <P>
            People who move through the page with a keyboard or another non-pointer device need to see where they are, so every interactive component shows a focus
            ring in <InlineCode>color/border/focus</InlineCode>.
          </P>
        )}
        <H3>Focused controls on different surfaces</H3>
        <P className="type-body-sm-regular">The ring keeps at least 3:1 contrast with the surface behind it. The ratios below are calculated live from the current color tokens.</P>
        <div className="grid gap-lg lg:grid-cols-3">
          {FOCUS_SURFACES.filter((s) => siteSchemes.includes(s.mode)).map((s) => (
            <div key={s.title} data-theme={s.mode} className={cn('flex flex-col gap-lg rounded-surface p-xl text-text-primary', s.className)}>
              <div className="flex flex-col gap-xxs">
                <span className="type-body-sm-semibold text-text-primary">{s.title}</span>
                {/* On a tinted surface the caption takes the primary text color, so it stays AA whatever the tint. */}
                <span className={cn('type-body-xs-regular', s.surface === 'color/surface/base' ? 'text-text-secondary' : 'text-text-primary')}>
                  Ring {contrast(value('color/border/focus', s.mode), value(s.surface, s.mode)).toFixed(1)}:1 against the surface
                </span>
              </div>
              <FocusSet />
            </div>
          ))}
        </div>
        {FOCUS_GROUPS.length > 0 && (
          <>
            <H3>{controlFocus.length ? 'Three groups of focus styles' : 'Focus styles'}</H3>
            <div className={cn('grid gap-lg', FOCUS_GROUPS.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
              {FOCUS_GROUPS.map((g) => (
                <div key={g.names[0]} className="flex flex-col gap-md rounded-surface border border-border-subtle p-lg">
                  <span className="flex flex-wrap gap-xs">
                    {g.names.map((n) => (
                      <TokenBadge key={n} name={n} />
                    ))}
                  </span>
                  <span className="type-body-sm-regular text-text-secondary">{g.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {controlFocus.length > 0 && (
          <P className="type-body-sm-regular">
            Why the combined styles? In Figma, a layer can hold only one effect style, so a control with both a shadow and a ring needs a single style that carries both.
          </P>
        )}
      </section>

      {blurs.length > 0 && (
        <section className="flex flex-col gap-lg">
          <AnchorHeading>Backdrop blur</AnchorHeading>
          <P>{brandCopy.backdropBlurUse}</P>
          {siteSchemes.map((m) => (
            <Themed key={m} mode={m}>
              <BlurBackdrop>
                {blurs.map((b) => {
                  const use = BLUR_USE[step(b.name)];
                  return (
                    <div
                      key={b.name}
                      className="flex flex-col gap-xxs rounded-surface p-lg text-text-primary"
                      style={{ backdropFilter: `blur(var(${b.css}))`, WebkitBackdropFilter: `blur(var(${b.css}))`, background: 'color-mix(in srgb, var(--color-surface-overlay) 80%, transparent)' }}
                    >
                      <span className="type-code-sm-medium">{b.name}</span>
                      <span className="type-body-xs-regular">
                        Blur {b.effects.find((l) => l.type === 'BACKGROUND_BLUR')?.blur}
                        {use ? ` · ${use}` : ''}
                      </span>
                    </div>
                  );
                })}
              </BlurBackdrop>
            </Themed>
          ))}
        </section>
      )}
    </div>
  );
}

/* ---------- Tokens ---------- */
function Tokens() {
  const css = (m: Mode) => tokens.effectStyles.map((e) => `  ${e.css}: ${m === 'light' ? e.light : e.dark};`).join('\n');
  const tw = (name: string) => effect(name)?.tailwind;
  const lines: [string, string][] = [];
  if (tw('elevation/raised')) lines.push([`<div class="rounded-surface border border-border-subtle bg-surface-raised ${tw('elevation/raised')}">…</div>`, 'card']);
  if (tw('elevation/overlay')) lines.push([`<div class="rounded-control bg-surface-overlay ${tw('elevation/overlay')}">…</div>`, 'menu']);
  if (tw('elevation/modal')) lines.push([`<div class="rounded-modal bg-surface-overlay ${tw('elevation/modal')}">…</div>`, 'dialog']);
  const control = [tw('elevation/control'), tw('focus/default') && `is-focus:${tw('focus/default')}`].filter(Boolean).join(' ');
  if (control) lines.push([`<button class="${control}">…</button>`, 'control']);
  const blur = blurs[Math.floor(blurs.length / 2)];
  if (blur) lines.push([`<div class="${blur.tailwind} bg-surface-overlay/80">…</div>`, 'over media']);
  const width = Math.max(...lines.map(([t]) => t.length));
  const recipe = `/* Tailwind utilities */
${lines.map(([t, c]) => `${t.padEnd(width + 3)}/* ${c} */`).join('\n')}

/* CSS variables, generated from the Figma effect styles */
:root, [data-theme="light"] {
${css('light')}
}
[data-theme="dark"] {
${css('dark')}
}`;
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-lg">
        <AnchorHeading>Effect styles</AnchorHeading>
        <P>
          Effect styles aren’t variables. Each one is a short stack of layers, and each layer takes its color from a color role. The Layers column reads{' '}
          <InlineCode>x / y / blur / spread · role</InlineCode>.
        </P>
        <div tabIndex={0} role="region" aria-label="Effect styles" className="overflow-x-auto rounded-surface border border-border-subtle outline-none is-focus:shadow-focus-default">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr className="type-body-xs-semibold text-text-tertiary">
                <th className="px-lg py-md">Style</th>
                <th className="px-lg py-md">Layers</th>
                {supportedModes.map((m) => (
                  <th key={m} className="px-lg py-md">
                    {m}
                  </th>
                ))}
                {tokenCodeColumns.map((c) => (
                  <th key={c} className="px-lg py-md">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.effectStyles.map((e) => (
                <tr key={e.name} className="border-t border-border-subtle align-top">
                  <td className="px-lg py-md">
                    <TokenBadge name={e.name} />
                  </td>
                  {[
                    e.effects.map(layerLine),
                    ...supportedModes.map((m) => e.effects.map((l) => (roleOf(l) ? alias(roleOf(l), m === 'Dark' ? 'dark' : 'light') : '—'))),
                  ].map((lines, i) => (
                    <td key={i} className="px-lg py-md">
                      {lines.map((t, j) => (
                        <span key={j} className="type-code-sm-regular block whitespace-nowrap text-text-secondary">
                          {t}
                        </span>
                      ))}
                    </td>
                  ))}
                  {tokenCodeNames(e).map((c, i) => (
                    <td key={tokenCodeColumns[i]} className={cn('type-code-sm-regular px-lg py-md', i === 1 && productHasWeb ? 'text-text-brand' : 'text-text-secondary')}>
                      {breakable(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="flex flex-col gap-lg">
        <AnchorHeading>Color roles behind the effects</AnchorHeading>
        <P>Change one of these roles and every shadow and ring follows. The only value typed into the focus styles by hand is the ring width.</P>
        <TokenTable names={['color/shadow/ambient', 'color/shadow/key', 'color/shadow/edge', 'color/shadow/highlight', 'color/border/focus', 'color/border/danger', 'color/surface/base', 'border/width/focus'].filter((n) => vars.has(n))} />
      </section>
      <section className="flex flex-col gap-lg">
        <AnchorHeading>In code</AnchorHeading>
        <P>Use the utilities in components. The variables switch with the color mode, so one class works in both Light and Dark.</P>
        <CodeBlock lang="css" code={recipe} label="Elevation CSS recipe" />
      </section>
    </div>
  );
}

/* ---------- Guidelines ---------- */
const FLAT: CSSProperties = Object.fromEntries(shadows.map((s) => [s.css, '0 0 #0000'])) as CSSProperties;

function PropagationDemo() {
  const [flat, setFlat] = useState(false);
  return (
    <div className="flex w-full flex-col gap-lg">
      <label className="flex items-center gap-md self-start type-body-sm-medium text-text-primary">
        <Switch checked={flat} onCheckedChange={setFlat} /> Preview without the elevation/* shadows
      </label>
      <div className="flex flex-wrap items-center justify-center gap-xl rounded-surface bg-surface-sunken p-2xl" style={flat ? FLAT : undefined}>
        <Button label="Upload" leadingIcon="general/upload" tabIndex={-1} />
        <Button emphasis="secondary" label="Share" tabIndex={-1} />
        <ReportCard />
        <MenuPanel />
      </div>
      <Caption>{flat ? 'After: one edit to the styles, and every button, card and menu goes flat. Borders still carry the edges.' : 'Before: the system’s current shadows.'}</Caption>
    </div>
  );
}

/** One specimen per colour mode, side by side, so the stronger Dark shadows are visible. */
function ModePair({ render }: { render: () => ReactNode }) {
  return (
    <div className="grid h-28 w-full grid-cols-2 overflow-hidden rounded-surface">
      {siteSchemes.map((m) => (
        <div key={m} data-theme={m} className="flex flex-col items-center justify-center gap-xs bg-surface-sunken">
          {render()}
          <span className="type-body-xs-regular text-text-tertiary">{m === 'light' ? 'Light' : 'Dark'}</span>
        </div>
      ))}
    </div>
  );
}

/** CSS colour for a layer: its bound color role, or the raw colour if a layer was left unbound. */
const layerColor = (l: Layer) => {
  const role = vars.get(roleOf(l));
  if (role) return `var(${role.css})`;
  const c = l.color as { r?: number; g?: number; b?: number; a?: number } | null;
  return c && c.r !== undefined ? `rgb(${Math.round(c.r * 255)} ${Math.round((c.g ?? 0) * 255)} ${Math.round((c.b ?? 0) * 255)} / ${c.a ?? 1})` : 'transparent';
};

function StackAnatomy() {
  if (!RAISED) return null;
  const layers = RAISED.effects.filter(isShadow).sort((a, b) => b.blur - a.blur);
  const cell = 'size-12 rounded-surface bg-surface-raised';
  const tactile = layers.some((l) => l.type === 'INNER_SHADOW');
  return (
    <div className="grid w-full gap-xl sm:grid-cols-2 lg:grid-cols-4">
      {layers.map((l, i) => (
        <div key={`${i}-${layerLine(l)}`} className="flex flex-col items-center gap-md">
          <ModePair
            render={() => (
              <div className={cell} style={{ boxShadow: `${l.type === 'INNER_SHADOW' ? 'inset ' : ''}${l.x * 4}px ${l.y * 4}px ${l.blur * 4}px ${l.spread * 4}px ${layerColor(l)}` }} />
            )}
          />
          <span className="type-code-sm-medium text-text-primary">{layerLine(l)}</span>
          {roleOf(l) && (
            <span className="type-body-xs-regular text-center text-text-secondary">
              {roleOf(l)} · Light {alias(roleOf(l), 'light').split('/').slice(1).join('/')} · Dark {alias(roleOf(l), 'dark').split('/').slice(1).join('/')}
            </span>
          )}
        </div>
      ))}
      <div className="flex flex-col items-center gap-md">
        <ModePair render={() => <div className={cn(cell, 'border border-border-subtle')} />} />
        <span className="type-code-sm-medium text-text-primary">stroke + fill</span>
        <span className="type-body-xs-regular text-center text-text-secondary">color/border/subtle at border/width/default · color/surface/raised</span>
      </div>
      <div className="flex flex-col items-center gap-md">
        <ModePair render={() => <div className={cn(cell, 'border border-border-subtle')} style={{ boxShadow: `var(${RAISED.css})` }} />} />
        <span className="type-code-sm-medium text-text-primary">= {RAISED.name}</span>
        <span className="type-body-xs-regular text-center text-text-secondary">
          {tactile ? 'At real size, with every layer back together, including the inner edge and highlight.' : 'At real size, with every layer back together. It uses drop shadows only, with no inner highlight.'}
        </span>
      </div>
    </div>
  );
}

function LayerOrder() {
  const order = [
    { n: 'Modal', d: 'Dialogs and drawers, with a scrim (color/overlay/scrim) that dims the page' },
    { n: 'Overlay', d: 'Menus, popovers, tooltips' },
    { n: 'Sticky', d: 'Headers and toolbars pinned while content scrolls' },
    { n: 'Raised', d: 'Cards and panels' },
    { n: 'Base', d: 'The page' },
  ];
  return (
    <ol className="flex w-full max-w-[36rem] flex-col gap-xs">
      {order.map((o, i) => (
        <li key={o.n} className="flex items-center gap-lg rounded-control border border-border-subtle bg-surface-raised p-md shadow-raised" style={{ marginInlineStart: `calc(var(--space-xl) * ${order.length - 1 - i})` }}>
          <span className="type-body-xs-semibold w-6 shrink-0 text-text-brand">{order.length - i}</span>
          <span className="flex flex-col">
            <span className="type-body-sm-semibold text-text-primary">{o.n}</span>
            <span className="type-body-xs-regular text-text-secondary">{o.d}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

const DEPTH_LABEL = { flat: 'Flat', layered: 'Layered depth', tactile: 'Tactile depth' }[DEPTH];

const TOPICS: Topic[] = [
  {
    title: 'Depth is a choice',
    body: `A design system can be flat, subtly elevated, strongly layered or tactile. ${brandCopy.depthWhy({ name: config.name, depth: DEPTH_PHRASE })}\n\nUse elevation sparingly. A shadow signals that something sits above the page, and when everything has one, nothing stands out. Most content belongs on the base level, separated by space and borders.`,
    render: () => (
      <div className={cn('grid w-full gap-xl', DEPTH !== 'flat' && 'md:grid-cols-2')}>
        {(DEPTH === 'flat'
          ? [{ t: `${config.name} · flat, the shadow layer is off`, style: undefined }]
          : [
              { t: 'Flat', style: FLAT },
              { t: `${config.name} · ${DEPTH_LABEL.toLowerCase()}`, style: undefined },
            ]
        ).map((v) => (
          <div key={v.t} className="flex flex-col items-center gap-lg rounded-surface bg-surface-base p-2xl" style={v.style}>
            <span className="type-body-xs-semibold text-text-tertiary">{v.t}</span>
            <ReportCard />
            <Button emphasis="secondary" label="View report" tabIndex={-1} />
          </div>
        ))}
      </div>
    ),
    do: { caption: 'Lift only what needs to stand apart: one card group, one open menu.', render: () => <ReportCard /> },
    dont: {
      caption: 'Shadows on every row and label make the page noisy, and nothing reads as on top.',
      render: () => (
        <div className="flex w-full max-w-[16rem] flex-col gap-xs">
          {['Q3 report', 'Team roadmap', 'Budget'].map((t) => (
            <span key={t} className="rounded-sm bg-surface-raised px-md py-xs type-body-sm-regular text-text-primary shadow-modal">
              {t}
            </span>
          ))}
        </div>
      ),
    },
  },
  {
    title: 'Shadows in Dark mode',
    body: `Shadows are much harder to see on a dark page. ${
      DARK_SHADOW_STRONGER && DARK_RAISED_LIGHTER
        ? 'That’s why the shadow color roles are stronger in Dark, and raised surfaces get lighter, so depth shows through the surface color as well as the shadow.'
        : DARK_SHADOW_STRONGER
          ? 'That’s why the shadow color roles are stronger in Dark.'
          : DARK_RAISED_LIGHTER
            ? 'That’s why raised surfaces get lighter in Dark, so depth shows through the surface color as well as the shadow.'
            : 'Make the shadow roles stronger in Dark, or step raised surfaces lighter, so depth stays visible.'
    }\n\nAvoid turning a shadow into a light glow: it reads as a highlight, not as depth.`,
    render: () => (
      <div className="grid w-full gap-lg sm:grid-cols-2">
        {siteSchemes.map((m) => (
          <Themed key={m} mode={m}>
            <div className="flex flex-col items-center gap-lg py-md">
              <ReportCard />
              <MenuPanel />
            </div>
            <Caption>
              Raised fill {alias('color/surface/raised', m)} · key shadow {alias('color/shadow/key', m)}
            </Caption>
          </Themed>
        ))}
      </div>
    ),
  },
  ...(DEPTH === 'flat' || !RAISED
    ? []
    : [
        {
          title: 'How a shadow is built',
          body: `Each style is a short stack of shadows, each tied to a color role. A wide, soft ambient layer spreads the shadow, and a tighter key layer gives it direction.\n\nBelow, ${RAISED.name} is pulled apart into its layers, then put back together. The shadows are drawn at 4× so you can see them, and the values come straight from the styles.`,
          render: () => <StackAnatomy />,
        },
      ]),
  {
    title: 'Don’t stack elevations',
    body: 'A raised card inside a raised card doubles the shadow and muddles the hierarchy. Inside a card, separate content with dividers, spacing or a sunken area instead.\n\nA popup over a card is fine, because it’s a higher level, not the same level twice.',
    do: {
      caption: 'Group rows inside one raised card with dividers.',
      render: () => (
        <div className="flex w-full max-w-[16rem] flex-col rounded-surface border border-border-subtle bg-surface-raised shadow-raised">
          {['Q3 report', 'Team roadmap'].map((t, i) => (
            <span key={t} className={cn('px-lg py-md type-body-sm-regular text-text-primary', i > 0 && 'border-t border-border-subtle')}>
              {t}
            </span>
          ))}
        </div>
      ),
    },
    dont: {
      caption: 'Shadowed cards nested inside a shadowed card.',
      render: () => (
        <div className="flex w-full max-w-[16rem] flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-md shadow-overlay">
          {['Q3 report', 'Team roadmap'].map((t) => (
            <span key={t} className="rounded-surface border border-border-subtle bg-surface-raised px-lg py-md type-body-sm-regular text-text-primary shadow-overlay">
              {t}
            </span>
          ))}
        </div>
      ),
    },
  },
  {
    title: 'Layering order',
    body: 'Higher levels always sit above lower ones, whatever order they come in the code. A menu opened from a sticky header covers the header. A dialog covers everything, including open menus, and dims the page behind it.\n\nKeep one stacking order for the whole product instead of pushing a single element to the top.',
    render: () => <LayerOrder />,
  },
  {
    title: 'Change the depth in one place',
    body: `Edit a style or its color role and every component updates. To make the whole system flat, clear the shadows in the elevation/* styles${controlFocus.length ? ' and the focus/*/control styles' : ''}. Nothing else needs to change. Try it below.`,
    render: () => <PropagationDemo />,
  },
  {
    title: 'Focus isn’t hover',
    body: 'Hover follows the pointer and is only a hint. Focus shows where the keyboard is, so it must always be visible: without it, keyboard users lose their place.\n\nEvery interactive component has a focus state that uses a focus/* style, so the ring looks the same everywhere.',
    render: () => (
      <div className="grid w-full gap-xl sm:grid-cols-2">
        {[
          { t: 'Hover', s: 'hover' as const, c: 'A color change under the pointer.' },
          { t: 'Focus', s: 'focus' as const, c: 'The ring, for keyboard and switch users.' },
        ].map((v) => (
          <div key={v.t} className="flex flex-col items-center gap-md">
            <div className="flex gap-md">
              <Button forceState={v.s} emphasis="secondary" label="Share" tabIndex={-1} />
              <Checkbox forceState={v.s} defaultChecked aria-label={`Remember me (${v.t})`} tabIndex={-1} />
            </div>
            <span className="type-body-sm-semibold text-text-primary">{v.t}</span>
            <Caption>{v.c}</Caption>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Apply focus styles',
    body: `Apply focus through the component’s focus state rather than drawing a ring on one instance, so every copy stays in sync. Use focus/danger on invalid fields and danger actions${controlFocus.length ? ', and the /control versions when a control has a shadow' : ''}.\n\nThe ring color is a variable, but the ring width is typed into the style, because Figma can’t bind an effect’s spread to a variable. When border/width/focus changes, update the focus/* styles at the same time.`,
    render: () => (
      <div className="flex w-full flex-wrap items-end justify-center gap-2xl">
        <div className="w-full max-w-[18rem]">
          <TextField label="Project name" defaultValue="Q3 launch" status="invalid" hint="This field needs attention." forceState="focus" />
        </div>
        <Button tone="danger" forceState="focus" label="Delete" tabIndex={-1} />
      </div>
    ),
  },
  {
    title: 'Where effect colors come from',
    body: 'Shadows take their color from color/shadow/key and color/shadow/ambient, and rings from color/border/focus and color/border/danger.\n\nA palette change reaches every effect through those roles. Avoid typing a color straight into a shadow, because it won’t update.',
    render: () => (
      <div className="grid w-full gap-xl md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <div className="flex flex-col items-center gap-xl">
          <ReportCard />
          <Button forceState="focus" label="Upload" tabIndex={-1} />
        </div>
        <div className="flex flex-col gap-md">
          {['color/shadow/key', 'color/shadow/ambient', 'color/border/focus', 'color/surface/base'].filter((n) => vars.has(n)).map((n) => (
            <div key={n} className="flex flex-wrap items-center gap-sm">
              <Swatch name={n} />
              <Swatch name={n} mode="Dark" />
              <span className="type-code-sm-regular text-text-primary">{n}</span>
              <span className="type-body-xs-regular text-text-secondary">
                {alias(n, 'light')} · {alias(n, 'dark')}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function Elevation() {
  return (
    <DocPage
      eyebrow="Foundations › 1.5 Elevation"
      title="Elevation"
      description={`Elevation shows what sits above what. ${DEPTH === 'flat' ? 'Borders separate surfaces and only floating panels cast a shadow' : 'Shadows lift cards and menus'}${blurs.length ? ', a two-part focus ring stays visible on any surface, and backdrop blur keeps controls over media readable.' : ', and a two-part focus ring stays visible on any surface.'}`}
      figmaNode={figmaNodeFor('1.5')}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Tokens', render: () => <Tokens /> },
        { label: 'Guidelines', render: () => <Topics items={TOPICS} /> },
      ]}
    />
  );
}

