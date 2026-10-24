# Automatic Builder worker

The user opens Builder through the skill and clicks its controls. Normal bootstrap automatically attaches the waiter; setup and publishing must not ask users to register MCP or install a CLI. Builder checks its actual connection. Only when the subagent is disconnected, Builder offers a copyable prompt to the user’s existing agent to resume/spawn one native waiter. This is recovery, not the normal init-web flow. Assume Figma is already connected to the launching agent. Use that agent's existing tools; no separate Figma OAuth or client registration.

## Bootstrap responsibility

The parent agent executing `ds-create init-web` owns bootstrap. Do this before finishing init-web:

1. Open/reuse the selected Builder and ensure `kit/mcp/node_modules` exists (`npm ci --prefix kit/mcp` if absent).
2. Directly call the current agent's own native spawn-subagent/background-task tool once, using the current workspace and model. Give it a clear project-specific Publish-worker name when the tool supports naming. Pass the selected session, the native worker instructions below and the launching agent's existing Figma tools. Start it now, even before a Figma URL exists: its first task is to wait.
3. Have that subagent start the portable listener below with stdin open, acknowledge its heartbeat, and report its actual startup receipt. The parent records the returned native subagent name/handle, verifies the listener receipt/check-in, shares the name with the user, then leaves the subagent running in the background.
4. A new preparation/Publish event wakes that same waiting subagent. It executes the received job, reports public activity/result through its native task stream and MCP, then returns to waiting. No second user prompt or new agent launch per click.

On resume, reuse this session's proven native subagent rather than creating a duplicate. The native subagent tool is the delegation mechanism; do not probe or require a separate task-browser/display API, open another chat/terminal, or launch an editor/agent CLI. A task-browser failure is not a reason to stop a healthy native worker. No provider/IDE allowlist, fixed executable, prompt injection, permission changes or new authentication belongs here. The Node command below starts only the event transport; running it alone does not spawn an agent.

The native worker runs:

```text
node kit/tools/manager-listen.mjs --workspace /absolute/workspace --slug saved-session
```

Use structured process arguments, or proper shell quoting for paths. Keep stdin open using the host's persistent terminal/process tool. Read its JSON `listening` receipt, send `{"action":"heartbeat"}` to the same stdin and require `event:ack, action:heartbeat, ready:true`, then verify `manager/listener.json.agentSeenAt`; reuse an existing proven worker rather than starting a duplicate. A Node listener's PID is transport liveness, not proof an agent is watching. Verify the native worker started, acknowledged its heartbeat and keeps checking in before reporting automatic processing ready. An alive listener process alone stays unready and cannot claim jobs. Record the native worker handle in the session's working record so later turns can reuse it. Do not require the end user to operate this terminal. The web connection strip polls GET /api/worker; connected means a live listener with a fresh native check-in. Only a confirmed disconnected result includes the scoped recovery prompt. Loading or an HTTP failure is unknown and must not offer a spawn prompt; hide and clear it on reconnect. The recovery prompt must reuse a responsive existing waiter before spawning, preserve queued approval, and never replay a blocked/cancelled Publish.

If the agent genuinely has no native subagent/background facility, cannot retain it waiting for events, or cannot expose its existing authorized tools, report that specific capability as unavailable. Do not infer this from an unrelated task-management API failure. Do not claim automatic publishing works from a saved queue alone or fall back to a named CLI/IDE launcher. This is a host integration limitation, not a request that the user configure MCP.

## Native worker instructions

Wait on the same persistent process for JSON events. Use bounded tool waits (at most30seconds per wait), retaining the worker between waits. Waiting itself is handled by Node; do not run repeated model prompts or start additional workers on an empty result. The user explicitly authorizes this worker to stay available for Builder events until Builder/worker is stopped. No Figma work occurs before a Publish job event. Send `{"action":"heartbeat"}` at startup and before/after each bounded native wait and long tool/read group, at least every45seconds. Valid progress/finish commands also renew the lease; Node never renews it for you. Consume ALL returned events, including job/cancel-requested events arriving alongside heartbeat acknowledgements. Heartbeats are connection liveness only; report actual public progress separately before/after meaningful work. A missing check-in for3minutes blocks/fences this connection and ends it; it cannot silently resume with an old lease.

On `event:job`, inspect `kind`, `job_id`, and the returned exact instructions. The listener has already claimed this attempt and retains its private lease. Do not call claim again or write manager-owned state. Load the actual task skill/references, then process only the selected input/session and approved scope. `kind:prepare` stops at local review/questions and has no Figma permission. `kind:publish` uses the launching agent's already-connected Figma tools and the saved user approval; never ask for the same approval, configure a new Figma client, create another file or run build.

Publication starts with `operation.kind: figma-preflight`, a concrete read-only Plugin API script compiled from the approved exact font faces and target. Load the Figma tool skill and execute that operation first using the existing connected tool; defer full init generation references until preflight passes. Send `{"action":"preflight","job_id":"returned-job-id","result": ACTUAL_RETURNED_OBJECT}` to the same stdin. Never replace a tool error with an invented empty result: finish blocked with the observed error. The runner validates and saves the font results. Unlisted faces are advisory: the acknowledgement retains their exact names and returns the generation continuation. Do not stop on font inventory alone, upload/install fonts or substitute another face. Write the selected font names/typography metadata, complete independent variables and effect styles, and report actual text-style write failures separately. A malformed result or tool/access error still needs its actual evidence. If it says passed:true, follow `result.next_operation.instructions` immediately on this same job and lease; do not wait for another click/claim. Passing font discovery does not prove edit access or settle frozen-value conflicts; the continuation still checks those before writes. Do not load the whole init workflow or leave a result sitting in a report instead of submitting it.

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

Startup evidence is the actual native spawn/reuse receipt plus the subagent's listener/heartbeat receipts. Report the real name/handle in the parent response so the user can identify the native background worker. Keep public job activity in its native stream; a private report is supplementary evidence, not the user's task view. Do not invent host UI navigation or claim that native-interface rendering was verified when it was not. A display issue is distinct from worker execution; preserve a working waiter while investigating it.
