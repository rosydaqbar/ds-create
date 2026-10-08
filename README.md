# Brand-Agnostic Design System Initiator

This repository is the specification an agent follows to build a design system in Figma for any brand. The product type is Web, App, or Web and App. From the Figma file it also builds a documentation site on the web for every product type, with the React library and package for Web (`workflow/WEB.md`). For App, the same site previews every component in React Native and shows its code in React Native, Swift and Kotlin (`workflow/APP.md`); nothing native is provided or built. Every build has **the same structure** — the same pages, in the same order, with the same frames and the same names — and only the brand values change: colors, typefaces, radius, density, assets.

The repository is **not executable from root files alone**. Root files define the global structure; the requirements for each page live in its own Markdown file and must be loaded before that page is built.

# Start here: the `ds-create` skill

ds-create is used through its skill, `skills/ds-create/`: four commands that run the whole workflow and keep every answer you give.

| Command | What it does |
| --- | --- |
| `/ds-create init` | checks what the build needs, reads your files in `input/`, asks only what is missing, and sets up the foundations as Figma variables and styles |
| `/ds-create build` | asks how to draw the pages (Default or Fast mode), how far to go, where (Figma only, or with the docs site) and the pace, then builds exactly that |
| `/ds-create learn` | keeps a rule you teach about your system (for example "buttons align left") in `input/{slug}/knowledge/`, applies it to what is built, and follows it in every later build |
| `/ds-create qa` | runs the full checks, only when you ask |
| `/ds-create status` | shows where the build stands and what to run next |

The skill ships with the repo in `skills/ds-create/` and stays brand-agnostic. Claude Code finds project skills in `.claude/skills/`, which is never committed, so link it once after cloning:

```bash
mkdir -p .claude/skills && ln -s ../../skills/ds-create .claude/skills/ds-create
```

Then open the repo in Claude Code: the `/ds-create` commands are there.

## Add your context to `input/`

Before the first build, give the agent what you know about the system. Everything goes into `input/`, one folder per design system (see `input/README.md`):

1. Create `input/{your-system-slug}/`. The slug is your system name in lowercase kebab case: `Acme Design System` → `acme`.
2. Drop your files into the folder that fits. Any format the agent can read works: Markdown, text, PDF, images, office documents, exported JSON, or a file of links.
   - `brief/`: PRD, product brief, goals, users and tasks, scope, research
   - `brand/`: brand guidelines, logo files, typefaces, color specs, tone of voice
   - `design-system/`: your existing system (docs, token exports, component lists, Figma library and code links)
   - `references/`: systems and products you like, used as inspiration only
3. Start with **`/ds-create init`**. The agent checks that everything is ready, reads every file before asking anything, writes an index (`sources.md`), asks only what your files leave open, and sets up the foundations as Figma variables and styles. It ends with a report: where the Figma file is and what it now holds.
4. Then run **`/ds-create build`**. It asks four questions: how to draw the pages (Default or Fast mode), how far to go (foundations, Parts, Components, everything, or only the pages you name), where (Figma only, or Figma and the docs site), and the pace. Then it builds exactly that. Run it again later to add more.
5. Run **`/ds-create qa`** whenever you want the full checks, and **`/ds-create status`** to see where the build stands.

Every answer you give is saved in `input/{your-system-slug}/answers/`, so a later session doesn't ask again.

Context you give in chat is saved too: the agent writes it to `input/{your-system-slug}/chat/`, so it is remembered in later sessions. Leave out a folder you have nothing for. With no input at all, the agent asks every question in `workflow/QUESTIONNAIRE.md`.

`input/` ships empty: only `input/README.md` is committed, and everything you add stays on your machine (`.gitignore`), like `output/`.

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
- **Components and Sections** are built when the user selects them at initiation or later through `workflow/EXTEND.md`.
- **Layouts and Screens** are added only through `workflow/EXTEND.md`.

Every page uses a fixed template of frames, left to right:

```text
Foundation page   .Main → {ID} {Name} · Overview → · Tokens → · Guidelines
Component page    .Main → {ID} {Name} · Overview → · Component → · Anatomy → · Guidelines
```

The full page tree rules, page templates, documentation system and naming contract are in `specs/SYSTEM.md`.

# 2. Root files and folders

The root holds the README and one folder per job: what to build, how, why, the code, and the per-system folders.

```text
README.md            this file: structure and file map (always loaded)
skills/              ds-create/: the ds-create skill, the way in: /ds-create init · build · learn · qa · status (SKILL.md and one
                     reference file per command). Link it into .claude/skills/ once after cloning (Start here); .claude/ is never committed

specs/               WHAT to build: the design system tree
  SYSTEM.md          page tree, page templates, token and component naming, audit routing (always loaded)
  guidance/ foundations/ parts/ components/ sections/ layouts/ screens/
                     one spec per page, plus a 00 index per level (see the file map below)

workflow/            HOW to build it: process, gates and lessons
  INITIATOR.md       generation logic: loading, ledger, build sequence, gates (always loaded)
  GOTCHAS.md         lessons from real builds as fixed, numbered rules; new agnostic lessons are added after every build (always loaded)
  QUESTIONNAIRE.md   the questions asked at initiation and the confirmation summary (loaded at initiation)
  DOCFRAMES.md       how documentation frames look: styling, tables, matrices, anatomy, Doc kit (loaded when drawing frames)
  COPY.md            the page copy files: one Markdown file per page holding every sentence for Figma and the docs site
  FAST.md            fast mode: an optional engine where a fixed renderer draws every doc page from data (copy files and page manifests)
  WEB.md             the documentation site (every product type) and, for Web products, the Tailwind-ready React library and package
  APP.md             App products on the docs site: React Native previews (react-native-web) and React Native, Swift and Kotlin code
  EXTEND.md          adding a component at any level after initiation
  ROADMAP.md         planned levels, components, renames and tooling (not built until specified)
  templates/         structure.md: the structure every page is built with (page → frames → blocks → items; no content);
                     agent-brief.md: the brief for docs-site page agents; fast/: the default fast-mode manifests (structure only)

knowledge/           WHY: the reasoning behind the specs, from the maintainer's experience: rationale and examples, never rules
                     (buttons.md, color.md, motion.md, radius.md, spacing.md)

kit/                 the CODE that builds
  tools/             figma-audit.js: read-only audit that every page call runs on its page (QA gate; the file-wide sweep runs on call);
                     figma-docbuilder.js: the doc-frame builder for Parts, Components, Sections and Layouts; figma-export-sets.js:
                     read-only JSON snapshot of each component set for the docs site; figma-copy.js: reads, checks and applies the page
                     copy files on the doc frames; figma-fastbuild.js, fast-pack.mjs, fast-cache.mjs, figma-dockit.js: fast mode
                     (workflow/FAST.md); icons-lucide.mjs: the icon library on 1.7, from Lucide; copy-guard.mjs: checks the docs
                     explain with knowledge/ without citing it
  web/               brand-agnostic web template (React, Tailwind v4, documentation site, package and QA scripts) that
                     workflow/WEB.md copies and fills
  app/               brand-agnostic React Native source for the docs' App previews, and its token script; never built into an app

examples/            finished builds made with ds-create, for reference only (never copied into a new build)
input/               what the user provides for each system: briefs, brand files, the existing system, references, chat notes
                     (git-ignored except input/README.md)
output/              everything a build generates: one folder per system (git-ignored except output/README.md)
```

# 3. File map

| Page | File |
| --- | --- |
| 00 Cover | `specs/SYSTEM.md` Part A §3 |
| 01 Getting started | `specs/guidance/01-getting-started.md` |
| 02 Tokens | `specs/guidance/02-tokens.md` |
| Any Foundation page | `specs/foundations/00-foundations.md` (folder rules) |
| 1.1 Color | `specs/foundations/1.1-color.md` |
| 1.2 Typography | `specs/foundations/1.2-typography.md` |
| 1.3 Space & layout | `specs/foundations/1.3-space-and-layout.md` |
| 1.4 Shape | `specs/foundations/1.4-shape.md` |
| 1.5 Elevation | `specs/foundations/1.5-elevation.md` |
| 1.6 Motion | `specs/foundations/1.6-motion.md` |
| 1.7 Iconography | `specs/foundations/1.7-iconography.md` |
| 1.8 Brand assets | `specs/foundations/1.8-brand-assets.md` |
| Any Part page | `specs/parts/00-parts.md` (folder rules) |
| 2.1 Button | `specs/parts/2.1-button.md` |
| 2.2 Icon button | `specs/parts/2.2-icon-button.md` |
| 2.3 Link | `specs/parts/2.3-link.md` |
| 2.4 Badge | `specs/parts/2.4-badge.md` |
| 2.5 Tag | `specs/parts/2.5-tag.md` |
| 2.6 Avatar | `specs/parts/2.6-avatar.md` |
| 2.7 Checkbox | `specs/parts/2.7-checkbox.md` |
| 2.8 Radio | `specs/parts/2.8-radio.md` |
| 2.9 Switch | `specs/parts/2.9-switch.md` |
| 2.10 Text control | `specs/parts/2.10-text-control.md` |
| 2.11 Label | `specs/parts/2.11-label.md` |
| 2.12 Help text | `specs/parts/2.12-help-text.md` |
| 2.13 Tooltip | `specs/parts/2.13-tooltip.md` |
| 2.14 Progress | `specs/parts/2.14-progress.md` |
| 2.15 Spinner | `specs/parts/2.15-spinner.md` |
| 2.16 Divider | `specs/parts/2.16-divider.md` |
| 2.17 Kbd | `specs/parts/2.17-kbd.md` |
| 2.18 Slider | `specs/parts/2.18-slider.md` |
| 2.19 Featured icon | `specs/parts/2.19-featured-icon.md` |
| Any Component page | `specs/components/00-components.md` (folder rules) |
| 3.1 Button group | `specs/components/3.1-button-group.md` |
| 3.2 Text field | `specs/components/3.2-text-field.md` |
| 3.3 Choice field | `specs/components/3.3-choice-field.md` |
| 3.4 Avatar group | `specs/components/3.4-avatar-group.md` |
| 3.5 Select | `specs/components/3.5-select.md` |
| 3.6 Menu | `specs/components/3.6-menu.md` |
| 3.7 Social button | `specs/components/3.7-social-button.md` |
| 3.8 Badge group | `specs/components/3.8-badge-group.md` |
| Any Section page | `specs/sections/00-sections.md` (folder rules) |
| 4.1 Rich text editor | `specs/sections/4.1-rich-text-editor.md` |
| 4.2 Video player | `specs/sections/4.2-video-player.md` |
| Any Layout page | `specs/layouts/00-layouts.md` (folder rules) |
| Any Screen page | `specs/screens/00-screens.md` (folder rules) |
| 9.1 Doc kit | `workflow/DOCFRAMES.md` §16 |
| New components | `workflow/EXTEND.md`, then the new file in the level folder |
| Docs site and web library | `workflow/WEB.md`, then the page file of each documented page; template in `kit/web/` |
| App previews and code (App products) | `workflow/APP.md`, then the page file of each page; preview source in `kit/app/` |

# 4. Mandatory loading

## Always load

Before any implementation or modification:

```text
README.md
specs/SYSTEM.md
workflow/INITIATOR.md
workflow/templates/structure.md
```

Every page is built with the structure in `workflow/templates/structure.md` (page → frames → blocks → items); specs/SYSTEM.md Part A says which frames a page has and the page's own file says what they hold.

`workflow/INITIATOR.md` includes the generation logic. Do not skip it. Load `workflow/EXTEND.md` as well when adding a component after initiation.

## Per step

| When | Load |
| --- | --- |
| Initiation, and whenever the user changes an answer | `workflow/QUESTIONNAIRE.md` |
| Any step that draws frames the doc builder has no helper for (Doc kit, Cover, guidance pages, Foundations, Screens), or that changes the builder | `workflow/DOCFRAMES.md` |
| Parts, Components, Sections and Layouts in Figma | `kit/tools/figma-docbuilder.js`, cached once at step 6 (`workflow/INITIATOR.md` Part B §6) |
| Docs site (`workflow/WEB.md`, `workflow/APP.md`) | `workflow/WEB.md`, plus `workflow/APP.md` for App products; docs agents start from `workflow/templates/agent-brief.md` |

`examples/` holds finished reference builds, not inputs: read one only to understand a pattern, and never copy from it (`workflow/GOTCHAS.md` G43). Never open generated files (`kit/web/src/tokens/tokens.gen.ts`, `kit/web/tokens/tokens.dtcg.json`, `kit/web/src/styles/tokens.css`); read their source, `tokens/figma-variables.json`.

Load page files at the step that builds them, not all at once, and keep the progress ledger on disk (`workflow/INITIATOR.md` Part B §0: *Loading per step* and *Progress ledger*). After any context compaction, re-read the global files and the ledger before continuing.

## Per level

| In scope | Load first | Then |
| --- | --- | --- |
| 01 Getting started | — | `specs/guidance/01-getting-started.md` |
| 02 Tokens | — | `specs/guidance/02-tokens.md` |
| Any Foundation page | `specs/foundations/00-foundations.md` | every selected Foundation page file |
| Any Part page | `specs/parts/00-parts.md` | every selected Part page file |
| Any Component page | `specs/components/00-components.md` | every selected Component page file and the files of the Parts it contains |
| Any Section page | `specs/sections/00-sections.md` | every selected Section page file and the files of the Components and Parts it contains |
| Any Layout page | `specs/layouts/00-layouts.md` | the page file and the files of the Sections and Components it contains |
| Any Screen page | `specs/screens/00-screens.md` | the page file and the file of its Layout |

## Hard loading rule

Implementation must **stop before editing Figma** if the folder file or the selected page file has not been loaded.

These are invalid implementation states:

```text
README + SYSTEM only
README + SYSTEM + INITIATOR only
Root files + no selected Foundation files
Root files + no selected component files
Selected 2.1 Button + no specs/parts/00-parts.md
Selected 2.1 Button + no specs/parts/2.1-button.md
Selected 1.1 Color + no specs/foundations/00-foundations.md
Selected 1.1 Color + no specs/foundations/1.1-color.md
Selected 3.2 Text field + no specs/parts/2.10-text-control.md
Selected 6.x Screen + no specs/layouts/5.x file of its Layout
Any page + no workflow/templates/structure.md
Drawing Doc kit, Cover, guidance, Foundation or Screen frames + no workflow/DOCFRAMES.md
Drawing Part, Component, Section or Layout frames + doc builder not cached
Initiation or changed answers + no workflow/QUESTIONNAIRE.md
```

`specs/SYSTEM.md` provides the global structure and grammar only, and `workflow/DOCFRAMES.md` how frames look. Neither replaces the `specs/guidance/`, `specs/foundations/`, `specs/parts/`, `specs/components/` or `specs/sections/` files.

## Implementation checklist

Before generating, create a loaded-spec checklist:

```text
Global
[ ] README.md
[ ] specs/SYSTEM.md
[ ] workflow/INITIATOR.md
[ ] workflow/GOTCHAS.md
[ ] workflow/templates/structure.md
[ ] input/{system-slug}/sources.md (at initiation: every file in input/{system-slug}/)
[ ] workflow/QUESTIONNAIRE.md at initiation
[ ] workflow/DOCFRAMES.md when drawing frames the doc builder has no helper for

Guidance
[ ] every selected guidance file

Foundations
[ ] specs/foundations/00-foundations.md when any Foundation is selected
[ ] every selected Foundation page file

Parts
[ ] specs/parts/00-parts.md when any Part is selected
[ ] every selected Part page file

Components and Sections
[ ] specs/components/00-components.md / specs/sections/00-sections.md when any is selected
[ ] every selected page file, and the files of every component it contains
```

Do not begin implementation until every applicable box is checked.

# 5. Executor, input and output

The repo is split in three.
- The **executor** is everything an agent reads and copies: the root files, `workflow/`, the page specs, `workflow/templates/`, `kit/tools/`, and the `kit/web/` and `kit/app/` templates. It is brand-agnostic.
- The **input** is everything the user provides for one system: briefs and PRDs, brand files, the existing design system, references, and what the user says in chat. It goes into `input/{system-slug}/` and is the ground truth of the build (`input/README.md`):

```text
input/{system-slug}/
├─ sources.md       the index the agent writes: every input and what it decides
├─ brief/  brand/  design-system/  references/   added by the user
└─ chat/            the user's chat instructions, saved by the agent, one file per date
```

- The **output** is everything a build generates, and it all goes into `output/{system-slug}/`:

```text
output/{system-slug}/
├─ ds-create-ledger.json   progress ledger
├─ figma/                  the Figma export and figma-audit results
├─ kit/web/                    the docs site, for every product type (the React library for Web; kit/web/react-native/ for App previews)
└─ reports/                QA reports and reviews
```

`{system-slug}` is the system name in lowercase kebab case (`Acme Design System` → `acme`). `input/` and `output/` are git-ignored, except their README files, so no brand is ever committed. Never write a build into the executor folders or into `examples/`. Use another location only when the user explicitly asks for one; a finished build becomes a committed reference in `examples/` only when the user asks. The Figma file itself lives in Figma.

**Design quality.** Every docs-site build is generated and checked with the [Impeccable](https://www.npmjs.com/package/impeccable) skill and its anti-AI-slop rules. Install it once per machine in this repo:

```bash
npx impeccable install --project --providers=claude -y
.claude/skills/impeccable/scripts/impeccable hooks on
```

`.claude/` is git-ignored, so the skill and its hook stay local. The shared `.impeccable/config.json` only turns the hook on and holds no brand exceptions: a build records its own in `output/{system-slug}/web/.impeccable/config.json` (`workflow/WEB.md` W7).

# 6. Non-negotiable

- Build in the order of the build sequence in `workflow/INITIATOR.md` Part B §6, for a new system and an existing one. A step starts only when every step above it is done in the ledger. YOLO removes the pauses, never a step.
- A page is done only after its own page file was loaded, its QA passed and `kit/tools/figma-audit.js` reported `fail` = 0. No page is built from root files or by a generic script without its page file.
- Use the exact page tree, page names and template frames in `specs/SYSTEM.md` Part A.
- Use the naming in `specs/SYSTEM.md` Part C for tokens, styles, component sets, properties, parts and layers.
- Never merge required pages into one page.
- Never drop approved Guidelines topics, diagrams, examples, matrices, anatomy or QA.
- Page-specific requirements come from the page files, not from root-file summaries.
- A local fix does not cancel unrelated approved requirements.

# Example: Syncium

Syncium is a complete example built with ds-create from one set of brand guidelines: a Figma design system (YOLO mode, every page in the tree) and its web version, made with the `workflow/WEB.md` workflow.

This example is a reference. An agent may read it to understand a pattern, but never copies from it and never uses it in place of a page's spec and the system's own inputs (`workflow/GOTCHAS.md` G43).

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

The example was built first, then reviewed against the standard set by mature public design systems. Its fixes were folded back into the template, `workflow/WEB.md` and the page specs. They include accessibility, contrast, foundation guidance, search, status and changelog, the package build, the QA gates and the copy voice. A new build starts from the corrected template.

**Credit.** The Syncium brand (name, logo, colors and typography) comes from the Dribbble shot [Syncium SaaS Platform Brand Guidelines](https://dribbble.com/shots/25207945-Syncium-SaaS-Platform-Brand-Guidelines). All brand rights belong to its creator. It is used here only to demonstrate ds-create.
