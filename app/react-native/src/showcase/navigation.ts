import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PageEntry } from './registry';

export type RootStackParamList = {
  Home: undefined;
  Display: undefined;
  Color: undefined;
  Typography: undefined;
  Component: { id: string };
};

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

/** Opens a page from the registry, or does nothing when it isn't built yet. */
export function openPage(navigation: RootNavigation, page: PageEntry) {
  switch (page.screen) {
    case 'Component':
      navigation.navigate('Component', { id: page.id });
      break;
    case 'Color':
      navigation.navigate('Color');
      break;
    case 'Typography':
      navigation.navigate('Typography');
      break;
  }
}
