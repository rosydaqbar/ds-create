---
name: ds-create
description: Builds a design system in Figma, and optionally its documentation site, with the ds-create repo. Use when the user wants to start a design system (init), set up its tokens, build its documentation pages, Parts, Components, Sections or Layouts (build), check a build (qa), or see how far a build is (status). Triggers on "ds-create", "design system for {brand}", "start the DS", "build the Button page", "run QA on the DS", "where is the DS build".
user-invocable: true
argument-hint: "init · build · qa · status"
---

# ds-create

One skill, four commands. Each command has its own reference file. Load it before doing anything else for that command.

| Command | Reference | What it does |
| --- | --- | --- |
| `init` | `reference/init.md` | Readiness check, inputs, the basic questions, the foundations as variables and styles. Settles Web or App. Ends with a report. |
| `build` | `reference/build.md` | Four gate questions (engine, how far, where, pace), then builds exactly those pages. |
| `qa` | `reference/qa.md` | The slow checks, only when the user asks, on the scope they pick. |
| `status` | `reference/status.md` | Reads the ledger: what is done, what is open, which checks haven't run. |

**Routing.**
- When the first word is a command, load its reference and follow it.
- With no command, run `status` and end with the next command to run.
- When the request clearly maps to one command ("set up the tokens" → `init`, "build Text field" → `build`, "check the site" → `qa`), use that command.

# 1. Where things are

- **The repo root** is the folder that holds `INITIATOR.md`, `SYSTEM.md` and `workflow/`. Work from there.
- **Specs.** Each command's reference says which spec files to load. Always load the global set first (`INITIATOR.md` Part B §0): `README.md`, `SYSTEM.md`, `INITIATOR.md`, `GOTCHAS.md`, `templates/structure.md`, and `input/{slug}/sources.md` once it exists.
- **The slug.**
  - The system's slug is its folder name in `input/` and `output/`.
  - When `input/` holds more than one system folder, ask which one, unless the request names it.
  - With no folder yet, `init` creates it from the system name (lowercase, kebab case).
- **Inputs.** `input/{slug}/` holds the ground truth (`input/README.md`). The user's answers go into `input/{slug}/answers/` (§3).
- **Outputs.** `output/{slug}/` holds the ledger (`ds-create-ledger.json`), the copy files (`copy/`), the fast-mode manifests (`fast/`), the Figma exports (`figma/`), the docs site (`web/`) and reports (`reports/`).

# 2. Rules for every command

1. **Inputs first.** Read `input/{slug}/` before asking. Ask only what the inputs leave open, and show each answer an input gives with its source (`input/README.md` I1, I2).
2. **Save every answer.** Every answer to a skill question is written to `input/{slug}/answers/` in the same turn (§3). Anything else the user says that shapes the system goes to `input/{slug}/chat/` (`input/README.md` I3).
3. **YOLO.** When the user says YOLO, the AI answers the open questions itself. It writes each answer as an AI decision with a one-line reason, and doesn't stop between pages. Three things are never decided by the AI:
   - the build engine (`build` Q1): always the user's choice;
   - what the product is: one sentence from the user or an input;
   - the Figma file: a link, or permission to create one.
4. **Gates.** `build` runs only after `init` is done. It runs only the steps its answers allow (`reference/build.md` §4). The page gates of `INITIATOR.md` Part B §6 apply to every page.
5. **QA on call.** The slow checks run only through `qa` (`INITIATOR.md` Part B, *QA on call*). The cheap ones run inside `build`: each page's own audit, the copy check at the end of a level, and `npm run build`. At the end of `build`, offer `qa` in one line, and never run it unasked.
6. **Figma.** Load the `figma-use` skill before the first `use_figma` call. Send one writing call at a time, and follow `GOTCHAS.md` §1.
7. **The repo stays brand-agnostic.** Brand names, file keys and product copy live only in `input/`, `output/` and the Figma file (`input/README.md` I6).
8. **Examples are references, never sources.**
   - `examples/` may be read to understand a pattern: how a kind of page reads, or how a visual is composed.
   - Nothing is copied from it: no sentences, manifests, page data, values or code.
   - It never replaces a step. Every page is still written from its spec, the templates and tools, this system's `input/{slug}/` and `output/{slug}/`, and its own Figma file, through the same manifest and copy-file rules.
   - Other systems' `input/` and `output/` folders are not read at all.
   - `tools/fast-pack.mjs --check` refuses a copy line taken word for word from an example, and any line that names one (`GOTCHAS.md` G43).
9. **Report plainly.** Each command ends with a short report:
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
Gates: steps 6–16 use the standard engine
```

- When an answer changes later, append the new answer below the old one, with its date. Never delete the old one.
- `sources.md` lists every answers file under *Decisions from chat*. The ledger's `answers` field points to them.
