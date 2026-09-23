# ↳ Toast


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Displays brief transient feedback above page content without blocking the current task.


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

- `Toast`

## Private construction components

- None.

## Master layer tree

```text
Toast
├─ Status icon
├─ Content
│  ├─ Title
│  ├─ Body
│  └─ Action
└─ Dismiss
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout, top aligned. Width 360 scaffold default, min 280, max 440; height Hug; padding 16; gap 12; Content Fill; Dismiss Fixed/Hug 32 target; Effect Elevation / 4.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Tone | VARIANT | Neutral | Neutral · Positive · Warning · Negative |
| Title | BOOLEAN | True |  |
| Action | BOOLEAN | False |  |
| Dismiss | BOOLEAN | True |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | Hug | 12 | 10 | 16 | Body / SM |
| MD | Hug | 16 | 12 | 20 | Body / MD |
| LG | Hug | 16 | 12 | 20 | Body / MD |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | surface.raised | border.subtle | text.primary | Tone via icon/accent |
| Hover | surface.raised | border.default | text.primary | May pause timeout |
| Pressed | same | same | same | Action-specific |
| Focus | same | same | same | Focus on action/dismiss |
| Disabled | not applicable | same | same |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Surface | `surface.raised` |  |
| Border | `border.subtle` |  |
| Effect | `Elevation / 4` |  |
| Status icon | feedback tone foreground |  |
| Title | `text.primary` |  |
| Body | `text.secondary` |  |
| Radius | `radius.container` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Toast is transient; persistent critical information belongs in Alert.
- Default width 360, bounded 280–440.
- Action limited to one compact action.
- Auto-dismiss duration is product behavior, not a Figma property.
- Hover/focus may pause auto-dismiss.

## Accessibility

- Use live-region behavior appropriate to urgency.
- Do not steal keyboard focus when a toast appears.
- Dismiss/action controls are keyboard reachable.

## Required matrices

- Tone
- Action/dismiss combinations
- Width 280/360/440
- Stacked toasts composition

Every matrix title states the fixed properties.

## QA specimens

- long body
- no title
- with action
- negative
- 200% text

## Prohibited combinations and construction errors

- Do not use Toast for information the user must remember to complete the task.
- Do not include multiple competing actions.