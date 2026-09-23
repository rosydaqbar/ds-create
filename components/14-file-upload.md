# ↳ File Upload


> **Initiator gate:** Execute this specification only when this Component is in scope. If an existing master is present, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Resolve required Foundations first. Token references in this file are logical roles and must be rendered using the selected token naming system.

## Purpose

Represents file selection through a compact picker or drop zone while exposing file requirements and progress states.


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

- `File Upload / Picker`
- `File Upload / Drop zone`
- `File Upload / File row`

## Private construction components

- None.

## Master layer tree

```text
File Upload / Picker
├─ File name / Placeholder
└─ Browse action

File Upload / Drop zone
├─ Upload icon
├─ Primary text
├─ Supporting text
└─ Browse action

File Upload / File row
├─ File icon
├─ File info
│  ├─ File name
│  └─ Metadata
├─ Progress
└─ Remove action
```

Layer names above are normative. Do not leave generated names such as `Frame 127` or `Rectangle 4` in a published component.

## Root Auto Layout and resizing

Picker: horizontal Auto Layout, width Fill, fixed control height.
Drop zone: vertical Auto Layout, width Fill, min height 144, center aligned.
File row: horizontal Auto Layout, width Fill, min height 56, top/center aligned depending metadata.

## Public component properties

| Property | Figma type | Default | Allowed values / behavior |
|---|---|---|---|
| Size | VARIANT | MD | SM · MD |
| State | VARIANT | Rest | Rest · Hover · Drag over · Focus · Disabled · Error |
| File state | VARIANT | Uploading | Uploading · Complete · Error; File row only |

Do not expose a component property when the same outcome should be achieved through normal text editing or instance swap.

## Size specification

| Size | Height / major dimension | Padding / inset | Internal gap | Icon / indicator | Typography |
|---|---:|---|---|---|---|
| SM | 32 picker / 120 drop | 8–16 | 8 | 16 | Body / SM |
| MD | 40 picker / 144 drop | 12–24 | 12 | 20 | Body / MD |

All numeric values must be bound to foundation or component variables where Figma permits binding.

## State specification

| State | Surface | Border | Foreground / text | Other behavior |
|---|---|---|---|---|
| Rest | surface.default | border.default | text.primary |  |
| Hover | surface.subtle | border.strong | text.primary |  |
| Drag over | interactive.brand.rest | border.brand | text.brand | Drop zone only |
| Focus | surface.default | border.brand | text.primary | + focus |
| Disabled | surface.disabled | border.disabled | text.disabled |  |
| Error | feedback.negative.surface | border.negative | text.negative |  |

When multiple conditions apply, precedence is:

`Disabled → Loading → Error/validation → Focus → Pressed → Hover → Rest`

A component-specific exception is documented in Behavior.

## Layer-by-layer token binding

| Layer / property | Token role | Notes |
|---|---|---|
| Drop/picker surface | `file-upload.surface.*` |  |
| Border | `file-upload.border.*` | Dashed may be brand choice via style |
| Text | semantic text roles |  |
| Progress | Progress component | File row |
| Remove action | Button icon behavior |  |

No raw color value is allowed in the published master.

## Behavior and content rules

- Accepted file types and size limits are content, not baked into component names.
- Drag-over is a transient state and must be visually distinct from hover.
- File row progress remains visible during upload.
- Remove action does not disappear on hover.

## Accessibility

- Browse action is keyboard reachable.
- Drop zone is not mouse-only.
- Upload errors include text, not color alone.

## Required matrices

- Picker states
- Drop-zone states
- File-row states
- Size comparison

Every matrix title states the fixed properties.

## QA specimens

- long filename
- multiple file rows composition
- 100% upload
- upload error
- disabled
- 200% text

## Prohibited combinations and construction errors

- Do not communicate allowed file types only through an icon.
- Do not hide upload progress after selection.