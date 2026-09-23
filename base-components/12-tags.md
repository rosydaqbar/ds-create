# Tags

Tags (chips) are compact interactive/content elements used for selections, filtering, removable values, counts, and metadata—especially inside multi-value inputs.

# 1. Figma Page regions

```text
Private
├─ _Tag close X
├─ _Tag count
└─ _Tag checkbox

Published
└─ Tag
```

# 2. Tag

Published set: `Tag`

Observed:
- 72 variants.

Properties:
- Size: sm / md / lg
- Icon: False / Country / Avatar / Dot
- Action: X close / Text only / Count
- Checkbox: False / True
- Flag swap: Instance swap

## Anatomy

```text
Tag
layout: Horizontal
align: Center

├─ _Tag checkbox                       optional
├─ Leading visual                      optional/type-driven
│  ├─ country flag
│  ├─ avatar
│  └─ dot
├─ Content
│  └─ Text
└─ Trailing action                     type-driven
   ├─ _Tag close X
   └─ _Tag count
```

Observed sm baseline:
- compact vertical padding;
- compact horizontal padding;
- small internal gap;
- Hug width.

The text content remains the semantic center of the tag.

# 3. Close helper

Private set: `_Tag close X`

Properties:
- Size: sm / md / lg
- State: Default / Hover

Anatomy:

```text
_Tag close X
└─ x-close icon
```

Use this helper in removable tags. Do not paste a raw close icon into each Tag variant.

# 4. Count helper

Private set: `_Tag count`

Properties:
- Size: sm / md / lg

Anatomy:

```text
_Tag count
└─ Text
```

Count is a compact trailing metadata treatment aligned to the tag size.

# 5. Checkbox helper

Private set: `_Tag checkbox`

Properties:
- Checked: False / True
- Size: sm / md / lg
- State: Default / Hover / Focused / Disabled

The checkbox helper owns the selected/focus/disabled visual treatment for checkable tags.

# 6. Composition rules

Text only:
```text
Tag
└─ Text
```

Removable:
```text
Tag
├─ optional leading visual
├─ Text
└─ _Tag close X
```

Count:
```text
Tag
├─ optional leading visual
├─ Text
└─ _Tag count
```

Selectable:
```text
Tag
├─ _Tag checkbox
├─ optional leading visual
└─ Text
```

Do not combine unrelated trailing actions unless the component property model explicitly permits it.

# 7. Matrix requirements

Show:
- all 3 sizes;
- all leading visual modes;
- all Action modes;
- checkbox false/true;
- checkbox interaction states;
- representative country/avatar swaps.

# 8. Content notes

- tags should remain compact;
- long labels should not force tiny padding/type;
- removable tags need a clear close target;
- checkbox tags must preserve focus visibility;
- country/avatar content is supportive, not the only meaning.


# Documentation

The Figma Page must visibly document:
- when to use Tag versus Badge, filter control, or Button;
- leading visual, text, close/count action, and checkbox/selectable anatomy;
- removable versus selectable behavior;
- size and interaction behavior for close/checkbox helpers;
- label-length, wrapping, and compactness guidance;
- country/avatar visuals as supporting rather than sole meaning;
- keyboard/focus and target-size accessibility for removable/selectable tags;
- do/don't examples for mixed trailing actions, tiny long-label tags, and relying on flag/avatar alone;
- central maintenance through private close/count/checkbox helpers and semantic tokens.

A matrix alone fails documentation QA.

# 9. QA

Fail QA when:
- close/count/checkbox are drawn separately in each variant;
- removable/selectable tags have no explicit interaction helper;
- leading visuals shift label alignment inconsistently;
- the full property matrix is reduced to a handful of chip examples.
