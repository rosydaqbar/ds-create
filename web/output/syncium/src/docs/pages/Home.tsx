import { Link } from 'react-router';
import { config } from '@/ds.config';
import { Icon, type IconName } from '@/icons';
import { componentDocs, levelLabel, slugOf, staticPages } from '../registry';
import { pageMeta, StatusPill } from '../meta';
import { releases } from '../changelog';

const foundationBlurb: Record<string, { icon: IconName; text: string }> = {
  '1.1': { icon: 'editor/palette', text: 'Palettes, color roles and contrast in Light and Dark.' },
  '1.2': { icon: 'editor/type', text: 'Typefaces, the type scale and how to build hierarchy.' },
  '1.3': { icon: 'layout/layout-grid', text: 'The spacing scale, sizes, grids and reading width.' },
  '1.4': { icon: 'shapes/square', text: 'Corner radius and border widths.' },
  '1.5': { icon: 'general/layers', text: 'Surfaces, shadows and focus rings.' },
  '1.6': { icon: 'general/zap', text: 'Durations, easings and when things move.' },
  '1.7': { icon: 'shapes/star', text: 'The icon set, its sizes and color roles.' },
  '1.8': { icon: 'images/image', text: 'Logo, mark, flags and partner logos.' },
};

const roles: { title: string; text: string; to: string; icon: IconName; cta: string }[] = [
  { title: 'Designers', text: 'Set up the Figma library and learn how its pages, components and variables are organized.', to: '/guidance/01-getting-started?tab=for-designers', icon: 'editor/palette', cta: 'Start designing' },
  { title: 'Developers', text: 'Install the package, add the styles and use components whose props match Figma.', to: '/guidance/01-getting-started?tab=for-developers', icon: 'development/code', cta: 'Start building' },
  { title: 'Product', text: 'See what exists, how ready each piece is and what changed in each release.', to: '/guidance/03-changelog?tab=status', icon: 'charts/chart-column', cta: 'See status' },
];

export function Home() {
  const latest = releases[0];
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-xl rounded-modal bg-surface-brand-solid p-2xl text-text-primary-on-brand md:p-5xl">
        <span className="type-body-sm-semibold text-text-secondary-on-brand">
          v{config.version} · Light & Dark · Figma and React in sync
        </span>
        <h1 className="type-display-md-semibold max-w-[48rem]">{config.name}</h1>
        <p className="type-body-lg-regular max-w-[42rem] text-text-secondary-on-brand">{config.description}</p>
        <div className="flex flex-wrap gap-md">
          <Link to="/guidance/01-getting-started" className="type-body-md-semibold inline-flex h-(--size-control-lg) items-center gap-sm rounded-control bg-surface-base px-xl text-text-primary outline-none is-hover:bg-surface-base-hover is-focus:shadow-focus-default">
            Get started <Icon name="arrows/arrow-right" />
          </Link>
          <Link to={`/guidance/03-changelog`} className="type-body-md-semibold inline-flex h-(--size-control-lg) items-center gap-sm rounded-control border border-border-subtle/40 px-xl text-text-primary-on-brand outline-none is-hover:bg-fill-brand-solid-hover is-focus:shadow-focus-default">
            What’s new in {latest.version}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-lg" aria-labelledby="start">
        <h2 id="start" className="type-heading-md-semibold">
          Start here
        </h2>
        <div className="grid gap-lg md:grid-cols-3">
          {roles.map((r) => (
            <Link key={r.title} to={r.to} className="group flex flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-xl shadow-raised outline-none transition-colors duration-(--motion-duration-fast) is-hover:border-border-brand is-focus:shadow-focus-default">
              <span className="flex size-10 items-center justify-center rounded-control bg-fill-brand-subtle text-icon-brand">
                <Icon name={r.icon} />
              </span>
              <span className="type-heading-xs-semibold text-text-primary">{r.title}</span>
              <span className="type-body-sm-regular flex-1 text-text-secondary">{r.text}</span>
              <span className="type-body-sm-semibold inline-flex items-center gap-xs text-text-brand">
                {r.cta} <Icon name="arrows/arrow-right" size="sm" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-lg" aria-labelledby="new">
        <div className="flex flex-wrap items-baseline justify-between gap-md">
          <h2 id="new" className="type-heading-md-semibold">
            Recently updated
          </h2>
          <Link to="/guidance/03-changelog" className="type-body-sm-semibold text-text-brand">
            Full changelog
          </Link>
        </div>
        <ul className="grid gap-md md:grid-cols-2">
          {latest.items.slice(0, 6).map((it, i) => (
            <li key={i} className="type-body-sm-regular flex gap-md rounded-surface border border-border-subtle p-lg text-text-secondary">
              <Icon name={it.kind === 'fixed' ? 'alerts/check-circle' : it.kind === 'tokens' ? 'editor/palette' : 'general/plus'} size="sm" className="mt-xxs shrink-0 text-icon-brand" />
              <span>{it.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-lg" aria-labelledby="foundations">
        <h2 id="foundations" className="type-heading-md-semibold">
          {levelLabel.foundations}
        </h2>
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          {staticPages
            .filter((p) => p.group === 'foundations')
            .map((p) => (
              <Link key={p.id} to={`/foundations/${slugOf(p.id, p.name)}`} className="flex flex-col gap-sm rounded-surface border border-border-subtle bg-surface-raised p-lg outline-none transition-colors duration-(--motion-duration-fast) is-hover:border-border-brand is-focus:shadow-focus-default">
                <span className="flex items-center gap-sm">
                  <Icon name={foundationBlurb[p.id]?.icon ?? 'general/placeholder'} size="sm" className="text-icon-brand" />
                  <span className="type-body-md-semibold text-text-primary">{p.name}</span>
                </span>
                <span className="type-body-sm-regular text-text-secondary">{foundationBlurb[p.id]?.text}</span>
              </Link>
            ))}
        </div>
      </section>

      {(['parts', 'components', 'sections'] as const).map((lv) => (
        <section key={lv} className="flex flex-col gap-lg" aria-labelledby={`lv-${lv}`}>
          <h2 id={`lv-${lv}`} className="type-heading-md-semibold">
            {levelLabel[lv]}
          </h2>
          <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {componentDocs
              .filter((d) => d.level === lv)
              .map((d) => (
                <div key={d.id} className="group relative flex flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-raised transition-colors duration-(--motion-duration-fast) has-[a:hover]:border-border-brand has-[a:focus-visible]:shadow-focus-default">
                  {/* Live thumbnail of the hero instance; inert so it is never focused or announced. */}
                  <span aria-hidden inert className="pointer-events-none flex h-28 items-center justify-center overflow-hidden bg-surface-sunken">
                    <span className="flex w-[30rem] shrink-0 origin-center scale-[0.6] items-center justify-center">{d.hero()}</span>
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
    </div>
  );
}
