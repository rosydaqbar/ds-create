# Layouts

Layouts arrange a whole screen into regions: where the header, navigation, main content, side panel and footer go, how they sit on the grid, and how they move at each breakpoint. They hold **placeholder content** in the regions that change from screen to screen, and real instances of Sections and Components in the regions that stay the same (a navigation sidebar, a top bar). Designers start a screen from a Layout instead of drawing regions by hand, so every screen shares the same grid, margins, landmarks and responsive behavior.

Each Layout page is a **complete component canvas**: the published Layout at every breakpoint, its anatomy and its guidelines, built with the same structure as the other levels.

Layouts are never built during Initiate. They are added only through `EXTEND.md`, when the user asks for a page layout ("a settings page", "a list with a detail panel") or when a screen needs an arrangement no Layout covers.

# 1. Layout pages

```text
── 5 · Layouts ──
(no pages in the base tree; each Layout is added through EXTEND.md)
```

| Page | File |
| --- | --- |
| `5.1 {Name}`, `5.2 {Name}`, … | `layouts/5.x-{kebab-name}.md`, written by `EXTEND.md` step 8 |

- New Layouts take the next free ID (`5.1`, `5.2`, …). IDs are never reused or renumbered.
- The `── 5 · Layouts ──` separator exists only once the first Layout page exists (`SYSTEM.md` Part A §1).
- A Layout is named after its **arrangement**, not after a product view: "Sidebar and main", "List and detail", "Centered form", "Dashboard grid". The product view ("Account settings") is a Screen that uses it.

## Layout, Section or Screen

| Question | Level |
| --- | --- |
| Does it decide where the regions of the whole viewport go, with placeholder content in the regions that change? | Layout (`5.x`) |
| Does it live inside one region, with its own layout and behavior, and could it sit in different Layouts (a data table, a navigation sidebar, an editor)? | Section (`4.x`) |
| Is it a Layout filled with the real content of one product view? | Screen (`6.x`) |

This is the same test as `EXTEND.md` §3. When two levels fit, ask the user once.

# 2. What a Layout may contain

- Sections (`4.x`), Components (`3.x`) and Parts (`2.x`) as **instances**, for regions that look the same on every screen built from the Layout (navigation, top bar, footer links).
- Foundations: tokens, text styles, effect styles, grid styles (`grid/*`), icons and brand assets.
- Its own private parts (`.Main/{Layout} {part}`): the region placeholder, and region shells that exist only in this Layout and have no behavior of their own.

A Layout never instances another Layout or a Screen. A region that needs a missing Section or Component gets it through `EXTEND.md` first (step 4, bottom-up); it is never drawn inside the Layout.

Raw values are never used. Every padding, gap, width and max width binds a `space/*` or `size/*` token, every color a `color/*` role, every shadow an `elevation/*` style and every text a `type/*` style. The only plain numbers on the page are the documentation widths and heights the Layouts are drawn at (§4.1).

# 3. Page template

Every Layout page is built with `templates/structure.md`. It follows the component page template (`SYSTEM.md` Part A §3), with `· Layout` in place of `· Component`: the published set is shown as page widths on the grid rather than as a property matrix, and the frame name tells designers that. Left to right:

```text
{ID} {Name}
├─ .Main                     private parts with their own header (only when the Layout has parts)
├─ {ID} {Name} · Overview     hero at the main breakpoint + 2–3 examples in use + when to use
├─ {ID} {Name} · Layout       the published set at every breakpoint, grid drawn, regions labeled
├─ {ID} {Name} · Anatomy      Composition block, region map, grid and columns, spacing and sizes, responsive behavior, properties, landmarks and focus order, token map
└─ {ID} {Name} · Guidelines   usage, filling regions, responsive behavior, accessibility, do / don't, maintenance
```

All five are **documented frames** (header, blocks, footer). The breadcrumb is `Layouts › {ID} {Name}`.

**.Main**
- private header (`parts/00-parts.md` §5);
- `.Main/{Layout} placeholder` and any region shell, each with its name, a one-line purpose and its small matrix.

**· Overview**
- `Doc/Header` with a description specific to this arrangement;
- hero: one instance at the main breakpoint, with placeholder content and the real chrome Sections in place;
- 2–3 examples in use: the same Layout filled for different kinds of screens (a list page and a form page in "Sidebar and main"), with Sections and Components in the content regions and neutral copy, each with a one-line caption;
- "When to use / When not to use", naming the neighboring Layouts.

**· Layout**
- one `Doc/Family header` per published set (eyebrow `Layouts › {ID} {Name}`);
- one variant per `Breakpoint` in scope, side by side from widest to narrowest, each with a `Doc/Axis label` above it (breakpoint, drawing width, columns, gutter, margin);
- the grid drawn over each variant with `.Main/Space grid column` instances from `1.3 Space & layout`, because grid styles don't show in exports or screenshots; the overlay sits on top of the instance in the doc frame, never inside the component;
- every region labeled with its layer name and landmark;
- **Range check** row: each variant again at the narrowest width of its range (§4.1), showing nothing overflows or overlaps;
- **Content options** row: the `Show {region}` booleans off one at a time, and `Open=true` where a region opens as a drawer.

**· Anatomy** (blocks in this order)
1. Composition: real instances of every Section, Component, Part and private part the Layout uses, each with a `Doc/Spec label` naming its page ID and the properties the Layout sets (`components/00-components.md` §3).
2. Region map: the main-breakpoint variant with `Doc/Callout` markers per region and a legend using the exact layer names.
3. Grid and columns: per breakpoint, which columns each region spans.
4. Spacing and sizes: `Doc/Spec label` measurements for margins, gutters, region padding, gaps, fixed region widths and max widths, each labeled with its token.
5. Responsive behavior: the region × breakpoint table (§4.2), then a visual of each change.
6. Property table: property → type → values → default → what it changes.
7. Landmarks, headings and focus order: landmark labels on every region, the H1 slot, numbered focus order, the skip link at `State=focus` (§4.5).
8. Token map: region × property → `Doc/Token badge` with `Doc/Alias chip`.

**· Guidelines**: a reading-oriented frame (`DOCFRAMES.md` §7) with the topics in the Layout's file, each with its visual built from real instances and `Doc/Do-dont` under each pair.

Every frame ends with `Doc/Footer`.

# 4. Rules for every Layout

## 4.1 Breakpoints come from 1.3

A Layout has one variant per breakpoint in scope on `1.3 Space & layout`, and each variant has its `grid/{breakpoint}` style applied. A desktop-only product has only `Breakpoint=desktop`; a responsive web product has all three.

| Breakpoint | Grid style | Drawn at | Narrowest check | Viewport height |
| --- | --- | --- | --- | --- |
| `mobile` | `grid/mobile` | 390 | 320 | 844 |
| `tablet` | `grid/tablet` | 768 (`size/width/xl`) | 768 | 1024 |
| `desktop` | `grid/desktop` | 1280 (`size/width/3xl`) | 1024 (`size/width/2xl`) | 800 |
| wide | `grid/wide` | the `desktop` variant at 1440 (`size/width/4xl`) | — | 900 |

- Columns, gutters, margins and minimum widths are the ones on 1.3. Drawing widths and viewport heights are defaults; the Layout's file may change them for the product's real devices.
- At wide, the `desktop` variant keeps its arrangement and its content centers at `size/container/max`. A Layout whose arrangement changes at wide (a third column appears) needs a `wide` value; add it to `Breakpoint` in `SYSTEM.md` Part C §4.2 first.
- Each variant is at least one viewport tall. Fixed regions (navigation, side panel) fill that height; `Main` hugs its content and the page scrolls.
- The Layout's file names its **main breakpoint**: the one most people use, from the platforms in `QUESTIONNAIRE.md` §1. Overview and Screens start there.

## 4.2 Regions

Regions use these layer names, so landmarks, anatomy and code line up across every Layout:

| Layer | Landmark | Job |
| --- | --- | --- |
| `Skip link` | — | first focusable element; Link (2.3), hidden until focused (`Show skip link`) |
| `Header` | banner | product mark, global actions, search |
| `Navigation` | navigation | moving between areas of the product |
| `Body` | — | holds `Main` and `Aside` side by side or stacked |
| `Main` | main | the page's own content |
| `Page header` | — | inside `Main`: the H1, supporting text and page actions |
| `{Region} content` | — | the placeholder or slot a screen fills (`Main content`, `Aside content`) |
| `Aside` | complementary | related details, filters, a detail panel |
| `Footer` | contentinfo | secondary links, legal |

A Layout uses only the regions it needs. A region the vocabulary doesn't cover is named in the Layout's file, with its landmark (or none) and why.

- **Every region is Auto Layout.** Direction, gap and padding are set on the region and bound to tokens; nothing is placed by hand or absolutely, except `Skip link` and overlays (a drawer, its scrim).
- **Fill and fixed are explicit.** `Main` fills; `Navigation` and `Aside` take a `size/width/*` token or a column span; `Header` and `Footer` fill the width and hug their height.
- **Spacing from tokens.** Side margins bind `size/container/margin-mobile` or `size/container/margin-desktop`; gutters bind the gap of the breakpoint's grid; content max width binds `size/container/max`; running text binds `size/measure/reading`; gaps between page sections bind `space/*` (`space/7xl` by default).
- **Regions follow the grid.** Region edges land on column edges of the breakpoint's grid. The Anatomy shows which columns each region spans.
- **Behavior per breakpoint is written down.** For each region × breakpoint the Layout's file names one behavior: *stays*, *resizes* (with its token or span), *stacks* (below which region), *collapses* (to what), *moves behind a control* (which button opens it) or *hides*. No cell is left blank.
- **Reading order never changes.** When regions stack, they stack in the order people read and tab through them. A region never moves visually ahead of a region that comes before it in reading order.
- **Drawers overlay.** A region that opens over the page on smaller breakpoints (`Open=true`) sits above content on `color/surface/overlay` with `elevation/modal`, over a `color/overlay/scrim`, and never changes the height of the layout underneath.
- **Sticky regions say so.** A sticky `Header` is named in the file and never covers the focused element when people tab through the page.

## 4.3 Placeholder content

Regions that change from screen to screen hold `.Main/{Layout} placeholder`:

```text
.Main/{Layout} placeholder
layout: Vertical, align Center, Fill × Fill, padding space/xl, gap space/xs
fill color/fill/neutral/subtle, stroke color/border/default (dashed, border/width/default), radius/surface
├─ Region name               type/body/sm/medium, color/text/secondary    "Main content"
└─ Hint                      type/body/sm/regular, color/text/secondary   what goes here: "Sections and Components for this page"
```

- Placeholders are neutral and obviously unfinished: a dashed box with the region's name and what goes in it. They never look like a finished screen.
- Text the Layout itself carries uses neutral labels: "Page title", "Supporting text", "Primary action". Never real product copy, real names or real data; that belongs to Screens.
- Never use lorem ipsum. It hides line length and wrapping, and gets shipped by accident.
- Examples in use in `· Overview` may fill content regions with Sections and Components to show fit, still with neutral copy.

## 4.4 Properties and naming

| Object | Name |
| --- | --- |
| Page | `{ID} {Name}` |
| Component set | `{Name}` |
| Variant | `Breakpoint={value}[, Open={value}]` |
| Private part | `.Main/{Layout} {part}` |
| Layers | the region names in §4.2 and the Layout's anatomy tree |

| Property | Type | Values | Use |
| --- | --- | --- | --- |
| `Breakpoint` | variant | subset of `mobile, tablet, desktop` | one arrangement per breakpoint in scope |
| `Open` | variant | `false, true` | only on breakpoints where a region opens as a drawer |
| `Show {region}` | boolean | — | optional regions: `Show aside`, `Show footer`, `Show page header`, `Show skip link` |
| `{Region} content` | slot or instance swap | placeholder by default | what a Screen puts in the region |

- `Breakpoint`, `Open` and `Show {part}` are in `SYSTEM.md` Part C §4.2.
- `{Region} content` is a swappable region: a native slot where the Figma plan supports slots, otherwise an instance-swap property whose default is `.Main/{Layout} placeholder`. This concept is not in Part C §4.2 yet; add it there before the first Layout is built (`EXTEND.md` step 7).
- Any other concept a Layout needs is added to Part C §4.2 first, then used.

## 4.5 Accessibility at page level

The Layout owns the accessibility of the page frame, so every Screen built on it starts correct.

- **Landmarks.** Each region maps to the landmark in §4.2. There is exactly one `Main`. When a Layout has more than one navigation, each is named ("Primary", "Account").
- **Headings.** `Page header` holds the only H1 of the page. Regions never skip heading levels: an H2 is followed by an H3, never an H4.
- **Focus order** follows reading order at every breakpoint: skip link → header → navigation → main → aside → footer, unless the file says otherwise and why. The Anatomy numbers it.
- **Skip link.** "Skip to main content" is the first focusable element, hidden until focused, and moves focus to `Main`.
- **Reflow.** At 320 px wide, nothing scrolls sideways and nothing is cut off. Content that needs two dimensions (a wide table, a code block) scrolls inside its own region, never the page.
- **Target sizes.** On touch breakpoints every target is at least `size/touch-min`; everywhere else at least 24 × 24.
- **Drawers.** Opening a drawer moves focus into it, Esc closes it, and focus returns to the button that opened it. The page behind is inert while it is open.

## 4.6 Documentation density

Each Layout file specifies, where relevant:
1. purpose, and when to use it versus the neighboring Layouts;
2. the template frames and what goes in each;
3. published sets and private parts;
4. the Composition block;
5. properties (§4.4);
6. region map with landmarks;
7. anatomy tree with Auto Layout relationships;
8. which regions fill and which stay fixed;
9. grid columns per region per breakpoint;
10. spacing and sizes per breakpoint, with tokens and default values;
11. responsive behavior (region × breakpoint);
12. matrix layout;
13. token map;
14. accessibility: landmarks, headings, focus order, skip link, reflow, target sizes;
15. guidelines: usage, filling regions, responsive behavior, do / don't, maintenance;
16. QA.

# 5. Layout file sections

A `layouts/5.x-{kebab-name}.md` file follows `DOCFRAMES.md` §13, adapted to page arrangement. It contains, in this order:

```text
Purpose (and when to use it versus the neighboring Layouts)
Template frames (what goes in .Main, · Overview, · Layout, · Anatomy, · Guidelines)
Published sets and private parts
Composition (Sections, Components and Parts per region, with the properties set)
Property inventory (§4.4)
Main breakpoint and drawing sizes
Region map (region → landmark → job)
Anatomy tree (Auto Layout per region)
Flexible vs fixed regions
Grid columns per region per breakpoint
Spacing and sizes per breakpoint (token and default value)
Responsive behavior (region × breakpoint)
Matrix layout
Token map
Accessibility (landmarks, headings, focus order, skip link, reflow, target sizes)
Guidelines content
QA
```

A file that only lists regions and breakpoints is incomplete.

# 6. Implementation mode

Layouts use the same implementation mode as the other levels (`QUESTIONNAIRE.md` §8 and `INITIATOR.md` Part B §3): **YOLO everything** or **One by one**. If the user already chose a mode in the current request, reuse it. The mode changes pacing only. In One by one, the Sections, Components and Parts a Layout needs are built first when they are missing; unrelated pages are not prebuilt.

Neither mode changes the order. A Layout page starts only when every earlier step of the build sequence (`INITIATOR.md` Part B §6) is done in the ledger, every Section in scope included. It is done only after its own file and the files of the Sections and Components it contains were loaded at its step and the page gate passed.

# 7. Completion criteria

A Layout page fails QA when:
- a template frame is missing, renamed or out of order;
- a breakpoint in scope on 1.3 has no variant, a variant has no `grid/*` style, or the grid columns are not drawn in `· Layout`;
- a region is not Auto Layout, or a padding, gap, width, color or text is bound to a raw value;
- a region edge does not land on the grid, or the Anatomy doesn't show which columns each region spans;
- a region × breakpoint cell of the responsive behavior table is blank;
- the Range check row is missing, or a variant overflows or overlaps at its narrowest width (320 for mobile);
- a Section, Component or Part is redrawn or detached instead of instanced;
- the Layout instances another Layout or a Screen;
- a content region holds real product copy, real data or lorem ipsum, or the placeholder looks like finished UI;
- layer names differ from §4.2 and the anatomy tree, or default names (`Frame 12`) remain;
- a property uses a name outside `SYSTEM.md` Part C §4.2;
- landmarks, the H1 slot, the focus order or the skip link are missing from the Anatomy;
- a target on a touch breakpoint is smaller than `size/touch-min`;
- a drawer changes the layout height instead of overlaying;
- any topic, example or QA rule in the Layout's file is missing from the canvas.

When the system has a web implementation, the Layout is documented on the site like the other levels (`WEB.md`) and its page passes `npm run qa`: no horizontal overflow at 390 px and no axe-core violations, in Light and Dark.
