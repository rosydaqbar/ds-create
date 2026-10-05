import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { dimensions } from '../../tokens/tokens';
import { toEasing, useTheme, type TextStyleName, type Theme, type ThemeShadows } from '../../theme';
import { Icon, type IconName } from '../../icons';

/**
 * 2.1 Button: actions people can take.
 * Figma: `Button` · Size × Emphasis × Tone × State × Icon only (360 variants).
 *
 * Props are the Figma properties (APP.md §6.1). Figma `State` is not a prop: pressed, hovered
 * (iPad pointer) and focused (hardware keyboard) come from the platform; `disabled` and
 * `loading` are props; `previewState` pins a state in the showcase only.
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
  /** Documentation only. Pins the hover, pressed or focus look in the showcase. */
  previewState?: ButtonPreviewState;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type Interaction = 'rest' | 'hover' | 'pressed';
const INTERACTION_INDEX: Record<Interaction, number> = { rest: 0, hover: 1, pressed: 2 };

interface StateColors {
  fill: string;
  border: string;
  label: string;
  icon: string;
}

/** `size/control/*`, `button/padding-x/*`, `button/gap/*` and the label style for each size (spec §4). */
function sizeTokens(theme: Theme, size: ButtonSize) {
  const c = theme.component;
  const table = {
    xs: { height: dimensions.size.controlXs, paddingX: c.buttonPaddingXXs, gap: c.buttonGapXs, text: 'bodySmSemibold' },
    sm: { height: dimensions.size.controlSm, paddingX: c.buttonPaddingXSm, gap: c.buttonGapSm, text: 'bodySmSemibold' },
    md: { height: dimensions.size.controlMd, paddingX: c.buttonPaddingXMd, gap: c.buttonGapMd, text: 'bodySmSemibold' },
    lg: { height: dimensions.size.controlLg, paddingX: c.buttonPaddingXLg, gap: c.buttonGapLg, text: 'bodyMdSemibold' },
    xl: { height: dimensions.size.controlXl, paddingX: c.buttonPaddingXXl, gap: c.buttonGapXl, text: 'bodyMdSemibold' },
  } satisfies Record<ButtonSize, { height: number; paddingX: number; gap: number; text: TextStyleName }>;
  return table[size];
}

/** The token map (spec §7): rest, hover and pressed colors for one emphasis and tone. */
function interactionColors(theme: Theme, emphasis: ButtonEmphasis, tone: ButtonTone): Record<Interaction, StateColors> {
  const c = theme.color;
  const none = c.fillNone;
  if (tone === 'brand') {
    switch (emphasis) {
      case 'primary': {
        const fg = { border: none, label: c.textOnSolid, icon: c.iconOnSolid };
        return { rest: { ...fg, fill: c.fillBrandSolid }, hover: { ...fg, fill: c.fillBrandSolidHover }, pressed: { ...fg, fill: c.fillBrandSolidPressed } };
      }
      case 'secondary':
        return {
          rest: { fill: c.surfaceBase, border: c.borderDefault, label: c.textSecondary, icon: c.textSecondary },
          hover: { fill: c.surfaceBaseHover, border: c.borderDefault, label: c.textPrimary, icon: c.textPrimary },
          pressed: { fill: c.surfaceBasePressed, border: c.borderDefault, label: c.textPrimary, icon: c.textPrimary },
        };
      case 'tertiary':
        return {
          rest: { fill: none, border: none, label: c.textSecondary, icon: c.textSecondary },
          hover: { fill: c.fillNeutralSubtleHover, border: none, label: c.textPrimary, icon: c.textPrimary },
          pressed: { fill: c.fillNeutralSubtlePressed, border: none, label: c.textPrimary, icon: c.textPrimary },
        };
    }
  }
  switch (emphasis) {
    case 'primary': {
      const fg = { border: none, label: c.textOnSolid, icon: c.iconOnSolid };
      return { rest: { ...fg, fill: c.fillDangerSolid }, hover: { ...fg, fill: c.fillDangerSolidHover }, pressed: { ...fg, fill: c.fillDangerSolidPressed } };
    }
    case 'secondary':
      return {
        rest: { fill: c.surfaceBase, border: c.borderDangerSubtle, label: c.textDanger, icon: c.textDanger },
        hover: { fill: c.fillDangerSubtleHover, border: c.borderDangerSubtle, label: c.textDangerHover, icon: c.textDangerHover },
        pressed: { fill: c.fillDangerSubtlePressed, border: c.borderDangerSubtle, label: c.textDangerHover, icon: c.textDangerHover },
      };
    case 'tertiary':
      return {
        rest: { fill: none, border: none, label: c.textDanger, icon: c.textDanger },
        hover: { fill: c.fillDangerSubtleHover, border: none, label: c.textDangerHover, icon: c.textDangerHover },
        pressed: { fill: c.fillDangerSubtlePressed, border: none, label: c.textDangerHover, icon: c.textDangerHover },
      };
  }
}

/** Disabled colors (all emphasis, both tones). */
function disabledColors(theme: Theme, emphasis: ButtonEmphasis): StateColors {
  const c = theme.color;
  const fg = { label: c.textDisabled, icon: c.textDisabled };
  if (emphasis === 'primary') return { ...fg, fill: c.fillNeutralSubtleDisabled, border: c.borderDisabled };
  if (emphasis === 'secondary') return { ...fg, fill: c.surfaceBase, border: c.borderDisabled };
  return { ...fg, fill: c.fillNone, border: c.fillNone };
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

  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const interactive = !disabled && !loading;

  const interaction: Interaction =
    previewState === 'pressed' || previewState === 'hover'
      ? previewState
      : interactive && pressed
        ? 'pressed'
        : interactive && hovered
          ? 'hover'
          : 'rest';
  const showFocus = !disabled && (previewState === 'focus' || focused);

  // Press feedback: fast · standard (APP.md §6.3). Previews jump straight to the pinned state.
  const progress = useRef(new Animated.Value(INTERACTION_INDEX[interaction])).current;
  useEffect(() => {
    const toValue = INTERACTION_INDEX[interaction];
    if (previewState) {
      progress.setValue(toValue);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue,
      duration: theme.motion.durationFast,
      easing: toEasing(theme.motion.easingStandard),
      useNativeDriver: false, // colors can't run on the native driver
    });
    animation.start();
    return () => animation.stop();
  }, [interaction, previewState, progress, theme.motion.durationFast, theme.motion.easingStandard]);

  const states = interactionColors(theme, emphasis, tone);
  const current: StateColors = disabled ? disabledColors(theme, emphasis) : states[interaction];
  const animate = (pick: (c: StateColors) => string) =>
    disabled
      ? pick(current)
      : progress.interpolate({ inputRange: [0, 1, 2], outputRange: [pick(states.rest), pick(states.hover), pick(states.pressed)] });

  // Depth only on primary and secondary, never when disabled (spec §7). Absent when the brand has no depth.
  const elevation: Partial<ThemeShadows> = theme.shadows;
  const depth = !disabled && emphasis !== 'tertiary' ? elevation.elevationControl : undefined;

  // Touch target: grow the hit area, never the visual size (APP.md §6.2).
  const slopY = Math.max(0, (theme.touchTarget - s.height) / 2);
  const slopX = iconOnly ? slopY : 0;
  const hitSlop: Insets | undefined = slopY > 0 ? { top: slopY, bottom: slopY, left: slopX, right: slopX } : undefined;

  const showText = !iconOnly && (!loading || showLoadingText);
  const leading = loading ? (
    <ButtonSpinner color={current.icon} />
  ) : (
    leadingVisual ?? ((leadingIcon || iconOnly) && <Icon name={leadingIcon ?? 'general/plus'} size="md" color={current.icon} />)
  );

  const focusInset = dimensions.space.xxs + dimensions.borderWidth.focus;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      focusable={!disabled}
      hitSlop={hitSlop}
      onPress={interactive ? onPress : undefined}
      onLongPress={interactive ? onLongPress : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[fullWidth ? styles.fullWidth : styles.hug, style]}
    >
      <Animated.View
        style={[
          styles.root,
          {
            minHeight: s.height,
            gap: s.gap,
            paddingHorizontal: iconOnly ? 0 : s.paddingX,
            borderRadius: dimensions.radius.control,
            borderWidth: dimensions.borderWidth.default,
            backgroundColor: animate((c) => c.fill),
            borderColor: animate((c) => c.border),
          },
          iconOnly && { width: s.height, height: s.height },
          depth,
        ]}
      >
        {leading || null}
        {showText && (
          <View style={[styles.textPadding, { paddingHorizontal: dimensions.space.optical }]}>
            <Animated.Text
              allowFontScaling
              style={[theme.text(s.text), styles.label, { color: animate((c) => c.label) }]}
            >
              {label}
            </Animated.Text>
          </View>
        )}
        {!iconOnly && !loading && trailingIcon && <Icon name={trailingIcon} size="md" color={current.icon} />}
        {showFocus && (
          <View
            pointerEvents="none"
            style={[
              styles.focusRing,
              {
                top: -focusInset,
                bottom: -focusInset,
                left: -focusInset,
                right: -focusInset,
                borderRadius: dimensions.radius.control + focusInset,
                borderWidth: dimensions.borderWidth.focus,
                borderColor: tone === 'danger' ? theme.color.borderDanger : theme.color.borderFocus,
              },
            ]}
          />
        )}
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
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    turn.setValue(0);
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: theme.motion.durationLoop,
        easing: toEasing(theme.motion.easingLinear),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [turn, theme.motion.durationLoop, theme.motion.easingLinear]);

  const box = dimensions.size.iconMd;
  const ring: ViewStyle = { borderRadius: dimensions.radius.full, borderWidth: theme.component.spinnerThicknessMd };
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View
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
          { borderColor: theme.color.fillNone, borderTopColor: color, transform: [{ rotate }] },
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
  focusRing: { position: 'absolute' },
});
