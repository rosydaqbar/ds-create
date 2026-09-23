# ↳ Color

> **Initiator gate:** Execute this specification only when Color is in scope. If a color system already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing values or names. Actual token names must follow the naming system selected in the initiator.

# 1. Required Figma frames

The Color page is documented with up to three complete top-level frames:

```text
Colors                         2848 px wide
Color variables                2528 px wide
Color notes                    1600 px wide, optional
```

Arrange them left-to-right with `240 px` canvas gaps.

Do not create a `Color source` utility board.

Do not present semantic colors as floating token chips.

# 2. Colors — overview frame

## 2.1 Frame

```text
Name: Colors
Width: 2848
Layout: Vertical Auto Layout
Background: white
```

Structure:

```text
Colors
├─ Design system header
├─ Section
│  ├─ Base colors
│  └─ Color palettes
└─ Design system footer
```

The header uses `01-documentation-system.md` exactly.

The hero description should explain, in 1–3 short paragraphs:

- that this page contains the raw color scales used by the system;
- that primitive colors are not chosen directly in product components when a semantic variable exists;
- how modes/theming are handled if relevant;
- that the specific hues come from the confirmed brand/product inputs.

Do not mention any external reference system.

## 2.2 Base colors section

Top-level section settings:

```text
Section padding: 80
Section gap: 64
Content width: 2688
```

Start with:

```text
Design note
Width: 720
Heading: Base colors
Supporting text: explain that these are mode-independent primitive values used to construct the rest of the palette.
```

After `64 px`, show base-color rows.

### Base row

```text
Row width: 2688
Row layout: Horizontal
Gap: 64
```

Left note:

```text
Width: 480
Heading: Base
Supporting text: White, black, and transparent values used as raw primitives where appropriate.
```

Right swatches:

```text
Width: 2144
Gap: 32
```

Show only values that genuinely exist, normally:

```text
White
Black
Transparent
```

### Brand row

Left note:

```text
Heading: Brand
Supporting text: Primary brand scale used to construct interactive, accent, and brand-surface roles. Values come from the brand input or generated brand scale.
```

Right side shows the complete brand primitive scale using `_Doc / Swatch`.

### Neutral row

Use one neutral row when the brand/system has a neutral scale.

Supporting copy should explain that the neutral scale supports the majority of text, borders, surfaces, disabled states, and structural UI.

### Semantic hue rows

Add rows only for hues that exist in the confirmed system.

Common examples:

```text
Error / negative
Warning
Success / positive
Information
```

Do not force red/orange/yellow/green/blue/purple families when they are not required by the brand/product.

## 2.3 Palette-row measurements

Every palette row follows:

```text
Left Design note: 480 wide
Gap: 64
Swatches region: 2144 wide
Swatch width: 160
Swatch height: 156
Swatch gap: 32
Vertical gap between rows: 64
```

Use meaningful scale labels from the selected naming ecosystem.

Examples:

```text
50, 100, 200 ... 950
100, 200 ... 1000
sm, md, lg      only if that ecosystem actually uses those names for the palette
```

Never replace an established scale with `1, 2, 3, 4...` just because it is easier to generate.

# 3. Swatch card content

Every primitive color swatch uses the standard `160 × 156` anatomy from `01-documentation-system.md`.

Required information:

```text
Top visual area
  Color fill
  Contrast ratio/grade when relevant

Bottom content
  Scale/token step
  Resolved value (hex or color format used by the system)
```

For contrast text:

- calculate against the appropriate default text/background pair;
- show `AA`/`AAA` only when the result is actually calculated;
- omit the grade if the contrast context is ambiguous rather than inventing one.

# 4. Color variables — specification frame

## 4.1 Frame

```text
Name: Color variables
Width: 2528
Layout: Vertical Auto Layout
Background: white
```

Structure:

```text
Color variables
├─ Design system header
├─ Section
│  ├─ Text color
│  ├─ Border color
│  ├─ Foreground color
│  └─ Background color
└─ Design system footer
```

Only add an additional family when the system genuinely contains it.

## 4.2 Header copy

Heading:

`Color variables`

Supporting copy should explain, concisely, that color variables are reusable values that centralize fill/stroke color decisions, support modes, and keep component styling consistent.

Do not describe variables as decorative palette samples; this page documents actual semantic usage.

# 5. Variable-section anatomy

Every variable family is a `Content` block:

```text
Content
├─ Design note                 720 wide
└─ Table                       2368 wide
```

Gap between note and table: `64`.

## 5.1 Text color

Design note:

```text
Heading: Text color
Badge: Variables
Supporting text: Explain that these variables control text fills across hierarchy, brand surfaces, interaction states, semantic states, and supported modes.
```

Required table columns for Light + Dark systems:

```text
Name        400
Light       212
Dark        212
Usage       1544
```

Representative logical roles may include:

```text
text.primary
text.secondary
text.secondary.hover
text.tertiary
text.tertiary.hover
text.quaternary
text.inverse
text.placeholder
text.brand.primary
text.brand.secondary
text.error
text.warning
text.success
```

Do **not** force these literal names. Translate them into the selected naming ecosystem or preserve the existing system.

Each row includes a concrete Usage sentence, for example:

```text
Primary text for page titles, high-emphasis headings, and key content labels.
Secondary text for field labels, section headings, and supporting interface copy.
Placeholder text inside editable controls; keep sufficient contrast for readability.
Error text for validation messages and destructive-state feedback.
```

## 5.2 Border color

Design note:

```text
Heading: Border color
Badge: Variables
Supporting text: Explain that these variables control stroke colors across controls, dividers, containers, active states, and semantic states in each mode.
```

Representative roles:

```text
border.primary
border.secondary
border.tertiary
border.brand
border.error
border.error.subtle
```

Usage copy must state actual component contexts such as input fields, button groups, cards, dividers, floating menus, or validation states.

## 5.3 Foreground color

Design note:

```text
Heading: Foreground color
Badge: Variables
Supporting text: Explain that these variables control non-text foreground elements such as icons, controls, indicators, and decorative UI marks across modes.
```

Representative roles:

```text
foreground.primary
foreground.secondary
foreground.secondary.hover
foreground.tertiary
foreground.brand.primary
foreground.brand.secondary
foreground.error
foreground.warning
foreground.success
```

## 5.4 Background color

Design note:

```text
Heading: Background color
Badge: Variables
Supporting text: Explain that these variables control page, container, raised, overlay, brand, semantic, and interaction-state surfaces across modes.
```

Representative roles:

```text
background.primary
background.secondary
background.tertiary
background.raised
background.brand
background.brand.hover
background.error
background.warning
background.success
```

# 6. Variable-table row requirements

Every data row must show:

```text
Name
Resolved value or alias in each active mode
Usage
```

Name cell:

```text
Outlined token badge
Height: 32
Padding: 4 / 12
Radius: 6
Text: 16 / 24
```

Mode/value cell:

```text
Color preview
Alias/primitive name
Text: 16 / 24
```

Usage cell:

```text
Text: 16 / 24
Concrete, context-specific sentence
```

Do not create a semantic token unless you can write a distinct usage description for it.

# 7. Light and dark modes

If Light and Dark are required:

- every semantic color row must resolve in both modes;
- primitive palette values remain mode-independent unless the selected naming architecture explicitly models otherwise;
- mode columns must show the resolved alias/value, not just a duplicated semantic token name;
- documentation must make intentionally fixed colors clear (for example, a color that remains white in both modes).

If only one mode exists, use:

```text
Name | Value | Usage
```

and resize the table accordingly. Do not show fake mode columns.

# 8. Color notes — optional long-form frame

Create `Color notes` only when the initiator requests deeper documentation or when the generated system needs rationale that is not obvious from the palette/table itself.

Use the `1600 px` long-form documentation pattern.

Keep it concise. Recommended sections:

```text
Defining the palette
Neutral, brand, accent, and semantic roles
Contrast and accessibility
Choosing aliases for modes
Where designers should use primitives vs semantic variables
How to change the palette safely
```

Use examples/screenshots when they clarify a decision. Do not write a generic color-theory essay.

# 9. Accessibility

Validate:

- readable text/background pairs against applicable WCAG contrast thresholds;
- interactive focus visibility;
- semantic states do not rely only on hue;
- placeholder/supporting text remains legible;
- Light and Dark mode mappings preserve hierarchy;
- every documented contrast ratio is calculated from the actual resolved values.

# 10. QA

Before considering Color complete:

- no missing primitive values referenced by semantic variables;
- no broken aliases;
- no invented palette families unrelated to the brand/product;
- no arbitrary `1–12` swatch labels when a real naming scale exists;
- no semantic token list without Usage descriptions;
- no light/dark table unless both modes exist;
- overview and variable frames use the exact documentation geometry defined in `01-documentation-system.md`;
- no generic source-board/token-chip presentation remains on the page.