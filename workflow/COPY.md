# Copy

Every sentence a reader sees in the Figma doc frames and on the docs site comes from one copy file per page. The two surfaces may say it differently, because the site also serves developers. The file keeps both versions side by side, under the same topic, so a review changes one place, and each change reaches Figma and the site from that file.

# 1. Where it lives

```text
output/{system-slug}/copy/
├─ 00-cover.md
├─ 01-getting-started.md
├─ 1.1-color.md
├─ 2.1-button.md          one file per page, named {id}-{kebab name}.md
└─ …
```

- **What a copy file holds:** prose only. Summaries, descriptions, paragraphs, captions, list items, do and don't reasons, accessibility and in-app notes, and anatomy part descriptions.
- **What it never holds:** values, which stay computed from tokens and components; code, which stays in the stories; or labels inside a visual (a token badge, an axis label, a measurement).
- **When it is written:** the copy file for a page is written before the page is drawn (`workflow/INITIATOR.md` Part B §6) and kept current after every review.
- **Where the "why" comes from.** Before writing a page's copy, read the `knowledge/` topics its index lists for the page (`knowledge/README.md` §3). They are the reasoning behind the specs. Write that reasoning into the copy as the system's own explanation, in its own words and with its own values. For example, a Button page says why its label sits in a small frame of its own, using the system's numbers. The reader should meet a designer's reasoning, never its source:
  - no principle ids (`B1`), knowledge file names, or the word "knowledge";
  - no citing ("according to the principle…", "as the rationale says…");
  - no sentence copied from `knowledge/`, and none of its example numbers: the system's tokens and values only;
  - the spec still decides what the page says. Knowledge only explains why, and fills in reasoning the spec leaves out.
  `kit/tools/copy-guard.mjs` checks this (§7).
- **Hard rule in fast mode and in YOLO.** No page is drawn until:
  1. its knowledge topics are read, and listed under the page's `loaded` in the ledger;
  2. its copy carries their reasoning;
  3. `node kit/tools/copy-guard.mjs --slug {slug} --page {id}` passes.

  `kit/tools/fast-pack.mjs` refuses `--check`, `--page` and `--call` for a page that fails any of these.
- **The citing ban holds in fast mode too.** The guard reads the copy files, the fast-mode manifests, the packed payload of each page (every string that reaches Figma) and the site's stories. Knowledge names and ids may appear only in internal records: the ledger's `loaded`, the build notes and reports to the user. They never appear in anything a reader of the docs sees. In YOLO with the standard engine, run the same check before the page's first drawing call. A failure is fixed on the spot, never noted for later, and YOLO never skips it to save time.

# 2. Format

Before drafting, follow `workflow/EDITORIAL.md`: examine the subject, read current evidence, identify reader decisions, then save a plan in `output/{slug}/plans/{id}-{name}.json`. The plan tracks six coverage goals; these are not visible headings. Edit for redundancy after drafting, then run `copy-guard.mjs --slug {slug} --page {id} --editorial`. A saved plan is also checked by the existing page/build guard and Fast packer. Legacy copy without a plan remains supported; new or revised guidelines require one. Prose quality checks apply to every copy file, including legacy files without plans and all text roles.

The section names below are transport slots for Figma frames and web tabs, not an editorial outline. Choose the topics within them for the subject. Default manifests are visual starting points: merge, remove or reorder topics together with the copy while retaining required specifications and visuals. A frame header may have no paragraph when its topics already establish the context.

```markdown
---
page: 2.1 Button
figma: 22292:613044
web: src/docs/stories/2.1-button.doc.tsx
---

# Summary
<!-- figma: 22292:613928 -->
[both] Buttons start the actions people take: continue, confirm, save.

# Guidelines

## One main action per screen
<!-- figma: 22292:614520 | web: guidelines -->
[figma] Each screen has a single primary button, usually at the bottom.
[web] Each screen has a single primary button. In code, set emphasis="primary" on one button per view.
[both do] One primary action, with a secondary one beside it.
[both don't] Two primary buttons compete for attention.

# Accessibility
[figma item] The visible label is the button's accessible name.
[web item] The visible label is the accessible name; an icon-only button needs aria-label.
```

**Front matter.**
- `page`: the page name.
- `figma`: the page's node id.
- `web`: the site file that renders it.

**`#` sections.** A section is either a fixed section of the page type (§3) or, on a reading page, a frame (§3).

**`##` items.** A topic, set, example or block inside a section. Sections that are plain lists have no items.

**Source comment.** An HTML comment under a section or item title gives its sources:
- `figma:` is the node id of the frame, topic or instance that holds the text;
- `web:` is the field or anchor on the site.

Navigate with them: paste a node id into Figma's search, or open the web path.

**Lines.** Each line is one paragraph, caption or list item: `[{surface} {role}] text`.
- `surface` is `both`, `figma` or `web`.
  - Write `both` when the two say the same thing.
  - When they differ, write a `figma` line and a `web` line next to each other, in the same order.
- `role` is empty (a paragraph), `caption`, `item`, `do` or `don't`.
- Paragraphs of the same surface keep their order.
- A reading section with `<!-- web: narrative -->` uses its authored topics in place of the template’s explanations on the site; computed specimens, code and token tables remain. The shared reading-topic reader also supports a marked section containing several subtopics. `# Summary` optionally supplies its page description. A Guidelines section marked `<!-- web: replace -->` makes its topic order authoritative on the site. Without these markers the existing template/merge behavior remains.
- To rename a web topic while preserving its visual and deep link, put the previous title in its source comment (`<!-- web: Previous title -->`). Consolidations may list previous titles separated by `;` inside that value. Retain required visuals explicitly; a copy-only topic has no invented specimen.
- Text is plain: no Markdown inside a line. Inline code names (token, component and property names) are written as they appear.

# 3. Sections per page type

| Page type | Sections, in this order |
| --- | --- |
| Part, Component, Section, Layout (`2.x`–`5.x`) | `Summary` · `Sets` (one item per published set: its family description) · `Examples` (one item per example: caption) · `When to use` · `When not to use` · `Guidelines` (one item per topic) · `Accessibility` · `In apps` · `Anatomy` (one item per part: its description) |
| Foundation (`1.x`), guidance (`00`, `01`, `02`) | one section per frame, by its name after `·` (`Overview`, `Tokens`, `Guidelines`, `How the file works`). Lines directly under the section are the frame's header description. One item per topic or block, by its title. |

A section with nothing in it is left out. Text that only one surface has carries only that surface's lines. For example, the site's props and code notes are not in the copy file, and Figma's anatomy is read from the component's layers.

Some text is not copy, and stays out of the file:
- text the doc builder writes the same way on every page: the Anatomy frame's block notes and the "Examples in use" note;
- text inside a component set or main component shown on a frame (`workflow/GOTCHAS.md` G37);
- a text layer that still reads as its own layer name, such as a `Caption` placeholder.

**Reading pages on the site.** The kit's guidance and foundation pages read authored summaries, topics and guidelines through the shared copy readers. Numeric references, token tables, code and specimens remain data-driven. When adding another reading page, connect its authored explanations through these readers and verify the rendered output; a saved copy file alone does not prove that the site displays it. Review any captions or prose retained inside reference visuals by the same editorial standard.

# 4. How each surface reads it

- **Docs site.** `npm run copy` (part of `npm run build`) parses `../copy/*.md` into `src/docs/copy.gen.json`, keeping only the site's lines (`both` and `web`). Each page's story is merged with it by page id: `both` and `web` lines replace the story's summary, when-to-use lists, guideline bodies and do / don't captions (matched by topic title), accessibility items, in-app notes, example captions (by title) and anatomy part descriptions (by part name). The story keeps the visuals and code.
- **Figma.**
  - The doc builder's page data is filled from the `both` and `figma` lines when the page is drawn.
  - After a review, `kit/tools/figma-copy.js` applies the edited copy to the existing frames by node id. It changes text only, and returns every place where the number of paragraphs or items no longer matches.
  - When the structure changed (a new topic, an extra paragraph), the page is rebuilt with the doc builder instead (`workflow/GOTCHAS.md` G27).
- **Drift check.** `kit/tools/figma-copy.js` in `diff` mode compares a page's frames with its copy file and lists every difference. Run it after any direct edit in Figma, and fold the edit back into the copy file.

# 5. Review

1. Edit the copy file: change the `both` line, or the `figma` and `web` lines together, so the two surfaces keep the same meaning.
2. Run `npm run copy` and check the site.
3. Apply to Figma with `kit/tools/figma-copy.js` (`apply`), then run `diff` to confirm 0 differences.
4. Record what the review changed in `output/{system-slug}/reports/build-notes.md`. Save the user's review comments to `input/{system-slug}/chat/` (`input/README.md` I3).

# 6. Adding copy files to a finished build

When a build has no copy files yet:
1. Run `kit/tools/figma-copy.js` in `extract` mode on every doc page (read-only, a few pages per call, within the 20 KB return limit).
2. Read the site's text for the same pages from the built stories.
3. Write one copy file per page: put each surface's lines under the same topic, and write a `both` line wherever the two say exactly the same thing.
4. Check both surfaces: the site's text is unchanged after `npm run copy`, and `diff` reports 0 differences on every page.

Topics that exist on only one surface, or that say different things, are listed for the next review, not merged without the user.

# 7. QA

- Every in-scope page has a copy file, with the sections of its page type in order.
- Every item that appears in Figma has a `figma:` source, and every item that appears on the site has a `web:` source.
- `kit/tools/figma-copy.js` `diff` reports 0 differences on every page.
- `npm run copy` reports no unknown section, role or surface.
- `node kit/tools/copy-guard.mjs --slug {slug}` reports nothing: no copy line or site string cites `knowledge/` or copies it word for word (§1). `kit/tools/fast-pack.mjs --check` runs it too.
