# Dropdowns

Dropdown menus group related actions inside a compact subview. Context menus expose secondary actions on context interaction without permanently occupying interface space.

# 1. Page regions

```text
Private construction region
├─ _Dropdown menu header
├─ _Dropdown menu list item
├─ _Dropdown menu item inset icon
├─ _Dropdown menu footer
└─ _Dropdown account list item

Published
├─ Dropdown menu
└─ Context menu
```

Headers:
- **Dropdown menus** — grouped actions/options in a compact subview.
- **Context menus** — quick contextual secondary actions.

# 2. Dropdown menu

Published set: `Dropdown menu`

Observed:
- 28 variants.

Properties:
- Scrollbar: Boolean
- Chevron dropdown: Boolean
- Type:
  - Button simple
  - Button advanced
  - Button link
  - Icon simple
  - Icon advanced
  - Search simple
  - Search advanced
  - Integrations
  - Account button
  - Account avatar
  - Account card xs
  - Account card sm
  - Account card md
  - Account breadcrumb
- Open: False / True

## Anatomy

Closed form contains only its trigger.

Open form:

```text
Dropdown menu
├─ Trigger
└─ Menu
   layout: Vertical
   ├─ optional _Dropdown menu header
   ├─ Menu items
   │  layout: Vertical
   │  ├─ _Dropdown menu list item
   │  ├─ _Dropdown menu list item
   │  ├─ Divider item
   │  └─ ...
   ├─ optional scrollbar
   └─ optional _Dropdown menu footer
```

The open menu is composed from private item/header/footer instances.

# 3. Private menu list item

Private set: `_Dropdown menu list item`

Properties:
- Chevron: Boolean
- Shortcut: Boolean
- Leading icon: Boolean
- Inset icon: True / Default
- State: Default / Hover/active / Open / Disabled
- Divider: False / True

Anatomy:

```text
_Dropdown menu list item
├─ Content
│  layout: Horizontal
│  ├─ Icon and text
│  │  ├─ _Dropdown menu item inset icon
│  │  └─ Text
│  ├─ Shortcut wrapper                 optional
│  └─ Chevron-right                    optional
└─ Divider                             divider variant
```

The text group is the flexible region. Shortcut and chevron remain fixed.

# 4. Inset icon helper

Private set: `_Dropdown menu item inset icon`

Types:
- Spacer
- Icon
- Check
- Checkbox
- Dot
- Avatar
- Integration icon

This helper guarantees consistent leading alignment even when no visual icon is shown.

Do not remove the Spacer type and then manually shift text per row.

# 5. Header helper

Private set: `_Dropdown menu header`

Types:
- Avatar group
- Header
- Subheading
- Search

Supporting text: Boolean.

Avatar-group anatomy:

```text
Header
└─ Avatar label group
   ├─ Avatar
   └─ Text and supporting text
```

Search type reuses the appropriate search/input treatment rather than creating a disconnected search field.

# 6. Footer helper

Private set: `_Dropdown menu footer`

Types:
- Text
- Button

Keep footer padding/content alignment consistent with menu width.

# 7. Account list item

Private set: `_Dropdown account list item`

State:
- Default
- Hover/active

Anatomy:

```text
Account item
└─ Content
   ├─ Avatar wrapper
   │  └─ Avatar
   ├─ Text and supporting text         Fill
   └─ Checkbox / selected control
```

# 8. Context menu

Published set: `Context menu`

Properties:
- Type: Simple / Advanced
- Open: False / True

Closed state may show only the context trigger/cursor specimen in the library.

Open state uses the same menu-item construction principles as Dropdown menu.

# 9. Matrix requirements

Dropdown menu:
- every Type;
- Open false/true;
- scrollbar and chevron options;
- account and integration cases.

Private list item:
- all states;
- all inset-icon types;
- shortcut/chevron/divider combinations.

Context menu:
- Simple / Advanced;
- closed/open.



## Mandatory notes/documentation region

The Figma page must visibly document:
- when to use Dropdown menu versus Context menu;
- menu trigger/open-state relationship;
- private list-item, inset-icon, header, footer, and account-item anatomy;
- alignment behavior across rows with and without leading content;
- selected/check/checkbox/dot/avatar cases;
- keyboard navigation, focus, escape/close expectations, and menu labeling;
- destructive or high-risk action placement when applicable;
- do/don't examples for clipping menus, hand-building rows, and mixing unrelated alignment systems;
- which private list-item/helper families and semantic tokens should be maintained centrally.

A menu matrix without visible usage/anatomy notes fails QA.

# 10. QA

Fail QA when:
- menu rows are manually drawn instead of using the private list-item set;
- leading content loses alignment between icon/no-icon rows;
- divider becomes a separate arbitrary line outside the item rhythm;
- account items do not reuse Avatar/Checkbox;
- open menu content is clipped;
- only a single generic menu style is generated.
