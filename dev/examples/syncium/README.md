# Syncium Design System — web

The web version of the Syncium design system, generated with ds-create from its Figma file:

- **`@syncium/design-system`**: a Tailwind v4-ready React component library with the tokens as CSS variables and DTCG JSON;
- **the explorer**: a documentation site with Getting started (overview, designers, developers), Tokens, a Changelog, eight foundations (Overview, Tokens, Guidelines) and one page per component (Overview, Component, Anatomy, Guidelines, Code).

```bash
npm install
npm run dev            # regenerate tokens, start the explorer on :5173
npm run build          # tokens + component index + checks + typecheck + static site in dist/
npm run build:package  # the installable package in package/ (then: npm pack ./package)
npm run qa             # build, then check every page and tab in Light and Dark (errors, overflow, axe WCAG 2.2 AA)
npm run qa:dev         # same checks against the running dev server
```

`npm run qa` needs a Chromium once: `npx playwright install chromium` (or set `PW_CHROMIUM_PATH`).

## Using the package in a product

```sh
npm install @syncium/design-system
```

```css
/* app.css */
@import "tailwindcss";
@import "@syncium/design-system/styles.css";
```

```tsx
import { Button } from '@syncium/design-system';

<Button size="lg" leadingIcon="general/check" label="Save changes" />
```

Props are the Figma properties (`Size=lg` → `size="lg"`). Colour mode: `data-theme="light" | "dark"` on `<html>` or any element; Reduced motion follows the OS or `data-motion="reduced"`. Without Tailwind, import `@syncium/design-system/tokens.css` (variables only). Load Figtree and JetBrains Mono (see `src/ds.config.ts`).

## From Figma to code

1. Run `scripts/figma-export.js` as a `use_figma` script on the Figma file; save the result as `tokens/figma-variables.json` (large files: export in parts, then `npm run tokens:merge`).
2. `npm run tokens` writes `src/styles/tokens.css`, `src/tokens/tokens.gen.ts` and `tokens/tokens.dtcg.json`.

**Figma and code are in sync (v1.1).** The contrast changes (`color/text/placeholder`, the Dark danger fill states and `color/text/danger`, `social-button/gitlab/fg`) and the side-by-side stepper were applied to the Syncium Figma file on 5 October 2026. `tools/figma-audit.js` reports 154 color pairs at AA, with only the documented Facebook exception. From now on, fix tokens in Figma and export again; never edit `tokens/figma-variables.json` by hand.

## Docs data

- `src/docs/meta.tsx`: status (Stable, Beta), release, search aliases and Figma node per page.
- `src/docs/changelog.ts`: release notes (shown on the Changelog page and the home page).
- `src/docs/stories/*.doc.tsx`: one module per component page.

## Credit

The Syncium brand (name, logo, colors and typography) comes from the Dribbble shot [Syncium SaaS Platform Brand Guidelines](https://dribbble.com/shots/25207945-Syncium-SaaS-Platform-Brand-Guidelines). All brand rights belong to its creator. It is used here only to demonstrate ds-create.
