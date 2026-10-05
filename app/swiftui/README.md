# SwiftUI (iOS) template

> Reference skeleton — not compiled in ds-create. The first build compiles it (APP.md A1).

The brand-agnostic starting point for a native iOS implementation of a ds-create system: a Swift package `DesignSystem` (tokens, theme, icons, components) and the sources of a `Showcase` app that documents every component on a phone. `APP.md` is the workflow; this folder is what step A1 copies. Nothing here belongs to a brand: the tokens are the placeholder export from `web/tokens/`, and the config says "Design System".

What is complete: the theme, the generated tokens, the icon registry, one reference component (`DSButton`, 2.1), the showcase shell (home, global controls, two foundation screens, the generic component screen and the Button doc) and a test skeleton. Every other component is listed in `Sources/DesignSystem/Components/COMPONENTS.md` with its Swift name and iOS guidance.

## Tree

```text
output/{system-slug}/ios/                          a copy of ds-create/app/swiftui, filled for the brand
├─ Package.swift                      library DesignSystem · iOS 17 · Swift 6 tools
├─ tokens/figma-variables.json        export of the Figma file (the same file the web uses)
├─ scripts/                           build-app-tokens.mjs, check-contrast.mjs (copied at A1)
├─ Sources/DesignSystem/
│  ├─ DesignSystemConfig.swift        name, version, package, links (A3)
│  ├─ Tokens/Tokens.swift             GENERATED: DSTokens.Color/Space/Size/Radius/TextStyle/Shadow/Motion/Component
│  ├─ Theme/                          DSColor, DSTextStyle, DSShadow, DSDuration/DSEasing, DSTheme + modifiers
│  ├─ Icons/DSIcon.swift              registry: system icon names → asset catalog (SF Symbols stand-in)
│  ├─ Resources/                      added at A3: Icons.xcassets, Brand.xcassets, fonts
│  └─ Components/
│     ├─ COMPONENTS.md                every page → Swift type, status, iOS guidance
│     ├─ Parts/DSButton.swift         2.1, the reference component
│     ├─ Components/                  3.x, added at A4
│     └─ Sections/                    4.x, added at A4
├─ Showcase/                          sources of the Showcase app target (Showcase.xcodeproj is created here at A1)
│  ├─ ShowcaseApp.swift               entry point, global controls (Light/Dark, text size, Reduced motion)
│  ├─ HomeView.swift                  home and the page catalog
│  ├─ ComponentScreen.swift           the generic screen: Overview, Component, Anatomy, Guidelines, Code
│  ├─ Foundations/                    ColorView, TypographyView (A5 adds space, shape, elevation, motion, icons, brand)
│  └─ Docs/ButtonDoc.swift            one doc per component
└─ Tests/DesignSystemTests/           XCTest + snapshot-test outline
```

## How a build fills it

- **A1 · Copy.** Copy this folder to `output/{system-slug}/ios/` and add `app/shared/scripts/build-app-tokens.mjs` and `web/scripts/check-contrast.mjs` to `scripts/`. Create the Showcase app target (below), build the package and the app, and fix whatever the compiler reports. Report those fixes back to ds-create so this template improves.
- **A2 · Tokens.** Put the Figma export in `tokens/figma-variables.json`, run `node scripts/check-contrast.mjs` (all AA), then generate:
  ```sh
  node scripts/build-app-tokens.mjs --platform swiftui --in tokens/figma-variables.json --out Sources/DesignSystem/Tokens
  ```
  Never edit `Tokens.swift`. Fix values in Figma and export again.
- **A3 · Assets and identity.** Add `Sources/DesignSystem/Resources/` with the 1.7 icons and the 1.8 logo, mark and flags as PDF or SVG in asset catalogs, plus the brand fonts if their license allows apps. Add `resources: [.process("Resources")]` to the target, switch `DSIcon.image` to `Image(assetName, bundle: .module)`, register the fonts, and fill `DesignSystemConfig.swift`.
- **A4 · Components.** In page order, one file per published set, following `DSButton`: Figma variants as enums, platform states from the `ButtonStyle`/environment, colors from a `Palette` of tokens, scaled metrics, a 44 × 44 pt hit area, VoiceOver name and state, motion tokens with Reduced motion, and a doc-only `previewState`. Update `COMPONENTS.md`.
- **A5 · Showcase.** Fill the foundation screens and add one `Docs/{Name}Doc.swift` per component, wired into `ShowcaseCatalog.destination(for:)`. Words follow `web/COPY-GUIDE.md`.
- **A6 · Docs data.** Status, the release a component arrived in and the changelog, shared with the web when both exist.
- **A7 · QA.** See Scripts below, then VoiceOver, the largest text size, Dark, Reduced motion and a hardware keyboard on a small and a large iPhone (and an iPad).
- **A8 · Publish.** Tag the package for Swift Package Manager and ship the showcase through TestFlight.

## The Showcase app target

The package can't hold an iOS app, so the showcase is an Xcode app target next to it:

1. In Xcode, **File › New › Project › iOS App**, named `Showcase`, interface SwiftUI, language Swift, placed so the project file lands at `Showcase/Showcase.xcodeproj` (choose the root of this folder as the location; Xcode puts the project in a `Showcase/` folder, the one that already holds the sources). Keeping the project out of the root matters: with an `.xcodeproj` next to `Package.swift`, `xcodebuild` picks the project instead of the package.
2. Delete the starter `ContentView.swift` and app file, then add the existing files in `Showcase/` (`ShowcaseApp.swift`, `HomeView.swift`, `ComponentScreen.swift`, `Foundations/`, `Docs/`) to the `Showcase` target.
3. **File › Add Package Dependencies › Add Local…**, pick the root folder (the one with `Package.swift`), and add the `DesignSystem` library to the `Showcase` target.
4. Set the deployment target to iOS 17, the bundle identifier to `DesignSystemConfig.showcaseBundleID`, and Swift Language Version 6.
5. Run on an iPhone simulator. The settings button in the top bar opens the global controls.

## Using the library

```swift
import DesignSystem

DSButton("Save changes", leadingIcon: .check) { save() }

Text("Recent activity")
    .dsTextStyle(DSTokens.TextStyle.headingSmSemibold)
    .dsForeground(DSTokens.Color.textPrimary)

SettingsPanel()
    .dsTheme(colorScheme: .dark)   // force one mode for a subtree, like data-theme on the web
```

`DSColor` is a `ShapeStyle`, so a color token works anywhere SwiftUI takes a style (`foregroundStyle`, `fill`, `background`, `tint`) and resolves against the view's color scheme. Shadows use `.dsShadow(DSTokens.Shadow.control, in: shape)`, which draws every layer with its spread. Durations come from `DSTokens.Motion.durationFast.animation(DSTokens.Motion.easingStandard, reduced: reduceMotion)`, where `reduceMotion` is `@Environment(\.dsReduceMotion)`.

## Scripts

| Task | Command |
| --- | --- |
| Generate tokens | `node scripts/build-app-tokens.mjs --platform swiftui --in tokens/figma-variables.json --out Sources/DesignSystem/Tokens` |
| Contrast check | `node scripts/check-contrast.mjs` |
| Build the package | `xcodebuild build -scheme DesignSystem -destination 'generic/platform=iOS Simulator'` |
| Tests | `xcodebuild test -scheme DesignSystem -destination 'platform=iOS Simulator,name=iPhone 16'` |
| Showcase | `xcodebuild build -project Showcase/Showcase.xcodeproj -scheme Showcase -destination 'generic/platform=iOS Simulator'` |

`swift build` on the command line builds for macOS, which this iOS-only package doesn't target, so use `xcodebuild` with an iOS destination.

## Known gaps for the first build

- Component colors are `DSTokens.ComponentColor`, component sizes `DSTokens.Component`.
- Effect styles keep their domain: `elevation/control` → `DSTokens.Shadow.elevationControl`, `focus/default` → `DSTokens.Shadow.focusDefault`.
- The generated file has no list of its members, so `ColorView` and `TypographyView` name the roles they show.
- `.focusable(interactions: .activate)` on `DSButton` and the hit-area expansion beyond the frame need checking on a device (A1).
