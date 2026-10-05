import { useSearchParams } from 'react-router';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import type { ComponentDoc } from './types';
import { levelLabel } from './registry';
import { tokens } from '@/tokens/tokens.gen';

const tw = new Map<string, { css: string; tailwind: string | null }>([
  ...tokens.variables.map((v) => [v.name, { css: v.css, tailwind: v.tailwind }] as const),
  ...tokens.effectStyles.map((e) => [e.name, { css: e.css, tailwind: e.tailwind }] as const),
  ...tokens.textStyles.map((t) => [t.name, { css: '', tailwind: t.className }] as const),
]);
import { Bullets, Caption, CodeBlock, DoDont, ExampleBlock, H2, H3, P, Playground, PropsTable, Section, Stage, TokenTable } from './blocks';

const TABS = ['Overview', 'Component', 'Anatomy', 'Guidelines', 'Code'] as const;
type Tab = (typeof TABS)[number];

export function PageHeader({ eyebrow, title, description, meta }: { eyebrow: string; title: string; description: string; meta?: ReactNode }) {
  return (
    <header className="flex flex-col gap-md rounded-surface bg-surface-sunken p-4xl">
      <span className="type-body-sm-medium text-text-brand">{eyebrow}</span>
      <h1 className="type-display-sm-semibold text-text-primary">{title}</h1>
      <P className="type-body-lg-regular">{description}</P>
      {meta}
    </header>
  );
}

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.toLowerCase() === params.get('tab')) ?? 'Overview') as Tab;
  const importLine = `import { ${doc.exports.join(', ')} } from '@/components';`;

  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader
        eyebrow={`${levelLabel[doc.level]} › ${doc.id} ${doc.name}`}
        title={doc.name}
        description={doc.summary}
        meta={
          <div className="flex flex-wrap items-center gap-lg pt-xs">
            <span className="type-code-sm-regular inline-flex items-center gap-xs text-text-tertiary">
              <Icon name="files/file-text" size="sm" /> spec: {doc.spec}
            </span>
            <span className="type-code-sm-regular inline-flex items-center gap-xs text-text-tertiary">
              <Icon name="development/code" size="sm" /> {importLine}
            </span>
          </div>
        }
      />

      <div role="tablist" aria-label={`${doc.name} documentation`} className="sticky top-16 z-10 -mt-xl flex gap-xs overflow-x-auto border-b border-border-subtle bg-surface-base pt-md">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setParams(t === 'Overview' ? {} : { tab: t.toLowerCase() }, { replace: true })}
            className={cn(
              'type-body-sm-semibold -mb-px cursor-pointer border-b-2 px-lg py-md outline-none transition-colors duration-(--motion-duration-fast)',
              tab === t ? 'border-border-brand text-text-brand' : 'border-transparent text-text-tertiary is-hover:text-text-primary is-focus:text-text-primary',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div key={tab} role="tabpanel" className="motion-fade-in">
      {tab === 'Overview' && (
        <div className="flex flex-col gap-4xl">
          <Stage className="min-h-56 bg-surface-sunken">{doc.hero()}</Stage>
          {doc.examples.length > 0 && (
            <Section title="Examples in use">
              <div className="grid gap-3xl xl:grid-cols-2">
                {doc.examples.map((e) => (
                  <ExampleBlock key={e.title} title={e.title} caption={e.caption} code={e.code} full={e.stage === 'full'}>
                    {e.render()}
                  </ExampleBlock>
                ))}
              </div>
            </Section>
          )}
          {doc.whenToUse && (
            <div className="grid gap-xl md:grid-cols-2">
              <div className="flex flex-col gap-md rounded-surface bg-surface-sunken p-2xl">
                <H3>
                  <span className="inline-flex items-center gap-sm">
                    <Icon name="alerts/check-circle" className="text-icon-success" /> When to use
                  </span>
                </H3>
                <Bullets items={doc.whenToUse.use} />
              </div>
              <div className="flex flex-col gap-md rounded-surface bg-surface-sunken p-2xl">
                <H3>
                  <span className="inline-flex items-center gap-sm">
                    <Icon name="alerts/x-circle" className="text-icon-danger" /> When not to use
                  </span>
                </H3>
                <Bullets items={doc.whenToUse.dont} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Component' && (
        <div className="flex flex-col gap-4xl">
          {doc.playground && (
            <Section title="Playground" description="Change the properties to see every combination. Property names match the Figma component.">
              <Playground {...doc.playground} />
            </Section>
          )}
          {doc.matrices.map((m) => (
            <Section key={m.title} title={m.title} description={m.rows || m.columns ? [m.rows && `Rows: ${m.rows}`, m.columns && `Columns: ${m.columns}`].filter(Boolean).join(' · ') : undefined}>
              {m.render()}
            </Section>
          ))}
          {doc.privateParts && doc.privateParts.length > 0 && (
            <div className="flex flex-col gap-3xl rounded-surface border border-border-subtle p-2xl">
              <div className="flex flex-col gap-xs">
                <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">.Main · private parts</span>
                <P>Internal building blocks of this component. They are not exported; change them to change every variant.</P>
              </div>
              {doc.privateParts.map((m) => (
                <Section key={m.title} title={m.title} description={[m.rows && `Rows: ${m.rows}`, m.columns && `Columns: ${m.columns}`].filter(Boolean).join(' · ') || undefined}>
                  {m.render()}
                </Section>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Anatomy' && (
        <div className="flex flex-col gap-4xl">
          <Section title="Anatomy">
            {doc.anatomy.render && <Stage className="min-h-48">{doc.anatomy.render()}</Stage>}
            <ol className="grid gap-md md:grid-cols-2">
              {doc.anatomy.parts.map((p, i) => (
                <li key={p.name} className="flex gap-md rounded-surface border border-border-subtle p-lg">
                  <span className="type-body-xs-semibold flex size-6 shrink-0 items-center justify-center rounded-full bg-fill-brand-solid text-text-on-solid">{i + 1}</span>
                  <div className="flex flex-col gap-xxs">
                    <span className="type-body-sm-semibold text-text-primary">{p.name}</span>
                    <span className="type-body-sm-regular text-text-secondary">{p.description}</span>
                    {p.tokens && <span className="type-code-sm-regular text-text-tertiary">{p.tokens.join(' · ')}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
          <Section title="Properties" description="Each prop implements one Figma property; values are spelled the same way.">
            <PropsTable props={doc.props} />
          </Section>
          <Section title="Token map" description="Every value the component uses comes from these tokens. Change the token, not the component.">
            <TokenTable names={doc.tokens} />
          </Section>
        </div>
      )}

      {tab === 'Guidelines' && (
        <div className="flex max-w-[64rem] flex-col gap-4xl">
          {doc.guidelines.map((g) => (
            <section key={g.title} className="flex flex-col gap-lg border-b border-border-subtle pb-4xl last:border-b-0">
              <H2>{g.title}</H2>
              <P>{g.body}</P>
              {g.render && <Stage>{g.render()}</Stage>}
              {(g.do || g.dont) && (
                <div className="grid gap-xl md:grid-cols-2">
                  {g.do && (
                    <DoDont kind="do" caption={g.do.caption}>
                      {g.do.render?.()}
                    </DoDont>
                  )}
                  {g.dont && (
                    <DoDont kind="dont" caption={g.dont.caption}>
                      {g.dont.render?.()}
                    </DoDont>
                  )}
                </div>
              )}
            </section>
          ))}
          {doc.accessibility && (
            <section className="flex flex-col gap-lg">
              <H2>Accessibility</H2>
              <Bullets items={doc.accessibility} />
            </section>
          )}
        </div>
      )}

      {tab === 'Code' && (
        <div className="flex max-w-[64rem] flex-col gap-4xl">
          <Section title="Import">
            <CodeBlock code={importLine} />
          </Section>
          {doc.examples.map((e) => (
            <Section key={e.title} title={e.title}>
              {e.caption && <Caption>{e.caption}</Caption>}
              <CodeBlock code={e.code} />
            </Section>
          ))}
          <Section title="Tailwind" description="Components are built from system utilities only. Use the same utilities to compose layouts around them.">
            <CodeBlock
              lang="tailwind"
              code={doc.tokens
                .map((t) => {
                  const m = tw.get(t);
                  return `${(m?.tailwind ?? '—').padEnd(44)} ${t}${m?.css ? `  →  var(${m.css})` : ''}`;
                })
                .join('\n')}
            />
          </Section>
        </div>
      )}
      </div>
    </article>
  );
}
