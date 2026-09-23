# Brand-Agnostic Design System Initiator

This repository is **not executable from root files alone**.

Root files define global behavior. Actual Foundation and Base Component implementation requirements live in their folder specifications and **must be loaded before implementation**.

## Root files

```text
README.md
SYSTEM.md
INITIATOR.md
```

## Mandatory implementation loading

### Always load

Before any implementation or modification:

```text
README.md
SYSTEM.md
INITIATOR.md
```

`INITIATOR.md` includes the generation decision logic. Do not skip it during generation.

### Guidance

If Getting started is in scope, also load:

```text
guidance/01-getting-started.md
```

If Variables is in scope, also load:

```text
guidance/02-variables.md
```

### Foundations

If **any Foundation Figma Page** is in scope, first load:

```text
foundations/00-foundations.md
```

Then load every selected Foundation Page specification:

```text
↳ Colors                    → foundations/01-colors.md
↳ Typography                → foundations/02-typography.md
↳ Logos                     → foundations/03-logos.md
↳ Icons                     → foundations/04-icons.md
↳ Misc icons                → foundations/05-misc-icons.md
↳ Effect styles             → foundations/06-effect-styles.md
↳ Spacing, radius & grids   → foundations/07-spacing-radius-grids.md
```

### Base Components

If **any Base Component Figma Page** is in scope, first load:

```text
base-components/00-base-components.md
```

Then load every selected Base Component Page specification:

```text
↳ Avatars               → base-components/01-avatars.md
↳ Badges                → base-components/02-badges.md
↳ Button groups         → base-components/03-button-groups.md
↳ Buttons               → base-components/04-buttons.md
↳ Checkboxes            → base-components/05-checkboxes.md
↳ Dropdowns             → base-components/06-dropdowns.md
↳ Inputs                → base-components/07-inputs.md
↳ Progress indicators   → base-components/08-progress-indicators.md
↳ Radio groups          → base-components/09-radio-groups.md
↳ Select                → base-components/10-select.md
↳ Sliders               → base-components/11-sliders.md
↳ Tags                  → base-components/12-tags.md
↳ Text editors          → base-components/13-text-editors.md
↳ Toggles               → base-components/14-toggles.md
↳ Tooltips              → base-components/15-tooltips.md
↳ Video players         → base-components/16-video-players.md
```

## Hard loading rule

Implementation must **stop before editing Figma** if the required folder-level specification or selected Page specification has not been loaded.

These are invalid implementation states:

```text
README + SYSTEM only
README + SYSTEM + INITIATOR only
Root files + no selected Foundation specs
Root files + no selected Base Component specs
Selected Buttons + no base-components/00-base-components.md
Selected Buttons + no base-components/04-buttons.md
Selected Colors + no foundations/00-foundations.md
Selected Colors + no foundations/01-colors.md
```

Do not infer Page requirements from `SYSTEM.md`.

`SYSTEM.md` provides global grammar only. It does **not** replace:
- `guidance/*.md`;
- `foundations/*.md`;
- `base-components/*.md`.

## Implementation checklist

Before generating, create a loaded-spec checklist:

```text
Global
[ ] README.md
[ ] SYSTEM.md
[ ] INITIATOR.md

Guidance
[ ] every selected guidance spec loaded

Foundations
[ ] foundations/00-foundations.md when any Foundation is selected
[ ] every selected Foundation Page spec loaded

Base Components
[ ] base-components/00-base-components.md when any Base Component is selected
[ ] every selected Base Component Page spec loaded
```

Do not begin implementation until every applicable checkbox is complete.

## Non-negotiable

- Preserve the exact Figma Page hierarchy defined in `SYSTEM.md`.
- Never merge required Figma Pages into one Page.
- Never drop approved Notes & Documentation, diagrams, examples, matrices, anatomy, or QA.
- Page-specific requirements come from their folder specifications, not from root-file summaries.
- A local fix does not cancel unrelated approved requirements.
