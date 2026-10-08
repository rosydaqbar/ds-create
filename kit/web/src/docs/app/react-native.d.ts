/**
 * `react-native` is aliased to react-native-web (vite.config.ts) and never installed, so stories
 * that lay out React Native content get these loose types. Use them only inside app visuals.
 */
declare module 'react-native' {
  import type { ComponentType } from 'react';
  export const View: ComponentType<Record<string, unknown>>;
  export const Text: ComponentType<Record<string, unknown>>;
}
