/**
 * Fallback for `@app` when no React Native source exists next to the docs (a Web-only product).
 * Stories import the previews as a namespace (`import * as App from '@app'`), so components the
 * fallback doesn't list stay undefined instead of breaking the import; they are never rendered.
 */
export const ThemeProvider = ({ children }: { children: unknown }) => children;
export const __missing = true;
