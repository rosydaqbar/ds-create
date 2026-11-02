# Agent-agnostic Builder protocol

DS Create Builder communicates with an agent through standard MCP tools. It does not choose an agent, provider, model, IDE, binary or native-subagent framework. Any local compatible MCP client can use the same tools. Client authentication, model choice, permissions, skill loading and tool registration belong to that client. The MCP server itself does not run an LLM. Preparation needs authorized read/write access to the selected local workspace; publication additionally needs configured Figma authoring tools. These are capabilities, not a list of supported agent products. If a capability is missing, report a precise blocker rather than choosing a different agent or installing one.

## Main-instance preparation bootstrap

`init-web` starts Builder, gives the user its URL, and holds `ds_create_wait({session})` pending through DS Create MCP (`background-worker.md`). Node waits without model requests; the tool result returns the event to the existing main agent, which claims through the same MCP protocol below. A terminal tool can run the same waiter through `manager.mjs wait`; it does not provide another execution protocol. No callback daemon, heartbeat listener, subagent or host-specific bridge is started. A live pending request and an owned Running attempt are distinct from a Node PID.

When the agent's session has no `ds_create_*` tools, it calls the same tools through `node kit/manager/cli.mjs mcp {tool}`. A background terminal host (`kit/mcp/host.mjs`) holds one real MCP client connection, so everything below applies unchanged (`background-worker.md`, *Without DS Create MCP tools*).

## Local preparation

1. The user saves project name, context/files or answers in Builder. This creates an immutable selected-input snapshot/request and queues local preparation. No executable is selected or launched. Queued means Waiting for agent, not Running.
2. Call `ds_create_prepare_status` for the stable Builder session id. Use `ds_create_prepare` to claim queued work (optional bounded wait up to20seconds). It returns exact job_id, attempt, opaque connection lease, input mapping/hash/revision and scoped instructions. No queued work returns Waiting. A second connection cannot claim an owned attempt; the same connection can reuse its lease safely.
3. For preparationVersion:2, the required runtime contract is `manager-preparation.md`, the trusted request and adjacent source-pack.json; it officially replaces cross-stage init/global generation reads. Inspect any flagged source through native file/image tools or the lossless frozen importer. Follow explicit inputSlug, projectName, locked modes/platform and exact source keys. Resolve one decisions.json, then call `ds_create_prepare_compile` on the existing lease; Node expands/validates and writes canonical review artifacts. Legacy saved requests retain their original init local-stage contract. Source files remain immutable. No other system, folder rename, new init-web, Builder restart, repo edits, uploaded-code execution, font/dependency installation, approval, components/docs or Figma tools.
4. Use `ds_create_prepare_progress` with the same session/job_id/attempt/lease before input reads/output writes and at meaningful stages. stage is context|decisions|foundation, message is a short public update. Revalidation errors stop further writes; cancelRequested:true means stop safely and finish cancelled. MCP events drive Builder Activity; no vendor-specific stdout format is required. Progress does not prove completion.
5. If design choices are missing/conflicting, call `ds_create_prepare_finish` with outcome questions and unique lowercase question ids, prompt and options (or [] for free text). Version2 requires coverage for every snapshot file, including native inspection/import notes and explicit unreadable-source evidence. Builder saves answers and queues a fresh continuation. Never ask a locked form choice again, open a chat questionnaire or silently decide unresolved brand choices absent user permission. Existing YOLO limits/frozen values remain.
6. When actual local foundation artifacts are ready, finish with outcome ready and questions:[]. The server independently checks the source-bound canonical draft/plan, alias types/modes, naming/metadata, mandatory basic motion, saved decisions/sources/report/platform and step1 done,2–4 todo with approval pending. A message or planned file cannot bypass checks. Ready means reviewable local foundations, never completed init. A new draft is reviewed before separate publication.
7. Use blocked|failed|cancelled for real blockers/failures/stops, with an actionable public message. These outcomes keep context/originals and never mark init complete. Blocked/failed/cancelled can be retried in Builder. Changed inputs require preparing the new snapshot; never fabricate readyInputHash or inputRevision.

Keep the MCP connection open until finishing. Disconnect/dead process blocks its own unfinished attempt, preserving partial artifacts. Viewer restart leaves the client alone. Cancel queued work stops immediately; a claimed owner must acknowledge cancellation. No other client's lease or old attempt can affect a continuation. Claims and outcomes are scoped to this workspace/session, never another system.

## Publication

After review, the user approves the saved hash and target through Publish. Use the publication tools in `reference/publish-mcp.md`: status, claim, progress, finish, cancel. The same connection/server protocol applies; no special agent/runtime adapter is introduced. Publication starts with a source-derived read-only preflight operation through the host's existing Figma tool. Its actual returned font/inventory result drives the runner: a face Figma cannot load ends the attempt as `needs-fonts` with nothing written, and the user resolves it in Builder; a valid result returns the compiled FAST generation plan on the same job (reference/manager-fast.md). Generation still verifies edit access and frozen values. Confirmed export/audit are independently checked before unlocking build.

## Item tools

Agents read and change foundation items and Parts through DS Create MCP. Every tool takes `session` and works on the saved local files only; none of them reads or writes Figma. In a session without `ds_create_*` tools, call them through the terminal host (`background-worker.md`, *Without DS Create MCP tools*).

| Tool | Use |
| --- | --- |
| `ds_create_items_list` | Find items by domain, collection, kind, type, name prefix or text. Values are resolved per mode. |
| `ds_create_items_get` | Read items in full, with the alias chain and `usedBy`. The name `rules` returns the editable rules. |
| `ds_create_items_change` | Save a list of ops as one revision. |
| `ds_create_items_history` · `ds_create_items_restore` | List revisions; restore one as a new revision. |
| `ds_create_items_diff` | The sync state and the local changes not yet in Figma, Part tokens included. |
| `ds_create_parts_prepare` | Compile Parts from their templates and the approved foundations. Pass the `ids` a build round needs; omit `ids` only to prepare every Part that is not current. |
| `ds_create_change_requests` | Read the user's Builder change requests; mark one `done` with the revision that applied it. |

Ops, each with `target: "foundations"`:

- `set`: one mode's `value` or `alias`, or `fields` (description, scopes, codeSyntax, style properties);
- `add`: a variable, style, collection or mode;
- `rename`: updates every alias, binding and effect color that points at the item;
- `delete`: refused while the item is used, unless `replaceWith` names its replacement;
- `apply` with a recipe: `radius-base {rem}`, `space-base {rem}`, `shadow-seed {seed}`, `type-family {family, role?}`, `type-scale {percent}`, `palette-ramp {family, anchors, replace?}`.

In a new system, setting a literal value on a semantic token stores it on a primitive of the same family. If no primitive holds that value, the store creates one: `radius/control` at 12 aliases `scale/radius/12`, and a hex brand color aliases `palette/custom/{hex}`.

`foundation-rules.json` records each palette family's anchors from preparation. The steps between anchors use the same OKLab interpolation as preparation. Change a palette color by changing its anchors with `palette-ramp`, or by setting an anchor step. Setting any other step breaks the ramp.

When the user asks for a change:

1. Read the items it names with `ds_create_items_list` or `ds_create_items_get`, and note the `revision`.
2. Call `ds_create_items_change` with `dryRun: true`.
3. If the result has `wide` set, or the direction can be read more than one way, show the user which items will change, which rule is affected and any contrast warnings, then wait for their answer. Resend with `confirmed: true` only after they agree.
4. Otherwise save the same ops with the same `expectedRevision`. A 409 means the draft changed meanwhile: read again and redo the change.
5. Report the new revision in one line; Builder picks it up on its own. Mark the change request `done` if the change came from one.

A change is wide when it breaks a color rule, touches more palette families than `discuss.maxFamilies`, moves more semantic tokens than `discuss.maxSemantics`, or renames or deletes a name preparation produced (`contract`). The limits are stored in `foundation-rules.json`. To change them, use `set` with `kind: "rules"`; that change always needs the user's agreement first.

### Parts

Each Part, Component and Section is a local file, `parts/{id}.json`, compiled from a brand-agnostic template. In this section, "Part" means a Part, Component or Section unless a line says otherwise. The template holds the default structure (sizes, emphases, tones, states, properties, token roles). The system's changes to that structure are stored in `inputs`. Token picks made in Builder are stored in `overrides`.

- `ds_create_items_list` with `target: "parts"` lists the Parts with their level (`parts`, `components`, `sections`) and status (`not-prepared`, `outdated`, `ready`); with `target: "part:{id}"` it lists that Part's tokens.
- `ds_create_items_get` with `target: "part:{id}"` reads its tokens; the name `part` returns the whole file.
- `ds_create_items_change` ops with `target: "part:{id}"`: `set` with `field: "inputs"` or `"overrides"` and an object `value` (merged; `null` clears it), or `apply` with `recipe: "recompile"`. One target per save.
- Button's `overrides` hold `treatments` and `sizes`. For every other Part they hold `map` and `measures`, keyed by set → variant (or size) → slot, as in its part file. The store refuses an override for a variant, size or slot the Part does not have.
- `ds_create_parts_prepare` prepares a Part only after the Parts it uses. If `ids` leaves out a Part another one uses, the error names the missing Part. Without `ids` it prepares every Part, Component and Section that is not `ready`.
- A Component or Section file records `instances` for each set, in rows keyed like its token map. Each slot names the Part, Component or same-page set it holds and the variant of that set. A property the spec does not set takes that Part's default. If an instance names a variant its Part does not have, preparing fails with a one-sentence error.
- A Part, Component or Section becomes `outdated` when a Part it uses changes its structure. The message for a wide Part change names every prepared template that uses the Part, directly or through another, and the ones that cannot be prepared again until their inputs change. After the user agrees, change those inputs, then prepare the changed Part and its users.
- On a Part's first prepare, Node drops any tone or category family that has no colors in the foundations and records that as a decision. Adding a dropped tone or category family back is a structure change.
- Adding or removing a size, emphasis, tone, state or property is wide: show the user what changes and resend with `confirmed: true` only after they agree.
- `ds_create_items_history` and `ds_create_items_restore` take the same `target`.

A foundation rename updates every Part that uses the name in the same save. Deleting a foundation item a Part uses is refused unless `replaceWith` names its replacement.

Changing, preparing or restoring Parts requires approved foundations. Every foundation save, including an Undo, clears the approval. If a Part change is refused because the approval was cleared, ask the user to approve the current foundation revision with **Approve foundations** in Builder's **Publish** dialog. Then retry the change.

Never edit `foundations.json`, `foundation-plan.json` or the `foundations/` pack by hand. The same goes for `parts/`.

## Waiting and verification

After a preparation finish, call `ds_create_wait` again so the Publish click reaches the same agent, or end the turn. Future automatic delivery requires a new pending tool request; a detached Node process cannot wake an ended chat. Source/request/proof/exclusive-owner gates remain unchanged. Verify actual delivery and claims separately from synthetic fixtures. Publication retains its separate approval and MCP lease and is never automatically retried by preparation delivery.
