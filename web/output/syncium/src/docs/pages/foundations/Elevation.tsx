import { useState, type CSSProperties, type ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { Button, Checkbox, IconButton, Switch, TextField, TooltipBubble } from '@/components';
import { AnchorHeading, DocPage, Topics } from '../../DocPage';
import { Bullets, Caption, CodeBlock, H3, InlineCode, P, Swatch, TokenBadge, TokenTable } from '../../blocks';
import { pageMeta } from '../../meta';
import type { Topic } from '../../types';

/* ---------- token helpers ---------- */
type Mode = 'light' | 'dark';
const vars = new Map(tokens.variables.map((v) => [v.name, v]));
const modeKey = (m: Mode) => (m === 'light' ? 'Light' : 'Dark');
const value = (name: string, m: Mode = 'light') => vars.get(name)?.modes[modeKey(m)]?.value ?? '';
const alias = (name: string, m: Mode = 'light') => vars.get(name)?.modes[modeKey(m)]?.alias ?? value(name, m);
const effect = (name: string) => tokens.effectStyles.find((e) => e.name === name)!;
const shadows = tokens.effectStyles.filter((e) => e.name.startsWith('elevation/'));
const blurs = tokens.effectStyles.filter((e) => e.name.startsWith('blur/'));

type Layer = (typeof tokens.effectStyles)[number]['effects'][number];
/** Colour role a layer is bound to (`color/shadow/key`). */
const roleOf = (l: Layer) => (l.color as { alias?: string } | null)?.alias ?? '';

/** One line per layer: `0 / 1 / 3 / 0 · key`. */
const layerLine = (l: Layer) =>
  l.type === 'BACKGROUND_BLUR' ? `background blur ${l.blur}` : `${l.x} / ${l.y} / ${l.blur} / ${l.spread} · ${roleOf(l).split('/').pop()}`;

/** WCAG contrast ratio between two hex colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const h = hex.replace('#', '').slice(0, 6);
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Focus ring geometry read from focus/default: the gap is the inner spread, the ring is the rest. */
const ringLayers = effect('focus/default').effects;
const gapPx = Math.min(...ringLayers.map((l) => l.spread));
const ringPx = Math.max(...ringLayers.map((l) => l.spread)) - gapPx;

/* ---------- small pieces ---------- */
function Themed({ mode, children, className, label = true }: { mode: Mode; children: ReactNode; className?: string; label?: boolean }) {
  return (
    <div data-theme={mode} className={cn('flex min-w-0 flex-col gap-lg rounded-surface bg-surface-sunken p-xl text-text-primary', className)}>
      {label && <span className="type-body-xs-semibold text-text-tertiary">{mode === 'light' ? 'Light' : 'Dark'}</span>}
      {children}
    </div>
  );
}

function StorageCard({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('flex w-full max-w-[16rem] flex-col gap-xs rounded-surface border border-border-subtle bg-surface-raised p-lg shadow-raised', className)} style={style}>
      <span className="flex items-center gap-sm type-body-sm-semibold text-text-primary">
        <Icon name="files/hard-drive" size="sm" className="text-icon-secondary" /> Storage
      </span>
      <span className="type-body-xs-regular text-text-secondary">1.2 TB of 2 TB used</span>
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
      <span className="type-body-md-semibold text-text-primary">Delete 3 files?</span>
      <span className="type-body-sm-regular text-text-secondary">They move to Trash for 30 days.</span>
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
      <span className="type-body-sm-semibold text-text-primary">All files</span>
      <span className="type-body-xs-regular text-text-secondary">Page background, no shadow</span>
    </div>
  );
}

const LEVELS: { level: number; name: string; style?: string; purpose: string; usedBy: string; surface: string; specimen: () => ReactNode }[] = [
  {
    level: 0,
    name: 'Base',
    purpose: 'The page itself. Content sits straight on it, and borders and spacing separate things instead of shadows.',
    usedBy: 'Page background, sections, tables, lists',
    surface: 'color/surface/base',
    specimen: () => <BaseSurface />,
  },
  {
    level: 1,
    name: 'Control',
    style: 'elevation/control',
    purpose: 'A hairline shadow that gives buttons a touchable edge without lifting them off the page.',
    usedBy: 'Primary and secondary buttons',
    surface: 'The control’s own fill',
    specimen: () => <Button emphasis="secondary" leadingIcon="general/sync" label="Sync now" tabIndex={-1} />,
  },
  {
    level: 2,
    name: 'Raised',
    style: 'elevation/raised',
    purpose: 'Lifts cards and panels just above the page, so related content reads as one object.',
    usedBy: 'Cards, panels, plan cards',
    surface: 'color/surface/raised',
    specimen: () => <StorageCard />,
  },
  {
    level: 3,
    name: 'Overlay',
    style: 'elevation/overlay',
    purpose: 'Menus, popovers and tooltips float over the page while they’re open, then close back into their trigger.',
    usedBy: 'Selects, menus, tooltips, popovers',
    surface: 'color/surface/overlay (color/surface/inverse for tooltips)',
    specimen: () => (
      <div className="flex flex-col items-center gap-md">
        <TooltipBubble placement="bottom" text="Synced 2 min ago" />
        <MenuPanel />
      </div>
    ),
  },
  {
    level: 4,
    name: 'Modal',
    style: 'elevation/modal',
    purpose: 'Dialogs, drawers and sheets take over the screen until someone answers them, so they carry the deepest shadow.',
    usedBy: 'Dialogs, drawers, sheets',
    surface: 'color/surface/overlay',
    specimen: () => <DialogPanel />,
  },
];

/** Focused controls on one surface. */
function FocusSet() {
  return (
    <div className="flex flex-wrap items-center gap-xl">
      <Button forceState="focus" label="Upload" tabIndex={-1} />
      <Button forceState="focus" emphasis="secondary" label="Cancel" tabIndex={-1} />
      <IconButton forceState="focus" icon="general/more-horizontal" label="More actions" tabIndex={-1} />
      <Checkbox forceState="focus" defaultChecked aria-label="Keep versions" tabIndex={-1} />
      <Switch forceState="focus" defaultChecked aria-label="Sync on" tabIndex={-1} />
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

/* ---------- Overview ---------- */
function Overview() {
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-lg">
        <AnchorHeading>How depth works</AnchorHeading>
        <P>
          Elevation shows people what sits on top of what. Syncium keeps depth subtle: soft, low shadows that separate layers without decorating them, in keeping
          with the brand’s calm, spacious feel. Above the page there are four shadow levels, each with its own job and its own surface color.
        </P>
        <Bullets
          items={[
            'The higher something sits, the more temporary it is: a card stays, a menu closes, a dialog waits for an answer.',
            'Shadows are built from color roles, so they get stronger in Dark mode, where shadows are harder to see.',
            'Raised surfaces also get lighter in Dark mode, so depth shows through color as well as shadow.',
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
              {(['light', 'dark'] as const).map((m) => (
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
        <H3>Focused controls on different surfaces</H3>
        <P className="type-body-sm-regular">The ring keeps at least 3:1 contrast with the surface behind it. The ratios below are calculated live from the current color tokens.</P>
        <div className="grid gap-lg lg:grid-cols-3">
          {FOCUS_SURFACES.map((s) => (
            <div key={s.title} data-theme={s.mode} className={cn('flex flex-col gap-lg rounded-surface p-xl text-text-primary', s.className)}>
              <div className="flex flex-col gap-xxs">
                <span className="type-body-sm-semibold text-text-primary">{s.title}</span>
                <span className="type-body-xs-regular text-text-secondary">Ring {contrast(value('color/border/focus', s.mode), value(s.surface, s.mode)).toFixed(1)}:1 against the surface</span>
              </div>
              <FocusSet />
            </div>
          ))}
        </div>
        <H3>Three groups of focus styles</H3>
        <div className="grid gap-lg md:grid-cols-3">
          {[
            { names: ['focus/default'], text: 'For brand and neutral controls, like buttons, links, tabs, checkboxes and switches.' },
            { names: ['focus/danger'], text: 'For invalid fields and danger actions, so the ring matches the error color.' },
            { names: ['focus/default/control', 'focus/danger/control'], text: 'The same rings plus the elevation/control shadow, for controls that also carry one.' },
          ].map((g) => (
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
        <P className="type-body-sm-regular">
          Why the combined styles? In Figma, a layer can hold only one effect style, so a control with both a shadow and a ring needs a single style that carries both.
        </P>
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Backdrop blur</AnchorHeading>
        <P>
          Translucent panels over photos and video blur what’s behind them, so the controls on top stay readable. Syncium uses them for the video player overlay and
          for floating panels over media. Use a stronger blur over busier content.
        </P>
        {(['light', 'dark'] as const).map((m) => (
          <Themed key={m} mode={m}>
            <BlurBackdrop>
              {blurs.map((b, i) => (
                <div
                  key={b.name}
                  className={cn(
                    'flex flex-col gap-xxs rounded-surface bg-video-player-tooltip-fill p-lg text-video-player-control-fg',
                    ['backdrop-blur-backdrop-sm', 'backdrop-blur-backdrop-md', 'backdrop-blur-backdrop-lg'][i],
                  )}
                >
                  <span className="type-code-sm-medium">{b.name}</span>
                  <span className="type-body-xs-regular">
                    Blur {b.effects[0].blur} · {['sticky headers over content', 'floating panels over media', 'full-screen overlays over imagery'][i]}
                  </span>
                </div>
              ))}
            </BlurBackdrop>
          </Themed>
        ))}
      </section>
    </div>
  );
}

/* ---------- Tokens ---------- */
function Tokens() {
  const css = (m: Mode) => tokens.effectStyles.map((e) => `  ${e.css}: ${m === 'light' ? e.light : e.dark};`).join('\n');
  const recipe = `/* Tailwind utilities */
<div class="rounded-surface border border-border-subtle bg-surface-raised shadow-raised">…</div>   /* card */
<div class="rounded-control bg-surface-overlay shadow-overlay">…</div>                          /* menu */
<div class="rounded-modal bg-surface-overlay shadow-modal">…</div>                              /* dialog */
<button class="shadow-control is-focus:shadow-focus-default">…</button>                         /* control */
<div class="backdrop-blur-backdrop-md bg-video-player-overlay-fill">…</div>                     /* over media */

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
                <th className="px-lg py-md">Light</th>
                <th className="px-lg py-md">Dark</th>
                <th className="px-lg py-md">CSS</th>
                <th className="px-lg py-md">Tailwind</th>
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
                    e.effects.map((l) => (roleOf(l) ? alias(roleOf(l), 'light') : '—')),
                    e.effects.map((l) => (roleOf(l) ? alias(roleOf(l), 'dark') : '—')),
                  ].map((lines, i) => (
                    <td key={i} className="px-lg py-md">
                      {lines.map((t, j) => (
                        <span key={j} className="type-code-sm-regular block whitespace-nowrap text-text-secondary">
                          {t}
                        </span>
                      ))}
                    </td>
                  ))}
                  <td className="type-code-sm-regular whitespace-nowrap px-lg py-md text-text-secondary">var({e.css})</td>
                  <td className="type-code-sm-regular whitespace-nowrap px-lg py-md text-text-brand">{e.tailwind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="flex flex-col gap-lg">
        <AnchorHeading>Color roles behind the effects</AnchorHeading>
        <P>Change one of these roles and every shadow and ring follows. The only value typed into the focus styles by hand is the ring width.</P>
        <TokenTable names={['color/shadow/ambient', 'color/shadow/key', 'color/border/focus', 'color/border/danger', 'color/surface/base', 'border/width/focus']} />
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
        <StorageCard />
        <MenuPanel />
      </div>
      <Caption>{flat ? 'After: one edit to the styles, and every button, card and menu goes flat. Borders still carry the edges.' : 'Before: Syncium’s subtle depth.'}</Caption>
    </div>
  );
}

/** One specimen per colour mode, side by side, so the stronger Dark shadows are visible. */
function ModePair({ render }: { render: () => ReactNode }) {
  return (
    <div className="grid h-28 w-full grid-cols-2 overflow-hidden rounded-surface">
      {(['light', 'dark'] as const).map((m) => (
        <div key={m} data-theme={m} className="flex flex-col items-center justify-center gap-xs bg-surface-sunken">
          {render()}
          <span className="type-body-xs-regular text-text-tertiary">{m === 'light' ? 'Light' : 'Dark'}</span>
        </div>
      ))}
    </div>
  );
}

function StackAnatomy() {
  const raised = effect('elevation/raised');
  const layers = [...raised.effects].sort((a, b) => b.blur - a.blur);
  const cell = 'size-12 rounded-surface bg-surface-raised';
  return (
    <div className="grid w-full gap-xl sm:grid-cols-2 lg:grid-cols-4">
      {layers.map((l) => (
        <div key={layerLine(l)} className="flex flex-col items-center gap-md">
          <ModePair render={() => <div className={cell} style={{ boxShadow: `${l.x}px ${l.y * 4}px ${l.blur * 4}px ${l.spread * 4}px var(--${roleOf(l).replace(/\//g, '-')})` }} />} />
          <span className="type-code-sm-medium text-text-primary">{layerLine(l)}</span>
          <span className="type-body-xs-regular text-center text-text-secondary">
            {roleOf(l)} · Light {alias(roleOf(l), 'light').split('/').slice(1).join('/')} · Dark {alias(roleOf(l), 'dark').split('/').slice(1).join('/')}
          </span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-md">
        <ModePair render={() => <div className={cn(cell, 'border border-border-subtle')} />} />
        <span className="type-code-sm-medium text-text-primary">stroke + fill</span>
        <span className="type-body-xs-regular text-center text-text-secondary">color/border/subtle at border/width/default · color/surface/raised</span>
      </div>
      <div className="flex flex-col items-center gap-md">
        <ModePair render={() => <div className={cn(cell, 'border border-border-subtle shadow-raised')} />} />
        <span className="type-code-sm-medium text-text-primary">= elevation/raised</span>
        <span className="type-body-xs-regular text-center text-text-secondary">At real size. There’s no inner highlight, because Syncium’s depth is subtle, not tactile.</span>
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

const TOPICS: Topic[] = [
  {
    title: 'Depth is a choice',
    body: 'A design system can be flat, subtly elevated, strongly layered or tactile. Syncium sits at subtle: soft, low shadows that separate layers without decorating them.\n\nUse elevation sparingly. A shadow signals that something sits above the page, and when everything has one, nothing stands out. Most content belongs on the base level, separated by space and borders.',
    render: () => (
      <div className="grid w-full gap-xl md:grid-cols-2">
        {[
          { t: 'Flat', style: FLAT },
          { t: 'Syncium · subtle depth', style: undefined },
        ].map((v) => (
          <div key={v.t} className="flex flex-col items-center gap-lg rounded-surface bg-surface-base p-2xl" style={v.style}>
            <span className="type-body-xs-semibold text-text-tertiary">{v.t}</span>
            <StorageCard />
            <Button emphasis="secondary" label="Manage storage" tabIndex={-1} />
          </div>
        ))}
      </div>
    ),
    do: { caption: 'Lift only what needs to stand apart: one card group, one open menu.', render: () => <StorageCard /> },
    dont: {
      caption: 'Shadows on every row and label make the page noisy, and nothing reads as on top.',
      render: () => (
        <div className="flex w-full max-w-[16rem] flex-col gap-xs">
          {['Q3 report.pdf', 'Team photos', 'Backups'].map((t) => (
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
    body: 'Shadows are much harder to see on a dark page. That’s why the shadow color roles are stronger in Dark, and raised surfaces get lighter, so depth shows through the surface color as well as the shadow.\n\nAvoid turning a shadow into a light glow: it reads as a highlight, not as depth.',
    render: () => (
      <div className="grid w-full gap-lg sm:grid-cols-2">
        {(['light', 'dark'] as const).map((m) => (
          <Themed key={m} mode={m}>
            <div className="flex flex-col items-center gap-lg py-md">
              <StorageCard />
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
  {
    title: 'How a shadow is built',
    body: 'Each style is a short stack of drop shadows, each tied to a color role. A wide, soft ambient layer spreads the shadow, and a tighter key layer gives it direction.\n\nBelow, elevation/raised is pulled apart into its layers, then put back together. The shadows are drawn at 4× so you can see them, and the values come straight from the styles.',
    render: () => <StackAnatomy />,
  },
  {
    title: 'Don’t stack elevations',
    body: 'A raised card inside a raised card doubles the shadow and muddles the hierarchy. Inside a card, separate content with dividers, spacing or a sunken area instead.\n\nA popup over a card is fine, because it’s a higher level, not the same level twice.',
    do: {
      caption: 'Group rows inside one raised card with dividers.',
      render: () => (
        <div className="flex w-full max-w-[16rem] flex-col rounded-surface border border-border-subtle bg-surface-raised shadow-raised">
          {['Q3 report.pdf', 'Team photos'].map((t, i) => (
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
          {['Q3 report.pdf', 'Team photos'].map((t) => (
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
    body: 'Edit a style or its color role and every component updates. To make the whole system flat, clear the shadows in the elevation/* styles and the focus/*/control styles. Nothing else needs to change. Try it below.',
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
              <Checkbox forceState={v.s} defaultChecked aria-label={`Keep versions (${v.t})`} tabIndex={-1} />
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
    body: 'Apply focus through the component’s focus state rather than drawing a ring on one instance, so every copy stays in sync. Use focus/danger on invalid fields and danger actions, and the /control versions when a control has a shadow.\n\nThe ring color is a variable, but the ring width is typed into the style, because Figma can’t bind an effect’s spread to a variable. When border/width/focus changes, update the focus/* styles at the same time.',
    render: () => (
      <div className="flex w-full flex-wrap items-end justify-center gap-2xl">
        <div className="w-full max-w-[18rem]">
          <TextField label="Folder name" defaultValue="Backups/2026" status="invalid" hint="This field needs attention." forceState="focus" />
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
          <StorageCard />
          <Button forceState="focus" label="Upload" tabIndex={-1} />
        </div>
        <div className="flex flex-col gap-md">
          {['color/shadow/key', 'color/shadow/ambient', 'color/border/focus', 'color/surface/base'].map((n) => (
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
      description="Elevation shows what sits above what. Soft shadows lift cards and menus, a two-part focus ring stays visible on any surface, and backdrop blur keeps controls over media readable."
      figmaNode={pageMeta['1.5'].figmaNode}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Tokens', render: () => <Tokens /> },
        { label: 'Guidelines', render: () => <Topics items={TOPICS} /> },
      ]}
    />
  );
}

