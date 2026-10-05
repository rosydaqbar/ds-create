import { useState } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { PageHeader } from '../../ComponentPage';
import { CodeBlock, Section, TokenTable } from '../../blocks';
import { Button } from '@/components/parts/Button';
import { Switch } from '@/components/parts/Switch';
import { Checkbox } from '@/components/parts/Checkbox';
import { Select } from '@/components/components/Select';
import { Menu } from '@/components/components/Menu';
import { Tooltip } from '@/components/parts/Tooltip';

const durations = tokens.variables.filter((v) => v.name.startsWith('motion/duration/') && !v.name.endsWith('loop'));
const easings = tokens.variables.filter((v) => v.name.startsWith('motion/easing/'));

const PAIRINGS = [
  ['Hover, press, colour change', 'fast · standard', 'transition-… duration-(--motion-duration-fast) ease-standard', 'Every control'],
  ['Switch thumb, checkbox mark, radio dot', 'base · standard', 'transition-… duration-(--motion-duration-base) ease-standard', 'Switch, Checkbox, Radio, Progress'],
  ['Menu, tooltip, popover entering', 'base · enter', 'motion-enter', 'Select, Menu, Context menu, submenus, Tooltip, floating toolbar'],
  ['Dialog, drawer entering', 'slow · enter', 'motion-enter-slow', 'Navigation drawer'],
  ['Anything leaving', 'fast · exit', 'motion-exit + usePresence()', 'Select, Menu, Context menu, Tooltip, floating toolbar'],
  ['Spinner rotation', 'loop · linear', 'animate-spin duration-(--motion-duration-loop)', 'Spinner, loading buttons'],
];

export default function Motion() {
  const [on, setOn] = useState(false);
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.6 Motion" title="Motion" description="Durations and easings by purpose. The Reduced mode (prefers-reduced-motion, or data-motion=&quot;reduced&quot;) removes movement and keeps short fades." />
      <Section title="Try it">
        <button type="button" onClick={() => setOn((o) => !o)} className="type-body-sm-semibold h-(--size-control-md) w-fit cursor-pointer rounded-control bg-fill-brand-solid px-xl text-text-on-solid">
          {on ? 'Reset' : 'Play'}
        </button>
        <div className="flex flex-col gap-md">
          {durations.flatMap((d) =>
            easings.slice(0, 3).map((e) => (
              <div key={d.name + e.name} className="grid items-center gap-lg md:grid-cols-[320px_1fr]">
                <span className="type-code-sm-regular text-text-secondary">
                  {d.name.split('/')[2]} · {e.name.split('/')[2]}
                </span>
                <div className="relative h-6 rounded-full bg-surface-sunken">
                  <div className="absolute top-0 size-6 rounded-full bg-fill-brand-solid" style={{ left: on ? 'calc(100% - 1.5rem)' : 0, transition: `left var(${d.css}) var(${e.css})` }} />
                </div>
              </div>
            )),
          )}
        </div>
      </Section>
      <Section title="Pairings in code" description="Each pairing is a utility or a transition built from the motion tokens, so the Reduced mode applies everywhere without extra code.">
        <div className="overflow-x-auto rounded-surface border border-border-subtle">
          <table className="w-full text-left">
            <thead className="bg-surface-sunken">
              <tr className="type-body-xs-semibold text-text-tertiary">
                <th className="px-lg py-md">Purpose</th>
                <th className="px-lg py-md">Tokens</th>
                <th className="px-lg py-md">In code</th>
                <th className="px-lg py-md">Used by</th>
              </tr>
            </thead>
            <tbody>
              {PAIRINGS.map(([a, b, c, d]) => (
                <tr key={a} className="border-t border-border-subtle align-top">
                  <td className="type-body-sm-medium px-lg py-md text-text-primary">{a}</td>
                  <td className="type-code-sm-regular px-lg py-md text-text-secondary">{b}</td>
                  <td className="type-code-sm-regular px-lg py-md text-text-brand">{c}</td>
                  <td className="type-body-sm-regular px-lg py-md text-text-secondary">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <CodeBlock
          code={`<div className="motion-enter">…</div>        // menu, tooltip, popover entering: base · enter
<div className="motion-enter-slow">…</div>   // dialog, drawer entering: slow · enter
<div className="motion-exit">…</div>         // anything leaving: fast · exit
<div className="motion-fade-in">…</div>      // content swapping in place

// Popups keep their exit: render while mounted, animate out while closing.
const { mounted, closing } = usePresence(open);
{mounted && <div className={closing ? 'motion-exit' : 'motion-enter'} data-side={side}>…</div>}`}
        />
      </Section>
      <Section title="Motion tokens">
        <TokenTable names={tokens.variables.filter((v) => v.collection === 'Motion').map((v) => v.name)} />
      </Section>
    </article>
  );
}
