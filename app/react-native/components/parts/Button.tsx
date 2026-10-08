import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { anatomy, toEasing, useTheme, type TextStyleName, type Theme, type ThemeShadows } from '../../theme';
import { Icon, type IconName } from '../../icons';
import { a11yState, dim, FocusRing, num, role, touchSlop, useInteraction, useStateColors, type Interaction } from './_shared';

/**
 * 2.1 Button: actions people can take.
 * Figma: `Button` · Size × Emphasis × Tone × State × Icon only (360 variants).
 *
 * Props are the Figma properties (APP.md §6.1). Figma `State` is not a prop: pressed, hovered
 * (iPad pointer) and focused (hardware keyboard) come from the platform; `disabled` and
 * `loading` are props; `previewState` pins a state on the web docs site only.
 *
 * Tokens are read with a fallback (`num`, `dim`, `role` in ./_shared): a Figma file without
 * component tokens (`button/*`, `size/control/*`) still gets a working button from its semantic
 * tokens. Replace the fallbacks with the file's own tokens when the brand has them.
 */

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonEmphasis = 'primary' | 'secondary' | 'tertiary';
export type ButtonTone = 'brand' | 'danger';
/** Documentation only: pins a platform state, like `forceState` on the web. */
export type ButtonPreviewState = 'hover' | 'pressed' | 'focus';

export interface ButtonProps {
  /** Figma `Label`. Always required: for icon-only buttons it is the name screen readers announce. */
  label: string;
  /** Figma `Size`. Sets the height, padding, gap and label style. */
  size?: ButtonSize;
  /** Figma `Emphasis`. Solid fill, bordered surface, or no container. */
  emphasis?: ButtonEmphasis;
  /** Figma `Tone`. `danger` for destructive actions. */
  tone?: ButtonTone;
  /** Figma `Show leading icon` + `Leading icon`. The only glyph when `iconOnly`. */
  leadingIcon?: IconName;
  /** Any node in the leading icon box (a brand mark, an avatar); wins over `leadingIcon`. */
  leadingVisual?: ReactNode;
  /** Figma `Show trailing icon` + `Trailing icon`. */
  trailingIcon?: IconName;
  /** Figma `Icon only=true`: a square button with one icon; `label` becomes its accessibility label. */
  iconOnly?: boolean;
  /** Figma `State=loading`: a spinner in the leading slot, presses ignored, announced as busy. */
  loading?: boolean;
  /** Figma `Show loading text`: keeps the label next to the spinner while loading. */
  showLoadingText?: boolean;
  /** Figma `State=disabled`. */
  disabled?: boolean;
  /** Stretch to the container width. The content stays centered. */
  fullWidth?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Extra context for screen readers, e.g. what happens after the press. */
  accessibilityHint?: string;
  /** Documentation only. Pins the hover, pressed or focus look on the web docs site. */
  previewState?: ButtonPreviewState;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface StateColors {
  fill: string;
  border: string;
  label: string;
  icon: string;
}

/**
 * `size/control/*`, `button/padding-x/*`, `button/gap/*` and the label style for each size (spec §4).
 * Without component tokens: the control size, then the space scale.
 */
function sizeTokens(theme: Theme, size: ButtonSize) {
  const c = theme.component;
  const table = {
    xs: { height: dim('size', 'controlXs', 32), paddingX: num(c.buttonPaddingXXs, dim('space', 'md', 8)), gap: num(c.buttonGapXs, dim('space', 'xs', 4)), text: 'bodySmSemibold' },
    sm: { height: dim('size', 'controlSm', 36), paddingX: num(c.buttonPaddingXSm, dim('space', 'lg', 12)), gap: num(c.buttonGapSm, dim('space', 'xs', 4)), text: 'bodySmSemibold' },
    md: { height: dim('size', 'controlMd', 40), paddingX: num(c.buttonPaddingXMd, dim('space', 'lg', 12)), gap: num(c.buttonGapMd, dim('space', 'sm', 6)), text: 'bodySmSemibold' },
    lg: { height: dim('size', 'controlLg', 44), paddingX: num(c.buttonPaddingXLg, dim('space', 'xl', 16)), gap: num(c.buttonGapLg, dim('space', 'sm', 6)), text: 'bodyMdSemibold' },
    xl: { height: dim('size', 'controlXl', 48), paddingX: num(c.buttonPaddingXXl, dim('space', 'xl', 16)), gap: num(c.buttonGapXl, dim('space', 'md', 8)), text: 'bodyMdSemibold' },
  } satisfies Record<ButtonSize, { height: number; paddingX: number; gap: number; text: string }>;
  return table[size];
}

/**
 * The token map (spec §7): rest, hover and pressed colors for one emphasis and tone. Each part takes
 * the first role the brand has (`role` in ./_shared), so a file without hover or pressed roles keeps
 * its rest color instead of drawing nothing.
 */
function interactionColors(theme: Theme, emphasis: ButtonEmphasis, tone: ButtonTone): Record<Interaction, StateColors> {
  const r = (...keys: string[]) => role(theme, keys);
  const none = r('fillNone');
  const danger = tone === 'danger';
  // The solid fill, then the names other files give the action color, then a role every file has.
  const solid = danger ? 'fillDangerSolid' : 'fillBrandSolid';
  const solidChain = danger ? [solid, 'fillDanger', 'textDanger', 'textPrimary'] : [solid, 'fillPrimarySolid', 'fillPrimary', 'fillAccentSolid', 'fillAccent', 'surfaceBrandSolid', 'textBrand', 'textPrimary'];
  switch (emphasis) {
    case 'primary': {
      const fg = { border: none, label: r('textOnSolid', 'textInverse', 'surfaceBase'), icon: r('iconOnSolid', 'textOnSolid', 'textInverse', 'surfaceBase') };
      return {
        rest: { ...fg, fill: r(...solidChain) },
        hover: { ...fg, fill: r(`${solid}Hover`, ...solidChain) },
        pressed: { ...fg, fill: r(`${solid}Pressed`, `${solid}Hover`, ...solidChain) },
      };
    }
    case 'secondary':
      if (danger)
        return {
          rest: { fill: r('surfaceBase'), border: r('borderDangerSubtle', 'borderDanger'), label: r('textDanger'), icon: r('iconDanger', 'textDanger') },
          hover: { fill: r('fillDangerSubtleHover', 'fillDangerSubtle', 'surfaceBase'), border: r('borderDangerSubtle', 'borderDanger'), label: r('textDangerHover', 'textDanger'), icon: r('textDangerHover', 'textDanger') },
          pressed: { fill: r('fillDangerSubtlePressed', 'fillDangerSubtle', 'surfaceBase'), border: r('borderDangerSubtle', 'borderDanger'), label: r('textDanger'), icon: r('iconDanger', 'textDanger') },
        };
      return {
        rest: { fill: r('surfaceBase'), border: r('borderDefault'), label: r('textSecondary', 'textPrimary'), icon: r('iconSecondary', 'textSecondary', 'textPrimary') },
        hover: { fill: r('surfaceBaseHover', 'surfaceBase'), border: r('borderDefault'), label: r('textPrimary'), icon: r('iconPrimary', 'textPrimary') },
        pressed: { fill: r('surfaceBasePressed', 'surfaceBaseHover', 'surfaceBase'), border: r('borderDefault'), label: r('textPrimary'), icon: r('iconPrimary', 'textPrimary') },
      };
    case 'tertiary':
      if (danger)
        return {
          rest: { fill: none, border: none, label: r('textDanger'), icon: r('iconDanger', 'textDanger') },
          hover: { fill: r('fillDangerSubtleHover', 'fillDangerSubtle', 'fillNone'), border: none, label: r('textDangerHover', 'textDanger'), icon: r('textDangerHover', 'textDanger') },
          pressed: { fill: r('fillDangerSubtlePressed', 'fillDangerSubtle', 'fillNone'), border: none, label: r('textDanger'), icon: r('iconDanger', 'textDanger') },
        };
      return {
        rest: { fill: none, border: none, label: r('textSecondary', 'textPrimary'), icon: r('iconSecondary', 'textSecondary', 'textPrimary') },
        hover: { fill: r('fillNeutralSubtleHover', 'surfaceBaseHover', 'fillNone'), border: none, label: r('textPrimary'), icon: r('iconPrimary', 'textPrimary') },
        pressed: { fill: r('fillNeutralSubtlePressed', 'fillNeutralSubtleHover', 'surfaceBasePressed', 'fillNone'), border: none, label: r('textPrimary'), icon: r('iconPrimary', 'textPrimary') },
      };
  }
}

/** Disabled colors (all emphasis, both tones). */
function disabledColors(theme: Theme, emphasis: ButtonEmphasis): StateColors {
  const r = (...keys: string[]) => role(theme, keys);
  const fg = { label: r('textDisabled', 'textTertiary', 'textSecondary'), icon: r('iconDisabled', 'textDisabled', 'textTertiary', 'textSecondary') };
  if (emphasis === 'primary') return { ...fg, fill: r('fillNeutralSubtleDisabled', 'fillDisabled', 'surfaceSunken', 'surfaceBase'), border: r('borderDisabled', 'borderSubtle', 'fillNone') };
  if (emphasis === 'secondary') return { ...fg, fill: r('surfaceBase'), border: r('borderDisabled', 'borderSubtle', 'borderDefault') };
  return { ...fg, fill: r('fillNone'), border: r('fillNone') };
}

export function Button({
  label,
  size = 'md',
  emphasis = 'primary',
  tone = 'brand',
  leadingIcon,
  leadingVisual,
  trailingIcon,
  iconOnly = false,
  loading = false,
  showLoadingText = true,
  disabled = false,
  fullWidth = false,
  onPress,
  onLongPress,
  accessibilityHint,
  previewState,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const s = sizeTokens(theme, size);
  const interactive = !disabled && !loading;

  // Platform states (pressed, pointer hover, keyboard focus); `previewState` pins one on the docs site.
  const { interaction, focused, handlers } = useInteraction(!interactive, previewState);
  const showFocus = !disabled && focused;

  // Press feedback: fast · standard (APP.md §6.3). Previews jump straight to the pinned state.
  const states = interactionColors(theme, emphasis, tone);
  const current: StateColors = disabled ? disabledColors(theme, emphasis) : states[interaction];
  const stateColor = useStateColors(states as Record<Interaction, Record<keyof StateColors, string>>, interaction, !!previewState);
  const animate = (pick: keyof StateColors) => (disabled ? current[pick] : stateColor(pick));

  // Depth only on primary and secondary, never when disabled (spec §7). Absent when the brand has no depth.
  const elevation: Partial<ThemeShadows> = theme.shadows;
  const depth = !disabled && emphasis !== 'tertiary' ? (elevation as Record<string, ViewStyle | undefined>).elevationControl : undefined;

  // Touch target: grow the hit area, never the visual size (APP.md §6.2).
  const hitSlop = touchSlop(theme.touchTarget, s.height, iconOnly ? s.height : undefined);
  const radius = dim('radius', 'control', 8);

  const showText = !iconOnly && (!loading || showLoadingText);
  const leading = loading ? (
    <ButtonSpinner color={current.icon} />
  ) : (
    leadingVisual ?? ((leadingIcon || iconOnly) && <Icon name={leadingIcon ?? 'general/plus'} size="md" color={current.icon} anatomyPart="leading-icon" />)
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      // iOS and Android read accessibilityState; react-native-web reads the aria-* props it also sets.
      {...a11yState({ disabled, busy: loading })}
      disabled={disabled}
      focusable={!disabled}
      hitSlop={hitSlop}
      onPress={interactive ? onPress : undefined}
      onLongPress={interactive ? onLongPress : undefined}
      {...handlers}
      style={[fullWidth ? styles.fullWidth : styles.hug, style]}
    >
      <Animated.View
        {...anatomy('root')}
        style={[
          styles.root,
          {
            minHeight: s.height,
            gap: s.gap,
            paddingHorizontal: iconOnly ? 0 : s.paddingX,
            borderRadius: radius,
            borderWidth: dim('borderWidth', 'default', 1),
            backgroundColor: animate('fill'),
            borderColor: animate('border'),
          },
          iconOnly && { width: s.height, height: s.height },
          depth,
        ]}
      >
        {leading || null}
        {showText && (
          <View {...anatomy('text-padding')} style={[styles.textPadding, { paddingHorizontal: dim('space', 'optical', 2) }]}>
            <Animated.Text {...anatomy('label')} allowFontScaling style={[theme.text(s.text as TextStyleName), styles.label, { color: animate('label') }]}>
              {label}
            </Animated.Text>
          </View>
        )}
        {!iconOnly && !loading && trailingIcon && <Icon name={trailingIcon} size="md" color={current.icon} anatomyPart="trailing-icon" />}
        {showFocus && <FocusRing radius={radius} color={tone === 'danger' ? role(theme, ['borderDanger', 'textDanger']) : undefined} />}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Stand-in for 2.15 Spinner until that page is built: same box as the icon (`size/icon/md`),
 * `spinner/thickness/md`, one turn per `motion/duration/loop` (slower under Reduced motion),
 * in the label color. Replace with `<Spinner size="md" tone="current" />` once 2.15 exists.
 */
function ButtonSpinner({ color }: { color: string }) {
  const theme = useTheme();
  const motion = theme.motion as unknown as Record<string, number | readonly number[] | undefined>;
  const duration = num(motion.durationLoop, 900);
  const easing = (motion.easingLinear as readonly number[] | undefined) ?? [0, 0, 1, 1];
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    turn.setValue(0);
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration, easing: toEasing(easing), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [turn, duration, easing]);

  const box = dim('size', 'iconMd', 20);
  const ring: ViewStyle = { borderRadius: dim('radius', 'full', 9999), borderWidth: num(theme.component.spinnerThicknessMd, 2) };
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View
      {...anatomy('spinner')}
      style={{ width: box, height: box }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Track: the label color at 25%, as the web's color-mix(currentColor 25%). */}
      <View style={[StyleSheet.absoluteFill, ring, { borderColor: color, opacity: SPINNER_TRACK_OPACITY }]} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          ring,
          { borderColor: role(theme, ['fillNone']), borderTopColor: color, transform: [{ rotate }] },
        ]}
      />
    </View>
  );
}

const SPINNER_TRACK_OPACITY = 0.25;

const styles = StyleSheet.create({
  hug: { alignSelf: 'flex-start' },
  fullWidth: { alignSelf: 'stretch' },
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  // The label may wrap only at the largest accessibility text sizes; it never clips (APP.md §6.2).
  textPadding: { flexShrink: 1 },
  label: { textAlign: 'center' },
});
