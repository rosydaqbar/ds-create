# Sections

Sections are larger blocks of an interface with their own layout and behaviour: an editor with its toolbar, a video player with its controls. They combine Components, Parts and private parts into one working region. Each Section page is a **complete component canvas**, built with the same page template as Parts and Components, plus the Composition block, plus examples in use that show the Section inside a realistic screen area.

Sections are not built during Initiate unless the user selects them. They are added later when the user selects them in the questionnaire (`INITIATOR.md`) or when `EXTEND.md` adds them.

# 1. Section pages

```text
── 4 · Sections ──
4.1 Rich text editor   toolbar, floating toolbar and editing surface for formatted text
4.2 Video player       16:9 media frame with overlay action and playback controls
```

| Page | File |
| --- | --- |
| 4.1 Rich text editor | `sections/4.1-rich-text-editor.md` |
| 4.2 Video player | `sections/4.2-video-player.md` |

New Sections take the next free ID (`4.3`, `4.4`, …) through `EXTEND.md`. IDs are never reused.

# 2. What a Section may contain

- Components (`3.x`) and Parts (`2.x`) as **instances**.
- Foundations: tokens, styles, icons and brand assets.
- Its own private parts (`.Main/{Component} {part}`) for controls that only exist inside this Section, such as an editor command or a video action button.

A Section never instances another Section, a template or a page.

# 3. Page template

Every Section page is built with `templates/structure.md` and uses the component page template (`SYSTEM.md` Part A §3), left to right:

```text
{ID} {Name}
├─ .Main                     private parts with their own header
├─ {ID} {Name} · Overview     hero instance + 2–4 examples in use inside realistic screen areas
├─ {ID} {Name} · Component    every published set with its family header and full matrix
├─ {ID} {Name} · Anatomy      Composition block, then anatomy, properties, sizes, states, token map
└─ {ID} {Name} · Guidelines   usage, do / don't, content, accessibility, composition
```

The **Composition block** at the top of `· Anatomy` works as for Components (`components/00-components.md` §3): real instances of every Component, Part and private part the Section uses, each labelled with its page ID and the properties the Section sets.

**Examples in use** in `· Overview` are compositions, not new components. They place the Section in the part of a screen where it lives (a comment box under a post, a player inside a course page) so designers see its proportions and neighbours.

# 4. Rules for every Section

- **Reuse before creating.** A control that exists as a Part or Component is instanced, never rebuilt. A private part exists only for a control with no equivalent elsewhere, and the Section's file says why.
- **One control system per Section.** When a Section shows the same control in two places (a fixed toolbar and a floating toolbar), both use the same private part.
- **Regions keep their own layout.** The Section's file names which region fills and which stays fixed, and what overlays rather than adds height.
- **Sizes propagate.** The Section's `Size` sets the size of every instance inside it, through the mapping its file lists.
- **Matrices are complete.** Every published set and every private part shows its full matrix in `· Component` or `.Main`.
- **Documentation density.** The same list as Components (`components/00-components.md` §4), plus: regions and their behaviour, at least one example in use, and the interaction model (keyboard, focus, what happens on resize).

# 5. Implementation mode

Sections use the same implementation mode as Parts and Components (`INITIATOR.md` §8). In One by one, the Components and Parts a Section needs are built first when they are missing.

# 6. Completion criteria

A Section page fails QA when:
- a Component or Part inside it is redrawn or detached instead of instanced;
- the same control appears in two private versions;
- the Composition block or the examples in use are missing;
- a region that should overlay changes the Section's layout height;
- a published set or private part is missing, or its matrix is reduced to samples;
- any topic, example or QA rule in the Section's file is missing from the canvas.
