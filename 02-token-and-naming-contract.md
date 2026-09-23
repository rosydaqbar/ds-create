# Token and Naming Contract

Token architecture and token naming are resolved before generation.

# 1. Supported token layers

- Primitive → Semantic
- Primitive → Semantic → Component
- Existing architecture
- Custom architecture

For a mature product library, default to `Primitive → Semantic → Component`, but only introduce component tokens where shared semantic tokens are insufficient.

# 2. Collection naming contract

Variable **collection names** follow one deterministic, brand-agnostic grammar.

Collection naming is separate from token naming.

The token naming preset may change how variables are named inside a collection, but it must **not** change the collection naming style.

## Canonical collection grammar

Use plain human-readable design domains.

Do not prefix collections with architectural abbreviations such as:
- `Ref —`
- `Sys —`
- `Comp —`

Do not use numbering solely to imitate another library.

Do not switch between nouns such as:
- `Primitive` / `Primitives`
- `Dimension` / `Sizing`
- `Component` / `Components`

The generator uses one canonical label for each supported domain.

### Canonical labels

```text
Primitives
Color
Typography
Spacing
Sizing
Radius
Motion
Components
```

Create only the collections that are actually required.

Examples:

Primitive → Semantic:

```text
Primitives
Color
Typography
Spacing
Sizing
Radius
```

Primitive → Semantic → Component:

```text
Primitives
Color
Typography
Spacing
Sizing
Radius
Components
```

If Motion is not used, do not create a Motion collection.

## Domain responsibility

### Primitives

Raw reusable values that are not tied to UI purpose.

Examples:

```text
color/brand/500
color/neutral/900
space/16
size/40
radius/8
font-size/16
```

The exact internal token syntax still follows the selected token naming preset.

### Color

Semantic color roles.

Examples:

```text
text/primary
border/default
background/brand
status/success
signal/excellent
```

A product-specific concept does **not** automatically create a new collection.

If `signal/excellent` is a semantic color role, it belongs inside `Color`, not in a separate `Signal` collection.

### Typography

Semantic typography values and roles when represented as variables.

### Spacing

Semantic or system spacing values.

### Sizing

Widths, heights, control sizes, icon sizes, touch targets, reading widths, and container dimensions that are represented through one shared sizing domain.

If the existing system already separates these into multiple established collections, preserve them when the action is Keep/Audit/Improve.

For a new generated system, do not randomly alternate between `Dimension`, `Size`, `Widths`, `Containers`, or other collection labels across runs.

### Radius

Radius values and semantic radius roles.

### Motion

Motion/duration/easing values only when motion variables are actually part of the system.

### Components

Component-level variables only when the confirmed architecture includes a component-token layer.

Do not create `Components` simply because components exist.

## Product-specific concepts

Product concepts belong as groups/paths inside the relevant design domain unless they genuinely require an independent variable architecture.

Examples:

```text
Color
└─ signal/
   ├─ excellent
   ├─ good
   └─ poor

Components
└─ button/
   ├─ primary/background
   └─ primary/foreground
```

Avoid:

```text
Signal
Button colors
Product states
Misc tokens
Core
Dimension
```

unless the user already has those established collections and explicitly chooses to preserve them.

## Existing-system exception

When the user chooses **Keep existing naming**, preserve established collection names.

When the user chooses **Normalize naming**, migrate collection names toward the canonical domain labels above.

Do not silently rename an existing library during Keep/Audit/Improve.

## Determinism rule

Given the same selected architecture and domains, repeated runs must generate the same collection names and ordering.

Collection names must not be improvised from:
- product name;
- brand name;
- feature name;
- component examples;
- whichever token family was generated first.

# 3. Naming preset selector

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

# 4. Logical references in this package

Specs may use logical role names such as:

```text
text.primary
surface.default
border.error
button.primary.background.hover
```

These are role descriptions, not forced output names. Translate them through the selected naming preset.

# 5. Output formats

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

# 6. Preserve existing public APIs

If a page/component action is `Keep`, `Audit`, or `Improve`, do not rename established public component properties or variable names unless the user explicitly requests normalization.
