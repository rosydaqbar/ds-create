# ❖ FOUNDATIONS

The Foundations parent page defines the visual and behavioral primitives used by every component.

## Child pages

```text
↳ Color
↳ Typography
↳ Spacing
↳ Sizing
↳ Radius
↳ Borders
↳ Elevation & Focus
↳ Layout, Grid & Breakpoints
↳ Motion
↳ Iconography
↳ Imagery
↳ Brand Assets
↳ Accessibility
```

## Parent-page presentation

Use one `1600 px` complete documentation frame with the same Header → Section → Footer language defined in `01-documentation-system.md`.

Section content contains:

```text
Design note / Introduction
Foundation model
Child-page index
Dependency order
Status table from the initiator
```

Do not place production variables/components on the parent page.

## Dependency order

Build or validate in this order:

1. Color primitives
2. Spacing and sizing primitives
3. Radius and borders
4. Typography
5. Elevation and focus
6. Layout and breakpoints
7. Motion
8. Iconography and imagery
9. Accessibility constraints
10. Semantic tokens
11. Component tokens

A component may not hardcode a value that already exists in Foundations.

## Initiator integration

The child-page list is a supported catalog, not a mandatory build list.

For each child Foundation resolve:

```text
KEEP
AUDIT
IMPROVE
REFACTOR
REBUILD
REPLACE
BUILD
SKIP
```

Only create missing Foundation pages with status `BUILD`.

When a Foundation is `KEEP`, new Components bind to the existing valid Foundation values instead of creating parallel replacements.