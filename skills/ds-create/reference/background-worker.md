# Automatic Builder worker

The user opens Builder through the skill and clicks its controls. Setup and publishing must not ask them to register MCP, install a CLI, copy an instruction, or resume a chat. Assume Figma is already connected to the launching agent. Use that agent's existing tools; no separate Figma OAuth or client registration.

## Bootstrap responsibility

After opening the selected Builder, automatically ensure `kit/mcp/node_modules` exists (`npm ci --prefix kit/mcp` if absent). Start/reuse ONE native background agent in this same workspace, scoped to this session, with the instructions below. Use the host's available native background-agent facility; no agent/IDE allowlist or fixed executable. Do not launch an AI CLI from Node, inject a prompt into another terminal, change permission policies or attach another system. Native delegation must retain the existing authorized Figma tools; a fresh unauthenticated external runner is not equivalent.

The worker must be visible in the launching agent's own native interface as a background task/subagent, named for the selected project. Use the native capability actually available in that host, not an editor CLI, another agent executable or an external launcher. Do not open a different terminal/chat to simulate the host's native subagent. The protocol is shared; the host supplies its own delegation and task display. A hidden internal worker, a shell watcher and a saved report are not substitutes for a task the user can inspect.

Before saying automatic processing is ready, verify the native task exists and is inspectable in that interface, then tell the user its name and the actual native place to view its activity. Keep job receipt, public tool activity, blockers and outcomes in that task's visible execution stream while it waits for subsequent Publish events. Do not invent UI navigation or a task link from a private worker ID. Reuse a proven visible worker rather than spawning another for every heartbeat or click.

The native worker runs:

```text
node kit/tools/manager-listen.mjs --workspace /absolute/workspace --slug saved-session
```

Use structured process arguments, or proper shell quoting for paths. Keep stdin open using the host's persistent terminal/process tool. Read its JSON `listening` receipt, send `{"action":"heartbeat"}` to the same stdin and require `event:ack, action:heartbeat, ready:true`, then verify `manager/listener.json.agentSeenAt`; reuse an existing proven worker rather than starting a duplicate. A Node listener's PID is transport liveness, not proof an agent is watching. Verify the native worker started, acknowledged its heartbeat and keeps checking in before reporting automatic processing ready. An alive listener process alone stays unready and cannot claim jobs. Record the native worker handle in the session's working record so later turns can reuse it. Do not require the end user to operate this terminal.

If this host cannot create/display a native background task, retain it waiting for process output, or expose the existing authorized tools to it, report that specific capability as unavailable during bootstrap. A failed native API call is not successful startup. Do not claim automatic publishing works from a saved queue alone or fall back to a named CLI/IDE launcher. This is a host integration limitation, not a request that the user configure MCP.

## Native worker instructions

Wait on the same persistent process for JSON events. Use bounded tool waits (at most30seconds per wait), retaining the worker between waits. Waiting itself is handled by Node; do not run repeated model prompts or start additional workers on an empty result. The user explicitly authorizes this worker to stay available for Builder events until Builder/worker is stopped. No Figma work occurs before a Publish job event. Send `{"action":"heartbeat"}` at startup and before/after each bounded native wait and long tool/read group, at least every45seconds. Valid progress/finish commands also renew the lease; Node never renews it for you. Consume ALL returned events, including job/cancel-requested events arriving alongside heartbeat acknowledgements. Heartbeats are connection liveness only; report actual public progress separately before/after meaningful work. A missing check-in for3minutes blocks/fences this connection and ends it; it cannot silently resume with an old lease.

On `event:job`, inspect `kind`, `job_id`, and the returned exact instructions. The listener has already claimed this attempt and retains its private lease. Do not call claim again or write manager-owned state. Load the actual task skill/references, then process only the selected input/session and approved scope. `kind:prepare` stops at local review/questions and has no Figma permission. `kind:publish` uses the launching agent's already-connected Figma tools and the saved user approval; never ask for the same approval, configure a new Figma client, create another file or run build.

Publication starts with `operation.kind: figma-preflight`, a concrete read-only Plugin API script compiled from the approved exact font faces and target. Load the Figma tool skill and execute that operation first using the existing connected tool; defer full init generation references until preflight passes. Send `{"action":"preflight","job_id":"returned-job-id","result": ACTUAL_RETURNED_OBJECT}` to the same stdin. Never replace a tool error with an invented empty result: finish blocked with the observed error. The runner validates and saves the font results. Missing faces automatically end the attempt as blocked; when its acknowledgement says status blocked, return to waiting without another finish. If it says passed:true, follow `result.next_operation.instructions` immediately on this same job and lease; do not wait for another click/claim. Passing font discovery does not prove edit access or settle frozen-value conflicts; the continuation still checks those before writes. Do not load the whole init workflow or leave a result sitting in a report instead of submitting it.

Send newline-delimited JSON to the SAME process stdin, e.g. through its native `write_stdin` equivalent:

```json
{"action":"progress","job_id":"returned-job-id","stage":"access","message":"Checking the selected file and required font styles."}
{"action":"progress","job_id":"returned-job-id","stage":"variables","completed_stages":["access"],"message":"Fonts verified. Creating the approved variable modes and aliases."}
{"action":"finish","job_id":"returned-job-id","outcome":"blocked","message":"The approved font style is unavailable; no substitute was applied."}
```

Publication stages: access, variables, styles, verification. Preparation stages: context, decisions, foundation; do not send completed_stages for preparation. Report before relevant reads/writes and after observed results. Read each `event:ack`; an error means the action did not succeed. `event:cancel-requested` or cancelRequested:true requires a prompt safe acknowledgement. If cancellation is not acknowledged within60seconds, the listener fences the attempt as blocked, not successfully cancelled; in-flight effects remain unverified. `cancelRequested:true` means stop safely and finish cancelled. Never expose private reasoning, credentials or raw command/tool output.

Finish preparation with questions|ready|blocked|failed|cancelled and questions where appropriate; finish publication with completed|blocked|failed|cancelled. Completion is independently verified against actual artifacts; a message cannot unlock build. Only report completed after real confirmed Figma output, export equality and passing source-bound audit. A failed/blocked result retains approved inputs and any partial output.

After a successful finish acknowledgement, return to waiting on the SAME process for the next click/answer/retry. Do not end the native agent turn as if its listener can execute Figma independently. `event:error` leaves the current job owned for correction; `worker-expired`, `listener-error` or process exit ends the connection and blocks unfinished work. No blind replay of Figma writes. To stop deliberately, send `{"action":"stop"}` or close stdin; do not claim rollback.

## Evidence

Process tests must start a real idle listener, trigger an isolated browser/API Publish event, observe receipt without a user prompt, report stages and acknowledge cancellation/blockers. UI tests cover task rows and activity, including reduced motion and mobile layout. This establishes dispatch/state behavior, not actual model decision quality or real Figma generation. Report observed native-worker availability separately from the listener PID.

Startup evidence includes the native task's user-visible name/location, an actual host observation of that task, and its listener/heartbeat receipts. A worker handle or heartbeat alone does not prove native-interface visibility. If visibility is unverified, keep that requirement unverified and say so; do not present background readiness as complete.
