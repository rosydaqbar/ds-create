import React from 'react';
import { View } from 'react-native';
import { dimensions, typography } from '../../tokens/tokens';
import { useTheme, type TextStyleName } from '../../theme';
import { Caption, Header, Screen, Section, Txt } from '../ui';

/**
 * 1.2 Typography: the type scale at the current text size. Every style scales with the
 * system text size; the Display preview multiplies on top of it.
 */

const GROUPS: { prefix: string; title: string; sample: string }[] = [
  { prefix: 'display', title: 'Display', sample: 'Big moments' },
  { prefix: 'heading', title: 'Heading', sample: 'Plan the next release' },
  { prefix: 'body', title: 'Body', sample: 'Body text carries most of what people read, so it stays comfortable at every size.' },
  { prefix: 'code', title: 'Code', sample: 'const theme = useTheme();' },
];

const names = Object.keys(typography) as TextStyleName[];

export function TypographyScreen() {
  const theme = useTheme();
  const preview = theme.textScale === 1 ? 'your device’s text size' : `${theme.textScale}× your device’s text size`;

  return (
    <Screen>
      <Header
        eyebrow="Foundations › 1.2"
        title="Typography"
        summary={`The full type scale, shown at ${preview}. Change the size in Display to check that every style still wraps and nothing is cut off.`}
      />
      {GROUPS.map((group) => (
        <Section key={group.prefix} title={group.title}>
          {names
            .filter((name) => name.startsWith(group.prefix))
            .map((name) => {
              const style = typography[name];
              return (
                <View key={name} style={{ gap: dimensions.space.xs }}>
                  <Txt variant={name}>{group.sample}</Txt>
                  <Caption>{`${name} · ${style.fontSize}/${style.lineHeight} · weight ${style.fontWeight}`}</Caption>
                </View>
              );
            })}
        </Section>
      ))}
    </Screen>
  );
}
