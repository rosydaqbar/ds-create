# Screens

Screens are Layouts filled with the real content of one product view: the account settings page, the sign-in flow, the project list. They show what people actually see, with real copy and realistic data, in every state the view can be in: with content, empty, loading and failed. Screens are where the library is proven: if a view can't be built from the Layouts, Sections, Components and Parts in the file, the gap is found here and closed through `workflow/EXTEND.md`.

Each Screen page holds the screen itself, ready to prototype and hand off, plus the documentation that explains its content, states and flow.

Screens are never built during Initiate. They are added only through `workflow/EXTEND.md`, when the user asks for a product view or a flow.

# 1. Screen pages

```text
── 6 · Screens ──
(no pages in the base tree; each Screen is added through workflow/EXTEND.md)
```

| Page | File |
| --- | --- |
| `6.1 {Name}`, `6.2 {Name}`, … | `specs/screens/6.x-{kebab-name}.md`, written by `workflow/EXTEND.md` step 8 |

- New Screens take the next free ID (`6.1`, `6.2`, …). IDs are never reused or renumbered.
- The `── 6 · Screens ──` separator exists only once the first Screen page exists (`specs/SYSTEM.md` Part A §1).
- A Screen is named after the **product view**, in the product's words: "Account settings", "Sign in", "Project list".
- One page holds one view, or one short flow of views that share a Layout and a task (sign in → verify → done). A flow longer than five views is split into pages.

## Screen, Layout or Section

| Question | Level |
| --- | --- |
| Is it the real content of one product view, built on a Layout? | Screen (`6.x`) |
| Is it only the arrangement of regions, with placeholder content? | Layout (`5.x`) |
| Is it one region with its own behavior that other screens could reuse? | Section (`4.x`) |

This is the same test as `workflow/EXTEND.md` §3. When two levels fit, ask the user once.

# 2. What a Screen may contain

- **Exactly one Layout (`5.x`) instance per screen frame**, never detached. When no Layout fits, one is added through `workflow/EXTEND.md` first.
- Sections (`4.x`), Components (`3.x`) and Parts (`2.x`) as **instances**, in the Layout's regions.
- Foundations: tokens, text styles, effect styles, icons, brand assets and approved imagery.
- Its own private parts (`.Main/{Screen} {region}`): the content of one region, built once and reused across the screen's breakpoints, states and modes.

A Screen is never instanced by anything, never published, and never contains another Screen.

Raw values are never used. Instances change only through their properties, text and instance swaps; their colors, sizes and effects are never overridden. Spacing inside region content is Auto Layout bound to `space/*`; everything else comes from the Layout and the components.

# 3. Page template

Every Screen page is built with `workflow/templates/structure.md`, left to right:

```text
{ID} {Name}
├─ .Main                                       region content as private parts, with their own header
├─ {ID} {Name} · Overview                       purpose, hero, flow, states index
├─ {ID} {Name} · {Data} · {Breakpoint}          one bare frame per screen state, in the order of §4.3
├─ …
├─ {ID} {Name} · Anatomy                        Composition block, region content map, content rules, headings, focus order
└─ {ID} {Name} · Guidelines                     content, flow, states, edge cases, accessibility, do / don't, maintenance
```

- `.Main`, `· Overview`, `· Anatomy` and `· Guidelines` are **documented frames** (header, blocks, footer). The breadcrumb is `Screens › {ID} {Name}`.
- Each screen state is a **bare frame**: only the screen, at its breakpoint's drawing width (`specs/layouts/00-layouts.md` §4.1), height hugging the content with a minimum of one viewport.

Why the screens are bare frames rather than items inside one documented frame: a screen is the deliverable itself. Top-level frames are what Figma prototypes, presents, exports and marks ready for development; nested inside a documented frame they lose all four. Their captions live in the Overview states index, so nothing is undocumented.

Why `.Main` is always there: the same content appears in several frames (desktop and mobile, Light and Dark, the Anatomy copy). Built once as a private part and placed in the Layout's `{Region} content`, one edit updates every frame and the frames can't drift apart.

**.Main**
- private header (`specs/parts/00-parts.md` §5);
- one `.Main/{Screen} {region}` per region the screen fills (`.Main/{Screen} main content`), with variants `Breakpoint` and `Data` only where its content differs, each with a one-line purpose.

**· Overview**
- `Doc/Header` with one sentence on the task this screen serves and who does it;
- **Hero**: the default state at the main breakpoint, built from the same Layout instance and `.Main` parts, scaled to fit the frame;
- **Purpose**: the task, how people get here, and what done looks like;
- **Flow**: for a flow, the views in order as labeled boxes with arrows, each arrow naming what moves people on ("Continue", "Wrong code");
- **States index**: a table of every screen frame on the page: frame name → `Data` → when it shows → what people can do next;
- **Built on**: the Layout's page ID and the variant and `Show {region}` settings used.

**· Anatomy** (blocks in this order)
1. Composition: the Layout instance, then every Section, Component and Part the screen uses, each labeled with its page ID and the properties the screen sets.
2. Region content map: the default state at the main breakpoint with a `Doc/Callout` per region and per main component, and a legend: region → component → properties.
3. Content rules: the same screen with every text element annotated with its rule (what it says, where the value comes from, length limit, what happens when it's too long).
4. Headings: the heading outline (H1 → H2 → H3) drawn next to the screen.
5. Focus order: numbered `Doc/Callout` markers in tab order, from the skip link to the last element.
6. State triggers: what moves the screen from one `Data` state to another, and what the screen announces when it does.

**· Guidelines**: a reading-oriented frame (`workflow/DOCFRAMES.md` §7) with the topics in the Screen's file, each with its visual built from the screen's own instances, and `Doc/Do-dont` under each pair.

Every documented frame ends with `Doc/Footer`.

# 4. Rules for every Screen

## 4.1 Real content

- **Real copy, never filler.** Headings, labels, buttons, messages and data are what the product would show. Never lorem ipsum, "Item 1, Item 2", "Title goes here" or "Text".
- **Follow the guidance that exists.** Copy follows the brand's tone of voice (`workflow/QUESTIONNAIRE.md` §2) and the Content topic of every component it uses (button labels from 2.1, field labels and hints from 3.2). Sentence case, in the product's language.
- **Realistic data.** Names, dates, amounts and counts are plausible for the product and vary in length. Include at least one long value (a long name, a large number) so wrapping and truncation are shown. People in examples are fictional; never use real personal data.
- **Ask, don't invent.** Content the agent can't infer from the product brief (prices, plan names, legal text, policy rules) is asked for (`workflow/EXTEND.md` step 1).
- **Images** come from `1.8 Brand assets` or the product's approved imagery. Where none exist, use the Avatar (2.6) placeholder and neutral image fills, never stock photos from other brands.

## 4.2 States

Every screen that loads, saves or shows data has these states, set by `Data`:

| `Data` | What it shows | Must include |
| --- | --- | --- |
| `default` | the view with typical content | real copy and data, including one long value |
| `empty` | no content yet, or no results | a heading that says what's missing, one line on why, and the action that fixes it (Featured icon (2.19) above the heading where the file says so) |
| `loading` | content on its way | Spinner (2.15) or Progress (2.14) where the content will appear, with short loading text ("Loading invoices…"); the Layout and chrome stay in place |
| `error` | the content couldn't load or save | what happened in plain words, what to do next, and a way to retry or go back; field errors use `Status=invalid` on the field |

- A state that can't happen on this screen is skipped, and the Screen's file says why ("static page, no data").
- First-use empty and no-results empty are different states when they say different things; the file names both (`empty` and a second view).
- Edge cases (one item, many items, no permission, offline, partial data) are shown in Guidelines or as extra views when the file lists them.

## 4.3 Breakpoints, modes and frame order

- `default` has one frame per breakpoint in the Layout. `empty`, `loading` and `error` have a frame at the main breakpoint, plus `mobile` when their arrangement changes there.
- When the system has a Dark mode, `default` at the main breakpoint also has a Dark frame: a copy with the Color collection set to Dark on the frame, never a separate design. Any state whose meaning relies on color (`error`) gets one too. Extra modes (High contrast) follow the same rule.
- Frames are ordered left to right by view, then `Data` (`default` → `empty` → `loading` → `error`), then breakpoint (main first), with each Dark frame right after its Light frame.

## 4.4 Naming

| Object | Name |
| --- | --- |
| Page | `{ID} {Name}` |
| Screen frame | `{ID} {Name} · {Data} · {Breakpoint}`, plus ` · Dark` for Dark frames |
| Screen frame in a flow | `{ID} {Name} · {View} · {Data} · {Breakpoint}` |
| Private part | `.Main/{Screen} {region}` |
| Layers | the Layout's region names (`specs/layouts/00-layouts.md` §4.2), then the anatomy tree in the Screen's file |

- `Breakpoint` uses the values in `specs/SYSTEM.md` Part C §4.2.
- `Data` (`default, empty, loading, error`) is not in Part C §4.2 yet; add it there before the first Screen is built (`workflow/EXTEND.md` step 7). It is never `State`, which is for interaction states.
- `{View}` is a short sentence-case name of a step in the flow ("Enter code").

## 4.5 Accessibility at page level

The Layout gives the landmarks, skip link, reflow and target sizes (`specs/layouts/00-layouts.md` §4.5). The Screen keeps them intact and adds:
- **Page title.** Each view has a unique title that starts with the view name ("Account settings – {Product}").
- **One H1**, the view's name, in `Page header`. Headings never skip a level.
- **Focus order** follows reading order in every state and at every breakpoint; the Anatomy numbers it.
- **Announcements.** Loading has a status role with an accessible name; content that replaces it is announced. An error moves focus to its message, or to an error summary on a form, so people know what failed and where.
- **A way forward.** Every `empty` and `error` state has an action reachable by keyboard.
- **Contrast** comes from the tokens; a screen never sets its own text or background color to make something stand out.

## 4.6 Promote repeated compositions

A composition on a Screen becomes a library component through `workflow/EXTEND.md` §6 when it appears on a second Screen page, appears three or more times on one screen, or the user asks. `.Main/{Screen} {region}` parts can't be shared between Screen pages, so a region that repeats is the usual case: it is promoted at the level `workflow/EXTEND.md` §3 gives (often a Section), keeps its look, and its copies are swapped for instances after the user confirms. Two Screens that arrange regions the same way without a Layout promote that arrangement to a Layout.

## 4.7 Documentation density

Each Screen file specifies, where relevant:
1. purpose: the task, who does it, how they get here, what done looks like;
2. the Layout used and its settings;
3. the template frames, with every screen frame name;
4. views and flow;
5. states, with what triggers each;
6. region content: which Sections, Components and Parts, with the properties set;
7. private parts;
8. content: the real copy per state, data examples and long-value cases;
9. responsive changes per breakpoint;
10. accessibility: page title, heading outline, focus order, announcements;
11. edge cases;
12. guidelines: content, flow, states, edge cases, do / don't, maintenance;
13. QA.

# 5. Screen file sections

A `specs/screens/6.x-{kebab-name}.md` file follows `workflow/DOCFRAMES.md` §13, adapted to real content. It contains, in this order:

```text
Purpose (task, people, entry points, what done looks like)
Layout used (page ID, Breakpoint and Show {region} settings)
Template frames (what goes in .Main, · Overview, every screen frame by name, · Anatomy, · Guidelines)
Views and flow (when there is more than one view)
States (Data × Breakpoint × mode, with the trigger of each)
Region content (region → Sections, Components and Parts, with the properties set)
Private parts (.Main/{Screen} {region}, with their variants)
Content (the copy of every state, data examples, long values, limits)
Responsive changes
Accessibility (page title, heading outline, focus order, announcements, error recovery)
Edge cases
Guidelines content
QA
```

A file that only lists the components on the screen is incomplete.

# 6. Implementation mode

Screens use the same implementation mode as the other levels (`workflow/QUESTIONNAIRE.md` §8 and `workflow/INITIATOR.md` Part B §3): **YOLO everything** or **One by one**. If the user already chose a mode in the current request, reuse it. The mode changes pacing only. In One by one, the Layout and any missing Sections, Components or Parts a Screen needs are built first; unrelated pages are not prebuilt.

Neither mode changes the order. A Screen page starts only when every earlier step of the build sequence (`workflow/INITIATOR.md` Part B §6) is done in the ledger, every Layout in scope included. It is done only after its own file and the file of its Layout were loaded at its step and the page gate passed.

# 7. Completion criteria

A Screen page fails QA when:
- a documented frame is missing, renamed or out of order, or a screen frame listed in the file is missing or misnamed;
- a screen frame is not built on exactly one Layout instance, or the Layout is detached;
- a Section, Component or Part is redrawn or detached, or an instance has its color, size or effect overridden;
- region content is copied into each frame instead of placed from `.Main`, so frames differ where they should match;
- any copy is lorem ipsum, a placeholder or invented content the file says to ask for;
- copy breaks the Content topic of a component it uses, or the brand's tone of voice;
- no long value is shown, or long values overflow instead of wrapping or truncating;
- a state required by §4.2 is missing and the file doesn't say why;
- an `empty` or `error` state has no way forward;
- a breakpoint or Dark frame required by §4.3 is missing;
- the page has more than one H1, skips a heading level, or the Anatomy has no heading outline or focus order;
- a value is raw where a token exists;
- a composition meets the threshold in §4.6 and was neither promoted nor raised with the user;
- any topic, example or QA rule in the Screen's file is missing from the canvas.

When the system has a web implementation, the Screen is documented on the site like the other levels (`workflow/WEB.md`) and its page passes `npm run qa` when QA is called (`workflow/INITIATOR.md` Part B, *QA on call*): no horizontal overflow at 390 px and no axe-core violations, in Light and Dark.
