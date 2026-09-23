# ↳ Elevation & Focus


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.


## Figma documentation layout

Document this Foundation using the complete documentation-frame system in `01-documentation-system.md`.

Use a `2848 px` overview frame when the topic is primarily visual/specimen-based, a `2528 px` specification frame when it is primarily variable/table-based, and an optional `1600 px` notes frame only when deeper guidance is genuinely useful.

Every major section starts with a `720 px` Design note followed by the relevant specimen/table after `64 px`.

Do not generate separate `Source`, `Matrices`, or `QA` utility boards as the primary presentation.

## Effect styles

Required effect styles:

```text
Elevation / 0
Elevation / 1
Elevation / 2
Elevation / 3
Elevation / 4

Focus / Default
Focus / Negative
```

### Scaffold shadow defaults

| Style | Shadow |
|---|---|
| Elevation / 0 | none |
| Elevation / 1 | 0 1 2 / 8% |
| Elevation / 2 | 0 2 6 / 10% |
| Elevation / 3 | 0 8 20 / 12% |
| Elevation / 4 | 0 16 32 / 16% |

Shadow character may be replaced by the brand.

## Focus style

Default construction:
- outer ring equivalent to 3 px visual thickness;
- color: `focus.ring`;
- 2 px separation from component edge when needed for contrast;
- must remain visible on canvas, raised, brand, negative, positive, and inverse surfaces.

## Rules

- focus is documented separately from hover;
- keyboard focus must not depend only on color change;
- do not encode focus with a detached annotation layer inside the component.