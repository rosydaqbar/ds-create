# Button Groups

Button groups combine adjacent actions into toolbars, split-button patterns, or compact view selectors.

# 1. Page regions

```text
Private
└─ _Button group base

Published
└─ Button group
```

The public documentation must explain:
- groups are for related actions;
- they can behave like compact tabs/view selectors;
- individual items remain buttons with independent states.

# 2. Private base

Private set: `_Button group base`

Observed:
- 64 variants.

Properties:
- Size: sm / md
- Current: False / True
- Icon: False / Leading / Only / Dot
- State: Default / Hover / Focused / Disabled
- Icon swap: Instance swap

Representative anatomy:

```text
_Button group base
layout: Horizontal
align: Center

├─ Leading icon / dot                  optional
├─ Text                                optional for Icon=Only
└─ icon-only content                   when configured
```

Observed md text baseline:
- height around 40;
- horizontal padding around 16;
- vertical padding around 8;
- gap around 6.

The base owns:
- item border;
- item current state;
- focus state;
- icon/text alignment;
- touching-edge treatment.

# 3. Published Button group

Published set: `Button group`

Properties:
- Size: sm / md
- Icon: False / Leading / Only

Anatomy:

```text
Button group
layout: Horizontal
gap: 0

├─ _Button group base
├─ _Button group base
├─ _Button group base
└─ ...
```

Every visible item is an instance of the private base.

Connected-edge behavior:
- outer first/last corners retain the group radius;
- touching interior edges visually merge;
- avoid doubled borders;
- Current applies per item.

# 4. Matrix requirements

Private base matrix:
- both sizes;
- Current false/true;
- all icon modes;
- all states.

Public group:
- both sizes;
- text, leading-icon, and icon-only forms;
- examples with different current items.

# 5. QA

Fail QA when:
- group items are hand-built rather than instances;
- there is visible double-border buildup between adjacent items;
- interior corners remain independently rounded;
- Current and Focused are conflated;
- the group is recreated as tabs with a different anatomy.
