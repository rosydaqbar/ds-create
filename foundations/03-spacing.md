# ↳ Spacing


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.

## Primitive scale

Collection: `Foundation / Space`

```text
space.0  = 0
space.1  = 2
space.2  = 4
space.3  = 6
space.4  = 8
space.5  = 12
space.6  = 16
space.7  = 20
space.8  = 24
space.9  = 32
space.10 = 40
space.11 = 48
space.12 = 64
space.13 = 80
space.14 = 96
```

## Rules

- component padding uses only spacing tokens;
- component gaps use only spacing tokens;
- do not encode spacing in frame position;
- repeated relationships use Auto Layout;
- a component-specific spacing alias may exist only when changing the shared spacing token would affect unrelated components.

## Documentation specimens

Show each token as:
- name;
- resolved px;
- horizontal bar;
- common usage examples.

Required comparison:
- 2 vs 4;
- 4 vs 8;
- 8 vs 12;
- 12 vs 16;
- 16 vs 24;
- 24 vs 32.