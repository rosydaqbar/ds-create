# ↳ Divider


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Separates adjacent content regions without adding semantic hierarchy by itself.


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

- `Divider`

## Private construction components

- None.

## Master layer tree

```text
Divider
├─ Line start
├─ Label
└─ Line end
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal: width Fill, height Hug; lines Fill; label Hug. Vertical: width Hug, height Fill; one line only; Label=False. Line thickness is 1 px; Strong may use 2 px only if border foundation permits.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Orientation | VARIANT | Horizontal | Horizontal · Vertical |
| Strength | VARIANT | Subtle | Subtle · Default · Strong |
| Label | BOOLEAN | False | Horizontal only |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 1 line | 0 | 8 when label | none | Body / SM |
| MD | 1 line | 0 | 12 when label | none | Body / SM |
| LG | 1 line | 0 | 16 when label | none | Body / MD |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | border semantic | text.secondary |  |
| Hover | same | same | same | Noninteractive |
| Pressed | same | same | same |  |
| Focus | same | same | same |  |
| Disabled | same | same | same |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Line | `border.<strength>` |  |
| Label | `text.secondary` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Use Label only when divider represents a named boundary such as “or”.
- Do not use repeated dividers as a substitute for spacing.

## Accessibility

- Decorative dividers are hidden from assistive technology unless they convey structure.

## Required matrices

- Orientation × Strength
- Label on/off

Every matrix title states the fixed properties.

## QA specimens

- full-width
- short container
- long label

## Prohibited combinations and construction errors

- Do not use a Divider where section spacing alone is sufficient.