/**
 * Web stand-in for `@react-native/assets-registry/registry`, which ships with `react-native`
 * and is never installed here. react-native-svg only asks it for bundled image assets; the
 * docs pass icons and images as URLs, so no asset is ever registered.
 */
export function getAssetByID(): undefined {
  return undefined;
}

export function registerAsset(): number {
  return 0;
}
