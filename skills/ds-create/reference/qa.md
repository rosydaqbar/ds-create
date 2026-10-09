# `/ds-create qa`

Runs every audit and QA check, only because the user asked for them (`workflow/INITIATOR.md` Part B, *QA on call*). A Default-mode build runs the cheap ones (page audits, the copy check); a fast build runs none, so its pages are unchecked until a QA run covers them. Nothing is changed while checking. Fixes come after the report, and only with the user's OK.

**Load:** the global set (`SKILL.md` §1), `workflow/INITIATOR.md` Part B (*Gates*, *QA on call*), `workflow/COPY.md` §7, and `workflow/GOTCHAS.md` §1 and §4. When the site is in scope, also `workflow/WEB.md` W7 and §9 (and `workflow/APP.md` §9 for App).

# 1. Scope

Ask one question, offering the default:

> **What should QA check?**
> - Everything not checked yet, or changed since the last QA run (default; read from the ledger's `sequence` dates and `qa` list)
> - These pages: {ids}
> - A level: Foundations, Parts, Components, Sections or Layouts
> - Everything
>
> And on which surface: Figma, the site, or both (default: both when the site exists).

In YOLO, use the default.

# 2. Figma checks

Run them read-only, batched, and within the 20 KB return limit (`workflow/GOTCHAS.md` G40).

1. **Audit.** `kit/tools/figma-audit.js` on every page in scope (several pages per call), with `LIBRARY = true` for a page whose docs aren't built yet, then once in file mode (tokens: contrast, scopes, code syntax). Save each result in `output/{slug}/figma/` and in the page's ledger entry (`audit`), and compare it with the last saved one. Approved exceptions follow `workflow/INITIATOR.md` Part B, *Gates*.
2. **Spec lists.** The QA list of each page file in scope and the completion criteria of its folder file (`workflow/INITIATOR.md` Part B §8).
3. **Copy.** Run `node kit/web/scripts/build-copy.mjs --dir output/{slug}/copy --fingerprints {ids}`. Send its rows to `kit/tools/figma-copy.js` in `verify` mode, which returns only the mismatches.
4. **Set snapshots.** For each set in scope, compare the variant count in the file with its snapshot in `output/{slug}/figma/sets/`. Re-export the stale ones only after the report, if the user agrees.

# 3. Site checks

In `output/{slug}/web/`:
- `npm run qa -- --pages {ids}` for a page scope, or `npm run qa` for everything;
- add `--quick` when the user asked only for errors and overflow.

The script starts its own server and stops it (`workflow/GOTCHAS.md` G39).

**Known findings.**
- Findings in `qa-baseline.json` are known, and are shown apart from new ones.
- A new finding that a frozen value causes is added to the baseline only after the user agrees, with its reason in the ledger (`workflow/GOTCHAS.md` G38).
- Any other finding is a problem to fix.

# 4. Report

```text
Scope        {pages or level} · {Figma | site | both}
Figma        audit: {fail}/{warn} on {n} pages · spec lists: {fails} · copy: {mismatches} · snapshots: {stale}
Site         {routes} routes in {s} s · {new} new problems · {known} known
New problems {each: where, what, the likely fix}
Next         {fix these? | nothing to fix}
```

Save it to `output/{slug}/reports/qa-{YYYY-MM-DD}.md`. Add a line to the ledger's `qa` list: date, what ran, scope, result, known count.
