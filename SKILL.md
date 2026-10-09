---
name: ds-create
version: 0.1.0
description: Builds a brand-agnostic design system in Figma for any brand, and optionally its documentation site, from the ds-create repo (github.com/rosydaqbar/ds-create). Five commands, init, build, learn, qa and status, take a brand's context to Figma variables and styles, a component library (Parts, Components, Sections, Layouts) and a documented page for every item, always in the same structure. Use when someone wants to start or continue a design system ("ds-create", "design system for {brand}", "start the DS", "build the Button page", "build the foundations"), teach it a lasting rule ("remember that buttons align left"), check a build ("run QA on the DS"), or see how far it is ("where is the DS build"). Needs the Figma MCP with use_figma and a Figma file with edit access. Not for a single screen, mockup or one-off component in Figma (figma-generate-design, edit-figma-design), Antikode corporate websites on ATOMS (crea-corp-web), or a code-only component library with no Figma file.
user-invocable: true
argument-hint: "init · build · learn · qa · status"
---

# ds-create

ds-create turns a brand's context into a documented design system in Figma. Every system it builds has the same pages, in the same order, with the same frames and names. Only the brand's values change: colors, typefaces, radius, density and assets. From the same file it can also build a documentation site: React and Tailwind for Web, or React Native previews with React Native, Swift and Kotlin code for App.

This file is the overview. The system itself lives in the repo, **github.com/rosydaqbar/ds-create**: the specs, the workflow, the tools and the full skill. Everything below happens in a working copy of that repo.

# 1. Get the workspace first

The installed skill folder is a read-only copy of the repo, and `anti-skill update` replaces it. A build writes `input/{slug}/` and `output/{slug}/` into the repo it runs in, so it never runs inside the installed skill folder.

1. **Find the repo.** If the current folder, or one above it, holds `workflow/INITIATOR.md` and `specs/SYSTEM.md`, that folder is the workspace. Go to step 3.
2. **Clone it when there is none.** Ask once where it should live (default `~/ds-create`), then:

   ```bash
   git clone https://github.com/rosydaqbar/ds-create.git ~/ds-create
   ```

3. **Link the full skill** so Claude Code finds the commands in the workspace (once per clone):

   ```bash
   mkdir -p .claude/skills && ln -s ../../skills/ds-create .claude/skills/ds-create
   ```

   Other agents read `skills/ds-create/SKILL.md` directly.
4. **Work from the workspace root,** and follow `skills/ds-create/SKILL.md` there. It routes each command to its reference file in `skills/ds-create/reference/`.

**Updating.** Run `git pull` in the workspace. `input/` and `output/` are git-ignored, so a system's files and builds stay as they are.

# 2. What it needs

| Need | Why |
| --- | --- |
| The Figma MCP with the `use_figma` tool, signed in | every Figma write goes through it; the `figma-use` skill is loaded before the first call |
| A Figma file with edit access, or permission to create one | the system is built in it |
| The brand's typefaces installed | the type styles use them |
| Node 20 or later | the tools in `kit/tools/` and the docs site |
| git | to get and update the workspace |

`/ds-create init` checks each of these before it starts, and says how to fix what's missing.

# 3. Commands

| Command | What it does |
| --- | --- |
| `/ds-create init` | Checks readiness, reads everything in `input/{slug}/`, asks only what the inputs leave open, and sets up the foundations as Figma variables and styles. Runs once per system. |
| `/ds-create build` | Asks four questions: the engine (Default or Fast), how far to go, Figma only or with the docs site, and the pace. Then builds exactly that. Run it again to add more. |
| `/ds-create learn` | Keeps a lasting rule the user teaches about their system ("buttons align left") in `input/{slug}/knowledge/`, applies it to what is built, and follows it in every later build. |
| `/ds-create qa` | Runs the checks the user asks for: page and file audits, spec checklists, the copy check, and the site's QA. Only on call. |
| `/ds-create status` | Shows where the build stands, from its ledger, and the next command to run. |

With no command, `status` runs. Every answer is saved in `input/{slug}/answers/`, and anything said in chat that shapes the system goes to `input/{slug}/chat/`, so a later session doesn't ask again.

# 4. How a build runs

One numbered sequence, the same for a new system and an existing file (`workflow/INITIATOR.md` Part B §6):

| Phase | Steps |
| --- | --- |
| **Init** | inputs and inventory → confirmation → tokens: variables, text styles and effect styles |
| **Library** | page tree → grid styles, the icon library (Lucide) and brand assets → Parts sets → Components sets → Sections sets → Layouts sets |
| **Documentation** | Doc kit → Cover → Getting started → Tokens → Foundations → Parts, Components, Sections and Layouts pages → Screens |
| **Close** | clear the build data from the Figma file |
| **Site** (when in scope) | site setup → one docs page per item → build and package → publish, only when asked |

- **Library first.** Every set exists before any doc page is drawn, so every example on a page is a real instance and no step waits on a later one. A stand-in component is never drawn.
- **Two engines.** *Default* builds each page from its spec, with a cheap audit at each page. *Fast* draws every page with a fixed renderer from data, a page's text and a short plan, in far fewer calls. A fast round only generates: its audits and checks run when the user calls `qa`.
- **Pace.** *YOLO* answers the open questions itself and doesn't stop between pages. *One by one* stops after each page. Three things are always the user's: the engine, what the product is, and the Figma file.
- **The ledger** (`output/{slug}/ds-create-ledger.json`) keeps every step's status and evidence, so a build can stop and resume in any session.

# 5. What goes in and what comes out

**In: `input/{slug}/`**, one folder per system (`input/README.md`):
- `brief/`: product brief, goals, users, scope, research;
- `brand/`: guidelines, logos, typefaces, colors, tone of voice;
- `design-system/`: an existing system, its docs, token exports and Figma links;
- `references/`: systems and products used as inspiration, never copied;
- `knowledge/`: the system's own lasting rules, written by `learn`.

**Out:**
- **The Figma file:** `00 Cover`, `01 Getting started`, `02 Tokens`, then Foundations (1.x), Parts (2.x), Components (3.x), Sections (4.x), Layouts (5.x) and Screens (6.x). Each page has its fixed frames (`.Main`, Overview, Component, Anatomy, Guidelines).
- **`output/{slug}/`:** the ledger, every page's copy file (one source of text for Figma and the site), the set snapshots, the reports and the docs site.

# 6. Rules every build keeps

- **The inputs are the ground truth.** They are read before any question is asked, and every answer shows where it came from.
- **The repo stays brand-agnostic.** Brand names, file keys and product copy live only in `input/`, `output/` and the Figma file.
- **Examples are references, never sources.** `examples/` explains a pattern; nothing is copied from it.
- **No repo edits during a build.** Lessons go into the build notes, and into the repo after the round, when the maintainer asks.
- **The specs win.** A system's own knowledge and frozen values come first, then the specs. The repo's `knowledge/` explains the reasoning, and never overrides a spec.

# 7. The repo

| Folder | Holds |
| --- | --- |
| `skills/ds-create/` | the full skill: routing and one reference file per command |
| `specs/` | **what** to build: `SYSTEM.md` (page tree, templates, naming), then one file per page, by level |
| `workflow/` | **how** to build: `INITIATOR.md` (sequence, gates, ledger), `FAST.md`, `COPY.md`, `WEB.md`, `APP.md`, `GOTCHAS.md`, templates |
| `knowledge/` | **why** it works: design rationale with examples, never rules |
| `kit/` | the **code**: Figma tools (`kit/tools/`), the docs-site template (`kit/web/`), the app previews (`kit/app/`) |
| `examples/` | finished reference builds, to read, never to copy |
| `input/`, `output/` | each system's files and builds; local only, never committed |

The README holds the full file map and loading rules.
