# Colors

The Colors page is a multi-frame canvas. It must not be reduced to a palette grid.

# Canvas inventory

```text
x≈0        private swatch helper components
x≈2800     Colors overview                2848 wide
x≈6240     Gradients overview             2856 wide
x≈9496     Color variables                2528 wide
x≈12424    Color utility variables        2528 wide
x≈15352    Long-form color documentation  1600 wide
```

# 1. Private swatch helpers

Create reusable internal helpers for:
- standard color swatch (`160 × 156`);
- gradient swatch (`280 × 276`).

# 2. Colors overview

Frame width: `2848`.

Required sections:

## Base colors

- major Design note: `Base colors`;
- row: `Base` — white, black, transparent;
- row: `Brand` — the active brand scale.

## Extended palettes

Show the complete palette families supplied/selected by the initiator. The observed system includes these categories:

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

Brand-agnostic rule:
- do not force these exact hues if the user already has a palette;
- preserve the row layout and explanatory-note behavior;
- identify the default brand, error, warning, success, and gray families with compact badges;
- alternative families receive a concise “can replace default …” usage note where applicable.

Each row uses `480 note + 64 gap + swatches`.

Each swatch should show:
- scale name/value;
- hex or source value;
- contrast ratio / AA / AAA annotation when relevant.

# 3. Gradients overview

Frame width: `2856`.

Required groups:
- Neutral gradients
- Brand gradients
- Linear gradients
- Mesh gradients

Keep the same note-left / specimen-right row logic.

# 4. Color variables

Frame width: `2528`.

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

Each group must use this structural relationship:

```text
Variable group                         Fill container
layout: vertical
clip content: false

├─ Design note                         constrained reading width
│  ├─ title + Variables badge
│  └─ family description
├─ documentation section gap
└─ Variable table                      Fill container
   layout: horizontal
   clip content: false
   ├─ Name column                      preferred width, expandable
   ├─ Mode column                      content-driven
   ├─ Mode column                      content-driven
   ├─ Additional mode columns          when required
   └─ Usage column                     Fill remaining width
```

The audited dimensions are reference baselines only.

At the reference scale the composition is approximately:
- available table/content width: 2368;
- Design note: 720;
- Name: 400;
- first mode: 212;
- second mode: 213;
- Usage: remaining width.

Do **not** hard-code these as universal dimensions.

Adaptive behavior:
- longer token names → expand Name;
- longer aliases → expand that mode column;
- additional themes/modes → add columns and expand the frame;
- longer Usage copy → wrap and increase row height;
- more tokens → grow vertically;
- very large systems → split into logical semantic subsections while retaining the same table grammar.

The table must always remain wider than the Design note when its content requires it.

Name column:
- render semantic tokens as bordered token badges;
- show parent/child relationships with indentation and connector lines;
- hierarchy spacing comes from documentation spacing tokens;
- actual naming syntax comes from the selected naming preset.

Mode columns:
- render aliases as visual chips;
- include resolved color swatch + primitive/alias token name;
- column width is driven by the largest chip in that column.

Usage:
- must remain visible;
- receives remaining horizontal space;
- contains specific per-token guidance;
- wraps instead of clipping.

Every Text, Border, Foreground, and Background token must have its own purpose-driven usage sentence.

# 5. Color utility variables

Frame width: `2528`.

Required groups:

## Alpha colors

```text
alpha-white-10 … alpha-white-100
alpha-black-10 … alpha-black-100
```

## Utility colors

Use utility roles only when the semantic layer is insufficient, especially for multicolor UI such as badges and data-visualization accents.

Document their actual intended usage; do not expose raw palette aliases without explanation.

# 6. Long-form color documentation

Frame width: `1600`.

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

Before the Color variables frame can be considered complete, validate all of the following:

## Geometry

Validate relationships rather than one fixed canvas size:

- semantic group = Fill available documentation width;
- Design note = constrained reading width;
- table = Fill available documentation width;
- table is never constrained to Design-note width;
- table clip content = `false`;
- group clip content = `false`;
- documentation frame may grow horizontally for longer names, aliases, or additional modes;
- documentation frame grows vertically with token count and wrapped copy.

## Columns

Required behavior:
- Name column has a preferred baseline width but may expand;
- each mode column is wide enough for its largest alias chip;
- additional modes create additional columns;
- Usage fills the remaining width;
- no required column may be hidden, clipped, or compressed solely to preserve a baseline frame width.

## Documentation cells

- header, separator, and row measurements follow the audited visual rhythm as baseline values;
- data rows use the reference rhythm as a minimum, then grow when content wraps;
- semantic subgroup separators remain visually consistent through documentation spacing tokens;
- token-name cell uses a token badge;
- mode cells use color alias chips with swatches;
- Usage cell contains bespoke copy.

## Visual hierarchy

At minimum, preserve visual grouping for token families such as:

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

The exact groups follow the final semantic inventory, but child modifiers must not appear as unrelated flat rows.

## Copy quality

Fail QA if Usage contains mechanically generated filler such as:
- `where this hierarchy or state applies`;
- `use for this token`;
- `used for primary content` without a concrete UI example.

Usage copy must explain a real interface purpose.

## Screenshot sanity check

At 100% page inspection:
- Name, Light mode, Dark mode, and Usage must all be visible;
- the table must span nearly the full documentation content width;
- token chips and color previews must be visually apparent;
- the page must not resemble a narrow article column with a truncated table.
