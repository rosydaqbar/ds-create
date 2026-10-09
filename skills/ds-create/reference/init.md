# `/ds-create init`

Sets up the baseline of a design system: the inputs are read, the basics are settled, and the foundations exist as variables and styles in Figma. It runs once per system. Running it again on a system that has a baseline only re-reads the inputs and reports any change.

**Init never** draws a doc page, creates the page tree or the Doc kit, builds a component, or changes a frozen value.

**Load:** the global set (`SKILL.md` §1), `input/README.md`, `workflow/QUESTIONNAIRE.md` §1, §2, §3, §9 and §10, `specs/SYSTEM.md` Part C and `specs/guidance/02-tokens.md`. For an existing file, also `workflow/INITIATOR.md` Part B §2 (*Inspect first*).

**Order.** Steps 0, 1 and 2 run before anything is asked. The first reply is always the start report (§2), and no question comes before it.

# 0. Take in what came with the command

The user never has to prepare a folder. Whatever comes with the command, or later in chat, is an input:
- **The slug.** Take the system name from the request or the pasted text (lowercase, kebab case). Ask for it only when neither gives one.
- **The folder.** Create `input/{slug}/` when it doesn't exist.
- **Pasted text** (a brief, a PRD, brand notes, a list of links): save it word for word in `input/{slug}/chat/YYYY-MM-DD.md` (`input/README.md` I3), then read it like any other input. A brief pasted in chat is the system's brief.
- **Attached files:** save each one in the folder that fits (`brief/`, `brand/`, `design-system/`, `references/`), under its own name.
- **A Figma link:** record it in the same chat file. It is the file for the readiness check.
- **Files dropped straight into `input/`,** outside any system folder: they belong to this system when `input/` holds no other system folder; otherwise ask which system they belong to. Read them where they are, and list them in `sources.md` by their path from `input/`. Never move or rename them.

# 1. Readiness check

Run every check before asking anything, and report them all together in the start report (§2). A failed check stops init until it is fixed; the report says how to fix it.

| Check | How | Fix to suggest |
| --- | --- | --- |
| Figma tools respond | `whoami` from the Figma MCP | Connect the Figma plugin and sign in |
| The file is editable | A read-only `use_figma` call on the file returns its pages | Share the file with edit access, or allow a new file |
| Brand typefaces are installed | `figma.listAvailableFontsAsync()` has every family the brand names, with the styles the type scale needs | Install the font, or choose a stand-in and record it as an answer |
| Node 20 or later | `node -v`, only when the docs site may be built | Install Node 20 or later |
| Inputs | `input/{slug}/` holds at least what came with the command (§0) | Nothing to fix: with no input at all, the questions in §3 cover it |

# 2. Read the inputs, then show the start report

List the files with `find input -type f`, never with `rg`, `fd`, Glob or Grep: git ignores `input/`, and those tools skip git-ignored files, so they show an empty folder (`workflow/GOTCHAS.md` G55). Read every file in `input/{slug}/` and every loose file in `input/` that belongs to this system (§0), then write or update `sources.md` (`input/README.md` I1, I5). List any conflict between inputs under *Open conflicts*.

Then show the start report. It is init's first reply, and the questions in §3 come after it, in the same reply or the next:

```text
Readiness
  Figma tools     {ok | fail: how to fix}
  File            {link} · {editable | read-only: how to fix} · {empty | n pages}
  Typefaces       {each family: installed | missing | none named yet}
  Node            {version | not needed yet}

Inputs (input/{slug}/)
  {file}          {what it decides, e.g. "product, users, core features"}
  …

Already answered by the inputs
  {question}      {answer}  ({source})
  …

Open conflicts    {each, or "none"}
Still open        {the questions §3 asks next}
```

# 3. Ask what is missing

Init owns these questionnaire sections. Ask only the questions the start report lists as still open. Never ask what an input already answers, and never put forward a brand value (a color, a typeface) as if it were decided: that is an AI decision in YOLO, or an option the user picks.

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

This is build step 4 of `workflow/INITIATOR.md` Part B §6. Write the ledger first (`workflow/INITIATOR.md` Part B §0): `scope` so far, `inputs`, `answers`, and `sequence` steps 1–4.

**New system.**
- Create the collections in the `specs/SYSTEM.md` Part C order:
  - Primitives first;
  - then Color, Typography, Space, Size, Shape, Border and Motion, aliasing the primitives where Part C says so.
- Create the text styles and the effect styles.
- Set scopes and code syntax on every variable.
- Every value comes from the brand inputs and the answers; a value the inputs don't give is an AI decision in YOLO, or a question otherwise.

**Existing file.**
- Read every collection, variable, mode and style, and freeze every value: init never changes a value.
- Map the file's names to the ds-create grammar, and list each rename it proposes. Apply a rename only when the user approves it. In YOLO, names are kept.
- Record the frozen state in `output/{slug}/figma/figma-variables.json` (`workflow/WEB.md` W2 explains the export).

**Check.** `kit/tools/figma-audit.js` in file mode reports `fail` = 0 for the variables and styles. Otherwise list the approved exceptions in the ledger (`auditExceptions`). Then mark steps 1–4 `done` in the ledger.

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
