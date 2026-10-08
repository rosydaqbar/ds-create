/**
 * Type-only stand-in for `react-native` inside this docs project. At runtime `react-native` is aliased to
 * react-native-web (vite.config.ts). With `baseUrl: "."`, TypeScript would resolve a bare `react-native`
 * import to the build's own `./react-native` preview folder (workflow/APP.md A1 copies it there) and fail on the
 * untouched copy; `paths` in tsconfig.json points it here instead. Stories use these loose types only
 * inside app visuals.
 */
import type { ComponentType } from 'react';

export const View = null as unknown as ComponentType<Record<string, unknown>>;
export const Text = null as unknown as ComponentType<Record<string, unknown>>;
