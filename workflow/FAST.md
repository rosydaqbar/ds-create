# Fast mode

Fast mode is an optional build engine for the documentation pages. The page skeleton is drawn by a fixed renderer, the same way on every build. The agent writes only data for each page: its sentences (the copy file) and a page manifest that says which sets, examples and visuals go where. Every page call then sends data, not drawing code.

Fast mode changes how pages are drawn, not what they contain. The specs (`specs/SYSTEM.md`, `workflow/DOCFRAMES.md`, the page files), the build sequence, the ledger and the page gates are the same as in the standard engine.

**Tools.**

| File | What it does |
| --- | --- |
| `kit/tools/figma-fastbuild.js` | the renderer: `render(payload)` draws one page of any type, from data |
| `kit/tools/fast-pack.mjs` | checks a page's manifest and copy file, and prints its payload or its whole page call (`--call`) |
| `kit/tools/fast-cache.mjs` | writes the calls that cache the doc builder, the renderer and the audit in the file, plus a status call that says which are missing |
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

Fast mode covers the documentation phase: it starts at the first step that draws doc frames (step 11) and ends with the last doc page (step 20). The library phase before it, and everything after it, runs as usual. A page type the renderer doesn't cover (Screens) falls back to the standard engine (§7).

# 2. What the skeleton fixes

The skeleton is the structure of `workflow/templates/structure.md`: page → frame → block → items. It is made of plain frames, text and the Doc kit parts, and it has no style of its own.

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

Two files per page, both in `output/{system-slug}/`. Neither holds a value: values are always read from the file.

**Where the data comes from.**
- **Sources, only from this build:** the page spec, the default manifest (`workflow/templates/fast/`), this system's inputs and copy files, its set snapshots (`output/{slug}/figma/sets/`) and its Figma file.
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
- Ids come from the build's set snapshots (`output/{system-slug}/figma/sets/`), never typed by hand.

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

**F1 · Data (after the library phase, before step 11, no Figma calls).** The manifests name real sets, so they are written once steps 6–10 are done and the set snapshots exist.
1. Run `node kit/tools/fast-pack.mjs --slug {slug} --init`. It copies the default manifests of the reading pages into `output/{slug}/fast/`.
2. Write the copy file of every in-scope page (`workflow/COPY.md`), with the block and topic titles the manifests use. Read the page's knowledge first (`input/{slug}/knowledge/`, `input/README.md` I7): its rules override the default manifest and the page spec. Then read the `knowledge/` topics the index lists for the page (`node kit/tools/copy-guard.mjs --slug {slug} --page {id}` prints them). Let their reasoning shape the copy, in the system's own words, never cited, and add them to the page's `loaded` in the ledger. **This is a hard rule:** `fast-pack` refuses a page without them (`workflow/COPY.md` §1).
3. Fill each manifest's `todo` visuals with real sets, or remove the visual. Write one manifest per component and layout page (`workflow/templates/fast/component.example.json`, `layout.example.json`).
4. Run `node kit/tools/fast-pack.mjs --slug {slug} --check` until every page is ready.

**F2 · Review (optional).** When the user chose a review checkpoint at initiation, stop here. The user reads and edits the copy files and manifests before any page is drawn. Record their changes in `input/{system-slug}/chat/` (`input/README.md` I3).

**F3 · Bootstrap (step 11).**
- Run `node kit/tools/fast-cache.mjs --out output/{slug}/fast/cache` (add `--accepted` with the build's approved exceptions, and `--pages reading` when the round has no Parts to Layouts pages).
- Send `cache-status.js` first. It is read-only and answers which keys the file still needs. Send only those calls, one at a time; each answers `stored: true`, or refuses to save when the code arrived changed (`workflow/GOTCHAS.md` G41).
- Caching costs time: the calls hold about 75 KB of code that is typed out in full, roughly 6–8 minutes for a full set. The status call makes a retry or a resumed session skip what is already current. A new round still sends everything, because step F5 clears the keys (`workflow/GOTCHAS.md` G8).
- When the file has no Doc kit or `Documentation` collection, create them with `kit/tools/figma-dockit.js`: first `{ only: 'collection' }`, then `{ only: 'kit', page, mark, system, footer, meta }`. Every doc variable aliases the brand token `workflow/DOCFRAMES.md` §1 names; the result lists any that fell back to a default.

**Icons (step 6, library).** A new system's icon library comes from `node kit/tools/icons-lucide.mjs --slug {slug}` at its library step, before any Part: send its calls (usually one, about 30 KB). The 1.7 doc page is rendered later, at step 15. The agent doesn't pick, map or draw icons.

**F4 · Pages (steps 12–20).** One page per call, in build-sequence order. `node kit/tools/fast-pack.mjs --slug {slug} --page {id} --call` prints the call: it loads the cached renderer and sends only the page's data (usually 4–9 KB).

The call returns the page's frame ids, its audit and its warnings. The page gate is the same as in the standard engine (`workflow/INITIATOR.md` Part B, *Gates*).

**F5 · Close.** Check every page's copy against Figma in one or two batched read-only calls (`workflow/COPY.md` §7). Re-export any set snapshot a docs step changed, then clear the `dscreate` plugin data (step 21).

**Ledger.** `engine: "fast"` at the top. For each page, the engine that drew it (`fast` or `standard`) and any `custom` visuals it used.

# 6. Limits

- A call takes at most 50,000 characters. A payload is data only, usually 2–6 KB. Split a page over two calls (`skip`) only when a set has hundreds of variants.
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
- every render call audits its own page;
- the copy check runs in step F5;
- the slow checks run only when the user asks.

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

Each phase is proven when its pages, built from manifests alone on a copy of a finished build, pass the page gate. Trials run on copies only, on scratch pages that are removed afterwards. Update this table and `workflow/ROADMAP.md` when a phase lands.
