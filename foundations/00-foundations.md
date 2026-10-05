# Foundations

Foundations are the tokens, styles and assets every component uses. They are built before any Part, and every component page binds to them instead of typing its own values.

# 1. Pages

Foundation pages sit under the `── 1 · Foundations ──` separator, in this exact order:

| Page | What it holds | Owns | Spec |
| --- | --- | --- | --- |
| `1.1 Color` | base and extended palettes, gradients, every semantic color role | `Primitives` palette groups, `Color` collection, gradient styles | `1.1-color.md` |
| `1.2 Typography` | typefaces, type scale, text styles | `Typography` collection, `type/*` text styles | `1.2-typography.md` |
| `1.3 Space & layout` | space scale, sizes, widths, containers, reading measure, breakpoints and grids | `Space` and `Size` collections, `grid/*` grid styles | `1.3-space-and-layout.md` |
| `1.4 Shape` | corner radius roles and border widths | `Shape` collection | `1.4-shape.md` |
| `1.5 Elevation` | shadows, focus rings, backdrop blurs | `elevation/*`, `focus/*` and `blur/*` effect styles | `1.5-elevation.md` |
| `1.6 Motion` | durations, easings, delays, pairings, reduced motion | `Motion` collection | `1.6-motion.md` |
| `1.7 Iconography` | the icon library and utility marks | `Icon/*` components, utility mark sets | `1.7-iconography.md` |
| `1.8 Brand assets` | product logos, third-party logos, flags, payment, file-type, social and app-store marks | asset components | `1.8-brand-assets.md` |

Rules:
- Keep this order. Page names never change after creation and IDs are never reused.
- Create a page only when it is in scope. An out-of-scope foundation gets no placeholder page.
- Space, sizes, widths, containers and grids stay together on `1.3 Space & layout`; radius and border widths stay together on `1.4 Shape`. Do not split them into more pages.
- Do not add other foundation pages unless the user asks. A new foundation takes the next free ID (`1.9`).
- Each collection, style group and asset family is owned by exactly one page. Other pages show it only by reference (an instance, a swatch bound to the variable, a link), never as a second copy.

# 2. Foundation page template

Every foundation page is built with `templates/structure.md` and uses these frames, left to right, top-aligned, separated by `doc/space/canvas`:

```text
{ID} {Name}
├─ .Main                            private helpers (only when the page has helpers)
├─ {ID} {Name} · Overview            specimens: palettes, type scale, space scale, effects, icons, assets
├─ {ID} {Name} · Tokens              variable tables (only when the page owns variables)
└─ {ID} {Name} · Guidelines          long-form reading frame with visual teaching
```

Every frame starts with `Doc/Header` (breadcrumb `Foundations › {ID} {Name}`) and ends with `Doc/Footer`.

Which frames each page has:

| Page | `.Main` | `· Overview` | `· Tokens` | `· Guidelines` |
| --- | --- | --- | --- | --- |
| 1.1 Color | yes | yes | yes | yes |
| 1.2 Typography | yes | yes | yes | yes |
| 1.3 Space & layout | yes | yes | yes | yes |
| 1.4 Shape | yes | yes | yes | yes |
| 1.5 Elevation | yes | yes | — (effect styles are not variables) | yes |
| 1.6 Motion | yes | yes | yes | yes |
| 1.7 Iconography | yes | yes | — (icon sizes live on 1.3, icon colors on 1.1) | yes |
| 1.8 Brand assets | yes | yes | — (assets carry no variables) | yes |

## .Main

- Starts with a private header: these are internal building blocks for the specimens on this page; edit them to update every specimen, never use them in product screens.
- Each helper is named `.Main/{Page} {part}` (for example `.Main/Color swatch card`), shows its name and a one-line purpose, and is never published.
- Helpers bind their sizes to documentation tokens (`doc/measure/specimen`, `doc/space/*`), never to fixed pixel values.
- When `9.1 Doc kit` already has the right component (`Doc/Color swatch`, `Doc/Type row`, `Doc/Measure`), use it and add no helper.

## · Overview

The specimen frame. It is what a designer looks at to see the foundation at a glance.
- Each section starts with a `Doc/Block note` (title, optional `Doc/Badge`, short description).
- Rows use the note-left / specimen-right composition: `Doc/Row note` at `doc/measure/row-note`, then the specimen region filling the rest.
- Every specimen is real: swatches bound to their variable, text set in its text style, bars and boxes bound to their space or size token, icons and assets as instances.
- The frame is at least `doc/measure/frame` wide and grows horizontally when palettes, scales or grids need room. Never shrink specimens to fit a width.

## · Tokens

The variable tables for the collections this page owns, built exactly as Part B §6 of `SYSTEM.md`:
- one `Doc/Block note` per variable group (title, `Variables` badge, what the group is for), at `doc/measure/reading`;
- then one full-width table: Name column (`Doc/Token badge`, children with `Doc/Tree connector`), one column per mode (`Doc/Alias chip` with resolved swatch or value), Usage column (the token's description, written as a concrete UI purpose);
- the table fills the frame and never takes the width of the note above it;
- extra modes add columns; long names widen the Name column; long usage wraps and grows the row.

## · Guidelines

The reading frame (Part B §7): `doc/measure/frame` wide, a rich-text column at `doc/measure/reading`, growing vertically.
- Topics appear in the order the page spec lists them.
- Each topic is heading → explanation → visual example → optional caption. The visual example sits directly after the text it supports and uses the full reading-column width.
- Visual examples are built from the generated system's own components, tokens, styles and copy: comparisons, anatomy diagrams, workflow and propagation examples, measurement overlays, specimens. Never paste screenshots from another file.
- A topic whose visual example is listed as required is not done until the visual exists.

# 3. Shared rules

## Values come from the brand

- Preserve existing brand values (palette, typeface, scale, radius, effects, assets) when the user has them.
- When a value is missing, use the default stated in the page spec. Defaults are starting points that produce a coherent system; they are replaced by the brand's values whenever the brand has them.
- Never invent a logo, flag or third-party mark. Assets come only from the user.

## Build order

```text
Brand tokens: Primitives → Color, Typography (variables and text styles), Space, Size, Shape
→ Documentation collection (aliases those tokens) → 9.1 Doc kit
→ 1.1 Color → 1.2 Typography → 1.3 Space & layout → 1.4 Shape pages
→ 1.5 Elevation (needs color shadow roles and focus colors)
→ 1.6 Motion
→ 1.7 Iconography → 1.8 Brand assets
→ Parts
```

The brand's tokens come first because the documentation is styled with them (SYSTEM.md Part B §1). The doc kit comes next, before any foundation page, so every page is documented with the same components in the brand's own look.

Some Guidelines examples show real components (a button with a focus ring, a menu with spacing callouts, an input in two neutral palettes). Build those examples after the Parts they use exist, as the last step of the run, using real instances. Never draw a stand-in component to finish a foundation page early.

## Every value is bound

- Specimens, styles and components bind to variables wherever Figma allows it: fills, strokes, stroke widths, radius, padding, gaps, sizes, text style properties, effect colors.
- A raw value is allowed only on artwork that cannot be tokenized (icon glyph geometry, logo and asset colors on `1.8`).
- Every semantic variable has a description; that description is its Usage copy.

## Color is always visual

Anywhere a foundation page mentions a color (palette, gradient, effect color, icon color, asset surface), it shows a real swatch bound to its variable. A hex string is secondary metadata, never the specimen (Part B §5.1).

## QA for every foundation page

- The page has exactly the template frames listed above for it, in order, with the exact frame names.
- Every frame has `Doc/Header` and `Doc/Footer`.
- Overview sections follow the order in the page spec; Tokens groups follow the order in the page spec; Guidelines topics follow the order in the page spec.
- Every Guidelines topic with a required visual example has it, built from the generated system.
- No specimen, table or frame clips content.
- No name on the page comes from another design system or a reference file.
