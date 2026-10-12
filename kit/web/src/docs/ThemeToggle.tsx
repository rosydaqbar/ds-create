import { createContext, useContext } from 'react';
import { Icon } from '@/icons';
import { cn } from '@/lib/cn';
import { siteSchemes } from './modes';

export const ThemeContext = createContext<{ theme: 'light' | 'dark'; toggle: () => void } | null>(null);

export function ThemeToggle({ className }: { className?: string }) {
  const context = useContext(ThemeContext);
  if (!context || siteSchemes.length < 2) return null;
  const next = context.theme === 'dark' ? 'Light' : 'Dark';
  return (
    <button
      type="button"
      onClick={context.toggle}
      className={cn('docs-theme-toggle type-body-sm-medium inline-flex h-(--size-control-sm) cursor-pointer items-center gap-sm self-start rounded-control border border-border-default px-sm text-text-secondary outline-none is-hover:bg-surface-base-hover md:px-md', className)}
      aria-label={`Switch to ${next} mode`}
    >
      <Icon name={context.theme === 'dark' ? 'weather/sun' : 'weather/moon'} size="sm" />
      <span>{next}</span>
    </button>
  );
}
