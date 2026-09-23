# Figma Page Map

Use this exact page hierarchy and relative order.

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

Parent pages are navigation separators and do not require canvas content.

## Page behavior

Each child page is a **canvas containing one or more horizontally arranged documentation/specimen regions**. Do not collapse a page into one small frame simply because the page has a single topic.

Foundation pages may contain:
- finished foundation overview frames;
- variable-table frames;
- private helper components;
- specimen grids;
- a long-form notes/documentation frame.

Base Component pages may contain:
- a private/unpublished base-component zone at the left;
- one or more public/published component-matrix zones to the right;
- large page headers above each zone;
- optional long-form notes/documentation at the far right.

## Existing libraries

For every child page, resolve one status:

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

`SKIP` means no placeholder page or frame is created.
