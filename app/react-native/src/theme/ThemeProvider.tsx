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
 * color tokens of the current mode plus the component dimension tokens.
 */
export type ThemeComponentTokens = ColorTokens['component'] & typeof dimensions.component;

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
  /** True when the system (or the showcase) asks for Reduced motion. */
  reducedMotion: boolean;
  /**
   * Showcase-only text size preview, multiplied on top of the system text size.
   * 1 in a product app; the system scaling itself comes from `allowFontScaling`.
   */
  textScale: number;
  /** A text style from `typography`, with the preview scale applied. */
  text: (name: TextStyleName) => TextStyle;
  /**
   * Minimum touch target: `size/touch-min` on iOS, 48 dp on Android (APP.md §6.2).
   * The Android value is the platform guideline, not a brand value.
   */
  touchTarget: number;
}

const ANDROID_TOUCH_TARGET = 48;

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

export function buildTheme(scheme: ColorScheme, reducedMotion: boolean, textScale = 1): Theme {
  const colors = colorsByScheme[scheme];
  return {
    scheme,
    color: colors.color,
    component: { ...colors.component, ...dimensions.component },
    shadows: shadowsByScheme[scheme],
    motion: reducedMotion ? reducedMotionTokens : standardMotion,
    reducedMotion,
    textScale,
    text: (name) => {
      const style = typography[name];
      return { ...style, fontSize: style.fontSize * textScale, lineHeight: style.lineHeight * textScale };
    },
    touchTarget: Platform.OS === 'android' ? ANDROID_TOUCH_TARGET : dimensions.size.touchMin,
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
  /** Showcase-only text size preview (see `Theme.textScale`). */
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
 * inside a light screen, or side-by-side Light and Dark specimens in the showcase.
 * Motion and text size are inherited from the parent theme.
 */
export function ThemeScope({ scheme, children }: { scheme: ColorScheme; children: ReactNode }) {
  const parent = useContext(ThemeContext);
  const reduced = parent?.reducedMotion ?? false;
  const textScale = parent?.textScale ?? 1;
  const theme = useMemo(() => buildTheme(scheme, reduced, textScale), [scheme, reduced, textScale]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
