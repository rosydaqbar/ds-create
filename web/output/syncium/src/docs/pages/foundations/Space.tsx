import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { cn } from '@/lib/cn';
import { Avatar, Badge, Button, Icon, IconButton, Kbd, Menu, TextControl, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../../DocPage';
import { Bullets, Caption, DoDont, InlineCode, P, TokenBadge } from '../../blocks';
import { pageMeta } from '../../meta';

/* ---------- token lookups ---------- */
const byName = new Map(tokens.variables.map((v) => [v.name, v]));
const num = (name: string) => parseFloat(Object.values(byName.get(name)!.modes)[0].value);
const cssv = (name: string) => `var(${byName.get(name)!.css})`;
const names = (prefix: string) => tokens.variables.filter((v) => v.name.startsWith(prefix)).map((v) => v.name);
const step = (name: string) => name.split('/').pop()!;

const SPACE = names('space/');
const BASE = num('space/xs');
const multiple = (v: number) => {
  const m = v / BASE;
  return m === 0.5 ? '½' : Number.isInteger(m) ? `${m}` : `${Math.floor(m)}½`;
};
const SIZE_GROUPS = {
  control: names('size/control/'),
  icon: names('size/icon/'),
  avatar: names('size/avatar/'),
  indicator: names('size/indicator/'),
  track: names('size/track/'),
  width: names('size/width/'),
  container: names('size/container/'),
};

/** Breakpoint minimums and the specimen width each grid is drawn at; columns, gutters and margins come from the grid styles. */
const BREAKPOINTS: Record<string, { label: string; min: number; frame: number; maxW: string }> = {
  'grid/mobile': { label: 'Mobile', min: 0, frame: 375, maxW: 'max-w-[24rem]' },
  'grid/tablet': { label: 'Tablet', min: 768, frame: 768, maxW: 'max-w-[40rem]' },
  'grid/desktop': { label: 'Desktop', min: 1024, frame: 1024, maxW: '' },
  'grid/wide': { label: 'Wide', min: 1440, frame: 1440, maxW: '' },
};
const CONTAINER = num('size/container/max');
const gridInfo = (g: (typeof tokens.gridStyles)[number]) => {
  const x = g.grids[0];
  const bp = BREAKPOINTS[g.name];
  const margin = x.alignment === 'CENTER' ? (bp.frame - CONTAINER) / 2 : x.margin;
  return { ...x, ...bp, margin };
};

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
function Code({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('type-code-sm-regular min-w-0 text-text-tertiary', className)}>{children}</span>;
}
function Tag({ children, selected, bad }: { children: ReactNode; selected?: boolean; bad?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-sm">
      <span className="type-body-sm-semibold text-text-primary">{children}</span>
      {selected && <Badge size="sm" tone="brand" label="Selected" />}
      {bad && <Badge size="sm" tone="danger" label="Avoid" />}
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
function RowNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xxs">
      <h3 className="type-heading-xs-semibold text-text-primary">{title}</h3>
      <p className="type-body-sm-regular max-w-(--size-measure-reading) text-text-secondary">{children}</p>
    </div>
  );
}
function Spec({ children }: { children: ReactNode }) {
  return <span className="type-code-sm-medium rounded-xs bg-category-pink-subtle px-xs text-category-pink-text">{children}</span>;
}

/* ---------- Overview ---------- */
function SpaceScale() {
  return (
    <div className="flex flex-col divide-y divide-border-subtle rounded-surface border border-border-subtle bg-surface-base">
      {SPACE.map((s) => {
        const v = num(s);
        return (
          <div key={s} className="grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] items-center gap-md px-lg py-sm md:grid-cols-[9rem_minmax(0,1fr)_7rem]">
            <span className="type-code-sm-medium text-text-primary">{s}</span>
            <span aria-hidden className="block h-(--size-indicator-lg) rounded-xs bg-fill-brand-solid" style={{ width: cssv(s), maxWidth: '100%' }} />
            <span className="type-code-sm-regular text-right text-text-tertiary">
              {v} · {multiple(v)}×
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-xs">
      <div className="flex min-h-16 items-end justify-center">{children}</div>
      <span className="type-code-sm-regular text-text-tertiary">{label}</span>
    </div>
  );
}

function Sizes() {
  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-lg border-t border-border-subtle pt-xl">
        <RowNote title="Control height">Buttons, inputs and selects of the same size share a height, so a row of controls lines up. The dashed square on md shows the touch minimum.</RowNote>
        <div className="flex flex-wrap items-end gap-xl">
          {SIZE_GROUPS.control.map((c) => (
            <Specimen key={c} label={`${step(c)} · ${num(c)}`}>
              <span className="relative flex w-16 items-center justify-center rounded-control border border-border-brand bg-fill-brand-subtle" style={{ height: cssv(c) }}>
                <span className="type-code-sm-medium text-text-brand">{num(c)}</span>
                {step(c) === 'md' && <span aria-hidden className="absolute left-1/2 top-1/2 size-(--size-touch-min) -translate-x-1/2 -translate-y-1/2 rounded-xs border border-dashed border-border-strong" />}
              </span>
            </Specimen>
          ))}
        </div>
        <Caption>Each control size has a matching icon size: sm icons for xs and sm controls, md icons for md and lg, and lg icons for xl.</Caption>
      </div>

      <div className="flex flex-col gap-lg border-t border-border-subtle pt-xl">
        <RowNote title="Icon">Icons sit in a fixed square box, with a little empty space around the glyph.</RowNote>
        <div className="flex flex-wrap items-end gap-xl">
          {SIZE_GROUPS.icon.map((c) => (
            <Specimen key={c} label={`${step(c)} · ${num(c)}`}>
              <span className="flex items-center justify-center bg-fill-brand-subtle text-icon-brand" style={{ width: cssv(c), height: cssv(c) }}>
                <Icon name="general/placeholder" size={step(c) as 'md'} />
              </span>
            </Specimen>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-lg border-t border-border-subtle pt-xl">
        <RowNote title="Avatar">Avatars range from 16 in dense lists to 64 on profile headers.</RowNote>
        <div className="flex flex-wrap items-end gap-xl">
          {SIZE_GROUPS.avatar.map((c) => (
            <Specimen key={c} label={`${step(c)} · ${num(c)}`}>
              <Avatar size={step(c) as 'md'} type="initials" initials="SY" />
            </Specimen>
          ))}
        </div>
      </div>

      <div className="grid gap-xl border-t border-border-subtle pt-xl md:grid-cols-2">
        <div className="flex flex-col gap-lg">
          <RowNote title="Indicator">Status dots on badges and avatars.</RowNote>
          <div className="flex flex-wrap items-end gap-xl">
            {SIZE_GROUPS.indicator.map((c) => (
              <Specimen key={c} label={`${step(c)} · ${num(c)}`}>
                <span aria-hidden className="rounded-full bg-icon-success" style={{ width: cssv(c), height: cssv(c) }} />
              </Specimen>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-lg">
          <RowNote title="Track">The thickness of progress bars and slider tracks.</RowNote>
          <div className="flex flex-col gap-md">
            {SIZE_GROUPS.track.map((c) => (
              <div key={c} className="flex items-center gap-md">
                <span aria-hidden className="block w-32 overflow-hidden rounded-full bg-fill-neutral-track" style={{ height: cssv(c) }}>
                  <span className="block h-full w-3/5 rounded-full bg-fill-brand-solid" />
                </span>
                <span className="type-code-sm-regular text-text-tertiary">
                  {step(c)} · {num(c)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-lg border-t border-border-subtle pt-xl">
        <RowNote title="Touch minimum">{`Every tap target on a touch screen is at least ${num('size/touch-min')}. A compact control gets there with an invisible hit area, not a bigger icon.`}</RowNote>
        <div className="flex items-center gap-lg">
          <span className="flex size-(--size-touch-min) items-center justify-center rounded-xs border border-dashed border-border-strong">
            <IconButton size="xs" icon="general/more-horizontal" label="More actions (sample)" />
          </span>
          <Code>size/touch-min · {num('size/touch-min')}</Code>
        </div>
      </div>
    </div>
  );
}

function Widths() {
  const max = Math.max(...SIZE_GROUPS.width.map(num));
  return (
    <div className="flex flex-col gap-sm rounded-surface border border-border-subtle bg-surface-base p-lg">
      {SIZE_GROUPS.width.map((w) => (
        <div key={w} className="grid grid-cols-[minmax(0,1fr)] gap-xxs md:grid-cols-[9rem_minmax(0,1fr)] md:items-center md:gap-md">
          <span className="type-code-sm-regular text-text-secondary">
            {step(w)} · {num(w)}
          </span>
          <span aria-hidden className="block h-(--size-indicator-lg) rounded-xs bg-fill-brand-subtle ring-1 ring-border-brand-subtle ring-inset" style={{ width: `${(num(w) / max) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function ContainerSpecimen() {
  const margin = num('size/container/margin-desktop');
  const reading = num('size/measure/reading');
  return (
    <Panel>
      <div className="flex flex-col gap-sm">
        <div className="flex flex-wrap justify-between gap-sm">
          <Spec>size/container/max · {CONTAINER}</Spec>
          <Spec>margin-desktop · {margin}</Spec>
        </div>
        <div className="relative rounded-control border border-dashed border-border-brand bg-surface-base py-xl" style={{ paddingInline: `${(margin / CONTAINER) * 100}%` }}>
          <div aria-hidden className="absolute inset-y-0 left-0 bg-category-pink-subtle" style={{ width: `${(margin / CONTAINER) * 100}%` }} />
          <div aria-hidden className="absolute inset-y-0 right-0 bg-category-pink-subtle" style={{ width: `${(margin / CONTAINER) * 100}%` }} />
          <div className="mx-auto flex flex-col gap-sm rounded-xs bg-fill-brand-subtle p-md" style={{ width: `${(reading / (CONTAINER - 2 * margin)) * 100}%`, minWidth: 'min(100%, 12rem)' }}>
            <Spec>size/measure/reading · {reading}</Spec>
            <p className="type-body-sm-regular text-text-secondary">Syncium keeps every file in step across devices and teams. When someone edits a document, the change reaches everyone with access within seconds.</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function GridFrame({ g, children }: { g: (typeof tokens.gridStyles)[number]; children?: ReactNode }) {
  const i = gridInfo(g);
  const inner = i.frame - 2 * i.margin;
  const style: CSSProperties = { marginInline: `${(i.margin / i.frame) * 100}%`, columnGap: `${(i.gutter / inner) * 100}%`, gridTemplateColumns: `repeat(${i.count}, minmax(0, 1fr))` };
  return (
    <div className={cn('relative w-full overflow-hidden rounded-control border border-border-subtle bg-surface-base', i.maxW)}>
      <div aria-hidden className={cn('grid', children ? 'absolute inset-0' : 'h-24')} style={style}>
        {Array.from({ length: i.count }).map((_, k) => (
          <span key={k} className="bg-category-pink-subtle ring-1 ring-category-pink-border ring-inset" />
        ))}
      </div>
      {children && (
        <div aria-hidden className="relative grid content-start gap-y-md py-md" style={style}>
          {children}
        </div>
      )}
    </div>
  );
}

function Grids() {
  return (
    <div className="flex flex-col gap-xl">
      {tokens.gridStyles.map((g) => {
        const i = gridInfo(g);
        return (
          <div key={g.name} className="flex min-w-0 flex-col gap-sm">
            <span className="flex flex-wrap items-baseline gap-x-md">
              <span className="type-body-sm-semibold text-text-primary">
                {i.label} · {i.min}+
              </span>
              <span className="type-body-sm-regular text-text-secondary">
                {i.count} columns · gutter {i.gutter} · {g.grids[0].alignment === 'CENTER' ? `centered in ${CONTAINER}` : `margin ${i.margin}`}
              </span>
              <Code>{g.name}</Code>
            </span>
            <GridFrame g={g} />
          </div>
        );
      })}
    </div>
  );
}

function Overview() {
  return (
    <div className="flex flex-col gap-6xl">
      <Block title="How space works" intro="This page covers the 4-point space scale, size roles, widths, the page container and the grid for each breakpoint. Syncium is spacious by default, with generous padding and clear groups.">
        <Bullets
          items={[
            <>
              <strong className="font-semibold text-text-primary">One scale for every gap.</strong> Padding, gaps and margins all come from the space scale, so design and code share one rhythm.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Closer means related.</strong> Put items in a group closer to each other than to the next group.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Sizes are named by their job.</strong> Control heights, icon boxes and widths are named for what they do, so an md button, field and select always line up.
            </>,
          ]}
        />
      </Block>

      <Block title="Space scale" intro={`Every step is a whole or half multiple of the ${BASE}px base unit. Small steps keep related things close inside a control. Larger steps separate sections of a page. Use space/optical, a half step, for the small inset around a label next to an icon.`}>
        <SpaceScale />
        <Caption>In Tailwind, each step is a utility: p-xl, gap-lg, m-md and so on.</Caption>
      </Block>

      <Block title="Sizes" intro="Size roles set the height of controls and the size of icons, avatars, status dots and tracks. Every specimen below is drawn at its real size.">
        <Sizes />
      </Block>

      <Block title="Widths" intro="Use these fixed widths for panels, dropdowns, dialogs and layouts. Pick xxs–xs for tooltips, menus and popovers, sm–lg for dialogs and side panels, and 2xl–6xl for page layouts. Bars are drawn to scale against the widest.">
        <Widths />
      </Block>

      <Block title="Container and reading measure" intro={`Page content stops growing at ${CONTAINER} on large screens. It keeps ${num('size/container/margin-desktop')} side margins on tablet and desktop, and ${num('size/container/margin-mobile')} on mobile. Running text stays within ${num('size/measure/reading')}, about 70 characters per line.`}>
        <ContainerSpecimen />
      </Block>

      <Block title="Grids" intro="Each breakpoint has its own grid, shown here with its columns, gutters and margins. The frames are scaled down, but the numbers are real.">
        <Grids />
      </Block>
    </div>
  );
}

/* ---------- Tokens ---------- */
function ValueTable({ list, label }: { list: string[]; label: string }) {
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
          {list.map((n) => {
            const v = byName.get(n)!;
            const m = Object.values(v.modes)[0];
            return (
              <tr key={n} className="border-t border-border-subtle align-top">
                <td className="px-lg py-md">
                  <TokenBadge name={n} />
                  {v.description && <p className="type-body-xs-regular mt-xs max-w-80 text-text-tertiary">{v.description}</p>}
                </td>
                <td className="px-lg py-md">
                  <span className="type-code-sm-medium text-text-primary">{parseFloat(m.value)}</span>
                  {m.alias && <span className="type-code-sm-regular block text-text-tertiary">{m.alias}</span>}
                </td>
                <td className="type-code-sm-regular px-lg py-md text-text-secondary">var({v.css})</td>
                <td className="type-code-sm-regular px-lg py-md text-text-brand">{v.tailwind?.startsWith('h-(') ? `h-(${v.css}) · w-(${v.css})` : (v.tailwind ?? '—')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

function GridTable() {
  return (
    <ScrollRegion label="Grid styles">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <thead className="bg-surface-sunken">
          <tr className="type-body-xs-semibold text-text-tertiary">
            {['Grid style', 'Min width', 'Columns', 'Gutter', 'Margin'].map((h) => (
              <th key={h} scope="col" className="px-lg py-md">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.gridStyles.map((g) => {
            const i = gridInfo(g);
            return (
              <tr key={g.name} className="type-code-sm-regular border-t border-border-subtle text-text-secondary">
                <td className="px-lg py-md">
                  <TokenBadge name={g.name} />
                </td>
                <td className="px-lg py-md">{i.min}</td>
                <td className="px-lg py-md">{i.count}</td>
                <td className="px-lg py-md">{i.gutter}</td>
                <td className="px-lg py-md">{g.grids[0].alignment === 'CENTER' ? `centered, max ${CONTAINER}` : i.margin}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

const TOKEN_GROUPS: [string, string, string[]][] = [
  ['Space', 'Gaps, padding and margins. In Tailwind, use p-{step}, gap-{step} and m-{step}.', SPACE],
  ['Control', 'The height of buttons, inputs, selects and every other control.', SIZE_GROUPS.control],
  ['Icon', 'The square box each icon sits in.', SIZE_GROUPS.icon],
  ['Avatar', 'The diameter of each avatar size.', SIZE_GROUPS.avatar],
  ['Indicator', 'The size of status dots.', SIZE_GROUPS.indicator],
  ['Track', 'The thickness of progress bars and slider tracks.', SIZE_GROUPS.track],
  ['Width', 'Fixed widths for panels, dropdowns, dialogs and layouts.', SIZE_GROUPS.width],
  ['Container', 'The maximum page width and its side margins.', SIZE_GROUPS.container],
  ['Measure', 'The maximum width of running text.', ['size/measure/reading']],
  ['Touch', 'The smallest tap target on touch screens.', ['size/touch-min']],
];

function TokensTab() {
  return (
    <div className="flex flex-col gap-5xl">
      <P>
        The <InlineCode>Space</InlineCode> and <InlineCode>Size</InlineCode> collections each have a single mode. Apply size tokens with arbitrary-value utilities such as <InlineCode>h-(--size-control-md)</InlineCode>. Watch out for size-named utilities like <InlineCode>w-md</InlineCode>: they use the space scale, not the size tokens.
      </P>
      {TOKEN_GROUPS.map(([t, intro, list]) => (
        <Block key={t} title={t} intro={intro}>
          <ValueTable list={list} label={`${t} tokens`} />
        </Block>
      ))}
      <Block title="Grid styles" intro="One grid per breakpoint. In Figma, the gutters and margins use the space and container variables.">
        <GridTable />
      </Block>
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

function ShareCard({ system }: { system: boolean }) {
  /* The "without" card uses deliberately arbitrary values to show drift; they are not tokens. */
  const raw = { card: { padding: '18px 11px 13px 22px', gap: 7 }, actions: { gap: 13 } };
  return (
    <div className={cn('flex flex-col rounded-surface border border-border-subtle bg-surface-raised shadow-raised', system && 'gap-lg p-xl')} style={system ? undefined : raw.card}>
      <span className="type-heading-xs-semibold text-text-primary">Share “Q3 reports”</span>
      <span className="type-body-sm-regular text-text-secondary">People with access can view and comment. Edits sync to everyone within seconds.</span>
      <div className={cn('flex justify-end', system && 'gap-md')} style={system ? undefined : raw.actions}>
        <Button size="sm" emphasis="secondary" label="Cancel" />
        <Button size="sm" label="Share" />
      </div>
    </div>
  );
}

function WithWithout() {
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-2">
        <div className="flex flex-col gap-md">
          <Tag bad>Without a system</Tag>
          <ShareCard system={false} />
          <Spec>padding 18 / 11 / 13 / 22 · gap 7 · actions 13</Spec>
        </div>
        <div className="flex flex-col gap-md">
          <Tag selected>With the scale</Tag>
          <ShareCard system />
          <Spec>padding space/xl 16 · gap space/lg 12 · actions space/md 8</Spec>
        </div>
      </div>
    </Panel>
  );
}

function ScaleOnGrid() {
  const shown = SPACE.filter((s) => num(s) > 0 && num(s) <= num('space/6xl'));
  const zoom = 4;
  return (
    <Panel>
      <div
        className="flex flex-col gap-sm overflow-hidden rounded-control bg-surface-base p-lg"
        style={{ backgroundImage: `repeating-linear-gradient(to right, var(--color-border-subtle) 0 1px, transparent 1px calc(var(--space-xs) * ${zoom}))`, backgroundPositionX: 'var(--space-lg)' }}
      >
        {shown.map((s) => (
          <div key={s} className="flex items-center gap-md">
            <span aria-hidden className="block h-(--size-indicator-md) shrink-0 rounded-xs bg-fill-brand-solid" style={{ width: `calc(${cssv(s)} * ${zoom})`, maxWidth: '60%' }} />
            <span className="type-code-sm-regular rounded-xs bg-surface-base px-xs text-text-secondary">
              {s} · {num(s)} · {multiple(num(s))}×
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MenuAnnotated() {
  const notes: [string, string][] = [
    ['Panel padding', 'space/xs'],
    ['Row inset', 'space/xxs × space/sm'],
    ['Item padding', 'space/md'],
    ['Icon to label', 'space/md'],
    ['Divider item', 'space/xs above and below'],
  ];
  return (
    <Panel>
      <div className="grid items-start gap-xl md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="min-w-0">
          <Menu type="button-advanced" defaultOpen inlinePopup />
        </div>
        <ol className="flex flex-col gap-sm">
          {notes.map(([k, v], i) => (
            <li key={k} className="flex items-baseline gap-md">
              <span className="type-body-xs-semibold flex size-(--size-avatar-xs) shrink-0 items-center justify-center rounded-full bg-category-pink-solid text-text-on-solid">{i + 1}</span>
              <span className="flex flex-col">
                <span className="type-body-sm-medium text-text-primary">{k}</span>
                <Code>{v}</Code>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

function OpticalSteps() {
  const pad = cssv('button/padding-x/md');
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-3">
        <div className="flex flex-col items-start gap-md rounded-control bg-surface-base p-lg">
          <Tag bad>1 · Even padding only</Tag>
          <span className="type-body-sm-semibold inline-flex h-(--size-control-md) items-center gap-(--button-gap-md) rounded-control bg-fill-brand-solid text-text-on-solid" style={{ paddingInline: pad }}>
            <Icon name="files/cloud-upload" size="md" />
            Upload
          </span>
          <span className="type-body-xs-regular text-text-tertiary">The padding is equal, but the empty space around the icon makes the left side look wider.</span>
        </div>
        <div className="flex flex-col items-start gap-md rounded-control bg-surface-base p-lg">
          <Tag selected>2 · Optically corrected</Tag>
          <Button label="Upload" leadingIcon="files/cloud-upload" />
          <span className="type-body-xs-regular text-text-tertiary">The label gets space/optical on both sides, so both edges look even.</span>
        </div>
        <div className="flex flex-col gap-sm rounded-control bg-surface-base p-lg">
          <span className="type-body-sm-semibold text-text-primary">3 · Measurements</span>
          {[
            ['Outer padding', `button/padding-x/md · ${num('button/padding-x/md')}`],
            ['Icon box', `size/icon/md · ${num('size/icon/md')}`],
            ['Gap', `button/gap/md · ${num('button/gap/md')}`],
            ['Optical inset', `space/optical · ${num('space/optical')}`],
          ].map(([k, v]) => (
            <span key={k} className="flex flex-col">
              <span className="type-body-xs-semibold text-text-primary">{k}</span>
              <Code>{v}</Code>
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function PaddingAnatomy() {
  const zoom = 4;
  const seg = (label: string, token: string, tone: 'pad' | 'part' | 'opt') => ({ label, token, tone });
  const segs = [
    seg('padding', 'button/padding-x/md', 'pad'),
    seg('icon', 'size/icon/md', 'part'),
    seg('gap', 'button/gap/md', 'opt'),
    seg('optical', 'space/optical', 'opt'),
    seg('label', '', 'part'),
    seg('optical', 'space/optical', 'opt'),
    seg('padding', 'button/padding-x/md', 'pad'),
  ];
  const tone = { pad: 'bg-category-pink-subtle text-category-pink-text', part: 'bg-fill-brand-subtle text-text-brand', opt: 'bg-fill-warning-subtle text-text-warning' };
  const perceived = num('button/padding-x/md') + num('space/optical');
  return (
    <Panel>
      <div className="flex flex-col gap-xl">
        <div className="flex justify-center">
          <Button size="md" label="Upload files" leadingIcon="files/cloud-upload" />
        </div>
        <div className="flex justify-center overflow-hidden">
          <div className="flex h-12 w-fit max-w-full overflow-hidden rounded-xs border border-border-subtle" aria-hidden>
            {segs.map((s, i) => (
              <span key={i} className={cn('flex shrink items-center justify-center overflow-hidden border-r border-border-subtle last:border-r-0', tone[s.tone], !s.token && 'min-w-16 flex-1 px-md')} style={s.token ? { width: `calc(${cssv(s.token)} * ${zoom})` } : undefined}>
                <span className="type-code-sm-medium">{s.token ? num(s.token) : 'label'}</span>
              </span>
            ))}
          </div>
        </div>
        <ul className="grid gap-sm sm:grid-cols-2">
          {[
            ['Outer padding', 'button/padding-x/md'],
            ['Icon frame', 'size/icon/md'],
            ['Icon to label gap', 'button/gap/md'],
            ['Optical inset', 'space/optical'],
          ].map(([k, t]) => (
            <li key={k} className="flex flex-col">
              <span className="type-body-xs-semibold text-text-primary">{k}</span>
              <Code>
                {t} · {num(t)}
              </Code>
            </li>
          ))}
        </ul>
        <span className="type-body-sm-regular text-text-secondary">
          Visible space after the label: {num('button/padding-x/md')} + {num('space/optical')} = {perceived}. Segments are drawn at {zoom}×.
        </span>
      </div>
    </Panel>
  );
}

function ControlRow() {
  return (
    <Panel>
      <div className="flex flex-col gap-2xl">
        <div className="flex flex-wrap items-center gap-md">
          <Button label="Upload" leadingIcon="files/cloud-upload" />
          <div className="w-56">
            <TextControl defaultValue="Q3 reports" aria-label="Folder name (sample)" />
          </div>
          <div className="w-44">
            <TextControl type="select" defaultValue="Weekly" aria-label="Sync schedule (sample)" />
          </div>
          <span className="flex h-(--size-control-md) items-center gap-xs border-l-2 border-category-pink-solid pl-sm">
            <Spec>size/control/md · {num('size/control/md')}</Spec>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-lg">
          <span className="flex size-(--size-touch-min) items-center justify-center rounded-xs border border-dashed border-category-pink-solid">
            <IconButton size="xs" icon="general/more-horizontal" label="More actions (sample)" />
          </span>
          <Spec>hit area size/touch-min · {num('size/touch-min')}</Spec>
          <span className="type-body-xs-regular text-text-tertiary">
            The button stays at {num('size/control/xs')}. Only its hit area grows.
          </span>
        </div>
      </div>
    </Panel>
  );
}

const LONG =
  'Syncium keeps every folder in step across your devices. Changes upload in small parts, so a dropped connection resumes where it stopped instead of starting over, and conflicts are kept side by side until someone chooses which version wins.';

function LineLengths() {
  return (
    <Panel>
      <div className="flex flex-col gap-2xl">
        <div className="flex flex-col gap-sm">
          <Tag>Too short · ~35 characters per line</Tag>
          <p className="type-body-md-regular max-w-[35ch] text-text-secondary">{LONG}</p>
        </div>
        <div className="flex flex-col gap-sm">
          <Tag selected>Reading measure · ~75 characters per line</Tag>
          <div className="flex max-w-(--size-measure-reading) flex-col gap-xs">
            <span className="flex items-center gap-sm" aria-hidden>
              <span className="h-px flex-1 bg-category-pink-solid" />
              <Spec>size/measure/reading · {num('size/measure/reading')}</Spec>
              <span className="h-px flex-1 bg-category-pink-solid" />
            </span>
            <p className="type-body-md-regular text-text-secondary">{LONG}</p>
          </div>
        </div>
        <div className="flex flex-col gap-sm">
          <Tag bad>Too long · 120+ characters per line (clipped here)</Tag>
          <div className="relative overflow-hidden">
            <p className="type-body-md-regular w-[120ch] text-text-secondary">
              {LONG} {LONG}
            </p>
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-surface-sunken" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ResponsivePage() {
  const grid = (n: string) => tokens.gridStyles.find((g) => g.name === n)!;
  const block = (span: string, h: string, cls = 'bg-surface-raised border border-border-default') => <span className={cn('rounded-xs', cls, h)} style={{ gridColumn: span }} />;
  const frames: [string, ReactNode][] = [
    [
      'grid/desktop',
      <>
        {block('1 / -1', 'h-6', 'bg-fill-brand-subtle border border-border-brand-subtle')}
        {block('1 / span 4', 'h-14')}
        {block('5 / span 4', 'h-14')}
        {block('9 / span 4', 'h-14')}
        {block('1 / span 6', 'h-16')}
      </>,
    ],
    [
      'grid/tablet',
      <>
        {block('1 / -1', 'h-6', 'bg-fill-brand-subtle border border-border-brand-subtle')}
        {block('1 / span 4', 'h-14')}
        {block('5 / span 4', 'h-14')}
        {block('1 / -1', 'h-16')}
      </>,
    ],
    [
      'grid/mobile',
      <>
        {block('1 / -1', 'h-6', 'bg-fill-brand-subtle border border-border-brand-subtle')}
        {block('1 / -1', 'h-14')}
        {block('1 / -1', 'h-14')}
        {block('1 / -1', 'h-16')}
      </>,
    ],
  ];
  return (
    <Panel>
      <div className="flex flex-col gap-2xl">
        {frames.map(([n, kids]) => {
          const g = grid(n);
          const i = gridInfo(g);
          return (
            <div key={n} className="flex flex-col gap-sm">
              <span className="flex flex-wrap items-baseline gap-x-md">
                <span className="type-body-sm-semibold text-text-primary">{i.label}</span>
                <Code>
                  {i.count} columns · gutter {i.gutter} · margin {i.margin}
                </Code>
              </span>
              <GridFrame g={g}>
                {kids}
              </GridFrame>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SettingsForm({ grouped }: { grouped: boolean }) {
  const field = (label: string, value: string) => <TextField key={label} size="sm" label={label} defaultValue={value} />;
  return (
    <div className={cn('flex w-full max-w-[20rem] flex-col rounded-surface bg-surface-base p-xl text-left', grouped ? 'gap-4xl' : 'gap-lg')}>
      <div className="flex flex-col gap-lg">
        <span className="type-heading-xs-semibold text-text-primary">Profile</span>
        {field('Name', 'Dana Whitfield')}
        {field('Email', 'dana@syncium.io')}
      </div>
      <div className="flex flex-col gap-lg">
        <span className="type-heading-xs-semibold text-text-primary">Sync</span>
        {field('Device name', 'Studio iMac')}
        {field('Upload limit', '20 MB/s')}
      </div>
    </div>
  );
}

function GuidelinesTab() {
  const items: Guide[] = [
    {
      title: 'Why a spacing scale matters',
      body: <P>A fixed scale saves you from deciding every gap from scratch, and it gives design and code the same rhythm. Without one, padding drifts between screens, edges stop lining up and developers guess at values.</P>,
      visual: <WithWithout />,
      caption: 'The same share card twice. On the left, every value is a one-off decision. On the right, every value is a step on the scale.',
    },
    {
      title: 'Start from the base unit',
      body: <P>Every step is a multiple of the {BASE}-pixel base unit. Two steps, space/xxs and space/optical, sit at half a unit for fine tuning. Small steps sit close together for tight UI, while large ones jump further apart for sections. Names describe size, not value, so values can change without renaming anything.</P>,
      visual: <ScaleOnGrid />,
      caption: `Each bar ends on a whole or half unit of the ${BASE}-pixel grid, drawn at 4× so you can see the units.`,
    },
    {
      title: 'Spacing inside components',
      body: <P>The scale isn’t only a list: real components are built from it. A Menu (3.6) uses space steps for everything: the panel padding, the row inset, item padding, the gap between icon and label, and the space around dividers.</P>,
      visual: <MenuAnnotated />,
      caption: 'A live menu, with the space token behind each measurement.',
    },
    {
      title: 'Allow for optical corrections',
      body: <P>A few values inside components step off the grid on purpose. An icon’s glyph doesn’t fill its box, and a label’s line height adds space above and below the letters. To even this out, button labels get a small extra inset, space/optical, on both sides.</P>,
      visual: <OpticalSteps />,
      caption: 'It’s the same structure shown in the anatomy on 2.1 Button.',
    },
    {
      title: 'Component padding',
      body: <P>A control’s width is the sum of its parts: outer padding, icon, gap and the optical inset around the label. Change one of these component tokens and every md button follows.</P>,
      visual: <PaddingAnatomy />,
      caption: 'An md button, broken into its spacing parts.',
    },
    {
      title: 'Control sizes and touch targets',
      body: <P>Controls take their height from size/control/*, so an md button, text field and select line up in a row. On touch screens, every tappable element needs a target of at least {num('size/touch-min')} (size/touch-min) so people can hit it reliably. A compact icon button gets there with an invisible hit area, not a bigger icon.</P>,
      visual: <ControlRow />,
      caption: 'All three controls share one height. The dashed square is the touch-minimum hit area around a compact icon button.',
    },
    {
      title: 'Reading width and line length',
      body: <P>Set running text to the reading measure, size/measure/reading ({num('size/measure/reading')}), rather than the full container width. Aim for 65–80 characters per line. Shorter lines feel choppy, and on longer ones the eye loses its place moving to the next line.</P>,
      visual: <LineLengths />,
      caption: 'The same paragraph at three widths. Only the middle one is set at the reading measure.',
    },
    {
      title: 'Containers and grids',
      body: <P>The container sets the outer edges of the page and the grid divides it into columns. Line components up with the column edges, and separate page sections with space/7xl ({num('space/7xl')}).</P>,
      visual: <ResponsivePage />,
      caption: 'One page, with a header, a row of cards and a form, on the desktop, tablet and mobile grids. The values are real, but the frames are scaled down.',
    },
    {
      title: 'Rules of thumb',
      body: (
        <Bullets
          items={[
            'Use scale values for every gap, padding and margin. If none fits, try a neighboring step first. Add a new step only when the need keeps coming up, and add it to the scale for everyone.',
            'Optical corrections (space/optical) are the one allowed exception, and they belong in component tokens.',
            'Keep related items closer together than separate groups.',
            'Keep padding symmetrical unless the content needs otherwise, like an icon on one side.',
            'In Figma, use auto layout with gap and padding bound to the space variables instead of positioning layers by hand.',
          ]}
        />
      ),
      do: { caption: 'Fields are space/lg apart and sections space/4xl apart, so the groups read at a glance.', render: () => <SettingsForm grouped /> },
      dont: { caption: 'Don’t use one gap everywhere, or the sections blur into one long list.', render: () => <SettingsForm grouped={false} /> },
    },
    {
      title: 'Match your nudge to the scale (optional)',
      body: <P>A Figma tip rather than a system rule: set the big nudge to {num('space/md')} (space/md), and Shift + arrow will move layers along the scale.</P>,
      visual: (
        <Panel>
          <div className="flex flex-wrap items-center gap-md">
            <Kbd size="md" text="⇧" />
            <span className="type-body-sm-regular text-text-tertiary">+</span>
            <Kbd size="md" text="→" />
            <Icon name="arrows/arrow-right" size="sm" className="text-icon-tertiary" />
            <span className="type-body-sm-medium text-text-primary">moves the layer {num('space/md')} px</span>
          </div>
        </Panel>
      ),
    },
  ];
  return <GuideList items={items} />;
}

export default function Space() {
  return (
    <DocPage
      eyebrow="Foundations › 1.3 Space & layout"
      title="Space & layout"
      description="Space sets the rhythm of every screen. Use one spacing scale for gaps and padding, and the size roles for controls, icons, avatars, widths and the reading measure."
      figmaNode={pageMeta['1.3'].figmaNode}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Tokens', render: () => <TokensTab /> },
        { label: 'Guidelines', render: () => <GuidelinesTab /> },
      ]}
    />
  );
}

