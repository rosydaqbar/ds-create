# Documentation and Layout System

This file defines the visual and structural grammar for all generated pages.

The documentation system follows a fixed **composition model**, not fixed canvas measurements.

Measured dimensions from the source analysis are intentionally excluded from generation rules. The generator must preserve hierarchy, spacing relationships, content order, and visual behavior using Auto Layout, semantic documentation tokens, Hug, Fill, minimum constraints, and content-driven expansion.

# 1. Documentation geometry model

Use logical documentation roles rather than hard-coded dimensions.

Recommended logical roles:

```text
doc.space.page
doc.space.header
doc.space.section
doc.space.group
doc.space.row
doc.space.inline

doc.measure.reading
doc.measure.row-note
doc.measure.table
doc.measure.specimen

doc.radius.surface
doc.border.subtle
doc.surface.page
doc.surface.header
```

These names are logical references only. Translate them through the token naming convention selected by the initiator.

## Frame families

Use these page behaviors:

| Purpose | Sizing behavior |
| --- | --- |
| Long-form documentation | Constrained reading-oriented frame; grows vertically with content |
| Standard Foundation / Base Component region | Wide specimen/documentation frame; grows with matrices and examples |
| Variable documentation | Full-width table frame; expands horizontally for modes/content |
| Palette overview | Extra-wide specimen frame; expands with palette size |
| Gradient overview | Extra-wide specimen frame; expands with gradient count |

Do not normalize every frame to one width.

Do not derive page size from one brand or one amount of content.

# 2. Documentation header

Every finished documentation frame begins with a reusable header block.

## Outer header

- width: Fill owning frame;
- height: Hug contents;
- layout: vertical;
- padding: `doc.space.page`;
- background: page surface;
- contains one rounded inner Content frame.

## Inner header content

Structure:

```text
Header content
layout: vertical
width: Fill
height: Hug
padding: doc.space.header
radius: doc.radius.surface
gap: doc.space.header
```

The inner header uses a subtle neutral/system surface resolved from the active design system.

## Header row

Structure:

```text
Header row
├─ Identity and page title
│  ├─ System / brand mark
│  └─ Breadcrumb
│     ├─ Parent section
│     ├─ Arrow
│     └─ Page title
└─ Optional source/product link
```

The identity mark is a compact square role derived from the documentation type scale and brand identity. Do not hard-code its dimensions.

Breadcrumb typography uses the documentation navigation text style.

The generated system must use its own identity or neutral system mark.

## Heading row

Structure:

```text
Heading and resources
├─ Heading and supporting text
│  ├─ H1
│  └─ Supporting paragraph(s)
└─ Optional Resources
   └─ Resource links
```

Rules:
- heading/supporting-text column uses a constrained readable measure;
- resources use Hug width;
- parent row uses Fill;
- resources remain right-aligned when present;
- heading-to-description spacing uses the documentation spacing scale;
- typography maps to documentation heading/body roles rather than raw font sizes.

# 3. Main Section frame

A finished documentation frame uses a Section directly under the header.

Rules:
- width: Fill;
- height: Hug;
- padding: `doc.space.section`;
- vertical gap between major content groups: `doc.space.group`;
- content must never be clipped merely to preserve a reference canvas size.

# 4. Design note pattern

Use Design notes for section introductions and row-level explanations.

## Major note

- width: `doc.measure.reading`;
- height: Hug;
- title: documentation section-heading style;
- optional badge: e.g. `Variables`, `Primitives`;
- title/badge gap: `doc.space.inline`;
- title-to-description gap: documentation text gap;
- body: documentation body style.

## Row note

- width: `doc.measure.row-note`;
- height: Hug;
- heading: documentation row-heading style;
- body: documentation body style;
- may include compact status badges.

A row note is intentionally narrower than the specimen area next to it.

Do not replace row notes with unlabeled swatches or generic captions.

# 5. Palette row pattern

The Color foundation uses a repeated row relationship:

```text
Palette row
width: Fill
layout: horizontal

├─ Design note
│  width: doc.measure.row-note
│
├─ gap
│  doc.space.group
│
└─ Swatches
   width: Fill or content-driven
   layout: horizontal
   grow canvas when required
```

## Swatch anatomy

```text
Swatch card
├─ Color specimen
│  └─ contrast/value annotation
└─ Content
   ├─ scale/value label
   └─ secondary value / source value
```

Rules:
- swatch dimensions come from a documentation specimen token;
- all swatches in the same family use consistent dimensions;
- swatch card uses a subtle border and documentation radius;
- accessibility annotations appear directly on or near the specimen when useful;
- a large palette expands the specimen region rather than shrinking swatches to fit an arbitrary page width.

## 5.1 Color representation is always visual

Across **all documentation pages**, any UI element that explains, summarizes, compares, or references a color must include an actual visual color specimen.

This includes:
- palette swatches;
- brand-translation cards;
- brand color summaries;
- semantic-token summaries;
- accessibility examples;
- gradient/source annotations;
- Getting Started color sections;
- component documentation that calls out a specific color role.

Required behavior:
- show a real swatch, filled surface, preview strip, or equivalent specimen;
- bind the specimen to the appropriate Figma variable when the variable exists;
- show the token/variable name as the primary technical identifier;
- raw values such as hex, RGB, HSL, CMYK, or Pantone may appear only as secondary metadata;
- never use colored text containing the raw value as a substitute for a specimen;
- never return a text-only color card.

Forbidden example:

```text
Crimson Red
#DC143C
Primary identity and actions
```

Required equivalent:

```text
Crimson Red
├─ [visible Crimson swatch]
├─ brand/crimson/50
├─ #DC143C
└─ Primary identity and actions
```

The exact card composition may adapt to the page, but the visible specimen is mandatory.


Semantic variable pages use a full-width documentation table.

The table must preserve the visual structure while adapting to token length, additional modes, localization, and documentation volume.

## 6.1 Structural rule

```text
Variable group
layout: vertical
width: Fill
height: Hug
clip content: false

├─ Design note
│  width: doc.measure.reading
│  height: Hug
│
├─ documentation group gap
│
└─ Variable table
   width: Fill
   height: Hug
   clip content: false
```

The Design note is intentionally narrower than the table.

Never allow the Design-note measure to constrain the table.

## 6.2 Table construction

Build the table as vertical columns inside one horizontal table frame.

```text
Variable table
layout: horizontal
width: Fill
height: Hug
gap: none

├─ Name column
├─ Mode column
├─ Mode column
├─ Additional mode column(s)
└─ Usage column
```

Column behavior:

### Name
- preferred/minimum width comes from `doc.table.name`;
- may grow for long token names or deeper hierarchy;
- token badges should remain readable.

### Mode columns
- one column per active mode/theme;
- width is driven by the largest alias/value chip in the column;
- additional modes create additional columns;
- never remove or compress modes merely to preserve the original reference width.

### Usage
- uses `Fill container`;
- has a readable minimum measure;
- wraps naturally;
- never clips.

## 6.3 Cell rhythm

Use semantic documentation sizing roles:

```text
doc.table.header
doc.table.separator
doc.table.row.min
```

Behavior:
- header uses a compact height role;
- subgroup separator uses a compact spacing role;
- data rows use a preferred minimum but grow when copy wraps;
- all cells in the same logical row resolve to the same final height;
- dividers remain aligned across all columns.

No table row height is a universal fixed pixel value.

## 6.4 Name-column cells

Semantic token names are presented as compact bordered token badges.

Badge behavior:
- width: Hug;
- height: Hug;
- compact internal padding;
- subtle border;
- documentation radius;
- readable token text.

### Hierarchical token relationships

Related modifiers/states render as an explicit tree, not indentation alone.

```text
parent
│
├── child
└── child
```

Required construction:

```text
Hierarchy group
├─ Parent row
│  └─ Parent token badge
└─ Children stack
   ├─ Child row
   │  ├─ Connector / Vertical
   │  ├─ Connector / Elbow
   │  └─ Child token badge
   └─ Child row
      ├─ Connector / Vertical
      ├─ Connector / Elbow
      └─ Child token badge
```

Rules:
- connector geometry derives from layout, not canvas coordinates;
- vertical branch continues through the child stack;
- each child receives an elbow;
- final branch terminates at the final child;
- child indentation uses a semantic documentation spacing token;
- connector uses a subtle documentation-border token;
- one-child families still show the connector;
- families without children show no connector;
- do not fake connectors with text glyphs.

## 6.5 Mode alias cells

Visual aliases use value chips rather than plain strings.

Color alias:

```text
Alias chip
├─ Resolved color swatch
└─ Primitive / alias token name
```

Rules:
- width and height: Hug;
- column grows for longer alias names;
- swatch shows resolved value;
- surface/border remains legible in every mode.

For non-color variables, use an equivalent value chip appropriate to the token type.

## 6.6 Usage cells

Usage is a first-class documentation column.

Every semantic token receives concrete UI-purpose copy.

Good:
- `Primary text such as page headings.`
- `Secondary text such as labels and section headings.`
- `Default border used around form controls and cards.`

Forbidden:
- generic filler;
- copy generated only from the token name;
- descriptions that simply restate the role.

Usage wraps and increases row height when required.

## 6.7 Scaling behavior

When the system is larger than the reference:

- longer token names → expand Name;
- longer aliases → expand the corresponding mode column;
- additional modes → add columns;
- longer Usage → wrap and grow rows;
- more tokens → grow vertically;
- massive families → split into logical subsections while preserving the same table grammar;
- larger documentation canvases are valid.

Do not reduce type size, truncate meaningful names, or compress the table solely to preserve one reference width.

# 7. Long-form documentation pattern

Long-form documentation uses a constrained reading composition:

```text
Long-form frame
├─ Header
├─ Section
│  └─ Rich text
│     width: doc.measure.reading
│     ├─ Content item
│     ├─ Content item
│     ├─ Image and links
│     │  ├─ Documentation image
│     │  └─ Resource links
│     └─ ...
└─ Footer
```

Use long-form pages for explanatory guidance, not token matrices.

Rules:
- headings use documentation typography roles;
- body uses documentation body role;
- imagery fills the reading measure when appropriate;
- links sit directly below relevant examples;
- frame grows with content.

# 8. Footer

Finished documentation frames end with a reusable footer.

Rules:
- width: Fill;
- height: Hug;
- outer and inner padding use documentation spacing tokens;
- optional system description and project identity;
- no copied source identity, URLs, or copyright material.

# 9. Base Component canvas grammar

Base Component pages are horizontal canvas regions, not one vertical dashboard.

Default relationship:

```text
Private/internal base region
→ Public component family
→ Related public component family
→ Additional family/families
→ Optional long-form documentation
```

Use a semantic canvas-region gap between major regions.

The canvas grows horizontally according to:
- number of component families;
- matrix width;
- variant count;
- documentation content.

Do not place regions using fixed absolute x coordinates.

## Private base region

When a page has private construction components:
- keep them in the first region;
- explain their internal purpose;
- visually separate them from published families.

## Public region

Each public family receives:
- a large documentation header;
- the complete component-set matrix;
- related cursors/examples where useful.

# 10. Reference measurements are observational only

Any dimensions discovered during source analysis are **evidence of hierarchy and rhythm**, not universal generation inputs.

Translate measured observations into:
- semantic spacing roles;
- constrained reading measures;
- preferred/minimum sizes;
- Fill/Hug behavior;
- content-driven columns;
- expandable canvases;
- consistent specimen dimensions.

Only retain a fixed dimension when it is intrinsic to the actual component being documented and the component specification explicitly requires it.

# 11. Documentation completeness

Before marking a page complete, confirm:

- every required page-family section exists;
- every component-set family exists or is intentionally skipped;
- every variant/property axis in scope exists;
- private and public families are visually separated;
- Design notes exist where required;
- semantic variable tables include usage copy;
- hierarchy connectors are visible where child tokens exist;
- aliases include visual previews where appropriate;
- no generic dashboard replaces the required documentation composition;
- no raw reference canvas dimensions are used as layout constraints.


# 11. Base Component page documentation standard

Base Component pages use a **family canvas** rather than the long-form Foundation-table pattern.

The documentation model has three layers:

```text
Page-level explanation
        ↓
Full component-set matrices
        ↓
Optional long-form notes/documentation
```

## 11.1 Page/family header

Every family region begins with a large documentation header.

Required content:

```text
Base components → <Page>
<Family title>
<Specific description of what the family does and when it is useful>
```

The description must be component-specific.

Examples of acceptable specificity:
- explain that input fields are used for user-entered data in forms/dialogs;
- explain that dropdown menus group secondary actions in compact subviews;
- explain that radio-group cards allow more supporting information without clutter;
- explain that video players are for realistic playback-preview mockups.

Forbidden:
- “A component used in UI.”
- “Use this for actions.”
- generic copy repeated across every page.

## 11.2 Private construction header

When a page contains private helpers, the private region receives its own header.

Required message:
- these are internal/unpublished building blocks;
- edit/reuse them to propagate changes to published components;
- they should not be used directly in product composition.

The private header may include neutral resource links for:
- component authoring;
- Figma component/property guidance.

Do not retain source-specific product URLs, names, or promotional copy.

## 11.3 Component matrices are documentation

The full component set itself is a major documentation artifact.

Do not place a small showcase above a hidden master set.

The matrix must make these relationships inspectable:
- size;
- hierarchy/type;
- state;
- selected/current/pressed conditions;
- icon/content compositions;
- breakpoint/theme/provider dimensions when applicable.

The visual grouping of the matrix should make property axes obvious even without opening the right sidebar.

## 11.4 Anatomy fidelity

Generated components must follow the nested anatomy defined by their page Markdown file.

A visual match is not sufficient when the internal hierarchy differs.

Examples of anatomy that must be preserved:
- Button label wrapped in a dedicated optical Text-padding frame;
- Dropdown rows built from private list-item and inset-icon helpers;
- Input label/control/hint stack with a flexible inner Content frame;
- Select open states composed from private menu-item sets;
- Toggle public component instancing a private track/thumb base;
- Video actions bar composed from reusable action-button and volume-slider helpers.

The generator must not flatten these structures to reduce layer count.

## 11.5 Notes and documentation frames

Only create a dedicated long-form notes frame where the page spec requires one.

In the audited Base Component scope, dedicated long-form notes are required for:
- Avatars;
- Buttons.

Do not invent a 1600-wide long-form page for every component merely for symmetry.

For other Base Component pages, the page/family header plus full matrix is the primary documentation surface unless the user's existing system already contains additional notes.

## 11.6 Buttons long-form documentation

The Buttons notes frame is substantial and must not be summarized into one paragraph.

Required topic blocks:
1. buttons should look actionable;
2. button hierarchy;
3. destructive actions;
4. optical button balance;
5. icon live-area/padding explanation;
6. the label Text-padding wrapper and compensation logic;
7. optional depth/effect treatment;
8. how the effect treatment can be globally removed/changed.

Use:
- 30 px-level section headings at the reference scale;
- 18/28 body rhythm at the reference scale;
- documentation images/examples placed directly after the related explanation;
- dividers between major conceptual topics.

The active brand/system values may change, but the educational structure remains.

## 11.7 Avatar long-form documentation

Required topics:
1. image-source strategy;
2. centrally managed/shared avatar assets;
3. replacing avatar images;
4. changing placeholder images;
5. changing placeholder/background fills centrally.

The generated text must describe the actual generated system mechanism.

## 11.8 Examples in use

When the page contains an explicit examples region, preserve it.

Observed example region:
- Text editors.

Examples are composed instances showing how the base components work together. They are not new public component masters.

# 12. Anatomy documentation inside Markdown specs

Every Base Component Markdown file must include:

```text
Purpose
Page regions
Published/private families
Property inventory
Representative anatomy tree
Auto Layout relationship
Flexible vs fixed children
Matrix requirements
Component-specific notes
QA
```

For complex pages, document each component family separately.

A file that only lists component-set names and variant axes is incomplete.

# 13. Component-page QA

A component page fails generation QA if:
- its Markdown file contains no anatomy tree;
- a private helper exists in the source pattern but the generated family duplicates its layers;
- the page header description is generic;
- required long-form notes are missing;
- the full component matrix is replaced by samples;
- a known optical/layout helper is omitted;
- examples-in-use are missing where specified;
- brand styling was copied as structure rather than mapped to the active brand tokens.
