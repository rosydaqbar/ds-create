# ↳ Checkbox


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Represents independent binary or multi-select choices and supports an indeterminate state.

## Published assets

- `Checkbox`

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
Checkbox
├─ Control
│  └─ Mark
└─ Content
   ├─ Label
   └─ Supporting text
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Root: horizontal Auto Layout, top aligned, Hug × Hug.

- gap Control→Content: 8;
- Control is Fixed square;
- Content is vertical Auto Layout, gap=2, Hug height;
- when Label=False, Content is hidden and root becomes square;
- supporting text width may Fill in product compositions; master remains Hug with max example width documented.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Selection | VARIANT | Unselected | Unselected · Selected · Indeterminate |
| State | VARIANT | Rest | Rest · Hover · Pressed · Focus · Disabled |
| Label | BOOLEAN | True | Shows label |
| Supporting text | BOOLEAN | False | Shows supporting text |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 16 | 0 | 8 | 12 mark | Body / SM / Medium |
| MD | 20 | 0 | 8 | 14 mark | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | surface.default | border.strong | text.primary | Selection mark when selected |
| Hover | interactive.neutral.hover | border.brand | text.primary |  |
| Pressed | interactive.neutral.pressed | border.brand | text.primary |  |
| Focus | same as Rest | same | same | + Focus / Default around Control |
| Disabled | surface.disabled | border.disabled | text.disabled | Selection remains visible |
| Selected | interactive.brand.rest | border.brand | icon.inverse | Check mark |
| Indeterminate | interactive.brand.rest | border.brand | icon.inverse | Horizontal mark |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Control fill | `checkbox.surface.<selection>.<state>` |  |
| Control stroke | `checkbox.border.<selection>.<state>` | 1 px |
| Mark | `checkbox.mark.<state>` | Check or minus |
| Label | `text.primary` / `text.disabled` |  |
| Supporting text | `text.secondary` / `text.disabled` |  |
| Radius | `radius.compact` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Clicking label and control activates the checkbox.
- Supporting text belongs to the same option and is part of the clickable label region where implementation permits.
- Indeterminate is a display/input state controlled by application logic; activating it normally resolves to selected.

## Accessibility

- Space toggles when focused.
- Programmatically expose checked, unchecked, or mixed.
- Do not use color alone to indicate selected state.
- The total clickable target should reach 44 px when layout permits.

## Required matrices

- Selection × State — Size=MD
- Size × Selection
- Label/supporting-text combinations
- Light × Dark

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- label wraps to 2 lines
- supporting text 3 lines
- control only
- disabled selected
- indeterminate focus
- 200% text

## Prohibited combinations and construction errors

- Do not replace Indeterminate with a partially transparent check.
- Do not vertically center the control to a multi-line supporting paragraph; align to the first text line.