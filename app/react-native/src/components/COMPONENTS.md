# Components

One file per published Figma set, in page order (APP.md A4, §6). Button is the complete reference: copy its structure (props = Figma properties, tokens through `useTheme()`, platform states, touch target, accessibility, motion) for every other page in scope. The platform notes come from APP.md §6.2; each one also goes on the component's showcase screen (`platformNotes` in its doc object).

| Page | React Native file | Status | Platform notes |
| --- | --- | --- | --- |
| 2.1 Button | `parts/Button.tsx` | reference | `hitSlop` grows the touch area on sizes under the touch target. The label wraps only at the largest text sizes and never clips. |
| 2.2 Icon button | `parts/IconButton.tsx` | to build | Always square with `hitSlop`; `label` becomes `accessibilityLabel`. Pair with a long-press tooltip (2.13). |
| 2.3 Link | `parts/Link.tsx` | to build | `accessibilityRole="link"`. Inline links are nested `<Text onPress>` so they wrap with the sentence. |
| 2.4 Badge | `parts/Badge.tsx` | to build | Count badges are the one place to cap text scaling (`maxFontSizeMultiplier`), and only where the spec says so. |
| 2.5 Tag | `parts/Tag.tsx` | to build | The remove action is its own button with a touch target and a name ("Remove {label}"). |
| 2.6 Avatar | `parts/Avatar.tsx` | to build | Image with an initials fallback. Hidden from screen readers when the name is already next to it. |
| 2.7 Checkbox | `parts/Checkbox.tsx` | to build | `accessibilityRole="checkbox"` with `checked: true / false / 'mixed'`. The whole row is the touch target. |
| 2.8 Radio | `parts/Radio.tsx` | to build | `accessibilityRole="radio"` with `checked`, inside a `radiogroup`. |
| 2.9 Switch | `parts/Switch.tsx` | to build | Draw the track and thumb from tokens (the platform switch ignores them) with `accessibilityRole="switch"`. Toggle motion: base · standard. |
| 2.10 Text control | `parts/TextControl.tsx` | to build | `TextInput` styled by tokens, placeholder color from `color/text/placeholder`. Multiline grows with its content. |
| 2.11 Label | `parts/Label.tsx` | to build | Screen readers get the label as part of the field's name, not as a separate stop. |
| 2.12 Help text | `parts/HelpText.tsx` | to build | Errors are announced when they appear (`accessibilityLiveRegion` on Android, `announceForAccessibility` on iOS). |
| 2.13 Tooltip | `parts/Tooltip.tsx` | to build | No hover on touch: show it on long-press, and give the trigger an `accessibilityHint` with the same text. Delay from `motion/delay/tooltip`. |
| 2.14 Progress | `parts/Progress.tsx` | to build | `accessibilityRole="progressbar"` with `accessibilityValue` (min, max, now). |
| 2.15 Spinner | `parts/Spinner.tsx` | to build | Rotation on the native driver, one turn per `motion/duration/loop` (slower under Reduced). Replaces the stand-in inside Button. |
| 2.16 Divider | `parts/Divider.tsx` | to build | Decorative: hidden from screen readers. |
| 2.17 Kbd | `parts/Kbd.tsx` | to build | Shows only when a hardware keyboard is connected; otherwise the shortcut hint is hidden. |
| 2.18 Slider | `parts/Slider.tsx` | to build | `accessibilityRole="adjustable"` with increment and decrement actions. The thumb keeps the full touch target. |
| 2.19 Featured icon | `parts/FeaturedIcon.tsx` | to build | Decorative by default; takes a name only when it carries meaning on its own. |
| 3.1 Button group | `components/ButtonGroup.tsx` | to build | Segmented groups are a `radiogroup` with a selected state per item. Swap it into the showcase controls once built. |
| 3.2 Text field | `components/TextField.tsx` | to build | Set the keyboard type and autofill (`autoComplete`, `textContentType`), and keep the field visible above the keyboard. |
| 3.3 Choice field | `components/ChoiceField.tsx` | to build | The whole row, label included, toggles the choice. |
| 3.4 Avatar group | `components/AvatarGroup.tsx` | to build | One name for the whole group ("5 people") instead of one stop per avatar. |
| 3.5 Select | `components/Select.tsx` | to build | Opens a bottom sheet on phones and an anchored list on tablets. The system back gesture closes it. |
| 3.6 Menu | `components/Menu.tsx` | to build | A bottom sheet on phones, anchored on tablets. Enters base · enter, leaves fast · exit; back closes it. |
| 3.7 Social button | `components/SocialButton.tsx` | to build | Follow each provider's own native sign-in rules; colors come from the component tokens. |
| 3.8 Badge group | `components/BadgeGroup.tsx` | to build | Screen readers read the group as one phrase. |
| 4.1 Rich text editor | `sections/RichTextEditor.tsx` | to build | Wrap the platform's own rich text view and keep the Figma toolbar chrome. |
| 4.2 Video player | `sections/VideoPlayer.tsx` | to build | Wrap the platform media view and keep the Figma controls. System fullscreen and picture-in-picture where allowed. |

For each page you build: add the export to `index.ts`, a test under `__tests__/` (render, role, name, state), a doc object in `src/showcase/docs/` and its entry in `src/showcase/registry.ts`, then change its status here.
