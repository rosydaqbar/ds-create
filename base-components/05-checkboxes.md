# Checkboxes

Checkboxes allow one or more selections; radio controls allow one selection from a set. This page deliberately shares a common base for checkbox and radio visual controls.

# 1. Page regions

```text
Private
└─ _Checkbox base

Published
└─ Checkbox
   supports Checkbox and Radio visual types
```

# 2. Private control base

Private set: `_Checkbox base`

Observed:
- 40 variants.

Properties:
- Checked: False / True
- Indeterminate: False / True
- Size: sm / md
- Type: Checkbox / Radio
- State: Default / Hover / Focused / Disabled

Anatomy:

```text
_Checkbox base
├─ control surface
└─ mark
   ├─ check                           checkbox selected
   ├─ minus                           checkbox indeterminate
   └─ dot                             radio selected
```

Unchecked/default variants may contain no mark child.

The private base owns:
- shape;
- border;
- selected fill;
- focus ring;
- disabled treatment;
- check/minus/dot alignment.

# 3. Published Checkbox

Published set: `Checkbox`

Observed:
- 72 variants.

Properties:
- Supporting text: Boolean
- Checked: False / True
- Indeterminate: False / True
- Size: sm / md
- Type: Checkbox / Radio
- Text: False / True
- State: Default / Hover / Focused / Disabled

Anatomy with text:

```text
Checkbox
layout: Horizontal
align: Start

├─ Input
│  top inset aligns control to first text line
│  └─ _Checkbox base
└─ Text and supporting text
   layout: Vertical
   ├─ Text
   └─ Supporting text                  optional
```

Observed sm text baseline:
- root gap around 8;
- control around 16;
- input wrapper offsets the control slightly from the top so it optically aligns to the label line;
- text stack expands.

Do not vertically center the control against a multi-line description.

# 4. Selection logic

Checkbox:
- supports unchecked;
- checked;
- indeterminate.

Radio:
- uses the same private base but radio geometry/mark;
- indeterminate is not a meaningful end-state for a radio selection and should not be exposed in product use even if the construction matrix can represent shared axes.

# 5. Matrix requirements

Show:
- Checkbox and Radio types;
- both sizes;
- Checked false/true;
- Indeterminate where applicable;
- Text on/off;
- Supporting text on/off;
- Default / Hover / Focused / Disabled.



# Documentation

The Figma page must visibly document:
- checkbox versus radio semantics and when each is appropriate;
- unchecked, checked, and indeterminate behavior;
- why indeterminate is not a product end-state for radio controls;
- control → label → supporting-text anatomy and top alignment for multi-line copy;
- size and interaction states including Focused and Disabled;
- label/content guidance and click/tap target expectations;
- keyboard/focus and non-color selection cues;
- do/don't examples for using checkboxes for single-choice tasks, centering against multi-line copy, and hiding labels;
- which private base and semantic state tokens should be edited centrally.

The component matrix does not replace these notes.


# Documentation

The Figma page must visibly document:
- Checkbox versus Radio semantics and when each is appropriate;
- unchecked, checked, and indeterminate states;
- why indeterminate is not a meaningful product end-state for Radio;
- control → label → supporting-text anatomy and top alignment for multi-line copy;
- Size and Default/Hover/Focused/Disabled behavior;
- label/content and click/tap target guidance;
- keyboard/focus and non-color selection cues;
- do/don't examples for checkbox-as-single-choice, hidden labels, and vertically centered multi-line controls;
- central maintenance through the private control base and semantic state tokens.

A matrix alone fails documentation QA.

# 6. QA

Fail QA when:
- Checkbox and Radio use unrelated bases;
- indeterminate mark is missing;
- text stack is not top-aligned to the control;
- supporting text changes the control position unpredictably;
- focus state is omitted from the private base.
