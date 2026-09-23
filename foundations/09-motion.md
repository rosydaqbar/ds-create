# ↳ Motion


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.


## Figma documentation layout

Document this Foundation using the complete documentation-frame system in `01-documentation-system.md`.

Use a `2848 px` overview frame when the topic is primarily visual/specimen-based, a `2528 px` specification frame when it is primarily variable/table-based, and an optional `1600 px` notes frame only when deeper guidance is genuinely useful.

Every major section starts with a `720 px` Design note followed by the relevant specimen/table after `64 px`.

Do not generate separate `Source`, `Matrices`, or `QA` utility boards as the primary presentation.

## Duration tokens

```text
motion.duration.instant = 0
motion.duration.fast = 100ms
motion.duration.normal = 160ms
motion.duration.slow = 240ms
motion.duration.deliberate = 320ms
```

## Easing tokens

```text
motion.easing.standard
motion.easing.enter
motion.easing.exit
motion.easing.emphasized
```

Scaffold cubic-bezier values:

```text
standard   = cubic-bezier(.2, 0, 0, 1)
enter      = cubic-bezier(0, 0, 0, 1)
exit       = cubic-bezier(.3, 0, 1, 1)
emphasized = cubic-bezier(.2, .8, .2, 1)
```

## Base-component motion rules

- hover color changes: fast;
- pressed feedback: fast;
- switch thumb movement: normal;
- menu/tooltip appearance: normal;
- loading spinner: continuous linear;
- skeleton shimmer, if used: slow repeating and disabled under reduced motion.

## Reduced motion

Every animated component file states its reduced-motion behavior.