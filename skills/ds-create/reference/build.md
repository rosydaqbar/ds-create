# `/ds-create build`

Asks four questions, then builds exactly the pages the answers allow, in the fixed order of `workflow/INITIATOR.md` Part B §6. Run it as often as needed: each run is one build round, and a later round adds pages to the same system.

**Load:** the global set (`SKILL.md` §1), `workflow/INITIATOR.md` (all of Part B), and `workflow/QUESTIONNAIRE.md` §4, §6, §7, §8, §10 and §11. Then, per page, the files `workflow/INITIATOR.md` Part B §0 lists for it, and the system's knowledge: `input/{slug}/knowledge/system.md` and the page's own file (`input/README.md` I7), which override the page spec and its fast-mode manifest. The repo's `knowledge/` topics for the page are read before its copy is written: they give the docs their reasoning, which is written in the system's own words and never cited (`workflow/COPY.md` §1). In fast mode, also `workflow/FAST.md`. With the docs site, also `workflow/WEB.md` (and `workflow/APP.md` for App).

# 1. Gate check

Before any question, check:
- `input/{slug}/answers/01-init.md` exists;
- the ledger marks steps 1–4 `done`;
- the platform is settled (Web, App, or Web and App).

If any is missing, stop with one line: "Init isn't done for {slug}. Run `/ds-create init` first." Then say what is missing.

Re-read the ledger. When an earlier round left a page `building` or `qa`, offer to finish it before new pages.

# 2. The four questions

Ask them in this order, one message each, or all in one message when the user prefers. Show what the inputs or an earlier round already answered.

## Q1 · Engine (always the user's choice)

> **How should the documentation pages be drawn?**
> - **Default mode.** Each page is built by its own step, following its spec. It handles unusual pages. It is slower: a full system takes a few hundred Figma calls.
> - **Fast mode.** A fixed renderer draws every page in the same skeleton, and the AI writes only the text and a short plan per page. It is much faster (about 80–100 calls for 65 pages), and you can read all the text before anything is drawn. It covers the standard page types; any other page is built in Default mode.

Rules:
- Q1 is never answered by the AI, even in YOLO. Wait for the user's choice.
- Offer Fast mode only when `kit/tools/figma-fastbuild.js` exists. Otherwise say "Fast mode isn't available in this copy of ds-create" and use Default mode.
- In fast mode, also ask: **Read all the text and page plans before anything is drawn?** This is the F2 checkpoint of `workflow/FAST.md`.

## Q2 · How far

> **What should this round cover?**
> - Foundations: the guidance pages 00–02 and 1.1–1.8
> - Up to Parts: adds 2.x
> - Up to Components: adds 3.x
> - Everything: adds Sections (4.x), Layouts (5.x) and Screens
> - Only the pages I name, for example "only Button" or "Text field and Toast"

- **Named pages.**
  - Add what they need: the Parts a page instances (`specs/parts/00-parts.md` §3, and the *Composition* section of each page file).
  - List every added page in the summary, with why it was added.
  - Foundation documentation pages are not added for a named page; the tokens from init are enough.
- **References.**
  - The user may attach designs for a page ("make the button like this"). Save each file to `input/{slug}/references/components/{id}-{kebab name}/` and list it in `sources.md`.
  - A reference is used as a method: observed, adapted and changed. It is never copied, and never named in any output.
- **Existing file.** For each page in scope that already exists, also ask its action: Keep, Audit, Improve, Refactor, Rebuild, Replace or Skip (`workflow/QUESTIONNAIRE.md` §4).
- **Documentation depth** (`workflow/QUESTIONNAIRE.md` §11): ask only when the user brings it up. The default is every extra.

## Q3 · Where

> **Figma only, or Figma and the docs site?**

The kind of site follows from init:
- Web gets the React and Tailwind site and package (`workflow/WEB.md`).
- App gets React Native previews with React Native, Swift and Kotlin code (`workflow/APP.md`).
- Web and App gets both.

The site covers the same pages as Q2. Publishing (step 22) happens only when the user asks for it.

## Q4 · Pace

> **YOLO everything, or one page at a time?** One page at a time stops after each page for your OK.

In YOLO the AI also answers Q2 and Q3 when the user left them open, as AI decisions with reasons (`SKILL.md` §2.3). Q1 stays the user's.

# 3. Summary and answers

Show the summary and wait for the user's OK. It lists:
- the engine;
- the pages in build order, with the added dependencies marked;
- the page actions on an existing file;
- the references;
- Figma only, or with the site and its kind;
- the pace;
- every AI decision.

Then:
- write `input/{slug}/answers/02-build-{YYYY-MM-DD}.md`, or the next number for a later round (`SKILL.md` §3);
- update the ledger: `answers`, `engine`, and the `sequence` entries for this round (§4);
- record each step that won't run as `skip`, with the reason taken from the answers.

# 4. How the answers gate the steps

The steps are those of `workflow/INITIATOR.md` Part B §6. Steps 1–4 belong to init.

| Answer | Steps that run | Steps skipped |
| --- | --- | --- |
| Q2 = Foundations | 5 page tree · 6 Documentation collection and Doc kit · 7–9 Cover, Getting started, Tokens · 10 foundations | 11–16 |
| Q2 = up to Parts | as above + 11 Parts | 12–16 |
| Q2 = up to Components | + 12 Components | 13–16 |
| Q2 = Everything | + 13 Sections · 14 Layouts · 15 Screens · 16 foundation examples | — |
| Q2 = named pages | 5 and 6 for those pages, then each page's own step and its dependencies | every other page |
| Q1 = Fast | steps 6–16 follow `workflow/FAST.md` | — |
| Q3 = Figma and site | 18 site setup · 19 site pages · 20 foundation and guidance site pages · 21 build and package | 22 until the user asks |
| Q3 = Figma only | — | 18–22 |
| (always) | 17 closing step: clear the plugin data | — |

Steps 5 and 6 run once per system: a later round reuses the page tree and the Doc kit, and adds only the pages it needs. A page the ledger marks `done` is not built again unless the user asks.

# 5. Build

Work through `sequence` in order, following `workflow/INITIATOR.md` Part B §6 and its gates.

For every page:
1. Write its copy file first (`workflow/COPY.md`).
2. Draw the page with the engine from Q1.
3. Check that the page's own audit reports `fail` = 0. In fast mode, also check that the manifest passes `kit/tools/fast-pack.mjs --check`.
4. Mark the page `done` in the ledger, with its evidence.

**Pace.** In YOLO, go on to the next page. One page at a time: stop after each page and report it.

**After each level.** Run the batched copy check (`workflow/COPY.md` §7). It is a cheap check, so it is part of build.

**Docs site.** With the site in scope (Q3), steps 18–21 follow `workflow/WEB.md`. `npm run build` must pass. `npm run qa` is not run here.

# 6. Report

End every round with:

```text
Built this round   {pages, each with its audit result}
Engine             {Default | Fast}; pages that fell back to Default: {list or none}
Docs site          {not in scope | built at output/{slug}/web/ (npm run dev)}
Still open         {pages not done, conflicts, spec gaps}
Decided by the AI  {each with its reason, or none}
QA                 hasn't run since these changes. Run /ds-create qa?
```

Save it to `output/{slug}/reports/build-{YYYY-MM-DD}.md`, and record anything longer than one line in `output/{slug}/reports/build-notes.md`. Add every lesson that applies to any brand to `workflow/GOTCHAS.md` (`workflow/GOTCHAS.md` §0).
