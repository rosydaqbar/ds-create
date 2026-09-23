# ↳ Progress


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Shows determinate completion for a task or process.

## Published assets

- `Progress / Linear`

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
Progress / Linear
├─ Label row
│  ├─ Label
│  └─ Value
└─ Track
   └─ Fill
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Vertical Auto Layout; width Fill; gap=8. Track width Fill, fixed thickness, clipped to pill radius. Fill width is controlled in specimens to represent value.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| Tone | VARIANT | Brand | Brand · Positive · Negative |
| Label | BOOLEAN | False |  |
| Value | BOOLEAN | False | Shows percentage/value text |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 4 track | 0 | 6 | none | Body / SM |
| MD | 8 track | 0 | 8 | none | Body / SM / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | surface.subtle | none | tone fill | Determinate |
| Hover | same | none | same | Noninteractive |
| Pressed | same | none | same |  |
| Focus | same | none | same |  |
| Disabled | surface.disabled | none | icon.disabled | If product disables display |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Track | `progress.track` |  |
| Fill | `progress.<tone>.fill` |  |
| Label | `text.primary` |  |
| Value | `text.secondary` |  |
| Radius | `radius.full` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Use Spinner for unknown duration.
- Value is clamped 0–100 in specimens.
- Negative tone is only for meaningful failure progression.

## Accessibility

- Expose current/min/max when meaningful.
- Do not rely on color alone to communicate failure.

## Required matrices

- 0/25/50/75/100%
- Size × Tone
- Label/value combinations

Every matrix title states the fixed properties.

## QA specimens

- 0%
- 100%
- long label
- 200% text

## Prohibited combinations and construction errors

- Do not animate determinate progress backwards unless value actually decreases.