import { createContext, useContext, type ReactNode } from 'react';

/**
 * Heading levels for `accessibilityRole="header"`.
 *
 * iOS has no heading levels and Android only marks a node as a heading, so on devices the level
 * changes nothing. On the web (react-native-web) a header becomes `<h{level}>`, and an unlevelled
 * header becomes `<h1>`, which breaks the outline of the page around it.
 *
 * The level comes from context, like nested sections in a document: a title takes the current
 * level (3 by default: screen and section titles), and a component with a title wraps the content
 * under it in `<SubHeadings>`, so the titles inside (card titles) sit one level deeper (4).
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const DEFAULT_LEVEL: HeadingLevel = 3;
const HeadingLevelContext = createContext<HeadingLevel>(DEFAULT_LEVEL);

const clamp = (level: number): HeadingLevel => Math.min(6, Math.max(1, Math.round(level))) as HeadingLevel;

/** The props of a header at a fixed level. */
export const headingProps = (level: HeadingLevel) => ({ accessibilityRole: 'header', 'aria-level': level }) as const;

/**
 * The props of a header at the current level. `depth` places a sub-title of the same component
 * below its own title (1 = one level deeper).
 */
export function useHeading(depth = 0) {
  return headingProps(clamp(useContext(HeadingLevelContext) + depth));
}

/**
 * Sets the level of the next titles. A screen sets the level its title takes; the docs site sets
 * the level that follows the page heading above each preview.
 */
export function HeadingLevelProvider({ level, children }: { level: HeadingLevel; children: ReactNode }) {
  return <HeadingLevelContext.Provider value={clamp(level)}>{children}</HeadingLevelContext.Provider>;
}

/** The content under a title: its titles sit one level deeper. */
export function SubHeadings({ children, depth = 1 }: { children: ReactNode; depth?: number }) {
  const level = useContext(HeadingLevelContext);
  return <HeadingLevelContext.Provider value={clamp(level + depth)}>{children}</HeadingLevelContext.Provider>;
}
