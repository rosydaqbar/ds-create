# ↳ Badge


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Displays compact metadata, status, category, or count. It is informational unless explicitly composed inside an interactive parent.

## Published assets

- `Badge`

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
Badge
├─ Leading
│  ├─ Dot
│  └─ Icon
├─ Label
└─ Dismiss
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout, center aligned, width Hug, height fixed/min. Pill radius. Label single-line. Dismiss is visual 12/14 px but receives a larger internal target when interactive context permits.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | SM | SM · MD |
| Tone | VARIANT | Neutral | Neutral · Brand · Positive · Warning · Negative · Informative |
| Style | VARIANT | Soft | Soft · Outline · Solid |
| Leading | VARIANT | None | None · Dot · Icon |
| Dismiss | BOOLEAN | False |  |
| Icon swap | INSTANCE_SWAP | Default |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 20 | 2 vertical · 6 horizontal | 4 | 12 | Label / SM |
| MD | 24 | 3 vertical · 8 horizontal | 4 | 14 | Body / SM / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | tone/style surface | tone/style border | tone/style foreground |  |
| Hover | same unless dismiss target hovered | same | same | Badge normally noninteractive |
| Pressed | same | same | same |  |
| Focus | same | same | same | Only when dismiss or parent is interactive |
| Disabled | not standalone badge state | not applicable | not applicable |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Root fill | `badge.<tone>.<style>.surface` |  |
| Root stroke | `badge.<tone>.<style>.border` |  |
| Label/icon/dot | `badge.<tone>.<style>.foreground` |  |
| Radius | `radius.full` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Labels should normally be 1–3 words.
- Use Dot only when the dot conveys status alongside text.
- Solid style must maintain readable contrast.
- Dismiss=True is only for removable tags/chips, not static status badges.

## Accessibility

- Status remains understandable without color.
- Dismiss action requires an accessible name.

## Required matrices

- Tone × Style
- Size × Leading
- Dismiss on/off
- Light × Dark

Every matrix title states the fixed properties.

## QA specimens

- 1-character count
- 3-word label
- long label 24 chars
- solid negative
- outline neutral
- 200% text

## Prohibited combinations and construction errors

- Do not use Badge as a small Button.
- Do not encode critical status with color alone.