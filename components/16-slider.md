# ↳ Slider


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Selects a numeric value along a continuous or stepped range.


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

- `Slider`

## Private construction components

- None.

## Master layer tree

```text
Slider
├─ Value label
├─ Rail
│  ├─ Track
│  ├─ Fill
│  └─ Thumb
└─ Marks
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Vertical wrapper Auto Layout. Rail is Fixed height but Fill width. Track and Fill are vertically centered. Thumb is positioned on the rail in specimens. Value label is centered above/below thumb for documentation; production positioning follows actual value.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| State | VARIANT | Rest | Rest · Hover · Focus · Disabled |
| Value label | VARIANT | None | None · Above · Below |
| Marks | BOOLEAN | False |  |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 16 rail | 0 | 8 wrapper | 16 thumb | Label / SM |
| MD | 20 rail | 0 | 8 wrapper | 20 thumb | Label / MD |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | track neutral | none | thumb default |  |
| Hover | track neutral | none | thumb hover | Thumb may enlarge by 2 px if motion spec allows |
| Focus | track neutral | none | thumb default | + Focus / Default around thumb |
| Disabled | track disabled | none | thumb disabled |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Track | `slider.track` |  |
| Fill | `slider.fill` |  |
| Thumb | `slider.thumb.*` |  |
| Thumb effect | `Elevation / 1` | optional |
| Value label | `text.primary` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Specimens show values at 0%, 25%, 50%, 75%, and 100%.
- Track thickness is 4 px by default.
- Marks are only used for meaningful discrete intervals.

## Accessibility

- Arrow keys increment/decrement.
- Expose min, max, current value, and step.
- Do not rely on pointer drag only.

## Required matrices

- Position specimens
- Size × State
- Marks on/off
- Value-label positions

Every matrix title states the fixed properties.

## QA specimens

- 0%
- 100%
- long numeric label
- disabled
- RTL/reversed axis where applicable

## Prohibited combinations and construction errors

- Do not place editable text inside the thumb.
- Do not use marks for decorative ticks with no value meaning.