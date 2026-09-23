# Figma Page Map

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
