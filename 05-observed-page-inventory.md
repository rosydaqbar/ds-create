# Observed Page Inventory

This file records the audited content-bearing pages and long-form documentation coverage used to construct this brand-agnostic initiator.

It is an audit index, not a second documentation system.

# Foundation + Base Component content scope

The current initiator directly builds:
- Getting Started / initiation guidance;
- Variables guidance;
- Foundation pages;
- Base Component pages.

Application/Marketing component families remain outside the current build scope unless explicitly added later.

# Long-form Notes & Documentation audit

Every long-form Notes/Documentation frame in the audited file has been reviewed for:
- written topics;
- visual examples;
- comparison structures;
- workflow/editor examples;
- measurement diagrams;
- component examples;
- relevance to an agnostic Foundation + Base Component builder.

## 1. Variables — SELECTED

Integrated into:
`guidance/02-variables.md`

Relevant written guidance retained:
- when variables are useful;
- variables vs styles;
- dark mode without variable modes;
- density-mode tradeoffs;
- breakpoint-mode limitations;
- solid vs transparent dark-mode neutrals;
- contrast/layering implications;
- alternate-mode implementation workflow.

Relevant visual mechanisms retained:
- real dark-mode component example;
- primitive/semantic/style relationship diagram;
- density-mode comparison;
- breakpoint structural comparison;
- solid vs transparent dark-mode comparison;
- multi-theme example when relevant;
- contrast comparison;
- alpha layering problem vs solid-color comparison;
- variable-mode workflow diagrams.

## 2. Colors — SELECTED

Integrated into:
`foundations/01-colors.md`

Relevant written guidance retained:
- defining the palette;
- choosing supporting colors;
- establishing color architecture before components;
- accessibility/contrast;
- primitive → semantic variables;
- changing brand palette;
- changing neutral palette;
- color/effect dependencies.

Relevant visual mechanisms retained:
- palette-system overview;
- raw color vs tokenized usage comparison;
- contrast example;
- primitive → semantic mapping;
- variable-edit workflow;
- brand-palette before/after;
- neutral-character comparison;
- neutral-palette update;
- effect-color dependency.

Not retained:
- palette-generator promotion;
- plugin promotion;
- source palette/version history.

## 3. Typography — SELECTED

Integrated into:
`foundations/02-typography.md`

Relevant written guidance retained:
- hierarchy;
- Display vs Text roles;
- base size;
- line height;
- tracking;
- typeface suitability;
- weight coverage;
- keeping family count intentional;
- centralized maintenance.

Relevant visual mechanisms retained:
- complete type-scale specimen;
- Display vs body example;
- base-size comparison;
- line-height comparison;
- tracking comparison;
- weight-coverage specimen;
- typography style/variable update workflow.

Not retained:
- large free-font catalog;
- large paid-font catalog;
- price lists;
- type marketplace/resource screenshots.

## 4. Logos — SELECTED WHEN BRAND/LOGO SCOPE IS ENABLED

Integrated into:
`foundations/03-logos.md`

Relevant written guidance retained:
- centralized shared logo assets;
- replacing placeholder/brand marks;
- optical sizing;
- licensing/trademark awareness.

Relevant visual mechanisms retained:
- source asset → dependent instances propagation;
- replacement workflow;
- not-optically-sized vs optically-sized comparison;
- actual sizing-height guide;
- optical alignment lines.

Not retained:
- promotional logo-pack content.

## 5. Icons — SELECTED

Integrated into:
`foundations/04-icons.md`

Relevant written guidance retained:
- icons for scanability;
- familiar symbols;
- icons vs text;
- collapsed navigation;
- icon sizing;
- library consistency;
- instance-swap overrides;
- icon anatomy;
- export/boolean-group risks.

Relevant visual mechanisms retained:
- navigation with vs without icons;
- familiar-symbol specimen;
- icon-only vs icon+text comparison;
- collapsed navigation example;
- scaling vs featured-icon alternative;
- icon-family consistency comparison;
- override success/failure examples;
- icon anatomy;
- clean path vs problematic boolean/export construction.

Not retained:
- icon-library promotion and asset-count claims.

## 6. Effect styles — SELECTED

Integrated into:
`foundations/06-effect-styles.md`

Relevant written guidance retained:
- optional depth/elevation;
- centralized effect editing/removal;
- focus rings;
- effect variables;
- shadow color dependencies.

Relevant visual mechanisms retained:
- flat vs selected depth treatment;
- effect-stack anatomy;
- remove/change effect workflow;
- focus-ring specimens across surfaces;
- focus-token edit propagation;
- palette-change effect dependency.

## 7. Spacing, radius & grids — SELECTED

Integrated into:
`foundations/07-spacing-radius-grids.md`

Relevant written guidance retained:
- value of a spacing system;
- soft-grid approach;
- semantic spacing;
- optical exceptions;
- reading width;
- responsive grid/container relationships;
- radius roles.

Relevant visual mechanisms retained:
- modal without vs with spacing system;
- annotated modal spacing;
- dropdown spacing;
- Button optical-padding examples;
- reading-width measurement;
- line-length comparison;
- responsive/grid measurement;
- radius role specimen.

Authoring-only big-nudge guidance is optional/secondary.

## 8. Avatars — SELECTED WHEN AVATAR SCOPE IS ENABLED

Integrated into:
`base-components/01-avatars.md`

Relevant written guidance retained:
- image licensing/source;
- centralized avatar assets;
- changing avatar images;
- changing placeholders;
- changing placeholder backgrounds.

Relevant visual mechanisms retained:
- shared source → multiple Avatar instances;
- avatar source replacement workflow;
- image-fill edit workflow;
- placeholder replacement;
- placeholder/background-token propagation.

## 9. Buttons — SELECTED WHEN BUTTON SCOPE IS ENABLED

Integrated into:
`base-components/04-buttons.md`

Relevant written guidance retained:
- actionable affordance;
- hierarchy;
- destructive-action usage;
- icon live areas;
- optical padding;
- Text-padding wrapper;
- optional depth/effects;
- central removal/change of effects.

Relevant visual mechanisms retained:
- actionable vs ambiguous buttons;
- hierarchy vs equal-emphasis actions;
- three destructive modal examples;
- icon-frame/live-area anatomy;
- incorrect icon padding;
- padding accumulation;
- corrected Text-padding construction;
- optional depth treatment;
- effect-stack anatomy;
- effect-removal propagation.

## 10. Portfolio mockups — AUDITED, NOT SELECTED FOR CURRENT BUILDER

Content is about:
- exporting screens;
- drag/drop into Auto Layout presentation templates;
- portfolio/presentation background styling;
- using live design frames in presentation mockups.

Reason excluded:
- does not create or maintain Foundation/Base Component design-system assets.

No separate documentation file is generated.

## 11. Empty states — AUDITED, NOT SELECTED FOR CURRENT BUILDER

Relevant to Application Components/UX guidance:
- explain why content is empty;
- guide the next action;
- first-use states;
- illustration-supported empty states.

Visual mechanisms observed:
- bad empty state;
- good empty state;
- empty state with illustration.

Reason excluded:
- Empty States are outside the current Foundation + Base Component scope.

If Application Components are added later, this audit must be used.

## 12. Tables — AUDITED, NOT SELECTED FOR CURRENT BUILDER

Relevant to Application Components/data display:
- visual hierarchy;
- primary column;
- obvious interactions;
- adapting/detaching table compositions;
- responsive Auto Layout.

Visual mechanisms observed:
- table visual hierarchy;
- primary-column example;
- interactive-controls example;
- table-customization/detach example;
- responsive table;
- Auto Layout examples.

Reason excluded:
- Tables are outside the current Foundation + Base Component scope.

If Tables are added later, this audit must be used.

# Audit rule

A page being “audited” does not mean all its notes are copied into the builder.

The required sequence is:

```text
Audit all
→ understand text + visuals
→ select only builder-relevant topics
→ preserve selected topics in full
→ recreate selected visual teaching mechanisms
→ integrate into the page they belong to
```

There is no separate Notes directory.
