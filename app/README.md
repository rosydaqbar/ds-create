# ds-create app previews

For App products, the docs site (`../web/`) previews every component in React Native, rendered in the browser with react-native-web, and shows its code in React Native, Swift and Kotlin (`../APP.md`, `../WEB.md` §7.1). This folder holds the brand-agnostic React Native source behind those previews. It is never built into an app, and nothing native is installed.

```text
app/
├─ scripts/build-rn-tokens.mjs   Figma export → react-native/tokens/tokens.ts
└─ react-native/                 the preview source: tokens, theme, icons, components (Button is the reference)
```

A build copies `react-native/` into its docs project, at `output/{system-slug}/web/react-native/` (workflow/APP.md A1). In ds-create itself the docs site picks up `react-native/` by itself, so the template's Button shows in App preview (`VITE_DS_PRODUCT=both npm run dev` in `../web/`).

Regenerate the template tokens from the placeholder export:

```bash
node scripts/build-rn-tokens.mjs --in ../web/tokens/figma-variables.json --out react-native/tokens
```

Nothing here belongs to a brand: the tokens are the web template's neutral placeholders.
