# Initiator and Generation

This is the canonical initiation and execution contract.

# Part A — Design System Initiator Questionnaire

The questionnaire decides what gets preserved, audited, generated or rebuilt. Structure and naming are fixed by `SYSTEM.md`; the questionnaire decides **scope** and **values**, never page names, frame names or token grammar.

# 1. Product

## Product status

**Single select**
- Existing product
- New product
- Multiple products under one brand
- Brand-wide system
- Internal tool
- Design-system-only project
- Other

## Product information

Ask for:
- product name;
- one-sentence product description;
- product URL;
- Figma product URL;
- existing design-system/library URL;
- existing code/component-library URL.

## Primary users and tasks

Ask:
- who primarily uses the product;
- their main tasks;
- important accessibility or localization requirements.

## Platforms

**Multi-select**
- Responsive web
- Desktop web
- Mobile web
- iOS
- Android
- Tablet
- Desktop app
- Other

# 2. Brand

## Brand maturity

- Established
- Partially established
- New
- No brand layer required
- Not sure

## Existing brand inputs

For each, select `Available`, `Partial`, `Missing` or `Not needed`:
- logo;
- brand colors;
- neutral palette;
- typography;
- iconography;
- illustration;
- photography;
- motion;
- brand guidelines;
- tone of voice.

## Interface character

Pick up to four:
- Minimal
- Dense
- Spacious
- Quiet
- Bold
- Friendly
- Serious
- Technical
- Premium
- Playful
- Editorial
- Utilitarian
- Soft
- Sharp
- Expressive
- Restrained

## Modes

- Light
- Dark
- High contrast
- Multiple brands
- White-label themes
- User-selectable themes
- Product-specific themes

## Third-party providers

Only when Social button (3.7) or brand assets with third-party marks are in scope, ask:
- which sign-in providers the product offers (these become the `Provider` values);
- which integrations, payment methods and app stores apply.

# 3. Existing system inventory

## Foundations

For each page, mark `Existing`, `Partial`, `Missing` or `Not needed`:

```text
1.1 Color
1.2 Typography
1.3 Space & layout
1.4 Shape
1.5 Elevation
1.6 Motion
1.7 Iconography
1.8 Brand assets
```

## Parts

```text
2.1 Button          2.8 Radio            2.15 Spinner
2.2 Icon button     2.9 Switch           2.16 Divider
2.3 Link            2.10 Text control    2.17 Kbd
2.4 Badge           2.11 Label           2.18 Slider
2.5 Tag             2.12 Help text       2.19 Featured icon
2.6 Avatar          2.13 Tooltip
2.7 Checkbox        2.14 Progress
```

## Components and Sections

```text
3.1 Button group    3.5 Select           4.1 Rich text editor
3.2 Text field      3.6 Menu             4.2 Video player
3.3 Choice field    3.7 Social button
3.4 Avatar group    3.8 Badge group
```

An existing library rarely uses these names. Map each existing page or component family to the page it corresponds to, and show the mapping to the user ("Your `Inputs` page → 2.10 Text control + 3.2 Text field"). For any existing page, allow a second-level inventory of the component sets inside it.

# 4. Action per existing item

Each existing page or component family resolves to one action:

- Keep
- Audit
- Improve
- Refactor
- Rebuild
- Replace
- Skip

Each missing page or component family resolves to:
- Build
- Skip

# 5. Build strategy

- Build only selected pages
- Audit first, then ask before changes
- Preserve existing pages and fill missing families
- Rebuild inconsistent parts only
- Complete Foundations + Parts system
- Complete Foundations + Parts + selected Components and Sections

Default for existing systems: `Preserve existing pages and fill missing families`.

`00 Cover`, `01 Getting started`, `02 Tokens` and `9.1 Doc kit` are always built for a new system; for an existing system they follow the same Keep / Audit / Improve / … actions.

# 6. Foundation scope

Allow selection at page level, then section level. The page's sections are listed in the order they appear in its frames.

## 1.1 Color

- Overview: Base colors · Extended palettes · Gradients
- Tokens: Text · Icon · Border · Surface · Fill · Overlay · Shadow · Category
- Guidelines: long-form color guidance

## 1.2 Typography

- Overview: Typefaces · Type scale
- Tokens: font families, weights, sizes, line heights
- Guidelines: long-form typography guidance

## 1.3 Space & layout

- Overview: Space scale · Sizes · Widths · Containers and reading measure · Grids
- Tokens: space and size variables
- Guidelines: long-form spacing and layout guidance

## 1.4 Shape

- Overview: Radius roles · Radius in use · Border widths
- Tokens: radius and border-width variables
- Guidelines: long-form shape guidance

## 1.5 Elevation

- Overview: Shadows · Focus rings · Backdrop blurs
- Guidelines: long-form effects guidance

## 1.6 Motion

- Overview: Durations · Easings · Pairings
- Tokens: motion variables
- Guidelines: long-form motion guidance

## 1.7 Iconography

- Overview: Icon library · Sizes · Colors · Utility marks
- Guidelines: long-form icon guidance

## 1.8 Brand assets

Select the asset kinds that apply:
- Product logo
- Partner and customer logos
- Press logos
- Social marks
- Integration marks
- App icons
- App-store badges
- Payment marks
- Flags
- File types
- Folders
- Emoji

# 7. Component scope

## Parts

Select Parts at page level; for pages with more than one set, allow set-level selection:

```text
2.6 Avatar         Avatar · Profile photo
2.13 Tooltip       Tooltip · Help icon
```

Every other Part page holds one published set with the page's name.

Parts that other Parts instance are built even when not selected, as dependencies (for example Spinner for Button's loading state, Help icon for Label). The dependency list is in `parts/00-parts.md`.

## Components

Optional at initiation. Select at page level, then set level:

```text
3.1 Button group     Button group
3.2 Text field       Text field · Textarea field · Code field
3.3 Choice field     Choice field · Choice card · Choice group
3.4 Avatar group     Avatar group · Avatar label
3.5 Select           Select · Multi-select
3.6 Menu             Menu · Context menu
3.7 Social button    Social button · Social button group
3.8 Badge group      Badge group
```

## Sections

Optional at initiation:

```text
4.1 Rich text editor   Rich text toolbar · Rich text floating toolbar · Rich text editor
4.2 Video player       Video player
```

A selected Component or Section also builds the Parts it contains. Unselected Components and Sections can be added later through `EXTEND.md`. Layouts and Screens are only added through `EXTEND.md`.

The complete set and private-part inventory of every page is defined by its Markdown file.

# 8. Component implementation mode

If any Part, Component or Section is selected, explicitly ask:

**How do you want to implement the components?**

- **YOLO everything** — implement every confirmed selected component page continuously without stopping for per-page approval.
- **One by one** — implement exactly one confirmed component page at a time, run that page's QA, report what is complete and what remains, then stop for the user to choose or confirm the next page.

Rules:
- do not infer the mode from build strategy, project size, or phrases such as "complete the design system";
- do not silently default to YOLO;
- if the user already explicitly chose YOLO or One by one in the current request, reuse that choice and do not ask again;
- implementation mode controls execution pacing only; it does not reduce specification loading, anatomy fidelity, documentation depth, matrix completeness or QA;
- in **One by one**, do not prebuild unrelated selected pages; Parts and private parts the active page depends on may be built as dependencies;
- in **YOLO everything**, every selected page still follows its complete Markdown file and QA before the run is considered complete.

# 9. Token architecture and naming

For **new systems**, architecture and naming are fixed by `SYSTEM.md` Part C:
- layers: Primitives → Semantic → Components (component tokens only where needed);
- collections, in order, created only when needed: `Primitives`, `Color`, `Typography`, `Space`, `Size`, `Shape`, `Motion`, `Components`, `Documentation`;
- token grammar `{domain}/{group}/{role}[/{emphasis}][/{state}]`;
- component and property names from Part C §4.

Nothing to ask; state it in the confirmation summary.

For **existing systems**, ask:

**Naming action**
- **Keep existing naming** — preserve existing collections, variables, styles and component properties; new additions follow the existing pattern.
- **Normalize** — migrate to `SYSTEM.md` Part C and record every rename in a rename list shown to the user.

Default for an existing library: `Keep existing naming`.

Never rename silently during Keep, Audit or Improve. Product-specific concepts remain groups inside the relevant collection; they never become their own collection.

# 10. Output formats

**Multi-select** (Figma Variables are always produced):
- CSS custom properties
- Tailwind theme
- JSON
- DTCG JSON
- JavaScript / TypeScript
- Android
- iOS

Every format is an export of the same names (`SYSTEM.md` Part C §5).

**Web implementation** (single choice):
- **Yes** — also build the system for the web: a Tailwind-ready React library and an explorer site where people browse every foundation and component, try their properties and copy the code. It follows `WEB.md`, starting from the brand-agnostic template in `web/`, and produces CSS custom properties, the Tailwind theme, DTCG JSON and TypeScript token data from the Figma variables.
- **Not now** — Figma only. The web implementation can be added later with `WEB.md`.

When Yes, also ask where the web project should be created (default: a `{system-name}-web` folder next to the user's working folder). The component implementation mode (§8) applies to the web pages too.

# 11. Documentation depth

The **page templates and their frames are fixed** (`SYSTEM.md` Part A §3). This selector only controls optional explanatory depth inside the frames.

Selectable extras:
- Long-form guidance
- Resource links
- Accessibility callouts
- Do / Don't examples
- Developer notes
- QA notes

Never remove the template frames, headers, Design notes, the Usage column of variable tables, tree connectors, alias chips, the Composition block, or component matrices.

# 12. Confirmation summary

Before generation, present:
- product and brand summary;
- platforms and modes;
- existing-page mapping and actions;
- selected Foundation pages and sections;
- selected Parts, Components and Sections, with their sets;
- dependencies that will be built automatically;
- component implementation mode: YOLO everything or One by one;
- naming: fixed contract (new) or Keep / Normalize (existing);
- output formats;
- optional documentation depth.

Final actions:
- **Confirm and generate**
- **Change answers**

---

# Part B — Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 0. Mandatory specification loading

Before implementation, load the complete applicable specification set.

Always load:

```text
README.md
SYSTEM.md
INITIATOR.md
templates/structure.md
```

Every page is built with `templates/structure.md`: page → frames → blocks → items. SYSTEM.md Part A gives the frames; the page file gives what they hold.

Then:

- `01 Getting started` in scope → load `guidance/01-getting-started.md`
- `02 Tokens` in scope → load `guidance/02-tokens.md`
- Any Foundation selected → load `foundations/00-foundations.md` **and every selected Foundation page file**
- Any Part selected → load `parts/00-parts.md` **and every selected Part page file**
- Any Component selected → load `components/00-components.md` **and every selected Component page file**, plus `parts/00-parts.md` and the file of every Part it contains
- Any Section selected → load `sections/00-sections.md` **and every selected Section page file**, plus the folder and page files of every Component and Part it contains
- Web implementation selected → load `WEB.md`, and for every page implemented on the web, the same page file used for its Figma page

The exact page → file mapping is in `README.md`.

**Root-only implementation is forbidden.**

Do not inspect, generate, modify or mark complete an in-scope page from `README.md`, `SYSTEM.md` or questionnaire answers alone.

If any required specification file has not been loaded, stop and load it first.

# 1. Integrated generation rule

Generation combines:
- the user's current request;
- supplied brand and source material;
- the current Figma and library state;
- the page tree, page templates, documentation system and naming in `SYSTEM.md`;
- the confirmed decisions in this file;
- the folder file of every level in scope;
- every selected page's Markdown file.

A local correction does not cancel unrelated approved requirements.

# 2. Inspect first

Only after the mandatory specifications are loaded:
- inventory pages and top-level frames and component sets;
- inventory variables, modes and local styles;
- inventory component sets and their public properties;
- identify current naming patterns;
- map existing content to the page tree in `SYSTEM.md` Part A;
- map each selected page to its loaded Markdown file.

# 3. Component implementation mode

Before implementing any selected Part, Component or Section, the implementation mode must be resolved.

## YOLO everything
- load every required component specification first;
- implement every confirmed selected page continuously in the generation order;
- do not pause for per-page confirmation;
- run each page's complete QA;
- do not treat continuous execution as permission to skip documentation, matrices, states, anatomy or QA.

## One by one
- load the folder file and the page file of the active page before implementation;
- implement exactly one confirmed page;
- include only the Parts and private parts the active page depends on;
- run that page's complete QA;
- report the completed page and the remaining confirmed pages;
- stop and ask which page to implement next, unless the user already named the next page in the same request.

Do not infer or default this mode. If the user has not explicitly chosen one, ask before component implementation begins.

# 4. Page actions

## Keep
Retain the page, its public API and approved content.

## Audit
Compare against its complete loaded page file without changing anything unless the build strategy permits it.

## Improve
Preserve identity and public API; fill missing approved requirements from the complete loaded file.

## Refactor
Preserve behaviour and public meaning; private anatomy may change only where its file permits.

## Rebuild
Reconstruct from the complete loaded page file while migrating approved brand values and assets.

## Replace
Create the replacement first; remove or archive superseded content only after migration.

## Build
Create the missing page from its complete loaded file, with the frames and frame names of `SYSTEM.md` Part A, built with `templates/structure.md`.

## Skip
Create nothing: no placeholder page, frame or region. Never infer Skip merely because an item was not mentioned in the latest prompt.

# 5. Naming

Before generating variables and components:
1. inspect existing collection, variable, style and property names;
2. apply the confirmed naming action (fixed contract for new systems; Keep or Normalize for existing ones);
3. create only the collections that are needed, in the `SYSTEM.md` Part C order;
4. apply `guidance/02-tokens.md` when `02 Tokens` is in scope;
5. keep product-specific concepts inside the appropriate collection.

# 6. Generation order

```text
1. Load all mandatory specifications
2. Variables and styles (Primitives → Semantic), then the Documentation collection (aliasing them) and 9.1 Doc kit (structure components from templates/structure.md §7), so the docs take the brand's look
3. 00 Cover, 01 Getting started, 02 Tokens
4. Foundations 1.1 → 1.8 (selected), using foundations/00-foundations.md + each page file
5. Resolve the component implementation mode
6. Parts in ID order, dependencies first (parts/00-parts.md + each page file)
7. Selected Components in ID order (components/00-components.md + each page file)
8. Selected Sections in ID order (sections/00-sections.md + each page file)
9. Documentation, examples, diagrams, matrices and QA required by each loaded file
10. Web implementation, when selected: WEB.md W1–W8 (template copy, token export with the contrast gate, brand assets, components in page order, foundation and guidance pages, docs data, build with package and QA, publish)

Every page in steps 3–8 is built with templates/structure.md.
```

Pages are created in the order of the page tree, with separators, whatever order they are built in. Do not substitute a different taxonomy, page name or frame name.

# 7. Build completeness

Build the completeness checklist from the **loaded specifications**, not from root summaries.

For every selected page capture:
- page name and ID;
- every template frame;
- variable and token groups;
- published sets and private parts;
- property axes;
- anatomy requirements;
- matrices;
- Guidelines topics;
- diagrams, examples and workflows;
- accessibility, content and usage rules;
- QA requirements.

Resolve every item to Keep / Audit / Improve / Refactor / Rebuild / Replace / Build / Skip.

# 8. Validation

Validation fails immediately if:
- component implementation began without an explicit YOLO everything or One by one choice;
- any required folder file was not loaded;
- any selected page file was not loaded;
- generation relied only on root files;
- pages are merged, renamed, flattened or reordered, or page names differ from `SYSTEM.md` Part A;
- template frames are missing, renamed or out of order;
- component matrices are reduced to showcase samples;
- documented anatomy is flattened;
- required Guidelines topics or visual examples are missing;
- approved requirements disappear during a local fix.

Then run:
1. global page tree, template, documentation and naming validation from `SYSTEM.md`;
2. Foundation validation from `foundations/00-foundations.md` when applicable;
3. Part, Component and Section completion criteria from their folder files when applicable;
4. the complete QA list of every selected page file;
5. when the web implementation is in scope, the QA list in `WEB.md` §9 for every implemented page.

# 9. Completion rule

Do not mark generation complete until:
- the component implementation mode is resolved whenever components are in scope;
- every required specification is confirmed loaded;
- every checklist item is resolved;
- every applicable global, folder-level and page-level QA rule passes;
- when the web implementation is in scope, `npm run build` passes (including `check:contrast`), `npm run qa` reports 0 problems, the package installs in a fresh app, and every in-scope page passes `WEB.md` §9.
