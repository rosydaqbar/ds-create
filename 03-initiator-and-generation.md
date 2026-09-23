# Initiator and Generation

This is the runtime decision contract for the design-system builder.

It contains:
- the questions needed to understand the product, brand, existing library, scope, and naming;
- the actions resolved from those answers;
- the order and validation rules used during generation.

Do not read a separate questionnaire file and generation-logic file. They are one contract.

# Part A — Initiator Questionnaire

The questionnaire decides what gets preserved, audited, generated, or rebuilt.

# 1. Product

## Product status

**Single select**
- Existing product
- New product
- Multiple products under one brand
- Brand-wide system
- Internal tool
- Design-system-only project
- Other

## Product information

Ask for:
- product name;
- one-sentence product description;
- product URL;
- Figma product URL;
- existing design-system/library URL;
- existing code/component-library URL.

## Primary users and tasks

Ask:
- who primarily uses the product;
- their main tasks;
- important accessibility or localization requirements.

## Platforms

**Multi-select**
- Responsive web
- Desktop web
- Mobile web
- iOS
- Android
- Tablet
- Desktop app
- Other

# 2. Brand

## Brand maturity

- Established
- Partially established
- New
- No brand layer required
- Not sure

## Existing brand inputs

For each, select `Available`, `Partial`, `Missing`, or `Not needed`:
- logo;
- brand colors;
- neutral palette;
- typography;
- iconography;
- illustration;
- photography;
- motion;
- brand guidelines;
- tone of voice.

## Interface character

Pick up to four:
- Minimal
- Dense
- Spacious
- Quiet
- Bold
- Friendly
- Serious
- Technical
- Premium
- Playful
- Editorial
- Utilitarian
- Soft
- Sharp
- Expressive
- Restrained

## Modes

- Light
- Dark
- High contrast
- Multiple brands
- White-label themes
- User-selectable themes
- Product-specific themes

# 3. Existing system inventory

## Foundations

For each Figma Page, mark `Existing`, `Partial`, `Missing`, or `Not needed`:

```text
Colors
Typography
Logos
Icons
Misc icons
Effect styles
Spacing, radius & grids
```

## Base Component Figma Pages

```text
Avatars
Badges
Button groups
Buttons
Checkboxes
Dropdowns
Inputs
Progress indicators
Radio groups
Select
Sliders
Tags
Text editors
Toggles
Tooltips
Video players
```

For any existing Figma Page, allow a second-level inventory of the component sets inside that page.

# 4. Action per existing item

Each existing Figma Page/component family must resolve to one action:

- Keep
- Audit
- Improve
- Refactor
- Rebuild
- Replace
- Skip

Each missing Figma Page/component family resolves to:
- Build
- Skip

# 5. Build strategy

- Build only selected Figma Pages
- Audit first, then ask before changes
- Preserve existing Figma Pages and fill missing families
- Rebuild inconsistent parts only
- Complete Foundation + Base Component system

Default for existing systems: `Preserve existing Figma Pages and fill missing families`.

# 6. Foundation scope

Allow selection at Figma Page level, then Frame/region/component-family level.

## Colors

Optional sections:
- Base colors
- Brand palette
- Extended color palettes
- Gradients
- Color variables
- Color utility variables
- Long-form color guidance

## Typography

Optional sections:
- Typeface specimen
- Type scale
- Long-form typography guidance

## Logos

Optional sections:
- Product logomark/logo
- Partner/company logos
- Press/featured logos
- Logo usage guidance

## Icons

Optional sections:
- Main icon library
- Icon documentation/guidance

## Misc icons

Optional sections:
- Featured icons
- Check icons
- Social icons
- Integration icons
- Cursors
- Country flags
- Payment icons
- App icons
- File/folder icons
- Rating/star/dot/emoji helpers

## Effect styles

Optional sections:
- Shadows
- Focus rings
- Focus rings + shadows
- Skeuomorphic focus variants
- Backdrop blurs
- Long-form effects guidance

## Spacing, radius & grids

Optional sections:
- Spacing primitives
- Semantic spacing
- Widths
- Containers
- Paragraph max-width
- Radius
- Grid layouts
- Long-form spacing/grid guidance

# 7. Base Component scope

For each selected Figma Page, allow child-family selection.

Examples:

```text
Buttons
  Button
  Button destructive
  Button utility
  Button close X
  Button loading icon
  Social button
  Social button group
  Mobile app store badge

Inputs
  Input field
  Private input base
  Textarea input field
  Verification code input field
```

The complete child-family inventory is defined by the corresponding Markdown specification.

# 8. Token architecture

- Primitive → Semantic
- Primitive → Semantic → Component
- Match existing
- Custom

# 9. Collection naming

For new systems, collection names use the canonical domain grammar from `02-token-and-naming-contract.md`.

Default generated labels:

```text
Primitives
Color
Typography
Spacing
Sizing
Radius
Motion
Components
```

Only create domains that are actually required.

For existing systems, ask:

**Collection naming action**
- Keep existing collection names
- Normalize collection names
- Custom collection names

Do not expose architectural prefixes such as `Ref`, `Sys`, or `Comp` as the default generated collection grammar.

Product-specific concepts remain groups inside the relevant collection unless the user explicitly defines a separate collection architecture.

# 10. Token naming preset

- Keep existing naming
- Atlassian-style semantic naming
- Tailwind-style scale naming
- Material-style system/component hierarchy
- Ant-style alias naming
- Spectrum-style descriptive naming
- Custom

If the user supplies an existing library, default to `Keep existing naming`.

# 11. Documentation depth

The **top-level composition on the Figma Page canvas is fixed**. This selector only controls optional explanatory depth.

Selectable extras:
- Long-form guidance
- Resource links
- Accessibility callouts
- Do / Don't examples
- Developer notes
- QA notes

Do not remove required region/header Instances, Design notes, variable Usage columns, or component matrices.

# 12. Confirmation summary

Before generation, present:
- product/brand summary;
- platforms/modes;
- existing-page actions;
- selected Foundation Figma Pages/Frames/regions;
- selected Base Component Figma Pages/families;
- token architecture;
- collection naming action;
- token naming preset;
- output formats;
- optional documentation depth.

Final actions:
- **Confirm and generate**
- **Change answers**

# Part B — Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 0. Integrated generation rule

The confirmed questionnaire is only one part of the contract. Generation must combine:
- the user's full current request;
- supplied source/brand material;
- the current Figma/library state;
- global documentation/layout rules;
- token/naming rules;
- every in-scope Figma Page and its corresponding Markdown specification;
- dependencies between foundations, assets, components, and examples.

Before editing Figma, build a completeness checklist from all of those sources. Do not narrow a complex request to the last defect mentioned by the user.

A local correction means:
1. fix the local defect;
2. preserve every existing requirement not explicitly removed;
3. re-check connected Figma Pages/Frames/components/tokens/documentation;
4. update dependent examples and notes when the underlying system changed;
5. run complete QA again.

Fail the generation if any detailed source requirement was replaced by a shorter generic substitute.

# 1. Inspect first

Before changing Figma:
- inventory Figma Pages and their top-level Frames/Component Sets;
- inventory variables and modes;
- inventory local styles;
- inventory component sets and public properties;
- identify existing naming patterns;
- identify which observed Figma Page families already exist.

# 1.1 Collection naming validation

Before generating variables:

1. inspect existing collection names;
2. resolve whether the user selected Keep, Normalize, or Custom;
3. resolve the required variable domains;
4. generate collection names from the canonical domain labels;
5. keep product-specific concepts inside the relevant collection unless a separate architecture was explicitly requested.

For new systems, collection names must be deterministic.

Reject and repair generation when equivalent runs produce inconsistent collection styles such as:

```text
Ref — Color
Sys — Color
Sys — Space
Comp — Core
```

in one run and:

```text
Primitive
Color
Dimension
Component
```

in another.

For a new system, use the canonical domain grammar:

```text
Primitives
Color
Typography
Spacing
Sizing
Radius
Motion
Components
```

Only include domains that exist in the confirmed architecture.

Product-specific semantic color families such as signal strength, network quality, membership tier, or status belong inside `Color` rather than creating a differently named collection.

Component collections are created only when a component-token layer is enabled.

Token naming presets affect variable paths, not collection naming grammar.

# 2. Figma Page actions

## Keep
- retain the Figma Page and its top-level canvas structure;
- use existing assets as dependencies;
- do not rename variables or public properties.

## Audit
- compare against the corresponding Markdown specification;
- report missing sections, matrices, properties, states, usage copy, or documentation;
- do not mutate until allowed by build strategy.

## Improve
- preserve Figma Page identity and public component/token API;
- fill missing documentation or variants without unnecessary structural churn.

## Refactor
- preserve behavior and public meaning;
- private anatomy and bindings may change.

## Rebuild
- reconstruct the page using its exact Markdown specification for that Figma Page;
- migrate approved brand values and reusable assets.

## Replace
- create the replacement first;
- archive/remove superseded items only after migration.

## Build
- create the missing Figma Page/family using its exact Markdown specification.

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

# 4. Never replace Figma Page family structure with generic component taxonomy

If a component belongs to a Base Component Figma Page family, keep it on that Figma Page. Example: verification inputs belong to `Inputs`, not a separate page.

# 5. Required validation

For every generated Figma Page verify:
- top-level Frame/Component-Set region sizing and relative canvas positioning;
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

Variable documentation Frames require structural validation, not universal fixed dimensions.

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

Before generating or refactoring any Base Component Figma Page:

1. read the full corresponding Markdown specification;
2. build private helpers first;
3. build published masters from those helpers;
4. construct the complete property matrix;
5. add required region/family header Instances;
6. render every page-specific note, diagram, example, and guidance item defined by the corresponding Markdown specification;
7. validate that no detailed requirement was compressed into a generic substitute;
8. validate that documentation is visible on canvas in the composition required on that Figma Page;
9. validate internal layer anatomy, not only screenshot appearance.

A Base Component Figma Page must be rejected and rebuilt if:
- its dedicated notes/documentation region is missing;
- its notes contain only generic prose that could describe another component;
- documentation exists only in Markdown/component descriptions but not visibly on the Figma canvas;
- its master hierarchy differs from the documented anatomy;
- private helpers are missing or duplicated inline;
- a component property is omitted because it produces a large matrix;
- the Figma Page is represented by a few “nice examples” instead of the real matrix;
- required region descriptions are generic;
- Buttons omit the optical Text-padding wrapper;
- Dropdowns omit reusable list-item/inset-icon helpers;
- Inputs flatten label/control/hint into one frame;
- Select recreates menu items instead of using private helpers;
- Text-editor toolbars draw icons individually rather than using the icon set;
- Video-player controls are individually authored inside the player.

# 10. Documentation validation by Figma Page

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

## Every Base Component Figma Page
Require:
- every region defined by that Figma Page's Markdown specification;
- required region/family header;
- private region when specified;
- all component sets;
- exact property axes;
- anatomy defined in the Markdown specification;
- full matrices;
- every page-specific note, rule, diagram, example, accessibility requirement, content rule, and maintenance instruction defined in that Markdown file.

Do not impose one universal notes-frame structure. Generation is incomplete until the **entire Markdown specification** is represented visibly and structurally in Figma.

# Notes & Documentation selection workflow

Before generating documentation for any Figma Page with long-form notes:

1. review the complete audited Notes & Documentation inventory for that Figma Page;
2. classify each topic by whether it directly helps create, maintain, audit, or evolve the current agnostic system;
3. discard topics that are promotional, source-specific, marketplace/resource catalogs, or outside the selected design-system scope;
4. for every selected topic, preserve the full explanation depth;
5. identify every relevant visual example used to teach that topic;
6. recreate those visuals using the generated system itself;
7. place the visuals immediately after the related explanation;
8. validate that the selected documentation Frame is not prose-only.

Selection happens at the **topic + visual module** level.

Never perform this incorrect workflow:

```text
Audit Figma Page
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
→ integrate into the same Markdown specification
```

## Current audited long-form Notes Figma Pages

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
