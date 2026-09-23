# Sliders

Sliders let users select one value or a range along a continuous/discrete axis and are useful for dynamic filtering.

# 1. Page regions

```text
Private
└─ _Control handle

Published
└─ Slider
```

# 2. Slider

Published set: `Slider`

Observed:
- 30 variants.

Properties:
- Label: False / Bottom / Top floating
- Right control: 25% / 50% / 75% / 100%
- Left control: 0% / 25% / 50% / 75%

Anatomy:

```text
Slider
positioned composition
├─ Background track
└─ Progress
   ├─ Progress line
   ├─ _Control handle                  left
   └─ _Control handle                  right
```

The Progress region spans from left-control value to right-control value.

Do not draw every range variant as unrelated shapes.

# 3. Control handle

Private set: `_Control handle`

Observed:
- 9 variants.

Properties:
- State: Default / Hover / Focused
- Type: False / Text / Tooltip

Anatomy:

```text
_Control handle
├─ Handle
└─ Value presentation                  type-driven
   ├─ Text
   └─ Tooltip
```

Handle stays centered on its logical value position.

# 4. Label positioning

False:
- only handles/track.

Bottom:
- value labels below.

Top floating:
- floating tooltip/value above the active handle.

Label treatment changes presentation only; slider range geometry remains the same.

# 5. Matrix requirements

Show:
- supported left/right combinations;
- all label types;
- handle Default/Hover/Focused;
- single-value-like and range examples.


# Documentation

The Figma page must visibly document:
- when Slider is appropriate and when a discrete control is clearer;
- single-value versus range use;
- track, progress line, and reusable handle anatomy;
- label modes: none, bottom, and top-floating/tooltip;
- min/max/value communication and logical handle positioning;
- keyboard interaction, focus visibility, touch target, and accessible value naming;
- why sliders should not be used to display measured signal strength;
- do/don't examples for unlabeled ranges, shifting handles when labels appear, and unrelated per-value drawings;
- central maintenance through the handle helper, track tokens, and state tokens.

A matrix alone fails documentation QA.

# 6. QA

Fail QA when:
- range endpoints are not reusable handle instances;
- changing label type shifts the logical value position;
- progress line does not start/end at handles;
- focus state is missing.
