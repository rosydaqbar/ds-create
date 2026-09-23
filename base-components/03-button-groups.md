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



## Mandatory notes/documentation region

The Figma page must visibly document:
- when a Button group is appropriate versus tabs, radio groups, or independent buttons;
- the private-base → published-group anatomy;
- Current versus Hover/Focused behavior;
- connected-edge, shared-border, and corner-merging rules;
- text, leading-icon, and icon-only compositions;
- keyboard/focus expectations for each item;
- do/don't examples for multiple simultaneous Current items, doubled borders, and broken interior radii;
- which private base, border token, radius token, and state styling should be maintained centrally.

A matrix alone fails documentation QA.


## Mandatory visible documentation region

The Figma page must visibly document:
- when Button group is appropriate versus tabs, radio groups, or independent buttons;
- private base → published group anatomy;
- Size, Icon, Current, Hover, Focused, and Disabled behavior;
- connected-edge border merging and outer-corner logic;
- text, leading-icon, and icon-only composition;
- keyboard/focus behavior for each item;
- do/don't examples for multiple Current items, doubled borders, and rounded interior corners;
- central maintenance through the private base, border token, radius token, and state tokens.

A matrix alone fails documentation QA.

# 5. QA

Fail QA when:
- group items are hand-built rather than instances;
- there is visible double-border buildup between adjacent items;
- interior corners remain independently rounded;
- Current and Focused are conflated;
- the group is recreated as tabs with a different anatomy.
