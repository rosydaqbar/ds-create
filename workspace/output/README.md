# Output

Everything ds-create generates goes here, never into the executor folders (`web/`, `app/`, `templates/`, `tools/`, `workflow/`, the page specs) and never into `examples/`. What the user provides goes into `workspace/input/` (`workspace/input/README.md`), not here. Nothing in this folder is committed except this file: `.gitignore` ignores `workspace/output/*`.

```text
workspace/output/
├─ {system-slug}/                one folder per design system, e.g. workspace/output/acme/ (the same slug as workspace/input/acme/)
│  ├─ foundations.json          saved local draft reviewed before Figma generation (workflow/MANAGER.md)
│  ├─ ds-create-ledger.json      progress ledger (INITIATOR.md Part B §0)
│  ├─ manager/                   builder dashboard from init: local server, live foundation views and progress (workflow/MANAGER.md)
│  ├─ copy/                      one copy file per page: every sentence on the Figma frames and the docs site (workflow/COPY.md)
│  ├─ fast/                      fast mode only: one page manifest per page (workflow/FAST.md)
│  ├─ figma/                     figma-variables.json (the export), set snapshots, figma-audit results
│  ├─ web/                       the docs site for every product type (workflow/WEB.md); App previews in web/react-native/ (workflow/APP.md)
│  └─ reports/                   init.md, build-{date}.md and qa-{date}.md (the skill's reports), build notes and reviews
└─ reports/                      reviews of ds-create itself
```

`{system-slug}` is the system name in lowercase kebab case (`Acme Design System` → `acme`; drop "design system"). The Figma file itself lives in Figma; this folder holds the local foundation source and confirmed outputs from Figma.

A different location is used only when the user explicitly asks for one. A finished build becomes a committed reference only when the user asks to add it to `examples/`.
