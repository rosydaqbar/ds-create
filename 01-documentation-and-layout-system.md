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

Semantic variable pages use real documentation tables.

For a 2528 px page:

```text
Section width                        2368
Major Design note                   720
Gap below note                       64
Table                               2368
├─ Name column                       400
├─ Light mode                        ~212
├─ Dark mode                         ~212
└─ Usage                             remaining width (~1544)
```

Observed table anatomy:
- column header row: 34 px;
- optional group spacer/divider: 12 px;
- standard body row: 80 px;
- horizontal columns have no gap;
- row boundaries use a subtle 1 px divider.

Name cell:
- token displayed as a compact bordered badge;
- badge radius: 6;
- badge horizontal padding: 12;
- badge vertical padding: 4;
- text: 16 / 24.

Mode cells:
- include a color/value preview chip when the token is visual;
- include the referenced primitive/alias name.

Usage cell:
- text: 16 / 24;
- must describe **where and why** the token is used;
- do not write empty descriptions such as `Primary color`.

Every semantic token row must have usage copy.

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
