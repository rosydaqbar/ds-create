# ↳ Verification Input


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Captures a short fixed-length verification code as visually separated character cells.

## Published assets

- `Verification Input`
- `Verification Input / Cell`

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
Verification Input
└─ Cells
   ├─ Verification Input / Cell
   ├─ …
   └─ Verification Input / Cell

Verification Input / Cell
└─ Character
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Root is horizontal Auto Layout.

- gap: 8;
- Cell: Fixed square;
- Character centered;
- group width Hug;
- one focused cell may receive focus styling, while implementation typically uses one underlying input.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Length | VARIANT | 6 | 4 · 6 |
| Size | VARIANT | MD | SM · MD |
| State | VARIANT | Empty | Empty · Filled · Focus · Error · Disabled |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 36 cell | 0 | 8 group gap | none | Body / MD / Medium |
| MD | 44 cell | 0 | 8 group gap | none | Heading / SM |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Empty | surface.default | border.default | text.primary |  |
| Filled | surface.default | border.default | text.primary | Character |
| Focus | surface.default | border.brand | text.primary | + focus on active cell |
| Error | feedback.negative.surface | border.negative | text.negative | All cells or group error |
| Disabled | surface.disabled | border.disabled | text.disabled |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Cell fill | verification.surface.* |  |
| Cell stroke | verification.border.* |  |
| Character | `text.primary` |  |
| Radius | `radius.control` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Visual cells do not require separate keyboard focus targets.
- Pasting a complete code should populate all cells in implementation.
- Length is fixed by variant; do not manually delete cells in an instance.

## Accessibility

- Underlying implementation should expose a clear verification-code label.
- Error message is provided by Field.
- Support paste and platform one-time-code autofill when available.

## Required matrices

- Length × Size
- Cell states
- Error group

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 4 digits
- 6 digits
- all filled
- one active cell
- error
- disabled
- 200% text

## Prohibited combinations and construction errors

- Do not make each visual cell an independent tab stop.
- Do not represent focus by changing text color only.