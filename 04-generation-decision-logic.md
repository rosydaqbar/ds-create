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


# 5.1 Hard validation for color presentation

Color documentation fails generation when color is represented only by raw text values.

Reject and repair any frame/card/row where:
- a hex/RGB/HSL/CMYK/Pantone value is the only color representation;
- the raw value is merely colored to resemble the source color;
- a brand-translation card contains name + hex + description but no swatch/fill specimen;
- a color variable exists but the visual specimen is recreated as an unbound raw paint;
- the token/variable name is omitted while only a raw color value is shown.

Required repair:
1. add a visible swatch, filled surface, strip, or equivalent color specimen;
2. bind that specimen to the real variable when available;
3. show the token/variable name as the primary technical label;
4. keep the raw value only as secondary metadata when useful;
5. re-run screenshot QA at normal inspection size.

This validation applies globally, including Getting Started, Foundation pages, component documentation, examples, and custom brand-summary sections.

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
- child token rows are indented but have no connector lines;
- connector lines are represented only by text glyphs instead of Figma line/vector layers;
- connector branches do not terminate correctly at the final child;
- Usage copy is generic templated filler.

For color-variable tables specifically, final visual QA must verify:
1. every required column is visible;
2. table fills the available documentation width;
3. token badges are used in Name;
4. swatch + alias chips appear in color-mode columns;
5. every token has explicit usage copy;
6. hierarchy connectors/indentation are preserved, including visible vertical branches and elbow connectors for every child token;
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

# 8. Hierarchy connector validation

For semantic-variable Name columns, hierarchy is considered complete only when child relationships are visually connected.

Required for every token family with children:

```text
parent
│
├── child
└── child
```

Implementation requirements:
- parent badge remains at the base Name-column alignment;
- child badges are indented;
- a real vertical connector layer links the child stack;
- a real horizontal elbow layer connects each child to the branch;
- the final vertical segment stops at the last child;
- connector color uses a semantic documentation-border token;
- connector placement adapts to Hug-content row heights;
- connector layers must remain aligned when rows grow because of localization or content.

Fail generation if:
- children are only indented;
- connector layers are missing;
- connectors are drawn as text characters;
- branch/elbow alignment breaks when row height changes.


# 9. Base Component deep-anatomy validation

Before generating or refactoring any Base Component page:

1. read the full page Markdown file;
2. build private helpers first;
3. build published masters from those helpers;
4. construct the complete property matrix;
5. add page/family documentation headers;
6. add required long-form notes/examples;
7. validate internal layer anatomy, not only screenshot appearance.

A Base Component page must be rejected and rebuilt if:
- its master hierarchy differs from the documented anatomy;
- private helpers are missing or duplicated inline;
- a component property is omitted because it produces a large matrix;
- the page is represented by a few “nice examples” instead of the real matrix;
- page descriptions are generic;
- Buttons omit the optical Text-padding wrapper;
- Dropdowns omit reusable list-item/inset-icon helpers;
- Inputs flatten label/control/hint into one frame;
- Select recreates menu items instead of using private helpers;
- Text-editor toolbars draw icons individually rather than using the icon set;
- Video-player controls are individually authored inside the player.

# 10. Documentation validation by page

## Avatars
Require:
- private base region;
- avatar-user asset region;
- published avatar families;
- long-form avatar-management notes.

## Buttons
Require:
- standard + destructive matrices;
- utility/close/loading helpers;
- social buttons/groups;
- app-store badges;
- long-form notes including hierarchy, destructive usage, optical balancing, and effect treatment.

## Text editors
Require:
- private icon set;
- toolbar;
- tooltip;
- editor;
- Text highlight;
- examples-in-use region.

## Other Base Component pages
Require:
- page-specific header;
- private region when specified;
- all component sets;
- exact property axes;
- anatomy defined in the page spec;
- full matrices.
