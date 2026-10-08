# System Contract

This is the canonical global contract. It defines the Figma Page tree, the fixed page templates, the documentation and layout system, the token and naming contract, and audit routing.

The contract fixes **structure**: every build produces the same pages, in the same order, with the same frames in the same order and the same names. Visual quality comes from the documentation system in `workflow/DOCFRAMES.md`. Values come from the brand.

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
- **Initiate** builds `00`–`02`, the selected Foundations, the selected Parts and `9.1 Doc kit`. Components and Sections are built when the user selects them or when `workflow/EXTEND.md` adds them; Layouts and Screens are added only through `workflow/EXTEND.md`.
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
| Sections | Larger blocks with their own layout and behavior | Components, Parts, foundations |
| Layouts | Page-level layouts with placeholder content | Sections and below |
| Screens | Layouts filled with real product content | Layouts and below |

A component never instances a component from its own level or a higher level, except a Part that instances another Part as a fixed part (for example Button instancing Spinner for its loading state); that dependency is listed in the component's Markdown file.

Layout and Screen rules live in their folder files: `layouts/00-layouts.md` and `screens/00-screens.md`. Screens are never published or instanced.

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
- **Guidelines** is a reading-oriented frame (`workflow/DOCFRAMES.md` §7) with visual teaching: do/don't pairs built from real instances, content rules, accessibility, and composition notes.

Components and Sections add one block at the top of **Anatomy**: *Composition* — the Parts they contain, shown as instances with labels.

### Layout page template

```text
{ID} {Name}
├─ .Main                     private parts with their own header (only when the Layout has parts)
├─ {ID} {Name} · Overview     hero at the main breakpoint + 2–3 examples in use + when to use
├─ {ID} {Name} · Layout       the published set at every breakpoint, grid drawn, regions labeled
├─ {ID} {Name} · Anatomy      composition, region map, grid, spacing and sizes, responsive behavior, landmarks, token map
└─ {ID} {Name} · Guidelines   usage, filling regions, responsive behavior, accessibility, do / don't
```

The component page template with `· Layout` in place of `· Component`. What each frame holds is in `layouts/00-layouts.md` §3.

### Screen page template

```text
{ID} {Name}
├─ .Main                                region content as private parts, with their own header
├─ {ID} {Name} · Overview                purpose, hero, flow, states index
├─ {ID} {Name} · {Data} · {Breakpoint}   one bare frame per screen state (default, empty, loading, error)
├─ …
├─ {ID} {Name} · Anatomy                 composition, region content map, content rules, headings, focus order
└─ {ID} {Name} · Guidelines              content, flow, states, edge cases, accessibility, do / don't
```

The state frames are bare frames, so Figma can prototype, present and hand them off. What each frame holds is in `screens/00-screens.md` §3.

### Guidance pages

```text
00 Cover              one cover frame: system name, version, brand mark, modes, typefaces
01 Getting started    01 Getting started · Overview → · How the file works → · Working with variables
02 Tokens             02 Tokens · Collections → · Naming → · Modes → · Primitive palette
```

### Doc kit page

```text
9.1 Doc kit
└─ 9.1 Doc kit · Components    every documentation component (`workflow/DOCFRAMES.md` §16), published to this file only
```

## A4. Canvas behavior

- Each page is an infinite canvas with horizontally arranged frames. Never collapse a page into one small frame because it has one topic.
- Frames grow with their content (Hug height; widths from documentation tokens, `workflow/DOCFRAMES.md` §1). Never clip content to keep a frame at a reference size.
- Private parts live in the leftmost `.Main` frame and are named `.Main/{Component} {part}`. They are not published and never appear in product screens.
- Component sets and variants follow the naming in Part C §4.

## A5. Product type

The product type from `workflow/QUESTIONNAIRE.md` §10 (Web, App, or Web and App) adapts the Figma file to the product. It never changes the page tree, the page templates, the component scope or the naming. iOS and Android share one brand look; they never get separate styles or separate component sets.

| | Web | App | Web and App |
| --- | --- | --- | --- |
| Touch targets (1.3) | `size/touch-min` 44, for touch screens | `size/touch-min` 44 (iOS) and `size/touch-min-android` 48 | both tokens |
| Grids (1.3) | the web breakpoints the platforms need | `grid/mobile`; `grid/tablet` when §1 Platforms includes tablets | both |
| Text size (1.2) | text styles as set | the same text styles; Guidelines show them growing with the system text size | both |
| Examples in use | at the widths where the component lives on the web | in a phone screen area (390 wide) | web examples plus at least one in a phone screen area |
| Component Guidelines | the page's topics | the page's topics, then **In apps** | the page's topics, then **In apps** |

**In apps** is a Guidelines topic on every Part, Component and Section page of an App product, after Accessibility. It says how the component behaves on iOS and Android, with one visual: the component in a phone screen area with its touch area drawn. It covers:

- the touch area;
- how the component grows at large text sizes;
- pressed as the touch feedback, with hover only for a pointer;
- focus with a hardware keyboard;
- what VoiceOver and TalkBack announce;
- any platform pattern, such as a Select opening a sheet on phones.

Rules:
- **Same scope.** An App product adds no app-only components. Sheets, tab bars and pickers are how a component in scope behaves on a phone; they are described in In apps, not built as new sets.
- **Same variants.** A component's sets and properties are the same for web and app. Hover stays in the set, for pointers on tablets and the web.
- **Docs on the web.** Every product type is documented on the web docs site (`workflow/WEB.md`); an App product's pages render the React Native components there (`workflow/APP.md` §7).

---

# Part B — Documentation and Layout System

Moved to `workflow/DOCFRAMES.md`, with the same section numbers: a reference to Part B §6 is `workflow/DOCFRAMES.md` §6. Load it at the steps that draw or change documentation frames (`README.md` §4).


---

# Part C — Token and Naming Contract

Token architecture and naming are fixed by this contract. Every build uses the same collections, the same grammar and the same component vocabulary. Only values change with the brand.

# 1. Token layers

```text
Primitives  →  Semantic (Color, Typography, Space, Size, Shape, Motion)  →  Components
```

- Primitives hold raw values and are hidden from pickers.
- Semantic tokens alias primitives and carry the UI purpose. Components bind semantic tokens.
- Component tokens are created only where a component needs a value no semantic role expresses (for example a button's padding per size, or a state color that differs from the shared role). They alias semantic tokens.

# 2. Collections

Plain domain names, in this order, created only when needed:

```text
Primitives      raw values, hidden
Color           semantic color roles; one mode per color mode (Light, Dark, …)
Typography      families, weights, sizes, line heights
Space           spacing scale
Size            control, icon, avatar, indicator, touch and layout sizes
Shape           radius roles and border widths
Motion          durations, easings, delays (only when motion is in scope)
Components      component tokens (only when needed)
Documentation   documentation measures and roles (doc kit only)
```

Never prefix collections with tier names, product names or feature names. A product concept (for example a signal-strength color set) is a group inside its domain collection, not a new collection.

# 3. Token naming grammar

Figma variable names use `/` between segments. Code syntax uses the same segments joined with `-`, wrapped in `var(--…)` for web.

```text
{domain}/{group}/{role}[/{emphasis}][/{state}]
```

Each segment narrows the one before it. Segments that are states or variants of a role are **children** of that role, and variable tables show them as children with tree connectors (`workflow/DOCFRAMES.md` §6.4):

```text
color/text/brand               parent row
├── color/text/brand/hover     child row
└── color/text/brand/pressed   child row
```

## 3.1 Color roles

| Group | Roles | Children |
| --- | --- | --- |
| `color/text` | `primary`, `secondary`, `tertiary`, `disabled`, `placeholder`, `inverse`, `on-solid`, `brand`, `accent`, `danger`, `warning`, `success`, `info` | `hover`, `pressed` on interactive roles; `on-brand` where the role sits on a solid brand surface; `strong`, `stronger`, `soft`, `softer` where a role has darker or lighter emphasis steps |
| `color/icon` | same roles as text | same as text |
| `color/border` | `subtle`, `default`, `strong`, `brand`, `accent`, `danger`, `warning`, `success`, `info`, `focus`, `disabled`, `inverse` | `subtle` on tone roles; `soft` where a role has a lighter step |
| `color/surface` | `base`, `sunken`, `raised`, `overlay`, `inverse`, `brand-subtle`, `brand-solid` | `hover`, `pressed` |
| `color/fill` | `neutral`, `brand`, `accent`, `danger`, `warning`, `success`, `info`, each with `subtle` and `solid` | `hover`, `pressed`, `selected`, `disabled` under each emphasis; `strong` where an emphasis has a darker step |
| `color/fill` (special) | `none` (transparent, keeps layers bound), `neutral/track` | — |
| `color/category` | categorical families for badges, tags and charts only (`slate`, `sky`, …) | `subtle`, `solid`, `text`, `border` |
| `color/overlay` | `scrim` | — |
| `color/shadow` | `ambient`, `key` | — |
| `color/gradient` | `brand` | — |

`accent` is the brand's second color, for systems that have one. A role whose rest value has no state children is a single row. The rest value of `color/fill/{tone}/{emphasis}` is the parent row itself.

## 3.2 Other domains

| Domain | Pattern | Examples |
| --- | --- | --- |
| Primitives | `palette/{family}/{step}`, `scale/{dimension}/{value}` | `palette/brand/600`, `palette/neutral/900`, `scale/space/16`, `scale/radius/8` |
| Typography | `font/family/{role}`, `font/weight/{name}`, `font/size/{role}-{size}`, `font/line-height/{role}-{size}` | `font/family/ui`, `font/size/body-md` |
| Text styles | `type/{role}/{size}/{weight}`; roles `display`, `heading`, `body`, `label` (buttons and controls), `link`, `overline` (uppercase labels), `code` | `type/body/md/regular`, `type/heading/lg/semibold`, `type/label/sm/bold` |
| Space | `space/{step}`, `space/optical`; a brand value between two steps takes the lower step with `-plus` | `space/xs`, `space/md`, `space/3xl`, `space/lg-plus` |
| Size | `size/{group}/{step}`, `size/touch-min` | `size/control/md`, `size/icon/sm`, `size/avatar/lg` |
| Shape | `radius/{role}`, `border/width/{role}` | `radius/control`, `radius/surface`, `radius/full`, `border/width/default` |
| Elevation (effect styles) | `elevation/{level}`, `elevation/{level}-up` (shadow cast upward, for bottom bars and sheets), `focus/{tone}` | `elevation/raised`, `elevation/overlay-up`, `focus/default` |
| Grid styles | `grid/{breakpoint}` | `grid/desktop` |
| Motion | `motion/duration/{role}`, `motion/easing/{role}`, `motion/delay/{role}` | `motion/duration/base`, `motion/easing/enter` |
| Components | `{component}[/{part}][/{emphasis}][/{tone}]/{property}[/{state}]` | `button/padding-x/md`, `button/primary/brand/fill/hover` |
| Documentation | `doc/{group}/{role}`; aliases the brand tokens, except the measures (`workflow/DOCFRAMES.md` §1) | `doc/surface/base`, `doc/space/block`, `doc/measure/reading` |

Rules:
- One name per concept; never two names for the same role.
- Token names never contain product, brand or feature names.
- Every semantic token has a description that states its concrete UI purpose (`workflow/DOCFRAMES.md` §6.6); the same text is the Usage column.

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
| Data state of a screen | `Data` | variant | subset of `default, empty, loading, error` (Screens only; interaction states stay in `State`) |
| Third-party service | `Provider` | variant | the sign-in or integration providers chosen at initiation |
| Attached position | `Placement` | variant | subset of `none, top, bottom, left, right, top-start, top-end, bottom-start, bottom-end` |
| Direction | `Orientation` | variant | `horizontal, vertical` |
| Discrete value | `Value` (one value), `{Part} value` (several, e.g. `Start value`, `End value`) | variant | steps named by the component |
| Icon-only shape | `Icon only` | variant | `false, true` |
| Visible text | `Label`, `Text`, `Supporting text`, `Hint`, `Placeholder`, `Count` | text | — |
| Optional part | `Show {part}` | boolean | — |
| Swappable icon | `Icon`, `{Part} icon` | instance swap | icons |
| Swappable asset | `{Asset kind}` (`Logo`, `Flag`, `Image`) | instance swap | brand assets |
| Swappable region | `{Region} content` | slot, or instance swap where slots aren't available | Layout regions a screen fills |

Rules:
- Never use synonyms (`Hierarchy`, `Type`, `Kind`, `Variant` or `Appearance` for emphasis; `Destructive` instead of `Tone=danger`; `Position` for placement).
- A semantic variation (danger, warning) is a `Tone` value inside one set, not a separate set.
- When a component needs a concept this table doesn't cover, add it here first, then use it.

# 5. Output formats

Support: Figma Variables, CSS custom properties, Tailwind theme, JSON, DTCG JSON, JavaScript / TypeScript, Android, iOS. Each format is an export of the same grammar; naming and output syntax are separate concerns.

The web formats (CSS custom properties, Tailwind v4 theme, DTCG JSON, TypeScript data) are generated together by the web template from an export of the Figma file; the mapping from names to CSS variables and Tailwind utilities is in `workflow/WEB.md` §5. For App products, the React Native tokens behind the docs' App previews are generated by `app/scripts/build-rn-tokens.mjs` from the same export; the token names the React Native, Swift and Kotlin code uses are in `workflow/APP.md` §5.

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
5.x Layouts         → layouts/5.x-*.md
6.x Screens         → screens/6.x-*.md
```

Audit rule:

```text
Audit broadly
→ select only builder-relevant material
→ preserve selected material in full
→ preserve its visual teaching mechanism
→ integrate it into the corresponding page-specific file, in our structure and naming
```
