import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import { Icon } from '@/icons';

/**
 * 2.13 Tooltip — describes or identifies an element on hover or focus.
 * Figma: `Tooltip` · Placement (7 variants) and `Help icon` · State × Placement (21 variants).
 * `TooltipBubble` is the static surface (the Figma set); `Tooltip` wraps a trigger and opens
 * the bubble on hover (after motion/delay/tooltip) and keyboard focus; `HelpIcon` is the field help trigger.
 */

export type TooltipPlacement = 'none' | 'top' | 'top-start' | 'top-end' | 'bottom' | 'left' | 'right';
export const tooltipPlacements: readonly TooltipPlacement[] = ['none', 'top', 'top-start', 'top-end', 'bottom', 'left', 'right'];

/* ---------- .Main/Tooltip arrow ---------- */
// 16 × 6 (6 × 16 for left/right) — no size token exists for the arrow; the Figma part is fixed.
const ARROW_LONG = 16;
const ARROW_SHORT = 6;

function TooltipArrow({ edge }: { edge: 'top' | 'bottom' | 'left' | 'right' }) {
  const horizontal = edge === 'top' || edge === 'bottom';
  const w = horizontal ? ARROW_LONG : ARROW_SHORT;
  const h = horizontal ? ARROW_SHORT : ARROW_LONG;
  // Triangle pointing away from the Content.
  const points = {
    bottom: `0,0 ${w},0 ${w / 2},${h}`,
    top: `0,${h} ${w},${h} ${w / 2},0`,
    right: `0,0 0,${h} ${w},${h / 2}`,
    left: `${w},0 ${w},${h} 0,${h / 2}`,
  }[edge];
  return (
    <svg aria-hidden data-anatomy="arrow" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block shrink-0 fill-surface-inverse">
      <polygon points={points} />
    </svg>
  );
}

/* ---------- Tooltip (the Figma set) ---------- */
export interface TooltipBubbleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Placement`: where the Tooltip sits relative to its trigger; the arrow is on the opposite edge. */
  placement?: TooltipPlacement;
  /** Figma `Text`. A short phrase without a full stop. */
  text?: ReactNode;
  /** Figma `Show supporting text` + `Supporting text`. Present = shown. */
  supportingText?: ReactNode;
  /** Extra content after the text on the same line (e.g. a Kbd shortcut). */
  trailing?: ReactNode;
}

export function TooltipBubble({ placement = 'top', text = 'This is a tooltip', supportingText, trailing, className, ...rest }: TooltipBubbleProps) {
  const withSupporting = supportingText != null && supportingText !== '';
  const side = placement === 'left' || placement === 'right';
  const arrowEdge = placement.startsWith('top') ? 'bottom' : placement === 'bottom' ? 'top' : placement === 'left' ? 'right' : 'left';
  const arrowFirst = placement === 'bottom' || placement === 'right';
  const arrowRow =
    placement === 'none' ? null : (
      <div
        className={cn(
          'flex shrink-0',
          side ? 'flex-col justify-center' : 'px-lg',
          placement === 'top-start' ? 'justify-start' : placement === 'top-end' ? 'justify-end' : 'justify-center',
          side && 'self-stretch',
        )}
      >
        <TooltipArrow edge={arrowEdge} />
      </div>
    );
  return (
    <div data-anatomy="tooltip" className={cn('inline-flex w-max', side ? 'flex-row items-stretch' : 'flex-col', className)} {...rest}>
      {arrowFirst && arrowRow}
      <div
        data-anatomy="content"
        className={cn(
          'flex max-w-(--size-width-xxs) flex-col gap-xs rounded-surface bg-surface-inverse shadow-overlay',
          withSupporting ? 'p-lg text-start' : 'px-lg py-md text-center',
        )}
      >
        <span data-anatomy="text" className={cn('type-body-xs-semibold text-text-inverse', trailing != null && 'inline-flex items-center gap-sm')}>
          {text}
          {trailing}
        </span>
        {withSupporting && <span data-anatomy="supporting-text" className="type-body-xs-medium text-text-inverse">{supportingText}</span>}
      </div>
      {!arrowFirst && arrowRow}
    </div>
  );
}

/* ---------- positioning ---------- */
/** Absolute position of the bubble wrapper around a trigger. The gap (`space/xs`) is padding, so the pointer can move onto the bubble without closing it. */
const popupPosition: Record<Exclude<TooltipPlacement, 'none'>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 pb-xs',
  'top-start': 'bottom-full left-[calc(50%-var(--space-lg)-8px)] pb-xs',
  'top-end': 'bottom-full right-[calc(50%-var(--space-lg)-8px)] pb-xs',
  bottom: 'top-full left-1/2 -translate-x-1/2 pt-xs',
  left: 'right-full top-1/2 -translate-y-1/2 pr-xs',
  right: 'left-full top-1/2 -translate-y-1/2 pl-xs',
};

/** Flip to the opposite side, or to -start/-end, when the bubble would leave the viewport. */
function fitPlacement(p: TooltipPlacement, r: DOMRect): TooltipPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (p.startsWith('top') && r.top < 0) return 'bottom';
  if (p === 'bottom' && r.bottom > vh) return 'top';
  if (p === 'left' && r.left < 0) return 'right';
  if (p === 'right' && r.right > vw) return 'left';
  if (p === 'top' && r.right > vw) return 'top-end';
  if (p === 'top' && r.left < 0) return 'top-start';
  return p;
}

function readDelay() {
  if (typeof window === 'undefined') return 400;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--motion-delay-tooltip').trim();
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 400;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}

interface PopupProps {
  id: string;
  open: boolean;
  placement: TooltipPlacement;
  text: ReactNode;
  supportingText?: ReactNode;
  trailing?: ReactNode;
  /** Pointer position for `Placement=none` (relative to the trigger wrapper). */
  point?: { x: number; y: number } | null;
  /** Flip to fit the viewport (off for documentation specimens that are forced open). */
  fit?: boolean;
}

function TooltipPopup({ id, open, placement, text, supportingText, trailing, point, fit = true }: PopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fitted, setFitted] = useState<TooltipPlacement>(placement);
  const measuredFor = useRef<TooltipPlacement | null>(null);
  // Measure once per opening, from the requested placement, so a flip never oscillates.
  useLayoutEffect(() => {
    if (!open) {
      measuredFor.current = null;
      setFitted(placement);
      return;
    }
    if (measuredFor.current === placement) return;
    measuredFor.current = placement;
    if (!fit || !ref.current || placement === 'none') { setFitted(placement); return; }
    setFitted(fitPlacement(placement, ref.current.getBoundingClientRect()));
  }, [open, placement, fit]);

  const follow = placement === 'none';
  const style: CSSProperties | undefined = follow
    ? point
      ? { left: point.x, top: point.y, transform: 'translate(-50%, -100%)' }
      : { left: '50%', bottom: '100%', transform: 'translateX(-50%)' }
    : undefined;
  return (
    <div
      ref={ref}
      role="tooltip"
      id={id}
      style={style}
      className={cn(
        // 1.6 Motion: tooltips enter at base · enter and leave at fast · exit.
        'absolute z-50 transition-[opacity,visibility,scale]',
        follow ? (point ? 'pb-md' : 'pb-xs') : popupPosition[fitted as Exclude<TooltipPlacement, 'none'>],
        open
          ? 'visible scale-100 opacity-100 duration-(--motion-duration-base) ease-enter'
          : 'pointer-events-none invisible scale-(--motion-scale-from) opacity-0 duration-(--motion-duration-fast) ease-exit',
        follow && 'pointer-events-none',
      )}
    >
      <TooltipBubble placement={follow ? 'none' : fitted} text={text} supportingText={supportingText} trailing={trailing} />
    </div>
  );
}

/** Shared open/close behaviour: hover after the tooltip delay, keyboard focus at once, Escape closes. */
function useTooltipState(forced?: boolean) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const clear = () => window.clearTimeout(timer.current);
  const show = useCallback((delayed: boolean) => {
    clear();
    if (delayed) timer.current = window.setTimeout(() => setOpen(true), readDelay());
    else setOpen(true);
  }, []);
  const hide = useCallback(() => {
    clear();
    setOpen(false);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hide]);
  useEffect(() => clear, []);
  return { open: open || !!forced, setOpen, show, hide };
}

/* ---------- Tooltip (interactive wrapper) ---------- */
export interface TooltipProps {
  /** The trigger: one focusable element (a Button, an Icon button, a link). */
  children: ReactElement<Record<string, unknown>>;
  /** Figma `Text`. */
  text: ReactNode;
  /** Figma `Show supporting text` + `Supporting text`. */
  supportingText?: ReactNode;
  /** Figma `Placement`. `none` follows the pointer. The bubble flips when it would leave the viewport. */
  placement?: TooltipPlacement;
  /** Extra content after the text, e.g. a Kbd shortcut. */
  trailing?: ReactNode;
  /** Documentation only: keep the tooltip open. */
  open?: boolean;
  className?: string;
}

export function Tooltip({ children, text, supportingText, placement = 'top', trailing, open: forcedOpen, className }: TooltipProps) {
  const id = useId();
  const { open, show, hide } = useTooltipState(forcedOpen);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' '),
      })
    : children;

  return (
    <span
      ref={wrap}
      className={cn('relative inline-flex', className)}
      onPointerEnter={(e) => e.pointerType !== 'touch' && show(true)}
      onPointerLeave={hide}
      onPointerMove={(e) => {
        if (placement !== 'none' || !wrap.current) return;
        const r = wrap.current.getBoundingClientRect();
        setPoint({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onFocus={(e) => (e.target as HTMLElement).matches(':focus-visible') && show(false)}
      onBlur={hide}
      onPointerDown={hide}
    >
      {trigger}
      <TooltipPopup id={id} open={open} placement={placement} text={text} supportingText={supportingText} trailing={trailing} point={point} fit={!forcedOpen} />
    </span>
  );
}

/* ---------- Help icon ---------- */
export interface HelpIconProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Tooltip `Text`: the short explanation. */
  text?: ReactNode;
  /** Figma `Show supporting text` + Tooltip `Supporting text`. */
  supportingText?: ReactNode;
  /** Figma `Placement`. `none` places the tooltip above the icon without an arrow. */
  placement?: TooltipPlacement;
  /** Accessible name of the trigger, e.g. "More information about Tax ID". */
  label?: string;
  /** Figma `Show cursor`: documentation specimen, only with `forceState="hover"`. */
  showCursor?: boolean;
  /** Documentation only: Figma `State=hover` or `State=focus` (opens the tooltip statically). */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
  /** Icon box: `sm` (16) by default; Label `Size=sm` uses `xs` (12). */
  iconSize?: 'xs' | 'sm';
}

function CursorSpecimen() {
  // Pointer specimen for mockups (Figma `Show cursor`); decorative.
  return (
    <svg aria-hidden data-anatomy="cursor" viewBox="0 0 16 20" className="pointer-events-none absolute left-[60%] top-[55%] z-10 h-(--size-icon-md) w-(--size-icon-md)">
      <path d="M1 1 L1 15 L5 11.5 L8 18 L10.5 17 L7.6 10.6 L13 10.6 Z" className="fill-text-primary stroke-surface-base" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function HelpIcon({
  text = 'This is a tooltip',
  supportingText,
  placement = 'top',
  label = 'More information',
  showCursor = false,
  forceState,
  iconSize = 'sm',
  className,
  ...rest
}: HelpIconProps) {
  const id = useId();
  const { open, setOpen, show, hide } = useTooltipState(!!forceState);
  const lastPointer = useRef<string>('mouse');
  const root = useRef<HTMLSpanElement>(null);

  // Touch: tap elsewhere closes.
  useEffect(() => {
    if (!open || forceState) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) hide();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, forceState, hide]);

  return (
    <span
      ref={root}
      className={cn('relative inline-flex shrink-0', iconSize === 'xs' ? 'size-(--size-icon-xs)' : 'size-(--size-icon-sm)')}
      onPointerEnter={(e) => e.pointerType !== 'touch' && show(true)}
      onPointerLeave={(e) => e.pointerType !== 'touch' && hide()}
    >
      <button
        data-anatomy="help-icon"
        type="button"
        aria-label={label}
        aria-describedby={id}
        className={cn(
          'inline-flex size-full cursor-pointer items-center justify-center rounded-full text-icon-tertiary outline-none',
          'transition-[color,box-shadow] duration-(--motion-duration-fast) ease-standard',
          'is-hover:text-icon-tertiary-hover is-focus:text-icon-tertiary-hover is-focus:shadow-focus-default',
          className,
        )}
        {...forceAttr(forceState)}
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        onClick={() => lastPointer.current === 'touch' && setOpen((o) => !o)}
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && show(false)}
        onBlur={hide}
        {...rest}
      >
        <Icon name="alerts/help-circle" size={iconSize} />
      </button>
      <TooltipPopup id={id} open={open} placement={placement} text={text} supportingText={supportingText} fit={!forceState} />
      {showCursor && forceState === 'hover' && <CursorSpecimen />}
    </span>
  );
}
