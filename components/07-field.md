# ↳ Field


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Provides the reusable label, required marker, control slot, supporting text, and validation message around form controls.

## Published assets

- `Field`

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
Field
├─ Label row
│  ├─ Label
│  └─ Required indicator
├─ Control slot
└─ Message row
   ├─ Status icon
   └─ Message
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Vertical Auto Layout.

- width: Fill container by default when inserted into forms; master width=320 for documentation only;
- height: Hug;
- gap Label row→Control: 6;
- gap Control→Message row: 6;
- Label row: horizontal Auto Layout, gap=4;
- Message row: horizontal Auto Layout, gap=6, top aligned;
- Control slot: Fill width;
- Message: Fill width, wraps.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Label | BOOLEAN | True |  |
| Required | BOOLEAN | False | Shows required indicator when Label=True |
| Supporting text | BOOLEAN | False |  |
| Validation | VARIANT | None | None · Error · Success |
| Control | INSTANCE_SWAP | Text Input | Accepts approved field-compatible control instances |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | Hug | 6 vertical relationships | 6 | 14 status icon | Label / SM |
| MD | Hug | 6 vertical relationships | 6 | 16 status icon | Label / MD |
| LG | Hug | 8 vertical relationships | 8 | 16 status icon | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | text.primary | Message uses text.secondary |
| Hover | transparent | none | same | Driven by control |
| Pressed | transparent | none | same | Driven by control |
| Focus | transparent | none | same | Driven by control |
| Disabled | transparent | none | text.disabled | All text disabled |
| Error | transparent | none | text.primary | Message + icon use text.negative |
| Success | transparent | none | text.primary | Message + icon use text.positive |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Label | `text.primary` |  |
| Required indicator | `text.negative` or neutral semantic marker | Never raw red |
| Supporting message | `text.secondary` |  |
| Error message | `text.negative` |  |
| Success message | `text.positive` |  |
| Status icon | feedback foreground token |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Field does not draw the input border; the swapped control owns its visual state.
- Error/Success on Field must be synchronized with the swapped control validation state.
- Supporting text and validation message occupy the same Message row. Validation replaces supporting text rather than stacking duplicate messages unless the product explicitly needs both.
- Required indicator is presentation; implementation still exposes required semantics.

## Accessibility

- Label must be programmatically associated with the control.
- Error message must be programmatically associated with the control.
- Required state must not rely only on an asterisk.

## Required matrices

- Label × Supporting text
- Validation states
- Compatible control examples
- Required on/off

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 2-line label
- 4-line error
- no label
- required + long label
- 200% text

## Prohibited combinations and construction errors

- Do not place helper text inside the control slot.
- Do not duplicate an error message both inside the control and below the Field.