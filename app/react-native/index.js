/**
 * Showcase entry. The library itself is `src/index.ts`; this file only registers the catalog app.
 * The app name must match app.json and the native projects created at A1.
 */
import { AppRegistry } from 'react-native';
import App from './src/showcase/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
