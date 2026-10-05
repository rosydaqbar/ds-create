import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { config } from '@/ds.config';
import { componentDocs, levelLabel, slugOf, staticPages } from './registry';
import { ComponentPage } from './ComponentPage';
import { Home } from './pages/Home';

const lazyPages = new Map<string, ComponentType>(staticPages.map((p) => [slugOf(p.id, p.name), lazy(p.load)]));

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('ds-theme') as 'light' | 'dark') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ds-theme', theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

function Sidebar({ filter, onNavigate }: { filter: string; onNavigate: () => void }) {
  const q = filter.trim().toLowerCase();
  const match = (id: string, name: string) => !q || `${id} ${name}`.toLowerCase().includes(q);
  const groups: { label: string; items: { id: string; name: string; to: string }[] }[] = [
    { label: levelLabel.guidance, items: staticPages.filter((p) => p.group === 'guidance').map((p) => ({ id: p.id, name: p.name, to: `/guidance/${slugOf(p.id, p.name)}` })) },
    { label: levelLabel.foundations, items: staticPages.filter((p) => p.group === 'foundations').map((p) => ({ id: p.id, name: p.name, to: `/foundations/${slugOf(p.id, p.name)}` })) },
    ...(['parts', 'components', 'sections'] as const).map((lv) => ({
      label: levelLabel[lv],
      items: componentDocs.filter((d) => d.level === lv).map((d) => ({ id: d.id, name: d.name, to: `/${lv}/${slugOf(d.id, d.name)}` })),
    })),
  ];
  return (
    <nav className="flex flex-col gap-xl" aria-label="Design system">
      {groups.map((g) => {
        const items = g.items.filter((i) => match(i.id, i.name));
        if (!items.length) return null;
        return (
          <div key={g.label} className="flex flex-col gap-xxs">
            <span className="type-body-xs-semibold px-md pb-xs uppercase tracking-wide text-text-tertiary">{g.label}</span>
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'type-body-sm-medium flex items-center gap-md rounded-sm px-md py-xs transition-colors duration-(--motion-duration-fast)',
                    isActive ? 'bg-fill-brand-subtle text-text-brand' : 'text-text-secondary is-hover:bg-fill-neutral-subtle-hover is-hover:text-text-primary',
                  )
                }
              >
                <span className="type-code-sm-regular w-8 shrink-0 text-text-tertiary">{i.id}</span>
                {i.name}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

function StaticRoute() {
  const { slug = '' } = useParams();
  const Page = lazyPages.get(slug);
  if (!Page) return <NotFound />;
  return (
    <Suspense fallback={<p className="type-body-sm-regular text-text-tertiary">Loading…</p>}>
      <Page />
    </Suspense>
  );
}
function ComponentRoute() {
  const { slug = '' } = useParams();
  const doc = componentDocs.find((d) => slugOf(d.id, d.name) === slug);
  if (!doc) return <NotFound />;
  return <ComponentPage key={doc.id} doc={doc} />;
}
function NotFound() {
  return (
    <div className="flex flex-col gap-md">
      <h1 className="type-heading-lg-semibold">Page not found</h1>
      <Link className="type-body-md-medium text-text-brand" to="/">
        Back to the overview
      </Link>
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useTheme();
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  const logo = useMemo(() => (theme === 'dark' ? config.logo.dark : config.logo.light), [theme]);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-lg border-b border-border-subtle bg-surface-base/90 px-xl backdrop-blur">
        <button type="button" className="cursor-pointer rounded-control p-xs text-icon-secondary is-hover:bg-fill-neutral-subtle-hover lg:hidden" aria-label="Open navigation" onClick={() => setOpen((o) => !o)}>
          <Icon name="general/menu" />
        </button>
        <Link to="/" className="flex items-center gap-md">
          <img src={logo} alt={config.name} className="h-7" />
          <span className="type-code-sm-regular rounded-indicator bg-surface-sunken px-md py-xxs text-text-tertiary">v{config.version}</span>
        </Link>
        <div className="ml-auto flex items-center gap-md">
          <div className="relative hidden md:block">
            <Icon name="general/search" size="sm" className="pointer-events-none absolute top-1/2 left-md -translate-y-1/2 text-icon-placeholder" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter pages"
              className="type-body-sm-regular h-(--size-control-sm) w-56 rounded-control border border-border-default bg-surface-base pr-md pl-4xl text-text-primary placeholder:text-text-placeholder outline-none focus-visible:shadow-focus-default"
            />
          </div>
          {config.figmaUrl && (
            <a href={config.figmaUrl} target="_blank" rel="noreferrer" className="type-body-sm-medium text-text-secondary is-hover:text-text-primary">
              Figma
            </a>
          )}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex h-(--size-control-sm) cursor-pointer items-center gap-sm rounded-control border border-border-default px-md type-body-sm-medium text-text-secondary is-hover:bg-surface-base-hover is-focus:shadow-focus-default outline-none"
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            <Icon name={theme === 'dark' ? 'weather/sun' : 'weather/moon'} size="sm" />
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside className={cn('fixed inset-y-16 left-0 z-20 w-72 shrink-0 overflow-y-auto border-r border-border-subtle bg-surface-base p-lg lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)]', open ? 'block motion-enter-slow lg:animate-none' : 'hidden')}>
          <div className="mb-lg md:hidden">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter pages" className="type-body-sm-regular h-(--size-control-sm) w-full rounded-control border border-border-default bg-surface-base px-md" />
          </div>
          <Sidebar filter={filter} onNavigate={() => setOpen(false)} />
        </aside>
        <main className="min-w-0 flex-1 px-xl py-4xl lg:px-6xl">
          {/* 1.6 Motion: content swaps in place with a short fade. */}
          <div key={loc.pathname} className="motion-fade-in">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/guidance/:slug" element={<StaticRoute />} />
            <Route path="/foundations/:slug" element={<StaticRoute />} />
            <Route path="/:level/:slug" element={<ComponentRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
