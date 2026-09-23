# ↳ Accessibility


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.


## Figma documentation layout

Document this Foundation using the complete documentation-frame system in `01-documentation-system.md`.

Use a `2848 px` overview frame when the topic is primarily visual/specimen-based, a `2528 px` specification frame when it is primarily variable/table-based, and an optional `1600 px` notes frame only when deeper guidance is genuinely useful.

Every major section starts with a `720 px` Design note followed by the relevant specimen/table after `64 px`.

Do not generate separate `Source`, `Matrices`, or `QA` utility boards as the primary presentation.

## Component-level baseline

Every interactive component specification must document:

- keyboard interaction;
- visible focus;
- disabled semantics;
- accessible name requirement;
- selected/checked/expanded state when applicable;
- error association for fields;
- minimum target strategy;
- contrast expectations;
- reduced-motion behavior where animated.

## Target strategy

Preferred minimum interactive target:
`44 × 44`.

A visual control may be smaller when implementation can provide a larger invisible hit area without overlap.

## Text scaling

QA at:
- 100%;
- 200%.

Do not clip labels or messages at 200%.

## Color

Do not rely on color alone for:
- errors;
- success;
- selection;
- required state;
- focus.

## RTL

Components with direction-sensitive layout must have an RTL specimen.

## Documentation

The Accessibility page includes:
- keyboard legend;
- focus examples;
- target overlays;
- contrast examples;
- field error association diagram;
- RTL examples.