# Tooltips

Tooltips describe or identify interface elements, especially icons or images whose meaning is not obvious from the visible UI alone.

# 1. Public families

```text
Tooltips
├─ Tooltip
└─ Help icon
```

# 2. Tooltip

Published set: `Tooltip`

Observed:
- 14 variants.

Properties:
- Text: editable text property
- Supporting text: False / True
- Arrow:
  - None
  - Bottom left
  - Bottom right
  - Left
  - Right
  - Bottom center
  - Top center

## Anatomy

```text
Tooltip
layout: Vertical

├─ Content
│  layout: Vertical
│  padding: tooltip inset
│  └─ Text and supporting text
│     layout: Vertical
│     ├─ Text
│     └─ Supporting text                optional
└─ Tooltip arrow                        position/type driven
```

Representative supporting-text form:
- content surface contains primary and supporting text;
- supporting-text gap is compact;
- arrow is a separate shape aligned to the selected edge.

Do not draw arrow variants into separate unrelated surfaces.

# 3. Help icon

Published set: `Help icon`

Observed:
- 28 variants.

Properties:
- Cursor: Boolean
- Open: False / True
- Supporting text: False / True
- Tooltip:
  - Top no arrow
  - Top arrow
  - Left
  - Top left
  - Bottom
  - Right
  - Top right

Closed anatomy:

```text
Help icon
└─ help-circle icon
```

Open anatomy:

```text
Help icon
├─ help-circle icon
├─ Tooltip instance
└─ Cursor specimen                      optional/documentation
```

Help icon composes the Tooltip family rather than duplicating its text/surface anatomy.

# 4. Content rules

- tooltip title should be concise;
- supporting text is optional and should remain short enough for transient reading;
- do not move essential workflow instructions exclusively into a tooltip;
- tooltip placement may adapt in implementation, but the library preserves all placement specimens.

# 5. Matrix requirements

Tooltip:
- supporting text false/true;
- every arrow placement.

Help icon:
- open/closed;
- all tooltip placements;
- supporting text on/off;
- cursor on/off where documented.


# Documentation

The Figma page must visibly document:
- when Tooltip is appropriate and what information must remain directly visible in the UI;
- tooltip surface/text/arrow anatomy;
- Help icon → Tooltip composition;
- placement variants and collision/adaptation expectations in implementation;
- concise title/supporting-text guidance;
- hover, focus, keyboard, and touch considerations;
- do/don't examples for essential instructions hidden only in tooltips, long paragraphs, and inaccessible hover-only triggers;
- central maintenance through the Tooltip family rather than duplicated tooltip anatomy inside Help icon.

A placement matrix alone fails documentation QA.

# 6. QA

Fail QA when:
- arrow is baked into unrelated component duplicates;
- Help icon recreates the tooltip instead of instancing it;
- supporting text uses a second typography/layout system;
- open state cannot show each documented placement.
