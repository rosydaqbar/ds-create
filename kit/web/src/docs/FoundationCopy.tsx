import { Children, Fragment, cloneElement, isValidElement, type ReactNode } from 'react';
import { copyOf, readingSection, readingTopic } from './copy';
import { AnchorHeading, Topics } from './DocPage';
import { P, H3, Bullets, Caption, slugify } from './blocks';
import type { Topic } from './types';

const text = (lines: { surface: string; role: string; text: string }[], role = '') => lines.filter((l) => l.surface !== 'figma' && l.role === role).map((l) => l.text);

/** Marks a live detail's topic without changing legacy pages or copy formats. */
export function ReadingDetail({ children }: { topic: string; aliases?: string[]; children: ReactNode }) {
  return <>{children}</>;
}
interface Detail { names: string[]; content: ReactNode }
function readingDetails(fallback: ReactNode, visuals: Record<string, ReactNode> = {}): Detail[] {
  const details = Object.entries(visuals).map(([name, content]) => ({ names: [name], content }));
  const walk = (nodes: ReactNode) => Children.forEach(nodes, (child) => {
    if (!isValidElement<{ topic?: string; aliases?: string[]; children?: ReactNode }>(child)) return;
    if (child.type === ReadingDetail && child.props.topic) details.push({ names: [child.props.topic, ...(child.props.aliases ?? [])], content: child.props.children });
    else walk(child.props.children);
  });
  walk(fallback);
  return details;
}
function assignDetails<T extends { title: string; web: string }>(items: T[], details: Detail[]) {
  const assigned = new Map<T, Detail[]>();
  for (const detail of details) {
    const names = detail.names.map(slugify);
    // A renamed introduction may retain an old anchor that is also a real
    // reference topic. Give the detail to its explicit topic, once.
    const owner = items.find((item) => names.includes(slugify(item.title)))
      ?? items.find((item) => item.web.split(';').some((name) => names.includes(slugify(name.trim()))));
    if (owner) assigned.set(owner, [...(assigned.get(owner) ?? []), detail]);
  }
  return assigned;
}
const referenceBody = (nodes: ReactNode): ReactNode => Children.map(nodes, (child) => {
  if (!isValidElement<{ children?: ReactNode }>(child)) return child;
  if (child.type === AnchorHeading) return null;
  if (child.type === Fragment) return cloneElement(child, {}, referenceBody(child.props.children));
  return child;
});
const detailContent = (details: Detail[]) => details.map((d, i) => <div key={i} data-reading-detail={d.names[0]} className="flex min-w-0 w-full max-w-full flex-col gap-lg">{referenceBody(d.content)}</div>);

/** Replace prose only when the existing copy file explicitly owns the narrative.
 * Numeric references, diagrams, palettes, style specimens and token tables stay in their renderers.
 */
export function ReadingNarrative({ id, section: name = 'Overview', fallback, visuals = {} }: { id: string; section?: string; fallback: ReactNode; visuals?: Record<string, ReactNode> }) {
  const section = copyOf(id)?.sections.find((s) => s.name === name && s.web === 'narrative');
  if (!section) return fallback;
  const details = readingDetails(fallback, visuals);
  const assigned = assignDetails(section.items, details);
  const headings = new Set(section.items.map((item) => slugify(item.title)));
  const used = new Set<Detail>();
  const items: Topic[] = section.items.flatMap((item) => {
    const list = text(item.lines, 'item'), captions = text(item.lines, 'caption');
    const matched = assigned.get(item) ?? [];
    // A reference absent from this export is not a fabricated specimen.
    if (item.web === 'reference' && !matched.length) return [];
    matched.forEach((d) => used.add(d));
    return [{
      title: item.title, body: text(item.lines).join('\n\n'),
      aliases: [...new Set([...item.web.split(';').filter((n) => n !== 'reference'), ...matched.flatMap((d) => d.names)].map((s) => s.trim()).filter(Boolean).map(slugify))].filter((s) => !headings.has(s)),
      render: matched.length || list.length || captions.length ? () => <>{detailContent(matched)}{list.length > 0 && <Bullets items={list} />}{captions.map((c, i) => <Caption key={i}>{c}</Caption>)}</> : undefined,
      do: text(item.lines, 'do')[0] ? { caption: text(item.lines, 'do')[0] } : undefined,
      dont: text(item.lines, "don't")[0] ? { caption: text(item.lines, "don't")[0] } : undefined,
    }];
  });
  // Keep additional live references as named topics, never an anonymous appendix.
  for (const d of details) if (!used.has(d)) items.push({ title: d.names[0], body: '', render: () => <>{detailContent([d])}</> });
  return <Topics flow intro={<>{text(section.lines).map((p, i) => <P key={i}>{p}</P>)}{text(section.lines, 'item').length > 0 && <Bullets items={text(section.lines, 'item')} />}</>} items={items} />;
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
    const visual = matches.map((g, i) => <div key={i} className="min-w-0 w-full max-w-full">{g.visual ?? g.render?.()}{g.caption && <Caption>{g.caption}</Caption>}</div>);
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
  const details = section ? readingDetails(children) : [];
  const assigned = assignDetails(section?.items ?? [], details);
  const used = new Set<Detail>();
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
  return <section data-reading-topic={item?.title ?? title} className="docs-section flex flex-col gap-lg">
    <AnchorHeading>{item?.title ?? title}</AnchorHeading>
    {[...new Set([...aliases, ...(item?.web.split(';') ?? [])].map((old) => old.trim()).filter((old) => old && old !== (item?.title ?? title)))].map((old) => <span key={old} id={slugify(old)} />)}
    {paragraphs?.map((p, i) => <P key={i}>{p}</P>)}
    {item && text(item.lines, 'item').length > 0 && <Bullets items={text(item.lines, 'item')} />}
    {section && text(section.lines, 'item').length > 0 && <Bullets items={text(section.lines, 'item')} />}
    {section?.items.map((topic) => {
      const matched = assigned.get(topic) ?? [];
      matched.forEach((d) => used.add(d));
      return <section key={topic.title} data-reading-topic={topic.title} aria-label={topic.title} className="flex min-w-0 flex-col gap-lg">
      <H3>{topic.title}</H3>
      {matched.flatMap((d) => d.names).filter((n) => n !== topic.title).map((n) => <span key={n} id={slugify(n)} />)}
      {text(topic.lines).map((p, i) => <P key={i}>{p}</P>)}
      {text(topic.lines, 'item').length > 0 && <Bullets items={text(topic.lines, 'item')} />}
      {detailContent(matched)}
      {text(topic.lines, 'caption').map((c, i) => <Caption key={i}>{c}</Caption>)}
    </section>;
    })}
    {section && details.length ? details.filter((d) => !used.has(d)).map((d, i) => <section key={i} data-reading-topic={d.names[0]} aria-label={d.names[0]} className="flex min-w-0 flex-col gap-lg"><H3>{d.names[0]}</H3>{detailContent([d])}</section>) : preserved}
    {item && text(item.lines, 'caption').map((c, i) => <Caption key={i}>{c}</Caption>)}
    {section && text(section.lines, 'caption').map((c, i) => <Caption key={i}>{c}</Caption>)}
  </section>;
}
