# Docs-site agent brief

Give this file to every agent that builds docs-site pages (`INITIATOR.md` Part B §6, step 19), together with the list of pages it owns. It holds what a page agent needs from `workflow/WEB.md`, `workflow/APP.md` and `web/COPY-GUIDE.md`. When a case isn't covered here, open the section it links to. Fill the `{…}` values before handing it over.

## The build

- System: `{system name}`, slug `{slug}`, product type `{web | app | both}`, color modes `{Light[, Dark]}`.
- Docs project: `output/{slug}/web/`. App previews: `output/{slug}/web/react-native/`.
- Read `GOTCHAS.md` §4 (Docs site) before writing a page; every rule there applies to page agents too.
- Inputs: `input/{slug}/sources.md` points to the brief and brand files (product facts, tone of voice). They are read-only, and private links in them are never published (`input/README.md` I6).
- Ledger: `output/{slug}/ds-create-ledger.json`. Use `sequence[]` (match on `page`) for frame ids and notes, and `reports/build-notes.md` for longer notes.
- Page specs: the repo's `{level}/{id}-{name}.md`, or `output/{slug}/specs/…` for pages added with `workflow/EXTEND.md`.
- Figma data: `output/{slug}/figma/sets/{set-id}.json` (`:` written as `-`), one snapshot per published set, written by `tools/figma-export-sets.js` during the Figma build. Read the snapshot, not Figma. Open Figma only for a screenshot or a value the snapshot doesn't hold, and then read-only.

## Hard rules

- **Figma is read-only** for docs agents. Never create, rename, move or delete anything, and never write plugin data. Never open pages the ledger lists as excluded, and never loop over all pages.
- **Nothing native is installed or built** (no Xcode, Android SDK, simulators, CocoaPods, Gradle or app projects). Swift and Kotlin exist only as code strings in stories (`workflow/APP.md` §1).
- **Shared folder.** Other agents work in the same project, so don't run `npm install`, `npm run build`, `dev` or `qa`, and don't write `dist/` or generated token files. You may run `npx tsc --noEmit -p tsconfig.json` and `node --check`. For a render check, bundle into the scratchpad, never into the project.
- **Values are frozen to Figma.** When a raw value equals a token, use the token. When no token has that value, use a named constant commented `// raw in Figma (no token)`. Never invent a token or round a value. For a color bound to a non-local variable, use the local role only if its hex matches; otherwise use a raw constant.
- **App products show no web code.** No Tailwind classes, CSS names, web package or `npm install` text where a reader can see it. The site's own layout wrappers may use utility classes.
- **Brand exceptions** (a frozen value a checker flags) are recorded in the build's own config and in the ledger, never in the ds-create repo.

## File ownership (parallel work)

Each agent writes only:
- its own component files;
- its own level barrel (e.g. `components/group-a.ts`) and its own `src/docs/app/app-{level}-{group}.d.ts`;
- its own stories.

Shared files (`parts/_shared.tsx`, `icons/`, `theme/`, `tokens/`, blocks, `meta.tsx`) are read-only for page agents. Report a needed change instead of making it. When a page nests a component another agent is still building, build your other pages first. Then check that agent's barrel, and use a local stand-in only as a last resort, listed in your report.

## What a page needs

Contract: `workflow/WEB.md` §6–§7, `workflow/APP.md` §6–§7.

1. **Component.** One file per published set (`{level}/{Name}.tsx`) that matches every variant.
   - Props are the Figma properties in camelCase. `State` is not a prop: it comes from the platform. `disabled` is a prop, and `previewState` pins a state for matrices.
   - Tag parts with `anatomy('Layer name')`.
   - Touch targets are at least 44 pt (use `hitSlop`). Text scales with the system size. Motion comes from `theme.motion`, with Reduced respected.
2. **Accessibility** (react-native-web ignores `accessibilityState` and `accessibilityValue`):
   - Pass `aria-checked`, `aria-selected`, `aria-expanded`, `aria-disabled` and `aria-value*` alongside the RN props, with explicit values, never `undefined`.
   - Headers use `useHeading()` (level 3 for screen and section titles, deeper below a titled screen). A `header` role alone renders as `<h1>`.
   - One focus stop per control: an inner radio, checkbox or field inside a pressable row is decorative (`DecorativeControl`). Nothing focusable sits inside a button.
   - A `list` role holds only list items, and a `tab` sits inside a `tablist`. Landmarks are allowed only on full-screen layouts, each with a unique name.
   - A loading skeleton is a busy progress bar with a name.
3. **Types.** One line per component in the level's `app-*.d.ts`.
4. **Story** `src/docs/stories/{id}-{slug}.doc.tsx` (`defineDoc`, see `src/docs/types.ts`):
   - fields: `summary`, `whenToUse`, `anatomy.parts` (target = the `anatomy()` name), `props` (with `figma` filled), `tokens` (bound tokens only), `guidelines` (the Figma Guidelines topics, in order) and `accessibility`;
   - App products: `app.hero`, `app.examples` (each with `code: { reactNative, swift, kotlin }`, copy-ready, tokens only), `app.matrices` (every variant), `app.anatomy`, `app.visuals` (keyed by guideline title) and `app.notes`. The web fields stay empty (`hero: () => null`, `examples: []`, `matrices: []`).
5. **Copy.** Follow `web/COPY-GUIDE.md`.
   - Every sentence goes into the page's copy file, `output/{system-slug}/copy/{id}-{kebab name}.md`, as a `web` line, or as a `both` line when Figma says the same (`workflow/COPY.md`). Keep the Figma lines of the same topic next to it, with the same meaning.
   - Give the reason and its consequence, name the alternative to use, and take the example from the brand's real screens. No inventories, teaser counts or token names in running prose.
   - US English and sentence case. Product copy inside examples may be in the brand's language.
   - Write with the Impeccable skill loaded, and fix every design hook finding.

## Report back

Keep it concise:
- the files written;
- the components on each page;
- every difference from Figma, and anything not done;
- each raw value kept as a constant;
- stand-ins used;
- changes needed in files you don't own.
