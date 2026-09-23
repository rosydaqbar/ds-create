# ↳ Text Input


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Single-line text-entry control used inside Field.


## Figma documentation layout

Build this component's documentation as a complete `2528 px`-wide documentation frame using `01-documentation-system.md`.

Required visible structure:

```text
Design system header
Section (80 px padding, 64 px major gap)
  Overview — 720 px Design note + representative specimen
  Anatomy — Design note + annotated real instance
  Sizes — Design note + size matrix/table
  Variants — Design note + variant matrix
  States — Design note + state matrix
  Properties — Design note + property table
  Token bindings — Design note + binding table
  Behavior and content — Design note + examples
  Accessibility — Design note + focused examples
  QA / edge cases — Design note + stress specimens
Design system footer
```

Use the real component or linked instances for every specimen. Do not redraw fake versions for documentation.

Do not move matrices to a separate giant `QA` board. Do not present properties or token bindings as floating pills.

## Published assets

- `Text Input`

## Private construction components

- None.

## Master layer tree

```text
Text Input
├─ Leading
│  ├─ Leading icon
│  └─ Leading text
├─ Value
└─ Trailing
   ├─ Trailing icon
   └─ Trailing action
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout, center aligned.

- width: Fill container when used in Field; master documentation width=320;
- height: Fixed by Size;
- horizontal padding defined by Size;
- Value: Fill width, one line, clip/truncate visually;
- adornments: Hug;
- gap: size-defined;
- trailing action has its own 32/40 px hit target inside the control and must not shrink Value below 40 px.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| State | VARIANT | Empty | Empty · Filled · Hover · Focus · Disabled · Read only |
| Validation | VARIANT | None | None · Error · Success |
| Leading | VARIANT | None | None · Icon · Text |
| Trailing | VARIANT | None | None · Icon · Action |
| Leading icon swap | INSTANCE_SWAP | Default |  |
| Trailing icon swap | INSTANCE_SWAP | Default |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 32 | 8 horizontal | 6 | 16 | Body / SM / Regular |
| MD | 40 | 12 horizontal | 8 | 20 | Body / MD / Regular |
| LG | 48 | 14 horizontal | 8 | 20 | Body / MD / Regular |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Empty | surface.default | border.default | text.muted | Placeholder |
| Filled | surface.default | border.default | text.primary | Value |
| Hover | surface.default | border.strong | text.primary |  |
| Focus | surface.default | border.brand | text.primary | + Focus / Default |
| Disabled | surface.disabled | border.disabled | text.disabled | No action |
| Read only | surface.subtle | border.default | text.primary | Selectable text; no editing |
| Error | surface.default | border.negative | text.primary | + Focus / Negative when focused |
| Success | surface.default | border.positive | text.primary | Optional positive indicator |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Root fill | `field.surface.<state>` |  |
| Root stroke | `field.border.<validation/state>` | 1 px |
| Value | `text.primary` |  |
| Placeholder | `text.muted` |  |
| Adornment | `icon.secondary` |  |
| Disabled content | `text.disabled` / `icon.disabled` |  |
| Radius | `radius.control` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Placeholder is not a substitute for the Field label.
- Trailing Action is reserved for actions such as reveal password or clear; it must not submit the form.
- Leading Text is for stable prefixes such as currency or URL scheme.
- Read only remains selectable but not editable.
- Input value is single-line; long values clip horizontally in Figma specimens.

## Accessibility

- Keyboard behavior follows the native input type.
- Focus state is visible.
- Error state is also described by Field message, not color alone.
- Trailing action has its own accessible name.

## Required matrices

- Size × State
- Validation × State
- Leading types
- Trailing types
- Light × Dark

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 1 character
- 80 characters
- prefix + long value
- trailing action
- disabled filled
- read-only filled
- 200% text

## Prohibited combinations and construction errors

- Do not put label or helper text inside Text Input.
- Do not use Leading Text for editable content.
- Do not show Success merely because a field is non-empty.