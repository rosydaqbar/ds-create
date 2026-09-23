# ↳ Radius


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.

## Tokens

```text
radius.0    = 0
radius.1    = 4
radius.2    = 6
radius.3    = 8
radius.4    = 12
radius.5    = 16
radius.full = 999
```

## Semantic mappings

```text
radius.control       → configurable default, scaffold radius.3
radius.container     → configurable default, scaffold radius.4
radius.compact       → configurable default, scaffold radius.2
radius.round         → radius.full
```

The brand changes the semantic mapping, not each component individually.

## Rules

- all four corners bind to the same token unless component anatomy requires otherwise;
- attached controls may zero only the touching corners;
- pill components use `radius.full`;
- do not use visual masks to fake radius.