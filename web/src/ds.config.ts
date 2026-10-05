/**
 * System identity for the explorer. Fill from the Figma build (00 Cover, 1.8 Brand assets).
 * Everything here is placeholder until a build replaces it.
 */
export const config = {
  name: 'Design System',
  version: '1.0',
  description: 'Tokens, components and guidance generated with ds-create. Replace this text with the system description from 00 Cover.',
  /** Logo files in public/brand/ (Light and Dark surfaces). */
  logo: { light: 'brand/lockup-light.svg', dark: 'brand/lockup-dark.svg', mark: 'brand/mark.svg' },
  modes: ['Light', 'Dark'] as const,
  /** Web fonts to load (e.g. a Google Fonts CSS URL). Empty uses the system stacks in tokens. */
  fontStylesheets: [] as string[],
  /** Link to the generated Figma file, shown in the header. */
  figmaUrl: '',
};
