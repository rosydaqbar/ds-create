# DS Create Builder · init workspace

DS Create Builder is the builder's local view of init. A **builder** creates and maintains a design system and its documentation with ds-create. A **consumer** uses the result: designers in Figma and developers in the web docs. A **maintainer** develops ds-create itself. Manager belongs to the builder; it is separate from the consumer docs site and exists even for a Figma-only build or an App product.

Version 1 shows Overview and foundation output. Generation is driven by the local agent. `ds-create init-web` opens this workspace before inputs or foundations exist; its onboarding collects context/files and missing answers in the web (`skills/ds-create/reference/init-web.md`). The dashboard reads local files and can start a local agent for the explicit Publish-to-Figma action. Foundation controllers remain unsaved previews; publishing uses the saved draft and creates no components. Keep the existing Figma init gates and steps 1–4.

The center is an infinite pan/zoom canvas. The fixed toolbar offers zoom presets, zoom in/out and Fit; dragging or scrolling pans, Ctrl/Command + scroll zooms around the pointer, and touch supports panning/pinch. With the canvas focused, arrows pan, +/- zoom, 0 shows 100%, and 1 fits content. Camera positions are kept per tab during the session. Navigation and the contextual workspace on the right are outside the canvas transform.

The right panel is a static editing prototype for now: Overview has DS identity fields, Color has semantic-token controls per mode (no editable primitives), and other foundation tabs show their relevant settings. Prototype changes affect browser memory and specimens only; Reset preview restores the source values, and reload clears the draft. The preview controls do not save names, token overrides or settings to files/Figma; the separate Publish endpoints record approval and start/stop the Figma job; web setup endpoints save context and run local preparation. Do not describe these preview controls as persisted changes.

Color rows use readable role names with the exact semantic path below. Linked values show a primitive reference (the palette namespace is omitted in the field, retained in its tooltip) and a resolved swatch. Clicking the field opens a searchable picker with every primitive color and its swatch, including the current selection. Mouse or arrow keys plus Enter choose a primitive; Escape or the close button dismisses it and returns focus. Choosing an existing primitive keeps the preview value aliased; literal source values are labeled Custom value and can be linked through the same picker.

Typography includes locally bundled Inter, Geist and Plus Jakarta Sans as prepared preview choices. A named system/brand font remains the initial choice; placeholder generic stacks start the unsaved preview with Inter. Font assets and licenses live in `kit/manager/fonts/` and use explicit localhost routes. Changing the preview family does not overwrite font tokens or install a font into Figma. Init offers these three only when a UI font is unspecified (`workflow/QUESTIONNAIRE.md`).

Figma verification is required for completed init. A skipped required step is labeled Skipped, never given a success check/color or included in the completed count. Skipped Figma leaves Setup incomplete even when saved foundation values are available to inspect. Overview uses Foundation preview and Foundation library; explanations describe the foundations' design purpose. Typography preview labels show the active family name, not a CSS fallback stack.

Spacing shows a base-unit specimen and a four-column multiplier scale on the canvas. Specimens use the web-docs PreviewCard structure (docs-preview, toolbar and bordered docs-stage) and shared presentation styles, with neutral measures. The right workspace edits the preview base in rem and summarizes density in rem/pixels (16px reference per rem). Its initial value uses saved space/xs when available, otherwise 4px. Edits remain local. The top bar has no Live marker; polling and the recoverable connection-error banner remain active.

## Start during init

After inputs/basic choices are saved, prepare the local foundation draft and start Manager before Figma verification or generation for new systems. The builder reviews the saved revision here, requests changes through the agent, and approves it in chat or through the explicit Publish to Figma action before Figma writes. Existing Figma-only baselines remain readable without migrating them. It is local preparation, not a new numbered Figma step or a consumer-site build.

From the workspace root:

```sh
node kit/tools/manager.mjs start --slug {slug}
```

The command copies `kit/manager/` into `workspace/output/{slug}/manager/`, copies the web docs' shared `docs-presentation.css`, generates the same chrome defaults used by web docs, and launches a detached Node server bound to `127.0.0.1` on a free port. No npm install or consumer-site generation is needed. The return contains the actual `url`, `pid` and `reused` flag. Repeating start reuses the selected system's healthy server; it never attaches to another system or assumes a fixed port. Node 20+ is required for every init.

Open the returned URL using the available browser tool or the system opener. Opening the dashboard and leaving its server running are part of init; do not stop it at the end of the turn. Report its URL promptly if launched early, and again in the final init report. When the environment cannot keep a background process alive or open a browser, report the exact limitation, keep the generated Manager files, and provide the start command. Do not claim Manager is running without a successful health check.

```sh
node kit/tools/manager.mjs status --slug {slug}
node kit/tools/manager.mjs stop --slug {slug}
```

Only stop when asked or when cleaning up a development/test server. `manager/runtime.json` records the actual running instance; `manager/server.log` holds startup errors. On a failed start, inspect that log and retry after fixing the cause. A Manager failure does not undo completed Figma work, but init's local handoff stays open until Manager is available or its environment limitation is reported.

## Identity and progress

Keep the existing ledger as the source for steps 1–4. Its top-level `system` is the display name, `scope.productType` is Web/App/Web and App, and `figma.url` is the builder's working file link. Existing `figmaUrl` and `scope.figmaUrl` are also supported. Manager uses the link locally; this does not authorize publishing it in the consumer docs.

### Local draft and approval

`workspace/output/{slug}/foundations.json` is the reviewed source. It uses the same collection/variable/style payload as the W2 export (`workflow/WEB.md`), with `format: "ds-create/foundations@1"` and a positive integer `revision`. Required arrays are `collections` (name, modes) and `variables` (name, collection, type, values by mode). Optional `textStyles`, `effectStyles`, `gridStyles` use the export style schema. Variable aliases are `{ "alias": "full/token/path" }`. No Figma IDs are needed. Init includes tokens/text/effects; grid styles, icon and asset components still belong to build. Values come from the selected system's inputs/specs and recorded decisions, never a universal sample brand.

Builder prefers this file over `figma/figma-variables.json`. A malformed/missing previously tracked draft displays an error instead of falling back to stale Figma values. Without a local draft/review record, legacy workspaces keep reading their Figma export. Valid saved draft data is ready to inspect before Figma; this readiness does not mean init is complete.

Save files atomically. Increment `revision` for draft edits. `manager.mjs status --slug {slug}` returns `source` with the file, revision, SHA256 of its exact saved bytes, and review state. After the user explicitly approves the saved revision in chat (or clicks Publish to Figma for the shown revision/target), the agent records this ledger field:

```json
"foundationReview": {
  "status": "approved",
  "hash": "<source.hash of the revision actually reviewed>",
  "approvedBy": "user",
  "approvedAt": "<ISO timestamp>",
  "approvalSource": "workspace/input/{slug}/answers/01-init.md#<approval-entry>"
}
```

Use `status: "pending"` until that approval; do not fabricate approval evidence. The hash must match the saved draft. Changing any bytes invalidates approval, even if old init/build steps say done. Browser controller edits are not part of this file: ask the agent to apply requested changes, then review the saved revision. Publish records its explicit click approval in manager/jobs/{id}/request.json and the ledger. Controller edits still have no browser save or sync.

`source.review` is `pending`, `approved`, `synced`, or `invalid` (`not-required` for legacy export-only systems). Pending shows Review foundations; approved shows Ready for Figma. After verifying the file/fonts and completing Figma writes plus the zero-failure token audit, save the confirmed Figma export, mark step4 done and add `foundationReview.figmaHash` equal to the approved current hash. Only then is the local revision synced. All four required init steps must also be done to show Init complete. A normalized comparison also requires every approved variable mode/value/alias, description and supplied metadata plus all approved text/effect/grid properties to match the confirmed export. Equivalent color/measurement representations, ordering and transport IDs are ignored; unrelated existing extra content may remain. The worker saves manager/jobs/{id}/foundation-diff.json. A missing/mismatching export or failed audit prevents synced; build/publish cannot use stale approval.

### Figma generation progress

At the start of approved Figma generation set step4 `building`. Publish actual per-foundation Figma work:

```sh
node kit/tools/manager.mjs progress --slug {slug} --foundation color --status generating --message "Creating approved palette and semantic variables in Figma."
```

Foundation IDs: `color`, `typography`, `space`, `shape`, `elevation`, `motion`, `iconography`, `brand-assets`. Statuses: `pending`, `generating`, `ready`, `error`, `skipped`. These commands update only `manager/progress.json`. Local draft specimens stay inspectable during Figma work; errors and confirmed exclusions remain visible. Clear resolved error entries after recovery. In legacy export-only workspaces, progress still controls generating/ready views and ready requires exported data.

Save `figma/figma-variables.json` only from confirmed Figma writes, then update its progress entry. Reuse approved local token data for writing; no full export on each update. Planned local data is labelled as a draft and never used as evidence that a Figma write succeeded.

Manager polls approximately every 1.5 seconds, preserves the selected view and filter, and shows the latest saved draft/review state; legacy generation views replace `Generating...` with confirmed output when ready. It reads only the selected system's output. Broken or missing exports, unresolved aliases, generation errors and a lost server connection are visible states. It never invents progress percentages, tokens, modes, components, or a successful audit.

## What appears

Overview shows the four init steps, foundation readiness, palette/type previews when ready, the system identity and exported variable/style counts. Foundation views inspect the selected source (local draft first, legacy export otherwise):

- Color: palettes and semantic roles with mode selection and resolved aliases.
- Typography: exported text-style specimens and font variables.
- Space & layout: spacing, size variables and any exported grid styles.
- Shape: radius and border-width variables.
- Elevation: effect styles and shadow specimens.
- Motion: duration/easing variables and their exported modes.
- Iconography and Brand assets: “Not generated yet” during init, because their library components are made at build step 6. No empty component gallery is fabricated.

Manager readiness means saved data is inspectable, not that documentation pages or components exist. The original token audit remains the init gate; the inspector reports its saved result separately. Re-running init reuses the export and healthy Manager process without recreating frozen Figma values.

## Init handoff

Before ending init, verify the returned URL responds at `/api/health`, open Overview, then open a populated foundation and compare at least one displayed value/style with the saved source. Verify the pre-Figma handoff at draft review and the final handoff after successful Figma generation. Confirm a saved draft update appears without losing the selected view; report any unverified handoff check. Save the Manager URL and local path in `reports/init.md` along with the Figma result. Report generation and Manager failures accurately. The final handoff includes both the working Figma file and the running DS Create Builder (or an explicit environment limitation and restart command).

Manager uses the web docs' neutral navigation, reading cards, pill controls and preview surfaces. Its chrome defaults are viewer-only; brand values stay in the specimens and source export. Changing Manager does not change the consumer docs or design-system tokens.

All canvas documents, including ready Color/Spacing and pending foundations, use one shared `docs-reading-card` wrapper with a page header, guttered sections and footer. Keep the fixed1120px canvas world. Overview, color tokens, spacing steps, typography and elevation specimens use the same preview renderer: `docs-preview` → `docs-preview-toolbar` + bordered `docs-stage`. Use shared web-docs surfaces, frame padding and corner radii; only specimen contents/layout differ. Interactive color frames retain accessible selection and full token paths; tables remain tables within the document. Do not introduce unwrapped tab layouts or independent card chrome.

Shape's workspace is **Radius**: four corner presets, a rem base field and collapsible Derived steps for exported semantic radius tokens. The saved `radius/control` (or `radius/lg`, then first finite step) anchors proportions. Base edits scale finite steps proportionally; None and full/pill anchors stay fixed. Individual finite steps accept local overrides. Canvas specimens show the same values, and border widths remain separately inspectable. Source primitive variables and aliases are unchanged; preview overrides are labelled explicitly.

Elevation's workspace is **Shadow**: a Seed color reference/opacity and paired range/number fields for blur, spread, X and Y; a collapsible Ramp lists the existing exported elevation styles, with a gear per style. Seed ratios scale the saved layer geometry, with additive deltas when a saved seed dimension is zero; opacity ratios retain existing ambient/key weighting. Color fields retain semantic references instead of replacing tokens with raw palette colors. Focus styles stay outside the editable ramp and are not changed by the seed.

The gear opens a viewport-contained layer dialog: Drop/Inner type, X/Y, blur/spread, color reference/opacity, layer order, removal and Add layer. Per-style overrides remain independent of subsequent seed changes; Reset step resumes deriving that style from the seed. Removing all layers intentionally produces no shadow. Close/Escape/outside click return focus to the gear. Numeric preview updates preserve the active native field/slider, inspector scroll and canvas camera. All controls remain browser-memory previews; Reset preview/reload clears them. No token, ledger or Figma writes are added.

## Publish: Figma, then build

Publish sits beside appearance and stays disabled until a valid saved foundation draft is ready after preparation or chat-led init (or a legacy init is complete). It starts disabled while status loads and disables again on stale/invalid/incomplete setup or lost connection; its tooltip explains the prerequisite. A local reviewed draft enables Publish before Figma generation, so its own action remains reachable. Once enabled, it opens exactly2 steps. **1. Publish to Figma** shows the saved revision, excludes unsaved controller edits, asks for an editable existing Figma file URL, and starts a local Codex CLI job when clicked. That click approves only the shown saved hash/target. **2. ds-create build** stays locked until the current approved revision has been generated/audited in Figma; then Copy command copies exactly `ds-create build` for engine/scope selection in the user's agent. It does not auto-start a build, publish a Figma library for team consumption, or deploy a site. Older build records remain visible context, not evidence that a changed foundation revision has been rebuilt.

The local runner uses `codex exec` with fixed argv/stdin, workspace-write sandbox, existing configured model/auth/MCP, and a structured result. No dangerous bypass flags or project API keys. Codex must be installed on PATH and signed in; connect Figma authoring MCP in that local agent. A missing authoring tool, font, permission or new decision stops with an actionable message. Missing CLI disables starting. Sample preview data is blocked from real publishing. No runner command, shell string, output path or arbitrary prompt is accepted from the browser.

Request/approval and state are saved in `manager/jobs/{id}/request.json`, `status.json`, `result.json` and local events/stderr logs; `manager/figma-job.json` points to the current job. The worker verifies the exact hash before/after work. It runs init's Figma steps only and checks required done steps, selected file, confirmed export, matched approved/Figma hash and `figma/audit-file.json` (`mode:file`, `sourceHash`, `result.fail:0`). Exit0 or a successful model response alone cannot unlock build. Legacy completed baselines reuse their existing Figma result. Closing Publish leaves work running; Stop agent cancels the child process group and makes no rollback promise. A30-minute timeout, bounded logs and parent-process watchdog prevent unattended orphan work. Retries inspect partial output rather than clearing it.

`GET /api/publish-flow` returns fresh gates/job state. Publish mutations use `POST /api/publish-figma` and `/api/publish-cancel` (web setup has its own routes below); they require same-origin localhost, JSON and a per-instance CSRF token. Other APIs/preview controls remain read-only. Concurrent requests are single-flight; stale reviewed hashes conflict instead of approving a new revision. Polling preserves the typed target. A changed draft while the modal is open requires closing/reviewing it again. Errors support Check again; closing/Escape returns focus to Publish. Clipboard failure leaves the build command selectable. Local logs are never exposed by static/API routes.

The test runner injects a local fake process and marks the whole flow Simulation; it never invokes Codex or Figma. This is separate from the default installed runner and cannot be selected through browser request parameters.

## Motion preview

Motion uses shared docs preview frames on the canvas: a selected transition, simultaneous duration lanes, and easing curve plots with playable tracks. Delays remain a supporting token table. The workspace selects saved semantic duration/easing tokens by current mode; an optional duration fine-tune changes only browser preview samples. Duration comparison retains saved timings, including zero and loop durations (shown as a single traversal, not an endless animation). Each playback runs once and can be replayed or reset. Reset preview restores source-based selections and timing.

Reduced mode and the device's reduced-motion preference replace spatial travel with an instant change or fade capped at120ms; source values remain visible. This is the preview's accessibility alternative, not a token rewrite. Rendering a changed source/control, switching routes, or hiding the tab cancels playback. No autoplay, permanent loops, source-file writes or Figma sync are added.

## Web-first bootstrap

`node kit/tools/manager.mjs init-web [--slug {slug}]` starts the same detached server immediately, without tokens, ledger or Figma. With no slug and no existing sessions it allocates a stable session UUID; otherwise it returns a choice of saved sessions and explicit resume/new commands without launching another server. `sessions` lists these read-only and `init-web --new` explicitly creates a separate session. `init-web --slug {slug}` resumes/reuses that exact system. Context exposes a copyable resume command; the chosen DS name later lives in the ledger. Its `manager/setup.json` persists the onboarding stage. Existing initialized systems do not get an onboarding record. The new command completes at the verified browser handoff; init itself remains incomplete until the Figma gates pass.

Context opens a shared-style modal with required Project name, Context / Instruction and Context files. Project name is 1–100 trimmed single-line characters, with spaces/Unicode supported. On first save it also determines setup.inputSlug (Acme Design System → acme-design-system): lowercase kebab case, normalize accents, preserve Unicode letters/numbers, bound to60 characters, reject names without letters/numbers. The input slug is separate from the stable output/session Project ID used by the copyable resume command. Persist the mapping once; later display-name revisions keep it. Legacy submitted sessions without inputSlug retain their original input folder. Reject an occupied unrelated destination without merging; copy any existing files belonging to this session into a new named input tree and retain their originals. Persist it in setup.projectName and the context source, pass it in the trusted worker request, and use it for ledger.system and foundation-plan.projectName. Header, saved-context summary, resume disclosure and session list show this chosen name before generation too. An unnamed session shows Not named yet in the disclosure. Preserve the actual product name independently in plan.product.name. Renames use the existing revision/regeneration gate and never move folders. Submit saves text in chat and original file bytes/names in input/{inputSlug}/uploads/{batch}/, never overwriting another upload. Multipart requests are bounded (10 files,25MB/file,50MB total,20k context chars); input directories reject symlink escapes. JSON encoding of the context field preserves original newline bytes through multipart transport. Sources/answers are indexed by the agent after reading them. Uploaded files are never exposed as static URLs.

`GET /api/setup-flow` returns saved context/files, current job/questions and an instance CSRF token. Same-origin guarded POST routes: `/api/setup-submit` (initial multipart), `/api/setup-revise` (multipart with the expected inputRevision), `/api/setup-answers` (current job id + answers), `/api/setup-retry` and `/api/setup-cancel` (empty JSON). No browser-supplied agent command, prompt template or output directory. Preparation and Publish cannot overlap. The CLI status includes setup stage; lifecycle stop cancels both owned job types.

Read all web-session inputs/answers/knowledge from workspace/input/{setup.inputSlug}/ (legacy fallback: session ID), never from the output ID by inference. Trusted setup and Figma requests carry inputSlug; readiness, input freshness and approval hashes resolve the same tree. Outputs remain workspace/output/{session}/. Preparation uses the existing local Codex configuration with fixed argv, structured output, process watchdog, timeout and log limits. Questions are returned to the web and answers saved before the next continuation. The snapshot hashes the full selected input tree (paths, bytes, additions/removals), including knowledge and previous chat/answers, excluding only generated sources.md and answers/01-init.md. Symlinks and nonregular files block preparation. Jobs check it before/after work; readyInputHash and inputRevision bind local readiness to the same source snapshot. Publish and synced/build gates recheck it even without polling Context. Never read unassigned loose inputs outside the tracked tree. Sources.md is an index, not an authority that limits the dependency set. Missing CLI still saves input, then shows retry guidance. Partial source data stays hidden until the canonical draft/aliases, core foundations, platform, answers, sources, provisional report and pending Figma ledger pass the local handoff checks. These artifact checks do not replace user review or prove the design quality of agent decisions. A ready draft unlocks the separate Figma approval workflow; it does not mark init complete. No token-controller sync or automatic build is introduced.

## Source revisions and foundation plan

After a submitted setup, Edit context / add files is available in questions, failed/blocked/interrupted/cancelled and ready states. Stop active preparation first; Figma publication also blocks revision. Each explicit Save & prepare again appends a context file and upload batch, increments inputRevision, preserves saved answers and originals, invalidates approval, and starts preparation. A repeated original filename supersedes its older upload as current source; the worker request lists activeFiles and the latest contextFile. Revisions remain in setup.json. An old browser revision gets a conflict rather than replacing the newer one. Cancel edit makes no changes.

For web preparation, save `workspace/output/{slug}/foundation-plan.json` alongside the canonical draft:

```json
{
  "format": "ds-create/foundation-plan@1",
  "inputHash": "<trusted request inputHash>",
  "inputRevision": 1,
  "projectName": "<chosen Builder project name>",
  "product": { "name": "<from input>", "description": "<real product description>", "platform": "Web" },
  "systemMode": "new",
  "naming": "normalize",
  "decisions": [
    { "key": "ui-font", "value": "<settled choice>", "decidedBy": "user", "source": "chat/<saved-context>.md" }
  ],
  "domains": {
    "color": { "status": "included", "variables": ["<exact saved variable names>"], "styles": [] },
    "typography": { "status": "included", "variables": ["<exact names>"], "styles": ["<exact text style names>"] },
    "space": { "status": "included", "variables": ["<exact names>"], "styles": [] },
    "shape": { "status": "included", "variables": ["<exact names>"], "styles": [] },
    "elevation": { "status": "included", "variables": [], "styles": ["<exact effect style names>"] },
    "motion": { "status": "excluded", "reason": "<actual settled exclusion>", "source": "chat/<saved-context>.md" }
  }
}
```

This is schema documentation, never a sample system to generate. `systemMode` is new/existing; `naming` is normalize/keep. Record every settled product/brand/platform/token decision; decidedBy is user/AI, and AI decisions also require reason. All source paths must exist in the trusted snapshot. Map all six domains, with exact names for included values/styles or a sourced reason for exclusions; do not invent exclusions to pass validation. Included typography/elevation require usable text/effect styles. Existing systems may preserve names and frozen raw values; new semantic tokens alias raw primitives and describe their concrete UI purpose, with canonical collection/token grammar and Part C text-style names. Record scopes explicitly (empty for hidden primitives/motion), matching WEB codeSyntax for Web/Web and App, and hiddenFromPublishing:true for raw primitives. Confirm metadata with the full/PART Figma exporter; compact hash/rows exports omit it and cannot certify equality. There is no universal token-count target. The shared checker also requires the ledger/plan project name to match the explicit setup name, and validates values/types/mode coverage, aliases and styles before ready and again before Publish. These checks prove structural usability and traceability, not the quality or truth of model decisions; user review and the real Figma audit still apply.

An older web setup with no snapshot/plan is marked outdated and must prepare again; legacy export-only systems remain readable. A direct agent may edit a canonical draft against the same inputs and keep the plan's exact mapped names current, then increment revision and return to review. If source inputs changed, regenerate through Context; never fabricate manager-owned readyInputHash or inputRevision.

## Builder interaction motion

Builder chrome has its own neutral motion: native dialogs enter in250ms and close in150ms, with a fading backdrop; anchored token/shadow editors enter in200ms. Route content and workspace crossfade only on a tab change, without moving the canvas camera. New setup questions and phase results use a200ms bounded reveal; polling or typing does not replay it. Controls acknowledge hover/press without hover lift. These timings are viewer-only and independent of the system's Motion tokens. Device reduced motion removes modal scaling/exit delay and uses an80ms opacity-only alternative for state changes. Closing retains native focus containment until completion, Escape returns focus, and rapid reopening cancels stale close timers. No animation library, automatic specimen playback or token sync is added.
