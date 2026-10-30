# DS items through MCP: one local source, optional Figma sync

Date: 2026-10-31 · Branch: `penghematan2` · Status: draft for review · prose not reviewed (Codex at capacity on 2026-10-31)

## Goal

An agent can read and change every design system item from a plain-language direction ("make the brand color darker", "rename radius/md to radius/control", "apply the open change requests"). The saved files in `workspace/output/{session}/` are the single source of truth. Builder shows and edits the same files.

Figma is part of the pipeline by default. `init`, `init-web` and `build` include it unless the user turns it off. With Figma on, sync covers both directions: local changes go to Figma, and changes made in Figma come back, are validated, and are saved like any other change. With Figma off, no step reads or writes Figma, and the project lives in Builder and the docs site.

Decisions made with the user:

1. Figma is on by default for `init`, `init-web` and `build`, and can be turned off per session.
2. With Figma on, changes made directly in Figma are pulled back as proposals and validated like local changes. Accepted proposals become a new local revision; rejected ones are overwritten on the next push.
3. Builder controls save through the same path as the MCP tools. They stop being previews.
4. Figma is updated when the user asks for a sync, from chat or from Builder. Only the difference is sent.
5. Editing is unrestricted: add, delete and rename any item, including the items the ds-create contract names. Safety comes from reference checks and warnings, not from locks.

## Current state (2026-10-31)

- `foundations.json` (format `ds-create/foundations@1`) holds collections, variables, text, effect and grid styles. Preparation writes it. Revision 4 in the live session has 434 variables, 18 text styles and 8 effect styles.
- `foundation-plan.json` lists the item names per domain. `validatePlan` requires the draft to match it.
- `foundations/*.js|md` and `manifest.json` are a generated pack, hash-checked against the draft.
- Builder edits to foundations are previews only. Part overrides already autosave through `/api/parts-update`.
- Figma receives a whole approved revision through Publish. `compareFoundations` and the file audit confirm the result, and the ledger marks it `synced`.
- The MCP server (`kit/mcp/server.mjs`) imports `kit/manager` modules directly. Its tools cover waiting, preparation and publication only.

## Phases

1. The Figma setting, the item store, MCP item tools and Builder saving, for foundations.
2. Sync with Figma: first sync creates everything (replacing Publish to Figma), later syncs push the difference and pull Figma edits through validation.
3. Parts in the same store and the same sync, Button first.
4. `build` with Figma off: Parts, Components and the docs site from the saved files only. This lifts the `source.review: synced` gate in `reference/build.md` when Figma is off.

Each phase gets its own plan and review.

## 0. Figma setting

- One session setting, stored in the ledger as `flags.figma` (next to `flags.guidelines`). Default `true`.
- `init` and `build` take `--no-figma`. `init-web` takes the same flag, and the Context dialog has a "Use Figma" switch.
- The setting can change later. Turning it on makes the next sync a first sync. Turning it off stops sync and hides the Figma steps; the Figma file is left as it is.
- With Figma off: no Figma URL is asked, Publish to Figma and the sync tools are hidden, and the Publish stepper counts Builder items only.

## 1. Item store

New module `kit/manager/foundations/store.mjs`. It is the only writer of `foundations.json`. Builder and the MCP server both call it. MCP keeps working when Builder is not running.

### Operations

One save takes a list of operations and writes them as one revision.

| Op | Effect |
|---|---|
| `set` | Change fields of one item: values per mode, alias, description, scopes, codeSyntax, hidden flag, or style properties. With `kind: 'rules'`, change the rules in `foundation-rules.json`. |
| `add` | Add a variable, a text/effect/grid style, a collection, or a mode. |
| `rename` | Rename an item. Every alias, text-style `bound` reference and effect color alias that points at it is updated in the same revision. |
| `delete` | Remove an item. Refused while anything references it, unless `replaceWith` names an item that takes over those references. |
| `apply` | Run a recipe helper and record its output as `set`/`add` ops: `radius-base`, `space-base`, `shadow-seed`, `type-family`, `type-scale`, `palette-ramp` (one anchor color to the 50–950 steps). |

Every op names its target: `foundations` now, `part:{id}` in phase 3.

Primitives are items like any other. `set` on `palette/brand/600` or `scale/radius/8` changes the primitive itself, and every semantic token and style that aliases it changes with it.

### Color rules

Palettes follow a rule by default: each family (`palette/brand`, `palette/neutral`, …) is a ramp of steps 50–950 built by `paletteRamp` from a few pinned anchors, with the steps between them interpolated in OKLab. Preparation records the anchors in the decision file (`domains.color.inputs.palettes.{family}.anchors`, e.g. brand `{50, 600, 950}`).

- The store copies those anchors into `foundation-rules.json` on its first save, as `{format:'ds-create/foundation-rules@1', palettes:{family:{anchors, steps, rule:'ramp'}}, contract:[…]}`. `contract` is the list of item names in the plan at that moment: the names preparation produced.
- `palette-ramp` changes or adds anchors for one family and regenerates its steps. This is how a direction like "make the brand red darker" is applied.
- Setting a single palette step that is not an anchor breaks the ramp. The store allows it only as a confirmed change (below), then marks that family `rule:'custom'` so later ramp edits warn before overwriting the hand-set step.
- Families without recorded anchors (imported or existing systems) have no ramp rule.

### Impact and discussion

A change can reach far: one brand anchor moves 11 primitives and every semantic color that uses them. The store measures that before saving.

- Every `change` result, dry run included, carries `impact`: primitives changed, semantic tokens whose resolved value changed (per mode), styles affected, palette families touched, and rules broken.
- A change is **wide** when any of these holds: it breaks a color rule; it touches more palette families than `maxFamilies`; it changes the resolved value of more semantic tokens than `maxSemantics`; it renames or deletes an item the ds-create contract names (when `contract` checking is on).
- These limits are data, not code. They live in `foundation-rules.json` under `discuss: {maxSemantics: 10, maxFamilies: 1, contract: true, colorRules: true}` (the defaults) and change through the same `set` op (`kind: 'rules'`). Palette rules (a family's anchors, steps, or `rule`) change the same way, so a new rule kind can be added later without a new tool.
- Changing the rules is itself always a wide change: the agent asks the user first.
- A wide change is refused unless the call passes `confirmed: true`. The refusal returns the impact summary. The agent shows that summary to the user, discusses it, and resends with `confirmed: true` only after the user agrees in chat.
- Builder controls send `confirmed: true`, because the user is making the change by hand.

### Save rules

1. **Revision check.** The caller sends `expectedRevision`. A stale save is refused with the current revision, so the caller reloads and retries.
2. **Lock.** `foundations.lock` (exclusive create, removed in `finally`, stale after 30 s) serializes Builder and MCP writes.
3. **Validation.**
   - Refused: broken alias, wrong value type, unknown mode or collection, duplicate name, a reference left dangling.
   - Saved with warnings: failed contrast pairs, a contract item that is missing or renamed. These warnings block a Figma sync until they are fixed or the user confirms the sync anyway.
4. **Writes.** In order: `foundations.json` with revision +1; `foundation-plan.json` when names change; the regenerated pack; review status back to `pending`. Each file is written to a temp file and renamed.
5. **History.** `history/foundations/{revision}.json` keeps the full snapshot, the ops, the author (`builder` or `mcp`) and the time. `restore` copies an old snapshot forward as a new revision, so history is never rewritten.
6. **Dry run.** `dryRun: true` runs validation and returns the diff and warnings without writing.

### Builder

- `POST /api/foundations` calls the store with the same operation shape.
- Radius, spacing, shadow, typeface, type scale and single-item value controls autosave, like Parts. The "Controller edits are previews" note is removed.
- When the revision on disk changes (an agent saved), Builder reloads it on its next state refresh and shows "Revision N · saved by agent".

## 2. MCP tools

All tools take `session`. All writes return the new revision, a short diff and any warnings.

| Tool | Purpose |
|---|---|
| `ds_create_items_list` | List items with filters: domain, collection, kind (variable/textStyle/effectStyle/gridStyle), type, name prefix, free-text query. Paged. Returns name, kind, resolved value per mode, and description. |
| `ds_create_items_get` | Full definitions for named items, with resolved values per mode, the alias chain, and `usedBy` (items, styles and parts that reference them). |
| `ds_create_items_change` | Apply ops (section 1) with `expectedRevision`, a one-line `reason`, optional `dryRun`, and `confirmed` for wide changes. Returns the impact. |
| `ds_create_items_history` | Recent revisions: number, author, reason, op count, time. |
| `ds_create_items_restore` | Restore an earlier revision as a new one. |
| `ds_create_change_requests` | List the Builder change-request cards, or mark one `done` with the revision that applied it. |

Agent flow for a direction:
1. Read the relevant items with `list`/`get`.
2. Call `change` with `dryRun: true`. When the impact is wide or the direction is ambiguous, discuss it with the user (what moves, which rule it touches, the contrast warnings) and wait for agreement. Otherwise apply directly.
3. Report the new revision in one line. Builder updates by itself.

The same tools are available without MCP through the terminal host: `node kit/manager/cli.mjs mcp {tool} --json '{…}'`.

## 3. Sync with Figma

Applies when the session's Figma setting is on. Sections 1 and 2 work the same either way.

### Baseline

`figma/synced.json` is the snapshot of the last revision confirmed in Figma, plus the Figma ids of each variable and style by name. Every successful sync replaces it.

### First sync

With no baseline, the sync creates everything in the Figma file. This replaces today's Publish to Figma, keeps its font check, and finishes with the same export and full file audit. Builder's "Publish to Figma" button becomes "Sync to Figma".

### Three-way compare

The agent exports Figma with the existing export script. `ds_create_sync_plan` compares baseline, local and Figma per item and field:

- Changed only locally: **push**.
- Changed only in Figma: **proposal**.
- Changed on both sides with different results: **conflict**.

### Validating Figma changes

Before a proposal is shown, it runs through the store's validation as a dry run on top of the current local revision. A proposal that would break the draft (a dangling alias, a wrong type, an unknown mode) is marked invalid with the reason and cannot be accepted until it is fixed in Figma or rejected. Contrast and contract warnings are shown the same way as for local saves. Items Figma added outside the known collections are listed as proposals to add.

### Tools

| Tool | Purpose |
|---|---|
| `ds_create_sync_status` | Local revision, baseline revision, whether a Figma file is set, local changes not yet pushed, time of the last export. |
| `ds_create_sync_plan` | Run the three-way compare from a fresh export. Returns push items, proposals and conflicts. |
| `ds_create_sync_resolve` | Accept or reject proposals and choose a side for conflicts. Accepted items go through the store as one new local revision. |
| `ds_create_sync_push` | Claim a lease and return batched Figma calls for the difference only: creates, updates, renames by Figma id, deletes. The user's sync instruction is recorded as the approval for that exact revision hash. |
| `ds_create_sync_finish` | Report the result with real export and audit evidence. On a match, write the new baseline and mark the ledger `synced`. |

Progress and cancel reuse `ds_create_publish_progress` and `ds_create_publish_cancel`. The MCP server never writes Figma itself: the agent runs the returned calls with its own Figma tools, as Publish does today.

### Builder

- The Publish dialog's Figma step shows "N local changes not in Figma" and a **Sync to Figma** button. The button queues a `sync-request` through `ds_create_wait`, or shows a copy prompt when no agent is waiting.
- Proposals and conflicts appear as cards in the Agent tab, with Accept and Reject.

## 4. Parts (phase 3)

- `parts/{id}.json` joins the store as target `part:{id}`, with the same revision check, lock, history and ops (`set` on overrides and properties).
- `ds_create_items_*` accept `target: "part:button"`.
- The part `usedBy` links let a foundation rename or delete update or block part references.
- With Figma on, part changes join the same sync, once Parts are built in Figma.

## Errors

- Every refusal names the item and the reason in one sentence, for example: "radius/md is used by 6 items; pass replaceWith to delete it."
- A failed save leaves every file unchanged.
- A sync push that fails or is cancelled keeps the old baseline. The next `sync_plan` shows what actually landed.

## Testing

- Store unit tests: each op, rename cascade, delete refusal and `replaceWith`, stale revision, lock contention between two processes, plan and pack regeneration, history and restore, dry run.
- MCP tests through the existing harness in `tests/manager-mcp.test.mjs`.
- Builder browser test on a temporary session: change the radius base, reload, and the value persists. No writes to the user's live session.
- Sync tests with fixture exports: push only, proposal only, conflict, rename by id, delete.
