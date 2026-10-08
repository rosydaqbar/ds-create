export interface TokenMode {
  /** The variable this mode aliases, e.g. `palette/neutral/900`; null for a raw value. */
  alias: string | null;
  /** Final value after following aliases, e.g. `#0f172a`, `16px`. */
  value: string;
}
export interface TokenVariable {
  name: string;
  collection: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  description: string;
  /** CSS custom property, e.g. `--color-text-primary`. */
  css: string;
  /** Example Tailwind utility, e.g. `text-text-primary`. */
  tailwind: string | null;
  modes: Record<string, TokenMode>;
}
export interface TokenTextStyle {
  name: string;
  className: string;
  /** Variables the style binds (empty for a style with raw values). */
  bound: Record<string, string>;
  /** The style's own family, as Figma has it (null when the export has none). */
  fontFamily?: string | null;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
}
export interface TokenEffectStyle {
  name: string;
  css: string;
  tailwind: string;
  effects: { type: string; x: number; y: number; blur: number; spread: number; color: unknown }[];
  light: string;
  dark: string;
}
export interface TokenData {
  /** Figma pages (id, name) from the export; used for "Open in Figma" links. */
  pages?: { id: string; name: string }[];
  source: string;
  /** `unsupportedModes`: modes Figma has but the owner approved as not supported (tokens/accepted.json); left out of `modes`. */
  collections: { name: string; modes: string[]; unsupportedModes?: string[] }[];
  variables: TokenVariable[];
  textStyles: TokenTextStyle[];
  effectStyles: TokenEffectStyle[];
  gridStyles: { name: string; grids: { pattern: string; count: number; gutter: number; margin: number; alignment: string }[] }[];
}
