# ↳ Skeleton


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Provides non-content placeholder shapes while content is loading.

## Published assets

- `Skeleton / Text`
- `Skeleton / Rectangle`
- `Skeleton / Circle`

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
Skeleton / Text
└─ Line

Skeleton / Rectangle
└─ Shape

Skeleton / Circle
└─ Shape
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Text skeleton width Fixed/Fill by instance, height 12/16. Rectangle instance controls width/height while radius remains token-bound. Circle Fixed square with radius.full.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Density | VARIANT | Default | Default · Compact |
| Animation | VARIANT | Pulse | None · Pulse · Shimmer |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 12 text line | 0 | 8 between composed lines | none | none |
| MD | 16 text line | 0 | 12 between composed lines | none | none |
| LG | 16 text line | 0 | 12 | none | none |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | skeleton.surface | none | none | Static frame |
| Hover | same | none | none | Noninteractive |
| Pressed | same | none | none |  |
| Focus | same | none | none |  |
| Disabled | same | none | none |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Surface | `skeleton.surface` |  |
| Animation highlight | `skeleton.highlight` | Shimmer only |
| Radius text | `radius.compact` |  |
| Radius rectangle | instance semantic radius |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Skeleton approximates final layout.
- Do not show skeleton and spinner for same region.
- Shimmer is disabled/simplified under reduced motion.

## Accessibility

- Skeletons are generally hidden from accessibility tree; loading is announced at region level where needed.

## Required matrices

- Text shapes
- Rectangle ratios
- Circle sizes
- Animation options

Every matrix title states the fixed properties.

## QA specimens

- card composition
- table row composition
- avatar + text composition

## Prohibited combinations and construction errors

- Do not use skeleton as a permanent empty state.
- Do not make skeletons interactive.