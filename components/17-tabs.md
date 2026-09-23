# ↳ Tabs


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Switches between peer content views within the same context.


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

- `Tabs / List`
- `Tabs / Item`

## Private construction components

- None.

## Master layer tree

```text
Tabs / List
└─ Items
   ├─ Tabs / Item
   └─ …

Tabs / Item
├─ Icon
├─ Label
├─ Badge
└─ Indicator
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

List: horizontal Auto Layout, gap style-dependent, width Hug or Fill. Item: horizontal Auto Layout; center aligned; fixed min height; label one line. Underline indicator is bottom aligned. Pill style uses container fill/radius instead.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Style | VARIANT | Underline | Underline · Pill |
| Selected | BOOLEAN | False | Item |
| State | VARIANT | Rest | Rest · Hover · Focus · Disabled |
| Icon | BOOLEAN | False | Item |
| Badge | BOOLEAN | False | Item |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 36 | 8 vertical · 10 horizontal | 6 | 16 | Body / SM / Medium |
| MD | 44 | 10 vertical · 12 horizontal | 8 | 20 | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | text.secondary | Indicator hidden |
| Hover | surface.subtle or transparent | none | text.primary |  |
| Focus | same as current | none | same | + focus |
| Disabled | transparent | none | text.disabled |  |
| Selected | tabs.selected.surface | none | tabs.selected.foreground | Indicator visible for Underline |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Label/icon | tabs foreground roles |  |
| Underline indicator | `interactive.brand.rest` | 2 px |
| Pill selected fill | `interactive.neutral.rest` or component alias |  |
| Focus | Focus style |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Tab labels remain single-line.
- Horizontal scrolling at small viewport sizes is a composition behavior.
- Badge content is compact status/count only.
- Changing tabs changes the associated panel without navigation to a new page.

## Accessibility

- Arrow keys move between tabs in implementation.
- Selected tab exposes selected state and controls its panel.
- Focus and selection remain visually distinct.

## Required matrices

- Selected × State
- Size × Style
- Icon/badge combinations
- 5-tab list example

Every matrix title states the fixed properties.

## QA specimens

- 2 tabs
- 8 tabs
- long label
- badge count
- 200% text

## Prohibited combinations and construction errors

- Do not use Tabs for primary site navigation.
- Do not make a disabled tab the selected tab.