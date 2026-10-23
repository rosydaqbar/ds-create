# Agent-agnostic Builder protocol

DS Create Builder communicates with an agent through standard MCP tools. It does not choose an agent, provider, model, IDE, binary or native-subagent framework. Any local compatible MCP client can use the same tools. Client authentication, model choice, permissions, skill loading and tool registration belong to that client. The MCP server itself does not run an LLM. Preparation needs authorized read/write access to the selected local workspace; publication additionally needs configured Figma authoring tools. These are capabilities, not a list of supported agent products. If a capability is missing, report a precise blocker rather than choosing a different agent or installing one.

## Connect

Run `npm ci --prefix kit/mcp` once in the workspace (Node20+). Register a stdio server using command `node` and arguments `["/absolute/workspace/kit/tools/ds-create-mcp.mjs", "--workspace", "/absolute/workspace"]`. Context exposes resolved connection details before the user provides any project name or foundation. Publish exposes the same details. Do not assume a universal settings filename or `mcpServers` wrapper; use the client's own registration format. Never overwrite unrelated settings or auto-approve host tools.

The older publish-mcp entry is an alias for the same full server. After an update, reconnect the client to load the new tool list. Configured Figma authoring tools are needed only for publication. Local preparation has no Figma authorization.

## Local preparation

1. The user saves project name, context/files or answers in Builder. This creates an immutable selected-input snapshot/request and queues local preparation. No executable is selected or launched. Queued means Waiting for agent, not Running.
2. Call `ds_create_prepare_status` for the stable Builder session id. Use `ds_create_prepare` to claim queued work (optional bounded wait up to20seconds). It returns exact job_id, attempt, opaque connection lease, input mapping/hash/revision and scoped instructions. No queued work returns Waiting. A second connection cannot claim an owned attempt; the same connection can reuse its lease safely.
3. Read the actual ds-create skill, init-web/init local-stage references and all references they require. Follow the trusted request's explicit inputSlug, projectName, current uploads and source snapshot. Source files are immutable during generation; only derived answers/01-init.md and sources.md may be changed. Do not use another system, rename folders, run a new init-web, restart Builder, edit repo tools, execute uploaded code, install fonts/dependencies, approve the draft, build components/docs or call Figma tools.
4. Use `ds_create_prepare_progress` with the same session/job_id/attempt/lease before input reads/output writes and at meaningful stages. stage is context|decisions|foundation, message is a short public update. Revalidation errors stop further writes; cancelRequested:true means stop safely and finish cancelled. MCP events drive Builder Activity; no vendor-specific stdout format is required. Progress does not prove completion.
5. If design choices are missing/conflicting, call `ds_create_prepare_finish` with outcome questions and unique lowercase question ids, prompt and options (or [] for free text). Builder collects/saves answers and queues a fresh continuation. Read earlier answers and current context before asking again. The agent must not open its own questionnaire or silently decide brand choices absent user permission. Existing YOLO limits and frozen values remain in force.
6. When actual local foundation artifacts are ready, finish with outcome ready and questions:[]. The server independently checks the source-bound canonical draft/plan, alias types/modes, naming/metadata, mandatory basic motion, saved decisions/sources/report/platform and step1 done,2–4 todo with approval pending. A message or planned file cannot bypass checks. Ready means reviewable local foundations, never completed init. A new draft is reviewed before separate publication.
7. Use blocked|failed|cancelled for real blockers/failures/stops, with an actionable public message. These outcomes keep context/originals and never mark init complete. Blocked/failed/cancelled can be retried in Builder. Changed inputs require preparing the new snapshot; never fabricate readyInputHash or inputRevision.

Keep the MCP connection open until finishing. Disconnect/dead process blocks its own unfinished attempt, preserving partial artifacts. Viewer restart leaves the client alone. Cancel queued work stops immediately; a claimed owner must acknowledge cancellation. No other client's lease or old attempt can affect a continuation. Claims and outcomes are scoped to this workspace/session, never another system.

## Publication

After review, the user approves the saved hash and target through Publish. Use the publication tools in `reference/publish-mcp.md`: status, claim, progress, finish, cancel. The same connection/server protocol applies; no special agent/runtime adapter is introduced. Publication uses the host's configured Figma authoring tools and independently checks confirmed export/audit before unlocking build.

## Idle clients and verification

MCP tools are client-invoked. They do not wake an idle chat or create a new agent process. Builder provides a copyable instruction and connection details; an active bounded wait can receive a new queued request. Never start endless polling without the user's request, or claim a queued/unconnected job has begun.

Wire tests use the official SDK with independent generic clients and synthetic local artifacts. They test transport/state/ownership/readiness, not the quality of generated design decisions or every possible client's UI/version. Report actual host registration, real AI generation and Figma writes as unverified until observed. Historical/simulation CLI logs remain readable, but subprocess execution is disabled for production requests.
