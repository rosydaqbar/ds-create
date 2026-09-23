# ↳ Layout, Grid & Breakpoints


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.


## Figma documentation layout

Document this Foundation using the complete documentation-frame system in `01-documentation-system.md`.

Use a `2848 px` overview frame when the topic is primarily visual/specimen-based, a `2528 px` specification frame when it is primarily variable/table-based, and an optional `1600 px` notes frame only when deeper guidance is genuinely useful.

Every major section starts with a `720 px` Design note followed by the relevant specimen/table after `64 px`.

Do not generate separate `Source`, `Matrices`, or `QA` utility boards as the primary presentation.

## Container tokens

```text
container.content.sm = 640
container.content.md = 960
container.content.lg = 1200
container.content.xl = 1440
container.gutter.mobile = 16
container.gutter.tablet = 24
container.gutter.desktop = 32
```

## Breakpoints

Scaffold defaults:

```text
breakpoint.sm = 480
breakpoint.md = 768
breakpoint.lg = 1024
breakpoint.xl = 1280
breakpoint.2xl = 1440
```

Brands/products may override breakpoint values according to product requirements.

## Grid specimens

Document:
- 4-column mobile grid;
- 8-column tablet grid;
- 12-column desktop grid;
- full-width container;
- constrained reading container.

## Component rule

Base components should normally be intrinsically sized and not contain breakpoint logic.

Responsive behavior belongs to composition unless a component file explicitly declares otherwise.