# ↳ Button Group


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Groups closely related actions into one connected control while preserving the semantics of individual buttons.

## Published assets

- `Button Group`
- `Button Group / Item`

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
Button Group
└─ Items
   ├─ Button Group / Item
   ├─ Button Group / Item
   └─ …

Button Group / Item
├─ Icon
└─ Label
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Group root is Auto Layout with gap=0.

Horizontal:
- width: Hug by default;
- height: Hug;
- items are adjacent;
- touching interior corners = 0;
- outer corners = `radius.control`.

Vertical:
- height: Hug;
- width: Hug or Fill;
- touching top/bottom corners = 0.

`Full width=True` sets item width behavior to Fill within the group specimen; the published item master remains intrinsically sized.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| Orientation | VARIANT | Horizontal | Horizontal · Vertical |
| Selection | VARIANT | Single | None · Single · Multiple |
| Full width | BOOLEAN | False | Items fill equally when True |
| Selected | BOOLEAN | False | Item property |
| Disabled | BOOLEAN | False | Item property |
| Icon | BOOLEAN | False | Item property |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 32 | 4 vertical · 12 horizontal | 6 | 16 | Label / SM |
| MD | 40 | 8 vertical · 14 horizontal | 8 | 20 | Label / MD |
| LG | 48 | 12 vertical · 16 horizontal | 8 | 20 | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | surface.default | border.default | text.secondary | Unselected |
| Hover | surface.subtle | border.default | text.primary | Unselected |
| Pressed | interactive.neutral.pressed | border.strong | text.primary | Unselected |
| Focus | same as semantic selection | same | + normal foreground | + focus ring on item |
| Disabled | surface.disabled | border.disabled | text.disabled | No interaction |
| Selected | interactive.neutral.rest | border.strong | text.primary | Selected indicator may be fill, never color-only when selection is critical |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Group gap | 0 | Connected control |
| Item radius | `radius.control` | Only outer corners remain rounded |
| Item border | `button-group.border.*` | Interior double borders must collapse visually |
| Item foreground | `button-group.foreground.*` | Selected/unselected roles |
| Focus | `Focus / Default` | Applied per item, not around entire group |

No raw color value is allowed in the published master.

## Behavior and content rules

- Use for actions that are peers or mutually exclusive compact choices.
- Do not use as a replacement for Tabs when changing primary content regions.
- A selected state must remain clear in Light and Dark modes.
- Horizontal groups may wrap only when the product explicitly allows multi-row groups; default is no wrap.
- When labels vary greatly in length, prefer non-connected standalone controls.

## Accessibility

- Arrow keys may move focus in single-selection implementations where the group behaves like a radio group.
- Selection state must be programmatically exposed.
- Each item needs an accessible name.
- Focus is visible on the focused item even when adjacent borders touch.

## Required matrices

- Orientation × Size
- Selected × State
- Single vs Multiple selection examples
- Full width vs Hug

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 2 items
- 3 items
- 6 items
- mixed label lengths
- all disabled
- one disabled in group
- 200% text

## Prohibited combinations and construction errors

- Do not fake grouping by manually overlapping standalone buttons.
- Do not leave doubled 2 px interior borders.
- Do not round interior touching corners.