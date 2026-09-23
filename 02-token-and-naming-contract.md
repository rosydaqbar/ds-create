# Token and Naming Contract

Token architecture and token naming are resolved before generation.

# 1. Supported token layers

- Primitive → Semantic
- Primitive → Semantic → Component
- Existing architecture
- Custom architecture

For a mature product library, default to `Primitive → Semantic → Component`, but only introduce component tokens where shared semantic tokens are insufficient.

# 2. Naming preset selector

The initiator must offer these established ecosystems as presets:

## Keep existing naming

Inspect the user's current Figma variables, token JSON, CSS variables, theme files, and code constants. Continue the established convention without migration unless migration is explicitly requested.

## Atlassian-style semantic naming

Representative structure:

```text
color.text
color.text.subtle
color.background.neutral
color.background.neutral.hovered
space.100
space.200
radius.medium
```

## Tailwind-style scale naming

Representative structure:

```text
color-slate-500
color-blue-600
spacing-4
spacing-8
radius-md
text-sm
font-weight-semibold
```

## Material-style system/component hierarchy

Representative structure:

```text
sys.color.primary
sys.color.on-primary
sys.shape.corner.full
sys.typescale.body-medium
filled-button.container.color
```

## Ant-style alias naming

Representative structure:

```text
colorPrimary
colorBgContainer
borderRadiusSM
fontSizeLG
controlHeight
```

## Spectrum-style descriptive naming

Representative structure:

```text
gray-100
component-height-100
negative-border-color-default
tooltip-maximum-width
```

Also provide:
- Custom
- Import from Figma
- Import from token JSON
- Import from code/theme configuration

# 3. Logical references in this package

Specs may use logical role names such as:

```text
text.primary
surface.default
border.error
button.primary.background.hover
```

These are role descriptions, not forced output names. Translate them through the selected naming preset.

# 4. Output formats

Support selection of:
- Figma Variables
- CSS custom properties
- Tailwind theme
- JSON
- DTCG JSON
- JavaScript / TypeScript
- Android
- iOS

Naming taxonomy and output syntax are separate concerns.

# 5. Preserve existing public APIs

If a page/component action is `Keep`, `Audit`, or `Improve`, do not rename established public component properties or variable names unless the user explicitly requests normalization.
