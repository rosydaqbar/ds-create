import React from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { dsConfig } from '../../ds.config';
import { Button } from '../components';
import { ThemeProvider, useTheme } from '../theme';
import { ComponentScreen } from './ComponentScreen';
import { DisplayScreen } from './DisplayScreen';
import { HomeScreen } from './HomeScreen';
import { ColorScreen } from './foundations/ColorScreen';
import { TypographyScreen } from './foundations/TypographyScreen';
import type { RootStackParamList } from './navigation';
import { docs } from './registry';
import { ShowcaseSettingsProvider, useShowcaseSettings } from './settings';

/**
 * The showcase: the app's documentation site (APP.md §7). Home, one screen per foundation,
 * one screen per component, and a Display sheet with the global controls.
 */

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <ShowcaseSettingsProvider>
        <ThemedShowcase />
      </ShowcaseSettingsProvider>
    </SafeAreaProvider>
  );
}

function ThemedShowcase() {
  const { settings } = useShowcaseSettings();
  return (
    <ThemeProvider
      colorScheme={settings.scheme === 'system' ? undefined : settings.scheme}
      reducedMotion={settings.motion === 'system' ? undefined : settings.motion === 'reduced'}
      textScale={settings.textScale}
    >
      <Navigator />
    </ThemeProvider>
  );
}

function Navigator() {
  const theme = useTheme();
  const c = theme.color;
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: NavigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.textBrand,
      background: c.surfaceBase,
      card: c.surfaceBase,
      text: c.textPrimary,
      border: c.borderSubtle,
      notification: c.fillDangerSolid,
    },
  };

  return (
    <>
      <StatusBar barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={({ navigation }) => ({
            headerTintColor: c.textPrimary,
            headerStyle: { backgroundColor: c.surfaceBase },
            contentStyle: { backgroundColor: c.surfaceBase },
            animation: theme.reducedMotion ? 'fade' : 'default',
            headerRight: () => (
              <Button
                size="sm"
                emphasis="tertiary"
                leadingIcon="general/sliders"
                label="Display"
                accessibilityHint="Change color mode, text size and motion"
                onPress={() => navigation.navigate('Display')}
              />
            ),
          })}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: dsConfig.name }} />
          <Stack.Screen name="Color" component={ColorScreen} options={{ title: 'Color' }} />
          <Stack.Screen name="Typography" component={TypographyScreen} options={{ title: 'Typography' }} />
          <Stack.Screen
            name="Component"
            component={ComponentScreen}
            options={({ route }) => ({ title: docs[route.params.id]?.name ?? 'Component' })}
          />
          <Stack.Screen
            name="Display"
            component={DisplayScreen}
            options={{ presentation: 'modal', title: 'Display', headerRight: () => null }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
