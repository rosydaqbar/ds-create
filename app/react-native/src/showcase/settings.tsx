import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Global showcase controls (APP.md §7): color mode, text size and motion, so anyone can check
 * a component under every condition. Product apps don't use this; they follow the system.
 */

export type SchemeChoice = 'system' | 'light' | 'dark';
export type MotionChoice = 'system' | 'standard' | 'reduced';

export interface ShowcaseSettings {
  scheme: SchemeChoice;
  /** Multiplies the device's own text size (see Theme.textScale). */
  textScale: number;
  motion: MotionChoice;
}

/**
 * Preview steps from the smallest to the largest accessibility size, relative to the
 * device's default. iOS reaches about 3.1× at its largest accessibility size, Android 2×.
 */
export const TEXT_SIZES = [
  { label: 'Smallest', value: 0.8 },
  { label: 'Default', value: 1 },
  { label: 'Large', value: 1.35 },
  { label: 'Largest on Android', value: 2 },
  { label: 'Largest on iOS', value: 3.1 },
] as const;

interface SettingsContextValue {
  settings: ShowcaseSettings;
  update: (patch: Partial<ShowcaseSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function ShowcaseSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShowcaseSettings>({ scheme: 'system', textScale: 1, motion: 'system' });
  const value = useMemo(
    () => ({ settings, update: (patch: Partial<ShowcaseSettings>) => setSettings((s) => ({ ...s, ...patch })) }),
    [settings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useShowcaseSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useShowcaseSettings() needs a <ShowcaseSettingsProvider> above it.');
  return value;
}
