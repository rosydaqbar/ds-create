import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { dsConfig } from '../../ds.config';
import { dimensions } from '../tokens/tokens';
import { openPage, type RootStackParamList } from './navigation';
import { docs, levels, pages, recentlyUpdated, startHere } from './registry';
import { Header, ListRow, Section, Screen } from './ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/** Home: the system name and version, starting points, recently updated, every level (APP.md §7). */
export function HomeScreen({ navigation }: Props) {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const open = (id: string) => {
    const page = byId.get(id);
    return page?.screen ? () => openPage(navigation, page) : undefined;
  };

  return (
    <Screen>
      <Header
        eyebrow={`Version ${dsConfig.version}`}
        title={dsConfig.name}
        summary="Every foundation and component in the system, live on your device. Open Display to check them in Light and Dark, at any text size and with Reduced motion."
      />

      <Section title="Start here">
        <View>
          {startHere.map((id) => {
            const page = byId.get(id);
            return page ? <ListRow key={id} title={`${page.id} ${page.name}`} onPress={open(id)} /> : null;
          })}
        </View>
      </Section>

      <Section title="Recently updated">
        <View>
          {recentlyUpdated().map((doc) => (
            <ListRow key={doc.id} title={`${doc.id} ${doc.name}`} meta={`${doc.status} · since ${doc.since}`} onPress={open(doc.id)} />
          ))}
        </View>
      </Section>

      {levels.map(({ level, number, title }) => (
        <Section key={level} title={`${number} · ${title}`}>
          <View style={{ gap: dimensions.space.none }}>
            {pages
              .filter((p) => p.level === level)
              .map((p) => (
                <ListRow
                  key={p.id}
                  title={`${p.id} ${p.name}`}
                  meta={p.screen ? docs[p.id]?.status : 'Not built yet'}
                  onPress={open(p.id)}
                />
              ))}
          </View>
        </Section>
      ))}
    </Screen>
  );
}
