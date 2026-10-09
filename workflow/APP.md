# App products

This file covers what changes on the documentation site when the product is an **App** (or **Web and App**). The docs site from `workflow/WEB.md` is the documentation for every product type. For an App product:

- every component is **previewed in React Native**, rendered in the browser with react-native-web;
- the **Code tab** shows every example in **React Native, Swift (SwiftUI) and Kotlin (Jetpack Compose)**, side by side with the web version when the product is Web and App.

That is all an App product gets in code. ds-create previews; it doesn't provide app libraries, packages or app projects. The React Native components exist only so the docs can render the previews, and they live inside the docs project. Swift and Kotlin exist only as code on the Code tab.

Figma stays the source of truth. The previews and the code never invent values: tokens come from the Figma variables, props from the Figma component sets, documentation from the page specs.

## Nothing is installed or built

- Never install Xcode, the Android SDK, a JDK, Gradle, CocoaPods, React Native, simulators, emulators or any app.
- Never create an app project, a build file (Gradle, `Package.swift`, `package.json` for an app) or a package.
- Never run an app build, an app test runner or a device.

The only things that run are the docs site (`npm run dev`, `npm run build`, `npm run qa` in `kit/web/`) and the Node token script in §4 A2. react-native-web renders the previews without `react-native` itself (`workflow/WEB.md` §7.1).

# 1. When this runs

- At initiation, when the product type in `workflow/QUESTIONNAIRE.md` §10 is **App** or **Web and App**, right after the docs site is set up (`workflow/WEB.md` W1–W3).
- Later, as its own task ("add the app previews").
- After a component is added through `workflow/EXTEND.md`, when the product includes App.

A component gets its app preview only when its Figma page is complete.

# 2. What is produced

Everything lives in the docs project:

```text
output/{system-slug}/web/            the docs site (workflow/WEB.md), product 'app' or 'both'
├─ react-native/                     React Native source for the previews (copy of ds-create/app/react-native)
│  ├─ tokens/tokens.ts               generated from the Figma export
│  ├─ theme/                         ThemeProvider, useTheme: color mode, reduced motion, text size; anatomy()
│  ├─ icons/                         icon registry (system icon names → lucide-react-native)
│  └─ specs/components/{parts,components,sections}/   one file per published set
└─ src/docs/stories/                 each component page's story, with its `app` block (§7)
```

There are no `ios/`, `android/` or `native/` folders, and no app package.

# 3. Stack

| Concern | Choice |
| --- | --- |
| Preview components | TypeScript React Native components (`View`, `Text`, `Pressable`, `Animated`), styled with `StyleSheet` values from the tokens |
| Rendering on the site | react-native-web, set up in `kit/web/vite.config.ts` (`workflow/WEB.md` §7.1) |
| Icons | lucide-react-native with react-native-svg, behind one registry with the web icon names |
| Swift code | SwiftUI, written as `DSButton(…)` with `DSTokens.*` (§5) |
| Kotlin code | Jetpack Compose, written as `DsButton(…)` with `DsTheme.*` (§5) |

Don't build the previews on a third-party UI kit (no NativeBase, no React Native Paper). Swift and Kotlin code doesn't use Material or UIKit-styled components; it reads as the system's own components.

# 4. Workflow

At initiation, A1–A2 run in step 22 of the build sequence (`workflow/INITIATOR.md` Part B §6), A3 in step 23 with each page, and A4 in step 25. The same gates apply.

## A1 · Copy the preview source

After `workflow/WEB.md` W1, copy `ds-create/app/react-native/` to `output/{system-slug}/web/react-native/`. The docs site finds it there by itself (`@app` alias). Never build inside `ds-create/app/`.

## A2 · Tokens

From `output/{system-slug}/web/`, generate the React Native tokens from the same export the docs use (`workflow/WEB.md` W2, contrast gate included):

```sh
node ../../../kit/app/scripts/build-rn-tokens.mjs --in tokens/figma-variables.json --out react-native/tokens
```

(Or copy `kit/app/scripts/build-rn-tokens.mjs` into `kit/web/scripts/` and run it from there.) Never edit `tokens.ts`; fix values in Figma and export again. Modes listed in `tokens/accepted.json` `unsupportedModes` are left out, and `darkColors` then repeats Light.

## A3 · Components

Work in page order (2.x, then 3.x, then 4.x), only for pages in scope. For each page:

1. Load its spec and read the Figma set.
2. Write the React Native component in `react-native/components/{level}/`, following §6, and export it from `components/index.ts`.
3. Add the `app` block to the page's story (§7): hero, examples with their React Native, Swift and Kotlin code, variant matrices, anatomy, Guidelines visuals and "In apps" notes. Add the component to `src/docs/app/app.d.ts`.
4. Look at the page in App preview, in Light and Dark.

The mode (YOLO everything, or One by one) is the same as the Figma build.

## A4 · QA

Run §9, the Impeccable design detector included (`workflow/WEB.md` W7). Write the React Native previews with the Impeccable skill loaded, as in `workflow/WEB.md` W4. Save the results in `output/{system-slug}/reports/`.

# 5. Token names in code

The previews read the generated React Native tokens. The Swift and Kotlin code on the Code tab uses the same tokens under these names, so a developer can map every value back to Figma. Figma names become camelCase members, without the domain prefix (`color/text/primary` → `textPrimary`); a name that would start with a digit keeps its domain (`space/2xl` → `space2xl`).

| Figma | React Native | Swift | Kotlin |
| --- | --- | --- | --- |
| `color/text/primary` | `theme.color.textPrimary` | `DSTokens.Color.textPrimary` | `DsTheme.colors.textPrimary` |
| `space/md`, `size/control/md` | `dimensions.space.md`, `dimensions.size.controlMd` | `DSTokens.Space.md`, `DSTokens.Size.controlMd` | `DsSpace.md`, `DsSizes.controlMd` |
| `size/touch-min`, `size/touch-min-android` | `theme.touchTarget` (picks the platform's value) | `DSTokens.Size.touchMin` | `DsSizes.touchMinAndroid` |
| `radius/control` | `dimensions.radius.control` | `DSTokens.Radius.control` | `DsRadius.control` |
| `type/body/md/regular` | `theme.text('bodyMdRegular')` | `.dsTextStyle(DSTokens.TextStyle.bodyMdRegular)` | `DsTheme.textStyle(DsTextStyles.bodyMdRegular)` |
| `elevation/raised` | `theme.shadows.elevationRaised` | `DSTokens.Shadow.elevationRaised` | `DsShadows.elevationRaised` |
| `motion/duration/base` | `theme.motion.durationBase` | `DSTokens.Motion.durationBase` | `DsTheme.motion.durationBase` |
| component tokens | `theme.component.buttonPaddingXMd` | `DSTokens.Component.buttonPaddingXMd` | `DsComponent.buttonPaddingXMd` |

Rules:
- Figma px become dp and pt one to one. Text sizes scale with the system text size.
- Light and Dark follow the system by default; a subtree can be forced into one mode, like `data-theme` on the web.
- Never type a color, size or duration, in a preview component or in the code on the site.

# 6. Component contract

## 6.1 Props are the Figma properties

`Button` in Figma is `Button` in React Native, `DSButton` in Swift and `DsButton` in Kotlin, with the Figma properties as props:

```text
React Native   <Button size="md" emphasis="primary" tone="brand" leadingIcon="general/check" label="Save" onPress={save} />
Swift          DSButton("Save", size: .md, emphasis: .primary, tone: .brand, leadingIcon: .check, action: save)
Kotlin         DsButton(label = "Save", onClick = save, size = DsSize.Md, emphasis = DsEmphasis.Primary, tone = DsTone.Brand, leadingIcon = DsIcons.Check)
```

Variant properties take the Figma values (`Size`, `Emphasis`, `Tone`, …, `specs/SYSTEM.md` Part C §4.2). A `Show {part}` toggle and its swap become one optional prop. `State` is not a prop: pressed, focused and hovered come from the platform, while `disabled` and `loading` are props. Private parts (`.Main/…`) are internal.

Two helpers exist only for the docs site:

- `previewState` pins a state (hover, pressed or focus) for the variant matrices.
- `anatomy('part')` names a part for the Anatomy markers (`data-anatomy` on the web).

Read tokens the brand may not have (component tokens, size steps) through `num`, `dim` and `role` from `components/parts/_shared.tsx`, as Button does, so an existing file without component tokens still renders.

## 6.2 Platform behavior

The look comes from the system, and the behavior follows iOS and Android. The React Native preview component follows these rules, and each one is written in the component's "In apps" notes (§7):

- **Touch targets.** At least 44 × 44 pt on iOS (`size/touch-min`) and 48 × 48 dp on Android (`size/touch-min-android`), even when the visual control is smaller. The hit area grows, never the visual size. This is stricter than the web's 24 × 24.
- **Text size.** Every text style scales with the system text size. A fixed control height from the spec becomes a minimum height, so the control grows with its text instead of clipping.
- **Color mode and reduced motion.** Follow the system, and use the Reduced motion tokens when the system asks for it.
- **Screen readers.** Every control has a role, a name and its state for VoiceOver and TalkBack. Icon-only controls take their name from `label`. Decorative images are hidden. react-native-web ignores `accessibilityState` and `accessibilityValue`, so spread `a11yState({…})` / `a11yValue({…})` from `components/parts/_shared.tsx`, which set the matching `aria-*` props too. A part inside a larger control (a Radio in a selectable row) is wrapped in `DecorativeControl` and takes `decorativeControlProps`, so the row is the only focus stop. Titles use `useHeading()` (`theme/heading.tsx`), never a bare `accessibilityRole="header"`, so they render at the right level on the web.
- **Hover-only content.** There is no hover on touch: tooltips show on long-press, and the control gets an accessibility hint with the same text.
- **Keyboard focus.** With a hardware keyboard, controls are focusable and show the focus ring, drawn as a border from `color/border/focus` and `border/width/focus`.
- **Native patterns.** A component may use the platform's own pattern where the spec allows, such as a Select opening a sheet on phones. The notes say so.
- **Shadows.** Android draws elevation from the strongest shadow layer. Surfaces stay distinguishable by color as well.

## 6.3 States and motion

Pressed, disabled, focused, selected and loading look exactly like the Figma variants. Motion follows the 1.6 pairings with the motion tokens: press feedback fast · standard, toggles base · standard, sheets and menus entering base · enter and leaving fast · exit.

## 6.4 One component, three ways of writing it

- **Same props:** the React Native component and the Swift and Kotlin code use the same props with the same values, from Figma (§6.1).
- **Same look:** the preview is the React Native version, and the Swift and Kotlin code describes the same component.
- **Same scope:** the components of the system's pages. An App product adds no app-only components. Sheets, tab bars and pickers are how a component in scope behaves on a phone, written in its notes, not new components.

# 7. Documentation contract

Each component page's story (`kit/web/src/docs/stories/{id}-{slug}.doc.tsx`) gets an `app` block (`workflow/WEB.md` §7.1):

- **`hero` and `examples`**: the same situations as the web examples, rendered with the React Native component. Each example has its `code` in React Native, Swift and Kotlin, which the Code tab shows.
- **`matrices`**: every variant, rendered with the React Native component, pinning states with `previewState`.
- **`anatomy`**: the anatomy specimen in React Native, with each part tagged by `anatomy('part')`.
- **`visuals`**: React Native versions of the Guidelines visuals, by guideline title. App preview never shows a web component.
- **`notes`**: the "In apps" section of Guidelines: touch area, text size, hover and touch, keyboard focus, screen reader announcements and any platform pattern.

Stories import the previews as a namespace (`import * as App from '@app'`) and use `App.Button`. A component without an `app` block shows "No app version yet", which fails QA for an App product.

# 8. Keeping the previews and Figma in sync

- Changed variables or styles: export again (`workflow/WEB.md` W2) and run A2.
- Changed component properties: change the React Native component and the story's `app` block, including the Swift and Kotlin code, in the same task.
- A difference between a preview and Figma is a bug in the preview, unless the user decides otherwise.

# 9. QA

Automated (all in `kit/web/`):
- `npm run qa`, when the user calls it (`workflow/INITIATOR.md` Part B, *QA on call*), checks every page and tab in App preview, in Light and Dark: no errors, no overflow at phone width, and zero axe WCAG 2.2 AA violations. On a Web and App product it checks both previews.
- `npm run check:contrast`: every color pair AA in every mode.

Review the Code tab against the Figma set: the React Native, Swift and Kotlin code uses the same props and values, and only tokens.

Fail QA when:
- a preview component or the code on the site types a color, size or duration instead of a token;
- a prop or value differs from the Figma property, or a Figma variant is missing from the matrix;
- the React Native, Swift and Kotlin code for an example disagree;
- pressed, disabled, focus, selected or loading looks different from Figma;
- a touch target is smaller than 44 pt (iOS) or 48 dp (Android);
- a control has no role, name or state for screen readers;
- motion ignores the Reduced setting;
- a component page has no `app` block, or it lacks examples with code, the variant matrix or the anatomy;
- App preview shows a web component;
- a brand value is written into `ds-create/app/` (the template stays placeholder-only);
- anything was installed, built or created that "Nothing is installed or built" rules out.
