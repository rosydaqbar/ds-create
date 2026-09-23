# Brand-Agnostic Design System Initiator

## Canonical Figma terminology

Use Figma terms literally throughout this repository.

- **Figma File / Document** — the whole design file.
- **Figma Page** — a top-level `PAGE` node directly under the Document, such as `Colors`, `Buttons`, or `Inputs`.
- **Figma canvas** — the infinite working surface of a Figma Page. It is not a Frame.
- **Top-level Frame** — a `FRAME` placed directly on a Figma Page, such as `Color variables` or `Notes and documentation`.
- **Documentation Frame** — a Frame whose purpose is documentation, variable tables, foundation specimens, or long-form guidance.
- **Region / zone** — a conceptual area on a Figma Page. A region may be a Frame, or it may be a group of top-level Component Sets + header Instances. Do not assume every region has a wrapper Frame.
- **Component Set** — a Figma `COMPONENT_SET`.
- **Component** — a Figma `COMPONENT`.
- **Instance** — a Figma `INSTANCE`.
- **Markdown specification** — a repository `.md` file that defines what to build. Never call a Markdown specification a Figma Page or Frame.
- **Page specification** — avoid this phrase. Write **Markdown specification for the Figma Page** instead.
- **Frame specification** — use only when the requirement applies to one specific Figma Frame.

Examples from the audited hierarchy:
- The `Colors` Figma Page contains top-level Frames for `Colors`, `Gradients`, `Color variables`, `Color utility variables`, and long-form Notes.
- The `Buttons` Figma Page contains Component Sets and header Instances directly on the Page, plus one top-level long-form documentation Frame.

When a requirement concerns width, height, padding, Auto Layout, clipping, or Fill/Hug behavior, it normally applies to a **Frame or Component**, not to a Figma Page, because a Figma Page has no finite layout width/height.

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

Treat the user's request, supplied brand/source material, current Figma state, global documentation rules, token contract, and **every in-scope Markdown specification for its Figma Page as one generation contract**.

Do not solve one visible defect by narrowing the task to that defect.

1. Read `03-initiator-questionnaire.md`.
2. Inspect the user's existing Figma library and codebase.
3. Read `01-documentation-and-layout-system.md` and `02-token-and-naming-contract.md`.
4. Read the exact specification for **every in-scope Figma Page and its corresponding Markdown specification before generation begins**.
5. Build one completeness matrix containing every required region on each Figma Page, asset family, token family, component family, anatomy requirement, matrix, note, example, usage rule, and QA rule.
6. Resolve each item to `Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, `Replace`, `Build`, or `Skip`.
7. Generate the system as one integrated dependency graph: guidance → foundations/tokens → reusable assets → Base Components → examples/documentation.
8. When one requirement changes, update the affected output **and revalidate every dependent requirement**. Do not patch one card, one Figma Page, one component, or one note in isolation.
9. Preserve the full specificity of each source file. A shorter summary is not an acceptable replacement for a detailed requirement.
10. Validate the complete system before completion: page structure, documentation content, token architecture, asset coverage, matrices, anatomy, examples, accessibility, copy hierarchy, spacing, and public component properties.

## Non-negotiable rules

The generator must not invent a generic documentation board. It must produce the **complete composition required by each Markdown specification for a Figma Page**.

Do not reduce requirements:
- do not turn detailed source instructions into a shorter generic checklist;
- do not replace Figma-Page-specific documentation with one universal “notes” frame;
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
