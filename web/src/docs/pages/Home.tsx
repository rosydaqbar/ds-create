import { Link } from 'react-router';
import { config } from '@/ds.config';
import { Icon } from '@/icons';
import { tokens } from '@/tokens/tokens.gen';
import { componentDocs, levelLabel, slugOf, staticPages } from '../registry';

export function Home() {
  const levels = [
    { key: 'foundations', items: staticPages.filter((p) => p.group === 'foundations').map((p) => ({ id: p.id, name: p.name, to: `/foundations/${slugOf(p.id, p.name)}` })) },
    ...(['parts', 'components', 'sections'] as const).map((lv) => ({ key: lv, items: componentDocs.filter((d) => d.level === lv).map((d) => ({ id: d.id, name: d.name, to: `/${lv}/${slugOf(d.id, d.name)}` })) })),
  ];
  return (
    <div className="flex flex-col gap-5xl">
      <section className="flex flex-col gap-xl rounded-modal bg-surface-brand-solid p-5xl text-text-primary-on-brand">
        <span className="type-body-sm-semibold text-text-secondary-on-brand">v{config.version} · Light & Dark · Tailwind ready</span>
        <h1 className="type-display-md-semibold max-w-[48rem]">{config.name}</h1>
        <p className="type-body-lg-regular max-w-[42rem] text-text-secondary-on-brand">{config.description}</p>
        <div className="flex flex-wrap gap-md">
          <Link to="/guidance/01-getting-started" className="type-body-md-semibold inline-flex h-(--size-control-lg) items-center gap-sm rounded-control bg-surface-base px-xl text-text-primary is-hover:bg-surface-base-hover">
            Get started <Icon name="arrows/arrow-right" />
          </Link>
          <Link to="/guidance/02-tokens" className="type-body-md-semibold inline-flex h-(--size-control-lg) items-center gap-sm rounded-control border border-border-subtle/40 px-xl text-text-primary-on-brand is-hover:bg-fill-brand-solid-hover">
            Tokens
          </Link>
        </div>
      </section>
      <section className="grid gap-xl sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Variables', tokens.variables.length],
          ['Text styles', tokens.textStyles.length],
          ['Effect styles', tokens.effectStyles.length],
          ['Components', componentDocs.length],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-xs rounded-surface border border-border-subtle p-2xl">
            <span className="type-display-sm-semibold text-text-primary">{v}</span>
            <span className="type-body-sm-medium text-text-tertiary">{k}</span>
          </div>
        ))}
      </section>
      {levels.map((l) => (
        <section key={l.key} className="flex flex-col gap-lg">
          <h2 className="type-heading-md-semibold">{levelLabel[l.key as keyof typeof levelLabel]}</h2>
          <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {l.items.map((i) => (
              <Link key={i.to} to={i.to} className="group flex items-center gap-md rounded-surface border border-border-subtle bg-surface-raised p-lg shadow-raised transition-colors duration-(--motion-duration-fast) is-hover:border-border-brand">
                <span className="type-code-sm-regular rounded-sm bg-fill-brand-subtle px-sm py-xxs text-text-brand">{i.id}</span>
                <span className="type-body-md-semibold text-text-primary">{i.name}</span>
                <Icon name="arrows/chevron-right" size="sm" className="ml-auto text-icon-tertiary" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
