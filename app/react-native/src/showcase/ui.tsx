import React, { type ComponentType, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type AccessibilityRole, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components';
import { Icon } from '../icons';
import { dimensions } from '../tokens/tokens';
import { useTheme, type TextStyleName } from '../theme';
import type { Specimen } from './docs/types';

/**
 * Showcase chrome: the small layout and text pieces every screen shares. They use tokens
 * only, like the components. Swap the stand-ins (TabBar, ChoiceRow) for the system's own
 * components once those pages are built.
 */

const space = dimensions.space;

export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const margin = dimensions.size.containerMarginMobile;
  return (
    <ScrollView
      style={{ backgroundColor: theme.color.surfaceBase }}
      contentContainerStyle={{ padding: margin, paddingBottom: margin + insets.bottom, gap: space.space4xl }}
    >
      {children}
    </ScrollView>
  );
}

type TextTone = 'primary' | 'secondary' | 'tertiary' | 'brand' | 'danger' | 'success';

export interface TxtProps {
  variant?: TextStyleName;
  tone?: TextTone;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}

export function Txt({ variant = 'bodyMdRegular', tone = 'primary', accessibilityRole, style, children }: TxtProps) {
  const theme = useTheme();
  const c = theme.color;
  const color = { primary: c.textPrimary, secondary: c.textSecondary, tertiary: c.textTertiary, brand: c.textBrand, danger: c.textDanger, success: c.textSuccess }[tone];
  return (
    <Text allowFontScaling accessibilityRole={accessibilityRole} style={[theme.text(variant), { color }, style]}>
      {children}
    </Text>
  );
}

export const Title = ({ children }: { children: ReactNode }) => (
  <Txt variant="headingLgSemibold" accessibilityRole="header">{children}</Txt>
);
export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <Txt variant="headingSmSemibold" accessibilityRole="header">{children}</Txt>
);
export const Body = ({ children }: { children: ReactNode }) => <Txt tone="secondary">{children}</Txt>;
export const Caption = ({ children }: { children: ReactNode }) => (
  <Txt variant="bodySmRegular" tone="tertiary">{children}</Txt>
);
export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <Txt variant="bodySmMedium" tone="tertiary">{children}</Txt>
);

export function Header({ eyebrow, title, summary, meta }: { eyebrow?: string; title: string; summary?: string; meta?: ReactNode }) {
  return (
    <View style={{ gap: space.md }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Title>{title}</Title>
      {summary ? <Body>{summary}</Body> : null}
      {meta}
    </View>
  );
}

export function Section({ title, intro, children }: { title?: string; intro?: string; children: ReactNode }) {
  return (
    <View style={{ gap: space.lg }}>
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      {intro ? <Body>{intro}</Body> : null}
      {children}
    </View>
  );
}

/** A specimen area: real instances on a sunken surface. */
export function Stage({ layout = 'row', children, style }: { layout?: Specimen<object>['layout']; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const column = layout === 'column';
  return (
    <View
      style={[
        {
          backgroundColor: theme.color.surfaceSunken,
          borderColor: theme.color.borderSubtle,
          borderWidth: dimensions.borderWidth.default,
          borderRadius: dimensions.radius.surface,
          padding: space.xl,
          gap: space.md,
          flexDirection: column ? 'column' : 'row',
          flexWrap: column ? 'nowrap' : 'wrap',
          alignItems: column ? 'stretch' : 'center',
          justifyContent: layout === 'end' ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Renders a doc specimen (a list of props) with its component. */
export function SpecimenView<P extends object>({ component: Component, specimen }: { component: ComponentType<P>; specimen: Specimen<P> }) {
  return (
    <Stage layout={specimen.layout}>
      {specimen.items.map((props, i) => (
        <Component key={i} {...props} />
      ))}
    </Stage>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const theme = useTheme();
  const style = theme.text('codeSmRegular');
  // The type scale has no code family when the brand uses the system font: fall back to the platform monospace.
  const fontFamily = style.fontFamily ?? Platform.select({ ios: 'Menlo', default: 'monospace' });
  return (
    <ScrollView
      horizontal
      style={{ backgroundColor: theme.color.surfaceSunken, borderRadius: dimensions.radius.surface }}
      contentContainerStyle={{ padding: space.xl }}
    >
      <Text selectable allowFontScaling style={[style, { fontFamily, color: theme.color.textPrimary }]}>
        {code}
      </Text>
    </ScrollView>
  );
}

export function BulletList({ items, marker = 'general/check', tone = 'secondary' }: { items: string[]; marker?: 'general/check' | 'general/x' | 'alerts/info-circle'; tone?: TextTone }) {
  const theme = useTheme();
  const markerColor = marker === 'general/x' ? theme.color.iconDanger : marker === 'general/check' ? theme.color.iconSuccess : theme.color.iconSecondary;
  return (
    <View style={{ gap: space.md }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <Icon name={marker} size="sm" color={markerColor} style={{ marginTop: space.xxs }} />
          <View style={{ flex: 1 }}>
            <Txt tone={tone}>{item}</Txt>
          </View>
        </View>
      ))}
    </View>
  );
}

/** A navigation row. Rows without `onPress` read as "Not built yet". */
export function ListRow({ title, meta, onPress }: { title: string; meta?: string; onPress?: () => void }) {
  const theme = useTheme();
  const enabled = !!onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={meta ? `${title}, ${meta}` : title}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: theme.touchTarget,
        paddingVertical: space.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.lg,
        borderBottomWidth: dimensions.borderWidth.default,
        borderBottomColor: theme.color.borderSubtle,
        backgroundColor: pressed ? theme.color.fillNeutralSubtlePressed : theme.color.fillNone,
      })}
    >
      <View style={{ flex: 1, gap: space.xxs }}>
        <Txt variant="bodyMdMedium" tone={enabled ? 'primary' : 'tertiary'}>{title}</Txt>
        {meta ? <Caption>{meta}</Caption> : null}
      </View>
      {enabled ? <Icon name="arrows/chevron-right" size="md" color={theme.color.iconTertiary} /> : null}
    </Pressable>
  );
}

/**
 * Tabs for component screens. Showcase chrome: the system has no tabs page yet, so this
 * uses a plain underline from tokens.
 */
export function TabBar<T extends string>({ tabs, value, onChange }: { tabs: readonly T[]; value: T; onChange: (tab: T) => void }) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={{ borderBottomWidth: dimensions.borderWidth.default, borderBottomColor: theme.color.borderSubtle, flexGrow: 0 }}
      contentContainerStyle={{ gap: space.xl, paddingHorizontal: dimensions.size.containerMarginMobile }}
    >
      {tabs.map((tab) => {
        const selected = tab === value;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            style={{
              minHeight: theme.touchTarget,
              justifyContent: 'center',
              borderBottomWidth: dimensions.borderWidth.strong,
              borderBottomColor: selected ? theme.color.borderBrand : theme.color.fillNone,
            }}
          >
            <Txt variant="bodyMdSemibold" tone={selected ? 'brand' : 'secondary'}>{tab}</Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * A row of options for playground and global controls. Stand-in built from Button until
 * Button group (3.1) exists; then swap it in so selection is announced as a selected state.
 */
export function ChoiceRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ gap: space.md }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Txt variant="bodySmSemibold" tone="secondary">{label}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Button
              key={String(option.value)}
              size="sm"
              emphasis={selected ? 'primary' : 'secondary'}
              label={option.label}
              accessibilityHint={selected ? 'Selected' : undefined}
              onPress={() => onChange(option.value)}
            />
          );
        })}
      </View>
    </View>
  );
}

/** Label and value pairs (props tables, token lists). */
export function DefinitionRow({ term, children }: { term: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: space.xs, paddingVertical: space.lg, borderBottomWidth: dimensions.borderWidth.default, borderBottomColor: theme.color.borderSubtle }}>
      <Txt variant="bodyMdSemibold">{term}</Txt>
      {children}
    </View>
  );
}
