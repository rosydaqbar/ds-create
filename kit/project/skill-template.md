---
name: ds-create
description: Builds this project's design system in Figma and, optionally, its documentation site. Use when the user wants to open the Builder (builder), start a design system (init), build its pages (build), save a rule for the design system (learn), check a build (qa), or check progress (status). Triggers on "ds-create", "design system", "open the Builder", "run QA on the DS".
user-invocable: true
argument-hint: "builder · init · build · learn · qa · status"
---

# ds-create (project)

This folder holds one ds-create project. The engine is installed in `node_modules/ds-create/` at the version this project pins.

Commands:
- `builder`: open Builder in the browser, add your context and prepare the foundations there.
- `init`: set up the foundations through chat, then review them in Builder.
- `build`: build the pages you pick.
- `learn`: save a rule for the design system.
- `qa`: run all QA checks.
- `status`: show completed and remaining work.

Before any command, read `node_modules/ds-create/skill/SKILL.md`, then the reference file it names for that command in `node_modules/ds-create/skill/reference/`.

Read the specs and workflow from this project's pinned engine:
- `node_modules/ds-create/specs/`: what to build.
- `node_modules/ds-create/workflow/`: how to build it.

Paths in those files that say `workspace/input/{slug}/` and `workspace/output/{slug}/` mean `input/` and `output/` in this project. Run engine commands as `npx --no ds-create <command>`, for example `npx --no ds-create builder`. After an engine upgrade, run `npx --no ds-create migrate` and `npx --no ds-create skill`.
