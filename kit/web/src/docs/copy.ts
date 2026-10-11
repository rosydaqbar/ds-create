import type { ComponentDoc, Guideline } from './types';
import data from './copy.gen.json';
import { createElement, Fragment, type ReactNode } from 'react';

/**
 * The page copy files (workflow/COPY.md), parsed by `npm run copy` into copy.gen.json.
 * `withCopy` lays a page's `both` and `web` lines over its story: the story keeps the visuals and
 * code, and the copy file owns the sentences. A page without a copy file keeps the story's text.
 */
interface Line {
  surface: 'both' | 'figma' | 'web';
  role: '' | 'caption' | 'item' | 'do' | "don't";
  text: string;
}
interface Item {
  title: string;
  figma: string;
  web: string;
  lines: Line[];
}
export interface Section {
  name: string;
  figma: string;
  web: string;
  lines: Line[];
  items: Item[];
}
export interface PageCopy {
  id: string;
  page: string;
  figma: string;
  web: string;
  sections: Section[];
}

const pages: Record<string, PageCopy> = ((data as { pages?: Record<string, PageCopy> }).pages ?? {}) as Record<string, PageCopy>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** The site's text for one role: shared and web lines, in file order. */
const webText = (lines: Line[], role: Line['role']) => lines.filter((l) => l.surface !== 'figma' && l.role === role).map((l) => l.text);
const combine = (renders: (() => ReactNode)[]) => renders.length < 2 ? renders[0] : () => renders.map((render, i) => createElement(Fragment, { key: i }, render()));

/** A page's copy, by page id (`2.1`, `01`). */
export const copyOf = (id: string): PageCopy | undefined => pages[id];

/** Locate authored reading content independently of its page category or frame. */
export function readingTopic(id: string, title: string): Item | undefined {
  return copyOf(id)?.sections.flatMap((s) => s.items).find((i) => norm(i.title) === norm(title) || i.web.split(';').some((old) => norm(old) === norm(title)));
}

/** Explicit ownership for a reading section that contains several authored topics. */
export function readingSection(id: string, title: string): Section | undefined {
  return copyOf(id)?.sections.find((s) => s.web === 'narrative' && norm(s.name) === norm(title));
}

export function withCopy(doc: ComponentDoc): ComponentDoc {
  const c = pages[doc.id];
  if (!c) return doc;
  const section = (name: string) => c.sections.find((s) => s.name === name);
  const item = (s: Section | undefined, title: string) => s?.items.find((i) => norm(i.title) === norm(title) || i.web.split(';').some((old) => norm(old) === norm(title)));
  const out: ComponentDoc = { ...doc };

  const summary = section('Summary');
  const summaryText = summary ? webText(summary.lines, '') : [];
  if (summaryText.length) out.summary = summaryText.join(' ');

  // A list only Figma has leaves the story's list alone.
  const useText = webText(section('When to use')?.lines ?? [], 'item');
  const dontText = webText(section('When not to use')?.lines ?? [], 'item');
  if (useText.length || dontText.length) {
    out.whenToUse = {
      use: useText.length ? useText : (doc.whenToUse?.use ?? []),
      dont: dontText.length ? dontText : (doc.whenToUse?.dont ?? []),
    };
  }

  const gl = section('Guidelines');
  if (gl) {
    const merged: Guideline[] = doc.guidelines.map((g) => {
      const it = item(gl, g.title);
      if (!it) return g;
      const body = webText(it.lines, '');
      const doCap = webText(it.lines, 'do')[0];
      const dontCap = webText(it.lines, "don't")[0];
      return {
        ...g,
        body: body.length ? body.join('\n\n') : g.body,
        do: g.do && doCap ? { ...g.do, caption: doCap } : g.do,
        dont: g.dont && dontCap ? { ...g.dont, caption: dontCap } : g.dont,
      };
    });
    // Explicit replacement lets the writer consolidate/reorder topics without stale prose.
    // Unmarked legacy sections retain the original append/merge behavior.
    if (gl.web === 'replace') {
      out.guidelines = gl.items.map((it) => {
        const oldTitles = it.web.split(';').map((s) => s.trim()).filter(Boolean);
        const matches = doc.guidelines.filter((g) => norm(g.title) === norm(it.title) || oldTitles.some((t) => norm(t) === norm(g.title)));
        const original = matches[0];
        const doVisual = matches.find((g) => g.do)?.do;
        const dontVisual = matches.find((g) => g.dont)?.dont;
        return {
          ...original,
          title: it.title,
          aliases: [...new Set([...matches.flatMap((g) => g.aliases ?? []), ...oldTitles.filter((t) => norm(t) !== norm(it.title)).map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))])],
          body: webText(it.lines, '').join('\n\n'),
          render: combine(matches.flatMap((g) => g.render ? [g.render] : [])),
          do: webText(it.lines, 'do')[0] ? { ...doVisual, caption: webText(it.lines, 'do')[0] } : undefined,
          dont: webText(it.lines, "don't")[0] ? { ...dontVisual, caption: webText(it.lines, "don't")[0] } : undefined,
        };
      });
      if (doc.app?.visuals) out.app = { ...doc.app, visuals: Object.fromEntries(gl.items.map((it) => {
        const matches = [...new Set([it.title, ...it.web.split(';').map((s) => s.trim())])].flatMap((title) => doc.app!.visuals![title] ? [doc.app!.visuals![title]] : []);
        return [it.title, { render: combine(matches.flatMap((v) => v.render ? [v.render] : [])), do: combine(matches.flatMap((v) => v.do ? [v.do] : [])), dont: combine(matches.flatMap((v) => v.dont ? [v.dont] : [])) }];
      })) };
    } else {
      for (const it of gl.items) {
        if (merged.some((g) => norm(g.title) === norm(it.title))) continue;
        const body = webText(it.lines, '');
        if (body.length) merged.push({ title: it.title, body: body.join('\n\n') });
      }
      out.guidelines = merged;
    }
  }

  const a11y = section('Accessibility');
  if (a11y && webText(a11y.lines, 'item').length) out.accessibility = webText(a11y.lines, 'item');

  const properties = section('Properties');
  if (properties) out.props = doc.props.map((prop) => {
    const authored = item(properties, prop.name);
    const description = authored ? webText(authored.lines, '').join('\n\n') : '';
    return description ? { ...prop, description } : prop;
  });

  const ex = section('Examples');
  const captionOf = (title: string) => {
    const it = item(ex, title);
    return it ? (webText(it.lines, 'caption')[0] ?? webText(it.lines, '')[0]) : undefined;
  };
  if (ex) out.examples = doc.examples.map((e) => ({ ...e, caption: captionOf(e.title) ?? e.caption }));

  const anat = section('Anatomy');
  if (anat) out.anatomy = { ...doc.anatomy, parts: doc.anatomy.parts.map((p) => ({ ...p, description: webText(item(anat, p.name)?.lines ?? [], '').join(' ') || p.description })) };

  if (doc.app) {
    const apps = section('In apps');
    const notes = apps ? webText(apps.lines, 'item') : [];
    out.app = {
      ...(out.app ?? doc.app),
      examples: ex ? doc.app.examples.map((e) => ({ ...e, caption: captionOf(e.title) ?? e.caption })) : doc.app.examples,
      notes: notes.length ? notes : doc.app.notes,
    };
  }
  return out;
}

/** Optional authored foundation header; legacy pages keep their computed description. */
export function copySummary(id: string, fallback: string): string {
  const summary = copyOf(id)?.sections.find((s) => s.name === 'Summary');
  return summary ? webText(summary.lines, '').join(' ') || fallback : fallback;
}
