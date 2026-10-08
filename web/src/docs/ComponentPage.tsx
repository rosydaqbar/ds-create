import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { config } from '@/ds.config';
import { tokens } from '@/tokens/tokens.gen';
import type { AppVisual, ComponentDoc, Guideline, MatrixSpec } from './types';
import { levelLabel } from './registry';
import { figmaNodeFor, pageMeta } from './meta';
import { AnchorHeading, DocTabs, PageHeader, Topics } from './DocPage';
import { AppStage, AppTheme, Bullets, Caption, CodeBlock, ExampleBlock, H3, NoAppVersion, P, Playground, productHasApp, productHasWeb, PropsTable, Segmented, Stage, TokenTable, useScrollRegion } from './blocks';

export { PageHeader } from './DocPage';

const tw = new Map<string, { css: string; tailwind: string | null }>([
  ...tokens.variables.map((v) => [v.name, { css: v.css, tailwind: v.tailwind }] as const),
  ...tokens.effectStyles.map((e) => [e.name, { css: e.css, tailwind: e.tailwind }] as const),
  ...tokens.textStyles.map((t) => [t.name, { css: '', tailwind: t.className }] as const),
]);

/** Section with an anchorable H2 (feeds "On this page" and deep links). */
/** An h2 styled like H3, for the "When to use" boxes when no section heading comes before them. */
function BoxH2({ children }: { children: ReactNode }) {
  return <h2 className="type-heading-xs-semibold text-text-primary">{children}</h2>;
}

function DocSection({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-lg">
      <AnchorHeading>{title}</AnchorHeading>
      {description && <P>{description}</P>}
      {children}
    </section>
  );
}

const axes = (m: MatrixSpec) => [m.rows && `Rows: ${m.rows}`, m.columns && `Columns: ${m.columns}`].filter(Boolean).join(' · ') || undefined;

/** Private parts with an ARIA child role sit inside the matching parent role. */
function Specimen({ m }: { m: MatrixSpec }) {
  // Wide grids scroll inside their own region on small screens.
  const ref = useScrollRegion<HTMLDivElement>(m.title);
  return (
    <div ref={ref} className="relative min-w-0 max-w-full overflow-x-auto rounded-surface outline-none focus-visible:shadow-focus-default">
      {m.specimenRole ? (
        <div role={m.specimenRole} aria-label={`${m.title} specimens`}>
          {m.render()}
        </div>
      ) : (
        m.render()
      )}
    </div>
  );
}

/* ---------- anatomy: numbered markers placed on the live specimen ---------- */
/** React Native content on a docs stage: the app theme, centered like the web stage. */
const appVisual = (render?: () => ReactNode) =>
  render &&
  (() => (
    <AppTheme>
      <div className="flex max-w-full flex-wrap items-center justify-center-safe gap-xl">{render()}</div>
    </AppTheme>
  ));

/** A guideline in App preview: its text, with the React Native visuals (never the web ones). */
function appGuideline(g: Guideline, v?: AppVisual): Guideline {
  return {
    ...g,
    render: appVisual(v?.render),
    do: g.do && { caption: g.do.caption, render: appVisual(v?.do) },
    dont: g.dont && { caption: g.dont.caption, render: appVisual(v?.dont) },
  };
}

function AnatomyDiagram({ doc, specimen = doc.anatomy.render }: { doc: ComponentDoc; specimen?: () => ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<{ n: number; x: number; y: number; ox: number; oy: number; w: number; h: number }[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const parts = doc.anatomy.parts;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const next: typeof marks = [];
      parts.forEach((p, i) => {
        if (!p.target) return;
        const t = el.querySelector(`[data-anatomy="${p.target}"]`);
        if (!t) return;
        const r = t.getBoundingClientRect();
        let x = r.left - base.left;
        let y = r.top - base.top;
        // Parts that share a corner (a root and its first child) would hide each other's
        // number: move a later marker along the element's top edge until it is clear.
        for (let k = 0; k < 8 && next.some((m) => Math.abs(m.x - x) < 22 && Math.abs(m.y - y) < 22); k++) x += 24;
        next.push({ n: i + 1, x, y, ox: r.left - base.left, oy: r.top - base.top, w: r.width, h: r.height });
      });
      setMarks(next);
    };
    measure();
    // Popups in the specimen animate in (1.6 Motion); measure again once they have settled.
    const settle = window.setTimeout(measure, 400);
    el.addEventListener('animationend', measure);
    el.addEventListener('transitionend', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      window.clearTimeout(settle);
      el.removeEventListener('animationend', measure);
      el.removeEventListener('transitionend', measure);
      ro.disconnect();
    };
  }, [parts]);

  return (
    <div className="flex flex-col gap-xl">
      {specimen && (
        <Stage className="min-h-56 overflow-x-auto" padded={false}>
          <div ref={box} className="relative p-5xl">
            {specimen()}
            {marks.map((m) => (
              <span key={m.n} aria-hidden className="pointer-events-none">
                {active === m.n && <span className="absolute z-20 rounded-xs border-2 border-dashed border-border-brand" style={{ left: m.ox - 2, top: m.oy - 2, width: m.w + 4, height: m.h + 4 }} />}
                <span
                  className={cn(
                    'type-body-xs-semibold absolute z-30 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border-brand shadow-raised transition-[scale] duration-(--motion-duration-fast)',
                    active === m.n ? 'scale-125 bg-fill-brand-solid text-text-on-solid' : 'bg-surface-base text-text-brand',
                  )}
                  style={{ left: m.x, top: m.y }}
                >
                  {m.n}
                </span>
              </span>
            ))}
          </div>
        </Stage>
      )}
      <ol className="grid gap-md md:grid-cols-2">
        {parts.map((p, i) => (
          <li
            key={p.name}
            onMouseEnter={() => setActive(i + 1)}
            onMouseLeave={() => setActive(null)}
            className={cn('flex gap-md rounded-surface border p-lg transition-colors duration-(--motion-duration-fast)', active === i + 1 ? 'border-border-brand' : 'border-border-subtle')}
          >
            <span aria-hidden className="type-body-xs-semibold flex size-6 shrink-0 items-center justify-center rounded-full bg-fill-brand-solid text-text-on-solid">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-xxs">
              <span className="type-body-sm-semibold text-text-primary">{p.name}</span>
              <span className="type-body-sm-regular text-text-secondary">{p.description}</span>
              {p.tokens && <span className="type-code-sm-regular break-words text-text-tertiary">{p.tokens.join(' · ')}</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Platform = 'web' | 'app';
type CodePlatform = 'react' | 'reactNative' | 'swift' | 'kotlin';
const CODE_PLATFORMS: { value: CodePlatform; label: string; lang: string; app: boolean }[] = [
  { value: 'react', label: 'React (web)', lang: 'tsx', app: false },
  { value: 'reactNative', label: 'React Native', lang: 'tsx', app: true },
  { value: 'swift', label: 'Swift', lang: 'swift', app: true },
  { value: 'kotlin', label: 'Kotlin', lang: 'kotlin', app: true },
];

/** Install lines for the app packages (workflow/APP.md §2). */
export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  const meta = pageMeta[doc.id];
  const pkg = config.packageName;
  const importLine = `import { ${doc.exports.join(', ')} } from '${pkg}';`;
  const [params, setParams] = useSearchParams();
  // Which version the previews show: 'app' renders the React Native components (react-native-web).
  const platform: Platform = productHasApp && (!productHasWeb || params.get('platform') === 'app') ? 'app' : 'web';
  const setPlatform = (p: Platform) =>
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (p === 'app') n.set('platform', 'app');
      else n.delete('platform');
      return n;
    }, { replace: true });
  const codeOptions = CODE_PLATFORMS.filter((c) => (c.app ? productHasApp : productHasWeb));
  const [codePlatform, setCodePlatform] = useState<CodePlatform>(platform === 'app' ? 'reactNative' : codeOptions[0].value);
  const app = doc.app;

  // With no examples section above (an App product with no app examples), these headings follow the
  // page title directly, so they are h2 to keep the heading order.
  const exampleCount = platform === 'app' ? (app?.examples.length ?? 0) : doc.examples.length;
  const UseHeading = exampleCount > 0 ? H3 : BoxH2;
  const whenToUse = doc.whenToUse && (
    <div className="grid gap-xl md:grid-cols-2">
      {(['use', 'dont'] as const).map((k) => (
        <div key={k} className="flex flex-col gap-md rounded-surface bg-surface-sunken p-2xl">
          <UseHeading>
            <span className="inline-flex items-center gap-sm">
              <Icon name={k === 'use' ? 'alerts/check-circle' : 'alerts/x-circle'} className={k === 'use' ? 'text-icon-success' : 'text-icon-danger'} />
              {k === 'use' ? 'When to use' : 'When not to use'}
            </span>
          </UseHeading>
          <Bullets items={doc.whenToUse![k]} />
        </div>
      ))}
    </div>
  );

  const tabs = [
    {
      label: 'Overview',
      render: () =>
        platform === 'app' ? (
          <div className="flex flex-col gap-4xl">
            {app ? (
              <>
                {/* Right under the page title (h1): the preview's titles start at h2. */}
                <AppStage className="min-h-56 bg-surface-sunken" label={`${doc.name}, app version`} headingLevel={2}>
                  {app.hero()}
                </AppStage>
                {app.examples.length > 0 && (
                  <DocSection title="Examples in use">
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-3xl xl:grid-cols-2">
                      {app.examples.map((e) => (
                        <ExampleBlock key={e.title} title={e.title} caption={e.caption} code={e.code.reactNative} app>
                          {e.render()}
                        </ExampleBlock>
                      ))}
                    </div>
                  </DocSection>
                )}
              </>
            ) : (
              <NoAppVersion />
            )}
            {whenToUse}
          </div>
        ) : (
          <div className="flex flex-col gap-4xl">
            <Stage className="min-h-56 bg-surface-sunken">{doc.hero()}</Stage>
            {doc.examples.length > 0 && (
              <DocSection title="Examples in use">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3xl xl:grid-cols-2">
                  {doc.examples.map((e) => (
                    <ExampleBlock key={e.title} title={e.title} caption={e.caption} code={e.code} full={e.stage === 'full'}>
                      {e.render()}
                    </ExampleBlock>
                  ))}
                </div>
              </DocSection>
            )}
            {whenToUse}
          </div>
        ),
    },
    {
      label: 'Component',
      render: () =>
        platform === 'app' ? (
          <div className="flex flex-col gap-4xl">
            {app?.matrices?.length ? (
              app.matrices.map((m) => (
                <DocSection key={m.title} title={m.title} description={axes(m)}>
                  <AppTheme>
                    <Specimen m={m} />
                  </AppTheme>
                </DocSection>
              ))
            ) : (
              <NoAppVersion />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4xl">
            {doc.playground && (
              <DocSection title="Playground" description="Try the props to see how they combine. Each control shows the code prop name, with the matching Figma property beside it.">
                <Playground {...doc.playground} />
              </DocSection>
            )}
            {doc.matrices.map((m) => (
              <DocSection key={m.title} title={m.title} description={axes(m)}>
                <Specimen m={m} />
              </DocSection>
            ))}
            {doc.privateParts && doc.privateParts.length > 0 && (
              <div className="flex flex-col gap-3xl rounded-surface border border-border-subtle p-2xl">
                <div className="flex flex-col gap-xs">
                  <span className="type-body-xs-semibold uppercase tracking-wide text-text-tertiary">Building blocks</span>
                  <P>The private parts this component is built from, kept in the .Main frame in Figma. They aren’t exported on their own. Change one, and every variant that uses it changes too.</P>
                </div>
                {doc.privateParts.map((m) => (
                  <DocSection key={m.title} title={m.title} description={axes(m)}>
                    <Specimen m={m} />
                  </DocSection>
                ))}
              </div>
            )}
          </div>
        ),
    },
    {
      label: 'Anatomy',
      render: () => (
        <div className="flex flex-col gap-4xl">
          <DocSection title="Anatomy" description="Hover over a part in the list to highlight it on the component.">
            {platform === 'app' ? (
              app?.anatomy ? <AnatomyDiagram doc={doc} specimen={() => <AppTheme>{app.anatomy?.()}</AppTheme>} /> : <NoAppVersion />
            ) : (
              <AnatomyDiagram doc={doc} />
            )}
          </DocSection>
          <DocSection
            title="Properties"
            description={
              productHasApp
                ? 'Use this table to map Figma properties to code props. Names and value syntax can differ across React Native, Swift and Kotlin. Props without a Figma entry are code-specific.'
                : 'Use this table to map Figma properties to code props. Props without a Figma entry are code-specific.'
            }
          >
            <PropsTable props={doc.props} />
          </DocSection>
          <DocSection title="Token map" description="These tokens supply shared values used by the component. Review documented overrides and raw-value exceptions when changing a token.">
            <TokenTable names={doc.tokens} />
          </DocSection>
        </div>
      ),
    },
    {
      label: 'Guidelines',
      render: () => (
        <Topics items={platform === 'app' ? doc.guidelines.map((g) => appGuideline(g, app?.visuals?.[g.title])) : doc.guidelines}>
          {productHasApp && app?.notes && app.notes.length > 0 && (
            <section className="flex flex-col gap-lg">
              <AnchorHeading>In apps</AnchorHeading>
              <P>Review the interaction and accessibility notes for iOS and Android. Verify them in the target app before release.</P>
              <Bullets items={app.notes} />
            </section>
          )}
          {doc.accessibility && (
            <section className="flex flex-col gap-lg">
              <AnchorHeading>Accessibility</AnchorHeading>
              <Bullets items={doc.accessibility} />
            </section>
          )}
        </Topics>
      ),
    },
    {
      label: 'Code',
      render: () => {
        const cp = codeOptions.find((c) => c.value === codePlatform) ?? codeOptions[0];
        const ap = cp.value as Exclude<CodePlatform, 'react'>;
        return (
          <div className="flex max-w-[64rem] flex-col gap-4xl">
            {codeOptions.length > 1 && <Segmented label="Code for" options={codeOptions} value={cp.value} onChange={setCodePlatform} />}
            {cp.value === 'react' ? (
              <>
                <DocSection
                  title="Install"
                  description={
                    <>
                      One package holds the tokens, styles and components. Set it up once per app (see{' '}
                      <Link className="text-text-brand underline underline-offset-2" to="/guidance/01-getting-started?tab=for-developers">
                        Getting started for developers
                      </Link>
                      ), then import what you need.
                    </>
                  }
                >
                  <CodeBlock lang="sh" code={`npm install ${pkg}`} label="Install" />
                  <CodeBlock lang="tsx" code={importLine} label="Import" />
                </DocSection>
                {doc.examples.map((e) => (
                  <DocSection key={e.title} title={e.title}>
                    {e.caption && <Caption>{e.caption}</Caption>}
                    <Stage className="min-h-32">{e.render()}</Stage>
                    <CodeBlock code={e.code} label={e.title} />
                  </DocSection>
                ))}
                <DocSection title="Props" description="Every prop, with its type and default, is listed on the Anatomy tab.">
                  <Link className="type-body-md-semibold inline-flex items-center gap-xs self-start text-text-brand" to={`?tab=anatomy&s=properties`}>
                    See properties <Icon name="arrows/arrow-right" size="sm" />
                  </Link>
                </DocSection>
                <DocSection title="Tailwind" description="This component uses only the system utilities below. Use the same ones to build the layout around it.">
                  <CodeBlock
                    lang="tailwind"
                    label="Tailwind utilities"
                    code={doc.tokens
                      .map((t) => {
                        const m = tw.get(t);
                        return `${(m?.tailwind ?? '—').padEnd(44)} ${t}${m?.css ? `  →  var(${m.css})` : ''}`;
                      })
                      .join('\n')}
                  />
                </DocSection>
              </>
            ) : !app ? (
              <NoAppVersion />
            ) : (
              <>
                <P>Code examples in {cp.label}. The preview uses React Native. Review the platform notes for interaction and accessibility details.</P>
                {app.examples.map((e) => (
                  <DocSection key={e.title} title={e.title}>
                    {e.caption && <Caption>{e.caption}</Caption>}
                    <AppStage className="min-h-32" label={`${e.title}, app version`}>
                      {e.render()}
                    </AppStage>
                    <CodeBlock lang={cp.lang} code={e.code[ap]} label={`${e.title}, ${cp.label}`} />
                  </DocSection>
                ))}
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader
        eyebrow={`${levelLabel[doc.level]} › ${doc.id} ${doc.name}`}
        title={doc.name}
        description={doc.summary}
        status={meta?.status}
        figmaNode={figmaNodeFor(doc.id)}
        meta={
          productHasWeb && productHasApp ? (
            <Segmented
              label="Preview"
              options={[
                { value: 'web', label: 'Web' },
                { value: 'app', label: 'App' },
              ]}
              value={platform}
              onChange={setPlatform}
            />
          ) : undefined
        }
      />
      <DocTabs tabs={tabs} label={`${doc.name} documentation`} />
      <footer className="flex flex-wrap gap-x-xl gap-y-xs border-t border-border-subtle pt-lg type-body-xs-regular text-text-tertiary">
        <span>Since v{meta?.since ?? '1.0'}</span>
        <span>
          Spec: <span className="type-code-sm-regular">{doc.spec}</span>
        </span>
        <span>
          Exports: <span className="type-code-sm-regular">{doc.exports.join(', ')}</span>
        </span>
      </footer>
    </article>
  );
}
