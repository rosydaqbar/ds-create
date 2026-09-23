# ↳ Switch


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Changes an immediate on/off setting. It is not used for selecting items for later submission.

## Published assets

- `Switch`

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
Switch
├─ Track
│  └─ Thumb
└─ Content
   ├─ Label
   └─ Supporting text
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Root: horizontal Auto Layout, gap=12, top aligned.

Track is Fixed and pill-shaped.
Thumb is Fixed circle, vertically centered.
Thumb x-position is state-driven within the Track.
Content is vertical Auto Layout, gap=2.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| On | BOOLEAN | False | Off / On |
| State | VARIANT | Rest | Rest · Hover · Pressed · Focus · Disabled |
| Label | BOOLEAN | True |  |
| Supporting text | BOOLEAN | False |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 20 track height | 2 track inset | 12 root gap | 16 thumb | Body / SM / Medium |
| MD | 24 track height | 2 track inset | 12 root gap | 20 thumb | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | switch.track.off.rest | none | text.primary | Off |
| Hover | switch.track.off.hover | none | text.primary | Off |
| Pressed | switch.track.off.pressed | none | text.primary | Off |
| Focus | same as current on/off | none | same | + Focus / Default around Track |
| Disabled | switch.track.disabled | none | text.disabled | Thumb disabled |
| On | switch.track.on.rest | none | switch.thumb.on | Thumb moves to end |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Track fill | `switch.track.<on/off>.<state>` |  |
| Thumb fill | `switch.thumb.<on/off>.<state>` |  |
| Thumb effect | `Elevation / 1` | May be removed by flat brand |
| Label | `text.primary` |  |
| Supporting text | `text.secondary` |  |
| Track radius | `radius.full` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Changing the switch takes effect immediately.
- Do not add Save/Apply semantics to the switch itself.
- Animation uses `motion.duration.normal` and `motion.easing.standard`.
- Reduced motion may remove thumb travel animation and snap to position.

## Accessibility

- Space toggles focused switch.
- Expose checked state programmatically.
- Label is part of the activation target.

## Required matrices

- On/Off × State
- Size × On/Off
- Label/supporting text
- Motion start/end frames

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- long label
- disabled on
- focus off/on
- 200% text

## Prohibited combinations and construction errors

- Do not use Switch for a multi-select list submitted later.
- Do not use text such as ON/OFF inside the thumb unless required by accessibility/user research.