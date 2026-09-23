# ↳ Alert


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Displays persistent contextual feedback inside page flow.

## Published assets

- `Alert`

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
Alert
├─ Status icon
├─ Content
│  ├─ Title
│  ├─ Body
│  └─ Action
└─ Dismiss
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout, top aligned. Width Fill; min height Hug; padding 16; root gap 12; Content Fill, vertical gap 4/12 to action; Dismiss Hug with fixed 32 target; body wraps.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Tone | VARIANT | Informative | Informative · Positive · Warning · Negative |
| Style | VARIANT | Soft | Soft · Outline |
| Title | BOOLEAN | True |  |
| Action | BOOLEAN | False |  |
| Dismiss | BOOLEAN | False |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | Hug | 12 | 10 | 16 | Body / SM |
| MD | Hug | 16 | 12 | 20 | Body / MD |
| LG | Hug | 20 | 16 | 20 | Body / MD |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | feedback tone surface | feedback tone border | feedback tone foreground |  |
| Hover | same | same | same | Only actions change |
| Pressed | same | same | same |  |
| Focus | same | same | same | Focus on action/dismiss |
| Disabled | not normal alert state | same | same |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Root fill | `feedback.<tone>.surface` |  |
| Root stroke | `feedback.<tone>.border` |  |
| Status icon | `feedback.<tone>.foreground` |  |
| Title | `text.primary` or tone-specific accessible foreground |  |
| Body | `text.secondary` |  |
| Radius | `radius.container` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Alert stays in document flow and does not auto-dismiss.
- Action is normally Link or low-emphasis Button.
- Dismiss optional; critical validation alerts may remain non-dismissible.
- Title may be removed only when body alone is clear.

## Accessibility

- Use alert/live-region semantics based on urgency.
- Tone reinforced by icon/text, not color alone.
- Dismiss requires accessible label.

## Required matrices

- Tone × Style
- Title/action/dismiss combinations
- Long content
- Light × Dark

Every matrix title states the fixed properties.

## QA specimens

- 1-line alert
- 6-line alert
- action wraps
- dismiss + action
- 200% text

## Prohibited combinations and construction errors

- Do not use Alert as a toast overlay.
- Do not put more than one primary action inside compact alert.