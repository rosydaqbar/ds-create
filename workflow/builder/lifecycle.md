# DS Create Builder · init workspace

DS Create Builder is the builder's local view of init. A **builder** creates and maintains a design system and its documentation with ds-create. A **consumer** uses the result: designers in Figma and developers in the web docs. A **maintainer** develops ds-create itself. Manager belongs to the builder; it is separate from the consumer docs site and exists even for a Figma-only build or an App product.

Version 1 shows Overview and foundation output. Generation is driven by the local agent. `ds-create builder` opens this workspace before inputs or foundations exist; its onboarding collects context/files and missing answers in the web (`skill/reference/builder.md`). The dashboard reads local files and queues preparation/publication work for a compatible MCP client. Foundation controllers remain unsaved previews; publishing uses the saved draft and creates no components. Keep the existing Figma init gates and steps 1–4.

The center is an infinite pan/zoom canvas. The fixed toolbar offers zoom presets, zoom in/out and Fit; dragging or scrolling pans, Ctrl/Command + scroll zooms around the pointer, and touch supports panning/pinch. With the canvas focused, arrows pan, +/- zoom, 0 shows 100%, and 1 fits content. Camera positions are kept per tab during the session. Navigation and the contextual workspace on the right are outside the canvas transform.

The right panel edits the saved draft. Color provides semantic-token controls for each mode, and each other foundation tab has its own settings. These controls save as you change them (*Saving and undo* below). Overview's identity fields (name, product) are still previews: Reset preview clears them, and nothing about them is saved. The Publish endpoints record approval and start or stop the Figma job; the web setup endpoints save context and run local preparation.

Color rows use readable role names with the exact semantic path below. Linked values show a primitive reference (the palette namespace is omitted in the field, retained in its tooltip) and a resolved swatch. Clicking the field opens a searchable picker with every primitive color and its swatch, including the current selection. Mouse or arrow keys plus Enter choose a primitive; Escape or the close button dismisses it and returns focus. Choosing an existing primitive keeps the preview value aliased; literal source values are labeled Custom value and can be linked through the same picker.

Typography includes locally bundled Inter, Geist and Plus Jakarta Sans as prepared preview choices. A named system/brand font remains the initial choice; placeholder generic stacks start the unsaved preview with Inter. Font assets and licenses live in `kit/builder/client/assets/fonts/` and use explicit localhost routes. Changing the preview family does not overwrite font tokens or install a font into Figma. Init offers these three only when a UI font is unspecified (`workflow/QUESTIONNAIRE.md`).

Figma verification is required for completed init. A skipped required step is labeled Skipped, never given a success check/color or included in the completed count. Skipped Figma leaves Setup incomplete even when saved foundation values are available to inspect. Overview uses Foundation preview and Foundation library; explanations describe the foundations' design purpose. Typography preview labels show the active family name, not a CSS fallback stack.

Spacing shows a base-unit specimen and a four-column multiplier scale on the canvas. Specimens use the web-docs PreviewCard structure (docs-preview, toolbar and bordered docs-stage) and shared presentation styles, with neutral measures. The right workspace edits the preview base in rem and summarizes density in rem/pixels (16px reference per rem). Its initial value uses saved space/xs when available, otherwise 4px. Edits remain local. The top bar has no Live marker; polling and the recoverable connection-error banner remain active.

## Start during init

After inputs/basic choices are saved, prepare the local foundation draft and start Manager before Figma verification or generation for new systems. The builder reviews the saved revision here, requests changes through the agent, and approves it in chat or through the explicit Publish to Figma action before Figma writes. Existing Figma-only baselines remain readable without migrating them. It is local preparation, not a new numbered Figma step or a consumer-site build.

From the workspace root:

```sh
node kit/builder/cli.mjs start --slug {slug}
```

The command copies `kit/builder/` into `workspace/output/{slug}/manager/`, copies the web docs' shared `docs-presentation.css`, generates the same chrome defaults used by web docs, and launches a detached Node server bound to `127.0.0.1` on a free port. No npm install or consumer-site generation is needed. The return contains the actual `url`, `pid` and `reused` flag. Repeating start reuses the selected system's healthy server; it never attaches to another system or assumes a fixed port. Node 20+ is required for every init.

Give the returned URL to the user to open and operate in their own browser; do not open or automate the browser, attach a debugger, or create a tab group. Leave the server running. Report the URL promptly if launched early, and again in the final init report. When the environment cannot keep a background process alive, report the exact limitation, keep the generated Manager files, and provide the start command. Do not claim Manager is running without a successful health check or claim rendered verification from health alone.

```sh
node kit/builder/cli.mjs status --slug {slug}
node kit/builder/cli.mjs stop --slug {slug}
```

Only stop when asked or when cleaning up a development/test server. `manager/runtime.json` records the actual running instance; `manager/server.log` holds startup errors. On a failed start, inspect that log and retry after fixing the cause. A Manager failure does not undo completed Figma work, but init's local handoff stays open until Manager is available or its environment limitation is reported.

## Identity and progress

Keep the existing ledger as the source for steps 1–4. Its top-level `system` is the display name, `scope.productType` is Web/App/Web and App, and `figma.url` is the builder's working file link. Existing `figmaUrl` and `scope.figmaUrl` are also supported. Manager uses the link locally; this does not authorize publishing it in the consumer docs.

### Local draft and approval

`workspace/output/{slug}/foundations.json` is the reviewed source. It uses the same collection/variable/style payload as the W2 export (`workflow/WEB.md`), with `format: "ds-create/foundations@1"` and a positive integer `revision`. Required arrays are `collections` (name, modes) and `variables` (name, collection, type, values by mode). Optional `textStyles`, `effectStyles`, `gridStyles`, `paintStyles` use the export style schema. Variable aliases are `{ "alias": "full/token/path" }`. No Figma IDs are needed. Init includes tokens, text, effect and paint styles; grid styles, icon and asset components still belong to build. Values come from the selected system's inputs/specs and recorded decisions, never a universal sample brand.

Builder prefers this file over `figma/figma-variables.json`. A malformed/missing previously tracked draft displays an error instead of falling back to stale Figma values. Without a local draft/review record, legacy workspaces keep reading their Figma export. Valid saved draft data is ready to inspect before Figma; this readiness does not mean init is complete.

Save files atomically. Increment `revision` for draft edits. `cli.mjs status --slug {slug}` returns `source` with the file, revision, SHA256 of its exact saved bytes, and review state. After the user explicitly approves the saved revision in chat (or clicks Publish to Figma for the shown revision/target), the agent records this ledger field:

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

`source.review` is `pending`, `approved`, `synced`, or `invalid` (`not-required` for legacy export-only systems). Pending shows Review foundations; approved shows Ready for Figma. **Approve foundations** in the Publish dialog (`POST /api/foundations-approve` with the current hash) records a local approval, `approvalSource: "builder:approve"`, with no Figma step; it is enough for Prepare Parts and for a build round's docs site (`buildGate.site`). An approval already confirmed by a Figma publish is kept. After verifying the file/fonts and completing Figma writes plus the zero-failure token audit, save the confirmed Figma export, mark step4 done and add `foundationReview.figmaHash` equal to the approved current hash. Only then is the local revision synced. All four required init steps must also be done to show Init complete. A normalized comparison also requires every approved variable mode/value/alias, description and supplied metadata plus all approved text/effect/grid properties to match the confirmed export. Equivalent color/measurement representations, ordering and transport IDs are ignored; unrelated existing extra content may remain. The worker saves manager/jobs/{id}/foundation-diff.json. A missing/mismatching export or failed audit prevents synced; build/publish cannot use stale approval.

## What appears

Overview shows the four init steps, foundation readiness, palette/type previews when ready, the system identity and exported variable/style counts. Foundation views inspect the selected source (local draft first, legacy export otherwise):

- Color: palettes, gradients and semantic roles with mode selection and resolved aliases.
- Typography: exported text-style specimens.
- Space & layout: spacing, size variables and any exported grid styles.
- Shape: radius and border-width variables.
- Elevation: effect styles and shadow specimens.
- Motion: duration/easing variables and their exported modes.
- Iconography: a new system exposes the prepared Lucide library reference during init; actual Figma icon components are made at build step 6. Existing icon libraries are preserved.
- Brand assets: during init, Builder shows the SVG, PNG, JPEG and WebP files in the session's Context inputs, including files placed directly in `workspace/input/`. Each file appears on a light and a dark background. If no image files are found, Builder asks for logo files in Context. Asset/library components are made at build step 6. Builder does not create logos or an asset gallery of its own.

Manager readiness means saved data is inspectable, not that documentation pages or components exist. The original token audit remains the init gate; the inspector reports its saved result separately. Re-running init reuses the export and healthy Manager process without recreating frozen Figma values.

## Init handoff

Before ending init, verify the returned URL responds at `/api/health`, open Overview, then open a populated foundation and compare at least one displayed value/style with the saved source. Verify the pre-Figma handoff at draft review and the final handoff after successful Figma generation. Confirm a saved draft update appears without losing the selected view; report any unverified handoff check. Save the Manager URL and local path in `reports/init.md` along with the Figma result. Report generation and Manager failures accurately. The final handoff includes both the working Figma file and the running DS Create Builder (or an explicit environment limitation and restart command).

Manager uses the web docs' neutral navigation, reading cards, pill controls and preview surfaces. Its chrome defaults are viewer-only; brand values stay in the specimens and source export. Changing Manager does not change the consumer docs or design-system tokens.

All canvas documents, including ready Color/Spacing and pending foundations, use one shared `docs-reading-card` wrapper with a page header, guttered sections and footer. Keep the fixed1120px canvas world. Overview, color tokens, spacing steps, typography and elevation specimens use the same preview renderer: `docs-preview` → `docs-preview-toolbar` + bordered `docs-stage`. Use shared web-docs surfaces, frame padding and corner radii; only specimen contents/layout differ. Interactive color frames retain accessible selection and full token paths. Foundation pages show previews, not token tables. If a foundation has no styles to preview, its page shows the variable table. Do not introduce unwrapped tab layouts or independent card chrome.

Shape's workspace is **Radius**: four corner presets, a rem base field and collapsible Derived steps for exported semantic radius tokens. The saved `radius/control` (or `radius/lg`, then first finite step) anchors proportions. Base edits scale finite steps proportionally; None and full/pill anchors stay fixed. Individual finite steps accept local overrides. Canvas specimens show the same values, and border widths remain separately inspectable. A saved step links its semantic token to a primitive of the same family. If no primitive has that value, the store creates one (`scale/radius/12`).

Elevation's workspace is **Shadow**: a Seed color reference/opacity and paired range/number fields for blur, spread, X and Y; a collapsible Ramp lists the existing exported elevation styles, with a gear per style. Seed ratios scale the saved layer geometry, with additive deltas when a saved seed dimension is zero; opacity ratios retain existing ambient/key weighting. Color fields retain semantic references instead of replacing tokens with raw palette colors. Focus styles stay outside the editable ramp and are not changed by the seed.

The gear opens a viewport-contained layer dialog: Drop/Inner type, X/Y, blur/spread, color reference/opacity, layer order, removal and Add layer. Per-style overrides remain independent of subsequent seed changes; Reset step resumes deriving that style from the seed. Removing all layers intentionally produces no shadow. Close/Escape/outside click return focus to the gear. Numeric preview updates preserve the active native field/slider, inspector scroll and canvas camera. Layer edits save the style's effects; blur effects on the style are kept. Nothing is written to Figma.

## Saving and undo

Foundation controls save through the same store as the agent's item tools. Each control queues its change; after a 300 ms pause Builder sends the queue as one revision to `POST /api/foundations`. If the revision is stale, Builder refreshes once and resends the queued changes. The status line under the panel title shows `Saved · revision N`, or `Revision N · saved by agent` when the agent made the last revision, and an agent's revision appears without a reload. **Undo last change** restores the previous revision as a new one (`POST /api/foundations-restore`); every revision stays in `history/foundations/`. A save returns the draft to review.

## Sync state

With Figma on, Publish's Foundations step shows the sync state: **Not in Figma yet**, **In sync with Figma**, or **N changes not in Figma** with a list of what changed (old → new, renamed, added, deleted). Publish writes `figma/synced.json` when its export and audit match; the list compares the local draft with that file, so it needs no agent and no Figma call. With Figma off (the Context dialog's **Use Figma** switch, or `builder --no-figma`; ledger `flags.figma`), Publish to Figma and the list are hidden.

## Motion preview

Motion uses shared docs preview frames on the canvas: a selected transition, simultaneous duration lanes, and easing curve plots with playable tracks. Delay tokens remain saved and published. The Motion page no longer displays their table. The workspace selects saved semantic duration/easing tokens by current mode; an optional duration fine-tune changes only browser preview samples. Duration comparison retains saved timings, including zero and loop durations (shown as a single traversal, not an endless animation). Each playback runs once and can be replayed or reset. Reset preview restores source-based selections and timing.

Reduced mode and the device's reduced-motion preference replace spatial travel with an instant change or fade capped at120ms; source values remain visible. This is the preview's accessibility alternative, not a token rewrite. Rendering a changed source/control, switching routes, or hiding the tab cancels playback. No autoplay, permanent loops, source-file writes or Figma sync are added.

## Builder interaction motion

Builder chrome has its own neutral motion: native dialogs enter in250ms and close in150ms, with a fading backdrop; anchored token/shadow editors enter in200ms. Route content and workspace crossfade only on a tab change, without moving the canvas camera. New setup questions and phase results use a200ms bounded reveal; polling or typing does not replay it. Controls acknowledge hover/press without hover lift. These timings are viewer-only and independent of the system's Motion tokens. Device reduced motion removes modal scaling/exit delay and uses an80ms opacity-only alternative for state changes. Closing retains native focus containment until completion, Escape returns focus, and rapid reopening cancels stale close timers. No animation library, automatic specimen playback or token sync is added.

