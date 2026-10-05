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
  bound: Record<string, string>;
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
  source: string;
  collections: { name: string; modes: string[] }[];
  variables: TokenVariable[];
  textStyles: TokenTextStyle[];
  effectStyles: TokenEffectStyle[];
  gridStyles: { name: string; grids: { pattern: string; count: number; gutter: number; margin: number; alignment: string }[] }[];
}
