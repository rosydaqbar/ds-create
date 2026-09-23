# ↳ Link


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Navigates to another destination or anchor. It must remain visually and semantically distinct from action buttons.


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

- `Link`

## Private construction components

- None.

## Master layer tree

```text
Link
├─ Leading icon
├─ Label
└─ Trailing icon
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Horizontal Auto Layout; Hug × Hug; no container fill.

- gap from icon to label: size-dependent;
- label stays one line in navigation use; inline text links inherit surrounding wrapping behavior;
- root padding = 0;
- focus ring is applied to a focus wrapper around all visible content.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| Emphasis | VARIANT | Brand | Brand · Neutral · Inverse |
| State | VARIANT | Rest | Rest · Hover · Pressed · Focus · Disabled |
| Leading icon | BOOLEAN | False | Optional icon |
| Trailing icon | BOOLEAN | False | Optional icon |
| Underline | VARIANT | Auto | Auto · Always · Never |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 20 | 0 | 4 | 14 | Body / SM / Medium |
| MD | 24 | 0 | 4 | 16 | Body / MD / Medium |
| LG | 28 | 0 | 6 | 20 | Body / LG / Medium |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | transparent | none | link.<emphasis>.rest | Underline according to property |
| Hover | transparent | none | link.<emphasis>.hover | Underline shown when Auto |
| Pressed | transparent | none | link.<emphasis>.pressed | Underline retained |
| Focus | transparent | none | rest foreground | + Focus / Default |
| Disabled | transparent | none | text.disabled | No underline change |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Label fill | `link.<emphasis>.<state>` | Text token |
| Icons | same as Label | Current color |
| Focus wrapper | `Focus / Default` | 2–3 px visual ring |

No raw color value is allowed in the published master.

## Behavior and content rules

- Use Link for navigation, Button for actions.
- Auto underline means underline on hover/focus for standalone UI links; inline prose links should normally remain underlined at rest.
- External-link icon, when used, is trailing.
- Do not place two decorative icons on the same link.

## Accessibility

- Keyboard activation uses Enter.
- Focus must remain visible without relying on underline alone.
- Destination purpose should be understandable from label and surrounding context.

## Required matrices

- Size × Emphasis
- State × Emphasis
- Icon combinations
- Underline behavior

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- long navigation label
- inline prose link
- inverse surface
- focus in dense text
- 200% text

## Prohibited combinations and construction errors

- Do not style an action as a Link to reduce visual emphasis.
- Do not remove all non-color affordances from inline prose links.