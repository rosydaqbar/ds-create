/**
 * Identity of this design system (APP.md A3). A build replaces every placeholder here;
 * nothing else in the template carries a name, version or package.
 */
export const dsConfig = {
  /** The system name shown on the showcase home, e.g. the brand name + "Design System". */
  name: 'Design System',
  /** Library version (semver). Matches the changelog (APP.md A6). */
  version: '0.1.0',
  /** npm package name. Keep it in sync with package.json. */
  packageName: '@your-org/design-system-native',
  /** Where the full guidelines live. Empty strings hide the links in the showcase. */
  links: {
    /** Web explorer root, e.g. https://design.example.com (pages open at `/{id}`). */
    web: '',
    /** Figma file URL. */
    figma: '',
  },
} as const;

export type DsConfig = typeof dsConfig;
