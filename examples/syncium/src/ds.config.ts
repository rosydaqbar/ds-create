/**
 * System identity for the explorer, filled from the Syncium Figma build (00 Cover, 1.8 Brand assets).
 */
export const config = {
  name: 'Syncium Design System',
  version: '1.1',
  /** npm package that ships the tokens, styles and React components. */
  packageName: '@syncium/design-system',
  description:
    'Syncium keeps data in sync and files secure in the cloud. This is the shared set of tokens, components and guidance behind every Syncium screen on the web, in Light and Dark.',
  /** Logo files in public/brand/ (Light and Dark surfaces). */
  logo: { light: 'brand/lockup-light.svg', dark: 'brand/lockup-dark.svg', mark: 'brand/mark.svg' },
  modes: ['Light', 'Dark'] as const,
  /** Figtree stands in for the brand typeface Gilroy (not licensed for this build); JetBrains Mono for code. */
  fontStylesheets: [
    'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  ] as string[],
  /** Link to the generated Figma file, shown in the header and on every page. Left empty in this public example. */
  figmaUrl: '',
};
