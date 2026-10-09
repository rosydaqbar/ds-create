# Gotchas

Lessons from real builds, turned into fixed rules. Every rule here broke a real build once. Follow them on every build, for every brand.

# 0. How this file works

- **When to load.** `workflow/GOTCHAS.md` is part of the global set (`workflow/INITIATOR.md` §0): load it at the start of every session that writes to Figma or builds the docs site, and again after any context compaction.
- **Fixed numbering.** Rules are numbered `G1`, `G2`, and so on. A rule's number and meaning never change. A rule can be made stricter, never looser. A rule that no longer applies stays in place, marked `Retired:` with the reason, so its number is never reused.
- **Adding a lesson.** When something costs a retry, a rollback, an audit failure or a user correction:
  1. Record it in the build's `output/{slug}/reports/build-notes.md` as it happened.
  2. If it would happen to any brand, add it here as the next number at the end of its section, in the same three-part form.
  3. Before the build is marked complete (`workflow/INITIATOR.md` §9), check that every such lesson is either in this file or noted as brand-specific in the build notes.
- **Agnostic only.** Rules describe the situation, never the brand: no brand, product or client names, no file keys, no product copy, no screenshots. Use generic words: "a flow page", "the brand fill", "a component set".
- **Form.** Each rule is: **the rule** (imperative), *Why:* (what broke), *Check:* (how to verify it held).

# 1. Working with `use_figma`

**G1. Send one write call at a time.** Never run two writing calls in parallel, even on different pages.
*Why:* concurrent writes raced and left half-applied state.
*Check:* each write's result is read before the next write is sent.

**G2. Keep every write call short.**
- Build at most two doc pages per call, and one when a page has many sets or large matrices.
- A loop over thousands of nodes (layer renames) carries a time guard: stop at about 70 s, return how far it got, and run it again until it reports done.
*Why:* calls past about 120 s move to the background, and their response can be lost.
*Check:* no call's result reports more than 60 s of work.

**G3. After a dropped or backgrounded call, verify read-only before anything else.** A dropped call may have applied completely or not at all; a script that throws is rolled back. Never re-send a write blind.
*Why:* re-sending an applied write duplicates frames; assuming a rolled-back one applied leaves pages missing.
*Check:* a read-only call lists the affected page's frames or names before the next write.

**G4. Keep return values under 20 KB.** Return ids, counts and short summaries, never node dumps.
*Why:* larger returns are rejected after the write has already run.
*Check:* every write returns a compact object.

**G5. Append every created node in the same call that creates it.** `createFrame`, `createVector`, `createText` and friends are always followed by `appendChild` into their real parent. A script that creates throwaway nodes removes them before it returns.
*Why:* unparented nodes land on the first page of the file and stay there.
*Check:* compare the first page's children before and after each build call; nothing new appears.

**G6. Never retype a script.** Run generated and cached scripts from their whole file. When a script must be pasted, print the whole file, never a line range.
*Why:* a skipped line (a destructuring line) produced a helper that failed on its first use.
*Check:* the pasted script parses and matches the file byte for byte.

**G7. Write for the plugin sandbox.** `localeCompare` ignores its numeric option, there is no `Intl`, and there is no `fetch`. Sort steps with an explicit key: `white` first, numbers ascending, `black` last, other names after the numbers.
*Why:* steps sorted as text (100, 1000, 200…) produced scrambled palettes and tables.
*Check:* every step list reads 50 → 950 (or the scale's own order).

**G8. Treat cached plugin data as temporary.** Builder and audit code cached in shared plugin data is written once per session, written again after a cleanup when later edits need it, and cleared when the build ends and after every follow-up edit.
*Why:* code left in the file ships to everyone who opens it; code cleared too early makes the next edit fail.
*Check:* after the last write, the `dscreate` plugin data keys are all empty.

**G9. Resolve nodes by page and name, not by remembered ids.** A duplicated file keeps the ids of the nodes it copied, but nodes created during a build and style ids differ between files. Match styles by name or by content.
*Why:* ids taken from a test copy pointed at nothing in the real file.
*Check:* every replayed or reused script looks its targets up by name first.

**G40. Verify many pages read-only with compact fingerprints, not by pasting their data.** To check that the file matches local data (copy files, snapshots), send each target's node id, its role sequence and a short hash of its text. Compare them in the plugin, and return only the mismatches.
*Why:* pasting each page's full copy into the check would have cost tens of kilobytes per call. Fingerprints checked 716 targets on 64 pages in two calls.
*Check:* a whole-file verification takes one to three calls, and returns only mismatches.

**G41. Check cached code by its letters, not its bytes.** The `use_figma` tool reformats code before it runs, so `toString()` never matches the source byte for byte. A caching call compares a hash of the function's letters only, and refuses to save on a mismatch (`kit/tools/fast-cache.mjs`).
*Why:* the first byte-hash check failed although the code arrived intact. A check that always fails would have been dropped, letting a real typo through.
*Check:* every caching call answers `stored: true`.

**G42. Keep run-time state in memory, not in node plugin data.** `getPluginData` and `setPluginData` are not available in this runtime. Shared plugin data on the document root is only for cached code and indexes, cleared at the end.
*Why:* a renderer that passed a width through node plugin data failed on its first page.
*Check:* the tools in `kit/tools/` call only `getSharedPluginData` / `setSharedPluginData`.

**G44. Clear the radius of every set made with `combineAsVariants`.** Set `cornerRadius = 0` on the new component set, or bind it, in the same call that combines the variants.
*Why:* `combineAsVariants` gives the set frame a default corner radius of 5. The audit failed it as an unbound radius on the first Doc kit build of a new file.
*Check:* the Doc kit page and every component page report no `component-unbound-radius` on a set frame.

**G46. Escape control characters before pasting minified code.** After minifying a tool for a `use_figma` call, replace every raw control character (U+0000 to U+001F, except newline and tab) with its `\uXXXX` escape before sending it.
*Why:* the minifier wrote a `'\u0001'` separator as a raw character inside a template literal, and the character was lost on the way. The cached copy check then hashed lines differently from the fingerprints, and every multi-line item reported a false mismatch.
*Check:* `grep -P '[\x00-\x08\x0b-\x1f]'` finds nothing in the code that is sent.

# 2. Component files and frozen values

**G10. Frozen values mean frozen.** Never unbind, unlink, detach or change a value of an existing component, variable or style. Renaming and moving are allowed. A new variant may be added only when the user asked for it, built as copies of existing variants bound to existing variables.
*Why:* the user owns a finished system; a changed value is a regression they did not ask for.
*Check:* every write that touches a component returns only renamed, moved or created ids.

**G11. Restore property references after cloning a variant.** `clone()` on a variant drops its component property references (boolean, text, instance swap). In the same call, copy the references from the source variant layer by layer, matching by child-index path and layer name.
*Why:* cloned variants stopped following their Show and text properties.
*Check:* every cloned variant has as many referenced layers as its source.

**G12. Normalize variant names before building the docs.** The form is always `Property=value, Property=value`, with one space after each comma.
*Why:* malformed names fail the audit and break variant pickers in the builder.
*Check:* every variant name matches `^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$`.

**G13. Name every layer before its page is built.** In every set, private `.Main` parts included, replace default names (`Frame 12`, `Vector`, `Group 3`, `Rectangle 5`) with role names: `Content`, `Label row`, `Divider`, `Dot`, `Shape`. Icon glyph layers become `Icon` and `Icon group`; artwork layers become `Artwork` and `Artwork group`.
*Why:* default names failed the audit by the thousand and made anatomy diagrams unreadable.
*Check:* the page audit reports no `default-layer-name`.

**G14. Move main components off flow and prototype pages by default.**
- Move every published set to its level page, even when a flow page uses it. Moving keeps the component's id, so instances and prototype links stay connected.
- Name the moved set like its neighbours on the destination page.
- A set stays on a flow page only when the user names that set and asks for it. Its doc page then says where it lives (the builder's `keep` option), and the ledger records the decision.

*Why:* keeping sets "because a prototype uses them" was unnecessary; they had to be moved later, page by page, at the user's request.
*Check:* every main component left on a flow or prototype page has a user decision in the ledger, and each moved set's instance count is unchanged after the move.

**G15. Inventory again before the final audit.** Compare the file's component sets with the inventory and place any set added since.
*Why:* designers keep working in the file during a build; new sets appeared on flow pages after the inventory.
*Check:* the final inventory and the ledger list the same sets.

**G16. Nothing sits loose on a doc page.** A component that cannot go into a doc frame goes into a named frame at the same canvas position.
*Why:* loose components fail the audit's canvas rule.
*Check:* the page audit reports no `canvas-loose-node`.

**G17. Record brand gaps, never fix them with values.** Contrast below AA on a brand fill, a missing logo version for a surface, a component without a focus state, raw values instead of tokens: write each as a finding on the page it affects and in the build notes, for the owner to decide.
*Why:* fixing them would break G10; hiding them would mislead the reader.
*Check:* every finding appears both on its page and in the build notes.

**G47. Never override a size on styled text in a component.** Changing `fontSize`, `lineHeight` or `letterSpacing` on a text that has a text style detaches the style. To get smaller text, pick a smaller style, or let the container hug the style's size.
*Why:* count indicators shrunk with a fontSize override failed the page audit (`component-text-no-style`).
*Check:* the page audit reports no `component-text-no-style`.

**G48. Set `autoRename = false` on every text layer you name in a component.** Figma renames a text layer after its characters while autoRename is on, even after you set a name.
*Why:* the Tooltip's `Text` layer came out named "This is a tooltip", which broke the anatomy names the spec and the docs read.
*Check:* each set's snapshot lists its text layers by their anatomy names.

**G49. An open arc is an ellipse with `innerRadius` near 1 and a centered stroke, not `innerRadius: 0`.** With `arcData.innerRadius = 0`, Figma strokes the arc as a pie wedge, with two lines to the center. Set `innerRadius: 0.999`, `strokeAlign: 'CENTER'`, `strokeJoin` and `strokeCap: 'ROUND'`. Inset the ellipse by half the stroke on every side, so the arc stays inside the box and lines up with an inside-stroked ring.
*Why:* the Spinner's active segment first rendered as a wedge in every variant.
*Check:* a screenshot of the set shows an arc with round ends and no lines to the center.

**G50. A drop-shadow focus ring doesn't render on a fully transparent fill.** Figma draws a shadow from the fill's alpha, so a frame filled with a transparent variable (`color/fill/none`) shows no ring. This happens even with clip content on and `showShadowBehindNode` true. Forcing the paint opacity to 1 makes the fill opaque instead. Give the focus state of a containerless control a real subtle fill, such as its hover fill, and record the change as a gap.
*Why:* every tertiary Button focus variant first showed no focus ring at all.
Also turn clip content on: `figma.createComponent()` starts with it off, and the ring doesn't render until it is on (the Tag set).
*Check:* a screenshot of the focus column shows the ring on every emphasis.

**G51. Never set `textDecoration` directly on a text layer bound to a component text property.** Binding `characters` to a TEXT property makes Figma sync the decoration override across every variant bound to that property, and a later rebind can also reset the text style. Put the decoration in a text style, such as an underlined copy of the body style, and bind the property once.
*Why:* the Link set first came out with no underline anywhere, then with an underline everywhere, and a rebind reset several labels to one style.
*Check:* each variant's label reports the expected text style and decoration after the set is built.

**G52. Size a component before you add children that scale.** `figma.createComponent()` starts at 100 × 100. Children with `SCALE` constraints that are added first get scaled again when you resize the root to its real size. Resize the root first, or resize it with `resizeWithoutConstraints`.
*Why:* every Progress ring came out 0.6 to 2.8 times its intended diameter, with the number off-center.
*Check:* a screenshot of the set shows each ring inside its own box.

# 3. Documentation frames

**G18. Read bindings back.** After `setBoundVariable`, read `boundVariables` to confirm it held. A width or height bound to a variable whose scope is gaps is dropped silently. To draw a length from a space token, bind the left padding of a frame instead.
*Why:* measure bars showed raw widths while looking bound.
*Check:* every measure bar has a bound padding.

**G19. Print line heights in pixels with the percent in brackets.** Use `14 / 20 (140%)`, never a raw percent such as `139.9999%`. Add letter spacing only when it is not zero.
*Why:* raw percents were unreadable in type tables.
*Check:* no type row meta contains a decimal percent.

**G20. Keep a palette family on one row.** The frame widens to fit the longest family; rows never wrap.
*Why:* wrapped families broke the step-by-step comparison the row exists for.
*Check:* each palette row's swatches share one y position.

**G21. Draw variable-geometry helpers as plain frames.** Bars, measures and anything whose size changes per use are plain frames, not instances of a helper component.
*Why:* size overrides on nested layers of an instance did not persist.
*Check:* the drawn size matches the token value in a fresh read.

**G22. Keep example rows inside their stage.** Example rows follow their direction, fill the stage width and hug their height. A horizontal row that would overflow stacks vertically instead. Nothing in a stage is clipped.
*Why:* hugging rows overflowed and clipped on every component Overview.
*Check:* each example row's content width is no wider than the row.

**G23. Name doc kit layers by role too.** Use `Divider`, not `Line`. The audit treats default names as failures everywhere, documentation included.
*Why:* one default-named layer in the doc kit failed every page that used it.
*Check:* the doc kit page passes its audit before any page is built.

**G24. Never invent tokens to fill a visual.** When the file lacks what a spec visual needs (density modes, alpha scales, a dark palette, font variables), say so in the topic and show the current state.
*Why:* invented values read as real tokens and contradict the frozen system.
*Check:* every token named in a visual exists in the file.

**G25. Say what a visual is.**
- A worked example's caption starts with `Example:`.
- A sample of a larger set is labeled `Examples` and links to the full set.
- A recommendation is a `Doc/Do-dont` pair, never neutral badges (`workflow/DOCFRAMES.md` §15).

*Why:* readers took examples for the full list and same-colored Prefer and Avoid labels for categories.
*Check:* the visual documentation QA in `workflow/DOCFRAMES.md` §15 passes.

**G26. Take names in the doc copy from the file itself.** The library name comes from the file's own name, and page and set names from the file. Never copy them from a test copy or a previous build.
*Why:* a replayed build carried the test copy's file name into the real file.
*Check:* the doc copy has no file name other than the current file's.

**G27. Rebuild a page with its full set list.** The builder moves the component sets out of the old frames before removing them. Build the page again with every set (old and new), then rerun the example-row fix (G22).
*Why:* a rebuild with only the new set left the old sets undocumented on the canvas.
*Check:* after the rebuild, every set on the page sits inside the page's Component or Layout frame.

**G36. Write every doc sentence in the page's copy file first.** Figma and the site take their text from it (`workflow/COPY.md`), never from text typed only in a frame or a story. A direct edit in Figma is folded back into the copy file the same day.
*Why:* frame text that existed only in Figma drifted from the site, and every review had to be done twice.
*Check:* `kit/tools/figma-copy.js` `diff` reports 0 differences on every page, and the site's text matches the copy file's `both` and `web` lines.

**G37. Never let a text tool read or write inside a main component.** Tools that read or set doc-frame text skip component sets and components shown in a frame, and skip text that still reads as its own layer name.
*Why:* a copy extract walked into a component set displayed on its doc page and picked up the component's own layer text. An apply would have changed the main component.
*Check:* an extract of a page with sets returns only doc-kit and doc-frame text.

**G45. Keep wide tables out of reading columns.** In a topics frame (the 720 reading column), use a table of three columns or fewer. A `token-table`, with its name, mode and usage columns, belongs in a blocks frame.
*Why:* a variable table in a reading column squeezed its Usage cell to a few characters per line, and the frame grew to over 7,000 px.
*Check:* no reading frame is taller than its content warrants, and no table cell wraps one word per line.

**G43. Use finished builds as references, never as sources.** `examples/` may be read to understand a pattern. Nothing is copied from it (sentences, manifests, page data, values, code), and it never replaces a step: every page is still written from its spec, the templates and tools, this system's inputs and its own Figma file. Other systems' `input/` and `output/` folders are not read at all.
*Why:* in fast mode, an agent filled pages from a finished example instead of writing the manifests and copy from the build's own sources, which made the fast-mode rules pointless.
*Check:* `kit/tools/fast-pack.mjs --check` reports no copy line taken word for word from an example and no line naming one.

# 4. Docs site

**G28. Link only to Figma files the owner approved.** With `figmaUrl` empty, every Figma link is hidden. A one-off approved link is a named constant in the page that uses it.
*Why:* a client's working file must not be exposed by the public docs.
*Check:* after every build, `dist/` contains no `figma.com` URL except the approved constants.

**G29. Show no web-only text on App-only products.** No Tailwind classes, CSS names, `npm install` or web icon sets on any page a reader sees: foundations, guidance and changelog included.
*Why:* template foundation pages showed web instructions on an App product.
*Check:* a text search of the built pages finds none of these terms.

**G30. Remove template code that the filled copy no longer reads.** After every brand-copy slot is written, delete constants and helpers that nothing reads.
*Why:* unused template constants failed the type check.
*Check:* `tsc` passes.

**G31. Use `aria-selected` only on roles that support it:** tab, option, gridcell, row.
*Why:* axe rejected it on radios and buttons.
*Check:* the QA run reports no aria-attribute errors.

**G32. Approve contrast per element, not per color pair.** Site chrome is checked separately from components.
*Why:* an approved component pair hid failing chrome text that used the same colors.
*Check:* QA contrast exceptions name an element, not just two tokens.

**G33. Wait for elements in QA, never a fixed delay.**
*Why:* a fixed 250 ms wait made the route count change between runs.
*Check:* two QA runs report the same number of routes.

**G34. Read a text style's family from the style itself.** Never infer the family from its role.
*Why:* a two-family system was labeled with one family everywhere.
*Check:* the typography page shows each style's real family.

**G38. Baseline the QA findings that frozen values cause.** When the owner keeps values that fail a check (a brand fill below AA), save the findings once with `npm run qa -- --baseline`, list them in the ledger, and let later runs fail only on new findings.
*Why:* the same 237 contrast findings in frozen components came back on every run, and any new finding was lost among them.
*Check:* `qa-report.json` shows `known` and `failures` apart, and every known finding has an approved reason in the ledger.

**G39. Stop every QA server, and never check one you didn't start.** QA scripts start their preview on a free port and stop it on any exit.
*Why:* a preview left running after a failed run held the fixed QA port. The next run then silently checked that old server.
*Check:* after a run, no preview server from it is still listening.

**G53. Copy the web template without `node_modules`, then run `npm ci`.** A copied `node_modules` can miss packages: imports such as `lucide-react` and `react-router` fail to resolve, and the error looks like a broken template.
*Why:* W1 failed `npm run build` on an untouched copy until `node_modules` was removed and reinstalled.
*Check:* `npm run build` passes on the untouched copy before W2.

**G54. Check descriptions for HTML entities before the token export.** A description written through an HTML-escaping path keeps `&#39;` or `&amp;` as literal text. The export then carries it into the site and the token files. Replace entities with the real characters in Figma, then export.
*Why:* two variable descriptions showed `don&#39;t` on the docs site.
*Check:* no variable or style description matches `/&(#\d+|quot|amp|lt|gt);/`.

# 5. Component snapshots

**G35. Export snapshots within the return limit, and keep them current.**
- When a set or variant exceeds the return limit, fall back to a smaller depth for that variant and record the fallback.
- Verify saved snapshots in the plugin and return only the differences.
- Export a set again whenever its variants change.

*Why:* large sets could not be returned in one piece, and a set changed after export left a stale snapshot.
*Check:* each snapshot's variant count equals the set's variant count in the file.
