# Fast mode

Fast mode is an optional build engine for the documentation pages. The page skeleton is drawn by a fixed renderer, the same way on every build. The agent writes only data for each page: its sentences (the copy file) and a page manifest that says which sets, examples and visuals go where. Every page call then sends data, not drawing code.

Fast mode changes how pages are drawn, not what they contain. The specs (`specs/SYSTEM.md`, `workflow/DOCFRAMES.md`, the page files), the build sequence, the ledger and the page gates are the same as in the standard engine.

**Tools.**

| File | What it does |
| --- | --- |
| `kit/tools/figma-fastbuild.js` | the renderer: `render(payload)` draws one page of any type, from data |
| `kit/tools/fast-pack.mjs` | checks a page's manifest and copy file, and prints its payload, its page call (`--call`) or batch calls of several pages (`--batch`) |
| `kit/tools/fast-cache.mjs` | writes the calls that cache the doc builder and the renderer in the file (packed: two calls), plus a status call that says which are missing; `--library` caches the library kit. The audit is cached only with `--audit`, for a QA run |
| `kit/tools/figma-libkit.js` | the library kit: binding, text, icon, matrix and combine helpers for building sets (steps 6–10), loaded in one line |
| `kit/tools/figma-registry.js` · `kit/tools/registry.mjs` | one read-only call lists every set (ids, properties, variant counts) and icon of the file; the local tool writes the set files from it |
| `kit/tools/ledger.mjs` | marks ledger entries from the command line, a batch return at once (`--render`), and refuses out-of-order marks |
| `workflow/templates/fast-brief.md` | the brief for F1 agents, filled per build instead of written |
| `kit/tools/icons-lucide.mjs` | writes the calls that create the icon library on 1.7 from Lucide, from the site's icon registry (`specs/foundations/1.7-iconography.md` §1) |
| `kit/tools/figma-dockit.js` | creates the `Documentation` collection and the Doc kit in a file that has none |
| `workflow/templates/fast/` | the default manifest of every reading page (`00`–`02`, `1.1`–`1.8`) and example manifests for component and layout pages |

The build status is in §10.

# 1. When to use it

| Use fast mode for | Keep the standard engine for |
| --- | --- |
| Documentation pages of the types the renderer covers (§10): guidance, foundations, Parts, Components, Sections, Layouts | Inventory, renames and moving sets in an existing file (`workflow/INITIATOR.md` Part B §6, steps 2–5) |
| New systems and existing systems alike, once the page tree, tokens and component sets exist (the library phase, steps 4–10) | Creating tokens, styles and component sets: the library phase always uses the standard engine |
| Rebuilding a page after a review that changed its structure | A page whose manifest needs something the renderer can't draw (§7) |

Fast mode covers the documentation phase: it starts at the first step that draws doc frames (step 11) and ends with the last doc page (step 20). The library phase before it runs with the standard engine, with the fast round's lighter evidence (§5, *Library in a fast round*). A page type the renderer doesn't cover (Screens) falls back to the standard engine (§7).

# 2. What the skeleton fixes

The skeleton is the structure of `workflow/templates/structure.md`: page → frame → block → items. It is made of plain frames, text and the Doc kit parts, and uses the shared presentation grammar in `workflow/DOCFRAMES.md`: unboxed titles, layered inset previews, and compact reference surfaces. Its colors, type and radii still come from the current brand.

| Layer | Fixed by the renderer | From the brand | Filled per page |
| --- | --- | --- | --- |
| Page | frame order, `y = 0`, `doc/space/canvas` between frames, nothing loose on the canvas | — | which frames the page type has (`specs/SYSTEM.md` Part A §A3) |
| Frame | name `{page} · {frame}`, `doc/measure/frame` width, `doc/space/frame` padding, growing with its content | background | — |
| Header, footer | the layout of mark, breadcrumb, system, title, description, version | logo, surfaces, text styles, colors | title and description (copy file) |
| Block | block note `doc/measure/reading` wide, `doc/space/block` to its items, `doc/space/frame` and a divider between blocks | text styles, divider color | block title, badge, description (copy file) |
| Items | stages, tables, rows and wrapping, the visual catalog (§4) | every value inside: the real components and tokens | which sets, examples, tables and visuals (manifest) |

In fast mode, specimens are plain frames bound to their tokens (`workflow/GOTCHAS.md` G21), so foundation pages get no `.Main` helper components.

Style comes from the brand through the `Documentation` collection, which aliases the brand's tokens, and the brand's text styles (`workflow/DOCFRAMES.md` §1). A rounded brand gets rounded docs; a dark brand gets dark docs. Only the `doc/measure/*` values are the same in every build.

# 3. What the agent writes

Two files per page, both in `workspace/output/{system-slug}/`. Neither holds a value: values are always read from the file.

**Where the data comes from.**
- **Sources, only from this build:** the page spec, the default manifest (`workflow/templates/fast/`), this system's inputs and copy files, its set snapshots (`workspace/output/{slug}/figma/sets/`) and its Figma file.
- **`examples/` is a reference only.** It may be read to understand how a page or visual works. Nothing is copied from it, and it never replaces writing the manifest and copy file from the sources above: a page filled from a finished example skips the rules this mode exists for.
- `kit/tools/fast-pack.mjs --check` refuses a copy line taken word for word from an example, and any line that names one (`workflow/GOTCHAS.md` G43).

**The copy file**, `copy/{id}-{kebab name}.md`, holds every sentence (`workflow/COPY.md`).

**The page manifest**, `fast/{id}-{kebab name}.json`, says what goes where:

```json
{
  "page": "2.1 Button",
  "type": "component",
  "sets": [{ "id": "{set node id}", "name": "Button" }],
  "examples": [
    {
      "title": "Closing an account",
      "rows": [[
        { "set": "{set node id}", "props": { "Emphasis": "secondary" }, "text": { "Label": "{label}" } },
        { "set": "{set node id}", "props": { "Tone": "danger" }, "text": { "Label": "{label}" } }
      ]]
    }
  ],
  "topics": [
    { "title": "Destructive actions", "visual": "do-dont-pair", "inputs": { "do": ["{instance recipe}"], "dont": ["{instance recipe}"] } },
    { "title": "Content" }
  ]
}
```

Rules:
- Every `title` (example, topic, block) is a title in the page's copy file, spelled the same. The renderer takes the text from the copy file by title.
- An instance recipe names a set, its variant properties and its text or boolean properties, by the names in the file. Nothing else is set on an instance: no fills, sizes or overrides that change a value.
- A topic without `visual` is text only. A topic with `visual` names an entry of the catalog (§4) and its inputs.
- Ids come from the build's set files (`workspace/output/{system-slug}/figma/sets/`, written by `kit/tools/registry.mjs`), never typed by hand. An instance-swap property may name an icon (`"Icon": "Icon/general/copy"`): fast-pack turns it into the id from `figma/icons.json`.
- `{system}` in a manifest string is the ledger's `system` (the default 00 Cover manifest titles the cover `{system} design system`).
- Build flags come from the ledger: with `flags.guidelines: false` (`/ds-create build --no-gl`), `fast-pack --init` copies the reading manifests without their `Guidelines` frame, and packing drops every Guidelines frame, topic, Accessibility and In apps list, and adds `skip: ["gl"]` to component pages. Agents don't write them.

Fields per page type:

| Type | Pages | Fields |
| --- | --- | --- |
| `cover` | `00` | `mark` (the logo set), `glance` (which facts to list) |
| `guide` | `01`, `02` | `frames`: per frame, its topics with `visual` and inputs (mode facts, goal tiles, collection samples) |
| `foundation` | `1.1`–`1.8` | per frame (`Overview`, `Tokens`): which collections, groups or styles each block shows and in what order; `topics` for `Guidelines` |
| `component` | `2.x`–`4.x` | `sets`, `examples`, `topics` |
| `layout` | `5.x` | `sets`, `regions` (optional fixed-region pattern), `topics` |

`kit/tools/fast-pack.mjs` checks a manifest against its page type and its copy file (unknown title, unknown visual, missing input) and prints the payload for the page call.

# 4. The visual catalog

Named visuals, each always drawn the same way from its inputs. The renderer implements them. The list grows from real builds: a custom visual used in more than one build becomes a catalog entry.

| Visual | Draws | Inputs |
| --- | --- | --- |
| `instance-row` | real instances side by side on a stage, wrapping at the frame width | instance recipes |
| `state-row` | one instance per value of a property, each with its value as caption | set, property |
| `do-dont-pair` | a `Doc/Do-dont` pair with a stage each | instance recipes for do and don't |
| `swatch-ramp` | a palette family, step by step, with values and contrast notes | collection, group |
| `type-specimen` | text styles largest first, with size and line height | style prefix |
| `scale-bars` | space or size steps drawn as bars, bound to their variables | collection, prefix |
| `radius-tiles` | one tile per radius role, bound to it | collection, prefix |
| `elevation-tiles` | one tile per effect style | style prefix |
| `motion-curves` | easing curves and duration bars | collection, groups |
| `icon-grid` | icons by category, outline and filled | page or set prefix |
| `asset-grid` | an asset set's variants at a fixed maximum size | set |
| `token-table` | a variable table with value per mode and usage | collection, prefix, modes |
| `mode-panel` | a frame's appearance panel and the mode switch | collection, modes |
| `goal-tiles` | equal-height tiles: label, what it means, in this file, link | count of goals (text from the copy file) |
| `editor-panel` | a recreated editor view (variables, properties) with the file's own names | panel kind, rows |
| `custom` | anything else, as a small function for this one topic (§7) | the function |

# 5. Steps

The steps are those of `workflow/INITIATOR.md` Part B §6. Fast mode changes only steps 11–20, as follows.

**Library in a fast round (steps 6–10).** The sets are still built from their page files by the standard engine; three things make it lighter:
- **The library kit.** `node kit/tools/fast-cache.mjs --out workspace/output/{slug}/fast/cache --library` writes one call (~6 KB) that caches `kit/tools/figma-libkit.js`; every set call then loads it in one line (`K.tokens`, `K.fill`, `K.text`, `K.iconInst`, `K.matrix`, `K.combine`, …) and holds only the set's own structure. Never re-write binding helpers in a build.
- **Small returns.** A set call returns its set and part ids and counts, nothing else: no snapshot, no layer dump (a full export of a 360-variant set came back at 140 KB and only filled the context).
- **One registry at the end.** After the last set, one read-only `kit/tools/figma-registry.js` call (~12 KB back for 30 sets and 170 icons) and `node kit/tools/registry.mjs --slug {slug}` write every set file and the icon map. This is the library gate's export in a fast round; the full layer snapshot (`kit/tools/figma-export-sets.js`) is exported on call, for QA or a site agent that needs layers. Re-run the registry when a later step changes a set.

**F1 · Data (after the library phase, before step 11, no Figma calls).** The manifests name real sets, so they are written once steps 6–10 are done and the set snapshots exist.
1. Run `node kit/tools/fast-pack.mjs --slug {slug} --init`. It copies the default manifests of the reading pages into `workspace/output/{slug}/fast/`.
2. Plan the information through `workflow/EDITORIAL.md` before drafting, then write the copy file of every in-scope page (`workflow/COPY.md`). Adapt manifest topic titles/order to the plan rather than copying a visible outline; keep copy/manifest titles matched and all required technical visuals covered. Read the page's knowledge first (`workspace/input/{slug}/knowledge/`, `workspace/input/README.md` I7): its rules override the default manifest and the page spec. Then read the `knowledge/` topics the index lists for the page (`node kit/tools/copy-guard.mjs --slug {slug} --page {id}` prints them). Let their reasoning shape the copy, in the system's own words, never cited, and add them to the page's `loaded` in the ledger. **This is a hard rule:** `fast-pack` refuses a page without them (`workflow/COPY.md` §1).
3. Fill each manifest's `todo` visuals with real sets, or remove the visual. Write one manifest per component and layout page (`workflow/templates/fast/component.example.json`, `layout.example.json`).
4. Run `node kit/tools/fast-pack.mjs --slug {slug} --check` until every page is ready.

Agents write F1 in parallel from `workflow/templates/fast-brief.md` (fill its header, give each agent 4–7 pages). F1 is the largest token cost of a round: an agent that has the brief, the set files and the build notes doesn't need to rediscover the build.

**F2 · Review (optional).** When the user chose a review checkpoint at initiation, stop here. The user reads and edits the copy files and manifests before any page is drawn. Record their changes in `workspace/input/{system-slug}/chat/` (`workspace/input/README.md` I3).

**F3 · Bootstrap (step 11).**
- Run `node kit/tools/fast-cache.mjs --out workspace/output/{slug}/fast/cache` (add `--accepted` with the build's approved exceptions, and `--pages reading` when the round has no Parts to Layouts pages).
- Send `cache-status.js` first. It is read-only and answers which keys the file still needs. Send only the calls that hold a needed key, one at a time; each key answers `stored: true`, or refuses to save when its code arrived changed (`workflow/GOTCHAS.md` G41).
- Caching costs time: about 75 KB of minified code, typed out in full. The keys are packed into two calls under the 50,000-character limit, so it is two round trips, not four. The status call makes a retry, a resumed session or a later round skip what is already current: the keys stay in the file until the last round's step 21 (`workflow/GOTCHAS.md` G8), so a second round usually sends nothing.
- When the file has no Doc kit or `Documentation` collection, create them with `kit/tools/figma-dockit.js`: first `{ only: 'collection' }`, then `{ only: 'kit', page, mark, system, footer, meta }`. Every doc variable aliases the brand token `workflow/DOCFRAMES.md` §1 names; the result lists any that fell back to a default.

**Icons (step 6, library).** A new system's icon library comes from `node kit/tools/icons-lucide.mjs --slug {slug}` at its library step, before any Part: send its calls (usually one, about 30 KB). The 1.7 doc page is rendered later, at step 15. The agent doesn't pick, map or draw icons.

**F4 · Pages (steps 12–20).** Several pages per call, in build-sequence order. `node kit/tools/fast-pack.mjs --slug {slug} --batch` checks every open docs page in ledger order and writes `workspace/output/{slug}/fast/calls/batch-{n}.js`: the renderer is loaded once per call and each call holds as many pages as fit in ~45 KB (a full round of 30 pages is 4 calls, not 32). It stops before the first page that isn't ready, so order holds.
- Send the batches in order, one at a time. Each returns `{ done: [{ id, frames }], failed, next }`; mark it with `node kit/tools/ledger.mjs --slug {slug} --render '<the return>'`.
- A batch stops at the first page that throws (nothing after it is drawn) and before a page once 70 s have passed. Re-run `--batch`: it starts at the first open page.
- `--page {id} --call` still prints a single-page call, for a re-draw after a review.

A call doesn't audit. The page gate is the same as in the standard engine (`workflow/INITIATOR.md` Part B, *Gates*); in a batch, each page is still its own step in the ledger.

**F5 · Close.** Re-run the registry when a docs step changed a set. Step 21 clears the `dscreate` plugin data only when this is the system's last round (no docs page left for a later round); otherwise the keys stay, versioned, for the next round's status call (`workflow/GOTCHAS.md` G8). The copy check against Figma runs on call (`workflow/COPY.md` §7).

**Ledger.** `engine: "fast"` at the top. For each page, the engine that drew it (`fast` or `standard`) and any `custom` visuals it used.

# 6. Limits

- A call takes at most 50,000 characters. A payload is data only, usually 2–6 KB; a batch holds pages up to ~45 KB. Split a page over two calls (`skip`) only when a set has hundreds of variants.
- **No network.** `use_figma` code has no `fetch` or XHR (checked 2026-10-15): every byte reaches the file as typed code, and every byte back comes as a return. Speed comes from typing less (cached code, packed and batched calls, data instead of code) and from small returns.
- A call that runs past about 120 s may lose its response: verify read-only before resending (`workflow/GOTCHAS.md` G3).
- A return is at most 20 KB: the renderer returns ids and counts, never node dumps.
- All rules of `workflow/GOTCHAS.md` §1 apply unchanged.
- **No repo edits during a build.** The spec files and tools stay as they are until the round ends.
  - A lesson, a missing catalog entry or a tool bug goes into the build notes, and is folded into the repo after the round, when the maintainer asks.
  - When a tool bug blocks the build, patch the cached copy in the file once (one call), note it, and carry on. Don't re-cache, re-read or re-patch in a loop: after a second failure on the same page, build that page with the standard engine (§7).

# 7. Fallback and escape hatch

- **Fallback.** When the renderer can't draw a page, the page is built with the standard engine, at its own step. Write `engine: "standard"` and the reason in the ledger.
- **Escape hatch.** A topic may use `"visual": "custom"` with a small drawing function. It gets the same helpers as the renderer, and draws only inside its topic.
  - Each custom visual is listed in the build notes.
  - A build with more than a few custom visuals means the catalog is missing an entry. Add the entry to the renderer, not to the build.

# 8. QA

QA follows *QA on call* (`workflow/INITIATOR.md` Part B):
- the whole fast round generates without auditing, library phase included (`workflow/INITIATOR.md` Part B §6, *Gates*, *Fast mode*); a render call draws, it doesn't audit;
- the page audits, the copy check and the slow checks run only when the user asks (`/ds-create qa`).

# 9. Decisions

Agreed with the maintainer on 2026-10-08:
1. The engine is named fast mode. It is chosen in `workflow/QUESTIONNAIRE.md` §8, and the standard engine is the default.
2. The template is code in this repo, not a master Figma file. A starter file may come later, generated by the same code.
3. The review checkpoint (F2) is optional, chosen per build.
4. Version 1 covers documentation pages only. A starter component kit for new systems is planned separately.
5. Trials run on copies of real files, never on the files themselves.
6. The escape hatch is allowed and logged, so the catalog learns from each build.

# 10. Build status

| Phase | Delivers | Covers | Status |
| --- | --- | --- | --- |
| 1 | manifest checks (`kit/tools/fast-pack.mjs`), `render()` for component pages, the catalog, `kit/tools/fast-cache.mjs` | `2.x`–`4.x` | built; trial passed (2.1 on a copy: every frame drawn from data, audit 0 fail) |
| 2 | blocks and topics frames for guidance and foundation pages, default manifests | `00`–`02`, `1.1`–`1.8` | built; trial passed on 1.4 and 1.6 (audit 0 fail); the other pages are untried |
| 3 | `kit/tools/figma-dockit.js`: the Doc kit and the `Documentation` collection from code | bootstrap | built; the kit trial passed (16 parts from the file's tokens) |
| 4 | layout pages through `render()` (`layoutPage`), then a full fast build on a copy of an existing file | `5.x` | renderer built; full trial still to run |
| 5 | docs-site story skeletons from the manifests | site | planned |
| 6 | streamlining from the first full fast round (2026-10-15): library kit, registry, packed cache, batch calls, ledger tool, cache kept between rounds, build flags, hash export for the site, site scope script | all phases | built; tools tested on that round's data and a copy of the template, registry and hash export on its Figma file |

# 11. Cost profile

Measured on the first full fast round (tokens, 19 Parts, Figma and site), to point the next streamlining at what costs most:

| Phase | Time | Main cost | Since 2026-10-15 |
| --- | --- | --- | --- |
| Library, 30 sets and 170 icons | 46 min | helpers re-written per build; set exports returning 30–140 KB each | library kit; registry, one call |
| F1 docs data, 6 agents | 15 min (parallel) | the largest token cost; each agent rediscovers the build | brief template; flags dropped from agent work |
| F3 cache | 8 min | ~75 KB of code typed in four calls, again every round | two packed calls; kept between rounds |
| F4 pages, 30 | 19 min | 32 calls, each printed then typed | 4 batch calls |
| Site W2–W3 | 10 min | a ~100 KB export | hash export: ~3 KB when nothing changed |

Each phase is proven when its pages, built from manifests alone on a copy of a finished build, pass the page gate. Trials run on copies only, on scratch pages that are removed afterwards. Update this table and `workflow/ROADMAP.md` when a phase lands.
