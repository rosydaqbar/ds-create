# Components (SwiftUI)

Every component page in the ds-create tree, its Swift type and where it stands in this template. One file per published Figma set, in the level folder (`Parts/`, `Components/`, `Sections/`), props named after the Figma properties (APP.md §6.1). `DSButton` is the reference: copy its structure (enums for variants, `ButtonStyle` for platform states, a `Palette` from tokens, scaled metrics, 44 pt hit area, accessibility, `previewState`).

Build only the pages in scope, in page order (A4). Change the status to `built` when the component and its showcase screen are done.

| Page | Swift type | Status | SwiftUI guidance |
| --- | --- | --- | --- |
| 2.1 Button | `DSButton` | reference | `Button` + `ButtonStyle`; loading uses a `ProgressView` stand-in until 2.15 exists. |
| 2.2 Icon button | `DSIconButton` | to build | Square, always 44 × 44 pt hit area; `label` is the VoiceOver name; pair with a tooltip (2.13). |
| 2.3 Link | `DSLink` | to build | Wrap SwiftUI `Link` for URLs or `Button` for in-app routes; add `.isLink` trait. |
| 2.4 Badge | `DSBadge` | to build | Static, not a control; cap Dynamic Type on counts only (`.dynamicTypeSize(...accessibility2)`). |
| 2.5 Tag | `DSTag` | to build | The remove button is its own 44 pt target with a name ("Remove {tag}"). |
| 2.6 Avatar | `DSAvatar` | to build | `AsyncImage` with the initials placeholder; the image is decorative when a name sits next to it. |
| 2.7 Checkbox | `DSCheckbox` | to build | `Toggle` with a custom `ToggleStyle`; mixed state via `.accessibilityValue`. |
| 2.8 Radio | `DSRadio` | to build | Group in a container with `.accessibilityElement(children: .contain)`; selected via `.isSelected`. |
| 2.9 Switch | `DSSwitch` | to build | `Toggle` + `ToggleStyle` drawn from tokens; toggle motion base · standard; add selection haptic. |
| 2.10 Text control | `DSTextControl` | to build | `TextField` / `SecureField` with `.textFieldStyle` from tokens; font never below `font/size/input-min`. |
| 2.11 Label | `DSLabel` | to build | Combine with its field for VoiceOver (`.accessibilityLabel` on the field), not read twice. |
| 2.12 Help text | `DSHelpText` | to build | Attach to the field as `.accessibilityHint`; error text also posts an announcement. |
| 2.13 Tooltip | `DSTooltip` | to build | No hover on touch: show on long-press (`.onLongPressGesture` / popover), and give the control an `.accessibilityHint` with the same text. Pointer hover on iPad. |
| 2.14 Progress | `DSProgress` | to build | `ProgressView(value:)` with a custom `ProgressViewStyle`; value as `.accessibilityValue`. |
| 2.15 Spinner | `DSSpinner` | to build | Custom rotating arc on `motion/duration/loop`; Reduced motion uses the Reduced loop value. Replaces the stand-in in `DSButton`. |
| 2.16 Divider | `DSDivider` | to build | A `Rectangle` of `border/width/default`; hidden from VoiceOver. |
| 2.17 Kbd | `DSKbd` | to build | Show only when a hardware keyboard is connected (`GCKeyboard.coalesced != nil`); pair shortcuts with `.keyboardShortcut`. |
| 2.18 Slider | `DSSlider` | to build | Wrap `Slider` behavior with a token-drawn track and thumb; adjustable via `.accessibilityAdjustableAction`. |
| 2.19 Featured icon | `DSFeaturedIcon` | to build | Decorative unless it carries meaning; then give it a label. |
| 3.1 Button group | `DSButtonGroup` | to build | Segmented behavior: one selected item with `.isSelected`; scroll horizontally at large text sizes. |
| 3.2 Text field | `DSTextField` | to build | Composes 2.11 Label, 2.10 Text control, 2.12 Help text; error state read by VoiceOver. |
| 3.3 Choice field | `DSChoiceField` | to build | Composes checkbox, radio or switch with label and help text; the whole row is the tap target. |
| 3.4 Avatar group | `DSAvatarGroup` | to build | One VoiceOver element ("{n} people"); the overflow count is not a button unless the spec says so. |
| 3.5 Select | `DSSelect` | to build | Trigger drawn from tokens; open a `Menu` for short lists and a sheet (`.presentationDetents`) for long or searchable ones. Document the difference on the showcase screen. |
| 3.6 Menu | `DSMenu` | to build | SwiftUI `Menu` for system behavior, or a token-drawn popover where the spec needs custom rows; enter base · enter, leave fast · exit. |
| 3.7 Social button | `DSSocialButton` | to build | Provider marks from 1.8 Brand assets; Sign in with Apple uses Apple's own `SignInWithAppleButton` where required. |
| 3.8 Badge group | `DSBadgeGroup` | to build | Wraps at large text sizes; one VoiceOver element unless the badges are interactive. |
| 4.1 Rich text editor | `DSRichTextEditor` | to build | Wrap `TextEditor` (iOS 17) or `UITextView` via `UIViewRepresentable` for attributed text; keep the Figma toolbar chrome. |
| 4.2 Video player | `DSVideoPlayer` | to build | `AVKit` `VideoPlayer` (or `AVPlayerLayer`) with the Figma chrome drawn on top; captions and AirPlay from the platform. |
