# Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 1. Inspect first

Before changing Figma:
- inventory pages;
- inventory variables and modes;
- inventory local styles;
- inventory component sets and public properties;
- identify existing naming patterns;
- identify which observed page families already exist.

# 2. Page actions

## Keep
- retain page/canvas structure;
- use existing assets as dependencies;
- do not rename variables or public properties.

## Audit
- compare against the corresponding page Markdown file;
- report missing sections, matrices, properties, states, usage copy, or documentation;
- do not mutate until allowed by build strategy.

## Improve
- preserve page identity and public API;
- fill missing documentation or variants without unnecessary structural churn.

## Refactor
- preserve behavior and public meaning;
- private anatomy and bindings may change.

## Rebuild
- reconstruct the page using its exact page-family spec;
- migrate approved brand values and reusable assets.

## Replace
- create the replacement first;
- archive/remove superseded items only after migration.

## Build
- create the missing page/family using the exact page spec.

## Skip
- create nothing.

# 3. Generation order

```text
1. Getting started / Variables guidance if requested
2. Colors
3. Typography
4. Logos
5. Icons
6. Misc icons
7. Effect styles
8. Spacing, radius & grids
9. Avatars
10. Badges
11. Button groups
12. Buttons
13. Checkboxes
14. Dropdowns
15. Inputs
16. Progress indicators
17. Radio groups
18. Select
19. Sliders
20. Tags
21. Text editors
22. Toggles
23. Tooltips
24. Video players
```

# 4. Never replace page-family structure with generic component taxonomy

If a component belongs to a Base Component page family, keep it on that page. Example: verification inputs belong to `Inputs`, not a separate page.

# 5. Required validation

For every generated page verify:
- page-family width/zone positioning;
- header and section layout;
- every required section/family exists;
- full component-property matrix coverage;
- Design note content exists where required;
- token tables include Name / mode(s) / Usage;
- no detached generic QA/source dashboard was introduced.


# 6. Hard validation for variable documentation

Variable pages require structural validation, not universal fixed dimensions.

The audited measurements are **reference baselines**.

Validate these relationships:

```text
Section
└─ Variable group                     Fill container
   ├─ Design note                     constrained reading width
   └─ Variable table                  Fill container
      ├─ Name                         preferred / expandable
      ├─ Mode(s)                      content-driven / expandable
      └─ Usage                        Fill
```

The generation step must reject and repair the frame when:
- the Design note width is inherited by the table;
- the table or group clips content;
- Usage is not visible;
- a row-based construction pushes columns outside the visible table;
- additional modes are omitted to preserve an arbitrary reference width;
- long token names or aliases are truncated instead of allowing their column/frame to grow;
- row content overlaps because a baseline row height is treated as fixed;
- Light/Dark/theme aliases are rendered as plain text when a visual alias chip is appropriate;
- semantic token hierarchy is flattened;
- Usage copy is generic templated filler.

For color-variable tables specifically, final visual QA must verify:
1. every required column is visible;
2. table fills the available documentation width;
3. token badges are used in Name;
4. swatch + alias chips appear in color-mode columns;
5. every token has explicit usage copy;
6. hierarchy connectors/indentation are preserved;
7. rows grow when content requires it;
8. additional modes expand the table/frame rather than compressing the existing layout.

Do not mark Color variables complete until this validation passes.

# 7. Reference measurements are not constraints

Whenever this package records observed pixels, treat them as one of:

- baseline composition;
- preferred minimum;
- measured reference rhythm.

They are **not universal maximums** unless a component specification explicitly says a dimension is functionally fixed.

For documentation layouts, prefer:
- Fill container;
- Hug contents;
- semantic spacing tokens;
- constrained reading widths;
- content-driven columns;
- minimum sizes;
- expandable canvases.

A large brand/system is allowed to produce a larger documentation canvas while keeping the same visual grammar.