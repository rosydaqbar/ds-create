# Builder event delivery in the main agent

DS Create has one execution protocol: its MCP server. Preparation and publication run in the user's existing main agent. Node handles waiting through a pending tool call; it never launches an agent executable, subagent, another chat, callback daemon or vendor-specific bridge.

## Wait for Builder

After verifying Builder health, give its URL to the user in commentary for them to open and fill, then call `ds_create_wait({session})` through the connected DS Create MCP (`ds_create_prepare_wait` is the same tool under its earlier name). Keep that tool request pending for at most five minutes. Node waits without model requests and returns the next Builder event to the originating agent: `prepare-request` for Prepare foundations or saved answers, `publish-request` for Publish to Figma or Check fonts again. On `wait-expired`, end the turn without automatically rearming or polling. Builder shows a prominent disconnected panel with a short continuation prompt; saved inputs and queued jobs remain intact. Only user continuation starts another wait.

A terminal tool host can use the same Node waiter through the existing Builder entry point:

```text
node kit/manager/cli.mjs wait --workspace /absolute/workspace --slug saved-session
```

This only delivers the event. Execution still uses DS Create MCP: native tools, or the terminal host below when the session has none. The command does not claim work or provide a second execution protocol. There is no detached listener to start or control endpoint to connect.

Do not end the agent turn and promise that an ended tool request will wake an idle chat. Host cancellation or timeout detaches the receiver without claiming, retrying or deleting context. Reattach only when the user resumes through the supported tool lifecycle. If the host cannot keep a tool pending, report that limitation. Never loop the model over an empty queue.

The short-lived `preparation-wait.json` registration identifies a live pending request. Node refreshes it without AI heartbeats and removes it on response/cancellation; concurrent waits are rejected. A returned event is delivery, not execution or permanent readiness. If an event was inspected without claiming, rearm with `ds_create_wait({session, after_event: event_id})` or the terminal wait's `--after-event EVENT_UUID`. That acknowledges the exact attempt and prevents replay.

## Without DS Create MCP tools

A session that started before DS Create MCP was registered has no `ds_create_*` tools, and most hosts load MCP servers only at session start. Never ask the user to restart or reconnect. Use the terminal host, which ships with the skill:

```text
node kit/manager/cli.mjs mcp tools                                   # every tool and its input schema
node kit/manager/cli.mjs mcp ds_create_wait --json '{"session":"saved-session"}'
node kit/manager/cli.mjs mcp ds_create_prepare_finish --json-file /tmp/finish.json
```

- The first call installs `kit/mcp` dependencies when they are missing, then starts one background host per workspace (`kit/mcp/host.mjs`). The host holds one real MCP connection to `kit/mcp/server.mjs`, so every later CLI call is the same client: leases, exclusive ownership, cancellation and disconnect-blocks-unfinished-work behave exactly as with native tools.
- Each call prints the tool's structured result as JSON. A tool error goes to stderr with exit code 1.
- Run a pending wait as a foreground terminal command with a tool timeout above five minutes (for example 330000 ms). Killing the command cancels that wait on the host, as a host timeout would.
- Keep one path per claimed attempt: a job claimed through the terminal host can only be progressed and finished through it, and a job claimed natively only through native tools.
- `node kit/manager/cli.mjs mcp-host status|stop` inspects or stops the host. Stopping it, or two idle hours with no call, closes the connection and blocks any unfinished attempt it owns.

## Execute the event

For `prepare-request`, call `ds_create_prepare({session})` on the same MCP connection. Its exclusive attempt/lease claim revalidates the input snapshot and creates the source pack. Only a successful claim makes preparation Running. Read its returned instructions and `manager-preparation.md`; use `ds_create_prepare_progress`, `ds_create_prepare_compile` and `ds_create_prepare_finish` with the returned credentials. Questions and answers remain in Builder. No preparation event authorizes Figma or build.

Keep the owning MCP connection open until finishing. Respect cancellation before further work and acknowledge it through finish. Disconnect or owner process death blocks unfinished work; a retry requires an explicit new attempt. Never fabricate a successful result, cancel another owner's work, or replay blocked/cancelled/completed jobs.

For `publish-request`, call `ds_create_publish({session, execution:"stepped"})` and follow `publish-mcp.md`. The event only delivers the user's own Publish click; it never creates approval, and preparation never claims Publish or runs build.

## Wait again after finishing

After preparation finishes `ready` or `questions`, or publication ends `needs-fonts`, call `ds_create_wait` once more so the user's next click in Builder (answers, Publish, Check fonts again or a font choice) reaches the same agent. The same five-minute limit applies; on `wait-expired`, end the turn. When the user gave the decision in chat, trigger the action yourself (`cli.mjs publish | retry | fonts`, `SKILL.md` rule 15) and claim it in the same turn. A queued request with no pending wait shows the continuation prompt in Builder: the agent status panel for preparation, the Publish dialog for publication. Both prompts resume with `ds-create init-web --slug {session}`.
