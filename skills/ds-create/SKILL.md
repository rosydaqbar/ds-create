---
name: ds-create
description: Builds a design system in Figma, and optionally its documentation site, with the ds-create repo. Use when the user wants to start a design system (init), set up its tokens, build its documentation pages, Parts, Components, Sections or Layouts (build), teach it a lasting rule about the system that later builds must follow (learn), check a build (qa), or see how far a build is (status). Triggers on "ds-create", "design system for {brand}", "start the DS", "build the Button page", "run QA on the DS", "where is the DS build", "remember that buttons align left", "from now on the cards …".
user-invocable: true
argument-hint: "init · build · learn · qa · status"
---

# ds-create

One skill, five commands. Each command has its own reference file. Load it before doing anything else for that command.

| Command | Reference | What it does |
| --- | --- | --- |
| `init` | `reference/init.md` | Readiness check, inputs, the basic questions, the foundations as variables and styles. Settles Web or App. Ends with a report. |
| `build` | `reference/build.md` | Four gate questions (engine, how far, where, pace), then builds exactly those pages. |
| `learn` | `reference/learn.md` | Keeps a rule the user teaches about the system in `input/{slug}/knowledge/`, and applies it to what is already built. |
| `qa` | `reference/qa.md` | The slow checks, only when the user asks, on the scope they pick. |
| `status` | `reference/status.md` | Reads the ledger: what is done, what is open, which checks haven't run. |

**Routing.**
- When the first word is a command, load its reference and follow it.
- With no command, run `status` and end with the next command to run.
- When the request clearly maps to one command ("set up the tokens" → `init`, "build Text field" → `build`, "check the site" → `qa`), use that command.
- When the user states a lasting rule about the system ("buttons must align left, brand guideline"), at any point and even mid-build, run `learn` for it, then carry on with what was running.

# 1. Where things are

- **The repo root** is the folder that holds `workflow/INITIATOR.md`, `specs/SYSTEM.md` and `workflow/`. Work from there.
- **Specs.** Each command's reference says which spec files to load. Always load the global set first (`workflow/INITIATOR.md` Part B §0): `README.md`, `specs/SYSTEM.md`, `workflow/INITIATOR.md`, `workflow/GOTCHAS.md`, `workflow/templates/structure.md`, and `input/{slug}/sources.md` once it exists.
- **The slug.**
  - The system's slug is its folder name in `input/` and `output/`.
  - When `input/` holds more than one system folder, ask which one, unless the request names it.
  - With no folder yet, `init` creates it from the system name (lowercase, kebab case).
- **Inputs.** `input/{slug}/` holds the ground truth (`input/README.md`). The user's answers go into `input/{slug}/answers/` (§3).
- **Design knowledge.** `knowledge/` at the repo root holds the reasoning behind the specs, from the maintainer's experience: rationale and examples, never rules (`knowledge/README.md`).
- **System knowledge.** `input/{slug}/knowledge/` holds the system's standing rules, taught by the user over time: `system.md`, and one file per page (`input/README.md` I7, §4).
- **Outputs.** `output/{slug}/` holds the ledger (`ds-create-ledger.json`), the copy files (`copy/`), the fast-mode manifests (`fast/`), the Figma exports (`figma/`), the docs site (`kit/web/`) and reports (`reports/`).

# 2. Rules for every command

1. **Inputs first.** Read `input/{slug}/` before asking. Ask only what the inputs leave open, and show each answer an input gives with its source (`input/README.md` I1, I2).
2. **The system's knowledge before the spec.** Before building, rebuilding or editing a page, read `input/{slug}/knowledge/system.md` and the page's knowledge file. Their rules override the spec, templates and manifests for that system, and never change the repo (`input/README.md` I7). The repo's `knowledge/` explains why the specs are as they are. Read a page's topics before writing its copy, and let that reasoning shape the docs in the system's own words, without ever naming or citing it (`workflow/COPY.md` §1). Use it to apply a rule with its intent or to make a call the spec leaves open, never to override a spec (`knowledge/README.md` §1).
3. **Save every answer.** Every answer to a skill question is written to `input/{slug}/answers/` in the same turn (§3). Anything else the user says that shapes the system goes to `input/{slug}/chat/` (`input/README.md` I3).
4. **YOLO.** When the user says YOLO, the AI answers the open questions itself. It writes each answer as an AI decision with a one-line reason, and doesn't stop between pages. Three things are never decided by the AI:
   - the build engine (`build` Q1): always the user's choice;
   - what the product is: one sentence from the user or an input;
   - the Figma file: a link, or permission to create one.

   YOLO never skips a check to save time. In particular, a page is drawn only after its `knowledge/` topics are read, recorded under `loaded`, and its copy passes `kit/tools/copy-guard.mjs --page` (`workflow/COPY.md` §1). This is a hard rule in YOLO and in fast mode.
5. **Gates.** `build` runs only after `init` is done. It runs only the steps its answers allow (`reference/build.md` §4). The page gates of `workflow/INITIATOR.md` Part B §6 apply to every page.
6. **Generate first, QA on call.** `init` and `build` generate; they never audit. Every audit and QA check, the page audits and the copy check included, runs only through `qa`, when the user asks (`workflow/INITIATOR.md` Part B, *QA on call*). A build never stops to audit or to fix findings. At the end of `build`, say the pages haven't been checked and offer `qa` in one line; never run it unasked.
7. **Figma.** Load the `figma-use` skill before the first `use_figma` call. Send one writing call at a time, and follow `workflow/GOTCHAS.md` §1.
8. **The repo stays brand-agnostic.** Brand names, file keys, product copy and knowledge rules live only in `input/`, `output/` and the Figma file (`input/README.md` I6, I7).
9. **Examples are references, never sources.**
   - `examples/` may be read to understand a pattern: how a kind of page reads, or how a visual is composed.
   - Nothing is copied from it: no sentences, manifests, page data, values or code.
   - It never replaces a step. Every page is still written from its spec, the templates and tools, this system's `input/{slug}/` and `output/{slug}/`, and its own Figma file, through the same manifest and copy-file rules.
   - Other systems' `input/` and `output/` folders are not read at all.
   - `kit/tools/fast-pack.mjs --check` refuses a copy line taken word for word from an example, and any line that names one (`workflow/GOTCHAS.md` G43).
10. **No repo edits during a build.** The specs, templates and tools are read, never changed, while `init`, `build` or `qa` runs.
   - Lessons and tool bugs go into the build notes (`output/{slug}/reports/`), and into the repo only after the round, when the maintainer asks.
   - A blocking tool bug is patched once in the file's cached copy (`workflow/FAST.md` §6), or the page falls back to the standard engine. Never loop on it.
11. **Keep going.** A context summary is not a stopping point. With YOLO or a no-stop pace, resume from the ledger and carry on; stop only at a gate, a blocker, or the end of the round.
12. **Icons are Lucide.** A new system's icon library comes from `kit/tools/icons-lucide.mjs` (`specs/foundations/1.7-iconography.md` §1). Never ask which library, and never draw or map icons by hand.
13. **Report plainly.** Each command ends with a short report:
   - what was done, with links;
   - what is still open;
   - the next command to run.

# 3. The answers folder

```text
input/{slug}/answers/
├─ 01-init.md                  init: product, platform, brand, file, new or existing, renames, token naming
├─ 02-build-YYYY-MM-DD.md      one file per build round: engine, how far, pages, references, where, pace
└─ …
```

Each answer has the same four lines:

```markdown
## Q1 · Engine
Answer: Default mode
Decided by: user (chat/2026-10-08.md)        ← or: AI (YOLO): {one-line reason}
Gates: steps 11–20 use the standard engine
```

- When an answer changes later, append the new answer below the old one, with its date. Never delete the old one.
- `sources.md` lists every answers file under *Decisions from chat*. The ledger's `answers` field points to them.
