# Misc Icons

This Figma Page groups non-core icon assets into separate horizontal zones. Do not merge them into the main Icons Figma Page.

# Required families

## Featured icon

Observed properties:
- Size: sm / md / lg / xl
- Color: Brand / Gray / Error / Warning / Success
- Type: Light / Gradient / Dark / Modern / Modern neue
- Icon swap
- Gradient mask boolean

## Featured icon outline

- Size: sm / md / lg / xl
- Color: Brand / Gray / Error / Warning / Success
- Icon swap

## Check icon

- Type: Default / Line / Filled
- Size: xs / sm / md / lg
- Color: Brand / Gray / Success

## Check item text

- Type: Default / Line / Filled
- Size: sm / md / lg
- Color: Brand / Success
- Breakpoint: Desktop / Mobile

## Star icon

- Fill: 0% through 100% in 10% steps
- Color: Yellow / Gray

## Dot

- Size: sm / md / lg
- Outline: False / True

## Emoji

Use a controlled enumerated set supplied by the project.

## Social icon

Observed properties:
- Platform
- Grayscale: False / True
- State: Default / Hover

## Integration icon

Observed properties:
- Integration
- Grayscale: False / True

## Cursor

Expose a controlled `Type` axis covering the pointer/cursor states required by the target platform.

## Country flag icons

Present as a dedicated asset grid. Use only required/supplied flags.

## Payment method icon

Observed properties:
- Size: sm / md
- Payment method

## App icons

Present as a dedicated grid of approved app/product icons.

## File type icon

Observed properties:
- File type
- Type: Default / Gray / Solid

## Folder icon

Observed properties:
- Type: Brand / Gray / Noise / Transparent
- Open: True / False
- optional paper layer boolean

## Ratings badge

Standalone helper component where needed.

# Canvas rhythm

Use repeated ~the system-defined value header zones arranged horizontally. Each family should be positioned beneath its corresponding header, not inside a generic vertical card stack.

# Documentation

Every Misc Icons Figma Page must include a visible documentation region describing which asset families are actually in scope and why.

The notes must explain:
- which families are included versus intentionally skipped;
- intended use for featured icons, checks, dots, emoji, social icons, cursors, flags, and any additional generated family;
- accessibility/non-color meaning requirements;
- asset-source/licensing constraints for third-party marks;
- when to add a new family instead of generating unused library weight;
- product-specific examples where useful.

QA: a collection of asset grids without this explanatory documentation is incomplete.
