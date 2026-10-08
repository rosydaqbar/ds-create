import { useContext } from 'react';
import { ThemeContext, type Theme } from './ThemeProvider';

/** The resolved theme for this part of the tree. Throws outside a ThemeProvider. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme() needs a <ThemeProvider> above it.');
  return theme;
}
