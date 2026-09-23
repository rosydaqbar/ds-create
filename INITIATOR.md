# Initiator and Generation

This is the canonical initiation and execution contract.

# Part A — Design System Initiator Questionnaire

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

For new systems, collection names use the canonical domain grammar from `SYSTEM.md`.

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

---

# Part B — Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 0. Integrated generation rule

Generation combines:
- the user's current request;
- supplied brand/source material;
- current Figma/library state;
- the exact Page hierarchy in `SYSTEM.md`;
- global documentation/layout rules in `SYSTEM.md`;
- token/naming rules in `SYSTEM.md`;
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
4. apply the deterministic collection grammar in `SYSTEM.md`;
5. keep product-specific concepts inside the appropriate domain unless a separate collection is explicitly required.

Token naming presets affect variable paths, not the collection naming grammar.

# 4. Generation order

```text
1. Getting started / Variables
2. Foundations in the order defined by SYSTEM.md
3. Base Components in the order defined by SYSTEM.md
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

1. **Page hierarchy** — use `SYSTEM.md`.
2. **Global documentation/layout** — use `SYSTEM.md`.
3. **Token/naming** — use `SYSTEM.md`.
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
