# Brand-Agnostic Design System Initiator

This package audits, extends, or generates the Foundation and Base Component layers of a Figma design system.

## Runtime ownership

Read these root files once:

1. `00-page-map.md` — exact Figma Page hierarchy, ordering, separator Pages, and Page-level build status.
2. `01-documentation-and-layout-system.md` — global Figma terminology, documentation layout, variable-table structure, visual documentation behavior, and shared canvas rules.
3. `02-token-and-naming-contract.md` — token architecture, collection naming, token naming, and existing-API preservation.
4. `03-initiator-questionnaire.md` — questions and confirmed scope.
5. `04-generation-decision-logic.md` — execution order and action semantics.
6. `05-observed-page-inventory.md` — compact audit-routing index only.

Then read only the in-scope Markdown specifications under:
- `guidance/`
- `foundations/`
- `base-components/`

Do not reload a rule from multiple files when one file is its canonical owner.

## Canonical ownership

```text
Page hierarchy/order                → 00-page-map.md
Global Figma/documentation grammar  → 01-documentation-and-layout-system.md
Tokens/naming                       → 02-token-and-naming-contract.md
Questions/scope                     → 03-initiator-questionnaire.md
Generation flow/actions             → 04-generation-decision-logic.md
Audit routing                       → 05-observed-page-inventory.md
Page-specific details               → guidance/, foundations/, base-components/
```

Page-specific anatomy, matrices, Notes & Documentation, examples, and QA belong only in their corresponding page-specific Markdown file. Root files must not duplicate them.

## Integrated execution contract

1. Resolve scope with `03-initiator-questionnaire.md`.
2. Inspect the current Figma/library state.
3. Read the exact Figma Page map from `00-page-map.md`.
4. Read global layout/terminology rules from `01-documentation-and-layout-system.md`.
5. Read token rules from `02-token-and-naming-contract.md`.
6. Read only the page-specific Markdown files that are in scope.
7. Execute using `04-generation-decision-logic.md`.
8. Validate global rules once, then validate every in-scope page against its own specification.

## Non-negotiable

- Approved requirements remain in force unless explicitly removed.
- Do not merge required Figma Pages into one Page.
- Do not flatten the Page hierarchy defined in `00-page-map.md`.
- Do not replace detailed page-specific requirements with generic summaries.
- Notes & Documentation are visual specifications: when a selected topic requires diagrams, comparisons, examples, or workflows, render them visibly in Figma.
- Variable collection naming is deterministic according to `02-token-and-naming-contract.md`.
