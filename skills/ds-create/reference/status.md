# `/ds-create status`

Read-only. Shows where a system stands, from its ledger and its answers files. It makes no Figma calls and changes nothing.

**Load:** `workspace/output/{slug}/ds-create-ledger.json`, the files in `workspace/input/{slug}/answers/`, `workspace/input/{slug}/sources.md`, and the files in `workspace/input/{slug}/knowledge/`.

**Report:**

```text
System       {name} ({slug}) · {Web | App | Web and App} · {new system | existing file}
Figma        {link}
DS Create Builder   {running URL from manager/runtime.json and verified /api/health | not running; start command}
Foundations  {local draft revision; pending review | approved, waiting for Figma | synced | invalid; or legacy Figma export}
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

Without a ledger, say so, and suggest `/ds-create init`. When `workspace/input/` holds several systems, show one line per system.

Read Manager availability with `node kit/manager/cli.mjs status --slug {slug}`; it checks the saved local instance and makes no Figma calls. Never report a saved URL as running without its health check. Suggest `node kit/manager/cli.mjs start --slug {slug}` when it is stopped.

Use the status command's current `source` and `initDone` fields for local drafts; old done steps alone are insufficient after draft changes. Pending review: ask the builder to review the saved revision; approved but not synced: resume init for Figma. Never infer approval from browser controller changes.

When a Builder Publish job exists, read manager/figma-job.json and that job's status.json for queued/running/blocked/failed/cancelled state. A job exit alone is not init completion: verify current source/hash, saved Figma output and audit. Next is Publish to Figma (resume init) until verified, then ds-create build.
