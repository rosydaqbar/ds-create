import { copySummary } from '../copy';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageTools } from '../DocPage';
import { config } from '@/ds.config';
import { Icon, type IconName } from '@/icons';
import { componentDocs, levelLabel, slugOf, staticPages } from '../registry';
import { pageMeta, StatusPill } from '../meta';
import { releases } from '../changelog';
import { AppTheme, productHasWeb } from '../blocks';
import { modesLabel, supportedModes } from '../modes';

const foundationBlurb: Record<string, { icon: IconName; text: string }> = {
  '1.1': { icon: 'editor/palette', text: `Palettes, color roles and contrast in ${supportedModes.join(' and ')}.` },
  '1.2': { icon: 'editor/type', text: 'Typefaces, the type scale and how to build hierarchy.' },
  '1.3': { icon: 'layout/layout-grid', text: 'The spacing scale, sizes, grids and reading width.' },
  '1.4': { icon: 'shapes/square', text: 'Corner radius and border widths.' },
  '1.5': { icon: 'general/layers', text: 'Surfaces, shadows and focus rings.' },
  '1.6': { icon: 'general/zap', text: 'Durations, easings and when things move.' },
  '1.7': { icon: 'shapes/star', text: 'The icon set, its sizes and color roles.' },
  '1.8': { icon: 'images/image', text: 'Logo, mark, flags and partner logos.' },
};

const roles: { title: string; text: string; to: string; icon: IconName }[] = [
  { title: 'Designers', text: 'Set up the Figma library and find components and variables.', to: '/guidance/01-getting-started?tab=for-designers', icon: 'editor/palette' },
  {
    title: 'Developers',
    text: productHasWeb
      ? 'Install the package and connect Figma properties to code.'
      : 'Find app code examples and Figma property mappings.',
    to: '/guidance/01-getting-started?tab=for-developers',
    icon: 'development/code',
  },
  { title: 'Product', text: 'Check component readiness and release status.', to: '/guidance/03-changelog?tab=status', icon: 'charts/chart-column' },
];

/** Levels whose app previews are whole screens. */
const wholeScreen = (lv: string) => lv === 'layouts' || lv === 'screens';

export function Home() {
  const latest = releases[0];
  const panelRef = useRef<HTMLElement>(null);
  const [params] = useSearchParams();
  const section = params.get('s');
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView({ block: 'start' });
  }, [section]);

  return (
    <div className="docs-reading-layout">
      <article ref={panelRef} className="docs-reading-card docs-home" aria-labelledby="home-title">
        <header className="docs-home-hero docs-home-section">
          <div className="flex min-w-0 flex-col items-start gap-xl">
            <h1 id="home-title" className="type-display-sm-semibold">{config.name}</h1>
            <p className="type-body-lg-regular max-w-[42rem] text-text-secondary">{copySummary('00', config.description)}</p>
            <div className="flex flex-wrap items-center gap-md">
              <Link to="/guidance/01-getting-started" className="docs-home-primary type-body-md-semibold inline-flex min-h-(--size-control-lg) items-center gap-sm rounded-control px-xl py-sm outline-none is-focus:shadow-focus-default">
                Get started <Icon name="arrows/arrow-right" />
              </Link>
              <Link to="/guidance/03-changelog" className="docs-home-link type-body-sm-semibold inline-flex items-center gap-sm px-md py-sm text-text-secondary">
                Changelog <Icon name="arrows/arrow-right" size="sm" />
              </Link>
            </div>
            <p className="type-body-sm-regular text-text-secondary">
              Library v{config.version} · {modesLabel} · {productHasWeb ? 'Figma and React' : 'Figma and app code'}
            </p>
          </div>
          <nav className="docs-home-start" aria-labelledby="start">
            <h2 id="start" className="type-heading-xs-semibold scroll-mt-36">Start here</h2>
            {roles.map((r) => (
              <Link key={r.title} to={r.to} className="docs-home-entry docs-home-link">
                <Icon name={r.icon} size="sm" className="mt-xxs text-icon-secondary" />
                <span className="flex min-w-0 flex-col gap-xs">
                  <span className="type-body-md-semibold text-text-primary">{r.title}</span>
                  <span className="type-body-sm-regular text-text-secondary">{r.text}</span>
                </span>
                <Icon name="arrows/arrow-right" size="sm" className="mt-xxs text-icon-secondary" />
              </Link>
            ))}
          </nav>
        </header>

        <section className="docs-home-section flex flex-col gap-xl" aria-labelledby="foundations">
          <h2 id="foundations" className="type-heading-md-semibold scroll-mt-36">
            {levelLabel.foundations}
          </h2>
          <div className="docs-home-foundations">
            {staticPages
              .filter((p) => p.group === 'foundations')
              .map((p) => (
                <Link key={p.id} to={`/foundations/${slugOf(p.id, p.name)}`} className="docs-home-entry docs-home-link">
                  <Icon name={foundationBlurb[p.id]?.icon ?? 'general/placeholder'} size="sm" className="mt-xxs text-icon-secondary" />
                  <span className="flex min-w-0 flex-col gap-xs">
                    <span className="type-body-md-semibold text-text-primary">{p.name}</span>
                    <span className="type-body-sm-regular text-text-secondary">{foundationBlurb[p.id]?.text ?? p.name}</span>
                  </span>
                  <Icon name="arrows/arrow-right" size="sm" className="mt-xxs text-icon-secondary" />
                </Link>
              ))}
          </div>
        </section>

        {(['parts', 'components', 'sections', 'layouts', 'screens'] as const).filter((lv) => componentDocs.some((d) => d.level === lv)).map((lv) => (
          <section key={lv} className="docs-home-section flex flex-col gap-xl" aria-labelledby={`lv-${lv}`}>
            <h2 id={`lv-${lv}`} className="type-heading-md-semibold scroll-mt-36">
              {levelLabel[lv]}
            </h2>
            <div className="grid gap-lg sm:grid-cols-2 xl:grid-cols-3">
              {componentDocs
                .filter((d) => d.level === lv)
                .map((d) => (
                  <div key={d.id} className="group relative flex flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-raised transition-colors duration-(--motion-duration-fast) has-[a:hover]:border-border-brand has-[a:focus-visible]:shadow-focus-default">
                    {/* Live thumbnail of the hero instance; inert so it is never focused or announced. */}
                    {/* App products show the React Native hero; whole screens (Layouts, Screens) are scaled to fit from the top. */}
                    <span aria-hidden inert className={`pointer-events-none flex h-28 justify-center overflow-hidden bg-surface-sunken ${!productHasWeb && wholeScreen(lv) ? 'items-start' : 'items-center'}`}>
                      <span className={`flex w-[30rem] shrink-0 items-center justify-center ${!productHasWeb && wholeScreen(lv) ? 'origin-top scale-[0.3]' : 'origin-center scale-[0.6]'}`}>
                        {productHasWeb ? d.hero() : d.app ? <AppTheme>{d.app.hero()}</AppTheme> : null}
                      </span>
                    </span>
                    <span className="flex flex-col gap-xs p-lg">
                      <span className="flex items-center gap-sm">
                        {/* The title link covers the whole card. */}
                        <Link to={`/${lv}/${slugOf(d.id, d.name)}`} className="type-body-md-semibold text-text-primary outline-none after:absolute after:inset-0 after:content-['']">
                          {d.name}
                        </Link>
                        {pageMeta[d.id]?.status === 'beta' && <StatusPill status="beta" />}
                      </span>
                      <span className="type-body-sm-regular line-clamp-2 text-text-secondary">{d.summary}</span>
                    </span>
                  </div>
                ))}
            </div>
          </section>
        ))}
        {latest && (
          <section className="docs-home-section flex flex-col gap-xl" aria-labelledby="release-notes">
            <div className="flex flex-wrap items-baseline justify-between gap-md">
              <h2 id="release-notes" className="type-heading-md-semibold scroll-mt-36">Release notes</h2>
              <Link to="/guidance/03-changelog" className="docs-home-link type-body-sm-semibold inline-flex items-center gap-sm text-text-secondary">
                Full changelog <Icon name="arrows/arrow-right" size="sm" />
              </Link>
            </div>
            <div className="docs-home-release">
              <div className="flex flex-col gap-sm">
                <p className="type-body-sm-regular text-text-secondary">Latest documented release · <time dateTime={latest.date}>{latest.date}</time></p>
                <h3 className="type-heading-sm-semibold">Version {latest.version}</h3>
                <p className="type-body-md-regular text-text-secondary">{latest.summary}</p>
              </div>
              {latest.items.length > 0 && (
                <ul className="docs-home-release-items type-body-sm-regular text-text-secondary">
                  {latest.items.slice(0, 3).map((item, i) => <li key={i}>{item.text}</li>)}
                </ul>
              )}
            </div>
          </section>
        )}
      </article>
      <PageTools panel={panelRef} deps="home" />
    </div>
  );
}
