# Design System Initiator Questionnaire

This questionnaire is used before generating, extending, or auditing a design system.

Its purpose is to determine:

1. what the brand is;
2. what the product is;
3. what already exists;
4. what the user actually wants to build;
5. which token architecture and naming system should be followed;
6. which visual-system decisions are already established;
7. which parts should be preserved, audited, extended, or rebuilt.

The initiator must never assume the user is starting from zero.

---

# 1. PRODUCT CONTEXT

## 1.1 What are we building this design system for?

**Type:** Single select

- Existing product
- New product
- Multiple products under one brand
- Brand-wide system
- Internal tool
- Design system only / no product yet
- Other

### Conditional behavior

If the user selects **Existing product**, immediately inspect what already exists before proposing new foundations or components.

---

## 1.2 Product information

**Type:** Short text / optional links

Ask for:

- Product name
- One-sentence product description
- Product URL, if available
- Figma product file, if available
- Existing design-system/library file, if available
- Existing codebase or component-library reference, if available

### Example

> A B2B operations platform used by logistics teams to manage warehouses, shipments, and inventory.

---

## 1.3 Who primarily uses the product?

**Type:** Multi-select

- General consumers
- Internal employees
- Business users
- Enterprise users
- Creators
- Developers
- Students
- Teachers
- Healthcare professionals
- Finance users
- Operations teams
- Administrators
- Other

Then ask:

> What are the main tasks these users need to complete?

**Type:** Short free text

---

## 1.4 What platforms must the design system support?

**Type:** Multi-select

- Responsive web
- Desktop web
- Mobile web
- iOS
- Android
- Tablet
- Desktop app
- TV / large-screen UI
- Other

### Why this matters

Platform selection affects:

- interaction states;
- touch targets;
- responsive behavior;
- component density;
- typography;
- navigation patterns;
- hover availability;
- accessibility requirements.

---

# 2. BRAND CONTEXT

## 2.1 How established is the brand?

**Type:** Single select

- Established
- Partially established
- New brand
- No brand layer needed
- Not sure

### Definition

**Established**  
The product already has a clear visual identity and existing brand assets.

**Partially established**  
Some brand assets exist, but the visual system is incomplete or inconsistent.

**New brand**  
The design system may need to establish the initial UI expression of the brand.

**No brand layer needed**  
The system is primarily functional, internal, or white-label.

---

## 2.2 Which brand assets already exist?

**Type:** Multi-select with status

Each item should support:

- Available
- Partial
- Missing
- Not needed

Items:

- Logo
- Brand colors
- Neutral palette
- Typography
- Iconography
- Illustration style
- Photography style
- Motion direction
- Brand guidelines
- Tone of voice
- Existing website
- Existing app
- Existing marketing site

---

## 2.3 How should the interface feel?

**Type:** Pick up to 4

- Minimal
- Dense
- Spacious
- Quiet
- Bold
- Friendly
- Serious
- Technical
- Premium
- Playful
- Editorial
- Utilitarian
- Soft
- Sharp
- Expressive
- Restrained

**Other:** free text

These answers influence foundation values and visual direction, not the system architecture.

---

## 2.4 Which visual modes or themes are required?

**Type:** Multi-select

- Light
- Dark
- High contrast
- Multiple brands
- User-selectable themes
- Product-specific themes
- White-label themes
- No additional modes

### Conditional behavior

If **Multiple brands** or **White-label themes** is selected, the token architecture must support brand-level mode switching from the beginning.

---

# 3. EXISTING DESIGN SYSTEM

## 3.1 What already exists?

**Type:** Multi-select

### Foundations

- Color variables
- Typography styles
- Spacing tokens
- Sizing tokens
- Radius tokens
- Border tokens
- Shadow / elevation styles
- Focus styles
- Grid / layout tokens
- Breakpoints
- Motion tokens
- Icons
- Brand assets
- Accessibility rules

### Components

- Buttons
- Button groups
- Links
- Checkboxes
- Radios
- Switches
- Form fields
- Text inputs
- Textareas
- Selects
- Comboboxes
- Search inputs
- Verification inputs
- File upload
- Menus / dropdowns
- Sliders
- Tabs
- Segmented controls
- Badges
- Avatars
- Tooltips
- Dividers
- Breadcrumbs
- Pagination
- Progress
- Spinners
- Skeletons
- Alerts
- Toasts

### Infrastructure

- Existing Figma library
- Existing coded component library
- Storybook
- Existing token files
- Existing design-system documentation
- Existing accessibility documentation
- Existing naming conventions

---

## 3.2 What should happen to the existing system?

**Type:** Single select

- Preserve and extend
- Audit first, then decide
- Keep foundations, rebuild components
- Keep components, rebuild foundations
- Rebuild inconsistent parts only
- Replace the current system
- Not sure

---

## 3.3 For each existing item, choose an action

**Type:** Per-item selector

Available actions:

- Keep
- Audit
- Improve
- Refactor
- Rebuild
- Replace
- Skip

### Example

```text
Color          Existing → Keep
Typography     Existing → Audit
Spacing        Missing  → Build
Button         Existing → Refactor
Text Input     Missing  → Build
Toast          Missing  → Skip
```

This prevents the generator from rebuilding things that are already valid.

---

# 4. BUILD SCOPE

## 4.1 What should this design-system run produce?

**Type:** Multi-select

- Foundations only
- Components only
- Foundations + components
- Add missing foundations
- Add missing components
- Standardize existing components
- Refactor existing tokens
- Add Light / Dark modes
- Add multi-brand support
- Add documentation
- Add accessibility specifications
- Add QA matrices
- Add responsive rules
- Complete design-system rebuild

---

## 4.2 How should scope be determined?

**Type:** Single select

- Build only what I select
- Detect missing pieces and recommend what to build
- Audit first, then ask me before building
- Complete the entire system
- Match the existing design system and fill only the gaps

**Recommended default for existing systems:**  
`Match the existing design system and fill only the gaps`

**Recommended default for new systems:**  
`Detect missing pieces and recommend what to build`

---

# 5. FOUNDATION SCOPE

## 5.1 Which foundation areas should be included?

**Type:** Multi-select

- Color
- Typography
- Spacing
- Sizing
- Radius
- Borders
- Elevation
- Focus
- Layout
- Grid
- Breakpoints
- Motion
- Iconography
- Imagery
- Brand assets
- Accessibility

For an existing system, each item should show:

```text
Existing → Keep / Audit / Improve / Rebuild
Missing  → Build / Skip
```

---

# 6. COMPONENT SCOPE

## 6.1 Actions

- Button
- Button Group
- Link

## 6.2 Selection controls

- Checkbox
- Radio
- Switch
- Slider

## 6.3 Forms

- Field
- Text Input
- Textarea
- Select
- Combobox
- Search Input
- Verification Input
- File Upload

## 6.4 Navigation

- Menu & Dropdown
- Tabs
- Segmented Control
- Breadcrumb
- Pagination

## 6.5 Identity & metadata

- Avatar
- Badge

## 6.6 Feedback

- Tooltip
- Progress
- Spinner
- Skeleton
- Alert
- Toast

## 6.7 Structure

- Divider

Each component should support:

```text
Existing → Keep / Audit / Improve / Refactor / Rebuild
Missing  → Build / Skip
```

---

# 7. TOKEN ARCHITECTURE

## 7.1 Which token architecture should be used?

**Type:** Single select

### Option A — Primitive → Semantic

```text
Primitive
↓
Semantic
```

Best for relatively small systems.

### Option B — Primitive → Semantic → Component

```text
Primitive
↓
Semantic
↓
Component
```

Best for medium-to-large systems where some components need specific overrides.

### Option C — Existing architecture

Inspect the current token structure and continue it.

### Option D — Custom

User provides the intended token hierarchy.

### Recommended default

`Primitive → Semantic → Component`

Component tokens should only be created when a shared semantic token is not specific enough.

---

# 8. TOKEN NAMING SYSTEM

## 8.1 Which established token naming system should we follow?

**Type:** Single select

The user is selecting an established ecosystem or convention, not just punctuation style.

---

## Option 1 — Keep Existing Naming

**Recommended when an existing design system already exists.**

Behavior:

1. inspect current Figma variables;
2. inspect token files if available;
3. identify naming patterns;
4. identify hierarchy;
5. identify scale naming;
6. continue the same convention.

Example:

```text
color.text.primary
space.200
radius.medium
```

or whatever the existing system already uses.

---

## Option 2 — Atlassian Design System style

Typical structure:

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

### Characteristics

- semantic-first;
- usage-driven;
- interaction state is part of the token name;
- numeric spacing scale;
- readable in both design and engineering contexts.

### Good fit

- product systems;
- semantic-heavy UI;
- teams that want strong usage meaning in token names.

---

## Option 3 — Tailwind CSS style

Typical structure:

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

### Characteristics

- utility-oriented;
- scale-driven;
- strong primitive vocabulary;
- familiar to frontend teams;
- maps naturally to Tailwind theme configuration.

### Good fit

- products already using Tailwind;
- engineering-led systems;
- teams that prefer primitive scales over semantic naming.

---

## Option 4 — Material Design 3 style

Typical structure:

```text
sys.color.primary
sys.color.on-primary
sys.color.primary-container
sys.color.on-primary-container
sys.color.surface

sys.shape.corner.full

sys.typescale.body-medium
sys.typescale.title-large
```

Component-level examples:

```text
filled-button.container.color
filled-button.label-text.color
checkbox.selected.container.color
slider.active-track.color
```

### Characteristics

- explicit system hierarchy;
- reference → system → component concept;
- highly structured;
- strongly suited to theming.

### Good fit

- large systems;
- multi-theme products;
- Android / Material ecosystems;
- systems that need clear component-token layers.

---

## Option 5 — Ant Design style

Typical structure:

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

### Characteristics

- compact camelCase names;
- Seed → Map → Alias → Component token model;
- concise;
- implementation-friendly.

### Good fit

- React products;
- enterprise systems;
- teams already familiar with Ant Design.

---

## Option 6 — Adobe Spectrum style

Typical structure:

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

### Characteristics

- descriptive;
- relatively flat;
- human-readable;
- context → unit → clarification structure.

### Good fit

- complex UI systems;
- teams that prefer explicit descriptive names;
- systems where readability is more important than short names.

---

## 8.2 Custom naming

If none of the presets fit:

- Custom naming convention
- Import naming convention from code
- Import naming convention from Figma
- Import naming convention from token JSON

---

# 9. TOKEN OUTPUT FORMAT

This is separate from naming-system selection.

## 9.1 Which output formats are required?

**Type:** Multi-select

- Figma Variables
- CSS custom properties
- Tailwind config
- JSON
- DTCG JSON
- JavaScript
- TypeScript
- Android
- iOS
- Other

The system may translate one naming system into platform-specific syntax without changing the underlying token taxonomy.

Example:

Design token:

```text
color.background.brand.hovered
```

CSS output:

```css
--color-background-brand-hovered
```

---

# 10. VISUAL SYSTEM PREFERENCES

## 10.1 Density

**Type:** Single select

- Compact
- Comfortable
- Spacious
- Multiple density modes
- Match existing product
- Not sure

---

## 10.2 Corner treatment

**Type:** Single select

- Sharp
- Slightly rounded
- Moderately rounded
- Highly rounded
- Pill-heavy
- Match existing brand
- Not sure

---

## 10.3 Elevation character

**Type:** Single select

- Flat
- Mostly borders
- Subtle shadows
- Moderate shadows
- Layered / expressive shadows
- Match existing product
- Not sure

---

## 10.4 Icon style

**Type:** Single select

- Use existing icon library
- Outline
- Filled
- Duotone
- Mixed by context
- Custom
- Not sure

If an existing icon library is selected, request its URL or source.

---

# 11. DOCUMENTATION DEPTH

## 11.1 What should be documented?

**Type:** Multi-select

- Anatomy
- Layer hierarchy
- Auto Layout
- Resizing
- Component properties
- Variants
- States
- Token bindings
- Accessibility
- Interaction
- Responsive behavior
- Content rules
- Edge cases
- Do / Don't
- QA matrices
- Developer notes

Recommended default:

`Select all`

---

# 12. FINAL REVIEW

Before generating anything, summarize the answers.

Example:

```text
PRODUCT
Existing responsive B2B web product

USERS
Operations teams
Primary tasks:
- manage inventory
- track shipments
- resolve exceptions

BRAND
Established

BRAND ASSETS
Logo          Available
Colors        Available
Typography    Available
Icons         Partial
Motion        Missing

MODES
Light + Dark

EXISTING DESIGN SYSTEM
Color         Keep
Typography    Audit
Spacing       Missing → Build
Radius        Existing → Keep
Button        Existing → Refactor
Text Input    Missing → Build
Toast         Missing → Build

BUILD SCOPE
Fill missing foundations and selected components

FOUNDATIONS
Spacing
Sizing
Elevation
Focus
Motion

COMPONENTS
Button
Field
Text Input
Select
Toast

TOKEN ARCHITECTURE
Primitive → Semantic → Component

TOKEN NAMING
Atlassian Design System style

OUTPUT
Figma Variables
CSS custom properties

DENSITY
Comfortable

RADIUS
Match existing brand

ELEVATION
Subtle

ICONOGRAPHY
Use existing icon library

DOCUMENTATION
Full component specification + QA matrices
```

---

# 13. CONFIRMATION

Present exactly two final actions:

## Confirm and generate

Generate the design-system structure using the answers above.

## Change answers

Return to the questionnaire without generating anything.

Do not begin generation until the user confirms.