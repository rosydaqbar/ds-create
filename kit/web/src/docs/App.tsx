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
import { siteSchemes } from './modes';

const lazyPages = new Map<string, ComponentType>(staticPages.map((p) => [slugOf(p.id, p.name), lazy(p.load)]));

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const first = siteSchemes[0] ?? 'light';
    try {
      const saved = localStorage.getItem('ds-theme');
      if (siteSchemes.includes(saved as 'light' | 'dark')) return saved as 'light' | 'dark';
      const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return siteSchemes.includes(preferred) ? preferred : first;
    } catch {
      return first;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem('ds-theme', theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

function Sidebar({ onNavigate, onSearch }: { onNavigate: () => void; onSearch: () => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const groups: { label: string; items: { id: string; name: string; to: string }[] }[] = [
    { label: levelLabel.guidance, items: staticPages.filter((p) => p.group === 'guidance').map((p) => ({ id: p.id, name: p.name, to: `/guidance/${slugOf(p.id, p.name)}` })) },
    { label: levelLabel.foundations, items: staticPages.filter((p) => p.group === 'foundations').map((p) => ({ id: p.id, name: p.name, to: `/foundations/${slugOf(p.id, p.name)}` })) },
    ...(['parts', 'components', 'sections', 'layouts', 'screens'] as const).map((lv) => ({
      label: levelLabel[lv],
      items: componentDocs.filter((d) => d.level === lv).map((d) => ({ id: d.id, name: d.name, to: `/${lv}/${slugOf(d.id, d.name)}` })),
    })),
  ];
  return (
    <div className="docs-navigation flex h-full flex-col gap-xl">
      <button type="button" onClick={onSearch} aria-keyshortcuts="Meta+K Control+K /" className="docs-search type-body-sm-regular flex items-center gap-sm text-text-secondary" aria-label="Search documentation">
        <Icon name="general/search" size="sm" />
        <span className="flex-1 text-left">Search</span>
        <Kbd size="sm" text="⌘ / Ctrl K" />
      </button>
      <nav className="flex flex-1 flex-col gap-lg" aria-label="Design system">
        {groups.map((g, index) => {
          if (!g.items.length) return null;
          const expanded = !collapsed[g.label];
          return (
            <div key={g.label} className="flex flex-col gap-xs">
              <button type="button" className="docs-nav-group type-body-sm-semibold flex w-full items-center gap-sm text-text-primary" aria-expanded={expanded} aria-controls={`nav-group-${index}`} onClick={() => setCollapsed((c) => ({ ...c, [g.label]: expanded }))}>
                <Icon name={index < 2 ? 'education/book-open' : 'layout/layout-grid'} size="sm" />
                <span className="flex-1 text-left">{g.label}</span>
                <span className="docs-count type-body-xs-regular text-text-secondary">{g.items.length}</span>
                <Icon name={expanded ? 'arrows/chevron-down' : 'arrows/chevron-right'} size="xs" />
              </button>
              <div id={`nav-group-${index}`} hidden={!expanded} className="docs-nav-rail">
                {g.items.map((i) => (
                  <NavLink key={i.to} to={i.to} onClick={onNavigate} className={({ isActive }) => cn('docs-nav-link type-body-sm-regular flex items-center gap-sm text-text-secondary', isActive && 'docs-nav-active text-text-primary')}>
                    <span className="min-w-0 flex-1">{i.name}</span>
                    {pageMeta[i.id]?.status === 'beta' && <span className="type-body-xs-regular text-text-tertiary">Beta</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="docs-nav-footer type-body-xs-regular flex items-center justify-between text-text-secondary">
        <span>{config.name}</span><span>v{config.version}</span>
      </div>
    </div>
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
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearching(true);
      } else if (e.key === 'Escape') {
        if ((document.activeElement as HTMLElement)?.closest('aside')) menuTrigger.current?.focus();
        setOpen(false);
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
    <div className="docs-shell min-h-screen bg-surface-base text-text-primary">
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
      <header className="docs-topbar sticky top-0 z-30 mx-auto flex h-16 max-w-[1680px] items-center gap-md px-lg md:gap-lg md:px-xl">
        <button ref={menuTrigger} type="button" className="cursor-pointer rounded-control p-xs text-icon-secondary outline-none is-hover:bg-fill-neutral-subtle-hover is-focus:shadow-focus-default lg:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'general/x' : 'general/menu'} />
        </button>
        <Link to="/" className="docs-brand flex min-w-0 items-center gap-md outline-none is-focus:shadow-focus-default" aria-label={`${config.name} home`}>
          <img src={logo} alt="" className="h-6 md:h-7" />
          <span className="type-code-sm-regular hidden rounded-indicator bg-surface-sunken px-md py-xxs text-text-tertiary sm:inline">v{config.version}</span>
        </Link>
        {siteSchemes.length > 1 && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex h-(--size-control-sm) cursor-pointer items-center gap-sm rounded-control border border-border-default bg-surface-base px-sm type-body-sm-medium text-text-secondary is-hover:bg-surface-base-hover is-focus:shadow-focus-default outline-none"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            <Icon name={theme === 'dark' ? 'weather/sun' : 'weather/moon'} size="sm" />
            <span className="hidden md:inline lg:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        )}
        <button
          type="button"
          ref={searchTrigger}
          onClick={() => setSearching(true)}
          aria-label="Search"
          aria-keyshortcuts="Meta+K Control+K /"
          className="type-body-sm-regular ml-auto inline-flex h-(--size-control-sm) cursor-pointer items-center gap-sm rounded-control border border-border-default bg-surface-base px-sm text-text-placeholder outline-none is-hover:bg-surface-base-hover is-focus:shadow-focus-default md:w-64 md:px-md lg:hidden"
        >
          <Icon name="general/search" size="sm" className="text-icon-tertiary" />
          <span className="hidden flex-1 text-left md:inline">Search</span>
          <span className="hidden md:inline-flex md:gap-xxs">
            <Kbd size="sm" text={isMac ? '⌘' : 'Ctrl'} />
            <Kbd size="sm" text="K" />
          </span>
        </button>
      </header>
      <div className="mx-auto flex max-w-[1680px]">
        {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 top-16 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
        <aside
          aria-label="Site navigation"
          className={cn('fixed inset-y-16 left-0 z-20 docs-sidebar w-64 shrink-0 overflow-y-auto bg-surface-base lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)]', open ? 'block motion-enter-slow lg:animate-none' : 'hidden')}
        >
          <Sidebar onNavigate={() => setOpen(false)} onSearch={() => { if (open) searchTrigger.current?.focus(); setOpen(false); setSearching(true); }} />
        </aside>
        <main ref={main} id="main" tabIndex={-1} className="docs-main min-w-0 flex-1 outline-none">
          {/* Page panels animate independently so sticky tabs remain above the header. */}
          <div key={loc.pathname}>
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
