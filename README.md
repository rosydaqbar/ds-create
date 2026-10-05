# Brand-Agnostic Design System Initiator

This repository is the specification an agent follows to build a design system in Figma for any brand. From the Figma file it can also build the system for the web (`WEB.md`) and for apps (`APP.md`: React Native, or SwiftUI and Jetpack Compose). Every build has **the same structure** — the same pages, in the same order, with the same frames and the same names — and only the brand values change: colors, typefaces, radius, density, assets.

The repository is **not executable from root files alone**. Root files define the global structure; the requirements for each page live in its own Markdown file and must be loaded before that page is built.

# 1. Structure of a generated file

The Figma file is built in levels: Foundations first, then Parts, Components, Sections, Layouts and Screens.

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
2.1 Button          2.8 Radio            2.15 Spinner
2.2 Icon button     2.9 Switch           2.16 Divider
2.3 Link            2.10 Text control    2.17 Kbd
2.4 Badge           2.11 Label           2.18 Slider
2.5 Tag             2.12 Help text       2.19 Featured icon
2.6 Avatar          2.13 Tooltip
2.7 Checkbox        2.14 Progress
── 3 · Components ──
3.1 Button group    3.5 Select
3.2 Text field      3.6 Menu
3.3 Choice field    3.7 Social button
3.4 Avatar group    3.8 Badge group
── 4 · Sections ──
4.1 Rich text editor
4.2 Video player
── 5 · Layouts ──
── 6 · Screens ──
── 9 · Internal ──
9.1 Doc kit
```

(Parts, Components and Sections are one page each, in ID order; they are shown in columns here only to save space.)

- **Initiate** builds `00`–`02`, the selected Foundations, the selected Parts and `9.1 Doc kit`.
- **Components and Sections** are built when the user selects them at initiation or later through `EXTEND.md`.
- **Layouts and Screens** are added only through `EXTEND.md`.

Every page uses a fixed template of frames, left to right:

```text
Foundation page   .Main → {ID} {Name} · Overview → · Tokens → · Guidelines
Component page    .Main → {ID} {Name} · Overview → · Component → · Anatomy → · Guidelines
```

The full page tree rules, page templates, documentation system and naming contract are in `SYSTEM.md`.

# 2. Root files

```text
README.md      this file: structure and file map
SYSTEM.md      page tree, page templates, documentation system, token and component naming
INITIATOR.md   questionnaire and generation logic
EXTEND.md      adding a component at any level after initiation
WEB.md         web implementation: Tailwind-ready React library, installable package and documentation site built from the Figma file
APP.md         app implementation: React Native, or SwiftUI and Jetpack Compose, with a showcase app, built from the Figma file
templates/     templates/structure.md: the structure every page is built with (page → frames → blocks → items; no content)
tools/         figma-audit.js: read-only use_figma audit run on every built page and once on the file (QA gate)
ROADMAP.md     planned levels, components, renames and tooling (not built until specified)
archive/       superseded proposals, kept for history only (never loaded)
web/           brand-agnostic web template (React, Tailwind v4, documentation site, package and QA scripts) that WEB.md copies and fills
app/           brand-agnostic app templates (react-native/, swiftui/, compose/) and the shared token generator that APP.md copies and fills; reference skeletons, compiled by the first build
examples/      finished builds made with ds-create, for reference only (never copied into a new build)
output/        everything a build generates: one folder per system (git-ignored except output/README.md)
```

# 3. File map

| Page | File |
| --- | --- |
| 00 Cover | `SYSTEM.md` Part A §3 |
| 01 Getting started | `guidance/01-getting-started.md` |
| 02 Tokens | `guidance/02-tokens.md` |
| Any Foundation page | `foundations/00-foundations.md` (folder rules) |
| 1.1 Color | `foundations/1.1-color.md` |
| 1.2 Typography | `foundations/1.2-typography.md` |
| 1.3 Space & layout | `foundations/1.3-space-and-layout.md` |
| 1.4 Shape | `foundations/1.4-shape.md` |
| 1.5 Elevation | `foundations/1.5-elevation.md` |
| 1.6 Motion | `foundations/1.6-motion.md` |
| 1.7 Iconography | `foundations/1.7-iconography.md` |
| 1.8 Brand assets | `foundations/1.8-brand-assets.md` |
| Any Part page | `parts/00-parts.md` (folder rules) |
| 2.1 Button | `parts/2.1-button.md` |
| 2.2 Icon button | `parts/2.2-icon-button.md` |
| 2.3 Link | `parts/2.3-link.md` |
| 2.4 Badge | `parts/2.4-badge.md` |
| 2.5 Tag | `parts/2.5-tag.md` |
| 2.6 Avatar | `parts/2.6-avatar.md` |
| 2.7 Checkbox | `parts/2.7-checkbox.md` |
| 2.8 Radio | `parts/2.8-radio.md` |
| 2.9 Switch | `parts/2.9-switch.md` |
| 2.10 Text control | `parts/2.10-text-control.md` |
| 2.11 Label | `parts/2.11-label.md` |
| 2.12 Help text | `parts/2.12-help-text.md` |
| 2.13 Tooltip | `parts/2.13-tooltip.md` |
| 2.14 Progress | `parts/2.14-progress.md` |
| 2.15 Spinner | `parts/2.15-spinner.md` |
| 2.16 Divider | `parts/2.16-divider.md` |
| 2.17 Kbd | `parts/2.17-kbd.md` |
| 2.18 Slider | `parts/2.18-slider.md` |
| 2.19 Featured icon | `parts/2.19-featured-icon.md` |
| Any Component page | `components/00-components.md` (folder rules) |
| 3.1 Button group | `components/3.1-button-group.md` |
| 3.2 Text field | `components/3.2-text-field.md` |
| 3.3 Choice field | `components/3.3-choice-field.md` |
| 3.4 Avatar group | `components/3.4-avatar-group.md` |
| 3.5 Select | `components/3.5-select.md` |
| 3.6 Menu | `components/3.6-menu.md` |
| 3.7 Social button | `components/3.7-social-button.md` |
| 3.8 Badge group | `components/3.8-badge-group.md` |
| Any Section page | `sections/00-sections.md` (folder rules) |
| 4.1 Rich text editor | `sections/4.1-rich-text-editor.md` |
| 4.2 Video player | `sections/4.2-video-player.md` |
| Any Layout page | `layouts/00-layouts.md` (folder rules) |
| Any Screen page | `screens/00-screens.md` (folder rules) |
| 9.1 Doc kit | `SYSTEM.md` Part B §16 |
| New components | `EXTEND.md`, then the new file in the level folder |
| Web implementation | `WEB.md`, then the page file of each implemented page; template in `web/` |
| App implementation | `APP.md`, then the page file of each implemented page; templates in `app/` |

# 4. Mandatory loading

## Always load

Before any implementation or modification:

```text
README.md
SYSTEM.md
INITIATOR.md
templates/structure.md
```

Every page is built with the structure in `templates/structure.md` (page → frames → blocks → items); SYSTEM.md Part A says which frames a page has and the page's own file says what they hold.

`INITIATOR.md` includes the generation logic. Do not skip it. Load `EXTEND.md` as well when adding a component after initiation.

Load page files at the step that builds them, not all at once, and keep the progress ledger on disk (`INITIATOR.md` Part B §0: *Loading per step* and *Progress ledger*). After any context compaction, re-read the global files and the ledger before continuing.

## Per level

| In scope | Load first | Then |
| --- | --- | --- |
| 01 Getting started | — | `guidance/01-getting-started.md` |
| 02 Tokens | — | `guidance/02-tokens.md` |
| Any Foundation page | `foundations/00-foundations.md` | every selected Foundation page file |
| Any Part page | `parts/00-parts.md` | every selected Part page file |
| Any Component page | `components/00-components.md` | every selected Component page file and the files of the Parts it contains |
| Any Section page | `sections/00-sections.md` | every selected Section page file and the files of the Components and Parts it contains |
| Any Layout page | `layouts/00-layouts.md` | the page file and the files of the Sections and Components it contains |
| Any Screen page | `screens/00-screens.md` | the page file and the file of its Layout |

## Hard loading rule

Implementation must **stop before editing Figma** if the folder file or the selected page file has not been loaded.

These are invalid implementation states:

```text
README + SYSTEM only
README + SYSTEM + INITIATOR only
Root files + no selected Foundation files
Root files + no selected component files
Selected 2.1 Button + no parts/00-parts.md
Selected 2.1 Button + no parts/2.1-button.md
Selected 1.1 Color + no foundations/00-foundations.md
Selected 1.1 Color + no foundations/1.1-color.md
Selected 3.2 Text field + no parts/2.10-text-control.md
Selected 6.x Screen + no layouts/5.x file of its Layout
Any page + no templates/structure.md
```

`SYSTEM.md` provides the global structure and grammar only. It does **not** replace the `guidance/`, `foundations/`, `parts/`, `components/` or `sections/` files.

## Implementation checklist

Before generating, create a loaded-spec checklist:

```text
Global
[ ] README.md
[ ] SYSTEM.md
[ ] INITIATOR.md

Guidance
[ ] every selected guidance file

Foundations
[ ] foundations/00-foundations.md when any Foundation is selected
[ ] every selected Foundation page file

Parts
[ ] parts/00-parts.md when any Part is selected
[ ] every selected Part page file

Components and Sections
[ ] components/00-components.md / sections/00-sections.md when any is selected
[ ] every selected page file, and the files of every component it contains
```

Do not begin implementation until every applicable box is checked.

# 5. Executor and output

The repo is split in two. The **executor** is everything an agent reads and copies: the root files, the page specs, `templates/`, `tools/`, and the `web/` and `app/` templates. The **output** is everything a build generates, and it all goes into `output/{system-slug}/`:

```text
output/{system-slug}/
├─ ds-create-ledger.json   progress ledger
├─ figma/                  the Figma export and figma-audit results
├─ web/                    the web project (when Web is a target)
├─ native/ ios/ android/   the app projects (when App is a target)
└─ reports/                QA reports and reviews
```

`{system-slug}` is the system name in lowercase kebab case (`Acme Design System` → `acme`). `output/` is git-ignored, so no generated brand is ever committed. Never write a build into the executor folders or into `examples/`. Use another location only when the user explicitly asks for one; a finished build becomes a committed reference in `examples/` only when the user asks. The Figma file itself lives in Figma.

# 6. Non-negotiable

- Use the exact page tree, page names and template frames in `SYSTEM.md` Part A.
- Use the naming in `SYSTEM.md` Part C for tokens, styles, component sets, properties, parts and layers.
- Never merge required pages into one page.
- Never drop approved Guidelines topics, diagrams, examples, matrices, anatomy or QA.
- Page-specific requirements come from the page files, not from root-file summaries.
- A local fix does not cancel unrelated approved requirements.

# Example: Syncium

Syncium is a complete example built with ds-create from one set of brand guidelines: a Figma design system (YOLO mode, every page in the tree) and its web version, made with the `WEB.md` workflow.

The web version is in [`examples/syncium`](examples/syncium). It has the explorer site and an installable package, `@syncium/design-system`. The explorer covers:
- Getting started for designers, developers and product managers;
- searchable tokens, a changelog and status labels;
- eight foundations, each with Overview, Tokens and Guidelines;
- 29 components with a playground, every variant, anatomy, guidelines and code.

```bash
cd examples/syncium
npm install
npm run dev            # explorer on http://localhost:5173/
npm run build:package  # the installable package in package/
npm run qa             # every page and tab in Light and Dark: errors, overflow, WCAG 2.2 AA
```

The example was built first, then reviewed against the standard set by mature public design systems. Its fixes were folded back into the template, `WEB.md` and the page specs. They include accessibility, contrast, foundation guidance, search, status and changelog, the package build, the QA gates and the copy voice. A new build starts from the corrected template.

**Credit.** The Syncium brand (name, logo, colors and typography) comes from the Dribbble shot [Syncium SaaS Platform Brand Guidelines](https://dribbble.com/shots/25207945-Syncium-SaaS-Platform-Brand-Guidelines). All brand rights belong to its creator. It is used here only to demonstrate ds-create.
