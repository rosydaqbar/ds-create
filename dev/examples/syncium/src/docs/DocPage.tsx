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
    <header className="flex flex-col gap-md rounded-surface bg-surface-sunken p-2xl md:p-4xl dark:bg-surface-raised">
      <span className="type-body-sm-medium text-text-brand">{eyebrow}</span>
      <div className="flex flex-wrap items-center gap-md">
        <h1 className="type-display-sm-semibold text-text-primary">{title}</h1>
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

export function DocTabs({ tabs, label }: { tabs: DocTab[]; label: string }) {
  const [params, setParams] = useSearchParams();
  const key = (t: DocTab) => slugify(t.label);
  const current = tabs.find((t) => key(t) === params.get('tab')) ?? tabs[0];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const idBase = slugify(label);

  const select = (t: DocTab, focus = false) => {
    setParams(t === tabs[0] ? {} : { tab: key(t) }, { replace: true });
    if (focus) refs.current[tabs.indexOf(t)]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.indexOf(current);
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    select(tabs[next], true);
  };

  // Deep link to a section: ?s=<heading id>
  const section = params.get('s');
  useEffect(() => {
    if (!section) return;
    const t = setTimeout(() => document.getElementById(section)?.scrollIntoView({ block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [section, current]);

  return (
    <>
      <div className="relative sticky top-16 z-10 -mt-xl bg-surface-base">
        <div role="tablist" aria-label={label} onKeyDown={onKey} className="flex gap-xs overflow-x-auto border-b border-border-subtle pt-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  'type-body-sm-semibold -mb-px shrink-0 cursor-pointer border-b-2 px-lg py-md outline-none transition-colors duration-(--motion-duration-fast) is-focus:rounded-t-control is-focus:shadow-focus-default',
                  on ? 'border-border-brand text-text-brand' : 'border-transparent text-text-tertiary is-hover:text-text-primary',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {/* Edge fade on small screens: shows the row scrolls. */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-surface-base md:hidden" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4xl xl:grid-cols-[minmax(0,1fr)_200px]">
        <div
          key={current.label}
          ref={panelRef}
          id={`${idBase}-panel`}
          role="tabpanel"
          aria-labelledby={`${idBase}-tab-${key(current)}`}
          className="motion-fade-in min-w-0"
        >
          {current.render()}
        </div>
        <OnThisPage panel={panelRef} deps={current.label} />
      </div>
    </>
  );
}

/** "On this page": the panel's H2s, on wide screens. */
function OnThisPage({ panel, deps }: { panel: React.RefObject<HTMLDivElement | null>; deps: string }) {
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  const [, setParams] = useSearchParams();
  useEffect(() => {
    const read = () =>
      setItems(
        [...(panel.current?.querySelectorAll('h2[id]') ?? [])].map((h) => ({ id: h.id, text: h.getAttribute('data-title') ?? h.textContent ?? '' })),
      );
    read();
    const mo = new MutationObserver(read);
    if (panel.current) mo.observe(panel.current, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [panel, deps]);
  if (items.length < 3) return <div className="hidden xl:block" />;
  return (
    <nav aria-label="On this page" className="sticky top-36 hidden max-h-[calc(100vh-10rem)] self-start overflow-y-auto xl:flex xl:flex-col xl:gap-xs">
      <span className="type-body-xs-semibold pb-xs uppercase tracking-wide text-text-tertiary">On this page</span>
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
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow={eyebrow} title={title} description={description} status={status} figmaNode={figmaNode} meta={meta} />
      <DocTabs tabs={tabs} label={`${title} documentation`} />
    </article>
  );
}

/* ---------- guideline topics (same layout as component Guidelines) ---------- */
export function Topics({ items, children }: { items: Topic[]; children?: ReactNode }) {
  return (
    <div className="flex max-w-[64rem] flex-col gap-4xl">
      {items.map((g) => (
        <section key={g.title} className="flex flex-col gap-lg border-b border-border-subtle pb-4xl last:border-b-0">
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
