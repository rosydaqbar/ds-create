import { tokens } from '@/tokens/tokens.gen';
import { PageHeader } from '../../ComponentPage';
import { Section, TokenTable } from '../../blocks';

const space = tokens.variables.filter((v) => v.name.startsWith('space/'));
const size = tokens.variables.filter((v) => v.collection === 'Size');

export default function Space() {
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.3 Space & layout" title="Space & layout" description="One spacing scale for gaps and padding, and size roles for controls, icons, avatars, widths and the reading measure." />
      <Section title="Spacing scale" description="Tailwind: p-{step}, gap-{step}, m-{step}.">
        <div className="flex flex-col gap-sm">
          {space.map((s) => (
            <div key={s.name} className="grid items-center gap-lg md:grid-cols-[160px_80px_1fr]">
              <span className="type-code-sm-medium text-text-primary">{s.name}</span>
              <span className="type-code-sm-regular text-text-tertiary">{Object.values(s.modes)[0].value}</span>
              <div className="h-4 rounded-xs bg-fill-brand-solid" style={{ width: `var(${s.css})` }} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Size roles">
        <TokenTable names={size.map((s) => s.name)} />
      </Section>
      <Section title="Grids" description="Breakpoint grids from the Figma grid styles.">
        <div className="grid gap-lg md:grid-cols-2">
          {tokens.gridStyles.map((g) => (
            <div key={g.name} className="flex flex-col gap-sm rounded-surface border border-border-subtle p-lg">
              <span className="type-code-sm-medium text-text-primary">{g.name}</span>
              {g.grids.map((x, i) => (
                <div key={i} className="flex flex-col gap-xs">
                  <div className="flex h-16 rounded-xs bg-surface-sunken" style={{ gap: 4, padding: `0 ${Math.min(x.margin, 24)}px` }}>
                    {Array.from({ length: x.count }).map((_, k) => (
                      <div key={k} className="flex-1 bg-fill-brand-subtle" />
                    ))}
                  </div>
                  <span className="type-code-sm-regular text-text-tertiary">
                    {x.count} columns · gutter {x.gutter} · margin {x.margin}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>
    </article>
  );
}
