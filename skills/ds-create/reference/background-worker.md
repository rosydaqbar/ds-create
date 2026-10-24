# Automatic Builder worker

The user opens Builder through the skill and clicks its controls. Setup and publishing must not ask them to register MCP, install a CLI, copy an instruction, or resume a chat. Assume Figma is already connected to the launching agent. Use that agent's existing tools; no separate Figma OAuth or client registration.

## Bootstrap responsibility

After opening the selected Builder, automatically ensure `kit/mcp/node_modules` exists (`npm ci --prefix kit/mcp` if absent). Start/reuse ONE native background agent in this same workspace, scoped to this session, with the instructions below. Use the host's available native background-agent facility; no agent/IDE allowlist or fixed executable. Do not launch an AI CLI from Node, inject a prompt into another terminal, change permission policies or attach another system. Native delegation must retain the existing authorized Figma tools; a fresh unauthenticated external runner is not equivalent.

The native worker runs:

```text
node kit/tools/manager-listen.mjs --workspace /absolute/workspace --slug saved-session
```

Use structured process arguments, or proper shell quoting for paths. Keep stdin open using the host's persistent terminal/process tool. Read its JSON `listening` receipt and `manager/listener.json`; reuse an existing proven worker rather than starting a duplicate. A Node listener's PID is transport liveness, not proof an agent is watching. Verify the native worker started and actually opened its listener before reporting automatic processing ready. Record the native worker handle in the session's working record so later turns can reuse it. Do not require the end user to operate this terminal.

If this host cannot keep a native agent waiting for process output, report that capability as unavailable during bootstrap. Do not claim automatic publishing works from a saved queue alone. This is a host integration limitation, not a request that the user configure MCP.

## Native worker instructions

Wait on the same persistent process for JSON events. Use bounded tool waits (at most30seconds per wait), retaining the worker between waits. Waiting itself is handled by Node; do not run repeated model prompts or start additional workers on an empty result. The user explicitly authorizes this worker to stay available for Builder events until Builder/worker is stopped. No Figma work occurs before a Publish job event.

On `event:job`, inspect `kind`, `job_id`, and the returned exact instructions. The listener has already claimed this attempt and retains its private lease. Do not call claim again or write manager-owned state. Load the actual task skill/references, then process only the selected input/session and approved scope. `kind:prepare` stops at local review/questions and has no Figma permission. `kind:publish` uses the launching agent's already-connected Figma tools and the saved user approval; never ask for the same approval, configure a new Figma client, create another file or run build.

Send newline-delimited JSON to the SAME process stdin, e.g. through its native `write_stdin` equivalent:

```json
{"action":"progress","job_id":"returned-job-id","stage":"access","message":"Checking the selected file and required font styles."}
{"action":"progress","job_id":"returned-job-id","stage":"variables","completed_stages":["access"],"message":"Fonts verified. Creating the approved variable modes and aliases."}
{"action":"finish","job_id":"returned-job-id","outcome":"blocked","message":"The approved font style is unavailable; no substitute was applied."}
```

Publication stages: access, variables, styles, verification. Preparation stages: context, decisions, foundation; do not send completed_stages for preparation. Report before relevant reads/writes and after observed results. Read each `event:ack`; an error means the action did not succeed. `cancelRequested:true` means stop safely and finish cancelled. Never expose private reasoning, credentials or raw command/tool output.

Finish preparation with questions|ready|blocked|failed|cancelled and questions where appropriate; finish publication with completed|blocked|failed|cancelled. Completion is independently verified against actual artifacts; a message cannot unlock build. Only report completed after real confirmed Figma output, export equality and passing source-bound audit. A failed/blocked result retains approved inputs and any partial output.

After a successful finish acknowledgement, return to waiting on the SAME process for the next click/answer/retry. Do not end the native agent turn as if its listener can execute Figma independently. `event:error` leaves the current job owned for correction; `listener-error`/process exit ends the connection and blocks unfinished work. No blind replay of Figma writes. To stop deliberately, send `{"action":"stop"}` or close stdin; do not claim rollback.

## Evidence

Process tests must start a real idle listener, trigger an isolated browser/API Publish event, observe receipt without a user prompt, report stages and acknowledge cancellation/blockers. UI tests cover task rows and activity, including reduced motion and mobile layout. This establishes dispatch/state behavior, not actual model decision quality or real Figma generation. Report observed native-worker availability separately from the listener PID.
