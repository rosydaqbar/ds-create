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

The site covers the same pages as Q2. Publishing (step 26) happens only when the user asks for it.

## Q4 · Pace

> **YOLO everything, or one page at a time?** One page at a time stops after each page for your OK.

In YOLO the AI also answers Q2 and Q3 when the user left them open, as AI decisions with reasons (`SKILL.md` §2.3). Q1 stays the user's.

# 3. Summary and answers

Show the summary and wait for the user's OK. It lists:
- the engine;
- the library steps, then the docs steps, in build order, with the added dependencies and the sets added for a page marked;
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

Every round runs the library phase before the documentation phase: the sets a page shows exist before the page is drawn.

| Answer | Steps that run | Steps skipped |
| --- | --- | --- |
| Q2 = Foundations | 5 page tree · 6 foundation styles and assets · 7–10 the sets the foundation and guidance pages show · 11 Documentation collection and Doc kit · 12–14 Cover, Getting started, Tokens · 15 foundations | the docs of Parts and later (16–20) |
| Q2 = up to Parts | as above, with every Part's sets at 7 · + 16 Parts | 17–20 |
| Q2 = up to Components | + every Component's sets at 8 · + 17 Components | 18–20 |
| Q2 = Everything | + Sections and Layouts sets at 9–10 · + 18 Sections · 19 Layouts · 20 Screens | — |
| Q2 = named pages | 5, 6 and 11 for those pages; the library steps of those pages and of every set they show or contain; then each page's docs step | every other page |
| Q1 = Fast | steps 11–20 follow `workflow/FAST.md`; steps 5–10 always use the standard engine | — |
| Q3 = Figma and site | 22 site setup · 23 site pages · 24 foundation and guidance site pages · 25 build and package | 26 until the user asks |
| Q3 = Figma only | — | 22–26 |
| (always) | 21 closing step: clear the plugin data | — |

**The sets a round needs.** Before the summary, list every set the round's doc pages show: their Overview compositions, Guidelines examples and visuals, from each page file. Every such set gets its library step in this round, even when its own docs aren't in scope (01 Getting started shows `Button` and `Text field`, so a Foundations round builds those sets and the Parts they contain). Show them in the summary as "added for {page}". Their docs steps are added in the round that documents them.

Steps 5, 6 and 11 run once per system: a later round reuses the page tree, the foundation assets and the Doc kit, and adds only the pages it needs. A step the ledger marks `done` is not run again unless the user asks.

# 5. Build

Work through `sequence` in order, following `workflow/INITIATOR.md` Part B §6 and its gates.

**Library phase (steps 5–10), standard engine.** For every set, bottom-up:
1. Build its private parts and sets from the page file, into the page's holding frames (`workflow/INITIATOR.md` Part B §6, *Figma tools*).
2. Default mode: run `kit/tools/figma-audit.js` on the page with `LIBRARY = true`; it must report `fail` = 0. Fast mode: skip it; the audit runs on call.
3. Export its sets with `kit/tools/figma-export-sets.js`.
4. Mark the library entry `done`, with its evidence.

**Documentation phase (steps 11–20).** For every page:
1. Write its copy file first (`workflow/COPY.md`).
2. Draw the page with the engine from Q1, using only sets from the snapshots.
3. Default mode: check that the page's own audit reports `fail` = 0. Fast mode: no audit; the manifest has passed `kit/tools/fast-pack.mjs --check` before the call.
4. Mark the docs entry `done` in the ledger, with its evidence.

**A missing set never stops the round.** When a page needs a set that isn't built, add its library entry before the current step, build it, record it under `decisions` and resume (`workflow/INITIATOR.md` Part B §6, *Gates*). Never draw a stand-in.

**Pace.** In YOLO, go on to the next page. One page at a time: stop after each page and report it.

**After each level.** Default mode: run the batched copy check (`workflow/COPY.md` §7). It is a cheap check, so it is part of build. Fast mode: skip it; it runs on call.

**Fast mode generates only.** A fast round never audits and never stops to fix findings, in the library phase too. Page audits, the copy check and the QA lists run through `qa`, when the user asks.

**Docs site.** With the site in scope (Q3), steps 22–25 follow `workflow/WEB.md`. `npm run build` must pass. `npm run qa` is not run here.

# 6. Report

End every round with:

```text
Built this round   {pages, each with its audit result; fast mode: not audited}
Engine             {Default | Fast}; pages that fell back to Default: {list or none}
Docs site          {not in scope | built at output/{slug}/web/ (npm run dev)}
Still open         {pages not done, conflicts, spec gaps}
Decided by the AI  {each with its reason, or none}
QA                 hasn't run since these changes{; fast mode: no page is audited yet}. Run /ds-create qa?
```

Save it to `output/{slug}/reports/build-{YYYY-MM-DD}.md`, and record anything longer than one line in `output/{slug}/reports/build-notes.md`. Add every lesson that applies to any brand to `workflow/GOTCHAS.md` (`workflow/GOTCHAS.md` §0).
