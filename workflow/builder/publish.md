# DS Create Builder · publish

## Publish: Figma, then build

**Publish** in the header opens a three-step panel. Each step shows Ready, Needed or Locked. A disabled action shows its reason beside the button.

1. **Foundations** shows how many foundations are ready in Builder. When the saved draft needs review, the step shows **Approve foundations**. When Figma is enabled for the session, it also shows the sync state ("Not in Figma yet", "N changes not in Figma", "In sync with Figma") and **Publish to Figma**, which opens the Figma panel below. Figma is optional. **Publish to Figma** is hidden when Figma is disabled for the session.
2. **Parts, Components & Sections** counts what is prepared at each level (for example "19 of 19 Parts · 8 of 8 Components · 2 of 2 Sections") and shows **Prepare Parts** before any Part is prepared.
3. **Build** unlocks when the foundations are approved and at least one Part is prepared. It gives a prompt to paste into the agent. The agent runs `ds-create build` using the approved foundations and prepared items. Builder never starts a build, publishes a Figma library for team use, or deploys a site.

Builder saves each change automatically. Publish uses the latest saved revision. The Figma panel shows that revision and asks for an editable Figma file URL. After approval it queues the request for DS Create MCP. Approval covers only the saved hash and Figma target shown in the panel. Earlier build records remain visible, but they do not confirm that the current revision has been rebuilt after changes.

Manager jobs use the FAST execution contract in `skill/reference/manager-fast.md`. After the approved inventory handoff, the server compiles the saved draft into source-bound collection/variable/style calls under 45,000 characters. The native agent executes fixed code plus approved data, keeps returns compact, and does not repeat brand-generation discovery or per-style retries of the same font face. This extends the batching pattern to init foundations; it does not run the documentation renderer or choose a build engine. The existing confirmed export/audit gate remains required.

The production Publish workflow uses the local DS Create MCP server (`skill/reference/mcp.md`). The main agent connects through DS Create MCP (`reference/mcp.md#event-delivery`), installing its Node dependencies when absent. One pending `ds_create_wait` tool call returns the next Builder event (Prepare or Publish) to the same agent; there is no native worker or callback daemon. Preparation, questions and publication share this protocol. The worker uses the launching agent's already-connected Figma tools; Builder selects no agent/provider/IDE executable.

Publish records its immutable click approval/request and queues it. MCP cannot wake an idle chat: a pending `ds_create_wait` receives the click as `publish-request`, and the agent claims it with ds_create_publish. With no pending wait, the Publish dialog shows the same continuation prompt as the agent status panel. Queued is labelled Waiting for agent, never Running. A valid saved draft remains retryable after a Figma failure; invalid/stale source and unfinished preparation remain blocked. The browser cannot supply executable, terminal, prompt, output path or lease. Sample data cannot be published outside isolated simulation.

Request/approval remain in manager/jobs/{id}/request.json and the ledger; status and the connection-owned attempt live in status.json and mcp-delivery.json. MCP exposes status, publish/claim, progress, finish and cancel. Claim is exclusive; a same-connection retry is idempotent, another client cannot use its lease, and old attempts cannot update/complete a new one. Progress revalidates source/input/target/approval before writes. The host agent uses its own configured Figma tools and their permissions; no global approval is changed. Missing access or required new choices remain blockers. The font check is the first, blocking step: a face Figma cannot load ends the attempt as `needs-fonts` before any write. The Publish dialog lists the missing fonts per role, how to make them available in Figma, and replacements Figma already has (closest similar families, then Inter, Geist, Plus Jakarta Sans). Check fonts again requeues with the same approval; a chosen replacement becomes a user decision and a typography-only preparation. Never upload/install or substitute fonts automatically.

Completion requires done init steps, the selected target, matching confirmed full export, current approved hash/input and figma/audit-file.json (mode:file, matching sourceHash, result.fail:0). Completion text alone cannot unlock build. A disconnected MCP client marks only its own unfinished attempt blocked, preserving partial output and approval. Viewer close/restart leaves MCP work alone. Stop cancels unclaimed queued work immediately; a claimed worker must acknowledge cancellation before build unlocks. No Figma rollback is promised. Retrying an unchanged blocked/cancelled/failed request preserves its original approval/request and assigns a new attempt; inspect partial output before continuing.

`GET /api/publish-flow` returns fresh gates/job state. Publish mutations use `POST /api/publish-figma` and `/api/publish-cancel` (web setup has its own routes below); they require same-origin localhost, JSON and a per-instance CSRF token. Other APIs/preview controls remain read-only. Concurrent requests are single-flight; stale reviewed hashes conflict instead of approving a new revision. Polling preserves the typed target. A changed draft while the modal is open requires closing/reviewing it again. Errors support Check again; closing/Escape returns focus to Publish. Clipboard failure leaves the build command selectable. Local logs are never exposed by static/API routes.

Isolated tests use guarded queue consumers or real SDK clients with synthetic workspace artifacts and mark the flow Simulation; they never invoke an AI executable or Figma. This is separate from the default installed runner and cannot be selected through browser request parameters.

### Figma generation progress

At the start of approved Figma generation set step4 `building`. Publish actual per-foundation Figma work:

```sh
node kit/builder/cli.mjs progress --slug {slug} --foundation color --status generating --message "Creating approved palette and semantic variables in Figma."
```

Foundation IDs: `color`, `typography`, `space`, `shape`, `elevation`, `motion`, `iconography`, `brand-assets`. Statuses: `pending`, `generating`, `ready`, `error`, `skipped`. These commands update only `manager/progress.json`. Local draft specimens stay inspectable during Figma work; errors and confirmed exclusions remain visible. Clear resolved error entries after recovery. In legacy export-only workspaces, progress still controls generating/ready views and ready requires exported data.

Save `figma/figma-variables.json` only from confirmed Figma writes, then update its progress entry. Reuse approved local token data for writing; no full export on each update. Planned local data is labelled as a draft and never used as evidence that a Figma write succeeded.

Manager polls approximately every 1.5 seconds, preserves the selected view and filter, and shows the latest saved draft/review state; legacy generation views replace `Generating...` with confirmed output when ready. It reads only the selected system's output. Broken or missing exports, unresolved aliases, generation errors and a lost server connection are visible states. It never invents progress percentages, tokens, modes, components, or a successful audit.

### Background delivery and publication progress

`reference/mcp.md#event-delivery` defines Builder event delivery (preparation and publication) through a pending MCP tool call, or the same waiter through `cli.mjs wait`. Node waits without model calls or AI heartbeats. The returned event resumes the same main agent, which claims and executes through MCP. There is no HTTP callback daemon or parallel terminal execution protocol. Delivery and execution remain separate. An ended tool request cannot wake an idle chat. Cancellation and disconnect preserve the saved context and require safe acknowledgement or an explicit retry.

### Executable publication preflight
The main MCP client claims execution:stepped, receiving a read-only Plugin API operation compiled from the approved draft and target. Its returned exact font/inventory result is submitted through ds_create_publish_preflight. The server validates the same approval/source/input/lease, saves the result bound to the attempt/hash, and stops as `needs-fonts`, with per-role alternatives, when an approved face cannot load. A valid inventory returns generation continuation instructions on the same job; it never implies edit access or completed init. Generation progress/completion is refused on this path until preflight passes. Cancellation wins before any continuation. Direct integrations retain their existing full-init claim protocol. This controls execution, rather than hoping a public progress message triggers the next action.

## Agent event connection and recovery

Builder reuses its existing connection strip/styles and read-only GET /api/worker. Readiness comes from a live pending Builder wait (which serves both Prepare and Publish) or the active MCP attempt's owner process. Old listener PID and heartbeat files are ignored.  A delivered event awaiting a claim has its own transient state. Disconnection exposes a scoped recovery prompt for the existing main agent; loading/HTTP failures stay unknown. Connection checks never approve, queue, retry or run build.

