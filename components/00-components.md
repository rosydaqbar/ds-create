# Components

Components are small groups of Parts that work as one unit with one job: a field made of a label, a control and a hint; a row of connected buttons; a stack of avatars. Each Component page is a **complete component canvas**, built with the same page template as the Parts, plus one extra block that shows which Parts it is made of.

Components are not built during Initiate unless the user selects them. They are added later when the user selects them in the questionnaire (`INITIATOR.md`) or when `EXTEND.md` adds them.

# 1. Component pages

```text
── 3 · Components ──
3.1 Button group       connected actions or a compact view switcher
3.2 Text field         Label + Text control + Help text, plus textarea and code fields
3.3 Choice field       labeled checkbox, radio and switch; choice cards and groups
3.4 Avatar group       overlapping avatar stacks and avatar + name rows
3.5 Select             select and multi-select fields with their option list
3.6 Menu               dropdown and context menus with their item rows
3.7 Social button      sign-in buttons with provider marks, and their groups
3.8 Badge group        a badge with a one-line announcement message that links
```

| Page | File |
| --- | --- |
| 3.1 Button group | `components/3.1-button-group.md` |
| 3.2 Text field | `components/3.2-text-field.md` |
| 3.3 Choice field | `components/3.3-choice-field.md` |
| 3.4 Avatar group | `components/3.4-avatar-group.md` |
| 3.5 Select | `components/3.5-select.md` |
| 3.6 Menu | `components/3.6-menu.md` |
| 3.7 Social button | `components/3.7-social-button.md` |
| 3.8 Badge group | `components/3.8-badge-group.md` |

New Components take the next free ID (`3.9`, `3.10`, …) through `EXTEND.md`. IDs are never reused.

# 2. What a Component may contain

- Parts (`2.x`) as **instances**. A Component never redraws a Part's box, mark, track or label.
- Foundations: tokens, text styles, effect styles, icons and brand assets.
- Its own private parts (`.Main/{Component} {part}`) for pieces that are specific to this Component, such as a menu row or a code-field cell.

A Component never instances another Component or anything from a higher level (`SYSTEM.md` Part A §1). When two Components need the same row or cell, each keeps its own private part and both bind the same tokens, so they stay visually identical.

# 3. Page template

Every Component page is built with `templates/structure.md` and uses the component page template (`SYSTEM.md` Part A §3), left to right:

```text
{ID} {Name}
├─ .Main                     private parts with their own header (only when the Component has parts)
├─ {ID} {Name} · Overview     hero instance + 2–4 compositions in use + when to use
├─ {ID} {Name} · Component    every published set with its family header and full matrix
├─ {ID} {Name} · Anatomy      Composition block, then anatomy, properties, sizes, states, token map
└─ {ID} {Name} · Guidelines   usage, do / don't, content, accessibility, composition, In apps (App products)
```

## The Composition block

Components add one block at the top of **· Anatomy**, before the numbered anatomy diagram:

```text
Composition
├─ Doc/Block note            "Built from" + one sentence on how the parts work together
└─ Parts row
   ├─ Part instance            e.g. Label (2.11)
   │  └─ Doc/Spec label        page ID + name, and which properties the Component sets
   ├─ Part instance            e.g. Text control (2.10)
   ├─ Part instance            e.g. Help text (2.12)
   └─ private part instance    when the Component has its own parts
```

Each Part is shown as a real instance in its default configuration, with its page ID so the designer can jump to it. The block answers one question at a glance: *what do I edit to change this Component?* The Part page for the Part, this page for the arrangement.

# 4. Rules for every Component

## Sizes propagate

When a Component has `Size`, every Part inside it uses the matching `Size`. The Component's Markdown file lists the mapping when it is not one-to-one (for example a Text field `lg` uses a Label `md`).

## Spacing between Parts

The gap between parts is a space token, never a typed number. When the gap differs per size, the Component gets a component token (`text-field/gap`, `button-group/item/padding-x/md`) that aliases a `space/*` token.

## States live where they happen

- The Part owns its own interaction states (hover, focus, disabled).
- The Component passes the state down by choosing the matching Part variant in each of its own variants. A `Choice field` with `State=hover` contains a Checkbox with `State=hover`.
- The Component owns only the states that belong to the group: `Selected` on a button-group item, `Open` on a select, `Status` across a whole field.
- A disabled private part that is not a native control is announced as disabled, not only shown (`parts/00-parts.md` §13).

## Private parts

Private parts follow the Part rules (`parts/00-parts.md`): they live in `.Main`, are named `.Main/{Component} {part}`, are never published, and expose only the properties the published sets need.

## Matrices

The **· Component** frame shows the full matrix of every published set. A Component that passes Part states down still shows the states its file lists in its own matrix, because designers pick the Component, not the Part.

## Documentation density

Each Component file specifies, where relevant:
1. purpose and when to use it versus the neighboring components;
2. the template frames and what goes in each;
3. published sets and private parts;
4. the Composition block;
5. properties (`SYSTEM.md` Part C §4.2 vocabulary);
6. anatomy tree with Auto Layout relationships;
7. which children fill and which stay fixed;
8. sizes and measurements per size;
9. state behavior;
10. matrix layout;
11. token map;
12. guidelines: usage, do / don't, content, accessibility, composition, and In apps for App products (`SYSTEM.md` Part A §A5);
13. QA.

The template frames are fixed. The topics inside them come from the Component's file and are never shortened into "overview + anatomy + accessibility".

# 5. Implementation mode

Components use the same implementation mode as the Parts (`INITIATOR.md` §8): **YOLO everything** or **One by one**. The mode changes pacing only. In One by one, the Parts a Component needs are built first when they are missing; unrelated Components are not prebuilt.

# 6. Completion criteria

A Component page fails QA when:
- a Part inside it is redrawn or detached instead of instanced;
- the Composition block is missing, or shows drawings instead of real instances;
- the Component instances another Component or a Section;
- a published set is missing or its matrix is reduced to a few samples;
- a private part is published;
- the Part states shown in the Component do not match the Part's own variants;
- any topic, example or QA rule in the Component's file is missing from the canvas;
- the anatomy is flattened into fewer layers than the file's anatomy tree.
