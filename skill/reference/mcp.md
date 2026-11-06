# DS Create MCP protocol

DS Create Builder communicates with an agent through standard MCP tools. It does not choose an agent, provider, model, IDE, binary or native-subagent framework. Any local compatible MCP client can use the same tools. Client authentication, model choice, permissions, skill loading and tool registration belong to that client. The MCP server itself does not run an LLM. Preparation needs authorized read/write access to the selected local workspace; publication additionally needs configured Figma authoring tools. These are capabilities, not a list of supported agent products. If a capability is missing, report a precise blocker rather than choosing a different agent or installing one.

DS Create has one execution protocol: its MCP server. Preparation and publication run in the user's existing main agent. Node handles waiting through a pending tool call; it never launches an agent executable, subagent, another chat, callback daemon or vendor-specific bridge.

## Event delivery

### Wait for Builder

After verifying Builder health, give its URL to the user in commentary for them to open and fill, then call `ds_create_wait({session})` through the connected DS Create MCP. Keep that tool request pending for at most five minutes. Node waits without model requests and returns the next Builder event to the originating agent: `prepare-request` for Prepare foundations or saved answers, `publish-request` for Publish to Figma or Check fonts again. On `wait-expired`, end the turn without automatically rearming or polling. Builder shows a prominent disconnected panel with a short continuation prompt; saved inputs and queued jobs remain intact. Only user continuation starts another wait.

A terminal tool host can use the same Node waiter through the existing Builder entry point:

```text
node kit/builder/cli.mjs wait --workspace /absolute/workspace --slug saved-session
```

This only delivers the event. Execution still uses DS Create MCP: native tools, or the terminal host below when the session has none. The command does not claim work or provide a second execution protocol. There is no detached listener to start or control endpoint to connect.

Do not end the agent turn and promise that an ended tool request will wake an idle chat. Host cancellation or timeout detaches the receiver without claiming, retrying or deleting context. Reattach only when the user resumes through the supported tool lifecycle. If the host cannot keep a tool pending, report that limitation. Never loop the model over an empty queue.

The short-lived `preparation-wait.json` registration identifies a live pending request. Node refreshes it without AI heartbeats and removes it on response/cancellation; concurrent waits are rejected. A returned event is delivery, not execution or permanent readiness. If an event was inspected without claiming, rearm with `ds_create_wait({session, after_event: event_id})` or the terminal wait's `--after-event EVENT_UUID`. That acknowledges the exact attempt and prevents replay.

A live pending request and an owned Running attempt are distinct from a Node PID.

### Without DS Create MCP tools

A session that started before DS Create MCP was registered has no `ds_create_*` tools, and most hosts load MCP servers only at session start. Never ask the user to restart or reconnect. Use the terminal host, which ships with the skill:

```text
node kit/builder/cli.mjs mcp tools                                   # every tool and its input schema
node kit/builder/cli.mjs mcp ds_create_wait --json '{"session":"saved-session"}'
node kit/builder/cli.mjs mcp ds_create_prepare_finish --json-file /tmp/finish.json
```

- The first call installs `kit/mcp` dependencies when they are missing, then starts one background host per workspace (`kit/mcp/host.mjs`). The host holds one real MCP connection to `kit/mcp/server.mjs`, so every later CLI call is the same client: leases, exclusive ownership, cancellation and disconnect-blocks-unfinished-work behave exactly as with native tools.
- Each call prints the tool's structured result as JSON. A tool error goes to stderr with exit code 1.
- Run a pending wait as a foreground terminal command with a tool timeout above five minutes (for example 330000 ms). Killing the command cancels that wait on the host, as a host timeout would.
- Keep one path per claimed attempt: a job claimed through the terminal host can only be progressed and finished through it, and a job claimed natively only through native tools.
- `node kit/builder/cli.mjs mcp-host status|stop` inspects or stops the host. Stopping it, or two idle hours with no call, closes the connection and blocks any unfinished attempt it owns.

### Execute the event

For `prepare-request`, call `ds_create_prepare({session})` on the same MCP connection. Its exclusive attempt/lease claim revalidates the input snapshot and creates the source pack. Only a successful claim makes preparation Running. Read its returned instructions and `manager-preparation.md`; use `ds_create_prepare_progress`, `ds_create_prepare_compile` and `ds_create_prepare_finish` with the returned credentials. Questions and answers remain in Builder. No preparation event authorizes Figma or build.

Keep the owning MCP connection open until finishing. Respect cancellation before further work and acknowledge it through finish. Disconnect or owner process death blocks unfinished work; a retry requires an explicit new attempt. Never fabricate a successful result, cancel another owner's work, or replay blocked/cancelled/completed jobs.

For `publish-request`, call `ds_create_publish({session, execution:"stepped"})` and follow the Publish section below. The event only delivers the user's own Publish click; it never creates approval, and preparation never claims Publish or runs build.

### Wait again after finishing

After preparation finishes `ready` or `questions`, or publication ends `needs-fonts`, call `ds_create_wait` once more so the user's next click in Builder (answers, Publish, Check fonts again or a font choice) reaches the same agent. The same five-minute limit applies; on `wait-expired`, end the turn. When the user gave the decision in chat, trigger the action yourself (`cli.mjs publish | retry | fonts`, `SKILL.md` rule 15) and claim it in the same turn. A queued request with no pending wait shows the continuation prompt in Builder: the agent status panel for preparation, the Publish dialog for publication. Both prompts resume with `ds-create builder --slug {session}`.

Future automatic delivery requires a new pending tool request; a detached Node process cannot wake an ended chat. Source/request/proof/exclusive-owner gates remain unchanged. Verify actual delivery and claims separately from synthetic fixtures. Publication retains its separate approval and MCP lease and is never automatically retried by preparation delivery.

## Prepare

1. The user saves project name, context/files or answers in Builder. This creates an immutable selected-input snapshot/request and queues local preparation. No executable is selected or launched. Queued means Waiting for agent, not Running.
2. Call `ds_create_prepare_status` for the stable Builder session id. Use `ds_create_prepare` to claim queued work (optional bounded wait up to20seconds). It returns exact job_id, attempt, opaque connection lease, input mapping/hash/revision and scoped instructions. No queued work returns Waiting. A second connection cannot claim an owned attempt; the same connection can reuse its lease safely.
3. For preparationVersion:2, the required runtime contract is `manager-preparation.md`, the trusted request and adjacent source-pack.json; it officially replaces cross-stage init/global generation reads. Inspect any flagged source through native file/image tools or the lossless frozen importer. Follow explicit inputSlug, projectName, locked modes/platform and exact source keys. Resolve one decisions.json, then call `ds_create_prepare_compile` on the existing lease; Node expands/validates and writes canonical review artifacts. Legacy saved requests retain their original init local-stage contract. Source files remain immutable. No other system, folder rename, new Builder session, Builder restart, repo edits, uploaded-code execution, font/dependency installation, approval, components/docs or Figma tools.
4. Use `ds_create_prepare_progress` with the same session/job_id/attempt/lease before input reads/output writes and at meaningful stages. stage is context|decisions|foundation, message is a short public update. Revalidation errors stop further writes; cancelRequested:true means stop safely and finish cancelled. MCP events drive Builder Activity; no vendor-specific stdout format is required. Progress does not prove completion.
5. If design choices are missing/conflicting, call `ds_create_prepare_finish` with outcome questions and unique lowercase question ids, prompt and options (or [] for free text). Version2 requires coverage for every snapshot file, including native inspection/import notes and explicit unreadable-source evidence. Builder saves answers and queues a fresh continuation. Never ask a locked form choice again, open a chat questionnaire or silently decide unresolved brand choices absent user permission. Existing YOLO limits/frozen values remain.
6. When actual local foundation artifacts are ready, finish with outcome ready and questions:[]. The server independently checks the source-bound canonical draft/plan, alias types/modes, naming/metadata, mandatory basic motion, saved decisions/sources/report/platform and step1 done,2–4 todo with approval pending. A message or planned file cannot bypass checks. Ready means reviewable local foundations, never completed init. A new draft is reviewed before separate publication.
7. Use blocked|failed|cancelled for real blockers/failures/stops, with an actionable public message. These outcomes keep context/originals and never mark init complete. Blocked/failed/cancelled can be retried in Builder. Changed inputs require preparing the new snapshot; never fabricate readyInputHash or inputRevision.

Keep the MCP connection open until finishing. Disconnect/dead process blocks its own unfinished attempt, preserving partial artifacts. Viewer restart leaves the client alone. Cancel queued work stops immediately; a claimed owner must acknowledge cancellation. No other client's lease or old attempt can affect a continuation. Claims and outcomes are scoped to this workspace/session, never another system.

## Publish

Publish is a local MCP workflow usable by any compatible client. It does not launch Codex, inject prompts into terminals or require native background subagents. The host agent uses its own configured Figma authoring tools. The same server also handles local preparation and questions; read the Prepare section above for that workflow. No agent/provider/IDE allowlist or selection is required.

### Publication delivery and execution

Preparation delivery (Event delivery, above) never claims Publish. A Publish click, or `node kit/builder/cli.mjs publish --slug {session}` run by the agent once the user approved the revision and file in chat (`SKILL.md` rule 15), saves the exact reviewed approval and queues its MCP continuation. A pending `ds_create_wait` receives it as `publish-request` (`background-worker.md`); without one, the Publish dialog shows the continuation prompt. The host's executing agent uses its existing Figma connection and the protocol below. Preparation startup does not start an AI waiter or authorize publication, and no Node PID proves that Figma execution is ready. No separate Figma OAuth/client registration is needed.

Without `ds_create_*` tools in the session, call each `ds_create_publish*` tool below through `node kit/builder/cli.mjs mcp {tool} --json '{…}'` (*Without DS Create MCP tools*, above); the Figma writes still go through the host's own Figma tools.

The numbered operations below are the agent integration protocol, not end-user instructions. Integrations can still use the same standard tools. The user sees publication task rows, current public activity, elapsed time and actual blockers.

1. Call `ds_create_publish_status` with the stable output/session id, not inputSlug or display name.
2. Call `ds_create_publish` with that session (optional wait_seconds). Select `execution: "stepped"` for the bounded publication workflow: it receives a concrete read-only `operation` first. Execute its code through the already-connected Figma tool after loading the tool skill, then submit its actual returned object, including `alternatives`, to `ds_create_publish_preflight` with the same credentials. **The font check comes first and blocks.** If Figma cannot load an approved face, the attempt ends `needs-fonts` before any write: Builder lists the missing fonts per role (UI, display, code), explains how to make them available in Figma (an admin uploads .otf/.ttf to the team or organization; fonts installed only on the user's computer are not visible to the publishing tool), and offers replacements that Figma already has: the closest similar families and the recommended Inter, Geist and Plus Jakarta Sans. The user decides there; the agent never substitutes. Check fonts again (or the agent's `cli.mjs publish` after the user says the fonts are uploaded) queues a new attempt with the same approval. A chosen replacement (Builder, or the agent's `cli.mjs fonts --choice role=Family` for a choice made in chat) saves a user decision under `workspace/input/{slug}/chat/` and queues a typography-only preparation, then review and Publish again. A passing result returns a source-bound compiled FAST plan plus `next_operation.instructions`; execute that continuation immediately on the same lease. This bounded first operation defers generation references until they are needed. Read-only success does not establish edit permission. The legacy claim remains compatible with integrations that execute their own full init continuation. It atomically claims one queued approved request and returns job_id, attempt, opaque lease, exact hash/revision/target and instructions. If another connection owns it, do no work. Repeating on the same connection reuses its existing lease; it cannot duplicate a second owner. No queued request returns Waiting, not approval or success.
3. For a returned FAST plan read `reference/manager-fast.md` and the applicable Figma tool skill, then execute the generated approved calls. This replaces full init/spec-generation discovery for an already-approved draft. For a legacy uncompiled continuation, read the actual ds-create skill, `reference/init.md`, `workflow/MANAGER.md` and references required for that stage. Read only this request's selected inputs when its instructions require them. Follow returned instructions: preserve approved bytes, naming, frozen values and target; no build, new file, component/docs generation, font substitutes, browser workaround or global permission changes. Read applicable Figma skills before their tools. Existing saved approval needs no repeat review.
4. Call `ds_create_publish_progress` with session/job_id/attempt/lease and a short human message at meaningful stages and before every Figma write. Report stage access|variables|styles|verification and completed_stages only after observing each phase result. It revalidates current inputs, source and approval. A validation error stops further writes; cancelRequested:true means stop safely and finish cancelled. Do not expose secrets/commands/private reasoning in progress.
5. Use the host's configured Figma tools to verify access and inventory read-only, stop at the font check when an approved face is missing, apply only the approved foundation variables/styles, export losslessly and run the real full file audit. Never infer edit access from a successful read, or replace an unavailable font silently. A real blocker must be saved and reported promptly.
6. Call `ds_create_publish_finish` with the same credentials and outcome completed|blocked|failed|cancelled plus a concise message. Completed independently requires a confirmed export matching the approved subset, current source/input/target/approval, done ledger steps and a passing source-bound full file audit. A completion message alone cannot unlock build. Preserve historical evidence and any partial Figma output. Only then offer ds-create build; never run it automatically.

The lease belongs to this MCP connection and is not a transferable authorization. Keep it open until finishing. On disconnect, its unfinished attempt is marked blocked; inspect partial output on retry. Closing/restarting Builder does not stop the MCP client. Browser or MCP Cancel stops unclaimed work immediately; claimed work stays active until its owner observes cancellation and acknowledges it. Never claim Figma rollback.

A blocked/cancelled/failed unchanged request can be queued again from Builder using the same saved approval and a new attempt. An old lease cannot finish/update the new attempt. Changing draft/input/target requires the existing review/preparation gates. Do not fabricate readyInputHash, approval, confirmed export or audit to work around them.

### Verification boundary

The server uses the official MCP SDK. Wire tests use real SDK clients over stdio and synthetic output fixtures, including ownership, cancellation, disconnect and completion checks. These tests do not prove that every host UI/version is configured correctly or that actual Figma writes have succeeded. Report host-specific or real Figma checks as unverified until observed.

## Item tools

Agents read and change foundation items and Parts through DS Create MCP. Every tool takes `session` and works on the saved local files only; none of them reads or writes Figma. In a session without `ds_create_*` tools, call them through the terminal host (*Without DS Create MCP tools*, above).

| Tool | Use |
| --- | --- |
| `ds_create_items_list` | Find items by domain, collection, kind (`variable`, `textStyle`, `effectStyle`, `gridStyle`, `paintStyle`), type, name prefix or text. Values are resolved per mode. |
| `ds_create_items_get` | Read items in full, with the alias chain and `usedBy`. The name `rules` returns the editable rules. |
| `ds_create_items_change` | Save a list of ops as one revision. |
| `ds_create_items_history` · `ds_create_items_restore` | List revisions; restore one as a new revision. |
| `ds_create_items_diff` | The sync state and the local changes not yet in Figma, Part tokens included. |
| `ds_create_parts_prepare` | Compile Parts from their templates and the approved foundations. Pass the `ids` a build round needs; omit `ids` only to prepare every Part that is not current. |
| `ds_create_change_requests` | Read the user's Builder change requests; mark one `done` with the revision that applied it. |

Ops, each with `target: "foundations"`:

- `set`: one mode's `value` or `alias`, or `fields` (description, scopes, codeSyntax, style properties);
- `add`: a variable, style, collection or mode;
- `rename`: updates every alias, binding, effect color and gradient stop that points at the item;
- `delete`: refused while the item is used, unless `replaceWith` names its replacement;
- `apply` with a recipe: `radius-base {rem}`, `space-base {rem}`, `shadow-seed {seed}`, `type-family {family, role?}`, `type-scale {percent}`, `palette-ramp {family, anchors, replace?}`.

In a new system, setting a literal value on a semantic token stores it on a primitive of the same family. If no primitive holds that value, the store creates one: `radius/control` at 12 aliases `scale/radius/12`, and a hex brand color aliases `palette/custom/{hex}`.

`foundation-rules.json` records each palette family's anchors from preparation. The steps between anchors use the same OKLab interpolation as preparation. Change a palette color by changing its anchors with `palette-ramp`, or by setting an anchor step. Setting any other step breaks the ramp.

When the user asks for a change:

1. Read the items it names with `ds_create_items_list` or `ds_create_items_get`, and note the `revision`.
2. If no existing token fits, add one that follows the naming in `specs/SYSTEM.md` and tell the user what you added; wait for their approval of the new foundations before moving on. If ds-create cannot express the change, say so and propose the feature.
3. Call `ds_create_items_change` with `dryRun: true`.
4. If the result has `wide` set, or the direction can be read more than one way, show the user which items will change, which rule is affected and any contrast warnings, then wait for their answer. Resend with `confirmed: true` only after they agree.
5. Otherwise save the same ops with the same `expectedRevision`. A 409 means the draft changed meanwhile: read again and redo the change.
6. Report the new revision in one line; Builder picks it up on its own. Mark the change request `done` if the change came from one.

A change is wide when it breaks a color rule, touches more palette families than `discuss.maxFamilies`, moves more semantic tokens than `discuss.maxSemantics`, or renames or deletes a name preparation produced (`contract`). The limits are stored in `foundation-rules.json`. To change them, use `set` with `kind: "rules"`; that change always needs the user's agreement first.

### Parts

Each Part, Component and Section is a local file, `parts/{id}.json`, compiled from a brand-agnostic template. In this section, "Part" means a Part, Component or Section unless a line says otherwise. The template holds the default structure (sizes, emphases, tones, states, properties, token roles). The system's changes to that structure are stored in `inputs`. Token picks made in Builder are stored in `overrides`.

- `ds_create_items_list` with `target: "parts"` lists the Parts with their level (`parts`, `components`, `sections`) and status (`not-prepared`, `outdated`, `ready`); with `target: "part:{id}"` it lists that Part's tokens.
- `ds_create_items_get` with `target: "part:{id}"` reads its tokens; the name `part` returns the whole file.
- `ds_create_items_change` ops with `target: "part:{id}"`: `set` with `field: "inputs"` or `"overrides"` and an object `value` (merged; `null` clears it), or `apply` with `recipe: "recompile"`. One target per save.
- Button's `overrides` hold `treatments`, keyed `tone|emphasis|state` (`{"brand|primary|rest": {"effect": "elevation/raised"}}`), and `sizes`, keyed by size. The `treatments` a Button part file shows are nested tone → emphasis → state, but its overrides are not. For every other Part, `overrides` hold `map` and `measures`, keyed by set → variant (or size) → slot as in its part file. For every other Part, `overrides` also hold `tokens`, which maps one of the Part's own component tokens to the foundation role it points at (`{"badge/padding-y/sm": "space/lg"}`). Builder saves its choices to the same fields. The store rejects an override for a variant, size, slot or token the Part does not have. It also rejects a primitive token, and a token whose kind differs from the one it replaces.
- `ds_create_parts_prepare` prepares a Part only after the Parts it uses. If `ids` leaves out a Part another one uses, the error names the missing Part. Without `ids` it prepares every Part, Component and Section that is not `ready`.
- A Component or Section file records `instances` for each set, in rows keyed like its token map. Each slot names the Part, Component or same-page set it holds and the variant of that set. A property the spec does not set takes that Part's default. If an instance names a variant its Part does not have, preparing fails with a one-sentence error.
- A Part, Component or Section becomes `outdated` when a Part it uses changes its structure. The message for a wide Part change names every prepared template that uses the Part, directly or through another, and the ones that cannot be prepared again until their inputs change. After the user agrees, change those inputs, then prepare the changed Part and its users.
- On a Part's first prepare, Node drops any tone or category family that has no colors in the foundations and records that as a decision. Adding a dropped tone or category family back is a structure change.
- Adding or removing a size, emphasis, tone, state or property is wide: show the user what changes and resend with `confirmed: true` only after they agree.
- `ds_create_items_history` and `ds_create_items_restore` take the same `target`.

A foundation rename updates every Part that uses the name in the same save. Deleting a foundation item a Part uses is refused unless `replaceWith` names its replacement.

Changing, preparing or restoring Parts requires approved foundations. Every foundation save, including an Undo, clears the approval. If a Part change is refused because the approval was cleared, ask the user to approve the current foundation revision with **Approve foundations** in Builder's **Publish** dialog. Then retry the change.

Never edit `foundations.json`, `foundation-plan.json` or the `foundations/` pack by hand. The same goes for `parts/`.
