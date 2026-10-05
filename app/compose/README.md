# Jetpack Compose template

> Reference skeleton — not compiled in ds-create. The first build compiles it (APP.md A1).

The brand-agnostic starting point for an Android implementation of a ds-create design system: a Compose library (`designsystem`, published as an AAR) and a `showcase` app that documents it on a phone. Every build copies this folder and fills it from its own Figma file, following `APP.md`. Nothing here belongs to a brand. Colors, sizes and type come from the placeholder token export in `tokens/`.

It ships the real structure, the theme, one complete reference component (`DsButton`), the showcase screens and the generated tokens. Every other component is listed in `designsystem/src/main/kotlin/design/system/components/COMPONENTS.md` and written at A4.

Kotlin 2, Jetpack Compose (foundation only, no Material), minSdk 26, compileSdk 35, JDK 17.

## Tree

```text
output/{system-slug}/android/                        a copy of ds-create/app/compose, filled for the brand
├─ settings.gradle.kts                   modules :designsystem and :showcase
├─ build.gradle.kts                      plugin versions, applied per module
├─ gradle.properties                     identity: DS_NAME, DS_GROUP, DS_ARTIFACT, DS_VERSION, DS_DOCS_URL
├─ gradle/libs.versions.toml             Compose BOM, Kotlin, AGP, test libraries
├─ tokens/figma-variables.json           export of the Figma file (the same file the web uses)
├─ scripts/                              build-app-tokens.mjs, check-contrast.mjs (copied at A1)
├─ designsystem/                         Android library, Maven artifact your.org:design-system
│  ├─ build.gradle.kts
│  └─ src/
│     ├─ main/
│     │  ├─ AndroidManifest.xml
│     │  ├─ res/values/strings.xml       words the library announces to TalkBack ("Loading")
│     │  └─ kotlin/design/system/
│     │     ├─ tokens/Tokens.kt          generated: DsColors (Light/Dark), DsSpace, DsSize, DsRadius,
│     │     │                            DsBorderWidth, DsFont*, DsComponent, DsTextStyles, DsMotion, DsEasing
│     │     ├─ theme/DsTheme.kt          DsTheme { }, DsTheme.colors/motion, rememberReducedMotion(), brand font
│     │     ├─ theme/DsInteraction.kt    dsMinimumTouchTarget() (48 dp), dsFocusRing()
│     │     ├─ icons/DsIcons.kt          system icon names → ImageVector, DsIcon (decorative by default)
│     │     └─ components/
│     │        ├─ DsEnums.kt             DsSize, DsEmphasis, DsTone, DsPreviewState
│     │        ├─ COMPONENTS.md          every Figma page → Compose function, status, Android guidance
│     │        ├─ parts/DsButton.kt      the reference component
│     │        ├─ components/            3.x, written at A4
│     │        └─ sections/              4.x, written at A4
│     └─ test/kotlin/design/system/
│        └─ DsButtonTest.kt              Compose UI semantics tests + Roborazzi screenshot outline
└─ showcase/                             the catalog app (APP.md §7)
   ├─ build.gradle.kts
   └─ src/main/
      ├─ AndroidManifest.xml
      └─ kotlin/design/system/showcase/
         ├─ MainActivity.kt              routes, back handling, global controls (mode, text size, motion)
         ├─ ShowcaseUi.kt                screen scaffold, preview frame, code block, rows
         ├─ HomeScreen.kt                name and version, starting points, recently updated, every level
         ├─ ComponentScreen.kt           tabs Overview · Component · Anatomy · Guidelines · Code
         ├─ foundations/                 ColorScreen.kt, TypographyScreen.kt (A5 adds the rest)
         └─ docs/                        ComponentDoc.kt (the doc model + registry), ButtonDoc.kt
```

## How a build fills it

| Step | What changes here |
| --- | --- |
| A1 Copy | Copy this folder to `output/{system-slug}/android/`, with `app/shared/scripts/build-app-tokens.mjs` and `web/scripts/check-contrast.mjs` in `scripts/`. Add the Gradle wrapper (`gradle wrapper`, or let Android Studio create it), update the versions in `libs.versions.toml`, then build and launch the showcase. Fix what the compiler reports and send the fixes back to ds-create. |
| A2 Tokens | Export the Figma file into `tokens/figma-variables.json`, run the contrast check, then regenerate `Tokens.kt` (Scripts below). Never edit the generated file. |
| A3 Identity | Fill `gradle.properties` (name, group, artifact, version, docs URL), `rootProject.name` and the showcase `applicationId`. Add the logo, mark and flags from 1.8 as vector drawables, bundle the brand font in `designsystem/src/main/res/font/` and set `DsBrandFontFamily`. Replace the placeholder glyphs in `DsIcons` with the 1.7 library, keeping the names. |
| A4 Components | In page order and only for pages in scope, write one file per published set following `DsButton` and `COMPONENTS.md`, a `{Name}Doc.kt` registered in `DocRegistry`, and a test file. Replace the spinner stand-in in `DsButton` once 2.15 exists, and the playground stand-ins once 2.9, 3.1 and 3.2 exist. |
| A5 Showcase | Fill the home screen and every foundation screen (color, type, space, shape, elevation, motion, icons, brand) from the tokens. |
| A6 Docs data | Set each doc's `status`, `since` and `updated` from the shared changelog. |
| A7 QA | `./gradlew build`, unit tests, Compose UI tests and screenshot tests (APP.md §9), then TalkBack, the largest text size, Dark, Reduced motion and a hardware keyboard on a small and a large device. |
| A8 Publish | `./gradlew :designsystem:publishReleasePublicationToLocalRepository` (or the team repository), and a showcase build for Play internal testing. |

## Scripts

From the project root, after A1:

```sh
node scripts/check-contrast.mjs
node scripts/build-app-tokens.mjs --platform compose --package design.system \
  --in tokens/figma-variables.json \
  --out designsystem/src/main/kotlin/design/system/tokens

./gradlew :showcase:installDebug                      # the showcase on a device or emulator
./gradlew :designsystem:testDebugUnitTest             # semantics tests (Robolectric)
./gradlew :designsystem:recordRoborazziDebug          # record screenshots once
./gradlew :designsystem:verifyRoborazziDebug          # compare in CI
./gradlew :designsystem:publishReleasePublicationToLocalRepository
```

## Rules this template follows

- **Tokens only.** Components read `DsTheme.colors`, `DsTheme.motion`, `DsSpace`, `DsSize`, `DsRadius`, `DsBorderWidth`, `DsComponent` and `DsTheme.textStyle(DsTextStyles.…)`. A missing value is missing in Figma first.
- **No Material.** The library depends on Compose foundation and UI only. Pressed and hovered states are token colors with `indication = null`, never a ripple.
- **Touch targets.** `Modifier.dsMinimumTouchTarget()` reserves 48 × 48 dp around smaller visuals, the same as Material's `minimumInteractiveComponentSize()`.
- **Text size.** Every style is in `sp`; controls use a minimum height, so they grow instead of clipping at 200%.
- **Color mode.** `DsTheme` follows the system; nest `DsTheme(darkTheme = true, reducedMotion = DsTheme.reducedMotion) { }` to force a subtree.
- **Reduced motion.** `rememberReducedMotion()` reads the system animator scale ("Remove animations") and switches to `ReducedDsMotion`.
- **Size names.** Size tokens are generated as `DsSizes`; `DsSize` is the variant enum.

## Known gaps in the generated tokens

- Effect styles are emitted as `DsShadows` (every layer, Light and Dark). Draw elevation from the strongest layer; `dsFocusRing` draws the focus ring as a border from `border/width/focus` and the focus colors, because a zero-blur spread shadow doesn't render as a ring.
- `size/touch-min` is 44 in the default export (the iOS minimum). Android uses the platform's 48 dp from `ViewConfiguration` instead.
