# ↳ Search Input


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Text-entry control optimized for search, with persistent search icon and optional clear action.

## Published assets

- `Search Input`

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
Search Input
├─ Search icon
├─ Query
└─ Clear action
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout, center aligned; width Fill; fixed height.

Query is Fill. Search icon and Clear action are Fixed/Hug.
Clear action receives a minimum 32 px hit target inside the control.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| State | VARIANT | Empty | Empty · Filled · Hover · Focus · Disabled |
| Clear action | BOOLEAN | True | Visible only when filled in implementation |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 32 | 8 | 6 | 16 | Body / SM / Regular |
| MD | 40 | 12 | 8 | 20 | Body / MD / Regular |
| LG | 48 | 14 | 8 | 20 | Body / MD / Regular |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Empty | surface.default | border.default | text.muted | Clear hidden |
| Filled | surface.default | border.default | text.primary | Clear visible |
| Hover | surface.default | border.strong | text.primary |  |
| Focus | surface.default | border.brand | text.primary | + focus |
| Disabled | surface.disabled | border.disabled | text.disabled | Clear disabled |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Search icon | `icon.secondary` |  |
| Query | `text.primary` |  |
| Placeholder | `text.muted` |  |
| Clear icon | `icon.secondary` |  |
| Root | field surface/border roles |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Enter may submit search depending on product behavior.
- Clear removes the current query and returns focus to the search field.
- Do not use Search Input as a general-purpose Text Input with a decorative search icon.

## Accessibility

- Search field has an accessible label even when visual label is omitted.
- Clear action has an accessible name.

## Required matrices

- Size × State
- Empty/Filled
- Clear on/off

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 80-character query
- clear hover/focus
- disabled filled
- 200% text

## Prohibited combinations and construction errors

- Do not use placeholder alone as the accessible label.