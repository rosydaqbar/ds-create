# React Native template

> **Reference skeleton — not compiled in ds-create. The first build compiles it (APP.md A1).**
> The code is written to compile with a standard React Native setup (TypeScript, New Architecture), but nothing here has been installed, bundled or run on a device. Fix whatever the real compiler finds at A1 and report the fixes back to ds-create.

The brand-agnostic starting point for a React Native design system: one codebase for iOS and Android, with the tokens, the theme, the icon registry, one complete reference component (Button) and the showcase app. Every build copies this folder and fills it from its own Figma file (APP.md). Nothing here belongs to a brand: the tokens are placeholders and the identity lives in `ds.config.ts`.

## What's inside

```text
output/{system-slug}/native/                  a copy of ds-create/app/react-native, filled for the brand
├─ tokens/figma-variables.json   export of the Figma file (placeholder here)
├─ scripts/                      build-app-tokens.mjs, check-contrast.mjs (copied in at A1)
├─ assets/brand/                 logo, mark and flags as SVG; brand fonts (filled at A3)
├─ ds.config.ts                  name, version, package name, links to the full guidelines
├─ index.js · app.json           showcase entry (registers src/showcase/App)
└─ src/
   ├─ index.ts                   package entry: tokens, theme, icons, components
   ├─ tokens/tokens.ts           generated, never edited by hand
   ├─ theme/                     ThemeProvider, ThemeScope, useTheme: color mode, reduced motion, text scaling
   ├─ icons/                     icon registry (system icon names → lucide-react-native)
   ├─ components/
   │  ├─ COMPONENTS.md           every page → file, status and platform notes
   │  ├─ index.ts                public exports
   │  ├─ parts/Button.tsx        the reference implementation (+ __tests__/)
   │  ├─ components/             3.x pages
   │  └─ sections/               4.x pages
   └─ showcase/                  the catalog app
      ├─ App.tsx                 navigation shell and the Display sheet (Light/Dark, text size, motion)
      ├─ HomeScreen.tsx          name and version, start here, recently updated, every level
      ├─ foundations/            ColorScreen (contrast per swatch), TypographyScreen
      ├─ ComponentScreen.tsx     Overview, Component, Anatomy, Guidelines, Code, driven by a doc object
      ├─ docs/                   doc objects (button.doc.ts) and their types
      └─ registry.ts             every page of the tree, built or not
```

## How a build fills it

The full workflow is in `APP.md` §4. In short:

| Step | What happens here |
| --- | --- |
| A1 · Copy | Copy this folder to `output/{system-slug}/native/`, with `app/shared/scripts/build-app-tokens.mjs` and `web/scripts/check-contrast.mjs` in `scripts/`. Add the native projects (React Native CLI or Expo prebuild, app name `Showcase` from `app.json`), install, and get the untouched showcase running on a simulator. |
| A2 · Tokens | Put the Figma export in `tokens/figma-variables.json`, run `npm run contrast`, then `npm run tokens`. |
| A3 · Brand | Logo, mark and flags into `assets/brand/` as SVG, the brand font bundled (or its stand-in named), and the identity in `ds.config.ts` and `package.json`. |
| A4 · Components | Page by page, following `src/components/COMPONENTS.md` and the Button reference: props are the Figma properties, values come from tokens only. |
| A5 · Showcase | Fill the remaining foundation screens and add one doc object per component to `src/showcase/registry.ts`. |
| A6 · Docs data | Status and `since` on each doc object; one changelog shared with the web. |
| A7 · QA | `npm run qa`, then VoiceOver and TalkBack, the largest text size, Dark and Reduced motion on a small and a large device. |
| A8 · Publish | Publish the npm package and ship the showcase for internal testing (TestFlight, Play internal testing or EAS). |

## Scripts

| Script | What it does |
| --- | --- |
| `npm run tokens` | `node scripts/build-app-tokens.mjs --platform rn --in tokens/figma-variables.json --out src/tokens` |
| `npm run contrast` | `node scripts/check-contrast.mjs`: every text and fill pair reaches AA in every mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with the React Native config |
| `npm run test` | Jest with React Native Testing Library: render, role, name and state for every component |
| `npm run qa` | All of the above, in order |

## Using the theme

```tsx
import { ThemeProvider, ThemeScope, useTheme, dimensions } from '@your-org/design-system-native';

<ThemeProvider>{/* follows the system color scheme and Reduce motion */}</ThemeProvider>
<ThemeScope scheme="dark">{/* forces Dark for this subtree, like data-theme on the web */}</ThemeScope>

const theme = useTheme();
theme.color.textPrimary;            // color/text/primary in the current mode
theme.component.buttonPaddingXMd;   // component tokens
theme.shadows.elevationRaised;      // elevation/raised (strongest layer + Android elevation)
theme.motion.durationBase;          // Standard or Reduced, from the system setting
theme.text('bodyMdRegular');        // type/body/md/regular
dimensions.space.md;                // space/md
```

Components never type a color, size or duration. If a value is missing, it's missing in Figma first.

## Before the first build

- Pin the dependency versions in `package.json` to the React Native release you build with; the ranges here are a starting point.
- Point `ds.config.ts` links at the web explorer and the Figma file so the Guidelines tab can open the full page.
