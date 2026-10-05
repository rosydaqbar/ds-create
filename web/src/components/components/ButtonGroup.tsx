import { useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { ForcedState } from '@/lib/types';
import type { IconName } from '@/icons';
import { ButtonGroupItemPart, type ButtonGroupSize } from './_ButtonGroupItem';

export type { ButtonGroupSize };

/**
 * 3.1 Button group — two to five related actions joined into one connected control.
 * Figma: `Button group` · Size × Icon only (4 variants), built from `.Main/Button group item`
 * (Size × Icon only × Selected × State, 32 variants; private, in `_ButtonGroupItem.tsx`).
 *
 * Behaviour (WAI-ARIA):
 * - `behavior="switcher"` (default): a radio group. One tab stop; arrow keys move and select; `aria-checked`.
 * - `behavior="toolbar"`: a toolbar of buttons. One tab stop; arrow keys move focus; Enter / Space activate;
 *   items with `selected` are toggle buttons (`aria-pressed`).
 */

export interface ButtonGroupItemData {
  /** Identifies the item in `value` / `onValueChange`. */
  value: string;
  /** Item `Label`. For icon-only items it becomes the accessible name. */
  label: string;
  /** Item `Show leading icon` + `Leading icon`; the only glyph when the group is icon-only. */
  leadingIcon?: IconName;
  /** Item `Show dot`: a status marker before the label (replaces the icon). */
  showDot?: boolean;
  /** Item `State=disabled`. */
  disabled?: boolean;
  /** Toolbar only: toggle state of the item (`aria-pressed`). Omit for a plain action. */
  selected?: boolean;
  /** Documentation only: Figma item `State=hover` or `State=focus`. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
}

/* ---------- Button group ---------- */

export interface ButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> {
  /** Figma `Size`. */
  size?: ButtonGroupSize;
  /** Figma `Icon only`: every item is a square icon segment (its `label` is the accessible name). */
  iconOnly?: boolean;
  /** The segments (two to five). */
  items: ButtonGroupItemData[];
  /** `switcher`: one selected value (radio group). `toolbar`: actions or toggles (toolbar). */
  behavior?: 'switcher' | 'toolbar';
  /** Switcher: the selected item's value. Omit for uncontrolled. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Toolbar: called with the activated item's value. */
  onItemClick?: (value: string) => void;
  /** Accessible name of the group ("Calendar view", "Text formatting"). */
  'aria-label'?: string;
  /** Optional per-item wrapper, e.g. a Tooltip around icon-only items. */
  renderItem?: (item: ButtonGroupItemData, node: ReactElement<Record<string, unknown>>) => ReactNode;
}

export function ButtonGroup({
  size = 'md',
  iconOnly = false,
  items,
  behavior = 'switcher',
  value,
  defaultValue,
  onValueChange,
  onItemClick,
  renderItem,
  className,
  ...rest
}: ButtonGroupProps) {
  const switcher = behavior === 'switcher';
  const [inner, setInner] = useState(defaultValue ?? (switcher ? items.find((i) => !i.disabled)?.value : undefined));
  const selectedValue = value !== undefined ? value : inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = items.findIndex((it) => it.value === selectedValue);
  // Roving tab stop: the selected item (switcher), else the first enabled item.
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const tabStop = focusIndex ?? (switcher && selectedIndex >= 0 && !items[selectedIndex].disabled ? selectedIndex : enabled[0]);

  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  const move = (from: number, dir: 1 | -1 | 'first' | 'last') => {
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(from);
    const nextPos =
      dir === 'first' ? 0 : dir === 'last' ? enabled.length - 1 : (pos + dir + enabled.length) % enabled.length;
    const next = enabled[nextPos];
    setFocusIndex(next);
    refs.current[next]?.focus();
    if (switcher) select(items[next].value);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') (e.preventDefault(), move(i, 1));
    else if (k === 'ArrowLeft' || k === 'ArrowUp') (e.preventDefault(), move(i, -1));
    else if (k === 'Home') (e.preventDefault(), move(i, 'first'));
    else if (k === 'End') (e.preventDefault(), move(i, 'last'));
  };

  return (
    <div
      role={switcher ? 'radiogroup' : 'toolbar'}
      aria-orientation={switcher ? undefined : 'horizontal'}
      className={cn(
        'inline-flex shrink-0 rounded-control border-(length:--border-width-default) border-border-default bg-surface-base shadow-control',
        className,
      )}
      {...rest}
    >
      {items.map((it, i) => {
        const isSelected = switcher ? it.value === selectedValue : !!it.selected;
        const node = (
          <ButtonGroupItemPart
            key={it.value}
            buttonRef={(el) => (refs.current[i] = el)}
            size={size}
            iconOnly={iconOnly}
            selected={isSelected}
            label={it.label}
            leadingIcon={it.leadingIcon}
            showDot={it.showDot}
            showDivider={i > 0}
            edge={items.length === 1 ? 'only' : i === 0 ? 'first' : i === items.length - 1 ? 'last' : undefined}
            disabled={it.disabled}
            forceState={it.forceState}
            tabIndex={i === tabStop ? 0 : -1}
            role={switcher ? 'radio' : undefined}
            aria-checked={switcher ? isSelected : undefined}
            aria-pressed={!switcher && it.selected !== undefined ? it.selected : undefined}
            onFocus={() => setFocusIndex(i)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onClick={() => {
              setFocusIndex(i);
              if (switcher) select(it.value);
              else onItemClick?.(it.value);
            }}
          />
        );
        return renderItem ? <span key={it.value} className="flex">{renderItem(it, node)}</span> : node;
      })}
    </div>
  );
}
