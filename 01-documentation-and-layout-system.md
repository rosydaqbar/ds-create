# Documentation and Layout System

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

# 1. Documentation geometry model

Use logical documentation roles rather than hard-coded dimensions.

Recommended logical roles:

```text
doc.space.frame
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
doc.surface.base
doc.surface.header
```

These names are logical references only. Translate them through the token naming convention selected by the initiator.

## Frame families

Use these Frame/region behaviors:

| Purpose | Sizing behavior |
| --- | --- |
| Reading-oriented documentation | Constrained reading-oriented frame; grows vertically with content |
| Standard Foundation / Base Component region | Wide specimen/documentation frame; grows with matrices and examples |
| Variable documentation | Full-width table frame; expands horizontally for modes/content |
| Palette overview | Extra-wide specimen frame; expands with palette size |
| Gradient overview | Extra-wide specimen frame; expands with gradient count |

Do not normalize every frame to one width.

Do not derive a fixed Frame size from one brand or one amount of content.

# 2. Documentation header

Every finished documentation frame begins with a reusable header block.

## Outer header

- width: Fill owning frame;
- height: Hug contents;
- layout: vertical;
- padding: `doc.space.frame`;
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
├─ Identity and Figma Page title
│  ├─ System / brand mark
│  └─ Breadcrumb
│     ├─ Parent section
│     ├─ Arrow
│     └─ Figma Page title
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

# 7. Reading-oriented documentation pattern

Reading-oriented documentation uses a constrained reading composition:

```text
Reading-oriented frame
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

# 9. Base Component canvas grammar

Base Component Figma Pages use horizontally arranged canvas regions, not one vertical dashboard.

Default relationship:

```text
Private/internal base region
→ Public component family
→ Related public component family
→ Additional family/families
→ Mandatory notes/documentation region
```

Use a semantic canvas-region gap between major regions.

The canvas grows horizontally according to:
- number of component families;
- matrix width;
- variant count;
- documentation content.

Do not place regions using fixed absolute x coordinates.

## Private base region

When a Figma Page has private construction components:
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


# 11. Base Component Figma Page documentation standard

Base Component Figma Pages use a **family canvas** rather than the reading-oriented Foundation-table pattern.

The documentation model has three layers:

```text
Figma-Page-specific explanation and notes
        ↓
Full component-set matrices
        ↓
Required examples/guidance defined by that Figma Page's Markdown specification
```

## 11.1 Region/family header

Every family region begins with a large documentation header.

Required content:

```text
Base components → <Figma Page>
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

## 11.2 Private construction header

When a Figma Page contains private helpers, the private region receives its own header.

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

## 11.5 Figma-Page-specific notes, guidance, and examples

Do not force every Base Component Figma Page into one universal documentation Frame.

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
- preserve every Figma-Page-specific topic and example;
- do not summarize a detailed requirement into a generic paragraph;
- show diagrams/specimens/instances where the specification calls for them;
- write from the actual generated anatomy, properties, variables, and brand values;
- documentation must exist visibly on the Figma canvas, not only in source Markdown or component descriptions;
- if the user changes one region on a Figma Page, revalidate the entire corresponding Markdown specification and its dependencies.

Avatars and Buttons keep their additional Figma-Page-specific documentation topics below; other Figma Pages keep the documentation topics defined in their corresponding Markdown files.

## 11.6 Buttons reading-oriented documentation

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

## 11.7 Avatar reading-oriented documentation

Required topics:
1. image-source strategy;
2. centrally managed/shared avatar assets;
3. replacing avatar images;
4. changing placeholder images;
5. changing placeholder/background fills centrally.

The generated text must describe the actual generated system mechanism.

## 11.8 Examples in use

When the Figma Page contains an explicit examples region, preserve it.

Observed example region:
- Text editors.

Examples are composed instances showing how the base components work together. They are not new public component masters.

# 12. Anatomy documentation inside Markdown specs

Every Base Component Markdown file must include:

```text
Purpose
Figma Page regions
Published/private families
Property inventory
Representative anatomy tree
Auto Layout relationship
Flexible vs fixed children
Matrix requirements
Component-specific notes
QA
```

For complex Figma Pages, document each component family separately.

A file that only lists component-set names and variant axes is incomplete.

# 13. Component Figma Page QA

A component Figma Page fails generation QA if:
- its Markdown file contains no anatomy tree;
- a private helper exists in the source pattern but the generated family duplicates its layers;
- a required region header description is generic;
- the mandatory notes/documentation frame is missing or contains only generic filler;
- the full component matrix is replaced by samples;
- a known optical/layout helper is omitted;
- examples-in-use are missing where specified;
- brand styling was copied as structure rather than mapped to the active brand tokens.

# Visual teaching is part of documentation

Long-form Notes & Documentation are not prose-only Frames.

When a selected relevant topic is taught through a visual example in the audited reference, the generated system must preserve the **teaching mechanism** using the generated system's own components, tokens, variables, and brand values.

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
├─ Section
│  └─ Rich text column
│     ├─ Heading / body content
│     ├─ Visual example
│     ├─ Heading / body content
│     ├─ Visual example
│     └─ ...
└─ Footer
```

At the audited scale:
- frame width is approximately 1600;
- section gutters are approximately 80;
- reading column is approximately 720;
- visual examples generally occupy the full reading-column width.

These are baseline composition measurements, not universal fixed limits.

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

Generated documentation must not paste screenshots from the audited source file.

Instead:
- recreate the same explanatory concept;
- use the generated system's own Figma layers;
- use the generated system's own variable/token names;
- use the active brand styling;
- use neutral/project-specific example copy.

This keeps the builder agnostic while preserving the depth and teaching quality.

## Relevance filtering rule

The audit process is:

```text
Review every Notes & Documentation topic
              ↓
Determine whether it helps build/maintain the current agnostic system
              ↓
If relevant:
    preserve the full explanation depth
    +
    preserve every relevant visual teaching mechanism
If not relevant:
    do not generate it
```

Do not:
- select only headings and discard the visual examples;
- copy every source note indiscriminately;
- shorten a selected topic into a one-line rule;
- create a separate parallel notes directory.

Relevant Notes & Documentation live inside the corresponding Markdown specification and are rendered into the appropriate Frame/region on that Figma Page.

## Visual documentation QA

A long-form documentation Frame fails QA when:
- the source topic was selected as relevant but its visual teaching example is missing;
- prose replaces a required diagram/comparison;
- visuals use fake/unrelated token names;
- screenshots from another system are pasted instead of recreated;
- generated visuals use anatomy inconsistent with the published generated components;
- visual examples are grouped far away from the explanatory text they support.
