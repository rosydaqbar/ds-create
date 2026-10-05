# System Contract

This is the canonical global contract. It defines the Figma Page tree, the fixed page templates, the documentation and layout system, the token and naming contract, and audit routing.

The contract fixes **structure**: every build produces the same pages, in the same order, with the same frames in the same order and the same names. Visual quality comes from the documentation system in Part B. Values come from the brand.

# Part A — Figma Page Tree and Page Templates

## A1. Page tree

Use this exact Figma Page tree and order. Page names carry an ID so pages, Markdown files and components stay linked.

```text
00 Cover
01 Getting started
02 Tokens
── 1 · Foundations ──
1.1 Color
1.2 Typography
1.3 Space & layout
1.4 Shape
1.5 Elevation
1.6 Motion
1.7 Iconography
1.8 Brand assets
── 2 · Parts ──
2.1 Button
2.2 Icon button
2.3 Link
2.4 Badge
2.5 Tag
2.6 Avatar
2.7 Checkbox
2.8 Radio
2.9 Switch
2.10 Text control
2.11 Label
2.12 Help text
2.13 Tooltip
2.14 Progress
2.15 Spinner
2.16 Divider
2.17 Kbd
2.18 Slider
2.19 Featured icon
── 3 · Components ──
3.1 Button group
3.2 Text field
3.3 Choice field
3.4 Avatar group
3.5 Select
3.6 Menu
3.7 Social button
3.8 Badge group
── 4 · Sections ──
4.1 Rich text editor
4.2 Video player
── 5 · Layouts ──
── 6 · Screens ──
── 9 · Internal ──
9.1 Doc kit
```

Rules:
- Separator pages (`── n · Name ──`) are navigation only and have no canvas content.
- **Initiate** builds `00`–`02`, the selected Foundations, the selected Parts and `9.1 Doc kit`. Components and Sections are built when the user selects them or when `EXTEND.md` adds them; Layouts and Screens are added only through `EXTEND.md`.
- A level separator exists only when at least one page under it exists, except Foundations and Parts, which Initiate always creates.
- A page is created only for an item in scope. Out-of-scope items get no placeholder page (`SKIP`).
- New pages added later take the next free ID in their level (`2.20`, `3.9`, …). IDs are never reused or renumbered.
- Page names never change after creation; a renamed component keeps its ID.

Level rules:

| Level | What it is | May contain |
| --- | --- | --- |
| Foundations | Tokens, styles and assets every component uses | — |
| Parts | The smallest interactive or display units | Foundations only (icons, tokens, styles) and private parts |
| Components | Small groups of Parts that work as one unit | Parts, foundations |
| Sections | Larger blocks with their own layout and behaviour | Components, Parts, foundations |
| Layouts | Page-level layouts with placeholder content | Sections and below |
| Screens | Layouts filled with real product content | Layouts and below |

A component never instances a component from its own level or a higher level, except a Part that instances another Part as a fixed part (for example Button instancing Spinner for its loading state); that dependency is listed in the component's Markdown file.

## A2. Existing libraries

For every page, resolve one action:

```text
KEEP · AUDIT · IMPROVE · REFACTOR · REBUILD · REPLACE · BUILD · SKIP
```

`SKIP` means no placeholder page, frame or component region is created.

## A3. Page templates

Every page is built with the structure in `templates/structure.md` (page → frames → blocks → items). This section lists which frames each page has; the page's own file says what each frame shows.

Every page uses the template of its type. Frames are top-level Frames on the page canvas, placed **left to right** in the order listed, top-aligned at `y = 0`, separated by the documentation canvas gap (`doc/space/canvas`). Frame names are exactly as listed, with `{ID}` and `{Name}` taken from the page name.

### Foundation page template

```text
{ID} {Name}
├─ .Main                            private helpers (only when the page has helpers)
├─ {ID} {Name} · Overview            specimens: palettes, type scale, spacing, effects, icons…
├─ {ID} {Name} · Tokens              variable tables for this page's tokens (only when the page owns variables)
└─ {ID} {Name} · Guidelines          long-form, reading-oriented documentation with visual teaching
```

The page's Markdown file lists which specimen sections go in **Overview**, which variable groups go in **Tokens**, and which topics go in **Guidelines**, in order.

### Component page template (Parts, Components, Sections)

```text
{ID} {Name}
├─ .Main                            private parts with their own header (only when the component has parts)
├─ {ID} {Name} · Overview            hero specimen + examples in use + when to use
├─ {ID} {Name} · Component           the published component set(s), full matrix, axis labels
├─ {ID} {Name} · Anatomy             anatomy diagram, properties, sizes, states, token map
└─ {ID} {Name} · Guidelines          usage, do / don't, content, accessibility, composition
```

- **Overview** shows the component as a designer meets it: one large default instance, then 2–4 realistic compositions built from real instances (a dialog footer, a form row, a toolbar), each with a one-line caption.
- **Component** holds every published set of the page. A page may hold more than one set when the Markdown file says so (for example Button holds `Button`; Icon button holds `Icon button`). Each set has a family header above it.
- **Anatomy** explains construction: numbered anatomy diagram, property table, size row, state row, and a compact token map (part × state → token chip with swatch).
- **Guidelines** is a reading-oriented frame (Part B §7) with visual teaching: do/don't pairs built from real instances, content rules, accessibility, and composition notes.

Components and Sections add one block at the top of **Anatomy**: *Composition* — the Parts they contain, shown as instances with labels.

### Guidance pages

```text
00 Cover              one cover frame: system name, version, brand mark, modes, typefaces
01 Getting started    01 Getting started · Overview → · How the file works → · Working with variables
02 Tokens             02 Tokens · Collections → · Naming → · Modes → · Primitive palette
```

### Doc kit page

```text
9.1 Doc kit
└─ 9.1 Doc kit · Components    every documentation component (Part B §12), published to this file only
```

## A4. Canvas behaviour

- Each page is an infinite canvas with horizontally arranged frames. Never collapse a page into one small frame because it has one topic.
- Frames grow with their content (Hug height; widths from documentation tokens, Part B §1). Never clip content to keep a frame at a reference size.
- Private parts live in the leftmost `.Main` frame and are named `.Main/{Component} {part}`. They are not published and never appear in product screens.
- Component sets and variants follow the naming in Part C §4.

---

# Part B — Documentation and Layout System

# 0. Terminology contract

This file uses Figma object types literally:

- **Figma Page** = top-level `PAGE` node. It has an infinite canvas and therefore no finite page width/height.
- **Frame** = `FRAME` node with finite geometry and optional Auto Layout.
- **Top-level Frame** = Frame directly on a Figma Page.
- **Region / zone** = conceptual grouping on a Figma Page; it may contain direct Component Sets and header Instances and does not require a wrapper Frame.
- **Documentation Frame** = Frame used for a foundation overview, variable table, long-form notes, or another documentation composition.
- **Markdown specification** = repository file that defines requirements. It is not a Figma object.

Geometry terms such as width, height, padding, clipping, Fill, Hug, and Auto Layout apply to Frames/components, not to Figma Pages unless the text explicitly discusses arrangement **on the Page canvas**.

This file defines the visual and structural grammar for generated Frames, component regions, and their arrangement on Figma Page canvases.

The documentation system follows a fixed **composition model**, not fixed canvas measurements.

Measured dimensions from the source analysis are intentionally excluded from generation rules. The generator must preserve hierarchy, spacing relationships, content order, and visual behavior using Auto Layout, semantic documentation tokens, Hug, Fill, minimum constraints, and content-driven expansion.

# 1. Documentation styling follows the brand

The page tree, the template frames and the composition of every frame are fixed (Part A). How they **look** is not: documentation is styled with the brand being built, so a system for one brand and a system for another have the same structure but different fonts, colours, corners and density.

Every documentation value comes from the `Documentation` collection (`doc/{group}/{role}`). Those variables alias the brand's own tokens; they never hold their own colours, fonts or radii. Change the brand and the documentation changes with it, in every mode.

| Documentation role | Aliases the brand token | Used for |
| --- | --- | --- |
| `doc/surface/base` | `color/surface/base` | frame background |
| `doc/surface/header` | `color/surface/sunken` | header block, table header row |
| `doc/surface/specimen` | `color/surface/raised` | swatch cards, specimen tiles |
| `doc/surface/stage` | `color/surface/sunken` | the area real instances sit on (hero, examples, anatomy, do / don't) |
| `doc/status/do`, `doc/status/dont` | `color/icon/success`, `color/icon/danger` | do / don't marks and stage edges |
| `doc/border/subtle` | `color/border/subtle` | card and table outlines, tree connectors |
| `doc/text/primary`, `doc/text/secondary`, `doc/text/tertiary` | `color/text/primary`, `secondary`, `tertiary` | titles, body, captions |
| `doc/text/accent` | `color/text/brand` | breadcrumbs, links, badges |
| `doc/radius/surface` | `radius/surface` | header, cards, swatches |
| `doc/radius/badge` | `radius/indicator` | `Doc/Badge`, `Doc/Token badge` |
| `doc/space/canvas` … `doc/space/inline` | steps of the brand's `space/*` scale (canvas `space/11xl`, frame `space/7xl`, header `space/5xl`, block `space/4xl`, group `space/3xl`, row `space/xl`, inline `space/md`) | gaps and padding |
| Text styles | the brand's `type/heading/*`, `type/body/*` and `type/code/*` styles (token names are set in `type/code/*`) | every documentation text |
| `doc/mark` | the product logo or logomark from 1.8 | header and footer identity mark |

Only the measures are documentation-specific, because they describe the canvas, not the product:

```text
doc/measure/frame        default frame width (1440)
doc/measure/reading      reading column of · Guidelines (720)
doc/measure/row-note     left note column of palette and specimen rows (320)
doc/measure/table        minimum width of a variable table (1280)
doc/measure/specimen     swatch and specimen tile size (160)
doc/table/name           minimum width of the Name column (320)
doc/table/header         height of the table header row (40)
doc/table/separator      space above a subgroup in a table (16)
doc/table/row-min        minimum height of a data row (56)
```

Rules:
- Documentation never introduces a colour, typeface or radius the brand does not have. A dark or rounded brand gets dark or rounded documentation.
- The doc kit (§12) binds only to `doc/*` variables and the brand's text styles, so it restyles itself when the brand changes.
- When the brand is not built yet (the doc kit is built first), create the brand tokens it aliases first, then the `Documentation` collection, then the doc kit.
- Measures stay the same in every build so the structure stays the same.

## Frame families

Each template frame (Part A §3) has one sizing behaviour:

| Template frame | Sizing behavior |
| --- | --- |
| `· Guidelines` | Reading-oriented frame (`doc/measure/frame`); reading column `doc/measure/reading`; grows vertically |
| `· Overview` (foundation) | Specimen frame; at least `doc/measure/frame`, grows horizontally with palettes, scales and grids |
| `· Overview` (component) | `doc/measure/frame`; grows vertically with examples |
| `· Tokens` | Full-width table frame; at least `doc/measure/frame`, grows horizontally for extra modes |
| `· Component` | Grows with the matrix; never narrower than `doc/measure/frame` |
| `· Anatomy` | `doc/measure/frame`; grows vertically |
| `.Main` | Hugs its parts; never narrower than `doc/measure/reading` |

Canvas gap between frames: `doc/space/canvas`.

Do not normalize every frame to one width.

Do not derive a fixed Frame size from one brand or one amount of content.

# 2. Documentation header

Every finished documentation frame begins with a reusable header block.

## Outer header

- width: Fill owning frame;
- height: Hug contents;
- layout: vertical;
- padding: `doc/space/frame`;
- background: documentation base surface;
- contains one rounded inner Content frame.

## Inner header content

Structure:

```text
Header content
layout: vertical
width: Fill
height: Hug
padding: doc/space/header
radius: doc/radius/surface
gap: doc/space/header
```

The inner header uses a subtle neutral/system surface resolved from the active design system.

## Header row

Structure:

```text
Header row
├─ Identity and Figma Page title
│  ├─ System / brand mark
│  └─ Breadcrumb
│     ├─ Level (Foundations, Parts, Components, Sections, Guidance)
│     ├─ Separator
│     └─ {ID} {Name}
└─ System name and version
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

# 3. Main Block frame

A finished documentation frame uses Blocks directly under the header.

Rules:
- width: Fill;
- height: Hug;
- padding: `doc/space/block`;
- vertical gap between major content groups: `doc/space/group`;
- content must never be clipped merely to preserve a reference canvas size.

# 4. Design note pattern

Use Design notes for section introductions and row-level explanations.

## Major note

- width: `doc/measure/reading`;
- height: Hug;
- title: documentation section-heading style;
- optional badge: e.g. `Variables`, `Primitives`;
- title/badge gap: `doc/space/inline`;
- title-to-description gap: documentation text gap;
- body: documentation body style.

## Row note

- width: `doc/measure/row-note`;
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
│  width: doc/measure/row-note
│
├─ gap
│  doc/space/group
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
- a large palette expands the specimen region rather than shrinking swatches to fit an arbitrary Frame width.

## 5.1 Color representation is always visual

Across **all documentation Frames and regions**, any UI element that explains, summarizes, compares, or references a color must include an actual visual color specimen.

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

The exact card composition may adapt to the owning Frame/region, but the visible specimen is mandatory.

# 6. Variable-table pattern

Semantic-variable documentation Frames use a full-width documentation table.

The table must preserve the visual structure while adapting to token length, additional modes, localization, and documentation volume.

## 6.1 Structural rule

```text
Variable group
layout: vertical
width: Fill
height: Hug
clip content: false

├─ Design note
│  width: doc/measure/reading
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

Build the table row by row: each row is a horizontal frame whose cells stretch to the row height, so every cell in a row has the same height and the dividers line up. Columns have one fixed width each, the same in every row:

```text
Variable table
├─ Header row        Name │ Mode │ Mode │ … │ Usage
├─ Row               Name │ Mode │ Mode │ … │ Usage
└─ Row               …
```

Column behavior:

### Name
- preferred/minimum width comes from `doc/table/name`;
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
doc/table/header
doc/table/separator
doc/table/row-min
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
Token tree
├─ Parent row
│  └─ Doc/Token badge             full name, e.g. color/text/brand
└─ Children stack
   ├─ Child row
   │  ├─ Doc/Tree connector       Type=middle (vertical line continues + elbow)
   │  └─ Doc/Token badge          child name only, e.g. hover
   └─ Child row
      ├─ Doc/Tree connector       Type=last (line ends at the elbow)
      └─ Doc/Token badge
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

# 7. Reading-oriented documentation pattern

Reading-oriented documentation uses a constrained reading composition:

```text
Reading-oriented frame
├─ Header
├─ Block
│  └─ Rich text
│     width: doc/measure/reading
│     ├─ Content item
│     ├─ Content item
│     ├─ Image and links
│     │  ├─ Documentation image
│     │  └─ Resource links
│     └─ ...
└─ Footer
```

Use long-form documentation Frames for explanatory guidance, not token matrices.

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

# 9. Component canvas grammar

Component pages (Parts, Components, Sections) use the component page template (Part A §3): `.Main` → `· Overview` → `· Component` → `· Anatomy` → `· Guidelines`, left to right.

## .Main frame

When a component has private parts:
- the `.Main` frame comes first;
- it starts with a private header explaining that these are internal building blocks: edit them to propagate changes to the published component, never use them in product screens;
- each part is shown with its name and a one-line purpose.

## Component frame

Each published set receives:
- a family header (Part B §11.1) directly above it;
- the complete component-set matrix laid out so the property axes read without opening the sidebar (Part B §11.3);
- axis labels above columns and to the left of rows.

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

Before marking a Figma Page complete, confirm:

- every required top-level Frame/region exists;
- every component-set family exists or is intentionally skipped;
- every variant/property axis in scope exists;
- private and public families are visually separated;
- Design notes exist where required;
- semantic variable tables include usage copy;
- hierarchy connectors are visible where child tokens exist;
- aliases include visual previews where appropriate;
- no generic dashboard replaces the required documentation composition;
- no raw reference canvas dimensions are used as layout constraints.


# 11. Component page documentation standard

Component pages use the component page template rather than the Foundation table pattern.

The documentation model has three layers:

```text
· Overview      what it is, examples in use
        ↓
· Component     full component-set matrices
        ↓
· Anatomy       construction, properties, sizes, states, tokens
        ↓
· Guidelines    usage, do / don't, content, accessibility
```

## 11.1 Region/family header

Every family region begins with a large documentation header.

Required content:

```text
{Level} › {ID} {Name}
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
- generic copy repeated across every Figma Page.

## 11.2 Private parts header

When a component has private parts, the `.Main` frame receives its own header.

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

Generated components must follow the nested anatomy defined by the corresponding Markdown specification.

A visual match is not sufficient when the internal hierarchy differs.

Examples of anatomy that must be preserved:
- Button label wrapped in a dedicated optical Text-padding frame;
- Dropdown rows built from private list-item and inset-icon helpers;
- Input label/control/hint stack with a flexible inner Content frame;
- Select open states composed from private menu-item sets;
- Toggle public component instancing a private track/thumb base;
- Video actions bar composed from reusable action-button and volume-slider helpers.

The generator must not flatten these structures to reduce layer count.

## 11.5 Page-specific notes, guidance, and examples

The template frames are fixed; their content comes from the page's Markdown file.

Each Figma Page must render **all documentation content explicitly required by its corresponding Markdown specification**. Depending on the page, that can include:
- the family header;
- private-helper explanation;
- anatomy diagrams;
- matrix labels and property explanations;
- inline Design notes;
- content rules;
- state/interaction notes;
- examples in use;
- accessibility guidance;
- maintenance guidance;
- dedicated reading-oriented documentation sections where that Markdown specification explicitly defines them.

The component matrix and the documentation composition are complementary. A large matrix does not permit omission of notes, and a large note section does not permit omission of the matrix.

Rules:
- preserve every page-specific topic and example;
- do not summarize a detailed requirement into a generic paragraph;
- show diagrams/specimens/instances where the specification calls for them;
- write from the actual generated anatomy, properties, variables, and brand values;
- documentation must exist visibly on the Figma canvas, not only in source Markdown or component descriptions;
- if the user changes one region on a Figma Page, revalidate the entire corresponding Markdown specification and its dependencies.

Each page keeps the documentation topics defined in its Markdown file, placed in the template frame the file names.

# 12. Anatomy documentation inside Markdown specs

Every component Markdown file (Parts, Components, Sections) must include:

```text
Purpose
Template frames (what goes in · Overview, · Component, · Anatomy, · Guidelines)
Published sets and private parts
Property inventory (Part C §4 vocabulary)
Anatomy tree
Auto Layout relationship
Flexible vs fixed children
Sizes and measurements (exact values per size)
Matrix layout (rows and columns)
Token map
Guidelines content
QA
```

For complex Figma Pages, document each component family separately.

A file that only lists component-set names and variant axes is incomplete.

# 13. Component Figma Page QA

Global QA:
- preserve Figma Page vs Frame terminology;
- preserve required region separation;
- preserve full component matrices rather than demo-only subsets;
- keep private helpers private;
- do not flatten documented anatomy;
- render required documentation visibly on canvas.

All component-specific QA belongs to the corresponding file under `parts/`, `components/` or `sections/` and must be executed from there.

# Visual teaching is part of documentation

`· Guidelines` frames are not prose-only Frames.

When a selected relevant topic is taught through a visual example in the source guidance, the generated system must preserve the **teaching mechanism** using the generated system's own components, tokens, variables, and brand values.

This means the builder must recreate relevant:
- before/after comparisons;
- good/bad comparisons;
- annotated anatomy diagrams;
- editor/workflow examples;
- component state comparisons;
- token/alias diagrams;
- measurement overlays;
- line-length comparisons;
- accessibility/contrast examples;
- responsive/grid examples;
- propagation examples.

The builder must not satisfy a visual teaching requirement by replacing it with another paragraph.

## Long-form documentation anatomy

Reference baseline:

```text
Long-form documentation frame
├─ Documentation header
├─ Block
│  └─ Rich text column
│     ├─ Heading / body content
│     ├─ Visual example
│     ├─ Heading / body content
│     ├─ Visual example
│     └─ ...
└─ Footer
```

Measures:
- frame width: `doc/measure/frame`;
- section gutters: `doc/space/block`;
- reading column: `doc/measure/reading`;
- visual examples occupy the full reading-column width.

The generated frame may expand for:
- longer localized copy;
- larger brand typography;
- more complex generated diagrams;
- additional modes/themes;
- larger examples.

## Visual example placement

A visual should appear immediately after the explanation it demonstrates.

Correct:

```text
Heading
Explanation
Visual comparison
Caption/annotation

Next heading
Explanation
Workflow image
```

Incorrect:

```text
All prose
All prose
All prose
Large gallery of unrelated screenshots at the end
```

## Documentation visual types

### Comparison

Use for:
- good vs bad;
- before vs after;
- with-system vs without-system;
- selected approach vs rejected approach.

Keep unrelated variables constant so the lesson is obvious.

### Anatomy diagram

Use for:
- component internal layers;
- token hierarchy;
- icon live area;
- effect stack;
- grid/container relationship.

Anatomy diagrams require:
- labels;
- connector lines;
- meaningful layer names;
- measurement/role annotation where relevant.

### Workflow / propagation example

Use for:
- editing variables;
- replacing assets;
- changing palettes;
- changing typography;
- changing effects.

Show:
1. source edit;
2. dependency;
3. resulting update.

### Measurement overlay

Use for:
- spacing;
- padding;
- icon live areas;
- line length;
- optical sizing.

Measurement overlays should label relationships, not clutter every pixel value.

### Component/state specimen

Use for:
- hierarchy;
- focus;
- destructive states;
- density;
- modes/themes.

Specimens must use the actual generated components.

## Recreate, do not screenshot-copy

Generated documentation must not paste screenshots from any other file or system.

Instead:
- recreate the same explanatory concept;
- use the generated system's own Figma layers;
- use the generated system's own variable/token names;
- use the active brand styling;
- use neutral/project-specific example copy.

This keeps the builder agnostic while preserving the depth and teaching quality.

## Relevance filtering rule

Audit source material broadly, but generate only guidance that directly helps build, maintain, audit, or evolve the selected design-system scope.

For any selected topic:
- preserve its full explanatory depth;
- preserve its relevant visual teaching mechanism;
- recreate visuals with the generated system rather than source screenshots.

The exact selected topics live in the corresponding page-specific Markdown specification. Do not duplicate that inventory here.

## Visual documentation QA

A long-form documentation Frame fails QA when:
- the source topic was selected as relevant but its visual teaching example is missing;
- prose replaces a required diagram/comparison;
- visuals use fake/unrelated token names;
- screenshots from another system are pasted instead of recreated;
- generated visuals use anatomy inconsistent with the published generated components;
- visual examples are grouped far away from the explanatory text they support.

# 12. Doc kit

Every documentation frame is built from one fixed set of components on `9.1 Doc kit`. The structure components (header, footer, block note, badge) are specified in `templates/structure.md` §7. They use the system's own tokens and text styles, so documentation follows the brand and the modes. Build them first, before any foundation page.

| Component | Used for | Anatomy |
| --- | --- | --- |
| `Doc/Header` | top of every template frame | breadcrumb (`{Level} › {ID} {Name}`) → system name and version → H1 → supporting text → optional Resources column (right) |
| `Doc/Footer` | bottom of every template frame | system mark → one-line description → version, modes and typefaces |
| `Doc/Family header` | above each published component set | eyebrow → family title → specific description |
| `Doc/Block note` | section introductions (major note, §4) | title → optional `Doc/Badge` → description |
| `Doc/Row note` | the left column of palette and specimen rows (§4, §5) | heading → optional badge → body |
| `Doc/Badge` | small labels next to titles (`Primitives`, `Variables`, `Default`) | label |
| `Doc/Token badge` | token names in tables | token name in the mono style, bordered |
| `Doc/Tree connector` | child rows in variable tables (§6.4) | vertical line + elbow; variants `Type=middle`, `Type=last` |
| `Doc/Alias chip` | mode cells in variable tables (§6.5) | swatch (or value glyph) → alias name |
| `Doc/Color swatch` | palette rows (§5) | colour specimen with contrast annotation → step → value |
| `Doc/Type row` | type scale | style name → sample in the style → size / line height / weight |
| `Doc/Measure` | spacing and size specimens | token → bar or box bound to the token → value |
| `Doc/Callout` | numbered anatomy markers | number → optional label |
| `Doc/Spec label` | measurement overlays | value |
| `Doc/Do-dont` | under do / don't examples | icon → label → one-line reason |
| `Doc/Axis label` | matrix column and row labels | property → value |

Rules:
- Documentation frames use these components; they are not redrawn per page.
- Tables follow §6 exactly: column construction, token badges, tree connectors, alias chips and usage column.
- Swatches and alias chips are always bound to the variable they show (§5.1).

---

# Part C — Token and Naming Contract

Token architecture and naming are fixed by this contract. Every build uses the same collections, the same grammar and the same component vocabulary. Only values change with the brand.

# 1. Token layers

```text
Primitives  →  Semantic (Color, Typography, Space, Size, Shape, Motion)  →  Components
```

- Primitives hold raw values and are hidden from pickers.
- Semantic tokens alias primitives and carry the UI purpose. Components bind semantic tokens.
- Component tokens are created only where a component needs a value no semantic role expresses (for example a button's padding per size, or a state colour that differs from the shared role). They alias semantic tokens.

# 2. Collections

Plain domain names, in this order, created only when needed:

```text
Primitives      raw values, hidden
Color           semantic colour roles; one mode per colour mode (Light, Dark, …)
Typography      families, weights, sizes, line heights
Space           spacing scale
Size            control, icon, avatar, indicator, touch and layout sizes
Shape           radius roles and border widths
Motion          durations, easings, delays (only when motion is in scope)
Components      component tokens (only when needed)
Documentation   documentation measures and roles (doc kit only)
```

Never prefix collections with tier names, product names or feature names. A product concept (for example a signal-strength colour set) is a group inside its domain collection, not a new collection.

# 3. Token naming grammar

Figma variable names use `/` between segments. Code syntax uses the same segments joined with `-`, wrapped in `var(--…)` for web.

```text
{domain}/{group}/{role}[/{emphasis}][/{state}]
```

Each segment narrows the one before it. Segments that are states or variants of a role are **children** of that role, and variable tables show them as children with tree connectors (Part B §6.4):

```text
color/text/brand               parent row
├── color/text/brand/hover     child row
└── color/text/brand/pressed   child row
```

## 3.1 Colour roles

| Group | Roles | Children |
| --- | --- | --- |
| `color/text` | `primary`, `secondary`, `tertiary`, `disabled`, `placeholder`, `inverse`, `on-solid`, `brand`, `danger`, `warning`, `success`, `info` | `hover`, `pressed` on interactive roles; `on-brand` where the role sits on a solid brand surface |
| `color/icon` | same roles as text | same as text |
| `color/border` | `subtle`, `default`, `strong`, `brand`, `danger`, `warning`, `success`, `info`, `focus`, `disabled` | `subtle` on tone roles |
| `color/surface` | `base`, `sunken`, `raised`, `overlay`, `inverse`, `brand-subtle`, `brand-solid` | `hover`, `pressed` |
| `color/fill` | `neutral`, `brand`, `danger`, `warning`, `success`, `info`, each with `subtle` and `solid` | `hover`, `pressed`, `selected`, `disabled` under each emphasis |
| `color/fill` (special) | `none` (transparent, keeps layers bound), `neutral/track` | — |
| `color/category` | categorical families for badges, tags and charts only (`slate`, `sky`, …) | `subtle`, `solid`, `text`, `border` |
| `color/overlay` | `scrim` | — |
| `color/shadow` | `ambient`, `key` | — |
| `color/gradient` | `brand` | — |

A role whose rest value has no state children is a single row. The rest value of `color/fill/{tone}/{emphasis}` is the parent row itself.

## 3.2 Other domains

| Domain | Pattern | Examples |
| --- | --- | --- |
| Primitives | `palette/{family}/{step}`, `scale/{dimension}/{value}` | `palette/brand/600`, `palette/neutral/900`, `scale/space/16`, `scale/radius/8` |
| Typography | `font/family/{role}`, `font/weight/{name}`, `font/size/{role}-{size}`, `font/line-height/{role}-{size}` | `font/family/ui`, `font/size/body-md` |
| Text styles | `type/{role}/{size}/{weight}` | `type/body/md/regular`, `type/heading/lg/semibold` |
| Space | `space/{step}`, `space/optical` | `space/xs`, `space/md`, `space/3xl` |
| Size | `size/{group}/{step}`, `size/touch-min` | `size/control/md`, `size/icon/sm`, `size/avatar/lg` |
| Shape | `radius/{role}`, `border/width/{role}` | `radius/control`, `radius/surface`, `radius/full`, `border/width/default` |
| Elevation (effect styles) | `elevation/{level}`, `focus/{tone}` | `elevation/raised`, `elevation/overlay`, `focus/default` |
| Grid styles | `grid/{breakpoint}` | `grid/desktop` |
| Motion | `motion/duration/{role}`, `motion/easing/{role}`, `motion/delay/{role}` | `motion/duration/base`, `motion/easing/enter` |
| Components | `{component}[/{part}][/{emphasis}][/{tone}]/{property}[/{state}]` | `button/padding-x/md`, `button/primary/brand/fill/hover` |
| Documentation | `doc/{group}/{role}`; aliases the brand tokens, except the measures (Part B §1) | `doc/surface/base`, `doc/space/block`, `doc/measure/reading` |

Rules:
- One name per concept; never two names for the same role.
- Token names never contain product, brand or feature names.
- Every semantic token has a description that states its concrete UI purpose (Part B §6.6); the same text is the Usage column.

# 4. Component naming

## 4.1 Sets, variants, parts and layers

| Object | Pattern | Example |
| --- | --- | --- |
| Page | `{ID} {Name}` | `2.1 Button` |
| Component set | `{Name}` | `Button` |
| Variant | `{Property}={value}, …` in the property order of the component's Markdown file | `Size=md, Emphasis=primary, Tone=brand, State=rest` |
| Private part | `.Main/{Component} {part}` | `.Main/Toggle track` |
| Layer | exactly the names in the component's anatomy tree | `Label`, `Text padding` |

Default layer names (`Frame 12`, `Rectangle`, `Group`) are never allowed in components.

## 4.2 Property vocabulary

One property name per concept, across every level:

| Concept | Property | Type | Values |
| --- | --- | --- | --- |
| Size | `Size` | variant | subset of `2xs, xs, sm, md, lg, xl, 2xl` |
| Visual weight | `Emphasis` | variant | subset of `primary, secondary, tertiary, ghost` |
| Semantic intent | `Tone` | variant | subset of `neutral, brand, danger, warning, success, info`; display components that label categories (Badge, Tag) may add `color/category` family names (`slate`, `sky`, …) |
| Interaction state | `State` | variant | subset of `rest, hover, pressed, focus, disabled, loading` |
| Selection | `Selected` | variant | `false, true` |
| Checked | `Checked` | variant | subset of `false, true, mixed` |
| Validation | `Status` | variant | subset of `none, invalid, warning, success` |
| Structural form | `Type` | variant | named by the component (e.g. `bar, ring`) |
| Has a value | `Filled` | variant | `false, true` |
| Popup shown | `Open` | variant | `false, true` |
| Media playing | `Playing` | variant | `false, true` |
| Layout per breakpoint | `Breakpoint` | variant | subset of `mobile, tablet, desktop` |
| Third-party service | `Provider` | variant | the sign-in or integration providers chosen at initiation |
| Attached position | `Placement` | variant | subset of `none, top, bottom, left, right, top-start, top-end, bottom-start, bottom-end` |
| Direction | `Orientation` | variant | `horizontal, vertical` |
| Discrete value | `Value` (one value), `{Part} value` (several, e.g. `Start value`, `End value`) | variant | steps named by the component |
| Icon-only shape | `Icon only` | variant | `false, true` |
| Visible text | `Label`, `Text`, `Supporting text`, `Hint`, `Placeholder`, `Count` | text | — |
| Optional part | `Show {part}` | boolean | — |
| Swappable icon | `Icon`, `{Part} icon` | instance swap | icons |
| Swappable asset | `{Asset kind}` (`Logo`, `Flag`, `Image`) | instance swap | brand assets |

Rules:
- Never use synonyms (`Hierarchy`, `Type`, `Kind`, `Variant` or `Appearance` for emphasis; `Destructive` instead of `Tone=danger`; `Position` for placement).
- A semantic variation (danger, warning) is a `Tone` value inside one set, not a separate set.
- When a component needs a concept this table doesn't cover, add it here first, then use it.

# 5. Output formats

Support: Figma Variables, CSS custom properties, Tailwind theme, JSON, DTCG JSON, JavaScript / TypeScript, Android, iOS. Each format is an export of the same grammar; naming and output syntax are separate concerns.

The web formats (CSS custom properties, Tailwind v4 theme, DTCG JSON, TypeScript data) are generated together by the web template from an export of the Figma file; the mapping from names to CSS variables and Tailwind utilities is in `WEB.md` §5.

# 6. Existing systems

When the user brings an existing library and chooses **Keep existing naming**, preserve its collections, variables and component properties. When they choose **Normalize**, migrate to this contract and record every rename. Never rename silently during KEEP, AUDIT or IMPROVE.

---

# Part D — Audit Routing

This is provenance only. **Do not load this part during normal generation.** The selected guidance already lives in the page-specific files.

```text
02 Tokens            → guidance/02-tokens.md
1.1 Color            → foundations/1.1-color.md
1.2 Typography       → foundations/1.2-typography.md
1.3 Space & layout   → foundations/1.3-space-and-layout.md
1.4 Shape            → foundations/1.4-shape.md
1.5 Elevation        → foundations/1.5-elevation.md
1.6 Motion           → foundations/1.6-motion.md
1.7 Iconography      → foundations/1.7-iconography.md
1.8 Brand assets     → foundations/1.8-brand-assets.md
2.x Parts            → parts/2.x-*.md
3.x Components        → components/3.x-*.md
4.x Sections        → sections/4.x-*.md
```

Audit rule:

```text
Audit broadly
→ select only builder-relevant material
→ preserve selected material in full
→ preserve its visual teaching mechanism
→ integrate it into the corresponding page-specific file, in our structure and naming
```
