import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/cn';
import { Icon } from '@/icons';
import { Kbd } from '@/components/parts/Kbd';
import { tokens } from '@/tokens/tokens.gen';
import { usePresence } from '@/lib/motion';
import { componentDocs, levelLabel, slugOf, staticPages } from './registry';
import { pageMeta } from './meta';

/**
 * Site search: titles, summaries, aliases ("dropdown" → Select), section headings, props and
 * tokens. Built once from the doc modules; no server.
 */
interface Entry {
  kind: 'page' | 'component' | 'token';
  title: string;
  id?: string;
  group: string;
  to: string;
  /** Searchable fields, strongest first. */
  fields: { text: string; weight: number; label?: string }[];
  hint?: string;
}

function buildIndex(): Entry[] {
  const out: Entry[] = [];
  for (const p of staticPages) {
    const m = pageMeta[p.id];
    out.push({
      kind: 'page',
      id: p.id,
      title: p.name,
      group: levelLabel[p.group],
      to: `/${p.group}/${slugOf(p.id, p.name)}`,
      fields: [{ text: p.name, weight: 100 }, ...(m?.aliases ?? []).map((a) => ({ text: a, weight: 70, label: `also called “${a}”` }))],
    });
  }
  for (const d of componentDocs) {
    const m = pageMeta[d.id];
    const to = `/${d.level}/${slugOf(d.id, d.name)}`;
    out.push({
      kind: 'component',
      id: d.id,
      title: d.name,
      group: levelLabel[d.level],
      to,
      hint: d.summary,
      fields: [
        { text: d.name, weight: 100 },
        ...d.exports.map((e) => ({ text: e, weight: 90, label: `export ${e}` })),
        ...(m?.aliases ?? []).map((a) => ({ text: a, weight: 70, label: `also called “${a}”` })),
        { text: d.summary, weight: 30 },
        ...d.guidelines.map((g) => ({ text: g.title, weight: 40, label: `Guidelines › ${g.title}` })),
        ...d.examples.map((e) => ({ text: e.title, weight: 35, label: `Example › ${e.title}` })),
        ...d.props.map((p) => ({ text: `${p.name} ${p.figma ?? ''}`, weight: 25, label: `prop ${p.name}` })),
        ...d.guidelines.map((g) => ({ text: g.body, weight: 10, label: `Guidelines › ${g.title}` })),
      ],
    });
  }
  for (const v of tokens.variables) {
    out.push({
      kind: 'token',
      title: v.name,
      group: `Token · ${v.collection}`,
      to: `/guidance/02-tokens?tab=reference&q=${encodeURIComponent(v.name)}`,
      hint: [v.css, v.tailwind].filter(Boolean).join(' · '),
      fields: [
        { text: v.name, weight: 60 },
        { text: `${v.css} ${v.tailwind ?? ''}`, weight: 50 },
      ],
    });
  }
  return out;
}

function search(index: Entry[], q: string) {
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits: { e: Entry; score: number; why?: string }[] = [];
  for (const e of index) {
    let score = 0;
    let why: string | undefined;
    let all = true;
    for (const w of words) {
      let best = 0;
      let bestLabel: string | undefined;
      for (const f of e.fields) {
        const t = f.text.toLowerCase();
        const i = t.indexOf(w);
        if (i < 0) continue;
        const s = f.weight * (t === w ? 1.5 : i === 0 ? 1.2 : 1);
        if (s > best) {
          best = s;
          bestLabel = f.label;
        }
      }
      if (!best) {
        all = false;
        break;
      }
      score += best;
      why ??= bestLabel;
    }
    if (all) hits.push({ e, score: e.kind === 'token' ? score * 0.8 : score, why });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 30);
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const index = useMemo(buildIndex, []);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => search(index, q), [index, q]);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const list = useId();
  const presence = usePresence(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    setQ('');
    setActive(0);
    const t = setTimeout(() => input.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      // Focus returns to whatever opened search.
      prev?.focus?.();
    };
  }, [open]);
  useEffect(() => {
    setActive(0);
  }, [q]);
  useEffect(() => {
    document.getElementById(`${list}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, list]);

  const go = (i: number) => {
    const r = results[i];
    if (!r) return;
    onClose();
    navigate(r.e.to);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      // Focus stays in the dialog: the input is its only stop.
      e.preventDefault();
    }
  };

  if (!presence.mounted) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-lg pt-[10vh]" inert={presence.closing || undefined}>
      <div className={cn('absolute inset-0 bg-overlay-scrim', presence.closing ? 'motion-exit' : 'motion-fade-in')} onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the design system"
        data-side="below"
        className={cn('relative flex max-h-[70vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-modal border border-border-subtle bg-surface-raised shadow-modal', presence.closing ? 'motion-exit' : 'motion-enter-slow')}
      >
        <div className="flex items-center gap-md border-b border-border-subtle px-lg">
          <Icon name="general/search" className="text-icon-tertiary" />
          <input
            ref={input}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={list}
            aria-activedescendant={results.length ? `${list}-${active}` : undefined}
            aria-autocomplete="list"
            aria-label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search components, guidance and tokens"
            className="type-body-md-regular h-14 min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-placeholder"
          />
          <Kbd size="sm" text="Esc" />
        </div>
        <div id={list} role="listbox" aria-label="Results" className="overflow-y-auto p-sm">
          {q && results.length === 0 && (
            <p className="type-body-sm-regular px-md py-2xl text-center text-text-tertiary" role="status">
              No results for “{q}”. Try a different word, like “dropdown” or “toggle”, or a token name.
            </p>
          )}
          {!q && <p className="type-body-sm-regular px-md py-xl text-text-tertiary">Type a component name or whatever you’d call it (“dropdown”, “toggle”, “chip”). You can also search guideline topics, props and tokens.</p>}
          {results.map((r, i) => (
            <div
              key={`${r.e.kind}-${r.e.to}`}
              id={`${list}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(i)}
              className={cn('flex cursor-pointer items-start gap-md rounded-control px-md py-sm', i === active && 'bg-fill-neutral-subtle-hover')}
            >
              <Icon name={r.e.kind === 'token' ? 'editor/palette' : r.e.kind === 'page' ? 'files/file-text' : 'layout/layout-grid'} size="sm" className="mt-xxs shrink-0 text-icon-tertiary" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-baseline gap-sm">
                  <span className={cn('truncate text-text-primary', r.e.kind === 'token' ? 'type-code-sm-medium' : 'type-body-sm-semibold')}>{r.e.title}</span>
                  <span className="type-body-xs-regular shrink-0 text-text-tertiary">{r.e.group}</span>
                </span>
                {(r.why || r.e.hint) && <span className="type-body-xs-regular truncate text-text-secondary">{r.why ?? r.e.hint}</span>}
              </div>
              {i === active && <Icon name="arrows/corner-down-left" size="sm" className="mt-xxs shrink-0 text-icon-tertiary" />}
            </div>
          ))}
        </div>
        <div className="type-body-xs-regular flex items-center gap-lg border-t border-border-subtle px-lg py-sm text-text-tertiary">
          <span className="inline-flex items-center gap-xs">
            <Kbd size="sm" text="↑" /> <Kbd size="sm" text="↓" /> to move
          </span>
          <span className="inline-flex items-center gap-xs">
            <Kbd size="sm" text="Enter" /> to open
          </span>
          {results.length > 0 && <span className="ml-auto" role="status">{results.length} {results.length === 1 ? 'result' : 'results'}</span>}
        </div>
      </div>
    </div>
  );
}
