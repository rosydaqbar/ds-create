# Input

Everything the user provides for a design system goes here: product briefs, brand guidelines, the existing design system, references, and what the user says in chat. This folder is the ground truth a build starts from. `workflow/QUESTIONNAIRE.md` is answered from it first, and every later step reads it again.

Nothing in this folder is committed except this file: `.gitignore` ignores `input/*`. Brand content stays here and in `output/`, never in the executor (`README.md` §5).

**For the user.**
- Make a folder named after your system (`input/acme/`) and drop in what you have: a PRD or brief in `brief/`, brand guidelines in `brand/`, your current design system in `design-system/`, and anything you like in `references/`.
- You don't need every folder, and you don't need to rename your files.
- Anything you tell the agent in chat is saved in `chat/` for you.
- This folder ships empty: in the repo it holds only this README.

# 1. Structure

```text
input/
└─ {system-slug}/              one folder per design system, the same slug as output/{system-slug}/
   ├─ sources.md               the index: every input, what it decides, when it was read (written by the agent)
   ├─ brief/                   PRD, product brief, goals, users and tasks, scope, roadmap, research
   ├─ brand/                   brand guidelines, logo files, typefaces, color specs, tone of voice, imagery rules
   ├─ design-system/           the existing system: docs, token exports, component inventories, library and code links
   ├─ references/              reference systems and inspiration (used as a method, never copied, never named in the output)
   └─ chat/                    what the user said in chat, captured by the agent: one file per date, YYYY-MM-DD.md
```

- The user adds files to `brief/`, `brand/`, `design-system/` and `references/`, in any format the agent can read: Markdown, text, PDF, images, office documents, exported JSON, or a file of links.
- The agent writes only `sources.md` and `chat/`. It never edits, renames or deletes a file the user added.
- A folder with nothing to put in it is left out.

# 2. Rules

**I1. Read the inputs before asking.**
- At initiation (`INITIATOR.md` Part B §6, steps 1–3), read every file in `input/{slug}/` before the first question. Then write `sources.md`.
- In every later session, `sources.md` is part of the global set: read it, and open the files it points to at the steps that need them.

**I2. Answer from the inputs first.**
- Every question in `workflow/QUESTIONNAIRE.md` that an input answers is pre-filled, with its source (`brief/prd.pdf §3`, `chat/2026-10-08.md`).
- Ask the user only what the inputs leave open, or where they conflict.
- The confirmation summary (`workflow/QUESTIONNAIRE.md` §12) lists which answers came from which input.

**I3. Capture chat into the inputs, in the same turn.**
- Anything the user says in chat that shapes the system goes into `chat/YYYY-MM-DD.md`: a constraint, a decision, a correction, a preference, a review comment, or a fact about the product or brand.
- Each entry has three parts:
  1. the user's words, verbatim and in their language;
  2. one line on what it means, in English;
  3. where it applies (a page, a step, the whole build).
- Add a one-line pointer under *Decisions from chat* in `sources.md`.
- Instructions about ds-create itself (the repo, its specs, its tools) are not system inputs: they go into the repo, not here.

**I4. Resolve conflicts in this order, and show them.**
1. The latest explicit instruction from the user (`chat/`).
2. Confirmed questionnaire answers (the ledger's `scope`).
3. `brand/` for brand values, and `brief/` for product scope.
4. `design-system/` as found. When the user froze it, its values win over every other input.
5. `references/`, which are inspiration only and never decide a value.

A conflict is never resolved silently: it is listed in `sources.md` under *Open conflicts* and raised in the confirmation summary or before the step it affects.

**I5. Keep `sources.md` current.**
- Re-read a file when it changes, and update `sources.md` when files are added or removed.
- The build is not complete while a file in the folder is missing from `sources.md`, or while a conflict is still open (`INITIATOR.md` Part B §9).

**I6. Never leak inputs.**
- Brand names, product copy, file keys and links from the inputs appear only in the Figma file, in `output/{slug}/` and in this folder.
- References are never named in any output.
- A link the user marks private, such as a working Figma file, is never published on the docs site (`GOTCHAS.md` G28).

# 3. `sources.md`

```markdown
# Sources · {System name}

Slug: {slug} · Last read: YYYY-MM-DD

## Files

| File | Kind | What it decides | Read |
| --- | --- | --- | --- |
| brief/prd.pdf | PRD | product scope, platforms, primary users | YYYY-MM-DD |
| brand/guidelines.pdf | Brand guidelines | palette, typefaces, logo use, tone of voice | YYYY-MM-DD |

## Links

| Link | What it is | Private |
| --- | --- | --- |
| https://www.figma.com/design/… | the working Figma file | yes |

## Decisions from chat

- YYYY-MM-DD · {one line} (chat/YYYY-MM-DD.md)

## Open conflicts

- {input A} says …, {input B} says …; raised on YYYY-MM-DD, waiting for the user.
```

A file the agent cannot read (a font binary, a locked PDF) is listed with `not readable: {reason}` in *What it decides*.
