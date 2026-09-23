# ↳ Combobox


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Searchable text/select control that can filter and choose options.


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

- `Combobox`

## Private construction components

- None.

## Master layer tree

```text
Combobox
├─ Leading icon
├─ Value / Query
├─ Clear action
└─ Chevron
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout.

- width Fill;
- fixed control height;
- query Fill;
- actions Hug;
- no wrapping;
- open state affects Chevron and border/focus only; option list remains external.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| State | VARIANT | Empty | Empty · Typing · Filled · Hover · Focus · Open · Disabled |
| Validation | VARIANT | None | None · Error · Success |
| Clear action | BOOLEAN | False |  |
| Leading icon | BOOLEAN | True | Usually search |

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
| Empty | surface.default | border.default | text.muted |  |
| Typing | surface.default | border.brand | text.primary | Query visible |
| Filled | surface.default | border.default | text.primary | Selected value |
| Hover | surface.default | border.strong | text.primary |  |
| Focus | surface.default | border.brand | text.primary | + focus |
| Open | surface.default | border.brand | text.primary | expanded |
| Disabled | surface.disabled | border.disabled | text.disabled |  |
| Error | surface.default | border.negative | text.primary |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Root | field semantic roles |  |
| Query | `text.primary` |  |
| Placeholder | `text.muted` |  |
| Icons | `icon.secondary` |  |
| Clear action hover | `interactive.neutral.hover` | Hit target independent from field |

No raw color value is allowed in the published master.

## Behavior and content rules

- Typing and selected value are distinct states.
- Clear action appears only when there is clearable content.
- Option filtering behavior belongs to implementation but its visual loading/empty states are documented with Menu & Dropdown.

## Accessibility

- Expose combobox, expanded, controls, and active-descendant semantics in implementation.
- Arrow keys move through options while open.
- Escape closes without unexpected selection.

## Required matrices

- State progression
- Size × Rest
- Validation
- Clear on/off

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- long query
- long selected value
- no results composition
- loading composition
- 200% text

## Prohibited combinations and construction errors

- Do not use Combobox for a fixed list with no search need.
- Do not put the option list inside the master.