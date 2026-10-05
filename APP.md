# App implementation

This file turns a generated Figma design system into a **native app library with its own showcase app**: React Native for iOS and Android from one codebase, or native SwiftUI (iOS) and Jetpack Compose (Android). Designers, product managers and developers open the showcase on a phone to try every component, in Light and Dark, at every text size.

It is a reusable workflow, the app counterpart of `WEB.md`. The starting point is the brand-agnostic template for the chosen framework in `app/`; every build copies it and fills it from its own Figma file. Nothing in `app/` belongs to a brand.

**The templates are reference skeletons.** Each one has the real structure, the theme, one complete reference component (Button), the showcase screens and the generated tokens, written as close to compilable code as possible, but they are not compiled inside ds-create (no Xcode, Android SDK or device toolchain is assumed here). The first build compiles them against the real toolchain and fixes what the compiler finds (A1 exit check).

Figma stays the source of truth. The app never invents values: tokens come from the Figma variables, component properties from the Figma component sets, documentation from the page specs.

# 1. When this runs

- At initiation, when the implementation targets in `INITIATOR.md` Part A §10 include **App** (App, or Web and App).
- Later, at any time, as its own task ("implement the system for iOS and Android").
- After a component is added through `EXTEND.md`, when the system already has an app implementation.

It runs **after** the Figma pages it implements exist, like the web. When both web and app are in scope, they share one token export (A2) and one changelog; the web runs first, then the app.

# 2. What is produced

One project per chosen framework. React Native:

```text
output/{system-slug}/native/     a copy of ds-create/app/react-native, filled for the brand (README §5)
├─ tokens/figma-variables.json   export of the Figma file (the same file the web uses)
├─ scripts/                      build-app-tokens.mjs, check-contrast.mjs (copied from app/shared and web/scripts)
├─ assets/brand/                 logo, mark and flags as SVG; brand fonts
└─ src/
   ├─ tokens/tokens.ts           generated
   ├─ theme/                     ThemeProvider, useTheme, color mode, reduced motion, text scaling
   ├─ icons/                     icon registry (system icon names → icon library)
   ├─ components/{parts,components,sections}/   one file per published set
   └─ showcase/                  the catalog app: home, foundations, one screen per component
```

SwiftUI (`output/{system-slug}/ios/`): a Swift package `DesignSystem` (`Sources/DesignSystem/{Tokens,Theme,Icons,Components}`) and a `Showcase` app. A Swift package can't hold an iOS app, so the Showcase is an Xcode project in `Showcase/` that depends on the local package; generate it from a project spec (XcodeGen `project.yml`) so every build creates it the same way. Jetpack Compose (`output/{system-slug}/android/`): an Android library module `designsystem` (`tokens`, `theme`, `icons`, `components`) and a `showcase` app module. Each template's README shows its tree.

# 3. Frameworks

Fixed per framework, so every build reads the same way:

| Concern | React Native | SwiftUI (iOS) | Jetpack Compose (Android) |
| --- | --- | --- | --- |
| Language and UI | TypeScript, React Native (New Architecture) | Swift 6, SwiftUI, iOS 17+ | Kotlin 2, Jetpack Compose, minSdk 26 |
| Theme | `ThemeProvider` + `useTheme()` context | `DSTheme` in the SwiftUI environment | `DsTheme { }` with `CompositionLocal`s |
| Styling | `StyleSheet` from tokens only | view modifiers from tokens only | modifiers from tokens only |
| Icons | `react-native-svg` + registry (Lucide by default) | asset catalog symbols from the 1.7 library | `ImageVector`s from the 1.7 library |
| Showcase | in-app catalog (React Navigation) | `Showcase` app target | `showcase` app module |
| Package | npm (`@org/design-system-native`) | Swift Package Manager | Maven artifact (AAR) |
| Tests | Jest + React Native Testing Library | XCTest + snapshot tests | JUnit + Compose UI tests + screenshot tests |

Don't build on top of a third-party UI kit (no Material components as the visual base, no NativeBase, no UIKit-styled wrappers). Use platform primitives (`Pressable`, `Button`/`View` in SwiftUI, `Box`/`Row` with `clickable` in Compose) and system tokens.

# 4. Workflow

## A1 · Copy the template

Copy `ds-create/app/{react-native|swiftui|compose}/` to `output/{system-slug}/native/`, `ios/` or `android/` (README §5), with `app/shared/scripts/build-app-tokens.mjs` and `web/scripts/check-contrast.mjs` into its `scripts/`. Use another location only when the user explicitly asks. Never build inside `ds-create/app/` or `ds-create/examples/`.

Exit check: the untouched copy compiles and the showcase launches on a simulator or emulator. Fix anything the real compiler reports in the template code first, and report those fixes back to ds-create so the template improves.

## A2 · Tokens

1. Use the shared export `output/{system-slug}/figma/figma-variables.json` (WEB.md W2 makes it; export it the same way when there is no web build) and copy it to the project's `tokens/`.
2. `node scripts/check-contrast.mjs`: every color pair AA in every mode. A failure is fixed in Figma, then exported again.
3. `node scripts/build-app-tokens.mjs --platform rn|swiftui|compose --in tokens/figma-variables.json --out <tokens folder>`.

Exit check: contrast all AA; the generated file compiles.

## A3 · Brand assets, fonts and identity

1. Logo, mark and flags from `1.8 Brand assets` as vector assets (SVG for React Native, PDF/SVG in the asset catalog for SwiftUI, vector drawables for Compose).
2. Bundle the brand typeface when its license allows apps; otherwise name the stand-in, as on the web.
3. Fill the identity (name, version, package name) in the template's config.

## A4 · Components

Work in page order (2.x, then 3.x, then 4.x), only for pages in scope. For each page: load its spec, read the Figma set, write the component following §6, add its showcase screen following §7, run it in Light, Dark and the largest text size. Mode (YOLO everything / One by one) is the same as the Figma build.

## A5 · Showcase

Fill the showcase home and the foundation screens (color, type, space, shape, elevation, motion, icons, brand), then one screen per component (§7). Words follow `web/COPY-GUIDE.md`.

## A6 · Docs data

Status (Stable, Beta, Deprecated), the release a component arrived in and the changelog follow `WEB.md` W6. When web and app are both in scope, keep one changelog and one status per component; a component can be Stable on one platform and Beta on another, and the showcase says so.

## A7 · Build and QA

Run the framework's checks (§9), then the manual review on one small and one large device per platform. Exit check: §9 passes.

## A8 · Publish

Package the library (npm, SwiftPM, Maven), build the showcase for internal distribution (TestFlight, Play internal testing or an Expo/EAS build), and give the user the project locations under `output/{system-slug}/`, the package names and how to install the showcase. Save QA results in `output/{system-slug}/reports/`.

# 5. Token contract in code

Generated by `build-app-tokens.mjs`. Figma names become camelCase members, without the domain prefix (`color/text/primary` → `textPrimary`); a name that would start with a digit keeps its domain (`space/2xl` → `space2xl`).

| Figma | React Native | SwiftUI | Compose |
| --- | --- | --- | --- |
| `color/text/primary` | `theme.color.textPrimary` | `DSTokens.Color.textPrimary` (a `ShapeStyle` that resolves for the color scheme), e.g. `.foregroundStyle(DSTokens.Color.textPrimary)` | `DsTheme.colors.textPrimary` |
| `color/fill/brand/solid/hover` | `theme.color.fillBrandSolidHover` | `DSTokens.Color.fillBrandSolidHover` | `DsTheme.colors.fillBrandSolidHover` |
| `space/md`, `size/control/md` | `dimensions.space.md`, `dimensions.size.controlMd` | `DSTokens.Space.md`, `DSTokens.Size.controlMd` | `DsSpace.md`, `DsSizes.controlMd` (`DsSize` is the Size variant enum) |
| `radius/control` | `dimensions.radius.control` | `DSTokens.Radius.control` | `DsRadius.control` |
| `type/body/md/regular` | `typography.bodyMdRegular` | `DSTokens.TextStyle.bodyMdRegular` → `.dsTextStyle(...)` | `DsTextStyles.bodyMdRegular` |
| `elevation/raised`, `focus/default` | `shadows.elevationRaised`, `shadows.focusDefault` (strongest layer + `elevation`) | `DSTokens.Shadow.elevationRaised` (every layer) | `DsShadows.elevationRaised` (every layer; draw elevation from the strongest) |
| `motion/duration/base` | `motion.durationBase` (Standard or Reduced) | `DSTokens.Motion.durationBase.value(reduced:)` | `DsTheme.motion.durationBase` |
| `motion/easing/standard` | `motion.easingStandard` (cubic-bezier points) | `DSTokens.Motion.easingStandard` | `DsEasing.easingStandard` |
| component tokens | `theme.component.buttonPaddingXMd` (sizes in `dimensions.component`) | `DSTokens.Component.buttonPaddingXMd`; component colors in `DSTokens.ComponentColor` | `DsComponent.buttonPaddingXMd`; component colors in `DsTheme.colors` |

Rules:
- Figma px become dp (React Native, Compose) and pt (SwiftUI) one to one. Font sizes are scaled text (Compose `sp`, SwiftUI `relativeTo:`, React Native `allowFontScaling`).
- Light and Dark follow the system color scheme by default; any subtree can be forced into one mode, like `data-theme` on the web.
- Never type a color, size or duration in a component. If a value is missing, it is missing in Figma first.

# 6. Component contract

## 6.1 One file per published set, props are the Figma properties

`Button` in Figma is `Button` (React Native), `DSButton` (SwiftUI) and `DsButton` (Compose), with the Figma properties as parameters:

```text
React Native   <Button size="md" emphasis="primary" tone="brand" leadingIcon="general/check" label="Save" onPress={save} />
SwiftUI        DSButton("Save", size: .md, emphasis: .primary, tone: .brand, leadingIcon: .check, action: save)
Compose        DsButton(label = "Save", onClick = save, size = DsSize.Md, emphasis = DsEmphasis.Primary, tone = DsTone.Brand, leadingIcon = DsIcons.Check)
```

Variant properties become enums with the Figma values (`Size`, `Emphasis`, `Tone`, …, SYSTEM.md Part C §4.2); `Show {part}` + swap becomes one optional parameter; `State` is not a parameter (pressed, focused and hovered come from the platform; `disabled` and `loading` are parameters). Private parts (`.Main/…`) are internal and not exported. The showcase can pin a state with a documentation-only `previewState`.

## 6.2 Platform translation

The look comes from the system; the behavior comes from the platform. Each rule is a QA failure when broken.

- **Touch targets.** At least 44 × 44 pt on iOS (`size/touch-min`) and 48 × 48 dp on Android (the platform minimum; written once as a named platform constant until Figma adds an Android token), even when the visual control is smaller. Expand the hit area: `hitSlop` (React Native; on Android it can't reach outside the parent, so leave room around small controls), `.contentShape` (SwiftUI), the template's `Modifier.dsMinimumTouchTarget()` (Compose; Material's `minimumInteractiveComponentSize()` would pull in Material, which §3 rules out). This is stricter than the web's 24 × 24.
- **Text size.** Every text style scales with the system text size, and every screen still works at the largest accessibility size (wrap, grow, scroll; never clip or overlap). Cap scaling only where a spec says so (badge counts). A fixed control height from the spec becomes a minimum height in apps: the control grows with its text, and a single-line label may wrap only at accessibility text sizes.
- **Color mode.** Follow the system; the showcase can force Light or Dark. When a subtree forces a mode, pass the current motion setting through (Compose: `DsTheme(darkTheme = true, reducedMotion = DsTheme.reducedMotion)`), so forcing Dark doesn't reset a forced Reduced motion.
- **Reduced motion.** Read the system setting (`AccessibilityInfo.isReduceMotionEnabled`, `accessibilityReduceMotion`, the animator scale on Android) and use the Reduced motion tokens.
- **Screen readers.** Every control has a role, a name and its state for VoiceOver and TalkBack (`accessibilityRole/Label/State`, `.accessibilityLabel`/`.accessibilityAddTraits`, `semantics { role; contentDescription; stateDescription }`). Icon-only controls take their name from `label`. Decorative images are hidden.
- **Hover-only content.** Tooltips have no hover on touch: show them on long-press, and give the control an accessibility hint with the same text.
- **Keyboard and focus.** With a hardware keyboard (iPad, Android tablets, ChromeOS) controls are focusable in order and show a focus ring. Draw the ring as a border from `color/border/focus` (or `color/border/danger`) and `border/width/focus`, offset like the web's `focus/default`: a zero-blur spread shadow doesn't render as a ring on mobile. React Native on iOS has limited hardware-keyboard focus; where it needs native work, note it on the showcase screen.
- **Native patterns.** Use the platform's own back navigation, sheets, haptics and pickers where the page spec allows (a Select may open a bottom sheet on phones); document each platform difference on the component's showcase screen. On Compose, build sheets and pickers from foundation and tokens (not Material 3's `ModalBottomSheet`), so no Material styling leaks in.
- **Shadows.** iOS draws every layer of an effect style; Android approximates it with elevation from the strongest layer. Keep surfaces distinguishable by color as well, so depth never relies on the shadow alone.
- **Web-only parts.** Kbd shows only when a hardware keyboard is connected. Rich text editor and Video player wrap the platform's own text and media views and keep the Figma chrome.

## 6.3 States and motion

Pressed, disabled, focused, selected and loading look exactly like the Figma variants. Motion follows the 1.6 pairings with the motion tokens: press feedback fast · standard; toggles and marks base · standard; sheets, menus and dialogs entering base or slow · enter, leaving fast · exit.

# 7. Showcase contract

The showcase is the app's documentation site. It mirrors the web explorer, sized for a phone:
- **Home**: the system name and version, starting points, recently updated, every level.
- **Foundations**: one screen per page with live specimens from the tokens (palettes with contrast, the type scale at the current text size, spacing, radii, elevation, motion with a Reduced toggle, icons, brand assets).
- **Component screens**, with tabs that keep the web's names: **Overview** (hero and examples in use), **Component** (every variant in a scrollable matrix, plus a playground whose controls are the system's own components), **Anatomy** (parts, props and the token map), **Guidelines** (a short summary with a link to the full page on the web or in Figma) and **Code** (the snippet for this platform).
- **Global controls**: Light/Dark, text size (from the smallest to the largest accessibility size) and Reduced motion, so anyone can check a component under every condition. SwiftUI and Compose can preview the text size directly (`.dynamicTypeSize`, a font-scale `Density`); React Native can't change the system size, so the theme applies a preview scale and components read text styles through the theme (`theme.text(…)`), never straight from `typography`.

Words follow `web/COPY-GUIDE.md`. Status and changelog come from §A6.

# 8. Keeping code and Figma in sync

Same rules as `WEB.md` §8: run A2 again when variables change; fix tokens in Figma, never in the export or the generated files; change a component and its showcase screen in the same task; a difference between app and Figma is a bug in the app unless the user decides otherwise. When web and app are both in scope, a component change lands on both in the same task.

# 9. QA

Automated (per framework):
- **React Native**: `tsc`, ESLint, Jest with React Native Testing Library (renders, roles and names for every component), and the contrast check.
- **SwiftUI**: `xcodebuild build test -scheme DesignSystem -destination 'platform=iOS Simulator,name=iPhone 16'` (`swift build` targets macOS and fails for an iOS-only package), XCTest, snapshot tests of every variant in Light and Dark at default and largest text sizes.
- **Compose**: Gradle build, unit tests, Compose UI tests with semantics checks, screenshot tests (Light, Dark, font scale 2.0).

Manual, on a small and a large device per platform: VoiceOver / TalkBack through every component screen, the largest text size, Dark, Reduced motion, a hardware keyboard where relevant.

Fail QA when:
- a component types a color, size or duration instead of a token;
- a prop or enum differs from the Figma property, or a Figma variant is missing;
- pressed, disabled, focus, selected or loading looks different from Figma;
- a touch target is smaller than 44 pt (iOS) or 48 dp (Android);
- text clips, overlaps or truncates at the largest text size where the spec doesn't allow it;
- a control has no role, name or state for VoiceOver or TalkBack;
- motion ignores the Reduced setting;
- a component has no showcase screen, or the screen lacks examples, the variant matrix, the playground or the token map;
- a brand value is written into `ds-create/app/` (the templates stay placeholder-only).
