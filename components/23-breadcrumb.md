# ↳ Breadcrumb


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Shows the current location within a hierarchy and allows navigation to ancestor levels.

## Published assets

- `Breadcrumb`
- `Breadcrumb / Item`

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
Breadcrumb
└─ Items
   ├─ Breadcrumb / Item
   ├─ Separator
   └─ …

Breadcrumb / Item
├─ Icon
└─ Label
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Breadcrumb root: horizontal Auto Layout, center, gap=8. Item: horizontal Auto Layout, gap=4, Hug. Labels one line; ancestors may truncate; current item should remain visible.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Current | BOOLEAN | False | Item |
| Icon | BOOLEAN | False | Item leading icon |
| Collapsed | BOOLEAN | False | Item may represent ellipsis |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 24 | 0 | 6 | 14 | Body / SM / Medium |
| MD | 28 | 0 | 8 | 16 | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | text.secondary | Ancestor link |
| Hover | transparent | none | text.primary | Ancestor |
| Pressed | transparent | none | text.primary |  |
| Focus | transparent | none | text.primary | + focus around item |
| Disabled | transparent | none | text.disabled | Rare |
| Current | transparent | none | text.primary | Not interactive |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Ancestor | `breadcrumb.foreground.rest/hover` |  |
| Current | `text.primary` |  |
| Separator | `icon.muted` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Current item is last and not a link.
- When space is insufficient, collapse middle ancestors before first/current.
- Separator mirrors in RTL where directional.

## Accessibility

- Expose breadcrumb navigation semantics.
- Current item exposes current-page/location state.

## Required matrices

- 4-level path
- Collapsed path
- Size × icon
- State ancestors

Every matrix title states the fixed properties.

## QA specimens

- long first item
- long current item
- 6 levels
- RTL

## Prohibited combinations and construction errors

- Do not make the current item clickable to the same destination.
- Do not collapse first and current items simultaneously.