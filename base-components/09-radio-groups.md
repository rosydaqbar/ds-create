# Radio Groups

Radio groups provide richer option cards for mutually exclusive or checkbox-like selections while allowing supporting information, icons, avatars, payment icons, or compact controls.

# 1. Public families

```text
Radio groups
├─ Radio group item
└─ Radio group
```

# 2. Radio group item

Published set: `Radio group item`

Observed:
- 144 variants.

Properties:
- Badge: Boolean
- Selected: False / True
- Size: sm / md
- Type:
  - Icon simple
  - Icon card
  - Avatar
  - Payment icon
  - Radio button
  - Checkbox
- State: Default / Hover / Focused
- Breakpoint: Mobile / Desktop

## Core anatomy

Text/control form:

```text
Radio group item
layout: Horizontal
├─ Content                              Fill
│  layout: Horizontal
│  ├─ leading visual/control
│  │  ├─ featured icon / avatar / payment icon / control
│  └─ Text and supporting text          Fill
│     ├─ Text and subtext
│     │  ├─ Text
│     │  └─ Subtext
│     └─ Supporting text
└─ selection control                    when placed at trailing edge
```

Radio-button representative:
- selection control aligns to the first text line;
- text/supporting content fills the available width.

Card/icon types maintain the same content hierarchy while changing the leading visual/container treatment.

# 3. Radio group

Published set: `Radio group`

Observed:
- 24 variants.

Properties:
- Size: sm / md
- Type: same six types as item
- Breakpoint: Desktop / Mobile

Anatomy:

```text
Radio group
layout: Vertical
gap: group spacing

├─ Radio group item
├─ Radio group item
├─ Radio group item
└─ ...
```

Group items must remain instances.

Breakpoint changes layout/content density while preserving item semantics.

# 4. Selection behavior

- only one item is selected for radio-group semantics;
- checkbox type may support multi-select semantics when intentionally used as such;
- Selected is visually distinct from Focused;
- supporting text is never the only selected-state indicator.

# 5. Matrix requirements

Item matrix:
- all 6 types;
- sm/md;
- selected false/true;
- Default/Hover/Focused;
- Mobile/Desktop;
- badge on/off where applicable.

Group matrix:
- all 6 types;
- both sizes;
- both breakpoints.



# Documentation

The Figma Page must visibly document:
- single-choice radio semantics and when checkbox-style multi-select is intentionally appropriate;
- Radio group item → Radio group composed anatomy;
- selected versus Focused behavior;
- simple, card, icon, avatar, and richer option types;
- supporting text, badge, and leading-visual alignment;
- mobile versus desktop/breakpoint behavior;
- keyboard navigation, group labeling, and non-color selected cues;
- do/don't examples for multiple selected radio items, using focus as selection, and scaling desktop down as “mobile”;
- which item family, breakpoint behavior, and semantic tokens should be maintained centrally.

The full matrix does not replace this guidance.


# Documentation

The Figma Page must visibly document:
- single-choice radio semantics and when checkbox-style multi-select is intentionally appropriate;
- Radio group item → Radio group composed anatomy;
- Selected versus Focused behavior;
- simple, card, icon, avatar, and richer option types;
- supporting-text, badge, and leading-visual alignment;
- mobile versus desktop/breakpoint behavior;
- keyboard navigation, group labeling, and non-color selected cues;
- do/don't examples for multiple selected radio items, focus used as selection, and desktop merely scaled down for mobile;
- central maintenance through the item family, breakpoint behavior, and semantic tokens.

A matrix alone fails documentation QA.

# 6. QA

Fail QA when:
- group children are detached/duplicated;
- Selected and Focused look identical;
- leading visual changes cause text alignment drift;
- mobile is represented only by scaling desktop;
- supporting descriptions are removed from rich option types.
