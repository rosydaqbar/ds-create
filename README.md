# Brand-Agnostic Design System Initiator

This repository is the specification an agent follows to build a design system in Figma for any brand. The product type is Web, App, or Web and App. From the Figma file it also builds a documentation site on the web for every product type, with the React library and package for Web (`workflow/WEB.md`). For App, the same site previews every component in React Native and shows its code in React Native, Swift and Kotlin (`workflow/APP.md`); nothing native is provided or built. Every build has **the same structure** — the same pages, in the same order, with the same frames and the same names — while brand values and subject-specific documentation come from verified project sources. Outer frames stay compatible; topic organization and depth follow the editorial plan (`workflow/EDITORIAL.md`).

The repository is **not executable from root files alone**. Root files define the global structure; the requirements for each page live in its own Markdown file and must be loaded before that page is built.

# Start here: the `ds-create` skill

ds-create is used through its skill, `skill/`: six commands that run the whole workflow and keep every answer you give.

The **maintainer** develops ds-create. The **builder** uses it to create and maintain a design system and its documentation. **Consumers** use that result: designers in Figma and developers through the web docs. Init gives the builder a local **DS Create Builder**, separate from the consumer docs site, to review a local foundation draft before Figma generation.

The six commands, and what each one does, are listed in `skill/SKILL.md`.

The skill ships with the repo in `skill/` and stays brand-agnostic. Open the workspace in your chosen agent and load `skill/SKILL.md`, or register that folder using the client's own skill-discovery mechanism. Command syntax and settings locations belong to the client; no agent or IDE is required by ds-create. Builder work uses the standard MCP interface described in `skill/reference/mcp.md`.

## Install from the skill vault

`anti-skill update` replaces the installed skill folder. A build writes `workspace/input/{slug}/` and `workspace/output/{slug}/` into the folder it runs in, so it never runs inside the installed skill folder.

1. **Find the workspace.** If the current folder, or one above it, holds `workflow/INITIATOR.md` and `specs/SYSTEM.md`, and is not the installed skill folder, that folder is the workspace. Go to step 3.
2. **Copy it when there is none.** Ask once where it should live (default `~/ds-create`), then copy the installed skill folder there:

   ```bash
   rsync -a --include='/workspace/input/README.md' --include='/workspace/output/README.md' \
     --exclude='/workspace/input/*' --exclude='/workspace/output/*' \
     "<installed skill folder>/" ~/ds-create/
   ```

   The copy includes the workspace README templates and excludes saved project inputs, outputs, sessions, and caches.

3. **Load the full skill** from `skill/SKILL.md` in the workspace, or register that folder through the client's own skill-discovery mechanism. Do not require a particular agent's settings folder or command syntax.
4. **Work from the workspace root,** and follow `skill/SKILL.md` there. It routes each command to its reference file in `skill/reference/`.

**Updating.** Run `anti-skill update ds-create`, then copy the new version over the workspace without touching `workspace/input/` and `workspace/output/`, so a system's files and builds stay as they are:

```bash
rsync -a --exclude workspace/input/ --exclude workspace/output/ "<installed skill folder>/" ~/ds-create/
```

## Add your context to `workspace/input/`

Before the first build, give the agent what you know about the system. Everything goes into `workspace/input/`, one folder per design system (see `workspace/input/README.md`):

1. Create `workspace/input/{your-system-slug}/`. The slug is your system name in lowercase kebab case: `Acme Design System` → `acme`.
2. Drop your files into the folder that fits. Any format the agent can read works: Markdown, text, PDF, images, office documents, exported JSON, or a file of links.
   - `brief/`: PRD, product brief, goals, users and tasks, scope, research
   - `brand/`: brand guidelines, logo files, typefaces, color specs, tone of voice
   - `design-system/`: your existing system (docs, token exports, component lists, Figma library and code links)
   - `references/`: systems and products you like, used as inspiration only
3. Start with **`/ds-create builder`** to open an empty **DS Create Builder** immediately. Enter a Project name, then add Context / Instruction and Context files in its modal; the name sets the input folder (`Acme Design System` → `workspace/input/acme-design-system/`). The saved input slug stays stable on later name edits; the output/session ID and resume command stay separate. Node waits for preparation through one pending MCP tool call, which returns the event to the existing main agent. An ended tool call cannot wake an idle chat. Missing design questions stay in Builder. No agent/IDE CLI or product-specific bridge is selected. Publication remains a separate approved MCP continuation using the agent’s existing Figma connection. See `skill/reference/mcp.md`. Review it, then Publish to Figma. Setup can be resumed from saved state; no Figma link is required until Publish. See `skill/reference/builder.md`. For chat-led setup, use **`/ds-create init`**. The agent checks local readiness, reads the inputs, asks only what is missing and prepares `foundations.json`. It launches **DS Create Builder** in the background on localhost so you can review color, typography, spacing, radius and shadows before Figma generation. Send changes to the agent; controller edits are currently browser previews. Use **Publish → Publish to Figma** to approve the saved revision and queue its approved MCP continuation, or approve it in chat. The agent verifies the selected file/fonts and generates that revision in Figma. Publish then unlocks step2, **ds-create build**, with a copyable command for your agent. Init finishes with both links after the token audit passes. Figma is required before build; it is not required to open a new system's local draft. Existing systems preserve frozen values and may need a read-only Figma inventory before drafting. Builder is included for every product type and does not create the consumer docs site.
4. Then run **`/ds-create build`**. It asks four questions: how to draw the pages (Default or Fast mode), how far to go (foundations, Parts, Components, everything, or only the pages you name), where (Figma only, or Figma and the docs site), and the pace. Then it builds exactly that. Run it again later to add more.
5. Run **`/ds-create qa`** whenever you want the full checks, and **`/ds-create status`** to see where the build stands.

Every answer you give is saved in `workspace/input/{your-system-slug}/answers/`, so a later session doesn't ask again.

Context you give in chat is saved too: the agent writes it to `workspace/input/{your-system-slug}/chat/`, so it is remembered in later sessions. Leave out a folder you have nothing for. With no input at all, the agent asks every question in `workflow/QUESTIONNAIRE.md`.

`workspace/input/` and `workspace/output/` ship with only their README templates. Saved projects, generated sessions and caches are local workspace data; exclude them when copying or distributing the skill, even when they are git-ignored.

The page tree, page templates and naming are in `specs/SYSTEM.md`. What to load at each step is in `workflow/INITIATOR.md`.

# 1. Root files and folders

The root holds the README and one folder per job: what to build, how, why, the code, and the per-system folders.

```text
README.md            this file: what ds-create is, how to start, the folder map (always loaded)
AGENTS.md            notes for agents that work on this repo (kept at the root so agent tools find it)
SKILL.md             a pointer to skill/SKILL.md (the vault-published entry)
skill/               the ds-create skill, the way in: /ds-create builder · init · build · learn · qa · status (SKILL.md and one
                     reference file per command). Link it into .claude/skills/ once after cloning (Start here); .claude/ is never committed

specs/               WHAT to build: the design system tree
  SYSTEM.md          page tree, page templates, token and component naming, audit routing (always loaded)
  guidance/ foundations/ parts/ components/ sections/ layouts/ screens/
                     one spec per page, plus a 00 index per level (page → file mapping: `specs/SYSTEM.md` Part D and each level's 00 file)

workflow/            HOW to build it: process, gates and lessons
  INITIATOR.md       generation logic: loading, ledger, build sequence, gates (always loaded)
  README.md          index of these documents by stage
  MANAGER.md         index of the Builder documents in builder/ (lifecycle, publish, parts, setup)
  builder/           the local Builder app: lifecycle.md, publish.md, parts.md, setup.md
  GOTCHAS.md         lessons from real builds as fixed, numbered rules; new agnostic lessons are added after every build (always loaded)
  QUESTIONNAIRE.md   the questions asked at initiation and the confirmation summary (loaded at initiation)
  DOCFRAMES.md       how documentation frames look: styling, tables, matrices, anatomy, Doc kit (loaded when drawing frames)
  COPY.md            the page copy files: one Markdown file per page holding every sentence for Figma and the docs site
  FAST.md            fast mode: an optional engine where a fixed renderer draws every doc page from data (copy files and page manifests)
  WEB.md             the documentation site (every product type) and, for Web products, the Tailwind-ready React library and package
  APP.md             App products on the docs site: React Native previews (react-native-web) and React Native, Swift and Kotlin code
  EXTEND.md          adding a component at any level after initiation
  templates/         structure.md: the structure every page is built with (page → frames → blocks → items; no content);
                     agent-brief.md: the brief for docs-site page agents; fast/: the default fast-mode manifests (structure only)

knowledge/           WHY: the reasoning behind the specs, from the maintainer's experience: rationale and examples, never rules
                     (badges-and-tags.md, buttons.md, color.md, motion.md, radius.md, spacing.md)

kit/                 reusable execution code and templates
  builder/           local Builder application (see kit/builder/README.md)
    cli.mjs          Builder lifecycle entry point
    client/          browser shell, feature modules and licensed assets
    server/          HTTP/API, source intake, job execution and verification
    foundations/     foundation compilation, validation, templates and Figma calls
    shared/          browser/server interface choices and motion values
  mcp/               MCP entry point for preparation and approved publication
  tools/             workflow tools (see kit/tools/README.md)
    figma/           Figma renderers, libraries, exports, audits and copy
    build/           manifest packing, renderer cache, ledger and registry
    content/         copy guard and editorial checks
  web/               brand-agnostic React/Tailwind documentation template
  app/               React Native source for App previews and its token script
  README.md          which kit folders run and which are copied into projects

dev/                 maintainer files, not used by a build
  examples/          finished builds made with ds-create, for reference only (see GOTCHAS G43)
  maintain/          bundled icon/default-data generation
  ROADMAP.md         planned levels, components, renames and tooling (not built until specified)
  check-paths.mjs, rewrite-paths.mjs   path checks and path rewrites for moves

workspace/            the WORK: every system's inputs and outputs live here, apart from the repo's own files
  input/             what the user provides for each system: briefs, brand files, the existing system, references, chat notes
                     (git-ignored except workspace/input/README.md)
  output/            everything a build generates: one folder per system (git-ignored except workspace/output/README.md)
```

The MCP entry point is `node kit/mcp/server.mjs --workspace /absolute/workspace`; install its dependencies with `npm ci --prefix kit/mcp`. An agent session without the `ds_create_*` tools calls them through `node kit/builder/cli.mjs mcp {tool} --json '{…}'`, which installs the dependencies and starts a terminal host holding one MCP connection (`kit/mcp/host.mjs`), so no restart is needed.

Never open generated files (`kit/web/src/tokens/tokens.gen.ts`, `kit/web/tokens/tokens.dtcg.json`, `kit/web/src/styles/tokens.css`); read their source, `tokens/figma-variables.json`.

# 2. Executor, input and output

The repo is split in three.
- The **executor** is everything an agent reads and copies: the root files, `workflow/`, the page specs, `workflow/templates/`, `kit/tools/`, and the `kit/web/` and `kit/app/` templates. It is brand-agnostic.
- The **input** is everything the user provides for one system: briefs and PRDs, brand files, the existing design system, references, and what the user says in chat. It goes into `workspace/input/{system-slug}/` and is the ground truth of the build (`workspace/input/README.md`):

```text
workspace/input/{system-slug}/
├─ sources.md       the index the agent writes: every input and what it decides
├─ brief/  brand/  design-system/  references/   added by the user
└─ chat/            the user's chat instructions, saved by the agent, one file per date
```

- The **output** is everything a build generates, and it all goes into `workspace/output/{system-slug}/`:

```text
workspace/output/{system-slug}/
├─ foundations.json       local foundation draft reviewed before Figma
├─ ds-create-ledger.json   progress ledger and saved-revision approval
├─ figma/                  the Figma export and figma-audit results
├─ manager/                builder's local DS Create Builder, generated and launched by init
├─ web/                    consumer docs site, when selected (React library for Web; web/react-native/ for App previews)
└─ reports/                QA reports and reviews
```

`{system-slug}` is the system name in lowercase kebab case (`Acme Design System` → `acme`). `workspace/input/` and `workspace/output/` are git-ignored, except their README files, so no brand is ever committed. Never write a build into the executor folders or into `dev/examples/`. Use another location only when the user explicitly asks for one; a finished build becomes a committed reference in `dev/examples/` only when the user asks. The Figma file itself lives in Figma.

**Design quality.** Every docs-site build is generated and checked with the [Impeccable](https://www.npmjs.com/package/impeccable) skill and its anti-AI-slop rules. Install it once per machine in this repo:

```bash
npx impeccable install --project --providers=claude -y
.claude/skills/impeccable/scripts/impeccable hooks on
```

`.claude/` is git-ignored, so the skill and its hook stay local. The shared `.impeccable/config.json` only turns the hook on and holds no brand exceptions: a build records its own in `workspace/output/{system-slug}/web/.impeccable/config.json` (`workflow/WEB.md` W7).

# 3. Non-negotiable

- Build in the order of the build sequence in `workflow/INITIATOR.md` Part B §6, for a new system and an existing one. The library comes first: every style, asset and component set is built before any doc page, so every example on a page is a real instance and no step waits on a later one. A step starts only when every step above it is done in the ledger. YOLO removes the pauses, never a step.
- A page is done only after its own page file was loaded, its QA passed and `kit/tools/figma/audit.js` reported `fail` = 0. No page is built from root files or by a generic script without its page file.
- Use the exact page tree, page names and template frames in `specs/SYSTEM.md` Part A.
- Use the naming in `specs/SYSTEM.md` Part C for tokens, styles, component sets, properties, parts and layers.
- Never merge required pages into one page.
- Never drop approved Guidelines topics, diagrams, examples, matrices, anatomy or QA.
- Page-specific requirements come from the page files, not from root-file summaries.
- A local fix does not cancel unrelated approved requirements.

# 4. Mandatory loading

What to load before and during a build is in `workflow/INITIATOR.md` Part B §0.

# Example: Syncium

Syncium is a complete example built with ds-create from one set of brand guidelines: a Figma design system (YOLO mode, every page in the tree) and its web version, made with the `workflow/WEB.md` workflow.

This example is a reference: see GOTCHAS G43.

The web version is in [`dev/examples/syncium`](dev/examples/syncium). It has the explorer site and an installable package, `@syncium/design-system`. The explorer covers:
- Getting started for designers, developers and product managers;
- searchable tokens, a changelog and status labels;
- eight foundations, each with Overview, Tokens and Guidelines;
- 29 components with a playground, every variant, anatomy, guidelines and code.

```bash
cd dev/examples/syncium
npm install
npm run dev            # explorer on http://localhost:5173/
npm run build:package  # the installable package in package/
npm run qa             # every page and tab in Light and Dark: errors, overflow, WCAG 2.2 AA
```

The example was built first, then reviewed against the standard set by mature public design systems. Its fixes were folded back into the template, `workflow/WEB.md` and the page specs. They include accessibility, contrast, foundation guidance, search, status and changelog, the package build, the QA gates and the copy voice. A new build starts from the corrected template.

**Credit.** The Syncium brand (name, logo, colors and typography) comes from the Dribbble shot [Syncium SaaS Platform Brand Guidelines](https://dribbble.com/shots/25207945-Syncium-SaaS-Platform-Brand-Guidelines). All brand rights belong to its creator. It is used here only to demonstrate ds-create.
