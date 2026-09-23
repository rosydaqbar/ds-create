# ↳ Sizing


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.

## Primitive sizing tokens

Collection: `Foundation / Size`

```text
size.icon.12 = 12
size.icon.16 = 16
size.icon.20 = 20
size.icon.24 = 24
size.icon.32 = 32

size.control.24 = 24
size.control.32 = 32
size.control.36 = 36
size.control.40 = 40
size.control.44 = 44
size.control.48 = 48
size.control.56 = 56

size.avatar.24 = 24
size.avatar.32 = 32
size.avatar.40 = 40
size.avatar.48 = 48
size.avatar.64 = 64
```

## Rules

Component specifications map named sizes to these tokens.

Example:

```text
Button SM → size.control.32
Button MD → size.control.40
Button LG → size.control.48
```

Do not use the size token name as the public Figma variant name.

## Documentation

Show:
- icon sizes;
- control heights;
- avatar sizes;
- touch-target overlays;
- size-comparison row.