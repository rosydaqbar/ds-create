import { useState } from 'react';
import { Icon, iconNames } from '@/icons';
import { PageHeader } from '../../ComponentPage';
import { CodeBlock, Section } from '../../blocks';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export default function Iconography() {
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState('');
  const list = iconNames.filter((n) => n.includes(q.toLowerCase()));
  const cats = [...new Set(list.map((n) => n.split('/')[0]))];
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.7 Iconography" title="Iconography" description="One icon library behind one registry. Names match the Figma components (Icon/general/check → general/check); sizes follow size/icon/*." />
      <Section title="Usage">
        <CodeBlock code={`import { Icon } from '@/icons';

<Icon name="general/check" size="md" className="text-icon-success" />
<Icon name="alerts/info-circle" label="Information" />  // meaningful: has an accessible name`} />
        <div className="flex items-end gap-2xl">
          {sizes.map((s) => (
            <div key={s} className="flex flex-col items-center gap-xs">
              <Icon name="general/settings" size={s} className="text-icon-primary" />
              <span className="type-code-sm-regular text-text-tertiary">{s}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title={`Library (${iconNames.length})`} description="Click an icon to copy its name.">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons" className="type-body-sm-regular h-(--size-control-sm) w-72 rounded-control border border-border-default bg-surface-base px-md text-text-primary" />
        {cats.map((c) => (
          <div key={c} className="flex flex-col gap-md">
            <span className="type-body-sm-semibold capitalize text-text-primary">{c}</span>
            <div className="grid grid-cols-2 gap-sm sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {list
                .filter((n) => n.startsWith(c + '/'))
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(n).catch(() => {});
                      setCopied(n);
                    }}
                    className="flex cursor-pointer flex-col items-center gap-sm rounded-surface border border-border-subtle p-lg is-hover:bg-surface-base-hover"
                  >
                    <Icon name={n} size="lg" className="text-icon-primary" />
                    <span className="type-code-sm-regular w-full truncate text-center text-text-tertiary">{copied === n ? 'Copied' : n.split('/')[1]}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </Section>
    </article>
  );
}
