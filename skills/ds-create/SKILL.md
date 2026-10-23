---
name: ds-create
description: Builds a design system in Figma, and optionally its documentation site, with the ds-create repo. Use when the user wants to open the Builder first (init-web), start a design system (init), set up its tokens, build its documentation pages, Parts, Components, Sections or Layouts (build), teach it a lasting rule about the system that later builds must follow (learn), check a build (qa), or see how far a build is (status). Triggers on "ds-create", "design system for {brand}", "start the DS", "build the Button page", "run QA on the DS", "where is the DS build", "remember that buttons align left", "from now on the cards …".
user-invocable: true
argument-hint: "init-web · init · build · learn · qa · status"
---

# ds-create

One skill, six commands. Each command has its own reference file. Load it before doing anything else for that command.

| Command | Reference | What it does |
| --- | --- | --- |
| `init-web` | `reference/init-web.md` | Open/resume Builder (explicit session choice when saved sessions exist); collect/revise context/files and missing answers in the web, then prepare local foundations for review. |
| `init` | `reference/init.md` | Local readiness, inputs/basic choices, a foundation draft reviewed in DS Create Builder, then approved variables/styles in Figma. Settles Web or App. Ends with both links. |
| `build` | `reference/build.md` | Four gate questions (engine, how far, where, pace), then builds exactly those pages. |
| `learn` | `reference/learn.md` | Keeps a rule the user teaches about the system in `workspace/input/{slug}/knowledge/`, and applies it to what is already built. |
| `qa` | `reference/qa.md` | The slow checks, only when the user asks, on the scope they pick. |
| `status` | `reference/status.md` | Reads the ledger: what is done, what is open, which checks haven't run. |

**Routing.**
- A `DS_CREATE_AGENT_REQUEST v1` or `DS_CREATE_AGENT_CANCEL` bridge message uses `reference/agent-bridge.md`; validate the trusted local request before acting. Publish delegates one visible native background subagent, preserving existing approval.
- When the first word is a command, load its reference and follow it. `init-web` is the web-first bootstrap; preserve explicit `--slug {slug}` / `--new` intent and its session-discovery response; follow its early-launch loading exception before the global generation set.
- With no command, run `status` and end with the next command to run.
- When the request clearly maps to one command ("set up the tokens" → `init`, "build Text field" → `build`, "check the site" → `qa`), use that command.
- When the user states a lasting rule about the system ("buttons must align left, brand guideline"), at any point and even mid-build, run `learn` for it, then carry on with what was running.

# 1. Where things are

- **The repo root** is the folder that holds `workflow/INITIATOR.md`, `specs/SYSTEM.md` and `workflow/`. Work from there.
- **Specs.** Each command's reference says which spec files to load. Always load the global set first (`workflow/INITIATOR.md` Part B §0): `README.md`, `specs/SYSTEM.md`, `workflow/INITIATOR.md`, `workflow/GOTCHAS.md`, `workflow/templates/structure.md`, and `workspace/input/{slug}/sources.md` once it exists.
- **The slug.**
  - Chat-led systems use the same slug in `workspace/input/` and `workspace/output/`. Web-first sessions keep a stable output/session ID; read `workspace/output/{session}/manager/setup.json.inputSlug` for their selected input folder. That mapping overrides `{slug}` in input paths throughout every command, including answers/knowledge/build; output paths and resume commands keep the session ID. Older sessions without inputSlug keep matching folders.
  - When `workspace/input/` holds more than one system folder, ask which one, unless the request names it.
  - With no folder yet, `init` creates it from the system name (lowercase, kebab case), and saves what came with the command in it (`reference/init.md` §0).
- **Inputs.** `workspace/input/{slug}/` holds the ground truth (`workspace/input/README.md`), with any loose file the user dropped straight into `workspace/input/` (`reference/init.md` §0). List them with `find workspace/input -type f`: git ignores `workspace/input/` and `workspace/output/`, so `rg`, `fd`, Glob and Grep show them empty (`workflow/GOTCHAS.md` G55). The user's answers go into `workspace/input/{slug}/answers/` (§3).
- **Design knowledge.** `knowledge/` at the repo root holds the reasoning behind the specs, from the maintainer's experience: rationale and examples, never rules (`knowledge/README.md`).
- **System knowledge.** `workspace/input/{slug}/knowledge/` holds the system's standing rules, taught by the user over time: `system.md`, and one file per page (`workspace/input/README.md` I7, §4).
- **Outputs.** `workspace/output/{slug}/` holds the local foundation draft (`foundations.json`), source-bound web preparation plan (`foundation-plan.json`), ledger (`ds-create-ledger.json`), the local builder's DS Create Builder (`manager/`, from init), the copy files (`copy/`), the fast-mode manifests (`fast/`), the Figma exports (`figma/`), the consumer docs site (`web/`, when selected) and reports (`reports/`).
- **Audiences.** The maintainer develops ds-create. The builder uses it to create and maintain a design system and its documentation. Consumers use the results: designers in Figma and developers in web docs. DS Create Builder is the builder's local workspace (`workflow/MANAGER.md`), including for Figma-only builds; it is separate from the consumer docs site.

# 2. Rules for every command

1. **Inputs first.** Save what the user pasted or attached into `workspace/input/{slug}/`, creating the folder when needed, then read the whole folder before asking. Ask only what the inputs leave open, and show each answer an input gives with its source (`workspace/input/README.md` I1, I2). The user never has to make the folder.
2. **The system's knowledge before the spec.** Before building, rebuilding or editing a page, read `workspace/input/{slug}/knowledge/system.md` and the page's knowledge file. Their rules override the spec, templates and manifests for that system, and never change the repo (`workspace/input/README.md` I7). The repo's `knowledge/` explains why the specs are as they are. Read a page's topics before writing its copy, and let that reasoning shape the docs in the system's own words, without ever naming or citing it. For each description: the system's knowledge and inputs first; the repo's `knowledge/` when they say nothing on the topic, as the benchmark; your own reasoning only when neither covers it (`workflow/COPY.md` §1). Use it to apply a rule with its intent or to make a call the spec leaves open, never to override a spec (`knowledge/README.md` §1).
3. **Save every answer.** Every answer to a skill question is written to `workspace/input/{slug}/answers/` in the same turn (§3). Anything else the user says that shapes the system goes to `workspace/input/{slug}/chat/` (`workspace/input/README.md` I3).
4. **YOLO.** When the user says YOLO, the AI answers the open questions itself. It writes each answer as an AI decision with a one-line reason, and doesn't stop between pages. Three things are never decided by the AI:
   - the build engine (`build` Q1): always the user's choice;
   - what the product is: one sentence from the user or an input;
   - the Figma file: a link, or permission to create one.

   YOLO never skips a check to save time. In particular, a page is drawn only after its `knowledge/` topics are read, recorded under `loaded`, and its copy passes `kit/tools/copy-guard.mjs --page` (`workflow/COPY.md` §1). This is a hard rule in YOLO and in fast mode.
5. **Gates.** `build` runs only after `init` is done, including approval and successful audited Figma generation of the current local draft. It runs only the steps its answers allow (`reference/build.md` §4). The page gates of `workflow/INITIATOR.md` Part B §6 apply to every page.
6. **QA on call.** The slow checks run only through `qa` (`workflow/INITIATOR.md` Part B, *QA on call*). The cheap ones run inside `build`: each page's own audit, the copy check at the end of a level, and `npm run build`. In fast mode the build doesn't run these either: page audits and the copy check move to `qa` too, so a fast build only generates (`workflow/INITIATOR.md` Part B §6, *Gates*, *Fast mode*). At the end of `build`, offer `qa` in one line, and never run it unasked.
7. **Figma.** Load the `figma-use` skill before the first `use_figma` call. Send one writing call at a time, and follow `workflow/GOTCHAS.md` §1.
8. **The repo stays brand-agnostic.** Brand names, file keys, product copy and knowledge rules live only in `workspace/input/`, `workspace/output/` and the Figma file (`workspace/input/README.md` I6, I7).
9. **Examples are references, never sources.**
   - `examples/` may be read to understand a pattern: how a kind of page reads, or how a visual is composed.
   - Nothing is copied from it: no sentences, manifests, page data, values or code.
   - It never replaces a step. Every page is still written from its spec, the templates and tools, this system's `workspace/input/{slug}/` and `workspace/output/{slug}/`, and its own Figma file, through the same manifest and copy-file rules.
   - Other systems' `workspace/input/` and `workspace/output/` folders are not read at all.
   - `kit/tools/fast-pack.mjs --check` refuses a copy line taken word for word from an example, and any line that names one (`workflow/GOTCHAS.md` G43).
10. **No repo edits during a build.** The specs, templates and tools are read, never changed, while `init`, `build` or `qa` runs.
   - Lessons and tool bugs go into the build notes (`workspace/output/{slug}/reports/`), and into the repo only after the round, when the maintainer asks.
   - A blocking tool bug is patched once in the file's cached copy (`workflow/FAST.md` §6), or the page falls back to the standard engine. Never loop on it.
11. **Keep going.** A context summary is not a stopping point. With YOLO or a no-stop pace, resume from the ledger and carry on; stop only at a gate, a blocker, or the end of the round.
12. **Plan guideline content before prose.** Follow `workflow/EDITORIAL.md`: verify facts, identify reader decisions, adapt topic organization and depth, then revise for redundancy. Preserve outer frames, tokens, APIs and references. New/revised pages save an internal plan checked by the existing copy guard; existing builds remain readable.
13. **Icons are Lucide.** A new system's icon library comes from `kit/tools/icons-lucide.mjs` (`specs/foundations/1.7-iconography.md` §1). Never ask which library, and never draw or map icons by hand.
14. **Report plainly.** Each command ends with a short report:
   - what was done, with links;
   - what is still open;
   - the next command to run.

# 3. The answers folder

```text
workspace/input/{slug}/answers/
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
