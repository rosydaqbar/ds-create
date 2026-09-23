# Documentation and Layout System

This file defines the visual and structural grammar for all generated pages.

# 1. Finished documentation frame

Documentation frames are white, vertical Auto Layout frames. Their height is content-driven.

Observed frame families:

| Purpose | Width |
| --- | ---: |
| Long-form documentation | 1600 px |
| Standard Foundation / Base Component section | 2400 px |
| Variable tables | 2528 px |
| Large palette overview | 2848 px |
| Gradient overview | 2856 px |

Do not normalize every frame to one width. Use the page-specific width defined in the corresponding Markdown file.

# 2. Documentation header

Every finished documentation frame begins with a reusable header block.

## Outer header

- width: same as owning frame;
- layout: vertical;
- padding: `32` on all sides;
- background: page background;
- contains one rounded inner `Content` frame.

## Inner header content

For a 2528 px variable page, the measured inner content is:

```text
Outer frame                  2528
  padding                    32
  Content                    2464
    padding top              48
    padding left/right       48
    padding bottom           64
    corner radius            20
    major vertical gap       128
```

Use equivalent arithmetic for other page widths.

The inner header fill is a very light neutral surface. The actual neutral value comes from the active brand/system tokens.

## Header row

Height: approximately `36`.

Structure:

```text
Header row
├─ Logo and page title
│  ├─ Logomark: 36 × 36
│  └─ Breadcrumb
│     ├─ Parent section
│     ├─ Arrow
│     └─ Page title
└─ Optional source/product link
```

Breadcrumb typography:
- 20 px;
- 30 px line height.

The generated system must use its own identity or neutral system mark. Do not retain source branding.

## Heading row

Begins after the large header gap.

Structure:

```text
Heading and resources
├─ Heading and supporting text
│  ├─ H1
│  └─ Supporting paragraph(s)
└─ Optional Resources
   └─ Resource links
```

Measured default heading block:
- heading width: `1024`;
- H1: `60 / 72`;
- supporting text: `20 / 30`;
- heading-to-description gap: `20`.

Resources use:
- section label: 18 / 28;
- link row gap: 16;
- icon/link inline gap: 12.

# 3. Main Section frame

A finished documentation frame uses a `Section` frame directly under the header.

Default:
- horizontal padding: `80`;
- top/bottom padding: `80`;
- vertical gap between major content groups: `64`.

Examples:

```text
2528 page → 2368 content width
2848 page → 2688 content width
1600 page → 1440 content width
```

# 4. Design note pattern

Use Design notes for section introductions and row-level explanations.

## Major note

- width: `720`;
- title: `24 / 32`;
- optional badge: e.g. `Variables`, `Primitives`;
- title/badge gap: `8`;
- title-to-description gap: `12`;
- body: `18 / 28`.

## Row note

- width: `480`;
- heading: `18 / 28`;
- body: `18 / 28`;
- may include a small status badge such as `Default brand`, `Default error`, etc.

Do not replace row notes with unlabeled swatches.

# 5. Palette row pattern

The Color foundation uses a repeated row pattern.

For a 2848 px page:

```text
Section content width                2688
Row                                  2688
├─ Design note                       480
├─ gap                                64
└─ Swatches                         2144
   ├─ swatch                         160 × 156
   ├─ gap                             32
   └─ ...
```

## Swatch anatomy

```text
_Swatch base                         160 × 156
├─ Swatch                            160 × 80
│  └─ contrast/value annotation      18 / 28
└─ Content                           160 × 156
   padding top                        92
   padding left/right                 12
   padding bottom                     12
   ├─ scale/value label               18 / 28
   └─ secondary value / hex           16 / 24
```

Visual treatment:
- 12 px radius;
- 1 px subtle border;
- white/neutral content surface;
- swatch area may use a faint stroke for very light colors.

When contrast information is relevant, show it on the swatch. Do not hide accessibility metadata in a separate QA page.

# 6. Variable-table pattern

Semantic variable pages use a **full-width documentation table**.

The measured values in this section are **reference baselines**, not immutable output dimensions.

The generator must preserve the layout relationships while allowing the documentation frame to expand for:
- longer token names;
- additional modes/themes;
- longer aliases;
- localization;
- larger brand systems;
- more detailed Usage copy.

## 6.1 Structural rule

The semantic-variable group uses:

```text
Variable group
layout: vertical
width: Fill container
clip content: false

├─ Design note
│  width: constrained reading width
│  height: Hug
│
├─ vertical gap
│
└─ Variable table
   width: Fill container
   clip content: false
```

The Design note is intentionally narrower than the table.

**Never allow the Design note width to constrain the table width.**

## 6.2 Reference baseline

When the page uses the same scale as the audited reference, the observed baseline is approximately:

```text
Page                                   2528
Section horizontal padding              80
Available content width                2368

Design note preferred width              720
Note → table gap                          64

Name column preferred width               400
Light-mode column preferred width          212
Dark-mode column preferred width           213
Usage column receives remaining space
```

These numbers are useful as a starting composition only.

They must **not** be used as hard maximums or universal fixed values.

## 6.3 Adaptive table sizing

Use Auto Layout behavior instead of hard-coded total width.

### Table

- width: Fill container;
- height: Hug contents;
- layout: Horizontal;
- gap: 0;
- clip content: false.

### Name column

- preferred width: based on the audited baseline;
- minimum width: enough to keep normal token badges readable;
- may expand for long token names or deeper hierarchy;
- should not wrap token badges unless expansion would become unreasonable.

### Mode columns

One column per active mode/theme.

Examples:

```text
Light
Dark
```

or:

```text
Light
Dark
High contrast
Brand A
Brand B
```

Rules:
- mode columns are content-driven;
- each column must be wide enough for its largest alias chip;
- adding modes expands the table/frame horizontally;
- do not shrink existing columns merely to force the table into the original reference width.

### Usage column

- Fill remaining width;
- must have enough minimum width for readable prose;
- expands naturally when the frame grows;
- wraps text rather than clipping.

## 6.4 Scaling behavior

When content exceeds the baseline:

### Longer token names

Expand the Name column.

Do not:
- reduce type size;
- truncate meaningful token names;
- collapse hierarchy.

### Longer aliases

Expand the relevant mode column.

### Additional modes

Add additional mode columns.

The documentation frame may grow horizontally.

### Longer Usage copy

Usage cells wrap and rows grow vertically when required.

The 80 px reference row height is a **preferred minimum rhythm**, not a forced fixed height.

### More semantic tokens

The group grows vertically.

Do not compress rows to fit a predetermined frame height.

### Massive systems

If one variable family becomes impractically large:
- preserve the same table grammar;
- split the family into logical subsections;
- keep the same column model in each subsection;
- do not reduce everything into a dense spreadsheet.

## 6.5 Column model

The reference relationship is:

```text
Name        preferred fixed / expandable
Mode(s)     content-driven / expandable
Usage       flexible / Fill
```

In Figma terms:

```text
Variable table
├─ Name column              Fixed preferred width, may grow
├─ Mode column              Hug/Fixed preferred width, may grow
├─ Mode column              Hug/Fixed preferred width, may grow
├─ Additional mode(s)       added as required
└─ Usage column             Fill container
```

The Usage column must always remain visible.

## 6.6 Cell rhythm

Reference baseline:
- header cell: approximately 34 px;
- subgroup separator: approximately 12 px;
- standard data row: approximately 80 px.

Behavior:
- use these as minimum/reference rhythm values;
- row height becomes Hug when content requires more space;
- all cells in the same logical row must resolve to the same final height;
- row dividers remain aligned across all columns.

## 6.7 Name-column cells

Semantic token names are presented as compact token badges, not plain text.

Badge behavior:
- width: Hug contents;
- height: Hug contents;
- compact horizontal/vertical padding;
- subtle border;
- small radius;
- token label remains readable.

### Hierarchical token relationships

Related modifiers/states must render as an explicit **tree**, not indentation alone.

Example:

```text
text-primary
└── _on-brand

text-secondary
├── _hover
└── _on-brand
```

#### Required Figma construction

```text
Hierarchy group
layout: vertical
width: Fill

├─ Parent row
│  └─ Parent token badge
│
└─ Children stack
   layout: vertical
   position: relative to parent
   ├─ Child row
   │  ├─ Connector / vertical
   │  ├─ Connector / elbow
   │  └─ Child token badge
   └─ Child row
      ├─ Connector / vertical
      ├─ Connector / elbow
      └─ Child token badge
```

Connector behavior:
- draw a visible vertical branch from the parent relationship point through the child stack;
- draw a horizontal elbow from that branch to every child badge;
- stop the vertical branch at the final child;
- align each elbow to the vertical center of its child badge;
- use a subtle semantic documentation-border token;
- use the same stroke weight family as documentation dividers;
- connector geometry must be generated from Auto Layout/child positions, not hard-coded absolute coordinates;
- connector lines are decorative documentation layers and must not alter token naming or variable structure.

Indentation behavior:
- parent token starts at the normal Name-column origin;
- first-level children are indented by one documentation hierarchy step;
- deeper hierarchy adds one step per depth;
- indentation alone is insufficient: **connector lines are mandatory whenever child tokens exist**.

Child badge labels:
- may show the full token name;
- or may show only the modifier suffix such as `_hover`, `_on-brand`, `_alt`, `_subtle`, or `_solid` when the parent relationship is visually unambiguous.

Do not render hierarchical tokens as flat sibling badges.
Do not fake hierarchy using spaces, text characters, or indentation-only layout.

## 6.8 Mode alias cells

Color aliases are rendered as **visual alias chips**, not plain text.

Each chip contains:

```text
Alias chip
├─ Color swatch
└─ Primitive / alias token name
```

Behavior:
- chip width: Hug contents;
- chip height: Hug contents;
- alias column expands when the chip becomes wider;
- swatch clearly shows the resolved value;
- surface/border treatment preserves contrast in every mode.

For non-color values, use an equivalent value chip appropriate to the token type.

## 6.9 Usage-column cells

Usage is a first-class documentation column.

Every semantic token has bespoke usage copy that states a concrete UI purpose.

Good:
- `Primary text such as page headings.`
- `Secondary text such as labels and section headings.`
- `Primary text when used on solid brand-color backgrounds.`
- `Default border used around form controls and cards.`

Forbidden:
- generic filler;
- copy generated only from the token name;
- descriptions that repeat the token name without explaining usage.

Usage text:
- wraps;
- never clips;
- increases row height when necessary.

## 6.10 Design-note relationship

The Design note uses a constrained prose width so it remains readable.

Its width is controlled by a documentation reading-width token such as:

```text
doc.width.reading
```

The table beneath it always uses the full available documentation content width.

This relationship is more important than any particular pixel value.

## 6.11 Hard validation

A semantic-variable group fails QA if:

- the Design note constrains the table width;
- the table clips content;
- any mode or Usage column is outside the visible table;
- additional modes are omitted because the original frame width was treated as fixed;
- token badges truncate unnecessarily;
- alias chips are plain text with no resolved-value preview where a preview is useful;
- hierarchy is flattened;
- hierarchical children are merely indented without visible connector lines;
- connector elbows do not align to child badges;
- the vertical branch does not terminate at the final child;
- Usage copy is missing or generic;
- row content overlaps because a reference row height was treated as fixed.

# 7. Long-form documentation pattern

Long-form documentation uses a dedicated 1600 px frame.

```text
1600 frame
├─ Header
├─ Section
│  padding 80
│  └─ Rich text                       720 wide
│     ├─ Content item
│     ├─ Content item
│     ├─ Image and links
│     │  ├─ Documentation image       720 wide
│     │  └─ Resource links
│     └─ ...
└─ Footer
```

Use long-form pages for explanatory guidance, not for token matrices.

Typical content hierarchy:
- 30 px section headings;
- 24 px subheadings;
- 18 / 28 body copy;
- full-width 720 px documentation images;
- links directly below relevant images/content.

# 8. Footer

Finished documentation frames end with a reusable footer.

Observed standard footer height: `386`.

Outer footer:
- padding 32;
- vertical layout.

Inner content:
- padding 48;
- large vertical separation between footer blocks;
- optional system description and project identity.

The generated footer must be brand-agnostic and must not copy source identity, URLs, copyright text, or logos.

# 9. Base Component canvas grammar

Most Base Component pages are **not** enclosed inside one documentation frame. They are horizontal canvas regions.

Default rhythm:

```text
x = 0
  private/unpublished base zone
  width ≈ 2400

x = 2800
  first public component zone
  width ≈ 2400 or wider when matrices require it

x = 5600 / 6970 / 8400 / ...
  additional related public component families

far right
  optional 1600 px long-form notes frame
```

This means:
- do not put every component inside a small card;
- do not create a single vertical dashboard;
- do not create separate `Source`, `Matrix`, or `QA` boards;
- expose the actual component sets and their complete variant matrices on the page.

## Private base zone

When a page has private construction components, show them in the left zone with a dedicated header explaining that they are internal building blocks used to maintain the published families.

## Public zone

Each public family receives:
- a large documentation header;
- the full component set matrix beneath it;
- any related cursor/example instances placed next to the matrix where useful.

# 10. Documentation completeness

Before marking a page complete, confirm:

- every page-family section from its Markdown spec exists;
- every observed component set family exists or is intentionally marked `Skip`;
- every variant axis/property in scope exists;
- private and public families are visually separated;
- supporting descriptions exist in the header or Design note where required;
- semantic variable tables include usage copy;
- no generic token-chip dashboard replaces the documented table/swatches;
- long-form notes are kept on pages where the page spec requires them.
