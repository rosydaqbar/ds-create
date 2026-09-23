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

## Integrated execution contract

Treat the user's request, supplied brand/source material, current Figma state, global documentation rules, token contract, and **every in-scope page specification as one generation contract**.

Do not solve one visible defect by narrowing the task to that defect.

1. Read `03-initiator-questionnaire.md`.
2. Inspect the user's existing Figma library and codebase.
3. Read `01-documentation-and-layout-system.md` and `02-token-and-naming-contract.md`.
4. Read the exact specification for **every page that is in scope before generation begins**.
5. Build one completeness matrix containing every required page region, asset family, token family, component family, anatomy requirement, matrix, note, example, usage rule, and QA rule.
6. Resolve each item to `Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, `Replace`, `Build`, or `Skip`.
7. Generate the system as one integrated dependency graph: guidance → foundations/tokens → reusable assets → Base Components → examples/documentation.
8. When one requirement changes, update the affected output **and revalidate every dependent requirement**. Do not patch one card, one page, one component, or one note in isolation.
9. Preserve the full specificity of each source file. A shorter summary is not an acceptable replacement for a detailed requirement.
10. Validate the complete system before completion: page structure, documentation content, token architecture, asset coverage, matrices, anatomy, examples, accessibility, copy hierarchy, spacing, and public component properties.

## Non-negotiable rules

The generator must not invent a generic documentation board. It must produce the **complete composition required by each page specification**.

Do not reduce requirements:
- do not turn detailed source instructions into a shorter generic checklist;
- do not replace page-specific documentation with one universal “notes” frame;
- do not replace component anatomy with visual approximations;
- do not replace examples, diagrams, matrices, usage notes, or source-derived rules with prose summaries;
- do not interpret a local user correction as permission to ignore the rest of the system;
- do not remove an existing requirement unless the user explicitly removes it.

Documentation is integrated into the page composition. Depending on the page, it may be expressed through headers, Design notes, usage columns, diagrams, examples, guidance sections, reading-oriented documentation frames, or page-specific notes. The exact form comes from that page's specification; no single documentation format is universal.

## Notes & Documentation are visual specifications

When a page includes selected long-form guidance, the builder must generate both:
- the written explanation; and
- the visual example/diagram/comparison that teaches it.

The complete audited selection and exclusions are tracked in `05-observed-page-inventory.md`.

Do not treat Notes & Documentation as prose-only Markdown.
