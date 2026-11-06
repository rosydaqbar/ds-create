import { cn } from '@/lib/cn';
import { Icon } from '@/icons';

/**
 * Neutral stand-in for the payment marks of 1.8 Brand assets (card networks are supplied per build;
 * the template ships none). `sm` = 24 × 16 (Text field `Type=payment`), `md` = 46 × 32 (Choice card).
 * Private: not exported from the library.
 */
export function PaymentMark({ size = 'sm', className }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center border-(length:--border-width-default) border-border-subtle bg-surface-base text-icon-tertiary',
        size === 'sm' ? 'h-(--size-icon-sm) w-(--size-icon-lg) rounded-xs' : 'h-(--size-icon-xl) w-[2.875rem] rounded-sm',
        className,
      )}
    >
      <Icon name="commerce/credit-card" size={size === 'sm' ? 'xs' : 'md'} />
    </span>
  );
}
