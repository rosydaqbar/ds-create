# Templates

`structure.md` is the structure every generated Figma page follows, whatever it documents: page → frames (one per job) → blocks → items. It fixes how those levels are arranged, documented vs bare frames, spacing, names and the structure components (`Doc/Header`, `Doc/Footer`, `Doc/Block note`, `Doc/Badge`).

It holds no content. Which frames a page has comes from the spec (in this repo SYSTEM.md Part A); what each frame holds comes from the page's own file (`guidance/`, `foundations/`, `parts/`, `components/`, `sections/`). Examples of filled pages belong in previews, never here.

Notation in `structure.md`: one layer per line, `TYPE  layout  W  H  padding  gap  style`. `V` / `H` are Auto Layout directions; `hug`, `fill` or a number for size. Spacing and widths are `doc/*` tokens; the number in brackets is their default.

`agent-brief.md` is the brief for agents that build docs-site pages (`INITIATOR.md` Part B §6, step 19). It holds what a page agent needs from `workflow/WEB.md`, `workflow/APP.md` and `web/COPY-GUIDE.md`, so each agent reads about 1.5k tokens instead of the full files. When any of those files changes, check this brief against it.
