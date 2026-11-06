import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { config } from '@/ds.config';
import { componentDocs, levelLabel, slugOf, staticPages } from './registry';
import { ComponentPage } from './ComponentPage';
import { Home } from './pages/Home';
import { SearchDialog } from './Search';
import { pageMeta } from './meta';
import { Kbd } from '@/components/parts/Kbd';

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

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const groups: { label: string; items: { id: string; name: string; to: string }[] }[] = [
    { label: levelLabel.guidance, items: staticPages.filter((p) => p.group === 'guidance').map((p) => ({ id: p.id, name: p.name, to: `/guidance/${slugOf(p.id, p.name)}` })) },
    { label: levelLabel.foundations, items: staticPages.filter((p) => p.group === 'foundations').map((p) => ({ id: p.id, name: p.name, to: `/foundations/${slugOf(p.id, p.name)}` })) },
    ...(['parts', 'components', 'sections', 'layouts', 'screens'] as const).map((lv) => ({
      label: levelLabel[lv],
      items: componentDocs.filter((d) => d.level === lv).map((d) => ({ id: d.id, name: d.name, to: `/${lv}/${slugOf(d.id, d.name)}` })),
    })),
  ];
  return (
    <nav className="flex flex-col gap-xl" aria-label="Design system">
      {groups.map((g) => {
        const items = g.items;
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
                <span className="min-w-0 flex-1 truncate">{i.name}</span>
                {pageMeta[i.id]?.status === 'beta' && <span className="type-body-xs-medium rounded-indicator bg-fill-warning-subtle px-sm text-text-warning">Beta</span>}
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
        Go to the home page
      </Link>
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const loc = useLocation();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearching(true);
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable)) {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const logo = useMemo(() => (theme === 'dark' ? config.logo.dark : config.logo.light), [theme]);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
        className="type-body-sm-semibold fixed top-sm left-sm z-60 -translate-y-[200%] rounded-control bg-surface-raised px-lg py-sm text-text-primary shadow-overlay outline-none focus:translate-y-0 focus-visible:shadow-focus-default"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-md border-b border-border-subtle bg-surface-base/90 px-lg backdrop-blur md:gap-lg md:px-xl">
        <button type="button" className="cursor-pointer rounded-control p-xs text-icon-secondary outline-none is-hover:bg-fill-neutral-subtle-hover is-focus:shadow-focus-default lg:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'general/x' : 'general/menu'} />
        </button>
        <Link to="/" className="flex min-w-0 items-center gap-md rounded-control outline-none is-focus:shadow-focus-default" aria-label={`${config.name} home`}>
          <img src={logo} alt="" className="h-6 md:h-7" />
          <span className="type-code-sm-regular hidden rounded-indicator bg-surface-sunken px-md py-xxs text-text-tertiary sm:inline">v{config.version}</span>
        </Link>
        <div className="ml-auto flex items-center gap-sm md:gap-md">
          <button
            type="button"
            onClick={() => setSearching(true)}
            aria-label="Search"
            aria-keyshortcuts="Meta+K Control+K /"
            className="type-body-sm-regular inline-flex h-(--size-control-sm) cursor-pointer items-center gap-sm rounded-control border border-border-default bg-surface-base px-sm text-text-placeholder outline-none is-hover:bg-surface-base-hover is-focus:shadow-focus-default md:w-64 md:px-md"
          >
            <Icon name="general/search" size="sm" className="text-icon-tertiary" />
            <span className="hidden flex-1 text-left md:inline">Search</span>
            <span className="hidden md:inline-flex md:gap-xxs">
              <Kbd size="sm" text={isMac ? '⌘' : 'Ctrl'} />
              <Kbd size="sm" text="K" />
            </span>
          </button>
          {config.figmaUrl && (
            <a href={config.figmaUrl} target="_blank" rel="noreferrer" className="type-body-sm-medium hidden rounded-control px-xs text-text-secondary outline-none is-hover:text-text-primary is-focus:shadow-focus-default sm:inline">
              Figma<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex h-(--size-control-sm) cursor-pointer items-center gap-sm rounded-control border border-border-default px-sm type-body-sm-medium text-text-secondary is-hover:bg-surface-base-hover is-focus:shadow-focus-default outline-none md:px-md"
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            <Icon name={theme === 'dark' ? 'weather/sun' : 'weather/moon'} size="sm" />
            <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          aria-label="Site navigation"
          className={cn('fixed inset-y-16 left-0 z-20 w-72 shrink-0 overflow-y-auto border-r border-border-subtle bg-surface-base p-lg lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)]', open ? 'block motion-enter-slow lg:animate-none' : 'hidden')}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>
        <main ref={main} id="main" tabIndex={-1} className="min-w-0 flex-1 px-lg py-3xl outline-none md:px-xl md:py-4xl lg:px-6xl">
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
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}
