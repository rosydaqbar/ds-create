# Spacing, Radius & Grids

This is one Foundation page containing several related documentation regions.

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

# 8. Long-form documentation

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

## Mandatory visible notes/documentation

The long-form spacing/grid documentation must be visible on the Figma canvas.

Primitive tables, radius specimens, and grid diagrams do not replace explanatory documentation.

The notes must explain:
- the selected spacing model and why;
- primitive versus semantic dimension usage;
- exceptions and optical adjustments;
- radius logic;
- content/container width behavior;
- paragraph measure;
- responsive grid behavior and breakpoint intent;
- Figma nudge/grid guidance;
- how to maintain dimensions centrally.

A Spacing, Radius & Grids page without visible notes fails QA.
