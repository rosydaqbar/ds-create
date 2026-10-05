import { tokens } from '@/tokens/tokens.gen';
import { PageHeader } from '../../ComponentPage';
import { Section, TokenTable } from '../../blocks';

const sample: Record<string, string> = {
  display: 'Everything in one place',
  heading: 'Shared folders and team access',
  body: 'Text sets the rhythm of the interface; every style is bound to typography tokens.',
  code: 'npm run tokens',
};

export default function Typography() {
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.2 Typography" title="Typography" description="Every text style is a utility class with the same name as the Figma style: type/body/md/regular → type-body-md-regular." />
      <Section title="Type scale">
        <div className="flex flex-col divide-y divide-border-subtle rounded-surface border border-border-subtle">
          {tokens.textStyles.map((t) => {
            const role = t.name.split('/')[1];
            return (
              <div key={t.name} className="grid gap-md p-xl md:grid-cols-[260px_1fr]">
                <div className="flex flex-col gap-xxs">
                  <span className="type-code-sm-medium text-text-brand">.{t.className}</span>
                  <span className="type-code-sm-regular text-text-tertiary">
                    {t.fontSize} / {t.lineHeight} · {t.fontWeight} · {t.letterSpacing}
                  </span>
                </div>
                <p className={`${t.className} min-w-0 truncate text-text-primary`}>{sample[role] ?? sample.body}</p>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Typography tokens">
        <TokenTable names={tokens.variables.filter((v) => v.collection === 'Typography').map((v) => v.name)} />
      </Section>
    </article>
  );
}
