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

Variable pages require structural validation, not just content validation.

For every 2528 px semantic-variable frame:

```text
Section content width = 2368
Design note width = 720
Table width = 2368
Columns = 400 / 212 / 213 / 1543
```

The generation step must reject and repair the frame when:
- the 720 px Design note width is inherited by the table;
- table or group `clipsContent` is true;
- the Usage column extends beyond the visible table bounds;
- a row-based construction causes columns to overflow;
- Light/Dark aliases are rendered as plain text instead of visual alias chips;
- semantic token names are rendered as unstructured plain text instead of token badges/hierarchy;
- Usage content is generic templated filler.

For color-variable tables specifically, the final visual QA must verify:
1. four visible columns;
2. full-width table;
3. token badges in Name;
4. swatch + alias chips in mode columns;
5. explicit per-token Usage copy;
6. hierarchy connectors/indentation for modifiers;
7. 80 px data-row rhythm and 12 px subgroup separators.

Do not mark Color variables complete until this validation passes.
