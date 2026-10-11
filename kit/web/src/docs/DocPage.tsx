import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { config } from '@/ds.config';
import type { Topic } from './types';
import { DoDont, P, Stage, slugify } from './blocks';
import { StatusPill, type Status } from './meta';

/* ---------- page header ---------- */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  status,
  figmaNode,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  status?: Status;
  /** Figma node id (`6:246`) for the "Open in Figma" button. */
  figmaNode?: string;
}) {
  return (
    <header className="docs-page-header flex flex-col gap-md">
      <span className="type-body-xs-regular text-text-tertiary">{eyebrow}</span>
      <div className="flex flex-wrap items-center gap-md">
        <h1 className="type-heading-xl-semibold text-text-primary">{title}</h1>
        {status && <StatusPill status={status} />}
      </div>
      <P className="type-body-lg-regular">{description}</P>
      {(figmaNode || meta) && (
        <div className="flex flex-wrap items-center gap-md pt-xs">
          {figmaNode && config.figmaUrl && (
            <a
              href={`${config.figmaUrl}?node-id=${figmaNode.replace(':', '-')}`}
              target="_blank"
              rel="noreferrer"
              className="type-body-sm-semibold inline-flex h-(--size-control-sm) items-center gap-sm rounded-control border border-border-default bg-surface-base px-md text-text-primary outline-none is-hover:bg-surface-base-hover is-focus:shadow-focus-default"
            >
              <Icon name="arrows/external-link" size="sm" /> Open in Figma
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          {meta}
        </div>
      )}
    </header>
  );
}

/* ---------- tabs (WAI-ARIA tabs pattern: arrow keys move, Tab enters the panel) ---------- */
export interface DocTab {
  label: string;
  render: () => ReactNode;
}

export function DocTabs({ tabs, label, header, footer }: { tabs: DocTab[]; label: string; header?: ReactNode; footer?: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const key = (t: DocTab) => slugify(t.label);
  const current = tabs.find((t) => key(t) === params.get('tab')) ?? tabs[0];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const idBase = slugify(label);

  const select = (t: DocTab, focus = false) => {
    setParams(t === tabs[0] ? {} : { tab: key(t) }, { replace: true });
    if (focus) {
      const button = refs.current[tabs.indexOf(t)];
      button?.focus({ preventScroll: true });
    }
  };
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.indexOf(current);
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    select(tabs[next], true);
  };

  // Reveal a selected pill in the horizontal track without scrolling the document.
  useEffect(() => {
    const button = refs.current[tabs.indexOf(current)];
    const track = button?.parentElement;
    if (!button || !track) return;
    const item = button.getBoundingClientRect(), viewport = track.getBoundingClientRect();
    track.scrollLeft += item.left < viewport.left ? item.left - viewport.left : item.right > viewport.right ? item.right - viewport.right : 0;
  }, [current]);

  // Deep link to a section: ?s=<heading id>
  const section = params.get('s');
  useEffect(() => {
    if (!section) return;
    const t = setTimeout(() => document.getElementById(section)?.scrollIntoView({ block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [section, current]);

  return (
    <div className="docs-reading-layout">
      <article className="docs-reading-card">
        {header}
        <div className="docs-tab-dock">
          <div role="tablist" aria-label={label} onKeyDown={onKey} className="docs-page-tabs flex gap-xs overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t, i) => {
              const on = t === current;
              return (
                <button
                  key={t.label}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  id={`${idBase}-tab-${key(t)}`}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls={`${idBase}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(t)}
                  className={cn(
                    'type-body-sm-semibold shrink-0 cursor-pointer px-lg py-sm outline-none transition-colors duration-(--motion-duration-fast)',
                    on ? 'text-text-primary' : 'text-text-secondary',
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div
          key={current.label}
          ref={panelRef}
          id={`${idBase}-panel`}
          role="tabpanel"
          aria-labelledby={`${idBase}-tab-${key(current)}`}
          className="docs-panel motion-fade-in min-w-0"
        >
          {current.render()}
        </div>
        {footer && <div className="docs-page-footer">{footer}</div>}
      </article>
      <OnThisPage panel={panelRef} deps={current.label} />
    </div>
  );
}

/** "On this page": the panel's H2s, on wide screens. */
function OnThisPage({ panel, deps }: { panel: React.RefObject<HTMLDivElement | null>; deps: string }) {
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  const [, setParams] = useSearchParams();
  useEffect(() => {
    const read = () =>
      setItems(
        // A guideline can share its title with a page section ("Accessibility"): keep every id unique.
        [...(panel.current?.querySelectorAll('h2[id]') ?? [])].map((h, _i, all) => {
          const same = all.filter((o) => o.id.replace(/-\d+$/, '') === h.id.replace(/-\d+$/, ''));
          if (same.length > 1 && same.indexOf(h) > 0 && !/-\d+$/.test(h.id)) h.id = `${h.id}-${same.indexOf(h) + 1}`;
          return { id: h.id, text: h.getAttribute('data-title') ?? h.textContent ?? '' };
        }),
      );
    read();
    const mo = new MutationObserver(read);
    if (panel.current) mo.observe(panel.current, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [panel, deps]);
  if (items.length < 3) return <div className="hidden 2xl:block" />;
  return (
    <nav aria-label="On this page" className="docs-toc sticky top-24 hidden max-h-[calc(100vh-8rem)] self-start overflow-y-auto 2xl:flex 2xl:flex-col 2xl:gap-xs">
      <span className="type-body-xs-semibold pb-xs text-text-tertiary">On this page</span>
      {items.map((i) => (
        <a
          key={i.id}
          href={`#${i.id}`}
          onClick={(e) => {
            e.preventDefault();
            setParams((p) => {
              const n = new URLSearchParams(p);
              n.set('s', i.id);
              return n;
            }, { replace: true });
            document.getElementById(i.id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }}
          className="type-body-sm-regular rounded-xs py-xxs text-text-secondary outline-none is-hover:text-text-primary is-focus:shadow-focus-default"
        >
          {i.text}
        </a>
      ))}
    </nav>
  );
}

/* ---------- page shell for foundations and guidance ---------- */
export function DocPage({
  eyebrow,
  title,
  description,
  status,
  figmaNode,
  meta,
  tabs,
}: {
  eyebrow: string;
  title: string;
  description: string;
  status?: Status;
  figmaNode?: string;
  meta?: ReactNode;
  tabs: DocTab[];
}) {
  return (
    <DocTabs tabs={tabs} label={`${title} documentation`} header={
      <PageHeader eyebrow={eyebrow} title={title} description={description} status={status} figmaNode={figmaNode} meta={meta} />
    } />
  );
}

/* ---------- guideline topics (same layout as component Guidelines) ---------- */
export function Topics({ items, children, intro }: { items: Topic[]; children?: ReactNode; intro?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4xl">
      {intro}
      {items.map((g) => (
        <section key={g.title} className="docs-section flex flex-col gap-lg">
          {g.aliases?.map((id) => <span key={id} id={id} aria-hidden="true" className="scroll-mt-36" />)}
          <AnchorHeading>{g.title}</AnchorHeading>
          {g.body.split('\n\n').map((para, i) => (
            <P key={i}>{para}</P>
          ))}
          {g.render && <Stage>{g.render()}</Stage>}
          {(g.do || g.dont) && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-xl md:grid-cols-2">
              {g.do && <DoDont kind="do" caption={g.do.caption}>{g.do.render?.()}</DoDont>}
              {g.dont && <DoDont kind="dont" caption={g.dont.caption}>{g.dont.render?.()}</DoDont>}
            </div>
          )}
        </section>
      ))}
      {children}
    </div>
  );
}

/** H2 with a stable id and a copy-link button. */
export function AnchorHeading({ children, id }: { children: string; id?: string }) {
  const hid = id ?? slugify(children);
  const [copied, setCopied] = useState(false);
  const [, setParams] = useSearchParams();
  return (
    <div className="group flex items-center gap-sm">
      <h2 id={hid} data-title={children} className="type-heading-md-semibold scroll-mt-36 text-text-primary">
        {children}
      </h2>
      <button
        type="button"
        aria-label={`Copy link to “${children}”`}
        onClick={() => {
          setParams((p) => {
            const n = new URLSearchParams(p);
            n.set('s', hid);
            return n;
          }, { replace: true });
          setTimeout(() => navigator.clipboard?.writeText(location.href).catch(() => {}), 0);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="inline-flex size-(--size-control-xs) cursor-pointer items-center justify-center rounded-control text-icon-tertiary opacity-0 outline-none transition-opacity duration-(--motion-duration-fast) group-hover:opacity-100 is-focus:opacity-100 is-focus:shadow-focus-default is-hover:text-icon-primary"
      >
        <Icon name={copied ? 'general/check' : 'general/link'} size="sm" />
      </button>
    </div>
  );
}
