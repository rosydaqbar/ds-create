# Documentation System

This file is the mandatory visual and content specification for all generated Figma documentation.

The documentation must feel like a finished professional design-system library: editorial header, generous whitespace, explanatory copy, clearly structured specimens, and precise tables. It must **not** look like a generic token dashboard, developer inspector, or collection of floating chips.

# 1. Core visual language

## 1.1 Canvas

Use a white documentation canvas.

Do not place the whole page inside a giant rounded card.

Do not use tinted page backgrounds as the default documentation surface.

Brand color appears only where it is relevant to the documented asset: swatches, examples, small identity mark, tags, or product components.

## 1.2 Typography hierarchy

Documentation typography uses the configured UI/documentation family, but preserve these roles and approximate metrics:

| Role | Size | Line height | Weight |
|---|---:|---:|---|
| Page heading | 60 | 72 | Semibold |
| Section note heading | 24 | 32 | Semibold |
| Header breadcrumb | 20 | 30 | Medium/Semibold |
| Header supporting text | 20 | 30 | Regular |
| Section supporting text | 18 | 28 | Regular |
| Resource label | 18 | 28 | Medium |
| Table value | 16 | 24 | Regular/Medium |
| Table header | 12 | 18 | Medium |
| Small tag | 14 | 20 | Medium |

If the selected brand typeface needs optical adjustment, preserve the hierarchy rather than blindly preserving numeric font sizes.

# 2. Standard documentation header

Every top-level documentation frame begins with `Design system header`.

## 2.1 Outer header

```text
Width: Fill parent
Layout: Vertical Auto Layout
Padding: 32 / 32 / 32 / 32
Gap: 0
Background: white
```

Inside it, create `Content`:

```text
Width: Fill parent
Layout: Vertical Auto Layout
Padding: 48 top / 48 right / 64 bottom / 48 left
Gap: 128
Corner radius: 20
Background: neutral-subtle documentation surface
```

For a neutral scaffold, this surface is approximately `#FAFAFA`; if the product's neutral system differs, bind it to the closest very-subtle neutral surface.

## 2.2 Header breadcrumb row

`Header`:

```text
Height: 36
Width: Fill
Layout: Horizontal Auto Layout
Primary-axis alignment: Space between
Counter-axis alignment: Center
```

Left side:

```text
Logo and page title
├─ Logomark                       36 × 36
└─ Section title and page title
   ├─ Section title               20 / 30
   ├─ Arrow                       20 × 20
   └─ Page title                  20 / 30
```

Spacing:

```text
Logomark → breadcrumb text: 16
Section title → arrow → page title: 4
```

The right side may contain one small metadata/link line. If the user has no appropriate URL or metadata, omit it; do not invent one.

## 2.3 Hero row

After the breadcrumb row, keep `128 px` vertical separation before the hero.

`Heading and resources`:

```text
Width: Fill
Layout: Horizontal Auto Layout
Gap: 64 when resources are present
Alignment: Top
```

Primary text column:

```text
Heading and supporting text
Width: 1024 minimum
Layout: Vertical Auto Layout
Gap: 20
```

Heading:

```text
60 / 72
Semibold
Left aligned
```

Supporting text:

```text
20 / 30
Regular
Width: 1024
Height: Hug
```

Use 1–3 short paragraphs. The copy must explain what the page contains and why it exists. Do not write generic filler.

Optional resources column:

```text
Width: 456
Layout: Vertical Auto Layout
Gap: 16
```

Use it only when the user supplied real resources or the system has real internal references. Do not invent external links.

## 2.4 Header height

Header height is content-driven.

Typical compact variable/specification header: about `522 px`.

A longer overview header with resources and several paragraphs may grow to about `682 px`.

Do not force both to the same height.

# 3. Main section container

After the header, use a frame named `Section`.

```text
Width: Fill parent
Layout: Vertical Auto Layout
Padding: 80 / 80 / 80 / 80
Gap: 64
Background: transparent
```

Content width therefore becomes:

```text
2848 page → 2688 content
2528 page → 2368 content
1600 page → 1440 content
```

This `80 px` outer section gutter is mandatory.

# 4. Design note

Use `Design note` to introduce every major section before showing specimens or tables.

## 4.1 Standard note

```text
Width: 720
Layout: Vertical Auto Layout
Gap: 12
Height: Hug
```

Layer tree:

```text
Design note
├─ Text and badge
│  ├─ Text
│  └─ Badge (optional)
└─ Supporting text
```

Heading:

```text
24 / 32
Semibold
```

Optional badge:

```text
Height: 24
Padding: 2 vertical / 8 horizontal
Radius: 6
Text: 14 / 20
Gap from heading: 8
```

Supporting text:

```text
18 / 28
Width: 720
Regular
```

## 4.2 Compact row note

For specimen rows, use a `480 px`-wide note.

```text
Width: 480
Heading: 18–20 / 28–30
Supporting text: 16–18 / 24–28
Gap: 8
```

The note must explain the role or usage of the specimens to its right.

Do not use label-only rows unless the meaning is self-evident.

# 5. Palette and swatch documentation

Use this pattern for base colors, gradients, effect samples, or other repeated visual scales.

## 5.1 Row

```text
Row
├─ Design note                   480 wide
└─ Swatches                      Fill remaining width
```

Row settings:

```text
Width: Fill
Layout: Horizontal Auto Layout
Gap: 64
Alignment: Top
```

Swatches area for a 2848 page:

```text
Width: 2144
Layout: Horizontal Auto Layout
Gap: 32
Wrap only when the documented family is larger than one row
```

Vertical gap between specimen rows: `64`.

## 5.2 Base swatch card

Default swatch card:

```text
Width: 160
Height: 156
Radius: 12
Layout: Vertical
```

Anatomy:

```text
_Swatch
├─ Swatch                        160 × 80
│  └─ Contrast / status text
└─ Content                       160 × 156 overlay/body
   ├─ Number / token step
   └─ Resolved value
```

Top visual swatch:

```text
Width: 160
Height: 80
Radius: 12
Stroke: 1 px subtle neutral / 10% black equivalent
Contrast label: 18 / 28, centered
```

Content layer:

```text
Padding: 92 top / 12 right / 12 bottom / 12 left
Background: white
Border: 1 px subtle neutral on left/right/bottom
Bottom radius: 12
```

Token step/name:

```text
18 / 28
```

Resolved value:

```text
16 / 24
```

For color swatches, show:

- scale name/step;
- resolved hex/value;
- contrast ratio/grade when useful;
- mode-independent value only on primitive swatches.

Do not show meaningless numeric labels such as `1`, `2`, `3` if the chosen token system uses `50`, `100`, `200`, semantic names, or another established scale.

# 6. Variable/specification tables

Variable documentation uses a real table, not stacked token pills.

## 6.1 Standard table width

For a `2528 px` page:

```text
Section content width: 2368
Table width: 2368
```

## 6.2 Four-column color-variable table

```text
Column 1 — Name        400
Column 2 — Light       212
Column 3 — Dark        212
Column 4 — Usage       1544
```

The table is built as four synchronized vertical columns, or an equivalent row system that produces the same visual result.

## 6.3 Header row

```text
Height: 34
Text: 12 / 18
Weight: Medium
```

Header labels:

```text
Name
Light mode
Dark mode
Usage
```

If the system has one mode only, replace Light/Dark with `Value` and use a three-column layout. Do not leave empty mode columns.

## 6.4 Section divider inside tables

Use a `12 px` spacer/divider row between logical token groups.

```text
Height: 12
Background: very-subtle neutral
Bottom stroke: 1 px subtle neutral
```

## 6.5 Data row

```text
Height: 80 minimum
Padding: 12 top / 64 right / 12 bottom / 0 left
Alignment: Center vertically
Bottom stroke: 1 px subtle neutral
```

Rows may grow if the usage copy wraps; do not clip text to preserve an arbitrary 80 px height.

### Name cell

Use a compact outlined badge for the token name:

```text
Height: 32
Padding: 4 vertical / 12 horizontal
Radius: 6
Background: white
Stroke: 1 px subtle neutral
Text: 16 / 24
```

Nested modifiers may be visually indented, but preserve the actual token name.

### Mode/value cell

Show:

```text
Color preview square
Resolved primitive/alias name
```

Text: `16 / 24`.

### Usage cell

Text: `16 / 24`.

Every token row must explain its intended use in a concrete sentence.

Bad usage copy:

> Used for text.

Good usage copy:

> Primary text for page titles, high-emphasis headings, and key content labels.

# 7. Content pattern for variable sections

Every variable family follows this order:

```text
Content
├─ Design note                  720 wide
└─ Table / specimen content
```

Gap between Design note and table: `64`.

Gap between major variable families: `64` at the Section level.

For colors, use separate sections for:

```text
Text color
Border color
Foreground color
Background color
```

Add other families only when they actually exist in the user's system.

# 8. Long-form notes

Use a `1600 px` frame only when explanatory guidance materially helps the designer use the system.

Main content width: `1440` after 80 px section padding.

Long-form notes should use a narrow reading column inside that area, normally `720–820 px`, with screenshots/examples placed beneath or beside the text.

Typical section pattern:

```text
Design note / section heading
2–5 short paragraphs
Example or screenshot
Optional comparison
```

Recommended typography:

```text
Major note heading: 24 / 32
Body: 18 / 28
Small caption: 14–16 / 20–24
```

Keep these notes concise. They should explain decisions, not become a textbook.

# 9. Footer

Every complete documentation frame ends with `Design system footer`.

Outer footer:

```text
Width: Fill
Layout: Vertical
Padding: 32
Gap: 80
Background: white
```

Inner content:

```text
Width: Fill
Padding: 48
Gap: 128
Background: very-subtle neutral
Corner radius: 20
```

Typical total height: about `386 px`.

Footer content may include:

- system/library name;
- short descriptor;
- version or last-reviewed metadata;
- small brand/system mark.

Do not invent promotional copy, URLs, or copyright text.

# 10. Component documentation pages

Component pages use the same visual system.

Default component documentation frame: `2528 px` wide.

Structure:

```text
<Component>
├─ Design system header
├─ Section
│  ├─ Overview
│  ├─ Anatomy
│  ├─ Sizes
│  ├─ Variants / emphasis
│  ├─ States
│  ├─ Properties
│  ├─ Token bindings
│  ├─ Behavior / content rules
│  ├─ Accessibility
│  └─ QA / edge cases
└─ Design system footer
```

Each major section starts with a `720 px` Design note and then shows the actual component specimens or tables beneath it after `64 px`.

Matrices are part of this finished documentation frame. Do not put them on a separate giant QA board.

For dense matrices, use the full `2368 px` section content width.

# 11. Layer naming

Use these layer names consistently:

```text
Design system header
Content
Header
Logo and page title
Section title and page title
Heading and resources
Heading and supporting text
Resources
Section
Design note
Text and badge
Supporting text
Row
Swatches
Column
Table
Design system footer
```

Product components retain their own semantic internal layer names.

# 12. Prohibited presentation patterns

Do not generate:

- giant 1600 px utility boards as the universal pattern;
- token names as floating blue pills with no usage explanation;
- palette cards labeled only `1`, `2`, `3`, etc.;
- huge empty regions caused by fixed-height boards;
- rounded container cards around every documentation section;
- arbitrary gradients or decorative backgrounds;
- generic headings such as `Source`, `Specimens`, or `QA` as the main visible content;
- tables without a Usage column when usage matters;
- semantic token lists without light/dark resolved aliases when multiple modes exist;
- documentation copy that merely repeats the token name.

# 13. Initiator integration

The initiator controls the values and scope, not the documentation grammar.

Brand/product answers determine:

- palette values;
- typeface;
- actual token names;
- modes;
- radius/elevation character;
- icon set;
- which pages/components exist.

They do **not** replace this documentation layout with a different generic board system.

If the user selects reduced documentation depth, remove optional sections but preserve the same header, section, note, table/specimen, and footer presentation.