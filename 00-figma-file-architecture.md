# Figma File Architecture

## Page order

The hierarchy below is the **canonical ordering**.

Use `03-initiator-questionnaire.md` and `04-generation-decision-logic.md` to determine which pages are retained, created, updated, audited, rebuilt, or skipped.

Do not create missing pages that are out of scope.

For all pages that exist, preserve this relative order.

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

`❖ FOUNDATIONS` and `❖ COMPONENTS` are real pages, not separators.

They contain:
- section introduction;
- rules for the section;
- index of child pages;
- dependency diagram;
- completion checklist.

They must not contain published production assets.

## Child page canvas zoning

Every Foundation and Component child page uses the same horizontal canvas grammar.

```text
x = 0       Documentation
x = 2000    Source / Masters
x = 4000    Matrices / Specimens
x = 6000    QA / Stress tests
x = 8000    Internal construction, only when needed
```

Top-level zone frames:

```text
00 — Documentation
10 — Source
20 — Matrices
30 — QA
90 — Internals
```

### Zone width

- documentation board: `1600 px`
- source zone: `1600 px`
- matrix zone: `1600 px`
- QA zone: `1600 px`
- internal zone: `1600 px`

Leave `400 px` horizontal canvas space between zones.

### Vertical placement

All zones begin at `y = 0`.

Do not stagger zones vertically. A designer should be able to pan horizontally and compare equivalent sections.

## Source-zone rules

For Foundation pages:
- variables are the source of truth;
- the Source zone visually documents primitive and semantic values;
- examples may be components but must not be published as product components.

For Component pages:
- only publishable component sets and their private construction dependencies belong here;
- published masters are placed first;
- private helpers are placed below the masters and prefixed `_`.

## Matrix-zone rules

Matrices are instance-only.

Never place a detached instance in `20 — Matrices`.

Every matrix has:
1. matrix title;
2. fixed-property caption;
3. row labels;
4. column labels;
5. linked instances;
6. optional token or measurement annotations.

## QA-zone rules

QA specimens intentionally stress the component:
- longest plausible content;
- shortest content;
- missing optional content;
- all modes;
- 200% text where relevant;
- keyboard focus;
- localization expansion;
- RTL where relevant;
- dense surrounding surfaces;
- contrast edge cases.

## Internal page

`90 — INTERNAL` contains reusable documentation-only assets such as:
- annotation arrows;
- measurement labels;
- token chips;
- property tables;
- state labels;
- documentation header;
- documentation footer;
- Do / Don't frames.

Names must begin with `_Doc /` or `_Spec /`.

No product designer should need to use these assets in product design.

## Archive page

`99 — ARCHIVE` contains retired components or superseded documentation during migration only.

Nothing on this page is published.


## Initiator-driven page status

Before page creation, resolve each page to:

```text
KEEP
AUDIT
UPDATE
REBUILD
BUILD
SKIP
```

Example:

```text
❖ FOUNDATIONS
  ↳ Color                     KEEP
  ↳ Typography                AUDIT
  ↳ Spacing                   BUILD
  ↳ Motion                    SKIP

❖ COMPONENTS
  ↳ Button                    REFACTOR
  ↳ Text Input                BUILD
  ↳ Toast                     BUILD
```

`SKIP` means no placeholder page is created.

## Start page generation manifest

`00 — START` must include a frame named:

`Generation manifest`

It records the confirmed initiator contract:
- product;
- brand status;
- platforms;
- modes;
- scope;
- existing-system actions;
- token architecture;
- token naming preset;
- output formats;
- density/radius/elevation/icon decisions;
- documentation depth.

This frame is the traceable source for why the generated library has its current shape.