# Figma File Architecture

This specification defines the canvas structure that every generated design-system file must follow.

The file is documentation-first. Do **not** generate separate utility boards such as `Source`, `Matrices`, or `QA` as the main visual presentation. Foundations and components are documented inside complete, polished documentation frames.

## Page order

Create or retain pages in this relative order. The initiator determines whether each page is kept, audited, rebuilt, built, or skipped.

```text
00 — START

❖ FOUNDATIONS
  ↳ Color
  ↳ Typography
  ↳ Spacing
  ↳ Sizing
  ↳ Radius
  ↳ Borders
  ↳ Elevation & Focus
  ↳ Layout, Grid & Breakpoints
  ↳ Motion
  ↳ Iconography
  ↳ Imagery
  ↳ Brand Assets
  ↳ Accessibility

❖ COMPONENTS
  ↳ Button
  ↳ Button Group
  ↳ Link
  ↳ Checkbox
  ↳ Radio
  ↳ Switch
  ↳ Field
  ↳ Text Input
  ↳ Textarea
  ↳ Select
  ↳ Combobox
  ↳ Search Input
  ↳ Verification Input
  ↳ File Upload
  ↳ Menu & Dropdown
  ↳ Slider
  ↳ Tabs
  ↳ Segmented Control
  ↳ Badge
  ↳ Avatar
  ↳ Tooltip
  ↳ Divider
  ↳ Breadcrumb
  ↳ Pagination
  ↳ Progress
  ↳ Spinner
  ↳ Skeleton
  ↳ Alert
  ↳ Toast

90 — INTERNAL
99 — ARCHIVE
```

## Parent pages

`❖ FOUNDATIONS` and `❖ COMPONENTS` are real parent pages.

Each parent page contains one `1600 px`-wide documentation frame with:

```text
Header
Section
  Introduction
  Child-page index
  Dependency order
  Status table
Footer
```

The parent page is an index and orientation page. Do not place published assets on it.

## Child-page model

Each Foundation or Component page contains **complete documentation frames**, not generic source zones.

Use only the frame types required by the page:

```text
<Page name>                    2528 px or 2848 px wide
<Page name> variables          2528 px wide, when variables exist
<Page name> notes              1600 px wide, only when long-form guidance is useful
```

Examples of legitimate top-level frames:

```text
Color
Color variables
Color notes

Button
Button notes
```

Do not create:

```text
00 — Documentation
10 — Source
20 — Matrices
30 — QA
90 — Internals
```

as large visible canvas boards. Those names create a utility-sheet appearance and are prohibited as the primary documentation layout.

## Top-level frame placement

Top-level documentation frames sit side-by-side from left to right.

```text
First frame: x = 0, y = 0
Next frame: previous.x + previous.width + 240
All top-level documentation frames: y = 0
```

Use `240 px` canvas separation between complete documentation frames.

Production masters may sit **below the documentation frame that describes them** with at least `240 px` vertical canvas separation. They are not wrapped in a decorative board.

Private construction components may sit below production masters with at least `160 px` separation.

## Documentation frame families

### A. Overview / palette / specimen frame

Use when the page contains dense visual specimens such as palettes, icon sets, type scales, effects, or large component matrices.

```text
Width: 2848
Layout: Vertical Auto Layout
Background: white
Corner radius: 0
Clip content: false
```

Structure:

```text
<Page name>
├─ Design system header
├─ Section
└─ Design system footer
```

### B. Variable / specification table frame

Use for variable tables, token mappings, property tables, and detailed specification tables.

```text
Width: 2528
Layout: Vertical Auto Layout
Background: white
Corner radius: 0
Clip content: false
```

Structure:

```text
<Page name> variables
├─ Design system header
├─ Section
├─ Design system footer
└─ optional 12 px closing divider
```

### C. Long-form notes frame

Use only when a topic genuinely benefits from deeper guidance.

```text
Width: 1600
Layout: Vertical Auto Layout
Background: white
Corner radius: 0
Clip content: false
```

Structure:

```text
<Page name> notes
├─ Design system header
├─ Section
└─ Design system footer
```

Long-form notes are optional. Keep them shorter than the full reference-style handbook: cover only decisions the user needs to apply the system correctly.

## Masters and examples

Published components and reusable assets remain real Figma components/styles/variables.

Documentation examples must use instances of those assets whenever possible.

Do not redraw a fake Button, Input, Badge, etc. only for documentation if a real component already exists.

## Internal documentation assets

`90 — INTERNAL` contains reusable documentation primitives only:

```text
_Doc / Header
_Doc / Footer
_Doc / Design note
_Doc / Tag
_Doc / Swatch
_Doc / Table cell / Header
_Doc / Table cell / Name
_Doc / Table cell / Value
_Doc / Table cell / Usage
_Doc / Divider
_Doc / Annotation
_Doc / Image frame
```

These assets exist to keep every page visually consistent. They are not product components.

## Archive page

`99 — ARCHIVE` contains superseded masters/documentation during migration only.

Nothing on this page is published.

## Initiator-driven status

Before generation, resolve every supported page to:

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

`SKIP` creates nothing.

## Start page generation manifest

`00 — START` contains a frame named `Generation manifest` recording:

- product;
- brand status;
- supported platforms;
- modes;
- existing-system actions;
- Foundations in scope;
- Components in scope;
- token architecture;
- token naming preset;
- output formats;
- density;
- radius direction;
- elevation direction;
- icon strategy;
- documentation depth.

This manifest explains why the generated library has its current shape.