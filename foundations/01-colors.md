# Colors

The Colors page is a multi-region Foundation canvas. It must not be reduced to a palette grid or constrained to one fixed canvas size.

# Canvas region order

```text
Private swatch helpers
→ Colors overview
→ Gradients overview
→ Color variables
→ Color utility variables
→ Long-form color documentation
```

Major regions use the horizontal canvas grammar from `01-documentation-and-layout-system.md` and expand according to content.

# 1. Private swatch helpers

Create reusable internal helpers for:
- standard color swatch;
- gradient swatch.

Their dimensions come from documentation specimen tokens rather than hard-coded values.

# 2. Colors overview

Required sections:

## Base colors

- major Design note: `Base colors`;
- row: `Base` — white, black, transparent;
- row: `Brand` — active brand scale.

## Extended palettes

Show the palette families supplied by the existing system or selected through the initiator.

A system may include categories such as:

```text
Red
Orange
Amber
Yellow
Lime
Green
Emerald
Teal
Cyan
Sky
Blue
Indigo
Violet
Purple
Fuchsia
Pink
Rose
Slate
Gray
Zinc
Neutral
Stone
Taupe
Mauve
Mist
Olive
```

This list describes supported presentation, not a requirement to generate every hue.

Rules:
- preserve existing brand palette when present;
- identify default brand, error, warning, success, and gray families with compact badges;
- alternative families receive concise usage notes;
- row composition remains `Design note → specimen region`;
- specimen region expands for larger palettes.

Each swatch shows:
- scale/value label;
- source or resolved color value;
- contrast/accessibility annotation when useful.

## Raw color values are never the specimen

A color family or brand color must never be documented as text-only metadata.

For every color shown in this page:
- render a visible color specimen;
- bind the specimen to its variable when one exists;
- show the token/variable name prominently;
- show hex/RGB/HSL/CMYK/Pantone only as secondary metadata;
- do not treat colored hex text as a swatch.

A card such as `Crimson Red / #DC143C / Primary identity` with no visible color block fails QA.

# 3. Gradients overview

Required groups:
- Neutral gradients
- Brand gradients
- Linear gradients
- Mesh gradients

Use the same note-left / specimen-right composition as palette rows.

The specimen region expands with gradient count and brand complexity.

# 4. Color variables

Required variable groups:

## Text color

Required semantic roles include:

```text
text-primary
text-primary_on-brand
text-secondary
text-secondary_hover
text-secondary_on-brand
text-tertiary
text-tertiary_hover
text-tertiary_on-brand
text-quaternary
text-quaternary_on-brand
text-white
text-placeholder
text-brand-primary
text-brand-secondary
text-brand-secondary_hover
text-brand-tertiary
text-brand-tertiary_alt
text-error-primary
text-warning-primary
text-success-primary
```

## Border color

```text
border-primary
border-secondary
border-secondary_alt
border-tertiary
border-brand
border-brand_alt
border-error
border-error_subtle
```

## Foreground color

```text
fg-primary
fg-secondary
fg-secondary_hover
fg-tertiary
fg-tertiary_hover
fg-quaternary
fg-quaternary_hover
fg-white
fg-brand-primary
fg-brand-primary_alt
fg-brand-secondary
fg-brand-secondary_alt
fg-error-primary
fg-error-secondary
fg-warning-primary
fg-warning-secondary
fg-success-primary
fg-success-secondary
```

## Background color

```text
bg-primary
bg-primary_alt
bg-primary_hover
bg-primary-solid
bg-secondary
bg-secondary_alt
bg-secondary_hover
bg-secondary-solid
bg-tertiary
bg-quaternary
bg-overlay
bg-brand-primary
bg-brand-primary_alt
bg-brand-secondary
bg-brand-solid
bg-brand-solid_hover
bg-brand-section
bg-brand-section_subtle
bg-error-primary
bg-error-secondary
bg-error-solid
bg-error-solid_hover
bg-warning-primary
bg-warning-secondary
bg-warning-solid
bg-success-primary
bg-success-secondary
bg-success-solid
```

Actual output names are translated through the selected naming convention.

## Variable-group structure

```text
Variable group
width: Fill
height: Hug
layout: vertical
clip content: false

├─ Design note
│  width: doc.measure.reading
│  ├─ Title + Variables badge
│  └─ Family description
│
├─ documentation group gap
│
└─ Variable table
   width: Fill
   height: Hug
   layout: horizontal
   clip content: false
   ├─ Name
   ├─ one column per mode
   └─ Usage
```

Column behavior:
- Name uses a preferred/minimum measure and expands for long names;
- mode columns are content-driven;
- additional modes add columns;
- Usage fills remaining space;
- the entire documentation region may expand horizontally.

## Name hierarchy

Parent/child relationships must render as a visible tree.

```text
text-primary
│
└── _on-brand

text-secondary
│
├── _hover
└── _on-brand
```

Figma construction uses real connector layers:
- vertical branch;
- elbow per child;
- indented child badge;
- final branch terminates at final child;
- connectors adapt to row height;
- indentation alone fails QA.

## Mode aliases

Color aliases use visual chips containing:
- resolved swatch;
- primitive/alias name.

Do not display color aliases as plain strings only.

## Usage

Every token has purpose-driven usage copy.

Examples:

```text
text-primary
Primary text such as page headings.

text-primary_on-brand
Primary text when used on solid brand-color backgrounds.

text-secondary
Secondary text such as labels and section headings.

text-secondary_hover
Secondary text in interactive hover states.

text-placeholder
Placeholder and empty-input hint text.
```

Do not generate generic sentence templates.

# 5. Color utility variables

Required groups:

## Alpha colors

Preserve the scale and naming already established by the system.

If no alpha system exists, generate one only when the product needs transparency roles.

## Utility colors

Use utility roles when the semantic layer is insufficient, especially for:
- multicolor badges;
- charts;
- visualization accents;
- special-purpose state colors.

Document actual intended usage.

Do not expose raw palette aliases without explanation.

# 6. Long-form color documentation

Required outline:
- Getting colors right
- Defining the color palette
- Choosing additional colors
- Defining the color system before design work begins
- Accessibility and contrast guidance
- Contrast thresholds
- Testing contrast in designs
- Changing the palette
- Managing colors with variables
- Opening the variables editor
- Editing primitive colors
- Repeating changes across the palette
- Updating shadow/effect variables when required
- Changing brand color
- Choosing/updating the gray palette

Use rich text, screenshots/examples, and inline resources.

# 7. Color-variable hard QA

## Geometry

Validate relationships:
- semantic group fills the available documentation width;
- Design note uses a constrained reading measure;
- table fills the available documentation width;
- table is never constrained to Design-note width;
- table and group do not clip content;
- documentation canvas may grow horizontally and vertically.

## Columns

Validate behavior:
- Name expands when required;
- each mode column fits its largest alias chip;
- additional modes create additional columns;
- Usage remains visible and fills remaining width;
- no column is hidden or compressed solely to preserve one canvas size.

## Rows

- rows use the documentation row rhythm as a minimum;
- rows grow when content wraps;
- dividers align across columns;
- subgroup separators use documentation spacing roles.

## Visual hierarchy

At minimum, preserve grouping for families such as:

```text
text-primary
  _on-brand

text-secondary
  _hover
  _on-brand

text-tertiary
  _hover
  _on-brand

border-secondary
  _alt

border-error
  _subtle

fg-secondary
  _hover

fg-tertiary
  _hover

bg-primary
  _alt
  _hover
  -solid
```

Every family with children must visibly show:
- parent badge;
- vertical connector;
- elbow for each child;
- indented child badge.

## Copy quality

Fail QA if Usage contains mechanically generated filler.

Usage must explain a real interface purpose.

## Screenshot sanity check

At normal inspection:
- Name, every active mode, and Usage are visible;
- table spans the intended documentation content region;
- token badges and value previews are visually apparent;
- hierarchical lines are visible;
- page does not resemble a narrow article column with a truncated table.
