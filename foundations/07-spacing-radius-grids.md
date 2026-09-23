# Spacing, Radius & Grids

This is one Foundation Figma Page containing several related documentation regions.

# Canvas region order

```text
Spacing primitives
→ Radius
→ Semantic spacing / widths / containers
→ Grid layouts
→ Long-form notes
```

Use the horizontal documentation-canvas grammar. Each region grows with its content.

# 1. Spacing primitives

Use a table such as:

| Name | Relative/base value | Resolved platform value | Type/category |
| --- | --- | --- | --- |

The primitive scale comes from:
1. the existing system, when available;
2. the initiator/product requirements;
3. a newly derived coherent scale only when no scale exists.

Do not copy a reference numeric spacing series into a different brand.

Do not assume one base unit.

Document the actual relationship between primitive values instead.

# 2. Semantic spacing

A semantic system may expose roles such as:

```text
spacing-none
spacing-xxs
spacing-xs
spacing-sm
spacing-md
spacing-lg
spacing-xl
spacing-2xl
spacing-3xl
spacing-4xl
spacing-5xl
spacing-6xl
spacing-7xl
spacing-8xl
spacing-9xl
spacing-10xl
spacing-11xl
```

Preserve the existing naming/scale when already established.

The list above is a supported pattern, not a required count.

# 3. Widths

A width system may expose roles such as:

```text
width-xxs
width-xs
width-sm
width-md
width-lg
width-xl
width-2xl
width-3xl
width-4xl
width-5xl
width-6xl
```

Values come from the actual product/layout system.

# 4. Containers

Typical semantic roles include:

```text
container-padding-mobile
container-padding-desktop
container-max-width-desktop
```

For products with different platform classes, generate equivalent roles based on the product rather than forcing these exact names or values.

# 5. Paragraph max-width

Document the system's reading-measure role.

If no reading measure exists, derive one from:
- typography;
- content density;
- primary platform;
- localization needs.

Do not hard-code the reference reading width.

# 6. Radius

A semantic radius system may use roles such as:

```text
radius-none
radius-xxs
radius-xs
radius-sm
radius-md
radius-lg
radius-xl
radius-2xl
radius-3xl
radius-4xl
radius-full
```

The actual values are brand-dependent.

Rules:
- preserve an established radius scale;
- otherwise derive the scale from the selected corner treatment;
- do not copy reference radius values.

# 7. Grid layouts

Document the actual platform classes supported by the product, for example:
- desktop;
- tablet;
- mobile;
- large-screen or app-specific layouts when required.

For each class show:
- container behavior;
- column behavior;
- gutters;
- margins;
- max-width rules;
- breakpoint/mode relationships.

Column counts and breakpoints come from the actual product.

Do not force reference viewport widths or grid counts.

# 8. Spacing, radius & grid documentation

Required outline:
- why a spacing system is necessary;
- problems with designing without a defined scale;
- rationale for the selected base-unit/spacing model;
- defining the spacing system;
- exceptions to the spacing model;
- best practices;
- paragraph measure guidance;
- practical Figma nudge/grid configuration tips.

The documentation should explain the user's actual spacing/grid model, not a copied numeric system.

# Notes & Documentation — Spacing, Radius & Grids

Keep guidance that helps build or maintain spacing, layout, reading-width, radius, and grid behavior.

## Why the spacing system matters

A constrained spacing scale reduces arbitrary decisions and creates reusable rhythm between design and implementation.

### Required visual documentation

Create a **without-system vs with-system** comparison using the same modal/card composition.

**Without system**
- inconsistent gaps/padding;
- arbitrary values;
- weak alignment.

**With system**
- repeated scale values;
- aligned edges;
- predictable vertical rhythm.

Add spacing annotations directly to both examples.

## Show the spacing system inside components

The system should demonstrate how tokens appear in real components, not only as a numeric scale.

### Required visual documentation

Create an annotated Dropdown/Menu example showing:
- item padding;
- icon-to-label gap;
- group spacing;
- divider spacing;
- menu inset.

Use actual semantic spacing-token names selected by the builder.

## Optical exceptions

Not every internal value must land perfectly on the base grid.

Icon live areas and text metrics may require optical compensation.

### Required visual documentation

Use the Button family to show:
1. mathematically even padding that looks visually uneven because of icon live-area;
2. corrected optical treatment;
3. measurement annotations.

This visual should align with the Button Text-padding anatomy.

## Component padding comparison

Create an additional focused example showing:
- outer control padding;
- internal icon frame;
- label wrapper;
- perceived spacing.

This is not a random spacing demo; it must explain the actual generated Button anatomy.

## Reading width / line length

Body copy should use constrained readable width.

The system should use a semantic reading-width concept rather than one universal hard-coded pixel maximum.

### Required visual documentation

Create:
- one annotated paragraph specimen showing the selected reading width;
- a three-example comparison:
  - too short;
  - selected/readable;
  - too long.

Use the active typeface and actual body style.

Annotate approximate character count/line length.

## Container and grid relationship

The documentation should show how:
- page container;
- columns;
- gutters;
- major section spacing;
- component alignment

work together.

### Required visual documentation

Create at least one responsive product-page/container grid specimen with measurement labels.

Use the actual grid values produced by the initiator.

## Radius

Do not document Radius as numbers only.

### Required visual documentation

Create a radius specimen showing:
- radius scale;
- semantic assignments;
- representative components/surfaces using each role.

If the brand uses a constrained radius vocabulary, do not manufacture extra steps.

## Figma nudge setting

The source includes an authoring tip about matching keyboard nudge to the grid.

This is optional builder guidance, not a required product-system section.

If included:
- recommend aligning big nudge to the selected spacing base;
- show a small editor-setting example;
- do not give it equal prominence to the actual spacing/grid documentation.

## Spacing/Grids visual QA

Fail QA when:
- notes are text-only;
- there is no without-system/with-system comparison;
- semantic spacing is not shown inside a real component;
- optical exceptions are not demonstrated visually;
- reading-width guidance has no line-length comparison;
- grid/container documentation does not use the generated system's real values.
