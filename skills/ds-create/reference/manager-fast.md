# Manager FAST jobs

Manager uses FAST's fixed-code/data-payload approach for its foundation workflow. This is separate from the documentation-page renderer in workflow/FAST.md: it creates no documentation pages, components or build round, and never changes the model or provider.

## Prepare locally

Read init-web and init's local preparation requirements once, plus the actual selected inputs, knowledge and foundation specs. Reuse fully read, unchanged references within this job; user changes reopen the relevant inputs. Write the canonical draft/plan and source decisions once, then submit the normal ready/questions result. Do not restart the workflow to report progress. Preparation still needs design decisions; FAST does not fabricate defaults, skip source reading or bypass the saved-artifact checks.

## Publish the approved draft

The listener's read-only inventory is followed by a source-bound compiled plan. For this continuation, this file and the actual applicable Figma tool skill replace the full init/spec-generation reread: the approved values and decisions are already saved. Read the trusted request and plan, verify their target/revision/hash and the generated call hashes, then execute the exact calls in order through the existing Figma tool. Do not rewrite the renderer or choose values again.

`kit/manager/foundation-fast.mjs` packs collection, topologically ordered variable and style data into calls under45,000characters. It preserves exact frozen definitions, returns IDs/counts/errors, and handles each distinct font face once per style batch. Font inventory is advisory; retain the selected family/style strings. No upload, installation, substitution or repeated per-style load attempts. Unknown metadata triggers the existing FAST escape hatch: a single standard continuation with the unsupported fields reported, rather than dropping them or retrying the compiler. Source/approval errors never use that fallback. An ambiguous tool failure requires inspection of affected output before any retry.

Before every write, report through the existing listener: collection/variable calls use stage variables; style calls use stage styles. Mark a phase completed only after all its actual calls succeed. Revalidation/cancellation wins. Keep returned evidence locally; do not repeatedly dump the draft or full inventories into the conversation. For actual style errors, preserve successful variables/effects and report the affected styles once. Never clear the file, overwrite conflicts, or create duplicate definitions on resume.

## Verification and finish

Use the existing lossless full/PART exporter in `kit/web/scripts/figma-export.js` for the approved subset. Hash/rows shortcuts cannot replace metadata verification. Save actual confirmed output in `figma/figma-variables.json`; compare through `kit/manager/foundation-compare.mjs`. Load the exporter instructions required for that operation once. Reuse an actual current export when nothing changed; do not re-export the same subset after every batch. If returned output exceeds the tool limit, partition by collection/style group, not by arbitrary ten-item batches.

Run the existing init full file audit once, using `kit/tools/figma-audit.js` and its file-mode contract in `skills/ds-create/reference/init.md` §5 and `workflow/INITIATOR.md` Part B §6 step4. Read those verification sections and audit invocation guidance when reaching this phase; do not reload unrelated generation specs. Save the actual audit as `figma/audit-file.json` with `mode:file`, the approved `sourceHash` and `result.fail`. Only matching export plus zero unaccepted failures permits done steps1–4 and the current `foundationReview.figmaHash`. Preserve existing ledger entries/answers/reports. Incomplete styles remain incomplete; no fabricated synced state or build unlock.

Send finish through the same listener and return to waiting. Use bounded native waits up to60seconds, actual check-ins at most75seconds apart, and no per-timeout commentary, filesystem report or reference reread. Node cannot renew the native agent's heartbeat itself. Readiness expires after the existing3minute bound. FAST reduces work per job; it cannot guarantee zero model usage while a host requires native tool polling to retain a waiting agent.
