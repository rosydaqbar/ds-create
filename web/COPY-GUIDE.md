# Docs voice and copy guide

How every word on the explorer reads: page summaries, guidelines, captions, anatomy, props and accessibility notes. Readers are designers, product managers and front-end developers. Write like a thoughtful senior designer explaining the system to a colleague: clear, warm, confident, never cute.

Use this guide when you write a page (WEB.md W4–W6), and as the checklist for a copy pass over an existing build. A copy pass changes only words: layout, components, props, tokens, class names, code samples, data and behavior stay exactly as they are.

## What makes docs copy sound robotic (avoid all of these)

1. **Inventories instead of purpose.** "Five sizes, three emphasis levels, brand and danger tones, six states, with optional leading and trailing icons…" lists the parts list. Lead with what the thing is for and when you'd reach for it; the variants can follow briefly, or be left to the Component tab that already shows them.
2. **Note-taking fragments.** "Leading, text, shortcut and chevron in one row." "Single line, hugs its text." Write full sentences with articles and verbs. Short fragments are fine only as labels, captions under a visual, or table cells.
3. **Token names and Figma build terms in running prose.** "The panel opens space/xs under the trigger", "(space/xxs × space/sm)", "hugs", "Auto Layout fill", "State=disabled", "Show leading icon", ".Main". In prose, say what it means in plain words ("a small gap below the trigger"). Keep a token name only when the sentence's point is *which token to use* — then write it once, as-is (no prose around it pretending it's English). Anatomy `tokens: [...]` arrays, token tables, code, matrix titles like `Tone=brand · Emphasis=primary` and the Figma column of props tables stay untouched; they are reference data.
4. **Semicolon chains.** "The field opens a list directly under the trigger; options can show an icon, avatar or status dot, and the list scrolls when it is long." Split into sentences. One idea per sentence; two at most.
5. **Lecturing absolutes.** Stacks of "never", "always", "must", "do not". Keep a firm rule where it really is a rule (accessibility, destructive actions), and say *why* in the same breath. Elsewhere use "use", "prefer", "avoid", "keep".
6. **Heading restated as the intro.** If the heading says "Space scale", the intro must not start with "The space scale is…". Start with the useful part.
7. **Passive and subject-less sentences.** "Placement only changes where the arrow sits." → "Changing the placement only moves the arrow." Prefer active voice with a clear subject: the component, the reader ("you"), or the person using the product.
8. **Capitalised component names as proper nouns everywhere.** In general prose, components are ordinary words: "a tooltip", "the menu", "a button". Capitalise and add the page number only when you point the reader to that page: "use a Link (2.3)", "see 1.6 Motion".
9. **Jargon for non-developers.** In designer/PM-facing text, explain or avoid: "accessible name" → "the name screen readers announce"; "aria-busy" belongs only in the Accessibility list and the Code tab; "mounted", "DOM", "node" → plain words.

## Voice

- **Second person.** Talk to the reader: "Use a switch when the change applies straight away." Not "Switches are used for…".
- **Purpose first, then the how, then the exception.**
- **Plain, specific verbs.** Pick, show, open, close, add, remove, group, separate, warn, confirm.
- **Contractions are fine** (it's, don't, you'll). They make guidance sound human.
- **Short paragraphs.** 1–3 sentences. A body over ~60 words is probably two ideas: split it or cut it.
- **Calm and confident.** No hype ("seamless", "powerful", "effortless", "delightful"), no filler ("simply", "just", "easily", "basically", "In order to", "It is important to note that"), no emoji, no exclamation marks.
- **Concrete examples beat abstractions.** "Save changes", "Delete project", "3 new messages".
- **Sentence case** for every heading, title, label and button.
- **US English**: color, gray, center/centered, organize, license, behavior, favorite. (Change "colour", "centred", "grey", "licence", "behaviour" etc. in prose. Never touch token names, class names or code.)
- **No em-dash spam.** One em dash in a paragraph at most; prefer a full stop or a comma.

## Per text type

| Where | How it should read |
|---|---|
| Page/component `summary` (page header) | 1–2 sentences, max ~40 words. What it is and what it's for. Example: Button → "Buttons start actions: saving a form, creating a project, confirming a delete. Pick the emphasis by how important the action is on the screen." |
| Example `title` | Short noun phrase, sentence case ("Dialog footer"). Usually fine as is. |
| Example `caption` | One full sentence that says *why* this example is right. "Use one primary action per view, and let the secondary action support it." |
| `whenToUse.use / dont` | Start with the situation, then (for don'ts) the alternative: "Moving to another page? Use a Link (2.3) instead." or "For navigation to another page, use a Link (2.3)." Keep them short and parallel. |
| Guideline `title` | A plain statement or topic, sentence case: "Make buttons look clickable", "Use one primary action". Avoid robotic labels like "Emphasis" when a short clear phrase helps; one-word titles are fine when they're the natural topic name (e.g. "Accessibility", "Content"). |
| Guideline `body` | Why it matters, then what to do. 1–3 short paragraphs. |
| Do / Don't captions | Short, parallel, concrete: Do "One primary action, backed by secondary and tertiary." Don't "Three primary buttons fight for attention." |
| Anatomy part `description` | One or two plain sentences about what the part does and when it appears. Move numbers/tokens out of the sentence (the `tokens` array already lists them). "The clickable container. Its height is set by the size." |
| Props `description` (Anatomy tab) | Developer-facing, so technical terms are OK, but write complete, crisp phrases: "The visible label. When `iconOnly` is set, it becomes the button's accessible name." Keep prop names, types and defaults exactly. |
| Accessibility bullets | Concrete behavior: what a keyboard or screen-reader user experiences, then what the component does. Technical attributes may appear in backticks. |
| Section intros on foundation/guidance pages | Tell the reader what they'll learn or decide here, in one or two sentences. |
| Empty states, hints, helper text | Explain what to do next. |

## Terminology (use one term, everywhere)

- **Figma file** / **Figma library** (not "the file", "the kit"). **Variables** (Figma) and **tokens** (code): "Figma variables become CSS variables and Tailwind classes."
- **Light and Dark** (capitalised as mode names). **Standard and Reduced** motion.
- **Stable / Beta** status (capitalised as labels).
- **Props** (code) vs **properties** (Figma). "Props match the Figma properties."
- **Component page tabs**: Overview, Component, Anatomy, Guidelines, Code.
- Levels: **Foundations, Parts, Components, Sections** (capitalised as level names).
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

- Change only string content: JSX text, string literals that are displayed (summary, caption, title, body, description, use/dont, accessibility, labels shown on the page, intro/note props, alt text, aria-labels **only if** they're robotic and the change keeps them accurate).
- **Do not change**: code samples (`code:` strings and `CodeBlock code={…}`), prop names/types/defaults in props tables, token names inside `tokens: [...]` arrays and token tables, `target:` values, ids, keys, slugs, class names, imports, component props passed to components, numbers and ratios, sample data inside live examples (names like "Olivia Rhye", "Save changes" button labels inside rendered components), matrix titles/axis names (`Tone=brand · Emphasis=primary`, `rows`, `columns`), and the Figma property names in `figma:` fields.
- **Guideline and section titles become anchor ids** (slugified for deep links and "On this page"). Changing them is fine; just keep each title unique within its page.
- Keep facts exactly: contrast ratios, counts, sizes, durations, version numbers, which component to use instead.
- Keep `${…}` template expressions intact — they insert live token values.
- Keep apostrophes valid in TS strings: if a single-quoted string gains an apostrophe, use the typographic ’ (U+2019) or switch the literal to double quotes / a template literal. Prefer ’ in displayed prose (the site already uses it).
- Don't make text much longer. Rewrites should be the same length or shorter on average; long paragraphs can wrap badly on phones.
- After editing, run `npx tsc -p tsconfig.json --noEmit` from the web project root and fix any error.
