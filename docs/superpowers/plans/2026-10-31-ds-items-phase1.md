# DS Items Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agents and Builder change foundation items through one local store, exposed as MCP tools, with a per-session Figma on/off setting and a visible sync state and diff against what was last published to Figma.

**Architecture:** A pure op engine (`ops.mjs`) turns a draft plus a list of ops into a new draft, plan and warnings. A store (`store.mjs`) wraps it with revision checks, a cross-process file lock, atomic writes, pack regeneration and history. Read helpers (`query.mjs`) resolve values and references. MCP tools, `POST /api/foundations` and Builder autosave all call the store. The Figma setting lives in the ledger as `flags.figma`.

**Tech Stack:** Node ESM (`.mjs`), `node:test`, zod + `@modelcontextprotocol/sdk` (kit/mcp), vanilla browser JS (kit/manager/client), playwright-core for one browser test.

**Spec:** `docs/superpowers/specs/2026-10-31-ds-items-mcp-design.md` (sections 0, 1, 2 and the Builder parts of 1).

## Global Constraints

- Draft format stays `ds-create/foundations@1`; no new fields on variables or styles.
- Ops: `set`, `add`, `rename`, `delete`, `apply`. Recipes: `radius-base`, `space-base`, `shadow-seed`, `type-family`, `type-scale`, `palette-ramp`.
- Every op carries `target`; phase 1 accepts only `"foundations"` and refuses anything else with "Only foundations can be changed in this version."
- Structural errors (`validateFoundations`) refuse the save. `validatePlan` errors and failed contrast pairs are returned as `warnings` and the save goes through.
- A save resets `ledger.foundationReview` to `{status:'pending'}` and keeps every other ledger field.
- Lock file `foundations.lock` in the session output dir; wait up to 2 s for it; treat it as stale after 30 s.
- History file: `history/foundations/{revision}.json` = `{format:'ds-create/foundation-history@1', revision, author, reason, ops, time, draft}`.
- Authors: `"builder"` or `"mcp"`.
- Figma setting: ledger `flags.figma`, default `true`; flag `--no-figma`.
- New primitives created by the store follow the existing names: numbers `{family}/{slug}` where slug replaces `.` with `p` and a leading `-` with `n` (e.g. `scale/duration/0p12`, `scale/radius/10`); colors `palette/custom/{hex without #, lowercase}`.
- Rules file: `foundation-rules.json` = `{format:'ds-create/foundation-rules@1', discuss:{maxSemantics:10, maxFamilies:1, contract:true, colorRules:true}, palettes:{family:{anchors:{step:hex}, steps:number[], rule:'ramp'|'custom'}}, contract:string[]}`. Seeded on the first save from `manager/setup-jobs/{setup.jobId}/decisions.json` → `domains.color.inputs.palettes`, the plan's names, and the `discuss` defaults. Nothing in code hard-codes the limits: `isWide` reads `rules.discuss`.
- Rules change through `{op:'set', target:'foundations', kind:'rules', fields:{discuss?, palettes?, contract?}}` (shallow merge per key; `palettes.{family}` merges per family). A rules op always makes the change wide.
- Wide change (needs `confirmed:true`): breaks a color rule (when `discuss.colorRules`); touches more than `discuss.maxFamilies` palette families; changes the resolved value of more than `discuss.maxSemantics` semantic tokens (any mode); renames or deletes a `contract` name (when `discuss.contract`); contains a rules op. Refusal: `PublishError('This change is wide: {summary}. Discuss it with the user, then resend with confirmed: true.', 428)` with `impact` attached.
- Never write to the user's live session in tests; use temp dirs (memory rule: live Builder tests snapshot and only remove what they created).
- Do not commit unless the user asks. The "Commit" steps below mean "stage nothing; note the checkpoint" until the user says otherwise.

## Review Focus

1. A Builder autosave and an MCP save racing on the same revision: the loser gets a clear stale-revision error, and nothing is half-written. (Task 3 test `two processes contend for the lock`.)
2. Setting a literal on a semantic variable in a `systemMode: 'new'` draft must alias a primitive, never store the literal on the semantic (that breaks `validatePlan`). (Task 1 test `literal on semantic aliases a primitive`.)
3. Renaming a variable must also update `codeSyntax.WEB` and every reference, or the pack and Figma names drift. (Task 1 test `rename cascades`.)
4. Sessions without `foundation-plan.json` (legacy, and the publish fixture) must still save: skip plan and pack updates instead of failing. (Task 3 test `saves without a plan`.)
5. Restoring an old revision must create a new revision number, not reuse the old one. (Task 3 test `restore copies forward`.)
6. "Make the brand color blue" must regenerate the whole brand ramp from its anchors, report every semantic color that moves, and stop for discussion instead of saving. (Task 2 test `brand anchor change reports impact`, Task 3 test `wide change needs confirmation`.)
7. With Figma off, the sync state must stay `local` and Builder must not show any Figma diff, even if an old `figma/synced.json` is still on disk. (Task 8 test `state follows the baseline`.)

---

### Task 1: Op engine (`set`, `add`, `rename`, `delete`)

**Files:**
- Create: `kit/manager/foundations/ops.mjs`
- Test: `tests/manager-item-ops.test.mjs`
- Test fixture: `tests/fixtures/item-store.mjs`

**Interfaces:**
- Produces: `applyOps(draft, ops, {plan = null, rules = null} = {}) -> {draft, plan, rules, changes, warnings, impact}`. Pure: never mutates its inputs. (`rules` and `impact` are filled in Task 2; Task 1 returns `rules` unchanged and `impact` from `measureImpact`.)
- Produces: `measureImpact(before, after) -> {primitives:string[], semantics:[{name, mode, from, to}], styles:string[], families:string[], rulesBroken:string[]}`. `semantics` compares resolved values per mode for every non-Primitives variable; `families` are the `palette/{family}` prefixes among changed primitives. `changes` is `[{kind:'variable'|'textStyle'|'effectStyle'|'gridStyle'|'collection', name, action:'set'|'add'|'rename'|'delete', from?, to?}]`. Throws `ItemError` (exported, `extends Error`, `status = 400`) for structural failures.
- Produces: `itemDraft()` and `itemPlan()` in the fixture: a `systemMode:'new'` draft with collections `Primitives` (Value), `Color` (Light, Dark), `Shape` (Value), `Typography` (Value); primitives `palette/base/white`, `palette/brand/500`, `scale/radius/4`, `scale/radius/8`, `scale/radius/0`, `scale/radius/9999`, `scale/font-size/16`, `scale/font-family/sans`; semantics `color/surface/base`, `color/brand/primary`, `color/shadow/ambient`, `radius/none`, `radius/sm`, `radius/control`, `radius/full`, `font/size/body-md`, `font/family/ui`; one text style `type/body/md/regular` bound to `font/size/body-md` and `font/family/ui`; one effect style `elevation/control` whose shadow color aliases `color/shadow/ambient`. All semantics have descriptions, scopes and `codeSyntax.WEB`. `itemPlan()` lists those names per domain; typography/elevation included with their styles; space and motion excluded with `reason` and `source`.

Op shapes (the engine's input contract):

```js
{op:'set', target:'foundations', kind?:'variable'|'textStyle'|'effectStyle'|'gridStyle', name, mode?, value?, alias?, fields?}
//   variable: mode+value or mode+alias sets one mode; fields may set description, scopes, codeSyntax, hiddenFromPublishing
//   style: fields replaces the named properties (e.g. {effects:[…]}, {fontFamily:'Inter'})
{op:'add', target:'foundations', kind, item}                 // item = full variable/style object; kind 'collection' takes {name, modes}
{op:'add', target:'foundations', kind:'mode', collection, mode, copyFrom?}
{op:'rename', target:'foundations', kind?, from, to}
{op:'delete', target:'foundations', kind?, name, replaceWith?}
```

`kind` defaults to `'variable'`.

- [ ] **Step 1: Write the failing tests** in `tests/manager-item-ops.test.mjs`:
  - `set on a primitive moves everything that aliases it`: set `scale/radius/8` Value to `12` → `radius/control` keeps its alias, `impact.primitives` is `['scale/radius/8']`, `impact.semantics` contains `{name:'radius/control', mode:'Value', from:8, to:12}`.
  - `set changes one mode and leaves inputs untouched`: set `color/brand/primary` Light alias to `palette/base/white`; result value is `{alias:'palette/base/white'}`; the input draft is deep-equal to a clone taken before.
  - `literal on semantic aliases a primitive`: set `radius/control` Value to `10` → `radius/control` becomes `{alias:'scale/radius/10'}` and a primitive `scale/radius/10` exists (`collection:'Primitives'`, `hiddenFromPublishing:true`, `scopes:[]`, `values:{Value:10}`, `codeSyntax.WEB:'var(--scale-radius-10)'`); set it to `8` → aliases the existing `scale/radius/8` and adds nothing; set `color/brand/primary` Light to `'#1A2B3C'` → alias `palette/custom/1a2b3c`.
  - `rename cascades`: rename `color/shadow/ambient` to `color/shadow/soft` → effect color alias updated, `codeSyntax.WEB` is `var(--color-shadow-soft)`, plan `domains.color.variables` contains the new name and not the old; rename `font/size/body-md` → text style `bound.fontSize` updated.
  - `delete refuses while referenced`: delete `scale/radius/8` throws `ItemError` with message `scale/radius/8 is used by 1 item; pass replaceWith to delete it.`; with `replaceWith:'scale/radius/4'` it succeeds and `radius/control` aliases `scale/radius/4`.
  - `add rejects duplicates and unknown collections`: adding `radius/sm` again throws `radius/sm already exists.`; adding a variable to collection `Nope` throws `Collection Nope does not exist.`
  - `structural errors refuse`: set `radius/sm` alias to `palette/brand/500` (type mismatch) throws, message contains `incompatible alias`.
  - `warnings come from validatePlan`: rename `radius/sm` to `corner/small` succeeds, `warnings` contains a string matching `/corner\/small: name does not match its collection/`.
  - `target other than foundations is refused`: `{op:'set', target:'part:button', …}` throws `Only foundations can be changed in this version.`

- [ ] **Step 2: Run** `node --test tests/manager-item-ops.test.mjs` — Expected: FAIL, `Cannot find module …/ops.mjs`.

- [ ] **Step 3: Implement `applyOps`** in `kit/manager/foundations/ops.mjs`. Work on `structuredClone`s. After all ops: run `validateFoundations(draft)` and throw `ItemError(errors.slice(0,5).join(' '))` when invalid; when a plan is given, compute warnings with `validatePlan(plan, draft, {hash:plan.inputHash, files:[]}, plan.inputRevision)` but drop errors about decisions/sources/product (keep only messages that name an item or a domain), then add `contrastReport(draft).filter(p=>!p.pass)` as `Contrast: {mode} {foreground} on {background} is {ratio}; requires {minimum}:1.` Plan updates: rename replaces the name inside `plan.domains[*].variables|styles`; add puts the name into the domain whose existing names share its first path segment (fallback: `color` for COLOR, else the domain of the collection's first variable); delete removes it. Literal-on-semantic rule applies only when `plan?.systemMode === 'new'` and the variable's collection is not `Primitives`; the family is the current alias target's name without its last segment (`scale/radius/8` → `scale/radius`), and for COLOR always `palette/custom`.

- [ ] **Step 4: Run** `node --test tests/manager-item-ops.test.mjs` — Expected: PASS (9 tests).

- [ ] **Step 5: Checkpoint** (no commit unless asked).

### Task 2: Recipe ops (`apply`), color rules and impact

**Files:**
- Modify: `kit/manager/foundations/ops.mjs`
- Test: `tests/manager-item-ops.test.mjs` (add tests)

**Interfaces:**
- Consumes: `deriveRadii`, `shadowSeed`, `deriveShadows`, `shadowEffect`, `isShadow`, `cssColor` from `kit/manager/client/features/foundation-controls.mjs`; `paletteRamp` from `kit/manager/foundations/compiler.mjs`; `resolveValue` from `kit/manager/server/state.mjs`.
- Produces: `{op:'apply', target:'foundations', recipe, …args}` expands into `set`/`add` ops inside `applyOps`; each expanded op appears in `changes`.

Recipe contracts:

| recipe | args | effect |
|---|---|---|
| `radius-base` | `rem` (0–8) | `deriveRadii` over every `radius/*` variable's resolved Value; each changed one gets a literal `set` (so the Task 1 alias rule picks or creates the primitive) |
| `space-base` | `rem` (> 0) | old base = resolved `space/xs` (fallback 4 px); every `space/*` resolved value × (rem·16 / old base), rounded to 0.5 px, set as literal |
| `shadow-seed` | `seed:{x,y,blur,spread,color,opacity}` | for every effect style that has a shadow and is not `focus/*`: `deriveShadows(effects, shadowSeed(style), seed, resolve)`, then written back in draft shape `{type, offset:{x,y}, radius, spread, color}`; opacity kept only when it is not 100 and in the unit `validateFoundations` accepts |
| `type-family` | `family`, `role?` | without `role`: every `scale/font-family/*` primitive and every text style `fontFamily` = `family`; with `role`: only the primitive aliased by `font/family/{role}` and the text styles bound to `font/family/{role}` |
| `type-scale` | `percent` (50–200) | every `font/size/*` and `font/line-height/*` resolved value × percent/100, rounded to whole px, set as literal; every text style `fontSize` and PIXELS `lineHeight` scaled the same way |
| `palette-ramp` | `family`, `anchors` (`{step: hex}`, merged over `rules.palettes[family].anchors`), `replace?` (true drops the old anchors) | `paletteRamp({anchors, steps})` with the family's recorded `steps`; values written to the existing `palette/{family}/{step}` primitives (only steps that exist); sets `rule:'ramp'` again. A family with no recorded anchors needs `replace:true` and must pin both ends. |

Rule checks (fill `impact.rulesBroken` and `rules`):
- A `set` on `palette/{family}/{step}` where the family has `rule:'ramp'` and `step` is not an anchor → `rulesBroken` gets `palette/{family}: step {step} set outside its OKLab ramp`, and the returned `rules` marks the family `rule:'custom'`.
- A `palette-ramp` on a family with `rule:'custom'` → `rulesBroken` gets `palette/{family}: regenerating overwrites hand-set steps`.
- Setting an anchor step directly is allowed and regenerates the family (same as `palette-ramp` with that one anchor).
- Produces: `isWide(impact, ops, rules) -> string|null` — the one-line summary when the change is wide (thresholds in Global Constraints), e.g. `moves 14 semantic colors in palette/brand`.

- [ ] **Step 1: Write the failing tests** (the fixture gains `itemRules()`: brand anchors `{50:'#FCF3F2', 500:'#C33734', 950:'#2E0D0C'}`, steps `[50,500,950]`, `contract` = all fixture names): `brand anchor change reports impact` (`palette-ramp {family:'brand', anchors:{500:'#2563EB'}}` → `impact.families` is `['palette/brand']` and `color/brand/primary` is in `impact.semantics`); `isWide thresholds` (a single radius change → `null`; a synthetic impact with 11 semantics → summary; two families → summary; renaming a `contract` name → summary; any `rulesBroken` → summary); `limits come from rules` (with `discuss.maxSemantics:20` the 11-semantic impact → `null`; with `discuss.contract:false` the contract rename → `null`); `rules op merges and is wide` (`set kind:'rules' fields:{discuss:{maxSemantics:20}}` keeps `maxFamilies:1`, and `isWide` returns a summary); `single non-anchor step breaks the ramp` (add `palette/brand/300` to the fixture with steps `[50,300,500,950]`; setting it directly lists the broken rule and marks the family `custom`); `anchor step set regenerates`; `radius-base 0.75rem doubles nothing it shouldn't` (none stays 0, full stays 9999, control becomes 12 and aliases a new `scale/radius/12`); `type-scale 125 scales text styles and size tokens` (16 → 20 for `font/size/body-md` and the text style `fontSize`); `type-family role ui only touches its styles`; `shadow-seed writes draft-shaped effects` (result effects have `offset` and `radius`, never `x`/`blur`); `palette-ramp updates existing steps only` (only `palette/brand/500` exists among non-anchor steps, nothing is added); `unknown recipe is refused` (`Unknown recipe: bogus.`).
- [ ] **Step 2: Run** `node --test tests/manager-item-ops.test.mjs` — Expected: the 11 new tests FAIL.
- [ ] **Step 3: Implement** the recipe expansion in `ops.mjs` (a `recipes` map from name to `(draft, args, {resolve, rules}) -> ops[]`), the rule checks, and `isWide`.
- [ ] **Step 4: Run** the file — Expected: PASS (20 tests).
- [ ] **Step 5: Checkpoint.**

### Task 3: Store (revision, lock, writes, pack, history, restore)

**Files:**
- Create: `kit/manager/foundations/store.mjs`
- Test: `tests/manager-item-store.test.mjs`
- Modify: `tests/fixtures/item-store.mjs` (add `storeFixture()`)

**Interfaces:**
- Consumes: `applyOps`, `ItemError` (Task 1); `createFoundationPack` (`foundations/pack.mjs`); `readJSON` (`server/state.mjs`); `PublishError` (`server/files.mjs`).
- Produces: `createItemStore({outputDir}) -> {read(), change(input), history({limit=20}={}), restore(input)}`
  - `read() -> {revision, draft, plan}` (plan `null` when the file is missing).
  - `change({expectedRevision, ops, reason, author, dryRun=false, confirmed=false}) -> {revision, changes, warnings, impact, wide, dryRun}`. `wide` is the `isWide` summary or `null`. A wide change without `confirmed` is refused with the 428 error from Global Constraints (dry runs are never refused; they return `wide`). Reads and writes `foundation-rules.json`, seeding it on the first save. Stale revision → `PublishError('Foundations changed to revision {n}. Reload and try again.', 409)`. `reason` required, 1–200 chars.
  - `history({limit}) -> [{revision, author, reason, ops:count, time}]`, newest first.
  - `restore({revision, expectedRevision, author}) -> {revision, changes:[], warnings}`; reason recorded as `Restore revision {n}`.
- Produces: `storeFixture() -> {dir, cleanup}`: temp output dir with `foundations.json` (revision 1, `itemDraft()`), `foundation-plan.json` (`itemPlan()`), `ds-create-ledger.json` (`{system:'Fixture', foundationReview:{status:'approved', hash:'x'}, flags:{guidelines:false}}`), `manager/setup.json` (`{projectName:'Fixture', interfaceDetails:{modes:['Light','Dark']}}`).

- [ ] **Step 1: Write the failing tests**:
  - `change writes a new revision and resets review`: revision 2 on disk, ledger `foundationReview` deep-equals `{status:'pending'}`, `flags.guidelines` still `false`.
  - `stale revision is refused`: `expectedRevision:1` twice → second rejects with status 409 and message `Foundations changed to revision 2. Reload and try again.`; files unchanged after the rejection.
  - `dry run writes nothing`: file bytes identical before and after; result has `dryRun:true` and the changes.
  - `pack is regenerated`: after a change, `verifyFoundationPack(dir, draft)` resolves (import from `foundations/pack.mjs`).
  - `saves without a plan`: delete `foundation-plan.json`; change succeeds; no `foundations/` folder is created.
  - `history and restore copies forward`: two changes (rev 2, 3); `history()` returns revisions `[3,2,1]` (rev 1 snapshot is written on the first change); `restore({revision:1, expectedRevision:3})` returns revision 4 whose draft equals rev 1's apart from `revision`.
  - `two processes contend for the lock`: spawn `node -e` child that holds `foundations.lock` for 500 ms (create it with `open(file,'wx')`); a `change` started meanwhile waits and succeeds; with a 3 s hold it fails with `Foundations are being saved by another process. Try again.`; a lock file with mtime 31 s old is removed and the save succeeds.
  - `failed save leaves files unchanged`: an op that throws `ItemError` leaves every file byte-identical.
  - `rules are seeded from the decision file`: fixture writes `manager/setup-jobs/job-1/decisions.json` with brand anchors and `setup.json.jobId:'job-1'`; after the first change `foundation-rules.json` has those anchors, `rule:'ramp'`, and `contract` equal to the plan's names.
  - `wide change needs confirmation`: renaming a contract name without `confirmed` rejects with status 428 and an `impact`; the dry run returns `wide` without throwing; with `confirmed:true` it saves.
- [ ] **Step 2: Run** `node --test tests/manager-item-store.test.mjs` — Expected: FAIL, module missing.
- [ ] **Step 3: Implement `createItemStore`.** Lock: `open(lock,'wx')`, retry every 50 ms up to 2 s, remove when `mtime` is older than 30 s, always `unlink` in `finally`. Inside the lock: re-read revision, check it, `applyOps`, set `draft.revision = current + 1`, then stage every file to `*.{uuid}.tmp` and rename in this order: history snapshot(s), `foundation-plan.json` (if plan), pack files (if plan), `foundations.json`, ledger last. Pack inputs: `request = {projectName: setup.projectName ?? plan.projectName, interfaceDetails: setup.interfaceDetails}`; `decision` = `manager/setup-jobs/{setup.jobId}/decisions.json` when it exists, else `{}`.
- [ ] **Step 4: Run** the file — Expected: PASS (10 tests). Then run `node --test tests/*.test.mjs` — Expected: no new failures (the known flaky "duplicate requests stay single-flight" may fail intermittently).
- [ ] **Step 5: Checkpoint.**

### Task 4: Read helpers

**Files:**
- Create: `kit/manager/foundations/query.mjs`
- Test: `tests/manager-item-query.test.mjs`

**Interfaces:**
- Consumes: `resolveValue` from `server/state.mjs`.
- Produces:
  - `listItems(draft, {domain, collection, kind, type, prefix, query, limit=100, cursor=0}={}) -> {items:[{name, kind, collection?, type?, values:{mode: resolved}, description?}], next:number|null, total}`. `domain` maps through the `foundations` table in `server/state.mjs` (prefixes and style lists). `query` matches name or description, case-insensitive.
  - `getItems(draft, names) -> [{kind, item, resolved:{mode: value}, aliasChain:{mode: string[]}, usedBy:[{kind, name, via}]}]`. Unknown names → `ItemError('Unknown item: {name}.')`. `via` is `'alias'`, `'bound.{key}'` or `'effect color'`.
- [ ] **Step 1: Write the failing tests**: `list filters by domain and query` (`domain:'shape'` returns the 4 radius semantics and the radius primitives; `query:'brand'` finds `color/brand/primary`); `list pages` (`limit:2` returns `next:2`); `get returns alias chain and usedBy` (`color/shadow/ambient` usedBy `[{kind:'effectStyle', name:'elevation/control', via:'effect color'}]`; `radius/control` aliasChain `{Value:['radius/control','scale/radius/8']}`); `get refuses unknown names`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS (4 tests).
- [ ] **Step 5: Checkpoint.**

### Task 5: MCP item tools

**Files:**
- Modify: `kit/mcp/server.mjs` (register 6 tools; update the server `instructions` sentence list to mention item tools)
- Modify: `kit/manager/server/changes.mjs` (add action `done`)
- Modify: `tests/manager-mcp.test.mjs` (tool-name list)
- Test: `tests/manager-mcp-items.test.mjs`
- Modify: `tests/manager-change-requests.test.mjs`

**Interfaces:**
- Consumes: `createItemStore` (Task 3), `listItems`/`getItems` (Task 4), `createChangeRequests` (`server/changes.mjs`), `sessionOutput` (`server/files.mjs`).
- Produces (zod schemas; every tool takes `session`):
  - `ds_create_items_list {domain?, collection?, kind?, type?, prefix?, query?, limit? (1–200), cursor?}` read-only → `listItems` result + `revision`.
  - `ds_create_items_get {names: string[1..50]}` read-only → `{revision, items}`. The name `rules` returns `foundation-rules.json` (or the defaults it would be seeded with).
  - `ds_create_items_change {expectedRevision:int, ops: object[1..200], reason: string(1..200), dryRun?: boolean, confirmed?: boolean}` → store `change` with `author:'mcp'`. The description tells the agent: dry-run first; when `wide` is set, show the impact to the user and resend with `confirmed:true` only after they agree. A 428 refusal is returned as a normal result `{status:'needs-discussion', wide, impact}`, not as `isError`.
  - `ds_create_items_history {limit? (1–100)}` read-only.
  - `ds_create_items_restore {revision:int, expectedRevision:int}`.
  - `ds_create_change_requests {action?: 'list'|'done', id?: uuid, revision?: int}` → `list` returns `{requests}`; `done` sets `status:'done'`, `doneRevision`, `updated`.
  - `changes.update({action:'done', id, revision})` in `changes.mjs`; `prompt()` skips requests whose status is `done`.
- [ ] **Step 1: Write the failing tests** in `tests/manager-mcp-items.test.mjs` with the SDK stdio client pattern from `tests/manager-mcp.test.mjs` and a workspace whose `workspace/output/fixture/` is filled by `storeFixture` contents: list → get → change (dryRun then real) → history → restore; a wide change without `confirmed` returns `status:'needs-discussion'`; a stale `expectedRevision` returns `isError` with the 409 message; `ds_create_change_requests` done hides the request from the prompt. Add `done` to `tests/manager-change-requests.test.mjs`. Add the 6 names to the sorted tool list in `tests/manager-mcp.test.mjs`.
- [ ] **Step 2: Run** `node --test tests/manager-mcp-items.test.mjs tests/manager-mcp.test.mjs tests/manager-change-requests.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** the tools with the existing `tool(name, description, schema, handler, readOnly)` helper. Descriptions say what each does in one sentence and that changes never touch Figma.
- [ ] **Step 4: Run** the three files — Expected: PASS. Then `node kit/manager/cli.mjs mcp tools` lists the 6 new tools.
- [ ] **Step 5: Checkpoint.**

### Task 6: Figma setting

**Files:**
- Create: `kit/manager/server/settings.mjs`
- Modify: `kit/manager/server/index.mjs` (mutation `/api/settings`, 4096-byte limit; `/api/state` adds `figma`; `publishSteps` drops the `figma` part of the foundations text when off)
- Modify: `kit/manager/cli.mjs` (`--no-figma` on `init-web` writes the setting after the session dir exists; usage string)
- Modify: `kit/web/scripts/manager-setup.tsx` (a "Use Figma" switch row in the Context dialog, id `setup-figma`, checked by default), then regenerate with `node kit/web/scripts/build-manager-setup.mjs` from `kit/web`
- Modify: `kit/manager/client/features/setup.mjs` (switch change → `POST /api/settings {figma}`; reflect `state.figma`)
- Modify: `kit/manager/client/features/build.mjs` (hide `#publish` and the "· In Figma / Figma is optional" text when `state.figma === false`)
- Test: `tests/manager-settings.test.mjs`; extend `tests/manager-build-request.test.mjs`

**Interfaces:**
- Produces: `readFigmaSetting(outputDir) -> boolean` (ledger `flags.figma`, default `true`, missing ledger → `true`); `writeFigmaSetting(outputDir, figma:boolean) -> boolean` (creates `{flags:{figma}}` when the ledger is missing; otherwise merges into `flags` and keeps every other field).
- `/api/settings` body `{figma:boolean}`, anything else → 400 `Send {figma: true|false}.`
- [ ] **Step 1: Write the failing tests**: default true; write false keeps `foundationReview` and `sequence`; missing ledger is created with only `flags`; `/api/settings` round trip shows `figma:false` in `/api/state`; `publishSteps.foundations` text has no "Figma" when off (assert in `manager-build-request.test.mjs`); CLI `init-web --slug x --no-figma` in a temp workspace leaves `flags.figma === false` (spawn with `--dry-run` if the CLI supports it; otherwise call `writeFigmaSetting` through the same code path the CLI uses and test that path).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.** `publishStatus` already ignores unknown ledger keys; confirm a ledger holding only `flags` gives `status:'unavailable'` as before.
- [ ] **Step 4: Run** `node --test tests/*.test.mjs` — Expected: no new failures. Restart Builder (`S=session-a45f45f5-6df6-4ef9-a9cc-049753fc4741 && node kit/manager/cli.mjs stop --slug $S; node kit/manager/cli.mjs init-web --slug $S`) and check the switch in headless Chrome without toggling the live session's setting.
- [ ] **Step 5: Checkpoint.**

### Task 7: Builder saves through the store

**Files:**
- Modify: `kit/manager/server/index.mjs` (mutation `/api/foundations`, 64 KB limit; body `{expectedRevision, ops, reason}` → `store.change({...body, author:'builder', confirmed:true})` (the user is making the change by hand); `/api/foundations-restore` body `{revision, expectedRevision}`)
- Create: `kit/manager/client/features/foundation-save.mjs`
- Modify: `kit/manager/client/app.js`, `kit/manager/client/features/controls.js`, `kit/manager/client/features/motion.mjs`
- Modify: `kit/manager/client/index.html` (remove the "Controller edits are previews" line's source in app.js; `#reset-preview` becomes "Undo last change")
- Test: `tests/manager-foundation-save-browser.test.mjs`; update `tests/manager-prepare-browser.test.mjs` if it asserts the preview note

**Interfaces:**
- Consumes: store via HTTP; `state.source.revision`.
- Produces: `setupFoundationSave({getState, refresh}) -> {save(ops, reason), undo()}`. `save` debounces 300 ms per control, merges queued ops, sends one request with `expectedRevision = state.source.revision`, and on 409 refreshes once and resends; on other errors shows the message in `#foundation-save-status` (new `role="status"` line under the canvas header).

Control → op mapping (replace each `draft.values`/`draft.settings` write listed by `grep -n "draft\.\(values\|settings\)\.\(set\|delete\)" kit/manager/client`):

| Control | Op |
|---|---|
| Radius base (`radius-base-rem`) | `apply radius-base {rem}` |
| Radius step (`data-radius-step`) | `set {name, mode, value: rem*16}` |
| Primitive picker (`data-primitive-option`) | `set {name, mode, alias}` |
| Spacing base (`space-base-rem`) | `apply space-base {rem}` |
| Type scale (`type-scale`) | `apply type-scale {percent}` |
| Typeface (`type-family`) | `apply type-family {family}` |
| Shadow seed (`data-shadow-seed`) | `apply shadow-seed {seed}` |
| Shadow layers (layer editor) | `set {kind:'effectStyle', name, fields:{effects}}` |
| Motion duration (`motion-duration-ms`) | `set {name, mode, value: ms/1000}` |

Name and product fields (`ds-name`, `ds-product`) stay previews in this phase. Selection-only settings (`motion-duration-token`, `motion-easing-token`) stay in `draft.settings`.

- [ ] **Step 1: Write the failing browser test** on a temp `setupFixture()` session (never the live one): change the radius base to 0.75 rem, wait for the status line `Saved · revision 2`, reload the page, and the Shape page shows `12px` for `radius/control`; click "Undo last change" → revision 3 shows the old value; an MCP-side store change (call `createItemStore` directly on the fixture dir) appears in the open page after the next state refresh with `Revision 4 · saved by agent`.
- [ ] **Step 2: Run** `node --test tests/manager-foundation-save-browser.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** the endpoint, `foundation-save.mjs`, and the mapping. Remove "Controller edits are previews. Ask the agent to save any changes before approving." from app.js. Serve the new client file in the static list in `server/index.mjs`. Store the author of the last history entry in `/api/state` as `source.savedBy` (`'builder'|'mcp'`) for the "saved by agent" line.
- [ ] **Step 4: Run** `node --test tests/*.test.mjs` — Expected: no new failures. Restart Builder and open http://127.0.0.1:49854 read-only in headless Chrome: the controls render and no error appears. Do not save anything to the live session.
- [ ] **Step 5: Checkpoint.**

### Task 8: Sync state, baseline and local diff

**Files:**
- Create: `kit/manager/foundations/baseline.mjs`
- Modify: `kit/manager/server/publish.mjs` (on an accepted `completed` finish, write the baseline)
- Modify: `kit/manager/server/index.mjs` (`/api/state` adds `sync: {state, revision, baselineRevision, changes}`)
- Modify: `kit/mcp/server.mjs` (tool `ds_create_items_diff`), `tests/manager-mcp.test.mjs` (tool list)
- Modify: `kit/manager/client/features/build.mjs` + `kit/manager/client/index.html` (Figma step shows the state and the diff list; hidden when Figma is off)
- Test: `tests/manager-item-baseline.test.mjs`

**Interfaces:**
- Consumes: `readFigmaSetting` (Task 6), `createItemStore().read()` (Task 3).
- Produces:
  - `itemHashes(draft) -> {items:{'variable:{name}'|'textStyle:{name}'|'effectStyle:{name}'|'gridStyle:{name}'|'collection:{name}': sha256 hex (16 chars)}, groups:{'{collection}'|'textStyles'|'effectStyles'|'gridStyles': sha256 hex (16 chars)}}`. Hash input is the item's canonical JSON (sorted keys), so key order never changes a hash.
  - `writeBaseline(outputDir, draft) -> void` writes `figma/synced.json` = `{format:'ds-create/figma-baseline@1', revision, time, draft, hashes:itemHashes(draft)}`. Figma ids are added in phase 4.
  - `localDiff(baselineDraft, draft) -> {added:[{kind,name}], changed:[{kind,name,fields:[{field, from, to}]}], renamed:[{kind,from,to}], deleted:[{kind,name}]}`. A rename is a delete plus an add whose item JSON is equal apart from `name` and `codeSyntax`.
  - `syncState(outputDir) -> {state:'local'|'in-sync'|'local-changes', revision, baselineRevision|null, changes:number}`: `local` when Figma is off or there is no baseline; `in-sync` when the hashes match; otherwise `local-changes`. (`figma-changes` and `conflict` arrive in phase 4.)
  - `ds_create_items_diff {session}` read-only → `{...syncState, diff: localDiff(...)}` (diff empty for `local`).
- [ ] **Step 1: Write the failing tests**: `hashes ignore key order`; `diff lists a changed value` (baseline radius/control alias `scale/radius/8`, local `scale/radius/12` → `changed[0].fields[0]` = `{field:'values.Value', from:{alias:'scale/radius/8'}, to:{alias:'scale/radius/12'}}`); `diff detects a rename` (rename `radius/sm` → `radius/small` gives one `renamed` entry, not an add and a delete); `state follows the baseline` (no baseline → `local`; `writeBaseline` then read → `in-sync`; a store change → `local-changes` with `changes:1`; `writeFigmaSetting(false)` → `local`); `publish finish writes the baseline` (through the publish fixture's successful MCP finish path, `figma/synced.json` exists with the published revision).
- [ ] **Step 2: Run** `node --test tests/manager-item-baseline.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement.** Builder copy: state labels "Not in Figma yet", "In sync with Figma", "{n} changes not in Figma"; the diff list shows `name: old → new` per row, up to 50 rows, then "and {n} more".
- [ ] **Step 4: Run** `node --test tests/*.test.mjs` — Expected: no new failures.
- [ ] **Step 5: Checkpoint.**

### Task 9: Docs

**Files:**
- Modify: `skills/ds-create/reference/agent-mcp.md` (section "Item tools": the 6 tools, the op shapes, the color ramp rule, and the flow "read, dry-run, discuss when `wide`, apply with `confirmed` only after the user agrees, report the revision")
- Modify: `skills/ds-create/SKILL.md` (one rule line: change items with `ds_create_items_change`; never edit `foundations.json` by hand)
- Modify: `skills/ds-create/reference/init.md`, `init-web.md`, `build.md` (`--no-figma` row: "Figma off for this session (ledger `flags.figma: false`)"; build notes that Figma-off build arrives in phase 2)
- Modify: `workflow/MANAGER.md` (Builder controls save; Undo last change; Use Figma switch)

- [ ] **Step 1:** Write the doc changes.
- [ ] **Step 2:** Deslop review through Codex (`--model chatgpt-web/gpt-6-sol --fresh`, read-only, two rounds); save the report to `.claude/copy-reviews/ds-items-phase1-docs.copy-review.md`. If Codex is unavailable, say so and mark the docs not reviewed.
- [ ] **Step 3:** Run `node --test tests/*.test.mjs` — Expected: no new failures (some tests grep docs).
- [ ] **Step 4: Checkpoint.**
