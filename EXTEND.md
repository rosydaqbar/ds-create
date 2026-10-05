# Extend

Extend adds a component to a design system that has already been initiated. It is used for every new component at any level — Part, Component, Section, Layout or Screen — and for components a designer drew themselves and wants in the library. It follows the same steps every time, so an extended component looks and is documented exactly like the ones built at initiation.

Always load `README.md`, `SYSTEM.md`, `templates/structure.md` and the folder file of the target level (`parts/00-parts.md`, `components/00-components.md` or `sections/00-sections.md`) before extending.

# 1. When Extend runs

| Situation | What the agent starts from |
| --- | --- |
| The user asks for a component ("add a date picker", "we need a pricing table") | the request |
| The user draws a component in Figma and asks to add it to the library | the user's frame or component |
| A screen being designed needs something the library doesn't have | the local composition on that screen |
| The user selects a Component or Section listed in `SYSTEM.md` that was not built at initiation | its Markdown file in `components/` or `sections/` |
| The user asks for a page layout ("a settings page") | the request, treated as a Layout |

# 2. Reuse before creating

Before creating anything, go down this list and stop at the first step that does the job. Tell the user which step was chosen and why the earlier ones don't work.

1. **Use** an existing component as it is.
2. **Configure** an existing component through its properties.
3. **Add to** an existing component: a new property value or an optional part (for example a new `Type` on Badge).
4. **Compose** existing components on the screen without creating a new component.
5. **Create** a new component, lowest level first.

Raw colours, sizes or text styles are never an option at any step.

# 3. Pick the level

| Question | If yes |
| --- | --- |
| Does it arrange a whole screen into regions with placeholder content? | Layout (`5.x`) |
| Is it a Layout filled with real product content? | Screen (`6.x`) |
| Is it a larger region with its own layout and behaviour (an editor, a data table, a navigation sidebar)? | Section (`4.x`) |
| Is it a small group of existing Parts working as one unit with one job (a field, a group of buttons)? | Component (`3.x`) |
| Otherwise — a single control or display unit | Part (`2.x`) |

When two levels fit, ask the user once. A component never uses components from its own level or above (`SYSTEM.md` Part A §1); if it needs one, it belongs one level higher.

# 4. Steps

| # | Step | What happens | Ask the user |
| --- | --- | --- | --- |
| 1 | Brief | Write one sentence on what the component is for, then its content, states and the platforms it serves. For a user-drawn component, list every colour, size and text style it uses. | Only for missing essentials. |
| 2 | Check for overlap | Look for an existing component with the same job or the same parts. | When it's unclear whether to add to an existing component or create a new one. |
| 3 | Pick the level | §3. | When two levels fit. |
| 4 | Dependencies | List every lower-level component it needs. Missing ones are extended first, bottom-up. | Before adding new Parts. |
| 5 | Map values | Every value maps to an existing token or style. A value with no token is snapped to the nearest one, or proposed as a new token following `SYSTEM.md` Part C. | Yes, for any new token. |
| 6 | Place it | Create the page with the next free ID of its level (`2.20`, `3.9`, `4.3`, …) under the level separator, in ID order. | No. |
| 7 | Name it | Page `{ID} {Name}`, set `{Name}`, variants `Property=value` with the property vocabulary of `SYSTEM.md` Part C §4.2, private parts `.Main/{Component} {part}`, layers named as in the anatomy tree. A concept the vocabulary doesn't cover is added to Part C first. | No. |
| 8 | Write its file | Write `{level folder}/{ID}-{kebab-name}.md` with every section of `SYSTEM.md` Part B §12, including the Template frames section and, for Components and Sections, the Composition block. | No; the file is shown in the report. |
| 9 | Build | Build the page with `templates/structure.md`, with the frames of the component page template: `.Main` → `· Overview` → `· Component` → `· Anatomy` → `· Guidelines`, using the Doc kit components. | No. |
| 10 | Document | Fill every template frame: hero and 2–4 compositions in Overview, the full matrix in Component, the anatomy and token map in Anatomy, do / don't and accessibility in Guidelines. | Only copy that can't be inferred (usage rules, do / don't). |
| 11 | QA | Run the QA list in the new file and the completion criteria of the level's folder file. Fix and re-run. | Only for failures the agent can't fix. |
| 12 | Web | When the system has a web implementation (`WEB.md`): export new tokens (W2), then write the component and its doc module (W4) and run `WEB.md` §9. | No. |
| 13 | Report | List the page, the sets and variant counts, any new tokens, and offer to swap local copies on existing screens for the new component. | Before changing existing screens. |

# 5. A component the user designed

When the user draws a component and asks to add it:
- keep how it looks; rebuild its layers to match the anatomy tree in its new file, with Auto Layout and token bindings;
- replace every raw value with its token (step 5); show the user any value that moved by more than a few pixels or changed colour;
- rename properties and layers to the vocabulary in `SYSTEM.md` Part C;
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

Update the component's Markdown file in the same change, so the file and the Figma page always match. When the system has a web implementation, update the web component and its doc module in the same change too (`WEB.md` §8).
