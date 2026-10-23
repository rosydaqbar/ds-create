# `/ds-create init`

Sets up the baseline of a design system: the inputs are read, the basics are settled, a local foundation draft opens in DS Create Builder for review, then the approved revision becomes variables and styles in Figma. For web-first context/files and questions, use `reference/init-web.md`; its worker follows only the local preparation here and stops at review. This chat-led init runs once per system. Running it again on a system that has a baseline re-reads the inputs, reports any change and starts or reuses its Manager without recreating frozen values.

**Init never** draws a doc page, creates the page tree or the Doc kit, builds a component, or changes a frozen value.

**Load:** the global set (`SKILL.md` §1), `workspace/input/README.md`, `workflow/QUESTIONNAIRE.md` §1, §2, §3, §9 and §10, `specs/SYSTEM.md` Part C, `specs/guidance/02-tokens.md` and `workflow/MANAGER.md`. For an existing file, also `workflow/INITIATOR.md` Part B §2 (*Inspect first*).

**Order.** Steps 0, 1 and 2 run before anything is asked. The first reply is always the start report (§2), and no question comes before it.

# 0. Take in what came with the command

The user never has to prepare a folder. Whatever comes with the command, or later in chat, is an input:
- **The slug.** Take the system name from the request or the pasted text (lowercase, kebab case). Ask for it only when neither gives one.
- **The folder.** Create `workspace/input/{slug}/` when it doesn't exist.
- **Pasted text** (a brief, a PRD, brand notes, a list of links): save it word for word in `workspace/input/{slug}/chat/YYYY-MM-DD.md` (`workspace/input/README.md` I3), then read it like any other input. A brief pasted in chat is the system's brief.
- **Attached files:** save each one in the folder that fits (`brief/`, `brand/`, `design-system/`, `references/`), under its own name.
- **A Figma link:** record it in the same chat file. It is the file for the readiness check.
- **Files dropped straight into `workspace/input/`,** outside any system folder: they belong to this system when `workspace/input/` holds no other system folder; otherwise ask which system they belong to. Read them where they are, and list them in `sources.md` by their path from `workspace/input/`. Never move or rename them.

# 1. Readiness check

Check local readiness before asking anything, and report it in the start report (§2). Node or unreadable inputs block local preparation; report the fix. Figma connection, file access and installed fonts are checked after the saved draft is approved (§5), so they do not block a new system's Builder preview.

| Check | How | Fix to suggest |
| --- | --- | --- |
| Node 20 or later | `node -v`, required for the local DS Create Builder on every init | Install Node 20 or later |
| Inputs | `workspace/input/{slug}/` holds at least what came with the command (§0) | Nothing to fix: with no input at all, the questions in §3 cover it |

# 2. Read the inputs, then show the start report

List the files with `find workspace/input -type f`, never with `rg`, `fd`, Glob or Grep: git ignores `workspace/input/`, and those tools skip git-ignored files, so they show an empty folder (`workflow/GOTCHAS.md` G55). Read every file in `workspace/input/{slug}/` and every loose file in `workspace/input/` that belongs to this system (§0), then write or update `sources.md` (`workspace/input/README.md` I1, I5). List any conflict between inputs under *Open conflicts*.

Then show the start report. It is init's first reply, and the questions in §3 come after it, in the same reply or the next:

```text
Readiness
  Node            {version | fail: how to fix}
  Builder         local draft first; Figma checks after review
  Figma file      {provided link | choose after review}
  Typefaces       {named families | prepared choices available}; Figma availability not checked yet

Inputs (workspace/input/{slug}/)
  {file}          {what it decides, e.g. "product, users, core features"}
  …

Already answered by the inputs
  {question}      {answer}  ({source})
  …

Open conflicts    {each, or "none"}
Still open        {the questions §3 asks next}
```

# 3. Ask what is missing

Init owns these questionnaire sections. Ask only the questions the start report lists as still open. Never ask what an input already answers, and never put forward a brand value (a color, a typeface) as if it were decided: that is an AI decision in YOLO, or an option the user picks.

| Section | What it settles |
| --- | --- |
| §1 Product | what the product is, its status, its users and tasks, its platforms |
| §2 Brand | brand maturity, brand inputs, interface character, modes, third-party providers |
| §3 Existing system inventory | existing file only: what is there (read from the file, not asked) |
| §9 Token architecture and naming | the collections, naming grammar and modes |
| §10 Output formats and product type | **Web, App, or Web and App**: this must be settled before init ends |

The user can:
- answer in chat;
- upload files into `workspace/input/{slug}/` and say so; init then reads them and asks again only what is still open;
- say YOLO: the AI answers the open questions from the inputs, each as an AI decision with its reason (`SKILL.md` §2.3).

Even with YOLO, init asks for what the product is (one sentence). A Figma link or permission to create a file is required after draft review, before any Figma write; it is not required to open Builder. YOLO does not bypass approval of the saved foundation draft.

**Font choices when unspecified.** If the user, brand inputs and existing system do not name a UI font, offer **Inter**, **Geist**, and **Plus Jakarta Sans**. Do not ask this when a font is already supplied, and never replace a frozen font with a prepared choice. Record the user's selection in `answers/01-init.md`; in YOLO select one of these three and record the reason. Normal variable font files and licenses are prepared in `kit/manager/fonts/` for the Builder preview. They do not install themselves into Figma: verify the chosen family and required weights with `figma.listAvailableFontsAsync()` before creating text styles, and resolve any missing font at the post-review Figma readiness check. Never install an OS font automatically.

# 4. Prepare and review locally

Settle product, platform, brand inputs, new/existing system, token collections and modes, and record the answers and all AI decisions with reasons in `answers/01-init.md`. This prepares a draft; it is not approval to generate in Figma.

Write an initial ledger with identity, scope, inputs and answers, step 1 done and steps 2–4 todo. Set `foundationReview.status` to `pending`. Keep these numbered steps for the existing build contract; local preparation/review occurs between steps 1 and 2.

Derive `workspace/output/{slug}/foundations.json` from this system's inputs, decisions and `specs/SYSTEM.md` Part C. Follow the local source contract in `workflow/MANAGER.md`: `ds-create/foundations@1`, positive `revision`, collections/modes, variables with semantic aliases, text styles and effect styles. Do not fabricate Figma IDs or copy another system's data. Every value without an input source is an explicitly recorded decision. Save atomically; increment revision when changing the draft.

**Existing system:** preserve frozen values. Prefer supplied token exports as draft input. When only the Figma file contains the baseline, perform the minimum read-only connection/inventory needed to obtain it before drafting; report that dependency. Do not replace inaccessible frozen values with invented values. This is the exception to deferring Figma reads, never permission to write. List proposed renames; YOLO keeps names.

Start Builder with `node kit/tools/manager.mjs start --slug {slug}`, verify health, open the returned URL and share it promptly. A Figma file/export is not needed. Compare a populated foundation against the local draft. Explain that controller changes affect browser previews only: requested changes must be sent to the agent and saved into the draft before approval.

Save a provisional `reports/init.md` with status awaiting review, the verified Builder URL, draft revision/hash, and pending Figma stages. Do not report init complete or recommend build at this point.

Ask the user to review the saved draft in Builder and either approve it in chat or use Publish → Publish to Figma, with a short summary of product/platform, fonts, colors, collections/modes, AI decisions and any renames. Wait at this gate; Builder stays running so its Publish action can start the local continuation. If changes are requested, save them, increment revision and re-review. Record the user's actual approval in `answers/01-init.md`, then obtain the current SHA256 via `node kit/tools/manager.mjs status --slug {slug}` and save `foundationReview` as specified in `workflow/MANAGER.md`. Bind approval to the revision reviewed; if the file changed since review, show it again before recording approval. The explicit Publish to Figma action records approval of the displayed saved revision/target in manager/jobs/{id}/request.json and the ledger; accept that evidence without asking again. Do not infer approval from merely opening Builder, controller interactions or elapsed time. Leave Builder running while waiting.


**Basic motion and iconography.** New systems include basic UI motion: durations, easing, delays and Standard/Reduced modes from `specs/foundations/1.6-motion.md`. Excluding animated illustrations or complex/expressive interactions never silently excludes this baseline. Ask only if a source explicitly and ambiguously prohibits UI transitions themselves; retain frozen existing values. Record `motionPolicy: "basic-ui"` in new preparation plans when this baseline applies. Iconography starts with Lucide from the prepared local catalog and the same registry as web docs; record that library choice. Builder presents a local library reference during init, while Figma icon components and full documentation remain a later build step. Existing systems keep their library.

# 5. Generate the approved foundations in Figma

Only after saved-draft approval (chat or the explicit Builder Publish action):
1. Check Figma MCP `whoami`, obtain the user's file link or permission to create one, verify edit access with a read-only call and list available fonts. Missing access/fonts pauses this stage; Builder remains available. Load the required Figma skills before tool calls. Do not silently replace an approved font.
2. Complete step 2: verify Figma for every system; inventory existing content (`workflow/INITIATOR.md` §2). Compare frozen values and proposed renames with the draft. If inventory, a font substitution or another input changes the draft, save a new revision and return to review. Never write before its approval.
3. Complete step 3: summarize file, approved draft revision, scope/modes and approved renames. Reuse the user's recorded foundation approval when nothing changed; ask only about newly introduced choices. Save the Figma link and confirmation in answers/ledger. Check the current source hash still matches the approval immediately before writing.
4. Set step 4 to `building`. Generate from the approved `foundations.json`, following Part C: Primitives → Color, Typography, Space, Size, Shape, Border, Motion; text and effect styles; scopes and code syntax. Existing systems keep frozen values and apply only approved renames/missing tokens. Do not generate a different payload midway.
5. Save confirmed Figma output as `figma/figma-variables.json` (`ds-create/figma-variables@1`, `workflow/WEB.md` W2) only after successful writes. The local draft remains the reviewed source, separate from confirmed Figma output. Do not stamp planned data as a successful export. Report per-foundation Figma progress/errors through Manager; its local draft remains inspectable while Figma runs.
6. Run `kit/tools/figma-audit.js` in file mode. Require `fail = 0`; approved exceptions belong in `auditExceptions`, and the saved effective audit must report zero unaccepted failures. Record audit evidence, mark steps 1–4 done, and set `foundationReview.figmaHash` to the approved current hash only after successful writes and audit. Recheck the source hash before marking complete; a changed draft reopens review.

A failed or skipped Figma step leaves init incomplete. `node kit/tools/manager.mjs status --slug {slug}` must report `initDone: true` and local source review `synced` before handing off to build. Legacy completed systems with no local draft reuse their existing export/Manager without recreating frozen values; never manufacture a prior approval record.

## Builder's local Publish continuation

Publish has2 steps: **1. Publish to Figma**, then **2. ds-create build**. Step1 queues the approved request for a compatible DS Create MCP client; it does not launch or select an AI executable. The claiming agent uses its own configured Figma authoring tools and permissions. See `reference/agent-mcp.md` and `reference/publish-mcp.md`. Request/approval, connection-owned attempt and status live under `manager/jobs/{id}/`. Browser input supplies only the reviewed hash and an existing Figma file URL; it cannot choose a command, model, provider or arbitrary prompt. MCP does not wake an idle chat; the client must take the request. This is a continuation of this init, not a separate Figma skill command.

When launched with that request, read its approval evidence and current draft hash; do not rebuild the draft, ask for the same approval, create another Figma file, or start build automatically. Follow §5 with the selected file. Missing access/fonts/authoring tools, a required new decision, or changed/frozen conflicts return blocked with a next action. Preserve partial output and inspect it before retries; no destructive reset. Save the actual full file-mode audit as `figma/audit-file.json` with its `mode`, `result.fail`, and added `sourceHash` equal to the approved revision hash. Keep the ledger's audit summary/evidence path consistent.

The worker verifies the current hash and full selected input snapshot, required init steps, selected target, a normalized exact comparison of the approved subset against the confirmed export, and the saved zero-failure report before success. Extra unrelated Figma content may remain; changed approved values, aliases, modes or style properties block sync even when audit reports zero failures. Inspect manager/jobs/{id}/foundation-diff.json for differences. Step2 stays locked during failure, cancellation, generation or stale output. After success it offers exactly `ds-create build` for the user's agent, where engine/scope choices remain user-owned. Closing the modal leaves the job running; Stop agent cancels it without claiming rollback. Never claim Figma library publication/sharing or website deployment: this stage creates foundation variables/styles only.

# 6. Report

Show the report below, and save it to `workspace/output/{slug}/reports/init.md`:

```text
Figma file    {link}
DS Create Builder    {verified localhost URL · workspace/output/{slug}/manager/ | exact environment limitation and start command}
Product       {name} · {Web | App | Web and App} · {new system | existing file}
Brand         {typefaces} · {main colors} · {logo file or "none yet"}

Foundations
  {collection}   {modes}   {n} variables   ({note, e.g. "Dark: placeholders, not supported"})
  …
  Text styles    {n}
  Effect styles  {n}

Decided by the AI (YOLO): {each decision with its reason, or "none"}
Renames: {applied, proposed and waiting, or "none"}
Not done yet: page tree, Doc kit, documentation pages, components
Next: /ds-create build
```

Init is done when the report is saved, `01-init.md` exists, the platform is settled, ledger steps 1–4 are `done`, the current local draft is approved and generated/audited in Figma (`source.review: synced`, or a legacy export-only baseline), and the DS Create Builder handoff in `workflow/MANAGER.md` is verified (or an actual environment limitation and restart command are recorded). Leave the Manager server running for the builder.
