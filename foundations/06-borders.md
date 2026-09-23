# ↳ Borders


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.


## Figma documentation layout

Document this Foundation using the complete documentation-frame system in `01-documentation-system.md`.

Use a `2848 px` overview frame when the topic is primarily visual/specimen-based, a `2528 px` specification frame when it is primarily variable/table-based, and an optional `1600 px` notes frame only when deeper guidance is genuinely useful.

Every major section starts with a `720 px` Design note followed by the relevant specimen/table after `64 px`.

Do not generate separate `Source`, `Matrices`, or `QA` utility boards as the primary presentation.

## Width tokens

```text
border.width.0 = 0
border.width.1 = 1
border.width.2 = 2
```

## Semantic roles

```text
border.component.default
border.component.strong
border.component.focus
border.component.error
border.component.disabled
```

Color comes from semantic color variables.

## Rules

- controls use inside stroke;
- default control border is 1 px;
- focus is not communicated by increasing normal border width unless the component explicitly defines it;
- separators use semantic subtle border;
- selected segmented surfaces may use either border or fill, but the decision is tokenized.