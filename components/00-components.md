# ❖ COMPONENTS

The Components parent page indexes all base components and defines the build contract shared by them.

## Child pages

Each child component receives exactly one Markdown specification file and one Figma page.

## Required Figma page zones

```text
00 — Documentation
10 — Source
20 — Matrices
30 — QA
90 — Internals
```

`90 — Internals` may be omitted when the component has no private construction components.

## Completion rule

A component is not ready to publish unless its specification contains:

1. published asset names;
2. exact master layer tree;
3. exact Auto Layout and resizing behavior;
4. exact public component properties;
5. size table;
6. state model;
7. layer-by-layer token mapping;
8. interaction rules;
9. content rules;
10. accessibility rules;
11. required matrix definitions;
12. QA specimens;
13. prohibited combinations.

## Shared size defaults

Unless a component file overrides them:

```text
SM control height = 32
MD control height = 40
LG control height = 48
```

## Shared text defaults

- SM controls → `Label / SM` or `Body / SM / Medium`
- MD controls → `Label / MD`
- LG controls → `Body / MD / Medium`

Component files specify the exact style.


## Initiator integration

The component catalog is not a mandatory build list.

For every component, resolve:

```text
Existing → Keep / Audit / Improve / Refactor / Rebuild / Replace
Missing  → Build / Skip
```

A Component Markdown file is the normative construction spec **only when that component is in scope for creation or change**.

### Existing component behavior

- `Keep` → use existing master unchanged.
- `Audit` → compare it against this package without mutating first.
- `Improve` → fix targeted gaps while preserving its public API.
- `Refactor` → internal structure may change; preserve intended behavior.
- `Rebuild` → reconstruct using the component spec.
- `Replace` → create replacement, then archive superseded master after migration.
- `Build` → create missing master.
- `Skip` → no page/master/placeholder is created.

### Product filtering

Product/platform answers decide which supported components are relevant.

Do not build a component merely because a Markdown specification exists.