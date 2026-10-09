# Input

Everything the user provides for a design system goes here: product briefs, brand guidelines, the existing design system, references, and what the user says in chat. This folder is the ground truth a build starts from. `workflow/QUESTIONNAIRE.md` is answered from it first, and every later step reads it again.

Nothing in this folder is committed except this file: `.gitignore` ignores `input/*`. Brand content stays here and in `output/`, never in the executor (`README.md` §5).

**For the user.**
- You don't have to set anything up. Paste your brief or attach files when you run `/ds-create init`, and the agent creates `input/{your-system}/` and saves them there.
- If you'd rather prepare it yourself, make a folder named after your system (`input/acme/`) and drop in what you have: a PRD or brief in `brief/`, brand guidelines in `brand/`, your current design system in `design-system/`, and anything you like in `references/`. You don't need every folder, and you don't need to rename your files.
- Anything you tell the agent in chat is saved in `chat/` for you.
- When you teach the agent a lasting rule about your system, for example "buttons align left, it's in our brand guidelines", it is kept in `knowledge/`, applied to what is already built, and followed in every later build. You can also write or edit those files yourself (I7).
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
   │  └─ components/{id}-{name}/   references for one page, attached in a build round (for example components/2.1-button/)
   ├─ answers/                 the answers to the ds-create skill's questions, one file per round (written by the agent)
   ├─ knowledge/               the system's standing rules, taught by the user over time (I7, §4)
   │  ├─ system.md             rules for the whole system
   │  └─ {id}-{name}.md        rules for one page, with the page's id and name (2.1-button.md, 1.1-color.md)
   └─ chat/                    what the user said in chat, captured by the agent: one file per date, YYYY-MM-DD.md
```

- The user adds files to `brief/`, `brand/`, `design-system/` and `references/`, in any format the agent can read: Markdown, text, PDF, images, office documents, exported JSON, or a file of links.
- The agent writes `sources.md`, `answers/`, `knowledge/` and `chat/`. It also creates the system's folder when there is none, and saves files the user attaches in chat into the folder that fits (`skills/ds-create/reference/init.md` §0). It never edits, renames or deletes a file the user added.
- `knowledge/` is shared: the user may write or edit it, and the agent adds entries and updates their status. Neither side deletes an entry: a rule that no longer holds is replaced (I7).
- `answers/` holds the gates of a build: `01-init.md` for `/ds-create init`, then `02-build-YYYY-MM-DD.md` and so on, one per `/ds-create build` round. Every answer says who decided it (the user, or the AI in YOLO with its reason) and which steps it opens. The format is in `skills/ds-create/SKILL.md` §3.
- A folder with nothing to put in it is left out.

# 2. Rules

**I1. Read the inputs before asking.**
- List the files with `find input -type f`. Git ignores this folder, so `rg`, `fd`, Glob and Grep skip every file in it and show it empty (`workflow/GOTCHAS.md` G55).
- A file the user drops straight into `input/`, outside any system folder, is an input of the system being built when there is only one; otherwise ask which system it belongs to. It is read where it is and listed in `sources.md` by its path from `input/`.
- What the user pastes or attaches with a command is an input too. It is saved into `input/{slug}/` first (`chat/` for pasted text, the fitting folder for files), creating the folder when needed, and read with the rest.
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
1. The latest explicit instruction from the user (`chat/`), and the standing rules in `knowledge/`. When a newer instruction contradicts a rule, the rule is replaced (I7), so the two never disagree.
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

**I7. Keep what the user teaches as knowledge, and follow it everywhere.** This is the system's own knowledge. The repo's `knowledge/` folder is different: the reasoning behind the specs, with examples, for every system (`knowledge/README.md`). It never overrides anything.
- **What goes in.** A lasting rule about this system that the user states, in any session and at any time, including after the design is finished: how a component looks or behaves, how a page reads, a brand constraint, a naming habit. A one-off request ("move this frame") is not knowledge; it stays in `chat/` only.
- **Where.** In the file of the page it is about (`knowledge/2.1-button.md`), or in `knowledge/system.md` when it holds across the system. A rule that touches several pages lives in one file and names the others under *Applies to*.
- **When.** In the same turn the user says it, together with its `chat/` entry (I3).
- **Precedence.** For this system, a knowledge rule overrides the repo's defaults: the page specs, the templates and the fast-mode manifests. It never changes the repo. When the rule breaks a hard requirement (a contrast minimum, a gate, a frozen value), say so with the fact, and apply it only after the user confirms. The confirmation is recorded on the entry and, for an audit check, as an approved exception (`INITIATOR.md` Part B, *Gates*).
- **Apply it now.** When a rule arrives after its pages are built, update them in the same round: the Figma components and doc frames, the page's copy file, and the docs site when it exists. Then run that page's own checks again (its audit and the copy check). The entry's *Status* says what changed. A rule for a page that isn't built yet stays `pending` until the page's step.
- **Read it before every page.** Every build, rebuild or edit of a page reads `knowledge/system.md` and the page's own file first, and follows them over the spec (`INITIATOR.md` Part B §0).
- **Change, never delete.** A rule that changes is replaced. Its entry stays, marked `Replaced by K{n}`, and the new entry says `Replaces K{m}`.
- **Never generalize on your own.** Knowledge belongs to one system. It is never copied into the repo's specs, templates or tools, nor used for another system. When the maintainer asks to make a rule part of ds-create for every system, it is rewritten without the brand and added to the spec; the entry then points to it.

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

## Knowledge

| File | Rules | Pending |
| --- | --- | --- |
| knowledge/system.md | 2 | 0 |
| knowledge/2.1-button.md | 1 | 0 |

## Open conflicts

- {input A} says …, {input B} says …; raised on YYYY-MM-DD, waiting for the user.
```

A file the agent cannot read (a font binary, a locked PDF) is listed with `not readable: {reason}` in *What it decides*.

# 4. Knowledge files

One file per page, plus `system.md`. Entries are numbered across the whole folder (`K1`, `K2`, …), never renumbered and never reused.

```markdown
# Knowledge · {page id and name, or System}

## K{n} · {the rule in a few words}
Rule: {what must be true, in plain words that a designer can check}
Why: {the user's reason, or "not given"}
Source: {user | user file} · chat/YYYY-MM-DD.md
Applies to: {this page, and any other pages or the docs site}
Status: {pending | applied YYYY-MM-DD: what changed, where | replaced by K{m}}
Confirmed: {only for a rule that breaks a hard requirement: what it breaks, and the date the user confirmed}
Replaces: {K{m} | —}
```

For example:

```markdown
## K3 · Buttons align to the start edge
Rule: Buttons and button groups align to the start (left) edge of their container, never centered or right-aligned, including in dialogs and forms.
Why: brand guidelines
Source: user · chat/YYYY-MM-DD.md
Applies to: 2.1 Button, 3.1 Button group, every Layout with actions, docs site
Status: applied YYYY-MM-DD: Button group default Align=start; Guidelines "Placement" topic rewritten (Figma and site); 4 Layout examples realigned
Replaces: —
```

