# Initiator and Generation

This is the single runtime decision contract.

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

# 6. Validation delegation

Do not duplicate detailed validation here.

After generation:
1. run every global validation defined in `01-system-contract.md`;
2. run the complete QA defined in every in-scope Markdown specification under `guidance/`, `foundations/`, and `base-components/`;
3. fail completion if any required Figma Page, Frame/region, token family, component family, property axis, anatomy rule, Notes & Documentation section, diagram, example, or usage rule is missing;
4. never replace a detailed page-specific requirement with a generic summary.

For long-form Notes & Documentation, relevance selection and visual-teaching behavior are governed by `01-system-contract.md`; the actual selected content is defined in the corresponding page-specific Markdown specification.

# 7. Runtime dependency rule

Read only:
- `README.md`;
- `01-system-contract.md`;
- `02-initiator-and-generation.md`;
- the page-specific Markdown specifications that are actually in scope.

Do not load deleted audit ledgers or manifests during generation.
