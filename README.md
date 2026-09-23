# Brand-Agnostic Design System Initiator

This package audits, extends, or generates the Foundation and Base Component layers of a Figma design system.

## Canonical ownership

```text
Page hierarchy/order                → 00-page-map.md
Global Figma/documentation grammar  → 01-documentation-and-layout-system.md
Tokens/naming                       → 02-token-and-naming-contract.md
Questions/scope                     → 03-initiator-questionnaire.md
Generation flow/actions             → 04-generation-decision-logic.md
Page-specific details               → guidance/, foundations/, base-components/
Audit provenance only               → 05-observed-page-inventory.md
File listing only                   → PACKAGE-MANIFEST.md
```

Each rule has one canonical owner. Do not restate the same rule in another root file.

## Staged loading

Do **not** load every root Markdown file on every run.

### Initiation / questionnaire phase

Read:
- `README.md`
- `00-page-map.md`
- `03-initiator-questionnaire.md`

Read `02-token-and-naming-contract.md` only when token architecture/naming must be resolved.

Do not load:
- `01-documentation-and-layout-system.md`
- `04-generation-decision-logic.md`
- `05-observed-page-inventory.md`
- `PACKAGE-MANIFEST.md`
- page-specific specs not yet selected

### Generation / modification phase

Read:
- `README.md`
- `00-page-map.md`
- `01-documentation-and-layout-system.md`
- `02-token-and-naming-contract.md`
- `04-generation-decision-logic.md`
- only the in-scope page-specific Markdown specifications

Use confirmed questionnaire answers as input. Do not reload `03-initiator-questionnaire.md` merely to repeat the questions.

Do not load `05-observed-page-inventory.md` or `PACKAGE-MANIFEST.md` during normal generation.

## Integrated execution contract

1. Preserve the exact Figma Page hierarchy from `00-page-map.md`.
2. Resolve scope using `03-initiator-questionnaire.md`.
3. Inspect the current Figma/library state.
4. During generation, apply global layout/terminology rules from `01-documentation-and-layout-system.md`.
5. Apply token rules from `02-token-and-naming-contract.md`.
6. Read only the selected page-specific Markdown specifications.
7. Execute using `04-generation-decision-logic.md`.
8. Validate global rules once, then validate each selected Page against its own specification.

## Non-negotiable

- Approved requirements remain in force unless explicitly removed.
- Do not merge required Figma Pages into one Page.
- Do not flatten, rename, or reorder the hierarchy in `00-page-map.md`.
- Do not replace detailed page-specific requirements with generic summaries.
- Notes & Documentation are visual specifications: required diagrams, comparisons, examples, workflows, and matrices must exist visibly in Figma.
- Variable collection naming is deterministic according to `02-token-and-naming-contract.md`.
- Consolidation means deduplicating ownership and staged loading, not deleting unique rules.
