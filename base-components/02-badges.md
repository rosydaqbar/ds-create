# Badges

Badges communicate compact secondary information such as status, notification, category, or metadata. The page includes both standalone badges and composed badge groups.

# 1. Figma Page regions

```text
Private helpers
└─ _Badge close X

Published
├─ Badge
└─ Badge group
```

The public header must explain that badges communicate secondary/additional information rather than primary actions.

# 2. Badge

Published set: `Badge`

Observed:
- 666 variants.

Properties:
- Size: sm / md / lg
- Type: Pill color / Badge color / Badge modern
- Icon:
  - False
  - Dot
  - Country
  - X close
  - Avatar
  - Icon trailing
  - Icon leading
  - Only
- Color:
  - Gray
  - Brand
  - Error
  - Warning
  - Success
  - Slate
  - Sky
  - Blue
  - Indigo
  - Purple
  - Pink
  - Orange
- Flag swap: Instance swap
- Leading icon swap: Instance swap
- Trailing icon swap: Instance swap

## Anatomy

Base form:

```text
Badge
layout: Horizontal
align: Center

├─ Leading visual                      optional/type-driven
│  ├─ dot
│  ├─ country flag
│  ├─ avatar
│  └─ leading icon
├─ Text                                optional for Icon=Only
└─ Trailing visual                     optional/type-driven
   ├─ trailing icon
   └─ _Badge close X
```

Observed sm Pill-color baseline:
- compact vertical padding;
- compact horizontal padding;
- Hug width;
- text remains single-line;
- optional visuals change the internal gap rather than creating a new root component.

## Type relationship

Pill color:
- rounded/pill container;
- strongest capsule treatment.

Badge color:
- compact badge treatment with color emphasis.

Badge modern:
- more neutral/modern container treatment;
- still uses the same information hierarchy.

Do not rebuild each type as an unrelated component.

# 3. Badge group

Published set: `Badge group`

Observed:
- 80 variants.

Properties:
- Badge: Leading / Trailing
- Size: md / lg
- Type: Pill color / Badge modern
- Color: Gray / Brand / Error / Warning / Success
- State: Default / Hover
- Icon: Boolean

Anatomy:

```text
Badge group
layout: Horizontal
├─ Badge instance                      leading or trailing
└─ Content
   layout: Horizontal
   ├─ Message                          Fill
   └─ arrow/action icon                optional
```

The group combines a compact badge with a longer message. Keep the badge as an instance; do not recreate its label/style inline.

# 4. Private close helper

Private set: `_Badge close X`

Properties:
- Type: Square / Rounded
- Color: same extended semantic palette
- State: Default / Hover

Anatomy:

```text
_Badge close X
└─ x-close icon
```

It exists to keep close affordance treatment consistent across badge colors.

# 5. Matrix requirements

Badge matrix must show:
- all 3 sizes;
- all 3 badge types;
- all icon/content modes;
- all color families;
- icon-only cases;
- dismissible cases.

Badge group matrix must show:
- leading vs trailing badge;
- md / lg;
- both types;
- all semantic colors;
- Default / Hover.

Do not reduce the 666-variant Badge matrix to a color swatch row.

# 6. Content notes

- badges should stay compact;
- labels should remain concise;
- Dot/Color never replaces meaningful text when status must be understood;
- X-close implies removable content, not a generic action;
- Badge group is for a short status label plus explanatory message.



# Documentation

The Figma Page must visibly document:
- when to use a Badge versus a Tag or ordinary text;
- Badge versus Badge group anatomy and nested-instance relationship;
- Type, Color, Icon, Size, and removable-action behavior;
- semantic color selection and why dot/color cannot be the only status cue;
- concise-label guidance and handling of long labels;
- dismiss behavior and target-size expectations for the close action;
- accessibility for color, text contrast, and removable controls;
- do/don't examples for overlong copy, decorative status colors, and using badges as buttons;
- which private close helper and semantic tokens should be edited centrally.

A header plus matrix is not sufficient documentation.


# Documentation

The Figma Page must visibly document:
- when to use a Badge versus Tag, text label, or Button;
- Badge anatomy: optional dot/icon → text → optional close;
- Badge group anatomy and nested Badge reuse;
- Size, Type, Color, icon/content, and removable behavior;
- semantic color choice and why color/dot alone cannot carry status meaning;
- concise-label guidance and long-label behavior;
- close-action target and accessible naming;
- do/don't examples for badges used as buttons, overlong copy, and decorative status colors;
- central maintenance through the private close helper and semantic tokens.

A matrix alone fails documentation QA.

# 7. QA

Fail QA when:
- Icon variants become separate component sets;
- Badge group duplicates Badge styling instead of instancing Badge;
- extended colors are missing;
- close behavior is not handled by the private helper;
- the matrix does not expose the full Type × Icon × Color relationship.
