# ↳ Color


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.

## Purpose

Defines raw palettes and semantic color roles. Components bind to semantic roles or justified component aliases, never directly to hex values.

## Figma variable collections

### Collection: `Primitives / Color`

Mode: `Base`

Required families:

```text
neutral
brand
red
amber
green
blue
```

Each family uses:

```text
50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
```

Required base variables:

```text
color.base.white
color.base.black
color.base.transparent
```

`brand.*` values are replaced by the configured brand palette.

`neutral.*` may be warm, cool, or true neutral depending on the brand.

### Collection: `Semantic / Color`

Modes:

```text
Light
Dark
```

Required groups:

```text
surface
text
icon
border
interactive
feedback
focus
overlay
```

Required semantic variables:

```text
surface.canvas
surface.default
surface.subtle
surface.raised
surface.inverse
surface.brand
surface.disabled

text.primary
text.secondary
text.muted
text.inverse
text.brand
text.disabled
text.negative
text.warning
text.positive
text.informative

icon.primary
icon.secondary
icon.muted
icon.inverse
icon.brand
icon.disabled
icon.negative
icon.warning
icon.positive
icon.informative

border.subtle
border.default
border.strong
border.brand
border.disabled
border.negative
border.warning
border.positive

interactive.brand.rest
interactive.brand.hover
interactive.brand.pressed
interactive.neutral.rest
interactive.neutral.hover
interactive.neutral.pressed

feedback.negative.surface
feedback.negative.border
feedback.negative.foreground
feedback.warning.surface
feedback.warning.border
feedback.warning.foreground
feedback.positive.surface
feedback.positive.border
feedback.positive.foreground
feedback.informative.surface
feedback.informative.border
feedback.informative.foreground

focus.ring
focus.ring.negative

overlay.scrim
```

## Alias rule

Every semantic color aliases a primitive color in each mode.

No semantic variable stores a standalone hex value unless an explicit exception is documented.

## Source-zone layout

```text
10 — Source
├─ Primitive palettes
│  ├─ Neutral
│  ├─ Brand
│  ├─ Red
│  ├─ Amber
│  ├─ Green
│  └─ Blue
└─ Semantic color roles
   ├─ Surface
   ├─ Text
   ├─ Icon
   ├─ Border
   ├─ Interactive
   ├─ Feedback
   ├─ Focus
   └─ Overlay
```

Primitive palette row:
- 11 swatches;
- swatch `96 × 96`;
- gap `12`;
- label below;
- show token name and resolved value.

Semantic role table:
- Name;
- Light alias;
- Dark alias;
- usage.

## Documentation sections

1. Color model
2. Primitive palette
3. Semantic roles
4. Light/Dark modes
5. Contrast rules
6. Component binding rule
7. Do / Don't
8. QA

## QA

Validate:
- every semantic variable has both Light and Dark values;
- no broken aliases;
- primary text meets required contrast on canvas/default/subtle surfaces;
- focus ring remains visible around brand, neutral, positive, warning, and negative surfaces;
- disabled colors are distinguishable without relying on opacity alone where content remains meaningful.