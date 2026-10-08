import { config } from '@/ds.config';
import { tokens } from '@/tokens/tokens.gen';

/**
 * The color modes this system supports, for the site and its pages.
 *
 * `ds.config.ts` `modes` lists the modes the system ships; the Color collection says which ones the
 * Figma file has, and `unsupportedModes` lists the ones the owner approved as not supported
 * (tokens/accepted.json, kept by `npm run tokens`). A Light-only system hides the site's Dark toggle,
 * QA checks Light only, and the pages say Dark isn't supported instead of showing it.
 */
const colorCollection = tokens.collections.find((c) => c.name === 'Color');

/** Modes the Figma Color collection has but the system doesn't support (e.g. a Dark column never set up). */
export const unsupportedModes: string[] = [
  ...new Set([...(colorCollection?.unsupportedModes ?? []), ...(colorCollection?.modes ?? []).filter((m) => !(config.modes as readonly string[]).includes(m))]),
];

/** The supported color modes, in the config's order. */
export const supportedModes: string[] = (config.modes as readonly string[]).filter((m) => !unsupportedModes.includes(m));

/** True when the site offers Dark (header toggle, Dark specimens). */
export const siteHasDark = supportedModes.includes('Dark');

/** "Light and Dark" or "Light only". */
export const modesLabel = supportedModes.length > 1 ? supportedModes.join(' and ') : `${supportedModes[0] ?? 'Light'} only`;

/** The `data-theme` values for side-by-side specimens: ['light', 'dark'], or ['light'] on a Light-only system. */
export const siteSchemes: ('light' | 'dark')[] = siteHasDark ? ['light', 'dark'] : ['light'];
