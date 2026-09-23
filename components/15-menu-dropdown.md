# ↳ Menu & Dropdown


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Displays a temporary list of actions or choices anchored to a trigger. The family defines menu surfaces and items; triggers remain separate components.


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

- `Menu`
- `Menu / Item`
- `Menu / Group label`
- `Menu / Divider`

## Private construction components

- None.

## Master layer tree

```text
Menu
├─ Group label
├─ Item
├─ Item
├─ Divider
└─ Item

Menu / Item
├─ Leading slot
├─ Label
└─ Trailing slot
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Menu: vertical Auto Layout; width constrained between 180 and 320 by default; padding 4–6; gap 2; effect Elevation / 3.
Item: horizontal Auto Layout; width Fill; fixed min height; label Fill; slots Hug; one-line label by default.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Item state | VARIANT | Rest | Rest · Hover · Focus · Disabled · Selected |
| Leading | VARIANT | None | None · Icon · Check |
| Trailing | VARIANT | None | None · Shortcut · Text · Chevron |
| Destructive | BOOLEAN | False | Item only |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 32 item | 6 vertical · 8 horizontal | 8 | 16 | Body / SM / Regular |
| MD | 40 item | 8 horizontal | 8 | 20 | Body / MD / Regular |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | text.primary |  |
| Hover | surface.subtle | none | text.primary |  |
| Focus | surface.subtle | none | text.primary | Focus highlight inside menu |
| Disabled | transparent | none | text.disabled |  |
| Selected | interactive.neutral.rest | none | text.primary | Check or semantic selected marker |
| Destructive | transparent | none | text.negative | Hover uses negative-subtle surface |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Menu surface | `surface.raised` |  |
| Menu radius | `radius.container` |  |
| Menu effect | `Elevation / 3` |  |
| Item hover | `surface.subtle` |  |
| Item text | semantic text roles |  |
| Destructive item | negative semantic roles |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Submenu-chevron items do not also show shortcut text.
- Selected and destructive are separate concepts.
- Dividers separate conceptual groups, not every item.
- Long labels truncate at max width.

## Accessibility

- Arrow keys navigate menu items.
- Escape closes and returns focus to trigger.
- Disabled items are not activatable.
- Focus order follows visual order.

## Required matrices

- Item state × leading/trailing
- Menu sizes
- Selected/destructive
- Grouped menu example

Every matrix title states the fixed properties.

## QA specimens

- 180 px width
- 320 px width
- long label truncation
- shortcut text
- submenu
- all-disabled group
- 200% text

## Prohibited combinations and construction errors

- Do not build trigger and menu into one master component.
- Do not use hover-only discovery for destructive meaning.