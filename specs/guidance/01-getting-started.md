# 01 Getting started

The Getting started page is the first thing a designer opens. It explains what the system contains, how the file is organized, how to set it up, and how to work with components and variables. It is built for every Initiate run and is never reduced to one short setup frame.

# 1. Template frames

This page is built with `workflow/templates/structure.md`; the frames and what they hold are below.

```text
01 Getting started
├─ 01 Getting started · Overview              welcome, brand at a glance, setting up
├─ 01 Getting started · How the file works     page tree, components and properties, Auto Layout, libraries
└─ 01 Getting started · Working with variables what variables are, modes, editing, variables and styles
```

There is no `.Main` frame and no `· Tokens` frame.

Every frame is a reading frame (`workflow/DOCFRAMES.md` §7):
- `Doc/Header` with breadcrumb `Guidance › 01 Getting started`;
- one section with a rich-text column at `doc/measure/reading`, padded by `doc/space/block`;
- each topic is heading → body → visual example → links, with the visual directly after the text it supports;
- links point to pages in this file (`1.1 Color`, `2.1 Button`, `02 Tokens`), never to external sites;
- `Doc/Footer`.

Topics follow the order below. Every topic keeps its visual example; do not merge topics into one card or a short FAQ.

# 2. 01 Getting started · Overview

## 1. Welcome

What the system is and who it is for: the product it serves, the platforms, the color modes and the typefaces. Then what is inside, as a short list linking to each level: Foundations, Parts, Components, Sections (and Layouts and Screens when they exist). Then the intended workflow: use components from the library, never detach them; change the system at the source (variables, styles, components), never on instances.

**Visual: file map.** The page tree as a diagram: `00 Cover`, `01 Getting started`, `02 Tokens`, then each level separator with its pages, each page a small card linking to the page. Pages in scope are shown; out-of-scope items are not.

## 2. The brand at a glance

A summary of the brand translated into the system: main colors, typefaces, corner character, depth.

Color is always shown visually. Each brand color is a card:

```text
Brand color card
├─ Specimen       swatch bound to the variable
├─ Name           e.g. Brand
├─ Variable       e.g. palette/brand/600 → color/fill/brand/solid
├─ Value          hex, secondary
└─ Meaning        e.g. Primary actions, links, selected states
```

Rules:
- never show a color as a hex, RGB, HSL or Pantone string alone;
- the swatch is bound to the real variable, not a copied raw color;
- the variable name is the main technical label; the hex is secondary;
- colored hex text is never a swatch;
- a card with only a color name, a colored hex string and a description fails QA.

**Visual: brand summary.** Brand color cards for brand, neutral and the feedback families; a typeface card per family in use (`Aa` and the family name in its own face); one card, one button and one input showing the corner radius and depth the system uses. Each card links to its foundation page.

## 3. Setting up

The steps a designer needs before using the system:
1. install the typefaces listed on the cover (`font/family/*`); missing fonts break every text style;
2. enable this file as a library in the team's files;
3. accept library updates when the system is updated, and review the change notes;
4. set the canvas color mode (Light or Dark) on the page or frame being designed;
5. use the Assets panel to insert components, and the property panel (not the layers) to change them.

**Visual: setup steps.** Recreated editor views of each step, built with this file's own names: the font list, the library toggle with this file's name, the update dialog, the mode switch on a frame, and the property panel of a `Button` instance.

# 3. 01 Getting started · How the file works

## 1. The page tree

Pages carry an ID and follow the levels:
- **Foundations** (`1.x`): tokens, styles and assets every component uses.
- **Parts** (`2.x`): the smallest interactive or display units, such as Button, Checkbox and Badge.
- **Components** (`3.x`): small groups of Parts that work as one unit, such as Text field and Select.
- **Sections** (`4.x`): larger blocks with their own layout and behavior, such as Rich text editor and Video player.
- **Layouts** and **Screens**: page layouts and real screens, when the team adds them.
- `9.1 Doc kit`: the documentation components this file uses to describe itself.

A component only uses components from lower levels. IDs never change, so a page name, its Markdown spec and its components stay linked.

**Visual: levels.** One example per level, connected: an icon and a color (foundation) → `Button` and `Label` (Parts) → `Text field` (Component) → a sign-in form section (Section), each a real instance with its page ID.

## 2. Components and properties

Each component is one set with a small, fixed set of properties, named the same way everywhere:
- `Size`, `Emphasis` (primary, secondary, tertiary, ghost), `Tone` (neutral, brand, danger, warning, success, info), `State` (rest, hover, pressed, focus, disabled, loading);
- `Selected`, `Checked`, `Status`, `Type`, `Placement`, `Orientation`, `Icon only`;
- text properties (`Label`, `Supporting text`), `Show {part}` toggles and `Icon` swaps.

Grouping variants this way keeps the library small: one `Button` set covers every size, emphasis, tone and state, instead of separate components for each. Danger is a `Tone`, not a separate component.

**Visual: one set, many uses.** The `Button` property panel next to four instances made from it (primary brand, secondary neutral, ghost, primary danger), each labeled with its property values.

## 3. Auto Layout

Every component is built with Auto Layout, so it resizes with its content like a flexbox in code: a longer label widens the button, a hidden icon closes its gap, a field fills its container. Padding and gaps are bound to `space/*` variables.

**Visual: responsive component.** One `Button` with a short and a long label, with and without its icon, and one `Text field` stretched across two widths, with its Auto Layout settings (direction, padding, gap, resizing) labeled.

## 4. One library or several

A single library is easiest while the system is small. Split it when the file becomes slow to open or publish, or when separate teams own separate parts: for example foundations and Parts in a core library, product-specific Sections in their own. Splitting has a cost: components move between files, instances must be relinked, and each library is published separately.

Before splitting:
1. decide which levels go where (lower levels never depend on higher ones);
2. move components with their variables and styles intact;
3. relink instances in product files;
4. publish both libraries and check one product file end to end.

**Visual: library split.** A diagram of one library becoming two (core: foundations and Parts; product: Components and Sections), with the dependency arrow pointing one way only.

# 4. 01 Getting started · Working with variables

## 1. What variables are

A variable is a named, reusable value: a color, a number, a string. Components use variables instead of raw values, so changing one variable updates everything that uses it.

**Visual: one change, many updates.** One semantic color variable (a swatch and its name) with an arrow to the real components that fill with it, each labeled (for example a checked checkbox, an on switch, a progress bar). Use only components that really bind that variable; leave out any that do not.

**Caption.** Starts with `Example:` (`workflow/DOCFRAMES.md` §15, Examples and previews), names the variable and the components in the visual, and says what one edit changes: `Example: the checked Checkbox and the on Switch both fill with color/text/brand. Edit that one variable and both change together.`

## 2. Modes

This topic has a fixed structure. Only the collection names, mode names and values change from build to build; never add, drop or reorder the parts.

1. **Definition**, always this sentence: `A collection can hold several modes: one column of values per mode. Set a mode on a frame and everything inside it switches, without touching a component.`
2. **This file's modes**, one sentence per collection with more than one mode, in collection order (`02 Tokens · Collections`):
   - a supported mode: `{Collection} has {Mode A} and {Mode B}: {what the second mode is for}.` (for example: Motion has Standard and Reduced, for people who turn on reduced motion);
   - a mode that exists but is not supported: `The {Collection} collection has a {Mode} column, but {Mode} is not supported yet: its values are placeholders, so keep frames on {default mode}.`;
   - no collection with more than one mode: `Every collection in this file has one mode.` Then skip parts 3 and 4 and keep 5 and 6.
3. **Tables**, one per collection with more than one supported mode, except Color (its values are on `1.1 Color · Tokens`). Columns: Variable, then one column per mode. Up to four rows: the variables a designer meets first (the durations for Motion, the default width for Border, the base step for Space).
4. **Visual: mode switch.**
   - Color has a second supported mode (for example Dark): the same card (a text field and a primary button) twice, side by side, one frame per mode, each frame labeled with its mode.
   - Color has one supported mode: a recreated `Frame · Appearance` panel listing every collection that has modes, with the mode the frame uses, next to one frame in that mode with the same card.
5. **Caption**, this form: `Example: the mode switch sits on the frame, not on the components. {Other collections with modes} switch the same way.`
6. **Links**: the foundation page of each collection with modes (`1.6 Motion`, `1.4 Shape`, `1.3 Space & layout`), then `02 Tokens`.

When a new mode is added later (Dark is the usual one), only parts 2 to 4 change: its sentence loses "not supported", it gets a table row or column, and the visual becomes the side-by-side comparison. The rest of the topic stays word for word.

## 3. Opening and editing variables

Variables are edited in the local variables panel. Open a collection, find the variable by name, and change its value or alias in the mode column. Primitives (`palette/*`, `scale/*`) are hidden from pickers; change them only when the brand changes.

**Visual: editing steps.** Recreated editor views: the variables panel open on `Color`, `color/text/secondary` selected, its alias changed in the `Dark` column, and the result on a text field label.

## 4. Variables and styles

Variables store single values; text, effect and grid styles package several values into one asset that references variables where possible. They work together: primitives → semantic variables → styles and components.

**Visual: relationship.** Three columns: a primitive variable, the semantic variable that aliases it, and a text style or component that uses it, connected with lines.

**Visual: bind through the role.** A do / don't pair (`workflow/DOCFRAMES.md` §15, Comparison): Do shows the element bound through the semantic role, with the reason that re-pointing the role updates every use; Don't shows the same element bound straight to the primitive, with the reason that the primitive says which color, not why. Use `Doc/Do-dont` so the verdict is colored; never mark the two sides with neutral badges such as Prefer and Avoid.

## 5. Do you need variables?

Variables add theming, shared meaning and alignment with code, but they also cost setup and upkeep.

**Visual: decision flow** (cards and connectors, not paragraph text):

```text
Existing system?
├─ Yes → inspect the current tokens and styles
│        ├─ working → keep them
│        └─ weak or incomplete → improve according to the chosen action
└─ No
   ├─ several modes, several brands or tokens used in code → variables
   └─ small, single-theme system → styles or a light token layer may be enough
```

Variables are not mandatory. If an existing system works well with styles and the chosen action is keep or audit, its architecture stays.

Links: `02 Tokens` for collections, naming, modes and the primitive palette.

# 5. QA

- All three frames exist with their exact names and every topic above, in order. There is no topic about the page frames (`.Main`, Overview, Component, Anatomy, Guidelines): readers learn them from the pages themselves.
- Modes follows its six fixed parts in order, with this file's real collections and modes.
- Every worked example's caption starts with `Example:`; every recommendation is a `Doc/Do-dont` pair.
- Every color shown is a swatch bound to its variable; no text-only color card.
- Every topic has its visual, recreated with this file's own names and components; no pasted screenshots from other files.
- Links point to pages in this file.
