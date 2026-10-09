# `/ds-create status`

Read-only. Shows where a system stands, from its ledger and its answers files. It makes no Figma calls and changes nothing.

**Load:** `output/{slug}/ds-create-ledger.json`, the files in `input/{slug}/answers/`, `input/{slug}/sources.md`, and the files in `input/{slug}/knowledge/`.

**Report:**

```text
System       {name} ({slug}) · {Web | App | Web and App} · {new system | existing file}
Figma        {link}
Init         {done YYYY-MM-DD | not done}
Engine       {Default | Fast} (from the latest build round)
Library      {d}/{n} sets ready · next: {page} (the library phase runs before any doc page)
Pages        {done}/{in scope} done · building: {page} · next: {page}
             Foundations {d}/{n} · Parts {d}/{n} · Components {d}/{n} · Sections {d}/{n} · Layouts {d}/{n}
Docs site    {not in scope | {d}/{n} pages | built}
QA           last run {date, scope, result} · not run since: {pages changed after it}
Knowledge    {n} rules · {p} pending: {K-numbers and pages}
Open         {conflicts in sources.md, spec gaps, approvals waiting}
Next         {the one command to run next}
```

Without a ledger, say so, and suggest `/ds-create init`. When `input/` holds several systems, show one line per system.
