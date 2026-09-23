# Inputs

Input fields allow users to enter data. The page must document the complete field family, not only a generic text field.

Important product note:
- mobile text-entry controls should use a text size that avoids unwanted browser zoom behavior;
- validation, labels, hints, and special adornments remain part of the field anatomy.

# 1. Canvas regions

```text
Private base
├─ _Mega input field base

Public input region
├─ Input field
└─ Textarea input field

Verification region
└─ Verification code input field
```

Headers:
- **Input fields** — text/data-entry controls used in forms and dialogs.
- **Verification code input fields** — large, highly legible fixed-digit entry; longer codes should be visually grouped.

# 2. Input field

Published set: `Input field`

Observed:
- 294 variants.

Properties:
- Label: Boolean
- Hint text: Boolean
- Help icon: Boolean
- Required *: Boolean
- Leading icon: Boolean
- Icon swap: Instance swap
- Time selector: Boolean
- Size: sm / md / lg
- Type:
  - Default
  - Leading dropdown
  - Trailing dropdown
  - Leading text
  - Payment input
  - Tags inner
  - Tags outer
  - Trailing button
  - Password
  - Date and time
  - Number counter horizontal
  - Number counter vertical
  - OTP
  - File upload
- Destructive: False / True
- State: Placeholder / Filled / Focused / Disabled

## Input anatomy

Representative structure:

```text
Input field
layout: Vertical
gap: field-stack gap

├─ Input with label
│  layout: Vertical
│  ├─ Label wrapper                     optional
│  │  layout: Horizontal
│  │  ├─ Label
│  │  ├─ Asterisk                       optional
│  │  └─ Help icon                      optional where configured
│  │
│  └─ Input
│     layout: Horizontal
│     align: Center
│     ├─ Content                        Fill
│     │  layout: Horizontal
│     │  ├─ Leading adornment           optional/type-driven
│     │  └─ Text/value                  Fill
│     └─ Trailing affordance            optional/type-driven
│
└─ Hint text                            optional
```

Observed lg baseline:
- total sample width around 320;
- field stack gap around 6;
- control height around 44;
- control horizontal padding around 14;
- control vertical padding around 10;
- internal content gap around 8;
- common leading icon around 20;
- help icon around 16.

Treat these as proportional baselines; preserve the anatomy if brand type/icon sizes change.

## State logic

Placeholder:
- placeholder content visible;
- neutral field styling.

Filled:
- entered value visible.

Focused:
- field focus treatment;
- remains distinct from hover/default.

Disabled:
- content still legible enough to identify value/purpose;
- interactive affordances disabled.

Destructive:
- semantic error/destructive treatment;
- does not create a separate anatomy.

# 3. Type-specific anatomy

The Type property is not cosmetic. Each type modifies the Content/adornment slots.

Required type logic:

## Default
```text
Input
├─ optional leading icon
├─ text/value
└─ optional help/trailing affordance
```

## Leading dropdown
A compact dropdown/selector precedes the editable content inside the same control.

## Trailing dropdown
Editable content remains Fill; dropdown affordance sits at the trailing edge.

## Leading text
Static prefix text is separated from editable content while remaining inside the field container.

## Payment input
Preserve payment-method/card affordances and their spacing as a composed input type.

## Tags inner
Selected tags live inside the field container and participate in input wrapping/growth.

## Tags outer
Tag composition sits outside the editable field surface according to the variant.

## Trailing button
Trailing action is a real button instance/affordance, not text styled to look clickable.

## Password
Trailing reveal/hide affordance is preserved.

## Date and time
Date/time affordances remain separate from the editable/display value.

## Number counters
Horizontal and vertical counter variants keep increment/decrement controls as dedicated affordances.

## OTP
OTP-specific arrangement stays within the Input field family where configured.

## File upload
Upload affordance remains structurally distinct inside the field type.

# 4. Textarea input field

Published set: `Textarea input field`

Observed:
- 42 variants.

Properties:
- Label
- Hint text
- Required *
- Help icon
- Resize handle
- Size: sm / md
- Type: Default / Tags inner / Tags outer
- Destructive: False / True
- State: Placeholder / Default / Focused / Disabled

Anatomy:

```text
Textarea input field
├─ Input with label
│  ├─ Label wrapper
│  │  ├─ Label
│  │  ├─ Asterisk
│  │  └─ Help icon
│  └─ Input
│     ├─ Multiline text                 Fill
│     └─ Resize handle                  optional
└─ Hint text
```

Representative md baseline:
- field width around 320;
- textarea body height around 128;
- inner padding around 12 vertical / 14 horizontal;
- resize handle sits in the lower trailing corner.

Do not vertically center textarea content.

# 5. Verification-code base

Private set: `_Mega input field base`

Properties:
- Size: sm / md / lg
- State: Placeholder / Focused / Filled / Disabled / Error

Anatomy:

```text
_Mega input field base
layout: Vertical / centered
└─ Digit text
```

This is the reusable digit cell. The public verification component instances this base repeatedly.

# 6. Verification code input field

Published set: `Verification code input field`

Properties:
- Label: Boolean
- Hint text: Boolean
- Size: sm / md / lg
- Digits: 4 / 6

Anatomy:

```text
Verification code input field
layout: Vertical

├─ Input with label
│  ├─ Label
│  └─ Input row
│     layout: Horizontal
│     ├─ _Mega input field base
│     ├─ _Mega input field base
│     ├─ ...
│     └─ _Mega input field base
└─ Hint text
```

Representative md:
- four-digit row uses repeated large cells with a clear horizontal gap;
- six-digit variant may use visual grouping to make the code easier to scan/remember.

Do not make each digit visually tiny just to fit a predetermined width.

# 7. Matrix requirements

Input field matrix must inspect:
- all 3 sizes;
- all 14 input types;
- destructive false/true;
- Placeholder / Filled / Focused / Disabled;
- optional Label / Hint / Required / Help / Leading icon combinations where relevant.

Textarea:
- both sizes;
- all three types;
- destructive states;
- interaction states.

Verification:
- all sizes;
- 4 / 6 digits;
- base-cell states.

# 8. Documentation requirements

The page header must explain:
- purpose of text inputs;
- form/dialog usage;
- mobile text-size consideration;
- verification-code grouping.

Additionally document:
- anatomy of label → control → hint;
- difference between Destructive and interaction State;
- which Type variants modify leading/trailing content;
- how tag-based fields grow;
- how verification cells reuse the private base.



## Mandatory visible documentation region

The documentation requirements above must be rendered as a dedicated Figma notes frame.

It must include:
- when to use each major input Type;
- label → control → hint anatomy and required/help relationships;
- Placeholder, Focused, Filled, Disabled, and Error behavior;
- Destructive versus interaction State;
- leading/trailing adornment behavior and Fill/Hug relationships;
- textarea growth, tag-field growth, OTP/verification grouping, and mobile text-size considerations;
- validation and accessibility guidance including labels, errors, focus, and keyboard/input modes;
- do/don't examples for placeholder-only labeling, flattened special types, and detached verification cells;
- central maintenance notes for the shared field base and semantic tokens.

A header-only explanation does not satisfy this requirement.

# 9. QA

Fail QA when:
- label, required marker, help, control, and hint are flattened into unrelated layers;
- special Type variants are represented only by different text labels;
- the Content region does not Fill while adornments remain fixed/Hug;
- textarea text is vertically centered;
- verification cells are duplicated instead of instancing the base;
- the full 294-variant Input field matrix is replaced with a small showcase.
