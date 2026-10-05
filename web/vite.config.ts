import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * App products: the docs site previews the components in React Native, rendered with
 * react-native-web (WEB.md §7.1). `@app` points at that React Native source: `./react-native`
 * inside a build (part of this docs project), `../app/react-native` in ds-create, or DS_APP_SRC.
 * Nothing native is installed or built: `react-native` is aliased to `react-native-web`.
 */
const appSrc = [process.env.DS_APP_SRC, here('./react-native'), here('../app/react-native')].find((p) => p && existsSync(p)) ?? here('./src/docs/app/missing');

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      // react-native-svg reaches into react-native's own asset registry; the docs never bundle native assets.
      { find: '@react-native/assets-registry/registry', replacement: here('./src/docs/app/shims/assets-registry.ts') },
      { find: '@app', replacement: appSrc },
      { find: '@', replacement: here('./src') },
    ],
    // The React Native source lives outside this project: resolve its packages from here.
    dedupe: ['react', 'react-dom', 'react-native-web', 'react-native-svg', 'lucide-react-native'],
    extensions: ['.web.tsx', '.web.ts', '.web.mjs', '.web.js', '.tsx', '.ts', '.mjs', '.js', '.jsx', '.json'],
  },
  // React Native code expects `__DEV__` and `global`.
  define: { __DEV__: JSON.stringify(mode !== 'production'), global: 'globalThis' },
  optimizeDeps: {
    include: ['react-native-web', 'react-native-svg', 'lucide-react-native'],
    rolldownOptions: { resolve: { extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.mjs', '.json'] } },
  },
  server: { fs: { allow: [here('..'), here('../..')] } },
  base: './',
  // The explorer loads every component page up front (instant navigation, ~300 kB gzip).
  build: { chunkSizeWarningLimit: 2400 },
}));
