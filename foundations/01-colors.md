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

# 6. Notes & Documentation

Only guidance that directly helps create, maintain, or evolve the generated color system belongs here.

## Defining the color palette

Build the palette as a coordinated system of roles rather than a collection of attractive swatches.

The generated color foundation should resolve the palette groups actually needed by the product, typically including:

- neutral colors for text, borders, surfaces, dividers, disabled states, and structural UI;
- brand colors for primary emphasis, interactive states, links, selected states, and branded surfaces;
- supporting/accent colors only when the product needs additional categorization, visualization, or secondary emphasis;
- semantic feedback colors such as error/destructive, warning/caution, and success/positive when those states exist in the product.

Do not generate extra palette families merely to make the Foundation page look comprehensive.

Every included palette family must have a documented product purpose.

The tonal range should be large enough to support:
- subtle surfaces;
- borders;
- foregrounds;
- text;
- solid surfaces;
- hover/pressed/focus states where applicable.

The exact number of steps is brand-dependent.

## Choosing additional colors

Add another color family only when it solves a real interface requirement.

Before adding it, determine:
1. what product role it serves;
2. which tonal steps are actually necessary;
3. whether it needs foreground, border, surface, or solid treatments;
4. whether it must work in multiple modes;
5. whether its important foreground/background combinations meet the selected accessibility target.

Do not introduce decorative palettes with no semantic or product use.

If an existing system already has approved supporting palettes, preserve and audit them rather than replacing them.

## Define the color system before component work

Establish primitives and semantic roles before creating or rebuilding large component families.

Required relationship:

```text
Primitive palette
        ↓
Semantic color roles
        ↓
Component usage
```

Components should generally consume semantic or component-level roles instead of arbitrary primitive values.

Example:

```text
brand-600
        ↓
background-brand-solid
        ↓
Button / Primary / Default
```

This separation allows the underlying brand palette to change while component intent remains stable.

When auditing an existing system:
- identify raw color values used directly in components;
- map repeated purposes into semantic roles;
- preserve intentional exceptions;
- do not migrate names or architecture unless the selected initiator action permits it.

## Color accessibility

Accessibility must be evaluated while creating the palette and semantic mappings, not after the component library is complete.

Test important roles such as:
- primary and secondary text;
- links;
- button labels;
- form labels;
- placeholders where readability matters;
- icons that communicate meaningful information;
- borders needed to identify controls;
- focus indicators;
- text on brand surfaces;
- semantic error/warning/success content;
- disabled states.

Color must not be the only carrier of meaning.

Where a state communicates important information, combine color with another cue such as:
- text;
- iconography;
- shape;
- supporting message;
- programmatic state in implementation.

## Contrast requirements and testing

Document the accessibility target selected for the product and test actual semantic foreground/background combinations.

Do not assume that a primitive shade is safe everywhere simply because it passes against one surface.

Test combinations such as:

```text
text-primary            on bg-primary
text-secondary          on bg-primary
text-secondary          on bg-secondary
text-primary_on-brand   on bg-brand-solid
text-error-primary      on bg-error-primary
focus-ring              on common page/card surfaces
```

For every supported mode, verify the actual resolved pair.

Automated contrast checks are useful, but the documentation should also show representative in-context examples because:
- alpha colors depend on the underlying surface;
- tinted surfaces change the resulting contrast;
- disabled states may become too faint;
- nested/elevated surfaces can expose combinations not visible in the primitive palette page.

Contrast QA belongs to the generated color documentation.

## Managing colors through variables

The color architecture should make system-wide updates possible from the source.

Preferred relationship:

```text
Primitive values
        ↓
Semantic aliases
        ↓
Component bindings
```

Primitive variables contain the raw palette.

Semantic variables describe intent.

Components bind to semantic roles wherever possible.

When a primitive palette changes:
1. update the primitive collection;
2. review semantic aliases;
3. allow changes to cascade into components;
4. inspect affected states and real product screens;
5. rerun contrast/accessibility QA.

Do not manually recolor individual components when the semantic meaning has not changed.

The generated documentation must use the actual collection and token names selected by the initiator.

## Changing the brand palette

A brand-color change should be handled at the primitive/alias layer rather than component-by-component.

Review the complete brand family, including:
- subtle brand surfaces;
- borders;
- brand foregrounds;
- solid action surfaces;
- hover/pressed states;
- selected states;
- text on brand backgrounds;
- mappings in every supported mode.

Keep semantic roles stable when their purpose is unchanged.

After updating brand primitives:
- inspect primary and secondary actions;
- inspect links and selected states;
- inspect focus treatment when brand-linked;
- inspect semantic token contrast;
- inspect dark/alternate modes independently.

A brand update is not complete until the whole family and its semantic mappings have been validated.

## Changing the neutral palette

Neutral colors make up much of most interfaces and strongly affect the visual character of the brand.

A neutral system may be:
- warm;
- cool;
- highly desaturated;
- subtly brand-tinted;
- high-contrast.

Do not assume one universal gray family.

To change the neutral direction:
1. update primitive neutral values;
2. keep semantic roles stable where their purpose has not changed;
3. inspect text hierarchy;
4. inspect border/divider visibility;
5. inspect disabled states;
6. inspect page/card/elevated surfaces;
7. inspect overlays and dark-mode mappings;
8. rerun contrast checks.

The generator should preserve an approved existing neutral palette unless the initiator explicitly allows rebuilding it.

## Updating color-dependent effects

Palette changes may also affect:
- shadows;
- focus rings;
- overlays;
- tinted elevation effects;
- semantic glows or other brand-dependent effects.

Keep these dependencies centralized.

Do not create a huge set of artificial color primitives merely to encode every effect opacity.

When the effect system requires values that cannot be expressed cleanly through the selected token architecture:
- keep the effect definition centralized;
- document the dependency;
- include it in palette-change QA.

The Color documentation should reference the Effect Styles foundation for detailed effect construction rather than duplicating that entire documentation here.

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

# 8. Visual documentation modules

The Colors notes are not complete as prose alone. The generated long-form documentation must include visual examples built from the generated system.

Only visual modules relevant to constructing or maintaining the color system are included.

## 8.1 Palette-system overview

Create a large specimen that visually groups:
- neutral palette;
- brand palette;
- semantic feedback palettes;
- approved accent/supporting palettes.

For each family show:
- tonal progression;
- primitive token names;
- resolved values;
- contrast information where meaningful.

The goal is to communicate the entire palette architecture at a glance.

Do not reproduce decorative palettes that the generated product does not need.

## 8.2 Raw color usage vs system-bound color usage

Create a before/after component example.

Use one realistic component such as:
- date picker;
- form field;
- card;
- segmented control.

**Before**
- layers use direct/raw color values.

**After**
- the same layers bind to semantic tokens/styles.

Add annotations showing:
- raw value;
- semantic role;
- primitive resolution.

This visual explains why the system exists better than text alone.

## 8.3 Contrast example

Create an in-context accessibility specimen using actual generated semantic tokens.

Show at minimum:
- a passing text/background pair;
- a failing or weak pair;
- contrast result/indicator;
- token names involved.

Use generated components/surfaces rather than isolated colored rectangles only.

Do not embed a screenshot advertising a specific contrast plugin.

## 8.4 Primitive → semantic mapping

Create a diagram showing how primitive colors resolve into semantic roles.

Example structure:

```text
Primitive palette
├─ neutral-900
├─ neutral-700
├─ brand-600
└─ error-600

        ↓ aliases

Semantic roles
├─ text-primary
├─ text-secondary
├─ bg-brand-solid
└─ border-error

        ↓ bindings

Components
├─ Button
├─ Input
└─ Alert
```

Use the actual naming convention selected by the initiator.

## 8.5 Color-variable editing workflow

When variables are used, create workflow visuals based on the generated file itself:

1. open/select the primitive collection;
2. switch to the relevant collection/mode;
3. edit one primitive palette value;
4. show semantic aliases referencing it;
5. show dependent components updating.

The documentation must use actual collection/mode names from the generated system.

If variables are not used, replace this module with the actual style/token maintenance workflow rather than pretending variables exist.

## 8.6 Brand-palette replacement

Create a before/after brand update specimen.

Keep:
- component structure;
- semantic token names;
- content.

Change only the primitive brand palette.

Show:
- previous primitive ramp;
- replacement ramp;
- same primary/selected/focus components after propagation.

This demonstrates that semantics remain stable while brand values change.

## 8.7 Neutral-palette character comparison

Create three copies of the same small UI composition:
- neutral/desaturated;
- cooler/tinted;
- warmer/tinted.

Keep brand color and component anatomy unchanged.

Annotate how neutral choice affects:
- text;
- borders;
- surfaces;
- overall visual character.

When the generated brand already defines one neutral direction, highlight it as the selected direction.

## 8.8 Neutral-palette update workflow

Create a before/after visual showing:
- old neutral ramp;
- updated neutral ramp;
- same semantic roles;
- same component examples.

Include at least:
- page background;
- card/elevated background;
- primary/secondary text;
- border/divider;
- disabled state.

## 8.9 Effect-color dependency

Create a compact visual linking Color and Effect Styles.

Show one component using:
- shadow/elevation;
- focus ring;
- overlay/tint if applicable.

Annotate which effect values depend on color tokens.

Then show what must be revalidated after a palette change.

Do not duplicate the entire Effect Styles documentation; link the concepts visually.

## 8.10 Visual-module layout

Each visual module follows the long-form documentation grammar:

```text
Section heading
Body explanation
Visual example
Optional caption/annotation
```

The visual block:
- uses the full reading-column width;
- grows vertically with content;
- is placed directly after the explanation it demonstrates;
- uses generated components/tokens rather than generic placeholder art.

## 8.11 Color visual QA

Fail QA when:
- Color notes contain only text;
- no raw-vs-system example exists;
- no contrast specimen exists;
- no primitive → semantic mapping exists;
- a palette-change workflow is described without before/after component evidence;
- neutral-palette guidance has no same-UI comparison;
- screenshots show source-system names or irrelevant plugin promotion;
- visual examples use token names different from the generated system.
