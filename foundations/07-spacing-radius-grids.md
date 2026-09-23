# Spacing, Radius & Grids

This is one Foundation page containing five separate documentation frames.

# Canvas inventory

```text
x≈0        Spacing primitives       2528 × 3884
x≈2928     Radius                   2400 × 2450
x≈5728     Spacing                  2528 × 4856
x≈8656     Grid layouts             2400 × 7356
x≈11456    Long-form notes          1600 × 10752
```

# 1. Spacing primitives

Use a four-column table:
- Name
- Size (rem/base)
- Pixels
- Type/category

Observed numeric scale:

```text
0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24,
32, 40, 48, 56, 64, 80, 96, 120, 140, 160, 180, 192, 256,
320, 360, 400, 480
```

Observed pixel equivalents range from `0px` through `1920px` on a 16 px base.

The user may select a different primitive scale; preserve the table structure.

# 2. Semantic spacing

Required semantic names in the observed model:

```text
spacing-none
spacing-xxs
spacing-xs
spacing-sm
spacing-md
spacing-lg
spacing-xl
spacing-2xl
spacing-3xl
spacing-4xl
spacing-5xl
spacing-6xl
spacing-7xl
spacing-8xl
spacing-9xl
spacing-10xl
spacing-11xl
```

# 3. Widths

```text
width-xxs
width-xs
width-sm
width-md
width-lg
width-xl
width-2xl
width-3xl
width-4xl
width-5xl
width-6xl
```

# 4. Containers

Observed roles:

```text
container-padding-mobile
container-padding-desktop
container-max-width-desktop
```

# 5. Paragraph max-width

Observed role:

```text
paragraph-max-width
```

Default specimen width in the observed documentation is `720px`.

# 6. Radius

Observed semantic scale:

```text
radius-none
radius-xxs
radius-xs
radius-sm
radius-md
radius-lg
radius-xl
radius-2xl
radius-3xl
radius-4xl
radius-full
```

Observed pixel series:

```text
0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 9999
```

The brand may use different values, but preserve the named scale/table pattern.

# 7. Grid layouts

Required documentation examples:
- Desktop 1280 px
- Tablet 768 px
- Mobile 375 px
- Container grid layouts
- 12 columns (auto)
- 6 columns (auto)
- 5 columns (auto)
- 3 columns (auto)
- 2 columns (auto)

Show gutters, margins, container width, and column behavior visually.

# 8. Long-form documentation

Required outline:
- why a spacing system is necessary;
- problems with designing without a defined scale;
- 4 px soft-grid rationale;
- defining the spacing system;
- exceptions to the grid;
- best practices;
- paragraph max-width guidance;
- practical Figma nudge/grid configuration tips.
