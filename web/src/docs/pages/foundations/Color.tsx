import { tokens } from '@/tokens/tokens.gen';
import { PageHeader } from '../../ComponentPage';
import { Section, TokenTable } from '../../blocks';

const pal = tokens.variables.filter((v) => v.name.startsWith('palette/'));
const families = [...new Set(pal.map((v) => v.name.split('/')[1]))];
const groups = ['color/text', 'color/icon', 'color/border', 'color/surface', 'color/fill', 'color/category', 'color/overlay', 'color/shadow'];

export default function Color() {
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.1 Color" title="Color" description="Primitive palettes hold the raw colours; semantic roles say what each colour is for and change with the colour mode. Components only use roles." />
      <Section title="Palettes" description="Primitives (palette/*) are never used directly in components.">
        <div className="flex flex-col gap-lg">
          {families.map((f) => {
            const steps = pal.filter((v) => v.name.split('/')[1] === f);
            return (
              <div key={f} className="grid items-center gap-lg md:grid-cols-[140px_1fr]">
                <span className="type-code-sm-medium text-text-primary">palette/{f}</span>
                <div className="grid gap-xs" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                  {steps.map((s) => {
                    const val = Object.values(s.modes)[0].value;
                    return (
                      <div key={s.name} className="flex flex-col gap-xxs">
                        <div className="h-12 rounded-sm border border-border-subtle" style={{ background: val, backgroundImage: val.length === 9 ? undefined : undefined }} title={s.css} />
                        <span className="type-code-sm-regular text-text-secondary">{s.name.split('/')[2]}</span>
                        <span className="type-code-sm-regular text-text-tertiary uppercase">{val.replace('#', '')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      {groups.map((g) => (
        <Section key={g} title={g} description="Light and Dark values, the CSS variable and the Tailwind utility.">
          <TokenTable names={tokens.variables.filter((v) => v.name.startsWith(g + '/')).map((v) => v.name)} />
        </Section>
      ))}
    </article>
  );
}
