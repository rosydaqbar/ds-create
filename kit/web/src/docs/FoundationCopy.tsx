import { Children, Fragment, cloneElement, isValidElement, type ReactNode } from 'react';
import { copyOf, readingSection, readingTopic } from './copy';
import { AnchorHeading, Topics } from './DocPage';
import { P, H3, Bullets, Caption, slugify } from './blocks';
import type { Topic } from './types';

const text = (lines: { surface: string; role: string; text: string }[], role = '') => lines.filter((l) => l.surface !== 'figma' && l.role === role).map((l) => l.text);

/** Replace prose only when the existing copy file explicitly owns the narrative.
 * Numeric references, diagrams, palettes, style specimens and token tables stay in their renderers.
 */
export function ReadingNarrative({ id, section: name = 'Overview', fallback, visuals = {} }: { id: string; section?: string; fallback: ReactNode; visuals?: Record<string, ReactNode> }) {
  const section = copyOf(id)?.sections.find((s) => s.name === name && s.web === 'narrative');
  if (!section) return fallback;
  return <Topics intro={<>{text(section.lines).map((p, i) => <P key={i}>{p}</P>)}{text(section.lines, 'item').length > 0 && <Bullets items={text(section.lines, 'item')} />}</>} items={section.items.filter((item) => item.web !== 'reference').map((item) => {
    const list = text(item.lines, 'item'), captions = text(item.lines, 'caption');
    const visual = visuals[item.web];
    return {
      title: item.title, body: text(item.lines).join('\n\n'),
      aliases: item.web.split(';').map((s) => s.trim()).filter(Boolean).map(slugify),
      render: visual || list.length || captions.length ? () => <>{visual}{list.length > 0 && <Bullets items={list} />}{captions.map((c, i) => <Caption key={i}>{c}</Caption>)}</> : undefined,
      do: text(item.lines, 'do')[0] ? { caption: text(item.lines, 'do')[0] } : undefined,
      dont: text(item.lines, "don't")[0] ? { caption: text(item.lines, "don't")[0] } : undefined,
    };
  })} />;
}

interface ReferenceTopic {
  title: string;
  body: ReactNode;
  visual?: ReactNode;
  render?: () => ReactNode;
  caption?: string;
  do?: { caption: string; render?: () => ReactNode };
  dont?: { caption: string; render?: () => ReactNode };
}

/** Keep matched visuals and prior anchors when the writer edits the topic organization. */
export function ReadingGuidelines({ id, items, fallback }: { id: string; items: ReferenceTopic[]; fallback: ReactNode }) {
  const section = copyOf(id)?.sections.find((s) => s.name === 'Guidelines' && s.web === 'replace');
  if (!section) return fallback;
  const topics: Topic[] = section.items.map((item) => {
    const previous = item.web.split(';').map((s) => s.trim()).filter(Boolean);
    const matches = items.filter((g) => slugify(g.title) === slugify(item.title) || previous.some((t) => slugify(t) === slugify(g.title)));
    const doVisual = matches.find((g) => g.do)?.do;
    const dontVisual = matches.find((g) => g.dont)?.dont;
    const visual = matches.map((g, i) => <div key={i}>{g.visual ?? g.render?.()}{g.caption && <Caption>{g.caption}</Caption>}</div>);
    const list = text(item.lines, 'item');
    return {
      title: item.title,
      aliases: previous.filter((t) => t !== item.title).map(slugify),
      body: text(item.lines).join('\n\n'),
      render: matches.length || list.length ? () => <>{visual}{list.length > 0 && <Bullets items={list} />}</> : undefined,
      do: text(item.lines, 'do')[0] ? { ...doVisual, caption: text(item.lines, 'do')[0] } : undefined,
      dont: text(item.lines, "don't")[0] ? { ...dontVisual, caption: text(item.lines, "don't")[0] } : undefined,
    };
  });
  return <Topics items={topics} />;
}

// Existing imports remain valid; the reader is shared by every reading-page category.
export const FoundationNarrative = ReadingNarrative;
export const FoundationGuidelines = ReadingGuidelines;

/** Existing reference/code children stay live; authored copy owns the explanation. */
export function ReadingTopic({ id, title, aliases = [], children }: { id: string; title: string; aliases?: string[]; children: ReactNode }) {
  const item = readingTopic(id, title) ?? aliases.map((old) => readingTopic(id, old)).find(Boolean);
  const section = readingSection(id, title);
  const paragraphs = section ? text(section.lines) : item && text(item.lines);
  const authored = !!section || !!item?.lines.some((l) => l.surface !== 'figma');
  // Layout wrappers are not references. Remove their fallback prose too, while
  // leaving reference components (tables, specimens, diagrams) opaque and live.
  const references = (nodes: ReactNode): ReactNode => Children.map(nodes, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    if (child.type === P || child.type === Bullets || child.type === Caption) return null;
    if (section && child.type === H3) {
      const old = child.props.children;
      return typeof old === 'string' && !section.items.some((it) => it.title === old) ? <span id={slugify(old)} /> : null;
    }
    if (child.type === Fragment || typeof child.type === 'string') return cloneElement(child, {}, references(child.props.children));
    return child;
  });
  const preserved = authored ? references(children) : children;
  return <section className="docs-section flex flex-col gap-lg">
    <AnchorHeading>{item?.title ?? title}</AnchorHeading>
    {[...new Set([...aliases, ...(item?.web.split(';') ?? [])].map((old) => old.trim()).filter((old) => old && old !== (item?.title ?? title)))].map((old) => <span key={old} id={slugify(old)} />)}
    {paragraphs?.map((p, i) => <P key={i}>{p}</P>)}
    {item && text(item.lines, 'item').length > 0 && <Bullets items={text(item.lines, 'item')} />}
    {section && text(section.lines, 'item').length > 0 && <Bullets items={text(section.lines, 'item')} />}
    {section?.items.map((topic) => <div key={topic.title} className="flex flex-col gap-md">
      <H3>{topic.title}</H3>
      {text(topic.lines).map((p, i) => <P key={i}>{p}</P>)}
      {text(topic.lines, 'item').length > 0 && <Bullets items={text(topic.lines, 'item')} />}
      {text(topic.lines, 'caption').map((c, i) => <Caption key={i}>{c}</Caption>)}
    </div>)}
    {preserved}
    {item && text(item.lines, 'caption').map((c, i) => <Caption key={i}>{c}</Caption>)}
    {section && text(section.lines, 'caption').map((c, i) => <Caption key={i}>{c}</Caption>)}
  </section>;
}
