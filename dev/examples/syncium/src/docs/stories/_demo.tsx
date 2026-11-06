/**
 * Documentation-only composition surfaces used by several doc modules (a field stack, a card).
 * Not exported from the library; real fields are 3.2 Text field.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** True when the caller sets an explicit width (utilities don't merge, so w-full would compete). */
const hasWidth = (c?: string) => !!c && /(^|\s)w-/.test(c);

/** A field stack: label → control → hint, gap space/sm (owned by the field, as in 3.2). */
export function DemoField({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-sm', !hasWidth(className) && 'w-full', className)}>{children}</div>;
}

export function DemoCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-lg rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-raised p-xl shadow-raised', className)}>{children}</div>;
}
