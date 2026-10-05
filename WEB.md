# Web implementation

This file turns a generated Figma design system into a **Tailwind-ready React library with its own explorer site** — a Storybook-like website where people browse every foundation and component, try every property, and copy the code.

It is a reusable workflow. The starting point is the brand-agnostic template in `web/`; every build copies it and fills it from its own Figma file. Nothing in `web/` belongs to a brand: the tokens are neutral placeholders and the logo is a placeholder.

Figma stays the source of truth. The web version never invents values: tokens come from the Figma variables, component properties come from the Figma component sets, documentation comes from the page specs.

# 1. When this runs

- At initiation, when **Web implementation** is selected in `INITIATOR.md` Part A §10.
- Later, at any time, as its own task ("implement the system for web").
- After a component is added through `EXTEND.md`, when the system already has a web implementation.

It runs **after** the Figma pages it implements exist. A component is implemented on the web only when its Figma page is complete.

# 2. What is produced

```text
{system}-web/                    a copy of ds-create/web, filled for the brand
├─ tokens/
│  ├─ figma-variables.json       export of the Figma file (input)
│  └─ tokens.dtcg.json           DTCG tokens (generated)
├─ public/brand/                 logo and mark files exported from 1.8 Brand assets
├─ scripts/
│  ├─ figma-export.js            use_figma script that exports variables and styles
│  ├─ merge-export.mjs           merges a partial export
│  ├─ build-tokens.mjs           figma-variables.json → CSS, Tailwind theme, TS data, DTCG
│  └─ build-index.mjs            writes the component index
└─ src/
   ├─ ds.config.ts               name, version, description, logo files, fonts, Figma link
   ├─ styles/
   │  ├─ index.css               Tailwind, tokens, colour-mode and state variants
   │  └─ tokens.css              generated: CSS variables, Tailwind theme, text-style utilities
   ├─ tokens/tokens.gen.ts       generated: token data for the explorer
   ├─ icons/index.tsx            icon registry: system icon names → icon library
   ├─ lib/                       cn(), shared prop types, forced-state helper
   ├─ components/
   │  ├─ parts/                  2.x — one file per published set
   │  ├─ components/             3.x
   │  ├─ sections/               4.x
   │  └─ index.ts                generated exports
   └─ docs/                      the explorer
      ├─ App.tsx, ComponentPage.tsx, registry.ts, types.ts
      ├─ blocks/                 stage, matrix, playground, props and token tables, do / don't
      ├─ pages/                  Home, Getting started, Tokens, Foundations 1.1–1.8
      └─ stories/                one {id}-{slug}.doc.tsx per component page
```

The explorer follows the Figma page tree: Guidance (Getting started, Tokens), Foundations 1.1–1.8, Parts, Components, Sections. Every component page has the same tabs as the Figma frames — **Overview, Component, Anatomy, Guidelines** — plus **Code**.

# 3. Stack

Fixed for every build, so every build reads the same way:

| Concern | Choice |
| --- | --- |
| Language and UI | TypeScript, React 19 |
| Styling | Tailwind CSS v4, configured in CSS (`@theme`), no `tailwind.config.js` |
| Variants | `class-variance-authority` (`cva`) and `clsx` |
| Icons | one registry (`src/icons`); Lucide by default, swapped for the library chosen on 1.7 |
| Explorer | Vite and React Router; static build that works from any folder |

Do not add a CSS-in-JS library, a second styling system or a component library underneath. Components are built from system tokens only.

# 4. Workflow

Run the steps in order. Each step names its exit check.

## W1 · Copy the template

Copy `ds-create/web/` to the output folder (by default `{system-name}-web/` next to wherever the user keeps the build, or the folder the user names). Run `npm install`.

Exit check: `npm run build` passes on the untouched copy.

## W2 · Export tokens from Figma

1. Run `web/scripts/figma-export.js` as a `use_figma` script on the generated Figma file. It is read-only.
2. Save the returned JSON as `tokens/figma-variables.json`.
3. Tool output is capped at about 20 KB. When the file is bigger, set `PART` at the top of the script and export in slices — for example `Color` in two halves, then the other collections, then `styles: true` — saving each result as `tokens/parts/01.json`, `02.json`, …, then run `npm run tokens:merge`.
4. Run `npm run tokens`.

Exit check: the script reports every variable, text style and effect style of the Figma file; no alias is unresolved (the script stops on an unknown alias).

## W3 · Brand assets and identity

1. Export from `1.8 Brand assets` the lockup for light and dark surfaces and the mark as SVG into `public/brand/` with the names in `src/ds.config.ts`.
2. Fill `ds.config.ts` from `00 Cover`: system name, version, description, and the Figma file link.
3. When the brand typeface is a web font, add its stylesheet to `fontStylesheets`; the family names already come from `font/family/*`.
4. Replace the icon imports in `src/icons/index.tsx` when 1.7 uses a library other than Lucide; keep the names.

Exit check: the explorer header shows the real logo in both colour modes; text renders in the brand typeface.

## W4 · Components

Work in page order (2.x, then 3.x, then 4.x), only for pages in scope. For each page:

1. Load the page's spec (`parts/…`, `components/…`, `sections/…`) and read the published set in Figma.
2. Write the component in `src/components/{level}/{Name}.tsx` following §6.
3. Write the documentation module `src/docs/stories/{id}-{slug}.doc.tsx` following §7.
4. Run `npm run build` and look at the page in both colour modes.

Mode: the same choice as the Figma build (`INITIATOR.md` Part A §8). **YOLO everything** implements every page in one pass; **One by one** stops after each page for review.

Exit check per page: QA §9 passes.

## W5 · Build and publish

1. `npm run build` → `dist/` is a static site; it can be opened from any folder or hosted anywhere.
2. Give the user the location of the project and, when hosting is available, the explorer link.

# 5. Token contract in code

Names are the Figma variable names with `/` replaced by `-` (SYSTEM.md Part C §3).

| Figma | CSS variable | Tailwind |
| --- | --- | --- |
| `color/text/primary` | `--color-text-primary` | `text-text-primary` |
| `color/icon/secondary` | `--color-icon-secondary` | `text-icon-secondary` |
| `color/border/default` | `--color-border-default` | `border-border-default` |
| `color/surface/raised`, `color/fill/…` | `--color-surface-raised` | `bg-surface-raised`, `bg-fill-brand-solid` |
| `space/md` | `--space-md` | `p-md`, `gap-md`, `m-md` |
| `radius/control` | `--radius-control` | `rounded-control` |
| `font/family/ui` | `--font-family-ui` | `font-ui` |
| `font/weight/semibold` | `--font-weight-semibold` | `font-semibold` |
| `font/size/body-md` | `--font-size-body-md` | `text-body-md` (with its line height) |
| `type/body/md/regular` (text style) | — | `type-body-md-regular` (family, size, line height, spacing, weight) |
| `elevation/raised`, `focus/default` (effect styles) | `--elevation-raised`, `--focus-default` | `shadow-raised`, `shadow-focus-default` |
| `motion/easing/enter` | `--motion-easing-enter` | `ease-enter` |
| `size/control/md`, `motion/duration/base`, component tokens | `--size-control-md`, `--button-padding-x-md` | arbitrary values: `h-(--size-control-md)`, `duration-(--motion-duration-base)` |
| `palette/*`, `scale/*` (primitives) | `--palette-brand-600` | none — never used by components |

Rules:
- Tailwind's default colours, radii and shadows are removed; only system tokens exist.
- Light values sit on `:root`, Dark values on `[data-theme="dark"]`. Colour tokens resolve to primitives, so `data-theme` works on `<html>` or on any element.
- `motion/*` follows the `Reduced` mode under `prefers-reduced-motion: reduce` and on `[data-motion="reduced"]`.
- Size-named width utilities collide with spacing steps (`max-w-md` would read `space/md`). Use size tokens or explicit values for widths: `w-(--size-width-xs)`, `max-w-(--size-measure-reading)`, `max-w-[40rem]`.
- Never type a hex value, a pixel value that has a token, or an opacity on a layer. If a value is missing, it is missing in Figma first.

# 6. Component contract

## 6.1 One file per published set

`Button` in Figma is `Button` in code (`src/components/parts/Button.tsx`). Private parts (`.Main/…`) are internal components in the same file or in a file starting with `_` (`_VideoPlayerParts.tsx`); the component index skips `_` files, and the doc module imports them only to show the `.Main` matrices.

Exported names are unique across the library (the generated index re-exports every file): name sample data after its component, e.g. `selectSampleOptions`.

A component only uses components from lower levels, exactly as in Figma (a Select uses Text control, Label, Help text, Avatar, Checkbox).

## 6.2 Props are the Figma properties

| Figma property | Prop |
| --- | --- |
| Variant `Size`, `Emphasis`, `Tone`, `Type`, `Status`, `Placement`, `Orientation` | camelCase name, same values: `size="md"`, `emphasis="secondary"` |
| `Selected`, `Checked`, `Open`, `Playing`, `Filled` | booleans (`checked`, `open`); `Checked=mixed` → `checked="mixed"` |
| `Icon only` | `iconOnly` |
| Text properties (`Label`, `Text`, `Supporting text`, `Hint`) | `label`, `text`, `supportingText`, `hint` |
| `Show {part}` + its swap (`Show leading icon` + `Leading icon`) | one optional prop (`leadingIcon?: IconName`); present = shown |
| Instance swap of an asset (`Flag`, `Logo`, `Image`) | a typed prop (`flag="fr"`, `src`) |
| `State` | not a prop: rest, hover, pressed and focus come from the browser; `disabled` and `loading` are props |
| `Filled` on fields | derived from the value, not a prop |

Every component also accepts its native HTML attributes and `className`.

## 6.3 States

- Use the state variants from `index.css` — `is-hover:`, `is-pressed:`, `is-focus:`, `is-focus-within:` (composite controls), `is-disabled:` — never plain `hover:` or `focus-visible:`.
- Each variant also matches `data-force="…"`, so the explorer can show a Figma `State` statically: components take `forceState?: 'hover' | 'pressed' | 'focus'` (documentation only) and spread `forceAttr(forceState)`.
- Focus is the `shadow-focus-default` / `shadow-focus-danger` effect, never the browser outline alone.
- Motion follows the pairings on 1.6 Motion, always through the motion tokens, so the Reduced mode works everywhere:
  - hover, press and colour changes: `duration-(--motion-duration-fast) ease-standard`;
  - switch thumbs, checkbox marks, radio dots, indicators: `duration-(--motion-duration-base) ease-standard` — marks scale and fade in, they are never toggled with `hidden`;
  - popups (Select lists, menus, submenus, context menus, tooltips, floating toolbars) enter with `motion-enter` (base · enter) and leave with `motion-exit` (fast · exit). Use `usePresence(open)` from `src/lib/motion.ts` so the popup stays mounted while it leaves, and set `data-side="above"` when it opens upward;
  - dialogs and drawers: `motion-enter-slow` (slow · enter);
  - content that swaps in place: `motion-fade-in`;
  - spinners: `duration-(--motion-duration-loop)`, linear.
- A component that appears, moves or disappears without one of these is a QA failure.
- Parent-driven states use named groups with the same variants: `group/item` on the parent, `group-is-hover/item:` on the child.
- A value with no token (a fixed media width, an arrow size) is written once as a named constant at the top of the file and listed in the doc module, so it can become a token later.

## 6.4 Behaviour and accessibility

Effects (`useEffect`, `useLayoutEffect`) always use a block body and return nothing or a cleanup function — never the value of a call. `useEffect(() => window.scrollTo(0, 0))` returns a Promise in newer browsers and crashes the app on unmount; `npm run build` runs `check:effects` to catch this.

Components work, not just look right: real `<button>`, `<input>`, `<label>` elements; keyboard support as each spec's Accessibility topic describes (arrow keys in menus and lists, Escape to close, Space and Enter to activate); accessible names on icon-only controls; `aria-*` for state (`aria-pressed`, `aria-checked`, `aria-expanded`, `aria-invalid`, `aria-busy`). Popups (Select, Menu, Tooltip) open next to their trigger and close on outside click and Escape.

# 7. Documentation contract

Each component page is one `ComponentDoc` (`src/docs/types.ts`), registered by file name — no shared list to edit. The four Figma frames map to tabs:

| Figma frame | Explorer tab | `ComponentDoc` fields |
| --- | --- | --- |
| `· Overview` | Overview | `hero`, `examples` (the spec's compositions, each with copy-ready `code`), `whenToUse` |
| `· Component` | Component | `playground` (one control per Figma property), `matrices` (the full variant matrix from the spec's Matrix layout) |
| `.Main` | Component (after the matrices) | `privateParts` — the matrices of the private parts, which are not exported |
| `· Anatomy` | Anatomy | `anatomy.parts` (numbered layers), `props` (with the Figma property per prop), `tokens` (rendered as the token map with Light, Dark, CSS and Tailwind) |
| `· Guidelines` | Guidelines | `guidelines` (the spec's topics, with do / don't built from real components), `accessibility` |
| — | Code | import line, every example's code, token → Tailwind map |

Copy text from the spec: family header description as `summary`, captions as written. Matrices show every variant the Figma set has — never a reduced demo row. `src/docs/stories/2.1-button.doc.tsx` is the reference module.

# 8. Keeping code and Figma in sync

- Changed variables or styles: run W2 again; components update without edits.
- Changed component properties: change the component and its doc module in the same task.
- New component: `EXTEND.md` builds the Figma page, then W4 for that page.
- A difference between code and Figma is a bug in code, unless the user decides otherwise.

# 9. QA

Fail QA when:
- a component contains a hex value, a raw pixel value that has a token, or a Tailwind default colour, radius or shadow;
- a prop name or value differs from the Figma property (`variant` for Emphasis, `destructive` for Tone=danger);
- a Figma variant is missing from the component or from its matrix;
- hover, pressed, focus, disabled or loading looks different from the Figma variant;
- the page is wrong in Dark, or a themed subtree (`data-theme` on a section) does not switch;
- a component is not keyboard accessible or an icon-only control has no accessible name;
- something appears, moves or disappears without its 1.6 Motion pairing, or ignores the Reduced mode;
- a doc module lacks examples with code, the playground, the matrix, the props table or the token map;
- the explorer build fails or logs errors in the browser console;
- a brand value is written into the template (`ds-create/web` stays placeholder-only).
