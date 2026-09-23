# ↳ Radio


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Represents one choice within a mutually exclusive group.


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

- `Radio`

## Private construction components

- None.

## Master layer tree

```text
Radio
├─ Control
│  └─ Dot
└─ Content
   ├─ Label
   └─ Supporting text
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Same layout relationship as Checkbox.

Control is circular. Dot is centered and Fixed. Root aligns to top when text wraps.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Selected | BOOLEAN | False | Selected / unselected |
| State | VARIANT | Rest | Rest · Hover · Pressed · Focus · Disabled |
| Label | BOOLEAN | True |  |
| Supporting text | BOOLEAN | False |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 16 | 0 | 8 | 6 dot | Body / SM / Medium |
| MD | 20 | 0 | 8 | 8 dot | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | surface.default | border.strong | text.primary | No dot |
| Hover | interactive.neutral.hover | border.brand | text.primary |  |
| Pressed | interactive.neutral.pressed | border.brand | text.primary |  |
| Focus | same as Rest | same | same | + Focus / Default |
| Disabled | surface.disabled | border.disabled | text.disabled | Selected dot remains visible |
| Selected | surface.default | border.brand | interactive.brand.rest | Dot visible |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Control fill | `radio.surface.<selected>.<state>` |  |
| Control border | `radio.border.<selected>.<state>` |  |
| Dot | `radio.dot.<state>` |  |
| Label | `text.primary` |  |
| Supporting text | `text.secondary` |  |
| Radius | `radius.full` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Use only inside a group with two or more choices.
- Once a required radio group has a selection, selecting another option moves selection rather than clearing the group.
- Use Checkbox instead when multiple choices may be selected independently.

## Accessibility

- Arrow keys move between options in implementation.
- Space selects the focused option.
- The group has an accessible group label.

## Required matrices

- Selected × State
- Size × Selected
- Text combinations

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 2-line label
- 3-line supporting text
- disabled selected
- focus in group
- 200% text

## Prohibited combinations and construction errors

- Do not use standalone radio controls with no group semantics.
- Do not permit multiple selected radios in one group.