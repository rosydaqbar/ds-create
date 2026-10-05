import { tokens } from '@/tokens/tokens.gen';
import { PageHeader } from '../../ComponentPage';
import { Section, TokenTable } from '../../blocks';

const radius = tokens.variables.filter((v) => v.name.startsWith('radius/'));
const border = tokens.variables.filter((v) => v.name.startsWith('border/'));

export default function Shape() {
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.4 Shape" title="Shape" description="Radius is a role, not a number: controls, indicators, surfaces and modals each have their own. Tailwind: rounded-{role}." />
      <Section title="Radius roles">
        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {radius.map((r) => (
            <div key={r.name} className="flex flex-col gap-sm">
              <div className="h-24 border-2 border-border-brand bg-fill-brand-subtle" style={{ borderRadius: `var(${r.css})` }} />
              <span className="type-code-sm-medium text-text-primary">rounded-{r.name.split('/')[1]}</span>
              <span className="type-code-sm-regular text-text-tertiary">{Object.values(r.modes)[0].value}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Border widths">
        <div className="flex flex-wrap gap-xl">
          {border.map((b) => (
            <div key={b.name} className="flex flex-col gap-sm">
              <div className="h-16 w-32 rounded-control border-border-default bg-surface-base" style={{ borderWidth: `var(${b.css})`, borderStyle: 'solid' }} />
              <span className="type-code-sm-medium text-text-primary">{b.name}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Shape tokens">
        <TokenTable names={[...radius, ...border].map((v) => v.name)} />
      </Section>
    </article>
  );
}
