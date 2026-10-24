# Publish with DS Create MCP

Publish is a local MCP workflow usable by any compatible client. It does not launch Codex, inject prompts into terminals or require native background subagents. The host agent uses its own configured Figma authoring tools. The same server also handles local preparation and questions; read `reference/agent-mcp.md` for that workflow. No agent/provider/IDE allowlist or selection is required.

## Already-running background worker

`init-web` attaches the native background worker through `reference/background-worker.md`. The listener keeps this MCP connection open internally. Figma is already connected to the launching agent. A Publish click queues its exact saved approval; the listener takes it and delivers instructions to the waiting worker without user MCP setup or another chat message. No separate Figma OAuth/client registration is needed. Never confuse a Node process waiting for events with the native agent that executes Figma tools.

The numbered operations below are the listener's internal protocol, not end-user instructions. Integrations can still use the same standard tools. The user sees publication task rows, current public activity, elapsed time and actual blockers.

1. Call `ds_create_publish_status` with the stable output/session id, not inputSlug or display name.
2. Call `ds_create_publish` with that session (optional wait_seconds). It atomically claims one queued approved request and returns job_id, attempt, opaque lease, exact hash/revision/target and instructions. If another connection owns it, do no work. Repeating on the same connection reuses its existing lease; it cannot duplicate a second owner. No queued request returns Waiting, not approval or success.
3. Read the actual ds-create skill, `reference/init.md`, `workflow/MANAGER.md` and all references required for the current init stage. Read only this request's explicit selected input tree and system knowledge. Follow returned instructions: preserve approved bytes, naming, frozen values and target; no build, new file, component/docs generation, font substitutes, browser workaround or global permission changes. Read applicable Figma skills before their tools. Existing saved approval needs no repeat review.
4. Call `ds_create_publish_progress` with session/job_id/attempt/lease and a short human message at meaningful stages and before every Figma write. Report stage access|variables|styles|verification and completed_stages only after observing each phase result. It revalidates current inputs, source and approval. A validation error stops further writes; cancelRequested:true means stop safely and finish cancelled. Do not expose secrets/commands/private reasoning in progress.
5. Use the host's configured Figma tools to verify access/fonts read-only, inventory safely, apply only the approved foundation variables/styles, export losslessly and run the real full file audit. Never infer edit access from a successful read, or replace an unavailable font silently. A real blocker must be saved and reported promptly.
6. Call `ds_create_publish_finish` with the same credentials and outcome completed|blocked|failed|cancelled plus a concise message. Completed independently requires a confirmed export matching the approved subset, current source/input/target/approval, done ledger steps and a passing source-bound full file audit. A completion message alone cannot unlock build. Preserve historical evidence and any partial Figma output. Only then offer ds-create build; never run it automatically.

The lease belongs to this MCP connection and is not a transferable authorization. Keep it open until finishing. On disconnect, its unfinished attempt is marked blocked; inspect partial output on retry. Closing/restarting Builder does not stop the MCP client. Browser or MCP Cancel stops unclaimed work immediately; claimed work stays active until its owner observes cancellation and acknowledges it. Never claim Figma rollback.

A blocked/cancelled/failed unchanged request can be queued again from Builder using the same saved approval and a new attempt. An old lease cannot finish/update the new attempt. Changing draft/input/target requires the existing review/preparation gates. Do not fabricate readyInputHash, approval, confirmed export or audit to work around them.

## Verification boundary

The server uses the official MCP SDK. Wire tests use real SDK clients over stdio and synthetic output fixtures, including ownership, cancellation, disconnect and completion checks. These tests do not prove that every host UI/version is configured correctly or that actual Figma writes have succeeded. Report host-specific or real Figma checks as unverified until observed.
