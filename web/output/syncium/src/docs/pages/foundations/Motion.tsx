import { useEffect, useState, type ReactNode } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from '@/icons';
import { Button, Checkbox, IconButton, Menu, Select, Spinner, Switch, Tooltip } from '@/components';
import { AnchorHeading, DocPage, Topics } from '../../DocPage';
import { Caption, CodeBlock, InlineCode, P, TokenBadge } from '../../blocks';
import { pageMeta } from '../../meta';
import type { Topic } from '../../types';

/* ---------- token helpers ---------- */
const motionVars = tokens.variables.filter((v) => v.collection === 'Motion');
const durations = motionVars.filter((v) => v.name.startsWith('motion/duration/'));
const easings = motionVars.filter((v) => v.name.startsWith('motion/easing/'));
const delays = motionVars.filter((v) => v.name.startsWith('motion/delay/'));
const byName = new Map(motionVars.map((v) => [v.name, v]));
const short = (name: string) => name.split('/').pop()!;
const ms = (name: string, mode: 'Standard' | 'Reduced' = 'Standard') => parseFloat(byName.get(name)?.modes[mode]?.value ?? '0');
const bezier = (name: string) => (byName.get(name)?.modes.Standard?.value.match(/-?[\d.]+/g) ?? []).map(Number);
const cssVar = (name: string) => `var(${byName.get(name)?.css})`;
const maxMs = Math.max(...durations.map((d) => ms(d.name)));

const FEELS: Record<string, string> = {
  instant: 'No animation',
  fast: 'Immediate response: hover, press, color change, anything leaving',
  base: 'Small movement: a switch thumb, a checkbox mark, a menu opening',
  slow: 'Large movement: a dialog or drawer entering',
  loop: 'One rotation of a spinner',
};
const EASE_USE: Record<string, string> = {
  standard: 'Things changing in place',
  enter: 'Things arriving: starts fast, settles gently',
  exit: 'Things leaving: starts gently, speeds away',
  linear: 'Continuous rotation and progress only',
};

/** Reduced-mode label for a duration: what the change becomes. */
const reducedAs = (name: string) => {
  const s = ms(name);
  const r = ms(name, 'Reduced');
  if (r === s) return s === 0 ? 'instant' : 'kept for fades';
  if (r === 0) return 'instant';
  return r > s ? 'slower loop' : 'shorter';
};

/* ---------- pairings (kept from the motion recipes in styles/index.css) ---------- */
const PAIRINGS = [
  ['Hover, press, color change', 'fast · standard', 'transition-… duration-(--motion-duration-fast) ease-standard', 'Every control'],
  ['Switch thumb, checkbox mark, radio dot', 'base · standard', 'transition-… duration-(--motion-duration-base) ease-standard', 'Switch, Checkbox, Radio, Progress'],
  ['Menu, tooltip, popover entering', 'base · enter', 'motion-enter', 'Select, Menu, Context menu, submenus, Tooltip, floating toolbar'],
  ['Dialog, drawer entering', 'slow · enter', 'motion-enter-slow', 'Navigation drawer'],
  ['Anything leaving', 'fast · exit', 'motion-exit + usePresence()', 'Select, Menu, Context menu, Tooltip, floating toolbar'],
  ['Spinner rotation', 'loop · linear', 'animate-spin duration-(--motion-duration-loop)', 'Spinner, loading buttons'],
];

/** Pairings as playable samples: [label, duration token, easing token]. */
const SAMPLES: [string, string, string][] = [
  ['Hover, press, color change', 'motion/duration/fast', 'motion/easing/standard'],
  ['Switch thumb, checkbox mark', 'motion/duration/base', 'motion/easing/standard'],
  ['Menu, tooltip, popover entering', 'motion/duration/base', 'motion/easing/enter'],
  ['Dialog, drawer entering', 'motion/duration/slow', 'motion/easing/enter'],
  ['Anything leaving', 'motion/duration/fast', 'motion/easing/exit'],
];

/* ---------- small pieces ---------- */
function PlayButton({ on, onClick, label = 'Play' }: { on: boolean; onClick: () => void; label?: string }) {
  return <Button size="sm" emphasis="secondary" leadingIcon={on ? 'general/refresh' : 'media/play'} label={on ? 'Reset' : label} onClick={onClick} />;
}

/** A square that travels along a track with one duration and easing. */
function Track({ on, duration, easing, className }: { on: boolean; duration: string; easing: string; className?: string }) {
  return (
    <div className={cn('relative h-6 min-w-0 flex-1 rounded-full bg-surface-sunken', className)} aria-hidden>
      <div
        className="absolute top-0 size-6 rounded-full bg-fill-brand-solid"
        style={{ left: on ? 'calc(100% - 1.5rem)' : 0, transition: `left ${cssVar(duration)} ${cssVar(easing)}` }}
      />
    </div>
  );
}

function Curve({ name }: { name: string }) {
  const [x1, y1, x2, y2] = bezier(name);
  const P = (x: number, y: number) => `${8 + x * 84},${92 - y * 84}`;
  return (
    <svg viewBox="0 0 100 100" className="size-28 overflow-visible" aria-hidden>
      <rect x="8" y="8" width="84" height="84" className="fill-none stroke-border-subtle" strokeWidth="1" />
      <line x1={8} y1={92} x2={8 + x1 * 84} y2={92 - y1 * 84} className="stroke-border-default" strokeWidth="1" />
      <line x1={92} y1={8} x2={8 + x2 * 84} y2={92 - y2 * 84} className="stroke-border-default" strokeWidth="1" />
      <path d={`M${P(0, 0)} C${P(x1, y1)} ${P(x2, y2)} ${P(1, 1)}`} className="fill-none stroke-border-brand" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={8 + x1 * 84} cy={92 - y1 * 84} r="3" className="fill-border-brand" />
      <circle cx={8 + x2 * 84} cy={92 - y2 * 84} r="3" className="fill-border-brand" />
    </svg>
  );
}

function Region({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div tabIndex={0} role="region" aria-label={label} className="overflow-x-auto rounded-surface border border-border-subtle outline-none is-focus:shadow-focus-default">
      {children}
    </div>
  );
}

const th = 'px-lg py-md';

/* ---------- Overview ---------- */
function Principles() {
  const items: { icon: IconName; title: string; text: string }[] = [
    { icon: 'general/sync', title: 'Motion explains change', text: 'It shows what arrived, what left and what synced. A menu grows from its trigger, and a removed row closes its gap.' },
    { icon: 'general/zap', title: 'Quick and calm', text: 'Durations are short and curves are gentle. The result is ready the moment someone acts, so the transition never makes them wait.' },
    { icon: 'general/eye', title: 'Reduced on request', text: 'When people ask their device to reduce motion, movement becomes an instant change or a short fade.' },
  ];
  return (
    <div className="grid gap-lg md:grid-cols-3">
      {items.map((i) => (
        <div key={i.title} className="flex flex-col gap-md rounded-surface border border-border-subtle p-xl">
          <Icon name={i.icon} size="lg" className="text-icon-brand" />
          <span className="type-body-md-semibold text-text-primary">{i.title}</span>
          <span className="type-body-sm-regular text-text-secondary">{i.text}</span>
        </div>
      ))}
    </div>
  );
}

function DurationBars() {
  return (
    <div className="flex flex-col gap-lg">
      {durations.map((d) => (
        <div key={d.name} className="grid items-center gap-sm md:grid-cols-[12rem_minmax(0,1fr)_5rem] md:gap-lg">
          <div className="flex flex-col">
            <span className="type-code-sm-medium text-text-primary">{d.name}</span>
            <span className="type-body-xs-regular text-text-secondary">{FEELS[short(d.name)]}</span>
          </div>
          <div className="h-(--size-track-md) rounded-full bg-surface-sunken" aria-hidden>
            <div className="h-full min-w-(--size-track-md) rounded-full bg-fill-brand-solid" style={{ width: `${(ms(d.name) / maxMs) * 100}%` }} />
          </div>
          <span className="type-code-sm-regular text-text-secondary md:text-right">{ms(d.name)} ms</span>
        </div>
      ))}
    </div>
  );
}

function TryIt() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-col gap-lg rounded-surface border border-border-subtle p-xl">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <span className="type-body-sm-semibold text-text-primary">Every duration with every curve</span>
        <PlayButton on={on} onClick={() => setOn((o) => !o)} />
      </div>
      <div className="flex flex-col gap-md">
        {durations
          .filter((d) => !d.name.endsWith('loop') && ms(d.name) > 0)
          .flatMap((d) =>
            easings.slice(0, 3).map((e) => (
              <div key={d.name + e.name} className="grid items-center gap-sm md:grid-cols-[12rem_minmax(0,1fr)] md:gap-lg">
                <span className="type-code-sm-regular text-text-secondary">
                  {short(d.name)} · {short(e.name)}
                </span>
                <Track on={on} duration={d.name} easing={e.name} />
              </div>
            )),
          )}
      </div>
    </div>
  );
}

function LiveComponents() {
  return (
    <div className="flex flex-wrap items-start gap-2xl rounded-surface border border-border-subtle bg-surface-sunken p-3xl">
      <Button emphasis="secondary" label="Hover me" />
      <Switch defaultChecked aria-label="Sync on" />
      <Checkbox defaultChecked aria-label="Include shared folders" />
      <Tooltip text="Tooltips enter at base · enter">
        <Button emphasis="tertiary" label="Tooltip" />
      </Tooltip>
      <div className="w-56">
        <Select label="Select" options={[{ value: 'a', label: 'Daily' }, { value: 'b', label: 'Weekly' }, { value: 'c', label: 'Monthly' }]} placeholder="Choose" />
      </div>
      <Menu type="button-simple" />
    </div>
  );
}

function Overview() {
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-lg">
        <AnchorHeading>Principles</AnchorHeading>
        <P>
          Motion in Syncium is calm and quick. It explains change rather than decorating: where something came from, where it went, what responded. Every transition
          also has a reduced version, so nobody needs movement to understand the screen.
        </P>
        <Principles />
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Durations</AnchorHeading>
        <P>Small feedback is fast, and the farther or larger the movement, the longer it takes. The bars are drawn to scale.</P>
        <DurationBars />
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Easings</AnchorHeading>
        <P>An easing sets how a change speeds up and slows down. Things arriving start fast and settle. Things leaving start gently and speed away.</P>
        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {easings.map((e) => (
            <div key={e.name} className="flex flex-col items-center gap-md rounded-surface border border-border-subtle p-xl text-center">
              <Curve name={e.name} />
              <span className="type-code-sm-medium text-text-primary">{e.name}</span>
              <span className="type-code-sm-regular text-text-tertiary">{bezier(e.name).join(', ')}</span>
              <span className="type-body-sm-regular text-text-secondary">{EASE_USE[short(e.name)]}</span>
            </div>
          ))}
        </div>
        <TryIt />
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>Pairings</AnchorHeading>
        <P>Choose the duration and easing together, by what the motion is for rather than by feel. Each pairing is a utility or transition built from the tokens, so Reduced mode applies everywhere without extra code.</P>
        <Region label="Motion pairings">
          <table className="w-full text-left">
            <thead className="bg-surface-sunken">
              <tr className="type-body-xs-semibold text-text-tertiary">
                <th className={th}>Purpose</th>
                <th className={th}>Tokens</th>
                <th className={th}>In code</th>
                <th className={th}>Used by</th>
              </tr>
            </thead>
            <tbody>
              {PAIRINGS.map(([a, b, c, d]) => (
                <tr key={a} className="border-t border-border-subtle align-top">
                  <td className="type-body-sm-medium px-lg py-md text-text-primary">{a}</td>
                  <td className="type-code-sm-regular whitespace-nowrap px-lg py-md text-text-secondary">{b}</td>
                  <td className="type-code-sm-regular px-lg py-md text-text-brand">{c}</td>
                  <td className="type-body-sm-regular px-lg py-md text-text-secondary">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Region>
      </section>

      <section className="flex flex-col gap-lg">
        <AnchorHeading>See it in real components</AnchorHeading>
        <P>Hover the button, flip the switch and checkbox, focus the tooltip trigger, and open the select and the menu. Each one uses the pairing that fits its purpose.</P>
        <LiveComponents />
      </section>
    </div>
  );
}

/* ---------- Tokens ---------- */
const GROUPS = [
  { title: 'Duration', sub: 'How long a change takes.', items: durations },
  { title: 'Easing', sub: 'How a change speeds up and settles, written as cubic-bezier values.', items: easings },
  { title: 'Delay', sub: 'How long to wait before something happens.', items: delays },
];

function Tokens() {
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-lg">
        <AnchorHeading>Motion collection</AnchorHeading>
        <P>
          The collection has two modes. <InlineCode>Standard</InlineCode> is the default. <InlineCode>Reduced</InlineCode> takes over when the operating system asks for
          reduced motion, or inside any element with <InlineCode>data-motion="reduced"</InlineCode>.
        </P>
      </section>
      {GROUPS.map((g) => (
        <section key={g.title} className="flex flex-col gap-lg">
          <AnchorHeading>{g.title}</AnchorHeading>
          <P>{g.sub}</P>
          <Region label={`${g.title} tokens`}>
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-sunken">
                <tr className="type-body-xs-semibold text-text-tertiary">
                  <th className={th}>Token</th>
                  <th className={th}>Standard</th>
                  <th className={th}>Reduced</th>
                  <th className={th}>CSS</th>
                  <th className={th}>Tailwind</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((v) => (
                  <tr key={v.name} className="border-t border-border-subtle align-top">
                    <td className="px-lg py-md">
                      <TokenBadge name={v.name} />
                      <p className="type-body-xs-regular mt-xs max-w-80 text-text-tertiary">{v.description}</p>
                    </td>
                    {(['Standard', 'Reduced'] as const).map((m) => (
                      <td key={m} className="type-code-sm-regular whitespace-nowrap px-lg py-md text-text-secondary">
                        {v.modes[m]?.value.replace(/^cubic-bezier\((.*)\)$/, '$1')}
                      </td>
                    ))}
                    <td className="type-code-sm-regular whitespace-nowrap px-lg py-md text-text-secondary">var({v.css})</td>
                    <td className="type-code-sm-regular whitespace-nowrap px-lg py-md text-text-brand">{v.tailwind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Region>
        </section>
      ))}
      <section className="flex flex-col gap-lg">
        <AnchorHeading>In code</AnchorHeading>
        <P>Use the recipes for popups and the tokens for transitions. Avoid typing a duration or curve by hand, because Reduced mode only reaches values that come from the tokens.</P>
        <CodeBlock
          label="Motion recipes"
          code={`<div className="motion-enter">…</div>        // menu, tooltip, popover entering: base · enter
<div className="motion-enter-slow">…</div>   // dialog, drawer entering: slow · enter
<div className="motion-exit">…</div>         // anything leaving: fast · exit
<div className="motion-fade-in">…</div>      // content swapping in place

// Changing in place: a transition built from the tokens.
<button className="transition-colors duration-(--motion-duration-fast) ease-standard">…</button>

// Popups keep their exit: render while mounted, animate out while closing.
const { mounted, closing } = usePresence(open);
{mounted && <div className={closing ? 'motion-exit' : 'motion-enter'} data-side={side}>…</div>}

// Reduced motion for one subtree (the OS setting applies everywhere automatically).
<section data-motion="reduced">…</section>`}
        />
      </section>
    </div>
  );
}

/* ---------- Guidelines ---------- */
const FILES = ['Q3 report.pdf', 'Team photos', 'Backups 2026', 'Design files'];

function RowList({ animated, removed }: { animated: boolean; removed: boolean }) {
  return (
    <ul className="flex w-full flex-col rounded-surface border border-border-subtle bg-surface-raised" aria-label={animated ? 'Files, with motion' : 'Files, without motion'}>
      {FILES.map((f, i) => {
        const gone = removed && i === 1;
        if (!animated && gone) return null;
        return (
          <li
            key={f}
            aria-hidden={gone || undefined}
            className="grid"
            style={
              animated
                ? {
                    gridTemplateRows: gone ? '0fr' : '1fr',
                    opacity: gone ? 0 : 1,
                    transition: `grid-template-rows ${cssVar('motion/duration/base')} ${cssVar('motion/easing/exit')}, opacity ${cssVar('motion/duration/fast')} ${cssVar('motion/easing/exit')}`,
                  }
                : undefined
            }
          >
            <span className="overflow-hidden">
              <span className={cn('flex items-center gap-sm px-lg py-md type-body-sm-regular text-text-primary', i > 0 && 'border-t border-border-subtle')}>
                <Icon name="files/file" size="sm" className="text-icon-secondary" /> {f}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function RemovalDemo() {
  const [removed, setRemoved] = useState(false);
  return (
    <div className="flex w-full flex-col gap-lg">
      <div className="self-start">
        <Button size="sm" emphasis="secondary" leadingIcon={removed ? 'general/refresh' : 'general/trash'} label={removed ? 'Reset' : 'Remove “Team photos”'} onClick={() => setRemoved((r) => !r)} />
      </div>
      <div className="grid gap-xl sm:grid-cols-2">
        <div className="flex flex-col gap-sm">
          <RowList animated removed={removed} />
          <Caption>With motion: the row collapses (base · exit), so the eye follows the gap closing.</Caption>
        </div>
        <div className="flex flex-col gap-sm">
          <RowList animated={false} removed={removed} />
          <Caption>Without motion: the rows jump, and it’s easy to miss what changed.</Caption>
        </div>
      </div>
    </div>
  );
}

function PairingMap() {
  const [on, setOn] = useState(false);
  const rows: [string, string, string][] = [
    ['Button hover', 'motion/duration/fast', 'motion/easing/standard'],
    ['Menu opening', 'motion/duration/base', 'motion/easing/enter'],
    ['Menu closing', 'motion/duration/fast', 'motion/easing/exit'],
    ['Dialog entering', 'motion/duration/slow', 'motion/easing/enter'],
  ];
  const longest = Math.max(...rows.map((r) => ms(r[1])));
  return (
    <div className="flex w-full flex-col gap-lg">
      <div className="self-start">
        <PlayButton on={on} onClick={() => setOn((o) => !o)} />
      </div>
      {rows.map(([label, d, e]) => (
        <div key={label} className="grid items-center gap-sm md:grid-cols-[14rem_minmax(0,1fr)] md:gap-lg">
          <span className="flex flex-col">
            <span className="type-body-sm-semibold text-text-primary">{label}</span>
            <span className="type-code-sm-regular text-text-tertiary">
              {short(d)} {ms(d)} ms · {short(e)}
            </span>
          </span>
          <div className="h-(--size-track-lg) rounded-full bg-fill-neutral-track" style={{ width: `${(ms(d) / longest) * 100}%` }} aria-hidden>
            <div
              className="h-full origin-left rounded-full bg-fill-brand-solid"
              style={{ transform: `scaleX(${on ? 1 : 0})`, transition: `transform ${cssVar(d)} ${cssVar(e)}` }}
            />
          </div>
        </div>
      ))}
      <Caption>Each bar is drawn to its Standard duration. Press Play to run them together.</Caption>
    </div>
  );
}

function PopoverDo() {
  const [n, setN] = useState(0);
  return (
    <div className="flex flex-col items-center gap-md">
      <Button size="sm" emphasis="secondary" label="Open" trailingIcon="arrows/chevron-down" onClick={() => setN((x) => x + 1)} />
      <div key={n} data-side="bottom" className="motion-enter flex w-40 flex-col rounded-control border border-border-subtle bg-surface-overlay p-xs shadow-overlay">
        {['Rename', 'Share'].map((t) => (
          <span key={t} className="rounded-sm px-md py-xs type-body-sm-medium text-text-secondary">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReflowDont() {
  const [narrow, setNarrow] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-md">
      <Button size="sm" emphasis="secondary" label="Resize" onClick={() => setNarrow((x) => !x)} />
      <p
        className="type-body-sm-regular rounded-control border border-border-subtle bg-surface-raised p-md text-text-secondary"
        style={{ width: narrow ? '60%' : '100%', transition: `width ${cssVar('motion/duration/slow')} ${cssVar('motion/easing/standard')}` }}
      >
        Large folders upload in parts so a dropped connection never restarts.
      </p>
    </div>
  );
}

function ReducedCompare() {
  const [reduced, setReduced] = useState(true);
  const [on, setOn] = useState(false);
  return (
    <div className="flex w-full flex-col gap-xl">
      <div className="flex flex-wrap items-center gap-xl">
        <label className="flex items-center gap-md type-body-sm-medium text-text-primary">
          <Switch checked={reduced} onCheckedChange={setReduced} /> Reduced motion
        </label>
        <PlayButton on={on} onClick={() => setOn((o) => !o)} />
      </div>
      <div data-motion={reduced ? 'reduced' : undefined} className="flex flex-col gap-md rounded-surface bg-surface-base p-xl">
        {SAMPLES.map(([label, d, e]) => (
          <div key={label} className="grid items-center gap-sm md:grid-cols-[14rem_minmax(0,1fr)_13rem] md:gap-lg">
            <span className="type-body-sm-medium text-text-primary">{label}</span>
            <Track on={on} duration={d} easing={e} />
            <span className="type-code-sm-regular text-text-secondary">
              {short(d)} · {reduced ? `${ms(d, 'Reduced')} ms, ${reducedAs(d)}` : `${ms(d)} ms`}
            </span>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-xl border-t border-border-subtle pt-lg">
          <Spinner size="md" tone="brand" label="Syncing" />
          <span className="type-code-sm-regular text-text-secondary">
            loop · {reduced ? `${ms('motion/duration/loop', 'Reduced')} ms, ${reducedAs('motion/duration/loop')}` : `${ms('motion/duration/loop')} ms`}
          </span>
          <Switch defaultChecked aria-label="Sync on (comparison)" />
          <Menu type="button-simple" />
        </div>
      </div>
    </div>
  );
}

function AccessibleLoops() {
  const [playing, setPlaying] = useState(true);
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % 3), ms('motion/delay/toast'));
    return () => window.clearInterval(t);
  }, [playing]);
  return (
    <div className="grid w-full gap-xl md:grid-cols-3">
      <div className="flex flex-col items-center gap-md">
        <span className="flex h-20 items-center gap-md">
          <Spinner size="lg" tone="brand" label="Uploading" />
        </span>
        <Caption>A spinner stops when the task ends.</Caption>
      </div>
      <div className="flex flex-col items-center gap-md">
        <span className="flex h-20 items-center gap-md">
          <span className="flex gap-xs" aria-label={`Slide ${slide + 1} of 3`} role="img">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn('h-(--size-track-md) w-8 rounded-full', i === slide ? 'bg-fill-brand-solid' : 'bg-fill-neutral-track')} />
            ))}
          </span>
          <IconButton size="sm" icon={playing ? 'media/pause' : 'media/play'} label={playing ? 'Pause slides' : 'Play slides'} onClick={() => setPlaying((p) => !p)} />
        </span>
        <Caption>Slides that play on their own come with a pause control.</Caption>
      </div>
      <div className="flex flex-col items-center gap-md">
        <span className="flex h-20 items-center">
          <span className="flex items-center gap-sm rounded-control bg-surface-inverse px-lg py-md type-body-sm-medium text-text-inverse shadow-overlay">
            <Icon name="alerts/check-circle" size="sm" className="text-icon-inverse" /> Folder shared
          </span>
        </span>
        <Caption>A toast pauses while it’s hovered or focused (motion/delay/toast = {ms('motion/delay/toast')} ms).</Caption>
      </div>
    </div>
  );
}

const TOPICS: Topic[] = [
  {
    title: 'Motion explains change',
    body: 'Use motion to show what changed and where it went, not to decorate. A menu grows from its trigger, a dialog rises into place, and a removed row collapses so the list closes the gap.\n\nMotion shouldn’t slow anyone down. The result is ready the moment people act, while the transition plays.',
    render: () => <RemovalDemo />,
  },
  {
    title: 'Pick the pairing by purpose',
    body: 'Pick from the pairing table instead of choosing a duration by feel. Use enter for things arriving, exit for things leaving and standard for things changing in place.\n\nExits are faster than entries. Larger or farther movement takes longer, while small feedback like hover and press stays fast.',
    render: () => <PairingMap />,
  },
  {
    title: 'What to animate',
    body: 'Animate opacity, position and scale. Avoid animating text size or the layout of content someone is reading, because the words move while they read. Keep one thing moving at a time in each area of the screen.',
    do: { caption: 'Fade and scale the popover from its trigger. Press Open to replay.', render: () => <PopoverDo /> },
    dont: { caption: 'Animating the container’s width reflows the paragraph. Press Resize to see why.', render: () => <ReflowDont /> },
  },
  {
    title: 'Reduced motion',
    body: 'People can ask their device to reduce motion. In Reduced mode, movement becomes an instant change or a short fade. Base and slow drop to 0, fast stays for fades, and spinners keep turning at half speed because they show that something is happening. Motion never carries information on its own.\n\nTurn Reduced motion on and off below, then press Play to compare. The switch sets data-motion="reduced" on the demo, the same attribute a product can set on any part of a page.',
    render: () => <ReducedCompare />,
  },
  {
    title: 'Motion accessibility',
    body: 'No transition flashes more than three times per second, because faster flashing can trigger seizures.\n\nGive anything that loops a way to pause or stop it. Progress indicators are the exception, since they end when the task ends.\n\nMessages that dismiss themselves (motion/delay/toast) pause while hovered or focused. Important messages stay until someone closes them.',
    render: () => <AccessibleLoops />,
  },
];

export default function Motion() {
  return (
    <DocPage
      eyebrow="Foundations › 1.6 Motion"
      title="Motion"
      description="Motion explains change: what arrived, what left, what synced. It stays quick and calm, and Reduced mode swaps movement for instant changes and short fades."
      figmaNode={pageMeta['1.6'].figmaNode}
      tabs={[
        { label: 'Overview', render: () => <Overview /> },
        { label: 'Tokens', render: () => <Tokens /> },
        { label: 'Guidelines', render: () => <Topics items={TOPICS} /> },
      ]}
    />
  );
}

