# ds-create app templates

Brand-agnostic starting points for the app version of a design system built with ds-create. `../APP.md` is the workflow that copies one of them to `output/{system-slug}/native/`, `ios/` or `android/` (`../README.md` §5) and fills it from a generated Figma file. A build never edits this folder.

```text
app/
├─ shared/scripts/build-app-tokens.mjs   Figma export → tokens.ts (React Native), Tokens.swift (SwiftUI), Tokens.kt (Compose)
├─ react-native/                         TypeScript, iOS and Android from one codebase, with a showcase catalog
├─ swiftui/                              Swift package DesignSystem + Showcase app sources (iOS 17+)
└─ compose/                              Android library designsystem + showcase app module (minSdk 26)
```

**Reference skeletons.** Each template has the real structure, the theme, the generated placeholder tokens, one complete reference component (Button) and the showcase skeleton. They are written to compile, but ds-create doesn't compile them (no Xcode, Android SDK or device toolchain is assumed). The first build compiles its copy and fixes what the compiler finds (APP.md A1), then reports the fixes back so the template improves.

Generate tokens for a template from any export:

```bash
node shared/scripts/build-app-tokens.mjs --platform rn      --in ../web/tokens/figma-variables.json --out react-native/src/tokens
node shared/scripts/build-app-tokens.mjs --platform swiftui --in ../web/tokens/figma-variables.json --out swiftui/Sources/DesignSystem/Tokens
node shared/scripts/build-app-tokens.mjs --platform compose --in ../web/tokens/figma-variables.json --out compose/designsystem/src/main/kotlin/design/system/tokens --package design.system
```

Nothing here belongs to a brand: tokens are the web template's neutral placeholders, and names and logos are placeholders.
