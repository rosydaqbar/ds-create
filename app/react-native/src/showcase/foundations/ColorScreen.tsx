import React from 'react';
import { View } from 'react-native';
import { dimensions } from '../../tokens/tokens';
import { useTheme, type ThemeColors } from '../../theme';
import { Caption, Header, Screen, Section, Txt } from '../ui';
import { contrastRatio } from './contrast';

/**
 * 1.1 Color: every color role of the current mode, straight from the tokens, with the
 * contrast of the pair it's used in. Switch Light and Dark in Display.
 */

const GROUPS: { prefix: string; title: string; intro: string }[] = [
  { prefix: 'text', title: 'Text', intro: 'Text colors, each checked on the surface it sits on.' },
  { prefix: 'icon', title: 'Icon', intro: 'Icons need 3:1 against their background, text needs 4.5:1.' },
  { prefix: 'border', title: 'Border', intro: 'Borders that mark a control need 3:1 against the surface.' },
  { prefix: 'surface', title: 'Surface', intro: 'Backgrounds for screens, cards and sheets, checked with the primary text on top.' },
  { prefix: 'fill', title: 'Fill', intro: 'Fills for controls in every state. Solid fills are checked with on-solid text.' },
  { prefix: 'category', title: 'Category', intro: 'Colors that tell categories apart in tags, avatars and charts.' },
];

interface Pair {
  ratio: number;
  min: number;
  against: string;
}

/** The pair a role is used in, and the WCAG minimum for it (APP.md A2 checks the same in every mode). */
function pairFor(name: string, value: string, c: ThemeColors): Pair | null {
  const base = c.surfaceBase;
  if (name.includes('Disabled')) return null; // disabled is exempt
  if (name.startsWith('text') || name.startsWith('icon')) {
    const min = name.startsWith('icon') ? 3 : 4.5;
    if (name.endsWith('OnBrand')) return { ratio: contrastRatio(value, c.surfaceBrandSolid, base), min, against: 'surfaceBrandSolid' };
    if (name.endsWith('OnSolid')) return { ratio: contrastRatio(value, c.fillBrandSolid, base), min, against: 'fillBrandSolid' };
    if (name.endsWith('Inverse')) return { ratio: contrastRatio(value, c.surfaceInverse, base), min, against: 'surfaceInverse' };
    return { ratio: contrastRatio(value, base, base), min, against: 'surfaceBase' };
  }
  if (name.startsWith('border')) return { ratio: contrastRatio(value, base, base), min: 3, against: 'surfaceBase' };
  if (name.includes('Solid') || name === 'surfaceInverse') return { ratio: contrastRatio(c.textOnSolid, value, base), min: 4.5, against: 'textOnSolid' };
  if (name.startsWith('surface') || name.startsWith('fill')) return { ratio: contrastRatio(c.textPrimary, value, base), min: 4.5, against: 'textPrimary' };
  return null;
}

function Swatch({ name, value }: { name: string; value: string }) {
  const theme = useTheme();
  const pair = pairFor(name, value, theme.color);
  const verdict = pair ? `${pair.ratio.toFixed(2)}:1 with ${pair.against} · ${pair.ratio >= pair.min ? 'passes' : 'below'} ${pair.min}:1` : 'No contrast check';
  return (
    <View
      accessible
      accessibilityLabel={`${name}, ${value}, ${verdict}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: dimensions.space.lg }}
    >
      <View
        style={{
          width: dimensions.size.controlLg,
          height: dimensions.size.controlLg,
          borderRadius: dimensions.radius.control,
          borderWidth: dimensions.borderWidth.default,
          borderColor: theme.color.borderSubtle,
          backgroundColor: value,
        }}
      />
      <View style={{ flex: 1, gap: dimensions.space.xxs }}>
        <Txt variant="bodySmSemibold">{name}</Txt>
        <Caption>{value}</Caption>
        <Txt variant="bodyXsMedium" tone={!pair ? 'tertiary' : pair.ratio >= pair.min ? 'success' : 'danger'}>
          {verdict}
        </Txt>
      </View>
    </View>
  );
}

export function ColorScreen() {
  const theme = useTheme();
  const entries = Object.entries(theme.color) as [string, string][];

  return (
    <Screen>
      <Header
        eyebrow="Foundations › 1.1"
        title="Color"
        summary={`Color roles for ${theme.scheme === 'dark' ? 'Dark' : 'Light'} mode. Each swatch shows the contrast of the pair it’s used in, so you can see at a glance what’s safe for text.`}
      />
      {GROUPS.map((group) => {
        const roles = entries.filter(([name]) => name.startsWith(group.prefix));
        return (
          <Section key={group.prefix} title={group.title} intro={group.intro}>
            {roles.map(([name, value]) => (
              <Swatch key={name} name={name} value={value} />
            ))}
          </Section>
        );
      })}
      <Section title="Other roles" intro="Scrims and shadow colors, used under overlays and in effect styles.">
        {entries
          .filter(([name]) => !GROUPS.some((g) => name.startsWith(g.prefix)))
          .map(([name, value]) => (
            <Swatch key={name} name={name} value={value} />
          ))}
      </Section>
    </Screen>
  );
}
