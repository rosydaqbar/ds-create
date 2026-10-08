import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { cn } from '@/lib/cn';
import { Avatar, Badge, Button, ChoiceCard, Checkbox, Kbd, Switch, Tag, TextControl, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../../DocPage';
import { breakable, Bullets, Caption, DoDont, InlineCode, P, productHasWeb, TokenBadge, tokenCodeColumns, tokenCodeNames } from '../../blocks';
import { figmaNodeFor } from '../../meta';
import { config } from '@/ds.config';
import { brandCopy } from '@/brand/copy';

/* ---------- token lookups ---------- */
const byName = new Map(tokens.variables.map((v) => [v.name, v]));
const num = (name: string) => {
  const v = byName.get(name);
  return v ? parseFloat(Object.values(v.modes)[0].value) : NaN;
};
const cssv = (name: string) => (byName.has(name) ? `var(${byName.get(name)!.css})` : '0px');
const RADIUS = tokens.variables.filter((v) => v.name.startsWith('radius/')).map((v) => v.name);
const BORDER = tokens.variables.filter((v) => v.name.startsWith('border/width/')).map((v) => v.name);
const role = (n: string) => n.split('/').pop()!;
const show = (n: string) => (num(n) >= 9999 ? 'full' : `${num(n)}`);
const CONTROL = num('radius/control');
const SURFACE = num('radius/surface');
const SPACE_STEPS = tokens.variables.filter((v) => v.name.startsWith('space/') && v.name !== 'space/optical').map((v) => v.name);
/** The space step that makes an inner control radius and an outer radius run parallel (outer = inner + padding). */
const paddingFor = (inner: number, outer: number) => SPACE_STEPS.find((s) => num(s) > 0 && inner + num(s) === outer);
/** The smallest non-pill radius role at or above a value. */
const roleAtLeast = (v: number) =>
  RADIUS.filter((r) => num(r) < 9999 && num(r) >= v).sort((a, b) => num(a) - num(b))[0];

/**
 * Corner character, read from radius/control against the md control height:
 * square-ish up to 10% of the height, a pill from half the height, soft in between.
 */
type Character = 'sharp' | 'soft' | 'round';
const CHARACTER: Character = (() => {
  const h = num('size/control/md') || 40;
  if (CONTROL >= h / 2) return 'round';
  return CONTROL <= h * 0.1 ? 'sharp' : 'soft';
})();

const USED_ON: Record<string, string> = {
  none: 'Tables, full-bleed images and edges that meet other edges.',
  xs: 'Small parts inside controls: the checkbox box, keyboard keys, small thumbnails.',
  sm: 'Small nested parts: menu items, tags, tags inside inputs.',
  control: 'Anything people operate: buttons, inputs, selects, segmented controls.',
  indicator: 'Status chips and indicator shapes.',
  surface: 'Containers: cards, panels, menus, popovers.',
  modal: 'Dialogs, drawers and sheets.',
  full: 'Pills, badges, avatars, switches, dots and radio buttons.',
};
const BORDER_USE: Record<string, string> = {
  default: 'Dividers, outlines of controls, cards and menus.',
  strong: 'Primary dividers, avatar rings, slider knobs: lines that must stand out.',
  focus: 'Focus outlines, paired with the focus/* effect styles (see 1.5 Elevation).',
  selected: 'Selected choice cards and segments.',
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
function Spec({ children }: { children: ReactNode }) {
  return <span className="type-code-sm-medium w-fit rounded-xs bg-category-pink-subtle px-xs text-category-pink-text">{children}</span>;
}
function Tag2({ children, selected, bad }: { children: ReactNode; selected?: boolean; bad?: boolean }) {
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

/* ---------- Overview ---------- */
function RadiusTile({ name }: { name: string }) {
  const pill = num(name) >= 9999;
  return (
    <div className="flex min-w-0 flex-col gap-md rounded-control border border-border-subtle bg-surface-base p-lg">
      <div className="flex h-24 items-center justify-center">
        <span
          aria-hidden
          className={cn('block border border-border-default bg-surface-raised shadow-raised', pill ? 'h-(--size-control-md) w-28' : 'size-20')}
          style={{ borderRadius: cssv(name) }}
        />
      </div>
      <div className="flex flex-col gap-xxs">
        <span className="flex flex-wrap items-baseline justify-between gap-sm">
          <span className="type-code-sm-medium text-text-primary">{name}</span>
          <span className="type-code-sm-regular text-text-tertiary">{show(name)}</span>
        </span>
        <span className="type-body-xs-regular text-text-secondary">{USED_ON[role(name)] ?? byName.get(name)?.description}</span>
        <Code className="text-text-brand">rounded-{role(name)}</Code>
      </div>
    </div>
  );
}

function RadiusInUse() {
  /* Prefer the space step that makes the nested curves parallel; fall back to space/xs. */
  const padToken = paddingFor(CONTROL, SURFACE) ?? 'space/xs';
  const pad = num(padToken);
  const parallel = CONTROL + pad === SURFACE;
  return (
    <Panel>
      <div className="grid gap-xl sm:grid-cols-2">
        <div className="flex flex-col gap-sm">
          <span aria-hidden className="block h-(--size-control-md) w-full max-w-60 rounded-control border border-border-default bg-surface-base" />
          <Spec>radius/control · {show('radius/control')}</Spec>
        </div>
        <div className="flex flex-col gap-sm">
          <span aria-hidden className="block h-(--size-icon-md) w-24 rounded-indicator bg-fill-brand-subtle ring-1 ring-border-brand-subtle ring-inset" />
          <Spec>radius/indicator · {show('radius/indicator')}</Spec>
        </div>
        <div className="flex flex-col gap-sm">
          <div className="w-full max-w-64 rounded-surface border border-border-default bg-surface-raised shadow-raised" style={{ padding: cssv(padToken) }}>
            <span aria-hidden className="block h-(--size-control-md) rounded-control bg-fill-brand-subtle ring-1 ring-border-brand-subtle ring-inset" />
          </div>
          <Spec>
            radius/surface {SURFACE} around radius/control {CONTROL} · padding {pad}
          </Spec>
          <span className="type-body-xs-regular text-text-tertiary">
            {parallel ? `Curves run parallel: ${CONTROL} + ${pad} = ${SURFACE}.` : `For parallel curves, the outer radius would be ${CONTROL} + ${pad} = ${CONTROL + pad}.`}
          </span>
        </div>
        <div className="flex flex-col gap-sm">
          <div className="flex h-28 w-full max-w-64 flex-col justify-between rounded-modal border border-border-subtle bg-surface-overlay p-xl shadow-modal">
            <span aria-hidden className="block h-2 w-2/3 rounded-full bg-fill-neutral-track" />
            <span aria-hidden className="block h-(--size-control-sm) w-24 self-end rounded-control bg-fill-brand-solid" />
          </div>
          <Spec>radius/modal · {show('radius/modal')}</Spec>
        </div>
      </div>
    </Panel>
  );
}

function BorderLines() {
  return (
    <div className="flex flex-col divide-y divide-border-subtle rounded-surface border border-border-subtle bg-surface-base">
      {BORDER.map((b) => (
        <div key={b} className="grid min-w-0 gap-sm p-lg md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-xl">
          <span aria-hidden className="block w-full border-border-strong" style={{ borderTopWidth: cssv(b), borderTopStyle: 'solid' }} />
          <span className="flex flex-col gap-xxs">
            <span className="flex flex-wrap items-baseline gap-x-md">
              <span className="type-code-sm-medium text-text-primary">{b}</span>
              <span className="type-code-sm-regular text-text-tertiary">{num(b)}</span>
            </span>
            <span className="type-body-xs-regular text-text-secondary">{BORDER_USE[role(b)] ?? byName.get(b)?.description}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Overview() {
  return (
    <div className="flex flex-col gap-6xl">
      <Block
        title="How shape works"
        intro={`${brandCopy.cornerCharacter({ name: config.name, character: CHARACTER })} Controls round at ${show('radius/control')}, surfaces at ${show('radius/surface')} and dialogs at ${show('radius/modal')}, while avatars, switches and dots are full pills.`}
      >
        <Bullets
          items={[
            <>
              <strong className="font-semibold text-text-primary">Pick the role by what the element is.</strong> A button is a control, a card is a surface, a dialog is a modal. Choose by role rather than by eye.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Change the character in one place.</strong> Components use roles, so editing radius/control reshapes every button, field and select at once.
            </>,
            <>
              <strong className="font-semibold text-text-primary">Lines stay thin.</strong> Most borders use the default width. Save wider lines for focus and selection.
            </>,
          ]}
        />
      </Block>

      <Block title="Radius roles" intro="Each tile uses its role directly and lists where you’ll find it.">
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          {RADIUS.map((r) => (
            <RadiusTile key={r} name={r} />
          ))}
        </div>
      </Block>

      <Block title="Radius in use" intro="Here are the roles on plain shapes: a control, an indicator, a surface holding a control (with the padding between them) and a dialog.">
        <RadiusInUse />
      </Block>

      <Block title="Border widths" intro="Use the default width almost everywhere. Reach for strong, focus or selected only when a line needs to stand out or a state calls for it.">
        <BorderLines />
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
            {tokenCodeColumns.map((c) => (
              <th key={c} scope="col" className="px-lg py-md">
                {c}
              </th>
            ))}
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
                {tokenCodeNames(v).map((c, i) => (
                  <td key={tokenCodeColumns[i]} className={cn('type-code-sm-regular px-lg py-md', i === 1 && productHasWeb ? 'text-text-brand' : 'text-text-secondary')}>
                    {breakable(c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

function TokensTab() {
  return (
    <div className="flex flex-col gap-5xl">
      <P>
        The <InlineCode>Shape</InlineCode> collection has a single mode. Radius roles are available as Tailwind classes (<InlineCode>rounded-control</InlineCode>, <InlineCode>rounded-surface</InlineCode>), and you apply border widths as <InlineCode>border-(length:--border-width-default)</InlineCode>.
      </P>
      <Block title="Radius" intro="The corner radius for each role.">
        <ValueTable list={RADIUS} label="Radius tokens" />
      </Block>
      <Block title="Border width" intro="Line weights for outlines, focus and selection.">
        <ValueTable list={BORDER} label="Border width tokens" />
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

function RoleSpecimen() {
  const rows: [string, ReactNode][] = [
    [
      'radius/control',
      <>
        <Button size="sm" label="Share" />
        <div className="w-44">
          <TextControl size="sm" defaultValue="Q3 reports" aria-label="Report name (sample)" />
        </div>
      </>,
    ],
    [
      'radius/sm',
      <>
        <Tag size="sm" label="Finance" />
        <span className="type-body-sm-regular rounded-sm bg-fill-neutral-subtle-hover px-md py-xs text-text-primary">Menu item</span>
      </>,
    ],
    [
      'radius/xs',
      <>
        <Checkbox defaultChecked aria-label="Remember me (sample)" />
        <Kbd text="K" />
      </>,
    ],
    [
      'radius/surface',
      <span className="type-body-sm-medium rounded-surface border border-border-subtle bg-surface-raised px-xl py-lg text-text-primary shadow-raised">Card</span>,
    ],
    [
      'radius/modal',
      <span className="type-body-sm-medium rounded-modal border border-border-subtle bg-surface-overlay px-2xl py-xl text-text-primary shadow-modal">Dialog</span>,
    ],
    [
      'radius/full',
      <>
        <Avatar size="sm" type="initials" initials="DW" />
        <Switch defaultChecked aria-label="Email notifications (sample)" />
        <Badge size="sm" tone="success" label="Active" />
      </>,
    ],
  ];
  return (
    <Panel>
      <div className="flex flex-col divide-y divide-border-subtle rounded-surface bg-surface-base">
        {rows.map(([r, kids]) => (
          <div key={r} className="grid min-w-0 gap-md p-lg md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">
            <span className="flex items-center gap-md">
              <span aria-hidden className="block size-10 shrink-0 border-t-(length:--border-width-focus) border-l-(length:--border-width-focus) border-border-brand" style={{ borderTopLeftRadius: cssv(r) }} />
              <span className="flex flex-col">
                <span className="type-code-sm-medium text-text-primary">{r}</span>
                <span className="type-code-sm-regular text-text-tertiary">{show(r)}</span>
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-lg">{kids}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ShapeCard() {
  return (
    <div className="flex min-w-0 flex-col gap-lg rounded-surface border border-border-subtle bg-surface-raised p-xl shadow-raised">
      <span className="flex items-center justify-between gap-sm">
        <span className="type-heading-xs-semibold text-text-primary">Team workspace</span>
        <Badge size="sm" tone="brand" label="Pro" />
      </span>
      <TextField size="sm" label="Invite by email" defaultValue="dana@example.com" />
      <Button size="sm" label="Send invite" fullWidth />
    </div>
  );
}

/** Preview values for the three corner treatments in spec 1.4 (sharp: control 2, surface 4; round: control full, surface 24). */
const TREATMENTS: { id: Character; label: string; control: string; surface: string; text: string }[] = [
  { id: 'sharp', label: 'Sharp', control: '2px', surface: '4px', text: 'control 2, surface 4' },
  { id: 'soft', label: 'Soft', control: '8px', surface: '12px', text: 'control 8, surface 12' },
  { id: 'round', label: 'Round', control: 'var(--radius-full)', surface: '24px', text: 'control full, surface 24' },
];

function CornerCharacter() {
  /* The treatment that matches this system shows its real roles; the other two override the roles locally to compare. */
  return (
    <Panel>
      <div className="grid gap-xl lg:grid-cols-3">
        {TREATMENTS.map((t) => {
          const current = t.id === CHARACTER;
          const style = current ? undefined : ({ '--radius-control': t.control, '--radius-surface': t.surface } as CSSProperties);
          return (
            <div key={t.id} className="flex min-w-0 flex-col gap-md" style={style}>
              <Tag2 selected={current}>
                {t.label} · {current ? `control ${show('radius/control')}, surface ${show('radius/surface')}` : t.text}
              </Tag2>
              <ShapeCard />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function NestedCorners() {
  const pad = num('space/md');
  const inner = CONTROL;
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-2">
        {[false, true].map((parallel) => (
          <div key={String(parallel)} className="flex flex-col gap-md">
            <Tag2 selected={parallel} bad={!parallel}>
              {parallel ? 'Parallel: outer = inner + padding' : 'Pinched: outer = inner'}
            </Tag2>
            <div className="w-fit border border-border-default bg-surface-raised p-md shadow-raised" style={{ borderRadius: parallel ? `calc(${cssv('radius/control')} + var(--space-md))` : cssv('radius/control') }}>
              <span aria-hidden className="block h-(--size-control-lg) w-48 rounded-control bg-fill-brand-solid" />
            </div>
            <Spec>
              inner {inner} · padding {pad} · outer {parallel ? inner + pad : inner}
            </Spec>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BorderStates() {
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-2">
        <div className="flex flex-col gap-sm">
          <TextControl defaultValue="Q3 reports" aria-label="Report name, rest (sample)" />
          <Spec>Rest · border/width/default · color/border/default</Spec>
        </div>
        <div className="flex flex-col gap-sm">
          <TextControl defaultValue="Q3 reports" aria-label="Report name, focused (sample)" forceState="focus" />
          <Spec>Focus · border/width/focus · focus/default</Spec>
        </div>
        <div className="flex flex-col gap-sm">
          <ChoiceCard type="radio" name="shape-plan-demo" value="basic" text="Basic plan" subtext="$10/month" />
          <Spec>Choice card rest · border/width/default</Spec>
        </div>
        <div className="flex flex-col gap-sm">
          <ChoiceCard type="radio" name="shape-plan-demo" value="team" text="Team plan" subtext="$20/month" defaultSelected />
          <Spec>Choice card selected · border/width/selected</Spec>
        </div>
      </div>
    </Panel>
  );
}

/** A preview radius/control that differs visibly from the current value. */
const PREVIEW_CONTROL = CONTROL === 4 ? 12 : 4;

function SourceChange() {
  const sample = (
    <div className="flex flex-col items-start gap-md">
      <Button size="sm" label="Share report" />
      <TextControl size="sm" defaultValue="Q3 reports" aria-label="Report name (sample)" />
      <TextControl size="sm" type="select" defaultValue="Weekly" aria-label="Report frequency (sample)" />
    </div>
  );
  return (
    <Panel>
      <div className="grid gap-xl md:grid-cols-2">
        <div className="flex flex-col gap-md">
          <Tag2>Before · radius/control = {show('radius/control')}</Tag2>
          {sample}
        </div>
        <div className="flex flex-col gap-md" style={{ '--radius-control': `${PREVIEW_CONTROL}px` } as CSSProperties}>
          <Tag2>After · radius/control = {PREVIEW_CONTROL} (preview)</Tag2>
          {sample}
        </div>
      </div>
    </Panel>
  );
}

/** Nested-corner arithmetic for this system's control radius, md padding and radius roles. */
function nestedCaption() {
  if (CONTROL >= 9999) return 'Controls are full pills here, so any container around them only needs a radius that suits its own size.';
  const pad = num('space/md');
  const target = CONTROL + pad;
  const role = roleAtLeast(target);
  const toSurface = paddingFor(CONTROL, SURFACE);
  const parts = [`A control (${CONTROL}) inside ${pad} of padding needs an outer radius of ${target}.`];
  if (role) parts.push(num(role) === target ? `That is exactly ${role}.` : `The nearest role at or above that is ${role} (${num(role)}).`);
  if (toSurface && role !== 'radius/surface') parts.push(`Or keep the padding at ${num(toSurface)} to land on radius/surface (${SURFACE}).`);
  return parts.join(' ');
}

function GuidelinesTab() {
  const items: Guide[] = [
    {
      title: 'Radius is a role, not a number',
      body: (
        <>
          <P>Each role belongs to a kind of element, so choose it by what the element is, not by what looks right.</P>
          <Bullets
            items={[
              'Use radius/control on anything people operate, radius/surface on containers, and radius/modal on dialogs and drawers.',
              'Keep radius/xs and radius/sm for small parts inside controls and surfaces. Avoid inventing a radius between roles.',
              'Save radius/full for pills, avatars, switches, dots and radio buttons.',
              'A radius larger than half the shorter side makes the shape fully round, so size the element with that in mind.',
              'Show states with color and border width, not with a change of radius.',
            ]}
          />
        </>
      ),
      visual: <RoleSpecimen />,
      caption: 'Each role next to the real components that use it.',
      do: {
        caption: 'Keep the same corner when an item is selected; show selection with color.',
        render: () => (
          <span className="flex gap-xs">
            <span className="type-body-sm-semibold rounded-control bg-fill-brand-solid px-lg py-sm text-text-on-solid">List</span>
            <span className="type-body-sm-semibold rounded-control border border-border-default bg-surface-base px-lg py-sm text-text-secondary">Board</span>
          </span>
        ),
      },
      dont: {
        caption: 'Don’t change the radius to show a state.',
        render: () => (
          <span className="flex gap-xs">
            <span className="type-body-sm-semibold rounded-full bg-fill-brand-solid px-lg py-sm text-text-on-solid">List</span>
            <span className="type-body-sm-semibold rounded-xs border border-border-default bg-surface-base px-lg py-sm text-text-secondary">Board</span>
          </span>
        ),
      },
    },
    {
      title: 'Corner character',
      body: <P>{`Corners shape much of how an interface feels. Square reads as precise, soft as friendly, and fully round as playful and touch-first. ${brandCopy.cornerWhy({ name: config.name, character: CHARACTER })} Apply the choice to all the roles together, not to one component.`}</P>,
      visual: <CornerCharacter />,
      caption: `Content and color stay the same. The other two previews override the radius roles for comparison only. The selected option is what ${config.name} uses.`,
    },
    {
      title: 'Nested corners',
      body: <P>When a rounded element sits inside another, make the outer radius equal the inner radius plus the padding, so the curves stay parallel. If the result isn’t a role, use the next larger one.</P>,
      visual: <NestedCorners />,
      caption: nestedCaption(),
    },
    {
      title: 'Choosing a border width',
      body: <P>Most lines use border/width/default. Use border/width/strong for lines that need to stand out, and border/width/focus and border/width/selected only for those states. Wider borders are drawn inside the element, so content doesn’t shift.</P>,
      visual: <BorderStates />,
      caption: `Content stays in the same place at rest and when selected, because the ${num('border/width/selected')}px selected border is drawn inside.`,
    },
    {
      title: 'Change shape from the source',
      body: <P>Components use roles, so editing radius/control in the Shape collection changes every button, field and select at once. Editing border/width/focus changes every focus outline.</P>,
      visual: <SourceChange />,
      caption: `The same three controls before and after one edit. The ${PREVIEW_CONTROL} is a preview, not a value from the Shape collection.`,
    },
  ];
  return <GuideList items={items} />;
}

export default function Shape() {
  return (
    <DocPage
      eyebrow="Foundations › 1.4 Shape"
      title="Shape"
      description="Shape covers corner radius and border width. Each kind of element, from controls to dialogs, has its own radius role, so you can reshape a whole family of components in one place."
      figmaNode={figmaNodeFor('1.4')}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Tokens', render: () => <TokensTab /> },
        { label: 'Guidelines', render: () => <GuidelinesTab /> },
      ]}
    />
  );
}
