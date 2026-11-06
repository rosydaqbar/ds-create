---
name: ds-create
description: Builds a design system in Figma, and optionally its documentation site, in this project. Use when the user wants to open the Builder (builder), start a design system (init), build its pages (build), teach it a lasting rule (learn), check a build (qa), or see how far it is (status). Triggers on "ds-create", "design system", "open the Builder", "run QA on the DS".
user-invocable: true
argument-hint: "builder · init · build · learn · qa · status"
---

# ds-create (project)

This folder is one ds-create project. The engine is installed in `node_modules/ds-create/` at the version this project pins.

Commands:
- `builder`: open Builder and prepare the foundations.
- `init`: set up the foundations from your inputs.
- `build`: build the pages you pick.
- `learn`: keep a rule you teach about the system.
- `qa`: run the full checks.
- `status`: see what is done and what is open.

Before any command, read `node_modules/ds-create/skill/SKILL.md`, then the reference file it names for that command in `node_modules/ds-create/skill/reference/`.

The rules live in the pinned engine, so you read the version this project uses:
- `node_modules/ds-create/specs/`: what to build.
- `node_modules/ds-create/workflow/`: how to build it.

Paths in those files that say `workspace/input/{slug}/` and `workspace/output/{slug}/` mean `input/` and `output/` in this project. Run engine commands as `npx ds-create <command>`, for example `npx ds-create builder`. After an engine upgrade, run `npx ds-create migrate` and `npx ds-create skill`.
