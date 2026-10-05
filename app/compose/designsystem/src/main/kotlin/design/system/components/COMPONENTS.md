# Components: Figma page → Compose function

One file per published Figma set, in `components/parts/`, `components/components/` or `components/sections/`, named after the function. Parameters are the Figma properties (APP.md §6.1); the Android rules in APP.md §6.2 apply to every row. Build in page order and only for pages in scope (A4).

Status: `reference` is complete in the template and is the pattern to copy; `to build` is written at A4 from the page spec and the Figma set.

Every component, without exception:
- reads colors through `DsTheme.colors`, motion through `DsTheme.motion`, sizes from `DsSpace`, `DsSize`, `DsRadius`, `DsBorderWidth`, `DsComponent`, and text from `DsTheme.textStyle(DsTextStyles.…)`;
- reserves a 48 dp touch target with `Modifier.dsMinimumTouchTarget()` when its visual is smaller;
- sets role, name and state in semantics, and keeps icons decorative unless they are the only label;
- shows the `focus/default` ring (`Modifier.dsFocusRing`) only for keyboard focus;
- uses `indication = null` and draws pressed and hovered states from tokens (no ripple);
- has a showcase screen (`showcase/docs/{Name}Doc.kt`) and a test file.

## 2 Parts

| Page | Function | File | Status | Compose guidance |
| --- | --- | --- | --- | --- |
| 2.1 Button | `DsButton` | `parts/DsButton.kt` | reference | The pattern for every interactive part: interaction source, token color map, `animateColorAsState`, touch target, semantics, focus ring. |
| 2.2 Icon button | `DsIconButton` | `parts/DsIconButton.kt` | to build | Square from `DsComponent.iconButtonSize*`; `label` becomes `contentDescription`. Smaller sizes always need the 48 dp touch target. |
| 2.3 Link | `DsLink` | `parts/DsLink.kt` | to build | Inline links use `LinkAnnotation` in an `AnnotatedString` so TalkBack lists them as links; a standalone link opens with `LocalUriHandler`. |
| 2.4 Badge | `DsBadge` | `parts/DsBadge.kt` | to build | Not interactive and not focusable. Cap text scaling only on counts, where the spec allows it. |
| 2.5 Tag | `DsTag` | `parts/DsTag.kt` | to build | The remove button is its own 48 dp target, named "Remove {label}". |
| 2.6 Avatar | `DsAvatar` | `parts/DsAvatar.kt` | to build | Takes a `Painter` (image loading stays in the app); the name is the `contentDescription`; initials and icon fallbacks use the `avatarPlaceholder*` tokens. |
| 2.7 Checkbox | `DsCheckbox` | `parts/DsCheckbox.kt` | to build | `Modifier.triStateToggleable(role = Role.Checkbox)`; the mark is a vector from 1.7, animated base · standard. |
| 2.8 Radio | `DsRadio` | `parts/DsRadio.kt` | to build | `Modifier.selectable(role = Role.RadioButton)`; the group wraps its options in `Modifier.selectableGroup()`. |
| 2.9 Switch | `DsSwitch` | `parts/DsSwitch.kt` | to build | `Modifier.toggleable(role = Role.Switch)`; the thumb moves with `animateDpAsState` at base · standard. |
| 2.10 Text control | `DsTextControl` | `parts/DsTextControl.kt` | to build | `BasicTextField` with a token `decorationBox`; set `KeyboardOptions` per input type; text never smaller than `DsFontSize.inputMin`. |
| 2.11 Label | `DsLabel` | `parts/DsLabel.kt` | to build | `BasicText`. A required marker is also spoken (semantics text), never shown by color alone. |
| 2.12 Help text | `DsHelpText` | `parts/DsHelpText.kt` | to build | In the error tone, the field it belongs to sets `semantics { error(text) }` so TalkBack reads it with the field. |
| 2.13 Tooltip | `DsTooltip` | `parts/DsTooltip.kt` | to build | No hover on touch: long-press opens it (a `Popup` from tokens, or foundation's `BasicTooltipBox`). The anchor also carries the text in semantics (`onLongClick` label) so TalkBack users get it. With a mouse, show on hover after `delayTooltip`. |
| 2.14 Progress | `DsProgress` | `parts/DsProgress.kt` | to build | Drawn with `Canvas`; `semantics { progressBarRangeInfo = ProgressBarRangeInfo(value, 0f..1f) }`. |
| 2.15 Spinner | `DsSpinner` | `parts/DsSpinner.kt` | to build | `Canvas` + `rememberInfiniteTransition` over `durationLoop`; standalone it reports `ProgressBarRangeInfo.Indeterminate`. Replace the stand-in inside `DsButton`. |
| 2.16 Divider | `DsDivider` | `parts/DsDivider.kt` | to build | A `Box` one `DsBorderWidth.default` thick; decorative, no semantics. |
| 2.17 Kbd | `DsKbd` | `parts/DsKbd.kt` | to build | Show it only with a hardware keyboard: `LocalConfiguration.current.keyboard == Configuration.KEYBOARD_QWERTY`. |
| 2.18 Slider | `DsSlider` | `parts/DsSlider.kt` | to build | Drag with `Modifier.draggable` or `pointerInput`; semantics `progressBarRangeInfo` + `setProgress`; the thumb keeps a 48 dp target. |
| 2.19 Featured icon | `DsFeaturedIcon` | `parts/DsFeaturedIcon.kt` | to build | Decorative container from `DsComponent.featuredIconSize*`; the icon inside stays decorative. |

## 3 Components

| Page | Function | File | Status | Compose guidance |
| --- | --- | --- | --- | --- |
| 3.1 Button group | `DsButtonGroup` | `components/DsButtonGroup.kt` | to build | A `Row` of segments; single-select segments use `selectableGroup()` and `Role.RadioButton` with a selected state. |
| 3.2 Text field | `DsTextField` | `components/DsTextField.kt` | to build | Composes Label, Text control and Help text; the error text goes into the control's `semantics { error(…) }`. |
| 3.3 Choice field | `DsChoiceField` | `components/DsChoiceField.kt` | to build | The whole row (control + label + help) is one toggle target with the control's role. |
| 3.4 Avatar group | `DsAvatarGroup` | `components/DsAvatarGroup.kt` | to build | Overlap with the negative `DsComponent.avatarGroupOverlap*` in a custom `Layout`; the group has one name ("5 people"), and the avatars inside are hidden from TalkBack. |
| 3.5 Select | `DsSelect` | `components/DsSelect.kt` | to build | On phones, open the options in a bottom sheet built from system tokens (foundation `Dialog` + `anchoredDraggable`); on tablets, a `Popup` under the trigger. Back closes it. Document the difference on its showcase screen. |
| 3.6 Menu | `DsMenu` | `components/DsMenu.kt` | to build | A `Popup` anchored to the trigger, `DsComponent.menuWidth` wide; enters base · enter, leaves fast · exit; back and Escape close it. |
| 3.7 Social button | `DsSocialButton` | `components/DsSocialButton.kt` | to build | Provider colors from the `socialButton*` component tokens; provider marks as vector drawables from 1.8. Same touch and semantics rules as Button. |
| 3.8 Badge group | `DsBadgeGroup` | `components/DsBadgeGroup.kt` | to build | Not interactive unless the spec says so; when it links somewhere, the whole row is one clickable target. |

## 4 Sections

| Page | Function | File | Status | Compose guidance |
| --- | --- | --- | --- | --- |
| 4.1 Rich text editor | `DsRichTextEditor` | `sections/DsRichTextEditor.kt` | to build | Wrap the platform editor (`BasicTextField` with styled spans, or an `EditText` through `AndroidView`); keep the Figma toolbar and chrome, built from Icon button and Button group. |
| 4.2 Video player | `DsVideoPlayer` | `sections/DsVideoPlayer.kt` | to build | Media3 `PlayerView` through `AndroidView` with `useController = false`; draw the Figma chrome in Compose from the `videoPlayer*` tokens. Add Media3 as a dependency only when this page is in scope. |
