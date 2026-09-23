# Select

Select components allow selection from a potentially large set of options. Multi-select supports choosing multiple values and searching/filtering the available options.

# 1. Page regions

```text
Private
├─ _Select menu item
├─ _Multi-select menu item
└─ _Scroll bar (control fill with bottom padding)

Published
├─ Select
└─ Multi-select
```

# 2. Select

Published set: `Select`

Observed:
- 90 variants.

Properties:
- Label: Boolean
- Hint text: Boolean
- Supporting text: Boolean
- Scroll bar: Boolean
- Required *: Boolean
- Help icon: Boolean
- Shortcut: Boolean
- Icon swap: Instance swap
- Size: sm / md / lg
- Type:
  - Default
  - Icon leading
  - Avatar leading
  - Dot leading
  - Search
  - Tags
- State:
  - Placeholder
  - Default
  - Focused
  - Open
  - Disabled

## Trigger anatomy

```text
Select
layout: Vertical
├─ Input with label
│  ├─ Label wrapper
│  │  ├─ Label
│  │  ├─ Asterisk                     optional
│  │  └─ Help icon                    optional
│  └─ Input
│     layout: Horizontal
│     ├─ Content                       Fill
│     │  └─ Text/supporting/leading visual
│     └─ Chevron-down                  Fixed
├─ Hint text                           optional
└─ Menu                                Open state only
   ├─ _Select menu item
   ├─ ...
   └─ Scroll bar                       optional
```

The open state extends the component with a menu; it is not a separate component.

# 3. Select menu item

Private set: `_Select menu item`

Observed:
- 72 variants.

Properties:
- Supporting text: Boolean
- Icon swap
- Size: sm / md / lg
- Selected: False / True
- Type: Default / Icon leading / Avatar leading / Dot leading
- State: Default / Hover / Disabled

Anatomy:

```text
_Select menu item
└─ Content
   layout: Horizontal
   ├─ leading visual                   type-driven
   ├─ Text and supporting text         Fill
   └─ selected affordance              when selected
```

Text/supporting content remains aligned across different leading visual types.

# 4. Multi-select

Published set: `Multi-select`

Observed:
- 21 variants.

Properties:
- Label
- Hint text
- Supporting text
- Scroll bar
- Required *
- Help icon
- Size: sm / md / lg
- State:
  - Default
  - Active
  - Focused
  - Open default
  - Open active
  - Search empty state
  - Disabled

Anatomy follows Select but the input content can contain multiple selected values/tags and open menu items use checkbox selection.

# 5. Multi-select menu item

Private set: `_Multi-select menu item`

Properties:
- Supporting text: Boolean
- Size: sm / md / lg
- State: Default / Hover / Disabled

Anatomy:

```text
_Multi-select menu item
└─ Content
   ├─ Checkbox
   └─ Text and supporting text         Fill
```

# 6. Scrollbar helper

Standalone private component:
`_Scroll bar (control fill with bottom padding)`

Anatomy:

```text
Scroll bar
layout: Vertical
padding around rail
└─ Bar
```

Its bottom padding can reserve space for content/controls.

# 7. Matrix requirements

Select:
- all 3 sizes;
- all 6 types;
- all 5 states;
- selected menu-item variants;
- label/hint/help/required options.

Multi-select:
- all 3 sizes;
- all 7 states;
- checkbox menu items;
- empty search state.



## Mandatory notes/documentation region

The Figma page must visibly document:
- when to use Select versus Multi-select;
- trigger → menu anatomy and private option-row reuse;
- Default/Hover/Focused/Disabled/Error/open behavior as represented by the generated family;
- icon/avatar/dot/leading-content alignment;
- selected-value growth, wrapping, and multi-select checkbox behavior;
- search, empty-state, and scrollbar behavior when present;
- keyboard navigation, focus, labeling, and announced selected values;
- do/don't examples for detached dropdowns, hand-built menu items, and clipping long selected values;
- which private item helpers, scrollbar helper, and semantic tokens should be maintained centrally.

A component matrix alone fails documentation QA.

# 8. QA

Fail QA when:
- Open becomes a detached dropdown component;
- menu items are manually duplicated;
- leading icon/avatar/dot variants lose common text alignment;
- Multi-select uses single-select menu items without checkbox anatomy;
- selected values cannot grow/wrap according to composition needs.
