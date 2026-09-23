# Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 0. Integrated generation rule

The confirmed questionnaire is only one part of the contract. Generation must combine:
- the user's full current request;
- supplied source/brand material;
- the current Figma/library state;
- global documentation/layout rules;
- token/naming rules;
- every in-scope page specification;
- dependencies between foundations, assets, components, and examples.

Before editing Figma, build a completeness checklist from all of those sources. Do not narrow a complex request to the last defect mentioned by the user.

A local correction means:
1. fix the local defect;
2. preserve every existing requirement not explicitly removed;
3. re-check connected pages/components/tokens/documentation;
4. update dependent examples and notes when the underlying system changed;
5. run complete QA again.

Fail the generation if any detailed source requirement was replaced by a shorter generic substitute.

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
6. render every page-specific note, diagram, example, and guidance item defined by the page specification;
7. validate that no detailed requirement was compressed into a generic substitute;
8. validate that documentation is visible on canvas in the composition required by that page;
9. validate internal layer anatomy, not only screenshot appearance.

A Base Component page must be rejected and rebuilt if:
- its dedicated notes/documentation region is missing;
- its notes contain only generic prose that could describe another component;
- documentation exists only in Markdown/component descriptions but not visibly on the Figma canvas;
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
- avatar-management documentation.

## Buttons
Require:
- standard + destructive matrices;
- utility/close/loading helpers;
- social buttons/groups;
- app-store badges;
- page-specific documentation including hierarchy, destructive usage, optical balancing, and effect treatment.

## Text editors
Require:
- private icon set;
- toolbar;
- tooltip;
- editor;
- Text highlight;
- examples-in-use region.

## Every Base Component page
Require:
- every region defined by that page's specification;
- page-specific header;
- private region when specified;
- all component sets;
- exact property axes;
- anatomy defined in the page spec;
- full matrices;
- every page-specific note, rule, diagram, example, accessibility requirement, content rule, and maintenance instruction defined in that page file.

Do not impose one universal notes-frame structure. Generation is incomplete until the **entire page specification** is represented visibly and structurally in Figma.

# Notes & Documentation selection workflow

Before generating documentation for any page with long-form notes:

1. review the complete audited Notes & Documentation inventory for that page;
2. classify each topic by whether it directly helps create, maintain, audit, or evolve the current agnostic system;
3. discard topics that are promotional, source-specific, marketplace/resource catalogs, or outside the selected design-system scope;
4. for every selected topic, preserve the full explanation depth;
5. identify every relevant visual example used to teach that topic;
6. recreate those visuals using the generated system itself;
7. place the visuals immediately after the related explanation;
8. validate that the selected page is not prose-only.

Selection happens at the **topic + visual module** level.

Never perform this incorrect workflow:

```text
Audit page
→ extract headings
→ paraphrase headings into Markdown
→ omit diagrams/images/examples
```

Required workflow:

```text
Audit page
→ understand each topic
→ inspect how it is visually demonstrated
→ select relevant topic
→ preserve full written depth
→ recreate relevant demonstration
→ integrate into the same page spec
```

## Current audited long-form Notes pages

The audited file contains long-form Notes/Documentation for:
- Variables;
- Colors;
- Typography;
- Logos;
- Icons;
- Effect styles;
- Spacing/radius/grids;
- Avatars;
- Buttons;
- Portfolio mockups;
- Empty states;
- Tables.

For the current Foundation + Base Component builder:

### Selected/integrated
- Variables;
- Colors;
- Typography;
- Logos when brand/logo scope is enabled;
- Icons;
- Effect styles;
- Spacing/radius/grids;
- Avatars when Avatar scope is enabled;
- Buttons when Button scope is enabled.

### Audited but not generated in the current scope
- Portfolio mockups — presentation workflow, not Foundation/Base Component construction.
- Empty states — Application Component/UX guidance.
- Tables — Application Component/data-display guidance.

If the builder scope later includes those component families, their audited Notes & Documentation must be revisited and integrated at that time rather than re-audited from scratch.
