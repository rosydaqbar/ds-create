# ↳ Segmented Control


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Provides a compact set of mutually exclusive view or filter choices with stronger grouping than Tabs.


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

- `Segmented Control`
- `Segmented Control / Item`

## Private construction components

- None.

## Master layer tree

```text
Segmented Control
└─ Items
   ├─ Segmented Control / Item
   └─ …

Item
├─ Icon
└─ Label
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Group root: horizontal Auto Layout, gap=2, padding=2, radius.control, neutral subtle surface. Item: horizontal Auto Layout, center, Hug or Fill, fixed height.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Selected | BOOLEAN | False | Item |
| State | VARIANT | Rest | Rest · Hover · Focus · Disabled |
| Icon | BOOLEAN | False | Item |
| Equal width | BOOLEAN | False | Group behavior specimen |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 28 item | 4 vertical · 10 horizontal | 6 | 16 | Body / SM / Medium |
| MD | 36 item | 8 horizontal | 6 | 18 | Label / MD |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | text.secondary |  |
| Hover | surface.default | none | text.primary |  |
| Focus | surface.default | none | text.primary | + focus on item |
| Disabled | transparent | none | text.disabled |  |
| Selected | surface.default | border.subtle | text.primary | Elevation / 1 optional |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Group fill | `surface.subtle` |  |
| Item selected fill | `surface.default` |  |
| Item foreground | segmented foreground roles |  |
| Radius | `radius.control` | Group; inner item slightly smaller if needed |

No raw color value is allowed in the published master.

## Behavior and content rules

- Use for 2–5 compact options.
- Labels remain single-line.
- Do not use when options require long explanations.

## Accessibility

- Selection is programmatically exposed.
- Arrow-key behavior may follow radio-group semantics.

## Required matrices

- Selected × State
- Size comparison
- Equal vs intrinsic width
- Icon on/off

Every matrix title states the fixed properties.

## QA specimens

- 2 items
- 5 items
- mixed label lengths
- disabled item
- 200% text

## Prohibited combinations and construction errors

- Do not use more than 5 items by default.
- Do not allow multiple selected items in a single-select segmented control.