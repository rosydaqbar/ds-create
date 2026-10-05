import React from 'react';
import { useTheme } from '../theme';
import { Button } from '../components';
import { TEXT_SIZES, useShowcaseSettings, type MotionChoice, type SchemeChoice } from './settings';
import { Body, ChoiceRow, Section, Screen, Stage } from './ui';

const SCHEMES: { value: SchemeChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const MOTION: { value: MotionChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'standard', label: 'Standard' },
  { value: 'reduced', label: 'Reduced' },
];

/** Global controls (APP.md §7): Light/Dark, text size and Reduced motion for the whole showcase. */
export function DisplayScreen() {
  const theme = useTheme();
  const { settings, update } = useShowcaseSettings();

  return (
    <Screen>
      <Section title="Color mode" intro="Follow the device, or force Light or Dark for every screen.">
        <ChoiceRow label="Color mode" options={SCHEMES} value={settings.scheme} onChange={(scheme) => update({ scheme })} />
      </Section>

      <Section
        title="Text size"
        intro="The preview scales on top of your device’s text size. At the largest size, check that nothing is cut off or overlaps."
      >
        <ChoiceRow
          label="Text size"
          options={TEXT_SIZES.map((s) => ({ value: s.value, label: s.label }))}
          value={settings.textScale}
          onChange={(textScale) => update({ textScale })}
        />
      </Section>

      <Section title="Motion" intro="Reduced motion shortens or removes movement, using the Reduced motion tokens.">
        <ChoiceRow label="Motion" options={MOTION} value={settings.motion} onChange={(motion) => update({ motion })} />
        <Body>{theme.reducedMotion ? 'Reduced motion is on.' : 'Standard motion is on.'}</Body>
      </Section>

      <Section title="Preview">
        <Stage>
          <Button emphasis="secondary" label="Cancel" />
          <Button leadingIcon="general/check" label="Save changes" />
        </Stage>
      </Section>
    </Screen>
  );
}
