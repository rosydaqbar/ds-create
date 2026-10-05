import React, { useState, type ComponentType } from 'react';
import { Linking, ScrollView, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { dsConfig } from '../../ds.config';
import { Button } from '../components';
import { dimensions } from '../tokens/tokens';
import { useTheme } from '../theme';
import type { ControlDef, Guideline, MatrixSpec } from './docs/types';
import type { RootStackParamList } from './navigation';
import { docs, levels, type AnyDoc } from './registry';
import {
  Body,
  BulletList,
  Caption,
  ChoiceRow,
  CodeBlock,
  DefinitionRow,
  Header,
  Screen,
  Section,
  SpecimenView,
  Stage,
  TabBar,
  Txt,
} from './ui';

/**
 * One generic screen for every component, driven by its doc object. The tabs keep the
 * web explorer's names (APP.md §7).
 */

const TABS = ['Overview', 'Component', 'Anatomy', 'Guidelines', 'Code'] as const;
type Tab = (typeof TABS)[number];
type Props = NativeStackScreenProps<RootStackParamList, 'Component'>;
type AnyComponent = ComponentType<Record<string, unknown>>;

const space = dimensions.space;

export function ComponentScreen({ route }: Props) {
  const theme = useTheme();
  const doc = docs[route.params.id];
  const [tab, setTab] = useState<Tab>('Overview');

  if (!doc) {
    return (
      <Screen>
        <Header title="Not built yet" summary="This component has no screen yet. It appears here once it’s built and added to the registry." />
      </Screen>
    );
  }

  const levelTitle = levels.find((l) => l.level === doc.level)?.title ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surfaceBase }}>
      <TabBar tabs={TABS} value={tab} onChange={setTab} />
      <Screen>
        <Header
          eyebrow={`${levelTitle} › ${doc.id}`}
          title={doc.name}
          summary={doc.summary}
          meta={<Caption>{`${doc.status} on iOS and Android · since ${doc.since}`}</Caption>}
        />
        {tab === 'Overview' && <OverviewTab doc={doc} />}
        {tab === 'Component' && <ComponentTab doc={doc} />}
        {tab === 'Anatomy' && <AnatomyTab doc={doc} />}
        {tab === 'Guidelines' && <GuidelinesTab doc={doc} />}
        {tab === 'Code' && <CodeTab doc={doc} />}
      </Screen>
    </View>
  );
}

// ─── Overview: hero and examples in use ────────────────────────────────────────

function OverviewTab({ doc }: { doc: AnyDoc }) {
  const C = doc.component as AnyComponent;
  return (
    <>
      <Stage>
        <C {...doc.hero} />
      </Stage>
      {doc.examples.map((example) => (
        <Section key={example.title} title={example.title}>
          <SpecimenView component={C} specimen={example} />
          <Caption>{example.caption}</Caption>
        </Section>
      ))}
      <Section title="When to use">
        <BulletList items={doc.whenToUse.use} marker="general/check" />
      </Section>
      <Section title="When not to use">
        <BulletList items={doc.whenToUse.dont} marker="general/x" />
      </Section>
      {doc.platformNotes.length > 0 && (
        <Section title="On iOS and Android" intro="Where the app differs from Figma and the web.">
          <BulletList items={doc.platformNotes} marker="alerts/info-circle" />
        </Section>
      )}
    </>
  );
}

// ─── Component: every variant, then the playground ─────────────────────────────

function ComponentTab({ doc }: { doc: AnyDoc }) {
  const C = doc.component as AnyComponent;
  return (
    <>
      {doc.matrices.map((matrix: MatrixSpec<Record<string, unknown>>) => (
        <Section key={matrix.title} title={matrix.title} intro={`${matrix.rows.name} × ${matrix.columns.name}`}>
          <Matrix component={C} matrix={matrix} />
        </Section>
      ))}
      <Playground doc={doc} />
    </>
  );
}

/** Column by column, so every State column lines up; scroll sideways for the full set. */
function Matrix({ component: C, matrix }: { component: AnyComponent; matrix: MatrixSpec<Record<string, unknown>> }) {
  const cell = { minHeight: dimensions.size.controlXl, justifyContent: 'center' as const };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ flexDirection: 'row', gap: space.xl }}>
        <View style={{ gap: space.lg }}>
          <Caption>{matrix.rows.name}</Caption>
          {matrix.rows.values.map((row) => (
            <View key={row} style={cell}>
              <Txt variant="bodySmMedium" tone="secondary">{row}</Txt>
            </View>
          ))}
        </View>
        {matrix.columns.values.map((column) => (
          <View key={column} style={{ gap: space.lg }}>
            <Caption>{column}</Caption>
            {matrix.rows.values.map((row) => (
              <View key={row} style={cell}>
                <C {...matrix.cell(row, column)} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Playground({ doc }: { doc: AnyDoc }) {
  const C = doc.component as AnyComponent;
  const initial = Object.fromEntries(doc.playground.controls.map((c: ControlDef) => [c.name, c.default]));
  const [args, setArgs] = useState<Record<string, unknown>>(initial);
  const set = (name: string, value: unknown) => setArgs((a) => ({ ...a, [name]: value }));

  return (
    <Section title="Playground" intro="Change the props and see the result. The controls match the Figma properties.">
      <Stage>
        <C {...doc.playground.base} {...args} />
      </Stage>
      {doc.playground.controls.map((control: ControlDef) => (
        <PlaygroundControl key={control.name} control={control} value={args[control.name]} onChange={(v) => set(control.name, v)} />
      ))}
      <CodeBlock code={doc.playground.code(args)} />
    </Section>
  );
}

/** Controls use the system's own components; TextInput stands in for 2.10 Text control until it's built. */
function PlaygroundControl({ control, value, onChange }: { control: ControlDef; value: unknown; onChange: (value: unknown) => void }) {
  const theme = useTheme();
  const label = control.figma ? `${control.name} (${control.figma})` : control.name;
  const def = control.control;

  switch (def.type) {
    case 'text':
      return (
        <View style={{ gap: space.md }}>
          <Txt variant="bodySmSemibold" tone="secondary">{label}</Txt>
          <TextInput
            accessibilityLabel={label}
            allowFontScaling
            value={String(value ?? '')}
            onChangeText={onChange}
            placeholderTextColor={theme.color.textPlaceholder}
            style={[
              theme.text('bodyMdRegular'),
              {
                minHeight: dimensions.size.controlMd,
                paddingHorizontal: theme.component.textControlPaddingXMd,
                borderWidth: dimensions.borderWidth.default,
                borderColor: theme.color.borderDefault,
                borderRadius: dimensions.radius.control,
                backgroundColor: theme.color.surfaceBase,
                color: theme.color.textPrimary,
              },
            ]}
          />
        </View>
      );
    case 'select':
      return (
        <ChoiceRow label={label} options={def.options.map((o) => ({ value: o, label: o }))} value={String(value)} onChange={onChange} />
      );
    case 'boolean':
      return (
        <ChoiceRow
          label={label}
          options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
          value={value ? 'on' : 'off'}
          onChange={(v) => onChange(v === 'on')}
        />
      );
    case 'icon':
      return (
        <ChoiceRow
          label={label}
          options={[{ value: '', label: 'None' }, ...def.options.map((o) => ({ value: o as string, label: o }))]}
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v || undefined)}
        />
      );
  }
}

// ─── Anatomy: parts, props and the token map ───────────────────────────────────

function AnatomyTab({ doc }: { doc: AnyDoc }) {
  const C = doc.component as AnyComponent;
  const publicProps = doc.props.filter((p) => !p.internal);
  const internalProps = doc.props.filter((p) => p.internal);
  return (
    <>
      <SpecimenView component={C} specimen={doc.anatomy.specimen} />
      <Section title="Parts">
        <View>
          {doc.anatomy.parts.map((part, i) => (
            <DefinitionRow key={part.name} term={`${i + 1}. ${part.name}`}>
              <Body>{part.description}</Body>
              {part.tokens?.length ? <Caption>{part.tokens.join(' · ')}</Caption> : null}
            </DefinitionRow>
          ))}
        </View>
      </Section>
      <Section title="Props" intro="Props match the Figma properties.">
        <PropList props={publicProps} />
      </Section>
      {internalProps.length > 0 && (
        <Section title="Documentation only" intro="Used by this showcase to pin a state. Don’t use them in a product.">
          <PropList props={internalProps} />
        </Section>
      )}
      <Section title="Tokens" intro="Every value the component draws with. Change them in the Figma variables, never in code.">
        <Caption>{doc.tokens.join('\n')}</Caption>
      </Section>
    </>
  );
}

function PropList({ props }: { props: AnyDoc['props'] }) {
  return (
    <View>
      {props.map((p) => (
        <DefinitionRow key={p.name} term={p.name}>
          <Caption>{[p.type, p.default ? `default ${p.default}` : null, p.figma ? `Figma: ${p.figma}` : null].filter(Boolean).join(' · ')}</Caption>
          <Body>{p.description}</Body>
        </DefinitionRow>
      ))}
    </View>
  );
}

// ─── Guidelines: a short summary with a link to the full page ──────────────────

function GuidelinesTab({ doc }: { doc: AnyDoc }) {
  const C = doc.component as AnyComponent;
  const { web, figma } = dsConfig.links;
  return (
    <>
      {doc.guidelines.map((g: Guideline<Record<string, unknown>>) => (
        <Section key={g.title} title={g.title}>
          {g.body.split('\n\n').map((paragraph) => (
            <Body key={paragraph}>{paragraph}</Body>
          ))}
          {g.specimen ? <SpecimenView component={C} specimen={g.specimen} /> : null}
          {g.do ? (
            <View style={{ gap: space.md }}>
              <Txt variant="bodySmSemibold" tone="success">Do</Txt>
              {g.do.specimen ? <SpecimenView component={C} specimen={g.do.specimen} /> : null}
              <Caption>{g.do.caption}</Caption>
            </View>
          ) : null}
          {g.dont ? (
            <View style={{ gap: space.md }}>
              <Txt variant="bodySmSemibold" tone="danger">Don’t</Txt>
              {g.dont.specimen ? <SpecimenView component={C} specimen={g.dont.specimen} /> : null}
              {g.dont.text ? (
                <Stage>
                  <Txt variant="bodySmSemibold" tone="secondary">{g.dont.text}</Txt>
                </Stage>
              ) : null}
              <Caption>{g.dont.caption}</Caption>
            </View>
          ) : null}
        </Section>
      ))}
      <Section title="Accessibility">
        <BulletList items={doc.accessibility} marker="alerts/info-circle" />
      </Section>
      <Section title="Full guidelines">
        {web || figma ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            {web ? (
              <Button emphasis="secondary" trailingIcon="arrows/external-link" label="Open on the web" onPress={() => Linking.openURL(`${web}/${doc.id}`)} />
            ) : null}
            {figma ? (
              <Button emphasis="secondary" trailingIcon="arrows/external-link" label="Open in Figma" onPress={() => Linking.openURL(figma)} />
            ) : null}
          </View>
        ) : (
          <Body>{`The full guidelines are on the ${doc.id} ${doc.name} page in the Figma library.`}</Body>
        )}
      </Section>
    </>
  );
}

// ─── Code: the snippet for this platform ──────────────────────────────────────

function CodeTab({ doc }: { doc: AnyDoc }) {
  const pkg = dsConfig.packageName;
  return (
    <>
      <Section title="Install">
        <CodeBlock code={`npm install ${pkg} react-native-svg`} />
      </Section>
      <Section title="Set up the theme once" intro="Wrap the app so every component follows the system color mode, text size and motion setting.">
        <CodeBlock
          code={`import { ThemeProvider } from '${pkg}';

export default function App() {
  return <ThemeProvider>{/* your screens */}</ThemeProvider>;
}`}
        />
      </Section>
      <Section title="Import">
        <CodeBlock code={`import { ${doc.exports.join(', ')} } from '${pkg}';`} />
      </Section>
      {doc.examples.map((example) => (
        <Section key={example.title} title={example.title}>
          <CodeBlock code={example.code} />
        </Section>
      ))}
    </>
  );
}
