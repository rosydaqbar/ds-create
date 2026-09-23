# Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 0. Integrated generation rule

Generation combines:
- the user's current request;
- supplied brand/source material;
- current Figma/library state;
- the exact Page hierarchy in `00-page-map.md`;
- global documentation/layout rules in `01-documentation-and-layout-system.md`;
- token/naming rules in `02-token-and-naming-contract.md`;
- every in-scope page-specific Markdown specification.

A local correction does not cancel unrelated approved requirements.

# 1. Inspect first

Before changing Figma:
- inventory Figma Pages and top-level Frames/Component Sets;
- inventory variables, modes, and local styles;
- inventory component sets and public properties;
- identify current naming patterns;
- map existing content to the exact Page hierarchy.

# 2. Figma Page actions

## Keep
Retain the Page, public API, and approved content.

## Audit
Compare against its page-specific Markdown specification without mutating unless the build strategy permits it.

## Improve
Preserve identity/public API and fill missing approved requirements.

## Refactor
Preserve behavior/public meaning; private anatomy may change.

## Rebuild
Reconstruct from the full page-specific Markdown specification while migrating approved brand values/assets.

## Replace
Create the replacement first; remove/archive superseded content only after migration.

## Build
Create the missing Page/family from its exact specification.

## Skip
Create nothing. Never infer Skip merely because an item was not mentioned in the latest prompt.

# 3. Collection naming

Before generating variables:
1. inspect existing collection names;
2. resolve Keep / Normalize / Custom;
3. resolve required domains;
4. apply the deterministic collection grammar in `02-token-and-naming-contract.md`;
5. keep product-specific concepts inside the appropriate domain unless a separate collection is explicitly required.

Token naming presets affect variable paths, not the collection naming grammar.

# 4. Generation order

```text
1. Getting started / Variables
2. Foundations in the order defined by 00-page-map.md
3. Base Components in the order defined by 00-page-map.md
4. Notes, examples, and documentation required by each Page specification
```

Do not substitute a different component taxonomy. A component stays on the Figma Page family defined by the Page map and its Markdown specification.

# 5. Build completeness

Before editing, build a checklist containing every in-scope:
- Figma Page;
- required Frame/region;
- variable/token family;
- component family;
- property axis;
- anatomy requirement;
- matrix;
- Notes & Documentation topic;
- diagram/example/workflow;
- accessibility/content/usage rule;
- QA requirement.

Resolve every checklist item to Keep / Audit / Improve / Refactor / Rebuild / Replace / Build / Skip.

# 6. Validation

Run validation in this order:

1. **Page hierarchy** — use `00-page-map.md`.
2. **Global documentation/layout** — use `01-documentation-and-layout-system.md`.
3. **Token/naming** — use `02-token-and-naming-contract.md`.
4. **Page-specific completeness** — run the complete QA in every in-scope file under `guidance/`, `foundations/`, and `base-components/`.

Do not duplicate detailed validation here.

Generation fails when:
- required Pages are merged, renamed, flattened, or reordered;
- required Frames/regions are missing;
- a component matrix is reduced to showcase samples;
- documented component anatomy is flattened;
- required Notes & Documentation exist only as prose when a visual example is required;
- page-specific requirements are replaced with generic substitutes;
- approved requirements disappear during a local fix.

# 7. Completion rule

Do not mark generation complete until every checklist item has a resolved state and every applicable canonical QA source passes.
