# ↳ Textarea


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Multi-line text-entry control used inside Field.


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

- `Textarea`

## Private construction components

- None.

## Master layer tree

```text
Textarea
├─ Value
└─ Footer
   └─ Character counter
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Vertical Auto Layout.

- width: Fill container;
- height: Fixed specimen minimum, instance may grow vertically;
- Value: Fill width, Hug height, wraps;
- content aligns top-left;
- footer aligns end;
- resize handle is not drawn as a Figma layer unless the product explicitly implements manual resize.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD · LG |
| State | VARIANT | Empty | Empty · Filled · Hover · Focus · Disabled · Read only |
| Validation | VARIANT | None | None · Error · Success |
| Counter | BOOLEAN | False | Shows character count footer |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 80 min | 8 | 8 | none | Body / SM / Regular |
| MD | 96 min | 12 | 8 | none | Body / MD / Regular |
| LG | 120 min | 14 | 8 | none | Body / MD / Regular |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Empty | surface.default | border.default | text.muted |  |
| Filled | surface.default | border.default | text.primary |  |
| Hover | surface.default | border.strong | text.primary |  |
| Focus | surface.default | border.brand | text.primary | + Focus / Default |
| Disabled | surface.disabled | border.disabled | text.disabled |  |
| Read only | surface.subtle | border.default | text.primary |  |
| Error | surface.default | border.negative | text.primary | Counter may also become negative at limit violation |
| Success | surface.default | border.positive | text.primary |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Root fill | `field.surface.*` |  |
| Root stroke | `field.border.*` |  |
| Value | `text.primary` |  |
| Placeholder | `text.muted` |  |
| Counter | `text.muted` |  |
| Counter error | `text.negative` |  |
| Radius | `radius.control` |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Textarea grows vertically with content in product layouts unless a product sets a maximum height.
- Character counter uses `current / maximum` only when a real maximum exists.
- Do not truncate entered text.

## Accessibility

- Native multiline keyboard behavior.
- Error association comes from Field.
- Counter must not be the only indication that a limit has been exceeded.

## Required matrices

- Size × State
- Validation states
- Counter on/off
- Growth examples

Every matrix title states the fixed properties. Example:

`State × Emphasis — Size=MD, Leading icon=False, Trailing icon=False`

## QA specimens

- 1 line
- 8 lines
- very long unbroken string
- disabled filled
- counter exceeded
- 200% text

## Prohibited combinations and construction errors

- Do not reuse Text Input by manually increasing its height.
- Do not vertically center multiline text.