# ↳ Button


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Triggers a discrete action. The component must remain structurally stable across emphasis, state, size, icons, loading, and light/dark modes.

## Published assets

- `Button`

## Private construction components

- `_Button / Loading indicator`

## Figma page structure

```text
00 — Documentation
10 — Source
20 — Matrices
30 — QA
90 — Internals
```

The Source zone contains masters only. Matrices and QA use linked instances.

## Master layer tree

```text
Button
├─ Content
│  ├─ Leading icon
│  ├─ Label
│  └─ Trailing icon
└─ Loading indicator
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

`Button` is horizontal Auto Layout, centered on both axes.

- width: Hug contents; icon-only uses Fixed square;
- height: Fixed by Size;
- min width: equal to height for text buttons; equal to height for icon-only;
- `Content`: horizontal Auto Layout, Hug × Hug;
- `Loading indicator`: absolute center overlay; visible only in Loading;
- clip content: False;
- label: one line, Hug width, no manual line break;
- icons: Fixed square;
- root opacity remains 100%; disabled appearance comes from disabled tokens rather than lowering the whole component opacity.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| Emphasis | VARIANT | Strong | Strong · Standard · Quiet · Text · Critical |
| State | VARIANT | Rest | Rest · Hover · Pressed · Focus · Disabled · Loading |
| Leading icon | BOOLEAN | False | Shows `Leading icon` slot |
| Trailing icon | BOOLEAN | False | Shows `Trailing icon` slot |
| Icon only | BOOLEAN | False | Hides label; component becomes square |
| Leading icon swap | INSTANCE_SWAP | Default icon | Available when Leading icon=True |
| Trailing icon swap | INSTANCE_SWAP | Default icon | Available when Trailing icon=True |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 32 | 4 vertical · 12 horizontal | 6 | 16 | Label / SM |
| MD | 40 | 8 vertical · 16 horizontal | 8 | 20 | Label / MD |
| LG | 48 | 12 vertical · 20 horizontal | 8 | 20 | Body / MD / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | emphasis surface rest | emphasis border rest | emphasis foreground rest | Normal |
| Hover | emphasis surface hover | emphasis border hover | emphasis foreground hover | Pointer hover only |
| Pressed | emphasis surface pressed | emphasis border pressed | emphasis foreground pressed | May visually compress only if motion spec defines it |
| Focus | same as Rest | same as Rest | same as Rest | + Focus / Default effect |
| Disabled | button.disabled.surface | button.disabled.border | button.disabled.foreground | No hover/pressed response |
| Loading | same as Rest | same as Rest | button.loading.foreground | Content invisible but preserves width; spinner visible |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Button.fill | `button.<emphasis>.surface.<state>` | Text emphasis may use transparent surface |
| Button.stroke | `button.<emphasis>.border.<state>` | 0 or 1 px by emphasis |
| Label.fill | `button.<emphasis>.foreground.<state>` | Same role drives icons unless an exception is documented |
| Leading icon.fill | same as Label | Icon instance inherits current color |
| Trailing icon.fill | same as Label | Icon instance inherits current color |
| Loading indicator | same as Label | 20/16 px according to Size |
| corner radius | `radius.control` | All four corners |
| padding | component spacing aliases | Derived from Size table |

No raw color value is allowed in the published master.

## Behavior and content rules

- Strong is the highest visual emphasis for the primary action in a region; do not use multiple Strong buttons side-by-side unless actions are equivalent.
- Critical is for destructive or irreversible actions; it is not a generic red brand alternative.
- Text emphasis has no persistent container fill; its focus indicator must still be visible.
- When Loading starts, keep the button width fixed to the pre-loading width. Hide Content visually; do not remove it from layout.
- Icon-only mode hides Label and forces width=height. Leading/Trailing icon toggles are ignored in Icon-only mode.
- Do not wrap button labels. If localization does not fit, allow the button to grow horizontally.
- A full-width button is achieved by setting the instance width to Fill container; the master remains Hug.

## Accessibility

- Keyboard: Enter and Space activate the button in implementation.
- Focus state uses a visible focus ring and cannot rely only on hover color.
- Icon-only buttons require an accessible name outside the visible component.
- Disabled buttons are not keyboard-focusable unless product semantics explicitly require `aria-disabled` behavior.
- Visual controls smaller than 44 px require a non-overlapping 44 px implementation hit area.

## Required matrices

- Emphasis × State — Size=MD
- Size × Emphasis — State=Rest
- Size × Icon composition — Emphasis=Strong
- Loading × Size — Emphasis=Strong
- Light × Dark — Strong, Standard, Critical
- Icon-only × State — Size=MD

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 1-character label
- 32-character label
- leading-only icon composition
- trailing-only icon composition
- both icons
- loading after long label
- focus on canvas, raised, brand, and inverse surfaces
- 200% text

## Prohibited combinations and construction errors

- Do not create separate components for icon-only buttons; use the property.
- Do not detach the loading indicator to position it.
- Do not use a global opacity change for disabled.
- Do not use both Leading icon and Trailing icon when Icon only=True.
- Do not hardcode brand colors into a variant.