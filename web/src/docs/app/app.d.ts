/**
 * Types the docs site needs from the React Native preview source (`@app`, see vite.config.ts).
 * The docs only render it, so a narrow surface is enough.
 * Add one line here for each React Native component a story renders.
 */
import type { ComponentType, ReactNode } from 'react';

export const ThemeProvider: ComponentType<{ colorScheme?: 'light' | 'dark'; reducedMotion?: boolean; textScale?: number; children: ReactNode }>;
/** The resolved app theme: color roles and text styles by token name (`textSecondary`, `bodySmSemibold`). */
export function useTheme(): { color: Record<string, string>; text: (name: string) => Record<string, unknown> };
export const Button: ComponentType<Record<string, unknown> & { label: string }>;
/** True only in the fallback module, when no React Native source exists next to the docs. */
export const __missing: boolean | undefined;
