/**
 * System identity for the explorer. Fill from the Figma build (00 Cover, 1.8 Brand assets).
 * Everything here is placeholder until a build replaces it.
 */
export const config = {
  name: 'Design System',
  version: '1.0',
  /** npm package that ships the tokens, styles and React components (`npm run build:package`). */
  packageName: '@your-org/design-system',
  /**
   * What the system is for (INITIATOR Part A §10): 'web', 'app' or 'both'. Every product gets this
   * docs site. 'app' and 'both' preview the components in React Native here (react-native-web) and
   * show their code in React Native, Swift and Kotlin; 'app' builds no web library or npm package.
   */
  product: ((import.meta.env.VITE_DS_PRODUCT as string | undefined) ?? 'web') as 'web' | 'app' | 'both',
  description: 'Tokens, components and guidance generated with ds-create. Replace this text with the system description from 00 Cover.',
  /** Logo files in public/brand/ (Light and Dark surfaces). */
  logo: { light: 'brand/lockup-light.svg', dark: 'brand/lockup-dark.svg', mark: 'brand/mark.svg' },
  modes: ['Light', 'Dark'] as const,
  /** Web fonts to load (e.g. a Google Fonts CSS URL). Empty uses the system stacks in tokens. */
  fontStylesheets: [] as string[],
  /** Link to the generated Figma file, shown in the header. */
  figmaUrl: '',
};
