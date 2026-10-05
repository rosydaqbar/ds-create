# ds-create web template

A brand-agnostic starting point for the web version of a design system built with ds-create: a **Tailwind v4-ready React component library** and an **explorer site** (Storybook-like) with one page per foundation and component — Overview, Component (playground + full variant matrix), Anatomy (props + token map), Guidelines and Code.

Everything brand-specific is a placeholder: the tokens in `tokens/figma-variables.json`, the logo files in `public/brand/` and the text in `src/ds.config.ts`. The workflow that fills them from a generated Figma file is `../WEB.md`.

```bash
npm install
npm run dev        # regenerate tokens, start the explorer
npm run build      # tokens + component index + typecheck + static site in dist/
```

## From Figma to code

1. Run `scripts/figma-export.js` as a `use_figma` script on the Figma file; save the result as `tokens/figma-variables.json` (large files: export in parts — see the script header — then `npm run tokens:merge`).
2. `npm run tokens` writes:
   - `src/styles/tokens.css` — CSS variables named like the Figma variables (`color/text/primary` → `--color-text-primary`), Light on `:root`, Dark on `[data-theme="dark"]`, Reduced motion; the Tailwind theme; one utility per text style (`type-body-md-regular`);
   - `src/tokens/tokens.gen.ts` — token data for the explorer;
   - `tokens/tokens.dtcg.json` — DTCG tokens with modes.
3. Export the logo files to `public/brand/` and fill `src/ds.config.ts`.

## Using the library in a product

```css
@import "tailwindcss";
@import "./design-system/tokens.css";
/* + the custom variants from src/styles/index.css */
```

```tsx
import { Button } from '@/components';

<Button size="lg" leadingIcon="general/check" label="Save changes" />
```

Props are the Figma properties (`Size=lg` → `size="lg"`). Colour mode: `data-theme="light" | "dark"` on `<html>` or any element.

## Adding a component

1. `src/components/{parts|components|sections}/{Name}.tsx` — tokens only, props from the Figma properties, `is-hover:` / `is-pressed:` / `is-focus:` / `is-disabled:` state variants and `forceState` for the explorer.
2. `src/docs/stories/{id}-{slug}.doc.tsx` — a `defineDoc({...})` module; it appears in the explorer automatically. `src/docs/stories/2.1-button.doc.tsx` is the reference.
3. `npm run build`.
