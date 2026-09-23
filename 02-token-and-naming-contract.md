# Token and Naming Contract

Token architecture and token naming are resolved by the initiator before generation.

This file defines:
1. the supported token layers;
2. how logical token roles are referenced by specification files;
3. how the selected established naming system is applied;
4. how existing naming is preserved.

---

# 1. Token layers

Supported architectures:

## Primitive → Semantic

```text
Primitive
  ↓
Semantic
```

## Primitive → Semantic → Component

```text
Primitive
  ↓
Semantic
  ↓
Component
```

## Existing architecture

Inspect and continue the structure already established by the user's library/codebase.

## Custom

Use the structure explicitly supplied by the user.

---

# 2. Logical token references inside this package

Foundation and Component Markdown files use logical role references such as:

```text
text.primary
surface.default
border.negative
button.strong.surface.hover
field.border.error
space.component.control.inline.md
```

These logical references describe **meaning**.

They do not force the final variable syntax.

The selected naming preset translates them into the actual Figma/code token names.

---

# 3. Token naming selector

The initiator offers these naming systems.

## A. Keep Existing Naming

**Preferred whenever the user already has an established token system.**

Inspect:
- Figma variable collections;
- token JSON;
- CSS variables;
- Tailwind theme;
- code constants;
- existing documentation.

Infer:
- hierarchy;
- category names;
- semantic vocabulary;
- scale names;
- casing;
- delimiters;
- state vocabulary.

Then continue that convention.

Do not migrate existing names unless the user explicitly asks for a naming migration.

---

## B. Atlassian Design System style

Representative naming pattern:

```text
color.text
color.text.subtle
color.background.neutral
color.background.neutral.hovered
color.background.danger.bold
color.icon.success

space.050
space.100
space.200
space.300

radius.small
radius.medium
radius.large
```

Use when the user wants a semantic, usage-oriented token vocabulary.

The generator should adapt the vocabulary to the actual product instead of copying unrelated product-specific tokens.

---

## C. Tailwind CSS style

Representative naming pattern:

```text
color-slate-50
color-slate-500
color-blue-600

spacing-1
spacing-2
spacing-4
spacing-8

radius-sm
radius-md
radius-lg

text-sm
text-base
text-lg

font-weight-medium
font-weight-semibold
```

Use when the user wants a utility/scale-oriented foundation compatible with Tailwind mental models.

Semantic/component aliases may still be introduced if the selected token architecture requires them.

Do not pretend a primitive utility name such as `blue-600` is itself semantic.

---

## D. Material Design 3 style

Representative hierarchy:

```text
sys.color.primary
sys.color.on-primary
sys.color.primary-container
sys.color.surface

sys.shape.corner.full

sys.typescale.body-medium
sys.typescale.title-large
```

Representative component-token structure:

```text
filled-button.container.color
filled-button.label-text.color
checkbox.selected.container.color
slider.active-track.color
```

Use when the user wants an explicit system/component token hierarchy with strong theming support.

---

## E. Ant Design style

Representative pattern:

```text
colorPrimary
colorError
colorBgBase
colorBgContainer
colorBgElevated

borderRadius
borderRadiusSM
borderRadiusLG

fontSize
fontSizeSM
fontSizeLG

controlHeight
controlHeightSM
```

Use when the user wants compact camelCase naming and a Seed → Map → Alias → Component style model.

---

## F. Adobe Spectrum style

Representative pattern:

```text
gray-100
gray-800
component-height-100
corner-radius-75
negative-border-color-default
accent-visual-color
tooltip-maximum-width
divider-thickness-small
```

Use when the user wants relatively flat, explicit, descriptive token names.

---

# 4. Selection priority

Resolve naming in this order:

```text
1. Keep Existing Naming, when selected
2. Explicit user-supplied custom convention
3. Selected established preset
```

Never auto-convert an established system to another preset merely because a preset exists.

---

# 5. Token output formats

Naming taxonomy and output syntax are separate.

A logical or Figma token may compile to:
- Figma Variables;
- CSS custom properties;
- Tailwind theme;
- JSON;
- DTCG JSON;
- JavaScript;
- TypeScript;
- Android resources/tokens;
- iOS tokens.

Example conceptual token:

```text
color.background.brand.hovered
```

Possible CSS representation:

```text
--color-background-brand-hovered
```

Changing platform syntax must not change token meaning.

---

# 6. Primitive tokens

Primitive tokens describe raw values.

Examples shown in this specification are logical examples only:

```text
color.neutral.900
space.4
radius.2
size.control.40
```

Under a selected naming ecosystem, their actual names may differ.

Primitive names do not describe UI purpose.

---

# 7. Semantic tokens

Semantic tokens describe UI role.

Logical examples:

```text
surface.default
surface.subtle
text.primary
text.muted
border.default
border.strong
focus.ring
feedback.negative
```

Semantic color roles resolve across required modes.

---

# 8. Component tokens

Create component tokens only when shared semantic tokens are insufficient.

Logical examples:

```text
button.strong.surface.rest
field.border.error
switch.track.on
```

Do not create component tokens merely to rename a semantic token.

---

# 9. Component naming

Published component sets use singular nouns:

- `Button`
- `Checkbox`
- `Text Input`
- `Badge`

Subcomponents use slash hierarchy:

- `Tabs / Item`
- `Tabs / List`
- `Menu / Item`
- `Menu / Group label`

Private construction components begin `_`:

- `_Field / Message`
- `_Button / Spinner`

Component naming is separate from token naming.

---

# 10. Layer names

Use role names, not appearance names.

Correct:
- `Leading icon`
- `Label`
- `Supporting text`
- `Track`
- `Thumb`

Incorrect:
- `Gray box`
- `Purple icon`
- `Rectangle 54`

---

# 11. Component property naming

Use human-readable property names:

- `Size`
- `Emphasis`
- `State`
- `Leading icon`
- `Trailing icon`
- `Selected`
- `Disabled`
- `Validation`

Do not automatically rename an established public component API when the action is Keep/Audit.

---

# 12. State vocabulary

Default package vocabulary:

- Rest
- Hover
- Pressed
- Focus
- Disabled
- Loading

Selection controls additionally use:
- Unselected
- Selected
- Indeterminate

Fields additionally use:
- Empty
- Filled
- Read only
- Error
- Success

When continuing an established system, preserve its valid state vocabulary unless the user explicitly requests normalization.

---

# 13. Size vocabulary

Default component size vocabulary:

- `SM`
- `MD`
- `LG`

Use `XS` or `XL` only when product requirements need them.

If an existing design system uses a different established size vocabulary, preserve it when the action requires compatibility.

---

# 14. Resizing vocabulary

Every component specification declares:
- root width behavior: Hug / Fill / Fixed;
- root height behavior;
- minimum width/height;
- child width behavior;
- text wrapping behavior;
- clipping behavior.

No component is complete until resizing is documented.