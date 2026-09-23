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

Semantic variable pages use a **full-width documentation table**. This is a hard structural rule.

## 6.1 Critical width rule

For a 2528 px variable page:

```text
Page                                  2528
└─ Section                            2528
   padding-left/right                   80
   └─ Content group                   2368
      ├─ Design note                   720
      ├─ vertical gap                   64
      └─ Variable table               2368
```

**720 px applies only to the Design note. It never applies to the table or the Content group.**

Never create this incorrect structure:

```text
Content group 720
├─ Design note 720
└─ Table 720   ← WRONG
```

Never place 2368 px worth of columns inside a 720 px clipped table.

Required:
- Content group width: `2368`;
- Content group layout: vertical Auto Layout;
- Content group clip content: `false`;
- Design note width: `720`;
- gap from Design note to table: `64`;
- Variable table width: `2368`;
- Variable table clip content: `false`.

## 6.2 Table construction

The table is built as **four vertical columns inside one horizontal table frame**, not as a vertical stack of horizontal rows.

```text
Variable table                         2368
layout: horizontal
gap: 0
clip content: false

├─ Column / Name                        400
├─ Column / Light mode                  212
├─ Column / Dark mode                   213
└─ Column / Usage                      1543
```

Column widths must add up to the full table width.

Each column is a vertical Auto Layout stack containing cells in the same row order. This guarantees that the Usage column remains visible and aligned.

Do **not** build each data row as a 720 px horizontal frame.

## 6.3 Cell rhythm

Each column follows the same vertical sequence:

```text
Header cell                            34
Header separator                       12
Data cell                              80
Data cell                              80
...
Optional semantic-group separator      12
Data cell                              80
...
```

Rules:
- header cell height: `34`;
- header separator: `12`;
- normal data cell height: `80`;
- semantic subgroup separator: `12`;
- horizontal column gap: `0`;
- row boundary: subtle 1 px divider;
- cells must not clip their content.

Header cells are minimal and white/transparent rather than a large filled table-header bar.

## 6.4 Name-column cells

Semantic token names are presented as compact token badges, not plain text.

Badge treatment:
- Hug width;
- minimum height around 32;
- radius: 6;
- horizontal padding: 12;
- vertical padding: 4;
- subtle 1 px border;
- text: 16 / 24.

### Hierarchical token relationships

Related modifiers/states must read as a hierarchy.

Example:

```text
text-primary
└─ _on-brand

text-secondary
├─ _hover
└─ _on-brand
```

Presentation:
- parent token starts at the column origin;
- child token is indented;
- a subtle connector line visually links child to parent;
- child badge may display only the modifier portion such as `_hover` or `_on-brand` when the hierarchy remains unambiguous.

Do not flatten every relationship into strings such as `text/secondary/on-brand` if the selected naming system supports a parent-child visual presentation.

Actual token names still follow the naming convention selected in the initiator. The visual hierarchy is separate from output syntax.

## 6.5 Light/Dark alias cells

Primitive aliases are rendered as **visual alias chips**, not plain text.

Each chip contains:

```text
Alias chip
├─ Color swatch
└─ Primitive / alias token name
```

Rules:
- chip width: Hug;
- height: approximately 40 for standard visual aliases;
- rounded border;
- subtle border;
- swatch clearly shows the resolved color;
- token label names the referenced primitive/alias;
- chip surface must preserve contrast in both Light and Dark columns;
- very dark resolved colors may use a dark chip surface when required for legibility.

The documentation must visually communicate both:
1. **which token is referenced**; and
2. **what color/value it resolves to**.

Plain strings such as `color/gray/900` without a swatch are not acceptable for color-variable documentation.

## 6.6 Usage-column cells

Usage is a first-class documentation column.

Usage cell:
- width: `1543`;
- text: 16 / 24;
- vertically centered within the 80 px row where copy fits on one line;
- wraps when required;
- no clipping.

Every semantic token has bespoke usage copy that states a concrete UI purpose.

Good:
- `Primary text such as page headings.`
- `Secondary text such as labels and section headings.`
- `Primary text when used on solid brand-color backgrounds.`
- `Default border used around form controls and cards.`

Forbidden generated filler:
- `Use for text brand primary content where this hierarchy or state applies.`
- `Used for this hierarchy.`
- `Primary color.`

The generator must maintain an explicit usage-description map for every semantic token it creates.

## 6.7 Design-note relationship

The Design note above a variable table is deliberately narrower than the table.

Design note:
- width: `720`;
- typical height: content-driven, commonly around `128`;
- title row contains section name + optional `Variables` badge;
- title-to-description gap: `12`;
- body: 18 / 28;
- description explains the role of the entire token family, not implementation trivia.

The table begins `64` px below the note and expands to the full `2368` content width.

## 6.8 Hard validation

A generated semantic-variable group fails QA if any of the following is true:

- Content group width is 720 instead of 2368;
- table width is less than 2368 on a 2528 variable page;
- table or Content group clips content;
- Usage column is outside the visible bounds;
- columns do not align to 400 / 212 / 213 / 1543;
- data rows are shorter than the documented 80 px rhythm;
- token names are plain text when the table requires token badges;
- visual aliases are plain text without swatches;
- token hierarchy is flattened with no visual grouping;
- Usage copy is missing or templated filler;
- semantic subgroup separators are missing where the token inventory defines groups.

Every semantic token row must have complete Name, mode alias(es), resolved visual preview where applicable, and Usage documentation.

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
