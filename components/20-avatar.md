# ↳ Avatar


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Represents a person or entity using an image, initials, or fallback icon, with optional status indicator.

## Published assets

- `Avatar`
- `Avatar / Group`

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
Avatar
├─ Image / Fallback
│  ├─ Initials
│  └─ Icon
├─ Status
└─ Verified mark

Avatar / Group
└─ Avatar instances
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Avatar root is Fixed square. Status and Verified mark are absolute overlays aligned to corners. Image uses Fill crop. Initials centered. Group uses horizontal Auto Layout with tokenized negative overlap.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | XS · SM · MD · LG · XL |
| Content | VARIANT | Image | Image · Initials · Icon |
| Shape | VARIANT | Circle | Circle · Rounded |
| Status | VARIANT | None | None · Online · Away · Busy |
| Verified | BOOLEAN | False | Optional overlay |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| XS | 24 | 0 | 0 | 8 status | Label / SM |
| SM | 32 | 0 | 0 | 10 status | Label / SM |
| MD | 40 | 0 | 0 | 12 status | Body / SM / Medium |
| LG | 48 | 0 | 0 | 14 status | Body / MD / Medium |
| XL | 64 | 0 | 0 | 16 status | Heading / SM |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | avatar fallback/image | optional subtle stroke | fallback foreground |  |
| Hover | no standalone change | same | same | Interactive parent owns hover |
| Pressed | no standalone change | same | same |  |
| Focus | no standalone change | same | same | Interactive parent owns focus |
| Disabled | optional composition state | same | text.disabled | Do not gray identity unless required |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Fallback fill | `avatar.fallback.surface` |  |
| Fallback text/icon | `avatar.fallback.foreground` |  |
| Stroke | `avatar.border` |  |
| Online | `feedback.positive.foreground` |  |
| Away | `feedback.warning.foreground` |  |
| Busy | `feedback.negative.foreground` |  |
| Shape | `radius.full` or `radius.container` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Initials use max two visible characters.
- Image fallback never changes root size.
- Status indicator is optional and should not be shown for stale/unknown presence.
- Avatar Group overlap must preserve recognizability.

## Accessibility

- Presence status needs a non-color equivalent when it matters.
- Adjacent text often provides the accessible name for decorative avatars.

## Required matrices

- Size × Content
- Shape × Content
- Status states
- Avatar Group counts

Every matrix title states the fixed properties.

## QA specimens

- missing image fallback
- 1-letter initials
- 2-letter initials
- 5-avatar group
- overflow group

## Prohibited combinations and construction errors

- Do not obscure faces excessively with status.
- Do not stretch non-square source images before masking.