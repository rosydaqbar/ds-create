# Brand-Agnostic Design System Initiator

This package audits, extends, or generates the Foundation and Base Component layers of a Figma design system.

Brand values are adaptable. The Figma Page hierarchy, documentation grammar, component-family scope, and required page-specific specifications are deterministic.

# Runtime files

Read only these root files:

```text
README.md
01-system-contract.md
02-initiator-and-generation.md
```

Then read only the in-scope files under:

```text
guidance/
foundations/
base-components/
```

# Figma Page hierarchy

Use this exact **Figma Page** hierarchy and relative order.

```text
Getting started
Variables

––––––––––
❖ FOUNDATIONS
  ↳ Colors
  ↳ Typography
  ↳ Logos
  ↳ Icons
  ↳ Misc icons
  ↳ Effect styles
  ↳ Spacing, radius & grids

––––––––––
❖ BASE COMPONENTS
  ↳ Avatars
  ↳ Badges
  ↳ Button groups
  ↳ Buttons
  ↳ Checkboxes
  ↳ Dropdowns
  ↳ Inputs
  ↳ Progress indicators
  ↳ Radio groups
  ↳ Select
  ↳ Sliders
  ↳ Tags
  ↳ Text editors
  ↳ Toggles
  ↳ Tooltips
  ↳ Video players
```

Parent Figma Pages are navigation separators and do not require canvas content.

## Figma Page behavior

Each child Figma Page is an **infinite canvas containing one or more horizontally arranged documentation/specimen regions**. Do not collapse an entire Figma Page into one small Frame simply because the Page has a single topic.

Foundation Figma Pages may contain:
- finished foundation overview frames;
- variable-table frames;
- private helper components;
- specimen grids;
- a long-form notes/documentation frame.

Base Component Figma Pages may contain:
- a private/unpublished base-component zone at the left;
- one or more public/published component-matrix zones to the right;
- large header Instances above each zone;
- optional long-form notes/documentation at the far right.

## Existing libraries

For every child Figma Page, resolve one status:

```text
KEEP
AUDIT
IMPROVE
REFACTOR
REBUILD
REPLACE
BUILD
SKIP
```

`SKIP` means no placeholder Figma Page, Frame, or component region is created.

The hierarchy above is a **hard generation contract**.

Do not:
- flatten child Figma Pages into unprefixed sibling Pages;
- remove the `❖ FOUNDATIONS` or `❖ BASE COMPONENTS` separator Pages when that section has children;
- rename child Pages by dropping the `↳ ` prefix;
- reorder Pages;
- merge multiple required Figma Pages into one Page;
- infer `SKIP` from a missing mention in the latest prompt.

# Execution

1. Read `02-initiator-and-generation.md`.
2. Inspect the current Figma/library state and supplied brand/product inputs.
3. Read `01-system-contract.md`.
4. Read every in-scope page-specific Markdown specification.
5. Build one completeness checklist from those sources.
6. Resolve Keep / Audit / Improve / Refactor / Rebuild / Replace / Build / Skip.
7. Generate Foundations/tokens before dependent Base Components.
8. Render every required Notes & Documentation section, diagram, example, matrix, and usage rule defined by the page-specific specification.
9. Run global QA from `01-system-contract.md` and page-specific QA before completion.

# Non-negotiable

Approved requirements remain in force unless the user explicitly removes them.

A local correction changes the affected requirement and its dependencies; it does not authorize dropping unrelated approved structure or documentation.
