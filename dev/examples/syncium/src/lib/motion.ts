/**
 * Motion helpers for the 1.6 Motion pairings (utilities live in styles/index.css).
 */
import { useEffect, useState } from 'react';

/** Reads a duration token (`--motion-duration-fast`) in ms at runtime, so Reduced mode is respected. */
export function motionMs(token: string, el: Element = document.documentElement) {
  const raw = getComputedStyle(el).getPropertyValue(token).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? (raw.endsWith('s') && !raw.endsWith('ms') ? n * 1000 : n) : 0;
}

/**
 * Keeps a popup mounted while it plays its exit (`motion-exit`, fast · exit).
 * `mounted` → render it; `closing` → it is leaving (apply `motion-exit`, make it inert).
 */
export function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const t = window.setTimeout(() => setMounted(false), motionMs('--motion-duration-fast') + 20);
    return () => window.clearTimeout(t);
  }, [open, mounted]);
  return { mounted: open || mounted, closing: !open && mounted };
}

/** Class for a popup root driven by `usePresence`. */
export const presenceClass = (closing: boolean) => (closing ? 'motion-exit' : 'motion-enter');
