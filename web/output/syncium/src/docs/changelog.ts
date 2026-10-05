/**
 * Release notes. Newest first. `pages` are page ids (see meta.tsx) so the home page can show
 * what changed recently and each entry can link to the page.
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
    version: '1.1',
    date: '2026-10-05',
    summary: 'Better contrast and accessibility, guidance on every foundation page, site-wide search and an installable package.',
    items: [
      { kind: 'tokens', text: 'Placeholder text has more contrast: color/text/placeholder uses palette/neutral/600 in Light (6.3:1, was 4.2:1) and palette/neutral/400 in Dark.', pages: ['1.1', '2.10', '3.5'] },
      { kind: 'tokens', text: 'In Dark, danger fills use palette/red/700 for hover and selected and palette/red/800 for pressed, so white text stays above 4.5:1 (hover was 3.9:1).', pages: ['1.1', '2.1'] },
      { kind: 'tokens', text: 'In Dark, color/text/danger uses palette/red/300, reaching 5.8:1 on the subtle danger fill (was 4.3:1).', pages: ['1.1', '2.4', '3.8'] },
      { kind: 'tokens', text: 'The GitLab social button’s foreground (social-button/gitlab/fg) is now GitLab charcoal #171321: 6.4:1 on GitLab orange, where white was 2.85:1.', pages: ['3.7'] },
      { kind: 'fixed', text: 'Screen readers now announce a name for each slider handle.', pages: ['2.18'] },
      { kind: 'fixed', text: 'Text field: the tag input now has a label, and the number stepper buttons are at least 24 × 24 px.', pages: ['3.2'] },
      { kind: 'changed', text: 'The vertical counter in a text field now shows − and + side by side instead of stacked chevrons, so each button reaches 24 × 24 px. Figma still shows the stacked version.', pages: ['3.2'] },
      { kind: 'changed', text: 'Slider now requires an accessible name: pass label, aria-label or aria-labelledby.', pages: ['2.18'] },
      { kind: 'added', text: 'Video player has a label prop that sets its accessible name. It defaults to the title.', pages: ['4.2'] },
      { kind: 'fixed', text: 'Menu search now sits outside the list of items, and multi-select and radio menu items no longer nest interactive controls.', pages: ['3.5', '3.6'] },
      { kind: 'added', text: 'Foundation pages now have Overview, Tokens and Guidelines, matching the Figma file.', pages: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8'] },
      { kind: 'added', text: 'Getting started has separate paths for designers and developers.', pages: ['01'] },
      { kind: 'added', text: 'Every component now shows a Stable or Beta status label, and the site has a changelog.', pages: ['03'] },
      { kind: 'added', text: 'Search finds pages, components, props and tokens, including the other names people use for them (⌘K or /).' },
      { kind: 'added', text: 'The @syncium/design-system package ships styles.css, tokens.css, tokens.json and the React components.', pages: ['01'] },
      { kind: 'changed', text: 'Anatomy diagrams mark each part on the component, and the Code tab shows a live preview with each example.' },
      { kind: 'changed', text: 'This site gained a skip link, arrow-key navigation for tabs, keyboard scrolling for code and variant grids, and linkable section headings.' },
    ],
  },
  {
    version: '1.0',
    date: '2026-10-04',
    summary: 'First release, generated from the Syncium Figma file.',
    items: [
      { kind: 'added', text: '711 variables, 35 text styles and 11 effect styles from Figma, as CSS variables, Tailwind utilities and DTCG tokens.', pages: ['02'] },
      { kind: 'added', text: '29 components (19 Parts, 8 Components and 2 Sections), with the same properties as in Figma.' },
      { kind: 'added', text: 'Light and Dark color modes, plus Standard and Reduced motion.', pages: ['1.6'] },
    ],
  },
];
