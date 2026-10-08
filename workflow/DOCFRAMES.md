# Documentation frames

How every Figma documentation frame looks: brand styling, frame families, headers, tables, swatches, matrices, anatomy, the reading pattern and the Doc kit. This was `SYSTEM.md` Part B; its section numbers are unchanged, so `workflow/DOCFRAMES.md` §6.4 is the old Part B §6.4.

**Load it** at the build steps that draw frames the doc builder has no helper for: the Doc kit, Cover, guidance pages, foundation palette rows and variable tables, and Screens (`INITIATOR.md` Part B §6). Load it also to change or review the builder. `tools/figma-docbuilder.js` implements this file for Parts, Components, Sections and Layouts, and each of its rules cites a section here. A change here is made in the builder in the same change. The page tree, the frames each page has and the token contract stay in `SYSTEM.md`.

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

The page tree, the template frames and the composition of every frame are fixed (`SYSTEM.md` Part A). How they **look** is not: documentation is styled with the brand being built, so a system for one brand and a system for another have the same structure but different fonts, colors, corners and density.

Every documentation value comes from the `Documentation` collection (`doc/{group}/{role}`). Those variables alias the brand's own tokens; they never hold their own colors, fonts or radii. Change the brand and the documentation changes with it, in every mode.

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
- Documentation never introduces a color, typeface or radius the brand does not have. A dark or rounded brand gets dark or rounded documentation.
- The doc kit (§16) binds only to `doc/*` variables and the brand's text styles, so it restyles itself when the brand changes.
- When the brand is not built yet (the doc kit is built first), create the brand tokens it aliases first, then the `Documentation` collection, then the doc kit.
- Measures stay the same in every build so the structure stays the same.

## Frame families

Each template frame (`SYSTEM.md` Part A §3) has one sizing behavior:

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

Component pages (Parts, Components, Sections) use the component page template (`SYSTEM.md` Part A §3): `.Main` → `· Overview` → `· Component` → `· Anatomy` → `· Guidelines`, left to right.

## .Main frame

When a component has private parts:
- the `.Main` frame comes first;
- it starts with a private header explaining that these are internal building blocks: edit them to propagate changes to the published component, never use them in product screens;
- each part is shown with its name and a one-line purpose.

## Component frame

Each published set receives:
- a family header (Part B §12.1) directly above it;
- the complete component-set matrix laid out so the property axes read without opening the sidebar (Part B §12.3);
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


# 12. Component page documentation standard

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

## 12.1 Region/family header

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

## 12.2 Private parts header

When a component has private parts, the `.Main` frame receives its own header.

Required message:
- these are internal/unpublished building blocks;
- edit/reuse them to propagate changes to published components;
- they should not be used directly in product composition.

The private header may include neutral resource links for:
- component authoring;
- Figma component/property guidance.

Do not retain source-specific product URLs, names, or promotional copy.

## 12.3 Component matrices are documentation

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

## 12.4 Anatomy fidelity

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

## 12.5 Page-specific notes, guidance, and examples

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

# 13. Anatomy documentation inside Markdown specs

Every component Markdown file (Parts, Components, Sections) must include:

```text
Purpose
Template frames (what goes in · Overview, · Component, · Anatomy, · Guidelines)
Published sets and private parts
Property inventory (`SYSTEM.md` Part C §4 vocabulary)
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

Layout and Screen files use the section lists in `layouts/00-layouts.md` §5 and `screens/00-screens.md` §5.

A file that only lists component-set names and variant axes is incomplete.

# 14. Component Figma Page QA

Global QA:
- preserve Figma Page vs Frame terminology;
- preserve required region separation;
- preserve full component matrices rather than demo-only subsets;
- keep private helpers private;
- do not flatten documented anatomy;
- render required documentation visibly on canvas;
- when documentation is rendered in code, show specimens of private parts that carry a child role (an option, a menu item) inside their parent container (a list box, a menu); a demo never places an option or a menu item on its own;
- check every documentation claim before publishing it: a sentence such as "every state meets contrast" is verified in every mode (1.1 Color QA, *Contrast pairs*), never assumed.

All component-specific QA belongs to the corresponding file under `parts/`, `components/`, `sections/`, `layouts/` or `screens/` and must be executed from there.

Run `tools/figma-audit.js` (a read-only `use_figma` script) on every built page and once on the file. A page with `fail` > 0 fails QA: raw values inside components, unbound fills, text without a text style, effects without an effect style, wrong variant names, loose nodes or overlapping frames on the canvas, missing template frames, and color pairs below AA. Warnings (raw spacing in documentation frames, variant names outside the vocabulary) are reviewed and either fixed or explained in the page report.

`finishPage` in `tools/figma-docbuilder.js` runs the cached audit on every page it arranges.

# 15. Visual teaching is part of documentation

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

## Examples and previews say what they are

A reader must tell at a glance whether a visual is the whole thing or one instance of it.

Rules:
- the caption under a visual that shows one worked case starts with `Example:`, then names the real variables and components in the visual, then says what the case proves (`Example: the checked Checkbox and the on Switch both fill with color/text/brand; edit that one variable and both change.`);
- a visual that shows a sample of a larger set (three variables of a collection, four icons of a library, two pages of a level) labels the sample `Examples` and ends with a `See all on {page} →` link to the page that holds the full set;
- a caption that only describes the full set (a table of every value, a complete matrix) does not start with `Example:`.

## Documentation visual types

### Comparison

Use for:
- good vs bad;
- before vs after;
- with-system vs without-system;
- selected approach vs rejected approach.

Keep unrelated variables constant so the lesson is obvious.

A comparison that recommends one side is always a do / don't pair: each side on its own stage, each with a `Doc/Do-dont` instance below it (icon, label and one-line reason, colored with `doc/status/do` or `doc/status/dont`). Never mark the sides with neutral badges or plain words such as Prefer, Avoid, Good or Bad: a same-colored label reads as a category, not a verdict. A comparison that only shows options without a verdict (three corner treatments, two modes) uses labels, and the chosen option, if any, carries a `Selected` badge.

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
- visual examples are grouped far away from the explanatory text they support;
- a worked example's caption does not start with `Example:`, or a sample of a larger set has no `Examples` label and `See all on {page} →` link;
- a recommendation is marked with neutral badges or words instead of a `Doc/Do-dont` pair.

# 16. Doc kit

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
| `Doc/Color swatch` | palette rows (§5) | color specimen with contrast annotation → step → value |
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
