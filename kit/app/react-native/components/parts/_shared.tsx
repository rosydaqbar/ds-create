import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, View, type AccessibilityState, type AccessibilityValue, type Insets } from 'react-native';
import { dimensions } from '../../tokens/tokens';
import { toEasing, useTheme, type Theme } from '../../theme';

/**
 * Internal helpers shared by the preview components. Files starting with `_` stay private (never
 * exported from the library), like `.Main` parts in Figma.
 */

/* ---------- tokens that a brand may not have ---------- */

/**
 * A number token with a fallback. An existing Figma file can have its own naming, or no component
 * tokens at all; the reference components then keep working from the semantic tokens instead.
 * `num(theme.component.buttonGapMd, dim('space', 'sm', 6))`.
 */
export function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A dimension token by group and member (`dim('size', 'controlMd', 40)`), or the fallback when the file has none. */
export function dim(group: string, key: string, fallback: number): number {
  const g = (dimensions as unknown as Record<string, Record<string, unknown> | undefined>)[group];
  return num(g?.[key], fallback);
}

/** The first color role the brand has, from `theme.color` then `theme.component` (`role(theme, ['fillBrandSolidHover', 'fillBrandSolid'])`). */
export function role(theme: Theme, keys: readonly string[], fallback = 'transparent'): string {
  const c = theme.color as unknown as Record<string, string | undefined>;
  const k = theme.component as Record<string, string | number | undefined>;
  for (const key of keys) {
    const v = c[key] ?? k[key];
    if (typeof v === 'string') return v;
  }
  return fallback;
}

/* ---------- accessibility ---------- */

/**
 * The accessibility state, for every platform. iOS and Android read `accessibilityState`;
 * react-native-web ignores it and reads the `aria-*` props, so both are set. Spread it on the
 * element that has the role: `<Pressable accessibilityRole="checkbox" {...a11yState({ checked })} />`.
 */
export function a11yState(state: AccessibilityState) {
  return {
    accessibilityState: state,
    'aria-disabled': state.disabled || undefined,
    'aria-busy': state.busy || undefined,
    'aria-checked': state.checked,
    'aria-selected': state.selected,
    'aria-expanded': state.expanded,
  } as const;
}

/**
 * The accessibility value (progress, sliders), for every platform: `accessibilityValue` for iOS and
 * Android, the `aria-value*` props for react-native-web, which ignores `accessibilityValue`.
 */
export function a11yValue(value: AccessibilityValue) {
  return {
    accessibilityValue: value,
    'aria-valuemin': value.min,
    'aria-valuemax': value.max,
    'aria-valuenow': value.now,
    'aria-valuetext': value.text,
  } as const;
}

/**
 * ARIA attributes React Native has no prop for (`aria-current`, `aria-controls`): react-native-web
 * renders them, iOS and Android have no equivalent, so they are passed on the web only.
 */
export function webAria(props: Record<`aria-${string}`, string | boolean | undefined>) {
  return Platform.OS === 'web' ? props : {};
}

/**
 * A control part (Radio, Checkbox, Switch) drawn inside a larger control that owns the state: a
 * selectable row or card is the radio, and the Radio inside only shows it. One element gets the
 * role, the name and the focus; the part inside is hidden from screen readers and never focusable,
 * so the two never nest (a radio inside a radio).
 */
const DecorativeContext = createContext(false);

/** True inside `<DecorativeControl>`: the part drops its role, name, state and focus. */
export const useDecorative = () => useContext(DecorativeContext);

/** The props a control part takes when it is only the visual of a larger control. */
export const decorativeControlProps = {
  accessible: false,
  focusable: false,
  // react-native-web and Android keyboards: out of the tab order.
  tabIndex: -1,
  'aria-hidden': true,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
  // The larger control takes the touch.
  pointerEvents: 'none',
} as const;

/** Marks the control parts inside as visuals of the control around them. Adds no view: the layout is unchanged. */
export function DecorativeControl({ children }: { children: ReactNode }) {
  return <DecorativeContext.Provider value>{children}</DecorativeContext.Provider>;
}

/**
 * The role of a view read as one element with one label (a summary row, a card without an action).
 * On iOS and Android `accessible` already merges it into one element, with no role. On the web an
 * element without a role can't carry a name, so it is a labeled group there.
 */
export const GROUP_ROLE = Platform.OS === 'web' ? 'group' : undefined;

/**
 * The role of a labeled graphic read as one element (a page indicator, PIN dots). On iOS and Android
 * it is plain text: the label is read with no role. On the web an element without a role can't carry
 * a name, so it is an image there.
 */
export const LABELED_GRAPHIC_ROLE = Platform.OS === 'web' ? 'image' : 'text';

/**
 * A scrolling region whose content has nothing to focus (cards without actions). On the web,
 * keyboard users scroll it by focusing it, so it takes a tab stop and a name there. On iOS and
 * Android screen readers scroll it with their own gestures: it adds nothing.
 */
export function scrollRegionProps(label: string) {
  return Platform.OS === 'web' ? ({ focusable: true, tabIndex: 0, role: 'group', accessibilityLabel: label } as const) : {};
}

/* ---------- platform states ---------- */

/** Pressed, hovered (iPad and Android pointer) or at rest. */
export type Interaction = 'rest' | 'hover' | 'pressed';

/**
 * Tracks the platform states of a pressable part. `previewState` pins one on the docs site
 * (the Figma `State` variants); it is documentation only.
 */
export function useInteraction(disabled: boolean, previewState?: 'hover' | 'pressed' | 'focus') {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const interaction: Interaction =
    previewState === 'pressed' || previewState === 'hover' ? previewState : !disabled && pressed ? 'pressed' : !disabled && hovered ? 'hover' : 'rest';
  const handlers = {
    onPressIn: () => setPressed(true),
    onPressOut: () => setPressed(false),
    onHoverIn: () => setHovered(true),
    onHoverOut: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
  return { interaction, focused: !disabled && (previewState === 'focus' || focused), handlers };
}

const INDEX: Record<Interaction, number> = { rest: 0, hover: 1, pressed: 2 };

/**
 * Animates between rest, hover and pressed colors with the press-feedback pairing
 * (motion/duration/fast · motion/easing/standard, workflow/APP.md §6.3). Reduced motion makes it instant.
 * Returns `color(pick)`: the animated color of one part.
 */
export function useStateColors<K extends string>(states: Record<Interaction, Record<K, string>>, interaction: Interaction, pinned: boolean) {
  const theme = useTheme();
  const motion = theme.motion as unknown as Record<string, number | readonly number[] | undefined>;
  const duration = num(motion.durationFast, 120);
  const easing = (motion.easingStandard as readonly number[] | undefined) ?? [0.2, 0, 0, 1];
  const progress = useRef(new Animated.Value(INDEX[interaction])).current;
  useEffect(() => {
    const toValue = INDEX[interaction];
    if (pinned) {
      progress.setValue(toValue);
      return;
    }
    const animation = Animated.timing(progress, { toValue, duration, easing: toEasing(easing), useNativeDriver: false }); // colors can't run on the native driver
    animation.start();
    return () => animation.stop();
  }, [interaction, pinned, progress, duration, easing]);
  return (pick: K) => progress.interpolate({ inputRange: [0, 1, 2], outputRange: [states.rest[pick], states.hover[pick], states.pressed[pick]] });
}

/**
 * Grows the hit area to the platform touch target (44 pt iOS, 48 dp Android) without changing the
 * visible size (workflow/APP.md §6.2).
 */
export function touchSlop(touchTarget: number, height: number, width?: number): Insets | undefined {
  const y = Math.max(0, (touchTarget - height) / 2);
  const x = width === undefined ? 0 : Math.max(0, (touchTarget - width) / 2);
  return y > 0 || x > 0 ? { top: y, bottom: y, left: x, right: x } : undefined;
}

/**
 * Keyboard focus ring for hardware keyboards (workflow/APP.md §6.2): a border in the focus color, drawn just
 * outside the part. Used when the Figma file has no focus variant; the platform rule still applies.
 */
export function FocusRing({ radius, color }: { radius: number; color?: string }) {
  const theme = useTheme();
  const width = dim('borderWidth', 'focus', dim('borderWidth', 'default', 2));
  const inset = dim('space', 'xxs', 2) + width;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -inset,
        bottom: -inset,
        left: -inset,
        right: -inset,
        borderRadius: radius + inset,
        borderWidth: width,
        borderColor: color ?? role(theme, ['borderFocus', 'borderBrand', 'fillBrandSolid', 'textPrimary']),
      }}
    />
  );
}
