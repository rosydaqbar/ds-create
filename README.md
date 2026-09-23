# Brand-Agnostic Design System Initiator

The root runtime is intentionally limited to three files:

```text
README.md
SYSTEM.md
INITIATOR.md
```

Page-specific requirements remain under:

```text
guidance/
foundations/
base-components/
```

## Loading contract

### Initiation
Read:
- `README.md`
- `INITIATOR.md`

Read the relevant token/naming section of `SYSTEM.md` only when needed to resolve token choices.

### Generation or modification
Use the confirmed initiator answers, then read:
- `README.md`
- `SYSTEM.md`
- only the in-scope page-specific Markdown specifications

Do not reread the questionnaire after its answers are confirmed unless the scope changes.

## Canonical ownership

- `SYSTEM.md` owns Figma Page hierarchy, Figma terminology, documentation/layout behavior, visual documentation rules, variable tables, tokens, collection naming, token naming, and audit routing.
- `INITIATOR.md` owns questions, scope resolution, actions, generation flow, and completion logic.
- `guidance/`, `foundations/`, and `base-components/` own their full page-specific anatomy, matrices, Notes & Documentation, examples, and QA.

## Non-negotiable

- Preserve the exact Figma Page hierarchy defined in `SYSTEM.md`.
- Never merge required Figma Pages into one Page.
- Never drop approved Notes & Documentation, diagrams, examples, matrices, anatomy, or QA.
- A local fix does not cancel unrelated approved requirements.
- Consolidation must not remove unique rules.
