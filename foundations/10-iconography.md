# ↳ Iconography


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.


## Figma documentation layout

Document this Foundation using the complete documentation-frame system in `01-documentation-system.md`.

Use a `2848 px` overview frame when the topic is primarily visual/specimen-based, a `2528 px` specification frame when it is primarily variable/table-based, and an optional `1600 px` notes frame only when deeper guidance is genuinely useful.

Every major section starts with a `720 px` Design note followed by the relevant specimen/table after `64 px`.

Do not generate separate `Source`, `Matrices`, or `QA` utility boards as the primary presentation.

## Source size

Canonical drawing frame: `24 × 24`.

## Exported sizes

```text
12, 16, 20, 24, 32
```

Components use instances scaled through defined icon variants or tokenized size frames, not arbitrary free scaling.

## Icon layer rules

```text
Icon / <Name>
└─ Vector
```

Prefer one flattened vector path when practical.

## Brand-configurable characteristics

- stroke vs filled family;
- stroke weight;
- corner treatment;
- optical density.

## Structural rules

- icons must remain recognizable at 16 px;
- icon-only actions require accessible labels in implementation;
- decorative icons are hidden from assistive technology in implementation;
- direction-sensitive icons have RTL behavior documented.