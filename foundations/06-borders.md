# ↳ Borders


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.

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