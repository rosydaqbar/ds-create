# ↳ Select


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Single-value selection trigger that opens a list of predefined options.

## Published assets

- `Select`

## Private construction components

- None.

## Figma page structure

```text
00 — Documentation
10 — Source
20 — Matrices
30 — QA

```

The Source zone contains masters only. Matrices and QA use linked instances.

## Master layer tree

```text
Select
├─ Leading icon
├─ Value
└─ Chevron
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout, center aligned.

- width: Fill container;
- height: Fixed by Size;
- Value: Fill width, one line, truncates;
- Chevron: Fixed icon;
- Leading icon: optional Fixed icon;
- root padding follows Text Input sizing.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| State | VARIANT | Empty | Empty · Filled · Hover · Focus · Open · Disabled |
| Validation | VARIANT | None | None · Error · Success |
| Leading icon | BOOLEAN | False |  |
| Leading icon swap | INSTANCE_SWAP | Default |  |

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
| Empty | surface.default | border.default | text.muted | Chevron down |
| Filled | surface.default | border.default | text.primary | Chevron down |
| Hover | surface.default | border.strong | text.primary |  |
| Focus | surface.default | border.brand | text.primary | + focus |
| Open | surface.default | border.brand | text.primary | Chevron up or rotated |
| Disabled | surface.disabled | border.disabled | text.disabled |  |
| Error | surface.default | border.negative | text.primary |  |
| Success | surface.default | border.positive | text.primary |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Root fill | `field.surface.*` |  |
| Root stroke | `field.border.*` |  |
| Value | `text.primary` / `text.muted` |  |
| Leading icon | `icon.secondary` |  |
| Chevron | `icon.secondary` |  |
| Radius | `radius.control` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Select displays one chosen option; use Combobox when search/filtering is required.
- The trigger does not contain the option menu; menu is a separate component instance in composed designs.
- Selected option text truncates rather than wrapping.

## Accessibility

- Expose expanded state.
- Keyboard interaction follows the platform select/listbox pattern.
- Selected option is programmatically exposed.

## Required matrices

- Size × State
- Validation states
- Empty vs Filled
- Leading icon on/off

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 60-character option
- disabled filled
- open focus
- 200% text

## Prohibited combinations and construction errors

- Do not embed a free-text field inside Select.
- Do not draw the dropdown menu inside the Select master.