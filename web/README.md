# ds-create web template

A brand-agnostic starting point for the web version of a design system built with ds-create:
- a **Tailwind v4-ready React component library**, shipped as an installable package;
- a **documentation site** for designers, product managers and developers: Getting started (overview, for designers, for developers), Tokens, Changelog, Foundations with Overview, Tokens and Guidelines, and one page per component with Overview, Component (playground and full variant matrix), Anatomy (marked on the live component, props, token map), Guidelines and Code. It has site search (⌘K) and Stable/Beta status labels.

Everything brand-specific is a placeholder: the tokens in `tokens/figma-variables.json`, the logo files in `public/brand/`, the text in `src/ds.config.ts`, and the sentences marked `// BRAND:` in the foundation and guidance pages. The workflow that fills them from a generated Figma file is `../WEB.md`; every word follows `COPY-GUIDE.md`. A build never edits this folder: it copies it to `output/{system-slug}/web/` (`../README.md` §5).

```bash
npm install
npm run dev            # regenerate tokens, start the site
npm run build          # tokens, index, effect and contrast gates, typecheck, static site in dist/
npm run build:package  # the installable package in package/ (then: npm pack ./package)
npm run qa             # build, then every page and tab in Light and Dark: errors, overflow, axe WCAG 2.2 AA
npm run qa:dev         # the same checks against the running dev server
```

`npm run qa` needs Chromium once: `npx playwright install chromium` (or set `PW_CHROMIUM_PATH`).

## From Figma to code

1. Run `scripts/figma-export.js` as a `use_figma` script on the Figma file; save the result as `tokens/figma-variables.json` (large files: export in parts — see the script header — then `npm run tokens:merge`).
2. `npm run tokens` writes:
   - `src/styles/tokens.css` — CSS variables named like the Figma variables (`color/text/primary` → `--color-text-primary`), Light on `:root`, Dark on `[data-theme="dark"]`, Reduced motion; the Tailwind theme; one utility per text style (`type-body-md-regular`);
   - `src/tokens/tokens.gen.ts` — token data and Figma page ids for the site;
   - `tokens/tokens.dtcg.json` — DTCG tokens with modes.
3. `npm run check:contrast` checks every text-on-surface and text-on-fill pair in every mode. Fix failures in the Figma variables and export again; never patch the export.
4. Export the logo, mark and flag files to `public/brand/` and fill `src/ds.config.ts`.

## Using the library in a product

```sh
npm install @your-org/design-system   # the packageName in src/ds.config.ts
```

```css
@import "tailwindcss";
@import "@your-org/design-system/styles.css";   /* tokens, theme, state variants, utilities, @source */
```

```tsx
import { Button } from '@your-org/design-system';

<Button size="lg" leadingIcon="general/check" label="Save changes" />
```

Props are the Figma properties (`Size=lg` → `size="lg"`). Color mode: `data-theme="light" | "dark"` on `<html>` or any element; Reduced motion follows the OS or `data-motion="reduced"`.

## Adding a component

1. `src/components/{parts|components|sections}/{Name}.tsx` — tokens only, props from the Figma properties, `is-hover:` / `is-pressed:` / `is-focus:` / `is-disabled:` state variants, `forceState` for the docs, `data-anatomy` on every part, and the accessibility rules in workflow/WEB.md §6.4.
2. `src/docs/stories/{id}-{slug}.doc.tsx` — a `defineDoc({...})` module written in the voice of `COPY-GUIDE.md`; it appears on the site automatically. `src/docs/stories/2.1-button.doc.tsx` is the reference.
3. Add the page to `src/docs/meta.tsx` (status, since, aliases) and a line to `src/docs/changelog.ts`.
4. `npm run build`, then `npm run qa`.
