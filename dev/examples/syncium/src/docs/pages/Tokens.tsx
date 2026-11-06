import { Fragment, useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { tokens } from '@/tokens/tokens.gen';
import { Icon } from '@/icons';
import { Button, Progress, Select, Switch, TextField } from '@/components';
import { AnchorHeading, DocPage } from '../DocPage';
import { Bullets, Caption, DoDont, H3, InlineCode, P, Swatch, TokenTable } from '../blocks';
import { componentDocs, slugOf, staticPages } from '../registry';
import { figmaNodeFor } from '../meta';

/* ---------- data ---------- */
const byName = new Map(tokens.variables.map((t) => [t.name, t]));
const countOf = (c: string) => tokens.variables.filter((t) => t.collection === c).length;
const firstValue = (name: string) => {
  const t = byName.get(name);
  return t ? (t.modes.Light ?? t.modes.Standard ?? Object.values(t.modes)[0]) : undefined;
};
const pageTo = (id: string) => {
  const p = staticPages.find((s) => s.id === id);
  if (p) return `/${p.group}/${slugOf(p.id, p.name)}`;
  const d = componentDocs.find((c) => c.id === id);
  return d ? `/${d.level}/${slugOf(d.id, d.name)}` : '/';
};

const collectionInfo: Record<string, { holds: string; shownOn: ReactNode; samples: string[] }> = {
  Primitives: { holds: 'The raw palette/* colors and scale/* numbers, hidden from pickers.', shownOn: 'this page, under Primitive palette', samples: ['palette/brand/600', 'palette/neutral/900', 'scale/space/16'] },
  Color: { holds: 'Semantic color roles for text, icons, borders, surfaces and fills.', shownOn: <TextLinkTo id="1.1" label="1.1 Color" />, samples: ['color/text/primary', 'color/surface/base', 'color/fill/brand/solid'] },
  Typography: { holds: 'Families, weights, sizes, line heights and letter spacing.', shownOn: <TextLinkTo id="1.2" label="1.2 Typography" />, samples: ['font/family/ui', 'font/size/body-md', 'font/weight/semibold'] },
  Space: { holds: 'The spacing scale for gaps and padding.', shownOn: <TextLinkTo id="1.3" label="1.3 Space & layout" />, samples: ['space/sm', 'space/md', 'space/xl'] },
  Size: { holds: 'Control, icon, avatar, indicator, track, width, container, measure and touch sizes.', shownOn: <TextLinkTo id="1.3" label="1.3 Space & layout" />, samples: ['size/control/md', 'size/icon/md', 'size/touch-min'] },
  Shape: { holds: 'Radius roles and border widths.', shownOn: <TextLinkTo id="1.4" label="1.4 Shape" />, samples: ['radius/control', 'radius/surface', 'border/width/default'] },
  Motion: { holds: 'Durations, easings and delays.', shownOn: <TextLinkTo id="1.6" label="1.6 Motion" />, samples: ['motion/duration/fast', 'motion/duration/base', 'motion/easing/enter'] },
  Components: { holds: 'Component tokens, used only where no semantic role fits.', shownOn: 'each component’s Anatomy tab', samples: ['button/padding-x/md', 'switch/thumb/fill', 'avatar/placeholder/fill'] },
  Documentation: { holds: 'Measures and roles for the Figma documentation kit.', shownOn: '9.1 Doc kit (Figma only)', samples: ['doc/space/block', 'doc/measure/reading', 'doc/surface/stage'] },
};

const MAP = [
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
];

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

const MODE_ROLES = ['color/text/primary', 'color/surface/base', 'color/border/subtle', 'color/fill/brand/solid', 'color/fill/danger/subtle'];
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
      className={`type-code-sm-regular inline-flex max-w-full items-center gap-sm break-all rounded-indicator border px-md py-xxs ${tone === 'brand' ? 'border-border-brand-subtle bg-fill-brand-subtle text-text-brand' : 'border-border-subtle bg-surface-raised text-text-primary'}`}
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
      {m?.alias ? m.alias.replace(/^palette\//, '') : m?.value}
    </span>
  );
}

/* ---------- Overview ---------- */
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
            <span className="type-code-md-medium rounded-sm border border-border-brand-subtle bg-fill-brand-subtle px-md py-xs text-text-brand">{s}</span>
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
      <span className="type-body-sm-semibold text-text-primary">Storage</span>
      <span className="type-body-sm-regular text-text-secondary">You have used 1.9 TB of 2 TB.</span>
      <Progress value={95} aria-label="Storage used" />
      <div className="flex flex-wrap gap-sm">
        <Button size="sm" label="Upgrade" />
        <Button size="sm" emphasis="secondary" label="Manage files" />
      </div>
    </div>
  );
}

function Overview() {
  return (
    <div className="flex max-w-[64rem] flex-col gap-4xl">
      <Topic title="What the token system is for">
        <P>
          Every screen is built from named values for color, type, space, size, corners, depth and motion. Designers pick them as Figma variables and developers use the same names in
          code, so a design and its build always match. Four goals shape the system.
        </P>
        <div className="grid gap-md sm:grid-cols-2">
          {[
            ['Simplicity', 'Each concept has one name, there are only a few collections, and the structure is the same everywhere.'],
            ['Accessibility', 'Color pairs are tested in every mode before any component uses them.'],
            ['Aesthetics', 'The brand’s character lives in the primitives and roles, so every component carries it.'],
            ['Scalability', 'You can add modes, brands and components without renaming anything that exists.'],
          ].map(([t, d]) => (
            <div key={t} className="flex flex-col gap-xs rounded-surface border border-border-subtle p-xl">
              <H3>{t}</H3>
              <span className="type-body-sm-regular text-text-secondary">{d}</span>
            </div>
          ))}
        </div>
      </Topic>

      <Topic title="The collections">
        <P>
          Variables live in collections with plain domain names. A collection gets modes only when its values really change: Color has Light and Dark, and Motion has Standard and Reduced.
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
                  <span className="type-body-xs-regular text-text-tertiary">Shown on {info?.shownOn}</span>
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
              Put a product concept in a group inside its domain collection, not in a new collection. For example, <InlineCode>color/signal/excellent</InlineCode>, <InlineCode>good</InlineCode> and{' '}
              <InlineCode>poor</InlineCode> live inside Color.
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
          <LayerRow steps={['palette/brand/600', 'color/fill/brand/solid', null]} result={<Button label="Save changes" />} note="The primary button fill. The brand color is defined once, and every brand fill uses it." />
          <LayerRow
            steps={['scale/space/16', 'space/xl', 'button/padding-x/lg']}
            result={<Button size="lg" label="Sync now" />}
            note="A large button’s horizontal padding needs a component token, because no general spacing role means “large button padding”."
          />
          <LayerRow
            steps={['palette/base/white', 'color/surface/base', 'switch/thumb/fill']}
            result={
              <label className="type-body-sm-medium flex items-center gap-sm text-text-primary">
                <Switch checked onCheckedChange={() => {}} /> Backups
              </label>
            }
            note="The switch thumb. In Dark, color/surface/base points to palette/neutral/950 instead, and the thumb follows."
          />
        </Visual>
        <Caption>
          Category variables (<InlineCode>color/category/*</InlineCode>) are utility colors for badges, tags, avatars and charts. They don’t signal any status.
        </Caption>
      </Topic>

      <Topic title="Scopes">
        <P>Figma offers each variable only for the properties it belongs to, so pickers show sensible choices and nobody picks a border color for text.</P>
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
        <P>Every token name has the same shape. Each segment narrows the one before it, so you can guess a name before you look it up.</P>
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
          {['color/text/brand', 'hover', 'pressed'].map((n, i) => {
            const full = i === 0 ? n : `color/text/brand/${n}`;
            return (
              <div key={n} className="flex flex-wrap items-center gap-md">
                {i > 0 && (
                  <span aria-hidden className="type-code-sm-regular pl-md text-text-tertiary">
                    {i === 2 ? '└─' : '├─'}
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
        <P>
          In code, the same segments are joined with hyphens. Color, space, radius, font, shadow and easing tokens become Tailwind theme keys. Use everything else through its CSS variable.
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
        <Caption>
          Every semantic variable describes what it’s for in the UI. You’ll see the same text in Figma’s picker tooltip and in the <TextLink to="?tab=reference">Reference</TextLink> table.
        </Caption>
      </Topic>

      <Topic title="Modes">
        <P>
          Color has a Light and a Dark mode, and every role has a value in both. Components don’t need a dark variant: in Dark, the role points to a different primitive and everything
          that uses it follows.
        </P>
        <TableRegion label="Color roles in Light and Dark">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-sunken">
              <tr>
                <Th>Role</Th>
                <Th>Light</Th>
                <Th>Dark</Th>
              </tr>
            </thead>
            <tbody>
              {MODE_ROLES.map((n) => (
                <tr key={n} className="border-t border-border-subtle">
                  <Td code>{n}</Td>
                  <Td>
                    <ValueChip name={n} mode="Light" />
                  </Td>
                  <Td>
                    <ValueChip name={n} mode="Dark" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <div className="grid gap-xl md:grid-cols-2">
          {(['light', 'dark'] as const).map((m) => (
            <div key={m} className="flex min-w-0 flex-col gap-sm">
              <span className="type-body-xs-semibold text-text-tertiary">Color → {m === 'light' ? 'Light' : 'Dark'}</span>
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
            <>
              There’s one density, so Space and Size have no Compact or Spacious modes. Add them only when the product needs them, and let them change only control heights, paddings and
              row heights.
            </>,
            <>
              Breakpoints aren’t modes. Layouts change structure at <InlineCode>grid/mobile</InlineCode>, <InlineCode>grid/tablet</InlineCode>, <InlineCode>grid/desktop</InlineCode> and{' '}
              <InlineCode>grid/wide</InlineCode>, and tokens change only where a value really differs.
            </>,
            <>Dark neutrals are solid colors, not transparent white, so contrast stays predictable and stacked layers don’t add up.</>,
            <>Each mode is tested on its own, because a pair that passes in Light can fail in Dark.</>,
          ]}
        />
      </Topic>

      <Topic title="Primitive palette">
        <P>
          Under every semantic token sits a raw value: a <InlineCode>palette/*</InlineCode> color or a <InlineCode>scale/*</InlineCode> number. Primitives are hidden from pickers and never
          used directly in components, and they change only when the brand does. Syncium’s neutral is cool and tinted violet, so its grays sit naturally next to the brand.
        </P>
        <Visual className="flex flex-col gap-md">
          {families.map((f) => {
            const steps = tokens.variables.filter((t) => t.name.startsWith(`palette/${f}/`));
            return (
              <div key={f} className="grid items-center gap-xs sm:grid-cols-[9rem_1fr] sm:gap-lg">
                <span className="type-code-sm-regular text-text-secondary">palette/{f}</span>
                <div className={`flex h-6 overflow-hidden rounded-xs border border-border-subtle ${f === 'alpha-white' ? 'bg-[var(--palette-neutral-950)]' : f === 'alpha-black' ? 'bg-[var(--palette-base-white)]' : ''}`} role="img" aria-label={`palette/${f}: ${steps.length} steps`}>
                  {steps.map((s) => (
                    <span key={s.name} title={s.name} className="flex-1" style={{ background: Object.values(s.modes)[0]?.value }} />
                  ))}
                </div>
              </div>
            );
          })}
        </Visual>
        <P>
          The alpha scales, <InlineCode>palette/alpha-black/*</InlineCode> and <InlineCode>palette/alpha-white/*</InlineCode>, hold black and white at fixed opacities for the scrim, shadow
          colors and tints over media. The number scales are {scales.map((s) => `scale/${s}`).join(', ')}.
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
const rows: Row[] = [
  ...tokens.variables.map((t) => ({ name: t.name, collection: t.collection, hay: `${t.name} ${t.css} ${t.tailwind ?? ''}`.toLowerCase() })),
  ...tokens.textStyles.map((t) => ({ name: t.name, collection: 'Text styles', hay: `${t.name} ${t.className}`.toLowerCase() })),
  ...tokens.effectStyles.map((t) => ({ name: t.name, collection: 'Effect styles', hay: `${t.name} ${t.css} ${t.tailwind}`.toLowerCase() })),
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
        Find any variable, text style or effect style by its Figma name, CSS variable or Tailwind class. Values are shown for Light and Dark, and tokens with a single mode show the same
        value in both.
      </P>
      <div className="grid gap-lg md:grid-cols-[minmax(0,1fr)_16rem]">
        <TextField
          label="Search tokens"
          leadingIcon="general/search"
          placeholder="Try brand, --space-md or rounded-control"
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
