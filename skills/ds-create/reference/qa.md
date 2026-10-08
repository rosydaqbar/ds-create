# `/ds-create qa`

Runs the slow checks, only because the user asked for them (`INITIATOR.md` Part B, *QA on call*). Nothing is changed while checking. Fixes come after the report, and only with the user's OK.

**Load:** the global set (`SKILL.md` §1), `INITIATOR.md` Part B (*Gates*, *QA on call*), `workflow/COPY.md` §7, and `GOTCHAS.md` §1 and §4. When the site is in scope, also `workflow/WEB.md` W7 and §9 (and `workflow/APP.md` §9 for App).

# 1. Scope

Ask one question, offering the default:

> **What should QA check?**
> - What changed since the last QA run (default; read from the ledger's `sequence` dates and `qa` list)
> - These pages: {ids}
> - A level: Foundations, Parts, Components, Sections or Layouts
> - Everything
>
> And on which surface: Figma, the site, or both (default: both when the site exists).

In YOLO, use the default.

# 2. Figma checks

Run them read-only, batched, and within the 20 KB return limit (`GOTCHAS.md` G40).

1. **Audit.** `tools/figma-audit.js` on every page in scope (several pages per call), then once in file mode. Compare each page with its last saved result in `output/{slug}/figma/`.
2. **Copy.** Run `node web/scripts/build-copy.mjs --dir output/{slug}/copy --fingerprints {ids}`. Send its rows to `tools/figma-copy.js` in `verify` mode, which returns only the mismatches.
3. **Set snapshots.** For each set in scope, compare the variant count in the file with its snapshot in `output/{slug}/figma/sets/`. Re-export the stale ones only after the report, if the user agrees.

# 3. Site checks

In `output/{slug}/web/`:
- `npm run qa -- --pages {ids}` for a page scope, or `npm run qa` for everything;
- add `--quick` when the user asked only for errors and overflow.

The script starts its own server and stops it (`GOTCHAS.md` G39).

**Known findings.**
- Findings in `qa-baseline.json` are known, and are shown apart from new ones.
- A new finding that a frozen value causes is added to the baseline only after the user agrees, with its reason in the ledger (`GOTCHAS.md` G38).
- Any other finding is a problem to fix.

# 4. Report

```text
Scope        {pages or level} · {Figma | site | both}
Figma        audit: {fail}/{warn} on {n} pages · copy: {mismatches} · snapshots: {stale}
Site         {routes} routes in {s} s · {new} new problems · {known} known
New problems {each: where, what, the likely fix}
Next         {fix these? | nothing to fix}
```

Save it to `output/{slug}/reports/qa-{YYYY-MM-DD}.md`. Add a line to the ledger's `qa` list: date, what ran, scope, result, known count.
