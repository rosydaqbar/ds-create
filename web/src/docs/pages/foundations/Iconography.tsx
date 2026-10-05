import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { cn } from '@/lib/cn';
import { Icon, iconNames, type IconName, type IconSize } from '@/icons';
import { Avatar, Badge, Button, FeaturedIcon, IconButton, Tooltip } from '@/components';
import { AnchorHeading, DocPage, Topics } from '../../DocPage';
import { Caption, CodeBlock, H3, InlineCode, P, TokenBadge } from '../../blocks';
import { figmaNodeFor } from '../../meta';
import { config } from '@/ds.config';
import type { Topic } from '../../types';

/* ---------- data ---------- */
const CATEGORIES: [string, string][] = [
  ['general', 'General'],
  ['arrows', 'Arrows'],
  ['users', 'Users'],
  ['alerts', 'Alerts & feedback'],
  ['shapes', 'Shapes'],
  ['files', 'Files'],
  ['layout', 'Layout'],
  ['development', 'Development'],
  ['commerce', 'Finance & commerce'],
  ['maps', 'Maps & travel'],
  ['charts', 'Charts'],
  ['communication', 'Communication'],
  ['media', 'Media & devices'],
  ['security', 'Security'],
  ['editor', 'Editor'],
  ['education', 'Education'],
  ['images', 'Images'],
  ['time', 'Time'],
  ['weather', 'Weather'],
];
const catOf = (n: string) => n.split('/')[0];
const nameOf = (n: string) => n.split('/')[1];
const presentCats = CATEGORIES.filter(([c]) => iconNames.some((n) => catOf(n) === c));

const vars = new Map(tokens.variables.map((v) => [v.name, v]));
const SIZES: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const sizeVar = (s: IconSize) => vars.get(`size/icon/${s}`)!;
const px = (s: IconSize) => parseFloat(sizeVar(s).modes.Value.value);

/**
 * BRAND: the icon library's drawing style. The defaults match the template registry (src/icons, outline icons
 * drawn with strokeWidth 2 on a 24 box). Rewrite them from the Figma Iconography page when the build picks another library or style.
 */
const STYLE = { kind: 'outline', stroke: 2, box: px('lg'), liveArea: px('lg') - 4 };

/** Icon colour roles shown on the surface they are made for (hover and pressed steps are left out). */
const ROLE_SURFACE: Record<string, string> = {
  'color/icon/inverse': 'var(--color-surface-inverse)',
  'color/icon/on-solid': 'var(--color-fill-brand-solid)',
  'color/icon/primary/on-brand': 'var(--color-surface-brand-solid)',
  'color/icon/secondary/on-brand': 'var(--color-surface-brand-solid)',
  'color/icon/tertiary/on-brand': 'var(--color-surface-brand-solid)',
};
const iconRoles = tokens.variables.filter((v) => v.name.startsWith('color/icon/') && !/\/(hover|pressed)$/.test(v.name));

const CORE: [IconName[], string][] = [
  [['general/placeholder'], 'The default in every icon slot'],
  [['general/check', 'general/minus'], 'Checked and mixed checkbox marks'],
  [['general/plus', 'general/x', 'general/search'], 'Icon buttons, removing tags, text controls'],
  [['arrows/chevron-down', 'arrows/chevron-up', 'arrows/chevron-left', 'arrows/chevron-right'], 'Select triggers, disclosures, pagination'],
  [['arrows/arrow-up-right'], 'Link to an external page'],
  [['users/user'], 'Avatar fallback'],
  [['alerts/info-circle', 'alerts/alert-circle', 'alerts/alert-triangle', 'alerts/check-circle'], 'Help text and featured icons'],
  [['alerts/help-circle'], 'The help icon next to a label'],
  [['shapes/star'], 'Rating stars'],
  [['general/resize'], 'Resize handle on multi-line text controls'],
];

/* ---------- small pieces ---------- */
function Themed({ mode, children }: { mode: 'light' | 'dark'; children: ReactNode }) {
  return (
    <div data-theme={mode} className="flex min-w-0 flex-col gap-lg rounded-surface bg-surface-sunken p-xl text-text-primary">
      <span className="type-body-xs-semibold text-text-tertiary">{mode === 'light' ? 'Light' : 'Dark'}</span>
      {children}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-sm">
      <span className="inline-flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className="relative inline-flex">
              <Icon name="shapes/star" size="sm" className="text-icon-disabled" fill="currentColor" />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>
                  <Icon name="shapes/star" size="sm" className="text-icon-warning" fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span className="type-body-sm-semibold text-text-primary">{value.toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
    </span>
  );
}

const NAV: [IconName, string][] = [
  ['general/home', 'Home'],
  ['files/folder', 'My files'],
  ['users/users', 'Shared'],
  ['charts/activity', 'Activity'],
  ['general/settings', 'Settings'],
];

function NavList({ icons = true, active = 1 }: { icons?: boolean; active?: number }) {
  return (
    <ul className="flex w-full max-w-[13rem] flex-col gap-xxs rounded-surface border border-border-subtle bg-surface-base p-sm">
      {NAV.map(([icon, label], i) => (
        <li
          key={label}
          className={cn('flex items-center gap-md rounded-control px-md py-sm type-body-sm-medium', i === active ? 'bg-fill-brand-subtle text-text-brand' : 'text-text-secondary')}
        >
          {icons && <Icon name={icon} size="md" className={i === active ? 'text-icon-brand' : 'text-icon-secondary'} />}
          {label}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Overview ---------- */
function Library() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const query = q.trim().toLowerCase();
  const list = useMemo(
    () => iconNames.filter((n) => (!cat || catOf(n) === cat) && (!query || n.includes(query))).sort((a, b) => a.localeCompare(b)),
    [cat, query],
  );
  const groups = presentCats.filter(([c]) => list.some((n) => catOf(n) === c));
  const chip = (on: boolean) =>
    cn(
      'type-body-xs-semibold inline-flex h-(--size-control-xs) cursor-pointer items-center gap-xs rounded-indicator border px-md outline-none is-focus:shadow-focus-default',
      on ? 'border-border-brand bg-fill-brand-subtle text-text-brand' : 'border-border-subtle bg-surface-base text-text-secondary is-hover:bg-surface-base-hover',
    );
  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xs">
        <label htmlFor="icon-search" className="type-body-sm-medium text-text-primary">
          Search icons
        </label>
        <div className="relative w-full max-w-[24rem]">
          <Icon name="general/search" size="md" className="pointer-events-none absolute top-1/2 left-md -translate-y-1/2 text-icon-placeholder" />
          <input
            id="icon-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “arrow” or “file”"
            className="type-body-sm-regular h-(--size-control-md) w-full rounded-control border border-border-default bg-surface-base pr-md pl-4xl text-text-primary outline-none placeholder:text-text-placeholder is-focus:border-border-brand is-focus:shadow-focus-default"
          />
        </div>
      </div>
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-xs">
        <button type="button" aria-pressed={!cat} onClick={() => setCat(null)} className={chip(!cat)}>
          All <span className="text-text-tertiary">{iconNames.length}</span>
        </button>
        {presentCats.map(([c, label]) => (
          <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)} className={chip(cat === c)}>
            {label} <span className="text-text-tertiary">{iconNames.filter((n) => catOf(n) === c).length}</span>
          </button>
        ))}
      </div>
      <p className="type-body-sm-regular text-text-secondary" aria-live="polite">
        {copied ? `Copied ${copied}` : `${list.length} ${list.length === 1 ? 'icon' : 'icons'}. Select an icon to copy its name.`}
      </p>
      {groups.length === 0 && <P>Nothing matches “{q}”. Try a broader word. If the concept is missing, add it to the library (see Guidelines).</P>}
      <div className="flex flex-col gap-2xl">
        {groups.map(([c, label]) => {
          const items = list.filter((n) => catOf(n) === c);
          return (
            <div key={c} className="flex flex-col gap-md">
              <span className="flex items-baseline gap-sm">
                <H3>{label}</H3>
                <span className="type-code-sm-regular text-text-tertiary">
                  {items.length} · Icon/{c}/*
                </span>
              </span>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-sm">
                {items.map((n) => (
                  <button
                    key={n}
                    type="button"
                    title={n}
                    onClick={() => {
                      navigator.clipboard?.writeText(n).catch(() => {});
                      setCopied(n);
                    }}
                    className="flex cursor-pointer flex-col items-center gap-xs rounded-surface border border-border-subtle bg-surface-base p-lg outline-none is-hover:bg-surface-base-hover is-focus:shadow-focus-default"
                  >
                    <Icon name={n} size="lg" className="text-icon-primary" />
                    <span className="type-code-sm-regular w-full text-center text-text-tertiary [overflow-wrap:anywhere]">{copied === n ? 'Copied' : nameOf(n)}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sizes() {
  return (
    <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-5">
      {SIZES.map((s) => {
        const v = sizeVar(s);
        return (
          <div key={s} className="flex flex-col gap-md rounded-surface border border-border-subtle p-lg">
            <div className="flex h-16 items-center justify-center gap-md rounded-control bg-surface-sunken">
              {(['general/placeholder', 'general/check', 'arrows/chevron-down'] as const).map((n) => (
                <span key={n} className="inline-flex outline-1 outline-border-brand-subtle outline-dashed">
                  <Icon name={n} size={s} className="text-icon-primary" />
                </span>
              ))}
            </div>
            <TokenBadge name={v.name} />
            <span className="type-code-sm-regular text-text-secondary">{v.modes.Value.value}</span>
            <span className="type-body-xs-regular text-text-secondary">{v.description}</span>
          </div>
        );
      })}
    </div>
  );
}

function Colours() {
  return (
    <div className="grid gap-lg">
      {(['light', 'dark'] as const).map((m) => (
        <Themed key={m} mode={m}>
          <div className="grid gap-sm sm:grid-cols-2 lg:grid-cols-3">
            {iconRoles.map((r) => (
              <div key={r.name} className="flex min-w-0 items-center gap-sm rounded-control bg-surface-base p-sm">
                <span className="inline-flex size-(--size-control-sm) shrink-0 items-center justify-center rounded-sm" style={{ background: ROLE_SURFACE[r.name] ?? 'var(--color-surface-base)' }}>
                  <Icon name="alerts/info-circle" size="md" style={{ color: `var(${r.css})` }} />
                </span>
                <span className="type-code-sm-regular min-w-0 break-words text-text-secondary">{r.name.replace('color/icon/', '')}</span>
              </div>
            ))}
          </div>
        </Themed>
      ))}
    </div>
  );
}

function Overview() {
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-lg">
        <AnchorHeading>Icon library</AnchorHeading>
        <P>
          All icons share one {STYLE.kind} style, drawn with {STYLE.stroke}-pixel rounded strokes. There are {iconNames.length} icons in{' '}
          {presentCats.length} categories, sorted alphabetically. An icon’s code name, <InlineCode>{'{category}/{name}'}</InlineCode>, matches its Figma name,{' '}
          <InlineCode>{'Icon/{category}/{name}'}</InlineCode>.
        </P>
        <Library />
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Sizes</AnchorHeading>
        <P>
          Pick from five steps, each set by a size token. Inside controls you don’t need to choose: xs and sm controls use the sm icon, md and lg controls use md,
          and xl controls use lg. For anything bigger than the largest step, use a Featured icon (2.19).
        </P>
        <Sizes />
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Colors</AnchorHeading>
        <P>
          Give icons a color role rather than a raw color, so they adapt to Light and Dark. Use primary for the main meaning and secondary inside buttons and
          inputs. Tertiary supports, and the status roles signal danger, warning, success and info. Roles made for other surfaces are shown on their own surface.
        </P>
        <Colours />
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Core set</AnchorHeading>
        <P>The Parts depend on these icons, so they always stay in the library.</P>
        <div className="grid gap-sm md:grid-cols-2">
          {CORE.map(([names, use]) => (
            <div key={names[0]} className="flex items-center gap-lg rounded-control border border-border-subtle p-md">
              <span className="flex shrink-0 gap-sm">
                {names.map((n) => (
                  <Icon key={n} name={n} size="md" className="text-icon-primary" />
                ))}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="type-code-sm-regular break-words text-text-primary">{names.join(', ')}</span>
                <span className="type-body-xs-regular text-text-secondary">{use}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Utility marks</AnchorHeading>
        <P>Check marks, rating stars and status dots work like small icons. Always show them with text, so the meaning never depends on the mark alone.</P>
        <UtilityMarks />
      </section>
    </div>
  );
}

function UtilityMarks() {
  return (
    <div className="grid gap-lg md:grid-cols-3">
      <div className="flex flex-col gap-md rounded-surface border border-border-subtle p-xl">
        <span className="type-body-xs-semibold text-text-tertiary">Check icon · feature list</span>
        <ul className="flex flex-col gap-sm">
          {['Unlimited projects', 'Version history', 'Priority support'].map((t) => (
            <li key={t} className="flex items-center gap-sm type-body-sm-regular text-text-primary">
              <span className="inline-flex size-(--size-icon-md) items-center justify-center rounded-full bg-fill-success-subtle">
                <Icon name="general/check" size="xs" className="text-icon-success" />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-md rounded-surface border border-border-subtle p-xl">
        <span className="type-body-xs-semibold text-text-tertiary">Star · rating with the number</span>
        <Stars value={4.5} />
        <span className="type-body-xs-regular text-text-secondary">Stars fill with color/icon/warning, and the number gives the exact value.</span>
      </div>
      <div className="flex flex-col gap-md rounded-surface border border-border-subtle p-xl">
        <span className="type-body-xs-semibold text-text-tertiary">Dot · status with a label</span>
        <span className="flex flex-wrap items-center gap-md">
          <Avatar size="md" initials="OR" alt="Olivia Rhye, online" indicator="online" />
          <Badge tone="success" showDot label="Online" />
          <Badge tone="danger" showDot label="Failed" />
        </span>
      </div>
    </div>
  );
}

/* ---------- Guidelines ---------- */
const OVERSIZED: CSSProperties = { width: '4rem', height: '4rem' };

const TOPICS: Topic[] = [
  {
    title: 'Icons make interfaces faster to scan',
    body: 'In a dense screen, icons help people spot familiar actions and places at a glance. The two lists below share the same labels and layout. Only the icons differ.',
    render: () => (
      <div className="grid w-full justify-items-center gap-xl sm:grid-cols-2">
        <div className="flex w-full flex-col items-center gap-sm">
          <NavList />
          <Caption>With icons</Caption>
        </div>
        <div className="flex w-full flex-col items-center gap-sm">
          <NavList icons={false} />
          <Caption>Without icons</Caption>
        </div>
      </div>
    ),
  },
  {
    title: 'Use familiar symbols',
    body: 'When a symbol already has a strong convention, use it. People recognize these without any explanation.',
    render: () => (
      <div className="grid w-full grid-cols-4 gap-lg sm:grid-cols-8">
        {(
          [
            ['general/home', 'Home'],
            ['general/search', 'Search'],
            ['general/menu', 'Menu'],
            ['general/edit', 'Edit'],
            ['general/heart', 'Favorite'],
            ['general/share', 'Share'],
            ['general/settings', 'Settings'],
            ['general/x', 'Close'],
          ] as const
        ).map(([n, t]) => (
          <span key={n} className="flex flex-col items-center gap-xs">
            <Icon name={n} size="lg" className="text-icon-primary" />
            <span className="type-body-xs-medium text-text-secondary">{t}</span>
          </span>
        ))}
      </div>
    ),
  },
  {
    title: 'Icons don’t always replace text',
    body: 'On its own, an icon can mean different things to different people. Keep icon-only buttons for familiar actions, and give each one a tooltip and a name for screen readers. For anything less familiar, show the label.',
    render: () => (
      <div className="flex w-full flex-col items-center gap-sm">
        <span className="flex items-center gap-md">
          <Tooltip text="Close">
            <IconButton icon="general/x" label="Close" emphasis="secondary" />
          </Tooltip>
        </span>
        <Caption>A familiar action like Close works icon-only, with a tooltip and the screen-reader name “Close”.</Caption>
      </div>
    ),
    do: { caption: 'Pair an unfamiliar action’s icon with its label.', render: () => <Button emphasis="secondary" leadingIcon="general/zap" label="Optimize storage" /> },
    dont: { caption: 'Don’t use an icon-only button for an unfamiliar action.', render: () => <IconButton icon="general/zap" label="Optimize storage" emphasis="secondary" /> },
  },
  {
    title: 'Give meaningful icons a name',
    body: 'Decide whether an icon is decorative or meaningful. A decorative icon sits next to text that already says the same thing, so screen readers skip it by default. A meaningful icon carries information on its own, so give it a label. Icon buttons always need one, because the icon is all people see.',
    render: () => (
      <div className="flex w-full flex-col gap-lg">
        <div className="flex flex-wrap items-center justify-center gap-2xl">
          <span className="flex items-center gap-sm type-body-sm-regular text-text-primary">
            <Icon name="files/folder" size="md" className="text-icon-secondary" /> Design files
          </span>
          <span className="flex items-center gap-sm type-body-sm-regular text-text-primary">
            Q4 budget <Icon name="security/lock" size="sm" label="Private" className="text-icon-tertiary" />
          </span>
        </div>
        <CodeBlock
          label="Icon accessible names"
          code={`<Icon name="files/folder" />                         // decorative: the text says it
<Icon name="security/lock" label="Private" />         // meaningful: needs a name
<IconButton icon="general/x" label="Close" />         // icon buttons always have one`}
        />
      </div>
    ),
  },
  {
    title: 'Compact and collapsed navigation',
    body: 'Icon-only navigation can work when space is tight, as long as each item shows its label in a tooltip on hover or focus and the active item is clearly marked. It isn’t better by default, so keep the labels whenever there’s room.',
    render: () => (
      <div className="grid w-full items-start justify-items-center gap-xl sm:grid-cols-[auto_auto]">
        <div className="flex flex-col items-center gap-sm">
          <NavList />
          <Caption>Expanded: icons and labels</Caption>
        </div>
        <div className="flex flex-col items-center gap-sm">
          <ul className="flex flex-col gap-xxs rounded-surface border border-border-subtle bg-surface-base p-sm">
            {NAV.map(([icon, label], i) => (
              <li key={label} className={cn('relative rounded-control', i === 1 && 'bg-fill-brand-subtle')}>
                {i === 1 && <span aria-hidden className="absolute inset-y-sm -left-sm w-(--border-width-strong) rounded-full bg-fill-brand-solid" />}
                {i === 1 ? (
                  <Tooltip text={label} placement="right" open>
                    <IconButton icon={icon} label={label} className="text-icon-brand" aria-current="page" />
                  </Tooltip>
                ) : (
                  <Tooltip text={label} placement="right">
                    <IconButton icon={icon} label={label} />
                  </Tooltip>
                )}
              </li>
            ))}
          </ul>
          <Caption>Collapsed: active item marked, label in a tooltip</Caption>
        </div>
      </div>
    ),
  },
  {
    title: 'Pair icons with text',
    body: 'When there’s room, add an icon next to the label as an extra cue. It helps most with less familiar actions, where the icon alone wouldn’t be enough.',
    render: () => (
      <div className="grid w-full gap-lg sm:grid-cols-2">
        {(
          [
            ['general/download', 'Download'],
            ['general/archive', 'Archive'],
          ] as const
        ).map(([icon, label]) => (
          <div key={label} className="flex flex-wrap items-center justify-center gap-md">
            <Button emphasis="secondary" label={label} />
            <Icon name="arrows/arrow-right" size="sm" className="text-icon-tertiary" />
            <Button emphasis="secondary" leadingIcon={icon} label={label} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Icon sizing',
    body: 'Stick to the size steps, and match each icon to the text beside it: sm icons with small text, md icons with body text.\n\nDon’t scale an icon past size/icon/xl, because the strokes get heavy and the drawing loses its proportions. When an icon needs more emphasis, place a standard-size icon inside a Featured icon (2.19), which adds a shaped container instead.',
    render: () => (
      <div className="flex w-full flex-wrap items-center justify-center gap-2xl">
        <span className="flex items-center gap-xs type-body-sm-regular text-text-primary">
          <Icon name="time/clock" size="sm" className="text-icon-secondary" /> Updated 2 min ago · body sm + icon sm
        </span>
        <span className="flex items-center gap-sm type-body-md-regular text-text-primary">
          <Icon name="users/users" size="md" className="text-icon-secondary" /> 12 members · body md + icon md
        </span>
      </div>
    ),
    do: { caption: `Use a Featured icon for emphasis. The icon inside stays at size/icon/lg, with its ${STYLE.stroke}-pixel stroke.`, render: () => <FeaturedIcon size="xl" emphasis="primary" tone="neutral" icon="files/cloud-upload" /> },
    dont: { caption: 'Don’t scale an icon up to 64 pixels. The strokes thicken and the details blur.', render: () => <Icon name="files/cloud-upload" className="text-icon-primary" style={OVERSIZED} /> },
  },
  {
    title: 'One library, one style',
    body: `Mixed icon families are easy to spot, because their stroke weights, corners and proportions don’t match. The ${config.name} uses one ${STYLE.kind} library with a ${STYLE.stroke}-pixel stroke on a ${STYLE.box}-pixel box. When a concept is missing, draw it in the same style rather than borrowing from another set.`,
    do: {
      caption: 'Same stroke, same rounded joins, same open outline.',
      render: () => (
        <span className="flex gap-xl">
          {(['files/folder', 'general/share', 'time/calendar'] as const).map((n) => (
            <Icon key={n} name={n} size="xl" className="text-icon-primary" />
          ))}
        </span>
      ),
    },
    dont: {
      caption: 'Don’t mix in other weights (3.5 and 1), sharp corners or solid shapes.',
      render: () => (
        <span className="flex gap-xl">
          <Icon name="files/folder" size="xl" className="text-icon-primary" strokeWidth={3.5} />
          <Icon name="general/share" size="xl" className="text-icon-primary" strokeWidth={1} strokeLinejoin="miter" strokeLinecap="square" />
          <Icon name="time/calendar" size="xl" className="text-icon-primary" fill="currentColor" />
        </span>
      ),
    },
  },
  {
    title: 'Color follows meaning',
    body: 'Color an icon by what it means, not to decorate it. Use neutral roles for everyday actions. Save status roles for icons that report a status, and put text beside them that says the same thing, so color is never the only cue.',
    do: {
      caption: 'Status color on a real status, with words that say it.',
      render: () => (
        <span className="flex flex-col gap-sm">
          <span className="flex items-center gap-sm type-body-sm-regular text-text-primary">
            <Icon name="alerts/check-circle" size="md" className="text-icon-success" /> Export complete
          </span>
          <span className="flex items-center gap-sm type-body-sm-regular text-text-primary">
            <Icon name="alerts/alert-triangle" size="md" className="text-icon-warning" /> 2 files skipped
          </span>
        </span>
      ),
    },
    dont: {
      caption: 'Don’t color everyday icons for decoration. Status colors stop meaning anything.',
      render: () => (
        <span className="flex gap-xl">
          <Icon name="general/home" size="lg" className="text-icon-danger" />
          <Icon name="files/folder" size="lg" className="text-icon-warning" />
          <Icon name="general/settings" size="lg" className="text-icon-success" />
          <Icon name="general/share" size="lg" className="text-icon-info" />
        </span>
      ),
    },
  },
  {
    title: 'Icon anatomy',
    body: `Every icon is built the same way. The glyph stays inside a ${STYLE.liveArea}-pixel live area within a ${STYLE.box}-pixel box, drawn as one vector named Icon with a ${STYLE.stroke}-pixel stroke in the current color role. The stroke scales with the box, so every size keeps the same proportions.`,
    render: () => <Anatomy />,
  },
  {
    title: 'Built to swap and export',
    body: 'Each icon exports to code as an SVG with one path that uses currentColor. The color comes from the role around the icon, so swapping one icon for another keeps the color, both in Figma (where every inner layer is named Icon) and in code.\n\nAvoid boolean groups, masks, hidden layers and typed-in colors. They produce heavy or broken SVGs, and a hard-coded color ignores Light and Dark.',
    render: () => <SwapDemo />,
  },
  {
    title: 'Extending the library',
    body: 'Before adding an icon, check that the library doesn’t already have the concept under another name. Take the new icon from the same library, or draw it on the same grid, live area and stroke.\n\nBuild it as one vector named Icon, with its color set by a variable. Name it Icon/{category}/{name} in kebab-case, in exactly one category, and add it to the specimen in alphabetical order. Then add the same name to the registry in code.',
    render: () => (
      <div className="w-full">
        <CodeBlock
          label="Adding an icon"
          code={`// src/icons/index.tsx — one registry maps the Figma names to the library.
import { FileArchive } from 'lucide-react';

export const icons = {
  // …
  'files/file-archive': FileArchive,   // Icon/files/file-archive in Figma
};`}
        />
      </div>
    ),
  },
  {
    title: 'Utility marks in use',
    body: 'Use a check icon to mark included items and completed steps, always next to the text it confirms. Show stars with the rating number beside them. Place a status dot next to a label or on an avatar, not on its own. Cursors belong in prototypes and documentation only, not in product screens.',
    render: () => (
      <div className="w-full">
        <UtilityMarks />
      </div>
    ),
  },
];

function Anatomy() {
  const box = 'calc(var(--size-icon-lg) * 4)';
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-3xl">
      <div className="relative" style={{ width: box, height: box }} aria-hidden>
        <span className="absolute inset-0 border border-dashed border-border-default" />
        <span className="absolute border border-dashed border-border-brand" style={{ inset: `${((STYLE.box - STYLE.liveArea) / 2) * 4}px` }} />
        <Icon name="files/folder" className="relative text-icon-primary" style={{ width: box, height: box }} />
      </div>
      <ul className="flex flex-col gap-md">
        {[
          ['Component box', `${sizeVar('lg').modes.Value.value} (size/icon/lg), shown at 4×, with no fill`],
          ['Live area', `The inner dashed square, ${STYLE.liveArea}px. The glyph stays inside it.`],
          ['Vector “Icon”', `A ${STYLE.stroke}-pixel stroke in the current color role (color/icon/primary by default)`],
        ].map(([k, v]) => (
          <li key={k} className="flex flex-col">
            <span className="type-body-sm-semibold text-text-primary">{k}</span>
            <span className="type-body-sm-regular text-text-secondary">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SwapDemo() {
  const options: IconName[] = ['general/placeholder', 'general/search', 'files/folder', 'general/bell'];
  const [i, setI] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-lg">
      <span className="flex items-center gap-xl">
        <Icon name={options[i]} size="xl" className="text-icon-brand" />
        <Button size="sm" emphasis="secondary" leadingIcon="general/refresh" label="Swap icon" onClick={() => setI((x) => (x + 1) % options.length)} />
      </span>
      <Caption>
        {options[i]} in color/icon/brand. Swap it and the name changes, but the color stays.
      </Caption>
    </div>
  );
}

export default function Iconography() {
  return (
    <DocPage
      eyebrow="Foundations › 1.7 Iconography"
      title="Iconography"
      description="Icons help people scan a screen and recognize actions quickly. They share one outline style, and their sizes and colors come from tokens, so each icon fits the text and surface around it."
      figmaNode={figmaNodeFor('1.7')}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Guidelines', render: () => <Topics items={TOPICS} /> },
      ]}
    />
  );
}
