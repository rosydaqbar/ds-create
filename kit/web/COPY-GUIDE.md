# Docs voice and copy guide

How every word on the explorer reads: page summaries, guidelines, captions, anatomy, props and accessibility notes. Readers are designers, product managers and front-end developers. Write like a thoughtful senior designer explaining the system to a colleague: clear, warm, confident, never cute.

Use this guide when you write a page (workflow/WEB.md W4–W6), and as the checklist for a copy pass over an existing build. A wording-only pass preserves layout and behavior. A guideline-writing pass may reorganize topics and presentation with the copy file and manifest together; preserve values, component behavior, APIs, reference tables and old deep links.

## What makes docs copy sound robotic (avoid all of these)

1. **Inventories instead of purpose.** "Five sizes, three emphasis levels, brand and danger tones, six states, with optional leading and trailing icons…" lists the parts list. Lead with what the thing is for and when you'd reach for it; the variants can follow briefly, or be left to the Component tab that already shows them.
2. **Note-taking fragments.** "Leading, text, shortcut and chevron in one row." "Single line, hugs its text." Write full sentences with articles and verbs. Short fragments are fine only as labels, captions under a visual, or table cells.
3. **Token names and Figma build terms in running prose.** "The panel opens space/xs under the trigger", "(space/xxs × space/sm)", "hugs", "Auto Layout fill", "State=disabled", "Show leading icon", ".Main". In prose, say what it means in plain words ("a small gap below the trigger"). Keep a token name only when the sentence's point is *which token to use* — then write it once, as-is (no prose around it pretending it's English). Anatomy `tokens: [...]` arrays, token tables, code, matrix titles like `Tone=brand · Emphasis=primary` and the Figma column of props tables stay untouched; they are reference data.
4. **Disconnected or overloaded sentences.** Keep related clauses together when they explain one relationship. Split when the subject or decision changes; do not impose a clause count or turn a connected explanation into short fragments.
5. **Lecturing absolutes.** Stacks of "never", "always", "must", "do not". Keep a firm rule where it really is a rule (accessibility, destructive actions), and say *why* in the same breath. Elsewhere use "use", "prefer", "avoid", "keep".
6. **Heading or introduction repeated without new information.** A direct definition is useful when needed. The following explanation must add a specification, relationship or decision rather than paraphrasing it.
7. **Unclear responsibilities.** Identify what changes and which element or reader owns that change. Prefer active voice, but do not rewrite a precise technical construction merely to vary its words.
8. **Capitalised component names as proper nouns everywhere.** In general prose, components are ordinary words: "a tooltip", "the menu", "a button". Capitalise and add the page number only when you point the reader to that page: "use a Link (2.3)", "see 1.6 Motion".
9. **Unexplained technical distinctions.** Explain technical terms when the audience needs them. Keep precise names such as accessible name, aria-busy or DOM where they clarify a decision; their relevance determines placement, not a fixed section restriction.
10. **An investigation presented as a guideline.** “The supplied source does not establish…”, “an illustrative scenario, not a shipped feature”, chat corrections and certification disclaimers describe the author's review. Keep them in the plan/report. State a consequential limit directly when readers need it, such as the supported mode or the responsibility for validation.
11. **Maintenance in place of design guidance.** A designer choosing a treatment needs its meaning, conditions and consequences. Source replacement, export, rebuild and deployment procedures answer a contributor's task; keep those in the appropriate implementation/contributor reference. Do not remove relevant keyboard, accessibility or token guidance merely because it is technical.

## Voice

- **Direct guidance.** Talk to the reader when it makes the action clear: "Use a switch when the change applies straight away." Not "Switches are used for…".
- **Plan before prose.** Follow workflow/EDITORIAL.md. Start with the most useful subject-specific relationship or decision; do not force purpose → mechanism → benefit into every paragraph.
- **Plain, specific verbs.** Pick, show, open, close, add, remove, group, separate, warn, confirm.
- **Contractions are fine** (it's, don't, you'll). They make guidance sound human.
- **Complete paragraphs.** Develop one meaningful relationship or decision. Split when the subject changes, not at a word count; keep the explanation needed to act on the rule.
- **Calm and confident.** No hype ("seamless", "powerful", "effortless", "delightful"), no filler ("simply", "just", "easily", "basically", "In order to", "It is important to note that"), no emoji, no exclamation marks.
- **Concrete examples beat abstractions.** "Save changes", "Delete project", "3 new messages".
- **Sentence case** for every heading, title, label and button.
- **US English**: color, gray, center/centered, organize, license, behavior, favorite. (Change "colour", "centred", "grey", "licence", "behaviour" etc. in prose. Never touch token names, class names or code.)
- **No em-dash spam.** Use punctuation to clarify the relationship; avoid repeated ornamental asides.

## Per text type

| Where | How it should read |
|---|---|
| Page/component `summary` (page header) | A concise definition of scope and function. The full page covers choices, structure, verified specifications, relevant behavior and validation; the header does not carry the entire guideline. Example: Button → "Buttons start actions: saving a form, creating a project, confirming a delete. Pick the emphasis by how important the action is on the screen." |
| Example `title` | Short noun phrase, sentence case ("Dialog footer"). Usually fine as is. |
| Example `caption` | Explain the decision or distinction actually demonstrated. Length follows the example; do not repeat the overview or claim behavior a static specimen cannot establish. |
| `whenToUse.use / dont` | Start with the situation, then (for don'ts) the alternative: "Moving to another page? Use a Link (2.3) instead." or "For navigation to another page, use a Link (2.3)." Keep them short and parallel. |
| Guideline `title` | A plain statement or topic, sentence case: "Make buttons look clickable", "Use one primary action". Avoid robotic labels like "Emphasis" when a short clear phrase helps; one-word titles are fine when they're the natural topic name (e.g. "Accessibility", "Content"). |
| Guideline `body` | A distinct reader decision, supported relationship, constraint or example. Length follows the information; do not repeat the overview or turn authoring instructions into prose. |
| Do / Don't captions | Short, parallel, concrete: Do "One primary action, backed by secondary and tertiary." Don't "Three primary buttons fight for attention." |
| Anatomy part `description` | Explain what the part owns, how it relates to adjacent parts and any relevant conditions. Keep exhaustive numbers/tokens in the reference; name an exact token in prose when choosing it is the decision. "The clickable container. Its height is set by the size." |
| Props `description` (Anatomy tab) | Developer-facing, so technical terms are OK, but write complete, crisp phrases: "The visible label. When `iconOnly` is set, it becomes the button's accessible name." Keep prop names, types and defaults exactly. |
| Accessibility bullets | Concrete behavior: what a keyboard or screen-reader user experiences, then what the component does. Technical attributes may appear in backticks. |
| Section intros on foundation/guidance pages | Add a distinct relationship or decision. Omit an intro if the heading and reference already explain it. Never add “How [subject] works” to repeat the header. |
| Empty states, hints, helper text | Explain what to do next. |

## Terminology (use one term, everywhere)

- **Figma file** / **Figma library** (not "the file", "the kit"). **Variables** and **styles** (Figma) vs exported **tokens** (code). Show the actual mapping for the supported platform.
- Capitalise declared mode names, such as **Light**, **Dark**, **Standard** and **Reduced**. Mention only modes supported by the current source.
- **Stable / Beta** status (capitalised as labels).
- **Props** (code) vs **properties** (Figma). "The property table maps Figma properties to code props."
- **Component page tabs**: Overview, Component, Anatomy, Guidelines, Code.
- Capitalise the project’s declared level names, including Foundations, Parts, Components, Sections, Layouts and Screens when present. The editorial standard also applies to new categories.
- "Sign in" (not log in / login as a verb).
- Prefer "people" or "users" for the end user of the product; "you" for the reader (designer/developer).

## Before → after (real examples from the site)

- Summary (2.1 Button)
  - Before: "Actions users can take. Five sizes, three emphasis levels, brand and danger tones, six states, with optional leading and trailing icons and an icon-only square form. Label width hugs its content; height is fixed per size."
  - After: "Buttons start actions, like saving a form, creating a project or confirming a delete. Choose the emphasis by how important the action is on the screen, and the size by the space around it."
- Summary (3.5 Select)
  - Before: "Pick one value from a list that may be long. The field opens a list directly under the trigger; options can show an icon, avatar or status dot, and the list scrolls when it is long. Multi-select picks several values: …"
  - After: "Select lets people pick one option from a list that's too long to show at once. Multi-select lets them pick several, shown as removable tags, with search to find options quickly."
- Guideline body (3.6 Menu)
  - Before: "The panel opens space/xs under the trigger and aligns to its edge — start for buttons, end for icon triggers."
  - After: "The menu opens just below its trigger and lines up with it: with the start edge for a text button, and with the end edge for an icon button, so it never covers what opened it."
- Anatomy (2.1 Button, Label)
  - Before: "Single line, hugs its text. type/body/sm/semibold (xs–md) or type/body/md/semibold (lg–xl)."
  - After: "One line of text that sets the button's width. Larger sizes use a larger text style."
- Space intro
  - Before: "One bar per space token. Base unit 4: every step is a whole or half multiple of it. Small steps sit close together for tight UI; large steps jump further apart for page sections."
  - After: "Every step is a multiple of the 4px base unit. Small steps keep related things close inside a control; larger steps separate sections of a page." (keep any `${…}` template values that are computed from tokens)

## Hard rules (don't break the build or the facts)

- For a wording-only pass, change displayed string content: JSX text, string literals that are displayed (summary, caption, title, body, description, use/dont, accessibility, labels shown on the page, intro/note props, alt text, aria-labels **only if** they're robotic and the change keeps them accurate).
- **Preserve contracts and verified reference data**: code samples (`code:` strings and `CodeBlock code={…}`), prop names/types/defaults in props tables, token names inside `tokens: [...]` arrays and token tables, `target:` values, ids, keys, slugs, class names, imports, component props passed to components, numbers and ratios, sample data inside live examples (names like "Olivia Rhye", "Save changes" button labels inside rendered components), matrix titles/axis names (`Tone=brand · Emphasis=primary`, `rows`, `columns`), and the Figma property names in `figma:` fields.
- A writer improvement may change copy readers, imports and topic organization where needed to make authored content reach the existing outputs. Correct a misleading code example when actual source establishes the correction; preserve the supported API and record the evidence. These changes need compatibility tests.
- **Guideline and section titles become anchor ids** (slugified for deep links and "On this page"). Changing them is fine; just keep each title unique within its page.
- Verify facts against source: contrast ratios, counts, sizes, durations, version numbers and alternatives. Preserve the source values; correct a prose mismatch with its evidence recorded.
- Keep `${…}` template expressions intact — they insert live token values.
- Keep apostrophes valid in TS strings: if a single-quoted string gains an apostrophe, use the typographic ’ (U+2019) or switch the literal to double quotes / a template literal. Prefer ’ in displayed prose (the site already uses it).
- Let depth follow complexity and evidence. Improve organization rather than padding or compressing; check actual wrapping at narrow widths.
- After editing, run the project’s typecheck and build scripts, then inspect the affected pages. Check regenerated outputs for token changes; a successful web build does not establish native parity or accessibility conformance.


## Evidence and decision quality

Before publishing a page, verify every count, token name, prop mapping and platform claim against the current source. A copy edit can correct a documented fact when that source establishes the correction; it must not silently change a design value or invent a product rule.

- Give the reader a condition, a decision and a reason or example. Add a boundary where the choice has an exception. Do not force all four into every sentence.
- Describe the current implementation separately from a conceptual model or a future plan. Three possible token layers do not mean three layers are implemented.
- Show mappings explicitly. Figma properties and code props can have different names; slash-separated token names can map to CSS or native identifiers.
- Shared names and exported tokens do not guarantee automatic sync or identical native behavior. Explain actual regeneration steps in the relevant implementation/contributor guide. Record platform-test limitations in internal review; include a supported-platform boundary in published guidance when it affects the reader's task.
- Status labels describe documented maturity. Do not equate Stable with WCAG conformance, production approval or verified platform parity.
- Keep measured contrast ratios and their applicable text sizes. Design approval does not make a failing pair conformant. A second status cue does not fix low-contrast text.
- Distinguish an estimate from a guaranteed outcome, and a transaction record from proof of a completed transfer. Use the actual product states.
- Keep generator history, duplicate inventories and maintainer notes out of purpose summaries. Preserve that information in specs or known-issue records.
- Keep useful technical fragments in tables. Do not rewrite good switch/checkbox, schedule or exact-value guidance just to make every paragraph sound different.
- Consolidating topics is a structural change: preserve previous heading IDs or redirect their deep links, and check the resulting table of contents.

### Terms with distinct meanings

| Term | Meaning in these docs |
|---|---|
| Token | A named reusable design decision or value in the exported reference. |
| Figma variable | A named value that can be bound to supported Figma properties and may have modes. |
| Figma style | Shared typography or effects; not all styles are variables. |
| Property / prop | Figma component property / code API prop. Use the mapping table rather than promising identical spelling. |
| Theme / on-color surface | A supported color mode / a component appearance on a particular surface. A light calendar appearance does not establish app Dark mode support. |
| Preview / platform verification | A rendered reference / evidence from the target platform. Keep those claims separate. |
| Estimate / receipt status | A modeled result / the recorded transaction state, which may be pending or failed. |

### Before → after: decisions and claims

- Tokens: “A design and its build always match.” → “Use Reference to find the exported value and its code name. Regenerate token data after an approved Figma change.”
- Mapping: “What you set in the property panel is what they type.” → “Show trailing icon maps to trailingIcon; check the property table for each component.”
- Inventory: “Four tasks and Semua Menu.” → “Four items, including Semua Menu.” Verify the count against the actual example first.
- Motion: “Motion never delays anyone.” → “Show feedback when an action starts. Avoid blocking the next action with a decorative transition.”
- Receipt: “Ready to share as proof.” → “A shareable record of the transaction and its status. Pending and failed records do not confirm a completed transfer.”

Use these as evidence patterns, not reusable product policy. Check the generated site's own names, modes, states and workflow before adapting them.

## Editorial progression

Apply the same quality objectives to every subject and every prose-bearing slot. Start by identifying the actual information, reader decisions and available evidence. Explain responsibilities, relationships and constraints, then choose a reading sequence in which each section adds information. A reference table and its surrounding prose should do different jobs: the table supplies the specifications, while prose explains a choice or consequence when it is useful.

Neither the documentation category nor the teaching examples determine the outline. Topics absent from examples receive the same review. Do not infer behavior from a category name or from another component. Use only supported facts, identify consequential unknowns, and label recommendations as guidance.

Review accuracy, completeness, specificity, usefulness, clarity, naturalness, organization and appropriate depth. Remove claims such as “carries the brand”, “sets the visual rhythm” or “enhances usability” when they replace an actual fact. Avoid mini-slogans and repeated sentence constructions. Every paragraph must add a fact, distinction, decision, example, constraint or implementation detail. Improve the explanation rather than swapping vocabulary or padding it.

Read the final page as its intended audience would, without the author's source notes. It should explain the system rather than narrate how it was inspected. Keep missing evidence and verification results in the existing plan/report, and state supported behavior directly. Use examples naturally to clarify choices without claiming a product screen exists or adding a disclaimer after every scenario. Review surrounding prose against live references: a table supplies the facts; prose should explain a relationship or choice rather than restating the inventory.
