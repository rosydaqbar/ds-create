import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Easing, Platform, useColorScheme, type EasingFunction, type TextStyle, type ViewStyle } from 'react-native';
import {
  darkColors,
  darkShadows,
  dimensions,
  lightColors,
  lightShadows,
  reducedMotion as reducedMotionTokens,
  standardMotion,
  typography,
  type ColorTokens,
} from '../tokens/tokens';

/**
 * Theme: resolves the generated tokens (src/tokens/tokens.ts) for the current color mode,
 * motion preference and text size. Components read everything through `useTheme()` and
 * the static `dimensions` / `typography` exports; they never type a color, size or duration.
 */

export type ColorScheme = 'light' | 'dark';
export type TextStyleName = keyof typeof typography;

/** `color/*` roles, e.g. `theme.color.textPrimary` (APP.md §5). */
export type ThemeColors = ColorTokens['color'];

/**
 * Component tokens, e.g. `theme.component.buttonPaddingXMd` (APP.md §5): the component
 * color tokens of the current mode plus the component dimension tokens. Empty when the Figma
 * file has no component tokens (components bound straight to semantic roles or raw values);
 * read them with a fallback (`num(theme.component.buttonGapMd, …)` in parts/_shared.tsx).
 */
export type ThemeComponentTokens = Partial<Record<string, string | number>>;

/** A token group that may be missing from the generated tokens (an existing file with its own naming). */
const group = <T,>(source: unknown, key: string): Partial<Record<string, T>> => ((source as Record<string, Partial<Record<string, T>> | undefined>)[key] ?? {});

/** Effect styles, named with their Figma domain: `elevation/raised` → `elevationRaised`, `focus/default` → `focusDefault`. */
type ShadowKey = Extract<keyof typeof lightShadows, string>;
/** Generated names keep their domain: `elevation/raised` → `elevationRaised`, `focus/default` → `focusDefault`. */
export type ThemeShadows = { [K in ShadowKey]: ViewStyle };

/** Motion tokens for the active preference (Standard or Reduced). */
export type ThemeMotion = {
  readonly [K in keyof typeof standardMotion]: (typeof standardMotion)[K] extends number ? number : readonly number[];
};

export interface Theme {
  scheme: ColorScheme;
  color: ThemeColors;
  component: ThemeComponentTokens;
  shadows: ThemeShadows;
  motion: ThemeMotion;
  /** True when the system (or the docs site) asks for Reduced motion. */
  reducedMotion: boolean;
  /**
   * Docs-site text size preview, multiplied on top of the system text size.
   * 1 in a product app; the system scaling itself comes from `allowFontScaling`.
   */
  textScale: number;
  /**
   * A text style from `typography`, with the preview scale applied. A name the brand doesn't have
   * falls back to the same size with another weight, then to the first body style, so a reference
   * component never renders unstyled text.
   */
  text: (name: TextStyleName) => TextStyle;
  /** Minimum touch target: `size/touch-min` on iOS, `size/touch-min-android` on Android (APP.md §6.2). */
  touchTarget: number;
}

/** A motion easing token (cubic-bezier control points) as a React Native easing function. */
export function toEasing(curve: readonly number[]): EasingFunction {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = curve;
  return Easing.bezier(x1, y1, x2, y2);
}

function nameShadows(source: typeof lightShadows | typeof darkShadows): ThemeShadows {
  return source as unknown as ThemeShadows;
}

const shadowsByScheme: Record<ColorScheme, ThemeShadows> = { light: nameShadows(lightShadows), dark: nameShadows(darkShadows) };
const colorsByScheme: Record<ColorScheme, ColorTokens> = { light: lightColors, dark: darkColors };

/** The text style to use for `name`: itself, the same size in another weight, or the first body style. */
function textStyleFor(name: string): (typeof typography)[TextStyleName] | undefined {
  const styles = typography as Record<string, (typeof typography)[TextStyleName]>;
  if (styles[name]) return styles[name];
  const size = name.replace(/(Thin|Light|Regular|Medium|Semibold|SemiBold|Bold|Black)$/, '');
  const keys = Object.keys(styles);
  const sameSize = keys.find((k) => k.startsWith(size));
  const body = keys.find((k) => k.startsWith('body'));
  return styles[sameSize ?? body ?? keys[0]];
}

export function buildTheme(scheme: ColorScheme, reducedMotion: boolean, textScale = 1): Theme {
  const colors = colorsByScheme[scheme];
  const size = group<number>(dimensions, 'size');
  return {
    scheme,
    color: colors.color,
    component: { ...group<string>(colors, 'component'), ...group<number>(dimensions, 'component') },
    shadows: shadowsByScheme[scheme],
    motion: reducedMotion ? reducedMotionTokens : standardMotion,
    reducedMotion,
    textScale,
    text: (name) => {
      const style = textStyleFor(name);
      if (!style) return {};
      return { ...style, fontSize: style.fontSize * textScale, lineHeight: style.lineHeight * textScale } as TextStyle;
    },
    // The platform minimums (44 pt iOS, 48 dp Android) when the file has no touch-target tokens.
    touchTarget: Platform.OS === 'android' ? (size.touchMinAndroid ?? size.touchMin ?? 48) : (size.touchMin ?? 44),
  };
}

export const ThemeContext = createContext<Theme | null>(null);

/** Follows the system Reduce motion setting and its changes. */
function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

export interface ThemeProviderProps {
  /** Force Light or Dark. By default the app follows the system color scheme. */
  colorScheme?: ColorScheme;
  /** Force Standard (false) or Reduced (true) motion. By default the system setting decides. */
  reducedMotion?: boolean;
  /** Docs-site text size preview (see `Theme.textScale`). */
  textScale?: number;
  children: ReactNode;
}

export function ThemeProvider({ colorScheme, reducedMotion, textScale = 1, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const systemReduced = useSystemReducedMotion();
  const scheme: ColorScheme = colorScheme ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const reduced = reducedMotion ?? systemReduced;
  const theme = useMemo(() => buildTheme(scheme, reduced, textScale), [scheme, reduced, textScale]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/**
 * Forces one color mode for a subtree, like `data-theme` on the web: a dark promo card
 * inside a light screen, or side-by-side Light and Dark specimens on the web docs site.
 * Motion and text size are inherited from the parent theme.
 */
export function ThemeScope({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const parent = useContext(ThemeContext);
  const reduced = parent?.reducedMotion ?? false;
  const textScale = parent?.textScale ?? 1;
  const theme = useMemo(() => buildTheme(scheme, reduced, textScale), [scheme, reduced, textScale]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
