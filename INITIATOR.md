# Initiator and Generation

This is the canonical initiation and execution contract.

The questionnaire that produces the generation contract is in `workflow/QUESTIONNAIRE.md` (formerly Part A), loaded only at initiation and when an answer changes. This file is the generation logic, Part B, loaded on every step.

# Part B — Generation Decision Logic

The confirmed questionnaire becomes the generation contract.

# 0. Mandatory specification loading

Before implementation, load the complete applicable specification set.

Always load:

```text
README.md
SYSTEM.md
INITIATOR.md
GOTCHAS.md
templates/structure.md
input/{system-slug}/sources.md   once the system has a slug (input/README.md)
```

The user's inputs are the ground truth of a build: briefs, brand files, the existing system, references and what the user says in chat, all in `input/{system-slug}/` (`input/README.md`). At initiation, read every file there before the first question. In later sessions, `sources.md` points to the files a step needs. Anything the user says in chat that shapes the system is written to `input/{system-slug}/chat/` in the same turn (`input/README.md` I3).

Every page is built with `templates/structure.md`: page → frames → blocks → items. SYSTEM.md Part A gives the frames; the page file gives what they hold.

Then, per step:

- Initiation, and any change to an answer → load `workflow/QUESTIONNAIRE.md`
- Any step that draws frames the doc builder has no helper for (Doc kit, Cover, guidance pages, Foundations, Screens), or that changes the builder → load `workflow/DOCFRAMES.md`. Parts, Components, Sections and Layouts are drawn with `tools/figma-docbuilder.js` (§6, *Figma tools*)
- Fast mode chosen (`engine: "fast"` in the ledger) → load `workflow/FAST.md` from step 6 to step 16
- Writing or changing any sentence on a doc frame or a docs-site page → load `workflow/COPY.md`. The sentences live in the page's copy file, `output/{system-slug}/copy/`
- `01 Getting started` in scope → load `guidance/01-getting-started.md`
- `02 Tokens` in scope → load `guidance/02-tokens.md`
- Any Foundation selected → load `foundations/00-foundations.md` **and every selected Foundation page file**
- Any Part selected → load `parts/00-parts.md` **and every selected Part page file**
- Any Component selected → load `components/00-components.md` **and every selected Component page file**, plus `parts/00-parts.md` and the file of every Part it contains
- Any Section selected → load `sections/00-sections.md` **and every selected Section page file**, plus the folder and page files of every Component and Part it contains
- Code in scope (any product type) → load `workflow/WEB.md`, and for every page documented on the site, the same page file used for its Figma page
- Product type App or Web and App → also load `workflow/APP.md`, and for every page with an App preview, the same page file used for its Figma page

The exact page → file mapping is in `README.md`.

## Loading per step

The full specification is large (several hundred KB). Loading every page file at the start of a long run fills the context, and when it is compacted, page rules get lost. So:
- load the global set (`README.md`, `SYSTEM.md`, `INITIATOR.md`, `GOTCHAS.md`, `templates/structure.md`, and `input/{system-slug}/sources.md` once the slug exists) once at the start, and again after any context compaction or new session. `workflow/QUESTIONNAIRE.md` and `workflow/DOCFRAMES.md` are not part of it: load them at the steps that need them;
- load each folder file and page file at the generation step that builds that page (§6), not all at once. A page is built only after its own file and the files of the components it contains are loaded in the current context;
- after a page passes QA, its file can drop out of context; the ledger keeps what matters.

## Progress ledger

Keep a ledger on disk at `output/{system-slug}/ds-create-ledger.json` (README §5), even for a Figma-only build. Write it after the questionnaire and update it after every step and every page:

```text
scope            the confirmed summary (`workflow/QUESTIONNAIRE.md` §12): pages, mode, formats, product type, code
inputs           input/{system-slug}/sources.md: the date it was last read, and the input file each scope answer came from
answers[]        the answers files in input/{system-slug}/answers/, in order (01-init.md, 02-build-YYYY-MM-DD.md, …)
engine           "standard" or "fast" (the latest build round's Q1); per page, the engine that drew it
qa[]             each on-call QA run: date, what ran, scope, result, known findings (*QA on call*)
sequence[]       the build sequence (§6), written once at step 3, in the order it runs. Per entry:
                 step, page or task, status (todo, building, qa, done, skip),
                 loaded (the spec files loaded for it in the current context),
                 audit (fail, warn and the saved result file), date done,
                 note (one line at most);
                 for skip, the user decision that skipped it
step             the first entry in sequence that is not done or skip, and its page
pages[]          id, name, status (todo, building, qa, done), Figma page id, published sets with ids and variant counts, audit result (fail, warn), open issues
tokens           collections and variable counts; last check-contrast / audit result
web              per page: documented, implemented on the web (Web products), qa result
app              per page: React Native preview component, story app block with React Native, Swift and Kotlin code, qa result
decisions        anything the user decided during the run (with the date)
```

Keep the ledger to status and evidence: it is re-read after every compaction. Anything longer than one line (what changed on a page, gaps, workarounds, values kept as built) goes to `output/{system-slug}/reports/build-notes.md` under the page's id, and the entry's `note` points there.

A `sequence` entry looks like this:

```json
{ "step": 10, "page": "1.2 Typography", "status": "done",
  "loaded": ["foundations/00-foundations.md", "foundations/1.2-typography.md"],
  "audit": { "fail": 0, "warn": 1, "file": "figma/audit-1.2-typography.json" },
  "done": "YYYY-MM-DD" }
```

The ledger enforces the order:
- Before every step, and after any compaction, re-read the ledger and the global set before touching Figma.
- Start only the first entry in `sequence` that is not `done` or `skip`. Refuse any later entry, and tell the user which earlier entries are still open.
- Mark an entry `done` only with its evidence: `loaded` lists its page file, its folder file and the files of the components it contains, and `audit.fail` is 0 (§6, *Gates*).
- Never rebuild a page the ledger marks `done` unless the user asks.

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

This is step 2 of the build sequence (§6). It is read-only: nothing in Figma changes before the user confirms the summary.

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
- load each page's files at its own step (§0, *Loading per step*);
- implement every confirmed selected page continuously, in the build sequence (§6), without skipping or reordering a step;
- do not pause for per-page confirmation;
- run each page's complete QA;
- do not treat continuous execution as permission to skip documentation, matrices, states, anatomy or QA.

## One by one
- load the folder file and the page file of the active page before implementation;
- implement exactly one confirmed page;
- include only the Parts and private parts the active page depends on;
- run that page's complete QA;
- report the completed page and the remaining confirmed pages;
- stop and propose the next step in the build sequence (§6); continue when the user confirms it, or record the change they ask for (§6, *Gates*).

Do not infer or default this mode. If the user has not explicitly chosen one, ask before component implementation begins. Neither mode changes the order of the build sequence.

# 4. Page actions

## Keep
Retain the page, its public API and approved content.

## Audit
Compare against its complete loaded page file without changing anything unless the build strategy permits it.

## Improve
Preserve identity and public API; fill missing approved requirements from the complete loaded file.

## Refactor
Preserve behavior and public meaning; private anatomy may change only where its file permits.

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

# 6. Build sequence

**Who runs which steps.** The `ds-create` skill (`skills/ds-create/`) is the way in. Its commands run the steps below:
- `/ds-create init` runs steps 1–4.
- `/ds-create build` runs steps 5–21 that its four answers allow (`skills/ds-create/reference/build.md` §4), in rounds.
- `/ds-create qa` runs the on-call checks (*QA on call*).

The order, the gates and the ledger are the same whichever command runs a step.

The build is one numbered sequence. It is the only order, for a new system and for an existing one. Step 3 writes it into the ledger's `sequence` (§0, *Progress ledger*) with every step in scope, steps 1–3 already done, and the run follows it from top to bottom. Every other file that mentions order points here.

| # | Step | Load at this step | Done when |
| --- | --- | --- | --- |
| 1 | **Global set and inputs.** Read every file in `input/{system-slug}/` (`input/README.md`) and write its `sources.md` | `README.md`, `SYSTEM.md`, `INITIATOR.md`, `GOTCHAS.md`, `templates/structure.md`; at initiation also `workflow/QUESTIONNAIRE.md` and `input/README.md` | the global set is in the current context, and `sources.md` lists every input with what it decides |
| 2 | **Inventory** (existing system only). Read pages, frames, component sets and properties, variables, modes, styles and naming, and map them to the page tree (§2). Also read `input/{system-slug}/design-system/` and compare it with what the file holds. Read-only. | — | the mapping is ready for the confirmation summary. A family with no page in the tree gets the next free ID of its level and is marked *spec to write*. |
| 3 | **Confirmation** (`workflow/QUESTIONNAIRE.md` §12), with every answer the inputs give pre-filled and its source shown (`input/README.md` I2): scope, page actions, implementation mode, naming (fixed, or Keep / Normalize with the rename list), product type, code, system slug | `workflow/QUESTIONNAIRE.md` | the user confirmed; the ledger holds `scope`, `inputs` and the full `sequence`; no input conflict is open |
| 4 | **Tokens.** New system: Primitives → Color, Typography (variables and text styles), Space, Size, Shape, in the `SYSTEM.md` Part C order. Existing system: the renames on the confirmed rename list (Normalize only), then the missing tokens. Effect styles, Motion, grid styles, icons and assets are made at the step of the foundation page that owns them. | `SYSTEM.md` Part C, `guidance/02-tokens.md` | `tools/figma-audit.js` in file mode reports `fail` = 0; collections and counts are in the ledger |
| 5 | **Page tree.** Create the in-scope pages in tree order, with separators. Existing system: rename pages and move existing component sets onto their pages. Structure only: no frame is documented and no page is marked done. | `SYSTEM.md` Part A §A1–§A2 | every in-scope page exists with its exact name, in order |
| 6 | **Documentation collection** (aliases the step 4 tokens) **and 9.1 Doc kit** | `workflow/DOCFRAMES.md` §1 and §16, `templates/structure.md` §7 | the Doc kit page passes `tools/figma-audit.js`, and the doc builder is cached: `tools/figma-docbuilder.js` (two calls, `docbuilder` and `docpages`) and `tools/figma-audit.js` (one call), as its header describes |
| 7 | **00 Cover** | `SYSTEM.md` Part A §A3, `workflow/DOCFRAMES.md` | the page gate below |
| 8 | **01 Getting started** | `guidance/01-getting-started.md`, `workflow/DOCFRAMES.md` | the page gate |
| 9 | **02 Tokens** | `guidance/02-tokens.md`, `workflow/DOCFRAMES.md` | the page gate |
| 10 | **Foundations**, one step per page: 1.1 → 1.2 → … → 1.8 | `foundations/00-foundations.md`, the page file, `workflow/DOCFRAMES.md` | the page gate, except the Guidelines examples that need components: they are listed in the ledger for step 16 |
| 11 | **Parts**, one step per page, in ID order with the dependencies of `parts/00-parts.md` §3 first | `parts/00-parts.md`, the page file, the files of the Parts it instances, `tools/figma-docbuilder.js` (cached) | the page gate |
| 12 | **Components**, one step per page, in ID order | `components/00-components.md`, the page file, `parts/00-parts.md` and the files of the Parts it contains, `tools/figma-docbuilder.js` (cached) | the page gate |
| 13 | **Sections**, one step per page, in ID order | `sections/00-sections.md`, the page file, the folder and page files of the Components and Parts it contains, `tools/figma-docbuilder.js` (cached) | the page gate |
| 14 | **Layouts**, one step per page, in ID order | `layouts/00-layouts.md`, the page file, the files of the Sections and Components it contains, `tools/figma-docbuilder.js` (cached) | the page gate |
| 15 | **Screens**, one step per page, in ID order | `screens/00-screens.md`, the page file, the file of its Layout, `workflow/DOCFRAMES.md` | the page gate |
| 16 | **Foundation examples that use components** (`foundations/00-foundations.md`, *Build order*) | the foundation page file again, `workflow/DOCFRAMES.md` | every example the ledger lists for it is built from real instances, and the page audit passes again |
| 17 | **Close Figma**: clear the `dscreate` plugin data. The file-wide audit of every page runs on call (*QA on call*) | `tools/figma-audit.js` (on call) | plugin data cleared; every page's own audit is `fail` = 0 in the ledger |
| 18 | **Docs site setup**: `workflow/WEB.md` W1–W3; App: `workflow/APP.md` A1–A2 | `workflow/WEB.md`; App: `workflow/APP.md` | the exit checks of W1–W3 |
| 19 | **Docs pages**, one step per page, in ID order: `workflow/WEB.md` W4; App: `workflow/APP.md` A3 | `workflow/WEB.md` (and `workflow/APP.md`), the page file; agents working in parallel start from `templates/agent-brief.md` | `workflow/WEB.md` §9 (and `workflow/APP.md` §9) pass for the page |
| 20 | **Foundation and guidance pages, docs data**: `workflow/WEB.md` W5–W6 | `workflow/WEB.md`, the foundation and guidance files | the exit checks of W5–W6 |
| 21 | **Build and package**: `workflow/WEB.md` W7; App: `workflow/APP.md` A4. Full QA runs on call | `workflow/WEB.md`; App: `workflow/APP.md` | the exit check of W7; App: `workflow/APP.md` §9 |
| 22 | **Publish**: `workflow/WEB.md` W8 | `workflow/WEB.md` | the location is reported and the QA results are saved |

**Figma tools.** Steps 11–14 draw frames with `tools/figma-docbuilder.js`, cached once at step 6: Parts, Components and Sections use `sectionPage`, Layouts use `layoutPage`. Each page body is small and comes from the page file, and `finishPage` arranges the frames and runs the audit. Steps 6–10, 15 and 16 draw frames the builder has no helper for yet (Doc kit, Cover, guidance pages, foundation palette rows and variable tables, Screens), so they load `workflow/DOCFRAMES.md`. Load it too when changing the builder. If a call drops after about 120 s, first make a read-only call that lists the page's frames, then re-run. `use_figma` rejects return values over 20 KB, so tools return compact results and page themselves. At step 17, clear the `dscreate` plugin data on the document root.

**Page copy.** Every sentence on a page comes from its copy file, `output/{system-slug}/copy/{id}-{kebab name}.md` (`workflow/COPY.md`). Write the file before the page is drawn: the builder's page text is taken from its `both` and `figma` lines, and its node ids are added once the frames exist. The site's text comes from the `both` and `web` lines of the same file (steps 19–20). After a review, change the copy file first, then apply it to Figma with `tools/figma-copy.js`.

Which steps are in scope:
- Step 2 runs only for an existing system.
- Steps 10–15 hold only the pages in scope. A new system has no Layouts or Screens at initiation; an existing system has them when the inventory maps them. Pages added later through `workflow/EXTEND.md` get their own entry (`workflow/EXTEND.md`).
- Steps 18–22 run only when code is in scope; the App parts only for App and Web and App. Nothing native is installed or built.
- A step out of scope is written as `skip`, with the reason from the confirmed summary.

## Gates

- **One step at a time.** A step starts only when every step above it in the ledger is `done` or `skip`. Re-read the ledger before every step and start the first open one, never a later one.
- **One page per step.** Steps 7–15 and 19 each build exactly one page. A shared script may draw headers, tables or footers, but it never builds a page whose file isn't loaded, and never several pages in one step. A page made by a generic builder without its own page file is not done, whatever it looks like.
- **A page is done** only when:
  1. its page file, its folder file and the files of the components it contains were loaded in the current context, and the ledger lists them under `loaded`;
  2. its frames match `SYSTEM.md` Part A §A3: names, order, `y = 0`, the canvas gap;
  3. the page file's QA list and the folder file's completion criteria pass;
  4. `tools/figma-audit.js` on the page reports `fail` = 0, saved in `output/{system-slug}/figma/`;
  5. pages with component sets (steps 11–15): every set is exported with `tools/figma-export-sets.js` to `output/{system-slug}/figma/sets/{set-id}.json` (`:` written as `-`). Docs agents (step 19) read these files and open Figma only for screenshots;
  6. its copy file exists with the sections of its page type, and `tools/figma-copy.js` in `diff` mode reports 0 differences (`workflow/COPY.md` §7).
- **Approved exceptions.** When an audit fail can't be fixed without a change the user ruled out (for example existing values that must stay), ask the user. An approved exception is recorded in the ledger under `auditExceptions` (contrast pairs, unsupported modes, collections that aren't tokens) with the date and reason, documented on the page it belongs to (contrast pairs on 1.1 Color, an unsupported mode on 02 Tokens), and copied into the `ACCEPTED` block of `tools/figma-audit.js` for the run. The audit then reports it as `info`, not `fail`. An exception the user didn't approve is a fail.
- **Keep and Audit pages take their step too.** Load the file, compare, run the audit and record the findings. They change nothing, and they are done when the findings are recorded.
- **No spec, no page.** A page with no spec file (an existing family that isn't in the tree) gets its file first, through `workflow/EXTEND.md` steps 1–8. Then the page is built at its place in the sequence.
- **Structure early, documentation in order.** Renaming pages and moving component sets is step 5 and may come before a page's own step. Building or filling any frame of a page happens only at that page's step.
- **YOLO is pacing, not order.** YOLO everything removes the pause between pages. It never allows skipping, reordering or merging steps. One by one stops after each step and proposes the next one.
- **Only the user changes the order.** The user may skip a page, or move a page later within its level. Record it under `decisions` with the date and update `sequence`. The order of the levels never changes.
- **Out of order is a stop.** When the agent finds it skipped or reordered a step: stop, set the affected entries back to `building` (work done out of order is never `done`), record what happened under `decisions`, tell the user, and resume from the earliest open step. Work done early is checked against its page file at its own step, like any other page.

## QA on call

QA has two tiers, so a build never waits on slow checks the user didn't ask for.

**Always (part of the build, no extra wait).**
- Figma: the audit that each page call runs on its own page (`finishPage`, or `render` in fast mode); a page is done when it reports `fail` = 0 (*Gates*).
- Copy: the batched read-only check of the copy files against the frames, at the end of a level or the build (`workflow/COPY.md` §7).
- Site: `npm run build`, which runs the token, copy, effect, brand-copy and contrast checks and the type check.

**On call (only when the user asks, or before a publish they asked for).**
- `npm run qa`: every page and tab, errors, overflow, axe, design detector. Scope it with `--pages {ids}` to the pages that changed, or use `--quick` for errors and overflow only (`workflow/WEB.md` W7).
- The file-wide audit of every page (step 17), set snapshot re-checks, screenshot review passes and keyboard reviews.

Rules:
- At the end of a level or of the build, say in one line which on-call checks haven't run since the last change, and offer them. Never run them unasked.
- Record each on-call run in the ledger: `qa: [{ date, what, scope, result, known }]`.
- Findings that can't be fixed because the values are frozen go into the QA baseline (`qa-baseline.json`, `GOTCHAS.md` G38). Later runs then report only new problems.
- A component is marked **Stable** (`workflow/WEB.md` W6) only after an on-call QA run of its page.

## Progress reports

Report progress against the sequence: the step, the page and its place in the level ("Step 11 · Parts · 2.1 Button, 6 of 19, QA"), then the steps done and the next step. A level is reported as finished only when all its steps are done and no earlier step is open. A count of pages built is not progress while an earlier step is open.

Pages are created in the order of the page tree, with separators, whatever order they are built in. Every page in steps 7–15 is built with `templates/structure.md`. Do not substitute a different taxonomy, page name or frame name.

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
- a step started before every step above it in the ledger's `sequence` was `done` or `skip`, or a page was built or filled outside its own step;
- a page was produced by a generic builder without its own page file loaded;
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
3. Part, Component and Section completion criteria from their folder files when applicable (Layout and Screen criteria when they are added through EXTEND);
4. the complete QA list of every selected page file;
5. `tools/figma-audit.js` on every built page and once on the file, with `fail` = 0;
6. when code is in scope, the QA list in `workflow/WEB.md` §9 for every documented page;
7. for App and Web and App, the QA list in `workflow/APP.md` §9 for every page.

# 9. Completion rule

Do not mark generation complete until:
- the component implementation mode is resolved whenever components are in scope;
- every required specification is confirmed loaded;
- every checklist item is resolved;
- every applicable global, folder-level and page-level QA rule passes, and `tools/figma-audit.js` reports `fail` = 0 on every built page (each page's own audit; the file-wide sweep is on call);
- for App and Web and App, every in-scope page has its React Native preview and an `app` block with React Native, Swift and Kotlin code, and `workflow/APP.md` §9 passes;
- every entry of the ledger's `sequence` is `done` or `skip`, in order, and every `done` entry has its evidence (`loaded`, `audit.fail` = 0);
- `input/{system-slug}/sources.md` lists every file in the input folder, every chat instruction is captured in `chat/`, and *Open conflicts* is empty (`input/README.md` I3–I5);
- every lesson the build learned (a retry, a rollback, an audit failure or a user correction) is in `output/{slug}/reports/build-notes.md`, and each one that applies to any brand is added to `GOTCHAS.md` as its next rule (`GOTCHAS.md` §0);
- when code is in scope, `npm run build` passes (including `check:contrast`), the package installs in a fresh app (Web and Web and App), and every in-scope page passes `workflow/WEB.md` §9;
- the on-call checks that haven't run since the last change were offered to the user, and every run the user asked for is in the ledger with its result (*QA on call*).
