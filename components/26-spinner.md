# ↳ Spinner


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Indicates indeterminate loading for a compact region or control.

## Published assets

- `Spinner`

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
Spinner
└─ Indicator
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Fixed square. Rotation is centered on the frame. Frame has no background.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | XS · SM · MD · LG |
| Tone | VARIANT | Default | Default · Brand · Inverse |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| XS | 12 | 0 | 0 | 12 | none |
| SM | 16 | 0 | 0 | 16 | none |
| MD | 20 | 0 | 0 | 20 | none |
| LG | 24 | 0 | 0 | 24 | none |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | spinner tone | Animated specimen |
| Hover | same | none | same |  |
| Pressed | same | none | same |  |
| Focus | same | none | same |  |
| Disabled | same | none | icon.disabled | When embedded in disabled control |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Indicator | `spinner.<tone>` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Animation uses continuous rotation with linear timing.
- Reduced motion may replace continuous rotation with a static or low-motion loading glyph.
- Spinner does not include loading text.

## Accessibility

- When loading blocks a meaningful region, implementation provides an announcement where appropriate.

## Required matrices

- Size × Tone
- On default/brand/inverse surfaces

Every matrix title states the fixed properties.

## QA specimens

- inside Button
- inside table cell
- standalone with loading text

## Prohibited combinations and construction errors

- Do not use Spinner to show determinate percentage.