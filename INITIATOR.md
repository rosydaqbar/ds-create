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

---

# Part B — Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 0. Mandatory specification loading

Before implementation, load the complete applicable specification set.

Always load:

```text
README.md
SYSTEM.md
INITIATOR.md
```

Then:

- Getting started selected → load `guidance/01-getting-started.md`
- Variables selected → load `guidance/02-variables.md`
- Any Foundation selected → load `foundations/00-foundations.md` **and every selected Foundation Page file**
- Any Base Component selected → load `base-components/00-base-components.md` **and every selected Base Component Page file**

The exact Page → file mapping is defined in `README.md`.

**Root-only implementation is forbidden.**

Do not inspect, generate, modify, or mark complete an in-scope Foundation/Base Component Page from `README.md`, `SYSTEM.md`, or questionnaire answers alone.

If any required specification file has not been loaded, stop implementation and load it first.

# 1. Integrated generation rule

Generation combines:
- the user's current request;
- supplied brand/source material;
- current Figma/library state;
- the exact Page hierarchy and global grammar in `SYSTEM.md`;
- the confirmed decisions in this file;
- `foundations/00-foundations.md` when Foundations are in scope;
- `base-components/00-base-components.md` when Base Components are in scope;
- every selected Page-specific Markdown specification.

A local correction does not cancel unrelated approved requirements.

# 2. Inspect first

Only after mandatory specifications are loaded:
- inventory Figma Pages and top-level Frames/Component Sets;
- inventory variables, modes, and local styles;
- inventory component sets and public properties;
- identify current naming patterns;
- map existing content to the exact Page hierarchy;
- map each selected Figma Page to its loaded Markdown specification.

# 3. Figma Page actions

## Keep
Retain the Page, public API, and approved content.

## Audit
Compare against its complete loaded Page specification without mutating unless the build strategy permits it.

## Improve
Preserve identity/public API and fill missing approved requirements from the complete loaded specification.

## Refactor
Preserve behavior/public meaning; private anatomy may change only where its specification permits.

## Rebuild
Reconstruct from the complete loaded Page specification while migrating approved brand values/assets.

## Replace
Create the replacement first; remove/archive superseded content only after migration.

## Build
Create the missing Page/family from its complete loaded specification.

## Skip
Create nothing. Never infer Skip merely because an item was not mentioned in the latest prompt.

# 4. Collection naming

Before generating variables:
1. inspect existing collection names;
2. resolve Keep / Normalize / Custom;
3. resolve required domains;
4. apply the deterministic collection grammar in `SYSTEM.md`;
5. apply all variable requirements in `guidance/02-variables.md` when Variables are in scope;
6. keep product-specific concepts inside the appropriate domain unless a separate collection is explicitly required.

# 5. Generation order

```text
1. Load all mandatory specifications
2. Getting started / Variables
3. Foundations using foundations/00-foundations.md + selected Foundation specs
4. Base Components using base-components/00-base-components.md + selected Base Component specs
5. Notes & Documentation, examples, diagrams, matrices, and QA required by each loaded spec
```

Do not substitute a different component taxonomy.

# 6. Build completeness

Build the completeness checklist from the **loaded specifications**, not from root summaries.

For every selected Page capture:
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

Resolve every item to Keep / Audit / Improve / Refactor / Rebuild / Replace / Build / Skip.

# 7. Validation

Validation fails immediately if:
- any required folder-level specification was not loaded;
- any selected Page specification was not loaded;
- generation relied only on root files;
- required Pages are merged, renamed, flattened, or reordered;
- required Frames/regions are missing;
- component matrices are reduced to showcase samples;
- documented anatomy is flattened;
- required Notes & Documentation or visual examples are missing;
- approved requirements disappear during a local fix.

Then run:
1. global hierarchy/layout/token validation from `SYSTEM.md`;
2. Foundation-family validation from `foundations/00-foundations.md` when applicable;
3. Base Component-family validation from `base-components/00-base-components.md` when applicable;
4. complete QA from every selected Page-specific specification.

# 8. Completion rule

Do not mark generation complete until:
- every required spec is confirmed loaded;
- every checklist item is resolved;
- every applicable global, family-level, and Page-specific QA rule passes.
