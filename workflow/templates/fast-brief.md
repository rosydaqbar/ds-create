# Fast mode · docs data brief (F1)

The brief for agents that write a fast round's docs data (`workflow/FAST.md` F1), several pages each, in parallel. The orchestrator copies it, fills the `{…}` fields and names each agent's pages; nothing else is rewritten per build. Split pages so each agent has 4–7, guidance and foundations apart from Parts; the earliest pages go to the smallest agents (00–01, then 02 alone), so drawing starts while the others write (`workflow/FAST.md` §5).

```text
Repo root: {absolute repo path}     System slug: {slug}     Product: {Web | App | Web and App}
Engine: fast     Pace: {YOLO | one by one}     Flags: {--no-gl, … or none}
Your pages: {ids, e.g. 2.1–2.7}
```

You write the **docs data** for your pages, three files each, named `{id}-{kebab name}` exactly as the page name (`2.10-text-control`, `1.3-space-and-layout`, `00-cover`):
1. `workspace/output/{slug}/plans/{id}-{kebab name}.json`: the editorial plan (`workflow/EDITORIAL.md`, plan format).
2. `workspace/output/{slug}/copy/{id}-{kebab name}.md`: every sentence of the page (`workflow/COPY.md` §2–§3).
3. `workspace/output/{slug}/fast/{id}-{kebab name}.json`: the page manifest (`workflow/FAST.md` §3–§4). Reading pages (00–02, 1.x) start from the default manifest `fast-pack --init` put in `workspace/output/{slug}/fast/`; component and layout pages from `workflow/templates/fast/component.example.json` / `layout.example.json`.

## Read first, for your pages
- `workflow/COPY.md`, `workflow/EDITORIAL.md`, `workflow/FAST.md` §3–§4, `workflow/GOTCHAS.md` G24, G25, G36, G43.
- The visual catalog: the `VIS` object of `kit/tools/figma-fastbuild.js` (visual types and inputs), and how `kit/tools/fast-pack.mjs` joins manifest and copy (`packReading`, `packComponent`, the recipe keys it accepts).
- Each page's spec file and its folder file (`specs/{level}/00-*.md`).
- The page's knowledge topics: `node kit/tools/copy-guard.mjs --slug {slug} --page {id}` prints them. Write their reasoning in this system's own words and values; never name, cite or copy them.
- The system: `workspace/input/{slug}/sources.md`, `workspace/input/{slug}/chat/*`, `workspace/input/{slug}/answers/*`, `workspace/input/{slug}/knowledge/*` (its rules override the spec and the default manifest), and the brand voice from the inputs.
- What was built: `workspace/output/{slug}/figma/sets/*.json` (set names, ids, property names and values), `workspace/output/{slug}/figma/icons.json` (icon names), `workspace/output/{slug}/figma/figma-variables.json` (every collection and variable as built, Components included, and the page ids, refreshed at F0) and `workspace/output/{slug}/reports/build-notes.md` (every deviation from the specs). Document what exists; where the build deviates from the spec, document the build.

## Rules
- **Flags.** `--no-gl`: no Guidelines anywhere. Part pages: the copy has `# Summary`, `# Sets`, `# Examples`, `# When to use`, `# When not to use`, `# Anatomy` only; the manifest has no `topics`. Foundation pages: no `Guidelines` frame, no `# Guidelines` section. (fast-pack drops them anyway when the ledger has `flags.guidelines: false`; leaving them out saves writing them.)
- **Examples are references, never sources.** Never read other systems' `workspace/input/` or `workspace/output/`; nothing from `examples/` is copied (fast-pack refuses it).
- **Values are never typed.** Name tokens and sets; the renderer reads values from the file. Never invent a token name: if unsure it exists, don't name it.
- **Product-flavored compositions.** Use the spec's compositions with this product's content where natural, and "for example" for anything the product hasn't shipped. Only sets from the set files; a composition that needs a set the system doesn't have is rebuilt from what exists or dropped (say so in the report). Icons in recipes by name: `"Icon": "Icon/{category}/{name}"`.
- **Recipes**: `{ "set": "{set name}", "props": { "{property}": "{value}" }, "text": { "{TEXT property}": "…" } }`, names and values exactly as in the set file.
- Copy front matter: `page: {id} {Name}`, `figma: {page node id}` (from the `pages` of `workspace/output/{slug}/figma/figma-variables.json`; never inferred), `web: src/docs/stories/{id}-{kebab name}.doc.tsx`.
- Plans: every copy location with lines is planned; `verified` / `rule` evidence quotes a real project file byte for byte; the six goals are covered or `notApplicable` with a reason.

## Checks (until they pass, per page)
```bash
node kit/tools/copy-guard.mjs --slug {slug} --page {id}
node kit/tools/copy-guard.mjs --slug {slug} --pages {id} --editorial
node kit/tools/fast-pack.mjs --slug {slug} --page {id} > /dev/null
```
Edit only your pages' files in `workspace/output/{slug}/plans/`, `copy/` and `fast/`. Never edit the ledger, specs, tools or the repo; never touch Figma.

## Report (short)
Per page: the three files, check results, any composition adapted or dropped and why, any call where spec and build differ.
