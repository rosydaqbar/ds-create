# ❖ COMPONENTS

The Components parent page indexes the base-component library and defines the shared build/documentation contract.

# 1. Component page presentation

Every component child page uses the finished documentation-page system from `01-documentation-system.md`.

Do not create visible top-level boards named `Source`, `Matrices`, `QA`, or `Internals` as the main presentation.

Default component documentation frame:

```text
Width: 2528
Layout: Vertical Auto Layout
Background: white

<Component>
├─ Design system header
├─ Section
│  ├─ Overview
│  ├─ Anatomy
│  ├─ Sizes
│  ├─ Variants / emphasis
│  ├─ States
│  ├─ Properties
│  ├─ Token bindings
│  ├─ Behavior and content
│  ├─ Accessibility
│  └─ QA / edge cases
└─ Design system footer
```

Each major section begins with a `720 px` Design note and shows specimens, tables, or diagrams after `64 px`.

Dense matrices use the full `2368 px` section content width.

Published component masters may sit below the documentation frame with `240 px` canvas separation.

Private construction components sit below the masters with `160 px` separation and `_` prefixes.

# 2. Required component specification

A component is not ready until its Markdown file defines:

1. published asset names;
2. exact master layer tree;
3. exact Auto Layout and resizing behavior;
4. public component properties;
5. size specification;
6. state specification;
7. layer-by-layer token mapping;
8. interaction behavior;
9. content rules;
10. accessibility behavior;
11. documentation sections and matrices;
12. QA / stress cases;
13. prohibited combinations.

# 3. Shared size defaults

Unless a component file overrides them:

```text
SM control height = 32
MD control height = 40
LG control height = 48
```

# 4. Shared text defaults

```text
SM controls → Label / SM or Body / SM / Medium
MD controls → Label / MD
LG controls → Body / MD / Medium
```

Individual component files state the exact style.

# 5. Initiator integration

For every component resolve:

```text
Existing → Keep / Audit / Improve / Refactor / Rebuild / Replace
Missing  → Build / Skip
```

A component specification is normative only when the component is in scope for creation or change.

Do not build a component merely because a Markdown specification exists.