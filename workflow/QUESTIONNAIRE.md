# Questionnaire

The questions asked once, at initiation, before anything is built: platforms, scope, mode, naming, tokens, formats, product type, documentation depth, and the confirmation summary. This was `INITIATOR.md` Part A; its section numbers are unchanged, so `workflow/QUESTIONNAIRE.md` §12 is the old Part A §12.

**Load it** at initiation (steps 1–3 of `INITIATOR.md` Part B §6) and whenever the user changes an answer. The build itself follows `INITIATOR.md`.

**Answer from the inputs first** (`input/README.md`). Before the first question, read every file in `input/{system-slug}/`: briefs, brand files, the existing system, references and earlier chat notes. Pre-fill every question an input answers, and note its source. Ask only what the inputs leave open or where they conflict. When the user has added nothing yet, ask them to put their documents in `input/{system-slug}/` (or paste them in chat, which the agent saves under `chat/`) before going on. Each answer the user gives here is also written to `input/{system-slug}/chat/` (`input/README.md` I3).

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

A selected Component or Section also builds the Parts it contains. Unselected Components and Sections can be added later through `workflow/EXTEND.md`. Layouts and Screens are only added through `workflow/EXTEND.md`.

The complete set and private-part inventory of every page is defined by its Markdown file.

# 8. Component implementation mode

If any Part, Component or Section is selected, explicitly ask (the same choice applies later to Layouts and Screens added through `workflow/EXTEND.md`):

**How do you want to implement the components?**

- **YOLO everything** — implement every confirmed selected component page continuously, in the build sequence (`INITIATOR.md` Part B §6), without stopping for per-page approval.
- **One by one** — implement exactly one confirmed component page at a time, run that page's QA, report what is complete and what remains, then stop for the user to confirm the next page in the build sequence.

Rules:
- do not infer the mode from build strategy, project size, or phrases such as "complete the design system";
- do not silently default to YOLO;
- if the user already explicitly chose YOLO or One by one in the current request, reuse that choice and do not ask again;
- implementation mode controls execution pacing only; it does not change the order of the build sequence (`INITIATOR.md` Part B §6), and it does not reduce specification loading, anatomy fidelity, documentation depth, matrix completeness or QA;
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

# 10. Output formats and product type

**Multi-select** (Figma Variables are always produced):
- CSS custom properties
- Tailwind theme
- JSON
- DTCG JSON
- JavaScript / TypeScript
- Android
- iOS

Every format is an export of the same names (`SYSTEM.md` Part C §5).

**Product type** (single choice; always ask, never infer from the platforms answer in §1):
- **Web**: the Figma file for a web product, the documentation site, and a Tailwind-ready React library with an installable package (`workflow/WEB.md`, template `web/`).
- **App**: the Figma file adapted for iOS and Android apps (`SYSTEM.md` Part A §A5), and the documentation site with every component previewed in React Native and its code in React Native, Swift and Kotlin (`workflow/APP.md`). All three are always shown; there is no framework choice. Nothing native is provided or built.
- **Web and App**: both, from one Figma file with one brand look. The documentation site switches each component page between Web and App, and the React library is built for the web.

Suggest the default from §1 Platforms (web platforms → Web, iOS or Android → App, both → Web and App), but let the user choose. The product type adapts the Figma file (`SYSTEM.md` Part A §A5); the scope of pages and components stays the same.

**Code** (single choice):
- **Figma and code** (default): everything the product type includes. The documentation site is always on the web, whatever the product type: it is where tokens, foundations and components are browsed.
- **Figma only for now**: only the Figma file, already adapted to the product type. Code can be added later with `workflow/WEB.md` and `workflow/APP.md`.

The project is created in `output/{system-slug}/web/`: the docs site, with the React library for Web and the React Native preview source (`web/react-native/`) for App (README §5). Confirm the system slug with the user. Use another location only when the user explicitly asks for one. The component implementation mode (§8) applies to the code too. The output formats the product type needs are selected automatically: CSS, Tailwind and DTCG for the docs site and web.

Nothing native is installed, created or built: no Xcode, Android SDK, simulators, emulators or app projects (`workflow/APP.md`, "Nothing is installed or built").

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
- the inputs read (`input/{system-slug}/sources.md`), and for each answer below, whether it came from an input (with its file) or from the user in this conversation;
- any open conflict between inputs (`input/README.md` I4), with the resolution the user must choose;
- product and brand summary;
- platforms and modes;
- existing-page mapping and actions;
- selected Foundation pages and sections;
- selected Parts, Components and Sections, with their sets;
- dependencies that will be built automatically;
- component implementation mode: YOLO everything or One by one;
- naming: fixed contract (new) or Keep / Normalize (existing);
- output formats;
- product type (Web, App, or Web and App), what that means for Figma and for code (the docs site, the React library for Web, the App previews and code for App), Figma and code or Figma only, and the system slug for `output/{system-slug}/`;
- optional documentation depth;
- the build sequence (`INITIATOR.md` Part B §6): every step in scope, in the order it will run, with the pages under each level.

Final actions:
- **Confirm and generate**
- **Change answers**
