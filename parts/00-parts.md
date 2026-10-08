# 2 Parts

Parts are the smallest interactive or display units of the system: a button, a checkbox box, a badge, the box of a text control. Every Part page is a **complete component canvas**, not a gallery. Each one contains:
- a `.Main` frame with its private building blocks, when it has any;
- every published component set of the Part, with its full variant matrix;
- anatomy that keeps the real nested construction;
- examples in use built from real instances;
- every note, diagram, example and guideline required by the Part's Markdown file.

Components (small groups of Parts that work as one unit, such as a labeled checkbox or a text field with label and hint) live in `components/`. Sections (larger sections with their own layout and behavior) live in `sections/`. Both use the same component page template and the same rules as this file, plus a *Composition* block at the top of Anatomy.

# 1. Part list and order

Pages are created in this order, under the `── 2 · Parts ──` separator (SYSTEM.md Part A §1). Each page has one Markdown file in `parts/`.

| ID | Page | File | Purpose |
| --- | --- | --- | --- |
| 2.1 | Button | `2.1-button.md` | Triggers an action; carries emphasis (primary / secondary / tertiary) and tone (brand / danger). |
| 2.2 | Icon button | `2.2-icon-button.md` | Compact square action with an icon and no visible label: toolbars, close, utility actions. |
| 2.3 | Link | `2.3-link.md` | Navigates to another page, section or resource through text, inline or standalone. |
| 2.4 | Badge | `2.4-badge.md` | Compact, non-interactive label for status, count, category or metadata. |
| 2.5 | Tag | `2.5-tag.md` | Compact value chip that can be removed, counted or selected, used in filters and multi-value inputs. |
| 2.6 | Avatar | `2.6-avatar.md` | Represents one person or entity with an image, initials or a placeholder icon, plus optional indicator. |
| 2.7 | Checkbox | `2.7-checkbox.md` | The checkbox box: unchecked, checked or mixed. |
| 2.8 | Radio | `2.8-radio.md` | The radio control: one choice in a set of mutually exclusive options. |
| 2.9 | Switch | `2.9-switch.md` | The on/off switch control (track and thumb) for settings that apply immediately. |
| 2.10 | Text control | `2.10-text-control.md` | The input box users type into or open: single-line, multi-line and select trigger. |
| 2.11 | Label | `2.11-label.md` | The field label with optional required marker and help icon. |
| 2.12 | Help text | `2.12-help-text.md` | Hint or validation message under a field. |
| 2.13 | Tooltip | `2.13-tooltip.md` | Short floating description attached to an element. |
| 2.14 | Progress | `2.14-progress.md` | Shows how far a task has progressed, as a bar or a ring. |
| 2.15 | Spinner | `2.15-spinner.md` | Indeterminate loading indicator; also used inside Button's and Icon button's loading state. |
| 2.16 | Divider | `2.16-divider.md` | Separates content groups horizontally or vertically. |
| 2.17 | Kbd | `2.17-kbd.md` | Shows a keyboard key or shortcut. |
| 2.18 | Slider | `2.18-slider.md` | Picks a value or range by dragging a handle along a track. |
| 2.19 | Featured icon | `2.19-featured-icon.md` | An icon inside a tinted shape, used to give a message or card a visual anchor. |

Only Parts in scope get a page. Out-of-scope Parts get no placeholder page. New Parts take the next free ID (`2.20`, …).

# 2. Implementation mode is mandatory

Before implementing any Part, explicitly resolve how the user wants component execution to proceed.

Ask:

**How do you want to implement the components?**

- **YOLO everything** — implement all confirmed selected Parts (and components/Sections in scope) continuously.
- **One by one** — implement one confirmed component page at a time and stop after its QA before continuing.

Do not infer or silently default the mode. If the user already explicitly selected a mode in the current request, reuse it without asking again.

## YOLO everything

When YOLO is selected:
- load this file and each page's Markdown file at that page's step (`INITIATOR.md` Part B §0, *Loading per step*);
- implement all confirmed selected pages in the build sequence (`INITIATOR.md` Part B §6): Parts in the order of §1 with the dependencies in §3 first, then Components, then Sections;
- do not stop for per-page confirmation;
- run every page's full specification and QA;
- do not interpret YOLO as permission to simplify matrices, anatomy, documentation, states, examples or accessibility requirements.

## One by one

When One by one is selected:
- implement exactly one confirmed page in the current iteration;
- load that page's Markdown file before implementation;
- build only the private parts and dependencies that page needs (for example Spinner before Button's loading state);
- run the page's complete QA before considering it complete;
- report the completed page and the remaining confirmed pages;
- stop after completion and propose the next step in the build sequence; continue when the user confirms it;
- do not prebuild unrelated selected pages.

The mode changes **execution pacing only**. Scope, order, fidelity, documentation completeness, token behavior and QA requirements stay identical in both modes.

In both modes, a Part page starts only when every earlier step of the build sequence is done in the ledger: tokens, the Doc kit, `00`–`02` and every foundation page in scope. It is done only by the page gate (`INITIATOR.md` Part B §6, *Gates*).

# 3. Dependencies between Parts

A Part uses foundations (tokens, text styles, effect styles, icons) and its own private parts. It never instances a Component or Section.

A Part may instance another Part only as a fixed part, and the Part's file says so. The fixed dependencies are:

| Part | Instances | Why |
| --- | --- | --- |
| 2.1 Button | 2.15 Spinner | loading state |
| 2.2 Icon button | 2.15 Spinner | loading state |
| 2.4 Badge | 2.6 Avatar | avatar leading visual |
| 2.5 Tag | 2.6 Avatar, 2.7 Checkbox | avatar leading visual, selectable tags |
| 2.10 Text control | 2.6 Avatar, 2.13 Help icon, 2.17 Kbd | avatar leading visual, help icon, shortcut hint |
| 2.11 Label | 2.13 Help icon | help icon |
| 2.13 Help icon | 2.13 Tooltip | the tooltip it opens |
| 2.18 Slider | 2.13 Tooltip | value label above the handle |

Build order inside Parts therefore starts with 2.6 Avatar, 2.7 Checkbox, 2.13 Tooltip, 2.15 Spinner and 2.17 Kbd before the Parts that instance them; page order on the canvas stays as in §1.

Build the instanced Part first. When implementing One by one, build the dependency's page completely before the page that uses it.

# 4. Component page template

Every Part page is built with `templates/structure.md` and uses the component page template (SYSTEM.md Part A §3). Frames are top-level, placed left to right at `y = 0`, separated by `doc/space/canvas`:

```text
{ID} {Name}
├─ .Main                            private parts with their own header (only when the Part has parts)
├─ {ID} {Name} · Overview            hero specimen + examples in use + when to use
├─ {ID} {Name} · Component           the published component set(s), full matrix, axis labels
├─ {ID} {Name} · Anatomy             anatomy diagram, properties, sizes, states, token map
└─ {ID} {Name} · Guidelines          usage, do / don't, content, accessibility, composition, In apps (App products)
```

What goes in each frame:

**.Main**
- private header (§5);
- every private part with its name, a one-line purpose and its own small matrix.

**· Overview**
- `Doc/Header` with the breadcrumb `Parts › {ID} {Name}`, the H1 and a specific description;
- one large default instance (the hero specimen);
- 2–4 realistic compositions built from real instances, each with a one-line caption. The Part's file names them;
- a short "When to use / When not to use" pair.

**· Component**
- one `Doc/Family header` per published set, with the eyebrow `Parts › {ID} {Name}`, the set title and a description specific to that set;
- the complete component set directly below its header;
- `Doc/Axis label` instances above columns and to the left of rows, so every property reads without opening the sidebar.

**· Anatomy**
- numbered anatomy diagram: one enlarged instance with `Doc/Callout` markers and a legend that uses the exact layer names;
- property table: property → type → values → default → what it changes;
- size row: one instance per size with `Doc/Spec label` measurements (height, padding, gap, icon size);
- state row: one instance per state, captioned with what changes;
- token map: part × state → `Doc/Token badge` with a swatch (`Doc/Alias chip`).

**· Guidelines**
- reading-oriented frame (`workflow/DOCFRAMES.md` §7);
- every guideline topic and visual teaching module from the Part's file, in the order the file lists them;
- do / don't pairs built from real instances, each with `Doc/Do-dont` underneath;
- for App products, an **In apps** topic after Accessibility (`SYSTEM.md` Part A §A5).

Every frame ends with `Doc/Footer`.

# 5. Family header and private header

Every published set starts with a `Doc/Family header`:

```text
Family header
├─ Eyebrow: Parts › {ID} {Name}
├─ Family title
└─ Supporting description
```

The supporting description must explain:
- what the component is;
- when it is useful;
- any important behavior or content constraint.

Do not replace this with generic copy such as "Used in interfaces."

When the Part has private parts, the `.Main` frame starts with its own header:

```text
Private parts
These are internal building blocks used to maintain the published components on this page.
Edit them to change every published variant at once. Never use them directly in product screens.

Resources
├─ component authoring guidance
└─ Figma component and property guidance
```

Resource labels are project-neutral. Never keep source branding, product names or URLs.

# 6. Private vs published anatomy

Private parts:
- are named `.Main/{Component} {part}` (for example `.Main/Switch thumb`, `.Main/Badge close`);
- live in the `.Main` frame, left of everything else;
- are documented as construction dependencies;
- expose only the properties the published sets need;
- are never published and never presented as product components.

Published sets:
- live in the `· Component` frame;
- keep the real nested anatomy;
- use instances of private parts rather than duplicating their internals.

# 7. Anatomy documentation is mandatory

Every Part file documents the actual nesting, not only variant names.

Minimum anatomy documentation:

```text
Component
├─ root layout behavior
├─ primary child frame(s)
├─ optional slots
├─ text/content wrapper
├─ leading/trailing affordances
└─ private part instances
```

For each important node record:
- Auto Layout direction;
- Hug / Fill / Fixed intent;
- padding relationship;
- gap relationship;
- which child expands;
- which child stays fixed;
- which child is optional (and the `Show {part}` property that controls it);
- which private part or Part instance is reused.

Layer names are exactly the names in the anatomy tree. Default names (`Frame 12`, `Rectangle`, `Group`) are never allowed.

Do not flatten a Part into one frame because it looks simple.

# 8. Matrix completeness

The `· Component` frame shows the full component-set matrix.

For every published set:
- keep all variant axes;
- keep booleans and instance-swap properties, and show the important ones switched on in a "Content options" row next to the matrix;
- show enough rows and columns to inspect every state and every major composition;
- keep semantic variations (danger, warning, success) as `Tone` values inside the same set, laid out as their own block of the matrix;
- keep icon-only forms in the same set when the Part's file says so.

Do not reduce a 300-variant set to 6 showcase cards.

# 9. Documentation density

Part documentation contains, where relevant:

1. page and set definition (family header);
2. private-part explanation;
3. anatomy;
4. size behavior;
5. property model;
6. state behavior;
7. composition rules;
8. content rules;
9. optical and alignment rules;
10. tone rules (brand, danger, status colors);
11. examples in use;
12. page-specific notes;
13. accessibility and interaction guidance;
14. do / don't and misuse guidance;
15. maintenance guidance (which part or token to edit to change everything);
16. examples and diagrams where specified;
17. QA checks.

Each Part file specifies these details and names the template frame each one goes in.

# 10. Measurement rule

Every Part file states its sizes as **defaults** bound to tokens (for example "md: height `size/control/md` = 40 by default"). The brand may change the values; the relationships stay.

Keep:
- relative padding;
- relative gaps;
- hierarchy;
- sizing relationships;
- matrix organization.

Allow:
- wider content;
- longer labels;
- larger brand typography;
- extra color modes;
- content-driven height growth.

Do not hard-code a top-level frame to one absolute size when its content needs to grow.

# 11. Render the complete Markdown file on the page

Documentation is mandatory, and its content is page-specific even though the frames are fixed.

For each Part page:
- read the entire Markdown file;
- keep every anatomy rule, content rule, matrix requirement, state rule, example, guideline topic and QA condition;
- render them as visible Figma content in the template frame the file names;
- keep private-part documentation next to the private parts;
- keep property and state explanations in Anatomy, next to the diagram they explain;
- keep visual teaching modules in Guidelines, in the file's order.

Do not shorten a detailed Markdown file into "overview + anatomy + accessibility". That is a summary, not the specification.

# 12. Completion criteria

A Part page fails QA when:
- a template frame is missing, renamed or out of order;
- a published set is missing;
- a private part was published, or is not named `.Main/{Component} {part}`;
- the anatomy is simplified into a different structure;
- component properties are omitted, or use names outside the property vocabulary (SYSTEM.md Part C §4.2);
- variant matrices are reduced to samples;
- a family header description is missing or generic;
- Overview has no realistic compositions built from real instances;
- page-specific documentation, examples or notes required by the Markdown file are missing;
- anatomy is described only conceptually rather than layer by layer;
- components do not keep the intended optical and layout relationships;
- any layer is bound to a raw value where the Part's token map names a token;
- a disabled state on a non-native element is shown but not announced (§13).

# 13. Disabled is announced, not only shown

Native controls (a button, an input, a select) announce their disabled state on their own. When a Part shows `State=disabled` on an element that is not a native control — a tag or its close, a custom select trigger, a menu item, an option — the interactive element in code also carries `aria-disabled="true"`, ignores activation, and keeps the disabled look. The Part's Accessibility topic says which of its elements this applies to; Components and Sections follow the same rule for their private parts.
