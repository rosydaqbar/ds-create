# ❖ FOUNDATIONS

The Foundations parent page defines the reusable visual and behavioral primitives used by every component.

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

## Parent-page layer tree

```text
Doc / Foundations
├─ Header
├─ Hero
├─ Content
│  ├─ Section / Foundation model
│  ├─ Section / Token layers
│  ├─ Section / Child-page index
│  ├─ Section / Mode strategy
│  ├─ Section / Dependency order
│  └─ Section / Completion checklist
└─ Footer
```

## Dependency order

Build in this order:

1. Color primitives
2. Spacing and sizing primitives
3. Radius and borders
4. Typography
5. Elevation and focus
6. Layout and breakpoints
7. Motion
8. Iconography and imagery
9. Accessibility constraints
10. semantic tokens
11. component tokens

A component may not hardcode a value that already exists in Foundations.


## Initiator integration

The child-page list is the supported Foundation catalog, not a mandatory build list.

For each child Foundation, use the status resolved from the initiator:

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

When a Foundation is `KEEP`, all new Components must bind to the existing valid Foundation values rather than creating parallel replacements.

When a Foundation is `AUDIT`, do not mutate it until the selected build strategy permits changes.

Brand, platform, mode, density, token architecture, and token-naming answers must be resolved before creating new Foundation variables.