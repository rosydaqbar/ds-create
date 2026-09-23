# ↳ Tooltip


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Provides short supplemental text for an element on hover or keyboard focus.


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

- `Tooltip`

## Private construction components

- None.

## Master layer tree

```text
Tooltip
├─ Surface
│  ├─ Title
│  └─ Supporting text
└─ Arrow
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Vertical Auto Layout inside Surface. Width Hug up to max 280; min width 40; padding 8 vertical · 10 horizontal; gap 2; arrow positioned by Placement; text wraps after max width; effect Elevation / 3.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Placement | VARIANT | Top | Top · Right · Bottom · Left |
| Arrow | BOOLEAN | True |  |
| Supporting text | BOOLEAN | False |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | Hug | 8 × 10 | 2 | 8 arrow | Body / SM / Medium |
| MD | Hug | 10 × 12 | 4 | 8 arrow | Body / SM / Medium |
| LG | Hug | 10 × 12 | 4 | 8 arrow | Body / SM / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | surface.inverse | none | text.inverse | Visible specimen |
| Hover | same | none | same | Trigger-owned |
| Pressed | same | none | same | Not applicable |
| Focus | same | none | same | Trigger-owned |
| Disabled | same | none | same | May explain disabled control if intentional |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Surface | `tooltip.surface` |  |
| Text | `tooltip.foreground` |  |
| Supporting | `tooltip.supporting` |  |
| Radius | `radius.compact` |  |
| Effect | `Elevation / 3` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Tooltip copy is concise.
- Do not put required workflow information only in a tooltip.
- Tooltip does not contain interactive controls.
- Placement may flip in implementation to remain on-screen.

## Accessibility

- Appears on keyboard focus as well as pointer hover.
- Dismissible via Escape where required.
- Trigger has an accessible name independent of tooltip when possible.

## Required matrices

- Placement
- Arrow on/off
- Supporting text on/off
- Short vs max-width text

Every matrix title states the fixed properties.

## QA specimens

- 1-word tooltip
- 280 px wrapped tooltip
- 200% text

## Prohibited combinations and construction errors

- Do not put buttons or links inside Tooltip.
- Do not use Tooltip as an error message.