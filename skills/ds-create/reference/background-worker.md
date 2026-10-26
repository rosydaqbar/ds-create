# Node preparation listener · main agent

Preparation runs in the user's existing MAIN agent instance. Do not spawn a subagent, keep an AI waiter alive, create another chat, or launch an agent/IDE CLI. Node handles idle waiting. No Orca or other host-specific bridge belongs in ds-create.

## Bootstrap

After opening the selected Builder, start/reuse its portable Node daemon:

```text
node kit/tools/manager-prepare-listen.mjs start --workspace /absolute/workspace --slug saved-session
```

The launching host can provide `--notify-url http://127.0.0.1:port/host-hook` ONLY if it already exposes a supported event-to-current-chat hook. Discover/use that host capability rather than selecting a product-specific executable. Host setup belongs to the integration, not to the Builder user. Never invent a callback, configure a new agent, or fall back to idle AI polling. A Node PID proves transport only. Without a real receiver, status is receiverReady:false; report the missing current-chat wake capability honestly. Node alone cannot wake every arbitrary agent chat.

When the host exposes a code-level tool notification channel and persistent process I/O, use `node kit/tools/manager-event-relay.mjs --identity-file <session-manager>/host-relay.json`. Its `relay-ready` receipt contains the actual callback URL. Bind a code-only driver to that process: send `attach`, consume `host-prompt` JSON from stdout, enqueue each packet into the SAME conversation's tool-event channel, then send `receipt` with the exact event_id and accepted:true only after enqueue succeeds. Consume empty process waits inside the code driver without waking the model. Keep process-output wait latency below the12second receipt deadline (1second works); code-level `ping` every20seconds maintains transport liveness, not agent activity or preparation progress. Stdin closure ends the relay, and missing transport pings expire receiver readiness after70seconds. No AI heartbeat/waiting loop is needed. A session's private receipt records the driver handle for reuse.

First send a harmless `delivery-probe` through the actual callback and observe it in this main instance. Then pass the real URL to listener `start --notify-url …` (or `connect --notify-url …` for a running listener). Start with a new URL now rebinds an existing daemon rather than silently ignoring it. The relay advertises a no-model GET health check; the listener downgrades a dead transport instead of retaining a stale connected badge. If this host lacks a usable tool-event delivery channel as well as a callback, disclose the genuine limitation instead of substituting a named agent/IDE bridge.

The callback is a bounded local HTTP JSON protocol. `listener-ready` is a transport handshake; acknowledge `{accepted:true,event_id}` without invoking a model. `prepare-request` contains the stable event_id, job_id, session, workspace, request_file and scoped prompt. A host acknowledges acceptance immediately, deduplicates event_id, and schedules that prompt in the SAME main instance; it must not wait for completion before acknowledging. No model calls/agent heartbeats are made while idle. A rejected/failed delivery leaves the job queued. Accepted event identities are not replayed. An undelivered event can be sent once to a newly attached receiver binding, without creating/retrying/claiming a preparation job. Failure during one binding never triggers an idle re-prompt loop. The `next` command reads a pending event for recovery; it does not claim or execute it. Do not claim automatic delivery from a file/log or synthetic receiver test.

## On a preparation event

Use the same selected workspace/session. Read the current event using `next` if necessary. Generate one consumer UUID for this main-instance job and keep it for all commands:

```text
node kit/tools/manager-prepare-listen.mjs claim --slug saved-session --event EVENT_UUID --consumer CONSUMER_UUID
```

Claim revalidates the input snapshot, atomically owns the attempt, and creates source-pack.json through the existing preparation pipeline. Only then is the job Running. An event notification is not execution. A different consumer cannot take the active attempt; stale/cancelled events fail. Read the returned instructions and `manager-preparation.md`, then work in this instance. No Figma/build authorization is granted.

Use `progress`, `compile`, `finish` with `--data-file /absolute/command.json`. Common fields: `job_id`, `consumer_id`; progress adds `stage` and `message`; compile has no extra fields; finish adds `outcome`, `message`, optional `questions`/`coverage`. No opaque lease is exposed: Node invokes the same guarded preparation functions internally. Write decisions.json, compile, read actual acknowledgement and finish ready/questions/blocked/failed/cancelled. Keep the existing proof/source/cancel gates. A bad action leaves ownership intact for correction.

An active attempt must report actual progress within3minutes; this timeout does not apply to idle waiting. Cancellation emits a separate event and requires safe acknowledgement within60seconds; expiry is Blocked, never successful cancellation. Listener shutdown blocks incomplete owned work; process death is observed by the existing interruption checker. No automatic retry.

After finish, end the main agent turn. Leave Node waiting; do not poll, send idle heartbeats, or keep an AI/subagent waiting. `status` reports actual receiver/active-job state; `stop` stops this session's listener. The authenticated control endpoint/token remains local in a private session file and is never sent to the browser or progress feed.

Publish is separate: this daemon has ONLY preparation capability and never claims publication. Existing queued Publish approvals/claims/real Figma checks remain in `publish-mcp.md`. Do not start a Publish worker, retry a blocked/cancelled publication or run build as a side effect of preparation.
