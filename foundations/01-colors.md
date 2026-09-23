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

Each group must use this exact structure:

```text
Content group                         2368
layout: vertical
clip content: false

├─ Design note                         720
│  ├─ title + Variables badge
│  └─ family description
├─ gap                                  64
└─ Variable table                     2368
   layout: horizontal
   clip content: false
   ├─ Name column                      400
   ├─ Light mode column                212
   ├─ Dark mode column                 213
   └─ Usage column                    1543
```

Critical:
- the **Design note alone** is 720 px;
- never make the group or table 720 px;
- never clip the table;
- construct the table from four vertical columns, not 720 px horizontal rows.

Table cell rhythm:
- header: 34 px;
- header separator: 12 px;
- data row: 80 px;
- semantic subgroup separator: 12 px;
- row divider: subtle 1 px.

Name column:
- render semantic tokens as bordered token badges;
- show parent/child relationships with indentation and connector lines;
- modifiers such as `_hover`, `_alt`, `_on-brand`, `_subtle`, and `_solid` should visually belong to their parent token where applicable;
- actual naming syntax comes from the selected token naming preset.

Light/Dark columns:
- render aliases as visual chips;
- each chip includes resolved color swatch + primitive/alias token name;
- never use plain alias text for color variables.

Usage column:
- visible at all times;
- must contain specific per-token guidance;
- do not generate generic sentence templates.

Example usage quality:

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

- frame width = `2528`;
- Section horizontal padding = `80`;
- visible content width = `2368`;
- every semantic group container = `2368` wide;
- every Design note = `720` wide;
- note-to-table gap = `64`;
- every variable table = `2368` wide;
- table clip content = `false`;
- group clip content = `false`.

## Columns

- Name = `400`;
- Light mode = `212`;
- Dark mode = `213`;
- Usage = `1543`;
- total = `2368`;
- all four columns are visible inside the frame.

## Documentation cells

- header cell = `34` high;
- header separator = `12`;
- data cell = `80`;
- semantic subgroup separator = `12` where required;
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
