# Design System Initiator Questionnaire

The questionnaire decides what gets preserved, audited, generated, or rebuilt.

# 1. Product

## Product status

**Single select**
- Existing product
- New product
- Multiple products under one brand
- Brand-wide system
- Internal tool
- Design-system-only project
- Other

## Product information

Ask for:
- product name;
- one-sentence product description;
- product URL;
- Figma product URL;
- existing design-system/library URL;
- existing code/component-library URL.

## Primary users and tasks

Ask:
- who primarily uses the product;
- their main tasks;
- important accessibility or localization requirements.

## Platforms

**Multi-select**
- Responsive web
- Desktop web
- Mobile web
- iOS
- Android
- Tablet
- Desktop app
- Other

# 2. Brand

## Brand maturity

- Established
- Partially established
- New
- No brand layer required
- Not sure

## Existing brand inputs

For each, select `Available`, `Partial`, `Missing`, or `Not needed`:
- logo;
- brand colors;
- neutral palette;
- typography;
- iconography;
- illustration;
- photography;
- motion;
- brand guidelines;
- tone of voice.

## Interface character

Pick up to four:
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

## Modes

- Light
- Dark
- High contrast
- Multiple brands
- White-label themes
- User-selectable themes
- Product-specific themes

# 3. Existing system inventory

## Foundations

For each Figma Page, mark `Existing`, `Partial`, `Missing`, or `Not needed`:

```text
Colors
Typography
Logos
Icons
Misc icons
Effect styles
Spacing, radius & grids
```

## Base Component Figma Pages

```text
Avatars
Badges
Button groups
Buttons
Checkboxes
Dropdowns
Inputs
Progress indicators
Radio groups
Select
Sliders
Tags
Text editors
Toggles
Tooltips
Video players
```

For any existing Figma Page, allow a second-level inventory of the component sets inside that page.

# 4. Action per existing item

Each existing Figma Page/component family must resolve to one action:

- Keep
- Audit
- Improve
- Refactor
- Rebuild
- Replace
- Skip

Each missing Figma Page/component family resolves to:
- Build
- Skip

# 5. Build strategy

- Build only selected Figma Pages
- Audit first, then ask before changes
- Preserve existing Figma Pages and fill missing families
- Rebuild inconsistent parts only
- Complete Foundation + Base Component system

Default for existing systems: `Preserve existing Figma Pages and fill missing families`.

# 6. Foundation scope

Allow selection at Figma Page level, then Frame/region/component-family level.

## Colors

Optional sections:
- Base colors
- Brand palette
- Extended color palettes
- Gradients
- Color variables
- Color utility variables
- Long-form color guidance

## Typography

Optional sections:
- Typeface specimen
- Type scale
- Long-form typography guidance

## Logos

Optional sections:
- Product logomark/logo
- Partner/company logos
- Press/featured logos
- Logo usage guidance

## Icons

Optional sections:
- Main icon library
- Icon documentation/guidance

## Misc icons

Optional sections:
- Featured icons
- Check icons
- Social icons
- Integration icons
- Cursors
- Country flags
- Payment icons
- App icons
- File/folder icons
- Rating/star/dot/emoji helpers

## Effect styles

Optional sections:
- Shadows
- Focus rings
- Focus rings + shadows
- Skeuomorphic focus variants
- Backdrop blurs
- Long-form effects guidance

## Spacing, radius & grids

Optional sections:
- Spacing primitives
- Semantic spacing
- Widths
- Containers
- Paragraph max-width
- Radius
- Grid layouts
- Long-form spacing/grid guidance

# 7. Base Component scope

For each selected Figma Page, allow child-family selection.

Examples:

```text
Buttons
  Button
  Button destructive
  Button utility
  Button close X
  Button loading icon
  Social button
  Social button group
  Mobile app store badge

Inputs
  Input field
  Private input base
  Textarea input field
  Verification code input field
```

The complete child-family inventory is defined by the corresponding Markdown specification.

# 8. Token architecture

- Primitive → Semantic
- Primitive → Semantic → Component
- Match existing
- Custom

# 9. Token naming preset

- Keep existing naming
- Atlassian-style semantic naming
- Tailwind-style scale naming
- Material-style system/component hierarchy
- Ant-style alias naming
- Spectrum-style descriptive naming
- Custom

If the user supplies an existing library, default to `Keep existing naming`.

# 10. Documentation depth

The **top-level composition on the Figma Page canvas is fixed**. This selector only controls optional explanatory depth.

Selectable extras:
- Long-form guidance
- Resource links
- Accessibility callouts
- Do / Don't examples
- Developer notes
- QA notes

Do not remove required region/header Instances, Design notes, variable Usage columns, or component matrices.

# 11. Confirmation summary

Before generation, present:
- product/brand summary;
- platforms/modes;
- existing-page actions;
- selected Foundation Figma Pages/Frames/regions;
- selected Base Component Figma Pages/families;
- token architecture;
- token naming preset;
- output formats;
- optional documentation depth.

Final actions:
- **Confirm and generate**
- **Change answers**
