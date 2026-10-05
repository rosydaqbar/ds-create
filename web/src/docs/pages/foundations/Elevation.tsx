import { tokens } from '@/tokens/tokens.gen';
import { PageHeader } from '../../ComponentPage';
import { CodeBlock, Section } from '../../blocks';

export default function Elevation() {
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.5 Elevation" title="Elevation" description="Effect styles become shadow utilities: elevation/raised → shadow-raised, focus/default → shadow-focus-default. Shadow colours are roles, so they adapt to Dark." />
      {['light', 'dark'].map((m) => (
        <Section key={m} title={m === 'light' ? 'Light' : 'Dark'}>
          <div data-theme={m} className="grid gap-2xl rounded-surface bg-surface-sunken p-4xl sm:grid-cols-2 lg:grid-cols-3">
            {tokens.effectStyles.map((e) => (
              <div key={e.name} className="flex h-32 flex-col justify-end rounded-surface bg-surface-raised p-lg" style={{ boxShadow: `var(${e.css})` }}>
                <span className="type-code-sm-medium text-text-primary">{e.tailwind}</span>
                <span className="type-code-sm-regular text-text-tertiary">{e.name}</span>
              </div>
            ))}
          </div>
        </Section>
      ))}
      <Section title="Recipes">
        <CodeBlock lang="css" code={tokens.effectStyles.map((e) => `${e.css}: ${e.light};`).join('\n')} />
      </Section>
    </article>
  );
}
