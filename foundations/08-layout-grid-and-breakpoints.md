# ↳ Layout, Grid & Breakpoints


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.

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