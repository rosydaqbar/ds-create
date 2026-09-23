# Brand-Agnostic Design System Initiator

This package defines how to **audit, extend, or generate** the Foundation and Base Component layers of a Figma design system.

The system is brand-agnostic in values, but **not open-ended in documentation structure**. Page hierarchy, canvas composition, documentation layout, table anatomy, specimen presentation, and component-matrix behavior are fixed by this package. Brand-specific values are resolved later from the initiator answers.

## Scope

The supported source structure is intentionally limited to:

```text
Getting started
Variables

❖ FOUNDATIONS
  ↳ Colors
  ↳ Typography
  ↳ Logos
  ↳ Icons
  ↳ Misc icons
  ↳ Effect styles
  ↳ Spacing, radius & grids

❖ BASE COMPONENTS
  ↳ Avatars
  ↳ Badges
  ↳ Button groups
  ↳ Buttons
  ↳ Checkboxes
  ↳ Dropdowns
  ↳ Inputs
  ↳ Progress indicators
  ↳ Radio groups
  ↳ Select
  ↳ Sliders
  ↳ Tags
  ↳ Text editors
  ↳ Toggles
  ↳ Tooltips
  ↳ Video players
```

Do **not** substitute a different component taxonomy such as generic `Link`, `Toast`, `Breadcrumb`, `Pagination`, or `Alert` pages. Those belong to other system layers and are outside this package.

## Execution order

1. Read `03-initiator-questionnaire.md`.
2. Inspect the user's existing Figma library and codebase.
3. Resolve every page and component family to `Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, `Replace`, `Build`, or `Skip`.
4. Read `01-documentation-and-layout-system.md` before generating any canvas content.
5. Read `02-token-and-naming-contract.md` before creating or renaming variables.
6. Build Foundation pages in their observed page order.
7. Build Base Component pages in their observed page order.
8. Use the exact page-family specification file for every page being built.
9. Validate page structure, matrix coverage, copy hierarchy, spacing, and component properties before completion.

## Non-negotiable rule

The generator must not invent a generic documentation board. It must produce **finished documentation canvases and component matrices** using the page grammar in this package.
