/**
 * Release notes, newest first. `pages` are page ids (see meta.tsx), so the home page can show
 * what changed recently and each entry links to its page. Add an entry for every release
 * (workflow/WEB.md §7): token changes, new or changed props, fixes, and anything that changes how a
 * design or screen should be built.
 */
export interface ChangeItem {
  kind: 'added' | 'changed' | 'fixed' | 'tokens';
  text: string;
  pages?: string[];
}
export interface Release {
  version: string;
  date: string;
  summary: string;
  items: ChangeItem[];
}

export const releases: Release[] = [
  {
    version: '1.0',
    date: '2026-01-01',
    summary: 'First release, generated from the Figma file.',
    items: [
      { kind: 'added', text: 'Every Figma variable, text style and effect style, as CSS variables, Tailwind utilities and DTCG tokens.', pages: ['02'] },
      { kind: 'added', text: 'Parts, Components and Sections with the same properties as the Figma components.' },
      { kind: 'added', text: 'Light and Dark modes, Standard and Reduced motion.', pages: ['1.6'] },
      { kind: 'added', text: 'This site: foundations, component pages, search and the installable package.', pages: ['01'] },
    ],
  },
];
