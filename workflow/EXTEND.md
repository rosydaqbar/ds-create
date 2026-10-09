# Extend

Extend adds a component to a design system that has already been initiated. It is used for every new component at any level — Part, Component, Section, Layout or Screen — and for components a designer drew themselves and wants in the library. It follows the same steps every time, so an extended component looks and is documented exactly like the ones built at initiation.

Always load `README.md`, `specs/SYSTEM.md`, `workflow/GOTCHAS.md`, `workflow/templates/structure.md`, `input/{system-slug}/sources.md` (and any input file added since, `input/README.md` I5) and the folder file of the target level (`specs/parts/00-parts.md`, `specs/components/00-components.md`, `specs/sections/00-sections.md`, `specs/layouts/00-layouts.md` or `specs/screens/00-screens.md`) before extending.

Extend runs the same gates as initiation (`workflow/INITIATOR.md` Part B §6, *Gates*). The new page gets its own entries in the ledger's `sequence`, a library entry for its sets and a docs entry for its frames: at their ID positions in the library and documentation phases while the initial build is still open, or at the end once it is finished, library entry first. A missing dependency (step 4) gets its own entries, its library entry above the new page's library entry. The page starts only when every entry above it is done. Its file is written (step 8) and loaded before the page is built (step 9), and the page is done only when step 11 passes, with the loaded files and the audit result recorded in the ledger.

# 1. When Extend runs

| Situation | What the agent starts from |
| --- | --- |
| The user asks for a component ("add a date picker", "we need a pricing table") | the request |
| The user draws a component in Figma and asks to add it to the library | the user's frame or component |
| A screen being designed needs something the library doesn't have | the local composition on that screen |
| The user selects a Component or Section listed in `specs/SYSTEM.md` that was not built at initiation | its Markdown file in `specs/components/` or `specs/sections/` |
| The user asks for a page layout ("a settings page") | the request, treated as a Layout |

# 2. Reuse before creating

Before creating anything, go down this list and stop at the first step that does the job. Tell the user which step was chosen and why the earlier ones don't work.

1. **Use** an existing component as it is.
2. **Configure** an existing component through its properties.
3. **Add to** an existing component: a new property value or an optional part (for example a new `Type` on Badge).
4. **Compose** existing components on the screen without creating a new component.
5. **Create** a new component, lowest level first.

Raw colors, sizes or text styles are never an option at any step.

# 3. Pick the level

| Question | If yes |
| --- | --- |
| Does it arrange a whole screen into regions with placeholder content? | Layout (`5.x`) |
| Is it a Layout filled with real product content? | Screen (`6.x`) |
| Is it a larger region with its own layout and behavior (an editor, a data table, a navigation sidebar)? | Section (`4.x`) |
| Is it a small group of existing Parts working as one unit with one job (a field, a group of buttons)? | Component (`3.x`) |
| Otherwise — a single control or display unit | Part (`2.x`) |

When two levels fit, ask the user once. A component never uses components from its own level or above (`specs/SYSTEM.md` Part A §1); if it needs one, it belongs one level higher.

# 4. Steps

| # | Step | What happens | Ask the user |
| --- | --- | --- | --- |
| 1 | Brief | Write one sentence on what the component is for, then its content, states and the platforms it serves. For a user-drawn component, list every color, size and text style it uses. | Only for missing essentials. |
| 2 | Check for overlap | Look for an existing component with the same job or the same parts. | When it's unclear whether to add to an existing component or create a new one. |
| 3 | Pick the level | §3. | When two levels fit. |
| 4 | Dependencies | List every lower-level component it needs. Missing ones are extended first, bottom-up. | Before adding new Parts. |
| 5 | Map values | Every value maps to an existing token or style. A value with no token is snapped to the nearest one, or proposed as a new token following `specs/SYSTEM.md` Part C. | Yes, for any new token. |
| 6 | Place it | Create the page with the next free ID of its level (`2.20`, `3.9`, `4.3`, …) under the level separator, in ID order. | No. |
| 7 | Name it | Page `{ID} {Name}`, set `{Name}`, variants `Property=value` with the property vocabulary of `specs/SYSTEM.md` Part C §4.2, private parts `.Main/{Component} {part}`, layers named as in the anatomy tree. A concept the vocabulary doesn't cover is added to Part C first. | No. |
| 8 | Write its file | Write `{level folder}/{ID}-{kebab-name}.md` with every section of `workflow/DOCFRAMES.md` §13, including the Template frames section and, for Components and Sections, the Composition block. | No; the file is shown in the report. |
| 9 | Build | Build the page with `workflow/templates/structure.md`, with the frames of the level's page template (`specs/SYSTEM.md` Part A §A3): for Parts, Components and Sections `.Main` → `· Overview` → `· Component` → `· Anatomy` → `· Guidelines`; Layouts and Screens use their own templates. Use the Doc kit components. | No. |
| 10 | Document | Fill every template frame: hero and 2–4 compositions in Overview, the full matrix in Component, the anatomy and token map in Anatomy, do / don't and accessibility in Guidelines. | Only copy that can't be inferred (usage rules, do / don't). |
| 11 | QA | Run the QA list in the new file, the completion criteria of the level's folder file, and `kit/tools/figma-audit.js` on the page (`fail` must be 0) and on the file when tokens changed. Fix and re-run. | Only for failures the agent can't fix. |
| 12 | Web and app | Work in the system's existing build under `output/{system-slug}/` (README §5). When the system has code, the docs site always gets the page (`workflow/WEB.md`): export new tokens (W2, contrast gate included), write the doc module, plus the web component for Web products (W4), add it to `meta.tsx` and `changelog.ts` (W6), then run `npm run qa` and `workflow/WEB.md` §9. When the product includes App (`workflow/APP.md`): regenerate the React Native tokens (A2), write the React Native preview component and add the `app` block with its React Native, Swift and Kotlin code to the story (A3), then `workflow/APP.md` §9. | No. |
| 13 | Report | List the page, the sets and variant counts, any new tokens, and offer to swap local copies on existing screens for the new component. | Before changing existing screens. |

# 5. A component the user designed

When the user draws a component and asks to add it:
- keep how it looks; rebuild its layers to match the anatomy tree in its new file, with Auto Layout and token bindings;
- replace every raw value with its token (step 5); show the user any value that moved by more than a few pixels or changed color;
- rename properties and layers to the vocabulary in `specs/SYSTEM.md` Part C;
- fill the template frames as for any other component — a user-designed component is documented to the same depth.

# 6. Promote repeated compositions

A composition built on screens becomes a library component through Extend when:
- it appears on a second screen; or
- it appears three or more times on one screen; or
- the user asks.

The promoted component keeps its look. Its copies on screens are swapped for instances after the user confirms.

# 7. Changing an existing component

Changes to an existing component follow the same steps, starting from its Markdown file:
- an added property value or optional part keeps every existing instance working;
- removing or renaming a property, value or part can break instances in product files: list what changes and get the user's confirmation first;
- the page name and ID never change, even if the component is renamed.

Update the component's Markdown file in the same change, so the file and the Figma page always match. When the system has code, update the doc module in the same change too, plus the web component (Web products) and the React Native preview component with the story's `app` block and its code (App products) (`workflow/WEB.md` §8, `workflow/APP.md` §8).
