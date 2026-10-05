# Output

Everything ds-create generates goes here, never into the executor folders (`web/`, `app/`, `templates/`, `tools/`, the page specs) and never into `examples/`. Nothing in this folder is committed except this file: `.gitignore` ignores `output/*`.

```text
output/
├─ {system-slug}/                one folder per design system, e.g. output/acme/
│  ├─ ds-create-ledger.json      progress ledger (INITIATOR.md Part B §0)
│  ├─ figma/                     figma-variables.json (the export), figma-audit results
│  ├─ web/                       the web project (WEB.md), when Web is a target
│  ├─ native/                    the React Native project (APP.md), when chosen
│  ├─ ios/                       the SwiftUI project (APP.md), when chosen
│  ├─ android/                   the Jetpack Compose project (APP.md), when chosen
│  └─ reports/                   QA reports and reviews for this system
└─ reports/                      reviews of ds-create itself
```

`{system-slug}` is the system name in lowercase kebab case (`Acme Design System` → `acme`; drop "design system"). The Figma file itself lives in Figma; this folder holds what is generated from it.

A different location is used only when the user explicitly asks for one. A finished build becomes a committed reference only when the user asks to add it to `examples/`.
