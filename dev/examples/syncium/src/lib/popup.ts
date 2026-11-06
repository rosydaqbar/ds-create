/**
 * Behaviour helpers shared by the popup components (3.5 Select, 3.6 Menu, 4.1 Rich text editor).
 * No styling lives here: each component draws its own parts from tokens.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Controlled when `value` is given, otherwise internal state seeded from `initial`. */
export function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState<T>(initial);
  const controlled = value !== undefined;
  const cb = useRef(onChange);
  cb.current = onChange;
  const set = useCallback(
    (v: T) => {
      if (!controlled) setInner(v);
      cb.current?.(v);
    },
    [controlled],
  );
  return [controlled ? (value as T) : inner, set];
}

/** Closes a popup on a pointer press outside every element in `refs`. */
export function useDismiss(open: boolean, refs: RefObject<HTMLElement | null>[], onDismiss: () => void) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (refs.some((r) => r.current?.contains(t))) return;
      cb.current();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

/**
 * Which side of the trigger a popup opens on: below by default, above when it would leave the
 * bottom of the viewport and there is room above. Measured once per opening.
 */
export function usePopupSide(open: boolean, triggerRef: RefObject<HTMLElement | null>, popupRef: RefObject<HTMLElement | null>, enabled = true) {
  const [side, setSide] = useState<'below' | 'above'>('below');
  useLayoutEffect(() => {
    if (!open || !enabled) { setSide('below'); return; }
    const t = triggerRef.current?.getBoundingClientRect();
    const p = popupRef.current?.getBoundingClientRect();
    if (!t || !p) return;
    const vh = window.innerHeight;
    const below = vh - t.bottom;
    // Flip only for a trigger on screen, when the popup does not fit below but does fit above.
    const onScreen = t.top >= 0 && t.bottom <= vh;
    setSide(onScreen && p.height > below && t.top > p.height ? 'above' : 'below');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, enabled]);
  return side;
}

/** Typeahead: collects typed characters for 500 ms and returns the first matching index after `from`. */
export function useTypeahead() {
  const buffer = useRef('');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return useCallback((key: string, labels: string[], from: number, isDisabled: (i: number) => boolean = () => false) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => (buffer.current = ''), 500);
    const repeat = buffer.current.length > 0 && buffer.current === key.repeat(buffer.current.length);
    buffer.current += key.toLowerCase();
    const q = repeat ? key.toLowerCase() : buffer.current;
    const n = labels.length;
    const start = repeat || buffer.current.length === 1 ? from + 1 : from;
    for (let k = 0; k < n; k++) {
      const i = (((start + k) % n) + n) % n;
      if (!isDisabled(i) && labels[i].toLowerCase().startsWith(q)) return i;
    }
    return -1;
  }, []);
}

/** True for a key that types a character (typeahead). */
export const isPrintableKey = (e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }) =>
  e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey;

/**
 * Drawn scroll thumb for a scrolling region whose native scroll bar is hidden.
 * Returns the thumb's offset and length as fractions of the track, and whether the region overflows.
 */
export function useScrollThumb(scrollRef: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  const [thumb, setThumb] = useState({ top: 0, size: 1, overflow: false });
  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight > clientHeight + 1;
    const size = overflow ? Math.max(clientHeight / scrollHeight, 0.12) : 1;
    const top = overflow ? (scrollTop / (scrollHeight - clientHeight)) * (1 - size) : 0;
    setThumb((t) => (t.top === top && t.size === size && t.overflow === overflow ? t : { top, size, overflow }));
  }, [scrollRef]);
  useLayoutEffect(() => {
    measure();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);
  return thumb;
}
