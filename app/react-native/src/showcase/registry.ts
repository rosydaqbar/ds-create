import type { ComponentDoc, Level } from './docs/types';
import buttonDoc from './docs/button.doc';

/**
 * Every page of the system tree, in order. A page with a `screen` opens in the showcase;
 * the rest show as "Not built yet" until their foundation screen or doc object exists.
 * Add a doc object here when a component is built (see src/components/COMPONENTS.md).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDoc = ComponentDoc<any>;

export const docs: Record<string, AnyDoc> = {
  [buttonDoc.id]: buttonDoc,
};

export type PageScreen = 'Color' | 'Typography' | 'Component';

export interface PageEntry {
  id: string;
  name: string;
  level: Level;
  screen?: PageScreen;
}

const page = (id: string, name: string, level: Level, screen?: PageScreen): PageEntry => ({
  id,
  name,
  level,
  screen: screen ?? (docs[id] ? 'Component' : undefined),
});

export const pages: PageEntry[] = [
  page('1.1', 'Color', 'foundations', 'Color'),
  page('1.2', 'Typography', 'foundations', 'Typography'),
  page('1.3', 'Space & layout', 'foundations'),
  page('1.4', 'Shape', 'foundations'),
  page('1.5', 'Elevation', 'foundations'),
  page('1.6', 'Motion', 'foundations'),
  page('1.7', 'Iconography', 'foundations'),
  page('1.8', 'Brand assets', 'foundations'),

  page('2.1', 'Button', 'parts'),
  page('2.2', 'Icon button', 'parts'),
  page('2.3', 'Link', 'parts'),
  page('2.4', 'Badge', 'parts'),
  page('2.5', 'Tag', 'parts'),
  page('2.6', 'Avatar', 'parts'),
  page('2.7', 'Checkbox', 'parts'),
  page('2.8', 'Radio', 'parts'),
  page('2.9', 'Switch', 'parts'),
  page('2.10', 'Text control', 'parts'),
  page('2.11', 'Label', 'parts'),
  page('2.12', 'Help text', 'parts'),
  page('2.13', 'Tooltip', 'parts'),
  page('2.14', 'Progress', 'parts'),
  page('2.15', 'Spinner', 'parts'),
  page('2.16', 'Divider', 'parts'),
  page('2.17', 'Kbd', 'parts'),
  page('2.18', 'Slider', 'parts'),
  page('2.19', 'Featured icon', 'parts'),

  page('3.1', 'Button group', 'components'),
  page('3.2', 'Text field', 'components'),
  page('3.3', 'Choice field', 'components'),
  page('3.4', 'Avatar group', 'components'),
  page('3.5', 'Select', 'components'),
  page('3.6', 'Menu', 'components'),
  page('3.7', 'Social button', 'components'),
  page('3.8', 'Badge group', 'components'),

  page('4.1', 'Rich text editor', 'sections'),
  page('4.2', 'Video player', 'sections'),
];

export const levels: { level: Level; number: number; title: string }[] = [
  { level: 'foundations', number: 1, title: 'Foundations' },
  { level: 'parts', number: 2, title: 'Parts' },
  { level: 'components', number: 3, title: 'Components' },
  { level: 'sections', number: 4, title: 'Sections' },
];

/** Starting points on the home screen. */
export const startHere = ['1.1', '1.2', '2.1'];

/** Built components, most recently updated first. */
export const recentlyUpdated = (): AnyDoc[] =>
  Object.values(docs).sort((a, b) => (b.updated ?? b.since).localeCompare(a.updated ?? a.since));
