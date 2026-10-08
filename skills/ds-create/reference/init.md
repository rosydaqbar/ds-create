# `/ds-create init`

Sets up the baseline of a design system: the inputs are read, the basics are settled, and the foundations exist as variables and styles in Figma. It runs once per system. Running it again on a system that has a baseline only re-reads the inputs and reports any change.

**Init never** draws a doc page, creates the page tree or the Doc kit, builds a component, or changes a frozen value.

**Load:** the global set (`SKILL.md` §1), `input/README.md`, `workflow/QUESTIONNAIRE.md` §1, §2, §3, §9 and §10, `SYSTEM.md` Part C and `guidance/02-tokens.md`. For an existing file, also `INITIATOR.md` Part B §2 (*Inspect first*).

# 1. Readiness check

Run every check, then report them all together. A failed check stops init until it is fixed; the report says how to fix it.

| Check | How | Fix to suggest |
| --- | --- | --- |
| Figma tools respond | `whoami` from the Figma MCP | Connect the Figma plugin and sign in |
| The file is editable | A read-only `use_figma` call on the file returns its pages | Share the file with edit access, or allow a new file |
| Brand typefaces are installed | `figma.listAvailableFontsAsync()` has every family the brand names, with the styles the type scale needs | Install the font, or choose a stand-in and record it as an answer |
| Node 20 or later | `node -v`, only when the docs site may be built | Install Node 20 or later |
| Input folder | `input/{slug}/` exists | Create it; init can start with chat answers alone |

# 2. Read the inputs

Read every file in `input/{slug}/`, then write or update `sources.md` (`input/README.md` I1, I5). List any conflict between inputs under *Open conflicts*, and raise it before the questions.

# 3. Ask what is missing

Init owns these questionnaire sections. Show every question an input answers already filled in, with its source, and ask only the open ones:

| Section | What it settles |
| --- | --- |
| §1 Product | what the product is, its status, its users and tasks, its platforms |
| §2 Brand | brand maturity, brand inputs, interface character, modes, third-party providers |
| §3 Existing system inventory | existing file only: what is there (read from the file, not asked) |
| §9 Token architecture and naming | the collections, naming grammar and modes |
| §10 Output formats and product type | **Web, App, or Web and App**: this must be settled before init ends |

The user can:
- answer in chat;
- upload files into `input/{slug}/` and say so; init then reads them and asks again only what is still open;
- say YOLO: the AI answers the open questions from the inputs, each as an AI decision with its reason (`SKILL.md` §2.3).

Even with YOLO, init asks for what the product is (one sentence) and for the Figma file when no input gives them.

# 4. Confirm the basics

Show one short summary and wait for the user's OK. It lists:
- product, platform (Web, App or both), brand (typefaces, main colors, logo file);
- new system or existing file, and the Figma file link (or "create a new file");
- the token collections and modes that will exist;
- the AI decisions, each with its reason;
- for an existing file, the renames init proposes (§5).

Write the answers to `input/{slug}/answers/01-init.md` (`SKILL.md` §3).

# 5. Set up the foundations

This is build step 4 of `INITIATOR.md` Part B §6. Write the ledger first (`INITIATOR.md` Part B §0): `scope` so far, `inputs`, `answers`, and `sequence` steps 1–4.

**New system.**
- Create the collections in the `SYSTEM.md` Part C order:
  - Primitives first;
  - then Color, Typography, Space, Size, Shape, Border and Motion, aliasing the primitives where Part C says so.
- Create the text styles and the effect styles.
- Set scopes and code syntax on every variable.
- Every value comes from the brand inputs and the answers; a value the inputs don't give is an AI decision in YOLO, or a question otherwise.

**Existing file.**
- Read every collection, variable, mode and style, and freeze every value: init never changes a value.
- Map the file's names to the ds-create grammar, and list each rename it proposes. Apply a rename only when the user approves it. In YOLO, names are kept.
- Record the frozen state in `output/{slug}/figma/figma-variables.json` (`workflow/WEB.md` W2 explains the export).

**Check.** `tools/figma-audit.js` in file mode reports `fail` = 0 for the variables and styles. Otherwise list the approved exceptions in the ledger (`auditExceptions`). Then mark steps 1–4 `done` in the ledger.

# 6. Report

Show the report below, and save it to `output/{slug}/reports/init.md`:

```text
Figma file    {link}
Product       {name} · {Web | App | Web and App} · {new system | existing file}
Brand         {typefaces} · {main colors} · {logo file or "none yet"}

Foundations
  {collection}   {modes}   {n} variables   ({note, e.g. "Dark: placeholders, not supported"})
  …
  Text styles    {n}
  Effect styles  {n}

Decided by the AI (YOLO): {each decision with its reason, or "none"}
Renames: {applied, proposed and waiting, or "none"}
Not done yet: page tree, Doc kit, documentation pages, components
Next: /ds-create build
```

Init is done when the report is saved, `01-init.md` exists, the platform is settled, and ledger steps 1–4 are `done`.
