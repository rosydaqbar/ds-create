import { Platform } from 'react-native';

/**
 * Documentation only: names a part of a component for the Anatomy markers on the web docs
 * site, like `data-anatomy` on the web components. Use the Figma layer name in kebab case
 * (`root`, `label`, `leading-icon`). On iOS and Android it adds nothing.
 */
export function anatomy(part: string): { dataSet?: { anatomy: string } } {
  return Platform.OS === 'web' ? { dataSet: { anatomy: part } } : {};
}
