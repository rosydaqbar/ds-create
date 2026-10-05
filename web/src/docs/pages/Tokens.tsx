import { useMemo, useState } from 'react';
import { tokens } from '@/tokens/tokens.gen';
import { PageHeader } from '../ComponentPage';
import { CodeBlock, Section, TokenTable } from '../blocks';

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

export default function Tokens() {
  const [q, setQ] = useState('');
  const [col, setCol] = useState('Color');
  const list = useMemo(() => tokens.variables.filter((v) => v.collection === col && (!q || v.name.includes(q.toLowerCase()))).map((v) => v.name), [q, col]);
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Guidance › 02 Tokens" title="Tokens" description="One name per value, from Figma variable to CSS custom property to Tailwind utility. Primitives hold raw values; components use semantic roles." />
      <Section title="Collections" description="The same collections as the Figma file.">
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          {tokens.collections.map((c) => (
            <button key={c.name} type="button" onClick={() => setCol(c.name)} className={`flex cursor-pointer flex-col gap-xxs rounded-surface border p-lg text-left ${col === c.name ? 'border-border-brand bg-fill-brand-subtle' : 'border-border-subtle is-hover:bg-surface-base-hover'}`}>
              <span className="type-body-md-semibold text-text-primary">{c.name}</span>
              <span className="type-body-xs-regular text-text-tertiary">
                {tokens.variables.filter((v) => v.collection === c.name).length} variables · {c.modes.join(', ')}
              </span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="From Figma to code" description="Slashes become dashes. Colour, space, radius, font, shadow and easing tokens are Tailwind theme keys; everything else is used through arbitrary values.">
        <div className="overflow-x-auto rounded-surface border border-border-subtle">
          <table className="w-full text-left">
            <thead className="bg-surface-sunken">
              <tr className="type-body-xs-semibold text-text-tertiary">
                <th className="px-lg py-md">Figma</th>
                <th className="px-lg py-md">CSS</th>
                <th className="px-lg py-md">Tailwind</th>
              </tr>
            </thead>
            <tbody>
              {MAP.map(([a, b, c]) => (
                <tr key={a} className="border-t border-border-subtle">
                  <td className="type-code-sm-regular px-lg py-md text-text-primary">{a}</td>
                  <td className="type-code-sm-regular px-lg py-md text-text-secondary">{b}</td>
                  <td className="type-code-sm-regular px-lg py-md text-text-brand">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock lang="css" code={`/* Light values live on :root, Dark values on [data-theme="dark"]. Colours resolve to primitives
   so any element can switch mode. */
:root { --color-text-primary: var(--palette-neutral-900); }
[data-theme="dark"] { --color-text-primary: var(--palette-neutral-50); }`} />
      </Section>
      <Section title={`${col} variables`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name" className="type-body-sm-regular h-(--size-control-sm) w-72 rounded-control border border-border-default bg-surface-base px-md text-text-primary" />
        <TokenTable names={list} />
      </Section>
    </article>
  );
}
