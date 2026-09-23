# ↳ Pagination


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Moves between discrete pages of a larger result set.


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

- `Pagination`
- `Pagination / Item`

## Private construction components

- None.

## Master layer tree

```text
Pagination
├─ Previous
├─ Pages
│  ├─ Page item
│  ├─ Ellipsis
│  └─ Page item
└─ Next
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Root horizontal Auto Layout, center, gap=4. Page item Fixed square. Previous/Next Hug width. Ellipsis Fixed square and noninteractive.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Item type | VARIANT | Page | Page · Previous · Next · Ellipsis |
| Selected | BOOLEAN | False | Page item |
| State | VARIANT | Rest | Rest · Hover · Focus · Disabled |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 32 | 0 | 4 | 16 | Body / SM / Medium |
| MD | 40 | 0 | 4 | 20 | Label / MD |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | text.secondary |  |
| Hover | surface.subtle | none | text.primary |  |
| Focus | transparent | none | text.primary | + focus |
| Disabled | transparent | none | text.disabled | Previous/Next boundary |
| Selected | interactive.neutral.rest | border.default | text.primary | Current page |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Item fill | pagination surface roles |  |
| Item foreground | pagination foreground roles |  |
| Selected border | `border.default` |  |
| Radius | `radius.control` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Use ellipsis for omitted ranges.
- Selected current page is not visually disabled.
- Previous disabled on first page; Next on last page.

## Accessibility

- Navigation has an accessible label.
- Current page exposes current-page state.
- Page links include enough context for screen readers.

## Required matrices

- 1–5 pages
- large range with ellipsis
- Selected × State
- Size

Every matrix title states the fixed properties.

## QA specimens

- page 1
- last page
- 1000 pages
- 200% text

## Prohibited combinations and construction errors

- Do not render every page in a very large set.
- Do not use disabled styling for selected page.